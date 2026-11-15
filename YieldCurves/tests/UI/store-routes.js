// Routes the stores the app reads (YieldCurves/knowledge/3.1_Read_Yield_Curve_Data_Sets.md) to
// fixture text. The fixtures are written as the four stores Calculate yield curve data sets
// (knowledge/1.3_Calculate_Yield_Curve_Data_Sets.md) reads, and the three stores the app reads are
// built from them by shared/src/yield-curve-stores.js#buildYieldCurveStores, the writer the
// acquisition job runs, so a fixture has the layout and the values R2 would hold for that input.
import { buildYieldCurveStores } from '../../../shared/src/yield-curve-stores.js';

const QUOTES_HEADER = 'type,cusip,maturity,coupon,askPrice,bidPrice,adjAskPrice,adjBidPrice';

// yieldsText   FedInvest prices (S1): the Settlement Date line, then the header and rows
// refCpiText   Ref CPI (S4)
// holidayText  Bond holidays (S16)
// quotesText   Market quotes (S7): the Download Date line, then the header and rows. Omitted, or
//              only the Download Date line, the stores have no Market rows.
export function buildStores({ yieldsText, refCpiText, holidayText, quotesText }) {
  const settle = yieldsText.split(/\r?\n/)[0].trim();
  let quotes = quotesText || `${settle} 08:00`;
  if (!quotes.includes('\n')) quotes = `${quotes}\n${QUOTES_HEADER}`;
  return buildYieldCurveStores({ yieldsText, refCpiText, holidayText, quotesText: quotes });
}

// CMT rates (S24) and R-CMT rates (S25): two Dates, the latest 2026-03-25 (a Wednesday, settling
// 2026-03-26). The CMT has 1 Mo, 2 Mo, 2 Yr, 5 Yr, 10 Yr and 30 Yr; the R-CMT 5 Yr, 10 Yr and 30 Yr.
export const CMT_CSV = [
  'Date,1 Mo,1.5 Mo,2 Mo,3 Mo,4 Mo,6 Mo,1 Yr,2 Yr,3 Yr,5 Yr,7 Yr,10 Yr,20 Yr,30 Yr',
  '2026-03-24,0.0410,,0.0425,,,,,0.0486,,0.0494,,0.0510,,0.0540',
  '2026-03-25,0.0412,,0.0426,,,,,0.0488,,0.0498,,0.0515,,0.0547',
].join('\n') + '\n';
export const RCMT_CSV = [
  'Date,5 Yr,7 Yr,10 Yr,20 Yr,30 Yr',
  '2026-03-24,0.0264,,0.0286,,0.0322',
  '2026-03-25,0.0268,,0.0291,,0.0328',
].join('\n') + '\n';

export async function routeStores(page, inputs) {
  const s = buildStores(inputs);
  const csv = body => r => r.fulfill({ status: 200, contentType: 'text/csv', body });
  await page.route('**/Treasuries/YieldCurves.csv', csv(s.yieldCurvesCsv));
  await page.route('**/Treasuries/BreakevenInflation.csv', csv(s.breakevenCsv));
  await page.route('**/Treasuries/BidAskSpreads.csv', csv(s.spreadsCsv));
  await page.route('**/TIPS/GswTipsCurve.json', r => r.fulfill({ status: 404, body: '' }));  // GSW overlay: force snapshot fallback in tests
  await page.route('**/Treasuries/CmtRates.csv', csv(inputs.cmtText ?? CMT_CSV));
  await page.route('**/TIPS/RCmtRates.csv', csv(inputs.rcmtText ?? RCMT_CSV));
  await page.route('**/misc/BondHolidaysSifma.csv', csv(inputs.holidayText || ''));
  return s;
}
