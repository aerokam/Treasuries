// tips-oid.test.js: shared/src/tips-oid.js, the OID of a TIPS (DATA_DICTIONARY.md#oid).
// Run: node --test shared/tests/tips-oid.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateTipsOid, tipsOutstandingInRange, rangeDatesOf, totalOid, TREASURY_ROUNDING, NO_ROUNDING } from '../src/tips-oid.js';

// The 0.125% TIPS due 2025-10-15 of the AMD example in TIPS_OID_Tax_Reference.md: dated date
// 2020-10-15, dated date Ref CPI 259.46997, Ref CPI 312.85893 on 2024-06-14. Quantity 20 is
// $20,000 par. The Ref CPI of the other dates is chosen for each case, not published.
// The Original Issue Date is set to the dated date so the cases that start there keep the Start Date as entered.
const tips = { cusip: '91282CAQ4', maturity: '2025-10-15', datedDate: '2020-10-15', originalIssueDate: '2020-10-15', datedDateRefCpi: 259.46997 };
const rows = [
  { date: '2020-10-15', refCpi: 259.46997 },
  { date: '2024-06-14', refCpi: 312.85893 },
  { date: '2025-01-01', refCpi: 317.603 },
  { date: '2025-02-01', refCpi: 318.5 },
];
const base = { tips, quantity: 20, refCpiRows: rows, rounding: NO_ROUNDING };

test('the OID from the dated date to 2024-06-14 reproduces the inflation adjustment of the AMD example', () => {
  const r = calculateTipsOid({ ...base, startDate: '2020-10-15', endDate: '2024-06-14' });
  assert.equal(r.ok, true);
  assert.equal(r.par, 20000);
  assert.equal(r.startIndexRatio, 1);
  assert.equal(r.oid, 4115.23);
});

test('Index Ratio rounded as Treasury rounds it gives the OID the AMD example states, three cents lower', () => {
  const r = calculateTipsOid({ ...base, startDate: '2020-10-15', endDate: '2024-06-14', rounding: TREASURY_ROUNDING });
  assert.equal(r.endIndexRatio, 1.20576);
  assert.equal(r.oid, 4115.2);
});

test('the OID of a period is Par x the difference of the two Index Ratios', () => {
  const r = calculateTipsOid({ ...base, startDate: '2024-06-14', endDate: '2025-01-01' });
  const expected = Math.round(20000 * (317.603 - 312.85893) / 259.46997 * 100) / 100;
  assert.equal(r.oid, expected);
  assert.equal(r.endDateLimited, false);
  assert.equal(r.endDateUsed, '2025-01-01');
});

test('the OID scales with Quantity: 1 is $1,000 par', () => {
  const one = calculateTipsOid({ ...base, quantity: 1, startDate: '2024-06-14', endDate: '2025-01-01' });
  assert.equal(one.par, 1000);
  assert.equal(one.oid, Math.round(1000 * (317.603 - 312.85893) / 259.46997 * 100) / 100);
});

test('a negative OID is returned as a negative amount (a deflation adjustment)', () => {
  const r = calculateTipsOid({
    ...base, startDate: '2025-02-01', endDate: '2025-02-01',
    refCpiRows: [...rows.slice(0, 3), { date: '2025-02-01', refCpi: 318.5 }, { date: '2025-03-01', refCpi: 316.0 }],
  });
  assert.equal(r.oid, 0);
  const d = calculateTipsOid({
    ...base, startDate: '2025-02-01', endDate: '2025-03-01',
    refCpiRows: [...rows.slice(0, 3), { date: '2025-02-01', refCpi: 318.5 }, { date: '2025-03-01', refCpi: 316.0 }],
  });
  assert.ok(d.oid < 0);
});

test('an End Date after the last Ref CPI date is calculated at the last Ref CPI date', () => {
  const r = calculateTipsOid({ ...base, startDate: '2024-06-14', endDate: '2025-10-15' });
  assert.equal(r.ok, true);
  assert.equal(r.endDateLimited, true);
  assert.equal(r.endDateUsed, '2025-02-01');
  assert.equal(r.lastKnownRefCpiDate, '2025-02-01');
  assert.equal(r.endRefCpi, 318.5);
});

test('a Start Date after the last Ref CPI date has no result', () => {
  const r = calculateTipsOid({ ...base, startDate: '2025-06-01', endDate: '2025-10-15' });
  assert.deepEqual(r, { ok: false, reason: 'no-ref-cpi-start', lastKnownRefCpiDate: '2025-02-01' });
});

test('each invalid input has its own reason', () => {
  const ok = { ...base, startDate: '2024-06-14', endDate: '2025-01-01' };
  assert.equal(calculateTipsOid({ ...ok, tips: undefined }).reason, 'cusip-not-found');
  assert.equal(calculateTipsOid({ ...ok, quantity: 0 }).reason, 'quantity');
  assert.equal(calculateTipsOid({ ...ok, quantity: 1.5 }).reason, 'quantity');
  assert.equal(calculateTipsOid({ ...ok, endDate: '' }).reason, 'dates-missing');
  assert.equal(calculateTipsOid({ ...ok, startDate: '2025-02-01' }).reason, 'start-after-end');
  assert.equal(calculateTipsOid({ ...ok, startDate: '2020-10-01', endDate: '2020-10-14' }).reason, 'end-before-original-issue');
  assert.equal(calculateTipsOid({ ...ok, startDate: '2025-10-16', endDate: '2025-10-16' }).reason, 'start-after-maturity');
  assert.equal(calculateTipsOid({ ...ok, endDate: '2026-01-01' }).reason, 'end-after-maturity');
  assert.equal(calculateTipsOid({ ...ok, endDate: '2024-12-31' }).reason, 'no-ref-cpi-end');
});

// The first of a month after the last date of the series: the CPI-U NSA of three months earlier, read directly.
const later = { ...tips, maturity: '2030-10-15' };

test('an End Date that is the first of a month after the last Ref CPI date is the CPI-U of the month three months before', () => {
  const r = calculateTipsOid({ ...base, tips: later, startDate: '2024-06-14', endDate: '2025-03-01', monthlyCpi: { '2024-12': 320.123 } });
  assert.equal(r.ok, true);
  assert.equal(r.endDateLimited, false);
  assert.equal(r.endDateUsed, '2025-03-01');
  assert.equal(r.endRefCpi, 320.123);
  assert.equal(r.endCpiMonth, '2024-12');
  assert.equal(r.startCpiMonth, null);
  assert.equal(r.oid, Math.round(20000 * (320.123 - 312.85893) / 259.46997 * 100) / 100);
});

test('January 1 takes the CPI-U of October of the year before', () => {
  const r = calculateTipsOid({ ...base, tips: later, startDate: '2024-06-14', endDate: '2026-01-01', monthlyCpi: { '2025-10': 325.5 } });
  assert.equal(r.endRefCpi, 325.5);
  assert.equal(r.endCpiMonth, '2025-10');
});

test('an End Date after the latest known Ref CPI is calculated at the latest known Ref CPI, or at the last Ref CPI date without CPI history', () => {
  const mid = calculateTipsOid({ ...base, tips: later, startDate: '2024-06-14', endDate: '2025-03-15', monthlyCpi: { '2024-12': 320.123 } });
  assert.equal(mid.endDateLimited, true);
  assert.equal(mid.endDateUsed, '2025-03-01');
  assert.equal(mid.lastKnownRefCpiDate, '2025-03-01');
  const absent = calculateTipsOid({ ...base, tips: later, startDate: '2024-06-14', endDate: '2025-03-01', monthlyCpi: {} });
  assert.equal(absent.endDateLimited, true);
  const none = calculateTipsOid({ ...base, tips: later, startDate: '2024-06-14', endDate: '2025-03-01' });
  assert.equal(none.endDateLimited, true);
});

test('a published Ref CPI is used in place of the CPI-U for the same date', () => {
  const r = calculateTipsOid({ ...base, startDate: '2024-06-14', endDate: '2025-02-01', monthlyCpi: { '2024-11': 999 } });
  assert.equal(r.endRefCpi, 318.5);
  assert.equal(r.endCpiMonth, null);
});

test('the latest known Ref CPI date is the first of the month three months after the latest month of CPI history', () => {
  const rowsToJan31 = [...rows.slice(0, 3), { date: '2025-01-31', refCpi: 318.1 }];
  const known = calculateTipsOid({ ...base, tips: later, refCpiRows: rowsToJan31, startDate: '2024-06-14', endDate: '2025-02-15', monthlyCpi: { '2024-11': 319.5 } });
  assert.equal(known.endDateLimited, true);
  assert.equal(known.endDateUsed, '2025-02-01');
  assert.equal(known.endCpiMonth, '2024-11');
  assert.equal(known.lastKnownRefCpiDate, '2025-02-01');
  const unknown = calculateTipsOid({ ...base, tips: later, refCpiRows: rowsToJan31, startDate: '2024-06-14', endDate: '2025-02-15' });
  assert.equal(unknown.endDateUsed, '2025-01-31');
  assert.equal(unknown.lastKnownRefCpiDate, '2025-01-31');
});

test('a date between the last Ref CPI date and the latest known Ref CPI date is calculated at the last Ref CPI date', () => {
  const rowsToJan31 = [...rows.slice(0, 3), { date: '2025-01-31', refCpi: 318.1 }];
  const r = calculateTipsOid({ ...base, tips: later, refCpiRows: rowsToJan31, startDate: '2024-06-14', endDate: '2025-02-15', monthlyCpi: { '2024-12': 320.123 } });
  assert.equal(r.endDateLimited, true);
  assert.equal(r.endDateUsed, '2025-01-31');
  assert.equal(r.lastKnownRefCpiDate, '2025-03-01');
});

// A TIPS issued after its dated date: the Start Date before the Original Issue Date is replaced by it.
const issuedLater = { ...tips, originalIssueDate: '2024-06-14' };

test('a Start Date before the Original Issue Date is replaced by it, and the Index Ratio is taken there', () => {
  const r = calculateTipsOid({ ...base, tips: issuedLater, startDate: '2020-10-15', endDate: '2025-01-01' });
  assert.equal(r.ok, true);
  assert.equal(r.startDate, '2020-10-15');
  assert.equal(r.startDateUsed, '2024-06-14');
  assert.equal(r.startDateReplaced, true);
  assert.equal(r.startRefCpi, 312.85893);
  assert.equal(r.oid, Math.round(20000 * (317.603 - 312.85893) / 259.46997 * 100) / 100);
});

test('a Start Date on or after the Original Issue Date is used as entered', () => {
  const r = calculateTipsOid({ ...base, tips: issuedLater, startDate: '2024-06-14', endDate: '2025-01-01' });
  assert.equal(r.startDateReplaced, false);
  assert.equal(r.startDateUsed, '2024-06-14');
});

const others = [
  { cusip: 'A', maturity: '2030-01-15', originalIssueDate: '2020-01-31' },
  { cusip: 'B', maturity: '2024-07-15', originalIssueDate: '2014-07-31' },
  { cusip: 'C', maturity: '2034-01-15', originalIssueDate: '2024-01-31' },
  { cusip: 'D', maturity: '2024-01-01', originalIssueDate: '2014-01-31' },
  { cusip: 'E', maturity: '2036-01-15', originalIssueDate: '2025-01-01' },
];

test('the TIPS outstanding in a range are issued before its End Date and mature after its Start Date, by maturity', () => {
  assert.deepEqual(tipsOutstandingInRange(others, '2024-01-01', '2025-01-01').map(t => t.cusip), ['B', 'A', 'C']);
});

test('a TIPS that matures on the Start Date, or is issued on the End Date, is not outstanding in the range', () => {
  const ids = tipsOutstandingInRange(others, '2024-01-01', '2025-01-01').map(t => t.cusip);
  assert.equal(ids.includes('D'), false);
  assert.equal(ids.includes('E'), false);
});

test('a row takes the range, the Original Issue Date when the range starts before it, and a locked Maturity Date when the range ends after it', () => {
  assert.deepEqual(rangeDatesOf(others[0], '2024-01-01', '2025-01-01'), { startDate: '2024-01-01', endDate: '2025-01-01', endLocked: false });
  assert.deepEqual(rangeDatesOf(others[2], '2023-01-01', '2040-01-01'), { startDate: '2024-01-31', endDate: '2034-01-15', endLocked: true });
});

test('the total OID sums the rows that have one and counts the rows that have none', () => {
  assert.deepEqual(totalOid([{ ok: true, oid: 10.1 }, { ok: true, oid: -3.05 }, { ok: false, reason: 'quantity' }, { ok: true, oid: 0 }]), { total: 7.05, without: 1 });
});
