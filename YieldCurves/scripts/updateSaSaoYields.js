// updateSaSaoYields.js — writes TIPS/YieldsSaSao.csv: the ask, SA and SAO yield of every
// TIPS quoted in the market-quote file. Spec: YieldCurves/knowledge/3.2_Seasonal_Adjustments.md,
// knowledge/DataStores.md#s10.
//
// Every parse and every calculation here comes from shared/src (no-redundancy directive,
// projects/CLAUDE.md §2a). What stays local is the choice of which store to read and which
// column of it to use.
//
// Run: node YieldCurves/scripts/updateSaSaoYields.js
import { uploadToR2 } from './r2.js';
import { yieldFromPrice } from '../../shared/src/bond-math.js';
import { calculateSAO } from '../../shared/src/spot-curve.js';
import { saFactorForDate, maturitySaFactor } from '../../shared/src/ref-cpi.js';
import { parseCsv } from '../../shared/src/csv.js';
import { localDate, toIsoDate, nextBusinessDay, parseHolidaySet } from '../../shared/src/settlement.js';
import { parseFidelityDownloadDate, fidelityDownloadDateIso, parseFidelityTipsRows } from '../../shared/src/fidelity-parse.js';

const R2_BASE_URL = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const FIDELITY_TIPS_URL = `${R2_BASE_URL}/Treasuries/FidelityTreasuriesTips.csv`;
const REF_CPI_URL = `${R2_BASE_URL}/TIPS/RefCpiNsaSa.csv`;
const HOLIDAYS_URL = `${R2_BASE_URL}/misc/BondHolidaysSifma.csv`;

async function main() {
  console.log(`Starting Market SA/SAO Yield update at ${new Date().toISOString()}`);

  // Fetch Fidelity TIPS
  console.log(`Fetching market data from ${FIDELITY_TIPS_URL}...`);
  const fidRes = await fetch(FIDELITY_TIPS_URL);
  if (!fidRes.ok) throw new Error(`Failed to fetch Fidelity TIPS: ${fidRes.status}`);
  const fidText = await fidRes.text();
  
  // Extract download date from footer
  const downloadDateStr = parseFidelityDownloadDate(fidText);
  if (!downloadDateStr) {
    console.log("Warning: Could not find download date in Fidelity TIPS footer. Using today.");
  }
  const downloadDate = downloadDateStr ? localDate(fidelityDownloadDateIso(downloadDateStr)) : new Date();

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
  const refCpiText = await refCpiRes.text();
  const refCpiData = parseCsv(refCpiText);

  // Parse Bonds — the same TIPS row parser the YieldCurves app reads this store with.
  const processed = parseFidelityTipsRows(fidText).map(r => {
    const { cusip, coupon, maturity, askPrice: price } = r;
    if (!maturity || isNaN(price) || isNaN(coupon)) return null;
    const maturityDate = localDate(maturity);
    if (!maturityDate) return null;

    const saS = saFactorForDate(refCpiData, settleDateStr);
    const saM = maturitySaFactor(refCpiData, maturity, settleDateStr);

    if (saS == null || saM == null) return null;

    const askYield = yieldFromPrice(price, coupon, settleDate, maturityDate);
    const saPrice = price * (saS / saM);
    const saYield = yieldFromPrice(saPrice, coupon, settleDate, maturityDate);

    if (askYield === null || saYield === null) return null;

    return { cusip, maturity, coupon, askYield, saYield, maturityDate, settlementDate: settleDateStr };
  }).filter(Boolean).sort((a, b) => a.maturityDate - b.maturityDate);

  console.log(`Processed ${processed.length} market TIPS bonds.`);

  // Apply SAO
  console.log("Applying SAO smoothing...");
  const smoothed = calculateSAO(processed);
  processed.forEach((b, i) => b.saoYield = smoothed[i]);

  // Generate CSV
  // NOTE: Coupon and Yields are written using the project's internal Decimal standard 
  // (e.g., 0.01 = 1%) to ensure compatibility with spreadsheet formulas and core logic.
  const header = "cusip,maturity,coupon,ask_yield,sa_yield,sao_yield";
  const lines = processed.map(b => 
    `${b.cusip},${b.maturity},${b.coupon.toFixed(7)},${b.askYield.toFixed(7)},${b.saYield.toFixed(7)},${b.saoYield.toFixed(7)}`
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
