// market-quotes.js -- shared parser for Market quotes (S7), knowledge/DATA_DICTIONARY.md#s7
// (R2 key Treasuries/MarketQuotes.csv). Spec: YieldCurves/knowledge/
// 3.1_Parse_Sources_And_Calculate_Yields.md#parse-market-quotes (3.1.2).
//
// The two row parsers below are the single canonical home for their respective row types, per
// the no-redundancy directive (projects/CLAUDE.md §2a): each app and acquisition script imports
// them rather than keeping its own copy. What stays with the caller is the part that genuinely
// differs between pipelines -- which CUSIPs to gate on, which settlement date the quote is
// stated at, and what to do with a row that is dropped.
import { parseCsv } from './csv.js';
import { yieldFromPrice } from './bond-math.js';
import { localDate } from './settlement.js';
import { classifyByCusipRoot } from './treasury-cusip.js';

// The file's first line is the Download Date alone, 'YYYY-MM-DD HH:MM' on a 24-hour clock; the
// header is the second line and each line after it is one quote.
function splitStore(text) {
  const lines = (text || '').replace(/^\uFEFF/, '').split(/\r?\n/);
  const first = lines.findIndex(l => l.trim());
  if (first < 0) return { stamp: null, body: '' };
  return { stamp: lines[first].trim(), body: lines.slice(first + 1).join('\n') };
}

// The Download Date line -> 'YYYY-MM-DD HH:MM', or null when the first line is not a stamp.
export function parseDownloadDate(text) {
  const { stamp } = splitStore(text);
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(stamp || '') ? stamp : null;
}

// 'YYYY-MM-DD HH:MM' (the Download Date) -> 'YYYY-MM-DD' (date part only), or null.
export function downloadDateIso(stamp) {
  const m = /^(\d{4}-\d{2}-\d{2})(?: \d{2}:\d{2})?$/.exec(stamp || '');
  return m ? m[1] : null;
}

function quoteRows(text) {
  return parseCsv(splitStore(text).body);
}

// Parses the TIPS Quotes (type === 'TIPS') of Market quotes (S7). One row per CUSIP (first
// occurrence wins on duplicates). Prices are as stored: a missing side is NaN.
// Returns: [{ cusip, coupon (decimal), maturity (ISO or null), askPrice, bidPrice,
//   adjAskPrice, adjBidPrice }]
export function parseTipsQuotes(text) {
  const out = [];
  const seen = new Set();
  for (const row of quoteRows(text)) {
    if ((row.type || '').toLowerCase() !== 'tips') continue;
    const cusip = (row.cusip || '').trim();
    if (!cusip || seen.has(cusip)) continue;
    seen.add(cusip);
    out.push({
      cusip,
      coupon: parseFloat(row.coupon) || 0,
      maturity: /^\d{4}-\d{2}-\d{2}$/.test(row.maturity || '') ? row.maturity : null,
      askPrice: parseFloat(row.askPrice),
      bidPrice: parseFloat(row.bidPrice),
      adjAskPrice: parseFloat(row.adjAskPrice),
      adjBidPrice: parseFloat(row.adjBidPrice),
    });
  }
  return out;
}

// Parses the Treasury Quotes (every row whose type is not TIPS) of Market quotes (S7), and
// calculates both yields. One row per CUSIP, first occurrence winning on duplicates, sorted by
// maturity. STRIPS are Treasury rows too -- the type column does not distinguish them -- so they
// are returned alongside Bills, Notes and Bonds, each row tagged with the type its CUSIP root
// gives. A caller fitting a coupon-bond curve filters them out itself.
//
// Both yields are calculated from the quoted price at `settleIso`, which puts them on one
// convention and makes their difference the spread of 3.6_Calculate_Bid_And_Ask_Spreads.md. A
// row with an ask price but no bid price keeps its ask yield; it has no bid yield and so no
// spread.
//
// A row is dropped when it has no CUSIP, no parseable maturity date, or an ask yield that cannot
// be calculated (for want of an ask price, or for a maturity on or before the settlement date).
// A row whose CUSIP root the Treasury CUSIP reference does not recognise is kept, tagged
// `cusipType: 'Unclassified'`, rather than dropped -- see `onUnknownCusip` below.
//
// Options:
//   settleIso      the settlement date the quoted prices are stated at, 'YYYY-MM-DD'
//   onUnknownCusip called with a CUSIP whose root is unrecognised (the row is still kept as
//                  'Unclassified' -- this is a log hook, not a drop signal)
//
// Returns: [{ cusip, cusipType ('Bill'|'Note'|'Bond'|'STRIPS'|'Unclassified'), coupon, price,
//   bidPrice, yield (calculated ask), bidYield (calculated, NaN where no bid price),
//   maturity (ISO), maturityDate (Date), settlementDate (ISO) }]
export function parseTreasuryQuotes(text, { settleIso = null, onUnknownCusip = null } = {}) {
  const settleDate = localDate(settleIso);
  const bonds = [];
  const seen = new Set();

  for (const row of quoteRows(text)) {
    if ((row.type || '').toLowerCase() === 'tips') continue;

    const cusip = (row.cusip || '').trim();
    if (!cusip || seen.has(cusip)) continue;

    let cusipType = classifyByCusipRoot(cusip);
    if (!cusipType) {
      if (onUnknownCusip) onUnknownCusip(cusip);
      cusipType = 'Unclassified';
    }

    const maturity = /^\d{4}-\d{2}-\d{2}$/.test(row.maturity || '') ? row.maturity : null;
    if (!maturity) continue;
    const maturityDate = localDate(maturity);
    if (!maturityDate) continue;

    const coupon = parseFloat(row.coupon) || 0;
    const price = parseFloat(row.askPrice) || NaN;
    const bidPrice = parseFloat(row.bidPrice);

    const askYield = yieldFromPrice(price, coupon, settleDate, maturityDate);
    if (askYield === null || isNaN(askYield)) continue;
    const bidYield = yieldFromPrice(bidPrice, coupon, settleDate, maturityDate);

    seen.add(cusip);
    bonds.push({
      cusip, cusipType, coupon, price, bidPrice,
      yield: askYield,
      bidYield: bidYield ?? NaN,
      maturity, maturityDate,
      settlementDate: settleIso,
    });
  }
  bonds.sort((a, b) => a.maturityDate - b.maturityDate);
  return bonds;
}
