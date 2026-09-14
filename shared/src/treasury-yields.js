// treasury-yields.js -- calculates the Treasury yields of
// YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md#calculate-treasury-yields (3.1.8)
// for the nominal Treasuries of S1: each yield from the row's clean price at the settlement
// date the file states. The nominal Treasuries quoted in S7 are calculated in
// fidelity-parse.js#parseFidelityNominalRows, in the same pass as their parse.
//
// One implementation, imported by the YieldCurves page (YieldCurves/src/app.js) and by the
// acquisition job that publishes S13 (YieldCurves/scripts/updateSpotYieldCurves.js), per the
// no-redundancy directive (projects/CLAUDE.md §2a). The two kept separate copies until
// 2026-09-14.
import { yieldFromPrice } from './bond-math.js';
import { localDate } from './settlement.js';

// rows  S1's nominal rows, each carrying cusip, type, coupon, maturity, price and the
//       settlementDate of the file it came from
//
// A row is dropped when its yield cannot be calculated. Order is the order of the rows.
export function treasuryYieldsFromPrices(rows) {
  return rows.map(r => {
    const price = parseFloat(r.price);
    const coupon = parseFloat(r.coupon);
    const maturityDate = localDate(r.maturity);
    const yld = yieldFromPrice(price, coupon, localDate(r.settlementDate), maturityDate);
    if (yld == null || isNaN(yld)) return null;
    return { ...r, coupon, price, yield: yld, maturityDate };
  }).filter(Boolean);
}
