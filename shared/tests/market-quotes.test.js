// market-quotes.test.js -- Regression coverage for shared/src/market-quotes.js, the parser of
// Market quotes (S7), knowledge/DATA_DICTIONARY.md#s7.
// Run: node shared/tests/market-quotes.test.js

import { parseDownloadDate, downloadDateIso, parseTipsQuotes, parseTreasuryQuotes } from '../src/market-quotes.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } };
const near = (a, b, tol = 1e-9) => Math.abs(a - b) < tol;

const HEADER = 'type,cusip,maturity,coupon,askPrice,bidPrice,adjAskPrice,adjBidPrice';
const FILE = [
  '2026-03-25 08:27',
  HEADER,
  'Treasury,912797TB3,2026-06-26,0,99.06,99.04,,',
  'Treasury,91282CBT7,2028-03-25,0.0425,100,99.9,,',
  'Treasury,91282CKH3,2031-03-25,0.0435,100,,,',
  'Treasury,912797XX0,2026-06-30,0,,99.5,,',
  'Treasury,912797TB3,2026-06-26,0,1,1,,',
  'TIPS,91282CCA7,2026-04-15,0.00125,100.132,100.062,124.098594,124.011839',
  'TIPS,912828S50,2026-07-15,0.00125,101.284,,137.335026,',
  'TIPS,91282CCA7,2026-04-15,0.00125,1,1,1,1',
].join('\n');

// ── Download Date ──
ok(parseDownloadDate(FILE) === '2026-03-25 08:27', 'the Download Date is the first line');
ok(downloadDateIso(parseDownloadDate(FILE)) === '2026-03-25', 'the date part of the Download Date');
ok(parseDownloadDate('type,cusip\nTIPS,1') === null, 'a first line that is not a stamp gives no Download Date');
ok(parseDownloadDate('') === null, 'an empty file gives no Download Date');
ok(downloadDateIso(null) === null, 'no stamp gives no date');
ok(parseDownloadDate('﻿2026-03-25 08:27\n' + HEADER) === '2026-03-25 08:27', 'a leading byte order mark is ignored');

// ── TIPS Quotes ──
{
  const tips = parseTipsQuotes(FILE);
  ok(tips.length === 2, `two TIPS, the duplicate CUSIP dropped (got ${tips.length})`);
  const a = tips[0];
  ok(a.cusip === '91282CCA7' && a.maturity === '2026-04-15', 'CUSIP and maturity');
  ok(near(a.coupon, 0.00125), 'coupon is a decimal');
  ok(a.askPrice === 100.132 && a.bidPrice === 100.062, 'ask and bid price');
  ok(a.adjAskPrice === 124.098594 && a.adjBidPrice === 124.011839, 'adjusted ask and bid price');
  ok(a.askPrice !== 1, 'the first occurrence of a CUSIP wins');
  const b = tips[1];
  ok(Number.isNaN(b.bidPrice) && Number.isNaN(b.adjBidPrice), 'a missing side is NaN');
}

// ── Treasury Quotes ──
{
  const rows = parseTreasuryQuotes(FILE, { settleIso: '2026-03-26' });
  const by = c => rows.find(r => r.cusip === c);
  ok(!rows.some(r => r.cusip === '91282CCA7'), 'a TIPS row is not a Treasury Quote');
  ok(!by('912797XX0'), 'a row with no ask price has no yield and is dropped');
  ok(rows.filter(r => r.cusip === '912797TB3').length === 1, 'the duplicate CUSIP is dropped');
  ok(by('912797TB3').cusipType === 'Bill' && by('91282CBT7').cusipType === 'Note', 'type from the CUSIP root');
  ok(by('912797TB3').price === 99.06 && by('912797TB3').bidPrice === 99.04, 'ask and bid price');
  ok(by('91282CBT7').yield > 0 && by('91282CBT7').bidYield > by('91282CBT7').yield, 'both yields calculated, bid yield above ask yield');
  ok(near(by('91282CBT7').yield, 0.0425, 1e-3), 'a 4.25% note at par yields about 4.25%');
  ok(Number.isNaN(by('91282CKH3').bidYield), 'no bid price gives a bid yield of NaN and keeps the ask yield');
  ok(by('91282CKH3').yield > 0, 'ask yield kept without a bid');
  ok(rows.every((r, i) => i === 0 || rows[i - 1].maturityDate <= r.maturityDate), 'sorted by maturity');
  ok(rows.every(r => r.settlementDate === '2026-03-26'), 'each row carries the settlement date');
}
{
  const unknown = [];
  const rows = parseTreasuryQuotes([FILE.split('\n')[0], HEADER, 'Treasury,999999AA1,2030-01-15,0.03,100,99.9,,'].join('\n'),
    { settleIso: '2026-03-26', onUnknownCusip: c => unknown.push(c) });
  ok(rows.length === 1 && rows[0].cusipType === 'Unclassified', 'an unrecognised CUSIP root is kept as Unclassified');
  ok(unknown.length === 1 && unknown[0] === '999999AA1', 'the unrecognised CUSIP is reported');
}

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
