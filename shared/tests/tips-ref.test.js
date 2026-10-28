// tips-ref.test.js — shared/src/tips-ref.js, the rows 1.6 writes to TIPS reference data (S2).
// Run: node --test shared/tests/tips-ref.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tipsRefFromV2, mergeTipsRef, tipsRefCsv } from '../src/tips-ref.js';
import { parseCsv } from '../src/csv.js';

// Records as treasury_securities_auctions_v2 answered on 2026-10-28.
const v2 = [
  { cusip: '91282CQP9', ref_cpi_on_orig_dated_date: '325.96740', dated_date: '2026-04-15', maturity_date: '2031-04-15', security_term: '5-Year', int_rate: '1.250' },
  { cusip: '912810US5', ref_cpi_on_orig_dated_date: '324.08800', dated_date: '2026-02-15', maturity_date: '2056-02-15', security_term: '30-Year', int_rate: '2.375' },
];
const announced = { cusip: '91282CRS2', ref_cpi_on_orig_dated_date: null, dated_date: '2027-01-15', maturity_date: '2037-01-15', security_term: '10-Year', int_rate: null };

test('a v2 record becomes a row with the coupon as a decimal', () => {
  assert.deepEqual(tipsRefFromV2(v2)[0], {
    cusip: '91282CQP9', maturity: '2031-04-15', datedDate: '2026-04-15', coupon: 0.0125, datedDateRefCpi: 325.9674, term: '5-Year',
  });
});

test('an announced auction with no interest rate or Ref CPI stated writes no row', () => {
  assert.equal(tipsRefFromV2([...v2, announced]).length, 2);
  assert.equal(tipsRefFromV2([{ ...announced, int_rate: '2.0' }]).length, 0);
  assert.equal(tipsRefFromV2([{ ...announced, ref_cpi_on_orig_dated_date: '330.1' }]).length, 0);
});

test('the merge keeps the older rows, replaces a row of the same CUSIP and orders by maturity', () => {
  const old = parseCsv('cusip,maturity,datedDate,coupon,datedDateRefCpi,term\n9128273A8,2002-07-15,1997-07-15,0.03625,160.15484,5-Year\n912810US5,2056-02-15,2026-02-15,0.02375,324.088,30-Year\n');
  const merged = mergeTipsRef(old, tipsRefFromV2(v2));
  assert.deepEqual(merged.map(r => r.cusip), ['9128273A8', '91282CQP9', '912810US5']);
  assert.equal(merged[0].coupon, '0.03625');
});

test('rows written and read back are the same rows', () => {
  const rows = mergeTipsRef([], tipsRefFromV2(v2));
  const text = tipsRefCsv(rows);
  assert.equal(text.split('\n')[0], 'cusip,maturity,datedDate,coupon,datedDateRefCpi,term');
  assert.deepEqual(parseCsv(text).map(r => [r.cusip, Number(r.coupon), Number(r.datedDateRefCpi)]), rows.map(r => [r.cusip, r.coupon, r.datedDateRefCpi]));
});

test('rewriting the stored rows unchanged reproduces the stored file', () => {
  const text = 'cusip,maturity,datedDate,coupon,datedDateRefCpi,term\n9128273A8,2002-07-15,1997-07-15,0.03625,160.15484,5-Year\n912810US5,2056-02-15,2026-02-15,0.02375,324.088,30-Year\n';
  assert.equal(tipsRefCsv(mergeTipsRef(parseCsv(text), [])), text);
});
