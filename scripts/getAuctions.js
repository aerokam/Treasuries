// Load .env from repo root if present (local dev); does not override GH Actions env vars
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseCsv } from '../shared/src/csv.js';
import { mergeAuctionRows, fillFromTreasuryDirect, rowFromNewTable, S5_COLUMNS } from '../shared/src/auction-results.js';
const _envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.env');
if (existsSync(_envPath)) {
  readFileSync(_envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#\s][^=]*?)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
}

// Fetch the Treasury auctions of the last 30 days from FiscalData (all fields), merge them into the rows of
// Auctions.csv in R2 by CUSIP and auction date (new data wins), fill what FiscalData states as null from
// TreasuryDirect, and write Auctions.csv back when its rows changed.
//
// Auctions.csv must exist and hold the columns of treasury_securities_auctions_v2; a run that finds anything else
// ends with an error and writes nothing. Rules: knowledge/1.4_Fetch_Auction_Results.md.
//
// Scheduled at 11:35 AM ET and 1:05 PM ET on weekdays (after comp close at 11:30 AM and 1:00 PM ET),
// each repeated every 10 minutes for 25 minutes.

const FISCALDATA_URL = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/treasury_securities_auctions_v2';
const R2_KEY = 'Treasuries/Auctions.csv';
const R2_BASE_URL = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const TREASURYDIRECT_URL = 'https://www.treasurydirect.gov/TA_WS/securities/auctioned';
const WINDOW_DAYS = 30;

// ── R2 upload ─────────────────────────────────────────────────────────────────
async function uploadToR2(key, body) {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!CLOUDFLARE_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET)
    throw new Error('Cloudflare R2 credentials not found in environment variables');

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });

  await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: body, ContentType: 'text/csv' }));
  const rows = body.trim().split('\n').length - 1;
  console.error(`Wrote ${rows} rows → R2 bucket "${R2_BUCKET}", key "${key}"`);
}

// ── CSV writer ────────────────────────────────────────────────────────────────
function toCSV(headers, rows) {
  const esc = v => (String(v).includes(',') || String(v).includes('"') || String(v).includes('\n'))
    ? `"${String(v).replace(/"/g, '""')}"` : String(v);
  return [
    headers.join(','),
    ...rows.map(r => headers.map(h => esc(r[h] ?? '')).join(',')),
  ].join('\n') + '\n';
}

// ── FiscalData fetch ──────────────────────────────────────────────────────────
const PAGE_SIZE = 10000; // FiscalData's max is 10000; larger values return HTTP 400

// JSON, not CSV: FiscalData's CSV writes an apostrophe before a negative number.
async function fetchAuctions(sinceDate) {
  // No &fields= param → returns all available columns
  console.error(`Fetching FiscalData auctions since ${sinceDate}...`);
  const rows = [];
  for (let page = 1; ; page++) {
    const url = `${FISCALDATA_URL}?page[size]=${PAGE_SIZE}&page[number]=${page}&filter=comp_auction_close_date:gte:${sinceDate}&sort=-comp_auction_close_date,security_term`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`FiscalData HTTP ${r.status}`);
    const { data } = await r.json();
    if (data.length === 0) break;
    rows.push(...data.map(rowFromNewTable));
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

// ── TreasuryDirect fetch ──────────────────────────────────────────────────────
async function fetchTreasuryDirect(days) {
  const r = await fetch(`${TREASURYDIRECT_URL}?format=json&days=${days}`);
  if (!r.ok) throw new Error(`TreasuryDirect HTTP ${r.status}`);
  return r.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.error('Reading Auctions.csv from R2...');
  const existingRes = await fetch(`${R2_BASE_URL}/${R2_KEY}`);
  if (!existingRes.ok) throw new Error(`Auctions.csv not found in R2 (HTTP ${existingRes.status}); restore it from a copy, nothing is seeded`);
  const existingText = await existingRes.text();
  const existingHeaders = existingText.split(/\r?\n/, 1)[0].split(',');
  const missing = S5_COLUMNS.filter(c => !existingHeaders.includes(c));
  if (missing.length > 0) throw new Error(`Auctions.csv lacks the columns of treasury_securities_auctions_v2 (${missing.length} missing, the first ${missing.slice(0, 3).join(', ')}); nothing written`);
  const existingRows = parseCsv(existingText);
  console.error(`Loaded ${existingRows.length} existing rows from R2`);

  const d = new Date();
  d.setDate(d.getDate() - WINDOW_DAYS);
  const sinceDate = d.toISOString().substring(0, 10);

  let newRows = [];
  try {
    newRows = await fetchAuctions(sinceDate);
  } catch (err) {
    console.error(`FiscalData unavailable: ${err.message}`);
  }

  const headers = [...existingHeaders, ...newRows.flatMap(r => Object.keys(r)).filter((c, i, all) => !existingHeaders.includes(c) && all.indexOf(c) === i)];
  const { rows: merged, added } = mergeAuctionRows(existingRows, newRows);
  console.error(`Merge: ${added} new rows added (${newRows.length} fetched, ${existingRows.length} existing)`);

  let tdRows = [];
  try {
    tdRows = await fetchTreasuryDirect(WINDOW_DAYS);
  } catch (err) {
    console.error(`TreasuryDirect unavailable, writing FiscalData rows only: ${err.message}`);
  }
  const fill = fillFromTreasuryDirect(merged, headers, tdRows);
  console.error(`TreasuryDirect: ${tdRows.length} auctions read, ${fill.filled} rows filled, ${fill.added} rows added`);

  const csvBody = toCSV(headers, fill.rows);
  if (csvBody === existingText.replace(/\r\n/g, '\n')) {
    console.error('Auctions.csv unchanged: not uploaded');
    return;
  }
  await uploadToR2(R2_KEY, csvBody);
}

main().catch(err => { console.error(err); process.exit(1); });
