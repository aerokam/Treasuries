// Yield Curves — Frontend Logic
// The app reads the stores of knowledge/1.3_Calculate_Yield_Curve_Data_Sets.md and calculates
// nothing (YieldCurves/knowledge/3.1_Read_Yield_Curve_Data_Sets.md): every value a view draws
// is a value stored in Yield curves (S13), Breakeven inflation (S14) or Bid and ask spreads (S15).
import { termYears } from '../../shared/src/bond-math.js';
import {
  SAO_NOISE_YRS, SAO_BLEND_START_YRS, SAO_BLEND_END_YRS,
  nssBasis, zToSA,
} from '../../shared/src/spot-curve.js';
import { localDate } from '../../shared/src/settlement.js';
import { parseYieldCurvesCsv, parseBreakevenCsv, parseSpreadsCsv } from '../../shared/src/yield-curve-stores.js';
import { handleChartKeydown, setupAxisWheelZoom, snapYBounds, snapYAfterZoom } from '../../shared/src/chart-keys.js';
import { initDatePicker } from '../../shared/src/date-picker.js';
import { calendarTimeAxis } from '../../shared/src/chart-time-axis.js';

console.log("YieldCurves app.js loading...");

const R2_BASE_URL = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const YIELD_CURVES_URL = `${R2_BASE_URL}/Treasuries/YieldCurves.csv`;                // Yield curves (S13)
const BREAKEVEN_URL = `${R2_BASE_URL}/Treasuries/BreakevenInflation.csv`;           // Breakeven inflation (S14)
const SPREADS_URL = `${R2_BASE_URL}/Treasuries/BidAskSpreads.csv`;                  // Bid and ask spreads (S15)
const GSW_TIPS_CURVE_URL = `${R2_BASE_URL}/TIPS/GswTipsCurve.json`;   // { date, beta0..beta3, tau1, tau2 } — updateGswTipsCurve.js

// The GSW reference line is an analysis aid, not an end-user feature — the published curve
// is only weekly (Tuesdays, through the prior Friday) so it goes stale fast. Hidden unless
// the page is opened with ?gsw; the curve data is always fetched so it's there when needed.
const SHOW_GSW = new URLSearchParams(location.search).has('gsw');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Chart gridline color — horizontal (Y) and vertical (X) alike, on every chart
// (Yield Curves, Breakeven, Bid-Ask Spread). See YieldCurves/knowledge/3.2_Render_Charts_And_Tables.md#build-scales (3.2.2).
const GRID_COLOR = 'rgba(0,0,0,0.08)';

// GSW (Gürkaynak-Sack-Wright, FEDS 2008-05) fitted TIPS zero-coupon curve — a snapshot for
// visual comparison against our own spot fit. GSW publishes weekly (Tuesdays, covering
// through the prior Friday); this is the latest row as of this commit. [maturity years,
// zero yield %], converted from GSW's continuously-compounded TIPSY to a semi-annual
// bond-equivalent basis so it sits on the same axis as our Spot line and the Ask/SA yields.
// TODO: replace with a weekly R2 pull from feds200805_1.html + show the GSW data date.
const GSW_TIPS_ZERO_SNAPSHOT = {
  date: '2026-08-28',
  points: [[2,2.1922],[3,2.1071],[4,2.0853],[5,2.1065],[6,2.1559],[7,2.2229],[8,2.2994],[9,2.3799],[10,2.4607],[11,2.5388],[12,2.6125],[13,2.6808],[14,2.7430],[15,2.7990],[16,2.8486],[17,2.8920],[18,2.9295],[19,2.9615],[20,2.9884]],
};

// Compute IQR-based clip bounds from a yield array.
// minFence: minimum fence size (default 0.5 for yield % data; pass 0 for spread data
// where values are small and the hard floor would swallow real outliers).
function iqrClipBounds(source, minFence = 0.5) {
  const sorted = [...source].sort((a, b) => a - b);
  if (sorted.length < 4) return null;
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const fence = Math.max(1.0 * iqr, minFence);
  return { lo: q1 - fence, hi: q3 + fence };
}

// --- State ---
// Security rows of Yield curves (S13), mapped by toTipsBond / toNominalBond onto the fields the
// render functions draw. A source with no rows is null.
let fedTipsData = null;
let marketTipsData = null;
let fedNominalsData = null;
let marketNominalsData = null;
let spotRows = [];                // spot rows of S13: { type, termYears, source, spot, spotSa }
let storeDates = null;            // { fedInvest: { trade, settle }, market: { trade, settle } } of S13
let beiStore = null;              // Breakeven inflation (S14): { dates, rows }
let spreadsStore = null;          // Bid and ask spreads (S15): { dates, rows }
let gswTipsCurve = null;          // { date, beta0..beta3, tau1, tau2 } — GSW fitted TIPS curve, R2 (weekly)
let nominalsShowStrips = false;
// Starts false/hidden -- the checkbox and this flag only turn on together, at load, when a
// Market row of Type Unclassified occurs in S13 (see init()). It exists so that can't go
// unnoticed; a permanent checkbox nobody ever needs would be worse, not better, at that job.
let nominalsShowUnclassified = false;
let nominalsClipOutliers = true;
let beiClipOutliers = true;
let chart = null;
let chartTab = null;
let spreadChart1 = null, spreadChart2 = null;
let spreadModeActive = false;
const savedZoom = { tips: null, treasuries: null, bei: null };
const savedDateRange = { tips: null, treasuries: null, bei: null };

// The Type of a nominal security row of S13 ('Bill'/'Note'/'Bond'/'STRIPS'/'Unclassified'),
// mapped to the type strings the type filters and series of this app match on.
const CUSIP_TYPE_TO_MARKET_BASED = { Bill: 'MARKET BASED BILL', Note: 'MARKET BASED NOTE', Bond: 'MARKET BASED BOND', STRIPS: 'MARKET BASED STRIPS', Unclassified: 'MARKET BASED UNCLASSIFIED' };

let activeTab = 'tips';
let nominalsTypeFilters = new Set(['MARKET BASED BILL', 'MARKET BASED NOTE', 'MARKET BASED BOND']);
let nominalsSort = { col: 'maturity', dir: 'asc' };
let tipsSort = { col: 'maturity', dir: 'asc' };
let xAxisMode = 'maturity';
window._currentBonds = [];
// Last-rendered TIPS yield-mode bond sets, so the series checkboxes (which restyle the
// existing chart in place rather than rebuilding it) can re-render the table without a
// full processAndRenderTips() pass — see the showTipsAsk/Sa/Sao/Spot/SpotSa handlers below.
let tipsTableFed = null, tipsTableBroker = null;

// ── Date range input helpers ──────────────────────────────────────────────────
// Convert YYYY-MM-DD → MM/DD/YYYY for display in text inputs
function isoToMDY(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

// Convert YYYY-MM-DD → MM/DD/YY (2-digit year) for compact table display
function isoToMDY2(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y.slice(2)}`;
}

// Format a Date object → MM/DD/YYYY
function fmtDateMDY(date) {
  return String(date.getMonth() + 1).padStart(2, '0') + '/' +
         String(date.getDate()).padStart(2, '0') + '/' +
         date.getFullYear();
}

// Term axis constants for Bills chart (0–52w, linear, proportional)
const TERM_TICK_VALUES = [0,2,4,6,8,10,12,13,14,16,17,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52];
const TERM_LABEL_4W   = new Set([0,4,8,12,16,20,24,28,32,36,40,44,48,52]);
const TERM_LABEL_MINOR = new Set([6,13,17,26]);

// Format a ms timestamp as a term label (used by TIPS/spread chart tooltips).
function ttmLabel(ms) {
  const days = (ms - Date.now()) / 86400000;
  if (days < 365.25) return `${(days / 7).toFixed(1)}w`;
  return `${Math.round(days / 365.25)}y`;
}

// The Download Date "YYYY-MM-DD HH:MM" is on the Eastern clock; show it without the year, as
// M/D h:mm AM/PM.
function fmtBrokerTime(s) {
  if (!s) return s;
  const [datePart, timePart] = s.split(' ');
  const [, mo, dy] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  return `${mo}/${dy} ${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'PM' : 'AM'}`;
}
// Parse a native date input's ISO value (YYYY-MM-DD) → Date (or null if empty/invalid)
function parseIsoInput(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return isNaN(dt) ? null : dt;
}

function fmtMMM(dateStr) {
  if (!dateStr) return "";
  return isoToMDY(dateStr);
}

// ─── Lightweight Popup Logic ──────────────────────────────────────────────────
function _showDrillPopup(title, html) {
  let ov = document.getElementById('drill-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'drill-overlay';
    ov.style = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;';
    ov.innerHTML = `
      <div id="drill-modal" style="background:#fff;width:100%;max-width:600px;max-height:90vh;border-radius:8px;display:flex;flex-direction:column;box-shadow:0 10px 25px rgba(0,0,0,0.2);position:relative;overflow:hidden;">
        <button id="drill-close" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:24px;color:#94a3b8;cursor:pointer;line-height:1;">\u00d7</button>
        <div id="drill-title" style="padding:16px 20px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#1e293b;font-size:14px;flex-shrink:0;"></div>
        <div id="drill-content" style="padding:20px;overflow-y:auto;font-size:13px;line-height:1.6;color:#334155;flex:1;"></div>
      </div>
    `;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.style.display = 'none'; });
    ov.querySelector('#drill-close').onclick = () => ov.style.display = 'none';
  }
  ov.querySelector('#drill-title').textContent = title;
  ov.querySelector('#drill-content').innerHTML = html;
  ov.style.display = 'flex';
}

const COL_HELP = {
  'maturity': {
    title: 'Maturity',
    html: `<p>The maturity date of the TIPS — the date on which the Treasury repays principal.</p>
<p>Most TIPS mature in <strong>January/February</strong> or <strong>July/October</strong>, which places them on opposite sides of the seasonal inflation cycle.</p>`
  },
  'term': {
    title: 'Term',
    html: `<p>Years to maturity, measured from today.</p>
<p>A security row's Term is that TIPS's own time to maturity. A Spot / Spot SA row's Term is the horizon the fitted curve is evaluated at — it has no Maturity of its own, since it isn't any one security.</p>`
  },
  'ask-yield': {
    title: 'Ask Yield',
    html: `<p>Yield to maturity (YTM) calculated directly from the market price using standard Treasury bond math (semi-annual compounding).</p>
<p>For broker quotes (solid lines), this is the yield from the <strong>Ask Price</strong>. For FedInvest data (dotted lines), the price is the <strong>midpoint of bid and ask</strong>, so the yield will be higher than a true market ask yield. This is especially evident for short-dated Bills.</p>
<p>This is the <strong>quoted real yield</strong> — it includes any distortion from seasonal inflation patterns baked into the TIPS price.</p>`
  },
  'sa-yield': {
    title: 'SA Yield — Seasonal Adjustment',
    html: `<p>The market price is first multiplied by the ratio <code>S(settle) / S(maturity)</code> — the BLS seasonal factors at the settlement date and maturity date — before computing YTM.</p>
<p>This strips out the predictable seasonal inflation carry so TIPS can be compared across different maturity months on equal footing.</p>
<ul style="margin:0;padding-left:20px;font-size:13px;color:#475569;">
  <li style="margin-bottom:6px;"><strong>Ratio &lt; 1.0</strong> (settling in a low-factor month, maturing in a high-factor month): price is reduced → yield rises. The TIPS had a seasonal premium; adjustment removes it.</li>
  <li style="margin-bottom:6px;"><strong>Ratio &gt; 1.0</strong> (settling in a high-factor month, maturing in a low-factor month): price is increased → yield falls. The TIPS had a seasonal discount; adjustment compensates for it.</li>
</ul>
<p style="margin-top:12px;font-size:11px;color:#94a3b8;">Authority: 31 CFR § 356 Appendix B; Canty (2009)</p>`
  },
  'sao-yield': {
    title: 'SAO Yield — Smooth Curve Fit',
    html: `<p>The <strong>O</strong> is <em>other</em>. Seasonality is a named cause of deviation from fair value and the SA transform removes it by name; everything else that moves a TIPS away from a smooth curve is removed here as a class, because those factors cannot be enumerated individually.</p>
<p>SAO fits a <strong>Nelson-Siegel-Svensson</strong> curve (the Fed/GSW real-yield-curve standard) through all SA yields, then snaps each TIPS to that curve — treating any deviation as noise not explained by a value-relevant factor (coupon, index ratio — both empirically immaterial).</p>
<p>The deseasonalization residual this corrects is a <strong>front-end phenomenon</strong> that amortizes with maturity, so the snap-to-curve weight declines with maturity rather than applying uniformly:</p>
<ul style="margin:12px 0 0;padding-left:18px;">
  <li style="margin-bottom:6px;"><strong>Under 0.5 years:</strong> price-noise-dominated, excluded from the fit, still read off the curve</li>
  <li style="margin-bottom:6px;"><strong>0.5 – 5 years:</strong> full snap to curve</li>
  <li style="margin-bottom:6px;"><strong>5 – 6 years:</strong> weight declines linearly from 100% curve to 0%</li>
  <li style="margin-bottom:6px;"><strong>Beyond 6 years:</strong> equals raw SA yield (no smoothing) — the curve is already smooth here on its own</li>
</ul>
<p>The result is a <strong>smoothed yield curve</strong> where it matters (the front end, where seasonal residual is largest) without flattening genuine long-end structure.</p>`
  },
  'spot': {
    title: 'Spot — Zero-Coupon Yield Curve',
    html: `<p>Ask, SA and SAO are one point per bond. <strong>Spot</strong> is a single smooth curve fitted through the TIPS — one line per price source (FedInvest dotted, Market solid).</p>
<p>It is a <strong>zero-coupon</strong> curve: the rate for a single payment at each horizon. The fit chooses the curve so that discounting every TIPS's own cash flows along it reproduces that bond's price. Because a bond's yield-to-maturity blends together many different-dated payments, two TIPS of the same maturity but different coupons have slightly different yields to maturity — the spot curve removes that coupon effect.</p>
<p>Same curve family (Nelson-Siegel-Svensson) the Federal Reserve uses for its published TIPS curve. <strong>Spot</strong> is fitted to the <strong>quoted ask</strong> yields, so it tracks the Ask points.</p>`
  },
  'ask-yield-tsy': {
    title: 'Ask Yield',
    html: `<p>Yield to maturity (YTM) calculated directly from the market price using standard Treasury bond math (semi-annual compounding).</p>
<p>For broker quotes (solid lines), this is the yield from the <strong>Ask Price</strong>. For FedInvest data (dotted lines), the price is the <strong>midpoint of bid and ask</strong>, so the yield will be higher than a true market ask yield. This is especially evident for short-dated Bills.</p>`
  },
  'spot-tsy': {
    title: 'Spot — Zero-Coupon Yield Curve',
    html: `<p>Bills, Notes and Bonds are one point per security. <strong>Spot</strong> is a single smooth curve fitted through the coupon Treasuries (Notes and Bonds), one line per price source (FedInvest dotted, Market solid).</p>
<p>It is a <strong>zero-coupon</strong> curve: the rate for a single payment at each horizon. The fit chooses the curve so that discounting each security's own cash flows along it reproduces its price. Because a yield to maturity blends together many different-dated payments, two Treasuries of the same maturity but different coupons have slightly different yields to maturity — the spot curve removes that coupon effect.</p>
<p>Same curve family (Nelson-Siegel-Svensson) the Federal Reserve uses for its published curves.</p>`
  },
  'spot-sa': {
    title: 'Spot SA — Seasonally Adjusted Zero-Coupon Curve',
    html: `<p>The same zero-coupon fit as <strong>Spot</strong>, but fitted to the <strong>seasonally adjusted</strong> yields (the SA transform applied to the ask price) instead of the quoted ask yields.</p>
<p>The gap between <strong>Spot</strong> and <strong>Spot SA</strong> is the seasonal adjustment's effect on the whole curve, in one line. This is the real-yield curve used for spot breakeven inflation on the BEI tab.</p>`
  },
  'spot-bei': {
    title: 'Spot BEI — Curve-Based Breakeven Inflation',
    html: `<p>Ask / SA / SAO BEI are per-TIPS: each subtracts a single closest-maturity nominal yield from that one bond's real yield.</p>
<p><strong>Spot BEI</strong> is instead the <strong>nominal zero-coupon curve minus the seasonally adjusted real zero-coupon curve</strong>, read off at each horizon. Both curves are fitted to the market-quote securities. Every point is a genuine same-horizon breakeven — a 10-year point compares a 10-year nominal rate with a 10-year real rate — rather than a comparison of two bonds that only roughly line up in maturity.</p>`
  },
  'gsw': {
    title: 'GSW — Federal Reserve TIPS Curve',
    html: `<p>The Federal Reserve's own fitted TIPS yield curve (Gürkaynak-Sack-Wright, FEDS 2008-05), shown here as a benchmark for the Spot fit.</p>
<p>The Fed publishes it <strong>weekly, on Tuesdays, covering data through the prior Friday</strong>, so it can be several days stale. For that reason it is hidden by default and only appears when the page is opened with <code>?gsw</code>; the curve data is fetched every load so it is available for analysis at any time.</p>`
  }
};

function _showColHelp(colKey) {
  const entry = COL_HELP[colKey];
  if (!entry) return;
  _showDrillPopup(entry.title, entry.html);
}

// spec: YieldCurves/knowledge/3.2_Render_Charts_And_Tables.md#answer-a-drill (3.2.7)
// Every value shown is a value stored on the security row of Yield curves (S13); the popups
// calculate nothing.
const fmtPct3 = v => Number.isFinite(v) ? `${(v * 100).toFixed(3)}%` : '—';
const fmtNum = (v, d) => Number.isFinite(v) ? v.toFixed(d) : '—';
const drillRow = (label, value, style = 'margin-bottom:4px;') =>
  `<div style="display:flex;justify-content:space-between;${style}"><span>${label}</span> <strong>${value}</strong></div>`;

function _showSaDrill(cusip) {
  const bond = window._currentBonds.find(b => b.cusip === cusip);
  if (!bond) return;

  const scaled = Number.isFinite(bond.maturitySaFactor) && Number.isFinite(bond.naiveMaturitySaFactor)
    && bond.maturitySaFactor !== bond.naiveMaturitySaFactor;

  const html = `
    <div style="background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:16px;">
      ${drillRow('Price', fmtNum(bond.price, 3))}
      ${drillRow('Settlement Date SA Factor', fmtNum(bond.settleSaFactor, 5))}
      ${drillRow('Naive Maturity SA Factor', fmtNum(bond.naiveMaturitySaFactor, 5))}
      ${drillRow('Maturity SA Factor', fmtNum(bond.maturitySaFactor, 5))}
      <div style="border-top:1px dashed #cbd5e1;margin:8px 0;padding-top:8px;display:flex;justify-content:space-between;">
        <span>SA Price Factor</span> <strong>${fmtNum(bond.saPriceFactor, 5)}</strong>
      </div>
      ${drillRow('SA Price', fmtNum(bond.saPrice, 3))}
      <div style="display:flex;justify-content:space-between;color:#1a56db;font-weight:700;">
        <span>SA Yield</span> <span>${fmtPct3(bond.saYield)}</span>
      </div>
    </div>
    <div style="font-size:12px;color:#64748b;">
      <p>The <strong>SA Yield</strong> is calculated by finding the internal rate of return (IRR) of the TIPS using the <strong>SA Price</strong> instead of the Price.</p>
      <p>An SA Price Factor &lt; 1.0 reduces the price (increasing yield), while an SA Price Factor &gt; 1.0 increases the price (decreasing yield).</p>
      ${scaled ? `<p>The Maturity SA Factor is the Naive Maturity SA Factor, reused from a past year, since no SA Factor is published for a date this far ahead. BLS re-estimates seasonal factors every year from a moving window of recent data, so the reused value is scaled toward 1.0 by its Credibility Factor as the horizon grows (see <em>Seasonal Factor Drift</em>).</p>` : ''}
    </div>
  `;
  _showDrillPopup(`SA Drill-down: ${bond.cusip} (${fmtMMM(bond.maturity)})`, html);
}

// The paragraph is chosen by the Term (y) of the row against the SAO_* constants of
// shared/src/spot-curve.js (knowledge/1.3.3_Adjust_For_Other_Effects.md#the-calculation). No value of
// the SAO Blend Weight is shown.
function _showSaoDrill(cusip) {
  const bond = window._currentBonds.find(b => b.cusip === cusip);
  if (!bond) return;

  const t = bond.termYears;
  const termTxt = Number.isFinite(t) ? `${t.toFixed(2)}y` : '—';
  const saRow = drillRow('SA Yield', fmtPct3(bond.saYield));
  const saoRow = label => `<div style="border-top:1px dashed #cbd5e1;margin:8px 0 0;padding-top:8px;display:flex;justify-content:space-between;color:#1a56db;font-weight:700;"><span>${label}</span><span>${fmtPct3(bond.saoYield)}</span></div>`;

  let logicHtml = '';

  if (t < SAO_NOISE_YRS) {
    logicHtml = `
      <div style="background:#fef3f2;padding:12px;border-radius:6px;border:1px solid #fecdca;margin-bottom:16px;">
        <p style="margin:0;color:#b42318;font-weight:600;">Near-Maturity (excluded from fit)</p>
        <p style="margin:8px 0;font-size:12px;">Term ${termTxt} &lt; ${SAO_NOISE_YRS}y: the SA yield is dominated by price noise on a tiny remaining duration, so this point does not drive the curve fit. Its SAO Yield is read off the smooth curve, which is held flat below the shortest fitted maturity rather than extrapolated (see <em>Adjust for other effects</em>, &ldquo;The very short end&rdquo;).</p>
        ${saRow}
        ${saoRow('SAO Yield (on curve)')}
      </div>
    `;
  } else if (t >= SAO_BLEND_END_YRS) {
    logicHtml = `
      <div style="background:#f0fdf4;padding:12px;border-radius:6px;border:1px solid #bbf7d0;margin-bottom:16px;">
        <p style="margin:0;color:#166534;font-weight:600;">Beyond the blend range — no smoothing applied</p>
        <p style="margin:8px 0;font-size:12px;">Term ${termTxt} &ge; ${SAO_BLEND_END_YRS}y: the deseasonalization residual that motivates smoothing amortizes away by the long end (see <em>The SAO Residual</em> §6), so the SAO Yield is the SA Yield unchanged.</p>
        ${saRow}
        ${saoRow('SAO Yield (= SA Yield, unsmoothed)')}
      </div>
    `;
  } else {
    const blend = t > SAO_BLEND_START_YRS;
    logicHtml = `
      <div style="background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:16px;">
        <div style="font-size:12px;color:#64748b;margin-bottom:12px;">
          The <strong>SAO</strong> is a <strong>smooth fair-value curve</strong> (Nelson-Siegel-Svensson) fitted through the SA real yields.
          Each TIPS is snapped to the curve: for a buy-and-hold holder, any deviation not explained by a value-relevant
          factor (coupon, index ratio — both immaterial here) is treated as not particularly relevant and smoothed away.
          Inspired by Canty's outlier-factor analysis, but — lacking identifiable outlier factors — operationally a curve fit (see <em>Adjust for other effects</em>).
          Since the residual this corrects amortizes with maturity, the snap weight declines between ${SAO_BLEND_START_YRS}y and ${SAO_BLEND_END_YRS}y (see <em>The SAO Residual</em> §6).
        </div>
        ${saRow}
        ${saoRow(`SAO Yield${blend ? ' (blended)' : ' (smooth curve)'}`)}
      </div>
    `;
  }

  _showDrillPopup(`SAO Drill-down: ${bond.cusip} (Smooth Curve Fit)`, logicHtml);
}


// ─── Main Logic ──────────────────────────────────────────────────────────────

Chart.defaults.font.size = 13;
Chart.defaults.color = '#334155';

// ── 3.1 Read yield curve data sets ─────────────────────────────────────────
// spec: YieldCurves/knowledge/3.1_Read_Yield_Curve_Data_Sets.md
// Each reads and returns; applying the result to app state and to the controls is init()'s
// job, not theirs.

// spec: YieldCurves/knowledge/3.1_Read_Yield_Curve_Data_Sets.md (GSW curve parameters (S12))
// A missing or malformed file leaves the app without a published curve rather
// than without a page, so both cases return null.
async function parseGswParameters(res) {
  if (!res || !res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

// spec: YieldCurves/knowledge/3.1_Read_Yield_Curve_Data_Sets.md
// Fetches Yield curves (S13), Breakeven inflation (S14), Bid and ask spreads (S15) and the GSW
// curve parameters (S12), and reads each with its reader in shared/src/yield-curve-stores.js
// (S12 with parseGswParameters). S13 is required; S14 or S15 that cannot be read is null, and
// leaves its view empty.
async function loadYieldCurveDataSets() {
  const get = url => fetch(url, { cache: 'no-cache' }).catch(e => ({ ok: false, error: e }));
  const [ycRes, beiRes, spreadsRes, gswRes] = await Promise.all([
    get(YIELD_CURVES_URL), get(BREAKEVEN_URL), get(SPREADS_URL), get(GSW_TIPS_CURVE_URL),
  ]);
  if (!ycRes.ok) throw new Error(`Failed to fetch yield curves: ${ycRes.status || ycRes.error}`);
  const readOptional = async (res, parse, name) => {
    if (!res.ok) { console.warn(`${name} not available on R2`); return null; }
    try { return parse(await res.text()); } catch (e) { console.warn(`${name} could not be read:`, e); return null; }
  };
  const [yieldCurves, breakeven, spreads, gsw] = await Promise.all([
    ycRes.text().then(parseYieldCurvesCsv),
    readOptional(beiRes, parseBreakevenCsv, 'Breakeven inflation'),
    readOptional(spreadsRes, parseSpreadsCsv, 'Bid and ask spreads'),
    parseGswParameters(gswRes),
  ]);
  return { yieldCurves, breakeven, spreads, gsw };
}

// A security row of S13 of Type TIPS → the fields the TIPS views draw.
function toTipsBond(r) {
  return {
    cusip: r.cusip, source: r.source, maturity: r.maturity, maturityDate: localDate(r.maturity),
    termYears: r.termYears, coupon: r.coupon, price: r.price,
    askYield: r.ask, saYield: r.sa, saoYield: r.sao,
    settleSaFactor: r.settleSaFactor, naiveMaturitySaFactor: r.naiveMaturitySaFactor,
    maturitySaFactor: r.maturitySaFactor, saPriceFactor: r.saPriceFactor, saPrice: r.saPrice,
  };
}

// A security row of S13 of any other Type → the fields the Treasuries views draw.
function toNominalBond(r) {
  return {
    cusip: r.cusip, source: r.source, maturity: r.maturity, maturityDate: localDate(r.maturity),
    termYears: r.termYears, coupon: r.coupon, price: r.price, yield: r.ask,
    type: CUSIP_TYPE_TO_MARKET_BASED[r.type] || r.type,
  };
}

// The stored spot points of one curve: S13 spot rows of `type` and `source`, value `key`
// ('spot' or 'spotSa', decimal), as { t, y } with y in percent. A blank cell is no point.
function storedSpotPoints(type, source, key) {
  return spotRows
    .filter(r => r.type === type && r.source === source && Number.isFinite(r[key]))
    .map(r => ({ t: r.termYears, y: parseFloat((r[key] * 100).toFixed(3)) }))
    .sort((a, b) => a.t - b.t);
}

const sourceRows = (rows, source, pred) => {
  const out = rows.filter(r => r.source === source && pred(r)).sort((a, b) => a.maturityDate - b.maturityDate);
  return out.length ? out : null;
};

async function init() {
  const statusEl = document.getElementById('status');
  console.log("init() started");

  try {
    const { yieldCurves, breakeven, spreads, gsw } = await loadYieldCurveDataSets();
    gswTipsCurve = gsw;
    storeDates = yieldCurves.dates;
    beiStore = breakeven;
    spreadsStore = spreads;
    spotRows = yieldCurves.spot;
    const tips = yieldCurves.securities.filter(r => r.type === 'TIPS').map(toTipsBond);
    const nominals = yieldCurves.securities.filter(r => r.type !== 'TIPS').map(toNominalBond);
    fedTipsData = sourceRows(tips, 'FedInvest', () => true);
    marketTipsData = sourceRows(tips, 'Market', () => true);
    fedNominalsData = sourceRows(nominals, 'FedInvest', () => true);
    marketNominalsData = sourceRows(nominals, 'Market', () => true);
    console.log(`Read ${yieldCurves.securities.length} security rows and ${spotRows.length} spot rows.`);

    if (marketNominalsData) {
      const chkMq = document.getElementById('chkMarket');
      chkMq.disabled = false;
      chkMq.checked = true;
      // The Unclassified checkbox is shown, and checked, only when a Market row of Type
      // Unclassified occurs. Setting the flag and the checkbox together, only in this branch,
      // keeps them consistent: no world where the checkbox is hidden but still counts as "on"
      // for the Ask-column/range logic.
      if (marketNominalsData.some(b => b.type === 'MARKET BASED UNCLASSIFIED')) {
        nominalsShowUnclassified = true;
        document.getElementById('filterUnclassified').checked = true;
        document.getElementById('filterUnclassifiedRow').style.display = 'flex';
      }
      updateModeToggle();
    }
    if (marketTipsData) {
      const chkBroker = document.getElementById('chkTipsBroker');
      chkBroker.disabled = false;
      chkBroker.checked = true;
      updateModeToggle();
    }

    const onRangeChange = () => { savedZoom[activeTab] = null; processAndRender(); };
    [document.getElementById('startMaturity'), document.getElementById('endMaturity')].forEach(el => {
      initDatePicker(el);
      el.addEventListener('change', onRangeChange); // fires on pick and on clear
    });

    document.querySelectorAll('input[name="xAxisMode"]').forEach(r => {
      r.addEventListener('change', () => { xAxisMode = r.value; savedZoom[activeTab] = null; processAndRender(); });
    });

    document.getElementById('resetZoom').onclick = () => {
      if (spreadModeActive) {
        if (spreadChart1) { spreadChart1.resetZoom('none'); _rescaleSpread(spreadChart1); }
        if (spreadChart2) { spreadChart2.resetZoom('none'); _rescaleSpread(spreadChart2); }
      } else {
        savedZoom[activeTab] = null;
        document.getElementById('startMaturity').value = '';
        document.getElementById('endMaturity').value = '';
        processAndRender();
      }
    };

    processAndRender();

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const ov = document.getElementById('drill-overlay');
        if (ov) ov.style.display = 'none';
      }
      if (chart) handleChartKeydown(e, chart, { onAction: ({chart}) => updateDynamicTicks(chart) });
    });

  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
    statusEl.className = 'error';
    console.error('Initialization failed:', err);
  }
}

// years-to-maturity → current x-axis unit (calendar ms in Maturity mode, weeks in Term mode).
function yearsToX(now) {
  return xAxisMode === 'ttm' ? y => y * (365.25 / 7) : y => now + y * 365.25 * 86400000;
}

function processAndRender() {
  if (activeTab === 'treasuries') {
    processAndRenderNominals();
  } else if (activeTab === 'bei') {
    processAndRenderBei();
  } else {
    processAndRenderTips();
  }
}

function switchTab(tab) {
  // Save date range for the tab we're leaving
  savedDateRange[activeTab] = {
    start: document.getElementById('startMaturity').value,
    end: document.getElementById('endMaturity').value,
  };

  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Show/Hide Source UI groups (BEI reuses the TIPS strip — it's Market-only, see switchChartMode)
  document.getElementById('tipsSourceUI').style.display = (tab === 'tips' || tab === 'bei') ? 'flex' : 'none';
  document.getElementById('treasuriesSourceUI').style.display = tab === 'treasuries' ? 'flex' : 'none';

  // Table visibility
  document.getElementById('saTable').style.display = tab === 'tips' ? '' : 'none';
  document.getElementById('nominalsTable').style.display = tab === 'treasuries' ? '' : 'none';
  document.getElementById('beiTable').style.display = tab === 'bei' ? '' : 'none';

  // BEI has no spread concept — never enter the tab already in spread mode
  if (tab === 'bei') spreadModeActive = false;

  // Sync chart mode + controls visibility for the new tab
  switchChartMode(spreadModeActive ? 'spread' : 'yield');
  updateModeToggle();

  // Restore date range for the tab we're switching to (clear if never set so render can auto-populate)
  const dr = savedDateRange[tab];
  document.getElementById('startMaturity').value = dr ? dr.start : '';
  document.getElementById('endMaturity').value = dr ? dr.end : '';

  processAndRender();
}

// Which nominal securities the type checkboxes show.
const nominalTypeShown = r => nominalsTypeFilters.has(r.type)
  || (nominalsShowStrips && r.type === 'MARKET BASED STRIPS')
  || (nominalsShowUnclassified && r.type === 'MARKET BASED UNCLASSIFIED');
// The Treasuries the spot curve of 1.3.4 is fitted to: every Bill, Note and Bond. A STRIPS and
// an Unclassified security are excluded. Used for the Maturity Range of a checked Spot.
const isSpotFitType = b => b.type !== 'MARKET BASED STRIPS' && b.type !== 'MARKET BASED UNCLASSIFIED';

// The Market source line beside a source checkbox: the Download Date and the Settlement Date.
const marketMetaText = d => `${fmtBrokerTime(d.trade)} ET · settle ${isoToMDY(d.settle)} (T+1)`;

// Bid and ask spreads (S15) rows of nominal Treasuries → the fields the spread views draw.
function nominalSpreadBonds() {
  return (spreadsStore?.rows || []).filter(r => r.type !== 'TIPS').map(r => ({
    cusip: r.cusip, maturity: r.maturity, maturityDate: localDate(r.maturity),
    type: CUSIP_TYPE_TO_MARKET_BASED[r.type] || r.type, coupon: r.coupon,
    price: r.askPrice, bidPrice: r.bidPrice, yield: r.askYield, bidYield: r.bidYield,
    yieldSpreadBps: r.yieldSpreadBps, priceSpreadPct: r.priceSpreadPct,
  }));
}

// Bid and ask spreads (S15) rows of TIPS → the fields the spread views draw.
function tipsSpreadBonds() {
  return (spreadsStore?.rows || []).filter(r => r.type === 'TIPS').map(r => ({
    cusip: r.cusip, maturity: r.maturity, maturityDate: localDate(r.maturity), coupon: r.coupon,
    price: r.askPrice, bidPrice: r.bidPrice, askYield: r.askYield, bidYield: r.bidYield,
    adjAskPrice: r.adjustedAskPrice, adjBidPrice: r.adjustedBidPrice,
    yieldSpreadBps: r.yieldSpreadBps, priceSpreadPct: r.priceSpreadPct,
  }));
}

// spec: YieldCurves/knowledge/3.2_Render_Charts_And_Tables.md#draw-treasuries (3.2.3)
function processAndRenderNominals() {
  const statusEl = document.getElementById('status');
  const showFed = document.getElementById('chkFedInvest').checked;
  const showMq = document.getElementById('chkMarket').checked && !!marketNominalsData;

  if (!showFed && !showMq) { statusEl.textContent = ''; if (chart) { chart.destroy(); chart = null; } return; }

  try {
    let fedProcessed = null;
    if (showFed) {
      if (!fedNominalsData) { statusEl.textContent = 'No FedInvest data available.'; return; }
      fedProcessed = fedNominalsData.filter(nominalTypeShown);
    }
    const mqProcessed = showMq ? marketNominalsData.filter(nominalTypeShown) : null;

    // Initial default: the range spans whatever is checked by default (Bills/Notes/Bonds).
    // A checkbox change recomputes it (recomputeRangeFromChecked); typing a range by hand
    // holds until the next one.
    const allBonds = [...(fedProcessed || []), ...(mqProcessed || [])].sort((a, b) => a.maturityDate - b.maturityDate);
    const startEl = document.getElementById('startMaturity');
    const endEl = document.getElementById('endMaturity');
    if (!startEl.value && allBonds.length > 0) {
      startEl.value = allBonds[0].maturity;
      endEl.value = allBonds[allBonds.length - 1].maturity;
    }

    const startDate = parseIsoInput(startEl.value) || new Date(0);
    const endDate = parseIsoInput(endEl.value) || new Date(9999, 0);
    const inRange = b => b.maturityDate >= startDate && b.maturityDate <= endDate;
    const fedFiltered = fedProcessed ? fedProcessed.filter(inRange) : null;
    const mqFiltered = mqProcessed ? mqProcessed.filter(inRange) : null;

    // The stored spot curve of each source shown (S13 spot rows of Type Treasury), fitted to
    // the full Bill, Note and Bond set whichever types are checked. The Maturity Range only
    // crops which of its points the table lists, via startTermY/endTermY below, and which part
    // the chart shows, via the chart's axis domain.
    const fedSpot = showFed ? storedSpotPoints('Treasury', 'FedInvest', 'spot') : null;
    const mqSpot = showMq ? storedSpotPoints('Treasury', 'Market', 'spot') : null;
    const refSettle = localDate(showFed ? storeDates.fedInvest.settle : storeDates.market.settle);
    const startTermY = refSettle ? termYears(refSettle, startDate) : -Infinity;
    const endTermY = refSettle ? termYears(refSettle, endDate) : Infinity;

    if (spreadModeActive && mqFiltered) {
      const spreadBonds = nominalSpreadBonds().filter(nominalTypeShown).filter(inRange);
      renderSpreadCharts(spreadBonds, 'treasuries');
      renderSpreadTable(spreadBonds, 'treasuries');
    } else {
      renderNominalsTable(fedFiltered, mqFiltered, fedSpot, mqSpot, startTermY, endTermY);
      renderNominalsChart(fedFiltered, mqFiltered, fedSpot, mqSpot);
    }

    document.getElementById('treaFedMeta').textContent = showFed ? isoToMDY(storeDates.fedInvest.settle) : '';
    document.getElementById('treaMktMeta').textContent = showMq ? marketMetaText(storeDates.market) : '';
    document.getElementById('treaFedCount').textContent = showFed ? (fedFiltered?.length || 0) : '';
    document.getElementById('treaMktCount').textContent = showMq ? (mqFiltered?.length || 0) : '';
    statusEl.textContent = '';
    statusEl.className = '';
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
    statusEl.className = 'error';
    console.error('processAndRenderNominals failed:', err);
  }
}

// fedSpot / mqSpot: stored spot points { t, y } of the Treasury curve of each source, or null.
function renderNominalsTable(fedBonds, mqBonds, fedSpot, mqSpot, startTermY, endTermY) {
  const theadRow = document.querySelector('#nominalsTable thead tr');
  const tbody = document.getElementById('nominalsTableBody');
  const bothActive = fedBonds && mqBonds;
  const shortType = t => t === 'MARKET BASED BILL' ? 'Bill' : t === 'MARKET BASED NOTE' ? 'Note' : t === 'MARKET BASED BOND' ? 'Bond' : t === 'MARKET BASED UNCLASSIFIED' ? 'Unclassified' : 'STRIPS';
  const fmtMat = s => isoToMDY(s);
  const fmtYld = y => (y != null && !isNaN(y)) ? (y * 100).toFixed(3) + '%' : '—';
  const sortCls = col => nominalsSort.col === col ? ` class="sort-${nominalsSort.dir}"` : '';
  const makeCmp = getV => (a, b) => { const va = getV(a), vb = getV(b); return (va < vb ? -1 : va > vb ? 1 : 0) * (nominalsSort.dir === 'asc' ? 1 : -1); };

  // Ask is implied by any security type being checked, exactly like the chart — it is not a
  // choice of its own. Spot is its own checkbox, independent of which security types are on.
  const askShown = ['filterBills', 'filterNotes', 'filterBonds', 'filterStrips', 'filterUnclassified'].some(id => document.getElementById(id).checked);
  const spotShown = document.getElementById('showTsySpot').checked;
  const curveCols = [];
  if (askShown) curveCols.push({ key: 'ask', label: 'Ask', help: 'ask-yield-tsy' });
  if (spotShown) curveCols.push({ key: 'spot', label: 'Spot', help: 'spot-tsy' });
  const spotColIdx = curveCols.findIndex(c => c.key === 'spot');
  const curveHeaderHtml = curveCols.map(c => {
    const sortAttr = (c.key === 'ask' && !bothActive) ? ` data-sort="yield"${sortCls('yield')}` : '';
    return `<th${sortAttr} data-tip="${c.help}">${c.label}${bothActive ? ' (Fed/Mkt)' : ''}</th>`;
  }).join('');

  if (bothActive) {
    theadRow.innerHTML = `
      <th data-sort="maturity"${sortCls('maturity')}>Maturity</th>
      <th data-sort="cusip"${sortCls('cusip')}>CUSIP</th>
      <th>Type</th>
      <th data-sort="coupon"${sortCls('coupon')}>Coupon</th>
      <th>Price (Fed/Mkt)</th>
      ${curveHeaderHtml}`;
    const fedMap = new Map(fedBonds.map(b => [b.cusip, b]));
    const mqMap = new Map(mqBonds.map(b => [b.cusip, b]));
    const getV = b => nominalsSort.col === 'cusip' ? b.cusip : nominalsSort.col === 'coupon' ? b.coupon : b.maturityDate;
    const merged = [...new Set([...fedMap.keys(), ...mqMap.keys()])].map(cusip => {
      const fed = fedMap.get(cusip), mq = mqMap.get(cusip), ref = fed || mq;
      return { ...ref, fedPrice: fed?.price ?? NaN, mqPrice: mq?.price ?? NaN, fedYield: fed?.yield ?? null, mqYield: mq?.yield ?? null };
    }).sort(makeCmp(getV));
    tbody.innerHTML = merged.map(b => `
      <tr>
        <td>${fmtMat(b.maturity)}</td>
        <td>${b.cusip}</td>
        <td>${shortType(b.type)}</td>
        <td>${((b.coupon || 0) * 100).toFixed(3)}%</td>
        <td>${isNaN(b.fedPrice) ? '—' : b.fedPrice.toFixed(3)} / ${isNaN(b.mqPrice) ? '—' : b.mqPrice.toFixed(3)}</td>
        ${curveCols.map(c => `<td>${c.key === 'ask' ? `${fmtYld(b.fedYield)} / ${fmtYld(b.mqYield)}` : '—'}</td>`).join('')}
      </tr>`).join('');
  } else {
    const bonds = fedBonds || mqBonds;
    theadRow.innerHTML = `
      <th data-sort="maturity"${sortCls('maturity')}>Maturity</th>
      <th data-sort="cusip"${sortCls('cusip')}>CUSIP</th>
      <th>Type</th>
      <th data-sort="coupon"${sortCls('coupon')}>Coupon</th>
      <th data-sort="price"${sortCls('price')}>Price</th>
      ${curveHeaderHtml}`;
    const getV = b => nominalsSort.col === 'maturity' ? b.maturityDate : nominalsSort.col === 'cusip' ? b.cusip : nominalsSort.col === 'coupon' ? b.coupon : nominalsSort.col === 'price' ? b.price : b.yield;
    const sorted = [...bonds].sort(makeCmp(getV));
    tbody.innerHTML = sorted.map(b => `
      <tr>
        <td>${fmtMat(b.maturity)}</td>
        <td>${b.cusip}</td>
        <td>${shortType(b.type)}</td>
        <td>${(b.coupon * 100).toFixed(3)}%</td>
        <td>${isNaN(b.price) ? '—' : b.price.toFixed(3)}</td>
        ${curveCols.map(c => `<td>${c.key === 'ask' ? fmtYld(b.yield) : '—'}</td>`).join('')}
      </tr>`).join('');
  }

  // Spot curve rows — the stored points of the zero-coupon Treasury curve (the points the chart
  // draws), appended after the security rows since a curve point has a Term but no CUSIP to
  // sort by. The Maturity Range only crops which terms are listed here, the same way it crops
  // the rows of the other security types.
  if (spotColIdx !== -1) {
    const curveByTerm = new Map();   // term.toFixed(4) -> { term, fed, mkt }
    const addCurve = (points, source) => {
      if (!points) return;
      for (const { t, y } of points) {
        if (t < startTermY || t > endTermY) continue;
        const tk = t.toFixed(4);
        if (!curveByTerm.has(tk)) curveByTerm.set(tk, { term: t });
        curveByTerm.get(tk)[source] = y;
      }
    };
    addCurve(fedSpot, 'fed');
    addCurve(mqSpot, 'mkt');
    const fmt = v => v != null ? v.toFixed(3) + '%' : '—';
    tbody.innerHTML += [...curveByTerm.values()].sort((a, b) => a.term - b.term).map(({ term, fed, mkt }) => {
      const cells = curveCols.map((c, i) => i === spotColIdx
        ? `<td>${bothActive ? `${fmt(fed)} / ${fmt(mkt)}` : fmt(fed ?? mkt)}</td>`
        : '<td>—</td>');
      return `<tr><td>Spot (${term.toFixed(1)}y)</td><td>—</td><td>—</td><td>—</td><td>—</td>${cells.join('')}</tr>`;
    }).join('');
  }
}

function renderNominalsChart(fedBonds, mqBonds, fedSpot, mqSpot) {
  const ctx = document.getElementById('yieldChart').getContext('2d');
  const allBonds = [...(fedBonds || []), ...(mqBonds || [])];
  const haveSpotInput = (fedSpot && fedSpot.length) || (mqSpot && mqSpot.length);
  if (allBonds.length === 0 && !haveSpotInput) { if (chart) { chart.destroy(); chart = null; } return; }

  const now = Date.now();
  const toPoint = xAxisMode === 'ttm'
    ? b => ({ x: (b.maturityDate.getTime() - now) / (7 * 86400000), y: parseFloat((b.yield * 100).toFixed(3)) })
    : b => ({ x: b.maturityDate.getTime(), y: parseFloat((b.yield * 100).toFixed(3)) });
  const bothShown = fedBonds && mqBonds;

  // FedInvest: cool blues/purple (dotted) — Market: warm orange/red/teal (solid)
  const seriesDef = [];
  if (fedBonds) {
    const sfx = bothShown ? ' (FedInvest)' : '';
    seriesDef.push(
      { label: `Bills${sfx}`,  data: fedBonds.filter(b => b.type === 'MARKET BASED BILL').map(toPoint), color: '#0ea5e9', r: 1, w: 1.5, dash: [4, 4] },
      { label: `Notes${sfx}`,  data: fedBonds.filter(b => b.type === 'MARKET BASED NOTE').map(toPoint), color: '#1a56db', r: 1, w: 2.5, dash: [4, 4] },
      { label: `Bonds${sfx}`,  data: fedBonds.filter(b => b.type === 'MARKET BASED BOND').map(toPoint), color: '#7c3aed', r: 1, w: 2.5, dash: [4, 4] },
      { label: `STRIPS${sfx}`, data: fedBonds.filter(b => b.type === 'MARKET BASED STRIPS').map(toPoint), color: '#64748b', r: 1, w: 2.2, dash: [4, 4] },
      { label: `Unclassified${sfx}`, data: fedBonds.filter(b => b.type === 'MARKET BASED UNCLASSIFIED').map(toPoint), color: '#b45309', r: 1, w: 2.2, dash: [4, 4] }
    );
  }
  if (mqBonds) {
    const sfx = bothShown ? ' (Market)' : '';
    seriesDef.push(
      { label: `Bills${sfx}`,  data: mqBonds.filter(b => b.type === 'MARKET BASED BILL').map(toPoint), color: '#f97316', r: 1, w: 1.5, dash: [] },
      { label: `Notes${sfx}`,  data: mqBonds.filter(b => b.type === 'MARKET BASED NOTE').map(toPoint), color: '#dc2626', r: 1, w: 2.5, dash: [] },
      { label: `Bonds${sfx}`,  data: mqBonds.filter(b => b.type === 'MARKET BASED BOND').map(toPoint), color: '#059669', r: 1, w: 2.5, dash: [] },
      { label: `STRIPS${sfx}`, data: mqBonds.filter(b => b.type === 'MARKET BASED STRIPS').map(toPoint), color: '#78350f', r: 1, w: 2.2, dash: [] },
      { label: `Unclassified${sfx}`, data: mqBonds.filter(b => b.type === 'MARKET BASED UNCLASSIFIED').map(toPoint), color: '#eab308', r: 1, w: 2.2, dash: [] }
    );
  }

  // Zero-coupon (spot) curve, per source — the stored points of S13 (Type Treasury), fitted to
  // the Bills, Notes and Bonds whichever of their checkboxes are on. Only built at all when
  // Spot is checked — an unchecked series must not appear in the dataset array, or Chart.js's
  // legend shows it struck through instead of simply omitting it. Its colour is distinct from
  // the per-bond lines.
  const yToX = yearsToX(now);
  if (document.getElementById('showTsySpot').checked) {
    const bothSpot = fedSpot && fedSpot.length && mqSpot && mqSpot.length;
    const nomCurveSrc = [];
    if (fedSpot && fedSpot.length) nomCurveSrc.push({ points: fedSpot, sfx: bothSpot ? ' (FedInvest)' : '', color: '#0f172a' });
    if (mqSpot && mqSpot.length) nomCurveSrc.push({ points: mqSpot, sfx: bothSpot ? ' (Market)' : '',    color: '#b45309' });
    for (const { points, sfx, color } of nomCurveSrc) {
      seriesDef.push({ label: `Spot${sfx}`, data: points.map(({ t, y }) => ({ x: yToX(t), y })), color, w: 2.5, dash: [], curve: true, r: 0, markerR: 2 });
    }
  }

  // Filter series with no data points
  const activeSeries = seriesDef.filter(s => s.data.length > 0);
  const allPoints = activeSeries.flatMap(s => s.data);
  if (allPoints.length === 0) { if (chart) { chart.destroy(); chart = null; } return; }

  // X axis: linear term scale in Term mode; time scale in Maturity mode
  let xScale;
  if (xAxisMode === 'ttm') {
    const rawMaxW = Math.max(...allPoints.map(d => d.x));
    const isBillsOnly = rawMaxW <= 52;
    const maxW = isBillsOnly ? 52 : Math.ceil(rawMaxW / 52) * 52;
    let tickVals, tickCb, tickFont;
    if (isBillsOnly) {
      tickVals = TERM_TICK_VALUES;
      tickCb = val => (TERM_LABEL_4W.has(val) || TERM_LABEL_MINOR.has(val)) ? `${val}w` : '';
      tickFont = ctx => TERM_LABEL_MINOR.has(ctx.tick?.value) ? { size: 9 } : { size: 11 };
    } else {
      tickCb = (val) => {
        if (val < 0) return '';
        if (val >= 52) {
          const wy = Math.floor(val / 52);
          const rm = Math.round((val / 52 - wy) * 12);
          if (rm === 0) return `${wy}y`;
          if (rm === 12) return `${wy + 1}y`;
          return `${wy}y ${rm}m`;
        }
        if (val >= 4) return `${Math.round(val / 4.348)}m`;
        return `${Math.round(val)}w`;
      };
      tickFont = () => ({ size: 11 });
    }
    xScale = {
      type: 'linear',
      min: 0, max: maxW,
      afterBuildTicks: scale => {
        if (isBillsOnly) {
          scale.ticks = tickVals.filter(v => v >= scale.min && v <= scale.max).map(v => ({ value: v }));
        } else {
          const span = scale.max - scale.min;
          const ticks = [];
          if (span > 260) {
            const start = Math.ceil(Math.max(scale.min, 0) / 52) * 52;
            for (let v = start; v <= scale.max; v += 52) ticks.push({ value: v });
          } else if (span > 104) {
            const start = Math.ceil(Math.max(scale.min, 0) / 26) * 26;
            for (let v = start; v <= scale.max; v += 26) ticks.push({ value: v });
          } else if (span > 52) {
            const start = Math.ceil(Math.max(scale.min, 0) / 13) * 13;
            for (let v = start; v <= scale.max; v += 13) ticks.push({ value: v });
          } else if (span > 12) {
            const start = Math.ceil(Math.max(scale.min, 0) / 4) * 4;
            for (let v = start; v <= scale.max; v += 4) ticks.push({ value: v });
          } else {
            const start = Math.ceil(Math.max(scale.min, 0));
            for (let v = start; v <= scale.max; v += 1) ticks.push({ value: v });
          }
          scale.ticks = ticks;
        }
      },
      grid: { color: GRID_COLOR },
      ticks: { maxRotation: 0, callback: tickCb, font: tickFont }
    };
  } else {
    const minDate = new Date(Math.min(...allPoints.map(d => d.x)));
    const maxDate = new Date(Math.max(...allPoints.map(d => d.x)));
    const _startDtN = parseIsoInput(document.getElementById('startMaturity').value);
    const _endDtN   = parseIsoInput(document.getElementById('endMaturity').value);
    const minX = _startDtN
      ? new Date(_startDtN.getFullYear(), _startDtN.getMonth(), 1).getTime()
      : new Date(minDate.getFullYear(), minDate.getMonth(), 1).getTime();
    const maxX = _endDtN
      ? new Date(_endDtN.getFullYear(), _endDtN.getMonth() + 1, 1).getTime()
      : new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 1).getTime();
    xScale = {
      type: 'time',
      min: minX, max: maxX,
      time: { displayFormats: { year: 'yyyy', month: 'MMM yyyy' } },
      ...calendarTimeAxis({ gridColor: GRID_COLOR }),
    };
  }

  // The spot curve is a smooth fit, so it is never treated as an outlier — Clip Outliers
  // only trims the per-bond points. (Its series only exists at all when Spot is checked.)
  const barePointY = activeSeries.filter(s => !s.curve).flatMap(s => s.data).map(d => d.y);
  const curveY = activeSeries.filter(s => s.curve).flatMap(s => s.data).map(d => d.y);
  let scaleY = barePointY.slice();
  if (nominalsClipOutliers && barePointY.length >= 4) {
    // Use Bills/Notes yields for IQR (outliers live in short-dated issues; Bonds and STRIPS
    // both widen IQR too much — STRIPS carry a coupon-date sawtooth of their own, not just
    // near-maturity noise, so lumping them into this fence clips real variation). Filter IQR
    // source to positive yields only — near-maturity Bills/Notes can show extreme negative
    // YTM (e.g. -5%) when trading at a tiny premium with days to expiry.
    const nearMaturityY = activeSeries.filter(s => s.label.includes('Notes') || s.label.includes('Bills')).flatMap(s => s.data).map(d => d.y);
    const nearMaturityYPos = nearMaturityY.filter(y => y > 0);
    if (nearMaturityYPos.length >= 4) {
      const bounds = iqrClipBounds(nearMaturityYPos);
      if (bounds) {
        const clipped = barePointY.filter(y => y >= bounds.lo);
        if (clipped.length > 0) scaleY = clipped;
      }
    }
  }
  scaleY = scaleY.concat(curveY);
  if (scaleY.length === 0) scaleY = allPoints.map(d => d.y);
  const minYRaw = Math.min(...scaleY), maxYRaw = Math.max(...scaleY);
  const minY = Math.floor(minYRaw * 20) / 20;
  const maxY = Math.ceil(maxYRaw * 20) / 20;
  const dataRange = maxY - minY;
  const step = dataRange <= 0.5 ? 0.05 : dataRange <= 1.0 ? 0.1 : 0.25;

  const zoomToRestore = savedZoom['treasuries'];
  if (chart && chartTab && savedZoom[chartTab] !== null) savedZoom[chartTab] = {
    xMin: chart.scales.x.min, xMax: chart.scales.x.max,
    yMin: chart.scales.y.min, yMax: chart.scales.y.max
  };
  if (chart) chart.destroy();
  chartTab = 'treasuries';
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: activeSeries.map(s => ({
        label: s.label,
        data: s.data,
        borderColor: s.color,
        backgroundColor: s.color,
        borderWidth: s.w,
        borderDash: s.dash,
        pointRadius: s.curve ? (s.markerR ?? 0) : s.r,
        pointHoverRadius: s.curve ? 5 : (s.r > 0 ? s.r + 2 : 3),
        tension: s.curve ? 0.3 : 0.1,
        hidden: false
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: xScale,
        y: {
          type: 'linear',
          title: { display: true, text: 'Yield (%)' },
          min: minY, max: maxY,
          grid: { color: GRID_COLOR },
          ticks: { stepSize: step, callback: (val) => val.toFixed(2) }
        }
      },
      plugins: {
        legend: {
          labels: { usePointStyle: true, boxWidth: 8, padding: 15, font: { size: 13, weight: '500' } },
          onClick: (e, legendItem, legend) => { Chart.defaults.plugins.legend.onClick(e, legendItem, legend); rescaleToVisible(legend.chart); }
        },
        zoom: {
          pan: { enabled: true, mode: 'xy' },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy', onZoomComplete: ({chart}) => rescaleToVisible(chart) }
        },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,0.95)', titleColor: '#1e293b', bodyColor: '#475569',
          borderColor: '#e2e8f0', borderWidth: 1, padding: 8,
          titleFont: { size: 11, weight: '700' }, bodyFont: { size: 11 },
          cornerRadius: 6, displayColors: false,
          callbacks: {
            title: items => {
              if (xAxisMode === 'ttm') {
                const w = items[0].parsed.x;
                const termLabel = w < 52 ? `${w.toFixed(1)}w` : `${(w / 52).toFixed(1)}y`;
                return `${fmtDateMDY(new Date(now + w * 7 * 86400000))} (${termLabel})`;
              }
              return fmtDateMDY(new Date(items[0].parsed.x));
            },
            label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(3)}%`
          }
        }
      }
    }
  });

  if (zoomToRestore) {
    chart.options.scales.x.min = zoomToRestore.xMin;
    chart.options.scales.x.max = zoomToRestore.xMax;
    chart.options.scales.y.min = zoomToRestore.yMin;
    chart.options.scales.y.max = zoomToRestore.yMax;
    chart.update('none');
  }

  setupAxisWheelZoom(chart.canvas, ({chart}) => rescaleToVisible(chart), ({chart, factor}) => snapYAfterZoom(chart, factor));

}

// spec: YieldCurves/knowledge/3.2_Render_Charts_And_Tables.md#draw-tips (3.2.4)
function processAndRenderTips() {
  const statusEl = document.getElementById('status');
  const showFed = document.getElementById('chkTipsFed').checked;
  const showBroker = document.getElementById('chkTipsBroker').checked && !!marketTipsData;

  if (!showFed && !showBroker) { statusEl.textContent = ''; if (chart) { chart.destroy(); chart = null; } return; }
  if (showFed && !fedTipsData && !showBroker) return;

  try {
    const fedBonds = showFed ? fedTipsData : null;
    const brokerBonds = showBroker ? marketTipsData : null;

    const startEl = document.getElementById('startMaturity');
    const endEl = document.getElementById('endMaturity');

    const allCurrent = [...(fedBonds || []), ...(brokerBonds || [])].sort((a, b) => a.maturityDate - b.maturityDate);
    if (!startEl.value && allCurrent.length > 0) {
      startEl.value = allCurrent[0].maturity;
      endEl.value = allCurrent[allCurrent.length - 1].maturity;
    }

    const startDate = parseIsoInput(startEl.value) || new Date(0);
    const endDate = parseIsoInput(endEl.value) || new Date(9999, 0);
    const inRange = b => b.maturityDate >= startDate && b.maturityDate <= endDate;
    const fedFiltered = fedBonds ? fedBonds.filter(inRange) : null;
    const brokerFiltered = brokerBonds ? brokerBonds.filter(inRange) : null;

    if (spreadModeActive && brokerFiltered) {
      const spreadBonds = tipsSpreadBonds().filter(inRange);
      renderSpreadCharts(spreadBonds, 'tips');
      renderSpreadTable(spreadBonds, 'tips');
    } else {
      tipsTableFed = fedFiltered;
      tipsTableBroker = brokerFiltered;
      renderTable(fedFiltered, brokerFiltered);
      renderChart(fedFiltered, brokerFiltered);
    }

    document.getElementById('tipsFedMeta').textContent = showFed ? isoToMDY(storeDates.fedInvest.settle) : '';
    document.getElementById('tipsMktMeta').textContent = showBroker ? marketMetaText(storeDates.market) : '';
    document.getElementById('tipsFedCount').textContent = showFed ? (fedFiltered?.length || 0) : '';
    document.getElementById('tipsBrokerCount').textContent = showBroker ? (brokerFiltered?.length || 0) : '';
    statusEl.textContent = '';
    statusEl.className = '';
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
    statusEl.className = 'error';
    console.error('processAndRenderTips failed:', err);
  }
}

// Table columns follow the chart's series checkboxes (Ask/SA/SAO/Spot/Spot SA) rather than a
// fixed set — see YieldCurves/knowledge/3.2_Render_Charts_And_Tables.md#draw-tips (3.2.4). Spot
// and Spot SA are fitted curves, not a value tied to any one security, so they get separate
// rows (Term only, at the stored points of S13 — the points the chart draws) interleaved by
// Term with the security rows.
const TIPS_TABLE_SERIES = [
  { key: 'ask',    label: 'Ask',      help: 'ask-yield', yieldKey: 'askYield' },
  { key: 'sa',     label: 'SA',       help: 'sa-yield',  yieldKey: 'saYield',  drill: 'sa' },
  { key: 'sao',    label: 'SAO',      help: 'sao-yield', yieldKey: 'saoYield', drill: 'sao' },
  { key: 'spot',   label: 'Spot',     help: 'spot' },
  { key: 'spotSa', label: 'Spot SA',  help: 'spot-sa' },
];
function renderTable(fedBonds, brokerBonds) {
  const tbody = document.getElementById('tableBody');
  const thead = document.querySelector('#saTable thead tr');
  const both = fedBonds && brokerBonds;
  const fmtY = y => (y != null && !isNaN(y)) ? (y * 100).toFixed(3) + '%' : '—';
  // Term (y) as stored on the row: from the Settlement Date of the source of its price, the
  // same measure the curve rows below carry (DATA_DICTIONARY.md#term).
  const termOf = b => b.termYears;

  window._currentBonds = [...(fedBonds || []), ...(brokerBonds || [])].sort((a, b) => a.maturityDate - b.maturityDate);

  const shown = { ask: 'showTipsAsk', sa: 'showTipsSa', sao: 'showTipsSao', spot: 'showTipsSpot', spotSa: 'showTipsSpotSa' };
  const cols = TIPS_TABLE_SERIES.filter(s => document.getElementById(shown[s.key]).checked);
  const sortCls = col => tipsSort.col === col ? ` class="sort-${tipsSort.dir}"` : '';

  thead.innerHTML = `
    <th data-sort="maturity" data-tip="maturity"${sortCls('maturity')}>Maturity</th>
    <th data-sort="term" data-tip="term"${sortCls('term')}>Term</th>
    ${cols.map(c => `<th data-sort="${c.key}" data-tip="${c.help}"${sortCls(c.key)}>${c.label}${both ? ' (Fed/Mkt)' : ''}</th>`).join('')}`;

  // Security rows — one per CUSIP, Ask/SA/SAO cells where that security has them. Each cell
  // carries a numeric `val` (Fed's own yield, falling back to Market) alongside its display
  // html, so a column can be sorted even where it shows two source values at once.
  const fedMap = fedBonds ? new Map(fedBonds.map(b => [b.cusip, b])) : new Map();
  const brokerMap = brokerBonds ? new Map(brokerBonds.map(b => [b.cusip, b])) : new Map();
  const rows = [...new Set([...fedMap.keys(), ...brokerMap.keys()])].map(cusip => {
    const f = fedMap.get(cusip), b = brokerMap.get(cusip);
    const ref = f || b;
    const cells = cols.map(c => c.yieldKey
      ? { html: both ? `${fmtY(f?.[c.yieldKey])} / ${fmtY(b?.[c.yieldKey])}` : fmtY(ref[c.yieldKey]), val: f?.[c.yieldKey] ?? b?.[c.yieldKey], drill: c.drill, cusip }
      : { html: '—' });
    return { term: termOf(ref), maturityHtml: fmtMMM(ref.maturity), cells };
  });

  // Curve rows — Spot / Spot SA only, added when checked.
  const curveByTerm = new Map();   // term.toFixed(4) -> { term, spot_fed, spot_mkt, spotSa_fed, spotSa_mkt }
  // `shown`: the security rows of that source, null when the source is not shown.
  const addCurve = (key, shown, source, tag) => {
    if (!shown) return;
    for (const { t, y } of storedSpotPoints('TIPS', source, key)) {
      const tk = t.toFixed(4);
      if (!curveByTerm.has(tk)) curveByTerm.set(tk, { term: t });
      curveByTerm.get(tk)[`${key}_${tag}`] = y;
    }
  };
  if (cols.some(c => c.key === 'spot')) {
    addCurve('spot', fedBonds, 'FedInvest', 'fed');
    addCurve('spot', brokerBonds, 'Market', 'mkt');
  }
  if (cols.some(c => c.key === 'spotSa')) {
    addCurve('spotSa', fedBonds, 'FedInvest', 'fed');
    addCurve('spotSa', brokerBonds, 'Market', 'mkt');
  }
  for (const { term, ...vals } of curveByTerm.values()) {
    const cells = cols.map(c => {
      if (c.key !== 'spot' && c.key !== 'spotSa') return { html: '—' };
      const fedV = vals[`${c.key}_fed`], mktV = vals[`${c.key}_mkt`];
      const fmt = v => v != null ? v.toFixed(3) + '%' : '—';
      return { html: both ? `${fmt(fedV)} / ${fmt(mktV)}` : fmt(fedV ?? mktV), val: fedV ?? mktV };
    });
    rows.push({ term, maturityHtml: '—', cells });
  }

  // Maturity and Term share the same chronological order, so both sort on term. A value
  // column sorts on its own cells' `val`; rows without one (e.g. a security row under Spot)
  // sort to the end regardless of direction, same as an empty cell in the other tables.
  const colIdx = cols.findIndex(c => c.key === tipsSort.col);
  const getV = r => (tipsSort.col === 'maturity' || tipsSort.col === 'term') ? r.term : r.cells[colIdx]?.val;
  const dirMul = tipsSort.dir === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    const va = getV(a), vb = getV(b);
    if (va == null && vb == null) return a.term - b.term;
    if (va == null) return 1;
    if (vb == null) return -1;
    return (va < vb ? -1 : va > vb ? 1 : 0) * dirMul;
  });
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.maturityHtml}</td>
      <td>${r.term.toFixed(1)}y</td>
      ${r.cells.map(c => `<td${c.drill ? ` class="drillable" data-drill="${c.drill}" data-cusip="${c.cusip}"` : ''}${c.drill === 'sao' ? ' style="font-weight:700; color:#1a56db;"' : ''}>${c.html}</td>`).join('')}
    </tr>`).join('');
}

// A dataset's SHOW-row key, from its legend label. "Spot SA (Fed)" → SpotSA before the
// generic first-word split so it doesn't read as "Spot".
function tipsSeriesKey(label) {
  if (label.startsWith('Spot SA')) return 'SpotSA';
  if (label.startsWith('Spot')) return 'Spot';
  if (label.startsWith('GSW')) return 'GSW';
  return label.split(' ')[0];   // Ask, SA, SAO
}
const TIPS_SHOW_EL = { Ask: 'showTipsAsk', SA: 'showTipsSa', SAO: 'showTipsSao', Spot: 'showTipsSpot', SpotSA: 'showTipsSpotSa', GSW: 'showTipsGsw' };
function getTipsSeriesVisibility(label) {
  const el = TIPS_SHOW_EL[tipsSeriesKey(label)];
  return el ? document.getElementById(el).checked : true;
}

// Shared x-scale builder for TIPS-maturity-keyed yield charts (TIPS tab, BEI tab):
// linear term (weeks) scale in Term mode, calendar time scale in Maturity mode.
function buildYieldXScale(allPoints) {
  if (xAxisMode === 'ttm') {
    const rawMaxW = Math.max(...allPoints.map(d => d.x));
    const maxW = Math.ceil(rawMaxW / 52) * 52;
    const ttmTickCb = (val) => {
      if (val < 0) return '';
      if (val >= 52) {
        const wy = Math.floor(val / 52);
        const rm = Math.round((val / 52 - wy) * 12);
        if (rm === 0) return `${wy}y`;
        if (rm === 12) return `${wy + 1}y`;
        return `${wy}y ${rm}m`;
      }
      if (val >= 4) return `${Math.round(val / 4.348)}m`;
      return `${Math.round(val)}w`;
    };
    return {
      type: 'linear',
      min: 0, max: maxW,
      afterBuildTicks: scale => {
        const span = scale.max - scale.min;
        const ticks = [];
        if (span > 260) {
          const start = Math.ceil(Math.max(scale.min, 0) / 52) * 52;
          for (let v = start; v <= scale.max; v += 52) ticks.push({ value: v });
        } else if (span > 104) {
          const start = Math.ceil(Math.max(scale.min, 0) / 26) * 26;
          for (let v = start; v <= scale.max; v += 26) ticks.push({ value: v });
        } else if (span > 52) {
          const start = Math.ceil(Math.max(scale.min, 0) / 13) * 13;
          for (let v = start; v <= scale.max; v += 13) ticks.push({ value: v });
        } else if (span > 12) {
          const start = Math.ceil(Math.max(scale.min, 0) / 4) * 4;
          for (let v = start; v <= scale.max; v += 4) ticks.push({ value: v });
        } else {
          const start = Math.ceil(Math.max(scale.min, 0));
          for (let v = start; v <= scale.max; v += 1) ticks.push({ value: v });
        }
        scale.ticks = ticks;
      },
      grid: { color: GRID_COLOR },
      ticks: { maxRotation: 0, callback: ttmTickCb }
    };
  }
  const minDate = new Date(Math.min(...allPoints.map(d => d.x)));
  const maxDate = new Date(Math.max(...allPoints.map(d => d.x)));
  const _startDt = parseIsoInput(document.getElementById('startMaturity').value);
  const _endDt   = parseIsoInput(document.getElementById('endMaturity').value);
  const minX = _startDt
    ? new Date(_startDt.getFullYear(), _startDt.getMonth(), 1).getTime()
    : new Date(minDate.getFullYear(), 0, 1).getTime();
  const maxX = _endDt
    ? new Date(_endDt.getFullYear(), _endDt.getMonth() + 1, 1).getTime()
    : new Date(maxDate.getFullYear() + 1, 0, 1).getTime();
  return {
    type: 'time',
    min: minX, max: maxX,
    time: { displayFormats: { year: 'yyyy', month: 'MMM yyyy' } },
    ...calendarTimeAxis({ gridColor: GRID_COLOR }),
  };
}

function renderChart(fedBonds, brokerBonds) {
  const ctx = document.getElementById('yieldChart').getContext('2d');
  const allBonds = [...(fedBonds || []), ...(brokerBonds || [])];
  if (allBonds.length === 0) { if (chart) { chart.destroy(); chart = null; } return; }

  const now = Date.now();
  const toPt = xAxisMode === 'ttm'
    ? (b, key) => ({ x: (b.maturityDate.getTime() - now) / (7 * 86400000), y: parseFloat((b[key] * 100).toFixed(3)) })
    : (b, key) => ({ x: b.maturityDate.getTime(), y: parseFloat((b[key] * 100).toFixed(3)) });
  const both = fedBonds && brokerBonds;
  const seriesDef = [];

  if (fedBonds) {
    const sfx = both ? ' (Fed)' : '';
    seriesDef.push(
      { label: `Ask${sfx}`, data: fedBonds.map(b => toPt(b, 'askYield')), color: '#94a3b8', style: 'circle', w: 1.5, r: 1.25, dash: [4, 4] },
      { label: `SA${sfx}`,  data: fedBonds.map(b => toPt(b, 'saYield')),  color: '#475569', style: 'circle', w: 1.8, r: 1.25, dash: [4, 4] },
      { label: `SAO${sfx}`, data: fedBonds.map(b => toPt(b, 'saoYield')), color: '#1a56db', style: 'circle', w: 2.2, r: 1.25, dash: [4, 4] }
    );
  }
  if (brokerBonds) {
    const sfx = both ? ' (Market)' : '';
    seriesDef.push(
      { label: `Ask${sfx}`, data: brokerBonds.map(b => toPt(b, 'askYield')), color: '#f97316', style: 'circle', w: 1.5, r: 1.25, dash: [] },
      { label: `SA${sfx}`,  data: brokerBonds.map(b => toPt(b, 'saYield')),  color: '#dc2626', style: 'circle', w: 1.8, r: 1.25, dash: [] },
      { label: `SAO${sfx}`, data: brokerBonds.map(b => toPt(b, 'saoYield')), color: '#059669', style: 'circle', w: 2.2, r: 1.25, dash: [] }
    );
  }

  // Zero-coupon (spot) curves, per source: the stored points of S13 (Type TIPS), Spot fitted to
  // the quoted ask yields and Spot SA to the seasonally adjusted yields. Plus the GSW
  // reference (?gsw only).
  const yToX = yearsToX(now);
  const toCurve = points => points.map(({ t, y }) => ({ x: yToX(t), y }));
  const curveSrc = [];
  if (fedBonds)    curveSrc.push({ source: 'FedInvest', sfx: both ? ' (Fed)' : '',    color: '#1a56db' });
  if (brokerBonds) curveSrc.push({ source: 'Market',    sfx: both ? ' (Market)' : '', color: '#b45309' });
  for (const { source, sfx, color } of curveSrc) {
    const ask = toCurve(storedSpotPoints('TIPS', source, 'spot'));
    if (ask.length) seriesDef.push({ label: `Spot${sfx}`, data: ask, color, curve: true, w: 2.25, dash: [], style: 'circle', r: 0, markerR: 2 });
    const sa = toCurve(storedSpotPoints('TIPS', source, 'spotSa'));
    if (sa.length) seriesDef.push({ label: `Spot SA${sfx}`, data: sa, color, curve: true, w: 2.25, dash: [2, 3], style: 'circle', r: 0, markerR: 2 });
  }
  // GSW zero reference (analysis aid, ?gsw only): evaluate its published Svensson parameters
  // (weekly R2 pull) on the same half-year grid, converted to the semi-annual basis. Falls
  // back to a baked-in snapshot if the R2 file is unavailable.
  if (SHOW_GSW) {
  let gswData, gswDate;
  if (gswTipsCurve) {
    gswDate = gswTipsCurve.date;
    const { beta0, beta1, beta2, beta3, tau1, tau2 } = gswTipsCurve;
    gswData = [];
    for (let t = 2; t <= 20 + 1e-9; t += 0.5) {   // GSW fits to 20y — don't extrapolate past it
      const p = nssBasis(t, tau1, tau2);
      const zc = beta0 * p[0] + beta1 * p[1] + beta2 * p[2] + beta3 * p[3];   // % continuous
      gswData.push({ x: yToX(t), y: parseFloat(zToSA(zc).toFixed(3)) });
    }
  } else {
    gswDate = GSW_TIPS_ZERO_SNAPSHOT.date;
    gswData = GSW_TIPS_ZERO_SNAPSHOT.points.map(([t, y]) => ({ x: yToX(t), y }));
  }
  seriesDef.push({
    label: `GSW zero ${gswDate}`,
    data: gswData,
    color: '#111827', curve: true, w: 1.5, dash: [6, 4], style: 'circle', r: 0, markerR: 3,
  });
  }

  const activeSeries = seriesDef.filter(s => s.data.length > 0);
  const allPoints = activeSeries.flatMap(s => s.data);
  const xScale = buildYieldXScale(allPoints);
  const allY = allPoints.map(d => d.y);
  const minY = Math.floor(Math.min(...allY) * 4) / 4;
  const maxY = Math.ceil(Math.max(...allY) * 4) / 4;

  const zoomToRestore = savedZoom['tips'];
  if (chart && chartTab && savedZoom[chartTab] !== null) savedZoom[chartTab] = {
    xMin: chart.scales.x.min, xMax: chart.scales.x.max,
    yMin: chart.scales.y.min, yMax: chart.scales.y.max
  };
  if (chart) chart.destroy();
  chartTab = 'tips';
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: activeSeries.map(s => ({
        label: s.label,
        data: s.data,
        borderColor: s.color,
        backgroundColor: s.color,
        borderWidth: s.w,
        borderDash: s.dash,
        pointRadius: s.curve ? (s.markerR ?? 0) : s.r,
        pointHoverRadius: s.curve ? 5 : undefined,
        pointStyle: s.style,
        tension: s.curve ? 0.3 : 0.1,
        hidden: !getTipsSeriesVisibility(s.label)
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: xScale,
        y: { type: 'linear', title: { display: true, text: 'Yield (%)' }, min: minY, max: maxY, grid: { color: GRID_COLOR }, ticks: { stepSize: 0.25, callback: (v) => v.toFixed(2) } }
      },
      plugins: {
        legend: {
          labels: { filter: (item) => !item.hidden, usePointStyle: true, boxWidth: 8, padding: 15, font: { size: 13, weight: '500' } },
          onClick: null
        },
        zoom: {
          pan: { enabled: true, mode: 'xy' },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy', onZoomComplete: ({chart}) => rescaleToVisible(chart) }
        },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,0.95)', titleColor: '#1e293b', bodyColor: '#475569', borderColor: '#e2e8f0', borderWidth: 1, padding: 8, cornerRadius: 6, displayColors: false,
          callbacks: {
            title: (items) => {
              const ms = xAxisMode === 'ttm'
                ? now + items[0].parsed.x * 7 * 86400000
                : items[0].parsed.x;
              const yrs = (ms - now) / (365.25 * 86400000);
              return `${fmtDateMDY(new Date(ms))} · ${yrs.toFixed(1)}y`;
            },
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`
          }
        }
      }
    }
  });

  if (zoomToRestore) {
    chart.options.scales.x.min = zoomToRestore.xMin;
    chart.options.scales.x.max = zoomToRestore.xMax;
    chart.options.scales.y.min = zoomToRestore.yMin;
    chart.options.scales.y.max = zoomToRestore.yMax;
    chart.update('none');
  } else {
    rescaleToVisible(chart);
  }

  setupAxisWheelZoom(chart.canvas, ({chart}) => rescaleToVisible(chart), ({chart, factor}) => snapYAfterZoom(chart, factor));

}

function rescaleToVisible(chart) {
  const xMin = chart.scales.x.min;
  const xMax = chart.scales.x.max;
  let allVisibleY = [];
  const curveVisibleY = [];   // fitted curves (Spot, GSW) — smooth, never clipped as outliers

  chart.data.datasets.forEach((dataset, i) => {
    if (!chart.isDatasetVisible(i)) return;
    const isCurve = dataset.label.startsWith('Spot') || dataset.label.startsWith('GSW');
    dataset.data.forEach(p => { if (p.x >= xMin && p.x <= xMax) (isCurve ? curveVisibleY : allVisibleY).push(p.y); });
  });

  if (allVisibleY.length === 0 && curveVisibleY.length === 0) return;

  if (nominalsClipOutliers && chartTab === 'treasuries' && allVisibleY.length >= 4) {
    // Use Bills/Notes yields for IQR (outliers live in short-dated issues; Bonds and STRIPS
    // both widen IQR too much)
    const nearMaturityVisibleY = [];
    chart.data.datasets.forEach((dataset, i) => {
      if (!chart.isDatasetVisible(i) || !(dataset.label.includes('Notes') || dataset.label.includes('Bills'))) return;
      dataset.data.forEach(p => { if (p.x >= xMin && p.x <= xMax) nearMaturityVisibleY.push(p.y); });
    });
    const nearMaturityVisibleYPos = nearMaturityVisibleY.filter(y => y > 0);
    if (nearMaturityVisibleYPos.length >= 4) {
      const bounds = iqrClipBounds(nearMaturityVisibleYPos);
      if (bounds) {
        const clipped = allVisibleY.filter(y => y >= bounds.lo && y <= bounds.hi);
        if (clipped.length > 0) allVisibleY = clipped;
      }
    }
  }

  if (beiClipOutliers && chartTab === 'bei' && allVisibleY.length >= 4) {
    const bounds = iqrClipBounds(allVisibleY);
    if (bounds) {
      const clipped = allVisibleY.filter(y => y >= bounds.lo && y <= bounds.hi);
      if (clipped.length > 0) allVisibleY = clipped;
    }
  }

  allVisibleY = allVisibleY.concat(curveVisibleY);
  const visibleMinY = Math.min(...allVisibleY);
  const visibleMaxY = Math.max(...allVisibleY);
  const bounds = snapYBounds(visibleMinY, visibleMaxY);
  chart.options.scales.y.min = bounds.min;
  chart.options.scales.y.max = bounds.max;
  chart.options.scales.y.ticks.stepSize = bounds.step;
  chart.update('none');
}


// ─── BEI (Breakeven Inflation) ───────────────────────────────────────────────
// spec: YieldCurves/knowledge/3.2_Render_Charts_And_Tables.md#draw-breakeven (3.2.5)
// Per security: the rows of Breakeven inflation (S14), the closest-maturity nominal Ask less
// each of the TIPS Ask, SA and SAO. Across terms: the stored spot rows of S13 of Type BEI and
// Source Market, Spot SA (the nominal curve less the TIPS SA curve). Market-only.

// A row of S14 → the fields the breakeven views draw.
function toBeiBond(r) {
  return {
    cusip: r.tipsCusip, maturity: r.tipsMaturity, maturityDate: localDate(r.tipsMaturity), coupon: r.tipsCoupon,
    askYield: r.tipsAsk, saYield: r.tipsSa, saoYield: r.tipsSao,
    nominalCusip: r.nominalCusip, nominalMaturity: r.nominalMaturity, nominalCoupon: r.nominalCoupon,
    nominalYield: r.nominalAsk, beiAsk: r.askBei, beiSa: r.saBei, beiSao: r.saoBei,
  };
}

function processAndRenderBei() {
  const statusEl = document.getElementById('status');

  const tips = (beiStore?.rows || []).map(toBeiBond).sort((a, b) => a.maturityDate - b.maturityDate);
  if (tips.length === 0) {
    statusEl.textContent = 'BEI requires market-quote TIPS and nominal data.';
    statusEl.className = '';
    if (chart) { chart.destroy(); chart = null; }
    document.getElementById('beiTableBody').innerHTML = '';
    return;
  }

  try {
    const yToX = yearsToX(Date.now());
    const spotBei = storedSpotPoints('BEI', 'Market', 'spotSa');
    const spotBeiGrid = spotBei.length ? spotBei.map(({ t, y }) => ({ x: yToX(t), y })) : null;

    const startEl = document.getElementById('startMaturity');
    const endEl = document.getElementById('endMaturity');
    if (!startEl.value && tips.length > 0) {
      startEl.value = tips[0].maturity;
      endEl.value = tips[tips.length - 1].maturity;
    }
    const startDate = parseIsoInput(startEl.value) || new Date(0);
    const endDate = parseIsoInput(endEl.value) || new Date(9999, 0);
    const filtered = tips.filter(b => b.maturityDate >= startDate && b.maturityDate <= endDate);

    renderBeiTable(filtered);
    renderBeiChart(filtered, spotBeiGrid);

    document.getElementById('tipsMktMeta').textContent = marketMetaText(beiStore.dates);
    document.getElementById('tipsBrokerCount').textContent = filtered.length;
    document.getElementById('tipsFedMeta').textContent = '';
    document.getElementById('tipsFedCount').textContent = '';
    statusEl.textContent = '';
    statusEl.className = '';
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
    statusEl.className = 'error';
    console.error('processAndRenderBei failed:', err);
  }
}

function getBeiSeriesVisibility(label) {
  if (label === 'Ask BEI') return document.getElementById('showBeiAsk').checked;
  if (label === 'SA BEI') return document.getElementById('showBeiSa').checked;
  if (label === 'SAO BEI') return document.getElementById('showBeiSao').checked;
  if (label === 'Spot BEI') return document.getElementById('showBeiSpot').checked;
  return true;
}

function renderBeiChart(bonds, spotBeiGrid) {
  const ctx = document.getElementById('yieldChart').getContext('2d');
  if (!bonds || bonds.length === 0) { if (chart) { chart.destroy(); chart = null; } return; }

  const now = Date.now();
  const toPt = xAxisMode === 'ttm'
    ? (b, key) => ({ x: (b.maturityDate.getTime() - now) / (7 * 86400000), y: parseFloat((b[key] * 100).toFixed(3)) })
    : (b, key) => ({ x: b.maturityDate.getTime(), y: parseFloat((b[key] * 100).toFixed(3)) });

  const seriesDef = [
    { label: 'Ask BEI', data: bonds.map(b => toPt(b, 'beiAsk')), color: '#f97316', style: 'circle', w: 1.5, r: 1.25 },
    { label: 'SA BEI',  data: bonds.map(b => toPt(b, 'beiSa')),  color: '#dc2626', style: 'circle', w: 1.8, r: 1.25 },
    { label: 'SAO BEI', data: bonds.map(b => toPt(b, 'beiSao')), color: '#059669', style: 'circle', w: 2.2, r: 1.25 },
  ];
  if (spotBeiGrid) seriesDef.push({ label: 'Spot BEI', data: spotBeiGrid, color: '#1a56db', style: 'circle', w: 2.5, r: 0, markerR: 2, curve: true });

  const activeSeries = seriesDef.filter(s => s.data.length > 0);
  const allPoints = activeSeries.flatMap(s => s.data);
  const xScale = buildYieldXScale(allPoints);
  const allY = allPoints.map(d => d.y);
  let scaleY = allY;
  if (beiClipOutliers && allY.length >= 4) {
    const bounds = iqrClipBounds(allY);
    if (bounds) {
      const clipped = allY.filter(y => y >= bounds.lo && y <= bounds.hi);
      if (clipped.length > 0) scaleY = clipped;
    }
  }
  const minY = Math.floor(Math.min(...scaleY) * 4) / 4;
  const maxY = Math.ceil(Math.max(...scaleY) * 4) / 4;

  const zoomToRestore = savedZoom['bei'];
  if (chart && chartTab && savedZoom[chartTab] !== null) savedZoom[chartTab] = {
    xMin: chart.scales.x.min, xMax: chart.scales.x.max,
    yMin: chart.scales.y.min, yMax: chart.scales.y.max
  };
  if (chart) chart.destroy();
  chartTab = 'bei';
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: activeSeries.map(s => ({
        label: s.label,
        data: s.data,
        borderColor: s.color,
        backgroundColor: s.color,
        borderWidth: s.w,
        pointRadius: s.curve ? (s.markerR ?? 0) : s.r,
        pointHoverRadius: s.curve ? 5 : undefined,
        pointStyle: s.style,
        tension: s.curve ? 0.3 : 0.1,
        hidden: !getBeiSeriesVisibility(s.label)
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: xScale,
        y: { type: 'linear', title: { display: true, text: 'Breakeven Inflation (%)' }, min: minY, max: maxY, grid: { color: GRID_COLOR }, ticks: { stepSize: 0.25, callback: (v) => v.toFixed(2) } }
      },
      plugins: {
        legend: {
          labels: { filter: (item) => !item.hidden, usePointStyle: true, boxWidth: 8, padding: 15, font: { size: 13, weight: '500' } },
          onClick: null
        },
        zoom: {
          pan: { enabled: true, mode: 'xy' },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy', onZoomComplete: ({chart}) => rescaleToVisible(chart) }
        },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,0.95)', titleColor: '#1e293b', bodyColor: '#475569', borderColor: '#e2e8f0', borderWidth: 1, padding: 8, cornerRadius: 6, displayColors: false,
          callbacks: {
            title: (items) => {
              const ms = xAxisMode === 'ttm'
                ? now + items[0].parsed.x * 7 * 86400000
                : items[0].parsed.x;
              const yrs = (ms - now) / (365.25 * 86400000);
              return `${fmtDateMDY(new Date(ms))} · ${yrs.toFixed(1)}y`;
            },
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`
          }
        }
      }
    }
  });

  if (zoomToRestore) {
    chart.options.scales.x.min = zoomToRestore.xMin;
    chart.options.scales.x.max = zoomToRestore.xMax;
    chart.options.scales.y.min = zoomToRestore.yMin;
    chart.options.scales.y.max = zoomToRestore.yMax;
    chart.update('none');
  } else {
    rescaleToVisible(chart);
  }

  setupAxisWheelZoom(chart.canvas, ({chart}) => rescaleToVisible(chart), ({chart, factor}) => snapYAfterZoom(chart, factor));
}

function renderBeiTable(bonds) {
  const tbody = document.getElementById('beiTableBody');
  const fmtY = y => (y != null && !isNaN(y)) ? (y * 100).toFixed(3) + '%' : '—';
  tbody.innerHTML = bonds.map(b => `
    <tr>
      <td>${isoToMDY2(b.maturity)}</td>
      <td>${(b.coupon * 100).toFixed(3)}%</td>
      <td>${fmtY(b.askYield)}</td>
      <td>${fmtY(b.saYield)}</td>
      <td>${fmtY(b.saoYield)}</td>
      <td>${isoToMDY2(b.nominalMaturity)}</td>
      <td>${(b.nominalCoupon * 100).toFixed(3)}%</td>
      <td>${fmtY(b.nominalYield)}</td>
      <td>${fmtY(b.beiAsk)}</td>
      <td>${fmtY(b.beiSa)}</td>
      <td style="font-weight:700; color:#1a56db;">${fmtY(b.beiSao)}</td>
    </tr>`).join('');
}


// ─── Spread Mode ─────────────────────────────────────────────────────────────

function updateModeToggle() {
  const isBei = activeTab === 'bei';
  const hasMarket = activeTab === 'tips' ? !!marketTipsData : !!marketNominalsData;
  const spreadBtn = document.querySelector('#chart-mode-tabs .tab-btn[data-mode="spread"]');
  if (!spreadBtn) return;
  // BEI has no bid/ask-spread concept — always disabled there, regardless of Market data.
  spreadBtn.disabled = isBei || !hasMarket;
  if ((isBei || !hasMarket) && spreadModeActive) {
    spreadModeActive = false;
    switchChartMode('yield');
  }
  const currentMode = spreadModeActive ? 'spread' : 'yield';
  document.querySelectorAll('#chart-mode-tabs .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === currentMode));
}

function switchChartMode(mode) {
  const isSpread = mode === 'spread';
  document.getElementById('yieldChartWrap').style.display = isSpread ? 'none' : '';
  const sw = document.getElementById('spreadChartWrap');
  sw.style.display = isSpread ? 'flex' : 'none';
  // Force synchronous reflow so Chart.js measures correct container size on next render
  if (isSpread) void sw.offsetWidth;
  if (!isSpread) {
    if (spreadChart1) { spreadChart1.destroy(); spreadChart1 = null; }
    if (spreadChart2) { spreadChart2.destroy(); spreadChart2 = null; }
  }
  const isBei = activeTab === 'bei';
  document.getElementById('tipsControls').style.display     = (activeTab === 'tips' && !isSpread) ? 'flex' : 'none';
  document.getElementById('nominalsControls').style.display = (activeTab === 'treasuries') ? 'flex' : 'none';
  document.getElementById('beiControls').style.display      = isBei ? 'flex' : 'none';

  // FedInvest is irrelevant in spread mode AND on the BEI tab (both use Market data only)
  const fedId = activeTab === 'treasuries' ? 'chkFedInvest' : 'chkTipsFed';
  const chkFed = document.getElementById(fedId);
  const lockFed = isSpread || isBei;
  if (chkFed) {
    const fedLabel = chkFed.closest('label');
    if (lockFed) {
      // Only save the original checked state when first entering a locked mode.
      // switchChartMode() is re-called on every tab switch while spread/BEI is
      // active, so we must not overwrite _savedChecked with the already-forced-false
      // value, or restoration on exit will incorrectly leave FedInvest unchecked.
      if (!chkFed.disabled) {
        chkFed._savedChecked = chkFed.checked;
      }
      chkFed.checked = false;
      chkFed.disabled = true;
      if (fedLabel) fedLabel.style.opacity = '0.4';
    } else {
      // Only restore checked state when actually leaving a locked mode (chkFed.disabled
      // means spread/BEI had forced it off). A plain tab switch must never touch checked —
      // that's how the user's FedInvest/Market selection carries over between tabs.
      if (chkFed.disabled) {
        chkFed.checked = chkFed._savedChecked !== undefined ? chkFed._savedChecked : false;
        chkFed._savedChecked = undefined;
      }
      chkFed.disabled = false;
      if (fedLabel) fedLabel.style.opacity = '';
    }
  }

  // BEI's Market/broker checkbox is locked ON too — it's the tab's sole data source
  // (both TIPS and nominal legs), not a toggle. Spread mode never touches this checkbox,
  // so any disabled state found here on entry/exit is BEI's own lock.
  const chkBroker = document.getElementById('chkTipsBroker');
  if (chkBroker) {
    const brokerLabel = chkBroker.closest('label');
    if (isBei) {
      if (!chkBroker.disabled) chkBroker._savedChecked = chkBroker.checked;
      chkBroker.checked = !!marketTipsData;
      chkBroker.disabled = true;
      if (brokerLabel) brokerLabel.style.opacity = '0.4';
    } else if (chkBroker._savedChecked !== undefined) {
      chkBroker.checked = chkBroker._savedChecked;
      chkBroker.disabled = !marketTipsData;
      if (brokerLabel) brokerLabel.style.opacity = marketTipsData ? '' : '0.4';
      chkBroker._savedChecked = undefined;
    }
  }
}

// A point counts as an outlier for axis-bounds purposes only if it falls
// outside the IQR fence computed from its own nearby-maturity neighbors —
// the same "local fence" idea _kernelAverageTrend uses so an isolated spike
// doesn't skew its own local average. A single fence over the *whole* series
// doesn't work for either chart here: it's too loose to catch a spike that's
// only extreme relative to its tight neighborhood (a lone near-maturity
// blip), and it's too tight when most of the series sits in one dense low
// cluster and a real, gradual trend (e.g. price spread widening through the
// long end) is high only relative to that unrelated cluster, not to its own
// neighbors — a whole-series fence wrongly hides that entire genuine rise.
function _localOutlierMask(points, bandwidthYears = 1.5, minPoints = 4) {
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const bandwidth = bandwidthYears * _YEAR_MS;
  return points.map((p, i) => {
    const dists = xs.map(x => Math.abs(x - p.x));
    let idxs = dists.reduce((acc, d, j) => { if (d <= bandwidth && j !== i) acc.push(j); return acc; }, []);
    if (idxs.length < minPoints) {
      idxs = dists.map((d, j) => j).filter(j => j !== i).sort((a, b) => dists[a] - dists[b]).slice(0, minPoints);
    }
    if (idxs.length < 4) return false;
    const fence = iqrClipBounds(idxs.map(j => ys[j]), 0);  // no minimum fence — spread values are small-magnitude
    return fence ? (p.y < fence.lo || p.y > fence.hi) : false;
  });
}
// Shared by initial chart creation and every rescale (zoom/pan/reset/legend
// toggle) so "clip outliers" means the same thing everywhere, not just on
// first load — mirrors the pattern rescaleToVisible() uses for the Yield
// Curves chart.
function _clippedYRange(points, shouldClip) {
  const ys = points.map(p => p.y);
  if (!shouldClip || points.length < 4) return { min: Math.min(...ys), max: Math.max(...ys) };
  const mask = _localOutlierMask(points);
  const kept = points.filter((p, i) => !mask[i]).map(p => p.y);
  const yForScale = kept.length > 0 ? kept : ys;
  return { min: Math.min(...yForScale), max: Math.max(...yForScale) };
}
function _rescaleSpread(chartInst) {
  const xMin = chartInst.scales.x.min, xMax = chartInst.scales.x.max;
  const visPts = [];
  chartInst.data.datasets.forEach((ds, i) => {
    if (!chartInst.isDatasetVisible(i)) return;
    if (ds.type === 'line') return; // trend line, not raw data — exclude from outlier fence
    ds.data.forEach(p => { if (p.x >= xMin && p.x <= xMax) visPts.push(p); });
  });
  if (visPts.length === 0) return;
  const range = _clippedYRange(visPts, chartInst._clipOutliers);
  const bounds = snapYBounds(range.min, range.max);
  chartInst.options.scales.y.min = bounds.min;
  chartInst.options.scales.y.max = bounds.max;
  chartInst.options.scales.y.ticks.stepSize = bounds.step;
  chartInst.update('none');
}

// Kernel-weighted local average (Nadaraya-Watson) over a series sorted by
// maturity date — draws a smooth trend line giving a visual impression of the
// average spread by maturity. Evaluated on an evenly-spaced grid (not at the
// original, unevenly-spaced data points) so the curve itself renders smoothly
// regardless of how clustered the underlying data is (e.g. Bills bunching at
// the short end vs. Bonds spread thinly across decades). Unlike a locally
// weighted *regression* (LOESS), a weighted average can never overshoot the
// data in its window, so it stays visually calm even where a series has few,
// noisy points (e.g. Bills/Notes at the short end) instead of zigzagging.
//
// Bandwidth is a fixed, *absolute* maturity distance (years), not a fraction
// of the series' own x-range and not a fixed point count. A fraction of the
// full range (e.g. 20% of a ~30yr curve ≈ 6yrs) is wide enough to smooth the
// densely-packed short end, but on the same series it is still far wider than
// the ~1-2yr spacing of the sparse long end — so it washes out real swings
// that happen point-to-point out there (e.g. a rise into 2052 followed by a
// sharp drop by 2053). A small fixed point count (k-nearest) overcorrects the
// other way: in a dense cluster the k nearest points span too short a
// distance, so it starts chasing per-bond noise instead of the local average.
// A fixed absolute-distance window adapts the way both those failed to: at a
// ~1-2yr bandwidth, a densely-packed region (many points per year) still
// pulls in a wide, smoothing set of neighbors, while a sparse tail (~1 point
// per year) pulls in only the couple of points actually nearby, so the curve
// tracks them almost point-for-point.
//
// Yields on soon-to-mature TIPS are notoriously erratic (thin liquidity right
// before maturity) — most often the very first bond to mature, since it's the
// one furthest into that illiquid window. A *global* IQR fence over the whole
// series can't catch this reliably: it's too loose to flag a spike that's
// only extreme relative to its own tight neighborhood (a single spike inside
// a dense cluster), and it can wrongly suppress two genuinely close, mutually
// -corroborating points whose *level* just happens to be extreme relative to
// the rest of the series (e.g. a real local peak at the sparse long end).
// So the fence is computed fresh per grid point, from just the points inside
// that point's own window — using the same `iqrClipBounds` helper the Y-axis
// "Clip Outliers" scaling already uses, so there's one definition of "outlier
// fence" for the whole app. This only reshapes the fitted line; the raw
// scatter points are never altered.
const _YEAR_MS = 365.25 * 24 * 3600 * 1000;
function _kernelAverageTrend(points, bandwidthYears = 1.5, gridSize = 200, minPoints = 3) {
  const n = points.length;
  if (n < 5) return null;
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const xs = sorted.map(p => p.x), ys = sorted.map(p => p.y);
  const xMin = xs[0], xMax = xs[n - 1];
  if (xMax === xMin) return null;
  const bandwidth = bandwidthYears * _YEAR_MS;

  const trend = [];
  for (let g = 0; g < gridSize; g++) {
    const gx = xMin + (xMax - xMin) * g / (gridSize - 1);
    const dists = xs.map(x => Math.abs(x - gx));

    // All points within the fixed bandwidth; if too few (sparse tail), fall
    // back to the nearest `minPoints` regardless of distance.
    let idxs = dists.reduce((acc, d, i) => { if (d <= bandwidth) acc.push(i); return acc; }, []);
    let h = bandwidth;
    if (idxs.length < Math.min(minPoints, n)) {
      idxs = dists.map((d, i) => i).sort((a, b) => dists[a] - dists[b]).slice(0, minPoints);
      h = Math.max(...idxs.map(i => dists[i])) || 1;
    }

    // Clip this window's y-values to their own local IQR fence before
    // averaging — an outlier only relative to its immediate neighbors still
    // gets tamed, without touching a level that's normal for its own window.
    const windowYs = idxs.map(i => ys[i]);
    const fence = idxs.length >= 4 ? iqrClipBounds(windowYs, 0) : null;

    // Tricube-weighted average of y within the local window.
    let sumW = 0, sumWY = 0;
    for (const i of idxs) {
      const u = Math.min(dists[i] / h, 1);
      const w = (1 - u * u * u) ** 3;
      const y = fence ? Math.min(fence.hi, Math.max(fence.lo, ys[i])) : ys[i];
      sumW += w; sumWY += w * y;
    }
    trend.push({ x: gx, y: sumWY / sumW });
  }
  return trend;
}

function _makeSpreadChart(ctx, seriesDef, yAxisLabel, yUnit, shouldClip) {
  const allPoints = seriesDef.flatMap(s => s.data);
  if (allPoints.length === 0) return null;
  const _startDt = parseIsoInput(document.getElementById('startMaturity').value);
  const _endDt   = parseIsoInput(document.getElementById('endMaturity').value);
  const allX = allPoints.map(d => d.x);
  const minDate = new Date(Math.min(...allX));
  const maxDate = new Date(Math.max(...allX));
  const minX = _startDt
    ? new Date(_startDt.getFullYear(), _startDt.getMonth(), 1).getTime()
    : new Date(minDate.getFullYear(), 0, 1).getTime();
  const maxX = _endDt
    ? new Date(_endDt.getFullYear(), _endDt.getMonth() + 1, 1).getTime()
    : new Date(maxDate.getFullYear() + 1, 0, 1).getTime();
  // IQR-clip Y axis to suppress near-maturity outliers (respects Clip Outliers checkbox)
  const initRange = _clippedYRange(allPoints, shouldClip);
  const initBounds = snapYBounds(initRange.min, initRange.max);

  const newChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        ...seriesDef.map(s => ({
          label: s.label, data: s.data,
          backgroundColor: s.color, borderColor: s.color, borderWidth: 1.5,
          pointStyle: 'crossRot',
          pointRadius: s.r + 1.5, pointHoverRadius: s.r + 3,
        })),
        ...seriesDef.filter(s => s.trend).map(s => ({
          type: 'line',
          label: `${s.label} (Avg)`,
          data: s.trend,
          borderColor: s.color,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0, pointHoverRadius: 0,
          tension: 0.15,
          order: -1,
        })),
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: 'nearest', axis: 'xy', intersect: false },
      scales: {
        x: {
          type: 'time', min: minX, max: maxX,
          time: xAxisMode === 'ttm' ? { displayFormats: {} } : { displayFormats: { year: 'yyyy', month: 'MMM yyyy' } },
          grid: { color: GRID_COLOR },
          ...(xAxisMode === 'ttm'
            ? { ticks: { autoSkip: true, maxRotation: 0, callback: (val, idx, ticks) => { if (!ticks || ticks.length < 2) return ttmLabel(val); const spanDays = (ticks[ticks.length-1].value - ticks[0].value) / 86400000; const days = (val - Date.now()) / 86400000; if (days <= 0) return ''; if (spanDays <= 91) return `${Math.round(days / 7)}w`; if (spanDays <= 365) return `${Math.round(days / 30.44)}m`; const yrs = days / 365.25; const wy = Math.floor(yrs); const rm = Math.round((yrs - wy) * 12); if (rm === 0) return `${wy}y`; if (rm === 12) return `${wy + 1}y`; if (wy === 0) return `${rm}m`; return `${wy}y ${rm}m`; } } }
            : calendarTimeAxis({ gridColor: GRID_COLOR })
          ),
        },
        y: {
          type: 'linear', title: { display: true, text: yAxisLabel },
          min: initBounds.min, max: initBounds.max,
          grid: { color: GRID_COLOR },
          ticks: { stepSize: initBounds.step, callback: v => v.toFixed(2) }
        }
      },
      plugins: {
        legend: {
          labels: { usePointStyle: true, boxWidth: 8, padding: 12, font: { size: 11, weight: '500' } },
          onClick: (e, legendItem, legend) => { Chart.defaults.plugins.legend.onClick(e, legendItem, legend); _rescaleSpread(legend.chart); }
        },
        zoom: {
          pan: { enabled: true, mode: 'xy' },
          zoom: {
            wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy',
            onZoomComplete: ({ chart }) => _rescaleSpread(chart)
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,0.95)', titleColor: '#1e293b', bodyColor: '#475569',
          borderColor: '#e2e8f0', borderWidth: 1, padding: 8, cornerRadius: 6, displayColors: false,
          callbacks: {
            title: items => {
              const ms = items[0].parsed.x;
              return `${fmtDateMDY(new Date(ms))} (${ttmLabel(ms)})`;
            },
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(3)}${yUnit}`
          }
        }
      }
    }
  });
  newChart._clipOutliers = shouldClip;
  return newChart;
}

function renderSpreadCharts(bonds, tab) {
  if (spreadChart1) { spreadChart1.destroy(); spreadChart1 = null; }
  if (spreadChart2) { spreadChart2.destroy(); spreadChart2 = null; }
  const ctx1 = document.getElementById('spreadYieldChart').getContext('2d');
  const ctx2 = document.getElementById('spreadPriceChart').getContext('2d');
  const toPt = (b, key) => ({ x: b.maturityDate.getTime(), y: parseFloat(b[key].toFixed(4)) });

  const pushSeries = (arr, label, data, color, r) => {
    if (data.length) arr.push({ label, data, color, r, trend: _kernelAverageTrend(data) });
  };

  const yieldSeries = [], priceSeries = [];
  if (tab === 'tips') {
    const valid = bonds.filter(b => !isNaN(b.yieldSpreadBps));
    const validP = bonds.filter(b => !isNaN(b.priceSpreadPct));
    pushSeries(yieldSeries, 'Yield Spread', valid.map(b => toPt(b, 'yieldSpreadBps')), '#1a56db', 1.5);
    pushSeries(priceSeries, 'Price Spread', validP.map(b => toPt(b, 'priceSpreadPct')), '#059669', 1.5);
  } else {
    const types = [
      { type: 'MARKET BASED BILL',  label: 'Bills',  yc: '#0ea5e9', pc: '#38bdf8', r: 1.25 },
      { type: 'MARKET BASED NOTE',  label: 'Notes',  yc: '#1a56db', pc: '#60a5fa', r: 1.25 },
      { type: 'MARKET BASED BOND',  label: 'Bonds',  yc: '#7c3aed', pc: '#a78bfa', r: 1.25 },
      { type: 'MARKET BASED STRIPS', label: 'STRIPS', yc: '#64748b', pc: '#94a3b8', r: 1   },
      { type: 'MARKET BASED UNCLASSIFIED', label: 'Unclassified', yc: '#b45309', pc: '#eab308', r: 1 },
    ];
    for (const { type, label, yc, pc, r } of types) {
      const yb = bonds.filter(b => b.type === type && !isNaN(b.yieldSpreadBps));
      const pb = bonds.filter(b => b.type === type && !isNaN(b.priceSpreadPct));
      pushSeries(yieldSeries, label, yb.map(b => toPt(b, 'yieldSpreadBps')), yc, r);
      pushSeries(priceSeries, label, pb.map(b => toPt(b, 'priceSpreadPct')), pc, r);
    }
  }

  const shouldClip = tab === 'tips' ? true : nominalsClipOutliers;
  spreadChart1 = _makeSpreadChart(ctx1, yieldSeries, 'Yield Spread (bps)', ' bps', shouldClip);
  spreadChart2 = _makeSpreadChart(ctx2, priceSeries, 'Price Spread (%)', '%', shouldClip);

  // Wire axis-aware wheel zoom (mirrors yield curve chart behaviour)
  if (spreadChart1) setupAxisWheelZoom(document.getElementById('spreadYieldChart'), ({ chart }) => _rescaleSpread(chart), ({ chart, factor }) => snapYAfterZoom(chart, factor));
  if (spreadChart2) setupAxisWheelZoom(document.getElementById('spreadPriceChart'), ({ chart }) => _rescaleSpread(chart), ({ chart, factor }) => snapYAfterZoom(chart, factor));

  // Ensure correct sizing if container was hidden during chart creation
  requestAnimationFrame(() => {
    if (spreadChart1) spreadChart1.resize();
    if (spreadChart2) spreadChart2.resize();
  });

}

function renderSpreadTable(bonds, tab) {
  const fmtP  = v => isNaN(v) ? '—' : v.toFixed(3);
  const fmtY  = v => (v != null && !isNaN(v)) ? (v * 100).toFixed(3) + '%' : '—';
  const fmtBps = v => isNaN(v) ? '—' : v.toFixed(1);
  const fmtPct = v => isNaN(v) ? '—' : v.toFixed(4) + '%';

  if (tab === 'tips') {
    const tbody = document.getElementById('tableBody');
    const thead = document.querySelector('#saTable thead tr');
    window._currentBonds = bonds;
    thead.innerHTML = `
      <th>Maturity</th><th>CUSIP</th><th>Coupon</th>
      <th>Bid Price (Adj)</th><th>Ask Price (Adj)</th><th>Price Spread %</th>
      <th>Bid Yield</th><th>Ask Yield</th><th>Yield Spread (bps)</th>`;
    tbody.innerHTML = bonds.map(b => `
      <tr>
        <td>${fmtMMM(b.maturity)}</td>
        <td>${b.cusip}</td>
        <td>${(b.coupon * 100).toFixed(3)}%</td>
        <td>${fmtP(b.adjBidPrice)}</td>
        <td>${fmtP(b.adjAskPrice)}</td>
        <td>${fmtPct(b.priceSpreadPct)}</td>
        <td>${fmtY(b.bidYield)}</td>
        <td>${fmtY(b.askYield)}</td>
        <td>${fmtBps(b.yieldSpreadBps)}</td>
      </tr>`).join('');
  } else {
    const tbody = document.getElementById('nominalsTableBody');
    const thead = document.querySelector('#nominalsTable thead tr');
    const shortType = t => t === 'MARKET BASED BILL' ? 'Bill' : t === 'MARKET BASED NOTE' ? 'Note' : t === 'MARKET BASED BOND' ? 'Bond' : t === 'MARKET BASED UNCLASSIFIED' ? 'Unclassified' : 'STRIPS';
    thead.innerHTML = `
      <th>Maturity</th><th>CUSIP</th><th>Type</th><th>Coupon</th>
      <th>Bid Price</th><th>Ask Price</th><th>Price Spread %</th>
      <th>Bid Yield</th><th>Ask Yield</th><th>Yield Spread (bps)</th>`;
    tbody.innerHTML = bonds.map(b => `
      <tr>
        <td>${isoToMDY(b.maturity)}</td>
        <td>${b.cusip}</td>
        <td>${shortType(b.type)}</td>
        <td>${(b.coupon * 100).toFixed(3)}%</td>
        <td>${fmtP(b.bidPrice)}</td>
        <td>${fmtP(b.price)}</td>
        <td>${fmtPct(b.priceSpreadPct)}</td>
        <td>${fmtY(b.bidYield)}</td>
        <td>${fmtY(b.yield)}</td>
        <td>${fmtBps(b.yieldSpreadBps)}</td>
      </tr>`).join('');
  }
}

// ─── Interaction Handlers ────────────────────────────────────────────────────

// TIPS 'Show' Checkboxes & Links
const TIPS_SHOW = { showTipsAsk: 'Ask', showTipsSa: 'SA', showTipsSao: 'SAO', showTipsSpot: 'Spot', showTipsSpotSa: 'SpotSA', showTipsGsw: 'GSW' };
if (SHOW_GSW) document.getElementById('tipsGswShow').style.display = 'flex';
Object.keys(TIPS_SHOW).forEach((id) => {
  document.getElementById(id).addEventListener('change', (e) => {
    if (!chart || activeTab !== 'tips') return;
    const seriesKey = TIPS_SHOW[id];
    chart.data.datasets.forEach((ds, i) => {
      if (tipsSeriesKey(ds.label) === seriesKey) chart.setDatasetVisibility(i, e.target.checked);
    });
    chart.update('none');
    rescaleToVisible(chart);
    renderTable(tipsTableFed, tipsTableBroker);
  });
});

document.getElementById('tipsShowAll').onclick = (e) => {
  e.preventDefault();
  Object.keys(TIPS_SHOW).forEach(id => {
    const el = document.getElementById(id);
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
};
document.getElementById('tipsShowNone').onclick = (e) => {
  e.preventDefault();
  Object.keys(TIPS_SHOW).forEach(id => {
    const el = document.getElementById(id);
    el.checked = false;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
};

// BEI 'Show' Checkboxes & Links
const BEI_SHOW = { showBeiAsk: 'Ask BEI', showBeiSa: 'SA BEI', showBeiSao: 'SAO BEI', showBeiSpot: 'Spot BEI' };
Object.keys(BEI_SHOW).forEach((id) => {
  document.getElementById(id).addEventListener('change', (e) => {
    if (!chart || activeTab !== 'bei') return;
    const seriesKey = BEI_SHOW[id];
    chart.data.datasets.forEach((ds, i) => {
      if (ds.label === seriesKey) chart.setDatasetVisibility(i, e.target.checked);
    });
    chart.update('none');
    rescaleToVisible(chart);
  });
});

document.getElementById('beiShowAll').onclick = (e) => {
  e.preventDefault();
  ['showBeiAsk', 'showBeiSa', 'showBeiSao', 'showBeiSpot'].forEach(id => {
    const el = document.getElementById(id);
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
};
document.getElementById('beiShowNone').onclick = (e) => {
  e.preventDefault();
  ['showBeiAsk', 'showBeiSa', 'showBeiSao', 'showBeiSpot'].forEach(id => {
    const el = document.getElementById(id);
    el.checked = false;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
};

// Nominals 'All/None' Links — Spot is treated as a fifth security type here: Ask has no
// checkbox of its own (it is implied by any of the other four), so Spot is the only other
// thing All/None has to cover.
// filterUnclassified is skipped when its row is hidden (no unrecognized CUSIP occurred) --
// touching a checkbox nobody can see, and that carries no matching data either way, would
// only reintroduce the "hidden but counted as on" inconsistency the load-time wiring avoids.
document.getElementById('nominalsShowAll').onclick = (e) => {
  e.preventDefault();
  ['filterBills', 'filterNotes', 'filterBonds', 'filterStrips', 'filterUnclassified', 'showTsySpot'].forEach(id => {
    if (id === 'filterUnclassified' && document.getElementById('filterUnclassifiedRow').style.display === 'none') return;
    const el = document.getElementById(id);
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
};
document.getElementById('nominalsShowNone').onclick = (e) => {
  e.preventDefault();
  ['filterBills', 'filterNotes', 'filterBonds', 'filterStrips', 'filterUnclassified', 'showTsySpot'].forEach(id => {
    if (id === 'filterUnclassified' && document.getElementById('filterUnclassifiedRow').style.display === 'none') return;
    const el = document.getElementById(id);
    el.checked = false;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
};



// Snapshot the current view so the next processAndRender() restores it instead of
// auto-fitting. Used by source toggles: adding/removing a source rebuilds the chart,
// but should not change the scale — same as showing/hiding a series.
function preserveZoom() {
  if (chart && chartTab) {
    savedZoom[chartTab] = {
      xMin: chart.scales.x.min, xMax: chart.scales.x.max,
      yMin: chart.scales.y.min, yMax: chart.scales.y.max,
    };
  }
}

// Unified Source Change Handlers
// FedInvest/Market selections are shared concepts across tabs (TIPS vs Treasuries),
// so toggling one tab's checkbox mirrors the same on/off state onto the other tab's
// corresponding checkbox (only if that counterpart's data has loaded).
const CHECKBOX_MIRROR = {
  chkTipsFed: 'chkFedInvest', chkFedInvest: 'chkTipsFed',
  chkTipsBroker: 'chkMarket', chkMarket: 'chkTipsBroker',
};
function mirrorCheckbox(id) {
  const counterpart = document.getElementById(CHECKBOX_MIRROR[id]);
  if (!counterpart.disabled) counterpart.checked = document.getElementById(id).checked;
}
['chkTipsFed', 'chkTipsBroker', 'chkFedInvest', 'chkMarket'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    mirrorCheckbox(id);
    preserveZoom();
    updateModeToggle();
    processAndRender();
  });
});

// Chart Mode Toggle
document.getElementById('chart-mode-tabs').addEventListener('click', e => {
  const btn = e.target.closest('.tab-btn[data-mode]');
  if (!btn || btn.disabled) return;
  const mode = btn.dataset.mode;
  if (spreadModeActive === (mode === 'spread')) return;
  spreadModeActive = (mode === 'spread');
  document.querySelectorAll('#chart-mode-tabs .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  switchChartMode(mode);
  processAndRender();
});

document.getElementById('tableBody').addEventListener('click', (e) => {
  const td = e.target.closest('td.drillable');
  if (!td) return;
  if (td.dataset.drill === 'sa') _showSaDrill(td.dataset.cusip);
  else if (td.dataset.drill === 'sao') _showSaoDrill(td.dataset.cusip);
});

document.addEventListener('click', (e) => {
  const link = e.target.closest('a.col-help');
  if (link) {
    e.preventDefault();
    _showColHelp(link.dataset.col);
  }
});

document.getElementById('saTable').querySelector('thead').addEventListener('click', (e) => {
  const th = e.target.closest('th[data-sort]');
  if (!th) return;
  const col = th.dataset.sort;
  if (tipsSort.col === col) {
    tipsSort.dir = tipsSort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    tipsSort.col = col;
    tipsSort.dir = (col === 'maturity' || col === 'term') ? 'asc' : 'desc';
  }
  renderTable(tipsTableFed, tipsTableBroker);
});

// Column header hover explainer. A header click now sorts, so hover is the only way to reach
// the COL_HELP entries (TipsLadderManager's data-tip-html/#bracket-tooltip mechanism, applied
// here directly against COL_HELP rather than an encoded attribute).
const colTip = document.getElementById('col-tooltip');
function _showColTip(th) {
  const entry = COL_HELP[th.dataset.tip];
  if (!entry) return;
  colTip.innerHTML = `<b>${entry.title}</b>${entry.html}`;
  colTip.style.display = 'block';
  const r = th.getBoundingClientRect();
  const maxLeft = window.innerWidth - colTip.offsetWidth - 12;
  colTip.style.left = Math.max(8, Math.min(r.left, maxLeft)) + 'px';
  colTip.style.top = (r.bottom + 6) + 'px';
}
function _hideColTip() { colTip.style.display = 'none'; }
[document.getElementById('saTable'), document.getElementById('nominalsTable')].forEach(tbl => {
  tbl.querySelector('thead').addEventListener('mouseover', e => {
    const th = e.target.closest('th[data-tip]');
    if (th) _showColTip(th);
  });
  tbl.querySelector('thead').addEventListener('mouseout', e => {
    const th = e.target.closest('th[data-tip]');
    if (th && !th.contains(e.relatedTarget)) _hideColTip();
  });
});

document.getElementById('tab-bar').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (btn) switchTab(btn.dataset.tab);
});

const typeCheckboxMap = {
  'filterBills': 'MARKET BASED BILL',
  'filterNotes': 'MARKET BASED NOTE',
  'filterBonds': 'MARKET BASED BOND',
};
document.getElementById('nominalsTable').querySelector('thead').addEventListener('click', (e) => {
  const th = e.target.closest('th[data-sort]');
  if (!th) return;
  const col = th.dataset.sort;
  if (nominalsSort.col === col) {
    nominalsSort.dir = nominalsSort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    nominalsSort.col = col;
    nominalsSort.dir = col === 'yield' ? 'desc' : 'asc';
  }
  processAndRenderNominals();
});

// Recomputes the Maturity Range fields to the union of every currently checked selection's
// own maturities (security types and Spot) — this is what "checking a type" means for the
// range: it changes to match the current set of selections, growing or shrinking as needed,
// the same way checking Bonds already reached out to the long end before Spot existed as a
// checkbox. A manually typed range still works between checkbox changes, but the next one
// recomputes over it (YieldCurves/knowledge/3.2_Render_Charts_And_Tables.md#draw-treasuries, 3.2.3).
function recomputeRangeFromChecked() {
  const startEl = document.getElementById('startMaturity');
  const endEl = document.getElementById('endMaturity');
  const typeMatches = nominalTypeShown;
  const candidates = [];
  if (fedNominalsData) candidates.push(...fedNominalsData.filter(typeMatches));
  if (marketNominalsData) candidates.push(...marketNominalsData.filter(typeMatches));
  if (document.getElementById('showTsySpot').checked) {
    if (fedNominalsData) candidates.push(...fedNominalsData.filter(isSpotFitType));
    if (marketNominalsData) candidates.push(...marketNominalsData.filter(isSpotFitType));
  }
  if (candidates.length === 0) { startEl.value = ''; endEl.value = ''; return; }
  const minB = candidates.reduce((a, b) => a.maturityDate <= b.maturityDate ? a : b);
  const maxB = candidates.reduce((a, b) => a.maturityDate >= b.maturityDate ? a : b);
  startEl.value = minB.maturity;
  endEl.value = maxB.maturity;
}

document.getElementById('nominalsControls').addEventListener('change', (e) => {
  if (e.target.id === 'clipOutliers') {
    nominalsClipOutliers = e.target.checked;
    savedZoom['treasuries'] = null;
    processAndRenderNominals();
    return;
  }
  // Spot is a security type for charting purposes — same range recompute and auto-rescale
  // treatment as Bills/Notes/Bonds/STRIPS below.
  if (e.target.id === 'showTsySpot') {
    recomputeRangeFromChecked();
    savedZoom['treasuries'] = null;
    processAndRenderNominals();
    return;
  }
  if (e.target.id === 'filterStrips') {
    nominalsShowStrips = e.target.checked;
    recomputeRangeFromChecked();
    savedZoom['treasuries'] = null;
    processAndRenderNominals();
    return;
  }
  if (e.target.id === 'filterUnclassified') {
    nominalsShowUnclassified = e.target.checked;
    recomputeRangeFromChecked();
    savedZoom['treasuries'] = null;
    processAndRenderNominals();
    return;
  }
  const type = typeCheckboxMap[e.target.id];
  if (!type) return;
  if (e.target.checked) nominalsTypeFilters.add(type);
  else nominalsTypeFilters.delete(type);
  recomputeRangeFromChecked();
  savedZoom['treasuries'] = null;
  processAndRenderNominals();
});

document.getElementById('beiClipOutliers').addEventListener('change', (e) => {
  beiClipOutliers = e.target.checked;
  savedZoom['bei'] = null;
  processAndRenderBei();
});

init();
