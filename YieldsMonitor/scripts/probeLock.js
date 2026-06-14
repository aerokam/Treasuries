// probeLock.js — investigation probe (temporary). See Close_Price_Investigation.md §3, §8.
// Goal: pin the WALL-CLOCK ET time at which CNBC revises a just-completed day's DAILY bar
// from its provisional live-tracked value to the final ~3PM benchmark close — so the app
// can lock "yesterday's" daily value in lockstep with cnbc.com (which reads this same feed).
//
// Mechanism: the 6M (daily) feed's current-day bar tracks the live price all day AND
// overnight; the just-completed day is revised to the ~3PM benchmark sometime overnight.
// Each run logs ONE ROW PER daily bar for the last N bars (keyed by bar_date), plus the
// live 1D latest. Keying by date — not by last/prev position — survives the ~01:00 ET
// rollover AND the feed's habit of intermittently dropping a recent completed day (§5).
// Post-hoc analysis: filter symbol+bar_date, order by fetchedAtET — the run where that
// date's value snaps to the benchmark and then stops moving is the revision time. While a
// bar still tracks live, (bar_val − live_val) ≈ 0; once frozen, live moves and Δ grows.
//
// Anchors: US10YTIPS (reliable TIPS ref) + US10Y (nominal). US5YTIPS is flaky (§6) — excluded.
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
const TAIL_BARS = 7;   // recent daily bars to log per run (covers current day + ~6 prior)

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

async function fetchBars(symbol, range) {
  const res = await fetch(buildUrl(symbol, range));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return (json?.data?.chartData?.priceBars || [])
    .map(b => ({ raw: String(b.tradeTime), val: parseFloat(String(b.close).replace('%', '')) }));
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
      // 6M = daily bars (per-weekday). 1D = live intraday (latest tick).
      const [daily, intraday] = await Promise.all([fetchBars(symbol, '6M'), fetchBars(symbol, '1D')]);
      const live = intraday[intraday.length - 1] || null;
      const liveET = live ? ET_FMT.format(parseT(live.raw)) : '';
      const tail = daily.slice(-TAIL_BARS);
      for (const bar of tail) {
        rows.push([
          `"${fetchedAtET}"`, symbol,
          bar.raw.slice(0, 8), fmt(bar.val),
          `"${liveET}"`, fmt(live?.val),
          dlt(bar.val, live?.val),
        ].join(','));
      }
      const summary = tail.slice(-2).map(b => `${b.raw.slice(0, 8)}=${fmt(b.val)}(Δlive ${dlt(b.val, live?.val)})`).join('  ');
      console.log(`${symbol.padEnd(10)} live=${fmt(live?.val)}  ${summary}`);
    } catch (err) {
      console.error(`  ${symbol}: ${err.message}`);
    }
  }

  fs.mkdirSync(LOCAL_DIR, { recursive: true });
  const localFile = path.join(LOCAL_DIR, 'lock-probe.csv');
  if (!fs.existsSync(localFile)) {
    fs.writeFileSync(localFile, 'fetchedAtET,symbol,bar_date,bar_val,live_et,live_val,delta_bar_live\n');
  }
  fs.appendFileSync(localFile, rows.join('\n') + '\n');

  const csv = fs.readFileSync(localFile, 'utf8');
  const ok = await uploadToR2('Treasuries/yields-history/lock-probe/lock-probe.csv', csv, 'text/csv');
  console.log(`logged ${rows.length} rows @ ${fetchedAtET}  ${ok ? '(R2 synced)' : '(local only)'}`);
}

main().catch(e => { console.error(e); process.exit(1); });
