// index-ratio-quote-cross-check.test.js -- Cross-check that the unrounded Index Ratio
// (Ref CPI(settlement) / Ref CPI(dated date), shared/src/ref-cpi.js with NO_ROUNDING) reproduces
// the figure a real market quote states, on every TIPS in a real quote file
// (knowledge/DFD_Worklist.md §3.12 records the measurement: within 0.5e-9 on 53 of 53 TIPS).
// The quoted figure is the `Inflation factor` column of the export. The apps do not read that
// column (shared/src/fidelity-parse.js drops it), so this test reads it from the fixture by
// header name: it is an independent derivation, which makes this a cross-check, not a
// duplicated implementation (projects/CLAUDE.md §2a).
// Run: node shared/tests/index-ratio-quote-cross-check.test.js

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { parseTipsRefRows, R2_ROOT } from '../src/market-data.js';
import { parseCsv } from '../src/csv.js';
import { indexRatio, lookupRefCpi, NO_ROUNDING } from '../src/ref-cpi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// Real 2026-06-25 quote file, held for exactly this cross-check (DFD_Worklist.md §3.12).
const FIXTURE = path.join(REPO_ROOT, 'YieldCurves', 'tests', 'fixtures', 'FidelityTreasuriesTipsNewFormat.csv');
// S3 (RefCPI.csv), the retrieved Ref CPI series, and S2 (TipsRef.csv), the dated date Ref CPI by
// CUSIP. Both are read live from R2 (TipsLadderManager/TESTING.md: no committed copy of a file
// the monthly jobs keep current).
const REF_CPI_URL = `${R2_ROOT}/TIPS/RefCPI.csv`;
const TIPS_REF_URL = `${R2_ROOT}/TIPS/TipsRef.csv`;

// The Settlement Date of the quotes: the 2026-06-25 download date plus one bond trading day, a
// Thursday to a Friday with no bond holiday between them (DFD_Worklist.md §3.12).
const SETTLEMENT_DATE = '2026-06-26';

// Largest difference between the calculated and the quoted figure. §3.12 measured 0.5e-9 (the
// file states nine decimal places); the bound is 1e-9.
const TOLERANCE = 1e-9;

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.error('  ✗ ' + msg); } };

async function fetchText(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

async function main() {
  // The quotes, straight from the file by header name.
  const quoteRows = parseCsv(readFileSync(FIXTURE, 'utf8').replace(/^﻿/, ''));
  const tipsQuotes = quoteRows
    .filter(r => (r['Product'] || '').toLowerCase() === 'tips')
    .map(r => ({ cusip: r['Cusip|State'], quoted: parseFloat(r['Inflation factor']) }));
  ok(tipsQuotes.length === 53, `expected 53 TIPS quotes in the fixture (got ${tipsQuotes.length})`);

  const refCpiRows = parseCsv(await fetchText(REF_CPI_URL)).map(r => ({ date: r.date, refCpi: parseFloat(r.refCpi) }));
  const tipsRefByCusip = new Map(parseTipsRefRows(await fetchText(TIPS_REF_URL)).map(r => [r.cusip, r]));

  const settlementRefCpi = lookupRefCpi(refCpiRows, SETTLEMENT_DATE);
  ok(settlementRefCpi != null, `no Ref CPI for the Settlement Date ${SETTLEMENT_DATE}`);

  let compared = 0, maxDiff = 0, maxDiffCusip = '';
  for (const { cusip, quoted } of tipsQuotes) {
    const calculated = indexRatio(settlementRefCpi, tipsRefByCusip.get(cusip)?.datedDateRefCpi, NO_ROUNDING);
    if (calculated == null || isNaN(quoted)) { ok(false, `${cusip}: no calculated (${calculated}) or no quoted (${quoted}) Index Ratio`); continue; }
    compared++;
    const diff = Math.abs(calculated - quoted);
    if (diff > maxDiff) { maxDiff = diff; maxDiffCusip = cusip; }
    ok(diff < TOLERANCE, `${cusip}: calculated ${calculated} vs quoted ${quoted} (diff ${diff.toExponential(3)})`);
  }
  ok(compared === 53, `expected to compare all 53 TIPS (compared ${compared})`);
  console.log(`Compared ${compared} TIPS; max |calculated - quoted| = ${maxDiff.toExponential(3)} (${maxDiffCusip || 'n/a'})`);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
