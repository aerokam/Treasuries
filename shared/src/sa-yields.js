// sa-yields.js -- the SA Price Factor and the SA Yield of
// YieldCurves/knowledge/3.2_Adjust_For_Seasonality.md (3.2), for the TIPS Yields of 3.1.7.
//
// One implementation, imported by the YieldCurves page (YieldCurves/src/app.js) and by the
// acquisition job that writes S13 (YieldCurves/scripts/updateYieldCurveDataSets.js), per the no-redundancy directive
// (projects/CLAUDE.md §2a). The SA Factor lookups are shared/src/ref-cpi.js.
import { yieldFromPrice } from './bond-math.js';
import { saFactorForDate, maturitySaFactors } from './ref-cpi.js';
import { localDate } from './settlement.js';

// tipsYields  the securities of tips-yields.js#tipsYieldsFromPrices, each carrying price,
//             coupon, maturity, maturityDate and settlementDate
// refCpiRows  S4, parsed -- the SA Factors; null or empty when S4 could not be read
//
// Returns the same securities in the same order, each with the working values of the SA Yield:
//   saSettleFactor         the Settlement Date SA Factor
//   saNaiveMaturityFactor  the Naive Maturity SA Factor
//   saMaturityFactor       the Maturity SA Factor, the one saRatio uses
//   saRatio                the SA Price Factor: the Settlement Date SA Factor over the Maturity SA Factor
//   saPrice                the SA Price: the price multiplied by saRatio
//   saYield                the yield of saPrice
// A security whose SA Factors are unavailable, or whose SA Yield cannot be calculated, is kept
// with saRatio and saYield of NaN, and its other fields untouched. Each working value that
// could not be determined is NaN, and saPrice is NaN wherever saRatio is.
export function saYieldsFromTipsYields(tipsYields, refCpiRows) {
  const haveRows = !!(refCpiRows && refCpiRows.length);
  return tipsYields.map(tips => {
    const saSettle = haveRows ? saFactorForDate(refCpiRows, tips.settlementDate) : null;
    const maturity = haveRows ? maturitySaFactors(refCpiRows, tips.maturity, tips.settlementDate) : null;
    const saNaive = maturity ? maturity.naive : null;
    const saMature = maturity ? maturity.maturity : null;
    const working = {
      saSettleFactor: saSettle == null ? NaN : saSettle,
      saNaiveMaturityFactor: saNaive == null ? NaN : saNaive,
      saMaturityFactor: saMature == null ? NaN : saMature,
    };
    if (saSettle == null || isNaN(saSettle) || saMature == null || isNaN(saMature)) {
      return { ...tips, ...working, saRatio: NaN, saPrice: NaN, saYield: NaN };
    }
    const saRatio = saSettle / saMature;   // SA clean price = price x saRatio (3.2_Adjust_For_Seasonality)
    const saPrice = tips.price * saRatio;
    const saYield = yieldFromPrice(saPrice, tips.coupon, localDate(tips.settlementDate), tips.maturityDate);
    return { ...tips, ...working, saRatio, saPrice, saYield: saYield == null || isNaN(saYield) ? NaN : saYield };
  });
}
