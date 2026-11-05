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

// Read the BLS release schedule of the Consumer Price Index and write it to R2 as
// bls/CpiReleaseSchedule.csv, replacing the previous contents.
//
// Usage:
//   node scripts/fetchCpiReleaseSchedule.js            -> uploads to R2
//   node scripts/fetchCpiReleaseSchedule.js --dry-run  -> prints the CSV, uploads nothing

const PAGE_URL = 'https://www.bls.gov/schedule/news_release/cpi.htm';
const R2_KEY = 'bls/CpiReleaseSchedule.csv';
const HEADER = 'Reference Month,Release Date,Release Time';
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const cellText = html => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// "Nov. 10, 2026" -> "2026-11-10"
function isoDate(text) {
  const m = text.match(/^([A-Za-z]{3})[A-Za-z]*\.?\s+(\d{1,2}),\s+(\d{4})$/);
  const month = m ? MONTHS.indexOf(m[1].toLowerCase()) + 1 : 0;
  if (!month) throw new Error(`Release Date not readable: "${text}"`);
  return `${m[3]}-${String(month).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

// The rows of the page's release table, ascending by Release Date.
export function parseCpiReleaseSchedule(html) {
  const table = html.match(/<table[^>]*class="release-list"[^>]*>([\s\S]*?)<\/table>/);
  if (!table) throw new Error('release table not found on the page');
  const body = table[1].match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
  const rows = [];
  for (const tr of (body ? body[1] : table[1]).matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c => cellText(c[1]));
    if (cells.length < 3) continue;
    rows.push({ referenceMonth: cells[0], releaseDate: isoDate(cells[1]), releaseTime: cells[2] });
  }
  if (rows.length === 0) throw new Error('release table has no rows');
  rows.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].releaseDate === rows[i - 1].releaseDate) throw new Error(`two rows share Release Date ${rows[i].releaseDate}`);
  }
  return rows;
}

export const toCsv = rows =>
  [HEADER, ...rows.map(r => `${r.referenceMonth},${r.releaseDate},${r.releaseTime}`)].join('\n') + '\n';

async function uploadToR2(key, body) {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!CLOUDFLARE_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw new Error('R2 credentials not set (CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET).');
  }
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: body, ContentType: 'text/csv' }));
  console.log(`Uploaded -> R2 ${R2_BUCKET}/${key}`);
}

async function main() {
  const res = await fetch(PAGE_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${PAGE_URL}`);
  const rows = parseCpiReleaseSchedule(await res.text());
  const csv = toCsv(rows);
  console.log(`${rows.length} releases, ${rows[0].releaseDate} to ${rows[rows.length - 1].releaseDate}`);
  if (process.argv.includes('--dry-run')) { console.log(csv); return; }
  await uploadToR2(R2_KEY, csv);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(err => { console.error(err); process.exitCode = 1; });
}
