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

import { bondCalcs, calculateMDuration, couponSchedule, priceFromYield } from '../../shared/src/bond-math.js';
import { actualPaymentDate, lastBusinessDayOfMonth } from '../../shared/src/settlement.js';
import { indexRatio as calcIndexRatio } from '../../shared/src/ref-cpi.js';
import { bracketWeights, bracketWeightsN, bracketExcessQtys, fyQty as _fyQty, gapParamsCore, future30yParamsCore, syntheticCoupon } from './gap-math.js';
import { addMonths } from './date-util.js';

// ─── Default First Year ─────────────────────────────────────────────────────────
// Spec: DD §5.1 (EXCLUDE_MATURING_WITHIN_MONTHS, Default First Year). A TIPS maturing no later than this many
// months after the Settlement Date is not offered in Build: it is absent from the First Year list and is
// not chosen for a funded year (2.0 §Maturity Selection Within a Funded Year). One definition; the Build
// tab, runBuild and selectLadderBonds' `excludeMaturingWithinMonths` all read it here. 0 turns the exclusion off.
export const EXCLUDE_MATURING_WITHIN_MONTHS = 3;

// The TIPS maturing more than `excludeMaturingWithinMonths` months after the Settlement Date.
export function tipsMaturingAfterExclusion(tipsMarketData, settlementDate, excludeMaturingWithinMonths = EXCLUDE_MATURING_WITHIN_MONTHS) {
  const cutoff = addMonths(settlementDate, excludeMaturingWithinMonths);
  return [...tipsMarketData.values()].filter(b => b.maturity && b.maturity > cutoff);
}

// The Build tab's default First Year: the earliest maturity year with a TIPS maturing after the excluded months; null when none.
export function defaultFirstYear(tipsMarketData, settlementDate, excludeMaturingWithinMonths = EXCLUDE_MATURING_WITHIN_MONTHS) {
  const years = tipsMaturingAfterExclusion(tipsMarketData, settlementDate, excludeMaturingWithinMonths).map(b => b.maturity.getFullYear());
  return years.length ? Math.min(...years) : null;
}

// The upper bracket year: the maturity year of the 30-year TIPS above the gap years (DD §5.1 Upper bracket year).
export const UPPER_BRACKET_YEAR = 2040;

// The gap years (DD Gap Years): the maturity years below the upper bracket year that lie above every issued
// maturity year, where no 10-year TIPS has yet been issued. Single source; every consumer imports it. A year
// below the longest-dated issued maturity year with no TIPS is not a gap year, and neither is a year before
// the first year that has a TIPS (the short end): such a year has no rung and nothing covers it.
export function getGapYears(tipsMarketData) {
  if (!tipsMarketData) return [];
  let longest = null;
  for (const b of tipsMarketData.values()) {
    if (!b.maturity) continue;
    const y = b.maturity.getFullYear();
    if (y < UPPER_BRACKET_YEAR && (longest == null || y > longest)) longest = y;
  }
  const gapYears = [];
  if (longest == null) return gapYears;
  for (let y = longest + 1; y < UPPER_BRACKET_YEAR; y++) gapYears.push(y);
  return gapYears;
}

// ─── Gap parameters adapter ─────────────────────────────────────────────────────
// Build's "LMI above the gap" = prelim funded-year coupon (effective prelim: zeroed years = 0).
// Sizing lives in the shared gapParamsCore; the Excess TIPS pays no interest in a gap year (2.0 §Gap Year Simulated Outstanding TIPS).
function calcGapParams(gapYears, tipsMarketData, settlementDate, refCPI, dara, prelim, pliCreditByGapYear = {}, daraByYear = null) {
  const lmiAboveByYear = {};
  for (const [y, p] of Object.entries(prelim)) lmiAboveByYear[y] = p.annualInterest;
  return gapParamsCore({ gapYears, tipsMarketData, settlementDate, dara, daraByYear, lmiAboveByYear, pliCreditByGapYear });
}

// ─── Future 30Y anchor and cover pair ───────────────────────────────────────────
// Spec: 2.0 §Future 30Y Rungs (the anchor is the longest-dated issued TIPS), §Future 30Y Cover
// Pair; DD §5.0 (LOWER_COVER_YIELD), §5.1 (Lower cover, Upper cover). Measured at settlement, from
// market data alone:
//   lower cover = the outstanding TIPS with the longest modified duration at or below that of the
//                 Synthetic TIPS of the first Future 30Y year alone, that Synthetic TIPS measured at
//                 LOWER_COVER_YIELD (its coupon the eighth at or below that yield, syntheticCoupon);
//   upper cover = the outstanding TIPS with the longest modified duration, excluding the lower cover.
// Each outstanding TIPS is measured at its own market yield. Longest duration, not longest maturity:
// a deep-discount, low-coupon TIPS can carry a longer duration than a later maturity. Returns null
// when the market has no outstanding TIPS.
export const LOWER_COVER_YIELD = 0.04;
export function selectFuture30yCovers({ tipsMarketData, settlementDate }) {
  let anchorBond = null;
  const outstanding = [];
  for (const b of tipsMarketData.values()) {
    if (!b.maturity || b.maturity <= settlementDate || b.yield == null) continue;
    outstanding.push(b);
    if (!anchorBond || b.maturity > anchorBond.maturity) anchorBond = b;
  }
  if (!anchorBond) return null;
  const maxTipsYear = anchorBond.maturity.getFullYear();
  const firstSyntheticDuration = calculateMDuration(settlementDate, new Date(maxTipsYear + 1, 1, 15), syntheticCoupon(LOWER_COVER_YIELD), LOWER_COVER_YIELD);
  const withDur = outstanding
    .map(bond => ({ bond, dur: calculateMDuration(settlementDate, bond.maturity, bond.coupon ?? 0, bond.yield) }))
    .filter(x => x.dur != null);
  let lower = null, upper = null;
  for (const x of withDur) if (x.dur <= firstSyntheticDuration && (!lower || x.dur > lower.dur)) lower = x;
  for (const x of withDur) if (x !== lower && (!upper || x.dur > upper.dur)) upper = x;
  return {
    anchorBond, maxTipsYear, firstSyntheticDuration,
    lowerCoverBond: lower?.bond ?? null, lowerDuration: lower?.dur ?? null,
    upperCoverBond: upper?.bond ?? null, upperDuration: upper?.dur ?? null,
  };
}

// ─── Future 30Y cover sizing: duration match → cover excess quantities ─────────
// Spec: 2.0 §Duration Matching (Brackets), §Future 30Y Rungs. Pass 1 for the Future 30Y years and
// the Cover Excess at settlement. Single source of truth for build (via sizeLadder below) AND
// rebalance, which needs the Pass 1 sizing before the rest of sizeLadder runs.
// Returns { future30yParams, future30yLowerDuration, future30yUpperDuration,
//           future30yLowerWeight, future30yUpperWeight, future30yLowerExQty, future30yUpperExQty,
//           future30yFellBack, future30yCoverReason, future30yTotalExcessCost, future30yLowerMonth, future30yUpperMonth }.
// No-op shape (all zero/null) when future30yYears is empty.
export function sizeFuture30yCover({
  future30yYears, future30yLowerCoverBond, future30yUpperCoverBond, future30yAnchorBond = null,
  settlementDate, dara, daraByYear = null, refCPI,
}) {
  let future30yParams = null;
  let future30yLowerDuration = 0, future30yUpperDuration = 0;
  let future30yUpperWeight = 0, future30yLowerWeight = 0;
  let future30yUpperExQty = 0, future30yLowerExQty = 0;
  let future30yFellBack = false, future30yCoverReason = null;
  let future30yTotalExcessCost = 0;
  let future30yLowerMonth = null, future30yUpperMonth = null;

  if (future30yYears.length > 0) {
    future30yParams = future30yParamsCore({ future30yYears, anchorBond: future30yAnchorBond, settlementDate, dara, daraByYear });
    future30yLowerDuration = calculateMDuration(settlementDate, future30yLowerCoverBond.maturity, future30yLowerCoverBond.coupon ?? 0, future30yLowerCoverBond.yield ?? 0);
    future30yUpperDuration = calculateMDuration(settlementDate, future30yUpperCoverBond.maturity, future30yUpperCoverBond.coupon ?? 0, future30yUpperCoverBond.yield ?? 0);

    ({ lowerWeight: future30yLowerWeight, upperWeight: future30yUpperWeight } = bracketWeights(future30yLowerDuration, future30yUpperDuration, future30yParams.avgDuration));
    // bracketWeights clamps in both directions (KNOWN_ISSUES: negative weight on a short
    // single-year Future 30Y run). Both corners leave the whole weight on one cover, so both
    // are reported, not just the upper one.
    if (future30yParams.avgDuration > future30yUpperDuration) {
      future30yFellBack = true; future30yCoverReason = 'aboveUpper';
    } else if (future30yParams.avgDuration < future30yLowerDuration) {
      future30yFellBack = true; future30yCoverReason = 'belowLower';
    }

    const future30yLowerCPB = (future30yLowerCoverBond.price ?? 0) / 100 * calcIndexRatio(refCPI, future30yLowerCoverBond.datedDateRefCpi ?? refCPI) * 1000;
    const future30yUpperCPB = (future30yUpperCoverBond.price ?? 0) / 100 * calcIndexRatio(refCPI, future30yUpperCoverBond.datedDateRefCpi ?? refCPI) * 1000;
    ({ lowerExQty: future30yLowerExQty, upperExQty: future30yUpperExQty } = bracketExcessQtys(future30yParams.future30yTotalCost, future30yLowerWeight, future30yUpperWeight, future30yLowerCPB, future30yUpperCPB));
    future30yTotalExcessCost = future30yLowerExQty * future30yLowerCPB + future30yUpperExQty * future30yUpperCPB;
    future30yLowerMonth = BL_MONTHS[future30yLowerCoverBond.maturity.getMonth()];
    future30yUpperMonth = BL_MONTHS[future30yUpperCoverBond.maturity.getMonth()];
  }

  return {
    future30yParams, future30yLowerDuration, future30yUpperDuration,
    future30yLowerWeight, future30yUpperWeight, future30yLowerExQty, future30yUpperExQty,
    future30yFellBack, future30yCoverReason, future30yTotalExcessCost, future30yLowerMonth, future30yUpperMonth,
  };
}

// ─── Simulated Outstanding TIPS: the rebalances at the issue dates ──────────────
// Spec: 2.0 §Future 30Y Simulated Outstanding TIPS and §Gap Year Simulated Outstanding TIPS, one
// rule with two parameter sets (4.0 §build-lib.js / rebalance-lib.js). Each Future 30Y year's TIPS is
// issued on the last trading day of February, 30 years before its maturity year; each gap year's on
// the last trading day of January, 10 years before. The conversions are taken in order, earliest
// issue date first. Each conversion is a rebalance measured on the issue date: the Synthetic TIPS
// keep the yield and coupon Pass 1 gave them and each bracket TIPS (cover, for the Future 30Y years)
// keeps its yield and coupon, so only the dates move. Index ratios stay at their settlement values
// (Synthetic TIPS 1.00000), so every dollar figure here is in the same Ref CPI basis as the rest of
// the ladder.
//   1. The Synthetic TIPS not yet issued are the years later than the one being issued; their
//      average duration is cost-weighted.
//   2. Both bracket TIPS are re-measured; the Bracket Weights are solved again (held within 0 to 1).
//   3. The Excess TIPS each bracket should hold = ROUND(total cost of the Synthetic TIPS not yet
//      issued × weight ÷ cost per TIPS).
//   4. The Excess TIPS goes to that quantity: the Cover Excess for the Future 30Y years, the active lower
//      bracket and the upper bracket for the gap years. Sales are expected, and a bracket that holds less
//      buys the difference. With Retained Bracket Excess the retained maturities are never bought: they
//      are frozen at what they hold and sold earliest first only as far as the match requires
//      (bracketWeightsN, 2.0 §Retained Bracket Excess); the active lower bracket is never sold to make
//      room for them.
//      The Simulated Outstanding TIPS is bought at the quantity Pass 1 sized. netCash = excess sold − that TIPS' cost.
// After the last conversion no Synthetic TIPS are left, so the Excess TIPS is 0.
// The Future 30Y quantities after each conversion come from the duration match alone, so they do not
// depend on lowerQty0/upperQty0 (the Cover Excess held before the first issue date); only the first
// conversion's netCash does. The gap year quantities after a conversion also come from the duration
// match, except that a retained maturity keeps the lesser of the quantity held and the match (never bought),
// so those depend on them.
// `monthIndex` is the month (0-based) of the issue date and of the Synthetic TIPS' maturity, January 15
// or February 15; the TIPS pays coupons on that day and six months later.
const SIMULATED_TIPS = {
  future30y: { yearsBefore: 30, monthIndex: 1 },
  gap:       { yearsBefore: 10, monthIndex: 0 },
};

function simulatedIssueDate(kind, year, bondHolidays) {
  const { yearsBefore, monthIndex } = SIMULATED_TIPS[kind];
  return lastBusinessDayOfMonth(year - yearsBefore, monthIndex, bondHolidays);
}

export function future30yIssueDate(future30yYear, bondHolidays = new Set()) {
  return simulatedIssueDate('future30y', future30yYear, bondHolidays);
}
export function gapIssueDate(gapYear, bondHolidays = new Set()) {
  return simulatedIssueDate('gap', gapYear, bondHolidays);
}

// `retained`: [{ bond, qty0 }], oldest first — the retained lower bracket maturities, each with the Excess
// TIPS it holds before the first conversion (gap years only).
function simulatedRebalances({ kind, breakdown: rows, lowerBond, upperBond, retained = [], refCPI, bondHolidays = new Set(), lowerQty0 = 0, upperQty0 = 0 }) {
  const { monthIndex } = SIMULATED_TIPS[kind];
  const breakdown = [...(rows ?? [])].sort((a, b) => a.year - b.year);
  const retainedQty0 = retained.map(r => r.qty0 ?? 0);
  if (!breakdown.length || !lowerBond || !upperBond) return { conversions: [], lowerQty0, upperQty0, retainedQty0 };
  const irOfBond = (bond) => calcIndexRatio(refCPI, bond.datedDateRefCpi ?? refCPI);
  const irL = irOfBond(lowerBond), irU = irOfBond(upperBond);
  const cpbOn = (bond, ir, date) => (priceFromYield(bond.yield ?? 0, bond.coupon ?? 0, date, bond.maturity) ?? 0) / 100 * ir * 1000;
  const durOn = (bond, date) => calculateMDuration(date, bond.maturity, bond.coupon ?? 0, bond.yield ?? 0);
  const conversions = [];
  let lowerQty = lowerQty0, upperQty = upperQty0, retainedQty = [...retainedQty0];
  for (let k = 0; k < breakdown.length; k++) {
    const entry = breakdown[k];
    const issueDate = simulatedIssueDate(kind, entry.year, bondHolidays);
    const notYetIssued = breakdown.slice(k + 1).map(r => {
      const mat = new Date(r.year, monthIndex, 15);
      const price = priceFromYield(r.synYld, r.synCpn, issueDate, mat) ?? 100;
      return { year: r.year, dur: calculateMDuration(issueDate, mat, r.synCpn, r.synYld), cost: r.qty * 1000 * price / 100 };
    });
    const notYetIssuedCost = notYetIssued.reduce((s, r) => s + r.cost, 0);
    const avgDuration = notYetIssued.length === 0 ? null
      : notYetIssuedCost > 0 ? notYetIssued.reduce((s, r) => s + r.cost * r.dur, 0) / notYetIssuedCost
      : notYetIssued.reduce((s, r) => s + r.dur, 0) / notYetIssued.length;
    const lowerDuration = durOn(lowerBond, issueDate), upperDuration = durOn(upperBond, issueDate);
    const lowerCostPerBond = cpbOn(lowerBond, irL, issueDate), upperCostPerBond = cpbOn(upperBond, irU, issueDate);
    const retainedCostPerBond = retained.map(r => cpbOn(r.bond, irOfBond(r.bond), issueDate));
    let lowerWeight = 0, upperWeight = 0, withinCovers = true;
    let lowerTarget = 0, upperTarget = 0;
    let retainedTarget = retained.map(() => 0), retainedWeights = retained.map(() => 0);
    if (avgDuration != null) {
      if (!retained.length) {
        ({ lowerWeight, upperWeight } = bracketWeights(lowerDuration, upperDuration, avgDuration));
        ({ lowerExQty: lowerTarget, upperExQty: upperTarget } = bracketExcessQtys(notYetIssuedCost, lowerWeight, upperWeight, lowerCostPerBond, upperCostPerBond));
      } else {
        const wN = bracketWeightsN({
          retained: retained.map((r, i) => ({ excessCost: retainedQty[i] * retainedCostPerBond[i], duration: durOn(r.bond, issueDate) })),
          dActive: lowerDuration, dUpper: upperDuration, dGap: avgDuration, totalBlockCost: notYetIssuedCost,
          activeFloorWeight: notYetIssuedCost > 0 ? lowerQty * lowerCostPerBond / notYetIssuedCost : 0,
        });
        lowerWeight = wN.activeWeight; upperWeight = wN.upperWeight; retainedWeights = wN.retainedWeights;
        const qtyOf = (weight, cpb) => cpb > 0 ? Math.max(0, Math.round(notYetIssuedCost * weight / cpb)) : 0;
        lowerTarget = qtyOf(lowerWeight, lowerCostPerBond); upperTarget = qtyOf(upperWeight, upperCostPerBond);
        retainedTarget = retained.map((r, i) => qtyOf(retainedWeights[i], retainedCostPerBond[i]));
      }
      withinCovers = avgDuration >= Math.min(lowerDuration, upperDuration) && avgDuration <= Math.max(lowerDuration, upperDuration);
    }
    // The lower and upper bracket (cover) Excess TIPS goes to the match, bought if short and sold if over.
    // A retained maturity is never bought: it keeps the lesser of the quantity held and the match.
    const lowerQtyAfter = lowerTarget, upperQtyAfter = upperTarget;
    const retainedQtyAfter = retainedQty.map((q, i) => Math.min(q, retainedTarget[i]));
    const simPrice = priceFromYield(entry.synYld, entry.synCpn, issueDate, new Date(entry.year, monthIndex, 15)) ?? 100;
    const simulatedCost = entry.qty * 1000 * simPrice / 100;
    const excessSold = (lowerQty - lowerQtyAfter) * lowerCostPerBond + (upperQty - upperQtyAfter) * upperCostPerBond
      + retainedQty.reduce((s, q, i) => s + (q - retainedQtyAfter[i]) * retainedCostPerBond[i], 0);
    conversions.push({
      year: entry.year, issueDate, issueYear: issueDate.getFullYear(),
      simulatedQty: entry.qty, simulatedCoupon: entry.synCpn, simulatedCost,
      notYetIssued, notYetIssuedCost, avgDuration, lowerDuration, upperDuration, withinCovers,
      lowerWeight, upperWeight, retainedWeights, lowerCostPerBond, upperCostPerBond, retainedCostPerBond,
      lowerQtyBefore: lowerQty, upperQtyBefore: upperQty, lowerQtyAfter, upperQtyAfter,
      retainedQtyBefore: [...retainedQty], retainedQtyAfter,
      excessSold, netCash: excessSold - simulatedCost,
    });
    lowerQty = lowerQtyAfter; upperQty = upperQtyAfter; retainedQty = retainedQtyAfter;
  }
  return { conversions, lowerQty0, upperQty0, retainedQty0 };
}

export function future30yRebalances({ future30yParams, lowerCoverBond, upperCoverBond, refCPI, bondHolidays = new Set(), lowerQty0 = 0, upperQty0 = 0 }) {
  return simulatedRebalances({ kind: 'future30y', breakdown: future30yParams?.breakdown, lowerBond: lowerCoverBond, upperBond: upperCoverBond, refCPI, bondHolidays, lowerQty0, upperQty0 });
}

// The gap year conversions (2.0 §Gap Year Simulated Outstanding TIPS): the bracket pair is the lower
// bracket TIPS and the upper bracket TIPS, the Excess TIPS the quantity held at each; `retained` holds
// the retained lower bracket maturities, if any ([{ bond, qty0 }], oldest first).
export function gapRebalances({ gapParams, lowerBracketBond, upperBracketBond, retained = [], refCPI, bondHolidays = new Set(), lowerQty0 = 0, upperQty0 = 0 }) {
  return simulatedRebalances({ kind: 'gap', breakdown: gapParams?.breakdown, lowerBond: lowerBracketBond, upperBond: upperBracketBond, retained, refCPI, bondHolidays, lowerQty0, upperQty0 });
}

// ─── Interest credited to the funded years before the first simulated year ──────
// Spec: 2.0 §Future 30Y Simulated Outstanding TIPS and §Gap Year Simulated Outstanding TIPS, each
// §Interest credited to a funded year.
// For each year from settlement to the year before the first Future 30Y year (gap year), three amounts:
//   simulated — the coupons of every Simulated Outstanding TIPS issued by that year: one coupon (the
//               one after the issue date) in its issue year, two in each later year (half the annual
//               coupon each: quantity × 1,000 × synthetic coupon ÷ 2);
//   excess    — the coupons of the Excess TIPS (Cover Excess): each coupon date's quantity is the one
//               held on that date (before that year's conversion for a coupon dated earlier in the year
//               than the issue date, after it for a later coupon); `lowerQty0`/`upperQty0` before the
//               first conversion;
//   netCash   — the Net Cash of each issue date in that year: the Excess TIPS sold less the cost of
//               the Simulated Outstanding TIPS bought, both on the issue date. Cash delivered in a year
//               counts toward that year.
// A coupon counts toward the year it is paid in. In the settlement year only a coupon not yet paid
// as of tradeDate counts, filtered by the Coupon Counting choice the same way rmdCappedRemainingCoupons
// filters an actual holding (2.0 §Settlement-year LMI is remaining coupons only). The Net Cash is not
// a coupon, and every issue date falls after settlement, so it is not filtered. None of the three is
// carried in the running LMI: the amounts differ from year to year.
// The Net Cash of the first issue date depends on the Excess TIPS held before it, so it is worked
// out here from `lowerQty0`/`upperQty0` (the Before state passes the held quantities) rather than read
// from the conversion, whose own figure assumes the quantities Pass 1 sized.
// Returns { simulated: Map<year, $>, excess: Map<year, $>, netCash: Map<year, $> }.
function simulatedInterestByYear({
  kind, rebalances, lowerBond, upperBond, retained = [], refCPI, settlementDate, firstYear,
  lowerQty0 = rebalances?.lowerQty0 ?? 0, upperQty0 = rebalances?.upperQty0 ?? 0,
  bondHolidays = new Set(), rmdCouponMode = 'all', tradeDate = settlementDate, rmdLastDate = null,
}) {
  const { monthIndex } = SIMULATED_TIPS[kind];
  const simulated = new Map(), excess = new Map(), netCash = new Map();
  const conversions = rebalances?.conversions ?? [];
  if (!conversions.length || firstYear == null) return { simulated, excess, netCash };
  const settlementYear = settlementDate.getFullYear();
  const counts = (date) => {
    const paid = actualPaymentDate(date, bondHolidays);
    const year = date.getFullYear();
    if (year !== settlementYear) return true;
    if (rmdCouponMode === 'none' || paid <= tradeDate) return false;
    if (rmdCouponMode === 'last') return rmdLastDate != null && +paid === +rmdLastDate;
    return true;
  };
  const add = (map, year, v) => { if (v) map.set(year, (map.get(year) ?? 0) + v); };
  // The Excess TIPS legs: the lower bracket, the upper bracket and any retained maturity, each with the
  // quantity held before the first conversion and the quantity after each conversion.
  const legs = [
    { bond: lowerBond, qty0: lowerQty0, after: c => c.lowerQtyAfter },
    { bond: upperBond, qty0: upperQty0, after: c => c.upperQtyAfter },
    ...retained.map((r, i) => ({ bond: r.bond, qty0: rebalances.retainedQty0?.[i] ?? r.qty0 ?? 0, after: c => c.retainedQtyAfter?.[i] ?? 0 })),
  ];

  for (let year = settlementYear; year < firstYear; year++) {
    // Simulated Outstanding TIPS: every TIPS matures on the 15th of the issue month, so its coupon
    // dates are that day and six months later; a coupon dated before the issue date is not paid.
    for (const c of conversions) {
      if (c.issueYear > year) continue;
      const half = c.simulatedQty * 1000 * c.simulatedCoupon / 2;
      for (const date of [new Date(year, monthIndex, 15), new Date(year, monthIndex + 6, 15)]) {
        if (date > c.issueDate && counts(date)) add(simulated, year, half);
      }
    }
    // Excess TIPS, on each bracket TIPS' own coupon dates in this year.
    for (const { bond, qty0, after } of legs) {
      if (!bond?.maturity) continue;
      const ir = calcIndexRatio(refCPI, bond.datedDateRefCpi ?? refCPI);
      const halfPerBond = 1000 * ir * (bond.coupon ?? 0) / 2;
      const from = new Date(year, 0, 1);
      for (const date of couponSchedule(from, bond.maturity)) {
        if (date.getFullYear() !== year) continue;
        if (date >= bond.maturity) continue;   // the Excess TIPS is sold before it matures
        let qty = qty0;
        for (const c of conversions) if (c.issueDate < date) qty = after(c);
        if (qty > 0 && counts(date)) add(excess, year, qty * halfPerBond);
      }
    }
  }
  // Net Cash, credited to the funded year of the year of its issue date.
  const held = legs.map(l => l.qty0);
  for (const c of conversions) {
    const costs = [c.lowerCostPerBond, c.upperCostPerBond, ...(c.retainedCostPerBond ?? [])];
    let net = -c.simulatedCost;
    legs.forEach((l, i) => { net += (held[i] - l.after(c)) * costs[i]; held[i] = l.after(c); });
    if (c.issueYear >= settlementYear && c.issueYear < firstYear) add(netCash, c.issueYear, net);
  }
  return { simulated, excess, netCash };
}

export function future30yInterestByYear({
  rebalances, lowerCoverBond, upperCoverBond, refCPI, settlementDate, firstFuture30yYear,
  lowerQty0 = rebalances?.lowerQty0 ?? 0, upperQty0 = rebalances?.upperQty0 ?? 0,
  bondHolidays = new Set(), rmdCouponMode = 'all', tradeDate = settlementDate, rmdLastDate = null,
}) {
  const { simulated, excess, netCash } = simulatedInterestByYear({
    kind: 'future30y', rebalances, lowerBond: lowerCoverBond, upperBond: upperCoverBond, refCPI, settlementDate, firstYear: firstFuture30yYear,
    lowerQty0, upperQty0, bondHolidays, rmdCouponMode, tradeDate, rmdLastDate,
  });
  return { simulated, cover: excess, netCash };
}

// The gap year amounts: the interest of the Simulated Outstanding Future 10Y TIPS, the interest of the
// Excess TIPS and the Net Cash, credited to the funded years before the first gap year. The Excess TIPS held
// before the first conversion are those the conversions were calculated from (`rebalances`).
export function gapInterestByYear({
  rebalances, lowerBracketBond, upperBracketBond, retained = [], refCPI, settlementDate, firstGapYear,
  bondHolidays = new Set(), rmdCouponMode = 'all', tradeDate = settlementDate, rmdLastDate = null,
}) {
  const { simulated, excess, netCash } = simulatedInterestByYear({
    kind: 'gap', rebalances, lowerBond: lowerBracketBond, upperBond: upperBracketBond, retained, refCPI, settlementDate, firstYear: firstGapYear,
    bondHolidays, rmdCouponMode, tradeDate, rmdLastDate,
  });
  return { simulated, excess, netCash };
}

// ─── The ladder's last year, at most ────────────────────────────────────────────
// Spec: 2.0 §Future 30Y Simulated Outstanding TIPS §Limit on the ladder's last year; DD §5.1.
// The Maximum Future 30Y Rungs is the largest number of Future 30Y years for which, on the issue date of every Simulated
// Outstanding Future 30Y TIPS, the cost-weighted average duration of the Synthetic TIPS not yet
// issued lies between the modified durations of the lower and upper cover measured that day.
// Pass 1 is run at a flat nominal DARA: the average duration is a cost-weighted mean over a flat
// ladder, so it does not depend on the DARA beyond rounding. `nMax` bounds the search.
export function future30yLimit({ tipsMarketData, settlementDate, refCPI = 1, bondHolidays = new Set(), nMax = 30 }) {
  const covers = selectFuture30yCovers({ tipsMarketData, settlementDate });
  if (!covers?.lowerCoverBond || !covers?.upperCoverBond) return { maxFuture30yRungs: 0, lastYearMax: covers?.maxTipsYear ?? 0, covers };
  const NOMINAL_DARA = 100000;
  let maxFuture30yRungs = 0;
  for (let n = 1; n <= nMax; n++) {
    const years = [];
    for (let y = covers.maxTipsYear + 1; y <= covers.maxTipsYear + n; y++) years.push(y);
    const future30yParams = future30yParamsCore({ future30yYears: years, anchorBond: covers.anchorBond, settlementDate, dara: NOMINAL_DARA });
    const { conversions } = future30yRebalances({ future30yParams, lowerCoverBond: covers.lowerCoverBond, upperCoverBond: covers.upperCoverBond, refCPI, bondHolidays });
    if (!conversions.every(c => c.withinCovers)) break;
    maxFuture30yRungs = n;
  }
  return { maxFuture30yRungs, lastYearMax: covers.maxTipsYear + maxFuture30yRungs, covers };
}

// The ladder's last year, at most: the longest issued maturity year + the Maximum Future 30Y Rungs (DD §5.1). The upper bound
// of the Last Year selector.
export function maxLastYear({ tipsMarketData, settlementDate, refCPI = 1, bondHolidays = new Set() }) {
  return future30yLimit({ tipsMarketData, settlementDate, refCPI, bondHolidays }).lastYearMax;
}

// ─── Amount of a gap year and a Future 30Y year ─────────────────────────────────
// Spec: 2.0 §Amount of a Gap Year and a Future 30Y Year. Shown on the year's group header row,
// in Build and in Rebalance, before and after (5.0 §Sub-Row Logic).
//   gap year       — P+I of its Simulated Outstanding Future 10Y TIPS (same quantity, coupon and
//                    maturity as its Synthetic TIPS) + the LMI that sized its quantity down (the full
//                    annual coupons of the later gap years, the actual TIPS above and the pre-ladder
//                    credit), from gapParams.breakdown; the Amount equals the one Pass 1 gives its Synthetic TIPS;
//   Future 30Y year — P+I of its Simulated Outstanding Future 30Y TIPS (same quantity, coupon and
//                    maturity as its Synthetic TIPS) + the full annual coupons of the Simulated
//                    Outstanding Future 30Y TIPS of the later Future 30Y years, which is the LMI Pass 1
//                    sized it with. The Amount therefore equals the Amount Pass 1 gives its Synthetic TIPS.
// Returns { [year]: { kind: 'gap' | 'future30y', year, qty, piPerBond, laterMatInt, pliCredit, amount, dara, synCpn } }.
export function syntheticYearAmounts({ gapParams = null, future30yParams = null }) {
  const out = {};
  for (const g of gapParams?.breakdown ?? []) {
    const pliCredit = g.pliCredit ?? 0;
    out[g.year] = { kind: 'gap', year: g.year, qty: g.qty, piPerBond: g.piPerBond, laterMatInt: g.laterMatInt, pliCredit,
      amount: g.qty * g.piPerBond + g.laterMatInt + pliCredit, dara: g.dara, synCpn: g.synCpn };
  }
  for (const f of future30yParams?.breakdown ?? []) {
    out[f.year] = { kind: 'future30y', year: f.year, qty: f.qty, piPerBond: f.piPerBond, laterMatInt: f.laterMatInt, pliCredit: 0,
      amount: f.qty * f.piPerBond + f.laterMatInt, dara: f.dara, synCpn: f.synCpn };
  }
  return out;
}

// ─── Shared per-year funded Amount (single source of truth for build & rebalance "After") ───
// A funded year's annual Amount = own principal + own coupon + later-maturity interest (LMI)
// + own-year excess coupon (0 for a bracket or cover year: the excess is sold before it matures) + the interest of the
// Simulated Outstanding Future 10Y and Future 30Y TIPS and of the Excess TIPS and the Cover Excess and the
// Net Cash credited to the year, plus a pre-ladder credit. For a PLI-zeroed year (funded
// entirely from the pre-ladder pool, qty 0) the credit is reconciled so the row lands exactly on
// its DARA against the CORRECTED income components; otherwise it is the year's non-zeroed
// pre-ladder credit (the partial-credit year's share, else 0). Build and rebalance BOTH call this,
// so their per-year Amounts are identical by construction — there is no second copy of the
// formula to drift. `dara` is the year's resolved DARA. Display-only: trades use sized
// quantities, not this credit. Returns { credit, amount }.
export function fundedYearAmount({
  principal = 0, ownCoupon = 0, laterMatInt = 0, ownExcessCoupon = 0, simulatedInterest = 0, coverExcessInterest = 0, netCash = 0,
  gapSimulatedInterest = 0, gapExcessInterest = 0, gapNetCash = 0,
  dara, isZeroed = false, partialCredit = 0,
}) {
  // Income fixed regardless of the pre-ladder credit. For a zeroed year principal & ownCoupon
  // are 0, so this is the LMI + own-excess-coupon + Future 30Y credit that the credit tops up
  // to DARA. Available Cash needs no term here: the credit pass expresses it as zeroing (credit
  // tops the year up to DARA) or as this year's partialCredit (2.0 §Available Cash).
  const fixedIncome = principal + ownCoupon + laterMatInt + ownExcessCoupon + simulatedInterest + coverExcessInterest + netCash
    + gapSimulatedInterest + gapExcessInterest + gapNetCash;
  const credit = isZeroed ? Math.max(0, dara - fixedIncome) : partialCredit;
  return { credit, amount: fixedIncome + credit };
}

const BL_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Intra-year TIPS selection (maturityPref policy) ────────────────────────────
// A funded year may hold MULTIPLE TIPS (quarterly out to ~5y, Jan/Jul out to ~10y,
// single Feb 2040+). The DARA target stays annual; the year's amount is split across
// the selected maturities (see sizeLadder). This picks which TIPS fill a year:
//   'last'       — one TIPS, latest-maturing              (default; = legacy behavior)
//   'first'      — one TIPS, earliest-maturing            (= legacy 'first')
//   'semiannual' — the Jan TIPS + the Jul TIPS (one each), Jan→Jul order
//   'all'        — one TIPS per distinct maturity MONTH, earliest→latest
// Same-month/same-date collision tie-break (Jan 2027/28/29, Apr 2028/29 — two issues in one
// month, different coupon): `couponPref` ('higher', default, or 'lower') picks the CUSIP that
// wins — including in 'all', which takes one TIPS per month, NOT both same-month issues. CUSIP
// is the final total-order tiebreak so selection is independent of Map iteration order.

// True when `b` should beat `best` for a single-pick slot on a maturity-date tie.
function tieBeats(b, best, couponPref = 'higher') {
  const cb = b.coupon ?? 0, cbest = best.coupon ?? 0;
  if (cb !== cbest) return couponPref === 'lower' ? cb < cbest : cb > cbest;
  return String(b.cusip ?? '') < String(best.cusip ?? '');   // stable final tiebreak
}
// Pick the earliest/latest-maturing TIPS from `cands`, tie-broken by tieBeats.
function pickExtreme(cands, which /* 'first' | 'last' */, couponPref = 'higher') {
  let best = null;
  for (const b of cands) {
    if (!best) { best = b; continue; }
    const d = b.maturity - best.maturity;
    if (which === 'first' ? (d < 0 || (d === 0 && tieBeats(b, best, couponPref)))
                          : (d > 0 || (d === 0 && tieBeats(b, best, couponPref)))) best = b;
  }
  return best;
}
// Ordered list of TIPS that fill one funded year under `pref`. Never empty (callers only
// pass years that have ≥1 candidate).
function selectYearTips(cands, pref, couponPref = 'higher') {
  const byMat = (a, b) => (a.maturity - b.maturity) || (tieBeats(a, b, couponPref) ? -1 : 1);
  if (pref === 'first') return [pickExtreme(cands, 'first', couponPref)];
  if (pref === 'all') {
    // One TIPS per distinct maturity month; couponPref wins when a month has two issues.
    const byMonth = new Map();
    for (const b of cands) {
      const mo = b.maturity.getMonth();
      const cur = byMonth.get(mo);
      if (!cur || tieBeats(b, cur, couponPref)) byMonth.set(mo, b);
    }
    return [...byMonth.values()].sort(byMat);
  }
  if (pref === 'semiannual') {
    const jan = pickExtreme(cands.filter(b => b.maturity.getMonth() + 1 === 1), 'last', couponPref);
    const jul = pickExtreme(cands.filter(b => b.maturity.getMonth() + 1 === 7), 'last', couponPref);
    const picks = [jan, jul].filter(Boolean);
    if (picks.length) return picks.sort(byMat);   // Jan before Jul
    return [pickExtreme(cands, 'last', couponPref)]; // no Jan/Jul (e.g. Feb 2040+): take the one available
  }
  return [pickExtreme(cands, 'last', couponPref)]; // 'last' (default)
}

// ─── Canonical ladder bond selection (shared by build and rebalance) ────────────
// Picks the funded-year TIPS per year, the 2040 upper bracket, the pre-gap lower
// bracket, and the future-30Y cover pair — purely from tipsMarketData. This is the single
// source of truth for "which TIPS the target ladder holds", so build and rebalance
// size against an identical set. Returns the structures sizeLadder consumes.
//   yearTipsListMap[year] — the ordered funded-year TIPS list (≥1) per maturityPref.
//   yearBondMap[year]     — the single representative (latest of the list); every
//                           bracket/gap/cover path keys off this and is unaffected,
//                           and it equals the legacy pick when the list has length 1.
// `yearOverrides` (prototype, Build only — 2.0 §Picking Maturities for a Funded Year): a
// Map<year, cusip[]> naming an explicit TIPS list for that year, bypassing `maturityPref` for
// just that year. Every other year keeps following `maturityPref` as usual. An override whose
// CUSIPs don't resolve to that year's candidates is ignored (falls back to the policy pick).
// `excludeMaturingWithinMonths` (Build only; Rebalance leaves it 0): a TIPS maturing no later than that many months
// after the settlement date is not a candidate for a funded year (tipsMaturingAfterExclusion, DD §5.1).
export function selectLadderBonds({ tipsMarketData, firstYear, lastYear, settlementDate, maturityPref = 'last', couponPref = 'higher', yearOverrides = null, excludeMaturingWithinMonths = 0 }) {
  // 1. Gather candidate TIPS per year (maturing after settlement, in range), then apply the policy.
  const maturingAfterExclusion = excludeMaturingWithinMonths > 0 ? new Set(tipsMaturingAfterExclusion(tipsMarketData, settlementDate, excludeMaturingWithinMonths)) : null;
  const candsByYear = {};
  for (const bond of tipsMarketData.values()) {
    if (!bond.maturity || bond.maturity <= settlementDate) continue;
    if (maturingAfterExclusion && !maturingAfterExclusion.has(bond)) continue;
    const yr = bond.maturity.getFullYear();
    if (yr < firstYear || yr > lastYear) continue;
    (candsByYear[yr] ??= []).push(bond);
  }
  const yearBondMap = {};       // year → representative single TIPS (latest of the funded list)
  const yearTipsListMap = {};   // year → ordered funded-year TIPS list (≥1)
  for (const yr of Object.keys(candsByYear).map(Number)) {
    const overrideCusips = yearOverrides?.get(yr);
    const overrideList = overrideCusips?.length
      ? overrideCusips.map(c => candsByYear[yr].find(b => b.cusip === c)).filter(Boolean)
          .sort((a, b) => a.maturity - b.maturity)
      : null;
    const list = overrideList?.length ? overrideList : selectYearTips(candsByYear[yr], maturityPref, couponPref);
    yearTipsListMap[yr] = list;
    yearBondMap[yr] = pickExtreme(list, 'last', couponPref);
  }

  let rangeYears = Object.keys(yearBondMap).map(Number).sort((a, b) => a - b);

  let maxTipsYear = 0;
  for (const bond of tipsMarketData.values()) {
    if (bond.maturity) maxTipsYear = Math.max(maxTipsYear, bond.maturity.getFullYear());
  }

  // Gap years: getGapYears (DD Gap Years) within the ladder's range. Future 30Y: beyond maxTipsYear. Any other
  // year with no TIPS is not a rung and is neither: the ladder starts at the first year that has a TIPS.
  const structuralGapYears = new Set(getGapYears(tipsMarketData));
  const gapYears = [], future30yYears = [];
  for (let y = firstYear; y <= lastYear; y++) {
    if (!yearBondMap[y]) {
      if (y > maxTipsYear) future30yYears.push(y);
      else if (structuralGapYears.has(y)) gapYears.push(y);
    }
  }

  // Add 2040 upper bracket if gap years exist and 2040 not already in range.
  if (gapYears.length > 0 && !yearBondMap[2040]) {
    for (const bond of tipsMarketData.values()) {
      if (!bond.maturity) continue;
      if (bond.maturity.getFullYear() !== 2040) continue;
      if (!yearBondMap[2040] || bond.maturity > yearBondMap[2040].maturity)
        yearBondMap[2040] = bond;
    }
    if (!yearBondMap[2040]) throw new Error('No TIPS available in 2040 for upper bracket');
    yearTipsListMap[2040] = [yearBondMap[2040]];   // 2040 has a single Feb TIPS — always length 1
    rangeYears = [...rangeYears, 2040].sort((a, b) => a - b);
  }

  // Ensure the lower bracket (latest-maturing pre-gap TIPS) is in yearBondMap/rangeYears.
  if (gapYears.length > 0) {
    const minGapYearTmp = Math.min(...gapYears);
    let lbBond = null;
    for (const bond of tipsMarketData.values()) {
      if (!bond.maturity || !bond.yield) continue;
      const yr = bond.maturity.getFullYear();
      if (yr < minGapYearTmp && (!lbBond || bond.maturity > lbBond.maturity))
        lbBond = bond;
    }
    if (lbBond) {
      const lbYear = lbBond.maturity.getFullYear();
      if (!yearBondMap[lbYear]) {
        yearBondMap[lbYear] = lbBond;
        yearTipsListMap[lbYear] = [lbBond];   // pre-gap lower bracket — single TIPS
        rangeYears = [...rangeYears, lbYear].sort((a, b) => a - b);
      }
    }
  }

  // Future 30Y cover pair, chosen by rule (selectFuture30yCovers, 2.0 §Future 30Y Cover Pair).
  let future30yLowerYear = null, future30yUpperYear = null;
  let future30yLowerCoverBond = null, future30yUpperCoverBond = null, future30yAnchorBond = null;
  if (future30yYears.length > 0) {
    const covers = selectFuture30yCovers({ tipsMarketData, settlementDate });
    future30yLowerCoverBond = covers?.lowerCoverBond ?? null;
    future30yUpperCoverBond = covers?.upperCoverBond ?? null;
    future30yAnchorBond = covers?.anchorBond ?? null;
    if (!future30yLowerCoverBond) throw new Error('No outstanding TIPS found for the Future 30Y lower cover');
    if (!future30yUpperCoverBond) throw new Error('No outstanding TIPS found for the Future 30Y upper cover');
    future30yLowerYear = future30yLowerCoverBond.maturity.getFullYear();
    future30yUpperYear = future30yUpperCoverBond.maturity.getFullYear();
    // A cover year below firstYear holds Cover Excess alone (no funded-year quantity), the same way
    // a lower bracket year below firstYear is inserted above.
    for (const coverBond of [future30yLowerCoverBond, future30yUpperCoverBond]) {
      const cy = coverBond.maturity.getFullYear();
      if (!yearBondMap[cy]) {
        yearBondMap[cy] = coverBond;
        yearTipsListMap[cy] = [coverBond];
        rangeYears = [...rangeYears, cy].sort((a, b) => a - b);
      }
    }
  }

  return {
    yearBondMap, yearTipsListMap, rangeYears, gapYears, future30yYears,
    future30yLowerYear, future30yUpperYear, future30yLowerCoverBond, future30yUpperCoverBond, future30yAnchorBond,
  };
}

// ─── Multi-TIPS funded-year split ───────────────────────────────────────────────
// A funded year's real P+I `need` (yearDARA minus the year-level income offsets — LMI,
// own-excess coupon, future-30Y extra) is spread across its ordered TIPS list so each
// sub-rung delivers an ≈ equal share of that year's maturity cash. Each sub-rung is sized
// from its OWN pi; the LATEST maturity absorbs the rounding remainder so the year lands on
// `need`. Same-year sub-rungs never feed each other's LMI (they mature in-year), so a single
// year-level `need` is the correct thing to split. Returns [{ bond, ir, pi, coupon, qty }]
// earliest→latest (qty ≥ 0). N=1 reproduces the legacy single-TIPS sizing exactly.
function sizeYearRungs(list, need, refCPI) {
  const rungs = list.map(bond => {
    const { indexRatio: ir, piPerBond: pi } = bondCalcs(bond, refCPI);
    return { bond, ir, pi, coupon: bond.coupon ?? 0, qty: 0 };
  });
  const N = rungs.length;
  if (N === 0 || need <= 0) return rungs;
  const share = need / N;
  let deliveredPI = 0;
  for (let i = 0; i < N - 1; i++) {
    rungs[i].qty = Math.max(0, Math.round(share / rungs[i].pi));
    deliveredPI += rungs[i].qty * rungs[i].pi;
  }
  const last = rungs[N - 1];                                   // latest maturity absorbs the remainder
  last.qty = Math.max(0, Math.round((need - deliveredPI) / last.pi));
  return rungs;
}
// Aggregate a sized rung list: total funded qty, total real annual coupon (feeds LMI),
// and total real P+I delivered (the year's own maturity cash).
function aggregateRungs(rungs) {
  let qty = 0, annualInterest = 0, piTotal = 0;
  for (const r of rungs) {
    qty += r.qty;
    annualInterest += r.qty * 1000 * r.ir * r.coupon;
    piTotal += r.qty * r.pi;
  }
  return { qty, annualInterest, piTotal };
}

// ─── Current-year remaining-coupon count ────────────────────────────────────────
// How many of a bond's semiannual coupon dates, in settlementDate's own calendar year, are not
// yet PAID as of `tradeDate` ("today" — the same reference the Cash Flow Calendar uses, 5.0
// §Cash Flow Calendar "Cutoff: today, not the settlement/Ref CPI date"). 0, 1, or 2. Deliberately
// NOT settlementDate itself: settlementDate is T+1 from today (a hypothetical new trade's
// settlement, matching FedInvest/Fidelity data), so a coupon rolled to pay on Aug 17 is still
// "not yet paid" as of settlementDate Aug 18 even though the cash was actually received today —
// comparing against settlementDate instead of today excluded a coupon on the very day it paid.
// `tradeDate` defaults to `settlementDate` for callers that don't distinguish the two (tests,
// and any caller before this distinction existed); production Build/Rebalance runs always pass
// the real trade date (index.html `_tradeDateStr`). `year` stays keyed off settlementDate — which
// funded year this affects is a settlement-year question, independent of the "has it paid yet"
// cutoff. Reuses the same coupon-date walk the cash flow calendar uses (shared/src/bond-math.js
// couponSchedule) — single source, no parallel date logic. For every year other than the
// settlement year this is irrelevant (that year's coupons haven't happened yet, so the normal
// full-annual assumption already holds).
export function remainingCouponPaymentsThisYear(maturity, settlementDate, bondHolidays = new Set(), tradeDate = settlementDate) {
  const year = settlementDate.getFullYear();
  // Walk from a few days before tradeDate, not from tradeDate itself: a coupon scheduled just
  // before today but rolled past a weekend/holiday hasn't actually been paid yet, and
  // couponSchedule(tradeDate, ...) would otherwise skip its (pre-tradeDate) raw date entirely.
  // Mirrors index.html's buildCashFlowData() walk-back. 5.0 §Cash Flow Calendar.
  const walkFrom = new Date(tradeDate); walkFrom.setDate(walkFrom.getDate() - 10);
  return couponSchedule(walkFrom, maturity)
    .map(d => actualPaymentDate(d, bondHolidays))
    .filter(actual => actual > tradeDate && actual.getFullYear() === year)
    .length;
}

// ─── RMD Options 'last' mode: the pool's single latest remaining coupon date ────
// Scans every bond's still-unpaid-this-year coupon dates and returns the single latest one across
// the WHOLE set of bonds that can contribute to the settlement year's LMI (or null if none remain).
// 'last' mode counts only coupons landing on this one shared date, regardless of which bond they
// belong to: a bond whose own only remaining coupon this year is earlier than another bond's is
// treated as already reinvested, not specially preserved just because *something* is later than
// nothing. (A ladder routinely holds bonds on different semiannual cycles — e.g. Aug/Feb and
// Apr/Oct — so "this bond's own last remaining coupon" and "the pool's last remaining coupon" are
// different questions; 'last' means the second one.) Callers compute this ONCE per sizing pass,
// over every bond that pass's settlement-year LMI pool draws from, then pass the result into every
// rmdCappedRemainingCoupons call in that pass so every bond is judged against the same date.
export function latestRemainingCouponDate(maturities, settlementDate, bondHolidays = new Set(), tradeDate = settlementDate) {
  const year = settlementDate.getFullYear();
  let maxDate = null;
  for (const maturity of maturities) {
    if (!maturity) continue;
    const walkFrom = new Date(tradeDate); walkFrom.setDate(walkFrom.getDate() - 10);
    for (const d of couponSchedule(walkFrom, maturity)) {
      const actual = actualPaymentDate(d, bondHolidays);
      if (actual > tradeDate && actual.getFullYear() === year && (!maxDate || actual > maxDate)) maxDate = actual;
    }
  }
  return maxDate;
}

// ─── RMD Options: how many of the settlement year's remaining coupons count ────
// Generalizes "all remaining coupons are available" to three user-chosen assumptions about
// what happens to coupon cash between now and when it's spent (RMD or otherwise) — 2.0 §RMD
// Options. 'all' reproduces remainingCouponPaymentsThisYear exactly (the original, still-default
// behavior). 'last' counts a coupon only if it lands on `lastDate` — the pool-wide date from
// latestRemainingCouponDate above, precomputed by the caller and passed in here; a caller that
// doesn't supply one falls back to this single bond's own latest remaining date (matches
// single-bond callers/tests, not the pool-aware production behavior). 'none' treats every
// remaining coupon as already spoken for (reinvested), same as a year that isn't the settlement
// year at all. Single source of truth: every caller (ladder-core, rebalance-lib) goes through this
// instead of working out remaining-coupon dates inline.
export function rmdCappedRemainingCoupons(maturity, settlementDate, bondHolidays = new Set(), couponMode = 'all', tradeDate = settlementDate, lastDate = undefined) {
  if (couponMode === 'none') return 0;
  if (couponMode === 'last') {
    const target = lastDate !== undefined ? lastDate : latestRemainingCouponDate([maturity], settlementDate, bondHolidays, tradeDate);
    if (!target) return 0;
    const year = settlementDate.getFullYear();
    const walkFrom = new Date(tradeDate); walkFrom.setDate(walkFrom.getDate() - 10);
    const hasIt = couponSchedule(walkFrom, maturity).some(d => {
      const actual = actualPaymentDate(d, bondHolidays);
      return actual > tradeDate && actual.getFullYear() === year && +actual === +target;
    });
    return hasIt ? 1 : 0;
  }
  return remainingCouponPaymentsThisYear(maturity, settlementDate, bondHolidays, tradeDate);
}

// ─── The shared sizing pipeline ─────────────────────────────────────────────────
export function sizeLadder({
  dara, daraByYear = null, firstYear, lastYear, optionalYears = null,
  rangeYears, gapYears, future30yYears,
  yearBondMap, yearTipsListMap = null, tipsMarketData, refCPI, settlementDate, settlementYear,
  preLadderInterest = false, bondHolidays = new Set(),
  availableCash = 0, rmdCouponMode = 'all', tradeDate = settlementDate,
  future30yLowerCoverBond = null, future30yUpperCoverBond = null,
  future30yLowerYear = null, future30yUpperYear = null, future30yAnchorBond = null,
  gapRetained = null,
}) {
  let lowerYear = null, upperYear = null;
  // Back-compat: a caller that passes only yearBondMap sizes every year as a single TIPS.
  const tipsList = (year) => yearTipsListMap?.[year] ?? [yearBondMap[year]];

  // 3. Preliminary sweep (longest → shortest, no bracket excess). Produces prelim coupons
  //    used by the PLI bucket and gap LMI (the small, shared approximation).
  const prelim = {};
  let laterMatInt = 0;
  for (const year of [...rangeYears].sort((a, b) => b - a)) {
    const bond = yearBondMap[year];                            // representative (bracket/gap/message pi)
    const { piPerBond: pi } = bondCalcs(bond, refCPI);
    const need = (year > lastYear || year < firstYear) ? 0 : Math.max(0, (daraByYear?.get(year) ?? dara) - laterMatInt);
    const rungs = sizeYearRungs(tipsList(year), need, refCPI);
    const { qty, annualInterest: annInt } = aggregateRungs(rungs);
    prelim[year] = { targetFundedYearQty: qty, annualInterest: annInt, laterMatInt, pi, rungs };
    laterMatInt += annInt;
  }

  // 3a. Validate: every funded year must fund at least one bond. EXCEPT optionalYears — in a
  // rebalance these are in-range years the user holds none of (intentional empty rungs). A target
  // that rounds to 0 there is a hole (LMI passthrough), not a too-low-DARA error; if the user raises
  // its per-year DARA enough to fund a bond it fills normally (target ≥ 1, never reaches this throw).
  for (const year of rangeYears) {
    if (year > lastYear || year < firstYear) continue;
    if (optionalYears?.has(year)) continue;
    const { targetFundedYearQty, laterMatInt, pi } = prelim[year];
    const yearDara = daraByYear?.get(year) ?? dara;
    if (targetFundedYearQty === 0 && yearDara > laterMatInt) {
      const minNeeded = Math.ceil(laterMatInt + pi);
      const err = new Error(`DARA too low for ${year}: need at least $${minNeeded.toLocaleString()} to fund one bond (pi/bond = $${Math.round(pi).toLocaleString()}, later-mat interest = $${Math.round(laterMatInt).toLocaleString()})`);
      err.daraTooLowYear = year;  // lets the inference binary search steer around infeasible probes
      throw err;
    }
  }

  // 4a. Future 30Y parameters → duration matching → cover excess quantities (Pass 1, at settlement).
  const {
    future30yParams, future30yLowerDuration, future30yUpperDuration,
    future30yLowerWeight, future30yUpperWeight, future30yLowerExQty, future30yUpperExQty,
    future30yFellBack, future30yCoverReason, future30yTotalExcessCost, future30yLowerMonth, future30yUpperMonth,
  } = sizeFuture30yCover({ future30yYears, future30yLowerCoverBond, future30yUpperCoverBond, future30yAnchorBond, settlementDate, dara, daraByYear, refCPI });

  // 4a'. The Future 30Y rebalances (2.0 §Future 30Y Simulated Outstanding TIPS): the conversion on
  // each issue date, and the three amounts credited to each funded year before the first Future 30Y
  // year: the interest of the Simulated Outstanding Future 30Y TIPS, the interest of the Cover Excess
  // and the Net Cash (2.0 §Interest credited to a funded year). The settlement year's 'last' Coupon
  // Counting date is the same pool-wide date the corrected sweep uses (below).
  const firstFuture30yYear = future30yYears.length ? Math.min(...future30yYears) : null;
  const future30yRebal = future30yYears.length
    ? future30yRebalances({ future30yParams, lowerCoverBond: future30yLowerCoverBond, upperCoverBond: future30yUpperCoverBond, refCPI, bondHolidays, lowerQty0: future30yLowerExQty, upperQty0: future30yUpperExQty })
    : { conversions: [], lowerQty0: 0, upperQty0: 0 };
  const _lastCouponDate = rmdCouponMode === 'last'
    ? latestRemainingCouponDate(
        rangeYears.filter(y => y > settlementYear).flatMap(y => tipsList(y).map(b => b.maturity)),
        settlementDate, bondHolidays, tradeDate,
      )
    : null;
  const { simulated: future30ySimulatedInterestByYear, cover: future30yCoverInterestByYear, netCash: future30yNetCashByYear } = future30yInterestByYear({
    rebalances: future30yRebal, lowerCoverBond: future30yLowerCoverBond, upperCoverBond: future30yUpperCoverBond,
    refCPI, settlementDate, firstFuture30yYear, bondHolidays, rmdCouponMode, tradeDate, rmdLastDate: _lastCouponDate,
  });
  const future30yInterest = (year) => (future30ySimulatedInterestByYear.get(year) ?? 0) + (future30yCoverInterestByYear.get(year) ?? 0);
  const future30yCredit = (year) => future30yInterest(year) + (future30yNetCashByYear.get(year) ?? 0);

  // 4b. The gap years (2.0 §Gap Year Simulated Outstanding TIPS): Pass 1 sizes the Synthetic TIPS and
  // the Excess TIPS at settlement; the conversion on each issue date and the three amounts credited to
  // each funded year before the first gap year follow, as for the Future 30Y years above. Two things
  // that the gap quantities and the pre-ladder pool each need from the other are broken here, not
  // iterated: the pool is sized from a stage that has no pre-ladder credit for the gap years yet (the
  // estimate, run only when a pool exists), and the stage the sweep and the Amounts read is sized
  // again with the credit each gap year then receives. A fully pre-ladder-funded year is reconciled
  // against its DARA in fundedYearAmount, so the difference between the two stages never reaches an Amount.
  const firstGapYear = gapYears.length ? Math.min(...gapYears) : null;
  const gapStage = (prelimForLMI, pliCredits) => {
    if (!gapYears.length) return null;
    const upperBracketYear = 2040;
    const lowerBracketYear = Math.max(...rangeYears.filter(y => y < firstGapYear));
    const params = calcGapParams(gapYears, tipsMarketData, settlementDate, refCPI, dara, prelimForLMI, pliCredits, daraByYear);
    const upperBond = yearBondMap[upperBracketYear];
    const lowerBond = yearBondMap[lowerBracketYear];
    const upperDur = calculateMDuration(settlementDate, upperBond.maturity, upperBond.coupon ?? 0, upperBond.yield ?? 0);
    const upperCPB = (upperBond.price ?? 0) / 100 * calcIndexRatio(refCPI, upperBond.datedDateRefCpi ?? refCPI) * 1000;
    const lowerDur = calculateMDuration(settlementDate, lowerBond.maturity, lowerBond.coupon ?? 0, lowerBond.yield ?? 0);
    const lowerCPB = (lowerBond.price ?? 0) / 100 * calcIndexRatio(refCPI, lowerBond.datedDateRefCpi ?? refCPI) * 1000;
    // The Excess TIPS at settlement. A Rebalance with Retained Bracket Excess (gapRetained: the retained
    // maturities, oldest first, each with the excess it holds, and the excess the active lower bracket holds)
    // freezes the retained maturities at what they hold and solves the active lower and upper brackets
    // around them (2.0 §Retained Bracket Excess); otherwise it is the plain two-bracket match.
    const retainedLegs = gapRetained?.retained ?? [];
    let wL, wU, exL, exU, retainedQty0 = [];
    if (!retainedLegs.length) {
      ({ lowerWeight: wL, upperWeight: wU } = bracketWeights(lowerDur, upperDur, params.avgDuration));
      ({ lowerExQty: exL, upperExQty: exU } = bracketExcessQtys(params.totalCost, wL, wU, lowerCPB, upperCPB));
    } else {
      const cpbOf = (b) => (b.price ?? 0) / 100 * calcIndexRatio(refCPI, b.datedDateRefCpi ?? refCPI) * 1000;
      const total = params.totalCost;
      const wN = bracketWeightsN({
        retained: retainedLegs.map(r => ({ excessCost: r.heldQty * cpbOf(r.bond), duration: calculateMDuration(settlementDate, r.bond.maturity, r.bond.coupon ?? 0, r.bond.yield ?? 0) })),
        dActive: lowerDur, dUpper: upperDur, dGap: params.avgDuration, totalBlockCost: total,
        activeFloorWeight: total > 0 ? (gapRetained.activeHeldQty ?? 0) * lowerCPB / total : 0,
      });
      const qtyOf = (weight, cpb) => cpb > 0 ? Math.max(0, Math.round(total * weight / cpb)) : 0;
      wL = wN.activeWeight; wU = wN.upperWeight;
      exL = qtyOf(wL, lowerCPB); exU = qtyOf(wU, upperCPB);
      retainedQty0 = retainedLegs.map((r, i) => qtyOf(wN.retainedWeights[i], cpbOf(r.bond)));
    }
    const retained = retainedLegs.map((r, i) => ({ bond: r.bond, qty0: retainedQty0[i] }));
    const rebalances = gapRebalances({ gapParams: params, lowerBracketBond: lowerBond, upperBracketBond: upperBond, retained, refCPI, bondHolidays, lowerQty0: exL, upperQty0: exU });
    const interest = gapInterestByYear({
      rebalances, lowerBracketBond: lowerBond, upperBracketBond: upperBond, retained, refCPI, settlementDate, firstGapYear,
      bondHolidays, rmdCouponMode, tradeDate, rmdLastDate: _lastCouponDate,
    });
    return {
      params, lowerYear: lowerBracketYear, upperYear: upperBracketYear,
      lowerDuration: lowerDur, upperDuration: upperDur, lowerWeight: wL, upperWeight: wU,
      lowerMonth: BL_MONTHS[lowerBond.maturity.getMonth()], upperMonth: BL_MONTHS[upperBond.maturity.getMonth()],
      lowerExQty: exL, upperExQty: exU, retainedQty0, totalExcessCost: exL * lowerCPB + exU * upperCPB,
      rebalances, simulated: interest.simulated, excess: interest.excess, netCash: interest.netCash,
    };
  };
  const gapCreditOf = (stage, year) => stage
    ? (stage.simulated.get(year) ?? 0) + (stage.excess.get(year) ?? 0) + (stage.netCash.get(year) ?? 0) : 0;
  const preLadderYears = preLadderInterest ? Math.max(0, firstYear - settlementYear) : 0;
  const gapEstimate = (preLadderYears > 0 || availableCash > 0) ? gapStage(prelim, {}) : null;

  // 3b. Pre-ladder interest pool: coupons received before the ladder starts, plus the amounts credited to
  // those years for the gap years and for the Future 30Y years, kept as named parts for the pool
  // drill: the interest of the Simulated Outstanding TIPS and of the Excess TIPS (Cover Excess), and the Net Cash.
  let preLadderPool = 0;
  let preLadderCouponPool = 0;
  let preLadderFuture30yPool = 0;
  let preLadderGapPool = 0;
  let preLadderNetCashPool = 0;
  const zeroedFundedYears = new Set();
  const pliCreditByGapYear = {};
  const pliCreditByFundedYear = {};
  const cashCreditByFundedYear = {};
  const creditByFundedYear = {};
  let partialCreditYear = null, partialCredit = 0;

  if (preLadderYears > 0) {
    const totalAnnualInt = Object.values(prelim).reduce((s, p) => s + p.annualInterest, 0);
    preLadderCouponPool = preLadderYears * totalAnnualInt;
    for (let y = settlementYear; y < firstYear; y++) {
      preLadderFuture30yPool += future30yInterest(y);
      preLadderGapPool += (gapEstimate?.simulated.get(y) ?? 0) + (gapEstimate?.excess.get(y) ?? 0);
      preLadderNetCashPool += (future30yNetCashByYear.get(y) ?? 0) + (gapEstimate?.netCash.get(y) ?? 0);
    }
    preLadderPool = preLadderCouponPool + preLadderFuture30yPool + preLadderGapPool + preLadderNetCashPool;
  }

  // Available cash and pre-ladder interest are one pool consumed earliest-rung-first
  // (2.0 §Available Cash). Cash applies first — money in hand ahead of coupons still to arrive —
  // and each year records the split so the drill can attribute it.
  const creditPool = availableCash + preLadderPool;
  if (creditPool > 0) {
    let remainingCash = availableCash;

    // The settlement year is measured against its REMAINING coupons, not a full year's: coupons
    // already paid this year are in hand, not still-forthcoming income for that rung. Charging the
    // pool against a full-year figure would understate the rung and spill cash up the ladder early.
    const passLastDate = _lastCouponDate;
    const laterMatIntForCreditPass = (year) => {
      if (year !== settlementYear) return prelim[year].laterMatInt;
      let sum = 0;
      for (const [y, pr] of Object.entries(prelim)) {
        if (parseInt(y, 10) <= settlementYear) continue;
        for (const r of pr.rungs) {
          sum += r.qty * r.ir * 1000 * r.coupon / 2
               * rmdCappedRemainingCoupons(r.bond.maturity, settlementDate, bondHolidays, rmdCouponMode, tradeDate, passLastDate);
        }
      }
      return sum;
    };
    const takeCredit = (year, amount) => {
      const fromCash = Math.min(remainingCash, amount);
      remainingCash -= fromCash;
      cashCreditByFundedYear[year] = fromCash;
      pliCreditByFundedYear[year] = amount - fromCash;
      creditByFundedYear[year] = amount;
    };

    const gapYearSet = new Set(gapYears);
    const allYearsSorted = [...new Set([...rangeYears, ...gapYears])].sort((a, b) => a - b);
    let remaining = creditPool;

    for (const year of allYearsSorted) {
      if (year < firstYear) continue; // lower bracket year is not a funded year
      if (gapYearSet.has(year)) {
        const actualTIPSLMI = Object.entries(prelim)
          .filter(([y]) => parseInt(y) > year)
          .reduce((s, [, p]) => s + p.annualInterest, 0);
        const need = Math.max(0, (daraByYear?.get(year) ?? dara) - actualTIPSLMI);
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
        const need = yearDaraForPLI - laterMatIntForCreditPass(year) - future30yCredit(year) - gapCreditOf(gapEstimate, year);
        if (need <= 0) { zeroedFundedYears.add(year); takeCredit(year, 0); continue; }
        if (remaining >= need) {
          zeroedFundedYears.add(year);
          takeCredit(year, need);
          remaining -= need;
        } else {
          takeCredit(year, remaining);
          partialCreditYear = year;
          partialCredit = remaining;
          remaining = 0;
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

  // 4c. Gap parameters → duration matching → Bracket Weights and Excess TIPS at settlement, then the
  // conversions and credited amounts, now with the pre-ladder credit each gap year received. The Excess
  // TIPS pays no interest in a gap year (2.0 §Gap Year Simulated Outstanding TIPS), and the Cover
  // Excess is sold before the first gap year too (2.0 §Future 30Y Simulated Outstanding TIPS), so the
  // interest above the gap years is that of the actual TIPS alone.
  const gapFinal = gapStage(effectivePrelim, pliCreditByGapYear);
  const gapParams = gapFinal?.params ?? null;
  if (gapFinal) ({ lowerYear, upperYear } = gapFinal);
  const lowerDuration = gapFinal?.lowerDuration ?? null, upperDuration = gapFinal?.upperDuration ?? null;
  const lowerWeight = gapFinal?.lowerWeight ?? null, upperWeight = gapFinal?.upperWeight ?? null;
  const lowerMonth = gapFinal?.lowerMonth ?? null, upperMonth = gapFinal?.upperMonth ?? null;
  const lowerExQty = gapFinal?.lowerExQty ?? 0, upperExQty = gapFinal?.upperExQty ?? 0, totalExcessCost = gapFinal?.totalExcessCost ?? 0;
  const gapRebal = gapFinal?.rebalances ?? { conversions: [], lowerQty0: 0, upperQty0: 0 };
  const gapSimulatedInterestByYear = gapFinal?.simulated ?? new Map();
  const gapExcessInterestByYear = gapFinal?.excess ?? new Map();
  const gapNetCashByYear = gapFinal?.netCash ?? new Map();
  const gapCredit = (year) => gapCreditOf(gapFinal, year);

  // 5. Corrected long→short sweep over actual funded years.
  //    corrRungs[year] holds the per-sub-rung breakdown (multi-TIPS years); corrFYQty[year] is the
  //    funded-year total (Σ sub-rung qty) — the value every downstream aggregate consumer reads.
  //    The Excess TIPS and the Cover Excess are not in the running LMI: their interest, that of the
  //    Simulated Outstanding Future 10Y and Future 30Y TIPS, and the Net Cash are credited to each year
  //    directly (gapCredit and future30yCredit above), and a bracket or cover year's Same-Maturity Excess
  //    Interest is 0, the excess being sold before it matures (DD §Same-Maturity Excess Interest).
  const corrFYQty = {};
  const corrLMI   = {};
  const corrRungs = {};
  {
    // RMD Options 'last' mode: the pool-wide latest remaining coupon date, over every bond in a
    // year above the settlement year (the funded-year sizing target for that year, whichever rung
    // policy picked it — same set the sweep below draws its LMI from). Computed once, before the
    // sweep runs, since 'last' needs the pool's shared answer at the moment the sweep first reaches
    // it (the settlement year, near the end of the long→short walk).
    const rmdLastDate = _lastCouponDate;

    let runningLMI = 0;             // full-annual convention — correct for every year but the settlement year
    let runningLMIRemaining = 0;    // same pool, but each holding's coupon capped to dates not yet paid this year
    for (const year of [...rangeYears].sort((a, b) => b - a)) {
      const yearDara = daraByYear?.get(year) ?? dara;
      const isZrd   = zeroedFundedYears.has(year);
      // The funded year containing settlementDate is already partway through its calendar
      // year: whichever of its incoming coupons already paid have already been received (and,
      // per the RMD/DARA planning use case, already reinvested) — they are not still-forthcoming
      // cash for this year. Every other funded year is entirely in the future, so its incoming
      // coupons haven't happened yet and the full-annual assumption is exactly right there.
      const isSettlementYear = year === settlementYear;
      const incomingLMI = isSettlementYear ? runningLMIRemaining : runningLMI;
      corrLMI[year] = incomingLMI;

      const credited = future30yCredit(year) + gapCredit(year);   // simulated TIPS + Excess TIPS (Cover Excess) interest + Net Cash

      // Funded-year real P+I need after the year-level income offsets, split across the year's TIPS.
      const need = (isZrd || year > lastYear || year < firstYear) ? 0
        : Math.max(0, yearDara - incomingLMI - credited - (year === partialCreditYear ? partialCredit : 0));
      const rungs = sizeYearRungs(tipsList(year), need, refCPI);
      const { qty: fyQty, annualInterest: fundedCoupon } = aggregateRungs(rungs);

      corrRungs[year] = rungs;
      corrFYQty[year] = fyQty;
      runningLMI += fundedCoupon;
      runningLMIRemaining += rungs.reduce((s, r) => s + r.qty * r.ir * 1000 * r.coupon / 2 * rmdCappedRemainingCoupons(r.bond.maturity, settlementDate, bondHolidays, rmdCouponMode, tradeDate, rmdLastDate), 0);
    }
  }

  return {
    prelim, corrFYQty, corrLMI, corrRungs,
    availableCash, rmdCouponMode, tradeDate,
    zeroedFundedYears, partialCreditYear, partialCredit, pliCreditByGapYear, pliCreditByFundedYear,
    cashCreditByFundedYear, creditByFundedYear, creditPool,
    lowerYear, upperYear, lowerExQty, upperExQty, lowerWeight, upperWeight,
    lowerDuration, upperDuration, lowerMonth, upperMonth, totalExcessCost,
    gapParams, future30yParams,
    future30yLowerDuration, future30yUpperDuration, future30yUpperWeight, future30yLowerWeight,
    future30yLowerExQty, future30yUpperExQty, future30yFellBack, future30yCoverReason, future30yTotalExcessCost,
    future30yLowerMonth, future30yUpperMonth,
    future30yRebalances: future30yRebal, future30ySimulatedInterestByYear, future30yCoverInterestByYear, future30yNetCashByYear,
    gapRebalances: gapRebal, gapRetainedQty0: gapFinal?.retainedQty0 ?? [], gapSimulatedInterestByYear, gapExcessInterestByYear, gapNetCashByYear,
    preLadderYears, preLadderPool, preLadderCouponPool, preLadderFuture30yPool, preLadderGapPool, preLadderNetCashPool,
  };
}
