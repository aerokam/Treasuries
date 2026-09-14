// Load .env from repo root if present (local dev); does not override GH Actions env vars
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseHolidaySet } from '../shared/src/settlement.js';
import { parseCsv } from '../shared/src/csv.js';
import {
  FEDINVEST_TYPES, parseFedInvestPriceRows, parseTipsRefMap,
  selectPricedSecurity, yieldForSecurity, serializeS1,
} from '../shared/src/fedinvest-prices.js';
const _envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.env');
if (existsSync(_envPath)) {
  readFileSync(_envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#\s][^=]*?)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
}

// Fetch Treasury prices from FedInvest, merge TIPS with TipsRef.csv metadata, calculate yields.
// Types written: TIPS, MARKET BASED BILL, MARKET BASED NOTE, MARKET BASED BOND (excludes FRN).
// Writes YieldsFromFedInvestPrices.csv to R2: row 1 = settlement date, row 2 = header, rows 3+ = data.
//
// Usage: node getYieldsFedInvest.js
// Prices published once daily at ~1pm ET on FedInvest; scheduled job runs at 1:05pm ET,
// retrying every 10 min for 2h (setup-windows-tasks.ps1) if today's prices aren't posted
// yet. Skips cleanly (exit 0, no retry) on bond market holidays.

const FEDINVEST_URL = 'https://www.treasurydirect.gov/GA-FI/FedInvest/todaySecurityPriceDetail';

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

// ─── Date helpers ─────────────────────────────────────────────────────────────
// Today's date in ET (handles EDT/EST automatically)
function todayET() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // YYYY-MM-DD
}

// ─── FedInvest price fetch ────────────────────────────────────────────────────
async function fetchPrices() {
  const months = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};

  // GET HTML first (also carries the session cookie the CSV POST now requires — see below)
  const htmlRes = await fetch(FEDINVEST_URL);
  if (!htmlRes.ok) throw new Error(`FedInvest HTML HTTP ${htmlRes.status}`);
  const html = await htmlRes.text();

  // No "Prices For:" in the page means prices aren't published yet (weekend, holiday, before 1 PM ET)
  if (!html.includes('Prices For:')) {
    console.error('FedInvest: prices not available.');
    return null;
  }

  // As of ~Aug 2026, TreasuryDirect added Spring Security CSRF protection to the CSV-export
  // POST: it now requires the page's `_csrf` token in the body, and (contrary to an earlier,
  // now-obsolete requirement) actively rejects the request if the URL carries a `;jsessionid=`
  // matrix parameter. Rather than hardcode field names (TD has already renamed at least one —
  // priceDateDay → priceDate, per a report from another user hitting this same endpoint), parse
  // the live `CSVFormat` <form> out of the HTML and submit exactly the fields/action it declares.
  const setCookies = htmlRes.headers.getSetCookie();
  const cookieHeader = setCookies.map(c => c.split(';')[0]).join('; ');

  const formMatch = html.match(/<form[^>]*id="CSVFormat"[^>]*>([\s\S]*?)<\/form>/i);
  if (!formMatch) throw new Error('FedInvest: could not find CSVFormat form in HTML response');
  const actionMatch = html.match(/<form[^>]*id="CSVFormat"[^>]*action="([^"]+)"/i);
  if (!actionMatch) throw new Error('FedInvest: CSVFormat form has no action attribute');

  const fields = {};
  for (const inputTag of formMatch[1].matchAll(/<input[^>]*name="([^"]+)"[^>]*>/gi)) {
    const valueMatch = inputTag[0].match(/value="([^"]*)"/);
    fields[inputTag[1]] = valueMatch ? valueMatch[1] : '';
  }

  const csvUrl = new URL(actionMatch[1], FEDINVEST_URL).toString();
  const csvRes = await fetch(csvUrl, {
    method: 'POST',
    headers: { Cookie: cookieHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields),
  });
  if (!csvRes.ok) throw new Error(`FedInvest CSV HTTP ${csvRes.status}`);
  const text = await csvRes.text();

  // Handle both "2026 Mar 23" and "Mar 23, 2026" formats
  const m1 = html.match(/Prices For:\s+(\d{4})\s+(\w{3})\s+(\d+)/);
  const m2 = html.match(/Prices For:\s+(\w{3})\s+(\d+),\s+(\d{4})/);

  let y, mon, d;
  if (m1) {
    [ , y, mon, d] = m1;
  } else if (m2) {
    [ , mon, d, y] = m2;
  } else {
    throw new Error('Could not parse settlement date from FedInvest response');
  }
  const settleDateStr = `${y}-${String(months[mon] + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const rows = parseFedInvestPriceRows(text).filter(r => FEDINVEST_TYPES.has(r.type));

  return { rows, settleDateStr };
}

// spec: 1.1_Download_FedInvest_Prices.md#determine-settlement-date
// 1.1.1: produces S1's settlement date from E1's `Prices For:` line (T+0 — see the spec for
// why this is T+0 rather than T+1), gated by the bond-holiday check and the
// date-is-not-today check. Returns { settleDateStr, priceRows } on success, or null when
// this run has nothing to write and should exit cleanly with no retry (bond holiday, or the
// page has no `Prices For:` line yet — weekend or before FedInvest posts). Sets
// process.exitCode = 1 (no throw) so the caller's retry-on-failure task scheduling
// (Data_Pipeline.md §2.0) picks the run back up later when the page still shows a stale date.
async function determineSettlementDate(today, holidaySet) {
  if (holidaySet.has(today)) {
    console.error(`Bond market holiday (${today}) — no FedInvest prices today.`);
    return null;
  }

  const priceResult = await fetchPrices();
  if (priceResult === null) return null; // no "Prices For:" line yet — clean exit
  const { rows: priceRows, settleDateStr } = priceResult;
  if (priceRows.length === 0) throw new Error('No price data found from FedInvest');
  console.error(`Settlement date: ${settleDateStr}`);

  if (settleDateStr !== today) {
    console.error(`FedInvest still showing ${settleDateStr} (today is ${today} ET) — not ready yet.`);
    process.exitCode = 1;
    return null;
  }

  return { settleDateStr, priceRows };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const R2_BASE = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
  const R2_BASE_URL = `${R2_BASE}/TIPS`;

  // Bond market holidays — proceeds unchecked (as before) if the fetch itself fails.
  const today = todayET();
  const holidayRes = await fetch(`${R2_BASE}/misc/BondHolidaysSifma.csv`);
  const holidays = holidayRes.ok
    ? parseHolidaySet(parseCsv(await holidayRes.text(), false))
    : new Set();

  // Fetch FedInvest prices (today's latest available) and determine the settlement date.
  // Runs before S2 is read, so a holiday, a missing "Prices For:" line or a stale date all
  // end the run without ever touching S2 (1.1.1's no-retry cases stay no-retry).
  console.error('Fetching prices from FedInvest...');
  const settlement = await determineSettlementDate(today, holidays);
  if (settlement === null) return; // holiday / not yet published / stale — clean exit or retry
  const { settleDateStr, priceRows } = settlement;

  // Read TipsRef.csv (S2) for TIPS dated-date CPI / coupon / maturity metadata
  console.error('Fetching TipsRef.csv from R2...');
  const refRes = await fetch(`${R2_BASE_URL}/TipsRef.csv`);
  if (!refRes.ok) throw new Error(`Failed to fetch TipsRef.csv from R2: ${refRes.status}`);
  const refMap = parseTipsRefMap(await refRes.text());

  // Select TIPS and Treasury prices, and calculate yields
  const rows = [];
  for (const row of priceRows) {
    const security = selectPricedSecurity(row, refMap);
    if (!security) continue; // TIPS with no S2 metadata — dropped
    const yld = yieldForSecurity(security, settleDateStr);
    rows.push({ ...security, yield: yld });
  }

  // Write standardized and legacy keys to R2
  const content = serializeS1(settleDateStr, rows, (y) => (y != null ? y.toFixed(8) : ''));

  await uploadToR2('Treasuries/YieldsFromFedInvestPrices.csv', content);

  const typeCounts = rows.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {});
  for (const [type, count] of Object.entries(typeCounts)) console.error(`  ${type}: ${count}`);
}

main().catch(err => { console.error(err); process.exit(1); });
