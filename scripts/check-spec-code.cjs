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
// Two classes are checked, both high signal:
//   paths        `YieldCurves/src/app.js`  ->  the file must exist
//   identifiers  `calculateSAO`, `SAO_NOISE_YRS`  ->  the name must appear in source
//
// Everything else in backticks is left alone: column headers, R2 keys, CSV
// field names and formula symbols are data, not code references.
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

const findings = [];
for (const spec of specs) {
  const rel = path.relative(ROOT, spec).replace(/\\/g, '/');
  const lines = fs.readFileSync(spec, 'utf8').split(/\r?\n/);
  let fenced = false;
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) { fenced = !fenced; return; }
    if (fenced) return;
    for (const m of line.matchAll(/`([^`]+)`/g)) {
      const tok = m[1].trim().replace(/\(\)$/, '');
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
      const looksLikeCode = (FN_RE.test(tok) && /[a-z][A-Z]/.test(tok)) || CONST_RE.test(tok);
      if (looksLikeCode && !identifiers.has(tok)) {
        findings.push({ rel, line: i + 1, tok, why: 'name not found in any source file' });
      }
    }
  });
}

if (!QUIET) {
  if (findings.length === 0) {
    console.log(`spec/code check: ${specs.length} specs scanned, nothing stale.`);
  } else {
    console.log(`spec/code check: ${findings.length} stale reference(s) across ${specs.length} specs\n`);
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
}
process.exit(findings.length ? 1 : 0);
