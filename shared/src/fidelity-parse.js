// fidelity-parse.js -- shared parser for Fidelity's combined Treasury+TIPS CSV export
// (R2 key Treasuries/FidelityTreasuriesTips.csv). Spec: YieldCurves/knowledge/
// 3.1_Parse_Sources_And_Calculate_Yields.md#parse-market-quotes (3.1.2), knowledge/DataStores.md#s7.
//
// Field-shape helpers (cleanFidelityField, fidPriceField, fidParseMaturity, the download-date
// pair) are source-format-only. The two row parsers below are the single canonical home for
// their respective row types, per the no-redundancy directive (projects/CLAUDE.md §2a): each
// app and acquisition script imports them rather than keeping its own copy. What stays with
// the caller is the part that genuinely differs between pipelines -- which CUSIPs to gate on,
// which settlement date the quote is stated at, and what to do with a row that is dropped.
import { parseCsv } from './csv.js';
import { yieldFromPrice } from './bond-math.js';
import { localDate } from './settlement.js';
import { classifyByCusipRoot } from './treasury-cusip.js';

// Strips Excel `="..."` literal-string wrapping Fidelity applies to some fields.
export function cleanFidelityField(val) {
  return (val || '').replace(/^=?["']*/, '').replace(/["']*$/, '').trim();
}

// Extract price from "price/qty(min)" (new format) or plain "price" (old format).
export function fidPriceField(raw) {
  return (raw || '').split('/')[0].replace(/,/g, '').trim();
}

// Parse maturity from YYYY-MM-DD (new format) or MM/DD/YYYY (old format) -> ISO string.
export function fidParseMaturity(s) {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const [mo, dy, yr] = (s || '').split('/');
  return yr ? `${yr}-${mo.padStart(2, '0')}-${dy.padStart(2, '0')}` : null;
}

// Footer line "Date downloaded MM/DD/YYYY HH:MM AM/PM" -> that string, or null.
export function parseFidelityDownloadDate(text) {
  const m = text.match(/Date downloaded\s+([\d/]+ [\d:]+ [AP]M)/i);
  return m ? m[1] : null;
}

// "MM/DD/YYYY HH:MM AM/PM" (the download-date footer) -> "YYYY-MM-DD" (date part only), or null.
export function fidelityDownloadDateIso(dateStr) {
  const [mo, dy, yr] = (dateStr || '').split(' ')[0].split('/').map(Number);
  if (!yr) return null;
  return `${yr}-${String(mo).padStart(2, '0')}-${String(dy).padStart(2, '0')}`;
}

// Parses TIPS rows (Product === 'TIPS') from the combined Fidelity CSV. One row per CUSIP
// (first occurrence wins on duplicates). Yield fields are Fidelity's own quoted values,
// decimal form (e.g. -0.02 = -2%) -- callers decide whether to trust them directly or
// recompute from price via shared/src/bond-math.js's yieldFromPrice.
// Returns: [{ cusip, coupon, maturity (ISO or null), askPrice, bidPrice, adjAskPrice,
//   adjBidPrice, indexRatio, askYield, bidYield }]
export function parseFidelityTipsRows(text) {
  const rows = parseCsv(text);
  const out = [];
  const seen = new Set();
  for (const row of rows) {
    const n = {};
    for (const k in row) n[k.toLowerCase().trim()] = row[k];
    if ((n['product'] || '').toLowerCase() !== 'tips') continue;
    const cusip = cleanFidelityField(n['cusip'] || n['cusip|state']);
    if (!cusip || seen.has(cusip)) continue;
    seen.add(cusip);
    out.push({
      cusip,
      coupon: parseFloat(cleanFidelityField(n['coupon'])) / 100 || 0,
      maturity: fidParseMaturity(cleanFidelityField(n['maturity date'])),
      askPrice: parseFloat(fidPriceField(n['price ask'] || n['ask price/quantity (min)'] || '')),
      bidPrice: parseFloat(fidPriceField(n['price bid'] || n['bid price/quantity (min)'] || '')),
      adjAskPrice: parseFloat(cleanFidelityField(n['adjusted price ask'] || n['adjusted ask price'] || '').replace(/,/g, '')),
      adjBidPrice: parseFloat(cleanFidelityField(n['adjusted price bid'] || n['adjusted bid price'] || '').replace(/,/g, '')),
      indexRatio: parseFloat(cleanFidelityField(n['inflation factor'] || '')),
      askYield: parseFloat(cleanFidelityField(n['ask yield to maturity'] || '')) / 100,
      bidYield: parseFloat(cleanFidelityField(n['yield bid'] || n['yield'] || '')) / 100,
    });
  }
  return out;
}

// Parses nominal Treasury rows (every row whose Product is not TIPS) from the combined
// Fidelity CSV. One row per CUSIP, first occurrence winning on duplicates, sorted by
// maturity. STRIPS are Treasury rows too -- the Product column does not distinguish them --
// so they are returned alongside Bills, Notes and Bonds, each row tagged with the type its
// CUSIP root gives. A caller fitting a coupon-bond curve filters them out itself.
//
// Both yields are calculated from the quoted price at `settleIso`, never read from the quote's
// own ask yield or its unlabeled "Yield" column (the implied bid yield): the price gives a more
// accurate yield than either quoted value, and calculating both sides puts them on one
// convention, which is what makes their difference the spread of
// 3.6_Calculate_Bid_And_Ask_Spreads.md. A row with an ask price but no bid price keeps its ask
// yield; it has no bid yield and so no spread.
//
// A row is dropped when it has no CUSIP, no parseable maturity date, a CUSIP root the Treasury
// CUSIP reference does not recognise, a CUSIP listed in `excludeCusips`, a description naming it
// as TIPS, or an ask yield that cannot be calculated (for want of an ask price, or for a maturity
// on or before the settlement date). Fidelity's own quoted ask yield is not checked for
// presence -- only whether a yield can be calculated from the ask price.
//
// Options:
//   settleIso      the settlement date the quoted prices are stated at, 'YYYY-MM-DD'
//   excludeCusips  CUSIPs another source already knows to be TIPS, which the older export
//                  format does not mark in its Product column
//   onUnknownCusip called with a CUSIP whose root is unrecognised, in place of dropping it
//                  silently
//
// Returns: [{ cusip, cusipType ('Bill'|'Note'|'Bond'|'STRIPS'), coupon, price, bidPrice,
//   yield (calculated ask), bidYield (calculated, NaN where no bid price), maturity (ISO),
//   maturityDate (Date), settlementDate (ISO) }]
export function parseFidelityNominalRows(text, { settleIso = null, excludeCusips = new Set(), onUnknownCusip = null } = {}) {
  const settleDate = localDate(settleIso);
  const rows = parseCsv(text);
  const bonds = [];
  const seen = new Set();

  for (const row of rows) {
    const n = {};
    for (const k in row) n[k.toLowerCase().trim()] = row[k];

    if ((n['product'] || '').toLowerCase() === 'tips') continue;

    const cusip = cleanFidelityField(n['cusip'] || n['cusip|state']);
    const desc = (n['description'] || '').toUpperCase();
    if (!cusip || seen.has(cusip)) continue;
    if (excludeCusips.has(cusip) || /\bTIPS\b/.test(desc)) continue;

    const cusipType = classifyByCusipRoot(cusip);
    if (!cusipType) { if (onUnknownCusip) onUnknownCusip(cusip); continue; }

    const maturity = fidParseMaturity(cleanFidelityField(n['maturity date']));
    if (!maturity) continue;
    const maturityDate = localDate(maturity);
    if (!maturityDate) continue;

    const coupon = parseFloat(cleanFidelityField(n['coupon'])) / 100 || 0;
    const price = parseFloat(fidPriceField(n['price ask'] || n['ask price/quantity (min)'])) || NaN;
    const bidPrice = parseFloat(fidPriceField(n['price bid'] || n['bid price/quantity (min)']));

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
