// oid-calculator.js: the OID Calculator page of Taxation of Treasuries.
// Specs: knowledge/8.1_Load_Oid_Inputs.md, 8.2_Calculate_Tips_Oid.md (calculation in shared/src/tips-oid.js),
//        8.3_Render_Oid_Calculator.md (every string below).

import { fetchTipsRefRows, fetchRefCpiRows, fetchMonthlyCpiNsa } from '../../shared/src/market-data.js';
import { calculateTipsOid, tipsOutstandingInRange, rangeDatesOf, totalOid, TREASURY_ROUNDING, NO_ROUNDING } from '../../shared/src/tips-oid.js';

const STYLE = `
  .oid-calc { max-width: 1040px; }
  .oid-calc h1 { font-size: 25px; color: var(--portal-header-bg); margin-top: 0; }
  .oid-help { background: #dfe6e6; border: 1px solid var(--border-light); border-radius: 6px; padding: 4px 18px; margin: 14px 0 18px; }
  .oid-help ul { margin: 6px 0; }
  .oid-help ul ul { margin: 2px 0; }
  #oid-status { font-size: 13px; color: var(--portal-text-muted); margin: 0 0 12px; }
  #oid-status.error { color: #b91c1c; font-weight: 600; }
  .oid-form { display: flex; flex-wrap: wrap; gap: 14px 22px; align-items: flex-end; margin-bottom: 18px; }
  .oid-form label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-weight: 600; color: var(--portal-text-muted); }
  .oid-form [hidden] { display: none; }
  .oid-form input[type=text], .oid-form input[type=number], .oid-form input[type=date] { font-size: 15px; padding: 6px 8px; border: 1px solid var(--border-light); border-radius: 4px; background: #fff; color: var(--portal-text-main); }
  .oid-form input[type=text] { width: 130px; font-family: 'Consolas', monospace; text-transform: uppercase; }
  .oid-form input[type=number] { width: 90px; }
  .oid-form fieldset { border: 1px solid var(--border-light); border-radius: 4px; padding: 4px 12px 6px; }
  .oid-form fieldset legend { font-size: 13px; font-weight: 600; color: var(--portal-text-muted); padding: 0 4px; }
  .oid-form fieldset label { flex-direction: row; align-items: center; gap: 6px; font-weight: 400; font-size: 14px; color: var(--portal-text-main); }
  #oid-result table { border-collapse: collapse; margin: 10px 0 16px; font-size: 14px; }
  #oid-result th { background: var(--portal-header-bg); color: var(--portal-card-text); padding: 6px 14px; text-align: left; font-weight: 600; }
  #oid-result td { padding: 6px 14px; border-bottom: 1px solid var(--border-light); }
  #oid-result td.num { text-align: right; font-family: 'Consolas', monospace; }
  #oid-result .oid-amount { font-size: 21px; font-weight: 700; margin: 6px 0; }
  #oid-result .oid-formula { font-family: 'Consolas', monospace; font-size: 14px; color: var(--portal-text-muted); }
  #oid-result .oid-note { background: #fff7e0; border: 1px solid #e6cf8a; border-radius: 4px; padding: 8px 12px; margin: 10px 0; }
  #oid-result .oid-message { color: #b91c1c; font-weight: 600; }
  .oid-form button, .oid-all-controls button, .oid-use-range { font-size: 14px; padding: 6px 12px; border: 1px solid var(--border-light); border-radius: 4px; background: #fff; color: var(--portal-text-main); cursor: pointer; }
  .oid-all-controls { display: flex; flex-wrap: wrap; gap: 10px 24px; align-items: center; margin: 4px 0 8px; font-size: 14px; }
  .oid-all-controls input[type=number] { width: 80px; font-size: 14px; padding: 4px 6px; }
  #oid-result table.oid-all td, #oid-result table.oid-all th { padding: 4px 10px; }
  #oid-result table.oid-all input[type=number] { width: 70px; font-size: 14px; padding: 3px 5px; }
  #oid-result table.oid-all input[type=date] { font-size: 14px; padding: 3px 5px; }
  #oid-result table.oid-all .oid-use-range { font-size: 12px; padding: 2px 6px; margin-left: 6px; }
  #oid-result table.oid-all tr.oid-total td { font-weight: 700; border-top: 2px solid var(--portal-header-bg); }
  #oid-result table.oid-all .oid-message { font-weight: 400; font-size: 12px; }
  #oid-result table.oid-all small { display: block; color: var(--portal-text-muted); font-size: 11px; }
  #oid-result .oid-hint { color: var(--portal-text-muted); font-style: italic; }
`;

const HELP = `
  <ul>
    <li>OID is the inflation adjustment of a TIPS from a Start Date to an End Date: Par × (Index Ratio of the End Date − Index Ratio of the Start Date).</li>
    <li>Quantity is the number of $1,000 par units. A Quantity of 1 is $1,000 par.</li>
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
    <li>Show all lists every TIPS outstanding between the Start Date and the End Date. Each has its own Quantity, Start Date and End Date, and the total OID is the sum of their OID. Set the Quantity of the TIPS not held to 0.</li>
    <li>Index Ratio, not rounded, is the Ref CPI of the date divided by the Dated Date Ref CPI. Rounded as Treasury rounds it, the ratio is truncated to six decimal places and then rounded to five. Compare the OID of each with Box 8 of the Form 1099-OID.</li>
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

const money = n => (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthName = ym => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1)
  .toLocaleString('en-US', { month: 'long', year: 'numeric' });
const couponText = c => Number((c * 100).toFixed(3)) + '%';

function messageFor(result, tips, refCpiRows, inTable = false) {
  const first = refCpiRows[0].date, last = result.lastKnownRefCpiDate || refCpiRows[refCpiRows.length - 1].date;
  const published = ` Ref CPI values are available from ${first} through ${last}.`;
  switch (result.reason) {
    case 'cusip-not-found': return 'No TIPS has this CUSIP.';
    case 'quantity': return inTable ? 'Quantity is a whole number of 0 or more.' : 'Quantity is a whole number of 1 or more.';
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

function resultHtml(r, tips) {
  const rounded = r.rounding === TREASURY_ROUNDING;
  const ir = x => x.toFixed(rounded ? 5 : 8);
  const row = (label, date, refCpi, ratio) =>
    `<tr><td>${label}</td><td>${date}</td><td class="num">${refCpi.toFixed(5)}</td><td class="num">${ratio}</td></tr>`;
  const startDate = r.startDateReplaced ? `${r.startDateUsed} <em>(entered ${r.startDate})</em>` : r.startDate;
  const endDate = r.endDateLimited
    ? `${r.endDateUsed} <em>(entered ${r.endDate})</em>` : r.endDate;
  let html = `<p>${couponText(tips.coupon)} TIPS due ${tips.maturity}</p>
    <table>
      <thead><tr><th></th><th>Date</th><th>Ref CPI</th><th>Index Ratio</th></tr></thead>
      <tbody>
        ${row('Dated Date', tips.datedDate, r.datedDateRefCpi, '1')}
        ${row('Start Date', startDate, r.startRefCpi, ir(r.startIndexRatio))}
        ${row('End Date', endDate, r.endRefCpi, ir(r.endIndexRatio))}
      </tbody>
    </table>
    <div class="oid-amount">OID ${money(r.oid)}</div>
    <div class="oid-formula">Par ${money(r.par).replace('.00', '')} × (${ir(r.endIndexRatio)} − ${ir(r.startIndexRatio)})</div>`;
  if (r.startDateReplaced) {
    html += `<div class="oid-note">The Start Date is before the Original Issue Date. The OID is calculated from the Original Issue Date, ${r.startDateUsed}.</div>`;
  }
  if (r.endDateLimited) {
    html += `<div class="oid-note">The latest known Ref CPI is that of ${r.lastKnownRefCpiDate}. The OID is calculated as of that date, not as of the End Date entered.</div>`;
  }
  for (const [date, month] of [[r.startDateUsed, r.startCpiMonth], [r.endDate, r.endDateLimited ? null : r.endCpiMonth]]) {
    if (month) {
      html += `<div class="oid-note">Treasury has not yet published the Ref CPI of ${date}. It is known from the CPI-U of ${monthName(month)}, as 31 CFR 356 Appendix B §I.B.3 states for the first day of a month.</div>`;
    }
  }
  if (r.oid < 0) html += '<div class="oid-note">A negative OID is a deflation adjustment.</div>';
  return html;
}

export async function render(container) {
  container.innerHTML = `<style>${STYLE}</style>
    <div class="oid-calc">
      <h1>OID Calculator</h1>
      <div class="oid-help">${HELP}</div>
      <p id="oid-status">Loading…</p>
      <div class="oid-form">
        <label id="oid-cusip-label">CUSIP<input type="text" id="oid-cusip" list="oid-cusips" maxlength="9" autocomplete="off" spellcheck="false"></label>
        <datalist id="oid-cusips"></datalist>
        <button type="button" id="oid-show-all">Show all</button>
        <label id="oid-quantity-label">Quantity<input type="number" id="oid-quantity" min="1" step="1" value="1"></label>
        <label>Start Date<input type="date" id="oid-start"></label>
        <label>End Date<input type="date" id="oid-end"></label>
        <fieldset>
          <legend>Index Ratio</legend>
          <label><input type="radio" name="oid-rounding" value="${NO_ROUNDING}" checked> Not rounded</label>
          <label><input type="radio" name="oid-rounding" value="${TREASURY_ROUNDING}"> Rounded as Treasury rounds it</label>
        </fieldset>
      </div>
      <div id="oid-result"></div>
    </div>`;

  const $ = id => container.querySelector('#' + id);
  const status = $('oid-status');
  const resultEl = $('oid-result');
  const hint = text => { resultEl.innerHTML = `<p class="oid-hint">${text}</p>`; };
  const rounding = () => container.querySelector('input[name="oid-rounding"]:checked').value;
  let showingAll = false;
  hint('Enter a CUSIP, a Start Date and an End Date.');

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
  $('oid-cusips').innerHTML = tipsRows
    .map(t => `<option value="${t.cusip}">${couponText(t.coupon)} due ${t.maturity}</option>`).join('');

  // ---- One TIPS ----
  const update = () => {
    const cusip = $('oid-cusip').value.trim().toUpperCase();
    const startDate = $('oid-start').value;
    const endDate = $('oid-end').value;
    if (!cusip || !startDate || !endDate) {
      hint('Enter a CUSIP, a Start Date and an End Date.');
      return;
    }
    const tips = tipsRows.find(t => t.cusip === cusip);
    const result = calculateTipsOid({
      tips,
      quantity: Number($('oid-quantity').value),
      startDate, endDate, refCpiRows, monthlyCpi,
      rounding: rounding(),
    });
    resultEl.innerHTML = result.ok
      ? resultHtml(result, tips)
      : `<p class="oid-message">${messageFor(result, tips, refCpiRows)}</p>`;
  };

  // ---- Every TIPS in the range ----
  // The state that outlasts a change of the range: the Quantity of a row, the rows checked, and the dates of a
  // row the user changed (8.3 Show all).
  const quantities = new Map();   // cusip -> text of the Quantity field
  const checked = new Set();      // cusips
  const edited = new Map();       // cusip -> { start, end }
  const quantityOf = cusip => (quantities.has(cusip) ? quantities.get(cusip) : '1');

  const rowResult = (tips, qtyText, startDate, endDate) => {
    const qty = qtyText.trim() === '' ? NaN : Number(qtyText);
    if (!Number.isInteger(qty) || qty < 0) return { ok: false, reason: 'quantity' };
    if (qty === 0) return { ok: true, oid: 0 };
    return calculateTipsOid({ tips, quantity: qty, startDate, endDate, refCpiRows, monthlyCpi, rounding: rounding() });
  };

  const showAll = () => {
    const rangeStart = $('oid-start').value;
    const rangeEnd = $('oid-end').value;
    if (!rangeStart || !rangeEnd) { hint('Enter a Start Date and an End Date.'); return; }
    if (rangeStart > rangeEnd) { resultEl.innerHTML = `<p class="oid-message">${messageFor({ reason: 'start-after-end' }, null, refCpiRows)}</p>`; return; }
    const rows = tipsOutstandingInRange(tipsRows, rangeStart, rangeEnd);

    const body = rows.map(t => {
      const def = rangeDatesOf(t, rangeStart, rangeEnd);
      const e = edited.get(t.cusip);
      const start = e ? e.start : def.startDate;
      const end = def.endLocked ? def.endDate : (e ? e.end : def.endDate);
      return `<tr data-cusip="${t.cusip}">
        <td><input type="checkbox" class="oid-check" aria-label="Check ${t.cusip}"${checked.has(t.cusip) ? ' checked' : ''}></td>
        <td>${t.cusip}</td><td>${t.maturity}</td><td class="num">${couponText(t.coupon)}</td>
        <td><input type="number" class="oid-qty" min="0" step="1" value="${quantityOf(t.cusip)}"></td>
        <td><input type="date" class="oid-row-start" value="${start}"></td>
        <td><input type="date" class="oid-row-end" value="${end}"${def.endLocked ? ' disabled' : ''}>${e ? '<button type="button" class="oid-use-range">Use range</button>' : ''}</td>
        <td class="num oid-cell"></td>
      </tr>`;
    }).join('');

    resultEl.innerHTML = `
      <div class="oid-all-controls">
        <span><input type="number" id="oid-set-all-value" min="0" step="1" value="0" aria-label="Quantity for all"> <button type="button" id="oid-set-all">Set all</button></span>
        <span><input type="number" id="oid-set-checked-value" min="0" step="1" value="0" aria-label="Quantity for the checked rows"> <button type="button" id="oid-set-checked">Set checked</button></span>
      </div>
      <table class="oid-all">
        <thead><tr><th><input type="checkbox" id="oid-check-all" aria-label="Check every row"></th><th>CUSIP</th><th>Maturity Date</th><th>Coupon</th><th>Quantity</th><th>Start Date</th><th>End Date</th><th>OID</th></tr></thead>
        <tbody>${body}</tbody>
        <tfoot><tr class="oid-total"><td colspan="7">Total OID</td><td class="num" id="oid-total"></td></tr></tfoot>
      </table>
      <div id="oid-all-notes"></div>`;

    const trs = [...resultEl.querySelectorAll('tbody tr')];
    const rowOf = tr => rows.find(t => t.cusip === tr.dataset.cusip);

    const recompute = () => {
      const results = [];
      const unpublished = new Set();
      let limited = null;
      for (const tr of trs) {
        const tips = rowOf(tr);
        const r = rowResult(tips, tr.querySelector('.oid-qty').value, tr.querySelector('.oid-row-start').value, tr.querySelector('.oid-row-end').value);
        results.push(r);
        const cell = tr.querySelector('.oid-cell');
        if (!r.ok) {
          cell.innerHTML = `<span class="oid-message">${messageFor(r, tips, refCpiRows, true)}</span>`;
          continue;
        }
        cell.innerHTML = money(r.oid) + (r.endDateLimited ? `<small>as of ${r.endDateUsed}</small>` : '');
        if (r.endDateLimited) limited = r.lastKnownRefCpiDate;
        if (r.startCpiMonth) unpublished.add(r.startDateUsed);
        if (r.endCpiMonth && !r.endDateLimited) unpublished.add(r.endDate);
      }
      const { total, without } = totalOid(results);
      $('oid-total').innerHTML = money(total) + (without ? ` <small>no OID for ${without} ${without === 1 ? 'row' : 'rows'}</small>` : '');
      let notes = '';
      if (limited) notes += `<div class="oid-note">The latest known Ref CPI is that of ${limited}. The OID of a row whose End Date is after it is calculated as of that date.</div>`;
      if (unpublished.size) notes += `<div class="oid-note">Treasury has not yet published the Ref CPI of ${[...unpublished].sort().join(', ')}. Each is known from the CPI-U of the month three months earlier, as 31 CFR 356 Appendix B §I.B.3 states for the first day of a month.</div>`;
      $('oid-all-notes').innerHTML = notes;
    };

    const setQuantity = (tr, value) => {
      tr.querySelector('.oid-qty').value = value;
      quantities.set(tr.dataset.cusip, String(value));
    };
    const setBulk = (selectFn, valueId) => {
      const v = $(valueId).value;
      for (const tr of trs.filter(selectFn)) setQuantity(tr, v);
      recompute();
    };
    $('oid-set-all').addEventListener('click', () => setBulk(() => true, 'oid-set-all-value'));
    $('oid-set-checked').addEventListener('click', () => setBulk(tr => tr.querySelector('.oid-check').checked, 'oid-set-checked-value'));

    const checkAll = $('oid-check-all');
    checkAll.addEventListener('change', () => {
      for (const tr of trs) {
        tr.querySelector('.oid-check').checked = checkAll.checked;
        if (checkAll.checked) checked.add(tr.dataset.cusip); else checked.delete(tr.dataset.cusip);
      }
    });
    let lastClicked = -1;
    trs.forEach((tr, i) => {
      const box = tr.querySelector('.oid-check');
      box.addEventListener('click', ev => {
        if (ev.shiftKey && lastClicked >= 0) {
          const [a, b] = [Math.min(lastClicked, i), Math.max(lastClicked, i)];
          for (let k = a; k <= b; k++) {
            trs[k].querySelector('.oid-check').checked = box.checked;
            if (box.checked) checked.add(trs[k].dataset.cusip); else checked.delete(trs[k].dataset.cusip);
          }
        } else if (box.checked) checked.add(tr.dataset.cusip); else checked.delete(tr.dataset.cusip);
        lastClicked = i;
      });
      tr.querySelector('.oid-qty').addEventListener('input', ev => { quantities.set(tr.dataset.cusip, ev.target.value); recompute(); });
      const startEl = tr.querySelector('.oid-row-start'), endEl = tr.querySelector('.oid-row-end');
      const useRange = () => { edited.delete(tr.dataset.cusip); showAll(); };
      const markEdited = () => {
        edited.set(tr.dataset.cusip, { start: startEl.value, end: endEl.value });
        if (!tr.querySelector('.oid-use-range')) {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'oid-use-range'; b.textContent = 'Use range';
          b.addEventListener('click', useRange);
          endEl.after(b);
        }
      };
      startEl.addEventListener('input', () => { markEdited(); recompute(); });
      endEl.addEventListener('input', () => { markEdited(); recompute(); });
      // A Start Date entered before the Original Issue Date is replaced in the field by the Original Issue Date.
      startEl.addEventListener('change', () => {
        const issued = rowOf(tr).originalIssueDate;
        if (startEl.value && startEl.value < issued) { startEl.value = issued; markEdited(); recompute(); }
      });
      const existing = tr.querySelector('.oid-use-range');
      if (existing) existing.addEventListener('click', useRange);
    });
    recompute();
  };

  const refresh = () => (showingAll ? showAll() : update());

  $('oid-show-all').addEventListener('click', () => {
    showingAll = !showingAll;
    $('oid-show-all').textContent = showingAll ? 'Show one CUSIP' : 'Show all';
    $('oid-cusip-label').hidden = showingAll;
    $('oid-quantity-label').hidden = showingAll;
    refresh();
  });
  container.querySelectorAll('.oid-form input').forEach(el => el.addEventListener('input', refresh));
  update();
}
