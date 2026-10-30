// pre-push gate: runs the test suites a push can affect and blocks the push on any failure.
// Wired via .githooks/pre-push (core.hooksPath .githooks). See Treasuries/CLAUDE.md.
//
// Standing rule (2026-07-25, after the runFundedRebalance self-financing-scale regression shipped
// unnoticed for 9 days): a red test is never "probably non-critical" -- it gets fixed (the code, or
// the test's own expectation, with a reason) before anything leaves this machine. No allowlist, no
// env-var skip. The only override is git's native `--no-verify`, which is always available outside
// this script's control and requires deliberately typing it every push.
//
// Runs only the suites the pushed changes can affect:
//   - a change inside an app's directory runs that app's own suites;
//   - a change to shared/src/<file> runs the Shared unit tests plus the suites of every app whose
//     code imports that file, directly or through another shared/src file (read from the import
//     statements at push time, not from a hand-kept list);
//   - a change to shared/tests runs the Shared unit tests;
//   - a markdown file runs no app suite: under any knowledge/ directory it runs the viewer suite
//     (KnowledgeMap), and the Data Dictionary also runs TipsLadderManager's unit suite, which reads
//     LOWER_COVER_YIELD from it;
//   - a change to the test wiring itself (package.json, playwright.config.js, this script, the
//     hook) runs every suite;
//   - a code file (.js, .mjs, .cjs, .html) changed only in comments runs nothing: the old and new
//     text are compared with comments removed (.html: every changed line is wholly a comment).
// So a Primer-only push runs nothing, and a YieldsMonitor-only push never pays for
// TipsLadderManager's suites.

import { execFileSync, spawn } from 'child_process';
import { readFileSync, appendFileSync } from 'fs';
import path from 'path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel']).toString().trim();
const ZERO = '0000000000000000000000000000000000000000';

// A real test failure (a red assertion) exits with a small code, almost always 1. Two other cases
// get a single retry instead of an immediate block, because neither is the kind of "probably
// non-critical" regression the no-override rule (2026-07-25) exists to stop -- both are caused by
// the machine, not the code:
//   - a process-level crash: Playwright's Chromium dying under Windows with an OS exception code
//     like 3221226505 (0xC0000409) before any test even ran. Exit code is huge (>255) instead of 1.
//   - a load-induced timeout: the automated broker-download pipeline (Sheets write, git commit,
//     fixture regen, this very test run) runs several CPU-heavy steps back to back, and a test can
//     occasionally race its own timeout budget under that contention even though it's correct --
//     confirmed 2026-08-13 when a "failed" e2e test passed standalone in 474ms against a 4000ms
//     budget. Exit code is a normal 1, but Playwright's own output names it as a timeout.
// A genuine assertion failure (wrong value, wrong element state) is never retried or overridden.
// Both retry cases are logged so a recurring pattern is visible even though Windows isn't producing
// a crash dump for the crash case.
const CRASH_EXIT_THRESHOLD = 255;
const TIMEOUT_PATTERN = /(test timeout of \d+ms exceeded|timeout \d+ms exceeded)/i;
const CRASH_LOG = path.join(ROOT, '.git', 'pre-push-crash-log.txt');

function logRetry(dir, script, status, reason) {
  try { appendFileSync(CRASH_LOG, `${new Date().toISOString()} ${dir} "${script}" exit=${status} reason=${reason}\n`); } catch {}
}

// spawn (not spawnSync) so output can be mirrored live to the console AND captured for the
// timeout-signature check above -- spawnSync with stdio:'inherit' streams live but can't be
// inspected; with stdio:'pipe' it can be inspected but only prints after the process exits.
function runNpmScript(cwd, script) {
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', script], { cwd, shell: true });
    let output = '';
    child.stdout.on('data', (d) => { process.stdout.write(d); output += d; });
    child.stderr.on('data', (d) => { process.stderr.write(d); output += d; });
    child.on('close', (status) => resolve({ status, output }));
  });
}

// Every suite this hook knows how to run: the root package.json script, and the top-level
// directory whose changes it covers.
const SUITES = [
  { script: 'test:Unit:TipsLadderManager', dir: 'TipsLadderManager' },
  { script: 'test:UI:TipsLadderManager', dir: 'TipsLadderManager' },
  { script: 'test:UI:YieldCurves', dir: 'YieldCurves' },
  { script: 'test:UI:TreasuryAuctions', dir: 'TreasuryAuctions' },
  { script: 'test:Unit:YieldsMonitor', dir: 'YieldsMonitor' },
  { script: 'test:UI:YieldsMonitor', dir: 'YieldsMonitor' },
  { script: 'test:UI:KnowledgeMap', dir: 'knowledge' },
  { script: 'test:Unit:Shared', dir: 'shared' },
  { script: 'test:Unit:CpiExplorer', dir: 'CpiExplorer' },
];
const TEST_WIRING = new Set(['package.json', 'playwright.config.js', 'scripts/pre-push-tests.js', '.githooks/pre-push']);

// The sample files a Schwab positions or DARA plan download rewrites. A push changing only these
// runs the TipsLadderManager unit suite and the UI tests tagged @SampleHoldings, not the whole UI
// suite: no other test result depends on what the sample account holds.
const SAMPLE_FILES = new Set(['TipsLadderManager/data/SampleHoldings.csv', 'TipsLadderManager/data/SampleDaraPlan.csv']);
const SAMPLE_SUITES = [
  { script: 'test:Unit:TipsLadderManager', dir: 'TipsLadderManager' },
  { script: 'test:UI:TipsLadderManager:SampleHoldings', dir: 'TipsLadderManager' },
];
const CODE_FILE = /\.(m?js|cjs|html)$/;

function changedFiles(range) {
  const out = execFileSync('git', ['diff', '--name-only', ...range], { cwd: ROOT }).toString();
  return out.split('\n').map(l => l.trim()).filter(Boolean);
}

// A code file whose change between two commits is only comments selects no suite. Failing safe (the
// suites run) is always acceptable; wrongly skipping is not, so every doubt answers "not comment-only".
const REGEX_AFTER_PUNCT = new Set([...'(,=:[!&|?{};+-*%<>~^']);
const REGEX_AFTER_WORD = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);

// The text of a .js/.mjs/.cjs file with its comments removed and code whitespace collapsed (a run
// with a newline becomes one newline, any other run one space; string, template and regex text is
// kept verbatim), or null when the scan cannot be sure: an unterminated string, comment, template
// or regex, a string or regex running past the end of its line.
function stripJsComments(src) {
  const s = src.replace(/\r\n?/g, '\n');
  const n = s.length;
  const isWord = (c) => /[A-Za-z0-9_$\u0080-\uffff]/.test(c);
  let out = '';
  let i = 0;
  let lastWasWs = false;
  let prev = { kind: 'start' };
  const exprDepth = []; // open brace count inside each template ${ } being scanned as code
  const emitWs = (w) => {
    if (lastWasWs) {
      if (w === '\n' && out.endsWith(' ')) out = out.slice(0, -1) + '\n';
      return;
    }
    out += w;
    lastWasWs = true;
  };
  const emit = (t) => { out += t; lastWasWs = false; };
  // From inside a template body: copies text up to the closing backtick (prev becomes a value) or
  // up to a ${ (code resumes). False at end of file.
  const templateBody = () => {
    while (i < n) {
      const c = s[i];
      if (c === '\\') { emit(s.slice(i, i + 2)); i += 2; continue; }
      if (c === '`') { emit(c); i++; prev = { kind: 'value' }; return true; }
      if (c === '$' && s[i + 1] === '{') { emit('${'); i += 2; exprDepth.push(0); prev = { kind: 'punct', ch: '{' }; return true; }
      emit(c); i++;
    }
    return false;
  };
  if (s.startsWith('#!')) { const e = s.indexOf('\n'); const j = e < 0 ? n : e; emit(s.slice(0, j)); i = j; }
  while (i < n) {
    const c = s[i];
    if (/\s/.test(c)) {
      let nl = false;
      while (i < n && /\s/.test(s[i])) { if (s[i] === '\n') nl = true; i++; }
      emitWs(nl ? '\n' : ' ');
      continue;
    }
    if (c === '/' && s[i + 1] === '/') {
      while (i < n && s[i] !== '\n') i++;
      emitWs(' ');
      continue;
    }
    if (c === '/' && s[i + 1] === '*') {
      const e = s.indexOf('*/', i + 2);
      if (e < 0) return null;
      emitWs(s.slice(i, e).includes('\n') ? '\n' : ' ');
      i = e + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      for (;;) {
        if (j >= n || s[j] === '\n') return null;
        if (s[j] === '\\') { j += 2; continue; }
        if (s[j] === c) break;
        j++;
      }
      emit(s.slice(i, j + 1));
      i = j + 1;
      prev = { kind: 'value' };
      continue;
    }
    if (c === '`') {
      emit(c); i++;
      if (!templateBody()) return null;
      continue;
    }
    if (c === '/') {
      const regexAllowed = prev.kind === 'start' || (prev.kind === 'punct' && REGEX_AFTER_PUNCT.has(prev.ch)) || (prev.kind === 'word' && REGEX_AFTER_WORD.has(prev.word));
      if (!regexAllowed) { emit(c); i++; prev = { kind: 'punct', ch: c }; continue; }
      let j = i + 1;
      let inClass = false;
      for (;;) {
        if (j >= n || s[j] === '\n') return null;
        if (s[j] === '\\') { j += 2; continue; }
        if (s[j] === '[') inClass = true;
        else if (s[j] === ']') inClass = false;
        else if (s[j] === '/' && !inClass) break;
        j++;
      }
      emit(s.slice(i, j + 1));
      i = j + 1;
      prev = { kind: 'value' };
      continue;
    }
    if (isWord(c)) {
      let j = i;
      while (j < n && isWord(s[j])) j++;
      emit(s.slice(i, j));
      prev = { kind: 'word', word: s.slice(i, j) };
      i = j;
      continue;
    }
    if (c === '{' && exprDepth.length) exprDepth[exprDepth.length - 1]++;
    if (c === '}' && exprDepth.length) {
      if (exprDepth[exprDepth.length - 1] === 0) {
        exprDepth.pop();
        emit(c); i++;
        if (!templateBody()) return null;
        continue;
      }
      exprDepth[exprDepth.length - 1]--;
    }
    emit(c); i++;
    prev = { kind: 'punct', ch: c };
  }
  return exprDepth.length ? null : out.trim();
}

// The nearest preceding lines starting with * are the body of a block comment only if they lead back
// to a line opening one (/* with no */ after it) without passing a line that closes one.
function inBlockComment(lines, idx) {
  for (let k = idx - 1; k >= 0; k--) {
    const t = lines[k].trim();
    if (t.startsWith('/*')) return !t.includes('*/');
    if (!/^\*(\s|$)/.test(t)) return false;
  }
  return false;
}

// Whether a trimmed line is wholly a comment, judged on the line alone except for the * body lines
// of a block comment, which look back through the lines of that same version of the file.
function isCommentLine(trimmed, lines, idx) {
  if (trimmed.startsWith('//')) return true;
  if (trimmed.startsWith('/*') && trimmed.endsWith('*/') && trimmed.indexOf('*/') === trimmed.length - 2) return true;
  if (trimmed.startsWith('<!--') && trimmed.endsWith('-->') && trimmed.indexOf('-->') === trimmed.length - 3) return true;
  return /^\*(\s|$)/.test(trimmed) && inBlockComment(lines, idx);
}

// A line-based test for .html, where apostrophes in prose would break a string scan: every added
// and removed line of the diff is wholly a comment.
function htmlCommentOnly(file, base, head, oldText, newText) {
  const diff = gitText(['diff', '-U0', '--no-color', '--no-ext-diff', base, head, '--', file]);
  const oldLines = oldText.replace(/\r\n?/g, '\n').split('\n');
  const newLines = newText.replace(/\r\n?/g, '\n').split('\n');
  let oldNo = 0;
  let newNo = 0;
  let started = false;
  for (const raw of diff.replace(/\r\n?/g, '\n').split('\n')) {
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw);
    if (hunk) { started = true; oldNo = Number(hunk[1]); newNo = Number(hunk[2]); continue; }
    if (!started || raw.startsWith('\\')) continue;
    if (raw.startsWith('-')) {
      if (!isCommentLine(raw.slice(1).trim(), oldLines, oldNo - 1)) return false;
      oldNo++;
    } else if (raw.startsWith('+')) {
      if (!isCommentLine(raw.slice(1).trim(), newLines, newNo - 1)) return false;
      newNo++;
    }
  }
  return true;
}

function gitText(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
}

// True when `file` differs between base and head only in comments. A file missing at either end
// (added or deleted), a test wiring or sample file, or any error answers false.
function commentOnlyChange(file, base, head) {
  if (!CODE_FILE.test(file) || TEST_WIRING.has(file) || SAMPLE_FILES.has(file)) return false;
  try {
    const oldText = gitText(['show', `${base}:${file}`]);
    const newText = gitText(['show', `${head}:${file}`]);
    if (/\.html$/.test(file)) return htmlCommentOnly(file, base, head, oldText, newText);
    const a = stripJsComments(oldText);
    const b = stripJsComments(newText);
    return a !== null && b !== null && a === b;
  } catch {
    return false;
  }
}

function trackedFiles(dir) {
  const out = execFileSync('git', ['ls-files', '--', dir], { cwd: ROOT }).toString();
  return out.split('\n').map(l => l.trim()).filter(l => CODE_FILE.test(l));
}

// The changed shared/src files plus every shared/src file that imports one of them, repeated until
// nothing new is added: a change to csv.js reaches every app that imports market-data.js.
function affectedSharedFiles(changed) {
  const affected = new Set(changed);
  const sharedSrc = trackedFiles('shared/src');
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of sharedSrc) {
      if (affected.has(f)) continue;
      const text = readFileSync(path.join(ROOT, f), 'utf8');
      for (const a of affected) {
        if (text.includes("'./" + path.posix.basename(a) + "'")) { affected.add(f); grew = true; break; }
      }
    }
  }
  return affected;
}

// Top-level directories whose code imports any of the given shared/src files.
function importingDirs(sharedFiles) {
  const dirs = new Set();
  for (const { dir } of SUITES) {
    if (dir === 'shared' || dirs.has(dir)) continue;
    for (const f of trackedFiles(dir)) {
      const text = readFileSync(path.join(ROOT, f), 'utf8');
      // 'shared/src/x.js' appears in every relative import of x.js, from any depth.
      if ([...sharedFiles].some(n => text.includes(n))) { dirs.add(dir); break; }
    }
  }
  return dirs;
}

// A markdown file is read by no app suite, so editing one never runs an app's suites. The viewer
// suite (the `knowledge` directory) renders the knowledge/ specs, so a markdown file under any
// knowledge/ directory runs it. DOC_READERS names the suites that read a particular markdown file's
// text: TipsLadderManager's unit suite reads LOWER_COVER_YIELD from the Data Dictionary.
const DOC_FILE = /\.md$/i;
const DOC_READERS = { 'knowledge/DATA_DICTIONARY.md': ['test:Unit:TipsLadderManager'] };

function suitesFor(files) {
  if (files.some(f => TEST_WIRING.has(f))) return SUITES;
  if (files.length && files.every(f => SAMPLE_FILES.has(f))) return SAMPLE_SUITES;
  const dirs = new Set();
  const scripts = new Set();
  const sharedSrc = [];
  for (const f of files) {
    if (DOC_FILE.test(f)) {
      if (/(^|\/)knowledge\//.test(f)) dirs.add('knowledge');
      for (const s of DOC_READERS[f] ?? []) scripts.add(s);
      continue;
    }
    const top = f.split('/')[0];
    if (f.startsWith('shared/src/')) sharedSrc.push(f);
    dirs.add(top);
  }
  if (sharedSrc.length) for (const d of importingDirs(affectedSharedFiles(sharedSrc))) dirs.add(d);
  return SUITES.filter(s => dirs.has(s.dir) || scripts.has(s.script));
}

function readStdin() {
  try { return readFileSync(0, 'utf8'); } catch { return ''; }
}

const stdinText = readStdin();
const lines = stdinText.split('\n').map(l => l.trim()).filter(Boolean);

let runAll = false;
const files = new Set();
if (process.argv.includes('--files')) {
  // File list on stdin instead of git's ref lines (see --list below). With --base <ref> and
  // --head <ref> as well, a code file changed only in comments between them is left out.
  const argAfter = (flag) => { const k = process.argv.indexOf(flag); return k >= 0 ? process.argv[k + 1] : undefined; };
  const base = argAfter('--base');
  const head = argAfter('--head');
  for (const f of lines) if (!(base && head && commentOnlyChange(f, base, head))) files.add(f);
} else if (lines.length === 0) {
  // No refs on stdin (unusual) -- be conservative and check everything with tests.
  runAll = true;
} else {
  for (const line of lines) {
    const [, localSha, , remoteSha] = line.split(' ');
    if (!localSha || localSha === ZERO) continue; // deleting a ref -- nothing to test
    if (!remoteSha || remoteSha === ZERO) {
      // Brand-new remote ref (first push of a new branch) -- no prior remote state to diff
      // against, so there's no sound way to scope this to "what's touched". Be conservative
      // and run every suite.
      runAll = true;
      continue;
    }
    try {
      for (const f of changedFiles([remoteSha, localSha])) if (!commentOnlyChange(f, remoteSha, localSha)) files.add(f);
    } catch {
      // Couldn't diff (e.g. remoteSha unknown locally) -- be conservative.
      runAll = true;
    }
  }
}

const toRun = runAll ? SUITES : suitesFor([...files]);
if (toRun.length === 0) {
  console.log('pre-push: no change a test suite covers, skipping.');
  process.exit(0);
}
console.log(`pre-push: running ${toRun.map(s => s.script).join(', ')}`);
// --list prints the selection and stops, to check it by hand:
//   git diff --name-only <from> <to> | node scripts/pre-push-tests.js --files --list [--base <from> --head <to>]
if (process.argv.includes('--list')) process.exit(0);

let failed = false;
for (const { dir, script } of toRun) {
  console.log(`\npre-push: npm run ${script}`);
  let res = await runNpmScript(ROOT, script);

  if (res.status !== 0) {
    const isCrash = res.status > CRASH_EXIT_THRESHOLD;
    const isTimeout = !isCrash && TIMEOUT_PATTERN.test(res.output);

    if (isCrash || isTimeout) {
      const reason = isCrash ? 'crash' : 'timeout';
      console.error(`pre-push: ${dir} "${script}" ${isCrash ? 'crashed' : 'timed out'} (exit ${res.status}, not an assertion failure) -- retrying once.`);
      logRetry(dir, script, res.status, reason);
      res = await runNpmScript(ROOT, script);
      if (res.status !== 0) logRetry(dir, script, res.status, `${reason}-retry-failed`);
    }
  }

  if (res.status !== 0) {
    console.error(`pre-push: ${dir} "${script}" FAILED.`);
    failed = true;
  }
}

if (failed) {
  console.error('\npre-push BLOCKED: fix the failing test (code or the test itself) before pushing.');
  console.error('Emergency override (use deliberately, not by default): git push --no-verify');
  process.exit(1);
}

console.log('\npre-push: all selected suites passed.');
process.exit(0);
