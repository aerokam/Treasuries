// YieldsMonitor - snapHistory.js
// One-time bootstrap then daily incremental updates for Treasury/TIPS yields.
// Design: One consolidated file per symbol. Bootstrap merges ALL, 10Y, and 3Y for max resolution.
// Daily updates append latest close. Browser stitches real-time 2D on top.

import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const SYMBOLS = [
  'US1YTIPS', 'US2YTIPS', 'US5YTIPS', 'US10YTIPS', 'US30YTIPS',
  'US1M', 'US2M', 'US3M', 'US6M', 'US1Y', 'US2Y', 'US5Y', 'US10Y', 'US30Y'
];

async function uploadToR2(key, body) {
  const { CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!CLOUDFLARE_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    console.warn(`  R2 credentials missing. Skipping upload for ${key}.`);
    return false;
  }
  try {
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    });
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET, Key: key, Body: JSON.stringify(body), ContentType: 'application/json'
    }));
    return true;
  } catch (err) {
    console.error(`  R2 Upload failed for ${key}: ${err.message}`);
    return false;
  }
}

async function getExistingFromR2(key) {
  const { CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!CLOUDFLARE_ACCOUNT_ID) return null;
  try {
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    });
    const res = await s3.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    const streamToString = (stream) => new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
    return JSON.parse(await streamToString(res.Body));
  } catch (err) {
    if (err.name === 'NoSuchKey') return null;
    console.warn(`  Failed to fetch existing R2 data for ${key}: ${err.message}`);
    return null;
  }
}

function buildUrl(symbol, timeRange) {
  const base = "https://webql-redesign.cnbcfm.com/graphql";
  const params = {
    operationName: "getQuoteChartData",
    variables: JSON.stringify({ symbol, timeRange }),
    extensions: JSON.stringify({
      persistedQuery: {
        version: 1,
        sha256Hash: "9e1670c29a10707c417a1efd327d4b2b1d456b77f1426e7e84fb7d399416bb6b"
      }
    })
  };
  return base + "?" + Object.entries(params).map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
}

async function fetchRange(sym, range) {
  const res = await fetch(buildUrl(sym, range));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return (json?.data?.chartData?.priceBars || []).map(bar => ({
    x: bar.tradeTime,
    y: parseFloat(typeof bar.close === "string" ? bar.close.replace('%','') : bar.close)
  })).filter(p => p.x && !isNaN(p.y));
}

function mergePoints(existing, incoming) {
  const map = new Map();
  existing.forEach(p => map.set(p.x, p.y));
  incoming.forEach(p => map.set(p.x, p.y)); // Newer data overwrites on same timestamp
  return Array.from(map.entries())
    .map(([x, y]) => ({ x, y }))
    .sort((a, b) => a.x.localeCompare(b.x));
}

async function snap() {
  // Today in ET as compact YYYYMMDD. We only persist *completed* trading days, so the
  // current (provisional) day is skipped until it closes and is fetched the next run.
  const todayET = new Date()
    .toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    .replace(/-/g, '');

  for (const sym of SYMBOLS) {
    const r2Key = `Treasuries/yield-history/${sym}_history.json`;
    console.log(`Updating ${sym}...`);

    // 1. Load Existing History or Bootstrap
    let history = await getExistingFromR2(r2Key);

    if (!history || history.length === 0) {
      console.log(`  Bootstrapping history (merging multiple ranges for resolution)...`);
      try {
        // Fetch ranges with decreasing resolution
        // 5D: 5m, 1M: 3d?, 3M: 3d?, 6M: 3d?, 1Y: 3d?, 5Y: 8d, ALL: Monthly
        const ranges = ['ALL', '5Y', '1Y', '6M', '3M', '1M', '5D'];
        const results = await Promise.all(ranges.map(r => fetchRange(sym, r).catch(() => [])));

        history = [];
        results.forEach(pts => {
          history = mergePoints(history, pts);
        });
        console.log(`  Bootstrap complete. ${history.length} points total.`);
      } catch (err) {
        console.error(`  Bootstrap failed for ${sym}: ${err.message}`);
        continue;
      }
    }

    // 2. Incremental daily-close append.
    // CNBC tradeTime is a compact "YYYYMMDDHHMMSS" string; daily-close bars are stamped
    // at midnight ("...000000"). We pull the daily feed and append every completed
    // trading day newer than what we already have.
    //
    // NOTE: do NOT derive closes from the 5D intraday feed — it is 24h-continuous with
    // no reliable 17:00 ET close bar, and a feed-format change (loss of the "T"/colon
    // separators the old parser relied on) silently stopped all appends. The browser
    // already stitches live intraday on top of this daily baseline.
    const lastHistTime = history[history.length - 1].x;
    let daily = [];
    try {
      daily = await fetchRange(sym, '3M');
    } catch (err) {
      console.error(`  Daily fetch failed for ${sym}: ${err.message}`);
      continue;
    }

    const newCloses = daily.filter(p =>
      p.x.slice(8) === '000000' &&   // daily-close bar (midnight stamp)
      p.x > lastHistTime &&          // newer than what we have stored
      p.x.slice(0, 8) < todayET      // completed days only (skip provisional same-day)
    );

    if (newCloses.length > 0) {
      history = mergePoints(history, newCloses);
      console.log(`  Appended ${newCloses.length} new daily close(s) for ${sym}.`);
      await uploadToR2(r2Key, history);
    } else {
      console.log(`  No new data to append.`);
    }

    await new Promise(r => setTimeout(r, 500));
  }
}

snap().catch(console.error);
