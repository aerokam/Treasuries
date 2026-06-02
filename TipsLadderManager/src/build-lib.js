// TIPS Ladder Builder — Build from Scratch
// Pure computation only — no Node.js I/O, no file system, no CLI.
//
// Entry point: runBuild({ dara, lastYear, tipsMap, refCPI, settlementDate })

import { fmtDate } from './rebalance-lib.js';
import { bondCalcs, calculateMDuration, rungAmount, calcMktWtdAvg } from '../../shared/src/bond-math.js';
import { sizeLadder } from './ladder-core.js';

export const MAX_LAST_YEAR = 2066;

// ─── Main entry point ──────────────────────────────────────────────────────────
// Inputs:
//   dara           — number (required)
//   lastYear       — number (last fiscal year to fund)
//   tipsMap        — Map from buildTipsMapFromYields()
//   refCPI         — number
//   settlementDate — Date (firstYear is derived as settlementDate.getFullYear())
//
// Bond selection: latest-to-mature TIPS within each fiscal year.
// Lower bracket: latest TIPS bond maturing before the first gap year.
// Upper bracket: always 2040.
//
// Returns: { results, HDR, summary }
// Spec: knowledge/3.0_TIPS_Ladders.md and knowledge/4.0_TIPS_Ladder_Rebalancing.md §Full Rebalance
// Variable naming note: fundedYearQty, excessQty, costPerBond (harmonized) — see §Code Variable Mapping
export function runBuild({ dara, firstYear: firstYearOpt, lastYear, tipsMap, refCPI, settlementDate, maturityPref = 'last', preLadderInterest = false, daraByYear = null }) {
  const firstYear      = firstYearOpt ?? settlementDate.getFullYear();
  const settleDateDisp = fmtDate(settlementDate);
  const settlementYear = settlementDate.getFullYear();

  // 1. Build yearBondMap: for each year in [firstYear, lastYear],
  //    pick the latest-maturing TIPS that matures after settlement.
  const yearBondMap = {};
  for (const bond of tipsMap.values()) {
    if (!bond.maturity || bond.maturity <= settlementDate) continue;
    const yr = bond.maturity.getFullYear();
    if (yr < firstYear || yr > lastYear) continue;
    if (!yearBondMap[yr] || (maturityPref === 'first' ? bond.maturity < yearBondMap[yr].maturity : bond.maturity > yearBondMap[yr].maturity))
      yearBondMap[yr] = bond;
  }

  let rangeYears = Object.keys(yearBondMap).map(Number).sort((a, b) => a - b);

  // Find the maximum year with actual TIPS data
  let maxTipsYear = 0;
  for (const bond of tipsMap.values()) {
    if (bond.maturity) maxTipsYear = Math.max(maxTipsYear, bond.maturity.getFullYear());
  }

  // Gap years: within actual TIPS range but no TIPS issued.
  // Future 30Y years: beyond maxTipsYear (hypothetical, covered by future 30Y cover pair).
  const gapYears = [], future30yYears = [];
  for (let y = firstYear; y <= lastYear; y++) {
    if (!yearBondMap[y]) {
      if (y > maxTipsYear) future30yYears.push(y);
      else gapYears.push(y);
    }
  }

  // If gap years exist and 2040 is not already in range, add the 2040 bond (upper bracket)
  // so its coupons count as laterMatInt for earlier years.
  if (gapYears.length > 0 && !yearBondMap[2040]) {
    for (const bond of tipsMap.values()) {
      if (!bond.maturity) continue;
      if (bond.maturity.getFullYear() !== 2040) continue;
      if (!yearBondMap[2040] || bond.maturity > yearBondMap[2040].maturity)
        yearBondMap[2040] = bond;
    }
    if (!yearBondMap[2040])
      throw new Error('No TIPS available in 2040 for upper bracket');
    rangeYears = [...rangeYears, 2040].sort((a, b) => a - b);
  }

  // Ensure the lower bracket (nearest pre-gap Jan TIPS, currently 2036) is in yearBondMap/rangeYears.
  // Required when firstYear is inside the gap: the lower bracket year is < firstYear and holds only
  // excess TIPS for duration matching (fundedYearQty = 0; no funded year component).
  if (gapYears.length > 0) {
    const minGapYearTmp = Math.min(...gapYears);
    let lbBond = null;
    for (const bond of tipsMap.values()) {
      if (!bond.maturity || !bond.yield) continue;
      const yr = bond.maturity.getFullYear(), mo = bond.maturity.getMonth() + 1;
      if (mo === 1 && yr < minGapYearTmp && (!lbBond || yr > lbBond.maturity.getFullYear()))
        lbBond = bond;
    }
    if (lbBond) {
      const lbYear = lbBond.maturity.getFullYear();
      if (!yearBondMap[lbYear]) {
        yearBondMap[lbYear] = lbBond;
        rangeYears = [...rangeYears, lbYear].sort((a, b) => a - b);
      }
    }
  }

  if (!rangeYears.length) throw new Error('No TIPS bonds found in the specified year range');

  // ── Future 30Y cover pair identification ─────────────────────────────────────
  // future30yLower = 2056 (shorter duration due to higher coupon on recently-issued 30y TIPS)
  // future30yUpper = 2052 (longer duration: near-zero coupon from 2022 issuance ≈ zero-coupon bond)
  let future30yLowerYear = null, future30yUpperYear = null;
  let future30yLowerCoverBond = null, future30yUpperCoverBond = null;
  if (future30yYears.length > 0) {
    for (const bond of tipsMap.values()) {
      if (!bond.maturity) continue;
      const yr = bond.maturity.getFullYear();
      if (yr === 2056 && (!future30yLowerCoverBond || bond.maturity > future30yLowerCoverBond.maturity))
        future30yLowerCoverBond = bond;
      if (yr === 2052 && (!future30yUpperCoverBond || bond.maturity > future30yUpperCoverBond.maturity))
        future30yUpperCoverBond = bond;
    }
    if (!future30yLowerCoverBond) throw new Error('No 2056 TIPS found for Future 30Y lower cover');
    if (!future30yUpperCoverBond) throw new Error('No 2052 TIPS found for Future 30Y upper cover');
    future30yLowerYear = 2056;
    future30yUpperYear = 2052;
  }

  // 2-5. Shared sizing pipeline — prelim, future-30Y/AMD, PLI, gap/excess, corrected sweep.
  //        Lives in ladder-core.js: the IDENTICAL code path build and rebalance both run.
  const {
    prelim, corrFYQty, corrLMI,
    zeroedFundedYears, partialCreditYear, partialCredit,
    lowerYear, upperYear, lowerExQty, upperExQty, lowerWeight, upperWeight,
    lowerDuration, upperDuration, lowerMonth, upperMonth, totalExcessCost,
    gapParams, future30yParams,
    future30yLowerDuration, future30yUpperDuration, future30yUpperWeight, future30yLowerWeight,
    future30yLowerExQty, future30yUpperExQty, future30yFellBack, future30yTotalExcessCost,
    future30yLowerMonth, future30yUpperMonth,
    future30yUpperAnnualAmdByYear, calcFuture30yUpperAnnualAmd,
    preLadderYears, preLadderPool, preLadderCouponPool, preLadderAmdPool,
  } = sizeLadder({
    dara, daraByYear, firstYear, lastYear,
    rangeYears, gapYears, future30yYears,
    yearBondMap, tipsMap, refCPI, settlementDate, settlementYear,
    preLadderInterest,
    future30yLowerCoverBond, future30yUpperCoverBond, future30yLowerYear, future30yUpperYear,
  });

  // 6. Build output rows (ascending year order for display)
  const results = [];
  const details = [];
  let totalBuyCost = 0;
  for (const year of rangeYears) {
    const bond = yearBondMap[year];
    const isZeroed = zeroedFundedYears.has(year);
    const prelim_pi = prelim[year].pi;
    const corr_lmi  = corrLMI[year] ?? prelim[year].laterMatInt;
    const yearDara = daraByYear?.get(year) ?? dara;
    const fundedYearQty = corrFYQty[year] ?? prelim[year].targetFundedYearQty;
    const gapExQty    = year === lowerYear ? lowerExQty : year === upperYear ? upperExQty : 0;
    const future30yExQty = year === future30yLowerYear ? future30yLowerExQty : year === future30yUpperYear ? future30yUpperExQty : 0;
    const excessQty   = gapExQty + future30yExQty;
    const totQty      = fundedYearQty + excessQty;
    const { indexRatio: ir, costPerBond: cpb } = bondCalcs(bond, refCPI);
    const excessLMI   = excessQty * 1000 * ir * (bond.coupon ?? 0);
    const future30yAmd = calcFuture30yUpperAnnualAmd(year);

    const mDuration = calculateMDuration(settlementDate, bond.maturity, bond.coupon ?? 0, bond.yield ?? 0);
    const isBracket    = excessQty > 0;
    const isFuture30yCover = future30yExQty > 0;
    const monthF    = bond.maturity.getMonth() + 1;
    const halfOrFull = monthF < 7 ? 0.5 : 1.0;
    const principalPerBond     = 1000 * ir;
    const ownRungCouponPerBond = principalPerBond * (bond.coupon ?? 0) * halfOrFull;

    const preLadderCreditForYear = isZeroed
      ? Math.max(0, yearDara - (corr_lmi + excessLMI))
      : year === partialCreditYear ? partialCredit : 0;
    const fundedYearAmt = (year > lastYear || year < firstYear) ? 0
      : fundedYearQty * prelim_pi + corr_lmi + excessLMI + preLadderCreditForYear + future30yAmd;
    const gapLMIAlloc = gapExQty > 0
      ? (year === lowerYear ? lowerWeight : upperWeight) * (gapParams?.gapLMITotal ?? 0)
      : 0;
    const exAmt  = isBracket ? excessQty * prelim_pi + gapLMIAlloc : '';
    const fundedYearCost = fundedYearQty * cpb;
    const exCost = isBracket ? excessQty * cpb : '';
    totalBuyCost += totQty * cpb;
    results.push([
      bond.cusip,             // 0: CUSIP
      fmtDate(bond.maturity), // 1: Maturity
      year,                   // 2: FY
      fundedYearQty,         // 3: Funded Year Qty
      excessQty || '',       // 4: Excess Qty (blank for non-bracket years)
      totQty,                 // 5: Total Qty
      fundedYearAmt,         // 6: Funded Year Amount
      fundedYearCost,        // 7: Funded Year Cost
      exAmt,                  // 8: Excess Amount (bracket only)
      exCost,                 // 9: Excess Cost (bracket only)
    ]);
    details.push({
      fundedYear: year,
      cusip: bond.cusip,
      maturityStr: fmtDate(bond.maturity),
      coupon: bond.coupon ?? 0,
      yield: bond.yield ?? 0,
      price: bond.price ?? 0,
      baseCpi: bond.baseCpi ?? refCPI,
      refCPI,
      indexRatio: ir,
      halfOrFull,
      dara: yearDara,
      fundedYearQty: fundedYearQty,
      longerDatedLMI: corr_lmi,
      excessLMI_After: excessLMI,
      preLadderCreditForYear,
      future30yUpperAnnualAmd: future30yAmd,
      fundedYearPi: prelim[year].pi,
      fundedYearPrincipalTotal: fundedYearQty * principalPerBond,
      fundedYearOwnRungInt: fundedYearQty * ownRungCouponPerBond,
      fundedYearAmt: fundedYearAmt,
      costPerBond: cpb,
      fundedYearCost: fundedYearCost,
      isFuture30yCover,
      excessQty: excessQty,
      excessPrincipalTotal: excessQty * principalPerBond,
      excessOwnRungInt: excessQty * ownRungCouponPerBond,
      excessAmt: isBracket ? excessQty * prelim_pi + gapLMIAlloc : 0,
      gapLMIAlloc,
      excessCost: isBracket ? excessQty * cpb : 0,
      mDuration,
    });
  }

  const _mktCosts = details.map(d => (d.fundedYearQty + d.excessQty) * d.costPerBond);
  const weightedAvgDuration = calcMktWtdAvg(details.map(d => d.mDuration), _mktCosts);
  const weightedAvgYield    = calcMktWtdAvg(details.map(d => d.yield),     _mktCosts);

  const HDR = ['CUSIP', 'Maturity', 'Funded Year', 'Funded Year Qty', 'Excess Qty', 'Total Qty', 'Funded Year Amount', 'Funded Year Cost', 'Excess Amount', 'Excess Cost'];

  const summary = {
    settleDateDisp, refCPI, dara,
    firstYear, lastYear, gapYears, future30yYears,
    gapParams, lowerYear, upperYear,
    lowerDuration, upperDuration, lowerWeight, upperWeight, lowerMonth, upperMonth,
    lowerExQty, upperExQty, totalExcessCost,
    future30yLowerYear, future30yUpperYear,
    future30yLowerDuration, future30yUpperDuration, future30yUpperWeight, future30yLowerWeight,
    future30yLowerExQty, future30yUpperExQty, future30yFellBack, future30yTotalExcessCost,
    future30yLowerMonth, future30yUpperMonth,
    future30yParams,
    future30yUpperAnnualAmdByYear,
    totalBuyCost,
    weightedAvgDuration,
    weightedAvgYield,
    preLadderInterest, preLadderYears, preLadderPool, preLadderCouponPool, preLadderAmdPool,
    zeroedFundedYears: [...zeroedFundedYears].sort((a, b) => a - b),
  };

  return { results, HDR, summary, details };
}
