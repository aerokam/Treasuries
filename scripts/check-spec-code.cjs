#!/usr/bin/env node
// Checks that what a spec names in the code still exists.
//
//   node scripts/check-spec-code.cjs            report every stale reference
//   node scripts/check-spec-code.cjs --quiet    exit code only
//
// A spec that names a file or a function is what makes "specs drive code"
// checkable rather than aspirational, but the naming rots silently: rename a
// function and the spec still reads correctly. This finds those.
//
// Checked in both directions, which is what makes the mapping a mapping rather
// than a pair of hopes:
//   paths        `YieldCurves/src/app.js`  ->  the file must exist
//   identifiers  `calculateSAO`, `SAO_NOISE_YRS`  ->  the name must appear in source
//   units       `YieldCurves/src/app.js#parseFedInvestPrices`  ->  file and symbol
//   spec tags   `// spec: 3.1_Parse_Sources_And_Calculate_Yields.md#parse-bond-holidays` in source
//               ->  the spec and the anchor must exist
//
// Everything else in backticks is left alone: column headers, R2 keys, CSV
// field names and formula symbols are data, not code references.
//
// A spec whose status line reads Archived or Unbuilt is listed at the end of the
// report rather than resolved — see STATUS_RE below for the form and the reason.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const QUIET = process.argv.includes('--quiet');

const SKIP_DIR = /node_modules|\.git|\.chrome-profile|test-results|logs/;
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (SKIP_DIR.test(full)) continue;
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const all = walk(ROOT);
// Two documents are excluded, for what they are rather than for drift. The Data
// Dictionary's backticks are formula notation, so CPI_CAGR and FACP are terms it
// defines rather than names it expects to find in code. R2_Cleanup.md is a log of
// removals, where naming a file that no longer exists is what the entry records.
const EXCLUDE = /(DATA_DICTIONARY|R2_Cleanup)\.md$/;
const specs = all.filter(f => /\.md$/.test(f) && /(^|[\\/])knowledge[\\/]/.test(f.slice(ROOT.length)) && !EXCLUDE.test(f));
const sources = all.filter(f => /\.(js|mjs|cjs|ps1|cmd|html)$/.test(f));

// One index of every identifier defined or used anywhere in source.
const sourceText = new Map();
for (const f of sources) {
  try { sourceText.set(f, fs.readFileSync(f, 'utf8')); } catch { /* unreadable, skip */ }
}
const identifiers = new Set();
for (const text of sourceText.values()) {
  for (const m of text.matchAll(/\b[A-Za-z_$][A-Za-z0-9_$]{2,}\b/g)) identifiers.add(m[0]);
}

const PATH_RE = /^[A-Za-z0-9_.\-]+(?:\/[A-Za-z0-9_.\-]+)+\.(?:js|mjs|cjs|ps1|cmd|html)$/;
const FN_RE = /^[a-z_$][A-Za-z0-9_$]*$/;              // camelCase or _leading
const CONST_RE = /^[A-Z][A-Z0-9_]{3,}$/;              // SCREAMING_SNAKE

// Names owned by something outside the repository, which no repository file can be
// expected to contain. Each is listed one at a time, with its owner, so that adding
// one is a decision about that name rather than a category left open.
const EXTERNAL = new Map([
  ['EADDRINUSE', 'Node.js error code'],
  ['launchPersistentContext', 'Playwright API'],
]);

// A spec whose status line reads Archived or Unbuilt describes code that is not in
// the repository: Archived because it was built and then removed or superseded,
// Unbuilt because it has not been written yet. Naming what is absent is what those
// documents are for, so their code references are not resolved. The line is the
// first thing under the H1 and is written for the reader, in the form
//   *Status: Archived — the code was removed in <commit>; <where the live spec is>.*
// The state word is what this reads; the clause after it is prose.
const STATUS_RE = /^[\s*_]*Status:\s*\**\s*(Archived|Unbuilt)\b/i;
function declaredStatus(text) {
  const head = text.split(/\r?\n/).filter(l => l.trim()).slice(0, 3);
  for (const line of head) {
    const m = line.match(STATUS_RE);
    if (m) return m[1].toLowerCase();
  }
  return null;
}

const findings = [];
const exempt = [];
for (const spec of specs) {
  const rel = path.relative(ROOT, spec).replace(/\\/g, '/');
  const raw = fs.readFileSync(spec, 'utf8');
  const status = declaredStatus(raw);
  if (status) { exempt.push({ rel, status }); continue; }
  const lines = raw.split(/\r?\n/);
  let fenced = false;
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) { fenced = !fenced; return; }
    if (fenced) return;
    for (const m of line.matchAll(/`([^`]+)`/g)) {
      const tok = m[1].trim().replace(/\(\)$/, '');
      // `path/to/file.js#symbol` — the strongest form a spec can use, because it
      // names both the file and the unit inside it. Both halves are checked.
      const hash = tok.indexOf('#');
      if (hash > 0 && PATH_RE.test(tok.slice(0, hash))) {
        const file = tok.slice(0, hash), sym = tok.slice(hash + 1);
        const specDir = path.dirname(spec);
        const found = [ROOT, specDir, path.join(specDir, '..'), path.join(specDir, '..', '..')]
          .map(b => path.resolve(b, file)).find(p => fs.existsSync(p));
        if (!found) { findings.push({ rel, line: i + 1, tok, why: 'file does not exist' }); continue; }
        const text = sourceText.get(found) ?? (fs.existsSync(found) ? fs.readFileSync(found, 'utf8') : '');
        if (sym && !new RegExp('\\b' + sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(text)) {
          findings.push({ rel, line: i + 1, tok, why: `${file} does not define ${sym}` });
        }
        continue;
      }
      if (PATH_RE.test(tok)) {
        // A spec writes a path relative to its own app as often as to the repo
        // root, so a reference counts as resolved if any of those find it.
        const specDir = path.dirname(spec);
        const bases = [ROOT, specDir, path.join(specDir, '..'), path.join(specDir, '..', '..')];
        if (!bases.some(b => fs.existsSync(path.resolve(b, tok)))) {
          findings.push({ rel, line: i + 1, tok, why: 'file does not exist' });
        }
        continue;
      }
      if (/_[a-z0-9]$/i.test(tok)) continue;   // piPerBond_i is a subscript, not a name
      if (EXTERNAL.has(tok)) continue;
      const looksLikeCode = (FN_RE.test(tok) && /[a-z][A-Z]/.test(tok)) || CONST_RE.test(tok);
      if (looksLikeCode && !identifiers.has(tok)) {
        findings.push({ rel, line: i + 1, tok, why: 'name not found in any source file' });
      }
    }
  });
}

// The other direction. A `// spec: <file>#<anchor>` tag above a unit says which
// spec governs it, so the mapping is readable from the code as well as from the
// spec. Each tag must name a spec that exists and an anchor inside it.
const specText = new Map(specs.map(f => [path.relative(ROOT, f).replace(/\\/g, '/'), fs.readFileSync(f, 'utf8')]));
for (const [file, text] of sourceText) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  text.split(/\r?\n/).forEach((line, i) => {
    const m = line.match(/\/\/\s*spec:\s*([A-Za-z0-9_.\-/]+\.md)(?:#([A-Za-z0-9_-]+))?/);
    if (!m) return;
    const [, name, anchor] = m;
    const hit = [...specText.keys()].find(k => k === name || k.endsWith('/' + name));
    if (!hit) { findings.push({ rel, line: i + 1, tok: m[0].trim(), why: 'spec does not exist' }); return; }
    if (anchor && !specText.get(hit).includes(`<a id="${anchor}">`)) {
      findings.push({ rel, line: i + 1, tok: m[0].trim(), why: `${hit} has no anchor ${anchor}` });
    }
  });
}

if (!QUIET) {
  const scanned = specs.length - exempt.length;
  if (findings.length === 0) {
    console.log(`spec/code check: ${scanned} specs scanned, nothing stale.`);
  } else {
    console.log(`spec/code check: ${findings.length} stale reference(s) across ${scanned} specs\n`);
    const byFile = new Map();
    for (const f of findings) {
      if (!byFile.has(f.rel)) byFile.set(f.rel, []);
      byFile.get(f.rel).push(f);
    }
    for (const [rel, group] of [...byFile.entries()].sort()) {
      console.log(rel);
      for (const g of group) console.log(`  ${String(g.line).padStart(5)}  ${g.tok}  — ${g.why}`);
      console.log('');
    }
  }
  if (exempt.length) {
    console.log(`Not resolved, by their own status line — ${exempt.length} spec(s):`);
    for (const e of [...exempt].sort((a, b) => a.rel.localeCompare(b.rel))) {
      console.log(`  ${e.status.padEnd(9)} ${e.rel}`);
    }
  }
}
process.exit(findings.length ? 1 : 0);
