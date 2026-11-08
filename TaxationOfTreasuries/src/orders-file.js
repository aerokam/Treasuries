// orders-file.js: reads a CSV file of transactions into the entries of the OID Calculator.
// Spec: knowledge/8.3_Render_Oid_Calculator.md §Import (every string below).

import { parseCsvLine } from '../../shared/src/csv.js';

const CUSIP = /^[0-9A-Za-z]{9}$/;

// A date written MM/DD/YYYY or YYYY-MM-DD as YYYY-MM-DD; null when it is not a date.
export function isoDateOf(text) {
  const s = (text ?? '').trim();
  let y, m, d;
  let match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (match) { m = +match[1]; d = +match[2]; y = +match[3]; }
  else if ((match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s))) { y = +match[1]; m = +match[2]; d = +match[3]; }
  else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// The lines of the file after a header, each { number (in the file), cells } as written.
// Blank lines are not lines of the file here. A first line whose first cell is not a CUSIP is a header.
export function parseOrdersFile(text) {
  const raw = (text ?? '').replace(/^﻿/, '').split(/\r?\n/);
  const lines = [];
  let first = true;
  raw.forEach((line, i) => {
    if (!line.trim()) return;
    const cells = parseCsvLine(line);
    if (first) { first = false; if (!CUSIP.test(cells[0] ?? '')) return; }
    lines.push({ number: i + 1, cells });
  });
  return lines;
}

// The transaction of one line, { number, tips, quantity (negative for a sale), date }, or { reason } when the line gives none.
export function transactionOfLine(line, { tipsRows }) {
  const [cusipText, parText, dateText] = line.cells;
  if (line.cells.length < 3 || !cusipText || !parText || !dateText) return { reason: 'Needs a CUSIP, a quantity and a Settlement Date.' };
  const cusip = cusipText.toUpperCase();
  const tips = tipsRows.find(t => t.cusip === cusip);
  if (!tips) return { reason: `${cusipText} is not in the TIPS reference data.` };
  const par = Number(parText.replace(/[$,\s]/g, ''));
  if (!Number.isInteger(par) || par === 0 || par % 1000 !== 0) return { reason: 'Quantity is a par amount that is a multiple of 1,000, negative for a sale.' };
  const date = isoDateOf(dateText);
  if (!date) return { reason: 'Settlement Date is not a date.' };
  return { number: line.number, tips, quantity: par / 1000, date };
}

// The entries of the transactions within the range, each { number (of the line it comes from), tips, quantity, startDate, endDate }.
// The OID calculation itself is left to the caller, whose reason for no result is the last one.
export function entriesOfTransactions(transactions, { rangeStart, rangeEnd }) {
  const entries = [];
  const byCusip = new Map();
  for (const t of transactions) {
    if (t.date > rangeEnd) continue; // after the range: no holding within it
    if (!byCusip.has(t.tips.cusip)) byCusip.set(t.tips.cusip, []);
    byCusip.get(t.tips.cusip).push(t);
  }
  for (const list of byCusip.values()) {
    const tips = list[0].tips;
    // A Start Date before the range is the Start Date of the range, and before the Original Issue Date, that date.
    const startOf = date => {
      const s = date < rangeStart ? rangeStart : date;
      return s < tips.originalIssueDate ? tips.originalIssueDate : s;
    };
    // An End Date after the Maturity Date is the Maturity Date, unless the Start Date is after it: the calculation then gives its reason.
    const emit = (number, quantity, startDate, endDate) => {
      if (tips.maturity < endDate && tips.maturity >= startDate) endDate = tips.maturity;
      if (startDate === endDate) return;
      entries.push({ number, tips, quantity, startDate, endDate });
    };
    // By Settlement Date, a purchase before a sale of the same day, then by line.
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date) || (b.quantity > 0) - (a.quantity > 0) || a.number - b.number);
    const lots = [];
    for (const t of sorted) {
      if (t.quantity > 0) { lots.push({ number: t.number, remaining: t.quantity, startDate: startOf(t.date) }); continue; }
      let toClose = -t.quantity;
      // A sale before the range ends no holding within it, and leaves no entry.
      const inRange = t.date >= rangeStart;
      for (const lot of lots) {
        if (!toClose) break;
        const taken = Math.min(lot.remaining, toClose);
        if (!taken) continue;
        lot.remaining -= taken;
        toClose -= taken;
        if (inRange) emit(t.number, taken, lot.startDate, t.date);
      }
      // What the acquisitions of the file do not hold was held before the range.
      if (toClose && inRange) emit(t.number, toClose, startOf(rangeStart), t.date);
    }
    for (const lot of lots) if (lot.remaining) emit(lot.number, lot.remaining, lot.startDate, rangeEnd);
  }
  // In the order of the lines of the file.
  return entries.sort((a, b) => a.number - b.number);
}
