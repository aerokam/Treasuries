// Turns the raw quote download into Market quotes (S7) and uploads it. The raw download never
// leaves this machine: only the columns S7 states are kept, and the raw file is deleted once its
// derived file is on R2.
//
// spec: knowledge/1.2_Download_Market_Quotes.md
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { uploadToR2 } from './r2.js';
import { marketQuotesFromExport } from './marketQuotesFromExport.js';
import { parseTipsQuotes } from '../../shared/src/market-quotes.js';

const RAW_NAME = 'MarketQuotesExport.csv';
const R2_KEY = 'Treasuries/MarketQuotes.csv';

// A real capture carries the whole outstanding TIPS universe (50+ rows); a browser-automation
// glitch (page not finished loading, filter not applied, session dropped mid-scrape) instead
// saves just the export's header and boilerplate -- syntactically a valid CSV, so nothing
// upstream catches it, but zero actual bonds. Found 2026-09-28: exactly this happened on a
// scheduled run, uploaded anyway (0 rows), and silently overwrote a good prior capture in R2
// with nothing -- every app reading Market quotes (S7) then failed to load. This floor is
// deliberately well below the real count and well above zero, so it only catches a broken
// capture, never a genuinely smaller-than-usual (but real) universe.
const MIN_TIPS_ROWS = 10;

const rawPath = path.join(os.homedir(), 'Downloads', RAW_NAME);

if (!fs.existsSync(rawPath)) {
  console.error(`No download found at ${rawPath}`);
  process.exit(1);
}

let derived;
try {
  derived = marketQuotesFromExport(fs.readFileSync(rawPath, 'utf8'));
} catch (err) {
  console.error(`Refusing to upload: ${err.message}. R2's existing data is left unchanged.`);
  process.exit(1);
}

// The count is taken from the derived text through the same parser the apps use, so it measures
// what an app would read.
const tipsRowCount = parseTipsQuotes(derived.text).length;
if (tipsRowCount < MIN_TIPS_ROWS) {
  console.error(`Refusing to upload (downloaded ${derived.stamp}): only ${tipsRowCount} TIPS rows found (need at least ${MIN_TIPS_ROWS}) -- looks like a broken capture. R2's existing data is left unchanged.`);
  process.exit(1);
}

console.log(`Uploading Market quotes (downloaded ${derived.stamp}, ${tipsRowCount} TIPS rows, ${derived.treasuryCount} Treasury rows) -> ${R2_KEY}`);
await uploadToR2(R2_KEY, derived.text);
fs.unlinkSync(rawPath);

const { execSync } = await import('child_process');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log('Triggering SA/SAO Yield refresh...');
try {
  execSync(`node "${path.join(__dirname, 'updateSaSaoYields.js')}"`, { stdio: 'inherit' });
} catch (err) {
  console.error('Failed to refresh SA/SAO Yields:', err.message);
}
