import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REF_CPI_PATH = path.join(__dirname, '../data/RefCpiNsaSa.csv');

function loadRefCpi() {
  const content = fs.readFileSync(REF_CPI_PATH, 'utf8');
  const lines = content.trim().split('\n').slice(1);
  return lines.map(line => {
    const [date, nsa, sa, factor] = line.split(',');
    return { date, factor: parseFloat(factor) };
  });
}

function findFactor(rows, mmdd) {
  // Finds the most recent factor for a given MM-DD
  const match = rows.find(r => r.date.includes(`-${mmdd}`));
  return match || null;
}

function verify() {
  const rows = loadRefCpi();
  
  // User's examples:
  // Settlement factor for "today" (3/19 or 3/20): 0.99508
  // Maturity factor for "apr 2026 tips": 0.99677 (Maturity is 2026-04-15)

  console.log("--- Factor Verification ---");
  
  const settle0319 = findFactor(rows, "03-19");
  console.log(`Searching for 03-19 (Settlement): Found ${settle0319?.date} -> ${settle0319?.factor}`);

  const settle0320 = findFactor(rows, "03-20");
  console.log(`Searching for 03-20 (Settlement): Found ${settle0320?.date} -> ${settle0320?.factor}`);

  const mature0415 = findFactor(rows, "04-15");
  console.log(`Searching for 04-15 (Maturity):   Found ${mature0415?.date} -> ${mature0415?.factor}`);

  const mature0414 = findFactor(rows, "04-14");
  console.log(`Searching for 04-14 (Maturity):   Found ${mature0414?.date} -> ${mature0414?.factor}`);

  console.log("\nNote: factors depend on the data in RefCpiNsaSa.csv.");
}

verify();
