// tips-reference-rows.js — the TIPS Reference Rows (DD §6.7): one row per TIPS of TIPS reference
// data (S2), with its quote, Term, durations, and the figures at the Settlement Ref CPI and at the
// Interest Ref CPI Date. Specs: TipsReference/knowledge/6.1_Load_TIPS_Data.md and
// 6.2_Calculate_Index_Ratios_And_Coupons.md. SharedModules.md M24.
//
// TipsReference and the TIPS Reference popup of TipsLadderManager both build their table from
// these functions, so the two show the same figure for the same TIPS.

import { lookupRefCpi, indexRatio, TREASURY_ROUNDING, NO_ROUNDING } from './ref-cpi.js';
import { calculateDuration, calculateMDuration, termYears, accruedInterestAdjusted, _nextCouponOnOrAfter } from './bond-math.js';
import { localDate, toIsoDate, actualPaymentDate, todayEt } from './settlement.js';

// The payment date of a maturity or coupon date: the next bond trading day when it falls on a weekend or a Bond Holiday.
function effectivePaymentDate(isoStr, bondHolidays) {
  return toIsoDate(actualPaymentDate(localDate(isoStr), bondHolidays));
}

// 6.1 and 6.2 §Index Ratio and Adj Price. `quotes` is any iterable of { cusip, price, yield, saYield }.
// A row holds the figures that depend on the Settlement Date only; applyInterestRefCpiDate adds the rest.
// Returns { rows, settlementRefCpi }.
export function buildTipsReferenceRows({ tipsRefRows, quotes, refCpiRows, settlementDateStr, todayStr = todayEt() }) {
  const quoteByCusip = new Map();
  for (const q of quotes) quoteByCusip.set(q.cusip, q);
  const settleDate = localDate(settlementDateStr);
  const settlementRefCpi = lookupRefCpi(refCpiRows, settlementDateStr);

  const rows = tipsRefRows.map(ref => {
    const q = quoteByCusip.get(ref.cusip);
    const price = q?.price ?? null;
    const yld = q?.yield ?? null;
    const matDate = ref.maturity ? localDate(ref.maturity) : null;
    const term = (matDate && matDate > settleDate) ? termYears(settleDate, matDate) : null;
    const macDuration = (matDate && ref.coupon != null && yld != null && !isNaN(yld))
      ? calculateDuration(settleDate, matDate, ref.coupon, yld) : null;
    const modDuration = macDuration != null ? calculateMDuration(settleDate, matDate, ref.coupon, yld) : null;

    // A TIPS that matured before today is redeemed at the Ref CPI of its Maturity Date, whatever the Settlement Date.
    const isMatured = !!ref.maturity && ref.maturity < todayStr;
    const rowRefCpi = isMatured ? lookupRefCpi(refCpiRows, ref.maturity) : settlementRefCpi;
    const ir = indexRatio(rowRefCpi, ref.datedDateRefCpi, TREASURY_ROUNDING);
    // Adj Price is a broker's adjusted price, which does not round the Index Ratio (DD Index Ratio).
    const irUnrounded = indexRatio(rowRefCpi, ref.datedDateRefCpi, NO_ROUNDING);

    return {
      cusip: ref.cusip,
      maturity: ref.maturity,
      coupon: ref.coupon,
      datedDate: ref.datedDate,
      datedDateRefCpi: ref.datedDateRefCpi,
      price,
      indexRatio: ir,
      adjPrice: (irUnrounded != null && price != null) ? price * irUnrounded : null,
      yield: yld,
      saYield: q?.saYield ?? null,
      term,
      macDuration,
      modDuration,
      accruedInterest: null,
      nextCoupon: null,
      cpnDateIR: null,
      cpnPayment: null,
    };
  });
  return { rows, settlementRefCpi };
}

// 6.2 §Interest Ref CPI Date, §Accrued Interest, §Next Coupon and §Coupon Payment. Sets the Accrued Interest
// (Adjusted) and the coupon columns of each row for the Interest Ref CPI Date. Returns the Interest Ref CPI and
// whether some TIPS has a known Adj Cpn/$1K.
export function applyInterestRefCpiDate(rows, { refCpiRows, bondHolidays, interestRefCpiDateStr, todayStr = todayEt() }) {
  const interestRefCpi = lookupRefCpi(refCpiRows, interestRefCpiDateStr);
  const refDate = localDate(interestRefCpiDateStr);
  const todayDate = localDate(todayStr);
  // A weekend and an adjacent Bond Holiday can move the payment of a coupon forward by several calendar days, so a
  // coupon dated a few days before today can still be paid today: look back far enough to find it (7 days covers any
  // realistic stack of weekend and holidays).
  const couponLookbackDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - 7);

  for (const r of rows) {
    const matDate = r.maturity ? localDate(r.maturity) : null;
    const isMatured = !!r.maturity && r.maturity < todayStr;

    // Accrued Interest (Adjusted) at the Interest Ref CPI Date, with the Index Ratio of that date; none once matured.
    r.accruedInterest = (matDate && r.coupon != null && r.datedDate && interestRefCpiDateStr >= r.datedDate)
      ? accruedInterestAdjusted(r.coupon, refDate, matDate, interestRefCpi, r.datedDateRefCpi)
      : null;

    // If today is the payment date of the next or final coupon of the TIPS, that coupon is the one shown, whatever the
    // Interest Ref CPI Date. Otherwise it is the first coupon on or after the Interest Ref CPI Date. The final coupon of
    // a matured TIPS is paid with its Maturity Date, so a maturity on a weekend or a Bond Holiday keeps showing that
    // coupon through the day it is paid.
    const candidateCpn = isMatured ? matDate : (matDate ? _nextCouponOnOrAfter(couponLookbackDate, matDate) : null);
    const candidateCpnStr = candidateCpn ? toIsoDate(candidateCpn) : null;
    const todayIsCpnDate = candidateCpnStr && effectivePaymentDate(candidateCpnStr, bondHolidays) === todayStr;
    const cpnRefDate = todayIsCpnDate ? candidateCpn : refDate;
    const nextCpn = (matDate && matDate >= cpnRefDate) ? _nextCouponOnOrAfter(cpnRefDate, matDate) : null;

    if (nextCpn) {
      r.nextCoupon = toIsoDate(nextCpn);
      const cpnIR = indexRatio(lookupRefCpi(refCpiRows, r.nextCoupon), r.datedDateRefCpi, TREASURY_ROUNDING);
      r.cpnDateIR = cpnIR;
      r.cpnPayment = (cpnIR != null && r.coupon != null) ? (r.coupon / 2) * cpnIR * 1000 : null;
    } else {
      r.nextCoupon = null; r.cpnDateIR = null; r.cpnPayment = null;
    }
  }
  return { interestRefCpi, cpnKnown: rows.some(r => r.cpnPayment != null) };
}

// 6.3 §Table: a TIPS is outstanding until the payment date of its Maturity Date has passed.
export function isOutstanding(row, bondHolidays, todayStr = todayEt()) {
  return !!row.maturity && effectivePaymentDate(row.maturity, bondHolidays) >= todayStr;
}
