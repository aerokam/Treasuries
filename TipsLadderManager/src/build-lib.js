// TIPS Ladder Builder — Build from Scratch
// Pure computation only — no Node.js I/O, no file system, no CLI.
//
// Entry point: runBuild({ dara, lastYear, tipsMarketData, refCPI, settlementDate })

import { fmtDate } from './date-util.js';
import { bondCalcs, calculateMDuration, calcMktWtdAvg } from '../../shared/src/bond-math.js';
import { sizeLadder, selectLadderBonds, fundedYearAmount, syntheticYearAmounts, defaultFirstYear, EXCLUDE_MATURING_WITHIN_MONTHS } from './ladder-core.js';

// ─── Main entry point ──────────────────────────────────────────────────────────
// Inputs:
//   dara           — number (required)
//   lastYear       — number (last fiscal year to fund)
//   tipsMarketData        — Map from buildTipsMarketData()
//   refCPI         — number
//   settlementDate — Date
//   firstYear      — number (optional; kept when supplied, else defaultFirstYear: DD §5.1 Default First Year)
//
// Bond selection: latest-to-mature TIPS within each fiscal year.
// Lower bracket: latest TIPS bond maturing before the first gap year.
// Upper bracket: always 2040.
//
// Returns: { results, HDR, summary }
// Spec: knowledge/3.0_TIPS_Ladders.md and knowledge/4.0_TIPS_Ladder_Rebalancing.md §Full Rebalance
// Variable naming note: fundedYearQty, excessQty, costPerBond (harmonized) — see §Code Variable Mapping
export function runBuild({ dara, firstYear: firstYearOpt, lastYear, tipsMarketData, refCPI, settlementDate, maturityPref = 'last', couponPref = 'higher', preLadderInterest = false, daraByYear = null, yearOverrides = null, bondHolidays = new Set(), availableCash = 0, rmdCouponMode = 'all', tradeDate = settlementDate, excludeMaturingWithinMonths = EXCLUDE_MATURING_WITHIN_MONTHS }) {
  // A TIPS maturing within EXCLUDE_MATURING_WITHIN_MONTHS months is never chosen for a funded year (DD §5.1); a First Year before the Default First Year
  // moves to it: a year with no eligible TIPS has no rung and is not a gap year (DD Gap Years).
  const defaultFY = defaultFirstYear(tipsMarketData, settlementDate, excludeMaturingWithinMonths);
  const firstYear      = firstYearOpt == null ? defaultFY : (defaultFY == null ? firstYearOpt : Math.max(firstYearOpt, defaultFY));
  if (firstYear == null) throw new Error('No TIPS bonds found in the specified year range');
  const settleDateDisp = fmtDate(settlementDate);
  const settlementYear = settlementDate.getFullYear();

  // 1. Canonical ladder bond selection (shared with rebalance — single source of truth).
  const {
    yearBondMap, yearTipsListMap, rangeYears, gapYears, future30yYears,
    future30yLowerYear, future30yUpperYear, future30yLowerCoverBond, future30yUpperCoverBond, future30yAnchorBond,
  } = selectLadderBonds({ tipsMarketData, firstYear, lastYear, settlementDate, maturityPref, couponPref, yearOverrides, excludeMaturingWithinMonths });

  if (!rangeYears.length) throw new Error('No TIPS bonds found in the specified year range');

  // 2-5. Shared sizing pipeline — prelim, Future 30Y rebalances, PLI, gap/excess, corrected sweep.
  //        Lives in ladder-core.js: the IDENTICAL code path build and rebalance both run.
  const {
    prelim, corrFYQty, corrLMI, corrRungs,
    zeroedFundedYears, partialCreditYear, partialCredit, cashCreditByFundedYear,
    lowerYear, upperYear, lowerExQty, upperExQty, lowerWeight, upperWeight,
    lowerDuration, upperDuration, lowerMonth, upperMonth, totalExcessCost,
    gapParams, future30yParams,
    future30yLowerDuration, future30yUpperDuration, future30yUpperWeight, future30yLowerWeight,
    future30yLowerExQty, future30yUpperExQty, future30yFellBack, future30yCoverReason, future30yTotalExcessCost,
    future30yLowerMonth, future30yUpperMonth,
    future30yRebalances, future30ySimulatedInterestByYear, future30yCoverInterestByYear, future30yNetCashByYear,
    gapRebalances, gapSimulatedInterestByYear, gapExcessInterestByYear, gapNetCashByYear,
    preLadderYears, preLadderPool, preLadderCouponPool, preLadderFuture30yPool, preLadderGapPool, preLadderNetCashPool,
  } = sizeLadder({
    dara, daraByYear, firstYear, lastYear,
    rangeYears, gapYears, future30yYears,
    yearBondMap, yearTipsListMap, tipsMarketData, refCPI, settlementDate, settlementYear,
    preLadderInterest, bondHolidays, availableCash, rmdCouponMode, tradeDate,
    future30yLowerCoverBond, future30yUpperCoverBond, future30yLowerYear, future30yUpperYear, future30yAnchorBond,
  });

  // 6. Build output rows (ascending year order for display)
  const results = [];
  const details = [];
  let totalBuyCost = 0;
  for (const year of rangeYears) {
    const repBond = yearBondMap[year];                        // representative TIPS (bracket/cover excess rides this)
    const isZeroed = zeroedFundedYears.has(year);
    const corr_lmi  = corrLMI[year] ?? prelim[year].laterMatInt;
    const yearDara = daraByYear?.get(year) ?? dara;
    const rungs = corrRungs[year] ?? [{ ...bondCalcs(repBond, refCPI), bond: repBond, coupon: repBond.coupon ?? 0, qty: corrFYQty[year] ?? 0 }];

    // Year excess (gap / future-30Y). The excess rides the row of the representative TIPS.
    const gapExQty    = year === lowerYear ? lowerExQty : year === upperYear ? upperExQty : 0;
    const future30yExQty = year === future30yLowerYear ? future30yLowerExQty : year === future30yUpperYear ? future30yUpperExQty : 0;
    const excessQty   = gapExQty + future30yExQty;
    const { indexRatio: irRep, costPerBond: cpbRep } = bondCalcs(repBond, refCPI);
    // Same-Maturity Excess Interest is 0: the Excess TIPS and the Cover Excess are sold before they
    // mature (DD §Same-Maturity Excess Interest). Their interest is credited to the funded years below.
    const excessLMI   = 0;
    // Interest of the Simulated Outstanding Future 30Y TIPS and of the Cover Excess, and the Net Cash,
    // credited to this year (2.0 §Future 30Y Simulated Outstanding TIPS §Interest credited to a funded year).
    const simulatedInterest   = (year >= firstYear && year <= lastYear) ? (future30ySimulatedInterestByYear.get(year) ?? 0) : 0;
    const coverExcessInterest = (year >= firstYear && year <= lastYear) ? (future30yCoverInterestByYear.get(year) ?? 0) : 0;
    const future30yNetCash    = (year >= firstYear && year <= lastYear) ? (future30yNetCashByYear.get(year) ?? 0) : 0;
    // The same three amounts for the gap years (2.0 §Gap Year Simulated Outstanding TIPS §Interest credited to a funded year).
    const gapSimulatedInterest = (year >= firstYear && year <= lastYear) ? (gapSimulatedInterestByYear.get(year) ?? 0) : 0;
    const gapExcessInterest    = (year >= firstYear && year <= lastYear) ? (gapExcessInterestByYear.get(year) ?? 0) : 0;
    const gapNetCash           = (year >= firstYear && year <= lastYear) ? (gapNetCashByYear.get(year) ?? 0) : 0;
    const isBracket    = excessQty > 0;
    const isFuture30yCover = future30yExQty > 0;

    // Year-level funded aggregates — Σ over sub-rungs, each sized from its OWN pi/pir/coupon
    // (multi-TIPS years: quarterly ≤~2030, Jan/Jul ≤~2035). N=1 reproduces the legacy single-TIPS year.
    let fundedYearQty = 0, fundedYearPITotal = 0, fundedPrincipalTotal = 0, fundedOwnRungInt = 0;
    const fundedRungs = [];
    for (const r of rungs) {
      const moF = r.bond.maturity.getMonth() + 1;
      const hof = moF < 7 ? 0.5 : 1.0, nP = moF < 7 ? 1 : 2;
      const ppb = 1000 * r.pir;
      fundedYearQty += r.qty;
      fundedYearPITotal += r.qty * r.pi;
      fundedPrincipalTotal += r.qty * ppb;
      fundedOwnRungInt += r.qty * ppb * (r.coupon ?? 0) * hof;
      fundedRungs.push({ cusip: r.bond.cusip, maturityStr: fmtDate(r.bond.maturity),
        maturityMonth: moF - 1, maturityYear: r.bond.maturity.getFullYear(),
        qty: r.qty, principalPerBond: ppb, coupon: r.coupon ?? 0, nPeriods: nP, piPerBond: r.pi });
    }

    // Per-year Amount + pre-ladder credit via the shared rule (ladder-core.fundedYearAmount),
    // so build and rebalance "After" are identical by construction. Zeroed years are funded
    // entirely by the PLI pool; the credit subtracts LMI + own-excess coupon + the Future 30Y
    // interest and Net Cash so the row lands on DARA.
    const rowAvailableCashCredit = cashCreditByFundedYear[year] ?? 0;
    const { credit: preLadderCreditForYear, amount: _fundedAmt } = fundedYearAmount({
      principal: fundedYearPITotal, laterMatInt: corr_lmi, ownExcessCoupon: excessLMI,
      simulatedInterest, coverExcessInterest, netCash: future30yNetCash, gapSimulatedInterest, gapExcessInterest, gapNetCash, dara: yearDara, isZeroed,
      partialCredit: year === partialCreditYear ? partialCredit : 0,
    });
    const fundedYearAmt = (year > lastYear || year < firstYear) ? 0 : _fundedAmt;
    // Excess rows show no Amount (2.0 §Amount of a Gap Year and a Future 30Y Year): the gap year
    // and Future 30Y year rows carry it (summary.syntheticYearAmounts).
    const exCost = isBracket ? excessQty * cpbRep : '';

    // Emit one row per funded sub-rung. Year-level fields (Amount, LMI, credit, aggregates) ride the
    // FIRST row only — render's fyLevel picks the first non-null Amount and anchors the drill there;
    // Cost/Qty columns sum the per-rung values across the group. Excess rides the first (representative) row.
    rungs.forEach((r, j) => {
      const moF = r.bond.maturity.getMonth() + 1;
      const hof = moF < 7 ? 0.5 : 1.0, nP = moF < 7 ? 1 : 2;
      const ppb = 1000 * r.pir;
      const cpb_i = bondCalcs(r.bond, refCPI).costPerBond;
      const rungCost = r.qty * cpb_i;
      const mDuration = calculateMDuration(settlementDate, r.bond.maturity, r.bond.coupon ?? 0, r.bond.yield ?? 0);
      const first = j === 0;
      // The excess rides the representative TIPS (the latest of the year), which is where it is priced.
      const carriesExcess = r.bond.cusip === repBond.cusip;
      const rowExcessQty = carriesExcess ? excessQty : 0;
      const totQty = r.qty + rowExcessQty;
      totalBuyCost += rungCost + (carriesExcess ? excessQty * cpbRep : 0);
      results.push([
        r.bond.cusip,           // 0: CUSIP
        fmtDate(r.bond.maturity), // 1: Maturity
        year,                   // 2: FY
        r.qty,                  // 3: Funded Year Qty (this sub-rung)
        rowExcessQty || '',    // 4: Excess Qty (bracket row only)
        totQty,                 // 5: Total Qty
        first ? fundedYearAmt : '', // 6: Funded Year Amount (year total, first row only)
        rungCost,               // 7: Funded Year Cost (this sub-rung)
        '',                     // 8: Excess Amount (excess rows show no Amount)
        first ? exCost : '',   // 9: Excess Cost (bracket only)
      ]);
      details.push({
        fundedYear: year,
        cusip: r.bond.cusip,
        maturityStr: fmtDate(r.bond.maturity),
        coupon: r.coupon ?? 0,
        yield: r.bond.yield ?? 0,
        saYield: r.bond.saYield ?? null,
        price: r.bond.price ?? 0,
        datedDateRefCpi: r.bond.datedDateRefCpi ?? refCPI,
        refCPI,
        indexRatio: r.ir,
        principalPerBond: ppb,
        paymentIndexRatio: r.pir,
        halfOrFull: hof,
        nPeriods: nP,
        dara: first ? yearDara : null,
        fundedYearQty: r.qty,
        longerDatedLMI: first ? corr_lmi : null,
        excessLMI_After: first ? excessLMI : 0,
        preLadderCreditForYear: first ? preLadderCreditForYear : null,
        future30ySimulatedInterest: first ? simulatedInterest : 0,
        future30yCoverExcessInterest: first ? coverExcessInterest : 0,
        future30yNetCash: first ? future30yNetCash : 0,
        gapSimulatedInterest: first ? gapSimulatedInterest : 0,
        gapExcessInterest: first ? gapExcessInterest : 0,
        gapNetCash: first ? gapNetCash : 0,
        availableCashCredit: first ? rowAvailableCashCredit : 0,
        fundedYearPi: r.pi,
        // Multi-TIPS Amount drill iterates fundedRungs (each TIPS's own P+I); single-TIPS uses the
        // per-bond breakdown. Year-level principal/own-coupon totals ride the first row for that drill.
        fundedRungs: first ? fundedRungs : null,
        fundedYearPrincipalTotal: first ? fundedPrincipalTotal : r.qty * ppb,
        fundedYearOwnRungInt: first ? fundedOwnRungInt : r.qty * ppb * (r.coupon ?? 0) * hof,
        fundedYearAmt: first ? fundedYearAmt : null,
        costPerBond: cpb_i,
        fundedYearCost: rungCost,
        isFuture30yCover,
        // Designated gap bracket (2036 lower / 2040 upper) — single TIPS, so flagged on its one row.
        isGapBracket: gapYears.length > 0 && (year === lowerYear || year === upperYear),
        excessQty: rowExcessQty,
        excessPrincipalTotal: rowExcessQty * 1000 * irRep,
        excessOwnRungInt: rowExcessQty * 1000 * irRep * (repBond.coupon ?? 0) * (repBond.maturity.getMonth() + 1 < 7 ? 0.5 : 1.0),
        excessCost: (carriesExcess && isBracket) ? excessQty * cpbRep : 0,
        mDuration,
      });
    });
  }

  details.forEach(d => { d.mktValue = (d.fundedYearQty + d.excessQty) * d.costPerBond; });
  const _mktCosts = details.map(d => d.mktValue);
  const weightedAvgDuration = calcMktWtdAvg(details.map(d => d.mDuration), _mktCosts);
  const weightedAvgYield    = calcMktWtdAvg(details.map(d => d.yield),     _mktCosts);
  const weightedAvgSaYield  = calcMktWtdAvg(details.map(d => d.saYield),   _mktCosts);

  const HDR = ['CUSIP', 'Maturity', 'Funded Year', 'Funded Year Qty', 'Excess Qty', 'Total Qty', 'Funded Year Amount', 'Funded Year Cost', 'Excess Amount', 'Excess Cost'];

  // Resolved per-year DARA for EVERY year in [firstYear, lastYear] (incl. gap + future-30Y
  // years that have no TIPS row). This is the durable build intent the export persists as the
  // `#fundedYear,dara` block, so a re-import reproduces the ladder exactly. See 4.5.6 Export holdings and DARA plan.
  const daraByYearResolved = new Map();
  for (let y = firstYear; y <= lastYear; y++) daraByYearResolved.set(y, daraByYear?.get(y) ?? dara);

  const summary = {
    settleDateDisp, refCPI, dara, daraByYearResolved,
    settlementYear, availableCash, rmdCouponMode,
    firstYear, lastYear, gapYears, future30yYears,
    gapParams, lowerYear, upperYear,
    lowerDuration, upperDuration, lowerWeight, upperWeight, lowerMonth, upperMonth,
    lowerExQty, upperExQty, totalExcessCost,
    future30yLowerYear, future30yUpperYear,
    future30yLowerDuration, future30yUpperDuration, future30yUpperWeight, future30yLowerWeight,
    future30yLowerExQty, future30yUpperExQty, future30yFellBack, future30yCoverReason, future30yTotalExcessCost,
    future30yLowerMonth, future30yUpperMonth,
    future30yParams,
    future30yAnchorBond, future30yRebalances, future30ySimulatedInterestByYear, future30yCoverInterestByYear, future30yNetCashByYear,
    gapRebalances, gapSimulatedInterestByYear, gapExcessInterestByYear, gapNetCashByYear,
    syntheticYearAmounts: syntheticYearAmounts({ gapParams, future30yParams }),
    totalBuyCost,
    weightedAvgDuration,
    weightedAvgYield,
    weightedAvgSaYield,
    preLadderInterest, maturityPref, couponPref, preLadderYears, preLadderPool, preLadderCouponPool, preLadderFuture30yPool, preLadderGapPool, preLadderNetCashPool,
    zeroedFundedYears: [...zeroedFundedYears].sort((a, b) => a - b),
  };

  return { results, HDR, summary, details };
}
