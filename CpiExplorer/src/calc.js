// CpiExplorer — calc.js
// Pure, synchronous CPI transformation functions.
// All series functions return { labels: string[], values: number[] } for Chart.js.
// labels are ISO date strings (YYYY-MM-DD).

/** Format a Date as YYYY-MM-DD */
export function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Date n calendar months from `date` (negative n looks back; a year is 12 months).
 * Keeps the day of the month, or uses the last day of the target month when that
 * month has no such day (2024-03-31 minus 1 month is 2024-02-29). Local time.
 */
export function shiftMonths(date, n) {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

/** Get value from a row by field name ('nsa' | 'sa' | 'value') */
function getVal(row, field) {
  return row[field] ?? null;
}

/** Filter rows to [startDate, endDate] (inclusive). Pass null to skip either bound. */
export function filterRows(rows, startDate, endDate) {
  return rows.filter(r => {
    if (startDate && r.date < startDate) return false;
    if (endDate   && r.date > endDate)   return false;
    return true;
  });
}

/**
 * Raw index level.
 * @param {Array} rows - CpiRow[] or RefCpiRow[]
 * @param {string} field - 'nsa' | 'sa' | 'value'
 * @returns {{ labels: string[], values: number[] }}
 */
export function calcIndex(rows, field) {
  const labels = [], values = [];
  for (const row of rows) {
    const v = getVal(row, field);
    if (v === null) continue;
    labels.push(isoDate(row.date));
    values.push(v);
  }
  return { labels, values };
}

/**
 * Year-over-Year % change.
 * Monthly: compare row[t] vs row[t-12].
 * Daily (Ref CPI): compare vs same calendar date 1 year prior (binary search).
 * @param {Array} rows
 * @param {string} field
 * @param {boolean} isDaily - true for RefCPI rows
 * @returns {{ labels: string[], values: number[] }}
 */
export function calcYoY(rows, field, isDaily = false) {
  const labels = [], values = [];
  if (!isDaily) {
    for (let i = 12; i < rows.length; i++) {
      const v     = getVal(rows[i], field);
      const vPrev = getVal(rows[i - 12], field);
      if (v === null || vPrev === null || vPrev === 0) continue;
      labels.push(isoDate(rows[i].date));
      values.push((v / vPrev - 1) * 100);
    }
  } else {
    for (let i = 0; i < rows.length; i++) {
      const v = getVal(rows[i], field);
      if (v === null) continue;
      const targetDate = shiftMonths(rows[i].date, -12);
      const prior = findClosestOnOrBefore(rows, field, targetDate);
      if (prior === null) continue;
      labels.push(isoDate(rows[i].date));
      values.push((v / prior - 1) * 100);
    }
  }
  return { labels, values };
}

/**
 * Month-over-Month % change.
 * Monthly: row[t] vs row[t-1].
 * Daily: row[t] vs same calendar date 1 month prior.
 * @param {Array} rows
 * @param {string} field
 * @param {boolean} isDaily
 * @returns {{ labels: string[], values: number[] }}
 */
export function calcMoM(rows, field, isDaily = false) {
  const labels = [], values = [];
  if (!isDaily) {
    for (let i = 1; i < rows.length; i++) {
      const v     = getVal(rows[i], field);
      const vPrev = getVal(rows[i - 1], field);
      if (v === null || vPrev === null || vPrev === 0) continue;
      labels.push(isoDate(rows[i].date));
      values.push((v / vPrev - 1) * 100);
    }
  } else {
    for (let i = 0; i < rows.length; i++) {
      const v = getVal(rows[i], field);
      if (v === null) continue;
      const targetDate = shiftMonths(rows[i].date, -1);
      const prior = findClosestOnOrBefore(rows, field, targetDate);
      if (prior === null) continue;
      labels.push(isoDate(rows[i].date));
      values.push((v / prior - 1) * 100);
    }
  }
  return { labels, values };
}

/**
 * Trailing N-month rolling change.
 * Monthly: look back windowMonths rows.
 * Daily: approximate as windowMonths calendar months back.
 * @param {Array} rows
 * @param {string} field
 * @param {number} windowMonths
 * @param {boolean} isDaily
 * @returns {{ labels: string[], values: number[] }}
 */
export function calcRolling(rows, field, windowMonths, isDaily = false) {
  const labels = [], values = [];
  if (!isDaily) {
    for (let i = windowMonths; i < rows.length; i++) {
      const v     = getVal(rows[i], field);
      const vPrev = getVal(rows[i - windowMonths], field);
      if (v === null || vPrev === null || vPrev === 0) continue;
      labels.push(isoDate(rows[i].date));
      values.push((v / vPrev - 1) * 100);
    }
  } else {
    for (let i = 0; i < rows.length; i++) {
      const v = getVal(rows[i], field);
      if (v === null) continue;
      const targetDate = shiftMonths(rows[i].date, -windowMonths);
      const prior = findClosestOnOrBefore(rows, field, targetDate);
      if (prior === null) continue;
      labels.push(isoDate(rows[i].date));
      values.push((v / prior - 1) * 100);
    }
  }
  return { labels, values };
}

/**
 * Point-to-point: scalar result + percent-change-from-start series between start and end.
 * @param {Array} rows
 * @param {string} field
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {{ changePct: number, annualized: number, months: number, startVal: number, endVal: number,
 *             startLabel: string, endLabel: string, series: { labels: string[], values: number[] } }}
 */
export function calcP2P(rows, field, startDate, endDate) {
  const inRange = filterRows(rows, startDate, endDate);
  const indexSeries = calcIndex(inRange, field);

  // Closest row with a value on or before each boundary; value, month count and labels
  // all come from these two rows.
  const startRow = findRowOnOrBefore(rows, field, startDate);
  const endRow   = findRowOnOrBefore(rows, field, endDate);
  const startVal = startRow ? getVal(startRow, field) : null;
  const endVal   = endRow   ? getVal(endRow, field)   : null;

  if (startVal === null || endVal === null || startVal === 0) {
    return { changePct: null, annualized: null, months: null, startVal, endVal,
             startLabel: '', endLabel: '', series: { labels: [], values: [] } };
  }

  // Month count between the two boundary rows
  const months = (endRow.date.getFullYear() - startRow.date.getFullYear()) * 12
               + (endRow.date.getMonth()    - startRow.date.getMonth());

  const changePct = (endVal / startVal - 1) * 100;
  const annualized = months > 0 ? (Math.pow(endVal / startVal, 12 / months) - 1) * 100 : null;

  // Chart series: normalized to percent change from startVal, so the path ends at changePct.
  const series = {
    labels: indexSeries.labels,
    values: indexSeries.values.map(v => (v / startVal - 1) * 100),
  };

  return {
    changePct, annualized, months,
    startVal, endVal,
    startLabel: isoDate(startRow.date),
    endLabel:   isoDate(endRow.date),
    series,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Binary search: the last row with date <= targetDate and a non-null `field` value, or null. */
function findRowOnOrBefore(rows, field, targetDate) {
  let lo = 0, hi = rows.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (rows[mid].date <= targetDate) lo = mid + 1;
    else hi = mid - 1;
  }
  // hi is the last row dated on or before targetDate; step back over rows with no value.
  for (let i = hi; i >= 0; i--) {
    if (getVal(rows[i], field) !== null) return rows[i];
  }
  return null;
}

/** Value of `field` for the last row with date <= targetDate (see findRowOnOrBefore). */
function findClosestOnOrBefore(rows, field, targetDate) {
  const row = findRowOnOrBefore(rows, field, targetDate);
  return row ? getVal(row, field) : null;
}
