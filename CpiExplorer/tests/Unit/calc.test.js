import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isoDate, filterRows, shiftMonths,
  calcIndex, calcYoY, calcMoM, calcRolling, calcP2P,
} from '../../src/calc.js';

const d = (y, m, day) => new Date(y, m - 1, day); // local time, as the app builds row dates
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

// Monthly rows from Jan 2020 on the 1st; value = 100 + index unless overridden.
function monthly(n, valueAt = i => 100 + i, field = 'nsa') {
  return Array.from({ length: n }, (_, i) => ({ date: d(2020 + Math.floor(i / 12), (i % 12) + 1, 1), [field]: valueAt(i) }));
}

// ── shiftMonths ───────────────────────────────────────────────────────────────

test('shiftMonths keeps the day when the target month has it', () => {
  assert.equal(isoDate(shiftMonths(d(2024, 5, 15), -1)), '2024-04-15');
  assert.equal(isoDate(shiftMonths(d(2024, 1, 31), -12)), '2023-01-31');
});

test('shiftMonths uses the last day of a shorter target month', () => {
  assert.equal(isoDate(shiftMonths(d(2024, 3, 31), -1)), '2024-02-29');
  assert.equal(isoDate(shiftMonths(d(2023, 3, 31), -1)), '2023-02-28');
  assert.equal(isoDate(shiftMonths(d(2024, 2, 29), -12)), '2023-02-28');
  assert.equal(isoDate(shiftMonths(d(2024, 5, 31), -3)), '2024-02-29');
  assert.equal(isoDate(shiftMonths(d(2024, 12, 31), -1)), '2024-11-30');
});

test('shiftMonths crosses year boundaries', () => {
  assert.equal(isoDate(shiftMonths(d(2024, 1, 31), -2)), '2023-11-30');
  assert.equal(isoDate(shiftMonths(d(2024, 2, 29), -24)), '2022-02-28');
});

test('shiftMonths does not modify its argument', () => {
  const src = d(2024, 3, 31);
  shiftMonths(src, -1);
  assert.equal(isoDate(src), '2024-03-31');
});

// ── filterRows ────────────────────────────────────────────────────────────────

test('filterRows is inclusive and a null bound is skipped', () => {
  const rows = monthly(6);
  assert.equal(filterRows(rows, d(2020, 2, 1), d(2020, 4, 1)).length, 3);
  assert.equal(filterRows(rows, null, d(2020, 2, 1)).length, 2);
  assert.equal(filterRows(rows, d(2020, 5, 1), null).length, 2);
  assert.equal(filterRows(rows, null, null).length, 6);
});

// ── calcIndex ─────────────────────────────────────────────────────────────────

test('calcIndex skips null values and labels with ISO dates', () => {
  const rows = [
    { date: d(2020, 1, 1), nsa: 100 },
    { date: d(2020, 2, 1), nsa: null },
    { date: d(2020, 3, 1), nsa: 102 },
    { date: d(2020, 4, 1) },
  ];
  assert.deepEqual(calcIndex(rows, 'nsa'), { labels: ['2020-01-01', '2020-03-01'], values: [100, 102] });
});

// ── monthly YoY / MoM / rolling ───────────────────────────────────────────────

test('calcYoY monthly compares row t with row t-12 and gives no point for the first 12 rows', () => {
  const rows = monthly(14, i => 100 + i);
  const r = calcYoY(rows, 'nsa');
  assert.equal(r.labels.length, 2);
  assert.equal(r.labels[0], isoDate(rows[12].date));
  close(r.values[0], (112 / 100 - 1) * 100);
  close(r.values[1], (113 / 101 - 1) * 100);
  assert.equal(calcYoY(monthly(12), 'nsa').labels.length, 0);
});

test('calcYoY monthly skips a null or zero previous value and a null current value', () => {
  const rows = monthly(15, i => 100 + i);
  rows[0].nsa = null;   // row 12 has a null previous
  rows[1].nsa = 0;      // row 13 has a zero previous
  rows[14].nsa = null;  // row 14 has a null current
  assert.deepEqual(calcYoY(rows, 'nsa').labels, []);
  rows[0].nsa = 100;
  assert.deepEqual(calcYoY(rows, 'nsa').labels, [isoDate(rows[12].date)]);
});

test('calcMoM monthly compares row t with row t-1', () => {
  const rows = monthly(4, i => [100, 101, 0, 103][i]);
  const r = calcMoM(rows, 'nsa');
  // row 1 vs 0 and row 2 vs 1 are points; row 3 vs 2 has a zero previous and is skipped.
  assert.deepEqual(r.labels, [isoDate(rows[1].date), isoDate(rows[2].date)]);
  close(r.values[0], 1);
  close(r.values[1], -100);
});

test('calcMoM monthly skips null previous and null current values', () => {
  const rows = monthly(4, i => [100, null, 102, 103][i]);
  const r = calcMoM(rows, 'nsa');
  assert.deepEqual(r.labels, [isoDate(rows[3].date)]);
  close(r.values[0], (103 / 102 - 1) * 100);
});

test('calcRolling monthly with N=24 compares row t with row t-24', () => {
  const rows = monthly(26, i => 100 * Math.pow(1.01, i));
  const r = calcRolling(rows, 'nsa', 24);
  assert.equal(r.labels.length, 2);
  assert.equal(r.labels[0], isoDate(rows[24].date));
  close(r.values[0], (Math.pow(1.01, 24) - 1) * 100);
  assert.equal(calcRolling(monthly(24), 'nsa', 24).labels.length, 0);
});

// ── daily lookups ─────────────────────────────────────────────────────────────

// Daily rows: each row's value is 1000 + its position, so a lookup result identifies
// the prior date it used.
function dailyRows(start, end) {
  const rows = [];
  for (let day = new Date(start), k = 0; day <= end; k++) {
    rows.push({ date: new Date(day), value: 1000 + k });
    day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  }
  return rows;
}
const valueOn = (rows, y, m, day) => rows.find(r => isoDate(r.date) === isoDate(d(y, m, day))).value;
const pointOn = (series, y, m, day) => series.values[series.labels.indexOf(isoDate(d(y, m, day)))];

test('daily YoY looks up the same calendar day one year earlier', () => {
  const rows = dailyRows(d(2023, 1, 1), d(2024, 12, 31));
  const r = calcYoY(rows, 'value', true);
  close(pointOn(r, 2024, 6, 15), (valueOn(rows, 2024, 6, 15) / valueOn(rows, 2023, 6, 15) - 1) * 100);
  assert.ok(!r.labels.includes('2023-12-31'));
  assert.ok(r.labels.includes('2024-01-01'));
});

test('daily YoY from 2024-02-29 uses 2023-02-28 (not 2023-03-01)', () => {
  const rows = dailyRows(d(2023, 1, 1), d(2024, 12, 31));
  const r = calcYoY(rows, 'value', true);
  close(pointOn(r, 2024, 2, 29), (valueOn(rows, 2024, 2, 29) / valueOn(rows, 2023, 2, 28) - 1) * 100);
});

test('daily MoM looks up the same calendar day one month earlier', () => {
  const rows = dailyRows(d(2024, 1, 1), d(2024, 6, 30));
  const r = calcMoM(rows, 'value', true);
  close(pointOn(r, 2024, 5, 15), (valueOn(rows, 2024, 5, 15) / valueOn(rows, 2024, 4, 15) - 1) * 100);
  assert.ok(!r.labels.includes('2024-01-31'));
  assert.ok(r.labels.includes('2024-02-01'));
});

test('daily MoM from 2024-03-31 uses 2024-02-29 (not 2024-03-02)', () => {
  const rows = dailyRows(d(2024, 1, 1), d(2024, 6, 30));
  const r = calcMoM(rows, 'value', true);
  close(pointOn(r, 2024, 3, 31), (valueOn(rows, 2024, 3, 31) / valueOn(rows, 2024, 2, 29) - 1) * 100);
});

test('daily rolling from 2024-05-31 over 3 months uses 2024-02-29 (not 2024-03-02)', () => {
  const rows = dailyRows(d(2024, 1, 1), d(2024, 6, 30));
  const r = calcRolling(rows, 'value', 3, true);
  close(pointOn(r, 2024, 5, 31), (valueOn(rows, 2024, 5, 31) / valueOn(rows, 2024, 2, 29) - 1) * 100);
  close(pointOn(r, 2024, 6, 15), (valueOn(rows, 2024, 6, 15) / valueOn(rows, 2024, 3, 15) - 1) * 100);
});

test('daily lookups use the closest row on or before the target date', () => {
  // Rows exist only on the 1st and 20th of each month.
  const rows = [];
  for (let m = 1; m <= 4; m++) rows.push({ date: d(2024, m, 1), value: 100 * m }, { date: d(2024, m, 20), value: 100 * m + 50 });
  const r = calcMoM(rows, 'value', true);
  close(pointOn(r, 2024, 3, 20), (350 / 250 - 1) * 100);
  close(pointOn(r, 2024, 3, 1), (300 / 200 - 1) * 100);
  // 2024-04-01 looks back to 2024-03-01.
  close(pointOn(r, 2024, 4, 1), (400 / 300 - 1) * 100);
});

test('daily lookups skip a row whose current value is null', () => {
  const rows = dailyRows(d(2024, 1, 1), d(2024, 3, 31));
  rows.find(r => isoDate(r.date) === '2024-03-15').value = null;
  const r = calcMoM(rows, 'value', true);
  assert.ok(!r.labels.includes('2024-03-15'));
});

test('daily lookups step back over a null-valued row to the nearest earlier value', () => {
  const rows = dailyRows(d(2024, 1, 1), d(2024, 3, 31));
  const nullDay = rows.find(r => isoDate(r.date) === '2024-02-15');
  nullDay.value = null;
  const r = calcMoM(rows, 'value', true);
  // 2024-03-15 looks back to 2024-02-15 (null) and uses 2024-02-14.
  close(pointOn(r, 2024, 3, 15), (valueOn(rows, 2024, 3, 15) / valueOn(rows, 2024, 2, 14) - 1) * 100);
});

// ── calcP2P ───────────────────────────────────────────────────────────────────

test('calcP2P uses the closest row on or before each boundary', () => {
  const rows = monthly(25, i => 100 + i); // 2020-01-01 .. 2022-01-01
  const r = calcP2P(rows, 'nsa', d(2020, 1, 15), d(2021, 6, 20));
  assert.equal(r.startLabel, '2020-01-01');
  assert.equal(r.endLabel, '2021-06-01');
  assert.equal(r.startVal, 100);
  assert.equal(r.endVal, 117);
  assert.equal(r.months, 17);
  close(r.changePct, 17);
});

test('calcP2P with a start after the first data row measures from the start row, not the first row', () => {
  // Monthly rows 2018-01 .. 2022-12 growing 0.2% a month.
  const rows = Array.from({ length: 60 }, (_, i) => ({
    date: d(2018 + Math.floor(i / 12), (i % 12) + 1, 1),
    nsa: 100 * Math.pow(1.002, i),
  }));
  const r = calcP2P(rows, 'nsa', d(2020, 1, 1), d(2021, 1, 1));
  assert.equal(r.startLabel, '2020-01-01');
  assert.equal(r.endLabel, '2021-01-01');
  assert.equal(r.months, 12);
  close(r.changePct, (Math.pow(1.002, 12) - 1) * 100);
  close(r.annualized, r.changePct);
  close(r.startVal, 100 * Math.pow(1.002, 24));
  close(r.endVal, 100 * Math.pow(1.002, 36));
});

test('calcP2P start between two monthly rows uses the earlier row', () => {
  const rows = Array.from({ length: 60 }, (_, i) => ({
    date: d(2018 + Math.floor(i / 12), (i % 12) + 1, 1),
    nsa: 100 + i,
  }));
  const r = calcP2P(rows, 'nsa', d(2020, 1, 15), d(2021, 1, 15));
  assert.equal(r.startLabel, '2020-01-01');
  assert.equal(r.endLabel, '2021-01-01');
  assert.equal(r.startVal, 124);
  assert.equal(r.months, 12);
});

test('calcP2P start on a null-valued row uses the nearest earlier non-null row', () => {
  // A series blank from 2019-11 to 2020-02, such as a seasonally adjusted series with gaps.
  const rows = Array.from({ length: 36 }, (_, i) => ({
    date: d(2019 + Math.floor(i / 12), (i % 12) + 1, 1),
    nsa: (i >= 10 && i <= 13) ? null : 100 + i,
  }));
  const r = calcP2P(rows, 'nsa', d(2020, 2, 1), d(2021, 2, 1));
  assert.equal(r.startLabel, '2019-10-01');
  assert.equal(r.startVal, 109);
  assert.equal(r.endLabel, '2021-02-01');
  assert.equal(r.months, 16);
});

test('calcP2P annualizes as ((end/start)^(12/months) - 1) * 100', () => {
  const rows = monthly(25, i => 100 * Math.pow(1.005, i));
  const r = calcP2P(rows, 'nsa', d(2020, 1, 1), d(2022, 1, 1));
  assert.equal(r.months, 24);
  close(r.annualized, (Math.pow(rows[24].nsa / rows[0].nsa, 12 / 24) - 1) * 100);
  close(r.annualized, (Math.pow(1.005, 12) - 1) * 100);
});

test('calcP2P annualized is null when both boundary rows are in the same month', () => {
  const rows = monthly(3);
  const r = calcP2P(rows, 'nsa', d(2020, 2, 1), d(2020, 2, 20));
  assert.equal(r.months, 0);
  assert.equal(r.annualized, null);
  close(r.changePct, 0);
});

test('calcP2P series starts near 0 and ends at changePct', () => {
  const rows = monthly(25, i => 100 + i);
  const r = calcP2P(rows, 'nsa', d(2020, 1, 1), d(2021, 1, 1));
  assert.equal(r.series.labels.length, 13);
  assert.equal(r.series.labels[0], '2020-01-01');
  close(r.series.values[0], 0);
  close(r.series.values[r.series.values.length - 1], r.changePct);
});

test('calcP2P series for a start between rows begins near 0 relative to the start row', () => {
  const rows = monthly(25, i => 100 + i);
  const r = calcP2P(rows, 'nsa', d(2020, 1, 15), d(2021, 1, 1));
  // In-range rows begin at 2020-02-01 (101), measured against the 2020-01-01 row (100).
  assert.equal(r.series.labels[0], '2020-02-01');
  close(r.series.values[0], 1);
  close(r.series.values[r.series.values.length - 1], r.changePct);
});

test('calcP2P returns nulls when a boundary has no row on or before it', () => {
  const rows = monthly(12);
  const r = calcP2P(rows, 'nsa', d(2019, 1, 1), d(2020, 6, 1));
  assert.equal(r.changePct, null);
  assert.equal(r.annualized, null);
  assert.equal(r.months, null);
  assert.equal(r.startVal, null);
  assert.deepEqual(r.series, { labels: [], values: [] });
  const r2 = calcP2P(rows, 'nsa', d(2020, 1, 1), d(2019, 6, 1));
  assert.equal(r2.changePct, null);
  assert.equal(r2.endVal, null);
});

test('calcP2P returns nulls when the start value is zero', () => {
  const rows = monthly(5, i => (i === 0 ? 0 : 100));
  const r = calcP2P(rows, 'nsa', d(2020, 1, 1), d(2020, 5, 1));
  assert.equal(r.changePct, null);
});
