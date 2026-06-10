// updateYieldsHistory.js — daily yields-history refresh (retires snapHistory.js).
//
// Builds/refreshes a SINGLE consolidated, symbol-nested history file of daily closes:
//   R2:    Treasuries/yields-history/history.json
//   shape: { "US10Y": [ { "x": "YYYYMMDD150000", "y": 4.521 }, ... ], ... }
//
// Close basis: CNBC's daily-feed close == the ~3 PM ET benchmark (Treasury CMT/real
// ~3:30 PM; Tradeweb 3/4 PM) — NOT the 17:05 session print. See
// knowledge/Close_Price_Investigation.md. Each close is stamped 15:00 ET so curve/BEI
// "start" labels read ~3 PM instead of 00:00.
//
// Strategy:
//   - Resolution is daily for ~3yr (6M feed), weekly to 10yr (5Y feed), quarterly deep
//     (ALL feed). We merge coarse->fine so the finest feed wins for recent dates.
//   - MERGE with the existing consolidated file: dates we captured while dense are kept
//     even after CNBC's feed coarsens them (accumulate-daily for 10Y/ALL). Fresh CNBC
//     values override the same date (authoritative ~3 PM).
//   - Completed days only: the current ET day is provisional (tracks live, not 3 PM) and
//     is skipped; it is captured next run once settled.

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const R2_KEY = 'Treasuries/yields-history/history.json';
const LOCAL_FILE = path.join(__dirname, '../data/yields-history/history.json');

const SYMBOLS = [
  'US1YTIPS', 'US2YTIPS', 'US5YTIPS', 'US10YTIPS', 'US30YTIPS',
  'US1M', 'US2M', 'US3M', 'US6M', 'US1Y', 'US2Y', 'US5Y', 'US10Y', 'US30Y'
];

// Daily-close feeds, coarse -> fine (fine overrides for shared dates).
const DAILY_RANGES = ['ALL', '5Y', '6M', '3M', '1M'];

const ET_YMD = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }); // YYYY-MM-DD

function buildUrl(symbol, timeRange) {
  const params = {
    operationName: 'getQuoteChartData',
    variables: JSON.stringify({ symbol, timeRange }),
    extensions: JSON.stringify({ persistedQuery: { version: 1, sha256Hash: '9e1670c29a10707c417a1efd327d4b2b1d456b77f1426e7e84fb7d399416bb6b' } })
  };
  return 'https://webql-redesign.cnbcfm.com/graphql?' + Object.entries(params).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
}

async function fetchRange(symbol, range) {
  try {
    const res = await fetch(buildUrl(symbol, range));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return (json?.data?.chartData?.priceBars || [])
      .map(b => ({ date: String(b.tradeTime).slice(0, 8), y: parseFloat(String(b.close).replace('%', '')) }))
      .filter(p => /^\d{8}$/.test(p.date) && !isNaN(p.y));
  } catch (err) {
    console.warn(`  ${symbol} ${range}: ${err.message}`);
    return [];
  }
}

function s3() {
  const { CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!CLOUDFLARE_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
}

async function getExisting(client) {
  if (!client) return {};
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: R2_KEY }));
    const body = await new Promise((resolve, reject) => {
      const chunks = []; res.Body.on('data', c => chunks.push(c)); res.Body.on('error', reject);
      res.Body.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    return JSON.parse(body);
  } catch (err) {
    if (err.name === 'NoSuchKey') return {};
    console.warn(`  Could not read existing ${R2_KEY}: ${err.message}`);
    return {};
  }
}

// existing series ({x:"YYYYMMDDHHMMSS",y}) -> {date(YYYYMMDD): y}
// Collapses any intraday-stamped points to one-per-day (last wins).
function seriesToMap(series) {
  const m = {};
  for (const p of series || []) { const d = String(p.x).slice(0, 8); if (/^\d{8}$/.test(d)) m[d] = p.y; }
  return m;
}

// One-time migration seed: legacy per-symbol files at the OLD path. Preserves accumulated
// coverage (esp. flaky US5YTIPS) that CNBC's feeds no longer return. Fresh CNBC ~3PM
// values overlay on top; legacy values survive only for dates CNBC no longer provides.
const R2_PUBLIC = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
async function fetchLegacySeries(sym) {
  try {
    const r = await fetch(`${R2_PUBLIC}/Treasuries/yield-history/${sym}_history.json`);
    if (!r.ok) return [];
    return await r.json();
  } catch { return []; }
}

async function main() {
  const client = s3();
  const existing = await getExisting(client);
  const todayET = ET_YMD.format(new Date()).replace(/-/g, ''); // YYYYMMDD ET

  const out = {};
  let totalPts = 0;
  for (const sym of SYMBOLS) {
    let merged = seriesToMap(existing[sym]); // keep accumulated history
    if (Object.keys(merged).length === 0) {  // first run: seed from legacy per-symbol file
      merged = seriesToMap(await fetchLegacySeries(sym));
    }

    for (const range of DAILY_RANGES) {       // coarse -> fine; fine overrides
      const bars = await fetchRange(sym, range);
      for (const p of bars) {
        if (p.date >= todayET) continue;       // completed days only (skip provisional)
        merged[p.date] = p.y;                  // fresh CNBC ~3PM value is authoritative
      }
      await new Promise(r => setTimeout(r, 120));
    }

    const series = Object.keys(merged).sort().map(date => ({ x: `${date}150000`, y: merged[date] }));
    out[sym] = series;
    totalPts += series.length;
    const first = series[0]?.x.slice(0, 8), last = series[series.length - 1]?.x.slice(0, 8);
    console.log(`${sym.padEnd(10)} ${String(series.length).padStart(5)} pts  ${first || '—'} … ${last || '—'}`);
  }

  const payload = JSON.stringify(out);
  fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
  fs.writeFileSync(LOCAL_FILE, payload);

  let r2 = 'skipped (no creds)';
  if (client) {
    await client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: R2_KEY, Body: payload, ContentType: 'application/json' }));
    r2 = `uploaded ${R2_KEY}`;
  }
  console.log(`\n${SYMBOLS.length} symbols, ${totalPts} points, ${(payload.length / 1024).toFixed(0)} KB.  R2: ${r2}.  Local: ${path.relative(process.cwd(), LOCAL_FILE)}`);
}

main().catch(e => { console.error(e); process.exit(1); });
