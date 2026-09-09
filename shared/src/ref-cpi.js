// ref-cpi.js — Single canonical home for Reference CPI logic.
// Spec: knowledge/DATA_DICTIONARY.md#ref-cpi, knowledge/TIPS_Basics.md,
//       YieldCurves/knowledge/1.0_Seasonal_Adjustments.md
//
// Per the project-wide no-redundancy directive (projects/CLAUDE.md §2a), all
// Ref CPI logic lives here and is imported — never copied inline.
//
// Two derivations of the daily Ref CPI:
//   • RETRIEVED (authoritative): TreasuryDirect daily NSA series (RefCPI.csv).
//     All apps consume this via lookupRefCpi().
//   • CALCULATED: 31 CFR §356 App. B interpolation of a monthly CPI series
//     (refCpiFromMonthly()). For NSA it is a FALLBACK + educational; for the
//     seasonally-adjusted series it is the SOLE source (no official daily SA
//     Ref CPI exists), so SA production always uses it.
// The retrieved and calculated NSA series must agree (see shared/tests/ref-cpi.test.js).

// ─── Retrieved lookup ────────────────────────────────────────────────────────
// Ref CPI is defined per SPECIFIC calendar day. Returns the exact entry for
// dateStr, or null if dateStr is outside the published range (before the first
// row or after the last). There is NO "snap" to an earlier date.
// `rows` must be ascending by date: [{ date:'YYYY-MM-DD', refCpi:Number }, ...].
export function lookupRefCpi(rows, dateStr) {
  if (!rows || rows.length === 0) return null;
  if (dateStr < rows[0].date || dateStr > rows[rows.length - 1].date) return null;
  let lo = 0, hi = rows.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const rd = rows[mid].date;
    if (rd === dateStr) return rows[mid].refCpi;
    if (rd < dateStr) lo = mid + 1; else hi = mid - 1;
  }
  return null; // within range but no exact entry (data gap)
}

// ─── Truncate-then-round (31 CFR §356 App. B §I.B.3) ─────────────────────────
// "Interpolation calculations are truncated to six decimal places, then
// rounded to five decimal places — so Ref CPI and Index Ratio are always
// expressed to five decimal places." Applied at both computation points below.
function truncateThenRound(x, truncDp = 6, roundDp = 5) {
  if (x == null) return x;
  // IEEE754 doubles can represent an exact n-decimal value as e.g.
  // 1.1500349999999999 instead of 1.150035, which silently truncates/rounds
  // one digit low. Nudge by an epsilon before each trunc/round step so an
  // exact boundary value lands on its true value.
  //
  // The nudge must be RELATIVE (proportional to the scaled magnitude), not a
  // fixed absolute amount: a fixed 1e-9 nudge is ~4 ulps at index-ratio
  // magnitude (~1e6 after scaling) but ~0.01 ulps at Ref CPI magnitude
  // (~3e8 after scaling) -- a no-op there. That silently mis-rounded 28 real
  // dates in the published RefCPI.csv series (e.g. 2019-08-02: true value
  // 256.093645 -> must round up to 256.09365, absolute-nudge version gave
  // 256.09364). At 1e-12 relative this is ~4500 ulps at any magnitude this
  // function is used at -- far above representation noise, far below one
  // unit in the 6th/5th decimal place. Verified against TreasuryDirect's
  // published Ref CPI series: 0 mismatches (was 28) -- see
  // shared/tests/ref-cpi.test.js.
  //
  // Note: nudging by sign(x)*epsilon shifts negative half-way values from
  // round-half-up to round-half-away-from-zero (a real but unrequested
  // semantic change vs. plain Math.round). Moot in practice -- Ref CPI and
  // Index Ratio are always positive -- but be aware if this function is ever
  // reused for a signed quantity.
  const nudge = v => v === 0 ? v : v + Math.sign(v) * Math.max(1e-9, Math.abs(v) * 1e-12);
  const truncFactor = 10 ** truncDp;
  const truncated = Math.trunc(nudge(x * truncFactor)) / truncFactor;
  const roundFactor = 10 ** roundDp;
  return Math.round(nudge(truncated * roundFactor)) / roundFactor;
}

// ─── Calculated (31 CFR §356 Appendix B) ─────────────────────────────────────
// Ref CPI for a date by linear interpolation of a monthly CPI-U series.
//   Ref CPI(month, 1)   = CPI-U(month − 3)
//   Ref CPI(month, day) = Ref CPI(month,1) + (Ref CPI(month+1,1) − Ref CPI(month,1)) · (day−1)/daysInMonth
// `monthly` is an object keyed `${year}-${month}` (month 1–12, NOT zero-padded)
// → CPI value. Pass the NSA series for Ref CPI NSA, the SA series for SA.
// Returns null if a required monthly value is unavailable.
export function refCpiFromMonthly(dateStr, monthly) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const get = (yr, m) => {
    while (m < 1) { m += 12; yr--; }
    while (m > 12) { m -= 12; yr++; }
    const v = monthly[`${yr}-${m}`];
    return v == null ? null : v;
  };
  const v1 = get(y, mo - 3);            // Ref CPI for the 1st of this month
  if (v1 == null) return null;
  if (d === 1) return truncateThenRound(v1);
  const v2 = get(y, mo - 2);            // Ref CPI for the 1st of next month
  if (v2 == null) return null;
  const daysInMonth = new Date(y, mo, 0).getDate();
  return truncateThenRound(v1 + (d - 1) / daysInMonth * (v2 - v1));
}

// Build the `monthly` map refCpiFromMonthly() expects from CPI rows.
// rows: [{ year, period:'M01'..'M12', value }]. Returns { `${y}-${m}`: value }.
export function monthlyCpiMap(rows, valueKey = 'value') {
  const m = {};
  for (const r of rows) {
    if (!r.period || r.period[0] !== 'M') continue;
    const mo = parseInt(r.period.slice(1), 10);
    if (mo < 1 || mo > 12) continue;
    const v = typeof r[valueKey] === 'number' ? r[valueKey] : parseFloat(r[valueKey]);
    if (!isNaN(v)) m[`${parseInt(r.year, 10)}-${mo}`] = v;
  }
  return m;
}

// ─── Index ratio ─────────────────────────────────────────────────────────────
export function indexRatio(refCpi, datedDateRefCpi) {
  return (refCpi != null && datedDateRefCpi) ? truncateThenRound(refCpi / datedDateRefCpi) : null;
}

// ─── SA Factor lookup (RefCpiNsaSa.csv rows) ─────────────────────────────────
// `rows` = TIPS/RefCpiNsaSa.csv parsed via shared/src/csv.js (any order):
//   [{ "Ref CPI Date": 'YYYY-MM-DD', "SA Factor": '1.00343', ... }, ...]
//
// For a date inside the published series, returns that exact day's SA Factor.
// For a date beyond the series (e.g. a synthetic maturity years in the future —
// the SA factor has no future value to look up), falls back to the most recent
// past occurrence of the same calendar month/day: the daily SA factor is a
// slowly-drifting, annually-repeating seasonal pattern, so a recent same-
// month/day reading is the best available proxy (see YieldCurves knowledge/
// 1.0_Seasonal_Adjustments.md and 2.1_SA_Intuition.md).
// Returns null if that month/day never appears in the series.
export function saFactorForDate(rows, dateStr) {
  const exact = rows.find(r => r['Ref CPI Date'] === dateStr);
  if (exact) return parseFloat(exact['SA Factor']);
  const mmdd = dateStr.slice(5, 10);
  let best = null;
  for (const r of rows) {
    const d = r['Ref CPI Date'];
    if (!d || !d.endsWith(`-${mmdd}`)) continue;
    if (!best || d > best['Ref CPI Date']) best = r;
  }
  return best ? parseFloat(best['SA Factor']) : null;
}

// ─── Seasonal factor horizon fade ───────────────────────────────────────────
// The maturity-date SA factor of nearly every outstanding TIPS is a
// substitution: the maturity lies beyond the published series, so
// saFactorForDate() reuses the same month/day from the most recent cycle. BLS
// re-estimates seasonal factors every year from a moving 5–11 year window and
// publishes them only one year forward, so that reuse is an extrapolation of
// the current seasonal pattern whose error grows with the horizon to maturity.
// YieldCurves/knowledge/1.1_Seasonal_Factor_Drift.md measures the error and
// derives the confidence weight applied here; the constants below are emitted
// by YieldCurves/scripts/sa-drift-analyze.mjs (FRED CPI-U history, 1948-2026).

const SEASONAL_AMPLITUDE = 0.002632;   // within-year sd of the interpolated S series, 2015-2019
const SEASONAL_DRIFT_HORIZONS = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30];
const SEASONAL_DRIFT_SIGMA = [   // [monthIndex 0=Jan][horizon] = RMS drift of S(month, 15) over h years
  [0.000830, 0.001005, 0.001052, 0.001209, 0.001411, 0.001475, 0.001602, 0.001910, 0.001895, 0.001900],  // Jan
  [0.000875, 0.001056, 0.001202, 0.001501, 0.001578, 0.001536, 0.002035, 0.002353, 0.002641, 0.002902],  // Feb
  [0.000824, 0.001037, 0.001192, 0.001426, 0.001523, 0.001598, 0.002020, 0.002273, 0.002632, 0.002772],  // Mar
  [0.000802, 0.000979, 0.001157, 0.001283, 0.001333, 0.001540, 0.001768, 0.001758, 0.001769, 0.001632],  // Apr
  [0.000891, 0.001057, 0.001116, 0.001443, 0.001364, 0.001598, 0.001784, 0.001793, 0.001773, 0.001825],  // May
  [0.000793, 0.000860, 0.001052, 0.001334, 0.001421, 0.001604, 0.001884, 0.002121, 0.002223, 0.002338],  // Jun
  [0.000837, 0.000988, 0.001153, 0.001313, 0.001553, 0.001750, 0.002215, 0.002399, 0.002595, 0.002781],  // Jul
  [0.000887, 0.001082, 0.001232, 0.001513, 0.001743, 0.001935, 0.002420, 0.002626, 0.002814, 0.002860],  // Aug
  [0.000802, 0.000974, 0.001136, 0.001360, 0.001559, 0.001792, 0.001973, 0.002224, 0.002423, 0.002262],  // Sep
  [0.000681, 0.000839, 0.000926, 0.001043, 0.001198, 0.001415, 0.001567, 0.001771, 0.001836, 0.001692],  // Oct
  [0.000710, 0.000810, 0.000932, 0.001074, 0.001180, 0.001331, 0.001571, 0.001445, 0.001382, 0.001189],  // Nov
  [0.000661, 0.000865, 0.000953, 0.001080, 0.001255, 0.001368, 0.001531, 0.001638, 0.001608, 0.001375],  // Dec
];

// RMS drift of the interpolated SA factor for a maturity calendar month (1-12)
// at horizon h years: linear interpolation on the measured grid, flat past its
// ends. The flat low end is deliberate — the reused factor is the most recent
// past occurrence of that month/day, so it is always ~1 year stale however
// close the maturity is, and h < 1 carries the h = 1 drift, not zero.
export function seasonalDriftSigma(month, h) {
  const row = SEASONAL_DRIFT_SIGMA[month - 1];
  const H = SEASONAL_DRIFT_HORIZONS;
  if (h <= H[0]) return row[0];
  if (h >= H[H.length - 1]) return row[row.length - 1];
  for (let i = 0; i < H.length - 1; i++) {
    if (h <= H[i + 1]) return row[i] + (h - H[i]) / (H[i + 1] - H[i]) * (row[i + 1] - row[i]);
  }
  return row[row.length - 1];
}

// Confidence weight w(h) = A² / (A² + σ_drift(h)²): the fraction of a reused
// maturity factor's departure from 1.0 that survives the fade. 1.0 as h → 0.
export function seasonalHorizonWeight(month, h) {
  if (!(h > 0)) return 1;
  const s = seasonalDriftSigma(month, h);
  const A2 = SEASONAL_AMPLITUDE * SEASONAL_AMPLITUDE;
  return A2 / (A2 + s * s);
}

// SA factor for a maturity date, faded toward 1.0 with the horizon from
// `asOfDate` (the settlement date in the apps). A maturity date inside the
// published series returns that exact day's value, unfaded. Returns null when
// the month/day never appears in the series.
export function maturitySaFactor(rows, maturityDate, asOfDate) {
  const exact = rows.find(r => r['Ref CPI Date'] === maturityDate);
  if (exact) return parseFloat(exact['SA Factor']);
  const base = saFactorForDate(rows, maturityDate);
  if (base == null) return null;
  const month = parseInt(maturityDate.slice(5, 7), 10);
  const h = (Date.parse(maturityDate) - Date.parse(asOfDate)) / (365.2425 * 86400000);
  return 1 + (base - 1) * seasonalHorizonWeight(month, h);
}
