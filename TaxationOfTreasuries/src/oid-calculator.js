// oid-calculator.js: the OID Calculator page of Taxation of Treasuries.
// Specs: knowledge/8.1_Load_Oid_Inputs.md, 8.2_Calculate_Tips_Oid.md (calculation in shared/src/tips-oid.js),
//        8.3_Render_Oid_Calculator.md (every string below).

import { fetchTipsRefRows, fetchRefCpiRows, fetchMonthlyCpiNsa } from '../../shared/src/market-data.js';
import { initDatePicker } from '../../shared/src/date-picker.js';
import { parseOrdersFile, transactionOfLine, entriesOfTransactions } from './orders-file.js';
import { calculateTipsOid, tipsOutstandingInRange, rangeDatesOf, oidByCusip, TREASURY_ROUNDING, NO_ROUNDING } from '../../shared/src/tips-oid.js';

const STYLE = `
  .oid-calc { max-width: 1040px; }
  .oid-calc h1 { font-size: 25px; color: var(--portal-header-bg); margin-top: 0; }
  .oid-help { background: #dfe6e6; border: 1px solid var(--border-light); border-radius: 6px; padding: 4px 18px; margin: 14px 0 18px; }
  .oid-help ul { margin: 6px 0; }
  .oid-help ul ul { margin: 2px 0; }
  #oid-status { font-size: 13px; color: var(--portal-text-muted); margin: 0 0 12px; }
  #oid-status.error { color: #b91c1c; font-weight: 600; }
  .oid-range, .oid-entry { display: flex; flex-wrap: wrap; gap: 14px 22px; align-items: flex-end; margin-bottom: 14px; }
  .oid-range label, .oid-entry label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-weight: 600; color: var(--portal-text-muted); }
  .oid-range .date-picker, .oid-entry .date-picker { font-size: 14px; padding: 5px 8px; }
  .oid-entry select, .oid-entry input[type=number] { font-size: 14px; padding: 5px 8px; border: 1px solid var(--border-light); border-radius: 4px; background: #fff; color: var(--portal-text-main); }
  .oid-entry select { min-width: 270px; font-family: 'Consolas', monospace; }
  .oid-entry input[type=number] { width: 90px; }
  .oid-range fieldset { border: 1px solid var(--border-light); border-radius: 4px; padding: 4px 12px 6px; }
  .oid-range fieldset legend { font-size: 13px; font-weight: 600; color: var(--portal-text-muted); padding: 0 4px; }
  .oid-range fieldset label { flex-direction: row; align-items: center; gap: 6px; font-weight: 400; font-size: 14px; color: var(--portal-text-main); }
  .oid-import { display: flex; flex-wrap: wrap; gap: 14px 22px; align-items: flex-end; margin-bottom: 8px; }
  .oid-import label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-weight: 600; color: var(--portal-text-muted); }
  #oid-import-message { font-size: 13px; margin: 0 0 12px; }
  #oid-import-message p { margin: 0 0 4px; }
  #oid-import-message ul { margin: 2px 0 0; padding-left: 20px; color: #b91c1c; }
  .oid-entry { padding-top: 12px; border-top: 1px solid var(--border-light); }
  .oid-entry button, #oid-result button { font-size: 14px; padding: 6px 14px; border: 1px solid var(--border-light); border-radius: 4px; background: #fff; color: var(--portal-text-main); cursor: pointer; }
  #oid-form-message { min-height: 1.4em; margin: 0 0 8px; color: #b91c1c; font-weight: 600; }
  #oid-result table { border-collapse: collapse; margin: 10px 0 16px; font-size: 14px; }
  #oid-result th { background: var(--portal-header-bg); color: var(--portal-card-text); padding: 6px 12px; text-align: left; font-weight: 600; }
  #oid-result td { padding: 5px 12px; border-bottom: 1px solid var(--border-light); }
  #oid-result td.num { text-align: right; font-family: 'Consolas', monospace; }
  #oid-result td button { font-size: 12px; padding: 2px 8px; margin-right: 4px; }
  #oid-result tr.oid-subtotal td { font-weight: 700; background: #f1f5f5; }
  #oid-result td.oid-counts { font-weight: 700; }
  #oid-result tr.oid-total td { font-weight: 700; border-top: 2px solid var(--portal-header-bg); }
  #oid-result small { display: block; color: var(--portal-text-muted); font-size: 11px; }
  #oid-result .oid-note { background: #fff7e0; border: 1px solid #e6cf8a; border-radius: 4px; padding: 8px 12px; margin: 10px 0; }
  #oid-result .oid-message { color: #b91c1c; font-weight: 600; }
`;

const HELP = `
  <ul>
    <li>OID is the inflation adjustment of a TIPS from a Start Date to an End Date: Par × (Index Ratio of the End Date − Index Ratio of the Start Date).</li>
    <li>The Start Date and End Date at the top state the range. The CUSIPs offered are the TIPS outstanding in it, and a new entry takes its dates.</li>
    <li>Choose a CUSIP, enter the Quantity, Start Date and End Date of one acquisition, and press Add. A CUSIP acquired on different dates has one entry for each.</li>
    <li>Quantity is the number of $1,000 par units. A Quantity of 1 is $1,000 par.</li>
    <li>Import CSV replaces the entries with those of a file of transactions, one line each: CUSIP, quantity as par (50,000 is a Quantity of 50, and -50,000 is a sale of 50) and Settlement Date. A sale ends the earliest acquisitions of its CUSIP first. An acquisition before the range is held from the Start Date of the range. A TIPS not sold is held to the End Date of the range, or to its Maturity Date when that is earlier.</li>
    <li>Start Date is the first day the TIPS is held in the tax year:
      <ul>
        <li>A TIPS bought in the tax year: the Settlement Date of the purchase, not the Trade Date.</li>
        <li>A TIPS bought in an earlier year: January 1 of the tax year.</li>
        <li>A Start Date before the Original Issue Date of the TIPS is replaced by it.</li>
      </ul>
    </li>
    <li>End Date is the last day of the period:
      <ul>
        <li>A TIPS held at the end of the tax year: January 1 of the next year.</li>
        <li>A TIPS sold during the tax year: the Settlement Date of the sale.</li>
        <li>A TIPS held to maturity: the Maturity Date.</li>
      </ul>
    </li>
    <li>Index Ratio, not rounded, is the Ref CPI of the date divided by the Dated Date Ref CPI. Rounded as Treasury rounds it, the ratio is truncated to six decimal places and then rounded to five. Compare the OID of each CUSIP, the subtotal when it has more than one entry, with Box 8 of the Form 1099-OID.</li>
    <li>When Treasury has not yet published the Ref CPI of a date:
      <ul>
        <li>The first of a month: the Ref CPI is the CPI-U of the month three months earlier, as 31 CFR 356 Appendix B §I.B.3 states. January 1 takes the CPI-U of October.</li>
        <li>Any other date: the OID is calculated as of the latest known Ref CPI, and the result states its date.</li>
      </ul>
    </li>
  </ul>`;

const isIsoDate = s => typeof s === 'string' && s.length === 10 && !Number.isNaN(Date.parse(s));

let loaded = null; // { tipsRows, refCpiRows }, fetched once per page load

function loadInputs() {
  if (!loaded) {
    // CPI history is optional: without it the first of a month after the last Ref CPI date has no Ref CPI.
    loaded = Promise.all([fetchTipsRefRows(), fetchRefCpiRows(), fetchMonthlyCpiNsa().catch(() => null)])
      .then(([tipsRows, refCpiRows, monthlyCpi]) => ({
        tipsRows: tipsRows.filter(r => Number.isFinite(r.datedDateRefCpi) && isIsoDate(r.originalIssueDate)),
        refCpiRows: refCpiRows.filter(r => r.date && Number.isFinite(r.refCpi)),
        monthlyCpi,
      }));
    loaded.catch(() => { loaded = null; }); // a failed load is tried again on the next open
  }
  return loaded;
}

const money = n => (n < 0 ? '-' : '') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const couponText = c => (c * 100).toFixed(3) + '%';

function messageFor(result, tips, refCpiRows) {
  const first = refCpiRows[0].date, last = result.lastKnownRefCpiDate || refCpiRows[refCpiRows.length - 1].date;
  const published = ` Ref CPI values are available from ${first} through ${last}.`;
  switch (result.reason) {
    case 'quantity': return 'Quantity is a whole number of 1 or more.';
    case 'dates-missing': return 'Enter a Start Date and an End Date.';
    case 'start-after-end': return 'The Start Date is after the End Date.';
    case 'start-after-maturity': return `The Start Date is after the Maturity Date, ${tips.maturity}.`;
    case 'end-before-original-issue': return `The End Date is before the Original Issue Date, ${tips.originalIssueDate}.`;
    case 'end-after-maturity': return `The End Date is after the Maturity Date, ${tips.maturity}. For a TIPS held to maturity, enter the Maturity Date.`;
    case 'no-ref-cpi-start': return 'There is no Ref CPI for the Start Date.' + published;
    case 'no-ref-cpi-end': return 'There is no Ref CPI for the End Date.' + published;
    default: return 'No result.';
  }
}

export async function render(container) {
  container.innerHTML = `<style>${STYLE}</style>
    <div class="oid-calc">
      <h1>OID Calculator</h1>
      <div class="oid-help">${HELP}</div>
      <p id="oid-status">Loading…</p>
      <div class="oid-range">
        <label>Start Date<input id="oid-start"></label>
        <label>End Date<input id="oid-end"></label>
        <fieldset>
          <legend>Index Ratio</legend>
          <label><input type="radio" name="oid-rounding" value="${NO_ROUNDING}" checked> Not rounded</label>
          <label><input type="radio" name="oid-rounding" value="${TREASURY_ROUNDING}"> Rounded as Treasury rounds it</label>
        </fieldset>
      </div>
      <div class="oid-import"><label>Import CSV<input type="file" id="oid-import" accept=".csv,text/csv"></label></div>
      <div id="oid-import-message"></div>
      <form class="oid-entry" id="oid-entry" novalidate>
        <label>CUSIP<select id="oid-cusip"><option value=""></option></select></label>
        <label>Quantity<input type="number" id="oid-quantity" min="1" step="1"></label>
        <label>Start Date<input id="oid-entry-start"></label>
        <label>End Date<input id="oid-entry-end"></label>
        <button type="submit" id="oid-add">Add</button>
      </form>
      <p id="oid-form-message"></p>
      <div id="oid-result"></div>
    </div>`;

  const $ = id => container.querySelector('#' + id);
  const status = $('oid-status');
  const resultEl = $('oid-result');
  const messageEl = $('oid-form-message');
  const cusipEl = $('oid-cusip'), quantityEl = $('oid-quantity');
  const startEl = $('oid-entry-start'), endEl = $('oid-entry-end');
  const rangeStartEl = $('oid-start'), rangeEndEl = $('oid-end');
  for (const el of [rangeStartEl, rangeEndEl, startEl, endEl]) initDatePicker(el);
  const rounding = () => container.querySelector('input[name="oid-rounding"]:checked').value;
  const setMessage = text => { messageEl.textContent = text; };

  let data;
  try {
    data = await loadInputs();
  } catch (e) {
    status.textContent = 'Load error: ' + e.message;
    status.className = 'error';
    return;
  }
  const { tipsRows, refCpiRows, monthlyCpi } = data;
  status.textContent = `Ref CPI from ${refCpiRows[0].date} through ${refCpiRows[refCpiRows.length - 1].date}`;

  // The entries, and the state of the form (8.3 Entry form).
  let entries = [];       // { id, tips, quantity, startDate, endDate }
  let nextId = 1;
  let startEdited = false, endEdited = false;  // the user changed the field since it took a date of the range
  let editing = false;    // the form holds an entry put there by Edit, whose dates are kept as they are
  let pinned = null;      // the TIPS of that entry, offered in the list although it is not outstanding in the range

  const rangeIsDate = () => isIsoDate(rangeStartEl.value) && isIsoDate(rangeEndEl.value);
  const rangeOk = () => rangeIsDate() && rangeStartEl.value <= rangeEndEl.value;
  const selectedTips = () => tipsRows.find(t => t.cusip === cusipEl.value);

  const rangeMessage = () => {
    if (!rangeIsDate()) return 'Enter a Start Date and an End Date for the range.';
    if (!rangeOk()) return 'The Start Date is after the End Date.';
    return '';
  };

  const refreshList = () => {
    const current = cusipEl.value;
    const list = rangeOk() ? tipsOutstandingInRange(tipsRows, rangeStartEl.value, rangeEndEl.value) : [];
    if (pinned && !list.some(t => t.cusip === pinned.cusip)) {
      list.push(pinned);
      list.sort((a, b) => a.maturity.localeCompare(b.maturity) || a.cusip.localeCompare(b.cusip));
    }
    cusipEl.innerHTML = '<option value=""></option>' + list
      .map(t => `<option value="${t.cusip}">${t.cusip}  ${couponText(t.coupon)} due ${t.maturity}</option>`).join('');
    cusipEl.value = list.some(t => t.cusip === current) ? current : '';
  };

  // The dates of the form until the user changes them: those of the range, as 8.2 gives them for the chosen TIPS.
  const applyDefaults = () => {
    const tips = selectedTips();
    let d = { startDate: rangeStartEl.value, endDate: rangeEndEl.value, endLocked: false };
    if (tips && rangeOk()) d = rangeDatesOf(tips, rangeStartEl.value, rangeEndEl.value);
    const lock = d.endLocked && !editing;
    if (!startEdited) startEl.value = d.startDate;
    if (lock) { endEl.value = d.endDate; endEdited = false; } else if (!endEdited) endEl.value = d.endDate;
    endEl.disabled = lock;
  };

  // The Start Date and End Date of an entry stay within the range (8.3 Entry form).
  const limitsToRange = () => {
    for (const el of [startEl, endEl]) {
      if (rangeOk()) { el.min = rangeStartEl.value; el.max = rangeEndEl.value; } else { el.removeAttribute('min'); el.removeAttribute('max'); }
    }
  };
  const outsideRange = v => rangeOk() && v && (v < rangeStartEl.value || v > rangeEndEl.value);
  const withinRange = v => (rangeOk() && v ? (v < rangeStartEl.value ? rangeStartEl.value : v > rangeEndEl.value ? rangeEndEl.value : v) : v);

  const syncForm = () => { refreshList(); applyDefaults(); limitsToRange(); setMessage(rangeMessage()); };

  // ---- Table of entries ----
  const renderTable = () => {
    if (!entries.length) { resultEl.innerHTML = ''; return; }
    const calc = entries.map(e => ({
      e,
      result: calculateTipsOid({ tips: e.tips, quantity: e.quantity, startDate: e.startDate, endDate: e.endDate, refCpiRows, monthlyCpi, rounding: rounding() }),
    }));
    const good = calc.filter(c => c.result.ok);
    const { groups, total } = oidByCusip(good.map(c => ({ id: c.e.id, tips: c.e.tips, startDate: c.e.startDate, entry: c.e, result: c.result })));

    const unpublished = new Set();
    let limited = null, negative = false;
    const buttons = id => `<td><button type="button" class="oid-edit" data-id="${id}">Edit</button><button type="button" class="oid-remove" data-id="${id}">Remove</button></td>`;
    let body = '';
    for (const g of groups) {
      for (const x of g.entries) {
        const { entry: e, result: r } = x;
        if (r.endDateLimited) limited = r.lastKnownRefCpiDate;
        if (r.startCpiMonth) unpublished.add(r.startDateUsed);
        if (r.endCpiMonth && !r.endDateLimited) unpublished.add(r.endDate);
        if (r.oid < 0) negative = true;
        body += `<tr data-id="${e.id}"><td>${e.tips.cusip}</td><td>${e.tips.maturity}</td><td class="num">${couponText(e.tips.coupon)}</td>
          <td class="num">${e.quantity}</td><td>${e.startDate}</td><td>${e.endDate}</td>
          <td class="num oid-cell${g.subtotal === null ? ' oid-counts' : ''}">${money(r.oid)}${r.endDateLimited ? `<small>as of ${r.endDateUsed}</small>` : ''}</td>${buttons(e.id)}</tr>`;
      }
      if (g.subtotal !== null) {
        body += `<tr class="oid-subtotal"><td colspan="6">Subtotal OID of ${g.tips.cusip}</td><td class="num">${money(g.subtotal)}</td><td></td></tr>`;
      }
    }
    for (const c of calc.filter(c => !c.result.ok)) {
      body += `<tr data-id="${c.e.id}"><td>${c.e.tips.cusip}</td><td colspan="5"><span class="oid-message">${messageFor(c.result, c.e.tips, refCpiRows)}</span></td><td></td>${buttons(c.e.id)}</tr>`;
    }
    let notes = '';
    if (limited) notes += `<div class="oid-note">The latest known Ref CPI is that of ${limited}. The OID of an entry whose End Date is after it is calculated as of that date.</div>`;
    if (unpublished.size) notes += `<div class="oid-note">Treasury has not yet published the Ref CPI of ${[...unpublished].sort().join(', ')}. Each is known from the CPI-U of the month three months earlier, as 31 CFR 356 Appendix B §I.B.3 states for the first day of a month.</div>`;
    if (negative) notes += '<div class="oid-note">A negative OID is a deflation adjustment.</div>';

    resultEl.innerHTML = `<table class="oid-all">
        <thead><tr><th>CUSIP</th><th>Maturity Date</th><th>Coupon</th><th>Quantity</th><th>Start Date</th><th>End Date</th><th>OID</th><th></th></tr></thead>
        <tbody>${body}</tbody>
        <tfoot><tr class="oid-total"><td colspan="6">Total OID</td><td class="num" id="oid-total">${money(total)}</td><td></td></tr></tfoot>
      </table>${notes}`;
  };

  // ---- Add ----
  $('oid-entry').addEventListener('submit', ev => {
    ev.preventDefault();
    const tips = selectedTips();
    if (!tips) { setMessage('Choose a CUSIP.'); return; }
    const qtyText = quantityEl.value.trim();
    const quantity = qtyText === '' ? NaN : Number(qtyText);
    // A Start Date before the Original Issue Date is replaced by it (8.3 Entry form).
    const startDate = startEl.value && startEl.value < tips.originalIssueDate ? tips.originalIssueDate : startEl.value;
    const endDate = endEl.value;
    if (outsideRange(startEl.value) || outsideRange(endDate)) { setMessage('The Start Date and End Date of an entry cannot be outside the range.'); return; }
    const result = calculateTipsOid({ tips, quantity, startDate, endDate, refCpiRows, monthlyCpi, rounding: rounding() });
    if (!result.ok) { setMessage(messageFor(result, tips, refCpiRows)); return; }
    entries.push({ id: nextId++, tips, quantity, startDate, endDate });
    cusipEl.value = '';
    quantityEl.value = '';
    startEdited = endEdited = editing = false;
    pinned = null;
    syncForm();
    renderTable();
    cusipEl.focus();
  });

  // ---- Import (8.3 Import) ----
  $('oid-import').addEventListener('change', async ev => {
    const file = ev.target.files[0];
    if (!file) return;
    ev.target.value = ''; // the same file can be chosen again
    const out = $('oid-import-message');
    const say = text => { const p = document.createElement('p'); p.textContent = text; out.append(p); };
    out.replaceChildren();
    if (!rangeOk()) { say(rangeMessage()); return; }
    const lines = parseOrdersFile(await file.text());
    if (!lines.length) { say('The file has no lines to import.'); return; }
    const range = { rangeStart: rangeStartEl.value, rangeEnd: rangeEndEl.value };
    const imported = [], skipped = new Map(), transactions = [];
    for (const line of lines) {
      const t = transactionOfLine(line, { tipsRows, ...range });
      if (t.reason) skipped.set(line.number, t.reason);
      else transactions.push(t);
    }
    for (const e of entriesOfTransactions(transactions, range)) {
      const result = calculateTipsOid({ tips: e.tips, quantity: e.quantity, startDate: e.startDate, endDate: e.endDate, refCpiRows, monthlyCpi, rounding: rounding() });
      if (!result.ok) { if (!skipped.has(e.number)) skipped.set(e.number, messageFor(result, e.tips, refCpiRows)); }
      else imported.push({ id: nextId++, tips: e.tips, quantity: e.quantity, startDate: e.startDate, endDate: e.endDate });
    }
    if (imported.length) {
      entries = imported;
      startEdited = endEdited = editing = false;
      pinned = null;
      syncForm();
      renderTable();
    }
    say(`Imported ${lines.length - skipped.size} of ${lines.length} lines.`);
    if (skipped.size) {
      const ul = document.createElement('ul');
      for (const [number, reason] of [...skipped].sort((a, b) => a[0] - b[0])) { const li = document.createElement('li'); li.textContent = `Line ${number}: ${reason}`; ul.append(li); }
      out.append(ul);
    }
  });

  // ---- Edit and Remove ----
  resultEl.addEventListener('click', ev => {
    const btn = ev.target.closest('button[data-id]');
    if (!btn) return;
    const e = entries.find(x => x.id === Number(btn.dataset.id));
    if (!e) return;
    entries = entries.filter(x => x !== e);
    if (btn.classList.contains('oid-edit')) {
      pinned = e.tips;
      startEdited = endEdited = editing = true;
      refreshList();
      cusipEl.value = e.tips.cusip;
      quantityEl.value = e.quantity;
      startEl.value = e.startDate;
      endEl.value = e.endDate;
      endEl.disabled = false;
      setMessage(rangeMessage());
      quantityEl.focus();
    }
    renderTable();
  });

  // ---- Changes to the fields ----
  for (const el of [rangeStartEl, rangeEndEl]) el.addEventListener('input', syncForm);
  cusipEl.addEventListener('change', () => { applyDefaults(); setMessage(rangeMessage()); });
  startEl.addEventListener('input', () => { startEdited = true; });
  endEl.addEventListener('input', () => { endEdited = true; });
  // A date outside the range is replaced in the field by the nearest date of the range, and a Start Date before the
  // Original Issue Date of the chosen TIPS by the Original Issue Date. While a year is typed its partial values are
  // dates (0002, 0020, 0202, 2024), so the replacement waits until the year has four digits, when the date is
  // complete, and otherwise until the user leaves the field (8.3 Entry form).
  const settleStart = v => {
    const tips = selectedTips();
    return withinRange(tips && v && v < tips.originalIssueDate ? tips.originalIssueDate : v);
  };
  // The field reports no value while a part of the date is half typed (the 0 of 06), so only the year is followed:
  // the last year it reported, and whether the year has just reached four digits.
  const yearOf = v => (v ? Number(v.slice(0, v.indexOf('-'))) : NaN);
  const settleWhenComplete = (el, settle) => {
    let lastYear = NaN;
    el.addEventListener('focus', () => { lastYear = yearOf(el.value); });
    el.addEventListener('input', () => {
      const year = yearOf(el.value);
      if (Number.isNaN(year)) return;
      const justComplete = year >= 1000 && !(lastYear >= 1000);
      lastYear = year;
      if (justComplete) { el.value = settle(el.value); lastYear = yearOf(el.value); }
    });
    el.addEventListener('blur', () => { el.value = settle(el.value); });
  };
  settleWhenComplete(startEl, settleStart);
  settleWhenComplete(endEl, withinRange);
  container.querySelectorAll('input[name="oid-rounding"]').forEach(el => el.addEventListener('change', renderTable));

  syncForm();
}
