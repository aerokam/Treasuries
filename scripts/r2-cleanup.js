// One-time cleanup: delete orphaned and stale R2 objects.
// Run once after deploying the script patches that stopped orphan writes.
// Usage: node scripts/r2-cleanup.js

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

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const YIELD_HISTORY_SYMBOLS = [
  'US1YTIPS', 'US2YTIPS', 'US5YTIPS', 'US10YTIPS', 'US30YTIPS',
  'US1M', 'US2M', 'US3M', 'US6M', 'US1Y', 'US2Y', 'US5Y', 'US10Y', 'US30Y',
];

const KEYS_TO_DELETE = [
  // Orphan writes — never read by any app
  'Treasuries/RefCPI.csv',
  'TIPS/Auctions.csv',
  'TIPS/YieldsFromFedInvestPrices.csv',
  'TIPS/YieldsSaSao.csv',
  ...YIELD_HISTORY_SYMBOLS.map(s => `TIPS/yield-history/${s}_history.json`),

  // Stale legacy files — no current reader or writer
  'TIPS/Yields.csv',
  'TIPS/TipsYields.csv',
  'Treasuries/TipsYields.csv',
  'TIPS/RefCpiNsaSa.csv',

  // Confirmed deletes from audit clarification
  'misc/TIPS_SAO.csv',
  'misc/BondMarketHolidays.csv',
  'bls/CpiReleaseSchedule2024.csv',

  // TipsRef consolidated to TIPS/ — Treasuries/ copy now unused
  'Treasuries/TipsRef.csv',
];

async function deleteFromR2(s3, bucket, key) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  console.log(`Deleted: ${key}`);
}

async function main() {
  const { CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!CLOUDFLARE_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET)
    throw new Error('Cloudflare R2 credentials not found in environment variables');

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });

  console.log(`Deleting ${KEYS_TO_DELETE.length} objects from R2 bucket "${R2_BUCKET}"...`);
  for (const key of KEYS_TO_DELETE) {
    await deleteFromR2(s3, R2_BUCKET, key);
  }
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
