// tips-oid.js: the single calculation of the OID of a TIPS (DATA_DICTIONARY.md#oid) over the period
// from a Start Date to an End Date.
// Spec: TaxationOfTreasuries/knowledge/12.2_Calculate_Tips_Oid.md
//
//   OID = Par x (Index Ratio at the End Date - Index Ratio at the Start Date)
//
// The Ref CPI of each date comes from the daily Ref CPI series (Ref CPI, S3), through lookupRefCpi in
// ref-cpi.js. The Index Ratio is indexRatio() of ref-cpi.js, rounded or not as the caller states.

import { lookupRefCpi, refCpiFromMonthly, indexRatio, roundHalfUp, TREASURY_ROUNDING, NO_ROUNDING } from './ref-cpi.js';

export { TREASURY_ROUNDING, NO_ROUNDING };

const PAR_PER_QUANTITY = 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Calculates the OID of one TIPS.
//   tips          { cusip, maturity, datedDate, datedDateRefCpi }, one row of TIPS reference data (S2);
//                 dates are 'YYYY-MM-DD'
//   quantity      number of $1,000 par units, a positive integer
//   startDate, endDate   'YYYY-MM-DD'
//   refCpiRows    [{ date: 'YYYY-MM-DD', refCpi: Number }], ascending by date (S3)
//   monthlyCpi    optional, the monthly CPI-U NSA of CPI history (S8) as monthlyCpiMap() of ref-cpi.js builds it
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
// A date after the last date of the series that is the first of a month has the Ref CPI of 31 CFR 356
// App. B for that day: the CPI-U NSA of the month three months earlier, read from monthlyCpi with no
// interpolation. startCpiMonth and endCpiMonth are that month as 'YYYY-MM', and null for a published Ref CPI.
// The latest known Ref CPI is that of the first of the month three months after the latest month of
// monthlyCpi, or that of the last date of the series when that is later. An End Date after a date with a
// Ref CPI that has none of its own is calculated at the latest known Ref CPI when it is after it, and at
// the last date of the series otherwise: endDateUsed is that date and endDateLimited is true.
function monthThreeBefore(date) {
  let y = Number(date.slice(0, 4)), m = Number(date.slice(5, 7)) - 3;
  if (m < 1) { m += 12; y -= 1; }
  return y + '-' + String(m).padStart(2, '0');
}

// The first of the month three months after the latest month of monthlyCpi, or null when it has none.
function firstOfMonthAfterLatestCpi(monthlyCpi) {
  let latest = null;
  for (const key of Object.keys(monthlyCpi || {})) {
    const [y, m] = key.split('-').map(Number);
    if (latest == null || y * 12 + m > latest) latest = y * 12 + m;
  }
  if (latest == null) return null;
  const months = latest + 3 - 1; // zero-based month count of the first of that month
  return String(Math.floor(months / 12)) + '-' + String(months % 12 + 1).padStart(2, '0') + '-01';
}

function refCpiOf(date, refCpiRows, lastDate, monthlyCpi) {
  const published = lookupRefCpi(refCpiRows, date);
  if (published != null) return { refCpi: published, cpiMonth: null };
  if (monthlyCpi && lastDate != null && date > lastDate && date.endsWith('-01')) {
    const v = refCpiFromMonthly(date, monthlyCpi);
    if (v != null) return { refCpi: v, cpiMonth: monthThreeBefore(date) };
  }
  return null;
}

export function calculateTipsOid({ tips, quantity, startDate, endDate, refCpiRows, monthlyCpi, rounding }) {
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
  const known = firstOfMonthAfterLatestCpi(monthlyCpi);
  const lastKnown = known != null && (lastDate == null || known > lastDate) ? known : lastDate;
  const start = refCpiOf(startDate, refCpiRows, lastDate, monthlyCpi);
  if (start == null) return { ok: false, reason: 'no-ref-cpi-start' };
  let end = refCpiOf(endDate, refCpiRows, lastDate, monthlyCpi);
  let endDateLimited = false;
  let endDateUsed = endDate;
  if (end == null && lastDate != null && endDate > lastDate) {
    endDateLimited = true;
    endDateUsed = endDate > lastKnown ? lastKnown : lastDate;
    end = refCpiOf(endDateUsed, refCpiRows, lastDate, monthlyCpi);
  }
  if (end == null) return { ok: false, reason: 'no-ref-cpi-end' };
  const startRefCpi = start.refCpi, endRefCpi = end.refCpi;

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
    startDate, startRefCpi, startCpiMonth: start.cpiMonth, startIndexRatio,
    endDate, endDateUsed, endDateLimited, endRefCpi, endCpiMonth: end.cpiMonth, endIndexRatio,
    lastKnownRefCpiDate: lastKnown,
    rounding,
    oid,
  };
}
