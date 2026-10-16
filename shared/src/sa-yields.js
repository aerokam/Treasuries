// sa-yields.js -- the SA Price Factor and the SA Yield of
// YieldCurves/knowledge/3.2_Adjust_For_Seasonality.md (3.2), for the TIPS Yields of 3.1.7.
//
// One implementation, imported by the YieldCurves page (YieldCurves/src/app.js) and by the
// acquisition jobs that write S10 and S13 (YieldCurves/scripts/updateSaSaoYields.js,
// YieldCurves/scripts/updateSpotYieldCurves.js), per the no-redundancy directive
// (projects/CLAUDE.md §2a). The SA Factor lookups are shared/src/ref-cpi.js.
import { yieldFromPrice } from './bond-math.js';
import { saFactorForDate, maturitySaFactor } from './ref-cpi.js';
import { localDate } from './settlement.js';

// tipsYields  the securities of tips-yields.js#tipsYieldsFromPrices, each carrying price,
//             coupon, maturity, maturityDate and settlementDate
// refCpiRows  S4, parsed -- the SA Factors; null or empty when S4 could not be read
//
// Returns the same securities in the same order, each with saRatio (the SA Price Factor: the
// Settlement Date SA Factor over the Maturity SA Factor) and saYield (the yield of the price
// multiplied by it). A security whose SA Factors are unavailable, or whose SA Yield cannot be
// calculated, is kept with saRatio and saYield of NaN, and its other fields untouched.
export function saYieldsFromTipsYields(tipsYields, refCpiRows) {
  return tipsYields.map(tips => {
    const saSettle = refCpiRows && refCpiRows.length ? saFactorForDate(refCpiRows, tips.settlementDate) : null;
    const saMature = refCpiRows && refCpiRows.length ? maturitySaFactor(refCpiRows, tips.maturity, tips.settlementDate) : null;
    if (saSettle == null || isNaN(saSettle) || saMature == null || isNaN(saMature)) {
      return { ...tips, saRatio: NaN, saYield: NaN };
    }
    const saRatio = saSettle / saMature;   // SA clean price = price x saRatio (3.2_Adjust_For_Seasonality)
    const saYield = yieldFromPrice(tips.price * saRatio, tips.coupon, localDate(tips.settlementDate), tips.maturityDate);
    return { ...tips, saRatio, saYield: saYield == null || isNaN(saYield) ? NaN : saYield };
  });
}
