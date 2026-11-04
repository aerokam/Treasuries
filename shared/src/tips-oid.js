// tips-oid.js: the single calculation of the OID of a TIPS (DATA_DICTIONARY.md#oid) over the period
// from a Start Date to an End Date.
// Spec: TaxationOfTreasuries/knowledge/12.2_Calculate_Tips_Oid.md
//
//   OID = Par x (Index Ratio at the End Date - Index Ratio at the Start Date)
//
// The Ref CPI of each date comes from the daily Ref CPI series (Ref CPI, S3), through lookupRefCpi in
// ref-cpi.js. The Index Ratio is indexRatio() of ref-cpi.js, rounded or not as the caller states.

import { lookupRefCpi, indexRatio, roundHalfUp, TREASURY_ROUNDING, NO_ROUNDING } from './ref-cpi.js';

export { TREASURY_ROUNDING, NO_ROUNDING };

const PAR_PER_QUANTITY = 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Calculates the OID of one TIPS.
//   tips          { cusip, maturity, datedDate, datedDateRefCpi }, one row of TIPS reference data (S2);
//                 dates are 'YYYY-MM-DD'
//   quantity      number of $1,000 par units, a positive integer
//   startDate, endDate   'YYYY-MM-DD'
//   refCpiRows    [{ date: 'YYYY-MM-DD', refCpi: Number }], ascending by date (S3)
//   rounding      TREASURY_ROUNDING or NO_ROUNDING, applied to the Index Ratio of each date
//
// Returns { ok: false, reason } or { ok: true, ... }. The reasons:
//   'cusip-not-found'            tips is missing
//   'quantity'                   quantity is not a positive integer
//   'dates-missing'              a date is not 'YYYY-MM-DD'
//   'start-after-end'
//   'start-before-dated-date'
//   'start-after-maturity'
//   'end-after-maturity'
//   'no-ref-cpi-start'     the series has no Ref CPI for the Start Date
//   'no-ref-cpi-end'       the series has no Ref CPI for the End Date, which is inside its range
//
// An End Date after the last date of the series is calculated at that last date:
// endDateUsed is that date and endDateLimited is true.
export function calculateTipsOid({ tips, quantity, startDate, endDate, refCpiRows, rounding }) {
  if (!tips) return { ok: false, reason: 'cusip-not-found' };
  if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, reason: 'quantity' };
  if (!ISO_DATE.test(startDate || '') || !ISO_DATE.test(endDate || '')) {
    return { ok: false, reason: 'dates-missing' };
  }
  if (startDate > endDate) return { ok: false, reason: 'start-after-end' };
  if (startDate < tips.datedDate) return { ok: false, reason: 'start-before-dated-date' };
  if (startDate > tips.maturity) return { ok: false, reason: 'start-after-maturity' };
  if (endDate > tips.maturity) return { ok: false, reason: 'end-after-maturity' };

  const lastDate = refCpiRows && refCpiRows.length ? refCpiRows[refCpiRows.length - 1].date : null;
  const endDateLimited = lastDate != null && endDate > lastDate;
  const endDateUsed = endDateLimited ? lastDate : endDate;

  const startRefCpi = lookupRefCpi(refCpiRows, startDate);
  if (startRefCpi == null) return { ok: false, reason: 'no-ref-cpi-start' };
  const endRefCpi = lookupRefCpi(refCpiRows, endDateUsed);
  if (endRefCpi == null) return { ok: false, reason: 'no-ref-cpi-end' };

  const par = quantity * PAR_PER_QUANTITY;
  const startIndexRatio = indexRatio(startRefCpi, tips.datedDateRefCpi, rounding);
  const endIndexRatio = indexRatio(endRefCpi, tips.datedDateRefCpi, rounding);
  if (startIndexRatio == null || endIndexRatio == null) {
    return { ok: false, reason: 'cusip-not-found' };
  }
  // Rounded to cents, as the amount of a 1099-OID box is. The Index Ratios are not rounded here.
  const oid = roundHalfUp(par * (endIndexRatio - startIndexRatio), 2);

  return {
    ok: true,
    par,
    datedDateRefCpi: tips.datedDateRefCpi,
    startDate, startRefCpi, startIndexRatio,
    endDate, endDateUsed, endDateLimited, endRefCpi, endIndexRatio,
    lastRefCpiDate: lastDate,
    rounding,
    oid,
  };
}
