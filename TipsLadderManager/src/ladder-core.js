// ladder-core.js — Shared ladder sizing pipeline used by BOTH build and rebalance.
// Spec: 2.0 TIPS Ladders §Algorithm; 3.0 §Phase 4; 4.0 §build-lib.js.
//
// `sizeLadder` is a PURE function: (per-year DARA + bonds + options) → target ladder
// (funded qty + excess per year, plus the params/pool fields callers render). It contains
// the whole pipeline: prelim estimate (PLI bucket + gap LMI), PLI pool, gap/future-30Y
// duration matching + bracket excess, and the corrected funded sweep. Build calls it with
// manual DARA; rebalance calls it with portfolio-derived DARA, then diffs the result into
// trades. Holdings never enter the sizing — only DARA does. This is the single source of
// truth that kills the build↔rebalance duplication.

import { bondCalcs, calculateMDuration } from '../../shared/src/bond-math.js';
import { bracketWeights, bracketExcessQtys, fyQty as _fyQty, gapParamsCore, future30yParamsCore, future30yUpperAmdSchedule } from './gap-math.js';

// ─── Gap parameters adapter ─────────────────────────────────────────────────────
// Build's "LMI above the gap" = prelim funded-year coupon (effective prelim: zeroed years = 0).
function calcGapParams(gapYears, tipsMap, settlementDate, refCPI, dara, prelim, pliCreditByGapYear = {}, daraByYear = null, amdByYear = null) {
  const lmiAboveByYear = {};
  for (const [y, p] of Object.entries(prelim)) lmiAboveByYear[y] = p.annualInterest;
  return gapParamsCore({ gapYears, tipsMap, settlementDate, dara, daraByYear, lmiAboveByYear, pliCreditByGapYear, amdByYear });
}

// ─── Future 30Y parameters adapter ──────────────────────────────────────────────
function calcFuture30yParams(future30yYears, bond2056, settlementDate, dara, daraByYear = null) {
  return future30yParamsCore({ future30yYears, coverBond2056: bond2056, settlementDate, dara, daraByYear });
}

const BL_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── The shared sizing pipeline ─────────────────────────────────────────────────
export function sizeLadder({
  dara, daraByYear = null, firstYear, lastYear,
  rangeYears, gapYears, future30yYears,
  yearBondMap, tipsMap, refCPI, settlementDate, settlementYear,
  preLadderInterest = false,
  future30yLowerCoverBond = null, future30yUpperCoverBond = null,
  future30yLowerYear = null, future30yUpperYear = null,
}) {
  let lowerYear = null, upperYear = null;

  // 3. Preliminary sweep (longest → shortest, no bracket excess). Produces prelim coupons
  //    used by the PLI bucket and gap LMI (the small, shared approximation).
  const prelim = {};
  let laterMatInt = 0;
  for (const year of [...rangeYears].sort((a, b) => b - a)) {
    const bond = yearBondMap[year];
    const { indexRatio: ir, piPerBond: pi } = bondCalcs(bond, refCPI);
    const qty  = (year > lastYear || year < firstYear) ? 0 : _fyQty(daraByYear?.get(year) ?? dara, laterMatInt, pi);
    const annInt = qty * 1000 * ir * (bond.coupon ?? 0);
    prelim[year] = { targetFundedYearQty: qty, annualInterest: annInt, laterMatInt, pi };
    laterMatInt += annInt;
  }

  // 3a. Validate: every funded year must fund at least one bond.
  for (const year of rangeYears) {
    if (year > lastYear || year < firstYear) continue;
    const { targetFundedYearQty, laterMatInt, pi } = prelim[year];
    const yearDara = daraByYear?.get(year) ?? dara;
    if (targetFundedYearQty === 0 && yearDara > laterMatInt) {
      const minNeeded = Math.ceil(laterMatInt + pi);
      throw new Error(`DARA too low for ${year}: need at least $${minNeeded.toLocaleString()} to fund one bond (pi/bond = $${Math.round(pi).toLocaleString()}, later-mat interest = $${Math.round(laterMatInt).toLocaleString()})`);
    }
  }

  // 4a. Future 30Y parameters → duration matching → cover excess quantities.
  let future30yParams = null;
  let future30yLowerDuration = 0, future30yUpperDuration = 0;
  let future30yUpperWeight = 0, future30yLowerWeight = 0;
  let future30yUpperExQty = 0, future30yLowerExQty = 0;
  let future30yFellBack = false;
  let future30yTotalExcessCost = 0;
  let future30yLowerMonth = null, future30yUpperMonth = null;

  if (future30yYears.length > 0) {
    future30yParams = calcFuture30yParams(future30yYears, future30yLowerCoverBond, settlementDate, dara, daraByYear);
    future30yLowerDuration = calculateMDuration(settlementDate, future30yLowerCoverBond.maturity, future30yLowerCoverBond.coupon ?? 0, future30yLowerCoverBond.yield ?? 0);
    future30yUpperDuration = calculateMDuration(settlementDate, future30yUpperCoverBond.maturity, future30yUpperCoverBond.coupon ?? 0, future30yUpperCoverBond.yield ?? 0);

    ({ lowerWeight: future30yLowerWeight, upperWeight: future30yUpperWeight } = bracketWeights(future30yLowerDuration, future30yUpperDuration, future30yParams.avgDuration));
    if (future30yParams.avgDuration > future30yUpperDuration) future30yFellBack = true;

    const future30yLowerCPB = (future30yLowerCoverBond.price ?? 0) / 100 * (refCPI / (future30yLowerCoverBond.baseCpi ?? refCPI)) * 1000;
    const future30yUpperCPB = (future30yUpperCoverBond.price ?? 0) / 100 * (refCPI / (future30yUpperCoverBond.baseCpi ?? refCPI)) * 1000;
    ({ lowerExQty: future30yLowerExQty, upperExQty: future30yUpperExQty } = bracketExcessQtys(future30yParams.future30yTotalCost, future30yLowerWeight, future30yUpperWeight, future30yLowerCPB, future30yUpperCPB));
    future30yTotalExcessCost = future30yLowerExQty * future30yLowerCPB + future30yUpperExQty * future30yUpperCPB;
    future30yLowerMonth = BL_MONTHS[future30yLowerCoverBond.maturity.getMonth()];
    future30yUpperMonth = BL_MONTHS[future30yUpperCoverBond.maturity.getMonth()];
  }

  // Future 30Y upper cover AMD schedule (interest on the held excess 2052).
  const future30yUpperAnnualAmdByYear = future30yUpperAmdSchedule({
    future30yYears, future30yUpperExQty, future30yUpperCoverBond, refCPI, settlementYear,
  });
  function calcFuture30yUpperAnnualAmd(year) {
    return future30yUpperAnnualAmdByYear.get(year) ?? 0;
  }

  // 3b. Pre-ladder interest pool (coupons received before the ladder starts, + pre-ladder AMD).
  const preLadderYears = preLadderInterest ? Math.max(0, firstYear - settlementYear) : 0;
  let preLadderPool = 0;
  let preLadderCouponPool = 0;
  let preLadderAmdPool = 0;
  const zeroedFundedYears = new Set();
  const pliCreditByGapYear = {};
  let partialCreditYear = null, partialCredit = 0;

  if (preLadderYears > 0) {
    const totalAnnualInt = Object.values(prelim).reduce((s, p) => s + p.annualInterest, 0);
    preLadderCouponPool = preLadderYears * totalAnnualInt;
    for (let y = settlementYear; y < firstYear; y++) preLadderAmdPool += calcFuture30yUpperAnnualAmd(y);
    preLadderPool = preLadderCouponPool + preLadderAmdPool;

    const gapYearSet = new Set(gapYears);
    const allYearsSorted = [...new Set([...rangeYears, ...gapYears])].sort((a, b) => a - b);
    let remaining = preLadderPool;

    for (const year of allYearsSorted) {
      if (year < firstYear) continue; // lower bracket year is not a funded year
      if (gapYearSet.has(year)) {
        const actualTIPSLMI = Object.entries(prelim)
          .filter(([y]) => parseInt(y) > year)
          .reduce((s, [, p]) => s + p.annualInterest, 0);
        const need = Math.max(0, (daraByYear?.get(year) ?? dara) - actualTIPSLMI - calcFuture30yUpperAnnualAmd(year));
        if (remaining >= need) {
          pliCreditByGapYear[year] = need;
          remaining -= need;
        } else {
          pliCreditByGapYear[year] = remaining;
          remaining = 0;
          break;
        }
      } else {
        const yearDaraForPLI = daraByYear?.get(year) ?? dara;
        const need = yearDaraForPLI - prelim[year].laterMatInt - calcFuture30yUpperAnnualAmd(year);
        if (need <= 0) { zeroedFundedYears.add(year); continue; }
        if (remaining >= need) {
          zeroedFundedYears.add(year);
          remaining -= need;
        } else {
          partialCreditYear = year;
          partialCredit = remaining;
          break;
        }
      }
    }
  }

  // 3c. Effective prelim for gap calc: zeroed funded years generate no coupon.
  let effectivePrelim = prelim;
  if (zeroedFundedYears.size > 0) {
    effectivePrelim = { ...prelim };
    for (const yr of zeroedFundedYears) {
      if (effectivePrelim[yr]) effectivePrelim[yr] = { ...effectivePrelim[yr], annualInterest: 0 };
    }
  }

  // 4b. Gap parameters → duration matching → bracket weights/excess.
  let gapParams = null;
  let lowerDuration = null, upperDuration = null, lowerWeight = null, upperWeight = null;
  let lowerMonth = null, upperMonth = null;
  let lowerExQty = 0, upperExQty = 0, totalExcessCost = 0;

  if (gapYears.length > 0) {
    const minGapYear = Math.min(...gapYears);
    upperYear = 2040;
    const yearsBeforeGap = rangeYears.filter(y => y < minGapYear);
    lowerYear = Math.max(...yearsBeforeGap);

    // Augment effectivePrelim with future 30Y cover excess interest (2052/2056 are above gap years).
    let augmentedPrelim = effectivePrelim;
    if (future30yYears.length > 0) {
      augmentedPrelim = { ...effectivePrelim };
      if (future30yUpperExQty > 0) {
        const { indexRatio: irU } = bondCalcs(future30yUpperCoverBond, refCPI);
        const extraU = future30yUpperExQty * 1000 * irU * (future30yUpperCoverBond.coupon ?? 0);
        augmentedPrelim[future30yUpperYear] = { ...effectivePrelim[future30yUpperYear], annualInterest: (effectivePrelim[future30yUpperYear]?.annualInterest ?? 0) + extraU };
      }
      if (future30yLowerExQty > 0) {
        const { indexRatio: irL } = bondCalcs(future30yLowerCoverBond, refCPI);
        const extraL = future30yLowerExQty * 1000 * irL * (future30yLowerCoverBond.coupon ?? 0);
        augmentedPrelim[future30yLowerYear] = { ...effectivePrelim[future30yLowerYear], annualInterest: (effectivePrelim[future30yLowerYear]?.annualInterest ?? 0) + extraL };
      }
    }

    gapParams = calcGapParams(gapYears, tipsMap, settlementDate, refCPI, dara, augmentedPrelim, pliCreditByGapYear, daraByYear, future30yUpperAnnualAmdByYear);

    const upperBond = yearBondMap[upperYear];
    upperDuration = calculateMDuration(settlementDate, upperBond.maturity, upperBond.coupon ?? 0, upperBond.yield ?? 0);
    upperMonth = BL_MONTHS[upperBond.maturity.getMonth()];
    const upperCPB = (upperBond.price ?? 0) / 100 * (refCPI / (upperBond.baseCpi ?? refCPI)) * 1000;

    const lowerBond = yearBondMap[lowerYear];
    lowerDuration = calculateMDuration(settlementDate, lowerBond.maturity, lowerBond.coupon ?? 0, lowerBond.yield ?? 0);
    lowerMonth = BL_MONTHS[lowerBond.maturity.getMonth()];
    const lowerCPB = (lowerBond.price ?? 0) / 100 * (refCPI / (lowerBond.baseCpi ?? refCPI)) * 1000;
    ({ lowerWeight, upperWeight } = bracketWeights(lowerDuration, upperDuration, gapParams.avgDuration));
    ({ lowerExQty: lowerExQty, upperExQty: upperExQty } = bracketExcessQtys(gapParams.totalCost, lowerWeight, upperWeight, lowerCPB, upperCPB));
    totalExcessCost = lowerExQty * lowerCPB + upperExQty * upperCPB;
  }

  // 5. Corrected long→short sweep over actual funded years (LMI pool includes bracket excess interest).
  const corrFYQty = {};
  const corrLMI   = {};
  {
    const exByYear = {};
    if (future30yUpperYear != null) exByYear[future30yUpperYear] = (exByYear[future30yUpperYear] ?? 0) + future30yUpperExQty;
    if (future30yLowerYear != null) exByYear[future30yLowerYear] = (exByYear[future30yLowerYear] ?? 0) + future30yLowerExQty;
    if (lowerYear != null) exByYear[lowerYear] = (exByYear[lowerYear] ?? 0) + lowerExQty;
    if (upperYear != null) exByYear[upperYear] = (exByYear[upperYear] ?? 0) + upperExQty;

    let runningLMI = 0;
    for (const year of [...rangeYears].sort((a, b) => b - a)) {
      corrLMI[year] = runningLMI;
      const bond    = yearBondMap[year];
      const { indexRatio: ir } = bondCalcs(bond, refCPI);
      const pi      = prelim[year].pi;
      const yearDara = daraByYear?.get(year) ?? dara;
      const isZrd   = zeroedFundedYears.has(year);

      const exQty = exByYear[year] ?? 0;
      const excessLMI = exQty * 1000 * ir * (bond.coupon ?? 0);
      const future30yAmd = calcFuture30yUpperAnnualAmd(year);

      const fyQty   = (isZrd || year > lastYear || year < firstYear) ? 0
        : year === partialCreditYear
          ? Math.max(0, Math.round((yearDara - runningLMI - excessLMI - partialCredit - future30yAmd) / pi))
          : Math.max(0, Math.round((yearDara - runningLMI - excessLMI - future30yAmd) / pi));

      corrFYQty[year] = fyQty;
      runningLMI += (fyQty + exQty) * 1000 * ir * (bond.coupon ?? 0);
    }
  }

  return {
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
  };
}
