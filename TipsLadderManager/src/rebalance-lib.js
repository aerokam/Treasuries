// rebalance-lib.js -- Core logic for TIPS ladder rebalancing (4.0_TIPS_Ladder_Rebalancing.md)
// Exports: buildTipsMarketData, runRebalance, localDate, inferDARAFromCash, inferScaledDARAFromPortfolio

import { bondCalcs, calculateMDuration, yieldFromPrice, calcMktWtdAvg } from '../../shared/src/bond-math.js';
import { indexRatio as calcIndexRatio } from '../../shared/src/ref-cpi.js';
export { yieldFromPrice };
import { interpolateYield, syntheticCoupon, bracketWeights, bracketWeightsN, gapParamsCore, future30yParamsCore } from './gap-math.js';
import { findSpikes, evenSpread, MIN_SHAPE_POINTS, inferShapeValue } from './shape-math.js';
import { getGapYears, UPPER_BRACKET_YEAR, upperBracketBond, sizeLadder, selectLadderBonds, fundedYearAmount, rmdCappedRemainingCoupons, latestRemainingCouponDate, selectFuture30yCovers, future30yRebalances, future30yInterestByYear, gapRebalances, gapInterestByYear, future30yLimit, syntheticYearAmounts } from './ladder-core.js';
import { localDate, fmtDate, fmtDateLong, toDateStr } from './date-util.js';
import { rankForYear, levelValues } from './allocation-policy.js';
import { parseCSVLine } from './broker-import.js';

// Re-export date helpers so existing importers (index.html, tests) keep working.
export { localDate, fmtDate, fmtDateLong };

// The floor of the holdings search range for the lower bracket. A design choice, not derived from market data
// (DATA_DICTIONARY §5.1). Defined here once; before-state-lib.js imports it.
export const LOWEST_LOWER_BRACKET_YEAR = 2032;

export function calculatePIPerBond(cusip, maturity, refCPI, tipsMarketData) {
  const bond = tipsMarketData.get(cusip);
  if (!bond) return 0;
  const indexRatio = calcIndexRatio(refCPI, bond.datedDateRefCpi || refCPI);
  const adjustedPrincipal = 1000 * indexRatio;
  const annualInterest = adjustedPrincipal * bond.coupon;
  const month = maturity.getMonth() + 1;
  const lastYearInterest = (month < 7) ? annualInterest * 0.5 : annualInterest * 1.0;
  return adjustedPrincipal + lastYearInterest;
}

export function buildTipsMarketData(yieldsRows, saYieldByCusip = null) {
  const map = new Map();
  for (const r of yieldsRows) {
    map.set(r.cusip, {
      cusip:    r.cusip,
      maturity: localDate(r.maturity),
      coupon:   r.coupon,
      datedDateRefCpi:  r.datedDateRefCpi,
      price:    r.price  || null,
      yield:    r.yield  || null,
      saYield:  saYieldByCusip?.get(r.cusip) ?? null,
    });
  }
  return map;
}

function identifyBrackets(gapYears, holdings, yearInfo, tipsMarketData, araByYear, DARA, firstYear = 0) {
  if (gapYears.length === 0) return { lowerCUSIP: null, lowerYear: null, lowerMaturity: null, upperCUSIP: null, upperYear: null, upperMaturity: null };
  const minGapYear = Math.min(...gapYears);
  const upperYear = UPPER_BRACKET_YEAR;
  const upperH = yearInfo[upperYear]?.holdings?.find(h => h.maturity.getMonth() + 1 === 2);
  const upperCUSIP = upperH?.cusip || upperBracketBond(tipsMarketData)?.cusip;
  const upperMaturity = tipsMarketData.get(upperCUSIP)?.maturity || localDate(`${upperYear}-02-15`);

  // Only consider holdings in years >= firstYear as potential lower brackets.
  // Holdings below firstYear are being sold and must not influence bracket selection.
  const cusipTotals = new Map();
  for (const h of holdings) {
    if (h.year < firstYear) continue;
    cusipTotals.set(h.cusip, (cusipTotals.get(h.cusip) ?? 0) + h.qty);
  }

  let maxExcess = -Infinity, lowerCUSIP = null, lowerYear = null, lowerMaturity = null;

  for (const [cusip, totalQty] of cusipTotals.entries()) {
    const bond = tipsMarketData.get(cusip);
    if (!bond || !bond.maturity) continue;
    const y = bond.maturity.getFullYear();
    if (y >= LOWEST_LOWER_BRACKET_YEAR && y < minGapYear && totalQty > 0) {
      // Metric: Excess ARA. The bracket is the TIPS with the most spare capacity (ARA >> DARA).
      const excess = (araByYear[y] || 0) - DARA;
      if (excess > maxExcess || (excess === maxExcess && totalQty > (cusipTotals.get(lowerCUSIP) || -1))) {
        maxExcess = excess; lowerCUSIP = cusip; lowerYear = y; lowerMaturity = bond.maturity;
      }
    }
  }

  // When firstYear is inside the gap (e.g. 2037–2039), no holdings exist below minGapYear.
  // Fall back to tipsMarketData to find the latest-maturing pre-gap TIPS.
  // In full rebalance this generates a BUY for 2036 excess bonds (qtyBefore = 0).
  if (lowerCUSIP == null && gapYears.length > 0) {
    for (const bond of tipsMarketData.values()) {
      if (!bond.maturity || !bond.yield) continue;
      const yr = bond.maturity.getFullYear();
      if (yr < minGapYear) {
        if (!lowerMaturity || bond.maturity > lowerMaturity) {
          lowerCUSIP = bond.cusip; lowerYear = yr; lowerMaturity = bond.maturity;
        }
      }
    }
  }
  return { lowerCUSIP, lowerYear, lowerMaturity, upperCUSIP, upperYear, upperMaturity };
}

function calculateGapParameters(gapYears, settlementDate, refCPI, tipsMarketData, DARA, holdings, lastYear, pliCreditByGapYear = {}, daraByYear = null, zeroedFundedYears = new Set()) {
  if (gapYears.length === 0) return { avgDuration: 0, totalCost: 0 };
  const holdingsByYear = {};
  for (const h of holdings) {
    if (!holdingsByYear[h.year]) holdingsByYear[h.year] = [];
    holdingsByYear[h.year].push(h);
  }

  // Pre-compute a long→short running-LMI estimate for all 2041+ rungs. Matches build-lib's
  // preliminary sweep (calcPrelimFundedYearAmounts) so that gapParams.totalCost / targetQty2040
  // agree with build-lib despite not using actual holdings.
  const prelimAnnInt = {};
  let runningLMI = 0;
  for (let year = (lastYear || UPPER_BRACKET_YEAR); year > UPPER_BRACKET_YEAR; year--) {
    const yearBonds = [...tipsMarketData.values()].filter(b => b.maturity && b.maturity.getFullYear() === year);
    if (yearBonds.length > 0) {
      yearBonds.sort((a, b) => a.maturity - b.maturity);
      const b = yearBonds[yearBonds.length - 1];
      const coupon = b.coupon ?? 0;
      const ir = calcIndexRatio(refCPI, b.datedDateRefCpi || refCPI);
      const piPB = 1000 * ir + (b.maturity.getMonth() + 1 < 7 ? 0.5 : 1.0) * 1000 * ir * coupon;
      const qty = Math.max(0, Math.round(((daraByYear?.get(year) ?? DARA) - runningLMI) / piPB));
      const annInt = qty * 1000 * ir * coupon;
      prelimAnnInt[year] = annInt;
      runningLMI += annInt;
    }
  }

  let laterMaturityFrom2041Plus = 0;
  for (let year = UPPER_BRACKET_YEAR + 1; year <= (lastYear || UPPER_BRACKET_YEAR); year++) {
    laterMaturityFrom2041Plus += prelimAnnInt[year] ?? 0;
  }

  // Resolve the upper bracket: prefer actual holdings, fall back to the outstanding TIPS of that year if not held
  const _ub2040Holdings = holdingsByYear[UPPER_BRACKET_YEAR] ?? [];
  const _ub2040CUSIP = _ub2040Holdings[0]?.cusip || upperBracketBond(tipsMarketData)?.cusip;
  const _ub2040Maturity = _ub2040Holdings[0]?.maturity || localDate(`${UPPER_BRACKET_YEAR}-02-15`);
  const bond2040 = tipsMarketData.get(_ub2040CUSIP);
  const coupon2040 = bond2040?.coupon ?? 0;
  const datedDateRefCpi2040 = bond2040?.datedDateRefCpi ?? refCPI;
  const indexRatio2040 = calcIndexRatio(refCPI, datedDateRefCpi2040);
  const piPerBond2040 = calculatePIPerBond(_ub2040CUSIP, _ub2040Maturity, refCPI, tipsMarketData);
  // When lastYear < 2040, 2040 is purely a bracket (not a funded rung) — use actual holdings qty for LMI
  const targetQty2040 = lastYear < UPPER_BRACKET_YEAR
    ? _ub2040Holdings.reduce((s, h) => s + h.qty, 0)
    : Math.round(((daraByYear?.get(UPPER_BRACKET_YEAR) ?? DARA) - laterMaturityFrom2041Plus) / (piPerBond2040 || 1));
  const annualInterest2040 = targetQty2040 * 1000 * indexRatio2040 * coupon2040;

  // A funded year the pre-ladder pool funds entirely holds no TIPS, so it pays no coupon above the gap
  // years (2.0 §Pre-Ladder Interest, Actual TIPS LMI): the same rule sizeLadder's effective prelim applies.
  const gapLaterMaturityInterest = { [UPPER_BRACKET_YEAR]: zeroedFundedYears.has(UPPER_BRACKET_YEAR) ? 0 : annualInterest2040 };
  // Add other years above the upper bracket year to the gap LMI pool (same prelim running-LMI estimate as above)
  for (let year = UPPER_BRACKET_YEAR + 1; year <= (lastYear || UPPER_BRACKET_YEAR); year++) {
    gapLaterMaturityInterest[year] = zeroedFundedYears.has(year) ? 0 : (prelimAnnInt[year] ?? 0);
  }

  // Shared sweep. Rebalance's "LMI above the gap" = gapLaterMaturityInterest (the actual TIPS above the
  // gap years), assembled above; the Excess TIPS and the Cover Excess pay no interest in a gap year (2.0 §Gap
  // Year Simulated Outstanding TIPS). Everything else is identical to build via the shared gapParamsCore.
  return gapParamsCore({
    gapYears, tipsMarketData, settlementDate, dara: DARA, daraByYear,
    lmiAboveByYear: gapLaterMaturityInterest, pliCreditByGapYear,
  });
}

// The natural (un-overridden) first/last year of a ladder: the earliest and latest maturity year
// held. Single source for runRebalance and the Rebalance UI's First/Last Year dropdowns
// (3.0 §Ladder Range) — no contiguity requirement, an unheld year in between is just an empty rung.
export function deriveHoldingsYearRange(holdings, tipsMarketData) {
  const years = [...new Set(holdings.map(h => tipsMarketData.get(h.cusip)?.maturity?.getFullYear()).filter(y => y != null))];
  if (!years.length) return null;
  return { firstYear: Math.min(...years), lastYear: Math.max(...years) };
}

// Infer the true firstYear when a Format 4/5 CSV is loaded whose derivedFirstYear is a pure bracket
// year below the gap years (e.g. 2036 when the ladder actually started at 2038).
// Returns the inferred gap-year firstYear, or null if the inference does not apply.
export function inferFirstYearFromHoldings({ holdings, tipsMarketData, refCPI, settlementDate }) {
  const enriched = holdings.map(h => {
    const bond = tipsMarketData.get(h.cusip);
    return bond?.maturity ? { cusip: h.cusip, qty: h.qty, excessQty: h.excessQty, maturity: bond.maturity, year: bond.maturity.getFullYear() } : null;
  }).filter(Boolean);
  if (!enriched.length) return null;
  enriched.sort((a, b) => a.maturity - b.maturity);

  const derivedFirstYear = enriched[0].year;
  const firstYearH = enriched.filter(h => h.year === derivedFirstYear);

  // Requires Format 4/5: all holdings at derivedFirstYear have excessQty defined and equal qty.
  if (!firstYearH.every(h => h.excessQty != null)) return null;
  const firstYearTotal = firstYearH.reduce((s, h) => s + h.qty, 0);
  const firstYearExcess = firstYearH.reduce((s, h) => s + h.excessQty, 0);
  if (firstYearExcess !== firstYearTotal) return null;

  // The gap years above the first year (ascending: [2037, 2038, 2039]).
  const structuralGap = getGapYears(tipsMarketData).filter(y => y > derivedFirstYear);
  if (!structuralGap.length) return null;
  const minGapYear = structuralGap[0];

  // derivedFirstYear bond must be the canonical Active Lower Bracket -- the latest-maturing TIPS
  // below the structural gap (DATA_DICTIONARY.md #active-lower-bracket; same computation runRebalance's
  // 2-bracket override uses), not specifically a January maturity. (Fixed 2026-09-30: this previously
  // required a January maturity outright, which coincidentally held until the active lower bracket
  // itself became a July bond -- Build now buys Jul 2036 there -- so this inference always returned
  // null for any ladder reaching the gap built or imported without an explicit #fundedYear,dara block.)
  let activeLowerBracketYear = null, activeLowerBracketMaturity = null;
  for (const b of tipsMarketData.values()) {
    if (!b.maturity) continue;
    const yr = b.maturity.getFullYear();
    if (yr < minGapYear && (!activeLowerBracketMaturity || b.maturity > activeLowerBracketMaturity)) {
      activeLowerBracketYear = yr; activeLowerBracketMaturity = b.maturity;
    }
  }
  if (derivedFirstYear !== activeLowerBracketYear) return null;

  // Total P+I of excess bonds ≈ numGapYears × DARA  (spec §Gap Year Coverage Model).
  // Use this to directly compute numGapYears = round(totalExcessPI / roughDARA).
  const piPerBondFor = (yr) => {
    const h = enriched.find(e => e.year === yr);
    if (!h) return 0;
    const b = tipsMarketData.get(h.cusip);
    if (!b) return 0;
    const ir = calcIndexRatio(refCPI, b.datedDateRefCpi ?? refCPI);
    const m = b.maturity.getMonth() + 1;
    return 1000 * ir + 1000 * ir * b.coupon * (m < 7 ? 0.5 : 1.0);
  };
  const upper2040Excess = enriched.filter(h => h.year === UPPER_BRACKET_YEAR).reduce((s, h) => s + (h.excessQty ?? 0), 0);
  const totalExcessPI = firstYearExcess * piPerBondFor(derivedFirstYear) + upper2040Excess * piPerBondFor(UPPER_BRACKET_YEAR);
  if (totalExcessPI <= 0) return null;

  // Rough DARA: median ARA of the non-bracket, non-gap funded years.
  const hYears = [...new Set(enriched.map(h => h.year))].sort((a, b) => a - b);
  const gapSet = new Set(structuralGap);
  const araLMI = {};
  const araByYear = {};
  for (const year of hYears.slice().sort((a, b) => b - a)) {
    let lmi = 0;
    for (const y in araLMI) if (parseInt(y) > year) lmi += araLMI[y];
    araLMI[year] = 0;
    let p = 0, c = 0;
    for (const h of enriched.filter(e => e.year === year)) {
      const b = tipsMarketData.get(h.cusip);
      const ir = calcIndexRatio(refCPI, b.datedDateRefCpi ?? refCPI);
      const ap = 1000 * ir, m = h.maturity.getMonth() + 1;
      const fundedQty = h.qty - (h.excessQty ?? 0);
      p += fundedQty * ap; c += fundedQty * ap * b.coupon * (m < 7 ? 0.5 : 1.0);
      araLMI[year] += fundedQty * ap * b.coupon;
    }
    araByYear[year] = p + c + lmi;
  }
  const araVals = [];
  for (let y = derivedFirstYear + 1; y <= (hYears[hYears.length - 1] ?? derivedFirstYear); y++) {
    if (!gapSet.has(y) && y !== derivedFirstYear && araByYear[y] != null) araVals.push(araByYear[y]);
  }
  araVals.sort((a, b) => a - b);
  const midIdx = Math.floor(araVals.length / 2);
  const roughDARA = araVals.length === 0 ? 0
    : araVals.length % 2 === 0 ? (araVals[midIdx - 1] + araVals[midIdx]) / 2
    : araVals[midIdx];
  if (roughDARA <= 0) return null;

  // numGapYears = round(totalExcessPI / roughDARA); firstYear = the upper bracket year - numGapYears.
  const numGapYears = Math.round(totalExcessPI / roughDARA);
  const inferred = UPPER_BRACKET_YEAR - numGapYears;
  const minGap = structuralGap[0], maxGap = structuralGap[structuralGap.length - 1];
  if (inferred < minGap || inferred > maxGap) return null;
  return inferred;
}

/// Symmetric to inferFirstYearFromHoldings, for the OTHER end of the ladder.
// Spec: 2.0 §Future 30Y Rungs. The file's EXCESS column at the Future 30Y cover pair (chosen by rule,
// 2.0 §Future 30Y Cover Pair) signals the ladder extends past the longest-dated issued TIPS. The
// number of Future 30Y years — i.e. lastYear — is encoded in the cost-weighted split between the two
// covers, which is DARA-independent (a pure duration match). So we forward-reconstruct: for each
// candidate lastYear, predict the upper-cover weight via the SAME future30yParamsCore + bracketWeights
// the build uses, and return the year whose predicted split matches the file. Returns null when there
// is no Cover Excess (ladder ends at the last actual TIPS) or the covers are missing — leaving the
// derivation from the held maturity years in place. A simple excess/DARA ratio (as the gap uses) does NOT work
// here: the upper cover is deep-discount and a long run of Future 30Y years carries a large LMI cascade.
export function inferLastYearFromHoldings({ holdings, tipsMarketData, refCPI, settlementDate, bondHolidays = new Set() }) {
  const limit = future30yLimit({ tipsMarketData, settlementDate, refCPI, bondHolidays });
  const covers = limit.covers;
  const lower = covers?.lowerCoverBond, upper = covers?.upperCoverBond;
  if (!lower || !upper) return null;
  const maxTipsYear = covers.maxTipsYear;
  // A cover at or below the gap's upper bracket year cannot be told apart from bracket excess by the
  // file's excess column, so no last year is recovered from it.
  const _gap = getGapYears(tipsMarketData);
  if (_gap.length && Math.min(lower.maturity.getFullYear(), upper.maturity.getFullYear()) <= Math.max(..._gap) + 1) return null;

  // Observed Cover Excess from the file (Format 4/5 only — excessQty must be present).
  const coverHoldings = holdings.filter(h => h.cusip === lower.cusip || h.cusip === upper.cusip);
  if (!coverHoldings.length || !coverHoldings.every(h => h.excessQty != null)) return null;
  const exOf = (cusip) => coverHoldings.filter(h => h.cusip === cusip).reduce((s, h) => s + (h.excessQty ?? 0), 0);
  const obsLo = exOf(lower.cusip), obsUp = exOf(upper.cusip);
  if (obsLo + obsUp <= 0) return null;   // no Cover Excess → ladder ends at maxTipsYear

  const cpbL = (lower.price ?? 0) / 100 * calcIndexRatio(refCPI, lower.datedDateRefCpi ?? refCPI) * 1000;
  const cpbU = (upper.price ?? 0) / 100 * calcIndexRatio(refCPI, upper.datedDateRefCpi ?? refCPI) * 1000;
  if (!(cpbL > 0) || !(cpbU > 0)) return null;

  // Cost-weighted observed upper weight, matched against the build's predicted weight per candidate year.
  const obsUW = (obsUp * cpbU) / ((obsUp * cpbU) + (obsLo * cpbL));
  const NOMINAL_DARA = 100000;   // predicted upper weight is scale-invariant; any nominal DARA works
  let best = null;
  for (let L = maxTipsYear + 1; L <= Math.max(limit.lastYearMax, maxTipsYear + 1); L++) {
    const years = [];
    for (let y = maxTipsYear + 1; y <= L; y++) years.push(y);
    const fp = future30yParamsCore({ future30yYears: years, anchorBond: covers.anchorBond, settlementDate, dara: NOMINAL_DARA });
    const { upperWeight } = bracketWeights(covers.lowerDuration, covers.upperDuration, fp.avgDuration);
    const err = Math.abs(upperWeight - obsUW);
    if (!best || err < best.err) best = { L, err };
  }
  return best ? best.L : null;
}

// The Simulated Outstanding Future 30Y TIPS and Cover Excess interest and the Net Cash implied by holdings alone, for
// a holder whose DARA is inferred (3.0 §DARA inference with Future 30Y years). No holdings include
// Simulated Outstanding Future 30Y TIPS, so their quantities are implied by the held Cover Excess:
// the one flat DARA that sizes the Synthetic TIPS of the Future 30Y years (through `lastYear`) to the
// cost of the held Cover Excess gives their quantities. Only Cover Excess the file states
// (`excessQty`) counts; a holder with none has no Future 30Y years and no simulated coupons.
// Returns null when there is nothing to imply, else { impliedDara, future30yParams, rebalances,
// simulated, cover, netCash, lowerQty0, upperQty0, covers }.
export function impliedFuture30yInterest({ holdings, tipsMarketData, refCPI, settlementDate, lastYear, bondHolidays = new Set(), rmdCouponMode = 'all', tradeDate = settlementDate, rmdLastDate = null }) {
  const covers = selectFuture30yCovers({ tipsMarketData, settlementDate });
  const lower = covers?.lowerCoverBond, upper = covers?.upperCoverBond;
  if (!lower || !upper || !(lastYear > covers.maxTipsYear)) return null;
  const declaredExcess = (cusip) => holdings.reduce((s, h) => h.cusip === cusip && h.excessQty != null ? s + h.excessQty : s, 0);
  const lowerQty0 = declaredExcess(lower.cusip), upperQty0 = declaredExcess(upper.cusip);
  if (lowerQty0 + upperQty0 <= 0) return null;
  const cpb = (b) => (b.price ?? 0) / 100 * calcIndexRatio(refCPI, b.datedDateRefCpi ?? refCPI) * 1000;
  const heldCost = lowerQty0 * cpb(lower) + upperQty0 * cpb(upper);
  const future30yYears = [];
  for (let y = covers.maxTipsYear + 1; y <= lastYear; y++) future30yYears.push(y);
  const pass1 = (dara) => future30yParamsCore({ future30yYears, anchorBond: covers.anchorBond, settlementDate, dara });
  // Pass 1 total cost rises with the flat DARA; bisect for the DARA whose cost is nearest the held cost.
  let lo = 0, hi = 1000;
  while (pass1(hi).future30yTotalCost < heldCost && hi < 1e9) hi *= 2;
  for (let i = 0; i < 60 && hi - lo > 0.5; i++) {
    const mid = (lo + hi) / 2;
    if (pass1(mid).future30yTotalCost < heldCost) lo = mid; else hi = mid;
  }
  const impliedDara = Math.abs(pass1(lo).future30yTotalCost - heldCost) <= Math.abs(pass1(hi).future30yTotalCost - heldCost) ? lo : hi;
  const future30yParams = pass1(impliedDara);
  const rebalances = future30yRebalances({ future30yParams, lowerCoverBond: lower, upperCoverBond: upper, refCPI, bondHolidays, lowerQty0, upperQty0 });
  const { simulated, cover, netCash } = future30yInterestByYear({
    rebalances, lowerCoverBond: lower, upperCoverBond: upper, refCPI, settlementDate, firstFuture30yYear: covers.maxTipsYear + 1,
    bondHolidays, rmdCouponMode, tradeDate, rmdLastDate,
  });
  return { impliedDara, future30yParams, rebalances, simulated, cover, netCash, lowerQty0, upperQty0, covers };
}

// The Simulated Outstanding Future 10Y TIPS and Excess TIPS interest and the Net Cash implied by holdings alone,
// for a holder whose DARA is inferred (3.0 §DARA inference with Future 30Y years, the gap years inferred the same
// way). No holdings include Simulated Outstanding Future 10Y TIPS, so their quantities are implied by the held
// Excess TIPS: the one flat DARA that sizes the Synthetic TIPS of the gap years to the cost of the held Excess TIPS
// gives their quantities. Only Excess TIPS the file states (`excessQty`) counts, at the active lower bracket, the
// upper bracket and any retained lower bracket maturity; a holder with none has no simulated coupons. The LMI above
// the gap years is the interest of the funded part of the TIPS held above them.
// Returns null when there is nothing to imply, else { impliedDara, gapParams, rebalances, simulated, excess, netCash,
// lowerBracketBond, upperBracketBond, retained, lowerQty0, upperQty0 }.
export function impliedGapInterest({ holdings, tipsMarketData, refCPI, settlementDate, firstYear, lastYear, bondHolidays = new Set(), rmdCouponMode = 'all', tradeDate = settlementDate, rmdLastDate = null }) {
  const structuralGap = getGapYears(tipsMarketData);
  const gapYears = structuralGap.filter(y => y >= firstYear && y <= lastYear).sort((a, b) => a - b);
  if (!gapYears.length) return null;
  const minGap = gapYears[0], maxStructuralGap = Math.max(...structuralGap);
  let lowerBracketBond = null, upperBracketBond = null;
  for (const b of tipsMarketData.values()) {
    if (!b.maturity || !b.yield) continue;
    const yr = b.maturity.getFullYear();
    if (yr < minGap && (!lowerBracketBond || b.maturity > lowerBracketBond.maturity)) lowerBracketBond = b;
    if (yr === maxStructuralGap + 1 && (!upperBracketBond || b.maturity > upperBracketBond.maturity)) upperBracketBond = b;
  }
  if (!lowerBracketBond || !upperBracketBond) return null;
  const declaredExcess = (cusip) => holdings.reduce((s, h) => h.cusip === cusip && h.excessQty != null ? s + h.excessQty : s, 0);
  const lowerQty0 = declaredExcess(lowerBracketBond.cusip), upperQty0 = declaredExcess(upperBracketBond.cusip);
  const retained = [];
  for (const b of tipsMarketData.values()) {
    if (!b.maturity || b.cusip === lowerBracketBond.cusip || b.cusip === upperBracketBond.cusip) continue;
    const yr = b.maturity.getFullYear();
    const qty0 = declaredExcess(b.cusip);
    if (yr >= LOWEST_LOWER_BRACKET_YEAR && yr < minGap && qty0 > 0) retained.push({ bond: b, qty0 });
  }
  retained.sort((a, b) => a.bond.maturity - b.bond.maturity);
  const cpb = (b) => (b.price ?? 0) / 100 * calcIndexRatio(refCPI, b.datedDateRefCpi ?? refCPI) * 1000;
  const heldCost = lowerQty0 * cpb(lowerBracketBond) + upperQty0 * cpb(upperBracketBond) + retained.reduce((s, r) => s + r.qty0 * cpb(r.bond), 0);
  if (!(heldCost > 0)) return null;
  // The actual TIPS above the gap years: their funded part's annual interest, at each maturity year.
  const lmiAboveByYear = {};
  for (const h of holdings) {
    const b = tipsMarketData.get(h.cusip);
    if (!b?.maturity || b.maturity.getFullYear() <= maxStructuralGap) continue;
    const funded = Math.max(0, h.qty - (h.excessQty ?? 0));
    const yr = b.maturity.getFullYear();
    lmiAboveByYear[yr] = (lmiAboveByYear[yr] ?? 0) + funded * 1000 * calcIndexRatio(refCPI, b.datedDateRefCpi ?? refCPI) * (b.coupon ?? 0);
  }
  const pass1 = (dara) => gapParamsCore({ gapYears, tipsMarketData, settlementDate, dara, lmiAboveByYear });
  let lo = 0, hi = 1000;
  while (pass1(hi).totalCost < heldCost && hi < 1e9) hi *= 2;
  for (let i = 0; i < 60 && hi - lo > 0.5; i++) {
    const mid = (lo + hi) / 2;
    if (pass1(mid).totalCost < heldCost) lo = mid; else hi = mid;
  }
  const impliedDara = Math.abs(pass1(lo).totalCost - heldCost) <= Math.abs(pass1(hi).totalCost - heldCost) ? lo : hi;
  const gapParams = pass1(impliedDara);
  const rebalances = gapRebalances({ gapParams, lowerBracketBond, upperBracketBond, retained, refCPI, bondHolidays, lowerQty0, upperQty0 });
  const { simulated, excess, netCash } = gapInterestByYear({
    rebalances, lowerBracketBond, upperBracketBond, retained, refCPI, settlementDate, firstGapYear: minGap,
    bondHolidays, rmdCouponMode, tradeDate, rmdLastDate,
  });
  return { impliedDara, gapParams, rebalances, simulated, excess, netCash, lowerBracketBond, upperBracketBond, retained, lowerQty0, upperQty0 };
}

export function inferDARAFromCash({ bracketMode = '2bracket', holdings: holdingsRaw, tipsMarketData, refCPI, settlementDate, lastYearOverride = null, preLadderInterest = false, firstYearOverride = null, bondHolidays = new Set(), availableCash = 0, rmdCouponMode = 'all', tradeDate = settlementDate }) {
  let portfolioCash = 0;
  for (const h of holdingsRaw) {
    const bond = tipsMarketData.get(h.cusip);
    if (!bond) continue;
    const ir = calcIndexRatio(refCPI, bond.datedDateRefCpi ?? refCPI);
    portfolioCash += h.qty * (bond.price ?? 0) / 100 * ir * 1000;
  }
  let lo = 1000, hi = 1000000, foundDARA = lo;
  // Binary search for the largest INTEGER DARA that results in delta >= 0
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const { summary } = runRebalance({ dara: mid, bracketMode, holdings: holdingsRaw, tipsMarketData, refCPI, settlementDate, lastYearOverride, preLadderInterest, firstYearOverride, bondHolidays, availableCash, rmdCouponMode, tradeDate });
    if (summary.costDeltaSum >= 0) {
      foundDARA = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return { dara: foundDARA, portfolioCash };
}

// ─── Per-year DARA recovery from holdings (import path) ──────────────────────────
// These three are the front half of the import-time DARA reconstruction: recover each
// funded year's ARA from the held quantities, flag gap-bracket years, and turn the ARA
// map into a per-year DARA map. They live here (not in index.html) so the full
// build→export→import→rebalance round-trip is reachable from tests as one chain.

// Recover raw ARA per funded year from holdings: funded-qty P+I plus LMI cascaded from
// later maturities (full held qty, incl. excess, contributes coupon to earlier years).
// NOTE: this is only (P+I)+LMI. The income terms build also credits (the gap bracket excess's own
// coupon, and the Future 30Y interest in place of the Cover Excess coupon carried in this LMI) are
// corrected downstream in inferScaledDARAFromPortfolio, which has the last-year context they need.
//
// Default form (no `range`): emit ONLY years that hold a TIPS — used for median/bracket detection
// and the segment infer solves. Range form (`{ firstYear, lastYear }`): emit EVERY year in the
// range, including empty ones (a year with no own TIPS gets `ARA = incoming LMI` alone). Holdings
// maturing after `lastYear` are not emitted but still cascade their coupon into earlier years' LMI.
// The range form is the file-load derived Per-Year DARA population (3.0 §Per-Year DARA from
// Portfolio) — every rung shows its true current income so the first Rebalance Ladder is a no-op.
export function computePortfolioARAByYear(holdingsArr, tipsMarketData, refCPI, range = null) {
  const byYear = {};
  for (const h of holdingsArr) {
    const b = tipsMarketData.get(h.cusip);
    if (!b?.maturity) continue;
    const ir = calcIndexRatio(refCPI, b.datedDateRefCpi ?? refCPI);
    const year = b.maturity.getFullYear();
    const m = b.maturity.getMonth() + 1;
    const nPay = m < 7 ? 1 : 2;  // Jan-Jun: 1 final coupon; Jul-Dec: 2
    const piPB = 1000 * ir * (1 + (b.coupon ?? 0) * 0.5 * nPay);
    // Use funded qty only for this year's P+I — excess bonds' P+I inflates the ARA target.
    // Keep full qty for annual interest (LMI flowing to earlier years remains correct).
    const fundedQty = (h.excessQty != null) ? Math.max(0, h.qty - h.excessQty) : h.qty;
    if (!byYear[year]) byYear[year] = { totalPI: 0, annInt: 0 };
    byYear[year].totalPI += fundedQty * piPB;
    byYear[year].annInt  += h.qty * 1000 * ir * (b.coupon ?? 0);
  }
  const ara = {};
  const heldYears = Object.keys(byYear).map(Number);
  if (!range) {
    let lmi = 0;
    for (const y of heldYears.sort((a, b) => b - a)) { // long to short
      ara[y] = byYear[y].totalPI + lmi;
      lmi += byYear[y].annInt;
    }
    return ara; // { year: rawARA } — held years only
  }
  // Range form: walk top→bottom so the running LMI is correct at each year. Start at the latest of
  // lastYear or the latest holding (so post-range holdings' coupon still cascades down).
  const { firstYear, lastYear } = range;
  const topYear = Math.max(lastYear, ...(heldYears.length ? heldYears : [lastYear]));
  let lmi = 0;
  for (let y = topYear; y >= firstYear; y--) {
    if (y <= lastYear) ara[y] = (byYear[y]?.totalPI ?? 0) + lmi;
    if (byYear[y]) lmi += byYear[y].annInt;
  }
  return ara;
}

// Gap years (currently 2037-2039): defined once in ladder-core.js, re-exported for the app and the tests.
export { getGapYears };

// Years adjacent to the structural gap (2037-2039) that may carry bracket excess: the
// 2040 upper bracket and any TIPS maturity year in [2032, minGap) that could have been an old lower
// bracket. Holdings in these years with ARA > 1.5× median are auto-capped to median.
// `lastYear` is the ladder's selected last funded year — bracket bridging (and so the whole
// candidate concept) only applies once the ladder actually reaches the structural gap. A
// ladder that stops short of it (e.g. lastYear 2036) has no gap to bridge, so a large holding
// at an otherwise-candidate year (e.g. 2034) is just a regular funded year, not bracket excess.
export function getGapYearBracketCandidates(tipsMarketData, lastYear = Infinity) {
  if (!tipsMarketData) return new Set();
  const gapYears = getGapYears(tipsMarketData);
  if (gapYears.length === 0) return new Set();
  const minGap = Math.min(...gapYears);
  if (lastYear < minGap) return new Set();
  const maxGap = Math.max(...gapYears);
  const LOWEST_LOWER = LOWEST_LOWER_BRACKET_YEAR;
  const candidates = new Set([maxGap + 1]);
  for (const b of tipsMarketData.values()) {
    if (!b.maturity) continue;
    const yr = b.maturity.getFullYear();
    if (yr >= LOWEST_LOWER && yr < minGap) candidates.add(yr);
  }
  return candidates;
}

// Whether the holder's own holdings show genuine intent to cover the structural gap years, checked
// against the ONE signal that works regardless of which year the lower bracket happens to sit at: a
// genuine retained lower bracket can legitimately live at an older year (2032-2034) without that
// implying anything about gap coverage either way (2.0 §Retained Bracket Excess), so the lower side
// can never answer this question on its own. The Upper Bracket year (maxGap+1, e.g. 2040) is fixed
// by tipsMarketData alone, never by holdings, so a genuine excess held there — the same findSpikes
// curve-fit before-state-lib.js's detectBracketFlags already uses for the Before-State Preview's
// Upper bracket flag — is the one unambiguous "this ladder means to bridge the gap" signal. No held
// excess at 2040 at all (including nothing held there) means no coverage intent, full stop.
//
// Ruling, 2026-09-30 (real account, McNeill Joint WROS): gap-year DARA used to be inferred from
// whatever held year was nearest, however far away, treating the structural gap as always needing
// funding. McNeill's ladder holds nothing from 2035 through 2047 — the nearest held years to the
// gap are 2034 and 2048, fourteen years apart — and extrapolating a slope across that hole produced
// nonsensical gap-year targets (one of them negative), which then fed the self-financing scale and
// inflated the entire ladder roughly 5x trying to fund a gap nobody intended to cover. See
// KNOWN_ISSUES.md and hasGapCoverageIntent's callers below.
export function hasGapCoverageIntent(holdings, tipsMarketData, refCPI, lastYear) {
  const gapYears = getGapYears(tipsMarketData);
  if (gapYears.length === 0) return false;
  const minGap = Math.min(...gapYears), maxGap = Math.max(...gapYears);
  if (lastYear < minGap) return false;
  const upperYear = maxGap + 1;
  const heldARAByYear = computePortfolioARAByYear(holdings, tipsMarketData, refCPI);
  if (!(upperYear in heldARAByYear)) return false; // nothing held at the upper bracket year at all
  const orderedYears = Object.keys(heldARAByYear).map(Number).sort((a, b) => a - b);
  const orderedValues = orderedYears.map(y => heldARAByYear[y]);
  const idx = orderedYears.indexOf(upperYear);
  if (orderedValues.length >= MIN_SHAPE_POINTS) {
    return findSpikes(orderedValues).some(s => s.index === idx);
  }
  const spanCount = orderedYears[orderedYears.length - 1] - orderedYears[0] + 1;
  const fairShare = evenSpread(orderedValues, spanCount);
  return fairShare != null && heldARAByYear[upperYear] > fairShare;
}

// Turn the raw ARA map into a per-year DARA map. Bracket-candidate years (adjacent to structural
// gaps) that stand out against the ladder's own shape are suppressed to that shape's value;
// non-bracket years keep full ARA. `gapYears` (structural gap years, 2037-2039) have no TIPS of
// their own, so their raw ARA is just the bare LMI dripping down from later bonds — nowhere near a
// real funding target. They take a value read off the same shape instead (3.0 §Per-Year DARA from
// Portfolio step 2, same mechanism the on-screen derived Per-Year DARA in index.html applies; shape-math.js,
// RETAINED_BRACKET_TODO.md rulings 1-2). Without this, a caller feeding this map straight into
// calculateGapParameters sizes the gap years' synthetic quantities off that tiny raw ARA instead
// of the intended target, collapsing the whole gap block's total cost and, with it, both
// brackets' excess.
//
// Below MIN_SHAPE_POINTS held points (excluding the gap years themselves, which have no point of
// their own to fit against) there's no shape to read at all — both the bracket-candidate check and
// the gap-year fill fall back to `evenSpread`: every known value's total, spread evenly across the
// assumed rung span (min to max year, inclusive — NOT just the count of held points), same as
// before this only ever used a single median (Task 2, 3.0 §Per-Year DARA from Portfolio). Two
// holdings bracketing a 3-year gap represent five rungs' worth of income between them, not two —
// dividing by the held-point count instead of the span is the same "borrowing" bug this whole
// feature replaces, one level removed. The bracket-candidate fallback keeps the original 1.5x
// margin (a separate, deliberately conservative constant from the shape replacement itself,
// unchanged here) so a low-data derived Per-Year DARA isn't more eager to auto-cap a rung than it was before.
export function derivePerYearDara(araByYear, bracketCandidates = new Set(), gapYears = new Set(), coverageIntent = true) {
  const entries = Object.entries(araByYear).map(([y, v]) => [parseInt(y, 10), v]);
  const positive = entries.filter(([, v]) => v > 0);
  if (positive.length === 0) return { median: 0, daraMap: new Map(), autoCappedYears: new Set() };
  const sortedVals = positive.map(([, v]) => v).sort((a, b) => a - b);
  const legacyMedian = sortedVals[Math.floor(sortedVals.length / 2)];

  const shapeEntries = positive.filter(([y]) => !gapYears.has(y)).sort((a, b) => a[0] - b[0]);
  const shapeYears = shapeEntries.map(([y]) => y);
  const shapeValues = shapeEntries.map(([, v]) => v);
  const allYears = entries.map(([y]) => y);
  const spanCount = allYears.length ? Math.max(...allYears) - Math.min(...allYears) + 1 : 0;
  const flatShare = evenSpread(shapeValues, spanCount) ?? legacyMedian;
  const enoughForShape = shapeValues.length >= MIN_SHAPE_POINTS;
  const spikeByYear = new Map();
  if (enoughForShape) {
    for (const s of findSpikes(shapeValues)) spikeByYear.set(shapeYears[s.index], s.curve);
  }

  const daraMap = new Map();
  const autoCappedYears = new Set();
  for (const [year, ara] of entries) {
    if (gapYears.has(year)) {
      // No genuine gap-coverage intent (hasGapCoverageIntent above): the gap is not being bridged,
      // so its rungs target 0 rather than a slope extrapolated across however large a holdings hole
      // sits next to it (Ruling, 2026-09-30, real account).
      const shaped = coverageIntent && enoughForShape ? inferShapeValue(shapeYears, shapeValues, year) : null;
      daraMap.set(year, coverageIntent ? Math.round(shaped ?? flatShare) : 0);
      autoCappedYears.add(year);
    } else if (bracketCandidates.has(year)) {
      const isExcess = enoughForShape ? spikeByYear.has(year) : ara > 1.5 * flatShare;
      if (isExcess) {
        daraMap.set(year, Math.round(enoughForShape ? spikeByYear.get(year) : flatShare));
        autoCappedYears.add(year);
      } else {
        daraMap.set(year, Math.round(ara));
      }
    } else {
      daraMap.set(year, Math.round(ara));
    }
  }
  return { median: Math.round(legacyMedian), daraMap, autoCappedYears };
}

// Parse the optional `#fundedYear,dara` metadata block appended to our own export files
// (4.2.2 Parse DARA plan and parameters). Returns Map<year, dara> — the durable build intent for EVERY year
// in [firstYear, lastYear], incl. gap + future-30Y — or null if absent. When present, the
// import honors it directly (exact round-trip, no DARA/last-year inference). Backward-compatible:
// the holdings parsers skip these lines (they aren't valid CUSIP rows). Uses the same
// quote-aware line splitter as broker-import.js so amount fields survive a round-trip through
// a spreadsheet (quoted thousands separators, currency symbols).
export function parseFundedYearDaraBlock(rawLines) {
  const map = new Map();
  let inBlock = false;
  for (const line of rawLines) {
    const norm = line.replace(/\s/g, '').toLowerCase();
    if (!inBlock) { if (norm === '#fundedyear,dara') inBlock = true; continue; }
    const parts = parseCSVLine(line.replace(/^#/, ''));
    const yr = parseInt(parts[0], 10), v = parseFloat((parts[1] || '').replace(/[^0-9.-]/g, ''));
    if (parts.length >= 2 && yr >= 2000 && yr <= 2200 && !isNaN(v) && v >= 0) map.set(yr, v);
  }
  return map.size > 0 ? map : null;
}

// Parse the `#params,key=value,...` line our exports append next to the DARA block. Carries the
// construction parameters that per-year DARA does NOT encode but that still change the target
// ladder — chiefly `preLadderInterest` (PLI zeroes early rungs), `maturityPref` (which bond
// per year), and `couponPref` (which issue wins a same-month two-issue tie). On import these set
// the UI controls so a round-trip reconstructs exactly; the user may then override them (see
// 4.2.2 Parse DARA plan and parameters). Returns null when absent (broker/legacy files).
export function parseParamsBlock(rawLines) {
  for (const line of rawLines) {
    const norm = line.replace(/\s/g, '').toLowerCase();
    if (!norm.startsWith('#params,')) continue;
    const out = {};
    for (const kv of line.replace(/^#?params,?/i, '').split(',')) {
      const [k, v] = kv.split('=').map(s => s.trim());
      if (!k) continue;
      if (/^preladderinterest$/i.test(k)) out.preLadderInterest = /^(true|1|yes|on)$/i.test(v);
      else if (/^maturitypref$/i.test(k)) out.maturityPref = /^(first|semiannual|all)$/i.test(v) ? v.toLowerCase() : 'last';
      else if (/^couponpref$/i.test(k)) out.couponPref = /^lower$/i.test(v) ? 'lower' : 'higher';
      // `rmdCashOverride` is the superseded key for the same figure, read as an alias so files
      // written before Available Cash went ladder-wide keep working (4.2.2 Parse DARA plan and parameters).
      else if (/^(availablecash|rmdcashoverride)$/i.test(k)) { const n = parseFloat(v); if (!isNaN(n) && n >= 0) out.availableCash = n; }
      else if (/^rmdcouponmode$/i.test(k)) out.rmdCouponMode = /^(none|last)$/i.test(v) ? v.toLowerCase() : 'all';
      // The Ref CPI date the file's DARA values are denominated at (3.0 §DARA Reference Date).
      else if (/^refcpidate$/i.test(k)) { if (/^\d{4}-\d{2}-\d{2}$/.test(v)) out.refCpiDate = v; }
    }
    return Object.keys(out).length > 0 ? out : null;
  }
  return null;
}

// BEST-EFFORT per-year DARA recovery for files that carry NO explicit DARA (broker imports,
// legacy Format-5 exports, tipsladder Format-4). Our own current exports carry an explicit
// `#fundedYear,dara` block (see 2.1 Export) and bypass this entirely — for those the
// round-trip is exact by construction. This path only estimates a self-financing per-year
// DARA from the held quantities, which is inherently lossy where build hid the DARA (e.g.
// PLI-zeroed years) — hence "best effort".
//
// Recover per-year ARA, correct the income build credits (the gap bracket excess's own coupon and
// the Future 30Y interest, below), then PROPORTIONALLY scale the whole map to
// the self-financing level — preserving any genuine per-year shape (user-edited DARA) rather
// than flattening it. preLadderInterest must match the run (the PLI pool shifts the equilibrium).
// `scopeYears` (Set<year>) + `fixedDaraByYear` (Map) make this a SEGMENT-scoped solve (see 3.0 §
// Two-Segment DARA): only in-scope years are scaled by the searched factor; out-of-scope years take
// their value from `fixedDaraByYear` (the other segment's already-decided DARA — the cascade
// boundary); and the self-finance metric becomes the cost delta summed over in-scope funded years
// only, not the whole portfolio. Both default null → identical whole-portfolio behaviour as before.
// `flat = true` makes the in-scope solve target a SINGLE flat DARA across every in-scope rung
// (even real income — the liability-matching use case) instead of the proportionally-scaled
// natural-ARA shape; the binary search then finds the one flat level that self-finances the segment.
export function inferScaledDARAFromPortfolio({ daraMap, median: _median, holdings: holdingsRaw, tipsMarketData, refCPI, settlementDate, bracketMode = '2bracket', lastYearOverride = null, firstYearOverride = null, preLadderInterest = false, scopeYears = null, fixedDaraByYear = null, pinnedDaraByYear = null, flat = false, bondHolidays = new Set(), availableCash = 0, rmdCouponMode = 'all', tradeDate = settlementDate, maturityPref = 'last', allocationPolicy = 'equal', yearRankOverrides = null, yearOverrides = null, correctCoverIncome = true }) {
  // Cover-year income correction (skipped when the map is already a stated per-year plan rather
  // than one recovered from holdings — `correctCoverIncome: false`; the plan states each year's
  // true DARA, so adding these terms to it would count that income twice):
  // build's per-year DARA identity is
  //   DARA_y = (P+I)_y + LMI_y + sameMaturityExcessInterest_y + simulated_y + coverExcess_y + netCash_y
  // but computePortfolioARAByYear recovers only (P+I)+LMI, and its LMI carries the held Cover
  // Excess coupon down to every earlier year at a full year's coupon. Take that out, and add back the
  // interest of the Simulated Outstanding Future 10Y and Future 30Y TIPS, of the Excess TIPS and the Cover Excess and the Net Cash the holdings
  // imply (impliedGapInterest, impliedFuture30yInterest; 3.0 §DARA inference with Future 30Y years); a bracket or cover year's
  // Same-Maturity Excess Interest is 0.
  let maxTipsYear = 0;
  for (const bond of tipsMarketData.values()) if (bond.maturity) maxTipsYear = Math.max(maxTipsYear, bond.maturity.getFullYear());
  const _lastY = (lastYearOverride != null && !isNaN(lastYearOverride)) ? lastYearOverride : maxTipsYear;
  const _covers = _lastY > maxTipsYear ? selectFuture30yCovers({ tipsMarketData, settlementDate }) : null;
  const _coverCusips = new Set([_covers?.lowerCoverBond?.cusip, _covers?.upperCoverBond?.cusip].filter(Boolean));

  const _firstY = (firstYearOverride != null && !isNaN(firstYearOverride)) ? firstYearOverride
    : Math.min(...holdingsRaw.map(h => tipsMarketData.get(h.cusip)?.maturity?.getFullYear()).filter(y => y != null));
  const _impliedGap = impliedGapInterest({ holdings: holdingsRaw, tipsMarketData, refCPI, settlementDate, firstYear: _firstY, lastYear: _lastY, bondHolidays, rmdCouponMode, tradeDate });
  const _gapLegCusips = new Set(_impliedGap ? [_impliedGap.lowerBracketBond.cusip, _impliedGap.upperBracketBond.cusip, ..._impliedGap.retained.map(r => r.bond.cusip)] : []);
  const ownExcessCoupon = {};
  const coverExcessCoupon = [];   // { year, annual } per held Cover Excess or gap Excess TIPS position (sold before it matures)
  for (const h of holdingsRaw) {
    const ex = h.excessQty ?? 0;
    if (ex <= 0) continue;
    const bond = tipsMarketData.get(h.cusip);
    if (!bond?.maturity) continue;
    const ir = calcIndexRatio(refCPI, bond.datedDateRefCpi ?? refCPI);
    const yr = bond.maturity.getFullYear();
    const annual = ex * 1000 * ir * (bond.coupon ?? 0);
    if (_coverCusips.has(h.cusip) || _gapLegCusips.has(h.cusip)) coverExcessCoupon.push({ year: yr, annual });
    else ownExcessCoupon[yr] = (ownExcessCoupon[yr] ?? 0) + annual;
  }
  const _implied = _covers
    ? impliedFuture30yInterest({ holdings: holdingsRaw, tipsMarketData, refCPI, settlementDate, lastYear: _lastY, bondHolidays, rmdCouponMode, tradeDate })
    : null;
  const _correction = (y) => (ownExcessCoupon[y] ?? 0)
    - coverExcessCoupon.reduce((s, c) => c.year > y ? s + c.annual : s, 0)
    + (_implied?.simulated.get(y) ?? 0) + (_implied?.cover.get(y) ?? 0) + (_implied?.netCash.get(y) ?? 0)
    + (_impliedGap?.simulated.get(y) ?? 0) + (_impliedGap?.excess.get(y) ?? 0) + (_impliedGap?.netCash.get(y) ?? 0);

  if (correctCoverIncome) daraMap = new Map([...daraMap.entries()].map(([y, v]) => [y, v + _correction(y)]));
  const inScope = scopeYears ? (y => scopeYears.has(y)) : (() => true);

  // Cash-scope: like inScope, but ALSO claims trade rows whose year sits beyond the ladder's own
  // lastYear — e.g. the upper gap bracket (2040) when lastYear lands inside the structural gap
  // (3.0 §lastYear as a Gap Year), which produces a trade with no daraByYear target of its own
  // (buildMap never assigns it `level`, so it must stay out of `inScope`) but whose cash delta
  // still has to land in SOME segment's self-finance metric, or the search silently ignores it and
  // converges on a DARA that leaves the reported whole-portfolio net cash far from zero. Attributed
  // to whichever segment reaches the top of the range — mirrors the documented rule that the
  // speculative cover pair / Future-30Y excess belongs to the speculative segment.
  const topYear = scopeYears ? (lastYearOverride ?? Math.max(...scopeYears)) : null;
  const inCashScope = scopeYears
    ? (y => scopeYears.has(y) || (y > topYear && scopeYears.has(topYear)))
    : (() => true);

  // A year the user has hand-typed a value into (`pinnedDaraByYear`) is held at that value even
  // though it sits inside this segment's scope — the segment-flat solve sweeps only the remaining,
  // non-pinned years to find its self-financing level. The pinned year's real cash flow still counts
  // toward the segment's net-cash target (inCashScope/netCash below stay keyed off the full
  // scopeYears), it just isn't itself a candidate for restamping.
  const isPinned = pinnedDaraByYear ? (y => pinnedDaraByYear.has(y)) : (() => false);
  const sweepable = y => inScope(y) && !isPinned(y);

  // Scaling pivots on the IN-SCOPE, non-pinned natural-ARA median, so the returned scaledMedian is
  // the segment's own median over the years it actually solves for (the whole-portfolio median when
  // unscoped and nothing is pinned). Genuinely HELD years only — a year with no TIPS of its own
  // (the LMI trickling down from later holdings, or a gap year with no coverage intent) is not a
  // real rung and must not be allowed to drag the median down: for a ladder with a long holdings-free
  // stretch, those near-zero entries can outnumber the real funded years, and the search's own
  // `lo = 1000` floor then forces a multiplier far above 1x even when the ladder was already close to
  // self-financing (Ruling, 2026-09-30, real account — see hasGapCoverageIntent above).
  const heldYears = new Set();
  for (const h of holdingsRaw) { const b = tipsMarketData.get(h.cusip); if (b?.maturity) heldYears.add(b.maturity.getFullYear()); }
  const _vals = [...daraMap.entries()].filter(([y, v]) => sweepable(y) && v > 0 && heldYears.has(y)).map(([, v]) => v).sort((a, b) => a - b);
  const median = _median ?? (_vals.length > 0 ? _vals[Math.floor(_vals.length / 2)] : 0);

  // daraByYear fed to each trial at DARA `level`: sweepable years take `level` flat (flat mode) or
  // the natural ARA scaled by level/median; pinned years keep their fixed value; out-of-scope years
  // take the other segment's fixed DARA (else their own natural ARA, so fixed=null ≡ whole-portfolio).
  const buildMap = level => {
    const k = median > 0 ? level / median : 1;
    const m = new Map();
    for (const [y, v] of daraMap) {
      if (sweepable(y)) m.set(y, flat ? level : Math.round(v * k));
      else if (isPinned(y)) m.set(y, pinnedDaraByYear.get(y));
      else m.set(y, fixedDaraByYear?.get(y) ?? Math.round(v));
    }
    if (fixedDaraByYear) for (const [y, v] of fixedDaraByYear) if (!sweepable(y) && !isPinned(y) && !m.has(y)) m.set(y, v);
    if (pinnedDaraByYear) for (const [y, v] of pinnedDaraByYear) if (!m.has(y)) m.set(y, v);
    return m;
  };

  // Self-finance metric: whole costDeltaSum, or — when scoped — cost delta summed over rebalance
  // rows whose funded year is in cash-scope (results[i][11] ↔ details[i].fundedYear, kept index-parallel).
  const netCash = ({ results, details, summary }) => {
    if (!scopeYears) return summary.costDeltaSum;
    let s = 0;
    for (let i = 0; i < results.length; i++) {
      const cd = results[i][11];
      if (inCashScope(details[i]?.fundedYear) && typeof cd === 'number') s += cd;
    }
    return s;
  };

  // Every trial below runs the ladder the CALLER will execute — same maturity preference, same
  // within-year allocation policy, same per-year overrides (3.0 §Target CUSIP resolution). Those
  // choices decide which CUSIP each year buys and therefore what each trade costs, so a search run
  // under the defaults solves for a ladder the caller never builds: the level it returns can be
  // self-financing under 'equal'/'last' and still land thousands of dollars short once executed
  // under the user's actual settings.
  //
  // Binary-search the DARA level at which the per-year map (flat or proportional) is self-financing.
  // A trial may be INFEASIBLE: pushing this segment's DARA high floods later-maturity interest into a
  // downstream (out-of-scope) year until it can't fund one bond → sizeLadder throws (err.daraTooLowYear).
  // Such a throw means this segment's DARA is too high → search lower. A throw on an IN-SCOPE year means
  // this segment's own DARA is too low → search higher. (Without scoping every year is in scope.)
  let lo = 1000, hi = 1000000, foundDARA = lo;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    let result;
    try {
      result = runRebalance({ dara: mid, bracketMode, holdings: holdingsRaw, tipsMarketData, refCPI, settlementDate, daraByYear: buildMap(mid), lastYearOverride, firstYearOverride, preLadderInterest, bondHolidays, availableCash, rmdCouponMode, tradeDate, maturityPref, allocationPolicy, yearRankOverrides, yearOverrides });
    } catch (e) {
      if (e && e.daraTooLowYear != null && sweepable(e.daraTooLowYear)) lo = mid + 1;
      else hi = mid - 1;
      continue;
    }
    if (netCash(result) >= 0) { foundDARA = mid; lo = mid + 1; } else { hi = mid - 1; }
  }
  const scaledMap = buildMap(foundDARA);
  // In-scope gap / future-30Y years have no natural-ARA row — pin them to the segment median
  // (mirrors the scalar fallback runRebalance used for them during the search).
  if (scopeYears) for (const y of scopeYears) if (!scaledMap.has(y)) scaledMap.set(y, foundDARA);
  return { scaledMedian: foundDARA, scaledMap };
}

export function runRebalance({ dara, bracketMode = '2bracket', holdings: holdingsRaw, tipsMarketData, refCPI, settlementDate, daraByYear = null, lastYearOverride = null, preLadderInterest = false, firstYearOverride = null, maturityPref = 'last', allocationPolicy = 'equal', yearRankOverrides = null, yearOverrides = null, bondHolidays = new Set(), availableCash = 0, rmdCouponMode = 'all', tradeDate = settlementDate }) {
  const settleDateStr  = toDateStr(settlementDate);
  const settleDateDisp = fmtDate(settlementDate);

  const holdings = [];
  for (const h of holdingsRaw) {
    const bond = tipsMarketData.get(h.cusip);
    if (!bond) continue;
    holdings.push({
      cusip:     h.cusip,
      qty:       h.qty,
      excessQty: h.excessQty,
      maturity:  bond.maturity,
      year:      bond.maturity.getFullYear(),
    });
  }
  holdings.sort((a, b) => a.maturity - b.maturity);

  // Consolidate multiple holdings with same CUSIP/year from different accounts
  const consolidatedMap = new Map();
  for (const h of holdings) {
    const key = h.cusip + '|' + h.year;
    if (consolidatedMap.has(key)) {
      const existing = consolidatedMap.get(key);
      existing.qty += h.qty;
    } else {
      consolidatedMap.set(key, { ...h });
    }
  }
  const consolidatedHoldings = Array.from(consolidatedMap.values()).sort((a, b) => a.maturity - b.maturity);

  const yearInfo = {};
  consolidatedHoldings.forEach((h, idx) => {
    if (!yearInfo[h.year]) yearInfo[h.year] = { firstIdx: idx, lastIdx: idx, holdings: [] };
    yearInfo[h.year].lastIdx = idx;
    yearInfo[h.year].holdings.push(h);
  });

  const holdingsYears = Object.keys(yearInfo).map(Number).sort((a, b) => a - b);
  const derivedFirstYear = holdingsYears[0];
  let firstYear = holdingsYears[0];
  const derivedLastYear = holdingsYears[holdingsYears.length - 1];  // save before override for sell-above-lastYear logic
  let lastYear = derivedLastYear;
  if (lastYearOverride != null && !isNaN(lastYearOverride)) lastYear = lastYearOverride;
  else {
    // No explicit last year: the latest maturity year held can't see Future-30Y rungs, which live
    // as Cover Excess at the cover pair. Infer lastYear from that excess (symmetric to firstYear
    // inference from gap-bracket excess) so the round-trip preserves the future cover excess
    // instead of selling it to DARA.
    const inferredLast = inferLastYearFromHoldings({ holdings: holdingsRaw, tipsMarketData, refCPI, settlementDate, bondHolidays });
    if (inferredLast != null && inferredLast > lastYear) lastYear = inferredLast;
  }
  if (firstYearOverride != null && !isNaN(firstYearOverride)) firstYear = firstYearOverride;

  const tipsMapYears = new Set();
  let maxTipsYear = 0;
  for (const bond of tipsMarketData.values()) {
    if (bond.maturity) {
      tipsMapYears.add(bond.maturity.getFullYear());
      maxTipsYear = Math.max(maxTipsYear, bond.maturity.getFullYear());
    }
  }
  // The gap years from the first year up (getGapYears, DD Gap Years).
  const structuralGapSet = new Set(getGapYears(tipsMarketData).filter(y => y >= firstYear));
  const gapYears = [], future30yYears = [];
  for (let year = firstYear; year <= lastYear; year++) {
    if (structuralGapSet.has(year) && !yearInfo[year]) {
      gapYears.push(year);
    } else if (!tipsMapYears.has(year) && !yearInfo[year] && year > maxTipsYear) {
      future30yYears.push(year);
    }
  }

  // Rebalance respects existing holes: an in-range year the user holds none of is an INTENTIONAL
  // empty rung. Its per-year target is honored as-is (so an explicitly raised DARA — e.g. from Infer
  // LMP — still fills it), but sizeLadder's "fund at least one bond" validation is WAIVED for it: an
  // empty year whose target rounds to 0 is a hole, not a too-low-DARA error. This is the knife-edge
  // that the derived Per-Year DARA sits on (an empty year's stub DARA ≈ its own incoming LMI). Computed for
  // every unheld year regardless of whether the ladder also has a gap/Future-30Y block elsewhere —
  // an unheld year is either a gap/future30y year itself (excluded from this preliminary sweep's
  // rangeYears already, since a structural gap has no candidate TIPS to build a rung from) or an
  // ordinary unheld interior/bracket-candidate year with no bracket role of its own (identifyBrackets
  // runs later and, when it does pick one, replaces this preliminary figure entirely — the waiver only
  // stops THIS early pass from throwing on a target that legitimately computes to zero). A gap/Future
  // block present does not mean every unheld year is "owned" by the bracket machinery — only the
  // specific year(s) identifyBrackets actually flags are. 3.0 §Per-Year DARA from Portfolio / §Funding.
  const _heldYearSet = new Set(holdingsYears);
  const optionalRungYears = new Set();
  for (let year = firstYear; year <= lastYear; year++) {
    if (!_heldYearSet.has(year)) optionalRungYears.add(year);
  }

  const araLaterMaturityInterestByYear = {};
  // Remaining-coupon-only counterpart of the map above, used only when reading INTO the funded
  // year that contains settlementDate: that year is already partway through its calendar year,
  // so coupons already paid by its LMI-donor holdings are no longer forthcoming cash for it.
  // Every other year is entirely in the future and keeps the full-annual figure. 3.0 §Per-Year DARA.
  const araLaterMaturityInterestRemainingByYear = {};
  const araByYear = {};
  const allYearsSorted = Object.keys(yearInfo).map(Number).sort((a, b) => b - a);
  const _settlementYearForARA = settlementDate.getFullYear();

  // RMD Options 'last' mode: the pool-wide latest remaining coupon date, over every CURRENTLY HELD
  // bond above the settlement year — the "Before" state's own pool (ladder-core.js
  // latestRemainingCouponDate; sizeLadder computes an analogous pool for "After").
  const _rmdLastDateBefore = rmdCouponMode === 'last'
    ? latestRemainingCouponDate(
        allYearsSorted.filter(y => y > _settlementYearForARA).flatMap(y => yearInfo[y].holdings.map(h => h.maturity)),
        settlementDate, bondHolidays, tradeDate,
      )
    : null;

  for (const year of allYearsSorted) {
    let laterMatInt = 0;
    const useRemaining = year === _settlementYearForARA;
    for (const y in araLaterMaturityInterestByYear) {
      if (parseInt(y) > year) laterMatInt += useRemaining ? araLaterMaturityInterestRemainingByYear[y] : araLaterMaturityInterestByYear[y];
    }
    let yearPrincipal = 0, yearLastYearInterest = 0;
    araLaterMaturityInterestByYear[year] = 0;
    araLaterMaturityInterestRemainingByYear[year] = 0;
    for (const holding of yearInfo[year].holdings) {
      const b = tipsMarketData.get(holding.cusip);
      const cp = b?.coupon ?? 0;
      const bc = b?.datedDateRefCpi ?? refCPI;
      const ir = calcIndexRatio(refCPI, bc);
      const ap = 1000 * ir;
      const mF = holding.maturity.getMonth() + 1;
      const lastYI = mF < 7 ? (ap * cp * 0.5) : (ap * cp * 1.0);
      yearPrincipal += holding.qty * ap;
      yearLastYearInterest += holding.qty * lastYI;
      araLaterMaturityInterestByYear[year] += holding.qty * ap * cp;
      araLaterMaturityInterestRemainingByYear[year] += holding.qty * ap * cp / 2 * rmdCappedRemainingCoupons(holding.maturity, settlementDate, bondHolidays, rmdCouponMode, tradeDate, _rmdLastDateBefore);
    }
    araByYear[year] = yearPrincipal + yearLastYearInterest + laterMatInt;
  }

  // Available Cash credits the Before state the way it credits the target: earliest funded year
  // first, spilling up as each year's shortfall is covered (2.0 §Available Cash). The superseded
  // settlement-year-only override is the special case where the figure never exceeds that year's
  // own shortfall. Funded years only — gap years get their ARA below, from bracket coverage.
  const availableCashCreditBefore = {};
  if (availableCash > 0) {
    let remainingBefore = availableCash;
    for (let y = firstYear; y <= lastYear && remainingBefore > 0; y++) {
      if (araByYear[y] == null) continue;
      const shortfall = Math.max(0, (daraByYear?.get(y) ?? DARA) - araByYear[y]);
      const take = Math.min(remainingBefore, shortfall);
      if (take > 0) { availableCashCreditBefore[y] = take; araByYear[y] += take; remainingBefore -= take; }
    }
  }

  for (const gapYear of gapYears) {
    let laterMatInt = 0;
    for (const y in araLaterMaturityInterestByYear) {
      if (parseInt(y) > gapYear) laterMatInt += araLaterMaturityInterestByYear[y];
    }
    araByYear[gapYear] = laterMatInt;
  }

  // inferredDARA: median of all defined araByYear values in [firstYear, lastYear].
  // Bracket years (excess holdings included) skew high; gap years (LMI only) skew low;
  // future30y years are undefined. The median falls on a funded year where total
  // holdings = FY holdings, so araByYear ≈ DARA.
  const _medianOf = (vals) => {
    const sorted = [...vals].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length === 0 ? 0 : sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  };
  const definedARAValues = [];
  for (let year = firstYear; year <= lastYear; year++) {
    if (araByYear[year] !== undefined) definedARAValues.push(araByYear[year]);
  }
  const medianARA = _medianOf(definedARAValues);
  const rungCount    = lastYear - firstYear + 1;
  // Provisional inference; corrected below when the holdings carry Cover Excess.
  let inferredDARA = medianARA;
  let DARA           = dara !== null ? dara : inferredDARA;
  const settlementYear = settlementDate.getFullYear();

  // ── Future 30Y cover pair, chosen by rule from market data (2.0 §Future 30Y Cover Pair).
  let future30yLowerYear = null, future30yUpperYear = null;
  let future30yLowerCoverBond = null, future30yUpperCoverBond = null;
  if (future30yYears.length > 0) {
    const covers = selectFuture30yCovers({ tipsMarketData, settlementDate });
    future30yLowerCoverBond = covers?.lowerCoverBond ?? null;
    future30yUpperCoverBond = covers?.upperCoverBond ?? null;
    if (!future30yLowerCoverBond) throw new Error('No outstanding TIPS found for the Future 30Y lower cover');
    if (!future30yUpperCoverBond) throw new Error('No outstanding TIPS found for the Future 30Y upper cover');
    future30yLowerYear = future30yLowerCoverBond.maturity.getFullYear();
    future30yUpperYear = future30yUpperCoverBond.maturity.getFullYear();
  }

  // ── DARA inference with Future 30Y years (3.0 §DARA inference with Future 30Y years) ──────────
  // The provisional median is P+I + LMI from the holdings, and that LMI carries the held Cover Excess
  // coupon into every earlier year at a full year's coupon. A funded year's Amount instead takes the
  // Cover Excess coupons as the Future 30Y rebalances pay them, plus the coupons of the Simulated
  // Outstanding Future 30Y TIPS, whose quantities the held Cover Excess implies, and the Net Cash. Only the dara===null
  // path; a holder with no stated Cover Excess has no Future 30Y years to imply.
  const heldImplied = future30yYears.length > 0
    ? impliedFuture30yInterest({ holdings: holdingsRaw, tipsMarketData, refCPI, settlementDate, lastYear, bondHolidays, rmdCouponMode, tradeDate, rmdLastDate: _rmdLastDateBefore })
    : null;
  // The same for the gap years: the Simulated Outstanding Future 10Y TIPS, the Excess TIPS and the Net Cash.
  const heldImpliedGap = gapYears.length > 0
    ? impliedGapInterest({ holdings: holdingsRaw, tipsMarketData, refCPI, settlementDate, firstYear, lastYear, bondHolidays, rmdCouponMode, tradeDate, rmdLastDate: _rmdLastDateBefore })
    : null;
  if (dara === null && (heldImplied || heldImpliedGap)) {
    const coverHeld = [
      ...(heldImplied ? [[future30yLowerCoverBond, heldImplied.lowerQty0], [future30yUpperCoverBond, heldImplied.upperQty0]] : []),
      ...(heldImpliedGap ? [[heldImpliedGap.lowerBracketBond, heldImpliedGap.lowerQty0], [heldImpliedGap.upperBracketBond, heldImpliedGap.upperQty0], ...heldImpliedGap.retained.map(r => [r.bond, r.qty0])] : []),
    ]
      .filter(([b, q]) => b && q > 0)
      .map(([b, q]) => ({ year: b.maturity.getFullYear(), bond: b, perCoupon: q * 1000 * calcIndexRatio(refCPI, b.datedDateRefCpi ?? refCPI) * (b.coupon ?? 0) / 2 }));
    const cascaded = (year) => coverHeld.reduce((s, c) => c.year <= year ? s
      : s + c.perCoupon * (year === _settlementYearForARA
        ? rmdCappedRemainingCoupons(c.bond.maturity, settlementDate, bondHolidays, rmdCouponMode, tradeDate, _rmdLastDateBefore)
        : 2), 0);
    const amounts = [];
    for (let year = firstYear; year <= lastYear; year++) {
      if (araByYear[year] === undefined) continue;
      amounts.push(araByYear[year] - cascaded(year)
        + (heldImplied?.simulated.get(year) ?? 0) + (heldImplied?.cover.get(year) ?? 0) + (heldImplied?.netCash.get(year) ?? 0)
        + (heldImpliedGap?.simulated.get(year) ?? 0) + (heldImpliedGap?.excess.get(year) ?? 0) + (heldImpliedGap?.netCash.get(year) ?? 0));
    }
    if (amounts.length) { inferredDARA = _medianOf(amounts); DARA = inferredDARA; }
  }

  // ── Canonical sizing via shared sizeLadder (single source of truth) ───────────
  // Build and rebalance run the IDENTICAL sizing pipeline. We derive the canonical
  // bond set for [firstYear, lastYear] and call sizeLadder to obtain the pre-ladder
  // interest distribution (zeroing + partial credit), gap parameters, and the Future 30Y
  // rebalances. Rebalance's diff machinery below targets these canonical values, so a
  // build→rebalance round-trip produces zero trades.
  const _canon = selectLadderBonds({ tipsMarketData, firstYear, lastYear, settlementDate, maturityPref, yearOverrides });
  const _slArgs = {
    dara: DARA, daraByYear, firstYear, lastYear, optionalYears: optionalRungYears,
    rangeYears: _canon.rangeYears, gapYears: _canon.gapYears, future30yYears: _canon.future30yYears,
    yearBondMap: _canon.yearBondMap, yearTipsListMap: _canon.yearTipsListMap, tipsMarketData, refCPI, settlementDate, settlementYear,
    preLadderInterest, bondHolidays, availableCash, rmdCouponMode, tradeDate,
    future30yLowerCoverBond: _canon.future30yLowerCoverBond, future30yUpperCoverBond: _canon.future30yUpperCoverBond,
    future30yLowerYear: _canon.future30yLowerYear, future30yUpperYear: _canon.future30yUpperYear,
    future30yAnchorBond: _canon.future30yAnchorBond,
  };
  const _sl = sizeLadder(_slArgs);
  const zeroedFundedYears   = _sl.zeroedFundedYears;
  const pliCreditByFundedYear = _sl.pliCreditByFundedYear;
  const pliCreditByGapYear  = _sl.pliCreditByGapYear;
  const partialCreditYear   = _sl.partialCreditYear;
  const partialCredit       = _sl.partialCredit;
  const cashCreditByFundedYear = _sl.cashCreditByFundedYear ?? {};
  const creditByFundedYear  = _sl.creditByFundedYear ?? {};
  const preLadderPool       = _sl.preLadderPool;
  const preLadderCouponPool = _sl.preLadderCouponPool;
  const preLadderFuture30yPool = _sl.preLadderFuture30yPool;
  const preLadderNetCashPool = _sl.preLadderNetCashPool;
  const {
    future30yParams, future30yLowerDuration, future30yUpperDuration,
    future30yLowerWeight, future30yUpperWeight, future30yLowerExQty, future30yUpperExQty,
    future30yFellBack, future30yCoverReason, future30yLowerMonth, future30yUpperMonth,
  } = _sl;
  // The interest of the Simulated Outstanding Future 30Y TIPS and of the Cover Excess, and the Net
  // Cash, credited to each funded year in the After state (the same figures a build credits).
  const future30ySimulatedInterestByYear = _sl.future30ySimulatedInterestByYear ?? new Map();
  const future30yCoverInterestByYear = _sl.future30yCoverInterestByYear ?? new Map();
  const future30yNetCashByYear = _sl.future30yNetCashByYear ?? new Map();
  const future30yCreditAfter = (year) => (year >= firstYear && year <= lastYear)
    ? (future30ySimulatedInterestByYear.get(year) ?? 0) + (future30yCoverInterestByYear.get(year) ?? 0) + (future30yNetCashByYear.get(year) ?? 0) : 0;
  // The same three amounts for the gap years (2.0 §Gap Year Simulated Outstanding TIPS §Interest credited
  // to a funded year): the interest of the Simulated Outstanding Future 10Y TIPS, the interest of the
  // Excess TIPS and the Net Cash, credited to each funded year before the first gap year.
  // (let: with Retained Bracket Excess held, the gap amounts are worked out again once the retained
  // maturities are known, below.)
  let gapSimulatedInterestByYear = _sl.gapSimulatedInterestByYear ?? new Map();
  let gapExcessInterestByYear = _sl.gapExcessInterestByYear ?? new Map();
  let gapNetCashByYear = _sl.gapNetCashByYear ?? new Map();
  let preLadderGapPool = _sl.preLadderGapPool ?? 0;
  let gapRebalancesAfter = _sl.gapRebalances;
  const gapCreditAfter = (year) => (year >= firstYear && year <= lastYear)
    ? (gapSimulatedInterestByYear.get(year) ?? 0) + (gapExcessInterestByYear.get(year) ?? 0) + (gapNetCashByYear.get(year) ?? 0) : 0;
  const creditAfter = (year) => future30yCreditAfter(year) + gapCreditAfter(year);

  // Neither the Excess TIPS nor the Cover Excess pays interest in a gap year, so the LMI above the gap
  // years is that of the actual TIPS alone (2.0 §Gap Year Simulated Outstanding TIPS).
  const gapParams = calculateGapParameters(gapYears, settlementDate, refCPI, tipsMarketData, DARA, holdings, lastYear, pliCreditByGapYear, daraByYear, zeroedFundedYears);

  const minGapYear = gapYears.length > 0 ? Math.min(...gapYears) : Infinity;
  const brackets  = identifyBrackets(gapYears, holdings, yearInfo, tipsMarketData, araByYear, DARA, firstYear);

  // 2-bracket: lower bracket is always the canonical tipsMarketData lower (latest-maturing TIPS below
  // minGapYear). identifyBrackets may return an older year found via excess-ARA.
  // Override it so bracketYearSet uses the active lower bracket; the old year falls into rebalYearSet (Full mode
  // rebuilds it to funded-year qty only, selling any excess).
  if (bracketMode === '2bracket' && gapYears.length > 0) {
    let canonCUSIP = null, canonYear = null, canonMaturity = null;
    for (const bond of tipsMarketData.values()) {
      if (!bond.maturity || !bond.yield) continue;
      const yr = bond.maturity.getFullYear();
      if (yr < minGapYear && (!canonMaturity || bond.maturity > canonMaturity)) {
        canonCUSIP = bond.cusip; canonYear = yr; canonMaturity = bond.maturity;
      }
    }
    if (canonCUSIP) {
      brackets.lowerCUSIP = canonCUSIP; brackets.lowerYear = canonYear; brackets.lowerMaturity = canonMaturity;
    }
  }

  const lowerBond = brackets.lowerCUSIP ? tipsMarketData.get(brackets.lowerCUSIP) : null;
  const upperBond = brackets.upperCUSIP ? tipsMarketData.get(brackets.upperCUSIP) : null;
  const lowerDuration = brackets.lowerMaturity ? calculateMDuration(settlementDate, brackets.lowerMaturity, lowerBond?.coupon ?? 0, lowerBond?.yield ?? 0) : 0;
  const upperDuration = brackets.upperMaturity ? calculateMDuration(settlementDate, brackets.upperMaturity, upperBond?.coupon ?? 0, upperBond?.yield ?? 0) : 0;
  // Multi-bracket ("Retain lower bracket excess" on, 2.0 §Retained Bracket Excess) always resolves
  // the canonical Active Lower Bracket (latest-maturing TIPS below minGapYear) independently of
  // identifyBrackets's own pick. The two coincide unless a genuinely older, cross-year retained
  // maturity is also held (2.0 §632, §666): whether they coincide governs only `crossYearRetained`
  // below, never whether Multi-bracket runs at all — a same-maturity-year retained TIPS (DD §Bracket
  // Year TIPS: a bracket year may hold a January and a July maturity) is a second, independent
  // retained pattern that has nothing to do with cross-year retention (see §sameYearRetained below).
  let is3Bracket = (bracketMode === '3bracket') && brackets.lowerCUSIP != null;
  let newLowerYear = null, newLowerCUSIP = null, newLowerMaturity = null, newLowerDuration = 0;
  let crossYearRetained = false;
  if (is3Bracket && gapYears.length > 0) {
    // Active Lower Bracket = latest-maturing TIPS strictly below minGapYear. minGapYear−1 may itself
    // be a gap year (e.g. firstYear=2038 → minGapYear=2038 → 2037 has no TIPS), so walk tipsMarketData for
    // the longest-dated maturity < minGapYear, same as anchorBefore in calculateGapParameters.
    for (const [_cusip, _bond] of tipsMarketData.entries()) {
      if (!_bond.maturity || !_bond.yield) continue;
      const _yr = _bond.maturity.getFullYear();
      if (_yr < minGapYear) {
        if (!newLowerMaturity || _bond.maturity > newLowerMaturity) {
          newLowerCUSIP = _cusip; newLowerMaturity = _bond.maturity; newLowerYear = _yr;
        }
      }
    }
    if (!newLowerCUSIP) throw new Error('Multi-bracket: no outstanding TIPS found before gap year ' + minGapYear);
    const _nlBond = tipsMarketData.get(newLowerCUSIP);
    newLowerDuration = calculateMDuration(settlementDate, newLowerMaturity, _nlBond?.coupon ?? 0, _nlBond?.yield ?? 0);
    // identifyBrackets's pick is a genuine cross-year retained maturity only when it names a
    // different bond than the canonical Active Lower Bracket just resolved above. A shared MATURITY
    // YEAR does not by itself mean they're the same bond — a maturity year may hold a January and a
    // July TIPS (DD §Bracket Year TIPS) — so the comparison is by CUSIP, never by year. When they
    // coincide there is simply no cross-year retained maturity; Multi-bracket stays active (is3Bracket
    // unchanged) so the same-year retained scan below still runs.
    crossYearRetained = newLowerCUSIP !== brackets.lowerCUSIP;
  }

  const future30yCoverYearSet = future30yYears.length > 0 ? new Set([future30yLowerYear, future30yUpperYear]) : new Set();
  const bracketYearSet = gapYears.length === 0 ? new Set()
    : is3Bracket
      ? new Set([brackets.lowerYear, brackets.upperYear, newLowerYear].filter(y => y != null))
      : new Set([brackets.lowerYear, brackets.upperYear].filter(y => y != null));
  for (const y of future30yCoverYearSet) bracketYearSet.add(y);
  const gapYearSet    = new Set(gapYears);
  const future30yYearSet = new Set(future30yYears);
  // The Excess TIPS and the Cover Excess are sold before they mature, so a bracket or cover year's
  // Same-Maturity Excess Interest is 0 (DD §Same-Maturity Excess Interest) and its interest is credited
  // to the funded years directly (2.0 §Gap Year Simulated Outstanding TIPS). Retained Bracket Excess is
  // sold the same way, earliest maturity first, before the first gap year (2.0 §Retained Bracket Excess).
  const excessSoldYear = (year) => bracketYearSet.has(year);

  // LMI-based FY estimate for ALL bracket and cover years (funded-year qty, not total) — the
  // funded-first rule (3.0 §Excess Quantity Before): whatever the year holds beyond its own funded
  // need is excess. Used for computing current excess = totalQty - fundedYearQty. A cover year is a
  // funded year like any other; its need is also reduced by the Future 30Y interest credited to it.
  const bracketTargetFundedYearQtyBefore = {};
  const bracketYearCUSIP = {};   // bYear -> the one CUSIP this year-keyed map speaks for (its Active
                                  // Lower/Upper Bracket TIPS or its cover) — a same-maturity-year retained TIPS
                                  // (DD §Bracket Year TIPS) is a DIFFERENT CUSIP and is never this one;
                                  // its own funded/excess split is tracked separately (sameYearRetained).
  for (const bYear of bracketYearSet) {
    let bCUSIP = null, bMat = null;
    if (gapYears.length > 0 && bYear === brackets.lowerYear) { bCUSIP = brackets.lowerCUSIP; bMat = brackets.lowerMaturity; }
    else if (gapYears.length > 0 && bYear === brackets.upperYear) { bCUSIP = brackets.upperCUSIP; bMat = brackets.upperMaturity; }
    else if (is3Bracket && bYear === newLowerYear) { bCUSIP = newLowerCUSIP; bMat = newLowerMaturity; }
    else if (future30yYears.length > 0 && bYear === future30yLowerYear) { bCUSIP = future30yLowerCoverBond.cusip; bMat = future30yLowerCoverBond.maturity; }
    else if (future30yYears.length > 0 && bYear === future30yUpperYear) { bCUSIP = future30yUpperCoverBond.cusip; bMat = future30yUpperCoverBond.maturity; }
    if (!bCUSIP) continue;
    bracketYearCUSIP[bYear] = bCUSIP;
    if (!yearInfo[bYear]) yearInfo[bYear] = { holdings: [] };
    const yh = yearInfo[bYear].holdings;
    let laterMatIntBefore = 0;
    for (const y in araLaterMaturityInterestByYear) {
      if (parseInt(y) > bYear) laterMatIntBefore += araLaterMaturityInterestByYear[y];
    }
    const piB = calculatePIPerBond(bCUSIP, bMat, refCPI, tipsMarketData);
    let nonPI = 0;
    for (const h of yh) { if (h.cusip !== bCUSIP) nonPI += h.qty * calculatePIPerBond(h.cusip, h.maturity, refCPI, tipsMarketData); }
    const bDara = (bYear > lastYear || (future30yCoverYearSet.has(bYear) && bYear < firstYear)) ? 0 : (daraByYear?.get(bYear) ?? DARA);
    bracketTargetFundedYearQtyBefore[bYear] = piB > 0 ? Math.max(0, Math.round((bDara - laterMatIntBefore - nonPI - creditAfter(bYear)) / piB)) : 0;
  }

  // When excessQty is provided by the import (Formats 4 or 5), it encodes the funded/excess split
  // from the prior build/rebalance. Use it for that year's Active Lower/Upper Bracket CUSIP,
  // overriding the DARA-derived estimate. Restricted to `bracketYearCUSIP[h.year]` (not "any holding
  // in this year") because a bracket year can hold a second, same-maturity-year retained TIPS (DD
  // §Bracket Year TIPS) — that CUSIP's own stated split is honored independently, below
  // (§sameYearRetained), so it must not overwrite this year-keyed entry. Broker CSVs (Formats 1–3)
  // have no excessQty: the LMI estimate above is used as the fallback.
  for (const h of holdings) {
    if (h.excessQty != null && bracketYearSet.has(h.year) && h.cusip === bracketYearCUSIP[h.year]) {
      bracketTargetFundedYearQtyBefore[h.year] = h.qty - h.excessQty;
    }
  }

  // PLI-zeroed bracket years: funded qty need is 0, so all current holdings are excess
  for (const year of zeroedFundedYears) {
    if (Object.prototype.hasOwnProperty.call(bracketTargetFundedYearQtyBefore, year)) {
      bracketTargetFundedYearQtyBefore[year] = 0;
    }
  }

  // A maturity year may hold more than one TIPS (DD §Bracket Year TIPS) — most commonly the active
  // lower bracket's own maturity year also holding an earlier-maturing TIPS from before it became
  // active (e.g. Jan 2036 held alongside the now-active Jul 2036). That earlier holding is retained
  // bracket excess in its own right, at its own (shorter) duration, exactly like a retained bracket
  // in an older maturity year — it just happens to share the active bracket's own maturity year.
  // 2.0 §Retained Bracket Excess; RETAINED_BRACKET_TODO.md ruling 4: the funded-year need is met
  // from the earliest maturity first, so this holding's excess is whatever it holds beyond ITS OWN
  // funded need — computed independently, crediting nothing forward from the active CUSIP.
  const sameYearRetained = [];
  if (is3Bracket) {
    let laterMatIntBefore = 0;
    for (const y in araLaterMaturityInterestByYear) if (parseInt(y) > newLowerYear) laterMatIntBefore += araLaterMaturityInterestByYear[y];
    const yDaraSameYear = newLowerYear > lastYear ? 0 : (daraByYear?.get(newLowerYear) ?? DARA);
    for (const h of (yearInfo[newLowerYear]?.holdings ?? [])) {
      if (h.cusip === newLowerCUSIP || h.cusip === brackets.lowerCUSIP) continue;
      const b = tipsMarketData.get(h.cusip);
      if (!b?.maturity || b.maturity >= newLowerMaturity) continue;   // only an earlier maturity qualifies
      const piOwn = calculatePIPerBond(h.cusip, b.maturity, refCPI, tipsMarketData);
      // The import's own stated split (Formats 4/5) is authoritative when present — it preserves the
      // funded/excess split from the prior build/rebalance exactly, the same way bracketYearCUSIP's
      // holder is honored above. Only fall back to the DARA-derived estimate for a broker file
      // (Formats 1–3), which carries no excessQty.
      const ownFundedNeedQty = h.excessQty != null
        ? Math.max(0, h.qty - h.excessQty)
        : (piOwn > 0 ? Math.max(0, Math.round((yDaraSameYear - laterMatIntBefore) / piOwn)) : 0);
      sameYearRetained.push({
        year: newLowerYear, cusip: h.cusip, maturity: b.maturity,
        duration: calculateMDuration(settlementDate, b.maturity, b.coupon ?? 0, b.yield ?? 0),
        ownFundedNeedQty,
      });
    }
  }

  let lowerWeight = 0, upperWeight = 0, origLowerWeight = null, newLowerWeight3 = null, upperWeight3 = null;
  // Every retained maturity (cross-year AND same-maturity-year), each with the weight
  // bracketWeightsN actually solved for it -- origLowerWeight below exposes only retainedList[0]
  // (the cross-year one), so a ladder with a same-year retained maturity too (2.0 §Retained Bracket
  // Excess) has no way, from the summary alone, to verify Σ wᵣ·dᵣ + w_active·d_active +
  // w_upper·d_upper = dGap or that every retained maturity's weight sums to 1 with the active and
  // upper weights. One entry per retainedList item, same order (earliest maturity first).
  let retainedLegs = [];
  // The retained maturities the gap conversions start from (oldest first, each with the excess it holds)
  // and the excess the active lower bracket holds; null without Retained Bracket Excess.
  let gapRetainedInput = null;
  let bracketFellBack3to2 = false, bracketSolveReason = null;
  let retainedExcessCostBefore = null, retainedBracketSold = false;
  const bracketExcessTargetCost = {};   // keyed by CUSIP, never by year — a year can hold two roles
  const sameYearRetainedFinal = new Map();   // same-year retained cusip -> its final post-rebalance qty
  // same-year retained cusip -> its own funded-year need (frozen; excess is whatever it holds beyond
  // this) — lets the details loop below split its row into funded/excess like any other bracket
  // target, instead of showing its entire holding as "funded" (2.0 §Retained Bracket Excess).
  const sameYearRetainedNeed = new Map(sameYearRetained.map(r => [r.cusip, r.ownFundedNeedQty]));
  if (gapYears.length > 0) {
    if (is3Bracket) {
      // Retained lower brackets are frozen at the excess already held and enter the
      // duration solve at their OWN duration; only the active lower bracket and the upper
      // bracket are solved. Pricing retained excess at the ACTIVE bracket's duration (as this
      // did from 463b07a) leaves the block under-matched, because an older maturity is shorter.
      // Spec 2.0 §Retained Bracket Excess; 3.0 §Lower bracket priority rule.
      const _excessCostOf = (year, cusip, ownNeedQty = null) => {
        const b   = tipsMarketData.get(cusip);
        const cpb = (b?.price ?? 0) / 100 * calcIndexRatio(refCPI, b?.datedDateRefCpi ?? refCPI) * 1000;
        const h   = yearInfo[year]?.holdings?.find(x => x.cusip === cusip);
        const need = ownNeedQty != null ? ownNeedQty : (bracketTargetFundedYearQtyBefore[year] ?? 0);
        return Math.max(0, (h?.qty ?? 0) - need) * cpb;
      };

      // Retained = every lower bracket older than the active one, EARLIEST MATURITY FIRST (the
      // order the solver depletes them in when the match is otherwise unsolvable) — a cross-year
      // pick from identifyBrackets (Excess ARA), only when it names a maturity distinct from the
      // Active Lower Bracket (`crossYearRetained`), plus any same-maturity-year holding found above.
      const retainedList = [
        ...(crossYearRetained
          ? [{ year: brackets.lowerYear, cusip: brackets.lowerCUSIP, maturity: brackets.lowerMaturity, duration: lowerDuration }]
          : []),
        ...sameYearRetained,
      ]
        .filter(r => r.year != null && r.cusip != null)
        .sort((a, b) => a.maturity - b.maturity)
        .map(r => ({ ...r, excessCost: _excessCostOf(r.year, r.cusip, r.ownFundedNeedQty ?? null) }));

      // The active lower bracket is "the only lower bracket a rebalance buys"
      // (DATA_DICTIONARY §Active Lower Bracket) — it is never sold to make room for an older,
      // already-retained leg. Floor the duration solve at whatever excess it currently holds, so a
      // retained leg large/short enough to otherwise squeeze the active leg toward (or below) zero
      // gets sold down further instead (3.0 §Lower bracket priority rule; the sell-oldest-first branch
      // now triggers on "would shrink active below its current holding", not just "solves negative").
      const activeFloorCost = _excessCostOf(newLowerYear, newLowerCUSIP);
      const activeFloorWeight = gapParams.totalCost > 0 ? activeFloorCost / gapParams.totalCost : 0;
      if (retainedList.length) {
        const _cpbOf = (cusip) => { const b = tipsMarketData.get(cusip); return (b?.price ?? 0) / 100 * calcIndexRatio(refCPI, b?.datedDateRefCpi ?? refCPI) * 1000; };
        gapRetainedInput = {
          retained: retainedList.map(r => ({ cusip: r.cusip, year: r.year, bond: tipsMarketData.get(r.cusip), heldQty: _cpbOf(r.cusip) > 0 ? Math.round(r.excessCost / _cpbOf(r.cusip)) : 0 })),
          activeHeldQty: _cpbOf(newLowerCUSIP) > 0 ? Math.round(activeFloorCost / _cpbOf(newLowerCUSIP)) : 0,
        };
      }

      const wN = bracketWeightsN({
        retained: retainedList,
        dActive: newLowerDuration,
        dUpper:  upperDuration,
        dGap:    gapParams.avgDuration,
        totalBlockCost: gapParams.totalCost,
        activeFloorWeight,
      });

      // lowerWeight now carries the ACTIVE bracket's own share, not both lower brackets, so
      // retained + active + upper sum to exactly 1 (they previously double-counted the retained
      // share in the gap-LMI allocation below).
      lowerWeight = wN.activeWeight; upperWeight = wN.upperWeight; upperWeight3 = wN.upperWeight;
      retainedExcessCostBefore = retainedList[0]?.excessCost ?? null;
      retainedBracketSold = !!wN.sold;
      bracketFellBack3to2 = !wN.feasible;
      bracketSolveReason  = wN.reason;

      retainedList.forEach((r, i) => {
        bracketExcessTargetCost[r.cusip] = gapParams.totalCost * wN.retainedWeights[i];
      });
      bracketExcessTargetCost[newLowerCUSIP]       = gapParams.totalCost * wN.activeWeight;
      bracketExcessTargetCost[brackets.upperCUSIP] = gapParams.totalCost * wN.upperWeight;

      // Effective weights for summary reporting.
      origLowerWeight = wN.retainedWeights[0] ?? 0;
      newLowerWeight3 = wN.activeWeight;
      retainedLegs = retainedList.map((r, i) => ({ cusip: r.cusip, year: r.year, duration: r.duration, weight: wN.retainedWeights[i] ?? 0 }));

      // Resolve each same-maturity-year retained leg's final quantity now (frozen funded
      // contribution, capped at what's held, plus its solved — never increased — excess share),
      // so Phase 4 below can place it directly instead of running it through the ordinary
      // sell-to-fund-this-year drain, which does not know it is a retained leg.
      for (const r of sameYearRetained) {
        const b   = tipsMarketData.get(r.cusip);
        const cpb = (b?.price ?? 0) / 100 * calcIndexRatio(refCPI, b?.datedDateRefCpi ?? refCPI) * 1000;
        const held = yearInfo[r.year]?.holdings?.find(x => x.cusip === r.cusip)?.qty ?? 0;
        const excessQty = cpb > 0 ? Math.max(0, Math.round((bracketExcessTargetCost[r.cusip] || 0) / cpb)) : 0;
        const fundedQty = Math.min(held, r.ownFundedNeedQty);
        sameYearRetainedFinal.set(r.cusip, fundedQty + excessQty);
      }
    }
    if (!is3Bracket) {
      const weights2Bracket = bracketWeights(lowerDuration, upperDuration, gapParams.avgDuration);
      lowerWeight = weights2Bracket.lowerWeight; upperWeight = weights2Bracket.upperWeight;
      if (brackets.lowerCUSIP != null) bracketExcessTargetCost[brackets.lowerCUSIP] = gapParams.totalCost * lowerWeight;
      bracketExcessTargetCost[brackets.upperCUSIP] = gapParams.totalCost * upperWeight;
    }
  }

  // Retained Bracket Excess held: the conversions start from the quantities this run sizes for each
  // retained maturity, the active lower bracket and the upper bracket, so the gap amounts are worked out
  // again with them (ladder-core.js sizeLadder, gapRetained).
  if (gapRetainedInput) {
    const _slR = sizeLadder({ ..._slArgs, gapRetained: gapRetainedInput });
    gapSimulatedInterestByYear = _slR.gapSimulatedInterestByYear;
    gapExcessInterestByYear = _slR.gapExcessInterestByYear;
    gapNetCashByYear = _slR.gapNetCashByYear;
    preLadderGapPool = _slR.preLadderGapPool;
    gapRebalancesAfter = _slR.gapRebalances;
  }

  let rebalYearSet = new Set();
  for (let y = firstYear; y <= lastYear; y++) {
    if (!bracketYearSet.has(y) && !gapYearSet.has(y)) rebalYearSet.add(y);
  }
  // Every funded year credited with the interest of the Simulated Outstanding Future 30Y TIPS or of
  // the Cover Excess, or with Net Cash, is rebalanced, so the credit reduces its funded-year quantity and an Amount After
  // above DARA is sold down (4.0 §build-lib.js / rebalance-lib.js — Future 30Y Simulated Outstanding TIPS).
  for (const y of [...future30ySimulatedInterestByYear.keys(), ...future30yCoverInterestByYear.keys(), ...future30yNetCashByYear.keys(),
                   ...gapSimulatedInterestByYear.keys(), ...gapExcessInterestByYear.keys(), ...gapNetCashByYear.keys()]) {
    if (y >= firstYear && y <= lastYear && !bracketYearSet.has(y) && !gapYearSet.has(y) && !future30yYearSet.has(y))
      rebalYearSet.add(y);
  }

  // Future cover excess target costs (additive in case cover year also has gap bracket role)
  if (future30yYears.length > 0) {
    bracketExcessTargetCost[future30yLowerCoverBond.cusip] = (bracketExcessTargetCost[future30yLowerCoverBond.cusip] || 0) + future30yParams.future30yTotalCost * future30yLowerWeight;
    bracketExcessTargetCost[future30yUpperCoverBond.cusip] = (bracketExcessTargetCost[future30yUpperCoverBond.cusip] || 0) + future30yParams.future30yTotalCost * future30yUpperWeight;
  }

  const buySellTargets = {};
  const nonTargetSells = {};
  const postRebalQtyMap = {};
  const fundedCUSIPByYear = {};   // bracket year -> its maturityPref-resolved funded CUSIP (may equal buySellTargets[year].targetCUSIP)
  // RMD Options 'last' mode: the pool-wide latest remaining coupon date, over every bond the
  // canonical TARGET ladder holds above the settlement year — the "After" state's own pool
  // (mirrors sizeLadder's identical computation; ladder-core.js latestRemainingCouponDate). Reuses
  // _canon (selectLadderBonds, computed above) rather than deriving a second bond set here.
  const _rmdLastDateAfter = rmdCouponMode === 'last'
    ? latestRemainingCouponDate(
        _canon.rangeYears.filter(y => y > settlementYear)
          .flatMap(y => (_canon.yearTipsListMap[y] ?? [_canon.yearBondMap[y]]).map(b => b?.maturity)),
        settlementDate, bondHolidays, tradeDate,
      )
    : null;
  let rebuildLaterMatInt = 0;
  let rebuildLaterMatIntRemaining = 0;  // remaining-coupon counterpart, used only at year === settlementYear
  const yearLaterMatIntSnapshot = {};
  const allProcessYears = new Set([...holdingsYears, ...gapYears, ...bracketYearSet]);
  for (let y = firstYear; y <= lastYear; y++) allProcessYears.add(y);
  const sortedToProcess = Array.from(allProcessYears).sort((a, b) => b - a);

  for (const year of sortedToProcess) {
    const isSettlementYear = year === settlementYear;
    yearLaterMatIntSnapshot[year] = isSettlementYear ? rebuildLaterMatIntRemaining : rebuildLaterMatInt;
    if (gapYearSet.has(year) || future30yYearSet.has(year)) continue;

    const yi = yearInfo[year] || { holdings: [] };
    const isBracket = bracketYearSet.has(year);
    const isRebal = rebalYearSet.has(year);

    let targetCUSIP;
    let yearRank = null;
    const piMap = {};
    for (const h of yi.holdings) piMap[h.cusip] = calculatePIPerBond(h.cusip, h.maturity, refCPI, tipsMarketData);

    if (isBracket) {
      if (gapYears.length > 0 && year === brackets.lowerYear) targetCUSIP = brackets.lowerCUSIP;
      else if (gapYears.length > 0 && year === brackets.upperYear) targetCUSIP = brackets.upperCUSIP;
      else if (is3Bracket && year === newLowerYear) targetCUSIP = newLowerCUSIP;
      else if (future30yYears.length > 0 && year === future30yLowerYear) targetCUSIP = future30yLowerCoverBond.cusip;
      else if (future30yYears.length > 0 && year === future30yUpperYear) targetCUSIP = future30yUpperCoverBond.cusip;
    } else {
      // 2.0 §Within-Year Allocation Policy / 3.0 §Named Quantities (Rebalance): candidates come
      // from the canonical yearTipsListMap (maturityPref/yearOverrides-driven), not re-derived
      // from tipsMarketData inline -- this is also the fix for the pre-existing bug where a
      // maturityPref='all'/'semiannual' funded year's non-latest holdings were silently
      // collapsed toward the single latest CUSIP on every rebalance.
      yearRank = rankForYear({
        candidates: _canon.yearTipsListMap[year] ?? [],
        held: yi.holdings,
        piMap,
        tipsMarketData,
        policy: allocationPolicy,
        rankOverride: yearRankOverrides?.get(year) ?? null,
        maturityPref,
      });
      targetCUSIP = yearRank[0]?.cusip;
    }

    // A bracket year's funded-year need is a distinct role from its excess (targetCUSIP above,
    // identified purely by §Bracket Identification Rules and never by maturityPref — the excess
    // always sits on the active/canonical maturity). Which CUSIP fills the year's OWN funded need
    // follows the SAME rule an ordinary funded year uses: maturityPref over that year's own
    // candidates (3.0 §Named Quantities §Target CUSIP resolution). Ranked by maturity direction
    // only (`policy: 'maturity'`, not the caller's allocationPolicy) so a bracket year's sell
    // order among its OTHER held maturities stays the existing oldest-first rule (2.0 §Retained
    // Bracket Excess) except for whichever single maturity maturityPref now funds — allocationPolicy
    // ('equal'/'saYield') is an ordinary-year concept the bracket/duration-match machinery never
    // consults. A same-maturity-year retained leg (sameYearRetainedFinal, ruling 4) IS a candidate
    // here, not excluded: under 'first' it is very often the maturity maturityPref actually wants
    // funding the year's need, since it already sits earlier than the active/canonical maturity
    // (that's the recurring real-world shape ruling 4 itself describes). When it wins, its own
    // excess share (already solved by bracketWeightsN, frozen, never increased) combines with the
    // funded quantity resolved below onto the SAME row (fundedIsRetained further down) instead of
    // the ruling-4 placement loop separately overwriting it — one owner per CUSIP's final quantity.
    // Ranked purely by maturity direction — used below both for the funded CUSIP (only under a
    // non-default maturityPref, see below) and for the sell order among this year's OTHER held
    // maturities (every maturityPref, including the default — reproduces today's oldest-first rule,
    // since 'last' ranks latest-first and the drain below reverses it).
    if (isBracket) {
      yearRank = rankForYear({
        candidates: _canon.yearTipsListMap[year] ?? [],
        held: yi.holdings,
        piMap,
        tipsMarketData,
        policy: 'maturity',
        rankOverride: yearRankOverrides?.get(year) ?? null,
        maturityPref,
      });
    }
    // maturityPref='last' (the default) is a no-op here by construction: the bracket's canonical
    // CUSIP is not always "whichever candidate matures latest in that year" (an orig-lower/retained
    // bracket is picked by Excess ARA, 3.0 §Bracket Identification Rules, not by maturity recency),
    // so ranking unconditionally could pick a DIFFERENT CUSIP than targetCUSIP even under the
    // unchanged default, which is a regression (a same-maturity-year buy+sell pair), not a fix. Only
    // an actual non-default maturityPref should ever move the funded role off targetCUSIP.
    const fundedCUSIP = (isBracket && maturityPref !== 'last')
      ? (yearRank[0]?.cusip ?? targetCUSIP)
      : targetCUSIP;
    fundedCUSIPByYear[year] = fundedCUSIP;
    const fundedIsRetained = isBracket && fundedCUSIP !== targetCUSIP && sameYearRetainedFinal.has(fundedCUSIP);

    // Ensure piMap has both CUSIPs — either may be absent from current holdings
    for (const c of new Set([targetCUSIP, fundedCUSIP])) {
      if (c && !piMap[c]) {
        const b = tipsMarketData.get(c);
        if (b && b.maturity) piMap[c] = calculatePIPerBond(c, b.maturity, refCPI, tipsMarketData);
      }
    }

    const tBond = tipsMarketData.get(targetCUSIP);
    const ir = (calcIndexRatio(refCPI, tBond?.datedDateRefCpi ?? refCPI));
    const costPerBond = (tBond?.price ?? 0) / 100 * ir * 1000;
    const targetCurrentQty = yi.holdings.find(h => h.cusip === targetCUSIP)?.qty ?? 0;

    // Funded-need pricing context — fundedCUSIP's own bond, distinct from targetCUSIP's own
    // whenever maturityPref picked a different maturity than the bracket's canonical excess CUSIP.
    const fundedIsTarget = fundedCUSIP === targetCUSIP;
    const fBond = fundedIsTarget ? tBond : tipsMarketData.get(fundedCUSIP);
    const fIr = fundedIsTarget ? ir : calcIndexRatio(refCPI, fBond?.datedDateRefCpi ?? refCPI);
    const fCostPerBond = fundedIsTarget ? costPerBond : (fBond?.price ?? 0) / 100 * fIr * 1000;
    const fundedCurrentQty = fundedIsTarget ? targetCurrentQty : (yi.holdings.find(h => h.cusip === fundedCUSIP)?.qty ?? 0);

    let tFundedYearQty, postQ;
    if (isBracket || isRebal) {
      const yearDara = (year > lastYear || year < firstYear) ? 0 : (daraByYear?.get(year) ?? DARA);

      // 1. Determine target excess quantity for this bracket/rebal year — always priced off
      //    targetCUSIP, the canonical excess-bearing CUSIP, never fundedCUSIP.
      let excessQtyTarget = 0;
      if (isBracket) {
        if (future30yYears.length > 0 && year === future30yUpperYear) {
          // Use precomputed UNADJ-based excess qty directly (matches build-lib)
          excessQtyTarget = future30yUpperExQty;
        } else if (future30yYears.length > 0 && year === future30yLowerYear) {
          excessQtyTarget = future30yLowerExQty;
        } else {
          excessQtyTarget = costPerBond > 0 ? Math.max(0, Math.round((bracketExcessTargetCost[targetCUSIP] || 0) / costPerBond)) : 0;
        }
      }

      // 2. Calculate LMI from this year's own excess bonds (targetCUSIP's own coupon). A cover year's
      //    is 0: the Cover Excess is sold before it matures (DD §Same-Maturity Excess Interest).
      const excessLMI = excessSoldYear(year) ? 0
        : isSettlementYear && tBond?.maturity
        ? excessQtyTarget * 1000 * ir * (tBond?.coupon ?? 0) / 2 * rmdCappedRemainingCoupons(tBond.maturity, settlementDate, bondHolidays, rmdCouponMode, tradeDate, _rmdLastDateAfter)
        : excessQtyTarget * 1000 * ir * (tBond?.coupon ?? 0);

      // 3. Calculate needed P+I, subtracting both incoming LMI and current year excess LMI
      const effectivePartialCredit = (year === partialCreditYear) ? partialCredit : 0;
      const creditedInterest = creditAfter(year);   // simulated TIPS + Excess TIPS (Cover Excess) interest + Net Cash, gap and Future 30Y
      const needed = yearDara - (isSettlementYear ? rebuildLaterMatIntRemaining : rebuildLaterMatInt) - excessLMI - effectivePartialCredit - creditedInterest;

      if (zeroedFundedYears.has(year)) {
        // PLI covers this year's funded need — zero funded qty AND sell all non-target holdings
        tFundedYearQty = 0;
        for (const h of yi.holdings) {
          if (h.cusip !== targetCUSIP && h.cusip !== fundedCUSIP && h.qty > 0) {
            postRebalQtyMap[h.cusip] = 0;
            const b2 = tipsMarketData.get(h.cusip);
            const c2 = (b2?.price ?? 0) / 100 * (calcIndexRatio(refCPI, b2?.datedDateRefCpi ?? refCPI)) * 1000;
            nonTargetSells[h.cusip] = { newQty: 0, qtyDelta: -h.qty, costDelta: h.qty * c2, targetCost: 0 };
          }
        }
      } else {
        // Excess already held at this year's bracket maturity is committed to gap duration
        // matching, not available to fund the year's own rung. Its coupon has already reduced
        // `needed` above (excessLMI); counting its PRINCIPAL here as well made the year look
        // over-funded, so the sell-down below dumped a perfectly good funded holding at this
        // year's OTHER maturity, and the bracket maturity was bought back to replace it — a
        // same-year sell of one maturity and buy of another with no net effect. Non-bracket years
        // hold no excess, so this nets to zero for them. 3.0 §Named Quantities (funded-first rule).
        // Always priced off targetCUSIP's OWN holdings, whether or not fundedCUSIP diverges — see
        // the redirect-only-the-shortfall note below for why targetCUSIP's existing funded coverage
        // must never be zeroed out just because maturityPref prefers a different maturity.
        const targetExcessHeld = isBracket
          ? Math.max(0, targetCurrentQty - (bracketTargetFundedYearQtyBefore[year] ?? targetCurrentQty))
          : 0;
        const targetFundedHeld = targetCurrentQty - targetExcessHeld;
        // Sell order (3.0 §Within-Year Allocation Policy / §Target CUSIP resolution): least-
        // preferred-to-hold first. For ordinary years this is allocationPolicy's own rank; for a
        // bracket year it is the maturity-direction rank computed above, minus the excess-bearing
        // targetCUSIP itself (never drained to fund the year — its target is the separate
        // duration-match figure), minus any same-maturity-year retained leg (already resolved on
        // its own, below). fundedCUSIP is NOT excluded here: if it's currently held and a genuine
        // reduction is needed (diff < 0), it drains like any other held maturity — protecting it
        // from maturityPref-driven reallocation (below) is not the same as protecting it from a
        // real, needed sale.
        let nonTarget = yearRank
          .filter(r => r.held && r.cusip !== targetCUSIP && !sameYearRetainedFinal.has(r.cusip))
          .reverse()
          .map(r => yi.holdings.find(h => h.cusip === r.cusip));
        let curPI = yi.holdings.reduce((s, h) => s + h.qty * piMap[h.cusip], 0)
                  - targetExcessHeld * piMap[targetCUSIP];
        // The year's total P+I is what the DARA sets (3.0 §Named Quantities): its net change decides the
        // direction of every trade in the year. A year whose total must fall only sells, a year whose total
        // must rise only buys, and a year whose total is unchanged does not trade. The allocation policy
        // chooses WHICH maturity trades, never both directions (2.0 §Within-Year Allocation Policy).
        const yearPIHeld = curPI;
        const yearFalls = needed < yearPIHeld, yearRises = needed > yearPIHeld;
        const isEqualLevel = !isBracket && allocationPolicy === 'equal' && nonTarget.length > 0;
        if (isEqualLevel) {
          // Equal split levels rather than drains in fixed order -- see levelValues (3.0 §Within-
          // Year Allocation Policy). Pool is the target plus whatever's currently held besides it;
          // a candidate held by neither stays untouched, same as before.
          const poolValues = new Map([[targetCUSIP, targetFundedHeld * piMap[targetCUSIP]],
            ...nonTarget.map(h => [h.cusip, h.qty * piMap[h.cusip]])]);
          const leveled = levelValues(poolValues, needed);
          for (const h of nonTarget) {
            let newQty = Math.max(0, Math.round(leveled.get(h.cusip) / piMap[h.cusip]));
            // Rounding each maturity to whole TIPS must not turn the leveling into a trade against the year's direction.
            if (yearFalls) newQty = Math.min(newQty, h.qty); else if (yearRises) newQty = Math.max(newQty, h.qty); else newQty = h.qty;
            curPI -= (h.qty - newQty) * piMap[h.cusip];
            postRebalQtyMap[h.cusip] = newQty;
          }
        } else {
          // Strict fixed-order drain: a CUSIP must be sold down to zero before the next-ranked one
          // (or targetCUSIP) is touched at all. A per-bond value smaller than an earlier-ranked,
          // not-yet-exhausted CUSIP's must never let that later CUSIP sell first just because it
          // happens to divide the remaining residual more evenly -- stop the instant one isn't
          // fully drained, leaving every less-preferred-to-sell CUSIP after it untouched.
          for (const h of nonTarget) {
            const sell = Math.min(h.qty, Math.max(0, Math.floor((curPI - needed) / piMap[h.cusip])));
            postRebalQtyMap[h.cusip] = h.qty - sell;
            curPI -= sell * piMap[h.cusip];
            if (sell < h.qty) break;
          }
          for (const h of nonTarget) if (!(h.cusip in postRebalQtyMap)) postRebalQtyMap[h.cusip] = h.qty;
        }
        const diff = needed - curPI;
        // A CUSIP still holding qty after the drain above is, by definition, less preferred to
        // hold than targetCUSIP -- the fixed sell order must never touch targetCUSIP to close a
        // shrink-side rounding remainder while an earlier-ranked nonTarget CUSIP still has bonds
        // left; the small residual is accepted instead (3.0 §Within-Year Allocation Policy sell
        // order). Growth-side (diff > 0) and the equal-split branch (levelValues) are unaffected.
        const nonTargetStillHeld = !isEqualLevel && nonTarget.some(h => (postRebalQtyMap[h.cusip] ?? h.qty) > 0);
        // maturityPref only ever redirects a GENUINE SHORTFALL (diff > 0, real new money the
        // current holdings don't already cover) to fundedCUSIP -- it never sells down targetCUSIP's
        // existing funded coverage to relabel it under a different, preferred maturity. Without this
        // guard, a bracket year whose current holding already fully funds its own need (e.g. a
        // retained maturity carrying its entire funded role with no real excess) would get sold to
        // zero and rebought at the preferred maturity for no economic reason — a same-year sell of
        // one maturity and buy of another purely to satisfy preference, which 3.0 §Target CUSIP
        // resolution forbids for bracket years just as it forbids it for the funded/excess split on
        // one CUSIP above. A real reduction in need (diff <= 0) is not this case: it drains via the
        // ordinary nonTarget mechanism above and/or shrinks targetCUSIP directly, same as 'last'.
        const wantsRedirect = !fundedIsTarget && diff > 0;
        // The residual after the other maturities have been sized lands on targetCUSIP, in the year's direction only.
        let targetFundedDelta = Math.round(diff / piMap[targetCUSIP]);
        if (yearFalls) targetFundedDelta = Math.min(0, targetFundedDelta); else if (yearRises) targetFundedDelta = Math.max(0, targetFundedDelta); else targetFundedDelta = 0;
        tFundedYearQty = (diff < 0 && nonTargetStillHeld)
          ? targetFundedHeld
          : wantsRedirect
            ? targetFundedHeld  // frozen at its existing funded coverage; the shortfall goes to fundedCUSIP below
            : Math.max(0, targetFundedHeld + targetFundedDelta);
        for (const h of nonTarget) {
          if (postRebalQtyMap[h.cusip] !== h.qty) {
            const b = tipsMarketData.get(h.cusip);
            const c = (b?.price ?? 0) / 100 * (calcIndexRatio(refCPI, b?.datedDateRefCpi ?? refCPI)) * 1000;
            nonTargetSells[h.cusip] = { newQty: postRebalQtyMap[h.cusip], qtyDelta: postRebalQtyMap[h.cusip] - h.qty, costDelta: -((postRebalQtyMap[h.cusip] - h.qty) * c), targetCost: postRebalQtyMap[h.cusip] * c };
          }
        }
        // Place each same-maturity-year retained leg at its own resolved quantity (own funded
        // contribution, capped at what's held, plus its solved — never increased — excess share) —
        // excluded from the drain above, so it must be set explicitly rather than left to the
        // generic "unchanged unless in postRebalQtyMap" fallback. Skip fundedCUSIP itself only when
        // it is actually winning a redirected shortfall (wantsRedirect): its final quantity is
        // finalized below instead, combining that shortfall with the SAME excess share this loop
        // would have used. When there is no shortfall, this leg is untouched by maturityPref and
        // gets its normal ruling-4 placement here, same as under 'last'.
        if (isBracket && year === newLowerYear) {
          for (const [cusip, finalQty] of sameYearRetainedFinal) {
            if (cusip === fundedCUSIP && wantsRedirect) continue;
            const heldQty = yi.holdings.find(h => h.cusip === cusip)?.qty ?? 0;
            postRebalQtyMap[cusip] = finalQty;
            if (finalQty !== heldQty) {
              const b2 = tipsMarketData.get(cusip);
              const c2 = (b2?.price ?? 0) / 100 * (calcIndexRatio(refCPI, b2?.datedDateRefCpi ?? refCPI)) * 1000;
              nonTargetSells[cusip] = { newQty: finalQty, qtyDelta: finalQty - heldQty, costDelta: -((finalQty - heldQty) * c2), targetCost: finalQty * c2 };
            }
          }
        }
        // The redirected shortfall itself: fundedCUSIP's own current holding (0 for a fresh buy)
        // plus the incremental amount targetCUSIP's freeze left unfunded, plus — when fundedCUSIP is
        // itself a same-maturity-year retained leg — its own frozen excess share, combined onto the
        // one row rather than left for the loop above (which skipped it for exactly this reason).
        if (wantsRedirect) {
          const fundedGrowthQty = Math.max(0, Math.round(diff / piMap[fundedCUSIP]));
          const retainedExcessQty = fundedIsRetained && fCostPerBond > 0
            ? Math.max(0, Math.round((bracketExcessTargetCost[fundedCUSIP] || 0) / fCostPerBond))
            : 0;
          const fundedFinalQty = fundedCurrentQty + fundedGrowthQty + retainedExcessQty;
          postRebalQtyMap[fundedCUSIP] = fundedFinalQty;
          if (fundedFinalQty !== fundedCurrentQty) {
            nonTargetSells[fundedCUSIP] = { newQty: fundedFinalQty, qtyDelta: fundedFinalQty - fundedCurrentQty, costDelta: -((fundedFinalQty - fundedCurrentQty) * fCostPerBond), targetCost: fundedFinalQty * fCostPerBond };
          }
        }
      }
      // targetCUSIP's own row always carries its own funded contribution (frozen or grown, per
      // above) plus its excess -- true whether or not fundedCUSIP diverged, since a redirect only
      // ever adds a shortfall elsewhere, never zeroes out what targetCUSIP already legitimately funds.
      postQ = tFundedYearQty + excessQtyTarget;
      buySellTargets[year] = { targetCUSIP, targetFundedYearQty: tFundedYearQty, targetQty: postQ, postRebalQty: postQ, qtyDelta: postQ - targetCurrentQty, targetCost: tFundedYearQty * costPerBond, costDelta: -((postQ - targetCurrentQty) * costPerBond), costPerBond, isBracket };
    } else if (year > lastYear && year <= derivedLastYear && yi.holdings.length > 0) {
      // Year is held but now above lastYearOverride — sell all
      tFundedYearQty = 0; postQ = 0;
      if (targetCUSIP) {
        const tc = costPerBond;
        buySellTargets[year] = {
          targetCUSIP, targetFundedYearQty: 0, targetQty: 0, postRebalQty: 0,
          qtyDelta: -targetCurrentQty, targetCost: 0,
          costDelta: targetCurrentQty * tc, costPerBond: tc, isBracket: false,
        };
      }
      for (const h of yi.holdings) {
        postRebalQtyMap[h.cusip] = 0;
        if (h.cusip !== targetCUSIP) {
          const b2 = tipsMarketData.get(h.cusip);
          const c2 = (b2?.price ?? 0) / 100 * (calcIndexRatio(refCPI, b2?.datedDateRefCpi ?? refCPI)) * 1000;
          nonTargetSells[h.cusip] = { newQty: 0, qtyDelta: -h.qty, costDelta: h.qty * c2, targetCost: 0 };
        }
      }
    } else if (year < firstYear && year >= derivedFirstYear && yi.holdings.length > 0) {
      // Year is below firstYearOverride — sell all holdings (symmetric to above-lastYear logic)
      tFundedYearQty = 0; postQ = 0;
      if (targetCUSIP) {
        buySellTargets[year] = {
          targetCUSIP, targetFundedYearQty: 0, targetQty: 0, postRebalQty: 0,
          qtyDelta: -targetCurrentQty, targetCost: 0,
          costDelta: targetCurrentQty * costPerBond, costPerBond, isBracket: false,
        };
      }
      for (const h of yi.holdings) {
        postRebalQtyMap[h.cusip] = 0;
        if (h.cusip !== targetCUSIP) {
          const b2 = tipsMarketData.get(h.cusip);
          const c2 = (b2?.price ?? 0) / 100 * (calcIndexRatio(refCPI, b2?.datedDateRefCpi ?? refCPI)) * 1000;
          nonTargetSells[h.cusip] = { newQty: 0, qtyDelta: -h.qty, costDelta: h.qty * c2, targetCost: 0 };
        }
      }
    } else {
      tFundedYearQty = targetCurrentQty; postQ = targetCurrentQty;
    }

    postRebalQtyMap[targetCUSIP] = postQ;
    for (const h of yi.holdings) {
      const b = tipsMarketData.get(h.cusip);
      if (b) {
        const qty = postRebalQtyMap[h.cusip] ?? h.qty;
        const ir2 = calcIndexRatio(refCPI, b.datedDateRefCpi || refCPI);
        rebuildLaterMatInt += qty * ir2 * 1000 * b.coupon;
        rebuildLaterMatIntRemaining += qty * ir2 * 1000 * b.coupon / 2 * rmdCappedRemainingCoupons(b.maturity, settlementDate, bondHolidays, rmdCouponMode, tradeDate, _rmdLastDateAfter);
      }
    }
    // Ensure target CUSIP contributes to LMI pool even when it has no prior holdings (new bracket buy)
    if (targetCUSIP && !yi.holdings.some(h => h.cusip === targetCUSIP) && (postRebalQtyMap[targetCUSIP] ?? 0) > 0) {
      const _blmi = tipsMarketData.get(targetCUSIP);
      if (_blmi) {
        const ir3 = calcIndexRatio(refCPI, _blmi.datedDateRefCpi || refCPI);
        rebuildLaterMatInt += postRebalQtyMap[targetCUSIP] * ir3 * 1000 * _blmi.coupon;
        rebuildLaterMatIntRemaining += postRebalQtyMap[targetCUSIP] * ir3 * 1000 * _blmi.coupon / 2 * rmdCappedRemainingCoupons(_blmi.maturity, settlementDate, bondHolidays, rmdCouponMode, tradeDate, _rmdLastDateAfter);
      }
    }
    // Same guard for a diverged fundedCUSIP (a fresh buy into a maturity maturityPref picked that
    // wasn't already held) — it never appears in yi.holdings, so the accumulation loop above skips it.
    if (fundedCUSIP && fundedCUSIP !== targetCUSIP && !yi.holdings.some(h => h.cusip === fundedCUSIP) && (postRebalQtyMap[fundedCUSIP] ?? 0) > 0) {
      const _flmi = tipsMarketData.get(fundedCUSIP);
      if (_flmi) {
        const ir4 = calcIndexRatio(refCPI, _flmi.datedDateRefCpi || refCPI);
        rebuildLaterMatInt += postRebalQtyMap[fundedCUSIP] * ir4 * 1000 * _flmi.coupon;
        rebuildLaterMatIntRemaining += postRebalQtyMap[fundedCUSIP] * ir4 * 1000 * _flmi.coupon / 2 * rmdCappedRemainingCoupons(_flmi.maturity, settlementDate, bondHolidays, rmdCouponMode, tradeDate, _rmdLastDateAfter);
      }
    }
    // The Excess TIPS and the Cover Excess are not carried in the running LMI: their interest is
    // credited to each funded year directly (creditAfter), so take the target excess back out.
    if (excessSoldYear(year) && buySellTargets[year]) {
      const _cb = tipsMarketData.get(buySellTargets[year].targetCUSIP);
      const _cex = buySellTargets[year].targetQty - buySellTargets[year].targetFundedYearQty;
      if (_cb && _cex > 0) {
        const _irc = calcIndexRatio(refCPI, _cb.datedDateRefCpi || refCPI);
        rebuildLaterMatInt -= _cex * _irc * 1000 * _cb.coupon;
        rebuildLaterMatIntRemaining -= _cex * _irc * 1000 * _cb.coupon / 2 * rmdCappedRemainingCoupons(_cb.maturity, settlementDate, bondHolidays, rmdCouponMode, tradeDate, _rmdLastDateAfter);
      }
    }
    // A retained maturity sharing the active lower bracket's year: its excess is sold too.
    if (is3Bracket && year === newLowerYear && sameYearRetainedFinal.size > 0) {
      for (const [cusip, finalQty] of sameYearRetainedFinal) {
        const _rb = tipsMarketData.get(cusip);
        const _rex = finalQty - Math.min(yi.holdings.find(h => h.cusip === cusip)?.qty ?? 0, sameYearRetainedNeed.get(cusip) ?? 0);
        if (_rb && _rex > 0) {
          const _irr = calcIndexRatio(refCPI, _rb.datedDateRefCpi || refCPI);
          rebuildLaterMatInt -= _rex * _irr * 1000 * _rb.coupon;
          rebuildLaterMatIntRemaining -= _rex * _irr * 1000 * _rb.coupon / 2 * rmdCappedRemainingCoupons(_rb.maturity, settlementDate, bondHolidays, rmdCouponMode, tradeDate, _rmdLastDateAfter);
        }
      }
    }
    if (!isFinite(rebuildLaterMatInt)) rebuildLaterMatInt = 0; // safety guard against NaN/Infinity cascade
    if (!isFinite(rebuildLaterMatIntRemaining)) rebuildLaterMatIntRemaining = 0;
  }

  // ── Before and the Future 30Y rebalances (3.0 §Build ≡ Rebalance "Before" and "After") ────────────
  // The Cover Excess held is what the file declares, or what the funded-first rule leaves over. It
  // matters only before the first issue date: from each issue date on, the Cover Excess goes to the
  // quantity the duration match gives, as in a build. The Simulated Outstanding Future 30Y TIPS are
  // sized as in a build (Pass 1 at this run's DARA); with the DARA inferred, their quantities are the
  // ones the held Cover Excess implies (impliedFuture30yInterest). The Net Cash of the first issue date
  // is worked out from the Cover Excess held before it. The held Cover Excess coupon is
  // taken out of the running LMI the same way the After state takes the target Cover Excess out.
  const heldCoverExcessByYear = {};
  for (const cy of future30yCoverYearSet) {
    const coverCusip = bracketYearCUSIP[cy];
    const held = yearInfo[cy]?.holdings?.find(h => h.cusip === coverCusip)?.qty ?? 0;
    heldCoverExcessByYear[cy] = Math.max(0, held - (bracketTargetFundedYearQtyBefore[cy] ?? held));
  }
  const _beforeUsesImplied = dara === null && !daraByYear && heldImplied != null;
  const future30yParamsBefore = _beforeUsesImplied ? heldImplied.future30yParams : future30yParams;
  const future30yRebalancesBefore = _beforeUsesImplied ? heldImplied.rebalances : _sl.future30yRebalances;
  const { simulated: future30ySimulatedInterestBefore, cover: future30yCoverInterestBefore, netCash: future30yNetCashBefore } = future30yInterestByYear({
    rebalances: future30yRebalancesBefore, lowerCoverBond: future30yLowerCoverBond, upperCoverBond: future30yUpperCoverBond,
    refCPI, settlementDate, firstFuture30yYear: future30yYears.length ? Math.min(...future30yYears) : null,
    lowerQty0: heldCoverExcessByYear[future30yLowerYear] ?? 0, upperQty0: heldCoverExcessByYear[future30yUpperYear] ?? 0,
    bondHolidays, rmdCouponMode, tradeDate, rmdLastDate: _rmdLastDateBefore,
  });
  // The same for the gap years (3.0 §Before and the gap year rebalances): the Excess TIPS held at the
  // lower and upper bracket TIPS is what the file declares, or what the funded-first rule leaves over.
  // The Simulated Outstanding Future 10Y TIPS are sized as in a build (Pass 1 at this run's DARA); the
  // Net Cash of the first issue date is worked out from the Excess TIPS held before it.
  // The active lower bracket is the canonical Active Lower Bracket in three-bracket mode, the lower bracket
  // otherwise; every other lower bracket held is a retained maturity (gapRetainedInput).
  const gapActiveCusip = is3Bracket ? newLowerCUSIP : brackets.lowerCUSIP;
  const gapActiveYear = is3Bracket ? newLowerYear : brackets.lowerYear;
  const heldYearKeyedExcess = (year, cusip) => {
    if (!cusip || bracketYearCUSIP[year] !== cusip) return 0;
    const held = yearInfo[year]?.holdings?.find(h => h.cusip === cusip)?.qty ?? 0;
    return Math.max(0, held - (bracketTargetFundedYearQtyBefore[year] ?? held));
  };
  const heldGapLegs = gapYears.length > 0 ? [
    { key: 'active', year: gapActiveYear, cusip: gapActiveCusip, qty: gapRetainedInput ? gapRetainedInput.activeHeldQty : heldYearKeyedExcess(gapActiveYear, gapActiveCusip) },
    { key: 'upper', year: brackets.upperYear, cusip: brackets.upperCUSIP, qty: heldYearKeyedExcess(brackets.upperYear, brackets.upperCUSIP) },
    ...(gapRetainedInput?.retained ?? []).map(r => ({ key: 'retained', year: r.year, cusip: r.cusip, qty: r.heldQty })),
  ] : [];
  const heldGapExcessByYear = {};
  for (const l of heldGapLegs) heldGapExcessByYear[l.year] = (heldGapExcessByYear[l.year] ?? 0) + l.qty;
  const _beforeGapUsesImplied = dara === null && !daraByYear && heldImpliedGap != null;
  const gapParamsBefore = _beforeGapUsesImplied ? heldImpliedGap.gapParams : _sl.gapParams;
  const gapRebalancesBefore = gapYears.length > 0
    ? gapRebalances({
        gapParams: gapParamsBefore,
        lowerBracketBond: tipsMarketData.get(gapActiveCusip), upperBracketBond: tipsMarketData.get(brackets.upperCUSIP),
        retained: heldGapLegs.filter(l => l.key === 'retained').map(l => ({ bond: tipsMarketData.get(l.cusip), qty0: l.qty })),
        refCPI, bondHolidays,
        lowerQty0: heldGapLegs.find(l => l.key === 'active')?.qty ?? 0, upperQty0: heldGapLegs.find(l => l.key === 'upper')?.qty ?? 0,
      })
    : null;
  const { simulated: gapSimulatedInterestBefore, excess: gapExcessInterestBefore, netCash: gapNetCashBefore } = gapRebalancesBefore
    ? gapInterestByYear({
        rebalances: gapRebalancesBefore,
        lowerBracketBond: tipsMarketData.get(gapActiveCusip), upperBracketBond: tipsMarketData.get(brackets.upperCUSIP),
        retained: heldGapLegs.filter(l => l.key === 'retained').map(l => ({ bond: tipsMarketData.get(l.cusip), qty0: l.qty })),
        refCPI, settlementDate, firstGapYear: Math.min(...gapYears),
        bondHolidays, rmdCouponMode, tradeDate, rmdLastDate: _rmdLastDateBefore,
      })
    : { simulated: new Map(), excess: new Map(), netCash: new Map() };
  const heldCoverCouponAbove = (year, remainingOnly) => {
    let s = 0;
    const soldExcess = [
      ...[...future30yCoverYearSet].map(cy => [cy, heldCoverExcessByYear[cy], bracketYearCUSIP[cy]]),
      ...heldGapLegs.map(l => [l.year, l.qty, l.cusip]),
    ];
    for (const [cy, qty, cusip] of soldExcess) {
      if (cy <= year || !(qty > 0)) continue;
      const cb = tipsMarketData.get(cusip);
      if (!cb) continue;
      const annual = qty * 1000 * calcIndexRatio(refCPI, cb.datedDateRefCpi ?? refCPI) * (cb.coupon ?? 0);
      s += remainingOnly ? annual / 2 * rmdCappedRemainingCoupons(cb.maturity, settlementDate, bondHolidays, rmdCouponMode, tradeDate, _rmdLastDateBefore) : annual;
    }
    return s;
  };

  // The gap year amounts as detail fields (After, then Before), next to the Future 30Y ones.
  const gapCreditDetail = (post, before) => ({
    gapSimulatedInterest: post?.gapSimulatedInterest ?? 0, gapSimulatedInterestBefore: before?.gapSimulatedInterest ?? 0,
    gapExcessInterest: post?.gapExcessInterest ?? 0, gapExcessInterestBefore: before?.gapExcessInterest ?? 0,
    gapNetCash: post?.gapNetCash ?? 0, gapNetCashBefore: before?.gapNetCash ?? 0,
  });

  // Before/After ARA calculations (totals + per-component breakdown for drill popup)
  const beforeARAByYear = {}, postARAByYear = {};
  const beforeARABreakdown = {}, postARABreakdown = {};
  for (const year of sortedToProcess) {
    let lBefore = 0;
    const useRemainingBefore = year === _settlementYearForARA;
    for (const y in araLaterMaturityInterestByYear) if (parseInt(y) > year) lBefore += useRemainingBefore ? araLaterMaturityInterestRemainingByYear[y] : araLaterMaturityInterestByYear[y];
    lBefore -= heldCoverCouponAbove(year, useRemainingBefore);
    let pB = 0, cB = 0, exIntB = 0;
    const holdingsBefore = [];
    if (yearInfo[year]) {
      for (const h of yearInfo[year].holdings) {
        const b = tipsMarketData.get(h.cusip);
        const ir = calcIndexRatio(refCPI, b?.datedDateRefCpi ?? refCPI);
        const ap = 1000 * ir;
        const isBT = (bracketYearSet.has(year) && h.cusip === buySellTargets[year]?.targetCUSIP);
        const qFunded = isBT ? Math.min(bracketTargetFundedYearQtyBefore[year] ?? 0, h.qty) : h.qty;
        // Held excess: a gap bracket's pays Same-Maturity Excess Interest; a cover's is 0 (the Cover
        // Excess is sold before it matures, DD §Same-Maturity Excess Interest).
        const qExcess = excessSoldYear(year) ? 0 : Math.max(0, h.qty - qFunded);
        const m = h.maturity.getMonth() + 1;
        pB += qFunded * ap; cB += qFunded * ap * b.coupon * (m < 7 ? 0.5 : 1.0);
        exIntB += qExcess * ap * b.coupon;
        holdingsBefore.push({ cusip: h.cusip, maturityMonth: m - 1, maturityYear: h.maturity.getFullYear(), qty: qFunded, principalPerBond: ap, nPeriods: m < 7 ? 1 : 2, coupon: b?.coupon ?? 0 });
      }
    }
    const inLadder = year >= firstYear && year <= lastYear;
    const simBefore   = inLadder ? (future30ySimulatedInterestBefore.get(year) ?? 0) : 0;
    const coverBefore = inLadder ? (future30yCoverInterestBefore.get(year) ?? 0) : 0;
    const netCashBefore = inLadder ? (future30yNetCashBefore.get(year) ?? 0) : 0;
    const gapSimBefore = inLadder ? (gapSimulatedInterestBefore.get(year) ?? 0) : 0;
    const gapExcessBefore = inLadder ? (gapExcessInterestBefore.get(year) ?? 0) : 0;
    const gapNetCashBeforeYear = inLadder ? (gapNetCashBefore.get(year) ?? 0) : 0;
    // "Before" = annual real amount from CURRENT holdings, via the SAME shared rule build/After use
    // (one computation, before-qtys), so a no-trade round-trip lands Before ≡ build per year. The
    // zeroed-year pre-ladder credit is applied only for OUR files (explicit per-year DARA block);
    // broker files (inferred DARA) keep their existing Before semantics until broker handling is
    // revisited (decision: honor the file we built; leave broker as-is for now).
    const hasExplicitDara = daraByYear != null;
    const yearDaraBefore = daraByYear?.get(year) ?? DARA;
    const { credit: pliCreditBefore, amount: beforeAmt } = fundedYearAmount({
      principal: pB, ownCoupon: cB, laterMatInt: lBefore, ownExcessCoupon: exIntB, simulatedInterest: simBefore, coverExcessInterest: coverBefore, netCash: netCashBefore,
      gapSimulatedInterest: gapSimBefore, gapExcessInterest: gapExcessBefore, gapNetCash: gapNetCashBeforeYear,
      dara: yearDaraBefore,
      isZeroed: hasExplicitDara && zeroedFundedYears.has(year),
      partialCredit: hasExplicitDara ? (pliCreditByFundedYear[year] ?? 0) : 0,
    });
    // Before-state cash is a plain addition, not a zeroing credit: the Before column reports what
    // the holder actually has on hand today, so the cash shows as its own line rather than being
    // reconciled into a rung that was never sized down.
    const cashCreditBefore = availableCashCreditBefore[year] ?? 0;
    beforeARAByYear[year] = beforeAmt + cashCreditBefore;
    beforeARABreakdown[year] = { principal: pB, ownCoupon: cB, laterMatInt: lBefore, ownExcessCoupon: exIntB, pliCredit: pliCreditBefore, holdings: holdingsBefore, future30ySimulatedInterest: simBefore, future30yCoverExcessInterest: coverBefore, future30yNetCash: netCashBefore, gapSimulatedInterest: gapSimBefore, gapExcessInterest: gapExcessBefore, gapNetCash: gapNetCashBeforeYear, availableCashCredit: cashCreditBefore };

    // Years outside [firstYear, lastYear] are not ladder rungs; their "Amount After" is 0.
    // LMI from later bonds flows to firstYear (the shortest rung), not to dropped years.
    const lAfter = (year >= firstYear && year <= lastYear) ? (yearLaterMatIntSnapshot[year] ?? 0) : 0;
    let pA = 0, cA = 0, exIntA = 0;
    const holdingsAfter = [];
    if (yearInfo[year]) {
      for (const h of yearInfo[year].holdings) {
        const b = tipsMarketData.get(h.cusip);
        const ir = calcIndexRatio(refCPI, b?.datedDateRefCpi ?? refCPI);
        const ap = 1000 * ir;
        const isBT = (bracketYearSet.has(year) && h.cusip === buySellTargets[year]?.targetCUSIP);
        
        const qFunded = isBT ? buySellTargets[year].targetFundedYearQty : (postRebalQtyMap[h.cusip] ?? h.qty);
        const qTotal  = isBT ? buySellTargets[year].targetQty : qFunded;
        const qExcess = qTotal - qFunded;

        const m = h.maturity.getMonth() + 1;
        pA += qFunded * ap; 
        cA += qFunded * ap * b.coupon * (m < 7 ? 0.5 : 1.0);
        if (!excessSoldYear(year)) exIntA += qExcess * ap * b.coupon;   // a bracket or cover year's is 0

        holdingsAfter.push({ cusip: h.cusip, maturityMonth: m - 1, maturityYear: h.maturity.getFullYear(), qty: qFunded, principalPerBond: ap, nPeriods: m < 7 ? 1 : 2, coupon: b?.coupon ?? 0 });
      }
    }
    // Include target CUSIP funded-year contribution when it has no current holdings (new bracket buy)
    { const _bst4 = buySellTargets[year];
      if (_bst4 && !yearInfo[year]?.holdings.some(h => h.cusip === _bst4.targetCUSIP)) {
        const _tb4 = tipsMarketData.get(_bst4.targetCUSIP);
        if (_tb4?.maturity) {
          const _ir4 = calcIndexRatio(refCPI, _tb4.datedDateRefCpi ?? refCPI);
          const _ap4 = 1000 * _ir4;
          const _m4 = _tb4.maturity.getMonth() + 1;
          
          const qF4 = _bst4.targetFundedYearQty;
          const qT4 = _bst4.targetQty;
          const qE4 = qT4 - qF4;

          pA += qF4 * _ap4;
          cA += qF4 * _ap4 * _tb4.coupon * (_m4 < 7 ? 0.5 : 1.0);
          if (!excessSoldYear(year)) exIntA += qE4 * _ap4 * _tb4.coupon;

          holdingsAfter.push({ cusip: _bst4.targetCUSIP, maturityMonth: _m4 - 1, maturityYear: _tb4.maturity.getFullYear(), qty: qF4, principalPerBond: _ap4, nPeriods: _m4 < 7 ? 1 : 2, coupon: _tb4.coupon ?? 0 });
        }
      }
    }
    // Same, for a diverged fundedCUSIP (maturityPref bought a maturity this year didn't already
    // hold) — pure funded contribution, no excess, since only targetCUSIP ever carries excess.
    { const _fc5 = fundedCUSIPByYear[year];
      if (_fc5 && _fc5 !== buySellTargets[year]?.targetCUSIP && !yearInfo[year]?.holdings.some(h => h.cusip === _fc5) && (postRebalQtyMap[_fc5] ?? 0) > 0) {
        const _tb5 = tipsMarketData.get(_fc5);
        if (_tb5?.maturity) {
          const _ir5 = calcIndexRatio(refCPI, _tb5.datedDateRefCpi ?? refCPI);
          const _ap5 = 1000 * _ir5;
          const _m5 = _tb5.maturity.getMonth() + 1;
          const qF5 = postRebalQtyMap[_fc5];

          pA += qF5 * _ap5;
          cA += qF5 * _ap5 * _tb5.coupon * (_m5 < 7 ? 0.5 : 1.0);

          holdingsAfter.push({ cusip: _fc5, maturityMonth: _m5 - 1, maturityYear: _tb5.maturity.getFullYear(), qty: qF5, principalPerBond: _ap5, nPeriods: _m5 < 7 ? 1 : 2, coupon: _tb5.coupon ?? 0 });
        }
      }
    }
    const simAfter   = (year >= firstYear && year <= lastYear) ? (future30ySimulatedInterestByYear.get(year) ?? 0) : 0;
    const coverAfter = (year >= firstYear && year <= lastYear) ? (future30yCoverInterestByYear.get(year) ?? 0) : 0;
    const netCashAfter = (year >= firstYear && year <= lastYear) ? (future30yNetCashByYear.get(year) ?? 0) : 0;
    const gapSimAfter = (year >= firstYear && year <= lastYear) ? (gapSimulatedInterestByYear.get(year) ?? 0) : 0;
    const gapExcessAfter = (year >= firstYear && year <= lastYear) ? (gapExcessInterestByYear.get(year) ?? 0) : 0;
    const gapNetCashAfter = (year >= firstYear && year <= lastYear) ? (gapNetCashByYear.get(year) ?? 0) : 0;
    // "After" ARA via the SAME shared rule build uses (ladder-core.fundedYearAmount), so After ≡
    // build by construction (locked by the "rebal After == build amount per year" test). sizeLadder
    // sizes the PLI pool against the PRELIMINARY later-mat interest (the approximation that decides
    // which years zero), but a row's ARA is built from the CORRECTED components (lAfter + own-year
    // excess coupon exIntA + Future 30Y interest and Net Cash); for a zeroed year the shared rule reconciles the credit to those.
    const yearDaraDisp = daraByYear?.get(year) ?? DARA;
    const { credit: pliCredit, amount: _postAmt } = fundedYearAmount({
      principal: pA, ownCoupon: cA, laterMatInt: lAfter, ownExcessCoupon: exIntA, simulatedInterest: simAfter, coverExcessInterest: coverAfter, netCash: netCashAfter,
      gapSimulatedInterest: gapSimAfter, gapExcessInterest: gapExcessAfter, gapNetCash: gapNetCashAfter,
      dara: yearDaraDisp, isZeroed: zeroedFundedYears.has(year),
      // The WHOLE credit the year took, cash and pre-ladder interest alike. A year the pool
      // covers in full is zeroed and topped up to DARA above, which carries its cash implicitly;
      // the one year the pool runs out partway through takes what is left as a partial credit,
      // and passing only the pre-ladder half there dropped the cash from the year's Amount. The
      // rung was sized down for that cash, so omitting it reported a year delivering less than
      // its target when nothing of the sort had happened. Build passes the whole credit here, so
      // this is also what keeps After identical to a build of the same ladder.
      partialCredit: creditByFundedYear[year] ?? 0,
    });
    postARAByYear[year] = _postAmt;
    postARABreakdown[year] = { principal: pA, ownCoupon: cA, laterMatInt: lAfter, holdings: holdingsAfter, pliCredit, future30ySimulatedInterest: simAfter, future30yCoverExcessInterest: coverAfter, future30yNetCash: netCashAfter, gapSimulatedInterest: gapSimAfter, gapExcessInterest: gapExcessAfter, gapNetCash: gapNetCashAfter, availableCashCredit: cashCreditByFundedYear[year] ?? 0 };
  }

  // Summary Metrics
  const lowerBondS = tipsMarketData.get(brackets.lowerCUSIP);
  const upperBondS = tipsMarketData.get(brackets.upperCUSIP);
  const lowerCostPerBond = (lowerBondS?.price ?? 0) / 100 * (calcIndexRatio(refCPI, lowerBondS?.datedDateRefCpi ?? refCPI)) * 1000;
  const upperCostPerBond = (upperBondS?.price ?? 0) / 100 * (calcIndexRatio(refCPI, upperBondS?.datedDateRefCpi ?? refCPI)) * 1000;

  const lowerPreviousExcessCost = Math.max(0, (yearInfo[brackets.lowerYear]?.holdings?.find(h=>h.cusip===brackets.lowerCUSIP)?.qty ?? 0) - (bracketTargetFundedYearQtyBefore[brackets.lowerYear] ?? 0)) * lowerCostPerBond;
  const upperPreviousExcessCost = Math.max(0, (yearInfo[brackets.upperYear]?.holdings?.find(h=>h.cusip===brackets.upperCUSIP)?.qty ?? 0) - (bracketTargetFundedYearQtyBefore[brackets.upperYear] ?? 0)) * upperCostPerBond;
  
  const lowerExcessCost = brackets.lowerYear != null
    ? ((buySellTargets[brackets.lowerYear]?.targetQty ?? 0) - (buySellTargets[brackets.lowerYear]?.targetFundedYearQty ?? 0)) * lowerCostPerBond
    : 0;
  const upperExcessCost = (buySellTargets[brackets.upperYear]?.targetQty - buySellTargets[brackets.upperYear]?.targetFundedYearQty) * upperCostPerBond;

  let newLowerPreviousExcessCost3 = 0, newLowerExcessCost3 = 0;
  let newLowerCostPerBond3 = 0;
  if (is3Bracket) {
    const nlBond = tipsMarketData.get(newLowerCUSIP);
    newLowerCostPerBond3 = (nlBond?.price ?? 0) / 100 * (calcIndexRatio(refCPI, nlBond?.datedDateRefCpi ?? refCPI)) * 1000;
    newLowerPreviousExcessCost3 = Math.max(0, (yearInfo[newLowerYear]?.holdings?.find(h=>h.cusip===newLowerCUSIP)?.qty ?? 0) - (bracketTargetFundedYearQtyBefore[newLowerYear] ?? 0)) * newLowerCostPerBond3;
    // Read the active bracket's own solved target directly (CUSIP-keyed, set at the bracketWeightsN
    // solve above) rather than buySellTargets[newLowerYear] — when the active bracket's year
    // coincides with the retained bracket's own year (both mature in the same calendar year),
    // buySellTargets[newLowerYear] holds the RETAINED CUSIP's target, not the active one's, and this
    // read the wrong bracket's numbers.
    newLowerExcessCost3 = bracketExcessTargetCost[newLowerCUSIP] ?? 0;
  }
  
  const totalPreviousExcessCost = lowerPreviousExcessCost + upperPreviousExcessCost + newLowerPreviousExcessCost3;
  const totalExcessCost = lowerExcessCost + upperExcessCost + newLowerExcessCost3;

  const beforeLowerWeight = totalPreviousExcessCost > 0 ? lowerPreviousExcessCost / totalPreviousExcessCost : null;
  const beforeUpperWeight = totalPreviousExcessCost > 0 ? upperPreviousExcessCost / totalPreviousExcessCost : null;
  const beforeNewLowerWeight = is3Bracket && totalPreviousExcessCost > 0 ? newLowerPreviousExcessCost3 / totalPreviousExcessCost : null;
  const afterLowerWeight = totalExcessCost > 0 ? lowerExcessCost / totalExcessCost : null;
  const afterUpperWeight = totalExcessCost > 0 ? upperExcessCost / totalExcessCost : null;
  const afterNewLowerWeight = is3Bracket && totalExcessCost > 0 ? newLowerExcessCost3 / totalExcessCost : null;

  const details = [], results = [], outLMI = {};
  for (let i = consolidatedHoldings.length - 1; i >= 0; i--) {
    const h = consolidatedHoldings[i];
    const isLast = (yearInfo[h.year].lastIdx === i);
    let lmi = 0;
    for (const y in outLMI) if (parseInt(y) > h.year) lmi += outLMI[y];

    let fy='', pFY=0, iFY=0, aFY=0, cFY=0, tQ=0, qD=0, tC=0, cD=0, aB=0, aA=0;
    if (isLast) {
      fy = h.year;
      for (const oh of yearInfo[h.year].holdings) {
        const b = tipsMarketData.get(oh.cusip);
        const ir = calcIndexRatio(refCPI, b?.datedDateRefCpi ?? refCPI);
        const ap = 1000 * ir;
        const m = oh.maturity.getMonth() + 1;
        pFY += oh.qty * ap; iFY += oh.qty * ap * b.coupon * (m < 7 ? 0.5 : 1.0);
        cFY += oh.qty * (b.price / 100 * ir * 1000);
      }
      iFY += lmi; aFY = pFY + iFY; aB = beforeARAByYear[h.year]; aA = postARAByYear[h.year];
      aFY += (beforeARABreakdown[h.year]?.future30ySimulatedInterest ?? 0) + (beforeARABreakdown[h.year]?.future30yCoverExcessInterest ?? 0) + (beforeARABreakdown[h.year]?.future30yNetCash ?? 0)
        + (beforeARABreakdown[h.year]?.gapSimulatedInterest ?? 0) + (beforeARABreakdown[h.year]?.gapExcessInterest ?? 0) + (beforeARABreakdown[h.year]?.gapNetCash ?? 0);
    }

    const b = tipsMarketData.get(h.cusip);
    const ir = calcIndexRatio(refCPI, b?.datedDateRefCpi ?? refCPI);
    const bst_loop = buySellTargets[h.year];
    let tFundedYearQty = 0;
    if (bst_loop && h.cusip === bst_loop.targetCUSIP) {
      tQ = bst_loop.targetQty; qD = bst_loop.qtyDelta; tC = bst_loop.targetCost; cD = bst_loop.costDelta; tFundedYearQty = bst_loop.targetFundedYearQty;
    } else if (nonTargetSells[h.cusip]) {
      const s = nonTargetSells[h.cusip]; tQ = s.newQty; qD = s.qtyDelta; tC = s.targetCost; cD = s.costDelta; tFundedYearQty = s.newQty;
    } else {
      tQ = h.qty; qD = 0; tC = h.qty * (b.price / 100 * ir * 1000); cD = 0; tFundedYearQty = h.qty;
    }

    if (!outLMI[h.year]) outLMI[h.year] = 0;
    outLMI[h.year] += tQ * 1000 * ir * b.coupon;

    // A same-maturity-year retained TIPS (DD §Bracket Year TIPS) is never `bst_loop.targetCUSIP` —
    // that names the Active Lower/Upper Bracket CUSIP for the year — so without this it would fall
    // through to the plain "unchanged holding" case below and its own funded/excess split (however
    // it was resolved above) would be lost, showing the entire holding as funded. Its own frozen
    // funded need overrides tFundedYearQty the same way `bst_loop`/`nonTargetSells` set it above.
    const sameYearOwnNeed = sameYearRetainedNeed.get(h.cusip);
    if (sameYearOwnNeed != null) tFundedYearQty = Math.min(h.qty, sameYearOwnNeed);
    const isBT = !!(bst_loop?.isBracket && h.cusip === bst_loop.targetCUSIP) || sameYearOwnNeed != null;
    const cpbHere = (b.price ?? 0) / 100 * ir * 1000;
    // Current-holdings split at a bracket year: how much of what's actually held counts as this
    // year's own funded rung vs. extra held for gap coverage. This is a pure holdings-interpretation
    // question — driven only by what the year needs (bracketTargetFundedYearQtyBefore, the funded-
    // first LMI/DARA formula) — and must NEVER reference the after-rebalance trade target. Any
    // "don't recommend a pointless simultaneous buy+sell" concern belongs entirely to the after-side
    // targeting logic (tFundedYearQty / buySellTargets above), not here — it must not leak back into
    // how we read the current holdings (see 3.0 §Named Quantities: the funded-first rule applies to
    // ALL standard bracket years, with no after-side exception).
    // - same-maturity-year retained TIPS: its own need (sameYearOwnNeed), never the year-keyed
    //   bracketTargetFundedYearQtyBefore — that speaks for the Active Lower/Upper Bracket CUSIP only.
    // - Format 4/5 (h.excessQty present): use explicit CSV value directly.
    // - every other bracket year: bracketTargetFundedYearQtyBefore (funded-first LMI/DARA formula).
    const exB = isBT && cpbHere > 0
      ? sameYearOwnNeed != null
        ? Math.max(0, h.qty - sameYearOwnNeed)
        : h.excessQty != null
          ? h.excessQty
          : Math.max(0, h.qty - (bracketTargetFundedYearQtyBefore[h.year] ?? 0))
      : 0;
    const exA = isBT ? tQ - tFundedYearQty : 0;

    // Honest current-holdings split — the funded-year side of the Before figures shown in the
    // table (single source, also used below for the `fundedYearQtyBefore` field).
    const fundedYearQtyBeforeHonest = isBT ? Math.max(0, h.qty - exB) : h.qty;

    // The actual trade to place, split between the funded-year and excess buckets. A bracket-target
    // CUSIP's funded and excess portions are the SAME held maturity, so a per-bucket subtraction of
    // Before from After is only a problem when the two buckets' naive deltas point in OPPOSITE
    // directions (one bucket would buy this maturity while the other sells it) — that's the only
    // case that manufactures a nonsensical simultaneous buy+sell of one bond. When both buckets move
    // the same direction (or one doesn't move at all), the honest Before split already reconciles
    // Before + Delta = After per bucket and must pass through unchanged. Before pricing any trade,
    // relabel (at zero cost) only as much as needed to cancel the opposing signs, then trade the
    // remaining shortfall/leftover in a single direction. This reallocation is for trade-sizing only;
    // it never changes the honest Before figures used for display (fundedYearQtyBefore/excessQtyBefore
    // above) — see 3.0 §Named Quantities.
    const naiveFundedDelta = tFundedYearQty - fundedYearQtyBeforeHonest;
    const naiveExcessDelta = exA - exB;
    let reallocFundedBefore = fundedYearQtyBeforeHonest, reallocExcessBefore = exB;
    if (isBT && naiveFundedDelta > 0 && naiveExcessDelta < 0) {
      const realloc = Math.min(naiveFundedDelta, -naiveExcessDelta);
      reallocFundedBefore = fundedYearQtyBeforeHonest + realloc;
      reallocExcessBefore = exB - realloc;
    } else if (isBT && naiveFundedDelta < 0 && naiveExcessDelta > 0) {
      const realloc = Math.min(-naiveFundedDelta, naiveExcessDelta);
      reallocFundedBefore = fundedYearQtyBeforeHonest - realloc;
      reallocExcessBefore = exB + realloc;
    }
    const fundedYearQtyDelta = tFundedYearQty - reallocFundedBefore;
    const excessQtyDelta = exA - reallocExcessBefore;

    const bForLMI = tipsMarketData.get(h.cusip);
    const irForLMI = calcIndexRatio(refCPI, bForLMI?.datedDateRefCpi ?? refCPI);
    const annIntPerBond = 1000 * irForLMI * (bForLMI?.coupon ?? 0);
    // Same-Maturity Excess Interest: 0 for a bracket or cover year (DD §Same-Maturity Excess Interest).
    const isSoldExcessYear = excessSoldYear(h.year);
    const excessLMI_B = isSoldExcessYear ? 0 : exB * annIntPerBond;
    const excessLMI_A = isSoldExcessYear ? 0 : exA * annIntPerBond;

    const piPB = calculatePIPerBond(h.cusip, h.maturity, refCPI, tipsMarketData);
    const mDuration = (b?.yield != null) ? calculateMDuration(settlementDate, h.maturity, b.coupon ?? 0, b.yield) : 0;

    details.unshift({
      cusip: h.cusip, maturityStr: fmtDate(h.maturity), fundedYear: h.year,
      coupon: b.coupon, yield: b.yield, saYield: b.saYield ?? null, price: b.price, datedDateRefCpi: b.datedDateRefCpi, refCPI, indexRatio: ir,
      principalPerBond: 1000 * ir, costPerBond: (b.price / 100 * ir * 1000),
      DARA: daraByYear?.get(h.year) ?? DARA,
      qtyBefore: h.qty, qtyAfter: tQ,
      // Displayed Before is the reallocated split, not the raw honest LMI-formula split
      // (fundedYearQtyBeforeHonest/exB): when the honest before/after per-bucket deltas would
      // otherwise point in opposite directions for this one held CUSIP (one bucket buying, the
      // other selling), that split is relabeled first so the number shown as "before" already
      // matches what the trade is actually computed against — Before + Delta = After always
      // reconciles, and the funded/excess split never implies a same-maturity buy+sell. In the
      // (usual) same-direction case reallocFundedBefore/reallocExcessBefore equal the honest split
      // exactly, so this changes nothing there. See 3.0 §Named Quantities.
      fundedYearQtyBefore: reallocFundedBefore,
      fundedYearQtyAfter: tFundedYearQty,
      isBracketTarget: isBT, isFuture30yCover: isBT && future30yCoverYearSet.has(h.year),
      isGapBracket: gapYears.length > 0 && (h.year === brackets.lowerYear || h.year === brackets.upperYear || (is3Bracket && h.year === newLowerYear)),
      excessQtyBefore: reallocExcessBefore, excessQtyAfter: exA,
      reallocFundedBefore, reallocExcessBefore, fundedYearQtyDelta, excessQtyDelta,
      excessLMI_Before: excessLMI_B, excessLMI_After: excessLMI_A,
      araBeforeTotal:    isLast ? aB : null, araAfterTotal:    isLast ? aA : null,
      araBeforePrincipal:   isLast ? (beforeARABreakdown[h.year]?.principal   ?? 0) : null,
      araBeforeOwnCoupon:   isLast ? (beforeARABreakdown[h.year]?.ownCoupon   ?? 0) : null,
      araBeforeLaterMatInt: isLast ? (beforeARABreakdown[h.year]?.laterMatInt ?? 0) : null,
      araBeforeHoldings:    isLast ? (beforeARABreakdown[h.year]?.holdings   ?? []) : null,
      araAfterPrincipal:    isLast ? (postARABreakdown[h.year]?.principal    ?? 0) : null,
      araAfterOwnCoupon:    isLast ? (postARABreakdown[h.year]?.ownCoupon    ?? 0) : null,
      araAfterLaterMatInt:  isLast ? (postARABreakdown[h.year]?.laterMatInt  ?? 0) : null,
      araAfterHoldings:     isLast ? (postARABreakdown[h.year]?.holdings     ?? []) : null,
      preLadderCreditForYear:      isLast ? (postARABreakdown[h.year]?.pliCredit   ?? 0) : null,
      preLadderCreditForYearBefore: isLast ? (beforeARABreakdown[h.year]?.pliCredit ?? 0) : null,
      future30ySimulatedInterest:       isLast ? (postARABreakdown[h.year]?.future30ySimulatedInterest ?? 0) : null,
      future30ySimulatedInterestBefore: isLast ? (beforeARABreakdown[h.year]?.future30ySimulatedInterest ?? 0) : null,
      future30yCoverExcessInterest:       isLast ? (postARABreakdown[h.year]?.future30yCoverExcessInterest ?? 0) : null,
      future30yCoverExcessInterestBefore: isLast ? (beforeARABreakdown[h.year]?.future30yCoverExcessInterest ?? 0) : null,
      future30yNetCash:       isLast ? (postARABreakdown[h.year]?.future30yNetCash ?? 0) : null,
      future30yNetCashBefore: isLast ? (beforeARABreakdown[h.year]?.future30yNetCash ?? 0) : null,
      ...(isLast ? gapCreditDetail(postARABreakdown[h.year], beforeARABreakdown[h.year]) : {}),
      availableCashCredit:       isLast ? (postARABreakdown[h.year]?.availableCashCredit ?? 0) : null,
      availableCashCreditBefore: isLast ? (beforeARABreakdown[h.year]?.availableCashCredit ?? 0) : null,
      nPeriods: (h.maturity.getMonth() + 1 < 7 ? 1 : 2),
      mDuration,
    });
    const rowDARA = daraByYear?.get(h.year) ?? DARA;
    const fundedPI_A = tFundedYearQty * piPB;
    results.unshift([
      h.cusip, h.qty, fmtDate(h.maturity), fy, 
      pFY, iFY, aFY, cFY, 
      tQ, qD, tC, cD, 
      aB, aB - rowDARA, aA, aA - rowDARA, 
      exB * piPB, exA * piPB,
      isLast ? (postARABreakdown[h.year]?.laterMatInt ?? 0) : '', // Trace: Incoming LMI
      isBT ? excessLMI_A : '', // Trace: Same-year excess interest
      isLast ? fundedPI_A : ''  // Trace: Funded P+I
    ]);
  }

  // Emit synthetic rows for a buy into targetCUSIP when that CUSIP itself has no current holdings
  // (e.g. 3-bracket newLowerYear, or an ordinary 'all'/saYield year whose top-ranked candidate is a
  // brand-new CUSIP the ladder never held before). Gated on the TARGET CUSIP specifically, not on
  // "this funded year has zero holdings of any kind" -- a year can already have other held CUSIPs
  // (already emitted via the main consolidatedHoldings loop above) while the target itself is still
  // a fresh buy that loop never sees, and that buy would otherwise vanish from the table/Trade
  // Ticket/export while still being counted in the year's Amount After total (3.0 §Named Quantities:
  // same "skipped 2035" vanishing-rung failure mode, at CUSIP granularity instead of year granularity).
  for (const [bYearStr, bst] of Object.entries(buySellTargets)) {
    const bYear = parseInt(bYearStr);
    if ((yearInfo[bYear]?.holdings ?? []).some(h => h.cusip === bst.targetCUSIP)) continue; // target already in main loop
    if (!(bst.qtyDelta > 0)) continue; // no buy
    const tb = tipsMarketData.get(bst.targetCUSIP);
    if (!tb?.maturity) continue;
    const ir = calcIndexRatio(refCPI, tb.datedDateRefCpi ?? refCPI);
    const cpb = (tb.price ?? 0) / 100 * ir * 1000;
    const piPB = calculatePIPerBond(bst.targetCUSIP, tb.maturity, refCPI, tipsMarketData);
    const m = tb.maturity.getMonth() + 1;
    let lmiBefore = 0;
    for (const y in araLaterMaturityInterestByYear) if (parseInt(y) > bYear) lmiBefore += araLaterMaturityInterestByYear[y];
    const araB = beforeARAByYear[bYear] ?? lmiBefore;
    const araA = postARAByYear[bYear] ?? 0;
    const rowDARA = daraByYear?.get(bYear) ?? DARA;
    const exA = bst.targetQty - bst.targetFundedYearQty;
    const bondForSyn = tipsMarketData.get(bst.targetCUSIP);
    const irForSyn = calcIndexRatio(refCPI, bondForSyn?.datedDateRefCpi ?? refCPI);
    const excessLMI = excessSoldYear(bYear) ? 0 : exA * 1000 * irForSyn * (bondForSyn?.coupon ?? 0);
    
    const holdingsAfterSyn = [{ 
      cusip: bst.targetCUSIP, maturityMonth: m - 1, maturityYear: tb.maturity.getFullYear(), 
      qty: bst.targetFundedYearQty, principalPerBond: 1000 * ir, nPeriods: m < 7 ? 1 : 2, coupon: tb.coupon ?? 0 
    }];

    const newDetail = {
      cusip: bst.targetCUSIP, maturityStr: fmtDate(tb.maturity), fundedYear: bYear,
      coupon: tb.coupon, yield: tb.yield, saYield: tb.saYield ?? null, price: tb.price, datedDateRefCpi: tb.datedDateRefCpi, refCPI, indexRatio: ir,
      principalPerBond: 1000 * ir, costPerBond: cpb, DARA: rowDARA,
      qtyBefore: 0, qtyAfter: bst.targetQty,
      fundedYearQtyBefore: 0, fundedYearQtyAfter: bst.targetFundedYearQty,
      isBracketTarget: bst.isBracket, isFuture30yCover: bst.isBracket && future30yCoverYearSet.has(bYear),
      isGapBracket: gapYears.length > 0 && (bYear === brackets.lowerYear || bYear === brackets.upperYear || (is3Bracket && bYear === newLowerYear)),
      excessQtyBefore: 0, excessQtyAfter: exA,
      // Nothing held yet, so there is nothing to reallocate — the whole target is a straight buy.
      reallocFundedBefore: 0, reallocExcessBefore: 0,
      fundedYearQtyDelta: bst.targetFundedYearQty, excessQtyDelta: exA,
      excessLMI_Before: 0, excessLMI_After: excessLMI,
      araBeforeTotal: araB, araAfterTotal: araA,
      araBeforePrincipal: 0, araBeforeOwnCoupon: 0, araBeforeLaterMatInt: lmiBefore,
      araBeforeHoldings: [],
      araAfterPrincipal: bst.targetFundedYearQty * 1000 * ir,
      araAfterOwnCoupon: bst.targetFundedYearQty * 1000 * ir * tb.coupon * (m < 7 ? 0.5 : 1.0),
      araAfterLaterMatInt: yearLaterMatIntSnapshot[bYear] ?? 0,
      araAfterHoldings: holdingsAfterSyn,
      preLadderCreditForYear: postARABreakdown[bYear]?.pliCredit ?? 0,
      preLadderCreditForYearBefore: beforeARABreakdown[bYear]?.pliCredit ?? 0,
      future30ySimulatedInterest:       postARABreakdown[bYear]?.future30ySimulatedInterest ?? 0,
      future30ySimulatedInterestBefore: beforeARABreakdown[bYear]?.future30ySimulatedInterest ?? 0,
      future30yCoverExcessInterest:       postARABreakdown[bYear]?.future30yCoverExcessInterest ?? 0,
      future30yCoverExcessInterestBefore: beforeARABreakdown[bYear]?.future30yCoverExcessInterest ?? 0,
      future30yNetCash:       postARABreakdown[bYear]?.future30yNetCash ?? 0,
      future30yNetCashBefore: beforeARABreakdown[bYear]?.future30yNetCash ?? 0,
      ...gapCreditDetail(postARABreakdown[bYear], beforeARABreakdown[bYear]),
      availableCashCredit:       postARABreakdown[bYear]?.availableCashCredit ?? 0,
      availableCashCreditBefore: beforeARABreakdown[bYear]?.availableCashCredit ?? 0,
      nPeriods: m < 7 ? 1 : 2,
      mDuration: (tb?.yield != null) ? calculateMDuration(settlementDate, tb.maturity, tb.coupon ?? 0, tb.yield) : 0,
    };
    const fundedPI_A = bst.targetFundedYearQty * piPB;
    const newResult = [
      bst.targetCUSIP, 0, fmtDate(tb.maturity), bYear,
      0, lmiBefore, lmiBefore, 0,
      bst.targetQty, bst.qtyDelta, bst.targetCost, bst.costDelta,
      araB, araB - rowDARA, araA, araA - rowDARA, 0, exA * piPB,
      yearLaterMatIntSnapshot[bYear] ?? 0, // Trace: Incoming LMI
      excessLMI, // Trace: Same-year excess interest
      fundedPI_A  // Trace: Funded P+I
    ];
    const ri = details.findIndex(d => d.fundedYear > bYear);
    if (ri >= 0) { results.splice(ri, 0, newResult); details.splice(ri, 0, newDetail); }
    else { results.push(newResult); details.push(newDetail); }
  }

  // Same, for a diverged fundedCUSIP that is itself a fresh buy — maturityPref resolved this
  // bracket year's funded need onto a maturity it never held before, distinct from targetCUSIP
  // (the excess row, handled above). Pure funded contribution, no excess (3.0 §Target CUSIP
  // resolution) — otherwise the same "vanishing rung" gap the targetCUSIP loop above exists for.
  for (const [bYearStr, fc] of Object.entries(fundedCUSIPByYear)) {
    const bYear = parseInt(bYearStr);
    const bst = buySellTargets[bYear];
    if (!bst || !fc || fc === bst.targetCUSIP) continue;          // not diverged
    if ((yearInfo[bYear]?.holdings ?? []).some(h => h.cusip === fc)) continue; // already in main loop
    const ns = nonTargetSells[fc];
    if (!ns || !(ns.qtyDelta > 0)) continue;                      // no buy
    const tb = tipsMarketData.get(fc);
    if (!tb?.maturity) continue;
    const ir = calcIndexRatio(refCPI, tb.datedDateRefCpi ?? refCPI);
    const cpb = (tb.price ?? 0) / 100 * ir * 1000;
    const piPB = calculatePIPerBond(fc, tb.maturity, refCPI, tipsMarketData);
    const m = tb.maturity.getMonth() + 1;
    let lmiBefore = 0;
    for (const y in araLaterMaturityInterestByYear) if (parseInt(y) > bYear) lmiBefore += araLaterMaturityInterestByYear[y];
    const araB = beforeARAByYear[bYear] ?? lmiBefore;
    const araA = postARAByYear[bYear] ?? 0;
    const rowDARA = daraByYear?.get(bYear) ?? DARA;

    const holdingsAfterSyn = [{
      cusip: fc, maturityMonth: m - 1, maturityYear: tb.maturity.getFullYear(),
      qty: ns.newQty, principalPerBond: 1000 * ir, nPeriods: m < 7 ? 1 : 2, coupon: tb.coupon ?? 0
    }];

    const newDetail = {
      cusip: fc, maturityStr: fmtDate(tb.maturity), fundedYear: bYear,
      coupon: tb.coupon, yield: tb.yield, saYield: tb.saYield ?? null, price: tb.price, datedDateRefCpi: tb.datedDateRefCpi, refCPI, indexRatio: ir,
      principalPerBond: 1000 * ir, costPerBond: cpb, DARA: rowDARA,
      qtyBefore: 0, qtyAfter: ns.newQty,
      fundedYearQtyBefore: 0, fundedYearQtyAfter: ns.newQty,
      isBracketTarget: false, isFuture30yCover: false,
      isGapBracket: gapYears.length > 0 && (bYear === brackets.lowerYear || bYear === brackets.upperYear || (is3Bracket && bYear === newLowerYear)),
      excessQtyBefore: 0, excessQtyAfter: 0,
      reallocFundedBefore: 0, reallocExcessBefore: 0,
      fundedYearQtyDelta: ns.newQty, excessQtyDelta: 0,
      excessLMI_Before: 0, excessLMI_After: 0,
      araBeforeTotal: araB, araAfterTotal: araA,
      araBeforePrincipal: 0, araBeforeOwnCoupon: 0, araBeforeLaterMatInt: lmiBefore,
      araBeforeHoldings: [],
      araAfterPrincipal: ns.newQty * 1000 * ir,
      araAfterOwnCoupon: ns.newQty * 1000 * ir * tb.coupon * (m < 7 ? 0.5 : 1.0),
      araAfterLaterMatInt: yearLaterMatIntSnapshot[bYear] ?? 0,
      araAfterHoldings: holdingsAfterSyn,
      preLadderCreditForYear: postARABreakdown[bYear]?.pliCredit ?? 0,
      preLadderCreditForYearBefore: beforeARABreakdown[bYear]?.pliCredit ?? 0,
      future30ySimulatedInterest:       postARABreakdown[bYear]?.future30ySimulatedInterest ?? 0,
      future30ySimulatedInterestBefore: beforeARABreakdown[bYear]?.future30ySimulatedInterest ?? 0,
      future30yCoverExcessInterest:       postARABreakdown[bYear]?.future30yCoverExcessInterest ?? 0,
      future30yCoverExcessInterestBefore: beforeARABreakdown[bYear]?.future30yCoverExcessInterest ?? 0,
      future30yNetCash:       postARABreakdown[bYear]?.future30yNetCash ?? 0,
      future30yNetCashBefore: beforeARABreakdown[bYear]?.future30yNetCash ?? 0,
      ...gapCreditDetail(postARABreakdown[bYear], beforeARABreakdown[bYear]),
      availableCashCredit:       postARABreakdown[bYear]?.availableCashCredit ?? 0,
      availableCashCreditBefore: beforeARABreakdown[bYear]?.availableCashCredit ?? 0,
      nPeriods: m < 7 ? 1 : 2,
      mDuration: (tb?.yield != null) ? calculateMDuration(settlementDate, tb.maturity, tb.coupon ?? 0, tb.yield) : 0,
    };
    const fundedPI_A = ns.newQty * piPB;
    const newResult = [
      fc, 0, fmtDate(tb.maturity), bYear,
      0, lmiBefore, lmiBefore, 0,
      ns.newQty, ns.qtyDelta, ns.targetCost, ns.costDelta,
      araB, araB - rowDARA, araA, araA - rowDARA, 0, 0,
      yearLaterMatIntSnapshot[bYear] ?? 0, // Trace: Incoming LMI
      0, // Trace: Same-year excess interest (none — this row is pure funded)
      fundedPI_A  // Trace: Funded P+I
    ];
    const ri2 = details.findIndex(d => d.fundedYear > bYear);
    if (ri2 >= 0) { results.splice(ri2, 0, newResult); details.splice(ri2, 0, newDetail); }
    else { results.push(newResult); details.push(newDetail); }
  }

  // Emit the active lower bracket's own buy when its maturity year coincides with the retained
  // bracket's own year (2.0 §Retained Bracket Excess; 3.0 §Bracket Identification Rules). The
  // per-year loop above can only assign one CUSIP to a bracket year's `targetCUSIP` slot, and that
  // slot stays on the retained CUSIP (brackets.lowerCUSIP) so its own excess/funded split keeps
  // working. When the active lower bracket (newLowerCUSIP) happens to mature in that SAME
  // calendar year, its own solved share (bracketExcessTargetCost[newLowerCUSIP], from
  // bracketWeightsN) never gets a row anywhere — the same "vanishing rung" gap the two loops
  // above exist for, one layer down: two CUSIPs sharing one year instead of a CUSIP with no prior
  // holdings.
  if (is3Bracket && newLowerYear === brackets.lowerYear && newLowerCUSIP
      && !(yearInfo[newLowerYear]?.holdings ?? []).some(h => h.cusip === newLowerCUSIP)) {
    const nlBond = tipsMarketData.get(newLowerCUSIP);
    const exA = newLowerCostPerBond3 > 0 ? Math.max(0, Math.round((bracketExcessTargetCost[newLowerCUSIP] || 0) / newLowerCostPerBond3)) : 0;
    if (nlBond?.maturity && exA > 0) {
      const bYear = newLowerYear;
      const ir = calcIndexRatio(refCPI, nlBond.datedDateRefCpi ?? refCPI);
      const piPB = calculatePIPerBond(newLowerCUSIP, nlBond.maturity, refCPI, tipsMarketData);
      const m = nlBond.maturity.getMonth() + 1;
      const araB = beforeARAByYear[bYear] ?? 0;
      const araA = postARAByYear[bYear] ?? 0;
      const rowDARA = daraByYear?.get(bYear) ?? DARA;
      const excessLMI = exA * 1000 * ir * (nlBond.coupon ?? 0);
      const targetCost = exA * newLowerCostPerBond3;

      const newDetail = {
        cusip: newLowerCUSIP, maturityStr: fmtDate(nlBond.maturity), fundedYear: bYear,
        coupon: nlBond.coupon, yield: nlBond.yield, saYield: nlBond.saYield ?? null, price: nlBond.price, datedDateRefCpi: nlBond.datedDateRefCpi, refCPI, indexRatio: ir,
        principalPerBond: 1000 * ir, costPerBond: newLowerCostPerBond3, DARA: rowDARA,
        qtyBefore: 0, qtyAfter: exA,
        fundedYearQtyBefore: 0, fundedYearQtyAfter: 0,
        isBracketTarget: true, isFuture30yCover: false, isGapBracket: true,
        excessQtyBefore: 0, excessQtyAfter: exA,
        reallocFundedBefore: 0, reallocExcessBefore: 0,
        fundedYearQtyDelta: 0, excessQtyDelta: exA,
        excessLMI_Before: 0, excessLMI_After: excessLMI,
        // This row never carries the year's aggregate totals — the retained CUSIP's row (already
        // emitted by the main loop, same as every non-last row there) owns those.
        araBeforeTotal: null, araAfterTotal: null,
        araBeforePrincipal: null, araBeforeOwnCoupon: null, araBeforeLaterMatInt: null, araBeforeHoldings: null,
        araAfterPrincipal: null, araAfterOwnCoupon: null, araAfterLaterMatInt: null, araAfterHoldings: null,
        preLadderCreditForYear: null, preLadderCreditForYearBefore: null,
        future30ySimulatedInterest: null, future30ySimulatedInterestBefore: null,
        future30yCoverExcessInterest: null, future30yCoverExcessInterestBefore: null,
        future30yNetCash: null, future30yNetCashBefore: null,
        availableCashCredit: null, availableCashCreditBefore: null,
        nPeriods: m < 7 ? 1 : 2,
        mDuration: (nlBond?.yield != null) ? calculateMDuration(settlementDate, nlBond.maturity, nlBond.coupon ?? 0, nlBond.yield) : 0,
      };
      const fundedPI_A = 0;
      const newResult = [
        newLowerCUSIP, 0, fmtDate(nlBond.maturity), bYear,
        0, 0, 0, 0,
        exA, exA, targetCost, -targetCost,
        araB, araB - rowDARA, araA, araA - rowDARA, 0, exA * piPB,
        yearLaterMatIntSnapshot[bYear] ?? 0, // Trace: Incoming LMI
        excessLMI, // Trace: Same-year excess interest
        fundedPI_A  // Trace: Funded P+I
      ];
      const ri3 = details.findIndex(d => d.fundedYear > bYear);
      if (ri3 >= 0) { results.splice(ri3, 0, newResult); details.splice(ri3, 0, newDetail); }
      else { results.push(newResult); details.push(newDetail); }
    }
  }

  // Emit display rows for canonical ladder rungs that are FULLY COVERED — zeroed by PLI, or by
  // later-maturity interest — so they have no holding AND no buy (target qty 0). Build always
  // renders every ladder year; rebalance previously emitted rows only from holdings + buys, so
  // such a rung silently vanished from the table (the "skipped 2035" bug). The row is purely
  // informational: qtyBefore = qtyAfter = 0, and Amount After = the year's DARA (postARAByYear,
  // which is build-consistent). Mirrors build's per-year row for a zeroed funded year.
  {
    const emittedYears = new Set(details.map(d => d.fundedYear));
    for (const year of _canon.rangeYears) {
      if (year < firstYear || year > lastYear || emittedYears.has(year)) continue;
      const bond = _canon.yearBondMap[year];
      if (!bond?.maturity) continue;
      const ir = calcIndexRatio(refCPI, bond.datedDateRefCpi ?? refCPI);
      const cpb = (bond.price ?? 0) / 100 * ir * 1000;
      const m = bond.maturity.getMonth() + 1;
      const araB = beforeARAByYear[year] ?? 0;
      const araA = postARAByYear[year] ?? 0;
      const rowDARA = daraByYear?.get(year) ?? DARA;
      const bd = postARABreakdown[year] || {};
      const bbd = beforeARABreakdown[year] || {};
      const newDetail = {
        cusip: bond.cusip, maturityStr: fmtDate(bond.maturity), fundedYear: year,
        coupon: bond.coupon, yield: bond.yield, saYield: bond.saYield ?? null, price: bond.price, datedDateRefCpi: bond.datedDateRefCpi, refCPI, indexRatio: ir,
        principalPerBond: 1000 * ir, costPerBond: cpb, DARA: rowDARA,
        qtyBefore: 0, qtyAfter: 0, fundedYearQtyBefore: 0, fundedYearQtyAfter: 0,
        isBracketTarget: false, isFuture30yCover: false,
        isGapBracket: gapYears.length > 0 && (year === brackets.lowerYear || year === brackets.upperYear || (is3Bracket && year === newLowerYear)),
        excessQtyBefore: 0, excessQtyAfter: 0,
        reallocFundedBefore: 0, reallocExcessBefore: 0, fundedYearQtyDelta: 0, excessQtyDelta: 0,
        excessLMI_Before: 0, excessLMI_After: 0,
        araBeforeTotal: araB, araAfterTotal: araA,
        araBeforePrincipal: bbd.principal ?? 0, araBeforeOwnCoupon: bbd.ownCoupon ?? 0,
        araBeforeLaterMatInt: bbd.laterMatInt ?? 0, araBeforeHoldings: bbd.holdings ?? [],
        araAfterPrincipal: bd.principal ?? 0, araAfterOwnCoupon: bd.ownCoupon ?? 0,
        araAfterLaterMatInt: bd.laterMatInt ?? 0, araAfterHoldings: bd.holdings ?? [],
        preLadderCreditForYear: bd.pliCredit ?? 0,
        preLadderCreditForYearBefore: bbd.pliCredit ?? 0,
        future30ySimulatedInterest: bd.future30ySimulatedInterest ?? 0,
        future30ySimulatedInterestBefore: bbd.future30ySimulatedInterest ?? 0,
        future30yCoverExcessInterest: bd.future30yCoverExcessInterest ?? 0,
        future30yCoverExcessInterestBefore: bbd.future30yCoverExcessInterest ?? 0,
        future30yNetCash: bd.future30yNetCash ?? 0,
        future30yNetCashBefore: bbd.future30yNetCash ?? 0,
        ...gapCreditDetail(bd, bbd),
        availableCashCredit: bd.availableCashCredit ?? 0,
        availableCashCreditBefore: bbd.availableCashCredit ?? 0,
        nPeriods: m < 7 ? 1 : 2,
        mDuration: (bond.yield != null) ? calculateMDuration(settlementDate, bond.maturity, bond.coupon ?? 0, bond.yield) : 0,
      };
      const newResult = [
        bond.cusip, 0, fmtDate(bond.maturity), year,
        0, (bd.laterMatInt ?? 0), araA, 0,
        0, 0, 0, 0,
        araB, araB - rowDARA, araA, araA - rowDARA, 0, 0,
        bd.laterMatInt ?? 0, '', 0,
      ];
      const ri = details.findIndex(d => d.fundedYear > year);
      if (ri >= 0) { results.splice(ri, 0, newResult); details.splice(ri, 0, newDetail); }
      else { results.push(newResult); details.push(newDetail); }
    }
  }

  const costDeltaSum = results.reduce((s, r) => s + (typeof r[11] === 'number' ? r[11] : 0), 0);
  const costForNewRungs = Object.values(buySellTargets).reduce((s, bst) => s + (bst.isBracket ? 0 : Math.max(0, bst.targetCost)), 0);
  const gapCoverageSurplus = totalPreviousExcessCost - costForNewRungs - (gapParams.totalCost || 0);

  details.forEach(d => { d.mktValue = d.qtyAfter * d.costPerBond; });
  const _mktCosts = details.map(d => d.mktValue);
  const weightedAvgDuration = calcMktWtdAvg(details.map(d => d.mDuration), _mktCosts);
  const weightedAvgYield    = calcMktWtdAvg(details.map(d => d.yield),     _mktCosts);
  const weightedAvgSaYield  = calcMktWtdAvg(details.map(d => d.saYield),   _mktCosts);

  const HDR = ['CUSIP','Qty','Maturity','FY','Principal','Interest','ARA','Cost','Target Qty','Qty Delta','Target Cost','Cost Delta','ARA (Before)','ARA-DARA Before','ARA (After)','ARA-DARA After','Excess ARA Before','Excess ARA After','Incoming LMI','Excess Interest','Funded PI'];

  // Resolved per-year DARA for EVERY year in [firstYear, lastYear] (incl. gap + future-30Y).
  // Persisted on export as the `#fundedYear,dara` block so a re-import is exact. See 2.1 Export.
  const daraByYearResolved = new Map();
  for (let y = firstYear; y <= lastYear; y++) daraByYearResolved.set(y, daraByYear?.get(y) ?? DARA);

  return { results, HDR, summary: { settleDateDisp, refCPI, DARA, daraByYearResolved, inferredDARA, daraIsInferred: dara === null, settlementYear, availableCash, rmdCouponMode, firstYear, lastYear, derivedFirstYear, rungCount, gapYears, future30yYears, brackets, lowerWeight, upperWeight, costDeltaSum, costForNewRungs, gapCoverageSurplus, gapParams, bracketMode, lowerDuration, upperDuration, newLowerYear, newLowerCUSIP, newLowerMaturity, newLowerDuration, newLowerWeight3, origLowerWeight, retainedLegs, bracketFellBack3to2, bracketSolveReason, retainedExcessCostBefore, retainedBracketSold, beforeLowerWeight, beforeUpperWeight, beforeNewLowerWeight, afterLowerWeight, afterUpperWeight, afterNewLowerWeight, totalPreviousExcessCost, totalExcessCost, araByYear, future30yLowerYear, future30yUpperYear, future30yLowerCoverCUSIP: future30yLowerCoverBond?.cusip, future30yUpperCoverCUSIP: future30yUpperCoverBond?.cusip, future30yParams, future30yLowerDuration, future30yUpperDuration, future30yUpperWeight, future30yLowerWeight, future30yUpperExQty, future30yLowerExQty, future30yFellBack, future30yCoverReason, future30yLowerMonth, future30yUpperMonth, future30ySimulatedInterestByYear, future30yCoverInterestByYear, future30yNetCashByYear, future30yRebalances: _sl.future30yRebalances, future30yRebalancesBefore, future30ySimulatedInterestBefore, future30yCoverInterestBefore, future30yNetCashBefore, heldCoverExcessByYear, gapRebalances: gapRebalancesAfter, gapRebalancesBefore, gapSimulatedInterestByYear, gapExcessInterestByYear, gapNetCashByYear, gapSimulatedInterestBefore, gapExcessInterestBefore, gapNetCashBefore, heldGapExcessByYear, preLadderGapPool, future30yAnchorBond: _canon.future30yAnchorBond, syntheticYearAmounts: syntheticYearAmounts({ gapParams, future30yParams }), syntheticYearAmountsBefore: syntheticYearAmounts({ gapParams: gapParamsBefore, future30yParams: future30yParamsBefore }), preLadderInterest, maturityPref, preLadderPool, preLadderCouponPool, preLadderFuture30yPool, preLadderNetCashPool, zeroedFundedYears: [...zeroedFundedYears].sort((a, b) => a - b), weightedAvgDuration, weightedAvgYield, weightedAvgSaYield }, details };
}

// Execute a rebalance with shape-preserving self-financing FUNDING (3.0 §Funding the rebalance).
// This is the orchestration the Run button performs, lifted out of the UI so it has one home and is
// unit-testable:
//   1. Run the rebalance on the given per-year DARA map directly. This honors the map as-is —
//      including intentional empty rungs (a year the user holds none of stays a hole).
//   2. Self-financing exists ONLY to size a plan the tool itself inferred from current holdings (no
//      stated DARA at all — a broker/legacy file). If the ladder has a gap-year / Future-30Y block to
//      duration-match (learned from the engine's own `summary.gapYears` / `summary.future30yYears`)
//      AND the plan is a derived Per-Year DARA not edited, re-run with a self-financing scale so the
//      funded rungs sell down to fund the bracket excess. With no such block there is nothing to buy
//      — the direct run already nets to ≈0 and is returned unchanged.
//
// A STATED plan — the DARA came from the holder, whether typed into the per-year panel, a selection
// Set DARA, or loaded from a file (our CUSIP/Qty export or a standalone DARA-plan file) — is never
// scaled, edited or not, pinned rows or not. It is the holder's target, run exactly as stated; a
// negative net cash on the report is the tool's honest answer to "here is what reaching that target
// costs beyond what the ladder returns on its own" — the holder funds the difference, the same as a
// negative net cash reads today after a manual per-rung raise. (A hand-edited derived Per-Year DARA from a broker/legacy file —
// no stated block at all — keeps the old all-or-nothing behaviour: any edit switches the scale off
// entirely, since there is no stated shape underneath it to fall back to.)
//
// REGRESSION HISTORY: this scale-application step was accidentally deleted in commit c0d233b
// (2026-07-16, an unrelated Ref CPI/Index Ratio rounding refactor) — the flag kept being
// computed and passed in from index.html, but this function silently stopped acting on it, so every
// Run of a derived Per-Year DARA with a gap/Future-30Y block produced large non-self-financing net cash (funded
// years weren't sold down at all). It went undetected for 9 days because the only unit test covering
// this function exercised the gap-free NO-OP path, never the actual scale-application path — see the
// paired test below ("runFundedRebalance — gap year or Future 30Y funding: scale actually applies").
// A LATER regression (found 2026-09-28, real account): the scale was extended to stated plans too
// (an unedited stated plan, or a stated plan with any row pinned), on the reasoning that an aged
// export's DARA — restated upward to a newer Ref CPI date — might no longer pay for itself. That
// silently overrode a holder's own explicit DARA increase (e.g. adding cash to the ladder by raising
// every rung to a higher stated target) back down to whatever the current holdings alone support,
// which is exactly the outcome a stated plan exists to prevent. Reverted: self-financing is scoped to
// derived Per-Year DARA only, per the ruling above.
export function runFundedRebalance({
  dara, bracketMode = '2bracket', holdings, tipsMarketData, refCPI, settlementDate,
  daraByYear = null, daraPlanUnedited = false, daraPlanIsStated = false,
  lastYearOverride = null, firstYearOverride = null, preLadderInterest = false, maturityPref = 'last',
  allocationPolicy = 'equal', yearRankOverrides = null, yearOverrides = null, bondHolidays = new Set(),
  availableCash = 0, rmdCouponMode = 'all', tradeDate = settlementDate,
}) {
  const base = { dara, bracketMode, holdings, tipsMarketData, refCPI, settlementDate,
    lastYearOverride, firstYearOverride, preLadderInterest, maturityPref,
    allocationPolicy, yearRankOverrides, yearOverrides, bondHolidays, availableCash, rmdCouponMode, tradeDate };
  let result = runRebalance({ ...base, daraByYear });
  // A structural gap year in range is not, by itself, evidence this ladder means to bridge it
  // (hasGapCoverageIntent above) — only a held excess at the Upper Bracket year is. Future 30Y
  // funding has its own, unrelated trigger (years beyond the last issued TIPS) and is unaffected.
  const gapCoverageIntent = result.summary.gapYears.length > 0
    && hasGapCoverageIntent(holdings, tipsMarketData, refCPI, result.summary.lastYear);
  const needsFunding = gapCoverageIntent || result.summary.future30yYears.length > 0;
  if (needsFunding && !daraPlanIsStated && daraPlanUnedited) {
    // Recover the shape from the portfolio's own ARA (range form: fills every empty in-range year at
    // its incoming-LMI stub, matching the display panel's derived Per-Year DARA, instead of the held-years-only
    // form silently dropping them — without this, an unheld year had no entry in daraMap at all,
    // buildMap() below never wrote it into a trial's daraByYear, and runRebalance's own
    // `daraByYear?.get(year) ?? DARA` fallback sized it as a full rung at the scalar DARA -- a
    // phantom buy the search then read as "excess to fund" and sold the rest of the ladder down to
    // pay for (3.0 §Funding the rebalance)).
    const rawARA = computePortfolioARAByYear(holdings, tipsMarketData, refCPI, { firstYear: result.summary.firstYear, lastYear: result.summary.lastYear });
    const _gapYearsInRange = new Set(getGapYears(tipsMarketData).filter(y => y >= result.summary.firstYear && y <= result.summary.lastYear));
    const { daraMap } = derivePerYearDara(rawARA, getGapYearBracketCandidates(tipsMarketData, result.summary.lastYear), _gapYearsInRange, gapCoverageIntent);
    try {
      const { scaledMap, scaledMedian } = inferScaledDARAFromPortfolio({
        daraMap, holdings, tipsMarketData, refCPI, settlementDate,
        bracketMode, lastYearOverride, firstYearOverride, preLadderInterest, flat: false, bondHolidays,
        availableCash, rmdCouponMode, tradeDate,
        maturityPref, allocationPolicy, yearRankOverrides, yearOverrides, correctCoverIncome: true,
      });
      result = runRebalance({ ...base, dara: scaledMedian, daraByYear: scaledMap });
    } catch {
      // No self-financing level exists for this derived Per-Year DARA. Keep the direct-run result; its net cash
      // carries the shortfall (3.0 §Funding).
    }
  }
  return result;
}
