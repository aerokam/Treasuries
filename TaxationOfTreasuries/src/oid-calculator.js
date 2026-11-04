// oid-calculator.js: the OID Calculator page of Taxation of Treasuries.
// Specs: knowledge/12.1_Load_Oid_Inputs.md, 12.2_Calculate_Tips_Oid.md (calculation in shared/src/tips-oid.js),
//        12.3_Render_Oid_Calculator.md (every string below).

import { fetchTipsRefRows, fetchRefCpiRows } from '../../shared/src/market-data.js';
import { calculateTipsOid, TREASURY_ROUNDING, NO_ROUNDING } from '../../shared/src/tips-oid.js';

const STYLE = `
  .oid-calc { max-width: 860px; }
  .oid-calc h1 { font-size: 25px; color: var(--portal-header-bg); margin-top: 0; }
  .oid-help { background: #dfe6e6; border: 1px solid var(--border-light); border-radius: 6px; padding: 4px 18px; margin: 14px 0 18px; }
  .oid-help ul { margin: 6px 0; }
  .oid-help ul ul { margin: 2px 0; }
  #oid-status { font-size: 13px; color: var(--portal-text-muted); margin: 0 0 12px; }
  #oid-status.error { color: #b91c1c; font-weight: 600; }
  .oid-form { display: flex; flex-wrap: wrap; gap: 14px 22px; align-items: flex-end; margin-bottom: 18px; }
  .oid-form label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-weight: 600; color: var(--portal-text-muted); }
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
      </ul>
    </li>
    <li>End Date is the last day of the period:
      <ul>
        <li>A TIPS held at the end of the tax year: January 1 of the next year.</li>
        <li>A TIPS sold during the tax year: the Settlement Date of the sale.</li>
        <li>A TIPS held to maturity: the Maturity Date.</li>
      </ul>
    </li>
    <li>Index Ratio, not rounded, is the Ref CPI of the date divided by the Dated Date Ref CPI. Rounded as Treasury rounds it, the ratio is truncated to six decimal places and then rounded to five. Compare the OID of each with Box 8 of the Form 1099-OID.</li>
    <li>When Ref CPI is not yet published for the End Date, the OID is calculated as of the last date with a published Ref CPI, and the result states that date.</li>
  </ul>`;

let loaded = null; // { tipsRows, refCpiRows }, fetched once per page load

function loadInputs() {
  if (!loaded) {
    loaded = Promise.all([fetchTipsRefRows(), fetchRefCpiRows()]).then(([tipsRows, refCpiRows]) => ({
      tipsRows: tipsRows.filter(r => Number.isFinite(r.datedDateRefCpi)),
      refCpiRows: refCpiRows.filter(r => r.date && Number.isFinite(r.refCpi)),
    }));
    loaded.catch(() => { loaded = null; }); // a failed load is tried again on the next open
  }
  return loaded;
}

const money = n => (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const couponText = c => Number((c * 100).toFixed(3)) + '%';

function messageFor(result, tips, refCpiRows) {
  const first = refCpiRows[0].date, last = refCpiRows[refCpiRows.length - 1].date;
  const published = ` Ref CPI is published from ${first} through ${last}.`;
  switch (result.reason) {
    case 'cusip-not-found': return 'No TIPS has this CUSIP.';
    case 'quantity': return 'Quantity is a whole number of 1 or more.';
    case 'dates-missing': return 'Enter a Start Date and an End Date.';
    case 'start-after-end': return 'The Start Date is after the End Date.';
    case 'start-before-dated-date': return `The Start Date is before the Dated Date, ${tips.datedDate}.`;
    case 'start-after-maturity': return `The Start Date is after the Maturity Date, ${tips.maturity}.`;
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
  const endDate = r.endDateLimited
    ? `${r.endDateUsed} <em>(entered ${r.endDate})</em>` : r.endDate;
  let html = `<p>${couponText(tips.coupon)} TIPS due ${tips.maturity}</p>
    <table>
      <thead><tr><th></th><th>Date</th><th>Ref CPI</th><th>Index Ratio</th></tr></thead>
      <tbody>
        ${row('Dated Date', tips.datedDate, r.datedDateRefCpi, '1')}
        ${row('Start Date', r.startDate, r.startRefCpi, ir(r.startIndexRatio))}
        ${row('End Date', endDate, r.endRefCpi, ir(r.endIndexRatio))}
      </tbody>
    </table>
    <div class="oid-amount">OID ${money(r.oid)}</div>
    <div class="oid-formula">Par ${money(r.par).replace('.00', '')} × (${ir(r.endIndexRatio)} − ${ir(r.startIndexRatio)})</div>`;
  if (r.endDateLimited) {
    html += `<div class="oid-note">Ref CPI is published through ${r.lastRefCpiDate}. The OID is calculated as of that date, not as of the End Date entered.</div>`;
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
        <label>CUSIP<input type="text" id="oid-cusip" list="oid-cusips" maxlength="9" autocomplete="off" spellcheck="false"></label>
        <datalist id="oid-cusips"></datalist>
        <label>Quantity<input type="number" id="oid-quantity" min="1" step="1" value="1"></label>
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
  hint('Enter a CUSIP, a Start Date and an End Date.');

  let data;
  try {
    data = await loadInputs();
  } catch (e) {
    status.textContent = 'Load error: ' + e.message;
    status.className = 'error';
    return;
  }
  const { tipsRows, refCpiRows } = data;
  status.textContent = `Ref CPI from ${refCpiRows[0].date} through ${refCpiRows[refCpiRows.length - 1].date}`;
  $('oid-cusips').innerHTML = tipsRows
    .map(t => `<option value="${t.cusip}">${couponText(t.coupon)} due ${t.maturity}</option>`).join('');

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
      startDate, endDate, refCpiRows,
      rounding: container.querySelector('input[name="oid-rounding"]:checked').value,
    });
    resultEl.innerHTML = result.ok
      ? resultHtml(result, tips)
      : `<p class="oid-message">${messageFor(result, tips, refCpiRows)}</p>`;
  };
  container.querySelectorAll('.oid-form input').forEach(el => el.addEventListener('input', update));
  update();
}
