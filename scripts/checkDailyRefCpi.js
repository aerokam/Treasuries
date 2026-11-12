// 1.17 Check daily Ref CPI (knowledge/1.17_Check_Daily_Ref_CPI.md).
// Compares the daily Ref CPI TreasuryDirect SecIndex states for one outstanding TIPS with Ref CPI (S3),
// logs the result to logs/ref-cpi-check.log, and shows a Windows notification for anything but a match.
// Writes no store.
//
// Exit 0 = match, 1 = mismatch, 2 = not yet published, 3 = the run could not complete, 4 = not the day after a release.
// Usage: node scripts/checkDailyRefCpi.js [--force]   (--force skips the day-after-release gate)
import { appendFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { notify } from './notify.js';
import { parseRefCpiRows } from '../shared/src/ref-cpi.js';

const R2_BASE = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOG = resolve(ROOT, 'logs/ref-cpi-check.log');

export async function fetchSecIndexSeries(cusip) {
  const url = 'https://www.treasurydirect.gov/TA_WS/secindex/search' +
    `?cusip=${cusip}&format=jsonp&callback=cb&filterscount=0&groupscount=0&sortdatafield=indexDate&sortorder=asc` +
    `&pagenum=0&pagesize=1000&recordstartindex=0&recordendindex=1000&_=${Date.now()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SecIndex HTTP ${res.status}`);
  const m = (await res.text()).match(/\[[\s\S]*\]/);
  if (!m) throw new Error('SecIndex response not readable');
  const rows = JSON.parse(m[0]).map(r => ({ date: r.indexDate.split('T')[0], refCpi: parseFloat(r.referenceCPI ?? r.refCpi) }));
  const bad = rows.find(r => !Number.isFinite(r.refCpi));
  if (bad) throw new Error(`SecIndex row ${bad.date} has no numeric Ref CPI`);
  return rows;
}

// The outstanding TIPS with the latest maturity date in S2.
export function latestMaturityCusip(csv, today) {
  const lines = csv.trim().split(/\r?\n/), header = lines[0].split(',');
  const ci = header.indexOf('cusip'), mi = header.indexOf('maturity');
  let best = null;
  for (const l of lines.slice(1)) {
    const c = l.split(',');
    if (c[mi] <= today) continue;
    if (!best || c[mi] > best.maturity) best = { cusip: c[ci], maturity: c[mi] };
  }
  if (!best) throw new Error('No outstanding TIPS in TIPS reference data');
  return best.cusip;
}

// Last day of the second month after (year, month).
export function lastDayTwoMonthsAfter(year, month) {
  let y = year, m = month + 2;
  while (m > 12) { m -= 12; y++; }
  return `${y}-${String(m).padStart(2, '0')}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;
}

export function compare(fetched, s3Rows) {
  const held = new Map(s3Rows.map(r => [r.date, r.refCpi]));
  const mismatches = [];
  for (const r of fetched) {
    const h = held.get(r.date);
    if (h === undefined || Math.abs(h - r.refCpi) > 1e-9) mismatches.push({ date: r.date, s3: h, secIndex: r.refCpi });
  }
  return mismatches;
}

const log = line => { mkdirSync(dirname(LOG), { recursive: true }); appendFileSync(LOG, `[${new Date().toISOString()}] ${line}\n`); console.log(line); };
const get = async path => { const r = await fetch(`${R2_BASE}/${path}?t=${Date.now()}`, { cache: 'no-store' }); if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`); return r.text(); };

async function main() {
  const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const yesterday = new Date(Date.parse(todayET + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10);
  if (!process.argv.includes('--force')) {
    const dates = (await get('bls/CpiReleaseSchedule.csv')).split(/\r?\n/).slice(1).map(l => l.split(',')[1]).filter(Boolean);
    if (!dates.includes(yesterday)) { console.log(`${yesterday} is not a Release Date; nothing to check.`); return 4; }
  }
  const [s2, s8, s3] = await Promise.all([get('TIPS/TipsRef.csv'), get('bls/CPI.csv'), get('TIPS/RefCPI.csv')]);
  const cusip = latestMaturityCusip(s2, todayET);
  const fetched = await fetchSecIndexSeries(cusip);
  const mismatches = compare(fetched, parseRefCpiRows(s3));
  const lastS8 = s8.trim().split(/\r?\n/).pop().split(',');
  const expected = lastDayTwoMonthsAfter(parseInt(lastS8[0], 10), parseInt(lastS8[1].slice(1), 10));
  const lastFetched = fetched[fetched.length - 1].date;
  const span = `${fetched[0].date} to ${lastFetched}, CUSIP ${cusip}`;

  if (mismatches.length) {
    const list = mismatches.slice(0, 20).map(m => `${m.date} S3 ${m.s3} SecIndex ${m.secIndex}`).join('; ');
    log(`MISMATCH ${mismatches.length} date(s) of ${fetched.length} (${span}): ${list}${mismatches.length > 20 ? '; ...' : ''}`);
    notify('Ref CPI mismatch', `${mismatches.length} date(s) differ from TreasuryDirect, first ${mismatches[0].date}. See logs/ref-cpi-check.log.`);
    return 1;
  }
  if (lastFetched < expected) {
    log(`NOT YET PUBLISHED: TreasuryDirect SecIndex ends ${lastFetched}, expected ${expected}. ${fetched.length} dates agree (${span}).`);
    notify('Ref CPI not yet published', `TreasuryDirect ends ${lastFetched}, expected ${expected}. Run checkDailyRefCpi.js again later.`);
    return 2;
  }
  log(`MATCH ${fetched.length} dates agree (${span}).`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().then(c => { process.exitCode = c; }, err => { log(`ERROR ${err.message || err}`); notify('Ref CPI check failed', String(err.message || err)); process.exitCode = 3; });
