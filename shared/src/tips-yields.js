// tips-yields.js -- calculates the TIPS yields of
// YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#calculate-tips-yields (3.1.7): the FedInvest TIPS
// rows of S1 or the market quotes of S7, and one settlement date per source, combined into the
// security objects every process downstream of 3.1 works from.
//
// This function produces the Ask Yield and the Bid Yield and nothing else. The SA Price Factor and
// the SA Yield are produced by 3.2 (shared/src/sa-yields.js#saYieldsFromTipsYields), the Index
// Ratio by 3.1.9 (shared/src/ref-cpi.js#tipsIndexRatios) and the spreads by 3.6
// (shared/src/spreads.js), each from the output of this one.
//
// One implementation, imported by the YieldCurves page (YieldCurves/src/app.js) and by the
// acquisition jobs that write S10, S13, S14 and S15 (YieldCurves/scripts/updateSaSaoYields.js,
// YieldCurves/scripts/updateSpotYieldCurves.js), per the no-redundancy directive
// (projects/CLAUDE.md §2a). The page and the job kept separate copies until 2026-09-13 and had
// diverged on the settlement date the market quotes are stated at.
import { yieldFromPrice } from './bond-math.js';
import { localDate } from './settlement.js';

// tipsRows        S1's TIPS rows, each carrying cusip, coupon, maturity, price and the
//                 settlementDate of the file it came from
// quotesByCusip   S7's TIPS quotes by CUSIP (the rows of fidelity-parse.js#parseFidelityTipsRows),
//                 or null when the quoted source is not shown
// isBroker        true to price each security from its market quote, false to price it from S1
// marketSettleIso the settlement date the market quotes are stated at, 'YYYY-MM-DD', from
//                 3.1.6 -- the quote file's own date advanced by one bond trading day. Ignored
//                 when isBroker is false, where each row's own settlementDate is used.
//
// A security is dropped when it has no price on the side being priced, no settlement date, or an
// ask yield that cannot be calculated -- the same rule
// fidelity-parse.js#parseFidelityNominalRows applies to a nominal Treasury row. A market quote
// with no bid price, or whose bid yield cannot be calculated, keeps its ask yield and has a bid
// yield of NaN. The adjusted ask and bid prices of a market quote pass through as quoted; for a
// FedInvest row they are NaN.
//
// Returns the securities in maturity order.
export function tipsYieldsFromPrices(tipsRows, quotesByCusip, isBroker, marketSettleIso) {
  const source = isBroker ? Array.from(quotesByCusip ? quotesByCusip.values() : []) : tipsRows;
  return source.map(row => {
    const bond = isBroker ? { cusip: row.cusip, coupon: row.coupon, maturity: row.maturity } : row;
    const coupon = parseFloat(bond.coupon);
    let price = parseFloat(bond.price);
    let settleDateStr = bond.settlementDate;
    let quote = null;

    if (isBroker) {
      quote = row;
      if (isNaN(quote.askPrice)) return null;
      price = quote.askPrice;
      settleDateStr = marketSettleIso;
    }
    if (!settleDateStr) return null;

    const settleDate = localDate(settleDateStr);
    const matureDate = localDate(bond.maturity);
    const askYield = yieldFromPrice(price, coupon, settleDate, matureDate);
    if (askYield == null || isNaN(askYield)) return null;

    let bidPrice = NaN, bidYield = NaN, adjAskPrice = NaN, adjBidPrice = NaN;
    if (isBroker && quote) {
      bidPrice = quote.bidPrice;
      adjAskPrice = quote.adjAskPrice;
      adjBidPrice = quote.adjBidPrice;
      // Null where there is no bid price to calculate from; NaN is what the tables show as empty.
      bidYield = yieldFromPrice(bidPrice, coupon, settleDate, matureDate) ?? NaN;
    }

    return {
      ...bond, coupon, price, askYield, bidPrice, bidYield,
      adjAskPrice, adjBidPrice,
      maturityDate: matureDate, settlementDate: settleDateStr, isBroker,
    };
  }).filter(Boolean).sort((a, b) => a.maturityDate - b.maturityDate);
}
