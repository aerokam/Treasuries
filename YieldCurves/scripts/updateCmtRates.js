// updateCmtRates.js -- reads the CMT rates and the R-CMT rates of Treasury Par Yield Curve Rates
// (E16) and writes CMT rates (S24) and R-CMT rates (S25) to R2.
// Spec: knowledge/1.18_Fetch_CMT_Rates.md
//
// R2 keys: Treasuries/CmtRates.csv, TIPS/RCmtRates.csv
// Run: node YieldCurves/scripts/updateCmtRates.js  [--dry]
//
// Treasury publishes the rates of a trading day by about 6:00 PM ET, and may be late. The job starts
// at 6:00 PM ET and tries again every POLL_MINUTES until each series holds the rates of today's date
// (New York), giving up after GIVE_UP_HOURS. On a weekend or Bond Holiday no rates are expected, so it
// reads once. --dry reads once and writes nothing.

import { uploadToR2 } from './r2.js';
import { parseCsv } from '../../shared/src/csv.js';
import { parseHolidaySet, localDate, todayEt } from '../../shared/src/settlement.js';
import {
  CMT_COLUMNS, RCMT_COLUMNS, CMT_FIRST_YEAR, RCMT_FIRST_YEAR, sourceUrl,
  parseSourceCsv, parseRatesCsv, mergeRateRows, buildRatesCsv,
} from '../../shared/src/cmt-rates.js';

const R2_BASE_URL = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const DRY = process.argv.includes('--dry');
const POLL_MINUTES = 5;
const GIVE_UP_HOURS = 4;

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

// Whether Treasury publishes rates for the date: a weekday that is not a Bond Holiday. A Bond Holidays
// store that cannot be read counts as no holiday.
async function ratesExpected(iso) {
  const day = localDate(iso).getDay();
  if (day === 0 || day === 6) return false;
  try {
    const res = await fetch(`${R2_BASE_URL}/misc/BondHolidaysSifma.csv`, { cache: 'no-store' });
    if (res.ok) return !parseHolidaySet(parseCsv(await res.text(), false)).has(iso);
  } catch { /* no holiday applies */ }
  return true;
}

// Reads and merges one series; returns the latest Date the store holds afterwards.
async function runSeries(s) {
  const stored = await readStore(s.key);
  const lastStored = stored && stored.length ? stored[stored.length - 1].date : null;
  const fromYear = lastStored ? Number(lastStored.slice(0, 4)) : s.firstYear;
  const thisYear = new Date().getFullYear();
  const read = [];
  for (let y = fromYear; y <= thisYear; y++) read.push(...await readYear(s.type, y, s.columns));
  const { rows, changed } = mergeRateRows(stored || [], read, s.columns);
  if (stored && !changed) { console.log(`${s.name}: no new row (latest ${lastStored})`); return lastStored; }
  console.log(`${s.name}: ${rows.length} rows, latest ${rows[rows.length - 1].date}`);
  if (!DRY) await uploadToR2(s.key, buildRatesCsv(s.columns, rows), 'text/csv');
  else console.log('(dry run, not uploaded)');
  return rows[rows.length - 1].date;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const wanted = todayEt();
const polling = !DRY && await ratesExpected(wanted);
const deadline = Date.now() + GIVE_UP_HOURS * 3600000;
let unpolledFailure = false;   // a read failed on a day that is not polled
const pending = new Map(SERIES.map(s => [s, null]));   // series -> its last error, or null

for (;;) {
  for (const s of [...pending.keys()]) {
    try {
      const latest = await runSeries(s);
      if (!polling || latest >= wanted) pending.delete(s);
      else pending.set(s, null);
    } catch (err) {
      console.error(`${s.name}: ${err.message}`);
      pending.set(s, err);
      if (!polling) { pending.delete(s); unpolledFailure = true; }
    }
  }
  if (pending.size === 0) process.exit(unpolledFailure ? 1 : 0);
  if (Date.now() + POLL_MINUTES * 60000 > deadline) break;
  console.log(`Waiting for the rates of ${wanted}: ${[...pending.keys()].map(s => s.name).join(', ')}; trying again in ${POLL_MINUTES} minutes`);
  await sleep(POLL_MINUTES * 60000);
}
console.error(`Gave up after ${GIVE_UP_HOURS} hours without the rates of ${wanted} for: ${[...pending.keys()].map(s => s.name).join(', ')}`);
process.exit(1);
