// orders-file.js: reads a CSV file of acquisitions into the entries of the OID Calculator.
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

// The lines of the file after a header, each { number (in the file), cusip, par, acquisition, disposition } as written.
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

// The entry of one line within the range, { tips, quantity, startDate, endDate }, or { reason } when the line gives none.
// The OID calculation itself is left to the caller, whose reason for no result is the last one.
export function entryOfLine(line, { tipsRows, rangeStart, rangeEnd }) {
  const [cusipText, parText, acquisitionText, dispositionText] = line.cells;
  if (line.cells.length < 3 || !cusipText || !parText || !acquisitionText) return { reason: 'Needs a CUSIP, a quantity and an Acquisition Date.' };
  const cusip = cusipText.toUpperCase();
  const tips = tipsRows.find(t => t.cusip === cusip);
  if (!tips) return { reason: `${cusipText} is not in the TIPS reference data.` };
  const par = Number(parText.replace(/[$,\s]/g, ''));
  if (!Number.isInteger(par) || par < 1000 || par % 1000 !== 0) return { reason: 'Quantity is a par amount that is a multiple of 1,000, from 1,000.' };
  const acquisition = isoDateOf(acquisitionText);
  if (!acquisition) return { reason: 'Acquisition Date is not a date.' };
  const stated = (dispositionText ?? '').trim() !== '';
  const disposition = stated ? isoDateOf(dispositionText) : null;
  if (stated && !disposition) return { reason: 'Disposition Date is not a date.' };
  if (acquisition > rangeEnd) return { reason: 'Acquisition Date is after the End Date of the range.' };
  if (disposition && disposition < rangeStart) return { reason: 'Disposition Date is before the Start Date of the range.' };
  if (disposition && disposition < acquisition) return { reason: 'Disposition Date is before the Acquisition Date.' };
  let startDate = acquisition < rangeStart ? rangeStart : acquisition;
  if (startDate < tips.originalIssueDate) startDate = tips.originalIssueDate;
  let endDate = disposition && disposition <= rangeEnd ? disposition : rangeEnd;
  // A Start Date after the Maturity Date keeps the End Date of the range, so the calculation gives its reason.
  if (tips.maturity < endDate && tips.maturity >= startDate) endDate = tips.maturity;
  return { tips, quantity: par / 1000, startDate, endDate };
}
