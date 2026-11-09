// tips-reference-rows.test.js — shared/src/tips-reference-rows.js, the TIPS Reference Rows (DD §6.7).
// Run: node --test shared/tests/tips-reference-rows.test.js
// Specs: TipsReference/knowledge/6.1_Load_TIPS_Data.md and 6.2_Calculate_Index_Ratios_And_Coupons.md.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTipsReferenceRows, applyInterestRefCpiDate, isOutstanding } from '../src/tips-reference-rows.js';

// The 3 5/8% TIPS due 2008-01-15 of the 31 CFR 356 App. B worked example: Ref CPI on 1998-10-15 is 163.29032 and
// the dated date Ref CPI is 161.55484, so the Accrued Interest (Adjusted) on 1998-10-15 is 9.15983 per $1,000.
const refCpiRows = [
  { date: '1998-10-01', refCpi: 162.0 },
  { date: '1998-10-15', refCpi: 163.29032 },
  { date: '1998-10-20', refCpi: 163.6 },
  { date: '1998-11-02', refCpi: 164.0 },
  { date: '1999-01-15', refCpi: 164.5 },
];
const tipsRefRows = [
  { cusip: 'CFR', maturity: '2008-01-15', datedDate: '1998-01-15', coupon: 0.03625, datedDateRefCpi: 161.55484 },
  { cusip: 'MATURED', maturity: '1998-10-01', datedDate: '1993-10-15', coupon: 0.03625, datedDateRefCpi: 150 },
];
const quotes = [{ cusip: 'CFR', price: 100, yield: 0.036, saYield: 0.034 }];
const todayStr = '1998-10-20';
const build = () => buildTipsReferenceRows({ tipsRefRows, quotes, refCpiRows, settlementDateStr: '1998-11-02', todayStr });

test('Index Ratio is Treasury-rounded and Adj Price uses the unrounded ratio, both at the Settlement Ref CPI', () => {
  const { rows, settlementRefCpi } = build();
  assert.equal(settlementRefCpi, 164.0);
  assert.equal(rows[0].indexRatio, 1.01514);                       // 164 / 161.55484 = 1.0151351..., truncated to 1.015135 and rounded to 1.01514
  assert.equal(rows[0].adjPrice, 100 * (164 / 161.55484));          // not 100 x 1.01514
});

test('a row carries its quote, SA Yield, Term and durations, and a TIPS with no quote has none of them', () => {
  const { rows } = build();
  assert.equal(rows[0].price, 100);
  assert.equal(rows[0].yield, 0.036);
  assert.equal(rows[0].saYield, 0.034);
  assert.equal(rows[0].term, (Date.UTC(2008, 0, 15) - Date.UTC(1998, 10, 2)) / 86400000 / 365.25);   // from the Settlement Date, over 365.25 days from one year
  assert.ok(rows[0].macDuration > 0 && rows[0].modDuration > 0 && rows[0].modDuration < rows[0].macDuration);
  assert.equal(rows[1].price, null);
  assert.equal(rows[1].adjPrice, null);
  assert.equal(rows[1].macDuration, null);
  assert.equal(rows[1].term, null);
});

test('a TIPS that matured before today takes the Ref CPI of its Maturity Date for Index Ratio', () => {
  const { rows } = build();
  assert.equal(rows[1].indexRatio, 1.08);                           // 162.0 on 1998-10-01 / 150
});

test('the Interest Ref CPI Date gives the CFR Accrued Interest (Adjusted) and the next coupon', () => {
  const { rows } = build();
  const r = applyInterestRefCpiDate(rows, { refCpiRows, bondHolidays: new Set(), interestRefCpiDateStr: '1998-10-15', todayStr });
  assert.equal(r.interestRefCpi, 163.29032);
  assert.equal(r.cpnKnown, true);
  assert.equal(rows[0].accruedInterest, 9.15983);
  assert.equal(rows[0].nextCoupon, '1999-01-15');
  assert.equal(rows[0].cpnDateIR, 1.01823);                         // 164.5 / 161.55484
  assert.ok(Math.abs(rows[0].cpnPayment - 0.03625 / 2 * 1.01823 * 1000) < 1e-9);
  assert.equal(rows[1].nextCoupon, null, 'a TIPS matured before the Interest Ref CPI Date and not paid today has no coupon');
});

test('a new Interest Ref CPI Date changes the accrued interest and leaves Index Ratio and Adj Price as they are', () => {
  const { rows } = build();
  const before = { ir: rows[0].indexRatio, adj: rows[0].adjPrice };
  applyInterestRefCpiDate(rows, { refCpiRows, bondHolidays: new Set(), interestRefCpiDateStr: '1998-10-15', todayStr });
  const first = rows[0].accruedInterest;
  applyInterestRefCpiDate(rows, { refCpiRows, bondHolidays: new Set(), interestRefCpiDateStr: '1998-10-20', todayStr });
  assert.notEqual(rows[0].accruedInterest, first);
  assert.equal(rows[0].indexRatio, before.ir);
  assert.equal(rows[0].adjPrice, before.adj);
});

test('a Ref CPI Date before the Dated Date gives no Accrued Interest (Adjusted)', () => {
  const { rows } = build();
  applyInterestRefCpiDate(rows, { refCpiRows, bondHolidays: new Set(), interestRefCpiDateStr: '1997-12-31', todayStr });
  assert.equal(rows[0].accruedInterest, null);
});

test('a coupon dated on a Saturday and paid today is the coupon shown, whatever the Interest Ref CPI Date', () => {
  // 2028-07-15 is a Saturday, so the coupon is paid on Monday 2028-07-17.
  const daily = [];
  for (let d = new Date(2028, 5, 1), i = 0; d <= new Date(2028, 7, 31); d.setDate(d.getDate() + 1), i++) {
    const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    daily.push({ date: iso, refCpi: 300 + i * 0.01 });
  }
  const ref = [{ cusip: 'X', maturity: '2038-01-15', datedDate: '2028-01-15', coupon: 0.02, datedDateRefCpi: 250 }];
  const { rows } = buildTipsReferenceRows({ tipsRefRows: ref, quotes: [], refCpiRows: daily, settlementDateStr: '2028-07-17', todayStr: '2028-07-17' });
  applyInterestRefCpiDate(rows, { refCpiRows: daily, bondHolidays: new Set(), interestRefCpiDateStr: '2028-07-17', todayStr: '2028-07-17' });
  assert.equal(rows[0].nextCoupon, '2028-07-15');
  assert.notEqual(rows[0].cpnPayment, null);
});

test('a TIPS maturing on a Saturday is outstanding through the Monday it is paid', () => {
  const row = { maturity: '2026-11-14' };
  assert.equal(isOutstanding(row, new Set(), '2026-11-16'), true);
  assert.equal(isOutstanding(row, new Set(), '2026-11-17'), false);
});
