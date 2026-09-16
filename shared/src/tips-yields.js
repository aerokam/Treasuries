// tips-yields.js -- calculates the TIPS yields of
// YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#calculate-tips-yields (3.1.7): the FedInvest TIPS
// rows of S1, the market quotes of S7, the daily Ref CPI and SA factors of S4, and one
// settlement date per source, combined into the security objects every process downstream of
// 3.1 works from.
//
// One implementation, imported by the YieldCurves page (YieldCurves/src/app.js) and by the
// acquisition job that publishes S13, S14 and S15 (YieldCurves/scripts/updateSpotYieldCurves.js),
// per the no-redundancy directive (projects/CLAUDE.md §2a). The two kept separate copies until
// 2026-09-13 and had diverged on the settlement date the market quotes are stated at.
import { yieldFromPrice } from './bond-math.js';
import { saFactorForDate, maturitySaFactor, refCpiNsaForDate, indexRatioNineDecimal } from './ref-cpi.js';
import { localDate } from './settlement.js';
import { yieldSpreadBps, priceSpreadPct } from './spreads.js';

// tipsRows        S1's TIPS rows, each carrying cusip, coupon, maturity, price, datedDateCpi
//                 and the settlementDate of the file it came from
// refCpiRows      S4, parsed
// quotesByCusip   S7's TIPS quotes by CUSIP (the rows of fidelity-parse.js#parseFidelityTipsRows),
//                 or null when the quoted source is not shown
// isBroker        true to price each security from its market quote, false to price it from S1
// marketSettleIso the settlement date the market quotes are stated at, 'YYYY-MM-DD', from
//                 3.1.6 -- the quote file's own date advanced by one bond trading day. Ignored
//                 when isBroker is false, where each row's own settlementDate is used.
// tipsRefByCusip  S2 (TIPS/TipsRef.csv) rows by CUSIP (market-data.js#parseTipsRefRows), giving
//                 each market-quote TIPS its dated date Ref CPI -- S7 doesn't carry it. Ignored
//                 when isBroker is false, where each row's own datedDateCpi is used.
//
// A security is dropped when it has no quote on the side being priced, when either SA factor
// is unavailable for its dates, or when its ask or SA yield cannot be calculated -- the same
// rule fidelity-parse.js#parseFidelityNominalRows applies to a nominal Treasury row.
//
// Index Ratio is calculated, not read: Ref CPI(settlement) / Ref CPI(dated date), rounded once,
// half up, to nine decimal places (knowledge/DFD_Worklist.md §3.12) -- not Treasury's
// truncate-6-round-5 rule (shared/src/ref-cpi.js#indexRatio), which matches no real quote. NaN
// when either Ref CPI is unavailable.
//
// Returns the securities in maturity order.
export function tipsYieldsFromPrices(tipsRows, refCpiRows, quotesByCusip, isBroker, marketSettleIso, tipsRefByCusip = null) {
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

    const saSettle = saFactorForDate(refCpiRows, settleDateStr);
    const saMature = maturitySaFactor(refCpiRows, bond.maturity, settleDateStr);
    if (saSettle == null || isNaN(saSettle) || saMature == null || isNaN(saMature)) return null;

    const settleDate = localDate(settleDateStr);
    const matureDate = localDate(bond.maturity);
    const saRatio = saSettle / saMature;   // SA clean price = price x saRatio (3.2_Seasonal_Adjustments)
    const askYield = yieldFromPrice(price, coupon, settleDate, matureDate);
    const saYield = yieldFromPrice(price * saRatio, coupon, settleDate, matureDate);
    if (askYield == null || isNaN(askYield) || saYield == null || isNaN(saYield)) return null;

    // Index Ratio: settlement Ref CPI from S4 (in hand for the SA factors above), dated date
    // Ref CPI from the bond's own S1 row (FedInvest) or from S2 by CUSIP (market quotes).
    const settleRefCpi = refCpiNsaForDate(refCpiRows, settleDateStr);
    const datedDateRefCpi = isBroker
      ? (tipsRefByCusip ? tipsRefByCusip.get(bond.cusip)?.datedDateRefCpi ?? null : null)
      : (bond.datedDateCpi != null && bond.datedDateCpi !== '' ? parseFloat(bond.datedDateCpi) : null);
    const indexRatio = indexRatioNineDecimal(settleRefCpi, datedDateRefCpi) ?? NaN;

    let bidPrice = NaN, bidYield = NaN, adjAskPrice = NaN, adjBidPrice = NaN;
    let yieldSpread = NaN, priceSpread = NaN;
    if (isBroker && quote) {
      bidPrice = quote.bidPrice;
      adjAskPrice = quote.adjAskPrice;
      adjBidPrice = quote.adjBidPrice;
      // Null where there is no bid price to calculate from; NaN is what the tables show as empty.
      bidYield = yieldFromPrice(bidPrice, coupon, settleDate, matureDate) ?? NaN;
      yieldSpread = yieldSpreadBps(askYield, bidYield);
      priceSpread = priceSpreadPct(adjAskPrice, adjBidPrice);
    }

    return {
      ...bond, coupon, price, saRatio, askYield, saYield, bidPrice, bidYield,
      adjAskPrice, adjBidPrice, indexRatio, yieldSpreadBps: yieldSpread, priceSpreadPct: priceSpread,
      maturityDate: matureDate, settlementDate: settleDateStr, isBroker,
    };
  }).filter(Boolean).sort((a, b) => a.maturityDate - b.maturityDate);
}
