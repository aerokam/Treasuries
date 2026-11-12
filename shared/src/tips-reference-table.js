// tips-reference-table.js — the table of the TIPS Reference Rows with its header figures, filters, sort,
// outstanding choice, Coupon Calculation window and csv export. Specs: TipsReference/knowledge/6.3_Render_TIPS_Table.md
// and 6.4_Export_TIPS_Table.md. SharedModules.md M25. Stylesheet: tips-reference-table.css.
//
// TipsReference draws it as its page and TipsLadderManager draws it in its TIPS Reference popup.

import { buildTipsReferenceRows, applyInterestRefCpiDate, isOutstanding } from './tips-reference-rows.js';
import { initDatePicker } from './date-picker.js';
import { createDateRangeFilter } from './date-range-filter.js';
import { todayEt } from './settlement.js';

function fmtDate(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  return parts.length === 3 ? parts[1] + '/' + parts[2] + '/' + parts[0] : isoStr;
}
const pct3 = v => v != null ? (v * 100).toFixed(3) + '%' : '—';
const fix = dp => v => v != null ? v.toFixed(dp) : '—';

// 6.3 §Columns. `group: 'cpn'` marks the three columns shown only while some TIPS has a known Adj Cpn/$1K.
const COLS = [
  { key: 'cusip', label: 'CUSIP', align: 'left', sortType: 'str', fmt: v => v != null ? String(v) : '' },
  { key: 'maturity', label: 'Maturity', align: 'left', sortType: 'str', isDate: true, fmt: v => fmtDate(v) },
  { key: 'coupon', label: 'Coupon', align: 'right', sortType: 'num', fmt: pct3 },
  { key: 'datedDate', label: 'Dated Date', align: 'left', sortType: 'str', isDate: true, fmt: v => fmtDate(v) },
  { key: 'datedDateRefCpi', label: 'Dated Date Ref CPI', align: 'right', sortType: 'num', wrapHeader: true, fmt: fix(5) },
  { key: 'price', label: 'Price', align: 'right', sortType: 'num', fmt: fix(3) },
  { key: 'indexRatio', label: 'Index Ratio', align: 'right', sortType: 'num', fmt: fix(5) },
  { key: 'adjPrice', label: 'Adj Price', align: 'right', sortType: 'num', fmt: fix(3) },
  { key: 'yield', label: 'Yield', align: 'right', sortType: 'num', fmt: pct3 },
  { key: 'saYield', label: 'SA Yield', align: 'right', sortType: 'num', group: 'saYield', fmt: pct3 },
  { key: 'term', label: 'Term', align: 'right', sortType: 'num', fmt: v => v != null ? v.toFixed(2) + 'y' : '—' },
  { key: 'macDuration', label: 'Mac Duration', align: 'right', sortType: 'num', fmt: fix(2) },
  { key: 'modDuration', label: 'Mod Duration', align: 'right', sortType: 'num', fmt: fix(2) },
  { key: 'accruedInterest', label: 'Adj Accrued/$1K', align: 'right', sortType: 'num', wrapHeader: true,
    title: 'Accrued Interest (Adjusted) per 1,000 of par at the Interest Ref CPI Date', fmt: fix(5) },
  { key: 'nextCoupon', label: 'Cpn Date', align: 'left', sortType: 'str', isDate: true, group: 'cpn',
    title: 'Coupon payment date on or after the Interest Ref CPI Date', fmt: v => v != null ? fmtDate(v) : '—' },
  { key: 'cpnDateIR', label: 'Cpn Date IR', align: 'right', sortType: 'num', wrapHeader: true, group: 'cpn', fmt: fix(5) },
  { key: 'cpnPayment', label: 'Adj Cpn/$1K', align: 'right', sortType: 'num', wrapHeader: true, group: 'cpn', fmt: fix(4),
    // The export carries 6 decimal places, so that a holder multiplying it by a quantity rounds once, to the cent, on the total (6.4).
    exportFmt: v => v != null ? v.toFixed(6) : '—' },
];

const POPOVER_ID = 'trt-range-popover';

/**
 * @param {Object} o
 * @param {HTMLElement} o.host              receives the count bar and the table
 * @param {HTMLElement} o.metaHost          receives the header figures (Price Date, Settlement, Settlement Ref CPI, Interest Ref CPI Date, Interest Ref CPI)
 * @param {HTMLButtonElement} [o.exportButton]  the Export CSV button of the page; this module enables it and handles its click
 * @param {boolean} [o.flushPicker]         draw the Interest Ref CPI Date picker without a box, for a dark header
 * @param {Array} o.tipsRefRows             TIPS reference data (S2)
 * @param {Iterable} o.quotes               { cusip, price, yield, saYield } for each quoted TIPS
 * @param {Array} o.refCpiRows              RefCPI (S3)
 * @param {Set} o.bondHolidays              Bond holidays (S16)
 * @param {string} o.tradeDateStr           the Price Date
 * @param {string} o.settlementDateStr
 * @param {boolean} o.showSaYield           whether the market has SA Yields
 * @returns {{ destroy: () => void }}
 */
export function createTipsReferenceTable(o) {
  const todayStr = todayEt();
  const { rows: allRows, settlementRefCpi } = buildTipsReferenceRows({
    tipsRefRows: o.tipsRefRows, quotes: o.quotes, refCpiRows: o.refCpiRows, settlementDateStr: o.settlementDateStr, todayStr,
  });
  const refCpiRows = o.refCpiRows;
  const bondHolidays = o.bondHolidays;

  let sortCol = 'maturity', sortDir = 'asc';
  const filters = {};
  let showOutstanding = true;
  let cpnKnown = false;
  let lastRenderedRows = [];
  let interestRefCpiDateStr = o.settlementDateStr;
  const cleanups = [];

  // ── DOM ──
  o.metaHost.innerHTML =
    '<div class="trt-meta">' +
    '<div class="trt-meta-item"><span class="trt-meta-label">Price Date</span><span class="trt-meta-val">' + fmtDate(o.tradeDateStr) + '</span></div>' +
    '<div class="trt-meta-item"><span class="trt-meta-label">Settlement</span><span class="trt-meta-val">' + fmtDate(o.settlementDateStr) + '</span></div>' +
    '<div class="trt-meta-item"><span class="trt-meta-label">Settlement Ref CPI</span><span class="trt-meta-val">' + fix(5)(settlementRefCpi) + '</span></div>' +
    '<div class="trt-meta-item"><span class="trt-meta-label">Interest Ref CPI Date</span><input type="date" class="trt-picker"></div>' +
    '<div class="trt-meta-item"><span class="trt-meta-label">Interest Ref CPI</span><span class="trt-meta-val trt-interest-ref-cpi">—</span></div>' +
    '</div>';
  const pickerEl = o.metaHost.querySelector('.trt-picker');
  const interestRefCpiEl = o.metaHost.querySelector('.trt-interest-ref-cpi');

  o.host.innerHTML =
    '<div class="trt">' +
    '<div class="trt-count"><span class="trt-count-text"></span><button type="button" class="trt-btn trt-outstanding">Show all</button></div>' +
    '<div class="trt-wrap"><table class="trt-table"><thead><tr class="trt-head"></tr><tr class="trt-filter"></tr></thead><tbody></tbody></table></div>' +
    '</div>';
  const headRow = o.host.querySelector('tr.trt-head');
  const filterRow = o.host.querySelector('tr.trt-filter');
  const tbody = o.host.querySelector('tbody');
  const countText = o.host.querySelector('.trt-count-text');
  const outstandingBtn = o.host.querySelector('.trt-outstanding');

  // The date range popover and the Coupon Calculation window are children of the body: a page that transforms
  // the host (the popup of TipsLadderManager is centered with a transform) would otherwise move a fixed element.
  const stale = document.getElementById(POPOVER_ID);
  if (stale) stale.remove();
  const popover = document.createElement('div');
  popover.id = POPOVER_ID;
  popover.className = 'trt-range-popover';
  popover.innerHTML =
    '<div class="trt-range-title" id="trt-range-title"></div>' +
    '<label>From <input type="date" id="trt-range-from" class="trt-range-input"></label>' +
    '<label>To <input type="date" id="trt-range-to" class="trt-range-input"></label>' +
    '<div class="trt-range-buttons"><button type="button" id="trt-range-clear" class="trt-range-clear">Clear</button><button type="button" id="trt-range-done" class="trt-range-done">Done</button></div>';
  document.body.appendChild(popover);

  const cpnModal = document.createElement('div');
  cpnModal.className = 'trt-cpn-modal';
  cpnModal.innerHTML =
    '<div class="trt-cpn-overlay"></div><div class="trt-cpn-card"><button type="button" class="trt-cpn-close">&times;</button>' +
    '<div class="trt-cpn-title">Coupon Calculation</div><div class="trt-cpn-body"></div></div>';
  document.body.appendChild(cpnModal);
  const closeCpnModal = () => cpnModal.classList.remove('trt-open');
  cpnModal.querySelector('.trt-cpn-close').addEventListener('click', closeCpnModal);
  cpnModal.querySelector('.trt-cpn-overlay').addEventListener('click', closeCpnModal);
  const onKey = e => { if (e.key === 'Escape') closeCpnModal(); };
  document.addEventListener('keydown', onKey);
  cleanups.push(() => document.removeEventListener('keydown', onKey));

  const dateRangeFilter = createDateRangeFilter({
    popperId: POPOVER_ID, fromInputId: 'trt-range-from', toInputId: 'trt-range-to', titleId: 'trt-range-title',
    doneButtonId: 'trt-range-done', clearButtonId: 'trt-range-clear',
    onApply: () => {
      o.host.querySelectorAll('.trt-range-toggle').forEach(btn => {
        const range = dateRangeFilter.getDateRange(btn.dataset.field);
        btn.classList.toggle('trt-active', !!(range.from || range.to));
      });
      renderTable();
    },
  });

  // ── Columns shown ──
  const visibleCols = () => COLS.filter(c => c.group === 'cpn' ? cpnKnown : c.group === 'saYield' ? o.showSaYield : true);
  const cellDisplay = (row, col) => col.fmt(row[col.key]);

  function getFilteredSorted() {
    let rows = allRows.slice();
    if (showOutstanding) rows = rows.filter(r => isOutstanding(r, bondHolidays, todayStr));
    const cols = visibleCols();
    for (const [key, range] of Object.entries(dateRangeFilter.getAllRanges())) {
      if (!cols.some(c => c.key === key)) continue;
      if (range.from) rows = rows.filter(r => (r[key] || '') >= range.from);
      if (range.to) rows = rows.filter(r => (r[key] || '') <= range.to);
    }
    for (const key of Object.keys(filters)) {
      const val = filters[key].toLowerCase();
      const col = cols.find(c => c.key === key);
      if (!col) continue;
      rows = rows.filter(r => cellDisplay(r, col).toLowerCase().indexOf(val) !== -1);
    }
    const col = COLS.find(c => c.key === sortCol);
    if (col) {
      rows.sort((a, b) => {
        const av = a[sortCol], bv = b[sortCol];
        const cmp = col.sortType === 'num'
          ? (av != null ? av : -Infinity) - (bv != null ? bv : -Infinity)
          : String(av != null ? av : '').localeCompare(String(bv != null ? bv : ''));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }

  // The filter row sticks under the header row, whose height depends on how many header cells wrap.
  function syncFilterRowTop() {
    const h = headRow.offsetHeight;
    filterRow.querySelectorAll('td').forEach(td => { td.style.top = h + 'px'; });
  }

  function buildHeader() {
    headRow.innerHTML = '';
    filterRow.innerHTML = '';
    for (const col of visibleCols()) {
      const th = document.createElement('th');
      th.textContent = col.label;
      if (col.align === 'left') th.classList.add('trt-left');
      if (col.wrapHeader) th.classList.add('trt-wrap-header');
      if (col.title) th.title = col.title;
      if (sortCol === col.key) th.classList.add(sortDir === 'asc' ? 'trt-sort-asc' : 'trt-sort-desc');
      th.addEventListener('click', () => {
        if (sortCol === col.key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortCol = col.key; sortDir = 'asc'; }
        buildHeader();
        renderTable();
      });
      headRow.appendChild(th);

      // The input and the range button sit in an inner positioned element, because the td itself must stay sticky.
      const td = document.createElement('td');
      const wrap = document.createElement('div');
      wrap.style.position = 'relative';
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.size = 1;
      inp.className = 'trt-filter-input';
      inp.placeholder = '…';
      inp.value = filters[col.key] || '';
      if (filters[col.key]) inp.classList.add('trt-active');
      if (col.isDate) inp.classList.add('trt-has-range');
      inp.addEventListener('input', () => {
        const v = inp.value.trim();
        if (v) { filters[col.key] = v; inp.classList.add('trt-active'); }
        else { delete filters[col.key]; inp.classList.remove('trt-active'); }
        renderTable();
      });
      wrap.appendChild(inp);
      if (col.isDate) {
        const range = dateRangeFilter.getDateRange(col.key);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'trt-range-toggle' + (range.from || range.to ? ' trt-active' : '');
        btn.innerHTML = '📅';
        btn.dataset.field = col.key;
        btn.addEventListener('click', e => {
          e.stopPropagation();
          if (dateRangeFilter.isOpen() && dateRangeFilter.getCurrentField() === col.key) dateRangeFilter.close();
          else dateRangeFilter.open(col.key, col.label, btn);
        });
        wrap.appendChild(btn);
      }
      td.appendChild(wrap);
      filterRow.appendChild(td);
    }
    syncFilterRowTop();
  }

  function renderTable() {
    const rows = getFilteredSorted();
    lastRenderedRows = rows;
    const cols = visibleCols();
    let html = '';
    rows.forEach((r, i) => {
      html += '<tr data-idx="' + i + '">';
      for (const col of cols) {
        const cls = [];
        if (col.align === 'right') cls.push('trt-right');
        if (col.key === 'cpnPayment' && r.cpnPayment != null) cls.push('trt-cpn-clickable');
        html += '<td' + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '>' + cellDisplay(r, col) + '</td>';
      }
      html += '</tr>';
    });
    tbody.innerHTML = html;
    syncFilterRowTop();
    countText.textContent = rows.length + ' of ' + allRows.length + ' TIPS';
  }

  function recompute(dateStr) {
    interestRefCpiDateStr = dateStr;
    const result = applyInterestRefCpiDate(allRows, { refCpiRows, bondHolidays, interestRefCpiDateStr: dateStr, todayStr });
    cpnKnown = result.cpnKnown;
    // A sort by a column that is no longer shown falls back to Maturity, ascending.
    if (!cpnKnown && COLS.some(c => c.group === 'cpn' && c.key === sortCol)) { sortCol = 'maturity'; sortDir = 'asc'; }
    interestRefCpiEl.textContent = fix(5)(result.interestRefCpi);
    buildHeader();
    renderTable();
  }

  // 6.3 §Table: the Coupon Calculation window.
  function showCpnModal(row) {
    const r2 = (label, val) => '<tr><td class="trt-cml">' + label + '</td><td class="trt-cmv">' + val + '</td></tr>';
    const sep = '<tr class="trt-cms"><td colspan="2"></td></tr>';
    const ir = row.cpnDateIR;
    const semiRate = row.coupon != null ? row.coupon / 2 : null;
    const formulaNums = (ir != null && semiRate != null)
      ? ir.toFixed(5) + ' &times; ' + (semiRate * 100).toFixed(4) + '% &times; 1,000' : '—';
    cpnModal.querySelector('.trt-cpn-body').innerHTML = '<table class="trt-cmt">' +
      r2('CUSIP', row.cusip || '—') +
      r2('Coupon Date', row.nextCoupon ? fmtDate(row.nextCoupon) : '—') + sep +
      r2('Coupon Rate', row.coupon != null ? (row.coupon * 100).toFixed(3) + '%' : '—') +
      r2('Semi-Annual Rate', semiRate != null ? (semiRate * 100).toFixed(4) + '%' : '—') + sep +
      r2('Index Ratio', ir != null ? ir.toFixed(5) : '—') + sep +
      '<tr class="trt-cmf"><td colspan="2">Index Ratio &times; (Coupon Rate / 2) &times; 1,000</td></tr>' +
      '<tr class="trt-cmf"><td colspan="2">= ' + formulaNums + '</td></tr>' +
      '<tr class="trt-cmr"><td class="trt-cml">Coupon Payment</td><td class="trt-cmv">' +
        (row.cpnPayment != null ? row.cpnPayment.toFixed(4) + ' per 1,000' : '—') + '</td></tr></table>';
    cpnModal.classList.add('trt-open');
  }

  tbody.addEventListener('click', e => {
    const td = e.target.closest('td.trt-cpn-clickable');
    if (!td) return;
    const idx = parseInt(td.closest('tr').getAttribute('data-idx'), 10);
    if (!isNaN(idx) && lastRenderedRows[idx]) showCpnModal(lastRenderedRows[idx]);
  });

  outstandingBtn.addEventListener('click', () => {
    showOutstanding = !showOutstanding;
    outstandingBtn.textContent = showOutstanding ? 'Show all' : 'Show outstanding';
    renderTable();
  });

  // 6.4: the rows the table shows, in its sort order, with the columns it shows.
  function exportCsv() {
    const cols = visibleCols();
    const lines = [cols.map(c => c.label).join(',')].concat(getFilteredSorted().map(r =>
      cols.map(col => {
        const v = col.exportFmt ? col.exportFmt(r[col.key]) : cellDisplay(r, col);
        return v.indexOf(',') !== -1 ? '"' + v + '"' : v;
      }).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tips-reference' + (o.settlementDateStr ? '-' + o.settlementDateStr : '') + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
  if (o.exportButton) {
    o.exportButton.addEventListener('click', exportCsv);
    o.exportButton.disabled = false;
    cleanups.push(() => o.exportButton.removeEventListener('click', exportCsv));
  }

  initDatePicker(pickerEl, {
    value: o.settlementDateStr,
    className: o.flushPicker ? 'flush' : '',
    min: refCpiRows.length ? refCpiRows[0].date : undefined,
    max: refCpiRows.length ? refCpiRows[refCpiRows.length - 1].date : undefined,
    onChange: recompute,
  });
  recompute(o.settlementDateStr);

  return {
    destroy() {
      cleanups.forEach(fn => fn());
      popover.remove();
      cpnModal.remove();
      o.host.innerHTML = '';
      o.metaHost.innerHTML = '';
    },
  };
}
