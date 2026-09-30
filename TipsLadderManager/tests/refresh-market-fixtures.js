// Keeps the market-data test fixtures current. They are not committed: every file the app reads from
// R2 is downloaded into tests/e2e/market/ (gitignored) before a test run, so the suites see the TIPS
// that are outstanding today, today's quotes, a Ref CPI series that reaches today's settlement date,
// and the current SA yields. A committed copy would age with every maturity and month-end.
//
// Only TIPS rows are kept from the two yield files, which also carry Treasuries the app never reads
// here. If R2 cannot be reached the run fails: stale data passing as current is the failure this
// exists to prevent.
import { mkdirSync, writeFileSync, renameSync, statSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { R2_ROOT } from '../../shared/src/market-data.js';

export const MARKET_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'e2e', 'market');

const keepTipsRows = (text) => {
  const lines = text.split(/\r?\n/);
  const out = lines.filter((l, i) => i === 0 || /^TIPS,/.test(l) || /^Date downloaded/.test(l));
  return out.join('\n') + '\n';
};
// FedInvest: line 1 is the settlement date, line 2 the header, then one row per security.
const keepFedInvestTips = (text) => {
  const lines = text.split(/\r?\n/);
  return [lines[0], lines[1], ...lines.slice(2).filter(l => /^TIPS,/.test(l))].join('\n') + '\n';
};

// fixture name -> [R2 path, transform]
const SOURCES = {
  'FidelityTreasuriesTips.csv': ['Treasuries/FidelityTreasuriesTips.csv', keepTipsRows],
  'YieldsFromFedInvestPrices.csv': ['Treasuries/YieldsFromFedInvestPrices.csv', keepFedInvestTips],
  'RefCPI.csv': ['TIPS/RefCPI.csv', t => t],
  'TipsRef.csv': ['TIPS/TipsRef.csv', t => t],
  'YieldsSaSao.csv': ['TIPS/YieldsSaSao.csv', t => t],
  'BondHolidaysSifma.csv': ['misc/BondHolidaysSifma.csv', t => t],
};
export const MARKET_FILES = new Set(Object.keys(SOURCES));

// Re-downloads unless every file was written within maxAgeMs (several suites start in quick
// succession, and R2 data moves at most daily).
export async function refreshMarketFixtures({ maxAgeMs = 30 * 60 * 1000 } = {}) {
  mkdirSync(MARKET_DIR, { recursive: true });
  const fresh = Object.keys(SOURCES).every(name => {
    const p = path.join(MARKET_DIR, name);
    return existsSync(p) && Date.now() - statSync(p).mtimeMs < maxAgeMs;
  });
  if (fresh) return;
  for (const [name, [r2Path, transform]] of Object.entries(SOURCES)) {
    let res;
    try { res = await fetch(`${R2_ROOT}/${r2Path}`, { cache: 'no-cache' }); }
    catch (e) { throw new Error(`Cannot refresh test fixtures: ${r2Path} unreachable (${e.message}). Stale fixtures are not used.`); }
    if (!res.ok) throw new Error(`Cannot refresh test fixtures: ${r2Path} returned HTTP ${res.status}.`);
    const dest = path.join(MARKET_DIR, name);
    writeFileSync(dest + '.tmp', transform(await res.text()));
    renameSync(dest + '.tmp', dest);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await refreshMarketFixtures({ maxAgeMs: 0 });
  console.log('Market fixtures refreshed in ' + MARKET_DIR);
}
