// CpiExplorer — data.js
// Fetches and parses S8 (CPI_history.csv) and S3 (RefCPI.csv) from R2.

import { parseCsv } from '../../shared/src/csv.js';

const R2_BASE = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const CPI_HISTORY_URL = `${R2_BASE}/bls/CPI_history.csv`;
const REF_CPI_URL     = `${R2_BASE}/TIPS/RefCPI.csv`;

/**
 * @typedef {{ year: number, month: number, date: Date, nsa: number|null, sa: number|null }} CpiRow
 * @typedef {{ date: Date, value: number }} RefCpiRow
 */

// The two stores read here state their headers in different cases (S8 "Year,Period,
// PeriodName,NSA,SA", S3 "date,refCpi"), so every row is re-keyed in lower case and read
// that way below. The parse itself is shared/src/csv.js#parseCsv, the one CSV parser
// (projects/CLAUDE.md §2a).
function parseCsvLowerKeys(text) {
  return parseCsv(text).map(row => {
    const out = {};
    for (const k in row) out[k.toLowerCase()] = row[k];
    return out;
  });
}

function localDate(yyyy, mm, dd = 1) {
  return new Date(yyyy, mm - 1, dd);
}

/** Fetch and parse S8: CPI_history.csv → CpiRow[] */
export async function fetchCpiHistory() {
  const res = await fetch(CPI_HISTORY_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`CPI_history.csv fetch failed: ${res.status}`);
  const text = await res.text();
  const raw = parseCsvLowerKeys(text);
  /** @type {CpiRow[]} */
  const rows = [];
  for (const r of raw) {
    // Skip annual averages (M13) and non-monthly codes
    if (!/^M(0[1-9]|1[0-2])$/.test(r.period)) continue;
    const year  = parseInt(r.year, 10);
    const month = parseInt(r.period.slice(1), 10); // "M01" → 1
    const nsa   = r.nsa && r.nsa !== '-' ? parseFloat(r.nsa) : null;
    const sa    = r.sa  && r.sa  !== '-' ? parseFloat(r.sa)  : null;
    if (isNaN(year) || isNaN(month)) continue;
    rows.push({ year, month, date: localDate(year, month), nsa, sa });
  }
  return rows; // already sorted ascending by script
}

/** Fetch and parse S3: RefCPI.csv → RefCpiRow[] */
export async function fetchRefCpi() {
  const res = await fetch(REF_CPI_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`RefCPI.csv fetch failed: ${res.status}`);
  const text = await res.text();
  const raw  = parseCsvLowerKeys(text);
  /** @type {RefCpiRow[]} */
  const rows = [];
  for (const r of raw) {
    const parts = (r.date || '').split('-').map(Number);
    if (parts.length !== 3) continue;
    const value = parseFloat(r.refcpi);
    if (isNaN(value)) continue;
    rows.push({ date: localDate(parts[0], parts[1], parts[2]), value });
  }
  return rows; // already sorted ascending
}
