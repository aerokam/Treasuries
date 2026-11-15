// cmt-rates.test.js -- shared/src/cmt-rates.js and cmtBreakeven in shared/src/breakeven.js.
// Run: node shared/tests/cmt-rates.test.js
import {
  CMT_COLUMNS, RCMT_COLUMNS, maturityColumn, percentToDecimal, sourceDateToIso, parseSourceCsv,
  mergeRateRows, buildRatesCsv, parseRatesCsv, ratesAsNumbers, cmtMaturityDate, cmtPoints, sourceUrl, cmtViews,
} from '../src/cmt-rates.js';
import { cmtBreakeven } from '../src/breakeven.js';
import { toIsoDate } from '../src/settlement.js';

let pass = 0, fail = 0;
const eq = (a, b, msg) => {
  if (JSON.stringify(a) === JSON.stringify(b)) pass++;
  else { fail++; console.error(`  x ${msg}\n    got      ${JSON.stringify(a)}\n    expected ${JSON.stringify(b)}`); }
};
const throws = (fn, msg) => { try { fn(); fail++; console.error('  x did not throw: ' + msg); } catch { pass++; } };

// maturity labels, both spellings of the source
eq(maturityColumn('1 Mo'), '1 Mo', '1 Mo');
eq(maturityColumn('1.5 Month'), '1.5 Mo', '1.5 Month');
eq(maturityColumn('5 YR'), '5 Yr', '5 YR');
eq(maturityColumn('30 Yr'), '30 Yr', '30 Yr');
throws(() => maturityColumn('Overnight'), 'unreadable label');

// percent -> decimal text, no float arithmetic
eq(percentToDecimal('4.65'), '0.0465', '4.65');
eq(percentToDecimal('10.5'), '0.105', '10.5');
eq(percentToDecimal('0.06'), '0.0006', '0.06');
eq(percentToDecimal('4.60'), '0.046', 'trailing zero dropped');
eq(percentToDecimal('5'), '0.05', '5');
eq(percentToDecimal('100'), '1', '100');
eq(percentToDecimal('-0.25'), '-0.0025', 'negative');
eq(percentToDecimal(''), '', 'blank stays blank');
throws(() => percentToDecimal('N/A'), 'unreadable rate');

eq(sourceDateToIso('11/13/2026'), '2026-11-13', 'date');
throws(() => sourceDateToIso('2026-11-13'), 'ISO date is not the source format');

// a yearly file of the source: quoted headers, a blank cell, newest first
const file = 'Date,"1 Mo","1.5 Month","2 Mo","10 Yr"\n11/13/2026,4.10,4.18,,5.15\n11/12/2026,4.12,,4.26,5.10\n';
const read = parseSourceCsv(file, CMT_COLUMNS);
eq(read[0], { date: '2026-11-13', rates: { '1 Mo': '0.041', '1.5 Mo': '0.0418', '2 Mo': '', '10 Yr': '0.0515' } }, 'row read');
eq(read.length, 2, 'rows read');
throws(() => parseSourceCsv('Day,"1 Mo"\n', CMT_COLUMNS), 'no Date column');
throws(() => parseSourceCsv('Date,"7 Mo"\n11/13/2026,1\n', CMT_COLUMNS), 'maturity not a column');
throws(() => parseSourceCsv('Date,"1 Mo"\n11/13/2026,1\n11/13/2026,2\n', CMT_COLUMNS), 'repeated Date');
throws(() => parseSourceCsv('Date,"1 Mo"\n13/11/2026,1\n', CMT_COLUMNS), 'unreadable Date');
throws(() => parseSourceCsv('Date,"1 Yr"\n11/13/2026,1\n', RCMT_COLUMNS), 'R-CMT has no 1 Yr');

// merge: replace by Date, keep others, oldest first, changed flag
const stored = [{ date: '2026-11-12', rates: { '1 Mo': '0.0412' } }, { date: '2026-11-10', rates: { '1 Mo': '0.0405' } }];
let m = mergeRateRows(stored, read, CMT_COLUMNS);
eq(m.rows.map(r => r.date), ['2026-11-10', '2026-11-12', '2026-11-13'], 'merged order');
eq(m.changed, true, 'changed');
eq(m.rows[1].rates['2 Mo'], '0.0426', 'row of the same Date replaced');
m = mergeRateRows(m.rows, read, CMT_COLUMNS);
eq(m.changed, false, 'a second merge changes nothing');
eq(mergeRateRows(m.rows, [], CMT_COLUMNS).changed, false, 'nothing read changes nothing');

// write and read back
const csv = buildRatesCsv(RCMT_COLUMNS, [{ date: '2026-11-13', rates: { '5 Yr': '0.0268', '10 Yr': '0.0291' } }]);
eq(csv, 'Date,5 Yr,7 Yr,10 Yr,20 Yr,30 Yr\n2026-11-13,0.0268,,0.0291,,\n', 'store text');
const back = ratesAsNumbers(parseRatesCsv(csv));
eq(back[0].rates, { '5 Yr': 0.0268, '7 Yr': null, '10 Yr': 0.0291, '20 Yr': null, '30 Yr': null }, 'store read back');
eq(parseRatesCsv(''), [], 'empty store');

// Maturity Date = Settlement Date + maturity
const iso = (s, c) => toIsoDate(cmtMaturityDate(s, c));
eq(iso('2026-11-16', '1 Mo'), '2026-12-16', '1 Mo');
eq(iso('2026-11-16', '1.5 Mo'), '2026-12-28', '1.5 Mo is 6 weeks');
eq(iso('2026-11-16', '10 Yr'), '2036-11-16', '10 Yr');
eq(iso('2026-08-31', '6 Mo'), '2027-02-28', 'month end clamps');
eq(iso('2028-02-29', '1 Yr'), '2029-02-28', 'leap day clamps');

// points of the latest row
const pts = cmtPoints(ratesAsNumbers(parseRatesCsv(csv)), '2026-11-16');
eq(pts.map(p => [p.column, p.maturity, p.rate]), [['5 Yr', '2031-11-16', 0.0268], ['10 Yr', '2036-11-16', 0.0291]], 'points');
eq(cmtPoints([], '2026-11-16'), null, 'no row');

// breakeven at the latest Date both stores hold
const cmt = [{ date: '2026-11-12', rates: { '5 Yr': 0.0495, '10 Yr': 0.051 } }, { date: '2026-11-13', rates: { '5 Yr': 0.0498, '10 Yr': 0.0515 } }];
const rcmt = [{ date: '2026-11-12', rates: { '5 Yr': 0.0264, '7 Yr': null, '10 Yr': 0.0286 } }];
const bei = cmtBreakeven(cmt, rcmt);
eq(bei.date, '2026-11-12', 'latest common Date');
eq(bei.points.map(p => [p.column, Math.round(p.bei * 1e6)]), [['5 Yr', 23100], ['10 Yr', 22400]], 'breakeven values, a blank maturity omitted');
eq(cmtBreakeven(cmt, []), null, 'no common Date');

// views: the Settlement Date is T+1 past a Bond Holiday and a weekend
const views = cmtViews(
  [{ date: '2026-11-12', rates: { '5 Yr': 0.0495 } }, { date: '2026-11-13', rates: { '5 Yr': 0.0498, '1 Mo': 0.041, '2 Mo': null } }],
  [{ date: '2026-11-12', rates: { '5 Yr': 0.0264 } }],
);
eq(views.nominal.date, '2026-11-13', 'CMT latest Date');
eq(views.nominal.settle, '2026-11-16', 'Friday settles Monday');
eq(views.nominal.points.map(p => [p.column, p.maturity, p.value]), [['5 Yr', '2031-11-16', 0.0498], ['1 Mo', '2026-12-16', 0.041]], 'CMT points in row order');
eq(views.real.date, '2026-11-12', 'R-CMT latest Date');
eq(views.real.settle, '2026-11-13', 'Thursday settles Friday');
eq(views.bei.date, '2026-11-12', 'breakeven Date');
eq(Math.round(views.bei.points[0].value * 1e6), 23100, 'breakeven value');
eq(views.bei.points[0].maturity, '2031-11-13', 'breakeven maturity from its own settlement');
eq(cmtViews([], [], new Set()), { nominal: null, real: null, bei: null }, 'no rows');
eq(cmtViews([{ date: '2026-04-02', rates: { '5 Yr': 0.04 } }], [], new Set(['2026-04-03'])).nominal.settle, '2026-04-06', 'Good Friday skipped');

eq(sourceUrl('daily_treasury_yield_curve', 2026),
  'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/2026/all?type=daily_treasury_yield_curve&field_tdr_date_value=2026&page&_format=csv', 'source URL');

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
