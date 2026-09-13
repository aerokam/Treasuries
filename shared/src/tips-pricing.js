// tips-pricing.js -- assembles the priced TIPS of
// YieldCurves/knowledge/3.1_Load_And_Parse.md#price-the-tips (3.1.7): the FedInvest TIPS
// rows of S1, the market quotes of S7, the daily Ref CPI and SA factors of S4, and one
// settlement date per source, combined into the security objects every process downstream of
// 3.1 works from.
//
// One implementation, imported by the YieldCurves page (YieldCurves/src/app.js) and by the
// acquisition job that publishes S13, S14 and S15 (YieldCurves/scripts/updateSpotYieldCurves.js),
// per the no-redundancy directive (projects/CLAUDE.md §2a). The two kept separate copies until
// 2026-09-13 and had diverged on the settlement date the market quotes are stated at.
import { yieldFromPrice } from './bond-math.js';
import { saFactorForDate, maturitySaFactor } from './ref-cpi.js';
import { localDate } from './settlement.js';

// tipsRows        S1's TIPS rows, each carrying cusip, coupon, maturity, price and the
//                 settlementDate of the file it came from
// refCpiRows      S4, parsed
// quotesByCusip   S7's TIPS quotes by CUSIP (the rows of fidelity-parse.js#parseFidelityTipsRows),
//                 or null when the quoted source is not shown
// isBroker        true to price each security from its market quote, false to price it from S1
// marketSettleIso the settlement date the market quotes are stated at, 'YYYY-MM-DD', from
//                 3.1.6 -- the quote file's own date advanced by one bond trading day. Ignored
//                 when isBroker is false, where each row's own settlementDate is used.
//
// A security is dropped when it has no quote on the side being priced, when either SA factor
// is unavailable for its dates, or when its ask or SA yield cannot be calculated -- the same
// rule fidelity-parse.js#parseFidelityNominalRows applies to a nominal Treasury row.
//
// Returns the securities in maturity order.
export function priceTips(tipsRows, refCpiRows, quotesByCusip, isBroker, marketSettleIso) {
  return tipsRows.map(bond => {
    const coupon = parseFloat(bond.coupon);
    let price = parseFloat(bond.price);
    let settleDateStr = bond.settlementDate;
    let quote = null;

    if (isBroker) {
      if (!quotesByCusip || !quotesByCusip.has(bond.cusip)) return null;
      quote = quotesByCusip.get(bond.cusip);
      if (isNaN(quote.askPrice)) return null;
      price = quote.askPrice;
      settleDateStr = marketSettleIso;
    }
    if (!settleDateStr) return null;

    const saSettle = saFactorForDate(refCpiRows, settleDateStr);
    const saMature = maturitySaFactor(refCpiRows, bond.maturity, settleDateStr);
    if (saSettle == null || isNaN(saSettle) || saMature == null || isNaN(saMature)) return null;

    const settleDate = localDate(settleDateStr);
    const matureDate = localDate(bond.maturity);
    const saRatio = saSettle / saMature;   // SA clean price = price x saRatio (3.2_Seasonal_Adjustments)
    const askYield = yieldFromPrice(price, coupon, settleDate, matureDate);
    const saYield = yieldFromPrice(price * saRatio, coupon, settleDate, matureDate);
    if (askYield == null || isNaN(askYield) || saYield == null || isNaN(saYield)) return null;

    let bidPrice = NaN, bidYield = NaN, adjAskPrice = NaN, adjBidPrice = NaN;
    let indexRatio = NaN, yieldSpreadBps = NaN, priceSpreadPct = NaN;
    if (isBroker && quote) {
      bidPrice = quote.bidPrice;
      adjAskPrice = quote.adjAskPrice;
      adjBidPrice = quote.adjBidPrice;
      indexRatio = quote.indexRatio;
      // Null where there is no bid price to price from. Left as null it would pass the
      // numeric test below and publish the spread as the negative of the ask yield.
      bidYield = yieldFromPrice(bidPrice, coupon, settleDate, matureDate) ?? NaN;
      if (!isNaN(bidYield) && !isNaN(askYield)) yieldSpreadBps = (bidYield - askYield) * 10000;
      if (!isNaN(adjAskPrice) && !isNaN(adjBidPrice) && adjAskPrice > 0)
        priceSpreadPct = (adjAskPrice - adjBidPrice) / adjAskPrice * 100;
    }

    return {
      ...bond, coupon, price, saRatio, askYield, saYield, bidPrice, bidYield,
      adjAskPrice, adjBidPrice, indexRatio, yieldSpreadBps, priceSpreadPct,
      maturityDate: matureDate, settlementDate: settleDateStr, isBroker,
    };
  }).filter(Boolean).sort((a, b) => a.maturityDate - b.maturityDate);
}
