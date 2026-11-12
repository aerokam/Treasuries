// 1.13 Calculate daily Ref CPI (knowledge/1.13_Calculate_Daily_Ref_CPI.md).
// Reads CPI history (S8) and writes Ref CPI (S3), TIPS/RefCPI.csv: the daily Ref CPI NSA, Ref CPI SA and SA Factor.
//
// Usage:
//   node scripts/calcDailyRefCpi.js          dry run: prints the row count and the last rows
//   node scripts/calcDailyRefCpi.js --write  writes S3 to R2
import { refCpiFromMonthly, monthlyCpiMap, fillUnreportedMonths, parseRefCpiRows } from '../shared/src/ref-cpi.js';
import { parseCsv } from '../shared/src/csv.js';
import { uploadToR2 } from '../YieldCurves/scripts/r2.js';

const R2_BASE = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const CPI_KEY = 'bls/CPI_history.csv';
const FIRST_DATE = '1997-01-15';   // the dated date of the first TIPS issued
const DAY = 86400000;

const utcMs = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const isoOf = ms => new Date(ms).toISOString().slice(0, 10);

// S8 rows: header, then `Year,Period,PeriodName,NSA,SA`. A month BLS did not report is derived (31 CFR App. B §I.B.4(iv)), per series.
export function monthlyMapsFromS8(csv) {
  const rows = parseCsv(csv);
  const series = key => fillUnreportedMonths(monthlyCpiMap(rows.map(r => ({ year: r.Year, period: r.Period, value: r[key] }))));
  const nsa = series('NSA'), sa = series('SA');
  let last = null;
  for (const k of Object.keys(nsa)) { const [y, m] = k.split('-').map(Number); if (!last || y * 12 + m > last.y * 12 + last.m) last = { y, m }; }
  return { nsa, sa, last };
}

// The series from FIRST_DATE to the first of the month three months after the latest month of S8.
// `held` is S3's rows: each one's Ref CPI NSA is kept as it is (31 CFR App. B §I.B.4(i): the CPI as first reported stands),
// and the days after the last of them, or from FIRST_DATE when there are none, take a newly calculated Ref CPI NSA.
// The Ref CPI SA of every date is calculated again, and the SA Factor follows from the two.
export function calcSeries(nsa, sa, last, held = []) {
  let ey = last.y, em = last.m + 3;
  while (em > 12) { em -= 12; ey++; }
  const end = `${ey}-${String(em).padStart(2, '0')}-01`;
  const heldNsa = new Map(held.map(r => [r.date, r.refCpi]));
  const out = [];
  for (let ms = utcMs(FIRST_DATE); ms <= utcMs(end); ms += DAY) {
    const date = isoOf(ms);
    const refCpi = heldNsa.get(date) ?? refCpiFromMonthly(date, nsa);
    const refCpiSa = refCpiFromMonthly(date, sa);
    if (refCpi == null || refCpiSa == null) break;
    out.push({ date, refCpi, refCpiSa, saFactor: Math.round(refCpi / refCpiSa * 1e5) / 1e5 });
  }
  return out;
}

export function checkSeries(rows) {
  for (let i = 1; i < rows.length; i++) {
    if (utcMs(rows[i].date) - utcMs(rows[i - 1].date) !== DAY) throw new Error(`Gap between ${rows[i - 1].date} and ${rows[i].date} -- not writing.`);
  }
}

const toCsv = rows => ['Ref CPI Date,Ref CPI NSA,Ref CPI SA,SA Factor', ...rows.map(r => `${r.date},${r.refCpi.toFixed(5)},${r.refCpiSa.toFixed(5)},${r.saFactor.toFixed(5)}`)].join('\n') + '\n';

async function main() {
  const bust = `?t=${Date.now()}`;
  const [s8, s3] = await Promise.all([
    fetch(`${R2_BASE}/${CPI_KEY}${bust}`, { cache: 'no-store' }),
    fetch(`${R2_BASE}/TIPS/RefCPI.csv${bust}`, { cache: 'no-store' }),
  ]);
  if (!s8.ok) throw new Error(`${CPI_KEY} not readable: HTTP ${s8.status}`);
  const held = s3.ok ? parseRefCpiRows(await s3.text()) : [];
  if (held.some(r => !Number.isFinite(r.refCpi))) throw new Error('S3 holds a non-numeric Ref CPI NSA -- not writing.');
  const { nsa, sa, last } = monthlyMapsFromS8(await s8.text());
  if (!last) throw new Error('CPI history holds no month.');
  const rows = calcSeries(nsa, sa, last, held);
  checkSeries(rows);
  console.log(`${rows.length} rows, ${rows[0].date} to ${rows[rows.length - 1].date}: S3 held ${held.length}, ${rows.length - held.length} added.`);
  if (process.argv.includes('--write')) await uploadToR2('TIPS/RefCPI.csv', toCsv(rows));
  else rows.slice(-3).forEach(r => console.log(`${r.date}  ${r.refCpi}  ${r.refCpiSa}  ${r.saFactor}`));
}

import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch(err => { console.error(err.message || err); process.exitCode = 1; });
