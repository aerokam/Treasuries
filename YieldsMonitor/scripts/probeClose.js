// probeClose.js — investigation probe (temporary).
// Logs the LAST bar of the CNBC 1D feed for one reference symbol, with the wall-clock
// fetch time, so we can pin down WHEN the 17:05 ET consolidation print reliably posts.
// Scheduled to run every 15 min starting 17:05 ET; once the posting time is known we can
// retire this and set updateYieldsHistory's run time accordingly.
//
// Reference symbol: US10YTIPS (10Y TIPS) — chosen for reliability. Do NOT use US5YTIPS;
// the 5Y TIPS feed is flaky (sparse/irregular prints) and must not be depended on.
//
// Output (append): data/yields-history/close-probe/{symbol}.csv  + same key on R2.

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const LOCAL_DIR = path.join(__dirname, '../data/yields-history/close-probe');

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

async function main() {
  const symbol = process.argv[2] || 'US10YTIPS';
  const res = await fetch(buildUrl(symbol, '1D'));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const bars = json?.data?.chartData?.priceBars || [];
  const last = bars[bars.length - 1];
  const fetchedAtET = ET_FMT.format(new Date());
  const lastBarET = last ? ET_FMT.format(parseT(last.tradeTime)) : '';
  const close = last ? last.close : '';
  const row = `"${fetchedAtET}","${last?.tradeTime || ''}","${lastBarET}","${close}",${bars.length}\n`;

  fs.mkdirSync(LOCAL_DIR, { recursive: true });
  const localFile = path.join(LOCAL_DIR, `${symbol}.csv`);
  if (!fs.existsSync(localFile)) {
    fs.writeFileSync(localFile, 'fetchedAtET,lastBarRaw,lastBarET,close,barCount\n');
  }
  fs.appendFileSync(localFile, row);

  const csv = fs.readFileSync(localFile, 'utf8');
  const ok = await uploadToR2(`Treasuries/yields-history/close-probe/${symbol}.csv`, csv, 'text/csv');

  console.log(`${symbol}  fetched ${fetchedAtET}  ->  lastBar ${lastBarET}  close ${close}  ${ok ? '(R2 synced)' : '(local only)'}`);
}

main().catch(e => { console.error(e); process.exit(1); });
