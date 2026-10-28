// Load .env from repo root if present (local dev); does not override GH Actions env vars
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

// Fetch per-bond dated date Ref CPI (ref_cpi_on_orig_dated_date) for all TIPS from Treasury FiscalData
// Usage: node fetchTipsRef.js [CUSIP]
//   No arg  → merges the TIPS of treasury_securities_auctions_v2 into TIPS/TipsRef.csv on R2
//   CUSIP   → prints just that bond's dated date Ref CPI
// Spec: knowledge/1.6_Fetch_TIPS_Reference_Data.md

import { TIPS_REF_V2_FIELDS, tipsRefFromV2, mergeTipsRef, tipsRefCsv } from '../shared/src/tips-ref.js';
import { parseCsv } from '../shared/src/csv.js';

// reopening:eq:No gives one row per unique TIPS. v2 states only the auctions since 2025-12-29.
const URL = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/treasury_securities_auctions_v2' +
  '?format=json&sort=maturity_date' +
  '&filter=inflation_protected:eq:Yes,reopening:eq:No' +
  '&fields=' + TIPS_REF_V2_FIELDS.join(',') +
  '&page[number]=1&page[size]=150';

const R2_BASE_URL = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const R2_KEY = 'TIPS/TipsRef.csv';

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

async function fetchTipsRef() {
  console.error('Fetching TIPS dated date Ref CPI from Treasury FiscalData...');
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  const rows = tipsRefFromV2(json.data);
  console.error(`${json.data.length} records, ${rows.length} with an interest rate and dated date Ref CPI stated`);
  return rows;
}

// The rows already on R2: v2 does not state the TIPS auctioned before 2025-12-29.
async function loadStored() {
  const res = await fetch(`${R2_BASE_URL}/${R2_KEY}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} reading the stored ${R2_KEY}; v2 alone cannot rebuild it`);
  return parseCsv(await res.text());
}

async function main() {
  const arg = process.argv[2];
  const rows = await fetchTipsRef();
  const stored = await loadStored();

  if (arg) {
    // Diagnostic lookup for a single CUSIP
    const row = mergeTipsRef(stored, rows).find(r => r.cusip === arg.toUpperCase());
    if (!row) {
      console.error(`CUSIP ${arg} not found.`);
      process.exit(1);
    }
    console.log(`CUSIP:      ${row.cusip}`);
    console.log(`Maturity:   ${row.maturity}`);
    console.log(`Dated date: ${row.datedDate}`);
    console.log(`Coupon:     ${(Number(row.coupon) * 100).toFixed(3)}%`);
    console.log(`Dated Date Ref CPI: ${Number(row.datedDateRefCpi).toFixed(5)}`);
  } else {
    // Merge into TipsRef.csv on R2
    const merged = mergeTipsRef(stored, rows);
    console.error(`${stored.length} stored rows, ${merged.length} after the merge`);
    const body = tipsRefCsv(merged);
    await uploadToR2('TIPS/TipsRef.csv', body);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
