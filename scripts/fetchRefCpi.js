// Builds and maintains TIPS/RefCPI.csv, the authoritative retrieved daily Ref CPI series
// (TreasuryDirect SecIndex, E2 in DATA_DICTIONARY.md). Ref CPI is market-wide -- identical
// across every outstanding CUSIP on a given date (verified 2026-09-19: the two bootstrap
// CUSIPs below overlap on 3,198 dates with zero mismatches) -- so any outstanding TIPS's
// SecIndex gives the same values; only the date RANGE it covers differs, bounded by that
// CUSIP's own dated date and maturity.
//
// Two separate operations, not one function called two ways:
//
//   --build   ONE-SHOT historical bootstrap. Never scheduled -- run by hand only if
//             RefCPI.csv ever needs to be rebuilt from scratch. Merges the two CUSIPs
//             whose combined SecIndex windows cover 1997-01-15 (the first TIPS ever
//             issued) through present with no gap:
//               9128272M3  first TIPS issued (10-year, matured 2007-01-15) -- still
//                          queryable on SecIndex despite maturity; covers 1997-01-15..2007-01-15
//               912810FD5  30-year TIPS maturing 2028-04-15; covers 1998-04-15..present
//
//   --append  RECURRING -- what the scheduled task (run-ref-cpi.cmd) runs after each BLS
//             release. Auto-selects whichever currently-outstanding TIPS has the LATEST
//             maturity date (from TipsRef.csv, S2) -- the longest possible runway before
//             that CUSIP needs to be swapped out -- and re-derives the choice fresh every
//             run, so there is no hardcoded CUSIP to maintain or replace as one matures.
//             Fetches that one CUSIP's SecIndex series, merges any new dates into the
//             existing RefCPI.csv (never shrinks it, never re-derives history that's
//             already there), and re-uploads.
//
// No arg / a date arg / neither: unchanged diagnostic lookups, reading the merged
// RefCPI.csv straight from R2 rather than hitting TreasuryDirect live.
//
// Usage:
//   node fetchRefCpi.js --build     one-shot historical bootstrap (see above)
//   node fetchRefCpi.js --append    recurring: fetch + merge latest dates (scheduled task)
//   node fetchRefCpi.js             prints last 30 days from R2
//   node fetchRefCpi.js YYYY-MM-DD  prints refCpi for that date (or nearest prior date) from R2

// Load .env from repo root if present (local dev); does not override real env vars
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const _envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.env');
if (existsSync(_envPath)) {
  readFileSync(_envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#\s][^=]*?)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
}

const R2_PUBLIC_BASE = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const BOOTSTRAP_CUSIPS = ['9128272M3', '912810FD5'];

// Ref CPI for the 1st of month M = CPI-U NSA for month M-3; interpolation across month M
// needs the month-M and month-(M+1) anchors, so a value published through month M+2 the CPI
// for month M is known covers all of month M+2. Used to detect whether TreasuryDirect has
// caught up to today's BLS release yet (TreasuryDirect lags BLS by an unknown amount).
async function expectedMinRefCpiDate() {
  const res = await fetch(`${R2_PUBLIC_BASE}/bls/CPI_history.csv`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`CPI_history.csv fetch failed: ${res.status}`);
  const lines = (await res.text()).trim().split('\n');
  const [lastYear, lastPeriod] = lines[lines.length - 1].split(',');
  const year = parseInt(lastYear, 10);
  const month = parseInt(lastPeriod.slice(1), 10); // "M07" -> 7
  // Last day of (month+2), computed as day-before-1st-of-(month+3), pure integer math (no Date/TZ).
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let targetMonth = month + 2; // last day of month+2 = target month whose length we need
  let targetYear = year;
  while (targetMonth > 12) { targetMonth -= 12; targetYear += 1; }
  let lastDay = daysInMonth[targetMonth - 1];
  const isLeap = (targetYear % 4 === 0 && targetYear % 100 !== 0) || targetYear % 400 === 0;
  if (targetMonth === 2 && isLeap) lastDay = 29;
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

async function uploadToR2(key, body) {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const {
    CLOUDFLARE_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
  } = process.env;

  if (!CLOUDFLARE_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw new Error('Cloudflare R2 credentials not found in environment variables (CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET).');
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });

  await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: body, ContentType: 'text/csv' }));
  console.error(`Wrote ${body.trim().split('\n').length - 1} rows → R2 bucket "${R2_BUCKET}", key "${key}"`);
}

// One CUSIP's full daily Ref CPI series from TreasuryDirect SecIndex.
async function fetchCusipSeries(cusip) {
  const url = 'https://www.treasurydirect.gov/TA_WS/secindex/search' +
    `?cusip=${cusip}&format=jsonp&callback=jQuery_CUSIP_FETCHER` +
    `&filterscount=0&groupscount=0` +
    `&sortdatafield=indexDate&sortorder=asc` +
    `&pagenum=0&pagesize=1000&recordstartindex=0&recordendindex=1000` +
    `&_=${Date.now()}`;

  console.error(`Fetching reference CPI (CUSIP ${cusip})...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const text = await res.text();

  // Strip JSONP wrapper: _([...]) or jQuery_...([...])
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Could not parse JSONP response');

  return JSON.parse(match[0]).map(r => ({
    date:   r.indexDate.split('T')[0],
    refCpi: parseFloat(r.refCpi)
  }));
}

async function fetchExistingRefCpi() {
  const res = await fetch(`${R2_PUBLIC_BASE}/TIPS/RefCPI.csv`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`RefCPI.csv fetch failed: ${res.status}`);
  const lines = (await res.text()).trim().split('\n');
  return lines.slice(1).map(l => {
    const [date, refCpi] = l.split(',');
    return { date, refCpi: parseFloat(refCpi) };
  });
}

// The currently-outstanding TIPS with the latest maturity date, from TipsRef.csv (S2) --
// gives an --append run the longest possible runway before that CUSIP needs to be
// swapped out, re-derived fresh every run so there is nothing to hardcode or maintain.
async function pickAppendCusip() {
  const res = await fetch(`${R2_PUBLIC_BASE}/TIPS/TipsRef.csv`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`TipsRef.csv fetch failed: ${res.status}`);
  const lines = (await res.text()).trim().split('\n');
  const header = lines[0].split(',');
  const cusipIdx = header.indexOf('cusip');
  const maturityIdx = header.indexOf('maturity');
  const today = new Date().toISOString().slice(0, 10);
  let best = null;
  for (const line of lines.slice(1)) {
    const cols = line.split(',');
    const maturity = cols[maturityIdx];
    if (maturity <= today) continue; // matured or maturing today -- not usable going forward
    if (!best || maturity > best.maturity) best = { cusip: cols[cusipIdx], maturity };
  }
  if (!best) throw new Error('No outstanding TIPS found in TipsRef.csv');
  console.error(`Selected CUSIP ${best.cusip} (maturity ${best.maturity}) for append.`);
  return best.cusip;
}

// Merge two Ref CPI series into one ascending-by-date array, deduped by date (newRows
// wins on overlap -- an --append run's own fresh fetch supersedes what's already stored,
// though the two are expected to agree exactly since Ref CPI is market-wide). Never drops
// a date that only exists in one of the two inputs.
function mergeSeries(existingRows, newRows) {
  const byDate = new Map(existingRows.map(r => [r.date, r.refCpi]));
  for (const r of newRows) byDate.set(r.date, r.refCpi);
  return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, refCpi]) => ({ date, refCpi }));
}

// The published series must have no missing calendar day -- Ref CPI is defined for every
// day (DATA_DICTIONARY.md#ref-cpi, "no snap to an earlier date"). Returns the first gap
// found, or null if the series is fully contiguous.
function toUtcMs(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function findGap(rows) {
  for (let i = 1; i < rows.length; i++) {
    if (toUtcMs(rows[i].date) - toUtcMs(rows[i - 1].date) !== 86400000) {
      return { after: rows[i - 1].date, before: rows[i].date };
    }
  }
  return null;
}

function toCsv(rows) {
  return ['date,refCpi', ...rows.map(r => `${r.date},${r.refCpi}`)].join('\n') + '\n';
}

async function build() {
  const perCusip = await Promise.all(BOOTSTRAP_CUSIPS.map(fetchCusipSeries));
  let merged = [];
  for (const series of perCusip) merged = mergeSeries(merged, series);
  const gap = findGap(merged);
  if (gap) throw new Error(`Gap in bootstrapped series between ${gap.after} and ${gap.before} -- aborting, not uploading.`);
  console.error(`Bootstrapped ${merged.length} daily rows, ${merged[0].date} to ${merged[merged.length - 1].date}.`);
  await uploadToR2('TIPS/RefCPI.csv', toCsv(merged));
}

async function append() {
  const cusip = await pickAppendCusip();
  const [existing, fetched] = await Promise.all([fetchExistingRefCpi(), fetchCusipSeries(cusip)]);

  // TreasuryDirect lags BLS by an unknown amount; verify it has actually caught up to the
  // latest BLS CPI month before publishing, so a same-day chained run doesn't overwrite
  // R2 with data that looks "successful" but is still missing the newest month.
  const latestFetchedDate = fetched[fetched.length - 1].date;
  try {
    const expected = await expectedMinRefCpiDate();
    if (latestFetchedDate < expected) {
      console.error(`TreasuryDirect not yet caught up: latest date ${latestFetchedDate}, expected through ${expected}. Not writing -- will retry.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`Freshness check skipped (${err.message}) -- appending anyway.`);
  }

  const merged = mergeSeries(existing, fetched);
  const gap = findGap(merged);
  if (gap) throw new Error(`Gap in merged series between ${gap.after} and ${gap.before} -- aborting, not uploading.`);
  if (merged.length < existing.length) throw new Error(`Merged series (${merged.length} rows) is shorter than existing (${existing.length}) -- aborting, not uploading.`);

  console.error(`Merged: ${existing.length} existing + ${fetched.length} fetched -> ${merged.length} rows, through ${merged[merged.length - 1].date}.`);
  await uploadToR2('TIPS/RefCPI.csv', toCsv(merged));
}

async function main() {
  const arg = process.argv[2];

  if (arg === '--build') return build();
  if (arg === '--append') return append();

  const rows = await fetchExistingRefCpi();
  if (rows.length === 0) {
    console.error('No data in RefCPI.csv.');
    process.exit(1);
  }

  if (arg) {
    // Find exact match or nearest prior date
    const matches = rows.filter(r => r.date <= arg);
    if (matches.length === 0) {
      console.error(`No data on or before ${arg}.`);
      process.exit(1);
    }
    const row = matches[matches.length - 1]; // already sorted asc
    if (row.date !== arg) {
      console.error(`No data for ${arg}, using nearest prior date.`);
    }
    console.log(`${row.date}  ${row.refCpi.toFixed(5)}`);
  } else {
    // Print last 30 days
    const recent = rows.slice(-30);
    console.log(`\nReference CPI (NSA) — ${rows.length} total dates, showing last ${recent.length}\n`);
    console.log('Date          RefCPI');
    console.log('----------  --------');
    recent.forEach(r => console.log(`${r.date}  ${r.refCpi.toFixed(5)}`));
  }
}

main().catch(err => { console.error(err); process.exit(1); });
