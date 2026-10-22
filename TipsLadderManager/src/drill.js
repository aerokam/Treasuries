// drill.js -- Drill-down popup HTML builder (6.0_UI_Schema.md)
// Exports: buildDrillHTML(d, colKey, summary)

import { UPPER_BRACKET_YEAR } from './ladder-core.js';

function fm(n)  { return '$' + Math.round(n).toLocaleString('en-US'); }
function fm2(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fd(n, dp) { return Number(n).toFixed(dp); }

function row(label, formula, value, isTotal, drillKey, rowId) {
  const ts = isTotal ? 'font-weight:700;border-top:2px solid #1e293b;padding-top:6px;' : '';
  const dk = drillKey ? ' class="drill-l3" data-l3="' + drillKey + '" style="cursor:pointer;"' : '';
  const rid = rowId ? ' data-row-id="' + rowId + '"' : '';
  const lblStyle = drillKey ? 'text-decoration:underline dotted #94a3b8;' : '';
  const f  = formula
    ? '<td style="padding:3px 14px;color:#334155;font-size:11px;' + ts + '">' + formula + '</td>'
    : '<td style="padding:3px 14px;' + ts + '"></td>';
  return '<tr' + dk + '>'
    + '<td' + rid + ' style="padding:3px 16px 3px 0;white-space:nowrap;' + ts + lblStyle + '">' + label + '</td>'
    + f
    + '<td style="padding:3px 0 3px 14px;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;' + ts + '">' + value + '</td>'
    + '</tr>';
}

function sep() { return '<tr><td colspan="3" style="padding:4px 0;border-bottom:1px dashed #e2e8f0"></td></tr>'; }

// Rows that every `price/100 × index ratio` formula hovers to. A popup that already shows
// bondVarRows (which carry the index ratio) needs only the price row.
function priceRow(d) { return row('Price (unadjusted)', '', fd(d.price, 4), false, undefined, 'price'); }
function indexRatioRows(d) {
  return row('Ref CPI (settlement date)', '', fd(d.refCPI, 5), false, 'refCPI', 'refcpi')
    + row('Dated date Ref CPI', '', fd(d.datedDateRefCpi, 5), false, undefined, 'datedDateRefCpi')
    + row('Index ratio', '<span class="formula-var" data-source="refcpi">Ref CPI</span> \xf7 <span class="formula-var" data-source="datedDateRefCpi">Dated date Ref CPI</span>', fd(d.indexRatio, 9), false, 'indexRatio', 'ir');
}
function costPerTipsRow(d) {
  return row('Cost per TIPS', '<span class="formula-var" data-source="price">price/100</span> \xd7 <span class="formula-var" data-source="ir">index ratio</span> \xd7 1,000', fm2(d.costPerBond), false, undefined, 'cpb');
}


const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// A bracket row links to its own weight drill rather than carrying hover text: the nested popup
// is draggable, resizable, and its content can be selected and copied (5.0 §Nested (Level-3)
// drills).
function wtLink(which, inner) {
  return '<span class="drill-l3" data-l3="bracketwt-' + which + '" style="cursor:pointer;text-decoration:underline dotted #94a3b8;">' + inner + '</span>';
}

// A link to the calculation of a number (a nested drill, 5.0 §Nested (Level-3) drills).
function l3Link(key, text) {
  return '<span class="drill-l3" data-l3="' + key + '" style="cursor:pointer;text-decoration:underline dotted #94a3b8;">' + text + '</span>';
}

// Hover pairs in the Gap Dur and Future 30Y Dur popups: a year's Cost or Modified Duration and the
// place the average duration row and the total cost use it share a key; hovering either side
// highlights the other (index.html, the data-hl listener, which reuses the source-highlight class of
// the formula-var mechanism). side 'y' marks the number where it is calculated, 'w' where it is used.
// With a drillKey the number is also a link to that calculation (l3Link look, no dashed underline).
function hlNum(key, side, text, drillKey) {
  if (drillKey) {
    return '<span class="drill-l3" data-l3="' + drillKey + '" data-hl="' + key + '" data-hl-side="' + side
      + '" style="cursor:pointer;text-decoration:underline dotted #94a3b8;border-bottom:none;">' + text + '</span>';
  }
  return '<span data-hl="' + key + '" data-hl-side="' + side + '">' + text + '</span>';
}

function bondVarRows(d, nPeriods, principalPerBond, couponPct) {
  const matMonthName = d.maturityStr.split(' ')[0];
  const matMonthIdx = MONTHS.indexOf(matMonthName);
  let nPerLbl;
  if (nPeriods === 1) {
    nPerLbl = '1 semi-annual (' + matMonthName + ')';
  } else {
    const firstMonthName = MONTHS[(matMonthIdx - 6 + 12) % 12];
    nPerLbl = '2 (' + firstMonthName + ' + ' + matMonthName + ')';
  }
  return row('Ref CPI', '', fd(d.refCPI, 5), false, 'refCPI', 'refcpi')
    + row('Dated date Ref CPI', '', fd(d.datedDateRefCpi, 5), false, undefined, 'datedDateRefCpi')
    + row('Index ratio', '<span class="formula-var" data-source="refcpi">Ref CPI</span> \xf7 <span class="formula-var" data-source="datedDateRefCpi">Dated date Ref CPI</span>', fd(d.paymentIndexRatio, 5), false, 'paymentIndexRatio', 'ir')
    + row('Inflation-Adjusted Principal per TIPS', '1,000 \xd7 <span class="formula-var" data-source="ir">index ratio</span>', fd(principalPerBond, 2), false, undefined, 'ppb')
    + row('Coupon per period', 'annual coupon \xf7 2', couponPct, false, undefined, 'cpp')
    + row('Yield', '', fd(d.yield * 100, 3) + '%')
    + row('SA Yield', '', d.saYield != null ? fd(d.saYield * 100, 3) + '%' : '—')
    + row('Coupon periods in FY', '', nPerLbl, false, undefined, 'cp');
}

function future30yBreakdownRows(future30yParams) {
  if (!future30yParams?.breakdown) return '';
  let rows = '';
  future30yParams.breakdown.forEach((g, i) => {
    const id = 'fut' + i;
    const fmla = 'round((' + fm(g.dara) + ' \u2212 <span class="formula-var" data-source="' + id + 'lmi">LMI</span>) \u00f7 <span class="formula-var" data-source="' + id + 'pi">P+I</span>)';
    rows += row(g.year + ' quantity', fmla, g.qty, false, undefined, id + 'qty')
          + row('\u21b3 P+I per synthetic TIPS', '', fm2(g.piPerBond), false, undefined, id + 'pi')
          + row('\u21b3 Later mat int (LMI)', 'Coupon interest from longer synthetic Future 30Y TIPS', fm(g.laterMatInt), false, undefined, id + 'lmi')
          + row('\u21b3 Theoretical cost', '<span class="formula-var" data-source="' + id + 'qty">Quantity</span> \xd7 $1,000 \xd7 price ' + fd(g.synPrice ?? 100, 3) + ' \u00f7 100', fm(g.cost ?? g.qty * 1000));
  });
  return rows;
}

function gapBreakdownRows(gapParams, dara) {
  if (!gapParams?.breakdown) return '';
  let rows = '';
  gapParams.breakdown.forEach((g, i) => {
    const id = 'gap' + i;
    const pliCredit = g.pliCredit ?? 0;
    const yearDara = g.dara ?? dara;
    let fmla = 'round((' + fm(yearDara) + ' \u2212 <span class="formula-var" data-source="' + id + 'lmi">LMI</span>';
    if (pliCredit > 0) fmla += ' \u2212 <span class="formula-var" data-source="' + id + 'pli">PLI</span>';
    fmla += ') \u00f7 <span class="formula-var" data-source="' + id + 'pi">P+I</span>)';
    rows += row(g.year + ' quantity', fmla, g.qty, false, undefined, id + 'qty')
          + row('\u21b3 P+I per synthetic TIPS', '', fm2(g.piPerBond), false, undefined, id + 'pi')
          + row('\u21b3 LMI (actual TIPS + longer synth)', 'coupon from funded years above + synth LMI from longer gap years', fm(g.laterMatInt), false, undefined, id + 'lmi')
          + (pliCredit > 0 ? row('\u21b3 PLI credit', 'Pre-Ladder Interest applied to this gap year', fm(pliCredit), false, 'plcpool:' + Math.round(pliCredit), id + 'pli') : '')
          + row('\u21b3 Theoretical cost', '<span class="formula-var" data-source="' + id + 'qty">Quantity</span> \xd7 $1,000 \xd7 price ' + fd(g.synPrice ?? 100, 3) + ' \u00f7 100', fm(g.cost ?? g.qty * 1000));
  });
  return rows;
}

/// Level-3 drill: composition of the pre-ladder pool — the coupon interest of the holdings, the
// interest of the Simulated Outstanding Future 30Y TIPS and the Cover Excess, and the Net Cash, for
// the years before the first funded year (2.0 §Future 30Y Simulated Outstanding TIPS §Interest credited
// to a funded year; 4.0 §build-lib.js / rebalance-lib.js — Future 30Y Simulated Outstanding TIPS).
export function buildPreLadderPoolDrill(summary, plCreditForYear) {
  const couponPool   = summary?.preLadderCouponPool ?? 0;
  const future30yPool = summary?.preLadderFuture30yPool ?? 0;
  const gapPool      = summary?.preLadderGapPool ?? 0;
  const netCashPool  = summary?.preLadderNetCashPool ?? 0;
  const total        = summary?.preLadderPool ?? (couponPool + future30yPool + gapPool + netCashPool);
  const years        = summary?.preLadderYears ?? 0;
  const rows = [
    { label: 'Pre-ladder coupon interest', note: years + ' yr \xd7 annual ladder coupon income', value: fm(couponPool) },
  ];
  if (gapPool > 0) {
    rows.push({ label: 'Pre-ladder interest from the Simulated Outstanding Future 10Y TIPS and the Excess TIPS', note: 'coupons of the Simulated Outstanding Future 10Y TIPS and of the Excess TIPS paid before the ladder starts', value: fm(gapPool) });
  }
  if (future30yPool > 0) {
    rows.push({ label: 'Pre-ladder interest from the Simulated Outstanding Future 30Y TIPS and the Excess TIPS', note: 'coupons of the Simulated Outstanding Future 30Y TIPS and of the Excess TIPS paid before the ladder starts', value: fm(future30yPool) });
  }
  const showNet = Math.abs(netCashPool) >= 0.5;
  if (showNet) {
    rows.push({ label: 'Net Cash', note: netCashNote(summary?.gapYears?.length > 0, summary?.future30yYears?.length > 0, 'before the ladder starts'), value: (netCashPool < 0 ? '−' + fm(-netCashPool) : fm(netCashPool)) });
  }
  rows.push({ sep: true });
  const totalNote = ['coupon interest', gapPool > 0 ? 'Simulated Outstanding Future 10Y TIPS and Excess TIPS interest' : null, future30yPool > 0 ? 'Simulated Outstanding Future 30Y TIPS and Excess TIPS interest' : null, showNet ? 'Net Cash' : null].filter(Boolean).join(' + ');
  rows.push({ label: 'Total Pre-Ladder Interest', note: totalNote, value: fm(total), total: true });
  if (plCreditForYear > 0) {
    rows.push({ sep: true });
    rows.push({ label: 'Applied to this year', note: 'slice of the Pre-Ladder Interest credited here', value: fm(plCreditForYear) });
  }
  return rows;
}

// The three Future 30Y amounts credited to a funded year (2.0 §Future 30Y Simulated Outstanding TIPS
// §Interest credited to a funded year) as popup rows: the interest of the Simulated Outstanding Future
// 30Y TIPS, the interest of the Cover Excess and the Net Cash. `sign` prefixes the value ('−' where
// the popup subtracts it from DARA). The Net Cash row shows whenever it is not 0.
// The gap years' three amounts (2.0 §Gap Year Simulated Outstanding TIPS §Interest credited to a funded year)
// come first: the interest of the Simulated Outstanding Future 10Y TIPS, the interest of the Excess TIPS and the
// Net Cash. The one Net Cash row carries the Net Cash of both kinds when a ladder has gap years and Future 30Y years.
const hasNetCash = (net) => Math.abs(net) >= 0.5;
function netCashNote(hasGap, hasFuture30y, when) {
  const bought = [hasGap ? 'Simulated Outstanding Future 10Y TIPS' : null, hasFuture30y ? 'Simulated Outstanding Future 30Y TIPS' : null].filter(Boolean).join(' and ');
  return 'cash from selling Excess TIPS ' + when + ', beyond the cost of the ' + (bought || 'Simulated Outstanding Future 30Y TIPS') + ' bought';
}
// `c` = { sim, cov, net, gapSim, gapExc, gapNet } for one year.
function future30yInterestRows(year, c, sign = '') {
  const net = (c.net ?? 0) + (c.gapNet ?? 0);
  return ((c.gapSim ?? 0) > 0 ? row('Simulated Outstanding Future 10Y TIPS interest', 'coupons paid in ' + year + ' by the Simulated Outstanding Future 10Y TIPS issued by then', sign + fm(c.gapSim), false, undefined, 'gapsim') : '')
    + ((c.gapExc ?? 0) + (c.cov ?? 0) > 0 ? row('Excess TIPS interest', 'coupons paid in ' + year + ' by the Excess TIPS', sign + fm((c.gapExc ?? 0) + (c.cov ?? 0)), false, undefined, 'exc') : '')
    + ((c.sim ?? 0) > 0 ? row('Simulated Outstanding Future 30Y TIPS interest', 'coupons paid in ' + year + ' by the Simulated Outstanding Future 30Y TIPS issued by then', sign + fm(c.sim), false, undefined, 'sim') : '')
    + (hasNetCash(net) ? row('Net Cash', netCashNote((c.gapNet ?? 0) !== 0, (c.net ?? 0) !== 0 || (c.gapNet ?? 0) === 0, 'in this year'), (net < 0 ? (sign ? '+' : '−') + fm(-net) : sign + fm(net)), false, undefined, 'net') : '');
}
function future30yInterestFmla(c, op = '+') {
  const net = (c.net ?? 0) + (c.gapNet ?? 0);
  return ((c.gapSim ?? 0) > 0 ? ' ' + op + ' <span class="formula-var" data-source="gapsim">Simulated Outstanding Future 10Y TIPS interest</span>' : '')
    + ((c.gapExc ?? 0) + (c.cov ?? 0) > 0 ? ' ' + op + ' <span class="formula-var" data-source="exc">Excess TIPS interest</span>' : '')
    + ((c.sim ?? 0) > 0 ? ' ' + op + ' <span class="formula-var" data-source="sim">Simulated Outstanding Future 30Y TIPS interest</span>' : '')
    + (hasNetCash(net) ? ' ' + op + ' <span class="formula-var" data-source="net">Net Cash</span>' : '');
}
// The credited amounts of a year's detail entry; Before reads the Before fields.
function creditedOf(d, isBef = false) {
  return isBef
    ? { sim: d.future30ySimulatedInterestBefore || 0, cov: d.future30yCoverExcessInterestBefore || 0, net: d.future30yNetCashBefore || 0,
        gapSim: d.gapSimulatedInterestBefore || 0, gapExc: d.gapExcessInterestBefore || 0, gapNet: d.gapNetCashBefore || 0 }
    : { sim: d.future30ySimulatedInterest || 0, cov: d.future30yCoverExcessInterest || 0, net: d.future30yNetCash || 0,
        gapSim: d.gapSimulatedInterest || 0, gapExc: d.gapExcessInterest || 0, gapNet: d.gapNetCash || 0 };
}
const creditedTotal = (c) => c.sim + c.cov + c.net + c.gapSim + c.gapExc + c.gapNet;

// Amount of a gap year or a Future 30Y year, on that year's group header row (2.0 §Amount of a Gap
// Year and a Future 30Y Year; 5.0 §Popup Routing). `a` is one entry of summary.syntheticYearAmounts.
function syntheticYearAmountRows(a) {
  const isGap = a.kind === 'gap';
  const pi    = a.qty * a.piPerBond;
  const durLink = '<a class="info-link" data-popup="' + (isGap ? 'duration' : 'future30yDuration') + '" style="border-bottom:1px dotted #94a3b8;color:inherit;text-decoration:none;">' + (isGap ? 'Gap Dur' : 'Future 30Y Dur') + '</a>';
  let rows = row('Quantity', 'From duration match calculations: see ' + durLink, a.qty, false, undefined, 'qty')
    + row('P+I per TIPS', '$1,000 \xd7 (1 + coupon ' + fd(a.synCpn * 100, 3) + '% \xf7 2), index ratio 1.00000', fm2(a.piPerBond), false, undefined, 'pipb')
    + row('P+I', '<span class="formula-var" data-source="pipb">P+I per TIPS</span> \xd7 <span class="formula-var" data-source="qty">Quantity</span>', fm(pi), false, undefined, 'pi')
    + row('Later maturity interest (LMI)', isGap
        ? 'from the TIPS maturing after ' + a.year + ' and the Simulated Outstanding Future 10Y TIPS of the later gap years'
        : 'full annual coupons of the Simulated Outstanding Future 30Y TIPS of the later Future 30Y years', fm(a.laterMatInt), false, undefined, 'lmi');
  let fmla = '<span class="formula-var" data-source="pi">P+I</span> + <span class="formula-var" data-source="lmi">LMI</span>';
  if (isGap && a.pliCredit > 0) {
    rows += row('Pre-ladder credit', 'Pre-Ladder Interest applied to this gap year', fm(a.pliCredit), false, 'plcpool:' + Math.round(a.pliCredit), 'plc');
    fmla += ' + <span class="formula-var" data-source="plc">Pre-ladder credit</span>';
  }
  rows += sep()
    + row('Amount', fmla, fm(a.amount), true, undefined, 'total')
    + sep()
    + row('DARA', '', fm(a.dara), false, undefined, 'dara')
    + row('Surplus / Deficit', '<span class="formula-var" data-source="total">Amount</span> − <span class="formula-var" data-source="dara">DARA</span>',
          (a.amount - a.dara >= 0 ? '+' : '') + Math.round(a.amount - a.dara).toLocaleString('en-US'));
  return rows;
}

export function buildDrillHTML(d, colKey, summary) {
  const nPeriods         = d.nPeriods != null ? d.nPeriods : (d.halfOrFull === 0.5 ? 1 : 2);
  const principalPerBond = d.principalPerBond;
  const couponPct        = fd(d.coupon / 2 * 100, 5) + '%';
  const couponLabel      = nPeriods === 1 ? 'Last coupon (1 period)' : 'Last 2 coupons (2 periods)';

  let rows = '';

  // ── Build: Amount ─────────────────────────────────────────────────────────────
  if (colKey === 'amount') {
    const _plCredit  = d.preLadderCreditForYear || 0;
    const sameYearExInt = d.excessLMI_After || 0;
    const longerDatedInt = d.longerDatedLMI ?? d.fundedYearLaterMatInt; // use separated if available, else combined legacy
    const _cred = creditedOf(d);
    // The credit pass applies Available Cash first, so a year's credit and its cash are the same
    // dollars — shown as two lines that split the credit, never added on top of it
    // (2.0 §Available Cash).
    const _creditTotal = d.preLadderCreditForYear || 0;
    const _cashCredit  = Math.min(d.availableCashCredit || 0, _creditTotal);
    // The settlement year's LMI is capped to not-yet-paid coupons only (2.0 §Settlement-year LMI
    // is remaining coupons only), unlike every other year's full-annual figure — the row must say
    // so, the same way the Cash Flow Calendar's Ref CPI label flags its own date exception (label
    // itself carries the disclosure, no separate explanatory sentence).
    const _isSettleYr = d.fundedYear === summary?.settlementYear;
    const _lmiLabel = _isSettleYr ? 'Remaining later maturity interest' : 'Later maturity interest (LMI)';
    const _lmiDesc = _isSettleYr
      ? 'coupons from TIPS maturing after this year, paid after today, based on the Coupon Counting choice'
      : 'from TIPS maturing after ' + d.fundedYear;
    // Multi-TIPS funded year (semiannual / all): the year's principal is delivered by several TIPS
    // with different par values, so list each TIPS's P+I contribution (like the rebalance Amount drill)
    // rather than a single "Inflation-Adjusted Principal × Qty". Single-TIPS years keep the detailed per-bond breakdown.
    const _rungs = (d.fundedRungs && d.fundedRungs.length > 1) ? d.fundedRungs : null;

    let totalFmla = _rungs
      ? 'Funded-year TIPS + <span class="formula-var" data-source="lmi">LMI</span>'
      : 'Principal + Coupons + <span class="formula-var" data-source="lmi">LMI</span>';
    if (sameYearExInt > 0) totalFmla += ' + <span class="formula-var" data-source="exlmi">Same-maturity excess int</span>';
    if (_plCredit - _cashCredit > 0) totalFmla += ' + Pre-ladder credit';
    totalFmla += future30yInterestFmla(_cred);
    if (_cashCredit > 0) totalFmla += ' + Available cash';

    if (_rungs) {
      let ownSum = 0;
      let rungRows = '';
      _rungs.forEach(h => {
        const piPB = h.principalPerBond * (1 + h.coupon / 2 * h.nPeriods);
        const hTotal = piPB * h.qty;
        ownSum += hTotal;
        const mo = MONTHS[h.maturityMonth], yr = String(h.maturityYear).slice(2);
        rungRows += row(mo + ' ’' + yr + ' \xd7 ' + h.qty, fm2(piPB) + '/TIPS', fm(hTotal));
      });
      rows =
        rungRows +
        sep() +
        row('Funded-year TIPS subtotal', 'principal + last-year coupons across the year’s TIPS', fm(ownSum)) +
        row(_lmiLabel, _lmiDesc, fm(longerDatedInt), false, undefined, 'lmi') +
        (sameYearExInt > 0 ? row('Same-maturity excess interest', 'from excess TIPS maturing in ' + d.fundedYear, fm(sameYearExInt), false, undefined, 'exlmi') : '') +
        (_plCredit - _cashCredit > 0 ? row('Pre-ladder credit', 'Pre-Ladder Interest applied to this year', fm(_plCredit - _cashCredit), false, 'plcpool') : '') +
        future30yInterestRows(d.fundedYear, _cred) +
        (_cashCredit > 0 ? row('Available cash', 'cash on hand applied to this year', fm(_cashCredit)) : '') +
        sep() +
        row('Funded Year Amount', totalFmla, fm(d.fundedYearAmt), true, undefined, 'total') +
        sep() +
        row('DARA', '', fm(d.dara), false, undefined, 'dara') +
        row('Surplus / Deficit', '<span class="formula-var" data-source="total">FY Amount</span> − <span class="formula-var" data-source="dara">DARA</span>', (d.fundedYearAmt - d.dara >= 0 ? '+' : '') + Math.round(d.fundedYearAmt - d.dara).toLocaleString('en-US'));
      return '<table style="border-collapse:collapse;width:auto;font-size:12px">' + rows + '</table>';
    }

    rows =
      row('Quantity', '', d.fundedYearQty, false, undefined, 'qty') +
      sep() +
      bondVarRows(d, nPeriods, principalPerBond, couponPct) +
      sep() +
      row('Principal', '<span class="formula-var" data-source="ppb">Inflation-Adjusted Principal/TIPS</span> \xd7 <span class="formula-var" data-source="qty">Quantity</span>', fm(d.fundedYearPrincipalTotal)) +
      row(couponLabel, '<span class="formula-var" data-source="ppb">Inflation-Adjusted Principal/TIPS</span> \xd7 <span class="formula-var" data-source="cpp">coupon/period</span> \xd7 <span class="formula-var" data-source="cp">periods</span> \xd7 <span class="formula-var" data-source="qty">Quantity</span>', fm(d.fundedYearOwnRungInt)) +
      row(_lmiLabel, _lmiDesc, fm(longerDatedInt), false, undefined, 'lmi') +
      (sameYearExInt > 0 ? row('Same-maturity excess interest', 'from excess TIPS maturing in ' + d.fundedYear, fm(sameYearExInt), false, undefined, 'exlmi') : '') +
      (_plCredit - _cashCredit > 0 ? row('Pre-ladder credit', 'Pre-Ladder Interest applied to this year', fm(_plCredit - _cashCredit), false, 'plcpool') : '') +
      future30yInterestRows(d.fundedYear, _cred) +
      (_cashCredit > 0 ? row('Available cash', 'cash on hand applied to this year', fm(_cashCredit)) : '') +
      sep() +
      row('Funded Year Amount', totalFmla, fm(d.fundedYearAmt), true, undefined, 'total') +
      sep() +
      row('DARA', '', fm(d.dara), false, undefined, 'dara') +
      row('Surplus / Deficit', '<span class="formula-var" data-source="total">FY Amount</span> \u2212 <span class="formula-var" data-source="dara">DARA</span>', (d.fundedYearAmt - d.dara >= 0 ? '+' : '') + Math.round(d.fundedYearAmt - d.dara).toLocaleString('en-US'));

  // ── Build: Cost ───────────────────────────────────────────────────────────────
  } else if (colKey === 'cost') {
    rows =
      row('Quantity', '', d.fundedYearQty, false, undefined, 'qty') +
      sep() +
      row('Price (unadjusted)', '', fd(d.price, 4), false, undefined, 'price') +
      row('Ref CPI (settlement date)', '', fd(d.refCPI, 5), false, 'refCPI', 'refcpi') +
      row('Dated date Ref CPI', '', fd(d.datedDateRefCpi, 5), false, undefined, 'datedDateRefCpi') +
      row('Index ratio', '<span class="formula-var" data-source="refcpi">Ref CPI</span> \xf7 <span class="formula-var" data-source="datedDateRefCpi">Dated date Ref CPI</span>', fd(d.indexRatio, 9), false, 'indexRatio', 'ir') +
      row('Cost per TIPS', '<span class="formula-var" data-source="price">price/100</span> \xd7 <span class="formula-var" data-source="ir">index ratio</span> \xd7 1,000', fm2(d.costPerBond), false, undefined, 'cpb') +
      sep() +
      row('Funded Year Cost', '<span class="formula-var" data-source="cpb">Cost per TIPS</span> \xd7 <span class="formula-var" data-source="qty">Quantity</span>', fm(d.fundedYearCost), true);

  // ── Build: Bracket Cost ───────────────────────────────────────────────────────
  } else if (colKey === 'bracketCost') {
    const s = summary;
    if (s) {
      const isLower = d.fundedYear === s.lowerYear;
      const weight  = isLower ? s.lowerWeight  : s.upperWeight;
      const wLabel  = isLower ? 'Lower bracket weight' : 'Upper bracket weight';
      const exCost  = s.gapParams.totalCost * weight;
      rows = row(wLabel, 'see Duration Calcs ↗', fd(weight, 4), false, undefined, 'wt')
        + sep()
        + gapBreakdownRows(s.gapParams, s.DARA)
        + row('Gap total cost', 'Sum of gap year theoretical costs', fm(s.gapParams.totalCost), true, undefined, 'gtc')
        + row('Target excess cost', '<span class="formula-var" data-source="gtc">Gap total cost</span> \xd7 <span class="formula-var" data-source="wt">' + wLabel.toLowerCase() + '</span>', fm(exCost), false, undefined, 'tec')
        + sep()
        + indexRatioRows(d)
        + priceRow(d)
        + costPerTipsRow(d)
        + row('Excess Quantity', 'round(<span class="formula-var" data-source="tec">target cost</span> \xf7 <span class="formula-var" data-source="cpb">Cost per TIPS</span>)', d.excessQty, false, undefined, 'qty')
        + row('Bracket Cost', '<span class="formula-var" data-source="cpb">Cost per TIPS</span> \xd7 <span class="formula-var" data-source="qty">Excess Quantity</span>', fm(d.excessCost), true);
    }

  // ── Build: Future 30Y Cost ────────────────────────────────────────────────────
  } else if (colKey === 'future30yCost') {
    const s = summary;
    if (s) {
      const isLower = d.fundedYear === s.future30yLowerYear;
      const weight  = isLower ? s.future30yLowerWeight : s.future30yUpperWeight;
      const wLabel  = isLower ? 'Lower cover weight' : 'Upper cover weight';
      const exCost  = (s.future30yParams?.future30yTotalCost ?? 0) * weight;
      rows = row(wLabel, 'see Future 30Y Duration Calcs ↗', fd(weight, 4), false, undefined, 'wt')
        + sep()
        + future30yBreakdownRows(s.future30yParams)
        + row('Future 30Y total cost', 'Sum of the synthetic Future 30Y year costs', fm(s.future30yParams?.future30yTotalCost ?? 0), true, undefined, 'ftc')
        + row('Target excess cost', '<span class="formula-var" data-source="ftc">Future 30Y total cost</span> \xd7 <span class="formula-var" data-source="wt">' + wLabel.toLowerCase() + '</span>', fm(exCost), false, undefined, 'tec')
        + sep()
        + indexRatioRows(d)
        + priceRow(d)
        + costPerTipsRow(d)
        + row('Excess Quantity', 'round(<span class="formula-var" data-source="tec">target cost</span> \xf7 <span class="formula-var" data-source="cpb">Cost per TIPS</span>)', d.excessQty, false, undefined, 'qty')
        + sep()
        + row('Future 30Y Cover Cost', '<span class="formula-var" data-source="cpb">Cost per TIPS</span> \xd7 <span class="formula-var" data-source="qty">Excess Quantity</span>', fm(d.excessCost), true);
    }

  // ── Amount of a gap year or a Future 30Y year (group header row) ─────────────
  } else if (colKey === 'yearAmount' || colKey === 'yearAmountBefore' || colKey === 'yearAmountAfter') {
    rows = d?.kind ? syntheticYearAmountRows(d) : '';

  } else if (colKey === 'amtBefore' || colKey === 'amtAfter') {
    const isBef       = colKey === 'amtBefore';
    const holdings    = (isBef ? d.araBeforeHoldings : d.araAfterHoldings) ?? [];
    const laterMatInt = isBef ? d.araBeforeLaterMatInt : d.araAfterLaterMatInt;
    const araTotal    = isBef ? d.araBeforeTotal       : d.araAfterTotal;
    const DARA        = d.DARA ?? summary?.DARA;
    const _plCredit   = isBef ? (d.preLadderCreditForYearBefore || 0) : (d.preLadderCreditForYear || 0);
    const _cred       = creditedOf(d, isBef);
    // After: cash is part of the credit, so it splits it. Before: no rung was sized down, so the
    // cash the holder actually has is a plain addition (2.0 §Available Cash).
    const _cashRaw    = isBef ? (d.availableCashCreditBefore || 0) : (d.availableCashCredit || 0);
    const _cashCredit = isBef ? _cashRaw : Math.min(_cashRaw, _plCredit);
    const _plShown    = isBef ? _plCredit : _plCredit - _cashCredit;
    // Settlement-year LMI is capped to not-yet-paid coupons only (2.0 §Settlement-year LMI is
    // remaining coupons only) — same disclosure as the Build "amount" popup above.
    const _isSettleYr = d.fundedYear === summary?.settlementYear;
    const _lmiLabel = _isSettleYr ? 'Remaining later maturity interest' : 'Later maturity interest (LMI)';
    const _lmiDesc = _isSettleYr
      ? 'coupons from TIPS maturing after this year, paid after today, based on the Coupon Counting choice'
      : 'from TIPS maturing after ' + d.fundedYear;
    // Compute ownSum first so we can detect PLI-zeroed years (holdings present but all qty=0).
    let ownSum = 0;
    holdings.forEach(h => { ownSum += h.principalPerBond * (1 + h.coupon / 2 * h.nPeriods) * h.qty; });
    // PLI-zeroed years: holdings exist but all qty=0 (vs new rungs where holdings=[]).
    // Display inferredDARA as "Amount Before" since PLI fully covered the rung's need.
    const _pliZeroed  = isBef && holdings.length > 0 && ownSum === 0 && (summary?.inferredDARA ?? 0) > 0;
    const _displayAmt = _pliZeroed ? Math.round(summary.inferredDARA) : araTotal;
    ownSum = 0;
    holdings.forEach((h, i) => {
      const piPB = h.principalPerBond * (1 + h.coupon / 2 * h.nPeriods);
      const hTotal = piPB * h.qty;
      ownSum += hTotal;
      const mo = MONTHS[h.maturityMonth];
      const yr = String(h.maturityYear).slice(2);
      // Two distinct TIPS can share a maturity month/year (e.g. an 'all maturity months' funded
      // year picking up a second, previously-unheld candidate) -- the CUSIP disambiguates what
      // would otherwise render as an unexplained duplicate "Jan '27" line.
      const label = mo + ' \u2019' + yr + (h.cusip ? ' (' + h.cusip + ')' : '') + ' \xd7 ' + h.qty;
      rows += row(label, '<span class="drill-l3" data-l3="pipb-' + i + '" style="cursor:pointer;text-decoration:underline dotted #94a3b8;">' + fm2(piPB) + '/TIPS</span>', fm(hTotal));
    });
    rows += sep()
      + row('Funded year TIPS subtotal', '', fm(ownSum))
      + row(_lmiLabel, _lmiDesc, fm(laterMatInt), false, undefined, 'lmi');
    const excessLMI = isBef ? d.excessLMI_Before : d.excessLMI_After;
    if (excessLMI > 0) {
      const _exDesc = 'from the excess TIPS held in ' + d.fundedYear + ', covering the gap years, where 10-year TIPS have not yet been issued';
      rows += row('Same-maturity excess interest', _exDesc, fm(excessLMI), false, undefined, 'exlmi');
    }
    if (_plShown > 0) {
      rows += row('Pre-ladder credit', 'Pre-Ladder Interest applied to this year', fm(_plShown), false, 'plcpool', 'plc');
    }
    rows += future30yInterestRows(d.fundedYear, _cred);
    if (_cashCredit > 0) {
      rows += row('Available cash', 'cash on hand applied to this year', fm(_cashCredit));
    }
    let totalFmla = _pliZeroed
      ? 'Inferred from CSV'
      : 'Funded year TIPS + <span class="formula-var" data-source="lmi">LMI</span>';
    if (!_pliZeroed && excessLMI > 0) totalFmla += ' + <span class="formula-var" data-source="exlmi">Same-maturity excess int</span>';
    if (!_pliZeroed && _plShown > 0) totalFmla += ' + <span class="formula-var" data-source="plc">Pre-ladder credit</span>';
    if (!_pliZeroed) totalFmla += future30yInterestFmla(_cred);
    if (!_pliZeroed && _cashCredit > 0) totalFmla += ' + Available cash';
    rows += sep()
      + row(isBef ? 'Amount Before' : 'Amount After', totalFmla, fm(_displayAmt), true)
      + sep()
      + row('DARA', '', fm(DARA), false, undefined, 'dara')
      + row('Surplus / Deficit', (isBef ? 'Amount Before' : 'Amount After') + ' \u2212 <span class="formula-var" data-source="dara">DARA</span>',
            (_displayAmt - DARA >= 0 ? '+' : '') + Math.round(_displayAmt - DARA).toLocaleString('en-US'));

  // ── Rebalance: Qty Before / After (funded-year row only) ──────────────────
  } else if (colKey === 'qtyAfter' || colKey === 'qtyBefore' || colKey === 'qty') {
    const isBef = colKey === 'qtyBefore';
    if (isBef) {
      rows = row('Quantity Before', '', d.fundedYearQtyBefore, true);
    } else {
      const fyQty = d.fundedYearQtyAfter ?? d.fundedYearQty;
      const isSettleYr = d.fundedYear === summary?.settlementYear;
      const lmiLabel = isSettleYr ? 'Remaining later maturity interest' : 'Later maturity interest (LMI)';
      const lmiDesc = isSettleYr
        ? 'coupons from TIPS maturing after this year, paid after today, based on the Coupon Counting choice'
        : 'from TIPS maturing after ' + d.fundedYear;
      const laterMatInt = d.araAfterLaterMatInt ?? 0;
      const sameYearExInt = d.excessLMI_After || 0;
      const plCredit = d.preLadderCreditForYear || 0;
      const cred = creditedOf(d);
      const cashCredit = Math.min(d.availableCashCredit || 0, plCredit);
      const piPerBond = principalPerBond * (1 + d.coupon / 2 * nPeriods);
      const dara = d.DARA ?? 0;
      const needed = dara - laterMatInt - sameYearExInt - plCredit - creditedTotal(cred);

      let neededFmla = 'DARA − <span class="formula-var" data-source="lmi">LMI</span>';
      if (sameYearExInt > 0) neededFmla += ' − <span class="formula-var" data-source="exlmi">Same-maturity excess int</span>';
      if (plCredit > 0) neededFmla += ' − <span class="formula-var" data-source="plc">Pre-ladder credit</span>';
      neededFmla += future30yInterestFmla(cred, '−');


      // P+I needed is the funded YEAR's total requirement; it equals this row's own quantity only
      // when this CUSIP is the only TIPS held for the year. When multiple TIPS share a funded year
      // (Maturity preference: All maturity months / Semiannual), the need is split across them per
      // Allocation policy, which this popup doesn't re-derive — say so rather than show a formula
      // that wouldn't reconcile to this row's own quantity.
      const computedQty = piPerBond > 0 ? Math.max(0, Math.round(needed / piPerBond)) : 0;
      const qtyFmla = computedQty === fyQty
        ? 'round(<span class="formula-var" data-source="needed">P+I needed</span> ÷ <span class="formula-var" data-source="pipb">P+I per TIPS</span>)'
        : 'this CUSIP’s share of the year’s P+I need, split across multiple TIPS per Allocation policy';

      rows =
        row('DARA', '', fm(dara), false, undefined, 'dara') +
        row(lmiLabel, lmiDesc, '−' + fm(laterMatInt), false, undefined, 'lmi') +
        (sameYearExInt > 0 ? row('Same-maturity excess interest', 'from excess TIPS maturing in ' + d.fundedYear, '−' + fm(sameYearExInt), false, undefined, 'exlmi') : '') +
        (plCredit > 0 ? row('Pre-ladder credit', 'Pre-Ladder Interest applied to this year', '−' + fm(plCredit), false, undefined, 'plc') : '') +
        future30yInterestRows(d.fundedYear, cred, '−') +
        (cashCredit > 0 ? row('↳ of which Available cash', 'cash on hand applied to this year', fm(cashCredit)) : '') +
        sep() +
        row('P+I needed', neededFmla, fm(needed), true, undefined, 'needed') +
        sep() +
        bondVarRows(d, nPeriods, principalPerBond, couponPct) +
        sep() +
        row('P+I per TIPS', '<span class="formula-var" data-source="ppb">Inflation-Adjusted Principal/TIPS</span> × (1 + <span class="formula-var" data-source="cpp">coupon/period</span> × <span class="formula-var" data-source="cp">periods</span>)', fm2(piPerBond), false, undefined, 'pipb') +
        sep() +
        row('Quantity After', qtyFmla, fyQty, true);
    }

  // ── Rebalance: Excess Quantity After (bracket/cover excess sub-row only) ──────
  } else if (colKey === 'excessQtyAfter') {
    const exQty = d.excessQtyAfter ?? d.excessQty;
    if (d.isFuture30yCover) {
      // Cover Excess: the Future 30Y duration match at settlement (2.0 §Future 30Y Cover Pair).
      const isLower = d.cusip === summary.future30yLowerCoverCUSIP;
      const weight  = isLower ? summary.future30yLowerWeight : summary.future30yUpperWeight;
      const totalCost = summary.future30yParams?.future30yTotalCost ?? 0;
      rows = future30yBreakdownRows(summary.future30yParams)
        + row('Future 30Y total cost', 'Sum of the synthetic Future 30Y year costs', fm(totalCost), true, undefined, 'ftc')
        + row(isLower ? 'Lower cover weight' : 'Upper cover weight', 'from <a class="info-link" data-popup="future30yDuration" style="border-bottom:1px dotted #94a3b8;color:inherit;text-decoration:none;">Future 30Y Duration Calcs</a>', (weight ?? 0).toFixed(4), false, undefined, 'bw')
        + row('Target excess cost', '<span class="formula-var" data-source="ftc">Future 30Y total cost</span> × <span class="formula-var" data-source="bw">Cover Weight</span>', fm(totalCost * (weight ?? 0)), false, undefined, 'tec')
        + row('Cost per TIPS', 'price/100 × index ratio × 1,000', fm2(d.costPerBond), false, undefined, 'cpbn')
        + row('Excess Quantity', 'round(<span class="formula-var" data-source="tec">Target cost</span> ÷ <span class="formula-var" data-source="cpbn">Cost per TIPS</span>)', exQty, true, undefined, 'qty');
    } else {
    const is3B = summary.bracketMode === '3bracket';
    // Keyed by CUSIP, not year: the retained and active lower brackets can mature in the SAME
    // calendar year (3.0 §Bracket Identification Rules), and `summary.lowerYear` was never a real
    // field on summary in the first place (the year lives at summary.brackets.lowerYear) — that typo
    // made the first branch below dead code, so every 3-bracket excess row fell through to whichever
    // of newLowerWeight3/upperWeight3 the fundedYear happened to match, showing the wrong bracket's
    // weight whenever the retained and active legs shared a year.
    const weight = is3B
      ? (d.cusip === summary.brackets?.lowerCUSIP ? summary.origLowerWeight
         : d.cusip === summary.newLowerCUSIP ? summary.newLowerWeight3
         : summary.upperWeight3)
      : (d.cusip === summary.brackets?.lowerCUSIP ? summary.lowerWeight : summary.upperWeight);
    const targetExCost = (summary.gapParams?.totalCost ?? 0) * (weight ?? 0);

    rows =
      gapBreakdownRows(summary.gapParams, summary.DARA)
      + row('Gap total cost', 'Sum of gap year theoretical costs', fm(summary.gapParams?.totalCost ?? 0), true, undefined, 'gtc')
      + row('Bracket weight', 'from <a class="info-link" data-popup="duration" style="border-bottom:1px dotted #94a3b8;color:inherit;text-decoration:none;">Duration Calcs</a>', (weight ?? 0).toFixed(4), false, undefined, 'bw')
      + row('Target excess cost', '<span class="formula-var" data-source="gtc">Gap total cost</span> × <span class="formula-var" data-source="bw">Bracket weight</span>', fm(targetExCost), false, undefined, 'tec')
      + row('Cost per TIPS', 'price/100 × index ratio × 1,000', fm2(d.costPerBond), false, undefined, 'cpbn')
      + row('Excess Quantity', 'round(<span class="formula-var" data-source="tec">Target cost</span> ÷ <span class="formula-var" data-source="cpbn">Cost per TIPS</span>)', exQty, true, undefined, 'qty');
    }

  // ── Rebalance: Cash Delta ─────────────────────────────────────────────────────
  } else if (colKey === 'cashDelta') {
    const qtyDelta  = d.fundedYearQtyDelta;
    const cashDelta = -(qtyDelta * d.costPerBond);
    const qdSign    = qtyDelta >= 0 ? '+' : '';
    const cdSign    = cashDelta >= 0 ? '+' : '';
    // Funded-year quantity only \u2014 mirrors the Excess Cash Delta popup, which is likewise
    // funded-year-free. A bracket-target CUSIP's funded and excess portions are the SAME held
    // maturity, but a rebalance never splits one CUSIP's holdings into buckets, so no such split
    // (or the CUSIP's total held quantity) is shown here.
    rows =
      row('Quantity delta', 'Quantity After \u2212 Quantity Before', qdSign + qtyDelta, false, undefined, 'qty') +
      sep() +
      row('Price (unadjusted)', '', fd(d.price, 4), false, undefined, 'price') +
      row('Ref CPI (settlement date)', '', fd(d.refCPI, 5), false, 'refCPI', 'refcpi') +
      row('Dated date Ref CPI', '', fd(d.datedDateRefCpi, 5), false, undefined, 'datedDateRefCpi') +
      row('Index ratio', '<span class="formula-var" data-source="refcpi">Ref CPI</span> \xf7 <span class="formula-var" data-source="datedDateRefCpi">Dated date Ref CPI</span>', fd(d.indexRatio, 9), false, 'indexRatio', 'ir') +
      row('Cost per TIPS', '<span class="formula-var" data-source="price">price/100</span> \xd7 <span class="formula-var" data-source="ir">index ratio</span> \xd7 1,000', fm2(d.costPerBond), false, undefined, 'cpb') +
      sep() +
      row('Cash \u0394', '\u2212(<span class="formula-var" data-source="qty">Quantity delta</span> \xd7 <span class="formula-var" data-source="cpb">Cost per TIPS</span>)', cdSign + fm(Math.abs(cashDelta)), true);

  // ── Rebalance: Cost Before / After ────────────────────────────────────────────
  } else if (colKey === 'costBefore' || colKey === 'costAfter') {
    const isBef    = colKey === 'costBefore';
    const qty      = isBef ? d.fundedYearQtyBefore : d.fundedYearQtyAfter;
    const cost     = qty * d.costPerBond;
    rows =
      row(isBef ? 'Quantity Before' : 'Quantity After', '', qty, false, undefined, 'qty') +
      sep() +
      row('Price (unadjusted)', '', fd(d.price, 4), false, undefined, 'price') +
      row('Ref CPI (settlement date)', '', fd(d.refCPI, 5), false, 'refCPI', 'refcpi') +
      row('Dated date Ref CPI', '', fd(d.datedDateRefCpi, 5), false, undefined, 'datedDateRefCpi') +
      row('Index ratio', '<span class="formula-var" data-source="refcpi">Ref CPI</span> \xf7 <span class="formula-var" data-source="datedDateRefCpi">Dated date Ref CPI</span>', fd(d.indexRatio, 9), false, 'indexRatio', 'ir') +
      row('Cost per TIPS', '<span class="formula-var" data-source="price">price/100</span> \xd7 <span class="formula-var" data-source="ir">index ratio</span> \xd7 1,000', fm2(d.costPerBond), false, undefined, 'cpb') +
      sep() +
      row(isBef ? 'Cost Before' : 'Cost After', '<span class="formula-var" data-source="qty">Quantity</span> \xd7 <span class="formula-var" data-source="cpb">Cost per TIPS</span>', fm(cost), true);

  // ── Rebalance: Bracket Cost Before/After ──────────────────────────────────────
  } else if (colKey === 'bracketCostBefore' || colKey === 'bracketCostAfter') {
    const s       = summary;
    const isAfter = colKey === 'bracketCostAfter';
    if (!isAfter) {
      const exQty = d.excessQtyBefore;
      rows = row('Excess Quantity', '', exQty, false, undefined, 'qty')
        + sep()
        + indexRatioRows(d)
        + priceRow(d) + costPerTipsRow(d)
        + sep()
        + row('Excess Cost Before', '<span class="formula-var" data-source="cpb">Cost per TIPS</span> \xd7 <span class="formula-var" data-source="qty">Excess Quantity</span>', fm(exQty * d.costPerBond), true);
    } else if (s && s.brackets) {
      const isLower = d.cusip === s.brackets.lowerCUSIP;
      const isNewLower = s.bracketMode === '3bracket' && d.cusip === s.newLowerCUSIP;
      const weight  = isLower ? (s.origLowerWeight ?? s.lowerWeight)
                   : isNewLower ? (s.newLowerWeight3 ?? 0)
                   : s.upperWeight;
      const wLabel  = isLower ? 'Retained lower bracket weight' : isNewLower ? 'Active lower bracket weight' : 'Upper bracket weight';
      const exCost  = s.gapParams.totalCost * weight;
      const exQty   = d.excessQtyAfter;
      rows = row('Excess Quantity', 'round(<span class="formula-var" data-source="tec">target cost</span> \xf7 <span class="formula-var" data-source="cpb">Cost per TIPS</span>)', exQty, false, undefined, 'qty')
        + sep()
        + row(wLabel, 'see Duration Calcs ↗', fd(weight, 4), false, undefined, 'wt')
        + sep()
        + row('Gap total cost', '', fm(s.gapParams.totalCost), false, undefined, 'gtc')
        + row('Target excess cost', '<span class="formula-var" data-source="gtc">Gap total cost</span> \xd7 <span class="formula-var" data-source="wt">' + wLabel.toLowerCase() + '</span>', fm(exCost), false, undefined, 'tec')
        + sep()
        + indexRatioRows(d)
        + priceRow(d)
        + costPerTipsRow(d)
        + sep()
        + row('Excess Cost After', '<span class="formula-var" data-source="cpb">Cost per TIPS</span> \xd7 <span class="formula-var" data-source="qty">Excess Quantity</span>', fm(exQty * d.costPerBond), true);
    }
  // ── Rebalance: Future 30Y Cost Before/After ───────────────────────────────────
  } else if (colKey === 'future30yCostBefore' || colKey === 'future30yCostAfter') {
    const s       = summary;
    const isAfter = colKey === 'future30yCostAfter';
    if (!isAfter) {
      const exQty = d.excessQtyBefore;
      rows = row('Excess Quantity', '', exQty, false, undefined, 'qty')
        + sep()
        + indexRatioRows(d)
        + priceRow(d) + costPerTipsRow(d)
        + sep()
        + row('Future 30Y Cover Cost Before', '<span class="formula-var" data-source="cpb">Cost per TIPS</span> \xd7 <span class="formula-var" data-source="qty">Excess Quantity</span>', fm(exQty * d.costPerBond), true);
    } else if (s) {
      const isLower = d.cusip === s.future30yLowerCoverCUSIP;
      const weight  = isLower ? s.future30yLowerWeight : s.future30yUpperWeight;
      const wLabel  = isLower ? 'Lower cover weight' : 'Upper cover weight';
      const exCost  = (s.future30yParams?.future30yTotalCost ?? 0) * weight;
      const exQty   = d.excessQtyAfter;
      rows = row('Excess Quantity', 'round(<span class="formula-var" data-source="tec">target cost</span> \xf7 <span class="formula-var" data-source="cpb">Cost per TIPS</span>)', exQty, false, undefined, 'qty')
        + sep()
        + indexRatioRows(d)
        + priceRow(d)
        + costPerTipsRow(d)
        + sep()
        + row(wLabel, 'see Future 30Y Duration Calcs ↗', fd(weight, 4), false, undefined, 'wt')
        + future30yBreakdownRows(s.future30yParams)
        + row('Future 30Y total cost', 'Sum of the synthetic Future 30Y year costs', fm(s.future30yParams?.future30yTotalCost ?? 0), true, undefined, 'ftc')
        + row('Target excess cost', '<span class="formula-var" data-source="ftc">Future 30Y total cost</span> \xd7 <span class="formula-var" data-source="wt">' + wLabel.toLowerCase() + '</span>', fm(exCost), false, undefined, 'tec')
        + sep()
        + row('Future 30Y Cover Cost After', '<span class="formula-var" data-source="cpb">Cost per TIPS</span> \xd7 <span class="formula-var" data-source="qty">Excess Quantity</span>', fm(exQty * d.costPerBond), true);
    }

  // ── Rebalance: Excess Cash Delta (bracket/cover excess row) ──────────────────
  } else if (colKey === 'excessCashDelta') {
    const exQtyDel  = d.excessQtyDelta;
    const excessCash = -(exQtyDel * d.costPerBond);
    const delSign   = exQtyDel >= 0 ? '+' : '';
    const cashSign  = excessCash >= 0 ? '+' : '';
    // Mirrors the funded-year Cash Delta popup: a rebalance does not split a CUSIP's holdings
    // into funded-year and excess buckets, so no such split is shown here. Excess quantity is
    // set by Gap Dur duration matching (see that popup); this only explains the cash delta.
    rows =
      row('Excess quantity delta', 'Excess Quantity After − Excess Quantity Before', delSign + exQtyDel, false, undefined, 'qty') +
      sep() +
      row('Price (unadjusted)', '', fd(d.price, 4), false, undefined, 'price') +
      row('Ref CPI (settlement date)', '', fd(d.refCPI, 5), false, 'refCPI', 'refcpi') +
      row('Dated date Ref CPI', '', fd(d.datedDateRefCpi, 5), false, undefined, 'datedDateRefCpi') +
      row('Index ratio', '<span class="formula-var" data-source="refcpi">Ref CPI</span> ÷ <span class="formula-var" data-source="datedDateRefCpi">Dated date Ref CPI</span>', fd(d.indexRatio, 9), false, 'indexRatio', 'ir') +
      row('Cost per TIPS', '<span class="formula-var" data-source="price">price/100</span> × <span class="formula-var" data-source="ir">index ratio</span> × 1,000', fm2(d.costPerBond), false, undefined, 'cpb') +
      sep() +
      row('Excess Cash Δ', '−(<span class="formula-var" data-source="qty">Excess quantity delta</span> × <span class="formula-var" data-source="cpb">Cost per TIPS</span>)', cashSign + fm(Math.abs(excessCash)), true);

  }

  return '<table style="border-collapse:collapse;width:auto;font-size:12px">' + rows + '</table>';
}

export function buildPIPerBondDrill(h) {
  const ir = h.principalPerBond / 1000;
  const couponInterest = h.principalPerBond * h.coupon / 2 * h.nPeriods;
  const piPB = h.principalPerBond + couponInterest;
  const matMo = MONTHS[h.maturityMonth];
  const prevMo = MONTHS[(h.maturityMonth - 6 + 12) % 12];
  const periodLabel = h.nPeriods === 1 ? matMo + ' coupon' : prevMo + ' + ' + matMo + ' coupons';
  const couponNote = '$' + fd(h.principalPerBond, 2) + ' \u00d7 ' + fd(h.coupon / 2 * 100, 5) + '% \u00d7 ' + h.nPeriods + ' (' + periodLabel + ')';
  return [
    { label: 'Index ratio', note: 'Ref CPI \u00f7 Dated date Ref CPI', value: fd(ir, 5) },
    { label: 'Inflation-Adjusted Principal', note: '1,000 \u00d7 index ratio', value: '$' + fd(h.principalPerBond, 2) },
    { label: 'Coupon interest', note: couponNote, value: '$' + fd(couponInterest, 2) },
    { sep: true },
    { label: 'P+I per TIPS', value: '$' + fd(piPB, 2), total: true }
  ];
}

export function buildIndexRatioDrill(d, kind) {
  const ratio = kind === 'payment' ? fd(d.paymentIndexRatio, 5) : fd(d.indexRatio, 9);
  return [
    { label: 'Settlement Ref CPI', value: fd(d.refCPI, 5) },
    { label: 'Dated date Ref CPI', value: fd(d.datedDateRefCpi, 5) },
    { sep: true },
    { label: 'Index Ratio', note: 'Settlement Ref CPI / Dated date Ref CPI', value: ratio, total: true },
    { sep: true },
    { label: 'Authority', note: '31 CFR § 356.30', value: '<a href="https://www.ecfr.gov/current/title-31/subtitle-B/chapter-II/subchapter-A/part-356/subpart-C/section-356.30" target="_blank" style="color:#1a56db;text-decoration:none">\u00a7 356.30 \u2197</a>' }
  ];
}

// ─── Trade Ticket popups (5.0 §Trade Ticket) ──────────────────────────────────
// r: { price, indexRatio, costPerBond, coupon, A, E, accruedPerBond, qty,
//      cost, accruedInterest, totalCost } — built per-row in index.html.
// "Cost" (not "Principal") deliberately — Principal already means the inflation-adjusted
// FACE value (1,000 × index ratio, see bond-math.js principalPerBond); this is the dollar
// amount paid, which additionally reflects market price. Matches the main table's existing
// Cost / Cost Before / Cost After columns and "Cost per TIPS" popup wording.
export function buildTradeTicketCostDrill(r) {
  return [
    { label: 'Price', note: 'quoted, % of par', value: fd(r.price, 3) },
    { label: 'Index Ratio', note: 'settlement Ref CPI ÷ dated Ref CPI', value: fd(r.indexRatio, 9) },
    { sep: true },
    { label: 'Cost per TIPS', note: 'price/100 \xd7 index ratio \xd7 1,000', value: fm2(r.costPerBond) },
    { label: 'Quantity', value: r.qty },
    { sep: true },
    { label: 'Cost', note: 'cost per TIPS \xd7 quantity', value: fm(r.cost), total: true },
  ];
}

export function buildTradeTicketAccruedDrill(r) {
  return [
    { label: 'Days since last coupon (A)', value: fd(r.A, 0) },
    { label: 'Days in coupon period (E)', value: fd(r.E, 0) },
    { label: 'Coupon ÷ 2', note: 'semiannual rate', value: fd(r.coupon / 2 * 100, 5) + '%' },
    { sep: true },
    { label: 'Accrued Interest per TIPS', note: '(A ÷ E) \xd7 (coupon/2 \xd7 1,000 \xd7 index ratio)', value: fm2(r.accruedPerBond) },
    { label: 'Quantity', value: r.qty },
    { sep: true },
    { label: 'Accrued Interest', note: 'accrued interest per TIPS \xd7 quantity', value: fm(r.accruedInterest), total: true },
  ];
}

export function buildTradeTicketTotalDrill(r, label) {
  return [
    { label: 'Cost', value: fm(r.cost) },
    { label: 'Accrued Interest', value: fm(r.accruedInterest) },
    { sep: true },
    { label: label || 'Total Cost', value: fm(r.totalCost), total: true },
  ];
}

// ─── Cash Flow Calendar: per-date breakdown (5.0 §Cash Flow Calendar) ─────────
// bucket: { date, coupon, principal, events: [{ cusip, type, amount, qty, refCPI, datedDateRefCpi, indexRatio, principalPerBond, coupon, isActual, refCpiDateDisplay }] }
// Ref CPI is a single national series, not per-bond, so every event sharing this date shares the
// same refCPI/isActual/refCpiDateDisplay — shown once at the top rather than repeated per line.
export function buildCashFlowDateDrill(bucket) {
  const first = bucket.events[0];
  const rows = [];
  if (first) {
    rows.push({ label: first.isActual ? 'Cpn Ref CPI date' : 'Ref CPI date', value: first.refCpiDateDisplay });
    rows.push({ label: 'Ref CPI', value: fd(first.refCPI, 5) });
    rows.push({ sep: true });
  }
  bucket.events.forEach((e, i) => {
    rows.push({
      label: '<span class="cf-event-drill" data-cf-event-idx="' + i + '" style="cursor:pointer;text-decoration:underline dotted #94a3b8;">'
        + e.cusip + (e.type === 'principal' ? ' — Principal' : ' — Coupon') + '</span>',
      value: fm2(e.amount),
    });
  });
  rows.push({ sep: true });
  rows.push({ label: 'Total', value: fm2(bucket.coupon + bucket.principal), total: true });
  return rows;
}

// Nested (click a CUSIP line inside the per-date popup): how that one CUSIP's payment was
// calculated. The date's Ref CPI is already shown once above (buildCashFlowDateDrill) — this starts
// from Dated date Ref CPI so nothing is repeated.
export function buildCashFlowEventDrill(e) {
  const rows = [
    { label: 'Ref CPI', value: fd(e.refCPI, 5) },
    { label: 'Dated date Ref CPI', value: fd(e.datedDateRefCpi, 5) },
    { label: 'Index ratio', note: 'Ref CPI \xf7 Dated date Ref CPI', value: fd(e.paymentIndexRatio, 5) },
    { label: 'Inflation-Adjusted Principal per TIPS', note: '1,000 \xd7 index ratio', value: fm2(e.principalPerBond) },
  ];
  if (e.type === 'coupon') {
    rows.push({ label: 'Coupon per period', note: 'annual coupon \xf7 2', value: fd(e.coupon / 2 * 100, 5) + '%' });
    rows.push({ sep: true });
    rows.push({ label: 'Coupon per TIPS', note: 'Inflation-Adjusted Principal/TIPS \xd7 coupon/period', value: fm2(e.principalPerBond * e.coupon / 2) });
  } else {
    rows.push({ sep: true });
    rows.push({ label: 'Principal per TIPS', note: 'Inflation-Adjusted Principal/TIPS at this index ratio', value: fm2(e.principalPerBond) });
  }
  rows.push({ label: 'Quantity', value: e.qty });
  rows.push({ sep: true });
  rows.push({ label: e.type === 'principal' ? 'Principal' : 'Coupon', note: 'Amount per TIPS \xd7 Quantity', value: fm2(e.amount), total: true });
  return rows;
}

export function buildRefCpiDrill(d, complexity = 'quant', refCpiRows = null) {
  const date = new Date(d.settlementDate || d.settlementDateStr || new Date());
  const day = date.getDate();
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const m3 = MONTHS[(date.getMonth() - 3 + 12) % 12];
  const m2 = MONTHS[(date.getMonth() - 2 + 12) % 12];
  const _pad = n => String(n).padStart(2, '0');
  const _m3Key = date.getFullYear() + '-' + _pad(date.getMonth() + 1) + '-01';
  const _m2Next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const _m2Key = _m2Next.getFullYear() + '-' + _pad(_m2Next.getMonth() + 1) + '-01';
  const cpiM3Val = refCpiRows ? (refCpiRows.find(r => r.date === _m3Key)?.refCpi ?? null) : null;
  const cpiM2Val = refCpiRows ? (refCpiRows.find(r => r.date === _m2Key)?.refCpi ?? null) : null;

  const isQuant = complexity === 'quant';

  const rows = [
    { toggle: { options: [
        { label: 'ELI5', value: 'eli5', active: !isQuant },
        { label: 'Quant', value: 'quant', active: isQuant }
      ]}},
    { label: 'Settlement Date', value: (d.settlementDate || d.settlementDateStr || 'Current') },
  ];

  if (!isQuant) {
    rows.push(
      { sep: true },
      { heading: 'The Simple Version' },
      { label: 'Core Idea', note: 'Ref CPI is a daily "smooth" value between two monthly CPI-U readings.', value: '\ud83d\udcc8' },
      { label: 'Anchor 1', note: 'CPI-U from 3 months ago (' + m3 + ')', value: 'Start' },
      { label: 'Anchor 2', note: 'CPI-U from 2 months ago (' + m2 + ')', value: 'End' },
      { label: 'Progress', note: 'How far through the current month we are', value: Math.round((day - 1) / daysInMonth * 100) + '%' },
      { sep: true },
      { label: 'Ref CPI', note: 'Today\'s value, partway between anchors', value: fd(d.refCPI, 5), total: true }
    );
  } else {
    rows.push(
      { label: 'Day of month (d)', value: day },
      { label: 'Days in month (D)', value: daysInMonth },
      { sep: true },
      { heading: 'Interpolation Formula' },
      { label: 'Ref CPI', value: 'CPI(m-3) + (d-1)/D \u00d7 [CPI(m-2) - CPI(m-3)]', note: 'Per 31 CFR \u00a7 356 Appx B' },
      { sep: true },
      { label: 'm-3 CPI-U (NSA)', note: 'CPI-U for ' + m3, value: cpiM3Val != null ? fd(cpiM3Val, 3) : 'see BLS' },
      { label: 'm-2 CPI-U (NSA)', note: 'CPI-U for ' + m2, value: cpiM2Val != null ? fd(cpiM2Val, 3) : 'see BLS' },
      { sep: true },
      { label: 'Ref CPI', note: 'Interpolated daily value', value: fd(d.refCPI, 5), total: true }
    );
  }

  rows.push(
    { sep: true },
    { label: 'Authority', note: '31 CFR \u00a7 356 Appendix B', value: '<a href="https://www.ecfr.gov/current/title-31/subtitle-B/chapter-II/subchapter-A/part-356/appendix-Appendix%20B%20to%20Part%20356" target="_blank" style="color:#1a56db;text-decoration:none">Appx B \u2197</a>' }
  );

  return rows;
}

function renderDurationBeam(buckets, avgDur) {
  const durs = buckets.map(b => b.dur);
  const min = Math.floor(Math.min(...durs, avgDur)) - 1;
  const max = Math.ceil(Math.max(...durs, avgDur)) + 1;
  const range = max - min;
  const px = d => ((d - min) / range) * 100;

  const ap = px(avgDur);

  let bucketHtml = '';
  buckets.forEach(b => {
    const p = px(b.dur);
    const w = Math.round(b.weight * 100);
    bucketHtml += 
      '<div style="position:absolute;top:-24px;left:' + p + '%;transform:translateX(-50%);text-align:center;">'
        + '<div style="font-weight:700;color:#1a56db">' + w + '%</div>'
        + '<div style="font-size:9px;color:#334155">' + b.label + '</div>'
        + '<div style="width:2px;height:24px;background:#3b82f6;margin:2px auto 0;opacity:0.4;"></div>'
      + '</div>';
  });

  return '<div style="margin:0 0 8px;padding:32px 10px 32px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;position:relative;user-select:none;">'
    + '<div style="height:4px;background:#cbd5e1;border-radius:2px;position:relative;margin:0 20px;">'
      + [min, max].map(v => '<div style="position:absolute;top:8px;left:' + px(v) + '%;transform:translateX(-50%);font-size:9px;color:#334155">' + v + 'y</div>').join('')
      + '<div style="position:absolute;top:-2px;left:' + ap + '%;width:12px;height:12px;background:#1e293b;transform:translate(-50%, -50%) rotate(45deg);z-index:1;" title="Fulcrum: Avg Duration (' + avgDur.toFixed(2) + 'y)"></div>'
      + '<div style="position:absolute;top:12px;left:' + ap + '%;transform:translateX(-50%);text-align:center;white-space:nowrap;">'
        + '<div style="font-weight:700;color:#1e293b">' + avgDur.toFixed(2) + 'y</div>'
        + '<div style="font-size:9px;color:#334155">Average</div>'
      + '</div>'
      + bucketHtml
    + '</div>'
    + '</div>';
}

// Portfolio Avg Mod Dur / Avg Yld / Avg SA Yld popups (4.0 §Weighted Modified Duration): each
// holding's own value (modified duration, or yield/SA yield from market data), weighted by market
// value. `details` carries `mktValue` (single source, set alongside `mDuration`/`yield`/`saYield`
// in build-lib.js / rebalance-lib.js) so no popup can ever drift from the number it explains.
function _weightedAvgPopupRows(details, avg, { field, quantityLabel, fmtValue }) {
  const held = details.filter(d => d.mktValue > 0).sort((a, b) => a.fundedYear - b.fundedYear);
  if (held.length === 0) return [{ label: 'No holdings', total: true }];
  const mvSum = held.reduce((s, d) => s + d.mktValue, 0);

  const rows = [{ heading: 'Holdings' }];
  held.forEach(d => {
    const v = d[field];
    rows.push({
      label: d.fundedYear + ' · ' + d.cusip,
      note: d.maturityStr + ' — ' + fm(d.mktValue) + ' MV',
      value: v != null ? fmtValue(v) : '—',
    });
  });
  rows.push(
    { sep: true },
    { label: 'Weighted by market value',
      note: 'Σ(MV × ' + quantityLabel + ') ÷ ' + fm(mvSum) + ' total MV',
      value: fmtValue(avg), total: true },
  );
  return rows;
}

export function buildWeightedDurationPopupRows(details, wad) {
  return _weightedAvgPopupRows(details, wad, { field: 'mDuration', quantityLabel: 'Mod Dur', fmtValue: v => v.toFixed(2) });
}

export function buildWeightedYieldPopupRows(details, way) {
  return _weightedAvgPopupRows(details, way, { field: 'yield', quantityLabel: 'Yield', fmtValue: v => (v * 100).toFixed(2) + '%' });
}

export function buildWeightedSaYieldPopupRows(details, waySa) {
  return _weightedAvgPopupRows(details, waySa, { field: 'saYield', quantityLabel: 'SA Yield', fmtValue: v => (v * 100).toFixed(2) + '%' });
}

// Brackets are named by the maturity actually holding their excess, not by the year alone
// (DD Bracket Year TIPS). Shared so the weight drill and the popup that links to it agree.
// The row the gap and Future 30Y duration matches both end on: the check that defines Bracket
// Weight (DATA_DICTIONARY §Bracket Weight) — the cost-weighted mean of the durations equals the
// average duration of the years being covered. The mean is computed from the weights and
// durations shown rather than restated as the target, so a solve that does not reach the average
// shows it here. `kind` is 'bracket' or 'cover'; the arithmetic is identical either way.
function durationMatchRows(ws, ds, avg, kind) {
  const of    = kind === 'cover' ? 'cover year' : 'bracket year';
  const avgOf = kind === 'cover' ? 'the Future 30Y years' : 'the gap years';
  const terms = ws.map((w, i) => w.toFixed(4) + '  ×  ' + ds[i].toFixed(2)).join('   +   ');
  const mean  = ws.reduce((s, w, i) => s + w * ds[i], 0);
  const wSum  = ws.reduce((s, w) => s + w, 0);
  return [
    {
      label: 'Cost-weighted mean of the ' + of + ' durations',
      note: terms, value: mean.toFixed(2), total: true,
    },
    { prose: 'The ' + of + ' weights sum to ' + wSum.toFixed(4) + ', and are solved so that this mean'
        + ' equals the average duration of ' + avgOf + ', ' + avg.toFixed(2) + '.' },
  ];
}

function bracketLabels(summary, mode) {
  const lowerYear = mode === 'rebal' ? summary.brackets?.lowerYear : summary.lowerYear;
  const upperYear = mode === 'rebal' ? summary.brackets?.upperYear : summary.upperYear;
  const _my = d => (d ? MONTHS[d.getMonth()] + ' ' + d.getFullYear() : null);
  return {
    lowerYear, upperYear,
    lowerLabel: mode === 'build' ? summary.lowerMonth + ' ' + lowerYear
      : (_my(summary.brackets?.lowerMaturity) ?? String(lowerYear)),
    upperLabel: mode === 'build' ? summary.upperMonth + ' ' + upperYear
      : (_my(summary.brackets?.upperMaturity) ?? String(upperYear)),
    activeLabel: _my(summary.newLowerMaturity) ?? String(summary.newLowerYear),
  };
}

// Level-3 drill for one bracket weight, opened from a bracket row in the Gap Dur popup
// (5.0 §Nested (Level-3) drills, key `bracketwt-<which>`). Every term is named in full so the
// formula reads without a legend: a weight says weight, a duration says duration, and each names
// the bracket it belongs to. Values appear at the precision the popup shows them at, so the
// substitution can be checked against the rows it came from.
export function buildBracketWeightDrill(summary, mode, which) {
  const { lowerLabel, upperLabel, activeLabel } = bracketLabels(summary, mode);
  const is3  = mode === 'rebal' && summary.bracketMode === '3bracket' && summary.newLowerCUSIP;
  const avg  = summary.gapParams?.avgDuration ?? 0;
  const dRet = summary.lowerDuration ?? 0;
  const dAct = is3 ? (summary.newLowerDuration ?? 0) : (summary.lowerDuration ?? 0);
  const dUp  = summary.upperDuration ?? 0;
  const wRet = is3 ? (summary.origLowerWeight ?? 0) : 0;
  const wAct = is3 ? (summary.newLowerWeight3 ?? 0) : (summary.lowerWeight ?? 0);
  const wUp  = is3 ? (summary.upperWeight3 ?? summary.upperWeight ?? 0) : (summary.upperWeight ?? 0);

  const f2 = v => v.toFixed(2), f4 = v => v.toFixed(4);
  const fml = s => ({ html:
    '<div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;'
    + 'line-height:1.7;white-space:pre-wrap;color:#1e293b;">' + s + '</div>' });
  const DEF = 'The share of the gap years’ total cost carried by one bracket year. The weights '
    + 'across the bracket years sum to 1, solved so that the cost-weighted mean of the bracket year '
    + 'durations equals the average duration of the gap years. Durations here are modified durations.';

  const rows = [{ prose: DEF }, { sep: true }];

  if (which === 'retained') {
    const heldCost = summary.retainedExcessCostBefore;
    const totalCost = summary.gapParams?.totalCost ?? 0;
    const sold = !!summary.retainedBracketSold;
    rows.push({ heading: 'Formula' });
    if (sold) {
      // The duration match could not be reached with the retained bracket held where it was, so
      // it was reduced to the weight that brings the active lower bracket back to the excess it
      // already holds (gap-math.js bracketWeightsN; 2.0 §Retained Bracket Excess).
      rows.push(fml('retained lower bracket weight =\n'
        + '    (average gap year duration\n'
        + '       − active lower bracket weight × active lower bracket duration\n'
        + '       − (1 − active lower bracket weight) × upper bracket duration)\n'
        + '    ÷ (retained lower bracket duration − upper bracket duration)'));
      rows.push({ sep: true }, { heading: 'This ladder' });
      rows.push({ label: 'Retained lower bracket', value: lowerLabel });
      rows.push({ label: 'Average gap year duration', value: f2(avg) });
      rows.push({ label: 'Active lower bracket weight', value: f4(wAct) });
      rows.push({ label: 'Active lower bracket duration', value: f2(dAct) });
      rows.push({ label: 'Retained lower bracket duration', value: f2(dRet) });
      rows.push({ label: 'Upper bracket duration', value: f2(dUp) });
      rows.push({ sep: true }, { heading: 'Substituted' });
      rows.push(fml('(' + f2(avg) + '\n'
        + '   − ' + f4(wAct) + ' × ' + f2(dAct) + '\n'
        + '   − (1 − ' + f4(wAct) + ') × ' + f2(dUp) + ')\n'
        + '÷ (' + f2(dRet) + ' − ' + f2(dUp) + ')'));
    } else {
      rows.push(fml('retained lower bracket weight =\n'
        + '    excess already held in the retained lower bracket\n'
        + '    ÷ gap years’ total cost'));
      rows.push({ sep: true }, { heading: 'This ladder' });
      rows.push({ label: 'Retained lower bracket', value: lowerLabel });
      if (heldCost != null) {
        rows.push({ label: 'Excess already held, at cost',
                    value: '$' + Math.round(heldCost).toLocaleString() });
      }
      rows.push({ label: 'Gap years’ total cost',
                  value: '$' + Math.round(totalCost).toLocaleString() });
      if (heldCost != null && totalCost > 0) {
        rows.push({ sep: true }, { heading: 'Substituted' });
        rows.push(fml(Math.round(heldCost).toLocaleString() + ' ÷ ' + Math.round(totalCost).toLocaleString()));
      }
    }
    rows.push({ sep: true });
    rows.push({ label: 'Retained lower bracket weight', value: f4(wRet), total: true });
    rows.push({ sep: true });
    rows.push({ prose: sold
      ? 'The excess already held came to more than the duration match allows, so it was sold down '
        + 'to this weight — only as far as the match requires, and oldest maturity first. A rebalance '
        + 'never increases it.'
      : 'A rebalance never increases this weight. Where the duration match cannot be reached with '
        + 'the excess held where it is, the retained lower bracket is sold down — only as far as the '
        + 'match requires, and oldest maturity first — and this weight follows from the match instead.' });
    return rows;
  }

  if (which === 'active') {
    rows.push({ heading: 'Formula' });
    if (is3) {
      rows.push(fml('active lower bracket weight =\n'
        + '    (1 − retained lower bracket weight) − upper bracket weight'));
      rows.push({ sep: true }, { heading: 'This ladder' });
      rows.push({ label: 'Active lower bracket', value: activeLabel });
      rows.push({ label: 'Retained lower bracket weight', value: f4(wRet) });
      rows.push({ label: 'Upper bracket weight', value: f4(wUp) });
      rows.push({ sep: true }, { heading: 'Substituted' });
      rows.push(fml('(1 − ' + f4(wRet) + ') − ' + f4(wUp)));
    } else {
      rows.push(fml('active lower bracket weight =\n'
        + '    (upper bracket duration − average gap year duration)\n'
        + '    ÷ (upper bracket duration − active lower bracket duration)'));
      rows.push({ sep: true }, { heading: 'This ladder' });
      rows.push({ label: 'Active lower bracket', value: lowerLabel });
      rows.push({ label: 'Average gap year duration', value: f2(avg) });
      rows.push({ label: 'Active lower bracket duration', value: f2(dAct) });
      rows.push({ label: 'Upper bracket duration', value: f2(dUp) });
      rows.push({ sep: true }, { heading: 'Substituted' });
      rows.push(fml('(' + f2(dUp) + ' − ' + f2(avg) + ')'
        + ' ÷ (' + f2(dUp) + ' − ' + f2(dAct) + ')'));
    }
    rows.push({ sep: true });
    rows.push({ label: 'Active lower bracket weight', value: f4(wAct), total: true });
    return rows;
  }

  rows.push({ heading: 'Formula' });
  if (is3) {
    rows.push(fml('upper bracket weight =\n'
      + '    (average gap year duration\n'
      + '       − retained lower bracket weight × retained lower bracket duration\n'
      + '       − (1 − retained lower bracket weight) × active lower bracket duration)\n'
      + '    ÷ (upper bracket duration − active lower bracket duration)'));
    rows.push({ sep: true }, { heading: 'This ladder' });
    rows.push({ label: 'Upper bracket', value: upperLabel });
    rows.push({ label: 'Average gap year duration', value: f2(avg) });
    rows.push({ label: 'Retained lower bracket weight', value: f4(wRet) });
    rows.push({ label: 'Retained lower bracket duration', value: f2(dRet) });
    rows.push({ label: 'Active lower bracket duration', value: f2(dAct) });
    rows.push({ label: 'Upper bracket duration', value: f2(dUp) });
    rows.push({ sep: true }, { heading: 'Substituted' });
    rows.push(fml('(' + f2(avg) + '\n'
      + '   − ' + f4(wRet) + ' × ' + f2(dRet) + '\n'
      + '   − (1 − ' + f4(wRet) + ') × ' + f2(dAct) + ')\n'
      + '÷ (' + f2(dUp) + ' − ' + f2(dAct) + ')'));
  } else {
    rows.push(fml('upper bracket weight = 1 − active lower bracket weight'));
    rows.push({ sep: true }, { heading: 'This ladder' });
    rows.push({ label: 'Upper bracket', value: upperLabel });
    rows.push({ label: 'Active lower bracket weight', value: f4(wAct) });
    rows.push({ sep: true }, { heading: 'Substituted' });
    rows.push(fml('1 − ' + f4(wAct)));
  }
  rows.push({ sep: true });
  rows.push({ label: 'Upper bracket weight', value: f4(wUp), total: true });
  return rows;
}

export function buildDurationPopupRows(summary, mode) {
  if (mode === 'rebal' && (!summary.gapYears || summary.gapYears.length === 0)) {
    return [{ label: 'No gap years', note: 'Bracket duration matching not applicable for this ladder', total: true }];
  }
  const { lowerYear, upperYear, lowerLabel, upperLabel } = bracketLabels(summary, mode);
  
  const { lowerDuration, upperDuration, lowerWeight, upperWeight, gapParams } = summary;
  const is3 = mode === 'rebal' && summary.bracketMode === '3bracket' && summary.newLowerCUSIP;
  const avg = gapParams.avgDuration;

  const rows = [
    { label: 'Weighted average duration of the synthetic TIPS', value: avg.toFixed(2) },
    { sep: true },
  ];

  if (gapParams.breakdown?.length) {
    rows.push(...synthYearListRows('gap', gapParams, 'Synthetic Gap Year TIPS'), { sep: true });
  }


  const buckets = [];
  if (is3) {
    const { newLowerYear, newLowerDuration, origLowerWeight, newLowerWeight3 } = summary;
    const { activeLabel } = bracketLabels(summary, mode);
    const w1 = (origLowerWeight ?? 0), w2 = (newLowerWeight3 ?? 0), w3 = (summary.upperWeight3 ?? summary.upperWeight ?? 0);
    // bracketWeightsN (gap-math.js): the retained lower bracket is frozen at held excess/total
    // cost; if the lower brackets are over-allocated it is sold down only as far as the duration match
    // requires (earliest first, clamped to [0, currently held]) \u2014 never depleted outright
    // when a partial sale would restore the match. Only the active lower and upper are solved
    // from the duration constraint, so this note must track that formula exactly.

    const dv = (d, w) => d.toFixed(2) + '  \u00b7  ' + w.toFixed(4);
    rows.push({ heading: 'Bracket Years (modified duration \u00b7 weight)' });
    rows.push(
      { label: wtLink('retained', 'retained lower: ' + lowerLabel),
        value: dv(lowerDuration, w1) },
      { label: wtLink('active', 'active lower: ' + activeLabel),
        value: dv(newLowerDuration, w2) },
      { label: wtLink('upper', 'upper: ' + upperLabel),
        value: dv(upperDuration, w3) }
    );
    buckets.push({ dur: lowerDuration, weight: w1, label: lowerLabel });
    buckets.push({ dur: newLowerDuration, weight: w2, label: activeLabel });
    buckets.push({ dur: upperDuration, weight: w3, label: upperLabel });

    rows.push({ sep: true }, ...durationMatchRows([w1, w2, w3], [lowerDuration, newLowerDuration, upperDuration], avg, 'bracket'));

    // bracketWeightsN reports which condition blocked the solve; each is a different thing to tell
    // the reader, and only the first leaves the mean above short of the gap average.
    const solveNote = {
      coincidentDurations: 'The active lower and upper bracket durations coincide, so the weight left after the retained lower bracket was split evenly between the two rather than solved. The mean above does not reach the average duration of the gap years.',
      upperWeightNegative: 'The duration match solves to a negative upper bracket weight: the average duration of the gap years is shorter than the retained and active lower brackets alone produce.',
      activeBelowFloor:    'The retained lower bracket has been sold down as far as the lower bracket priority rule allows, and the duration match still calls for less excess in the active lower bracket than it currently holds.',
    }[summary.bracketSolveReason];
    if (solveNote) rows.push({ html:
      '<div style="font-size:11px;color:#334155;line-height:1.6;padding:2px 0 0;">' + solveNote + '</div>' });

  } else if (lowerYear == null) {
    // No lower bracket (firstYear is inside the gap \u2014 all coverage on upper bracket alone)
    rows.push(
      { heading: 'Bracket Years (modified duration \u00b7 weight)' },
      { label: 'upper: ' + upperLabel,
        note: 'the ladder starts inside the gap years, so the upper bracket carries all the coverage',
        value: upperDuration.toFixed(2) + '  \u00b7  ' + (upperWeight ?? 1).toFixed(4) }
    );
    buckets.push({ dur: upperDuration, weight: upperWeight ?? 1, label: upperLabel });
    rows.push({ sep: true }, ...durationMatchRows([upperWeight ?? 1], [upperDuration], avg, 'bracket'));
  } else {
    const dv2 = (d, w) => d.toFixed(2) + '  \u00b7  ' + w.toFixed(4);
    rows.push({ heading: 'Bracket Years (modified duration \u00b7 weight)' });
    rows.push(
      { label: wtLink('active', 'active lower: ' + lowerLabel),
        value: dv2(lowerDuration, lowerWeight) },
      { label: wtLink('upper', 'upper: ' + upperLabel),
        value: dv2(upperDuration, upperWeight) }
    );
    buckets.push({ dur: lowerDuration, weight: lowerWeight, label: lowerLabel });
    buckets.push({ dur: upperDuration, weight: upperWeight, label: upperLabel });

    rows.push({ sep: true }, ...durationMatchRows([lowerWeight, upperWeight], [lowerDuration, upperDuration], avg, 'bracket'));
  }

  rows.push(
    { sep: true },
    { heading: 'Modified Duration Balance' },
    { html: renderDurationBeam(buckets, avg) }
  );

  if (gapParams.breakdown?.length) {
    const totalExcess = summary.totalExcessCost;
    if (totalExcess) {
      rows.push({ sep: true });
      rows.push({ label: 'Total excess cost', note: 'Cost of excess TIPS now held in brackets', value: '$' + Math.round(totalExcess).toLocaleString() });
      rows.push({ label: 'Coverage status',   note: 'Gap is fully funded by the new bracket excess', value: 'Fully Funded', total: true });
    }
  }

  rows.push({ sep: true }, { html:
    '<a href="../knowledge/viewer.html#/md/TipsLadderManager/knowledge/2.0_TIPS_Ladders.md#two-pass-walkthrough" target="_blank" style="font-size:11px;color:#2563eb;text-decoration:none;font-weight:600;">Plain-language walkthrough of this calculation →</a>'
  });

  return rows;
}

export function buildFuture30yDurationPopupRows(summary) {
  const { future30yYears, future30yParams, future30yLowerYear, future30yUpperYear,
          future30yLowerDuration, future30yUpperDuration, future30yUpperWeight, future30yLowerWeight,
          future30yFellBack, future30yCoverReason, future30yLowerMonth, future30yUpperMonth } = summary;
  if (!future30yYears?.length || !future30yParams) {
    return [{ label: 'No Future 30Y years', note: 'Future 30Y cover matching not applicable', total: true }];
  }
  const lowerLabel = (future30yLowerMonth ? future30yLowerMonth + ' ' : '') + future30yLowerYear;
  const upperLabel = (future30yUpperMonth ? future30yUpperMonth + ' ' : '') + future30yUpperYear;
  const avg = future30yParams.avgDuration;
  const f2 = v => v.toFixed(2), f4 = v => v.toFixed(4);

  const rows = [
    { label: 'Cost-weighted average duration of the Future 30Y years', value: f2(avg) },
    { sep: true },
  ];

  if (future30yParams.breakdown?.length) {
    rows.push(...synthYearListRows('future30y', future30yParams, 'Synthetic Future 30Y TIPS'), { sep: true });
  }

  // bracketWeights holds the lower weight within 0 to 1 (KNOWN_ISSUES: negative weight on a short
  // single-year Future 30Y run), so the division shown can land outside that range. Say so rather
  // than print an equals sign the arithmetic does not support.
  const _den = future30yUpperDuration - future30yLowerDuration;
  const rawLower = Math.abs(_den) > 1e-9 ? (future30yUpperDuration - avg) / _den : null;
  const rawLowerText = rawLower == null ? f4(future30yLowerWeight)
    : Math.abs(rawLower - future30yLowerWeight) > 1e-9
      ? f4(rawLower) + ', held at ' + f4(future30yLowerWeight)
      : f4(future30yLowerWeight);

  rows.push({ heading: 'Cover Years (modified duration · weight)' });
  rows.push(
    { label: 'lower cover: ' + lowerLabel,
      note: 'lower cover weight = (upper cover duration − average duration) ÷ (upper cover duration'
          + ' − lower cover duration), held within 0 to 1  =  (' + f2(future30yUpperDuration) + ' − '
          + f2(avg) + ') ÷ (' + f2(future30yUpperDuration) + ' − ' + f2(future30yLowerDuration) + ') = '
          + rawLowerText,
      value: f2(future30yLowerDuration) + '  ·  ' + f4(future30yLowerWeight) },
    { label: 'upper cover: ' + upperLabel,
      note: 'upper cover weight = 1 − lower cover weight = 1 − ' + f4(future30yLowerWeight)
          + ' = ' + f4(future30yUpperWeight),
      value: f2(future30yUpperDuration) + '  ·  ' + f4(future30yUpperWeight) },
  );
  // Lower and upper here rank the two covers by duration, not by maturity: the deep-discount,
  // near-zero-coupon cover carries an unusually long duration for its maturity, so the upper
  // cover can mature first (KNOWN_ISSUES: negative weight on a short single-year run).
  rows.push({ prose: 'Lower and upper rank the two covers by duration, not by maturity — a '
    + 'deep-discount cover carries an unusually long duration for its maturity, so the upper cover '
    + 'can be the one maturing first.' });

  rows.push({ sep: true }, ...durationMatchRows(
    [future30yLowerWeight, future30yUpperWeight],
    [future30yLowerDuration, future30yUpperDuration],
    avg, 'cover'));

  if (future30yFellBack) {
    const note = {
      aboveUpper: 'The average duration of the Future 30Y years is longer than either cover, so the '
        + 'whole weight sits on the upper cover and the mean above falls short of it.',
      belowLower: 'The average duration of the Future 30Y years is shorter than either cover, so the '
        + 'whole weight sits on the lower cover and the mean above overshoots it.',
    }[future30yCoverReason];
    if (note) rows.push({ prose: note });
  }

  rows.push(
    { sep: true },
    { heading: 'Modified Duration Balance' },
    { html: renderDurationBeam([
        { dur: future30yLowerDuration, weight: future30yLowerWeight, label: lowerLabel },
        { dur: future30yUpperDuration, weight: future30yUpperWeight, label: upperLabel }
      ], avg) },
  );

  return rows;
}

function fmtDate(d) {
  return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

// Shared body for the Macaulay-duration walk (5.0 §Duration Disclosure Standards): coupon-date
// schedule, day-count fractions (E/DSC/w), per-period cash flows/PVs, Macaulay sum, then
// Modified duration. `durDetail`/`dur` come straight from gap-math.js's breakdown entry
// (calculateDurationDetail, shared/src/bond-math.js) — never recomputed here.
function macaulayWalkRows(durDetail, dur) {
  const rows = [
    { heading: 'Macaulay Duration' },
    { label: 'Next coupon date', value: fmtDate(durDetail.nextCpn) },
    { label: 'Last coupon date', value: fmtDate(durDetail.lastCpn) },
    { label: 'E (days in period)', value: fd(durDetail.E, 0) },
    { label: 'DSC (days to next coupon)', value: fd(durDetail.DSC, 0) },
    { label: 'w = DSC ÷ E', value: fd(durDetail.w, 4) },
    { sep: true },
  ];
  durDetail.periods.forEach((p, i) => {
    rows.push({ label: 'Period ' + (i + 1) + ' — ' + fmtDate(p.date), note: 't = ' + fd(p.t, 3), value: 'CF ' + fm2(p.cf) + ' → PV ' + fm2(p.pv) });
  });
  rows.push(
    { label: 'Macaulay duration', note: 'Σ(t × PV) ÷ Σ(PV) ÷ 2', value: fd(durDetail.macaulay, 4) + ' yr', total: true },
    { sep: true },
    { heading: 'Modified Duration' },
    { label: 'Modified duration', note: 'Macaulay ÷ (1 + yield ÷ 2)', value: fd(dur, 4), total: true }
  );
  return rows;
}

// The year rows of the list in the Gap Dur and Future 30Y Dur popups (5.0 §Duration Disclosure
// Standards). Each year shows its Modified Duration in the row of the year, then its Quantity, Cost per
// TIPS and Cost, every formula with its variable names first and then the numbers. LMI, P+I per TIPS and
// the pre-ladder credit are links to their calculations; the Modified Duration and the row of the year
// link to the derivation of the duration (the Price is plain text, explained by the note under its equation). The total cost and the average duration row
// follow, and their numbers pair on hover with the Cost and Modified Duration of each year. Every number
// is read from the year's entry in the breakdown of gapParams or future30yParams (gap-math.js), the
// entry the Amount popup of the same year reads; nothing is calculated here.
function synthYearListRows(kind, params, heading) {
  const isGap = kind === 'gap';
  const bd = params.breakdown;
  const total = isGap ? params.totalCost : params.future30yTotalCost;
  const totalLabel = isGap ? 'Gap total cost' : 'Future 30Y total cost';
  const avg = params.avgDuration;
  const fv = (src, text) => '<span class="formula-var" data-source="' + src + '">' + text + '</span>';
  const calcRow = (id, label, names, numbers, note, value) => {
    const formula = (names ? '<div>' + names + '</div>' : '') + (numbers ? '<div style="margin-top:2px;">' + numbers + '</div>' : '')
      + (note ? '<div style="font-size:10px;margin-top:2px;">' + note + '</div>' : '');
    return '<tr>'
      + '<td data-row-id="' + id + '" style="padding:3px 16px 3px 0;white-space:nowrap;vertical-align:top;font-weight:600;">' + label + '</td>'
      + '<td style="padding:3px 14px;font-size:11px;color:#334155;vertical-align:top;white-space:normal;">' + formula + '</td>'
      + '<td style="padding:3px 0 3px 14px;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;vertical-align:top;font-weight:700;">' + value + '</td>'
      + '</tr>';
  };
  const yearRows = b => {
    const y = b.year;
    const pli = isGap ? (b.pliCredit ?? 0) : 0;
    const drillKey = (isGap ? 'gapdur-' : 'f30dur-') + y;
    const yr = y + (isGap ? ' (Jan 15)' : ' (Feb 15)');
    // The year row carries the Modified Duration. The row opens the derivation of the duration, and so does the number in it.
    const head = '<tr' + (b.durDetail ? ' class="drill-l3" data-l3="' + drillKey + '" style="cursor:pointer;"' : '') + '>'
      + '<td data-row-id="ydur-' + y + '" style="padding:8px 16px 2px 0;white-space:nowrap;vertical-align:top;font-weight:700;border-top:1px solid #e2e8f0;">' + yr + '</td>'
      + '<td style="padding:8px 14px 2px;font-size:11px;color:#334155;vertical-align:top;white-space:normal;border-top:1px solid #e2e8f0;">Modified Duration</td>'
      + '<td style="padding:8px 0 2px 14px;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;vertical-align:top;font-weight:700;border-top:1px solid #e2e8f0;">'
      + hlNum('dur-' + y, 'y', b.dur.toFixed(2), b.durDetail ? drillKey : undefined) + '</td>'
      + '</tr>';
    const qtyNames = '(DARA − LMI' + (pli > 0 ? ' − Pre-ladder credit' : '') + ') \xf7 P+I per TIPS';
    const qtyNumbers = '(' + fm(b.dara) + ' − ' + l3Link((isGap ? 'gaplmi-' : 'f30lmi-') + y, fm(b.laterMatInt))
      + (pli > 0 ? ' − ' + l3Link('plcpool:' + Math.round(pli), fm(pli)) : '')
      + ') \xf7 ' + l3Link((isGap ? 'gappi-' : 'f30pi-') + y, fm2(b.piPerBond))
      + (b.qtyExact == null ? ' = ' + b.qty
        : ' = ' + fd(b.qtyExact, 2) + (b.qtyExact < 0 ? ', minimum 0' : ', rounded to ' + b.qty));
    const price = fd(b.synPrice, 4);
    return head
      + calcRow('yqty-' + y, 'Quantity', qtyNames, qtyNumbers, '', String(b.qty))
      + calcRow('ycpt-' + y, 'Cost per TIPS', '(Price \xf7 100) \xd7 Index Ratio \xd7 1,000',
          '(' + price + ' \xf7 100) \xd7 ' + fd(b.indexRatio, 9) + ' \xd7 1,000 = ' + fm2(b.costPerBond),
          'Price computed from the Yield (' + fd(b.synYld * 100, 3) + '%) and the Coupon Rate (' + fd(b.synCpn * 100, 3) + '%) of the Synthetic TIPS, whose Index Ratio is taken as ' + fd(b.indexRatio, 9),
          fm2(b.costPerBond))
      + calcRow('ycost-' + y, 'Cost', fv('yqty-' + y, 'Quantity') + ' \xd7 ' + fv('ycpt-' + y, 'Cost per TIPS'),
          b.qty + ' \xd7 ' + fm2(b.costPerBond) + ' = ' + fm(b.cost), '', hlNum('cost-' + y, 'y', fm(b.cost)));
  };
  const costTerms = bd.map(b => hlNum('cost-' + b.year, 'w', fm(b.cost))).join(' + ');
  const table = '<table style="border-collapse:collapse;width:100%">'
    + bd.map(yearRows).join('')
    + '<tr><td colspan="3" style="padding:8px 0 0;border-top:1px solid #e2e8f0;"></td></tr>'
    + calcRow('ytotal', totalLabel, 'Σ Cost', costTerms + ' = ' + fm(total), '', hlNum('total', 'y', fm(total)))
    + '</table>';
  // The average duration row. With a total cost of $0 it falls back to the simple mean of the durations (gap-math.js, 2.0 §Average Gap Year Duration is Cost-Weighted).
  const weighted = total > 0
    ? { names: 'Σ(Cost \xd7 Modified Duration) \xf7 ' + totalLabel,
        numbers: '(' + bd.map(b => hlNum('cost-' + b.year, 'w', fm(b.cost)) + ' \xd7 ' + hlNum('dur-' + b.year, 'w', b.dur.toFixed(2))).join(' + ') + ') \xf7 ' + hlNum('total', 'w', fm(total)) + ' = ' + avg.toFixed(2) }
    : { names: 'Σ Modified Duration \xf7 number of years (' + totalLabel + ' is $0, so the simple mean is used)',
        numbers: '(' + bd.map(b => hlNum('dur-' + b.year, 'w', b.dur.toFixed(2))).join(' + ') + ') \xf7 ' + bd.length + ' = ' + avg.toFixed(2) };
  return [
    { heading },
    { html: table },
    { label: isGap ? 'Average duration of the gap years' : 'Average duration of the Future 30Y years', note: weighted.names + '<br>' + weighted.numbers, value: avg.toFixed(2), total: true },
  ];
}

// Level-3 drill for the P+I of one synthetic Gap-year TIPS (5.0 §Nested (Level-3) drills,
// key `gappi-<year>`). Gap-year synthetic TIPS always carry a Feb maturity, which falls in the
// Jan–Jun bucket and so receives exactly one coupon payment in the maturity year (TIPS_Basics.md
// §Last-Year Interest) — half the annual synthetic coupon rate shown in the Gap Year Duration drill.
// kind is 'gap' (key gappi-<year>, Synthetic TIPS maturing Jan 15) or 'future30y' (key f30pi-<year>,
// maturing Feb 15); both fall in the Jan–Jun bucket.
export function buildSyntheticPIDrill(summary, year, kind = 'gap') {
  const isGap = kind === 'gap';
  const g = (isGap ? summary?.gapParams : summary?.future30yParams)?.breakdown?.find(b => b.year === year);
  if (!g) return [{ label: 'No data', total: true }];
  const couponInterest = 1000 * g.synCpn / 2;
  const mo = isGap ? 'Jan' : 'Feb';
  return [
    { label: 'Principal', note: 'synthetic TIPS auctioned at par — par value used as the approximation for principal at auction', value: '$1,000.00' },
    { label: 'Synthetic coupon (annual rate)', note: isGap ? 'see Gap Year Duration ↗' : 'see Future 30Y Duration ↗', value: fd(g.synCpn * 100, 3) + '%' },
    { label: 'Interest: from ' + mo + ' coupon', note: '$1,000 × ' + fd(g.synCpn * 100, 3) + '% ÷ 2 — ' + mo + ' maturity falls in the Jan–Jun bucket, which gets one coupon payment in the maturity year', value: '$' + fd(couponInterest, 2) },
    { sep: true },
    { label: 'P+I per synthetic TIPS', value: '$' + fd(g.piPerBond, 2), total: true }
  ];
}

// Level-3 drill for the LMI of one synthetic Gap-year TIPS (5.0 §Nested (Level-3) drills,
// key `gaplmi-<year>`). Splits the year's LMI into synthetic coupon from longer gap years already
// sized in this sweep (each reconstructable from `gapParams.breakdown`, itself drillable via
// `gapdur-<year>`) and coupon from TIPS maturing after 2039 (funded years, bracket
// excess) — the latter only available as a lump sum since gap-math.js doesn't retain a per-source
// breakdown of `lmiAboveByYear`.
export function buildSyntheticLMIDrill(summary, year) {
  const gapParams = summary?.gapParams;
  const g = gapParams?.breakdown?.find(b => b.year === year);
  if (!g) return [{ label: 'No data', total: true }];
  const longerYears = gapParams.breakdown.filter(gy => gy.year > year).sort((a, b) => b.year - a.year);
  const fromSynthetic = longerYears.reduce((s, gy) => s + gy.annualInt, 0);
  const fromActual = Math.max(0, g.laterMatInt - fromSynthetic);
  const rows = [];
  if (longerYears.length) {
    rows.push({ heading: 'Synthetic interest from longer gap years' });
    longerYears.forEach(gy => {
      rows.push({ label: gy.year + ' synthetic coupon', note: gy.qty + ' × $1,000 × ' + fd(gy.synCpn * 100, 3) + '%', value: '$' + Math.round(gy.annualInt).toLocaleString() });
    });
    rows.push({ label: 'Subtotal', value: '$' + Math.round(fromSynthetic).toLocaleString(), total: true });
    rows.push({ sep: true });
  }
  rows.push({ label: `Coupon interest from TIPS maturing after ${UPPER_BRACKET_YEAR - 1}`, value: '$' + Math.round(fromActual).toLocaleString() });
  rows.push({ sep: true });
  rows.push({ label: 'Later Maturity Interest (LMI)', value: '$' + Math.round(g.laterMatInt).toLocaleString(), total: true });
  return rows;
}

// Level-3 drill for the LMI of one Future 30Y year (key f30lmi-<year>): the annual interest of the
// Synthetic TIPS of each later Future 30Y year, which are the only source of LMI past the longest issued
// TIPS (2.0 §Future 30Y Simulated Outstanding TIPS; gap-math.js future30yParamsCore).
export function buildFuture30yLMIDrill(summary, year) {
  const params = summary?.future30yParams;
  const g = params?.breakdown?.find(b => b.year === year);
  if (!g) return [{ label: 'No data', total: true }];
  const longerYears = params.breakdown.filter(fy => fy.year > year).sort((a, b) => b.year - a.year);
  const rows = [];
  if (longerYears.length) {
    rows.push({ heading: 'Annual interest of the later Future 30Y years' });
    longerYears.forEach(fy => {
      rows.push({ label: fy.year + ' Synthetic TIPS', note: fy.qty + ' × $1,000 × ' + fd(fy.synCpn * 100, 3) + '%', value: '$' + Math.round(fy.annualInt).toLocaleString() });
    });
    rows.push({ sep: true });
  }
  rows.push({ label: 'Later Maturity Interest (LMI)', value: '$' + Math.round(g.laterMatInt).toLocaleString(), total: true });
  return rows;
}

// Level-3 drill for one synthetic Gap-year TIPS's duration (5.0 §Nested (Level-3) drills,
// key `gapdur-<year>`). Shows the yield interpolation, the synthetic coupon derived from it,
// and the full Macaulay/Modified duration walk — everything `calcGapParams`'s breakdown entry
// already carries (gap-math.js gapParamsCore), nothing recomputed.
export function buildGapYearDurationDrill(summary, year) {
  const gapParams = summary?.gapParams;
  const b = gapParams?.breakdown?.find(g => g.year === year);
  const anchors = gapParams?.anchors;
  if (!b || !anchors || !b.durDetail) return [{ label: 'No data', total: true }];
  const synMat = new Date(year, 0, 15);
  return [
    { heading: 'Yield Interpolation' },
    { label: 'Most recently issued 10-year TIPS', note: fmtDate(anchors.before.maturity), value: fd(anchors.before.yield * 100, 3) + '%' },
    { label: `Feb ${UPPER_BRACKET_YEAR} TIPS`, note: fmtDate(anchors.after.maturity), value: fd(anchors.after.yield * 100, 3) + '%' },
    { label: 'Target date', value: fmtDate(synMat) },
    { sep: true },
    { label: 'Interpolated yield', note: 'linear, by maturity date, between the two anchors above', value: fd(b.synYld * 100, 3) + '%', total: true },
    { sep: true },
    { heading: 'Synthetic Coupon' },
    { label: 'Synthetic coupon', note: 'MAX(0.125%, FLOOR(yield × 100 ÷ 0.125) × 0.125%)', value: fd(b.synCpn * 100, 3) + '%', total: true },
    { sep: true },
    ...macaulayWalkRows(b.durDetail, b.dur),
  ];
}

// Level-3 drill for one synthetic Future 30Y TIPS's duration (5.0 §Nested (Level-3) drills,
// key `f30dur-<year>`). Unlike Gap years, Future 30Y years have no upper anchor to interpolate
// against — every year is priced flat off the same anchor bond (gap-math.js future30yParamsCore).
export function buildFuture30yYearDurationDrill(summary, year) {
  const future30yParams = summary?.future30yParams;
  const b = future30yParams?.breakdown?.find(g => g.year === year);
  const anchorBond = future30yParams?.anchorBond;
  if (!b || !anchorBond || !b.durDetail) return [{ label: 'No data', total: true }];
  const synMat = new Date(year, 1, 15);
  return [
    { heading: 'Anchor Yield' },
    { label: 'Most recently issued 30-year TIPS', note: fmtDate(anchorBond.maturity) + ' — used directly (flat-curve assumption, no second anchor)', value: fd(b.synYld * 100, 3) + '%', total: true },
    { label: 'Target date', value: fmtDate(synMat) },
    { sep: true },
    { heading: 'Synthetic Coupon' },
    { label: 'Synthetic coupon', note: 'MAX(0.125%, FLOOR(yield × 100 ÷ 0.125) × 0.125%)', value: fd(b.synCpn * 100, 3) + '%', total: true },
    { sep: true },
    ...macaulayWalkRows(b.durDetail, b.dur),
  ];
}
