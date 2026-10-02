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
//   - a change to the test wiring itself (package.json, playwright.config.js, this script, the
//     hook) runs every suite.
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

function suitesFor(files) {
  if (files.some(f => TEST_WIRING.has(f))) return SUITES;
  if (files.length && files.every(f => SAMPLE_FILES.has(f))) return SAMPLE_SUITES;
  const dirs = new Set();
  const sharedSrc = [];
  for (const f of files) {
    const top = f.split('/')[0];
    if (f.startsWith('shared/src/')) sharedSrc.push(f);
    dirs.add(top);
  }
  if (sharedSrc.length) for (const d of importingDirs(affectedSharedFiles(sharedSrc))) dirs.add(d);
  return SUITES.filter(s => dirs.has(s.dir));
}

function readStdin() {
  try { return readFileSync(0, 'utf8'); } catch { return ''; }
}

const stdinText = readStdin();
const lines = stdinText.split('\n').map(l => l.trim()).filter(Boolean);

let runAll = false;
const files = new Set();
if (process.argv.includes('--files')) {
  // File list on stdin instead of git's ref lines (see --list below).
  for (const f of lines) files.add(f);
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
      for (const f of changedFiles([remoteSha, localSha])) files.add(f);
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
//   git diff --name-only <from> <to> | node scripts/pre-push-tests.js --files --list
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
