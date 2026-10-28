// auction-results.test.js — shared/src/auction-results.js, the merge and fill rules of 1.4.
// Run: node --test shared/tests/auction-results.test.js
//
// The fixture holds rows captured on 2026-10-21 from the two sources themselves: the
// TreasuryDirect web service (td) and Auctions.csv as FiscalData filled it (s5, under the names of auctions_query,
// which convertOldRow turns into the S5 columns). The agreement test compares the two captured sources with each
// other and uses nothing from the module under test except the column mapping it is checking.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TD_TO_S5, S5_COLUMNS, convertOldRow, mergeAuctionRows, fillFromTreasuryDirect, isNull, easternNow } from '../src/auction-results.js';

const fixture = JSON.parse(readFileSync(new URL('./auction-results.fixture.json', import.meta.url), 'utf8'));
const byKey = key => fixture.auctions.find(a => a.key === key);
const POSTED = ['912797VX2|2026-10-15', '91282CRQ6|2026-10-06', '91282CRF0|2026-10-07', '91282CRD5|2026-09-23'];
const UNPOSTED = '912797TM9|2026-10-19';
const TD_ONLY = '912797XA0|2026-10-21';
const s5Of = key => convertOldRow(byKey(key).s5).row;
const headers = S5_COLUMNS;

const comparable = v => {
  const s = String(v).trim().replace(/^(\d{4}-\d\d-\d\d)T.*$/, '$1');
  return s !== '' && isFinite(Number(s)) ? String(Number(s)) : s;
};

test('every mapped column agrees between TreasuryDirect and FiscalData where both state a value', () => {
  const disagreements = [];
  let compared = 0;
  for (const key of POSTED) {
    const { td } = byKey(key);
    const s5 = s5Of(key);
    for (const [field, col] of TD_TO_S5) {
      if (isNull(td[field]) || isNull(s5[col])) continue;
      compared++;
      if (comparable(td[field]) !== comparable(s5[col])) disagreements.push(`${key} ${field} -> ${col}: ${td[field]} vs ${s5[col]}`);
    }
  }
  assert.ok(compared > 100, `only ${compared} values compared`);
  assert.deepEqual(disagreements, []);
});

test('an auction FiscalData states as null takes the values TreasuryDirect states', () => {
  const row = { ...s5Of(UNPOSTED) };
  assert.equal(row.high_price, 'null');
  const { rows, filled, added } = fillFromTreasuryDirect([row], headers, [byKey(UNPOSTED).td]);
  assert.equal(filled, 1);
  assert.equal(added, 0);
  const r = rows[0];
  // Values as TreasuryDirect states them for the 13-Week Bill auctioned 2026-10-19.
  assert.equal(r.investment_rate, '4.195');
  assert.equal(r.high_rate, '4.095');
  assert.equal(r.high_price, '98.964875');
  assert.equal(r.bid_to_cover_ratio, '2.77');
  assert.equal(r.grand_total_par_awarded, '101701941200');
  assert.equal(r.record_date, row.record_date, 'a column the mapping omits is untouched');
});

test('a column that already holds a value is not overwritten', () => {
  const { td } = byKey(POSTED[0]);
  const row = { ...s5Of(POSTED[0]), high_price: '99.000000' };
  const { rows } = fillFromTreasuryDirect([row], headers, [td]);
  assert.equal(rows[0].high_price, '99.000000');
});

test('an auction no S5 row holds is added with its dates as YYYY-MM-DD and every other column null', () => {
  const { rows, filled, added } = fillFromTreasuryDirect([], headers, [byKey(TD_ONLY).td]);
  assert.equal(filled, 0);
  assert.equal(added, 1);
  const r = rows[0];
  assert.equal(r.cusip, '912797XA0');
  assert.equal(r.comp_auction_close_date, '2026-10-21');
  assert.match(r.issue_date, /^\d{4}-\d\d-\d\d$/);
  assert.equal(r.investment_rate, '4.271');
  assert.equal(r.record_date, 'null');
  assert.deepEqual(Object.keys(r), headers);
});

test('filling twice changes nothing the second time', () => {
  const rows = [{ ...s5Of(UNPOSTED) }];
  const td = [byKey(UNPOSTED).td, byKey(TD_ONLY).td];
  const first = fillFromTreasuryDirect(rows, headers, td);
  const second = fillFromTreasuryDirect(first.rows, headers, td);
  assert.equal(second.filled, 0);
  assert.equal(second.added, 0);
  assert.equal(second.rows.length, 2);
});

test('rows come out newest auction date first, then by security term', () => {
  const { rows } = fillFromTreasuryDirect([{ ...s5Of(UNPOSTED) }], headers, [byKey(TD_ONLY).td]);
  assert.deepEqual(rows.map(r => r.comp_auction_close_date), ['2026-10-21', '2026-10-19']);
});

test('a fetched row replaces the existing row, but a null fetched value keeps the existing value', () => {
  const existing = [{ cusip: 'A', comp_auction_close_date: '2026-10-19', security_term: '13-Week', high_price: '98.964875', int_rate: 'null', note: 'old' }];
  const incoming = [{ cusip: 'A', comp_auction_close_date: '2026-10-19', security_term: '13-Week', high_price: 'null', int_rate: '4.1', note: 'new' }];
  const { rows, added } = mergeAuctionRows(existing, incoming);
  assert.equal(added, 0);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].high_price, '98.964875', 'TreasuryDirect-filled value survives a FiscalData row that is still null');
  assert.equal(rows[0].int_rate, '4.1', 'a fetched value replaces an existing null');
  assert.equal(rows[0].note, 'new', 'a fetched value replaces an existing value');
});

test('a fetched value replaces the TreasuryDirect-filled value', () => {
  const existing = [{ cusip: 'A', comp_auction_close_date: '2026-10-19', security_term: '13-Week', high_price: '98.964875' }];
  const incoming = [{ cusip: 'A', comp_auction_close_date: '2026-10-19', security_term: '13-Week', high_price: '98.964900' }];
  assert.equal(mergeAuctionRows(existing, incoming).rows[0].high_price, '98.964900');
});

test('a fetched row with a new key is added', () => {
  const { rows, added } = mergeAuctionRows([], [{ cusip: 'B', comp_auction_close_date: '2026-10-20', security_term: '6-Week' }]);
  assert.equal(added, 1);
  assert.equal(rows.length, 1);
});

test('easternNow gives New York time across daylight saving', () => {
  assert.deepEqual(easternNow(new Date('2026-10-22T15:35:00Z')), { date: '2026-10-22', minutes: 11 * 60 + 35 });
  assert.deepEqual(easternNow(new Date('2027-01-15T16:35:00Z')), { date: '2027-01-15', minutes: 11 * 60 + 35 });
  assert.deepEqual(easternNow(new Date('2026-10-22T03:00:00Z')), { date: '2026-10-21', minutes: 23 * 60 });
});
