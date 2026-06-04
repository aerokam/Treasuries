// TIPS Ladder Builder — Build from Scratch
// Pure computation only — no Node.js I/O, no file system, no CLI.
//
// Entry point: runBuild({ dara, lastYear, tipsMap, refCPI, settlementDate })

import { fmtDate } from './date-util.js';
import { bondCalcs, calculateMDuration, rungAmount, calcMktWtdAvg } from '../../shared/src/bond-math.js';
import { sizeLadder, selectLadderBonds } from './ladder-core.js';

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

  // 1. Canonical ladder bond selection (shared with rebalance — single source of truth).
  const {
    yearBondMap, rangeYears, gapYears, future30yYears,
    future30yLowerYear, future30yUpperYear, future30yLowerCoverBond, future30yUpperCoverBond,
  } = selectLadderBonds({ tipsMap, firstYear, lastYear, settlementDate, maturityPref });

  if (!rangeYears.length) throw new Error('No TIPS bonds found in the specified year range');

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

    // Zeroed years are funded entirely by the PLI pool. The displayed credit must subtract
    // AMD too (held-2052 AMD is income that year), else the row's Amount overshoots DARA by
    // the AMD. Mirrors rebalance, which uses the AMD-adjusted pliCreditByFundedYear.
    const preLadderCreditForYear = isZeroed
      ? Math.max(0, yearDara - (corr_lmi + excessLMI + future30yAmd))
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
      // Designated gap bracket (2036 lower / 2040 upper). Stays flagged even when its excess
      // sizes to 0 (gap fully covered by PLI/LMI/AMD), so the row keeps its "*" + a qty-0 excess
      // sub-row whose Gap Amount drill shows why no excess is needed (required qty 0).
      isGapBracket: gapYears.length > 0 && (year === lowerYear || year === upperYear),
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

  // Resolved per-year DARA for EVERY year in [firstYear, lastYear] (incl. gap + future-30Y
  // years that have no TIPS row). This is the durable build intent the export persists as the
  // `#fundedYear,dara` block, so a re-import reproduces the ladder exactly. See 2.1 Broker Import.
  const daraByYearResolved = new Map();
  for (let y = firstYear; y <= lastYear; y++) daraByYearResolved.set(y, daraByYear?.get(y) ?? dara);

  const summary = {
    settleDateDisp, refCPI, dara, daraByYearResolved,
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
