// Publishes the merged S5 (Migration_Plan.md step 8): replaces the object Treasuries/Auctions.csv in R2 with data/Auctions_merged_trial.csv.
// Run merge-trial.mjs first, so the file holds the latest rows of the new table.
// Run: node research/auction-results-source/publish-s5.mjs
// To restore: upload the copy Treasuries/backup/Auctions_2026-10-28_before-v2-names.csv as Treasuries/Auctions.csv.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { parseCsv } from '../../shared/src/csv.js';
import { S5_COLUMNS } from '../../shared/src/auction-results.js';

const root = new URL('../../', import.meta.url);
for (const line of fs.readFileSync(new URL('.env', root), 'utf8').split('\n')) {
  const m = line.match(/^\s*([^#\s][^=]*?)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const { upload } = await import(new URL('shared/upload.js', root));

const BASE = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const data = new URL('./data/', import.meta.url);
const merged = new URL('Auctions_merged_trial.csv', data);
const text = fs.readFileSync(merged, 'utf8');
const header = text.split('\n', 1)[0].split(',');
if (header.join() !== S5_COLUMNS.join()) throw new Error('the merged file does not hold the S5 columns');
const rows = parseCsv(text).length;
if (rows < 11165) throw new Error(`the merged file holds ${rows} rows, fewer than the 11,165 of the trial`);

const backup = await fetch(`${BASE}/Treasuries/backup/Auctions_2026-10-28_before-v2-names.csv`, { method: 'HEAD' });
if (!backup.ok) throw new Error('the copy of S5 made before the conversion is not in R2; nothing published');

fs.copyFileSync(merged, new URL('Auctions.csv', data));
await upload(new URL('Auctions.csv', data).pathname.replace(/^\/(\w:)/, '$1'), 'Treasuries');

const sha = b => createHash('sha256').update(b).digest('hex');
const live = Buffer.from(await (await fetch(`${BASE}/Treasuries/Auctions.csv`, { cache: 'no-store' })).arrayBuffer());
console.log(`${rows} rows published; R2 copy identical to the file: ${sha(live) === sha(fs.readFileSync(merged))}`);
