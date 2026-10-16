// tips-yields-split.test.js — Coverage for the three processes that tipsYieldsFromPrices once did
// in one pass: Calculate TIPS yields (3.1.7, shared/src/tips-yields.js), Adjust for seasonality
// (3.2, shared/src/sa-yields.js) and Calculate bid and ask spreads (3.6, shared/src/spreads.js).
// Run: node shared/tests/tips-yields-split.test.js
//
// What it pins: 3.1.7 produces the Ask Yield and Bid Yield and drops a TIPS only for want of a
// usable price; 3.2 keeps a TIPS whose SA Yield cannot be calculated, with no SA Yield; and a TIPS
// with no SA Yield has no SAO Yield and does not disturb the SAO Yield of the others.

import { tipsYieldsFromPrices } from '../src/tips-yields.js';
import { saYieldsFromTipsYields } from '../src/sa-yields.js';
import { addTipsSpreads, addTreasurySpreads } from '../src/spreads.js';
import { calculateSAO } from '../src/spot-curve.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } };

const SETTLE = '2026-06-26';
const row = (cusip, maturity, price) => ({ cusip, coupon: '0.01', maturity, price: String(price), settlementDate: SETTLE });
const quote = (cusip, maturity, askPrice, bidPrice) =>
  ({ cusip, coupon: 0.01, maturity, askPrice, bidPrice, adjAskPrice: askPrice * 1.3, adjBidPrice: bidPrice * 1.3 });

// ── 3.1.7: Ask Yield and Bid Yield, nothing else ────────────────────────────────
{
  const out = tipsYieldsFromPrices([row('A', '2030-07-15', 100), row('B', '2028-01-15', 98)], null, false, null);
  ok(out.length === 2 && out[0].cusip === 'B', 'FedInvest rows returned in maturity order');
  ok(out.every(b => Number.isFinite(b.askYield)), 'every row has an Ask Yield');
  ok(out.every(b => !('saYield' in b) && !('saRatio' in b)), 'no SA Price Factor or SA Yield is produced by 3.1.7');
  ok(out.every(b => !('yieldSpreadBps' in b) && !('priceSpreadPct' in b)), 'no spread is produced by 3.1.7');
  ok(out.every(b => Number.isNaN(b.bidYield)), 'a FedInvest row has no Bid Yield');
}
{
  const dropped = tipsYieldsFromPrices([row('A', '2030-07-15', ''), row('B', '2026-06-26', 100), row('C', '2030-07-15', 100)], null, false, null);
  ok(dropped.length === 1 && dropped[0].cusip === 'C', 'a TIPS with no usable price, or maturing on the Settlement Date, is dropped');
}
{
  const quotes = new Map([
    ['A', quote('A', '2030-07-15', 100, 99.5)],
    ['B', quote('B', '2031-01-15', 100, NaN)],
    ['C', quote('C', '2032-01-15', NaN, 99)],
  ]);
  const out = tipsYieldsFromPrices([], quotes, true, SETTLE);
  ok(out.length === 2, 'a quote with no ask price is dropped');
  const a = out.find(b => b.cusip === 'A'), b = out.find(x => x.cusip === 'B');
  ok(a.bidYield > a.askYield, 'the Bid Yield is higher than the Ask Yield');
  ok(Number.isNaN(b.bidYield) && Number.isFinite(b.askYield), 'a quote with no bid price keeps its Ask Yield and has no Bid Yield');
  ok(a.adjAskPrice === 130 && a.adjBidPrice === 99.5 * 1.3, 'the adjusted ask and bid prices pass through');
}

// ── 3.2: SA Price Factor and SA Yield, TIPS kept without one ────────────────────
const refCpi = [
  { 'Ref CPI Date': '2025-07-15', 'SA Factor': '0.9980' },
  { 'Ref CPI Date': SETTLE, 'SA Factor': '1.0020' },
];
{
  const yields = tipsYieldsFromPrices([row('A', '2030-07-15', 100)], null, false, null);
  const [withSa] = saYieldsFromTipsYields(yields, refCpi);
  ok(Number.isFinite(withSa.saRatio) && Number.isFinite(withSa.saYield), 'SA Price Factor and SA Yield calculated');
  ok(withSa.saYield !== withSa.askYield && withSa.askYield === yields[0].askYield, 'the SA Yield differs from the Ask Yield, which is untouched');

  const [noSa] = saYieldsFromTipsYields(yields, []);
  ok(noSa && noSa.cusip === 'A' && noSa.askYield === yields[0].askYield, 'with no SA Factors the TIPS is kept, with its Ask Yield');
  ok(Number.isNaN(noSa.saYield) && Number.isNaN(noSa.saRatio), 'with no SA Factors the TIPS has no SA Yield');
  ok(saYieldsFromTipsYields(yields, null).length === 1, 'SA Factors that could not be read keep the TIPS');
}

// ── 3.3: a TIPS with no SA Yield has no SAO Yield and leaves the others as they were ────
{
  const mk = (cusip, years, saYield) => ({
    cusip, saYield, maturityDate: new Date(2026 + years, 6, 15), settlementDate: SETTLE,
  });
  const set = [mk('A', 1, 0.0100), mk('B', 2, 0.0110), mk('C', 3, 0.0120), mk('D', 5, 0.0125), mk('E', 7, 0.0130), mk('F', 10, 0.0135)];
  const base = calculateSAO(set.map(b => ({ ...b })));
  const withGap = calculateSAO([...set.map(b => ({ ...b })), mk('G', 4, NaN)]);
  ok(Number.isNaN(withGap[6]), 'the TIPS with no SA Yield has no SAO Yield');
  ok(base.every((v, i) => v === withGap[i]), 'the SAO Yield of every other TIPS is unchanged');
}

// ── 3.6: spreads ────────────────────────────────────────────────────────────────
{
  const [a] = addTipsSpreads([{ askYield: 0.0100, bidYield: 0.0103, adjAskPrice: 130, adjBidPrice: 129 }]);
  ok(Math.abs(a.yieldSpreadBps - 3) < 1e-9, 'TIPS yield spread: bid less ask, in basis points');
  ok(Math.abs(a.priceSpreadPct - (1 / 130) * 100) < 1e-9, 'TIPS price spread: on the adjusted prices');
  const [f] = addTipsSpreads([{ askYield: 0.0100, bidYield: NaN, adjAskPrice: NaN, adjBidPrice: NaN }]);
  ok(Number.isNaN(f.yieldSpreadBps) && Number.isNaN(f.priceSpreadPct), 'no bid: no spread');
  const [t] = addTreasurySpreads([{ yield: 0.04, bidYield: 0.0402, price: 100, bidPrice: 99.9 }]);
  ok(Math.abs(t.yieldSpreadBps - 2) < 1e-9 && Math.abs(t.priceSpreadPct - 0.1) < 1e-9, 'Treasury spreads on the quoted prices');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
