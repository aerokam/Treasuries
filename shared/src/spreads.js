// spreads.js -- the bid and ask spreads of
// YieldCurves/knowledge/3.6_Calculate_Bid_And_Ask_Spreads.md (3.6), for one security quoted
// on both sides.
//
// One implementation, imported by shared/src/tips-yields.js, the YieldCurves page
// (YieldCurves/src/app.js) and the acquisition job that publishes S15
// (YieldCurves/scripts/updateSpotYieldCurves.js), per the no-redundancy directive
// (projects/CLAUDE.md §2a). Three copies of both formulas existed until 2026-09-14.

// Yield spread, in basis points: the bid yield less the ask yield. NaN unless both are finite
// numbers. A yield that could not be calculated is null, and null passes a test for NaN.
export function yieldSpreadBps(askYield, bidYield) {
  return Number.isFinite(askYield) && Number.isFinite(bidYield)
    ? (bidYield - askYield) * 10000
    : NaN;
}

// Price spread, as a percentage of the ask price: the ask price less the bid price, over the
// ask price. A TIPS is passed its adjusted prices, a nominal Treasury its prices.
export function priceSpreadPct(askPrice, bidPrice) {
  return Number.isFinite(askPrice) && Number.isFinite(bidPrice) && askPrice > 0
    ? (askPrice - bidPrice) / askPrice * 100
    : NaN;
}
