// tips-yields-index-ratio.test.js — Cross-check that the calculated Index Ratio
// (Ref CPI(settlement) / Ref CPI(dated date), rounded once, half up, to nine decimal
// places -- knowledge/DFD_Worklist.md §3.12) reproduces the Index Ratio a real market
// quote states, on every TIPS in a real quote file. The quoted figure (Fidelity's own
// "Inflation factor" column) is an independent derivation, so this is a cross-check,
// not a duplicated implementation (projects/CLAUDE.md §2a).
// Run: node shared/tests/tips-yields-index-ratio.test.js

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { parseFidelityTipsRows } from '../src/fidelity-parse.js';
import { parseTipsRefRows } from '../src/market-data.js';
import { parseCsv } from '../src/csv.js';
import { tipsYieldsFromPrices } from '../src/tips-yields.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// Real 2026-06-25 quote file, held for exactly this cross-check (DFD_Worklist.md §3.12).
const FIXTURE = path.join(REPO_ROOT, 'YieldCurves', 'tests', 'fixtures', 'FidelityTreasuriesTipsNewFormat.csv');
// Real S4 (Ref CPI NSA and SA) rows -- the settlement-date Ref CPI source in hand (§3.12
// found S4's NSA column identical to S3's authoritative retrieved series on every date tested).
const REF_CPI_NSA_SA = path.join(REPO_ROOT, 'SeasonalAdjustments', 'data', 'RefCpiNsaSa.snapshot.csv');
// Real S2 (TipsRef.csv) rows -- the dated date Ref CPI source, keyed by CUSIP.
const TIPS_REF = path.join(REPO_ROOT, 'TipsLadderManager', 'tests', 'e2e', 'TipsRef.csv');

// The 2026-06-25 download date's own T+1 (3.1.6): a Thursday to a Friday, no bond holiday
// between them -- see §3.12.
const MARKET_SETTLE_ISO = '2026-06-26';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.error('  ✗ ' + msg); } };

function main() {
  const fidText = readFileSync(FIXTURE, 'utf8');
  const tipsQuotes = parseFidelityTipsRows(fidText);
  ok(tipsQuotes.length === 53, `expected 53 TIPS quotes in the fixture (got ${tipsQuotes.length})`);
  const quotesByCusip = new Map(tipsQuotes.map(r => [r.cusip, r]));

  const refCpiRows = parseCsv(readFileSync(REF_CPI_NSA_SA, 'utf8'));
  const tipsRefRows = parseTipsRefRows(readFileSync(TIPS_REF, 'utf8'));
  const tipsRefByCusip = new Map(tipsRefRows.map(r => [r.cusip, r]));

  const results = tipsYieldsFromPrices([], refCpiRows, quotesByCusip, true, MARKET_SETTLE_ISO, tipsRefByCusip);
  ok(results.length === 53, `expected all 53 quoted TIPS to be priced (got ${results.length})`);

  let compared = 0, maxDiff = 0, maxDiffCusip = '';
  for (const r of results) {
    const quoted = quotesByCusip.get(r.cusip)?.indexRatio;
    if (quoted == null || isNaN(quoted)) continue;
    compared++;
    ok(!isNaN(r.indexRatio), `${r.cusip}: calculated Index Ratio is NaN`);
    const diff = Math.abs(r.indexRatio - quoted);
    if (diff > maxDiff) { maxDiff = diff; maxDiffCusip = r.cusip; }
    ok(diff < 5e-10, `${r.cusip}: calculated ${r.indexRatio} vs quoted ${quoted} (diff ${diff.toExponential(3)})`);
  }
  ok(compared === 53, `expected to compare all 53 TIPS (compared ${compared})`);
  console.log(`Compared ${compared} TIPS; max |calculated - quoted| = ${maxDiff.toExponential(3)} (${maxDiffCusip || 'n/a'})`);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main();
