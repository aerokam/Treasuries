// tips-oid.js: the single calculation of the OID of a TIPS (DATA_DICTIONARY.md#oid) over the period
// from an Acquisition Date to a Valuation Date.
// Spec: TaxationOfTreasuries/knowledge/12.2_Calculate_Tips_Oid.md
//
//   OID = Par x (Index Ratio at the Valuation Date - Index Ratio at the Acquisition Date)
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
//   acquisitionDate, valuationDate   'YYYY-MM-DD'
//   refCpiRows    [{ date: 'YYYY-MM-DD', refCpi: Number }], ascending by date (S3)
//   rounding      TREASURY_ROUNDING or NO_ROUNDING, applied to the Index Ratio of each date
//
// Returns { ok: false, reason } or { ok: true, ... }. The reasons:
//   'cusip-not-found'            tips is missing
//   'quantity'                   quantity is not a positive integer
//   'dates-missing'              a date is not 'YYYY-MM-DD'
//   'acquisition-after-valuation'
//   'acquisition-before-dated-date'
//   'acquisition-after-maturity'
//   'valuation-after-maturity'
//   'no-ref-cpi-acquisition'     the series has no Ref CPI for the Acquisition Date
//   'no-ref-cpi-valuation'       the series has no Ref CPI for the Valuation Date, which is inside its range
//
// A Valuation Date after the last date of the series is calculated at that last date:
// valuationDateUsed is that date and valuationDateLimited is true.
export function calculateTipsOid({ tips, quantity, acquisitionDate, valuationDate, refCpiRows, rounding }) {
  if (!tips) return { ok: false, reason: 'cusip-not-found' };
  if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, reason: 'quantity' };
  if (!ISO_DATE.test(acquisitionDate || '') || !ISO_DATE.test(valuationDate || '')) {
    return { ok: false, reason: 'dates-missing' };
  }
  if (acquisitionDate > valuationDate) return { ok: false, reason: 'acquisition-after-valuation' };
  if (acquisitionDate < tips.datedDate) return { ok: false, reason: 'acquisition-before-dated-date' };
  if (acquisitionDate > tips.maturity) return { ok: false, reason: 'acquisition-after-maturity' };
  if (valuationDate > tips.maturity) return { ok: false, reason: 'valuation-after-maturity' };

  const lastDate = refCpiRows && refCpiRows.length ? refCpiRows[refCpiRows.length - 1].date : null;
  const valuationDateLimited = lastDate != null && valuationDate > lastDate;
  const valuationDateUsed = valuationDateLimited ? lastDate : valuationDate;

  const acquisitionRefCpi = lookupRefCpi(refCpiRows, acquisitionDate);
  if (acquisitionRefCpi == null) return { ok: false, reason: 'no-ref-cpi-acquisition' };
  const valuationRefCpi = lookupRefCpi(refCpiRows, valuationDateUsed);
  if (valuationRefCpi == null) return { ok: false, reason: 'no-ref-cpi-valuation' };

  const par = quantity * PAR_PER_QUANTITY;
  const acquisitionIndexRatio = indexRatio(acquisitionRefCpi, tips.datedDateRefCpi, rounding);
  const valuationIndexRatio = indexRatio(valuationRefCpi, tips.datedDateRefCpi, rounding);
  if (acquisitionIndexRatio == null || valuationIndexRatio == null) {
    return { ok: false, reason: 'cusip-not-found' };
  }
  // Rounded to cents, as the amount of a 1099-OID box is. The Index Ratios are not rounded here.
  const oid = roundHalfUp(par * (valuationIndexRatio - acquisitionIndexRatio), 2);

  return {
    ok: true,
    par,
    datedDateRefCpi: tips.datedDateRefCpi,
    acquisitionDate, acquisitionRefCpi, acquisitionIndexRatio,
    valuationDate, valuationDateUsed, valuationDateLimited, valuationRefCpi, valuationIndexRatio,
    lastRefCpiDate: lastDate,
    rounding,
    oid,
  };
}
