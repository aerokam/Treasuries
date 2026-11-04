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

export async function routeStores(page, inputs) {
  const s = buildStores(inputs);
  const csv = body => r => r.fulfill({ status: 200, contentType: 'text/csv', body });
  await page.route('**/Treasuries/YieldCurves.csv', csv(s.yieldCurvesCsv));
  await page.route('**/Treasuries/BreakevenInflation.csv', csv(s.breakevenCsv));
  await page.route('**/Treasuries/BidAskSpreads.csv', csv(s.spreadsCsv));
  await page.route('**/TIPS/GswTipsCurve.json', r => r.fulfill({ status: 404, body: '' }));  // GSW overlay: force snapshot fallback in tests
  return s;
}
