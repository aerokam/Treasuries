// Load .env from repo root if present (local dev); does not override GH Actions env vars
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mergeAuctionRows, fillFromTreasuryDirect, TD_COLUMNS } from '../shared/src/auction-results.js';
const _envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.env');
if (existsSync(_envPath)) {
  readFileSync(_envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#\s][^=]*?)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
}

// Fetch all Treasury auction data from FiscalData (all fields), store in R2 as Auctions.csv.
//
// First run (no existing file): fetches all auctions since 1980-01-01.
// Subsequent runs: fetches last 30 days, merges by cusip+auction_date (new data wins).
// Every run then fills the columns FiscalData has not yet stated from TreasuryDirect (last 30 days).
//
// Scheduled at 11:35 AM ET and 1:05 PM ET on weekdays (after comp close at 11:30 AM and 1:00 PM ET).

const FISCALDATA_URL = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query';
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

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = splitLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
  return { headers, rows };
}

function splitLine(line) {
  const out = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
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

// Union of two header arrays, preserving order
function unionHeaders(h1, h2) {
  const seen = new Set(h1);
  return [...h1, ...h2.filter(h => !seen.has(h))];
}

// ── FiscalData fetch ──────────────────────────────────────────────────────────
const PAGE_SIZE = 10000; // FiscalData's max is 10000; larger values return HTTP 400

async function fetchAuctions(sinceDate) {
  // No &fields= param → returns all available columns
  console.error(`Fetching FiscalData auctions since ${sinceDate}...`);
  let headers = [];
  const rows = [];
  for (let page = 1; ; page++) {
    const url = `${FISCALDATA_URL}?format=csv&page[size]=${PAGE_SIZE}&page[number]=${page}&filter=auction_date:gte:${sinceDate}&sort=-auction_date,security_term`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`FiscalData HTTP ${r.status}`);
    const { headers: pageHeaders, rows: pageRows } = parseCSV(await r.text());
    if (pageRows.length === 0) break;
    headers = unionHeaders(headers, pageHeaders);
    rows.push(...pageRows);
    if (pageRows.length < PAGE_SIZE) break;
  }
  return { headers, rows };
}

// ── TreasuryDirect fetch ──────────────────────────────────────────────────────
async function fetchTreasuryDirect(days) {
  const r = await fetch(`${TREASURYDIRECT_URL}?format=json&days=${days}`);
  if (!r.ok) throw new Error(`TreasuryDirect HTTP ${r.status}`);
  return r.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Try to load existing data from R2
  let existingHeaders = [];
  let existingRows = [];
  let sinceDate;

  console.error('Checking for existing Auctions.csv in R2...');
  const existingRes = await fetch(`${R2_BASE_URL}/${R2_KEY}`);
  if (existingRes.ok) {
    ({ headers: existingHeaders, rows: existingRows } = parseCSV(await existingRes.text()));
    console.error(`Loaded ${existingRows.length} existing rows from R2`);
    // Fetch last 30 days to catch new auctions
    const d = new Date();
    d.setDate(d.getDate() - WINDOW_DAYS);
    sinceDate = d.toISOString().substring(0, 10);
  } else {
    console.error('No existing file found — seeding from 1980-01-01');
    sinceDate = '1980-01-01';
  }

  const { headers: newHeaders, rows: newRows } = await fetchAuctions(sinceDate);
  if (newRows.length === 0 && existingRows.length === 0)
    throw new Error('No auction data retrieved and no existing data — aborting');

  const headers = unionHeaders(unionHeaders(existingHeaders, newHeaders), TD_COLUMNS);
  const { rows: merged, added } = mergeAuctionRows(existingRows, newRows);
  console.error(`Merge: ${added} new rows added (${newRows.length} fetched, ${existingRows.length} existing)`);

  let tdRows = [];
  try {
    tdRows = await fetchTreasuryDirect(WINDOW_DAYS);
  } catch (err) {
    console.error(`TreasuryDirect unavailable, writing FiscalData rows only: ${err.message}`);
  }
  const { rows: filledRows, filled, added: tdAdded } = fillFromTreasuryDirect(merged, headers, tdRows);
  console.error(`TreasuryDirect: ${tdRows.length} auctions read, ${filled} rows filled, ${tdAdded} rows added`);

  const csvBody = toCSV(headers, filledRows);
  await uploadToR2('Treasuries/Auctions.csv', csvBody);
}

main().catch(err => { console.error(err); process.exit(1); });
