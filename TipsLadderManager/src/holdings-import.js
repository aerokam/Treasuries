// holdings-import.js -- Reads a Holdings File (4.2.1): classifies it once, then parses it with
// that format's parser. The broker parser is broker-import.js#parseBrokerCSV; every format
// splits its rows with broker-import.js#parseCSVLine.

import { parseCSVLine, parseBrokerCSV, brokerHeaderColumns } from './broker-import.js';

const CUSIP_RE = /^[A-Z0-9]{9}$/i;

function nonEmptyLines(text) {
  return text.trim().split('\n').filter(l => l.trim());
}

// Index of the first data row of a headerless-or-one-header-row file: the first row, or the
// second when the first row has no CUSIP in its first field.
function firstDataRowIndex(rawLines) {
  return CUSIP_RE.test(parseCSVLine(rawLines[0] ?? '')[0] ?? '') ? 0 : 1;
}

// Classify a Holdings File as the first of these it matches (4.2.1):
// 'holdings-export' | 'broker' | 'tipsladder' | 'plain'.
export function detectHoldingsFormat(text) {
  const rawLines = nonEmptyLines(text);
  if (rawLines.length && rawLines[0].replace(/\s/g, '').toLowerCase() === 'cusip,qty,excess') return 'holdings-export';
  if (rawLines.some(line => brokerHeaderColumns(parseCSVLine(line)))) return 'broker';
  const sample = parseCSVLine(rawLines[firstDataRowIndex(rawLines)] ?? '');
  if (sample.length >= 3 && parseInt(sample[2], 10) >= 2000) return 'tipsladder';
  return 'plain';
}

// A CUSIP absent from TIPS Market Data is dropped (4.2.1) and recorded once in `skipped`, in file order.
// True when a payment date falls on or before the given day (a rung that has matured: maturity proceeds are in
// the account on the payment date, so the day is today, not the settlement date of a trade).
export function maturedOnOrBefore(paymentDate, day) {
  const key = d => d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
  return key(paymentDate) <= key(day);
}

function noteSkipped(skipped, cusip) {
  if (skipped && !skipped.includes(cusip)) skipped.push(cusip);
}

// Holdings Export: header `cusip,qty,excess`; qty = funded quantity, excess = excess quantity.
export function parseHoldingsExport(text, tipsMarketData, skipped, maturedMaturity) {
  const rawLines = nonEmptyLines(text);
  const arr = [];
  for (let i = 1; i < rawLines.length; i++) {
    const parts = parseCSVLine(rawLines[i]);
    if (parts.length < 2) continue;
    const [cusip, qtyStr] = parts;
    if (!CUSIP_RE.test(cusip)) continue;
    if (!tipsMarketData.get(cusip) && !maturedMaturity?.(cusip)) { noteSkipped(skipped, cusip); continue; }
    const fundedQty = parseInt(qtyStr, 10);
    if (isNaN(fundedQty) || fundedQty < 0) continue;
    const excessQty = parts.length >= 3 ? (parseInt(parts[2], 10) || 0) : 0;
    arr.push({ cusip, qty: fundedQty + excessQty, excessQty });
  }
  return arr;
}

// tipsladder.com Format: no header; a CUSIP appears once per year it covers. A row whose year is
// the CUSIP's maturity year states funded quantity; any other year states excess quantity.
export function parseTipsladderComFormat(text, tipsMarketData, skipped, maturedMaturity) {
  const rawLines = nonEmptyLines(text);
  const cusipMap = new Map(); // cusip -> { fundedQty, excessQty }
  for (const line of rawLines) {
    const parts = parseCSVLine(line);
    if (parts.length < 3) continue;
    const [cusip, qtyStr, yearStr] = parts;
    if (!CUSIP_RE.test(cusip)) continue;
    const bond = tipsMarketData.get(cusip);
    const maturity = bond?.maturity ?? maturedMaturity?.(cusip);
    if (!maturity) { noteSkipped(skipped, cusip); continue; }
    const qty = parseInt(qtyStr, 10);
    const year = parseInt(yearStr, 10);
    if (isNaN(qty) || qty < 0 || isNaN(year)) continue;
    if (!cusipMap.has(cusip)) cusipMap.set(cusip, { fundedQty: 0, excessQty: 0 });
    const entry = cusipMap.get(cusip);
    if (year === maturity.getFullYear()) entry.fundedQty += qty;
    else entry.excessQty += qty;
  }
  const arr = [];
  for (const [cusip, { fundedQty, excessQty }] of cusipMap) {
    const total = fundedQty + excessQty;
    if (total > 0) arr.push({ cusip, qty: total, excessQty });
  }
  return arr;
}

// Plain CUSIP/Quantity Format: `cusip,qty` rows, optional header row.
export function parsePlainFormat(text, tipsMarketData, skipped, maturedMaturity) {
  const rawLines = nonEmptyLines(text);
  const arr = [];
  for (let i = firstDataRowIndex(rawLines); i < rawLines.length; i++) {
    const parts = parseCSVLine(rawLines[i]);
    if (parts.length < 2) continue;
    const [cusip, qtyStr] = parts;
    if (!CUSIP_RE.test(cusip)) continue;
    if (!tipsMarketData.get(cusip) && !maturedMaturity?.(cusip)) { noteSkipped(skipped, cusip); continue; }
    const qty = parseInt(qtyStr, 10);
    if (!isNaN(qty) && qty >= 0) arr.push({ cusip, qty });
  }
  return arr;
}

// Classify once, parse once. Returns { format, holdings, skipped }: for 'broker', holdings is
// parseBrokerCSV's { accountName: [{ cusip, qty }] } and skipped is undefined; for the other formats,
// holdings is an array of { cusip, qty, excessQty? } and skipped lists each CUSIP dropped for being
// absent from TIPS Market Data.
// maturedMaturity(cusip), optional, returns the maturity Date of a CUSIP whose rung has matured (kept for
// Available Cash although TIPS Market Data no longer quotes it), else a falsy value.
export function parseHoldingsFile(text, tipsMarketData, maturedMaturity) {
  const format = detectHoldingsFormat(text);
  const skipped = [];
  switch (format) {
    case 'holdings-export': return { format, holdings: parseHoldingsExport(text, tipsMarketData, skipped, maturedMaturity), skipped };
    case 'broker':          return { format, holdings: parseBrokerCSV(text, tipsMarketData).holdings };
    case 'tipsladder':      return { format, holdings: parseTipsladderComFormat(text, tipsMarketData, skipped, maturedMaturity), skipped };
    default:                return { format, holdings: parsePlainFormat(text, tipsMarketData, skipped, maturedMaturity), skipped };
  }
}
