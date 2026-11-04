// tips-oid.test.js: shared/src/tips-oid.js, the OID of a TIPS (DATA_DICTIONARY.md#oid).
// Run: node --test shared/tests/tips-oid.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateTipsOid, TREASURY_ROUNDING, NO_ROUNDING } from '../src/tips-oid.js';

// The 0.125% TIPS due 2025-10-15 of the AMD example in TIPS_OID_Tax_Reference.md: dated date
// 2020-10-15, dated date Ref CPI 259.46997, Ref CPI 312.85893 on 2024-06-14. Quantity 20 is
// $20,000 par. The Ref CPI of the other dates is chosen for each case, not published.
const tips = { cusip: '91282CAQ4', maturity: '2025-10-15', datedDate: '2020-10-15', datedDateRefCpi: 259.46997 };
const rows = [
  { date: '2020-10-15', refCpi: 259.46997 },
  { date: '2024-06-14', refCpi: 312.85893 },
  { date: '2025-01-01', refCpi: 317.603 },
  { date: '2025-02-01', refCpi: 318.5 },
];
const base = { tips, quantity: 20, refCpiRows: rows, rounding: NO_ROUNDING };

test('the OID from the dated date to 2024-06-14 reproduces the inflation adjustment of the AMD example', () => {
  const r = calculateTipsOid({ ...base, acquisitionDate: '2020-10-15', valuationDate: '2024-06-14' });
  assert.equal(r.ok, true);
  assert.equal(r.par, 20000);
  assert.equal(r.acquisitionIndexRatio, 1);
  assert.equal(r.oid, 4115.23);
});

test('Index Ratio rounded as Treasury rounds it gives the OID the AMD example states, three cents lower', () => {
  const r = calculateTipsOid({ ...base, acquisitionDate: '2020-10-15', valuationDate: '2024-06-14', rounding: TREASURY_ROUNDING });
  assert.equal(r.valuationIndexRatio, 1.20576);
  assert.equal(r.oid, 4115.2);
});

test('the OID of a period is Par x the difference of the two Index Ratios', () => {
  const r = calculateTipsOid({ ...base, acquisitionDate: '2024-06-14', valuationDate: '2025-01-01' });
  const expected = Math.round(20000 * (317.603 - 312.85893) / 259.46997 * 100) / 100;
  assert.equal(r.oid, expected);
  assert.equal(r.valuationDateLimited, false);
  assert.equal(r.valuationDateUsed, '2025-01-01');
});

test('the OID scales with Quantity: 1 is $1,000 par', () => {
  const one = calculateTipsOid({ ...base, quantity: 1, acquisitionDate: '2024-06-14', valuationDate: '2025-01-01' });
  assert.equal(one.par, 1000);
  assert.equal(one.oid, Math.round(1000 * (317.603 - 312.85893) / 259.46997 * 100) / 100);
});

test('a negative OID is returned as a negative amount (a deflation adjustment)', () => {
  const r = calculateTipsOid({
    ...base, acquisitionDate: '2025-02-01', valuationDate: '2025-02-01',
    refCpiRows: [...rows.slice(0, 3), { date: '2025-02-01', refCpi: 318.5 }, { date: '2025-03-01', refCpi: 316.0 }],
  });
  assert.equal(r.oid, 0);
  const d = calculateTipsOid({
    ...base, acquisitionDate: '2025-02-01', valuationDate: '2025-03-01',
    refCpiRows: [...rows.slice(0, 3), { date: '2025-02-01', refCpi: 318.5 }, { date: '2025-03-01', refCpi: 316.0 }],
  });
  assert.ok(d.oid < 0);
});

test('a Valuation Date after the last Ref CPI date is calculated at the last Ref CPI date', () => {
  const r = calculateTipsOid({ ...base, acquisitionDate: '2024-06-14', valuationDate: '2025-10-15' });
  assert.equal(r.ok, true);
  assert.equal(r.valuationDateLimited, true);
  assert.equal(r.valuationDateUsed, '2025-02-01');
  assert.equal(r.lastRefCpiDate, '2025-02-01');
  assert.equal(r.valuationRefCpi, 318.5);
});

test('an Acquisition Date after the last Ref CPI date has no result', () => {
  const r = calculateTipsOid({ ...base, acquisitionDate: '2025-06-01', valuationDate: '2025-10-15' });
  assert.deepEqual(r, { ok: false, reason: 'no-ref-cpi-acquisition' });
});

test('each invalid input has its own reason', () => {
  const ok = { ...base, acquisitionDate: '2024-06-14', valuationDate: '2025-01-01' };
  assert.equal(calculateTipsOid({ ...ok, tips: undefined }).reason, 'cusip-not-found');
  assert.equal(calculateTipsOid({ ...ok, quantity: 0 }).reason, 'quantity');
  assert.equal(calculateTipsOid({ ...ok, quantity: 1.5 }).reason, 'quantity');
  assert.equal(calculateTipsOid({ ...ok, valuationDate: '' }).reason, 'dates-missing');
  assert.equal(calculateTipsOid({ ...ok, acquisitionDate: '2025-02-01' }).reason, 'acquisition-after-valuation');
  assert.equal(calculateTipsOid({ ...ok, acquisitionDate: '2020-10-14', valuationDate: '2024-06-14' }).reason, 'acquisition-before-dated-date');
  assert.equal(calculateTipsOid({ ...ok, acquisitionDate: '2025-10-16', valuationDate: '2025-10-16' }).reason, 'acquisition-after-maturity');
  assert.equal(calculateTipsOid({ ...ok, valuationDate: '2026-01-01' }).reason, 'valuation-after-maturity');
  assert.equal(calculateTipsOid({ ...ok, valuationDate: '2024-12-31' }).reason, 'no-ref-cpi-valuation');
});
