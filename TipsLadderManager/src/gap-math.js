// gap-math.js — Gap year analysis, bracket sizing, and ladder sweep helpers
// Spec: knowledge/4.0_Computation_Modules.md §gap-math.js
// Math reference: knowledge/3.0_TIPS_Ladder_Rebalancing.md Phase 2, Phase 3, Phase 4

import { calculateDurationDetail, priceFromYield } from '../../shared/src/bond-math.js';

// ─── Yield interpolation ──────────────────────────────────────────────────────
// Spec: 4.0 Phase 2, 3.0 Synthetic TIPS Construction
export function interpolateYield(anchorBefore, anchorAfter, targetDate) {
  if (!anchorBefore || !anchorAfter || !targetDate) return NaN;
  const y1 = parseFloat(anchorBefore.yield);
  const y2 = parseFloat(anchorAfter.yield);
  return y1 + (targetDate - anchorBefore.maturity) * (y2 - y1) / (anchorAfter.maturity - anchorBefore.maturity);
}

// ─── Synthetic coupon ─────────────────────────────────────────────────────────
// Spec: 4.0 Phase 2, 3.0 Synthetic TIPS Construction. MAX(0.125%, the eighth at or below the yield).
// Counted in whole eighths (yield × 800) with a tolerance far below any quoted yield's precision:
// in floating point 0.03625 × 100 / 0.125 is 28.999999999999996, so a plain FLOOR dropped one eighth
// at exactly 3.625% and 7.25%. Dividing the whole count by 800 gives the double nearest the eighth.
// DD §Synthetic TIPS: the Index Ratio of a Synthetic TIPS is taken as 1.00000. Carried on each breakdown
// entry so the popups show the figure the cost used.
export const SYNTHETIC_INDEX_RATIO = 1;

const EIGHTHS_PER_UNIT = 800;
const EIGHTH_COUNT_TOLERANCE = 1e-9;
export function syntheticCoupon(yld) {
  return Math.max(1, Math.floor(yld * EIGHTHS_PER_UNIT + EIGHTH_COUNT_TOLERANCE)) / EIGHTHS_PER_UNIT;
}

// ─── Bracket weights ──────────────────────────────────────────────────────────
// Spec: 4.0 Phase 3c
// Weights are shares of the block cost, so neither can go negative or above 1. If the target
// duration falls outside [lowerDuration, upperDuration] — e.g. a deep-discount, near-zero-coupon
// cover durations-out past a higher-coupon block average — clamp to the nearer cover
// (weight 1) rather than solve past it. Accepts a slightly larger duration-match delta in that
// corner case in exchange for never buying/selling a negative quantity.
export function bracketWeights(lowerDuration, upperDuration, avgGapDuration) {
  // Degenerate guard: when the two cover durations coincide, split evenly (avoids /0).
  if (Math.abs(upperDuration - lowerDuration) < 0.0001) return { lowerWeight: 0.5, upperWeight: 0.5 };
  const rawLowerWeight = (upperDuration - avgGapDuration) / (upperDuration - lowerDuration);
  const lowerWeight = Math.min(1, Math.max(0, rawLowerWeight));
  return { lowerWeight, upperWeight: 1 - lowerWeight };
}

// ─── Bracket weights with retained lower brackets ──────────────────────
// Spec: 2.0 §Retained Bracket Excess; 3.0 §Lower bracket priority rule.
//
// The plain 2-bracket `bracketWeights` above assumes EVERY lower bracket dollar sits at the
// active lower bracket's duration. That is false once excess is retained in older maturities:
// they are shorter, so the realized blend lands short of `dGap` and the gap is under-matched.
// (That was the shipped behavior from 463b07a until this function replaced it.)
//
// Here the retained maturities are FROZEN at the excess the portfolio already holds — never
// increased — so their weights are inputs, not unknowns. Only the active lower bracket and the
// upper bracket are solved, and they absorb whatever the retained legs leave over:
//
//   Σ wᵣ·dᵣ + w_act·d_act + w_up·d_up = dGap        (duration match, all legs counted)
//   Σ wᵣ    + w_act       + w_up      = 1
//
// Let R = Σ wᵣ (retained share of the block) and D_R = Σ wᵣ·dᵣ. Then
//   w_up  = ((dGap − D_R) − (1 − R)·d_act) / (d_up − d_act)
//   w_act = (1 − R) − w_up
//
// **Over-allocated → sell the earliest leg, only as much as restoring the match requires.** If
// w_act solves negative, the lower brackets are carrying more than the block needs. Solve for the
// exact weight of the earliest retained leg that brings w_act back to 0 (holding every other leg
// fixed), clamp it to [0, currently held], and re-solve. Only if depleting that leg entirely is
// still not enough does the next-earliest leg get the same treatment. Selling a whole leg when a
// partial sale would do is needless trading, not the rule.
//
// `retained` is oldest → newest. `activeFloorWeight` (optional, default 0) is the active lower
// bracket's OWN currently-held excess, expressed as a share of totalBlockCost — the active bracket
// is "the only lower bracket a rebalance buys" (DATA_DICTIONARY §Active Lower Bracket); it is
// never sold to make room for a duration match the way retained legs may be. When the unconstrained
// solve would require shrinking active BELOW what it already holds, that is over-allocation exactly
// as much as a negative wAct is — the retained legs (oldest first) are sold down further to make
// room, so active never loses ground to an older, already-retained leg. Passing the default 0
// reproduces the exact old behavior (only a literal negative wAct triggers selling), so every
// existing caller/test that doesn't pass this is unaffected.
//
// Returns weights as shares of the total block cost.
export function bracketWeightsN({ retained = [], dActive, dUpper, dGap, totalBlockCost, activeFloorWeight = 0 }) {
  const degenerate = Math.abs(dUpper - dActive) < 0.0001;
  const n = retained.length;
  const floor = Math.max(0, activeFloorWeight || 0);

  // Retained weights as held (frozen). Zero block cost → nothing to allocate.
  const w = totalBlockCost > 0
    ? retained.map(r => Math.max(0, (r.excessCost ?? 0) / totalBlockCost))
    : retained.map(() => 0);

  const solve = () => {
    const R   = w.reduce((s, x) => s + x, 0);
    const D_R = w.reduce((s, x, i) => s + x * (retained[i].duration ?? 0), 0);
    if (degenerate) {                       // durations coincide: split the remainder evenly
      const rest = Math.max(0, 1 - R);
      return { wAct: rest / 2, wUp: rest / 2 };
    }
    const wUp  = ((dGap - D_R) - (1 - R) * dActive) / (dUpper - dActive);
    return { wAct: (1 - R) - wUp, wUp };
  };

  let { wAct, wUp } = solve();

  // wAct < floor means the lower brackets are carrying more than the block needs while still leaving
  // room for the active bracket's own current holding — you would have to shrink active below what
  // it already holds (floor=0: a literal negative amount) to come back to dGap. Sell the EARLIEST
  // retained maturity, and only as much as it takes to bring wAct back up to exactly `floor`; if
  // depleting it entirely still is not enough, move to the next earliest. Selling a whole leg when
  // a partial sale would do forces needless trading.
  //
  // Holding every other leg fixed, the weight of leg i that lands exactly on wAct = floor is
  //   wᵢ = [dGap − D_fixed − floor·d_act − (1 − R_fixed − floor)·d_up] / (dᵢ − d_up)
  // from the same two equations with w_act fixed at `floor` instead of dropped entirely; floor = 0
  // reduces this to the original formula exactly.
  let sold = false;
  for (let i = 0; i < n && wAct < floor; i++) {
    const R_fixed = w.reduce((s, x, j) => j === i ? s : s + x, 0);
    const D_fixed = w.reduce((s, x, j) => j === i ? s : s + x * (retained[j].duration ?? 0), 0);
    const di      = retained[i].duration ?? 0;
    const den     = di - dUpper;
    const wanted  = Math.abs(den) < 0.0001 ? 0 : (dGap - D_fixed - floor * dActive - (1 - R_fixed - floor) * dUpper) / den;
    const next    = Math.min(w[i], Math.max(0, wanted));   // never increase, never below zero
    if (next !== w[i]) { w[i] = next; sold = true; }
    ({ wAct, wUp } = solve());
  }

  // With every retained leg sold off this reduces to the plain 2-bracket case (activeFloorWeight
  // permitting), which always has a solution when the gap average sits between the two bracket
  // durations. `feasible` stays as a signal for the degenerate inputs (coincident durations, dGap
  // outside the bracket span, or a floor too high for even zero retained to satisfy).
  const feasible = wAct >= floor - 1e-9 && wUp >= -1e-9;
  // Which condition blocked the solve, so a caller can say what happened rather than re-deriving
  // the same three tests. Coincident durations report even when the weights come back inside
  // their bounds, because the even split does not reproduce dGap.
  const reason = degenerate ? 'coincidentDurations'
    : feasible ? null
    : wUp < -1e-9 ? 'upperWeightNegative'
    : 'activeBelowFloor';
  return { retainedWeights: w, activeWeight: wAct, upperWeight: wUp, feasible, reason, sold };
}

// ─── Bracket excess quantities ────────────────────────────────────────────────
// Spec: 4.0 Phase 3c, 4.0 Named Quantities excessQtyAfter
export function bracketExcessQtys(totalCost, lowerWeight, upperWeight, lowerCostPerBond, upperCostPerBond) {
  return {
    lowerExQty: lowerCostPerBond > 0 ? Math.round(totalCost * lowerWeight / lowerCostPerBond) : 0,
    upperExQty: upperCostPerBond > 0 ? Math.round(totalCost * upperWeight / upperCostPerBond) : 0,
  };
}

// ─── Gap parameters core sweep (shared by build and rebalance) ─────────────────
// Spec: 2.0 §Gap Years, §Duration Matching. Single source of truth for the gap-year
// synthetic ladder sweep. The ONLY thing build and rebalance supply differently is
// `lmiAboveByYear` — { [year]: annual coupon $ from funded years above the gap }:
//   • build derives it from its prelim funded sweep,
//   • rebalance derives it from holdings/targets (the actual TIPS above the gap years).
// Everything here — anchors, synthetic construction, qty formula, cost-weighted avg
// duration — is identical for both. Returns { avgDuration, totalCost, breakdown, anchors }.
// The gap or Future 30Y parameters with every Synthetic TIPS quantity (and the interest of the later ones that the earlier years count
// as LMI) reduced to the share `f` of what was sized: the Before state of a holder whose Excess TIPS (Cover Excess) pays for only that
// share (3.0 §Before and the gap year rebalances; §Before and the Future 30Y rebalances). `f` = 1 returns the parameters unchanged.
export function scaleSimulatedParams(params, f) {
  if (!params || !(f < 1)) return params;
  const share = Math.max(0, f);
  const breakdown = (params.breakdown ?? []).map(g => {
    const qty = Math.max(0, Math.round(g.qty * share));
    return { ...g, qty, qtyExact: g.qtyExact * share, laterMatInt: g.laterMatInt * share, cost: qty * g.costPerBond, annualInt: qty * 1000 * g.synCpn };
  });
  const totalCost = breakdown.reduce((s, g) => s + g.cost, 0);
  return { ...params, breakdown, ...('totalCost' in params ? { totalCost } : {}), ...('future30yTotalCost' in params ? { future30yTotalCost: totalCost } : {}) };
}

export function gapParamsCore({ gapYears, tipsMarketData, settlementDate, dara, daraByYear = null, lmiAboveByYear = {}, pliCreditByGapYear = {} }) {
  if (!gapYears || gapYears.length === 0) return { avgDuration: 0, totalCost: 0, breakdown: [] };
  const minGapYear = Math.min(...gapYears);
  const maxGapYear = Math.max(...gapYears);

  // Anchors: latest-maturing TIPS below the gap (the most recently issued 10-year); nearest Feb TIPS above.
  let anchorBefore = null, anchorAfter = null;
  for (const bond of tipsMarketData.values()) {
    if (!bond.maturity || !bond.yield) continue;
    const yr = bond.maturity.getFullYear(), mo = bond.maturity.getMonth() + 1;
    if (yr < minGapYear && (!anchorBefore || bond.maturity > anchorBefore.maturity))
      anchorBefore = { maturity: bond.maturity, yield: bond.yield };
    if (mo === 2 && yr > maxGapYear && (!anchorAfter || bond.maturity < anchorAfter.maturity))
      anchorAfter = { maturity: bond.maturity, yield: bond.yield };
  }
  if (!anchorBefore || !anchorAfter)
    throw new Error('Could not find yield interpolation anchors for gap years');

  let totalDuration = 0, totalCost = 0, count = 0;
  const breakdown = [];
  // Process longest→shortest so each gap year's synthetic interest feeds the next shorter rung.
  let runningSynLMI = 0;
  for (const year of [...gapYears].sort((a, b) => b - a)) {
    const synMat = new Date(year, 0, 15); // Jan 15 — 10-year TIPS mature in Jan and Jul (2.0 §Synthetic TIPS for Gap Years)
    const synYld = interpolateYield(anchorBefore, anchorAfter, synMat);
    const synCpn = syntheticCoupon(synYld);
    const durDetail = calculateDurationDetail(settlementDate, synMat, synCpn, synYld);
    const synDur = durDetail ? durDetail.macaulay / (1 + synYld / 2) : null;
    totalDuration += synDur;

    // LMI = synthetic interest from longer gap years already processed + actual TIPS interest above.
    let laterMatInt = runningSynLMI;
    for (const y in lmiAboveByYear) {
      if (parseInt(y) > year) laterMatInt += lmiAboveByYear[y];
    }

    const piPerBond = 1000 + 1000 * synCpn * 0.5;
    const yearDara = daraByYear?.get(year) ?? dara;
    // qtyExact is the quotient before rounding and before the floor at 0, kept so the Gap Year
    // Duration drill shows the same number the rounding acted on (5.0 §Quantity, cost and duration in one section).
    const qtyExact = (yearDara - laterMatInt - (pliCreditByGapYear[year] ?? 0)) / piPerBond;
    const qty = Math.max(0, Math.round(qtyExact));
    // Priced as a security issued today off its own yield and coupon, not assumed to be par:
    // the coupon is the eighth at or below the yield, so the price sits at or just below 100
    // when the real yield is positive, and above 100 when a negative yield meets the 0.125%
    // coupon floor. 2.0 §Synthetic TIPS for Gap Years.
    const synPrice = priceFromYield(synYld, synCpn, settlementDate, synMat) ?? 100;
    const costPerBond = 1000 * synPrice * SYNTHETIC_INDEX_RATIO / 100;
    const cost = qty * costPerBond;
    totalCost += cost;
    // annualInt: the annual interest of this year's Synthetic TIPS, which every shorter year's LMI includes.
    const annualInt = qty * 1000 * synCpn;
    breakdown.push({ year, qty, qtyExact, piPerBond, laterMatInt, pliCredit: pliCreditByGapYear[year] ?? 0, dara: yearDara, dur: synDur, synYld, synCpn, synPrice, indexRatio: SYNTHETIC_INDEX_RATIO, costPerBond, cost, annualInt, durDetail });
    runningSynLMI += annualInt;
    count++;
  }

  // Cost-weighted average duration (2.0 §Average Block Duration is Cost-Weighted): each synthetic
  // gap-year TIPS is weighted by what it would cost, qty × costPerBond. Not by quantity — the
  // synthetics price near par but not at it, so the two differ, and they differ more as the
  // per-year DARA varies across the gap years. Simple mean only when there is no quantity to
  // weight by.
  const _costSum = breakdown.reduce((s, g) => s + g.cost, 0);
  const avgDuration = _costSum > 0
    ? breakdown.reduce((s, g) => s + g.cost * g.dur, 0) / _costSum
    : (count > 0 ? totalDuration / count : 0);
  return { avgDuration, totalCost, breakdown, anchors: { before: anchorBefore, after: anchorAfter } };
}

// ─── Future 30Y parameters core (shared by build and rebalance) ────────────────
// Spec: 2.0 §Future 30Y Rungs, §Duration Matching. Pass 1 for the Future 30Y years: Synthetic TIPS
// sized off the longest-dated issued TIPS (anchorBond) as a flat-curve anchor, coupon =
// syntheticCoupon(anchor yield). No actual TIPS exist above these years, so the only LMI is the
// running synthetic accumulator, and build and rebalance supply identical inputs (cf. gapParamsCore).
// Returns { avgDuration, future30yTotalCost, breakdown, future30ySeedLMI, anchorBond }.
export function future30yParamsCore({ future30yYears, anchorBond, settlementDate, dara, daraByYear = null }) {
  if (!future30yYears?.length || !anchorBond) return { avgDuration: 0, future30yTotalCost: 0, breakdown: [], future30ySeedLMI: 0, anchorBond: anchorBond ?? null };
  const anchorYield = anchorBond.yield ?? 0;
  const synCoupon = syntheticCoupon(anchorYield);
  const piPerBond = 1000 + 1000 * synCoupon * 0.5;   // Feb maturity → halfOrFull 0.5; IR 1.0 (par)
  let totalDuration = 0, future30yTotalCost = 0, runningLMI = 0;
  const breakdown = [];
  for (const year of [...future30yYears].sort((a, b) => b - a)) {
    const mat = new Date(year, 1, 15); // Feb 15
    const durDetail = calculateDurationDetail(settlementDate, mat, synCoupon, anchorYield);
    const dur = durDetail ? durDetail.macaulay / (1 + anchorYield / 2) : null;
    totalDuration += dur;
    const yearDara = daraByYear?.get(year) ?? dara;
    const qtyExact = (yearDara - runningLMI) / piPerBond;   // before rounding and the floor at 0, as in gapParamsCore
    const qty = Math.max(0, Math.round(qtyExact));
    // Priced as a security issued today off the anchor yield and the synthetic coupon, not
    // assumed to be par — same rule as the gap synthetics (2.0 §Future 30Y Rungs).
    const synPrice = priceFromYield(anchorYield, synCoupon, settlementDate, mat) ?? 100;
    const costPerBond = 1000 * synPrice * SYNTHETIC_INDEX_RATIO / 100;
    const cost = qty * costPerBond;
    const annualInt = qty * 1000 * synCoupon;   // annual interest of this year's Synthetic TIPS, part of every shorter year's LMI
    breakdown.push({ year, qty, qtyExact, piPerBond, laterMatInt: runningLMI, dara: yearDara, dur, synYld: anchorYield, synCpn: synCoupon, synPrice, indexRatio: SYNTHETIC_INDEX_RATIO, costPerBond, cost, annualInt, durDetail });
    runningLMI += annualInt;
    future30yTotalCost += cost;
  }
  // Cost-weighted average duration, the same rule as the gap years (2.0 §Average Gap Year
  // Duration is Cost-Weighted): each synthetic rung weighted by qty × costPerBond.
  const _costSum = breakdown.reduce((s, b) => s + b.cost, 0);
  const avgDuration = _costSum > 0
    ? breakdown.reduce((s, b) => s + b.cost * b.dur, 0) / _costSum
    : (future30yYears.length > 0 ? totalDuration / future30yYears.length : 0);
  return { avgDuration, future30yTotalCost, breakdown, future30ySeedLMI: runningLMI, anchorBond };
}
