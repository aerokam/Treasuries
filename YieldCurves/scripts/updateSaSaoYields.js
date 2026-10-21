// updateSaSaoYields.js — writes TIPS/YieldsSaSao.csv: the ask, SA and SAO yield of every
// TIPS quoted in the market-quote file. Spec: YieldCurves/knowledge/3.2_Adjust_For_Seasonality.md,
// knowledge/DATA_DICTIONARY.md#s10.
//
// Every parse and every calculation here comes from shared/src (no-redundancy directive,
// projects/CLAUDE.md §2a). What stays local is the choice of which store to read and which
// column of it to use.
//
// Run: node YieldCurves/scripts/updateSaSaoYields.js
import { uploadToR2 } from './r2.js';
import { tipsYieldsFromPrices } from '../../shared/src/tips-yields.js';
import { saYieldsFromTipsYields } from '../../shared/src/sa-yields.js';
import { calculateSAO } from '../../shared/src/spot-curve.js';
import { parseCsv } from '../../shared/src/csv.js';
import { localDate, toIsoDate, nextBusinessDay, parseHolidaySet } from '../../shared/src/settlement.js';
import { parseDownloadDate, downloadDateIso, parseTipsQuotes } from '../../shared/src/market-quotes.js';

const R2_BASE_URL = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const MARKET_QUOTES_URL = `${R2_BASE_URL}/Treasuries/MarketQuotes.csv`;
const REF_CPI_URL = `${R2_BASE_URL}/TIPS/RefCpiNsaSa.csv`;
const HOLIDAYS_URL = `${R2_BASE_URL}/misc/BondHolidaysSifma.csv`;

async function main() {
  console.log(`Starting Market SA/SAO Yield update at ${new Date().toISOString()}`);

  // Fetch Market quotes (S7)
  console.log(`Fetching market data from ${MARKET_QUOTES_URL}...`);
  const quotesRes = await fetch(MARKET_QUOTES_URL);
  if (!quotesRes.ok) throw new Error(`Failed to fetch Market quotes: ${quotesRes.status}`);
  const quotesText = await quotesRes.text();

  // Download Date from the first line
  const downloadDateStr = parseDownloadDate(quotesText);
  if (!downloadDateStr) {
    console.log("Warning: Could not find the Download Date in Market quotes. Using today.");
  }
  const downloadDate = downloadDateStr ? localDate(downloadDateIso(downloadDateStr)) : new Date();

  // Fetch Holidays for T+1 settlement
  console.log(`Fetching holidays from ${HOLIDAYS_URL}...`);
  const holidayRes = await fetch(HOLIDAYS_URL);
  let holidaySet = new Set();
  if (holidayRes.ok) holidaySet = parseHolidaySet(parseCsv(await holidayRes.text(), false));
  console.log(`Bond market closure dates loaded: ${holidaySet.size}`);

  const settleDate = nextBusinessDay(downloadDate, holidaySet);
  const settleDateStr = toIsoDate(settleDate);
  console.log(`Market settlement date (T+1): ${settleDateStr}`);

  // Parse RefCPI
  console.log(`Fetching SA factors from ${REF_CPI_URL}...`);
  const refCpiRes = await fetch(REF_CPI_URL);
  if (!refCpiRes.ok) throw new Error(`Failed to fetch SA factors: ${refCpiRes.status}`);
  const refCpiText = await refCpiRes.text();
  const refCpiData = parseCsv(refCpiText);

  // Parse Bonds — the same TIPS row parser the YieldCurves app reads this store with, then the
  // same two calculations: the TIPS yields (3.1.7) and the SA Yield (3.2).
  const quotesByCusip = new Map(parseTipsQuotes(quotesText)
    .filter(r => r.maturity && !isNaN(r.askPrice))
    .map(r => [r.cusip, r]));
  const processed = saYieldsFromTipsYields(
    tipsYieldsFromPrices(null, quotesByCusip, true, settleDateStr), refCpiData);

  console.log(`Processed ${processed.length} market TIPS bonds.`);

  // Apply SAO
  console.log("Applying SAO smoothing...");
  const smoothed = calculateSAO(processed);
  processed.forEach((b, i) => b.saoYield = smoothed[i]);

  // Generate CSV
  // NOTE: Coupon and Yields are written using the project's internal Decimal standard 
  // (e.g., 0.01 = 1%) to ensure compatibility with spreadsheet formulas and core logic.
  // A TIPS with no SA Yield (3.2) has blank sa_yield and sao_yield cells.
  const fix7 = v => Number.isFinite(v) ? v.toFixed(7) : '';
  const header = "cusip,maturity,coupon,ask_yield,sa_yield,sao_yield";
  const lines = processed.map(b => 
    `${b.cusip},${b.maturity},${b.coupon.toFixed(7)},${b.askYield.toFixed(7)},${fix7(b.saYield)},${fix7(b.saoYield)}`
  );
  const csvContent = [header, ...lines].join('\n') + '\n';

  // Upload to R2. Read by TipsLadderManager (shared/src/market-data.js) and
  // FundHoldings (enrichHoldings.js); also published as a public resource for
  // folks building their own spreadsheets. (Restored 2026-06-01; the 2026-05-21
  // R2 cleanup wrongly classified it as an orphan write and removed it.)
  console.log("Uploading to R2: TIPS/YieldsSaSao.csv");
  await uploadToR2('TIPS/YieldsSaSao.csv', csvContent);

  console.log("Update complete.");
}

main().catch(err => {
  console.error("Error in SA/SAO update script:", err);
  process.exit(1);
});
