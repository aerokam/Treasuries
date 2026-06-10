// probeLock.js — investigation probe (temporary).
// Goal: find WHEN CNBC locks the settled daily close. Through the trading day the daily/
// longer-range feeds' "today" bar TRACKS the live 1D value; overnight it freezes to the
// settled (~3PM benchmark) close. We don't want to guess that lock time — we measure it.
//
// Each run logs, per reference symbol, the 1D (intraday) latest vs the daily-feed "today"
// value for 6M (3Y, daily) and 5Y (10Y, weekly). While tracking, delta ≈ 0; when CNBC
// locks, the daily value freezes while 1D keeps moving and the delta jumps. Scheduled
// hourly from the 5PM ET close through the next morning (task `LockProbe`).
//
// References: US10YTIPS (real) + US10Y (nominal) — to check if they lock at the same time.
// Output (append): data/yields-history/lock-probe/lock-probe.csv  + same key on R2.

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const LOCAL_DIR = path.join(__dirname, '../data/yields-history/lock-probe');
const SYMBOLS = ['US10YTIPS', 'US10Y'];

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

async function lastBar(symbol, range) {
  const res = await fetch(buildUrl(symbol, range));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const bars = json?.data?.chartData?.priceBars || [];
  const b = bars[bars.length - 1];
  if (!b) return null;
  return { raw: String(b.tradeTime), val: parseFloat(String(b.close).replace('%', '')) };
}

async function uploadToR2(key, body, contentType) {
  const { CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!CLOUDFLARE_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) return false;
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: body, ContentType: contentType }));
  return true;
}

const fmt = n => (n == null || isNaN(n) ? '' : n.toFixed(4));
const dlt = (a, b) => (a == null || b == null || isNaN(a) || isNaN(b) ? '' : (a - b).toFixed(4));

async function main() {
  const fetchedAtET = ET_FMT.format(new Date());
  const rows = [];
  for (const symbol of SYMBOLS) {
    try {
      const [d1, d6m, d5y] = await Promise.all([lastBar(symbol, '1D'), lastBar(symbol, '6M'), lastBar(symbol, '5Y')]);
      const intradayET = d1 ? ET_FMT.format(parseT(d1.raw)) : '';
      rows.push([
        `"${fetchedAtET}"`, symbol,
        `"${intradayET}"`, fmt(d1?.val),
        d6m?.raw.slice(0, 8) || '', fmt(d6m?.val),
        d5y?.raw.slice(0, 8) || '', fmt(d5y?.val),
        dlt(d6m?.val, d1?.val), dlt(d5y?.val, d1?.val),
      ].join(','));
      console.log(`${symbol.padEnd(10)} 1D=${fmt(d1?.val)}  6M=${fmt(d6m?.val)} (Δ${dlt(d6m?.val, d1?.val)})  5Y=${fmt(d5y?.val)} (Δ${dlt(d5y?.val, d1?.val)})`);
    } catch (err) {
      console.error(`  ${symbol}: ${err.message}`);
    }
  }

  fs.mkdirSync(LOCAL_DIR, { recursive: true });
  const localFile = path.join(LOCAL_DIR, 'lock-probe.csv');
  if (!fs.existsSync(localFile)) {
    fs.writeFileSync(localFile, 'fetchedAtET,symbol,intraday_et,intraday_val,d6m_date,d6m_val,d5y_date,d5y_val,delta_6m,delta_5y\n');
  }
  fs.appendFileSync(localFile, rows.join('\n') + '\n');

  const csv = fs.readFileSync(localFile, 'utf8');
  const ok = await uploadToR2('Treasuries/yields-history/lock-probe/lock-probe.csv', csv, 'text/csv');
  console.log(`logged ${rows.length} rows @ ${fetchedAtET}  ${ok ? '(R2 synced)' : '(local only)'}`);
}

main().catch(e => { console.error(e); process.exit(1); });
