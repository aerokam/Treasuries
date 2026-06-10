// archiveIntraday.js — daily raw-intraday audit archive.
// Captures the CNBC 1D (1-min) and 5D (5-min) feeds for every symbol and stores an
// immutable snapshot per symbol per trading day, so any past close window can be
// inspected offline. This is an AUDIT archive (Goal A) — it is NOT the daily-close
// baseline (see snapHistory.js / {symbol}_history.json).
//
// Run after the 17:00 ET cash close (scheduled 5:05pm ET) so the close-window bars
// are settled in the feed.
//
// Output:
//   R2:    Treasuries/yield-history/intraday-raw/{symbol}/{YYYYMMDD}.json
//   local: data/yield-history/intraday-raw/{symbol}/{YYYYMMDD}.json (mirror, for inspection)

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const LOCAL_DIR = path.join(__dirname, '../data/yield-history/intraday-raw');

const SYMBOLS = [
  'US1YTIPS', 'US2YTIPS', 'US5YTIPS', 'US10YTIPS', 'US30YTIPS',
  'US1M', 'US2M', 'US3M', 'US6M', 'US1Y', 'US2Y', 'US5Y', 'US10Y', 'US30Y'
];
const RANGES = ['1D', '5D'];

const ET_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit'
});

function parseT(s) {
  const y = +s.slice(0, 4), mo = +s.slice(4, 6) - 1, d = +s.slice(6, 8);
  const h = +s.slice(8, 10) || 0, mi = +s.slice(10, 12) || 0, se = +s.slice(12, 14) || 0;
  let dt = new Date(Date.UTC(y, mo, d, h, mi, se));
  for (let i = 0; i < 2; i++) {
    const p = ET_FMT.formatToParts(dt).reduce((a, x) => ({ ...a, [x.type]: x.value }), {});
    const diff = Date.UTC(y, mo, d, h, mi, se) - Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    if (diff === 0) break;
    dt = new Date(dt.getTime() + diff);
  }
  return dt;
}

function buildUrl(symbol, timeRange) {
  const params = {
    operationName: 'getQuoteChartData',
    variables: JSON.stringify({ symbol, timeRange }),
    extensions: JSON.stringify({ persistedQuery: { version: 1, sha256Hash: '9e1670c29a10707c417a1efd327d4b2b1d456b77f1426e7e84fb7d399416bb6b' } })
  };
  return 'https://webql-redesign.cnbcfm.com/graphql?' + Object.entries(params).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
}

async function fetchRange(symbol, range) {
  const res = await fetch(buildUrl(symbol, range));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const bars = (json?.data?.chartData?.priceBars || []).map(b => ({
    raw: b.tradeTime,
    et: ET_FMT.format(parseT(b.tradeTime)),
    close: b.close
  }));
  return bars;
}

async function uploadToR2(key, body) {
  const { CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!CLOUDFLARE_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    return false;
  }
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET, Key: key, Body: JSON.stringify(body), ContentType: 'application/json'
  }));
  return true;
}

function todayET() {
  return ET_FMT.format(new Date()).slice(0, 10).replace(/\//g, '').replace(/(\d\d)(\d\d)(\d\d\d\d)/, '$3$1$2');
}

async function main() {
  const dateET = todayET(); // YYYYMMDD in ET
  const fetchedAtET = ET_FMT.format(new Date());
  let r2Ok = 0, r2Skip = 0;

  for (const sym of SYMBOLS) {
    const feeds = {};
    for (const range of RANGES) {
      try {
        const bars = await fetchRange(sym, range);
        feeds[range] = {
          barCount: bars.length,
          firstBarET: bars[0]?.et || null,
          lastBarET: bars[bars.length - 1]?.et || null,
          bars
        };
      } catch (err) {
        feeds[range] = { error: err.message, bars: [] };
        console.error(`  ${sym} ${range}: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 250));
    }

    const snapshot = { symbol: sym, dateET, fetchedAtET, feeds };

    // local mirror
    const localDir = path.join(LOCAL_DIR, sym);
    fs.mkdirSync(localDir, { recursive: true });
    fs.writeFileSync(path.join(localDir, `${dateET}.json`), JSON.stringify(snapshot, null, 2));

    // R2
    const key = `Treasuries/yield-history/intraday-raw/${sym}/${dateET}.json`;
    const ok = await uploadToR2(key, snapshot);
    if (ok) r2Ok++; else r2Skip++;

    const c1 = feeds['1D']?.barCount ?? '-', c5 = feeds['5D']?.barCount ?? '-';
    console.log(`${sym.padEnd(10)} 1D=${String(c1).padStart(5)}  5D=${String(c5).padStart(5)}  last(1D)=${feeds['1D']?.lastBarET || '-'}  ${ok ? '-> R2' : '(local only)'}`);
  }

  console.log(`\nDate ${dateET} ET.  R2 uploaded: ${r2Ok}, R2 skipped (no creds): ${r2Skip}.  Local: ${path.relative(process.cwd(), LOCAL_DIR)}`);
}

main().catch(e => { console.error(e); process.exit(1); });
