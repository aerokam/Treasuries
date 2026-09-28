// spec: 1.2_Download_Market_Quotes.md
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { uploadToR2 } from './r2.js';
import { parseFidelityTipsRows } from '../../shared/src/fidelity-parse.js';

const FILES = [
  { name: 'FidelityTreasuriesTips.csv', r2Key: 'Treasuries/FidelityTreasuriesTips.csv' },
];

// A real capture carries the whole outstanding TIPS universe (50+ rows); a browser-automation
// glitch (page not finished loading, filter not applied, session dropped mid-scrape) instead
// saves just the export's header and Fidelity's legal boilerplate -- syntactically a valid CSV,
// so nothing upstream catches it, but zero actual bonds. Found 2026-09-28: exactly this happened
// on a scheduled run, uploaded anyway (0 rows), and silently overwrote a good prior capture in
// R2 with nothing -- every app reading Market quotes (S7) then failed to load. This floor is
// deliberately well below the real count and well above zero, so it only catches a broken capture,
// never a genuinely smaller-than-usual (but real) universe.
const MIN_TIPS_ROWS = 10;

const downloadsDir = path.join(os.homedir(), 'Downloads');

function extractDownloadDate(content) {
  const match = content.match(/Date downloaded\s+([\d/]+ [\d:]+ [AP]M)/i);
  return match ? match[1] : 'unknown';
}

let uploaded = 0;
let rejected = 0;

for (const { name, r2Key } of FILES) {
  const filePath = path.join(downloadsDir, name);

  if (!fs.existsSync(filePath)) {
    console.log(`Skipped (not found): ${filePath}`);
    continue;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const content = raw.replace(/="([^"]+)"/g, '$1');
  const downloadDate = extractDownloadDate(content);

  const tipsRowCount = parseFidelityTipsRows(content).length;
  if (tipsRowCount < MIN_TIPS_ROWS) {
    console.error(`Refusing to upload ${name} (downloaded ${downloadDate}): only ${tipsRowCount} TIPS rows found (need at least ${MIN_TIPS_ROWS}) -- looks like a broken capture. R2's existing data is left untouched.`);
    rejected++;
    continue;
  }

  console.log(`Uploading ${name} (downloaded ${downloadDate}, ${tipsRowCount} TIPS rows) → ${r2Key}`);
  await uploadToR2(r2Key, content);
  uploaded++;
  }

  if (uploaded > 0) {
  const { execSync } = await import('child_process');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  console.log("Triggering SA/SAO Yield refresh...");
  try {
    execSync(`node "${path.join(__dirname, 'updateSaSaoYields.js')}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error("Failed to refresh SA/SAO Yields:", err.message);
  }
  }

  if (uploaded === 0) {
  console.error(rejected > 0
    ? `${rejected} file(s) rejected as broken captures; nothing uploaded.`
    : `No Fidelity files found in ${downloadsDir}`);
  process.exit(1);
}
