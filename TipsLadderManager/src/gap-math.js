// gap-math.js — Gap year analysis, bracket sizing, and ladder sweep helpers
// Spec: knowledge/4.0_Computation_Modules.md §gap-math.js
// Math reference: knowledge/3.0_TIPS_Ladder_Rebalancing.md Phase 2, Phase 3, Phase 4

import { calculateMDuration } from '../../shared/src/bond-math.js';

// ─── Yield interpolation ──────────────────────────────────────────────────────
// Spec: 4.0 Phase 2, 3.0 Synthetic TIPS Construction
export function interpolateYield(anchorBefore, anchorAfter, targetDate) {
  if (!anchorBefore || !anchorAfter || !targetDate) return NaN;
  const y1 = parseFloat(anchorBefore.yield);
  const y2 = parseFloat(anchorAfter.yield);
  return y1 + (targetDate - anchorBefore.maturity) * (y2 - y1) / (anchorAfter.maturity - anchorBefore.maturity);
}

// ─── Synthetic coupon ─────────────────────────────────────────────────────────
// Spec: 4.0 Phase 2, 3.0 Synthetic TIPS Construction
export function syntheticCoupon(yld) {
  return Math.max(0.00125, Math.floor(yld * 100 / 0.125) * 0.00125);
}

// ─── Bracket weights ──────────────────────────────────────────────────────────
// Spec: 4.0 Phase 3c
export function bracketWeights(lowerDuration, upperDuration, avgGapDuration) {
  const lowerWeight = (upperDuration - avgGapDuration) / (upperDuration - lowerDuration);
  return { lowerWeight, upperWeight: 1 - lowerWeight };
}

// ─── Bracket excess quantities ────────────────────────────────────────────────
// Spec: 4.0 Phase 3c, 4.0 Named Quantities excessQtyAfter
export function bracketExcessQtys(totalCost, lowerWeight, upperWeight, lowerCostPerBond, upperCostPerBond) {
  return {
    lowerExQty: lowerCostPerBond > 0 ? Math.round(totalCost * lowerWeight / lowerCostPerBond) : 0,
    upperExQty: upperCostPerBond > 0 ? Math.round(totalCost * upperWeight / upperCostPerBond) : 0,
  };
}

// ─── Funded year qty (simple single-CUSIP case) ───────────────────────────────
// Spec: 4.0 Phase 4 step 2 targetFYQty, 5.0 §fyQty
// Note: multi-bond year logic in rebalance-lib.js extends this with sell-earliest-first
export function fyQty(dara, laterMatInt, piPerBond) {
  return Math.max(0, Math.round((dara - laterMatInt) / piPerBond));
}

// ─── 3-Bracket weights ────────────────────────────────────────────────────────
// Spec: 4.0 §3-Bracket Mode
// d1=origLower, d2=newLower, d3=upper, Dg=gapAvgDuration
// origExcess$ = current excess cost in original lower bracket
export function bracketWeights3(d1, d2, d3, Dg, origExcess$, gapTotalCost) {
  if (gapTotalCost <= 0) return { origLowerWeight: 0, newLowerWeight: 0, upperWeight: 0, feasible: true };
  // 2-bracket optimal lower weight — cap w1 so selling occurs when orig lower overshoots.
  const lw2b  = Math.abs(d3 - d1) > 0.0001 ? (d3 - Dg) / (d3 - d1) : 0.5;
  const w1_raw = origExcess$ / gapTotalCost;
  if (w1_raw >= lw2b) {
    return { origLowerWeight: lw2b, newLowerWeight: 0, upperWeight: 1 - lw2b, feasible: true };
  }
  const w1    = w1_raw;
  const den   = d2 - d3;
  if (Math.abs(den) < 0.0001) return { origLowerWeight: w1, newLowerWeight: Math.max(0, 1 - w1) / 2, upperWeight: Math.max(0, 1 - w1) / 2, feasible: true };
  const w2raw = (Dg - d3 + w1 * (d3 - d1)) / den;
  const w2    = Math.max(0, w2raw);
  const w3    = 1 - w1 - w2;
  return { origLowerWeight: w1, newLowerWeight: w2, upperWeight: w3, feasible: w2raw >= 0 };
}

// ─── Later maturity interest contribution ─────────────────────────────────────
// Spec: 4.0 Phase 4 step 4
// annualInt comes from bondCalcs(bond, refCPI).annualInt
export function laterMatIntContribution(qty, annualInt) {
  return qty * annualInt;
}
