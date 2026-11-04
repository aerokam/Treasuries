// updateYieldCurveDataSets.js — writes the three stores of knowledge/1.3_Calculate_Yield_Curve_Data_Sets.md:
// Yield curves (S13), Breakeven inflation (S14) and Bid and ask spreads (S15)
// (knowledge/DATA_DICTIONARY.md#s13, #s14, #s15).
//
// Loads the same R2 inputs the browser app loads (YieldsFromFedInvestPrices.csv,
// RefCpiNsaSa.csv, BondHolidaysSifma.csv, MarketQuotes.csv). Every calculation and the layout of
// the three files are in shared/src/ — shared/src/yield-curve-stores.js#buildYieldCurveStores is
// pure (texts in, texts out); this script fetches the inputs and uploads the outputs
// (Single Source of Truth, projects/CLAUDE.md §2a).
//
// Writes three files under Treasuries/:
//   Treasuries/YieldCurves.csv        — S13: security rows (Ask/SA/SAO and the SA working values)
//                                        then spot rows (nominal / TIPS quoted / TIPS SA spot
//                                        yields and spot BEI on a term grid)
//   Treasuries/BreakevenInflation.csv — S14: per-TIPS Ask/SA/SAO breakeven vs. nearest nominal
//   Treasuries/BidAskSpreads.csv      — S15: per-security broker bid/ask yield & price spread
//
// Run: node YieldCurves/scripts/updateYieldCurveDataSets.js  [--dry]

import { uploadToR2 } from './r2.js';
import { buildYieldCurveStores } from '../../shared/src/yield-curve-stores.js';

const R2_BASE_URL = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const YIELDS_CSV_URL = `${R2_BASE_URL}/Treasuries/YieldsFromFedInvestPrices.csv`;
const REF_CPI_CSV_URL = `${R2_BASE_URL}/TIPS/RefCpiNsaSa.csv`;
const HOLIDAYS_CSV_URL = `${R2_BASE_URL}/misc/BondHolidaysSifma.csv`;
const MARKET_QUOTES_URL = `${R2_BASE_URL}/Treasuries/MarketQuotes.csv`;

const DRY = process.argv.includes('--dry');

const fetchText = (url, what) => fetch(url, { cache: 'no-cache' })
  .then(r => { if (!r.ok) throw new Error(`${what} fetch failed: ${r.status}`); return r.text(); });

async function main() {
  console.log(`Starting yield curve data sets update at ${new Date().toISOString()}`);

  const [yieldsText, refCpiText, holidayText, quotesText] = await Promise.all([
    fetchText(YIELDS_CSV_URL, 'Yields'),
    fetchText(REF_CPI_CSV_URL, 'RefCPI'),
    fetchText(HOLIDAYS_CSV_URL, 'Holidays'),
    fetchText(MARKET_QUOTES_URL, 'Market quotes'),
  ]);

  const { yieldCurvesCsv, breakevenCsv, spreadsCsv } = buildYieldCurveStores({
    yieldsText, refCpiText, holidayText, quotesText,
    log: m => console.log(m), warn: m => console.warn(m),
  });

  if (DRY) {
    console.log('--dry: not uploading. Sample output:');
    console.log(yieldCurvesCsv.split('\n').slice(0, 10).join('\n'));
    console.log(breakevenCsv.split('\n').slice(0, 5).join('\n'));
    console.log(spreadsCsv.split('\n').slice(0, 5).join('\n'));
    return;
  }

  await uploadToR2('Treasuries/YieldCurves.csv', yieldCurvesCsv);
  await uploadToR2('Treasuries/BreakevenInflation.csv', breakevenCsv);
  await uploadToR2('Treasuries/BidAskSpreads.csv', spreadsCsv);
  console.log('Update complete.');
}

main().catch(err => {
  console.error('Error in yield curve data sets update:', err);
  process.exit(1);
});
