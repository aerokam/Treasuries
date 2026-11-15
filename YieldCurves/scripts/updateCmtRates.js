// updateCmtRates.js -- reads the CMT rates and the R-CMT rates of Treasury Par Yield Curve Rates
// (E16) and writes CMT rates (S24) and R-CMT rates (S25) to R2.
// Spec: knowledge/1.18_Fetch_CMT_Rates.md
//
// R2 keys: Treasuries/CmtRates.csv, TIPS/RCmtRates.csv
// Run: node YieldCurves/scripts/updateCmtRates.js  [--dry]

import { uploadToR2 } from './r2.js';
import {
  CMT_COLUMNS, RCMT_COLUMNS, CMT_FIRST_YEAR, RCMT_FIRST_YEAR, sourceUrl,
  parseSourceCsv, parseRatesCsv, mergeRateRows, buildRatesCsv,
} from '../../shared/src/cmt-rates.js';

const R2_BASE_URL = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const DRY = process.argv.includes('--dry');

const SERIES = [
  { name: 'CMT', type: 'daily_treasury_yield_curve', columns: CMT_COLUMNS, firstYear: CMT_FIRST_YEAR, key: 'Treasuries/CmtRates.csv' },
  { name: 'R-CMT', type: 'daily_treasury_real_yield_curve', columns: RCMT_COLUMNS, firstYear: RCMT_FIRST_YEAR, key: 'TIPS/RCmtRates.csv' },
];

// The stored rows of a series: none when the store is absent (HTTP 404). Any other failure ends
// the series, so a transient error never reads as an absent store and triggers a full rewrite.
async function readStore(key) {
  const res = await fetch(`${R2_BASE_URL}/${key}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status} reading ${key}`);
  return parseRatesCsv(await res.text());
}

async function readYear(type, year, columns) {
  const res = await fetch(sourceUrl(type, year), { headers: { 'User-Agent': 'Treasuries/YieldCurves updateCmtRates' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} reading ${type} for ${year}`);
  return parseSourceCsv(await res.text(), columns);
}

async function runSeries(s) {
  const stored = await readStore(s.key);
  const lastStored = stored && stored.length ? stored[stored.length - 1].date : null;
  const fromYear = lastStored ? Number(lastStored.slice(0, 4)) : s.firstYear;
  const thisYear = new Date().getFullYear();
  const read = [];
  for (let y = fromYear; y <= thisYear; y++) read.push(...await readYear(s.type, y, s.columns));
  const { rows, changed } = mergeRateRows(stored || [], read, s.columns);
  if (stored && !changed) { console.log(`${s.name}: no new row (latest ${lastStored})`); return; }
  console.log(`${s.name}: ${rows.length} rows, latest ${rows[rows.length - 1].date}`);
  if (DRY) { console.log('(dry run, not uploaded)'); return; }
  await uploadToR2(s.key, buildRatesCsv(s.columns, rows), 'text/csv');
}

let failed = false;
for (const s of SERIES) {
  try { await runSeries(s); } catch (err) { failed = true; console.error(`${s.name}: ${err.message}`); }
}
process.exit(failed ? 1 : 0);
