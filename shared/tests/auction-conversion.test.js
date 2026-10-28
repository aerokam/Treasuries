// auction-conversion.test.js — convertOldRow in shared/src/auction-results.js, the conversion of an
// auctions_query row to the columns of treasury_securities_auctions_v2 (Migration_Plan.md step 2).
// Run: node --test shared/tests/auction-conversion.test.js
//
// The fixture holds the auctions that S5 and the new table both state, to 2026-10-22: each as the old row (S5 as it was
// before the conversion) and the new row (FiscalData), captured on the date it names by
// research/auction-results-source/make-conversion-fixture.mjs. The agreement test compares the two captured sources with
// each other, so it fails on a value the conversion writes that the new table states differently.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { convertOldRow, mergeAuctionRows, S5_COLUMNS, DROPPED_OLD_COLUMNS, isNull } from '../src/auction-results.js';

const { pairs } = JSON.parse(readFileSync(new URL('./auction-conversion.fixture.json', import.meta.url), 'utf8'));

// A value equal as text or as a number (the old table writes 5.125000 where the new one writes 5.125).
// Two exceptions are differences between the sources, not of the conversion: the case of pricing_method, and
// cpi_base_reference_period, which the new table writes without `=100` for one auction.
function agree(col, a, b) {
  if (a === b) return true;
  if (Number.isFinite(Number(a)) && Number(a) === Number(b)) return true;
  if (col === 'pricing_method') return a.toLowerCase() === b.toLowerCase();
  if (col === 'cpi_base_reference_period') return a.replace(/=100$/, '') === b.replace(/=100$/, '');
  return false;
}

test('every column of the new table is an S5 column, and the conversion writes only S5 columns', () => {
  const columns = new Set(S5_COLUMNS);
  assert.equal(columns.size, S5_COLUMNS.length);
  for (const { old, v2 } of pairs) {
    for (const c of Object.keys(v2)) assert.ok(columns.has(c), `${c} of the new table is not an S5 column`);
    assert.deepEqual(Object.keys(convertOldRow(old).row), S5_COLUMNS);
  }
});

test('where the converted row and the new table both state a value, the values agree', () => {
  let compared = 0;
  const differences = [];
  for (const { old, v2 } of pairs) {
    const { row } = convertOldRow(old);
    for (const col of S5_COLUMNS) {
      if (isNull(row[col]) || isNull(v2[col])) continue;
      compared++;
      if (!agree(col, row[col], v2[col])) differences.push(`${old.cusip} ${old.auction_date} ${col}: converted ${row[col]}, new table ${v2[col]}`);
    }
  }
  assert.deepEqual(differences, []);
  assert.ok(compared > 20000, `${compared} values compared`);
});

test('every value of an old column that has an S5 column is in the converted row', () => {
  const lost = [];
  for (const { old } of pairs) {
    const { row } = convertOldRow(old);
    const written = new Set(Object.values(row).map(v => String(Number(v)) === 'NaN' ? v : String(Number(v))));
    for (const [col, stated] of Object.entries(old)) {
      if (DROPPED_OLD_COLUMNS.includes(col) || /^security_term_(day_month|week_year)$|^closing_time_/.test(col)) continue;
      const value = stated.replace(/^'(?=-)/, '');
      const v = Number.isFinite(Number(value)) ? String(Number(value)) : value;
      if (!written.has(v)) lost.push(`${old.cusip} ${old.auction_date} ${col} ${value}`);
    }
  }
  assert.deepEqual(lost, []);
});

test('a term of days, weeks, months or years is written to the column of its unit, and zero is not written', () => {
  const { row, flags } = convertOldRow({ security_term_day_month: '28-Day', security_term_week_year: '4-Week' });
  assert.deepEqual([row.security_term_day, row.security_term_week, row.security_term_month, row.security_term_year], ['28', '4', 'null', 'null']);
  const note = convertOldRow({ security_term_day_month: '10-Month', security_term_week_year: '9-Year' });
  assert.deepEqual([note.row.security_term_month, note.row.security_term_year], ['10', '9']);
  const tenYear = convertOldRow({ security_term_day_month: '0-Month', security_term_week_year: '10-Year' });
  assert.equal(tenYear.row.security_term_month, 'null');
  assert.deepEqual(tenYear.flags, ['security_term_day_month 0-Month is zero']);
  assert.deepEqual(flags, []);
});

test('an amount per 100 or per 1000 is written with the face amount it is per', () => {
  const per100 = convertOldRow({ accrued_int_per100: '0.5', price_per100: '99.1' }).row;
  assert.deepEqual([per100.accrued_int, per100.accrued_int_per_amount, per100.high_price, per100.price_per_amt], ['0.5', '100', '99.1', '100']);
  const per1000 = convertOldRow({ accrued_int_per1000: '5', adj_accrued_int_per1000: '6', unadj_accrued_int_per1000: '7' }).row;
  assert.deepEqual([per1000.accrued_int, per1000.adj_accrued_int, per1000.unadj_accrued_int, per1000.accrued_int_per_amount], ['5', '6', '7', '1000']);
  const conflict = convertOldRow({ accrued_int_per100: '0.5', adj_accrued_int_per1000: '6' });
  assert.equal(conflict.flags.length, 1);
});

test('allocation_pctage and max_single_bid follow the rate, yield or discount margin the auction states', () => {
  const bill = convertOldRow({ high_discnt_rate: '4.0', allocation_pctage: '15', max_single_bid: '8' }).row;
  assert.deepEqual([bill.allotted_pctage_high_rate, bill.max_recog_single_rate_bid, bill.max_single_bid], ['15', '8', 'null']);
  const note = convertOldRow({ high_yield: '4.0', allocation_pctage: '26', max_single_bid: '9' }).row;
  assert.deepEqual([note.allotted_pctage_high_yield, note.max_recog_single_yield_bid, note.max_single_bid], ['26', '9', 'null']);
  const frn = convertOldRow({ high_discnt_margin: '0.04', allocation_pctage: '42', max_single_bid: '7' }).row;
  assert.deepEqual([frn.allotted_pct_hi_discnt_margin, frn.max_single_bid], ['42', '7']);
  assert.equal(convertOldRow({ allocation_pctage: '1' }).flags.length, 1);
});

test('avg_med_* is the median of a single-price auction and the average of any other', () => {
  const single = convertOldRow({ auction_format: 'Single-Price', avg_med_yield: '4.5' }).row;
  assert.deepEqual([single.med_yield, single.avg_yield], ['4.5', 'null']);
  const multiple = convertOldRow({ auction_format: 'Multi-Price', avg_med_discnt_rate: '11.04' }).row;
  assert.deepEqual([multiple.avg_rate, multiple.med_rate], ['11.04', 'null']);
  const none = convertOldRow({ avg_med_yield: '4.5' });
  assert.equal(none.row.med_yield, '4.5');
  assert.equal(none.flags.length, 1);
});

test('a close time is written with ET, and an apostrophe before a negative number is removed', () => {
  const { row, flags } = convertOldRow({ closing_time_comp: '01:00 PM', low_discnt_margin: "'-0.035000" });
  assert.equal(row.comp_auction_close_time, '01:00 PM ET');
  assert.equal(row.low_discnt_margin, '-0.035000');
  assert.equal(flags.length, 1);
});

test('mergeAuctionRows on comp_auction_close_date: the new table wins, a null keeps the converted value, an auction not held is added', () => {
  const key = { cusip: 'A', comp_auction_close_date: '2026-10-22' };
  const converted = [{ ...key, security_term: '4-Week', comp_auction_close_time: '11:30 AM ET', grand_total_par_awarded: '1' }];
  const incoming = [
    { ...key, security_term: '4-Week', comp_auction_close_time: 'null', grand_total_par_awarded: '2' },
    { cusip: 'B', comp_auction_close_date: '2026-10-29', security_term: '8-Week', grand_total_par_awarded: 'null' },
  ];
  const { rows, added } = mergeAuctionRows(converted, incoming, 'comp_auction_close_date');
  assert.equal(added, 1);
  assert.deepEqual(rows.map(r => r.cusip), ['B', 'A']);
  assert.deepEqual([rows[1].comp_auction_close_time, rows[1].grand_total_par_awarded], ['11:30 AM ET', '2']);
});
