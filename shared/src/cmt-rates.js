// cmt-rates.js -- the CMT rates (S24) and R-CMT rates (S25) of Treasury Par Yield Curve Rates (E16):
// reading a yearly file of the source, merging it into a store, writing the store, reading the
// store back, and the Maturity Date of each rate.
//
// One implementation, imported by the acquisition job (YieldCurves/scripts/updateCmtRates.js)
// and by the YieldCurves page (YieldCurves/src/app.js).
// Specs: knowledge/1.18_Fetch_CMT_Rates.md (write side), YieldCurves/knowledge/3.1_Read_Yield_Curve_Data_Sets.md
// (read side), knowledge/DATA_DICTIONARY.md#s24 and #s25 (the columns).
import { parseCsvLine } from './csv.js';
import { localDate, toIsoDate, nextBusinessDay } from './settlement.js';
import { cmtBreakeven } from './breakeven.js';

export const CMT_COLUMNS = ['1 Mo', '1.5 Mo', '2 Mo', '3 Mo', '4 Mo', '6 Mo', '1 Yr', '2 Yr', '3 Yr', '5 Yr', '7 Yr', '10 Yr', '20 Yr', '30 Yr'];
export const RCMT_COLUMNS = ['5 Yr', '7 Yr', '10 Yr', '20 Yr', '30 Yr'];
export const CMT_FIRST_YEAR = 1990;
export const RCMT_FIRST_YEAR = 2003;

const SOURCE_URL = 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv';

// The yearly file of a series of Treasury Par Yield Curve Rates (E16). type is
// 'daily_treasury_yield_curve' (CMT) or 'daily_treasury_real_yield_curve' (R-CMT).
export const sourceUrl = (type, year) =>
  `${SOURCE_URL}/${year}/all?type=${type}&field_tdr_date_value=${year}&page&_format=csv`;

// The column name of a maturity label of the source: '1 Mo' and '1.5 Month' read 'n Mo', '5 YR'
// reads '5 Yr'. Throws on a label that is neither months nor years.
export function maturityColumn(label) {
  const m = /^(\d+(?:\.\d+)?)\s*(mo|month|months|yr|year|years)$/i.exec(String(label).trim());
  if (!m) throw new Error(`Unreadable maturity label: ${label}`);
  return `${m[1]} ${/^m/i.test(m[2]) ? 'Mo' : 'Yr'}`;
}

// A rate of the source, in percent as text, to a decimal as text, by moving the decimal point
// two places left: '4.65' -> '0.0465'. A blank stays blank. No arithmetic is done on a number.
export function percentToDecimal(text) {
  const s = String(text ?? '').trim();
  if (s === '') return '';
  const m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(s);
  if (!m || (m[2] === '' && m[3] === undefined)) throw new Error(`Unreadable rate: ${text}`);
  const whole = (m[2] || '0').padStart(3, '0');
  const digits = whole.slice(0, -2) + '.' + whole.slice(-2) + (m[3] || '');
  const out = digits.replace(/^0+(?=\d)/, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return (m[1] && Number(out) !== 0 ? '-' : '') + (out.startsWith('.') ? '0' + out : out);
}

// 'MM/DD/YYYY' -> 'YYYY-MM-DD'. Throws on anything else.
export function sourceDateToIso(text) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(text).trim());
  if (!m) throw new Error(`Unreadable Date: ${text}`);
  const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  if (d.getMonth() !== Number(m[1]) - 1 || d.getDate() !== Number(m[2])) throw new Error(`Unreadable Date: ${text}`);
  return `${m[3]}-${m[1]}-${m[2]}`;
}

// A yearly file of the source -> [{ date, rates: { column: decimal text } }] in the file's order.
// Throws when the header row has no Date column or a maturity that is not in `columns`, when a
// Date cannot be read, or when two rows share a Date.
export function parseSourceCsv(text, columns) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) throw new Error('Empty file');
  const header = parseCsvLine(lines[0]);
  if (header[0] !== 'Date') throw new Error('No Date column in the header row');
  const names = header.slice(1).map(maturityColumn);
  for (const n of names) if (!columns.includes(n)) throw new Error(`Maturity ${n} is not a column of the store`);
  const seen = new Set();
  return lines.slice(1).map(line => {
    const cells = parseCsvLine(line);
    const date = sourceDateToIso(cells[0]);
    if (seen.has(date)) throw new Error(`Two rows share the Date ${date}`);
    seen.add(date);
    const rates = {};
    names.forEach((n, i) => { rates[n] = percentToDecimal(cells[i + 1]); });
    return { date, rates };
  });
}

// Merges the rows read into the stored rows by Date: a row read replaces the stored row of the
// same Date, and a stored row of another Date is kept. Rows come back oldest Date first.
// changed is false when the merged rows equal the stored rows.
export function mergeRateRows(stored, read, columns) {
  const byDate = new Map(stored.map(r => [r.date, r]));
  const same = (a, b) => columns.every(c => (a.rates[c] ?? '') === (b.rates[c] ?? ''));
  let changed = false;
  for (const r of read) {
    const old = byDate.get(r.date);
    if (!old || !same(old, r)) changed = true;
    byDate.set(r.date, r);
  }
  const rows = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return { rows, changed };
}

// The text of a store: the header row, then a row per Date. A maturity with no value is blank.
export function buildRatesCsv(columns, rows) {
  const out = [['Date', ...columns].join(',')];
  for (const r of rows) out.push([r.date, ...columns.map(c => r.rates[c] ?? '')].join(','));
  return out.join('\n') + '\n';
}

// The text of a store -> [{ date, rates: { column: decimal text } }], each column found by its
// header name. An empty text reads as no rows.
export function parseRatesCsv(text) {
  const lines = (text || '').split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return [];
  const header = parseCsvLine(lines[0]);
  if (header[0] !== 'Date') throw new Error('No Date column in the header row');
  return lines.slice(1).map(line => {
    const cells = parseCsvLine(line);
    const rates = {};
    header.slice(1).forEach((c, i) => { rates[c] = cells[i + 1] ?? ''; });
    return { date: cells[0], rates };
  });
}

// The rows of a store as numbers: each rate a decimal, a blank cell null.
export function ratesAsNumbers(rows) {
  return rows.map(r => ({
    date: r.date,
    rates: Object.fromEntries(Object.entries(r.rates).map(([c, v]) => [c, v === '' || v == null ? null : Number(v)])),
  }));
}

// The Maturity Date of a rate: the Settlement Date plus the maturity of its column, as a Date.
// 1.5 Mo is 6 weeks. A month or year that lands past the end of the month ends on its last day.
export function cmtMaturityDate(settleIso, column) {
  const [num, unit] = column.split(' ');
  const s = localDate(settleIso);
  if (column === '1.5 Mo') return new Date(s.getFullYear(), s.getMonth(), s.getDate() + 42);
  const months = unit === 'Yr' ? Number(num) * 12 : Number(num);
  const target = new Date(s.getFullYear(), s.getMonth() + months, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(s.getDate(), last));
}

// The rates of the latest row of a store that has any non-blank rate, as one point per
// non-blank rate in column order: { column, maturityDate, maturity (ISO), rate (decimal) }.
// Returns null for a store with no row. settleIso is the Settlement Date of the row.
export function cmtPoints(numericRows, settleIso) {
  const row = numericRows[numericRows.length - 1];
  if (!row) return null;
  return Object.entries(row.rates)
    .filter(([, v]) => v != null && Number.isFinite(v))
    .map(([column, rate]) => {
      const maturityDate = cmtMaturityDate(settleIso, column);
      return { column, maturityDate, maturity: toIsoDate(maturityDate), rate };
    });
}

// What the Yield Curves views draw of the CMT (YieldCurves/knowledge/3.1_Read_Yield_Curve_Data_Sets.md):
// the CMT, the R-CMT and the breakeven of the CMT, each at its latest Date, with its Settlement
// Date (the Date plus one bond trading day, past any Bond Holiday) and the Maturity Date of each
// point (the Settlement Date plus its maturity). A series with no row is null.
//
// cmtRows, rcmtRows   rows of ratesAsNumbers(), oldest Date first
// holidaySet          the Bond Holidays, as settlement.js#parseHolidaySet builds it
//
// Returns { nominal, real, bei }, each null or { date, settle, points: [{ column, maturityDate,
// maturity, value }] } with value a decimal.
export function cmtViews(cmtRows, rcmtRows, holidaySet = new Set()) {
  const settleOf = date => toIsoDate(nextBusinessDay(localDate(date), holidaySet));
  const pointsOf = (settle, items) => items.map(({ column, value }) => {
    const maturityDate = cmtMaturityDate(settle, column);
    return { column, maturityDate, maturity: toIsoDate(maturityDate), value };
  });
  const latest = rows => {
    const row = rows[rows.length - 1];
    if (!row) return null;
    const settle = settleOf(row.date);
    const items = Object.entries(row.rates).filter(([, v]) => v != null && Number.isFinite(v)).map(([column, value]) => ({ column, value }));
    return items.length ? { date: row.date, settle, points: pointsOf(settle, items) } : null;
  };
  const be = cmtBreakeven(cmtRows, rcmtRows);
  const settleBe = be ? settleOf(be.date) : null;
  return {
    nominal: latest(cmtRows),
    real: latest(rcmtRows),
    bei: be ? { date: be.date, settle: settleBe, points: pointsOf(settleBe, be.points.map(p => ({ column: p.column, value: p.bei }))) } : null,
  };
}
