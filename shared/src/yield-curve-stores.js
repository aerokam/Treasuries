// yield-curve-stores.js -- builds the three stores of
// knowledge/1.3_Calculate_Yield_Curve_Data_Sets.md (1.3) as text: Yield curves (S13),
// Breakeven inflation (S14) and Bid and ask spreads (S15), knowledge/DATA_DICTIONARY.md#s13,
// #s14 and #s15.
//
// Pure: the inputs are the texts of the four stores 1.3 reads, the outputs are the texts of the
// three it writes, and nothing is fetched or uploaded here. YieldCurves/scripts/updateYieldCurveDataSets.js
// fetches the inputs, calls buildYieldCurveStores and uploads the outputs. Every calculation is
// the one implementation in shared/src/ (no-redundancy directive, projects/CLAUDE.md §2a); what
// this module decides is which securities go in which store, the order of the rows and the layout
// of the files.
//
// Every store read here is read by header name, with the lines before the header skipped by
// finding the header line (csv.js#parseCsvWithPreamble).
import { termYears } from './bond-math.js';
import { tipsYieldsFromPrices } from './tips-yields.js';
import { saYieldsFromTipsYields } from './sa-yields.js';
import { treasuryYieldsFromPrices } from './treasury-yields.js';
import { addTipsSpreads, addTreasurySpreads } from './spreads.js';
import { findClosestNominal, spotBreakevenAcrossTerms } from './breakeven.js';
import { parseCsv, parseCsvWithPreamble } from './csv.js';
import { localDate, marketSettleIso, parseHolidaySet } from './settlement.js';
import { classifyByCusipRoot, isStrip } from './treasury-cusip.js';
import { parseDownloadDate, parseTipsQuotes, parseTreasuryQuotes } from './market-quotes.js';
import { parseFedInvestPrices } from './fedinvest-prices.js';
import {
  spotCurveFit, calculateSAO, zToSA, unionGridTerms,
  TREASURIES_SPOT_FIT, TIPS_SPOT_FIT, TIPS_SA_SPOT_FIT,
} from './spot-curve.js';

export const FEDINVEST = 'FedInvest';
export const MARKET = 'Market';

// Half-year grid of the spot rows -- the grid of 1.3.4 and of the chart.
export const GRID_STEP_YRS = 0.5;

// ─── Layout of the three files ───────────────────────────────────────────────

// S13 columns, in file order: [header, key of the row object].
export const S13_COLUMNS = [
  ['CUSIP', 'cusip'], ['Source', 'source'], ['Maturity', 'maturity'], ['Term (y)', 'term'], ['Type', 'type'],
  ['Coupon', 'coupon'], ['Price', 'price'], ['Ask', 'ask'], ['SA', 'sa'], ['SAO', 'sao'],
  ['Settlement Date SA Factor', 'settleSaFactor'], ['Naive Maturity SA Factor', 'naiveMaturitySaFactor'],
  ['Maturity SA Factor', 'maturitySaFactor'], ['SA Price Factor', 'saPriceFactor'], ['SA Price', 'saPrice'],
  ['Spot', 'spot'], ['Spot SA', 'spotSa'],
];
export const S13_HEADER = S13_COLUMNS.map(c => c[0]).join(',');

// S14 columns, in file order: [header, key of the row object parseBreakevenCsv returns].
export const S14_COLUMNS = [
  ['TIPS CUSIP', 'tipsCusip'], ['TIPS Maturity', 'tipsMaturity'], ['TIPS Coupon', 'tipsCoupon'],
  ['TIPS Ask', 'tipsAsk'], ['TIPS SA', 'tipsSa'], ['TIPS SAO', 'tipsSao'],
  ['Nominal CUSIP', 'nominalCusip'], ['Nominal Maturity', 'nominalMaturity'], ['Nominal Coupon', 'nominalCoupon'],
  ['Nominal Ask', 'nominalAsk'], ['Ask BEI', 'askBei'], ['SA BEI', 'saBei'], ['SAO BEI', 'saoBei'],
];
export const S14_HEADER = S14_COLUMNS.map(c => c[0]).join(',');

// S15 columns, in file order: [header, key of the row object parseSpreadsCsv returns].
export const S15_COLUMNS = [
  ['CUSIP', 'cusip'], ['Maturity', 'maturity'], ['Type', 'type'], ['Coupon', 'coupon'],
  ['Ask Yield', 'askYield'], ['Bid Yield', 'bidYield'], ['Yield Spread (bps)', 'yieldSpreadBps'],
  ['Ask Price', 'askPrice'], ['Bid Price', 'bidPrice'], ['Adjusted Ask Price', 'adjustedAskPrice'],
  ['Adjusted Bid Price', 'adjustedBidPrice'], ['Price Spread %', 'priceSpreadPct'],
];
export const S15_HEADER = S15_COLUMNS.map(c => c[0]).join(',');

// ─── Cell formats ────────────────────────────────────────────────────────────
const blank = v => v === '' || v == null || (typeof v === 'number' && !Number.isFinite(v));
export const fmtYield = v => blank(v) ? '' : Number(v).toFixed(7);
export const fmtTerm = v => blank(v) ? '' : Number(v).toFixed(3);
export const fmtCoupon = v => blank(v) ? '' : Number(v).toFixed(7);
// S4 stores the SA Factor to five decimal places; the factors of S13 are written to the same five.
export const fmtFactor = v => blank(v) ? '' : Number(v).toFixed(5);

// A Price is written with the decimals it is quoted to, at least three, and the SA Price with the
// same number of decimals, so the two columns agree row by row.
export function priceDecimals(price) {
  const s = String(price);
  if (/e/i.test(s)) return 6;
  const dot = s.indexOf('.');
  return Math.max(3, dot < 0 ? 0 : s.length - dot - 1);
}
export const fmtPrice = v => blank(v) ? '' : Number(v).toFixed(priceDecimals(v));

// The S15 number format: seven decimals, four for a value beyond +-10 (spreads in basis points, prices).
const fmtNum = v => blank(v) ? '' : Number(v).toFixed(v > 10 || v < -10 ? 4 : 7);

// ─── Row order ───────────────────────────────────────────────────────────────
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// S13 security rows: Maturity, Coupon, CUSIP, Term (y), Source.
export function compareSecurityRows(a, b) {
  return cmp(a.maturity, b.maturity) || cmp(a.coupon, b.coupon) || cmp(a.cusip, b.cusip)
    || cmp(a.term, b.term) || cmp(a.source, b.source);
}

// S13 spot rows: Type, Term (y), Source.
export function compareSpotRows(a, b) {
  return cmp(a.type, b.type) || cmp(a.term, b.term) || cmp(a.source, b.source);
}

// ─── S13 rows ────────────────────────────────────────────────────────────────
const termOf = (maturityStr, settlementStr) => termYears(localDate(settlementStr), localDate(maturityStr));

const FEDINVEST_TYPES = { 'MARKET BASED BILL': 'Bill', 'MARKET BASED NOTE': 'Note', 'MARKET BASED BOND': 'Bond' };

// The Type of a FedInvest nominal row: the security type S1 states (1.1.2), never Unclassified.
export function fedInvestNominalType(s1Type, cusip) {
  return FEDINVEST_TYPES[s1Type] || classifyByCusipRoot(cusip) || '';
}

// A security row of a nominal Treasury of treasury-yields.js or market-quotes.js (each carrying
// cusip, maturity, coupon, price and yield). `type` is Bill, Note, Bond, STRIPS or
// Unclassified; `settleStr` is the Settlement Date of the row's source.
export function nominalSecurityRow(b, source, type, settleStr) {
  return {
    cusip: b.cusip, source, maturity: b.maturity, term: termOf(b.maturity, settleStr), type,
    coupon: b.coupon, price: b.price, ask: b.yield,
  };
}

// A security row of a TIPS of sa-yields.js (and, once calculateSAO has run, carrying saoYield):
// the Ask, SA and SAO Yield and the five working values of the SA Yield.
export function tipsSecurityRow(b, source, settleStr) {
  return {
    cusip: b.cusip, source, maturity: b.maturity, term: termOf(b.maturity, settleStr), type: 'TIPS',
    coupon: b.coupon, price: b.price, ask: b.askYield, sa: b.saYield, sao: b.saoYield,
    settleSaFactor: b.saSettleFactor, naiveMaturitySaFactor: b.saNaiveMaturityFactor,
    maturitySaFactor: b.saMaturityFactor, saPriceFactor: b.saRatio, saPrice: b.saPrice,
  };
}

// Evaluate one fit's z(t) at a term, honouring the fit's valid range and sanity check.
// Returns a decimal yield, or null when the fit is missing, out of range, or blown up there.
function evalFitAt(fit, t) {
  if (!fit || t < fit.tMin - 1e-9 || t > fit.tMax + 1e-9) return null;
  const pct = zToSA(fit.z(t));
  return fit.sane(pct) ? pct / 100 : null;
}

// The spot rows of one source: three rows per term (Type Treasury, TIPS and BEI) across the union
// of the valid ranges of the three fits. A cell is blank where its fit is outside its valid range
// at that term or fails its sanity check, and the rest of the row is kept. The BEI cells are
// breakeven.js#spotBreakevenAcrossTerms (1.3.5 Across terms).
//
// fits   { nominal, tips, tips_sa }, each a spot-curve.js#spotCurveFit result or null
export function spotRowsFromFits(fits, source, stepYrs = GRID_STEP_YRS) {
  const { nominal: nomFit, tips: tipsFit, tips_sa: saFit } = fits;
  const present = [nomFit, tipsFit, saFit].filter(Boolean);
  if (!present.length) return [];
  const beiByTerm = (nom, tips) => new Map((spotBreakevenAcrossTerms(nom, tips) || []).map(p => [p.t, p.bei / 100]));
  const beiQuoted = beiByTerm(nomFit, tipsFit);
  const beiSa = beiByTerm(nomFit, saFit);
  const base = t => ({ cusip: 'Spot', source, maturity: '', term: t });
  const rows = [];
  for (const t of unionGridTerms(present, stepYrs)) {
    const nomVal = evalFitAt(nomFit, t);
    const tipsVal = evalFitAt(tipsFit, t);
    const saVal = evalFitAt(saFit, t);
    if (nomVal == null && tipsVal == null && saVal == null) continue;   // nothing valid at this term
    rows.push({ ...base(t), type: 'Treasury', spot: nomVal });
    rows.push({ ...base(t), type: 'TIPS', spot: tipsVal, spotSa: saVal });
    rows.push({ ...base(t), type: 'BEI',
      spot: beiQuoted.has(t) ? beiQuoted.get(t) : null, spotSa: beiSa.has(t) ? beiSa.get(t) : null });
  }
  return rows;
}

// ─── Date lines ──────────────────────────────────────────────────────────────
// dates  { fedInvest: { trade, settle }, market: { trade, settle } }
// The Market trade date is the Download Date ('YYYY-MM-DD HH:MM'), every other date 'YYYY-MM-DD'.
const dateLine = (label, source, date) => {
  if (!date) throw new Error(`${label} of ${source ?? MARKET} is missing`);
  return source == null ? `${label},${date}` : `${label},${source},${date}`;
};
// S14 and S15 are Market only: the date is in the second column, with no Source cell.
const marketDateLinesNoSource = dates => [
  dateLine('Trade Date', null, dates.market.trade),
  dateLine('Settlement Date', null, dates.market.settle),
];
const marketDateLines = dates => [
  dateLine('Trade Date', MARKET, dates.market.trade),
  dateLine('Settlement Date', MARKET, dates.market.settle),
];

// ─── S13 text ────────────────────────────────────────────────────────────────
// Four date lines, the header, the security rows in order of Maturity, Coupon, CUSIP, Term (y) and
// Source, then the spot rows in order of Type, Term (y) and Source. The TIPS-only columns are blank
// on every other row.
export function buildYieldCurvesCsv({ dates, securityRows, spotRows }) {
  const cells = r => [
    r.cusip, r.source, r.maturity, fmtTerm(r.term), r.type,
    fmtCoupon(r.coupon), fmtPrice(r.price), fmtYield(r.ask), fmtYield(r.sa), fmtYield(r.sao),
    fmtFactor(r.settleSaFactor), fmtFactor(r.naiveMaturitySaFactor), fmtFactor(r.maturitySaFactor),
    fmtFactor(r.saPriceFactor), blank(r.saPrice) ? '' : Number(r.saPrice).toFixed(priceDecimals(r.price)),
    fmtYield(r.spot), fmtYield(r.spotSa),
  ].map(c => c ?? '').join(',');
  const lines = [
    dateLine('Trade Date', FEDINVEST, dates.fedInvest.trade),
    dateLine('Settlement Date', FEDINVEST, dates.fedInvest.settle),
    ...marketDateLines(dates),
    S13_HEADER,
    ...[...securityRows].sort(compareSecurityRows).map(cells),
    ...[...spotRows].sort(compareSpotRows).map(cells),
  ];
  return lines.join('\n') + '\n';
}

// ─── S13 reader ──────────────────────────────────────────────────────────────
// The Market TIPS security rows of S13 text (Source Market, Type TIPS, CUSIP not Spot), in file
// order, for every consumer that needs the Ask, SA and SAO Yield of the TIPS in Market quotes
// (S7): the one reader of those rows, so no app keeps a store of its own for them.
//
// The columns are found by header name (csv.js#parseCsvWithPreamble), never by position, so the
// lines before the header and the order of the columns do not matter. Every value is the cell text
// as written (a blank cell is ''), so a consumer parses it as it parsed the cells of the retired
// SA and SAO yields (S10).
//
// Returns [{ cusip, maturity, coupon, ask_yield, sa_yield, sao_yield,
//            settleSaFactor, naiveMaturitySaFactor, maturitySaFactor, saPriceFactor, saPrice }]
// Throws when the text has no header line.
export function marketTipsRowsFromYieldCurves(text) {
  const parsed = parseCsvWithPreamble(text, 'CUSIP');
  if (!parsed) throw new Error('Yield curves (S13) has no header line.');
  const header = key => S13_COLUMNS.find(c => c[1] === key)[0];
  const cell = (row, key) => row[header(key)] ?? '';
  return parsed.rows
    .filter(r => r['Source'] === MARKET && r['Type'] === 'TIPS' && r['CUSIP'] && r['CUSIP'] !== 'Spot')
    .map(r => ({
      cusip: cell(r, 'cusip'), maturity: cell(r, 'maturity'), coupon: cell(r, 'coupon'),
      ask_yield: cell(r, 'ask'), sa_yield: cell(r, 'sa'), sao_yield: cell(r, 'sao'),
      settleSaFactor: cell(r, 'settleSaFactor'), naiveMaturitySaFactor: cell(r, 'naiveMaturitySaFactor'),
      maturitySaFactor: cell(r, 'maturitySaFactor'), saPriceFactor: cell(r, 'saPriceFactor'),
      saPrice: cell(r, 'saPrice'),
    }));
}

// ─── Readers of S13, S14 and S15 ─────────────────────────────────────────────
// spec: YieldCurves/knowledge/3.1_Read_Yield_Curve_Data_Sets.md
// The inverse of buildYieldCurvesCsv, buildBreakevenCsv and buildSpreadsCsv. Every column is found
// by its header name, never by its position, the date lines included: the label of a date line is
// in the first column, its Source in the `Source` column (S13 only) and its date in the `Maturity`
// column (`TIPS Maturity` in S14). A number cell is a JS number, NaN where it is blank; CUSIP,
// Source, Maturity and Type stay strings, and every date stays the string written.

// The String columns of the three stores; every other column is read as a number.
const STRING_KEYS = new Set([
  'cusip', 'source', 'maturity', 'type',
  'tipsCusip', 'tipsMaturity', 'nominalCusip', 'nominalMaturity',
]);
const num = s => (s == null || s === '') ? NaN : Number(s);

// The header and rows of one store, every column of `columns` checked present by name.
// Returns { at, preamble, rows }: `at(name)` is the index of a header name in the file.
function readStore(text, columns, storeName) {
  const parsed = parseCsvWithPreamble(text, columns[0][0]);
  if (!parsed) throw new Error(`${storeName} has no header line.`);
  const missing = columns.map(c => c[0]).filter(h => !parsed.header.includes(h));
  if (missing.length) throw new Error(`${storeName} has no column ${missing.join(', ')}.`);
  return { at: name => parsed.header.indexOf(name), preamble: parsed.preamble, rows: parsed.rows };
}

// One row object of a store: each [header, key] of `columns`, a string or a number by STRING_KEYS.
// `rename` maps a key of `columns` to the key returned.
function readRow(r, columns, rename = {}) {
  const out = {};
  for (const [h, key] of columns) out[rename[key] ?? key] = STRING_KEYS.has(key) ? (r[h] ?? '') : num(r[h]);
  return out;
}

// The date of the date line with `label` (and `source`, where the store has a Source column).
function readDateLine(store, label, source, dateColumn, storeName) {
  const iLabel = 0, iDate = store.at(dateColumn), iSource = source == null ? -1 : store.at('Source');
  const line = store.preamble.find(c => c[iLabel] === label && (iSource < 0 || c[iSource] === source));
  const date = line ? line[iDate] : '';
  if (!date) throw new Error(`${storeName} has no ${label} line${source == null ? '' : ` of ${source}`}.`);
  return date;
}

const S13_SPOT_KEYS = ['type', 'term', 'source', 'spot', 'spotSa'];
const S13_SECURITY_KEYS = S13_COLUMNS.map(c => c[1]).filter(k => k !== 'spot' && k !== 'spotSa');

// Parses Yield curves (S13) text.
// Returns { dates: { fedInvest: { trade, settle }, market: { trade, settle } },
//   securities: [{ cusip, source, maturity, termYears, type, coupon, price, ask, sa, sao,
//     settleSaFactor, naiveMaturitySaFactor, maturitySaFactor, saPriceFactor, saPrice }],
//   spot: [{ type, termYears, source, spot, spotSa }] }, each in file order.
// A row with CUSIP `Spot` is a spot row, every other row a security row.
// Throws when the text has no header line, a column, or one of the four date lines.
export function parseYieldCurvesCsv(text) {
  const name = 'Yield curves (S13)';
  const store = readStore(text, S13_COLUMNS, name);
  const date = (label, source) => readDateLine(store, label, source, 'Maturity', name);
  const dates = {
    fedInvest: { trade: date('Trade Date', FEDINVEST), settle: date('Settlement Date', FEDINVEST) },
    market: { trade: date('Trade Date', MARKET), settle: date('Settlement Date', MARKET) },
  };
  const pick = keys => S13_COLUMNS.filter(c => keys.includes(c[1]));
  const rename = { term: 'termYears' };
  const securities = [], spot = [];
  for (const r of store.rows) {
    if (r['CUSIP'] === 'Spot') spot.push(readRow(r, pick(S13_SPOT_KEYS), rename));
    else if (r['CUSIP']) securities.push(readRow(r, pick(S13_SECURITY_KEYS), rename));
  }
  return { dates, securities, spot };
}

// Market dates of S14 and S15: two date lines with no Source cell.
function readMarketDates(store, dateColumn, storeName) {
  return {
    trade: readDateLine(store, 'Trade Date', null, dateColumn, storeName),
    settle: readDateLine(store, 'Settlement Date', null, dateColumn, storeName),
  };
}

// Parses Breakeven inflation (S14) text.
// Returns { dates: { trade, settle }, rows: [{ tipsCusip, tipsMaturity, tipsCoupon, tipsAsk, tipsSa,
//   tipsSao, nominalCusip, nominalMaturity, nominalCoupon, nominalAsk, askBei, saBei, saoBei }] }.
// Throws when the text has no header line, a column, or one of the two date lines.
export function parseBreakevenCsv(text) {
  const name = 'Breakeven inflation (S14)';
  const store = readStore(text, S14_COLUMNS, name);
  return {
    dates: readMarketDates(store, 'TIPS Maturity', name),
    rows: store.rows.filter(r => r['TIPS CUSIP']).map(r => readRow(r, S14_COLUMNS)),
  };
}

// Parses Bid and ask spreads (S15) text.
// Returns { dates: { trade, settle }, rows: [{ cusip, maturity, type, coupon, askYield, bidYield,
//   yieldSpreadBps, askPrice, bidPrice, adjustedAskPrice, adjustedBidPrice, priceSpreadPct }] }.
// Throws when the text has no header line, a column, or one of the two date lines.
export function parseSpreadsCsv(text) {
  const name = 'Bid and ask spreads (S15)';
  const store = readStore(text, S15_COLUMNS, name);
  return {
    dates: readMarketDates(store, 'Maturity', name),
    rows: store.rows.filter(r => r['CUSIP']).map(r => readRow(r, S15_COLUMNS)),
  };
}

// ─── S14 ─────────────────────────────────────────────────────────────────────
// One row per Market TIPS, against the nominal Treasury nearest it in maturity (1.3.5 Per security),
// in the order of the TIPS given. `nominals` are the Bills, Notes and Bonds only: a STRIPS and an
// Unclassified security are not a reference for a coupon TIPS.
export function breakevenRows(tips, nominals) {
  const rows = [];
  for (const b of tips) {
    const nom = findClosestNominal(nominals, b.maturityDate);
    if (!nom) continue;
    rows.push({
      tips_cusip: b.cusip, tips_maturity: b.maturity, tips_coupon: b.coupon,
      tips_ask_yield: b.askYield, tips_sa_yield: b.saYield, tips_sao_yield: b.saoYield,
      nominal_cusip: nom.cusip, nominal_maturity: nom.maturity, nominal_coupon: nom.coupon, nominal_yield: nom.yield,
      ask_bei: nom.yield - b.askYield, sa_bei: nom.yield - b.saYield, sao_bei: nom.yield - b.saoYield,
    });
  }
  return rows;
}

export function buildBreakevenCsv({ dates, rows }) {
  const lines = [
    ...marketDateLinesNoSource(dates),
    S14_HEADER,
    ...rows.map(r => [
      r.tips_cusip, r.tips_maturity, fmtCoupon(r.tips_coupon),
      fmtYield(r.tips_ask_yield), fmtYield(r.tips_sa_yield), fmtYield(r.tips_sao_yield),
      r.nominal_cusip, r.nominal_maturity, fmtCoupon(r.nominal_coupon), fmtYield(r.nominal_yield),
      fmtYield(r.ask_bei), fmtYield(r.sa_bei), fmtYield(r.sao_bei),
    ].join(',')),
  ];
  return lines.join('\n') + '\n';
}

// ─── S15 ─────────────────────────────────────────────────────────────────────
// One row per Market security, STRIPS and Unclassified included, in order of maturity, coupon and
// CUSIP. `tips` are the TIPS Yields and `nominals` every nominal Treasury Yield of S7 (nominals
// carry their security type as cusipType). The spreads are set on the securities by
// spreads.js#addTipsSpreads and #addTreasurySpreads. The adjusted prices are on a TIPS row only.
export function spreadRows(tips, nominals) {
  addTipsSpreads(tips);
  addTreasurySpreads(nominals);
  const rows = [];
  for (const b of tips) {
    rows.push({
      security_type: 'TIPS', cusip: b.cusip, maturity: b.maturity, coupon: b.coupon,
      ask_yield: b.askYield, bid_yield: b.bidYield, yield_spread_bps: b.yieldSpreadBps,
      ask_price: b.price, bid_price: b.bidPrice, adj_ask_price: b.adjAskPrice, adj_bid_price: b.adjBidPrice,
      price_spread_pct: b.priceSpreadPct,
    });
  }
  for (const b of nominals) {
    rows.push({
      security_type: b.cusipType, cusip: b.cusip, maturity: b.maturity, coupon: b.coupon,
      ask_yield: b.yield, bid_yield: b.bidYield, yield_spread_bps: b.yieldSpreadBps,
      ask_price: b.price, bid_price: b.bidPrice, adj_ask_price: null, adj_bid_price: null,
      price_spread_pct: b.priceSpreadPct,
    });
  }
  return rows.sort((a, b) => cmp(a.maturity, b.maturity) || cmp(a.coupon, b.coupon) || cmp(a.cusip, b.cusip));
}

export function buildSpreadsCsv({ dates, rows }) {
  const lines = [
    ...marketDateLinesNoSource(dates),
    S15_HEADER,
    ...rows.map(r => [
      r.cusip, r.maturity, r.security_type, fmtCoupon(r.coupon),
      fmtNum(r.ask_yield), fmtNum(r.bid_yield), fmtNum(r.yield_spread_bps),
      fmtNum(r.ask_price), fmtNum(r.bid_price), fmtNum(r.adj_ask_price), fmtNum(r.adj_bid_price),
      fmtNum(r.price_spread_pct),
    ].join(',')),
  ];
  return lines.join('\n') + '\n';
}

// ─── The whole of 1.3 ────────────────────────────────────────────────────────
// yieldsText     S1, YieldsFromFedInvestPrices.csv
// refCpiText     S4, RefCpiNsaSa.csv
// holidayText    S16, BondHolidaysSifma.csv
// quotesText     S7, MarketQuotes.csv
// log, warn      optional progress sinks
//
// Returns { yieldCurvesCsv, breakevenCsv, spreadsCsv } plus the dates and the row counts.
export function buildYieldCurveStores({ yieldsText, refCpiText, holidayText, quotesText, log = () => {}, warn = () => {} }) {
  // S1 (1.3.1.1).
  const { tips: rawTipsData, nominals: rawNominalsData, settlementDate: fedSettleStr } = parseFedInvestPrices(yieldsText);
  const refCpiData = parseCsv(refCpiText);
  const holidaySet = parseHolidaySet(parseCsv(holidayText, false));
  log(`FedInvest settlement ${fedSettleStr}: ${rawTipsData.length} TIPS, ${rawNominalsData.length} nominal rows.`);

  // S7: the Download Date is the Market Trade Date; the Settlement Date is one bond trading day later (1.3.1.5).
  const downloadDateStr = parseDownloadDate(quotesText);
  if (!downloadDateStr) throw new Error('Market quotes has no Download Date line.');
  const brokerSettleStr = marketSettleIso(downloadDateStr, holidaySet);
  log(`Market settlement (T+1): ${brokerSettleStr}`);
  const dates = {
    fedInvest: { trade: fedSettleStr, settle: fedSettleStr },   // T+0: FedInvest states its prices for its Settlement Date
    market: { trade: downloadDateStr, settle: brokerSettleStr },
  };

  const priceMap = new Map();
  for (const r of parseTipsQuotes(quotesText)) {
    if (isNaN(r.askPrice)) continue;
    priceMap.set(r.cusip, r);
  }
  // Every nominal Treasury of S7, STRIPS and Unclassified included, for the security rows and S15.
  const mktNominalBondsAll = parseTreasuryQuotes(quotesText, {
    settleIso: brokerSettleStr,
    onUnknownCusip: cusip => warn(`  Unrecognized CUSIP root, tagged Unclassified: ${cusip}`),
  });
  // The curve-fit inputs and S14 leave STRIPS and Unclassified out (1.3.4, 1.3.5).
  const mktNominalBonds = mktNominalBondsAll.filter(b => !isStrip(b.cusip) && b.cusipType !== 'Unclassified');
  log(`Market: ${priceMap.size} TIPS quotes, ${mktNominalBondsAll.length} nominal quotes `
    + `(${mktNominalBondsAll.filter(b => isStrip(b.cusip)).length} STRIPS, `
    + `${mktNominalBondsAll.filter(b => b.cusipType === 'Unclassified').length} Unclassified).`);

  // TIPS Yields (1.3.1.6), SA Yield (1.3.2), SAO Yield (1.3.3).
  const fedTips = saYieldsFromTipsYields(tipsYieldsFromPrices(rawTipsData, priceMap, false, brokerSettleStr), refCpiData);
  const mktTips = saYieldsFromTipsYields(tipsYieldsFromPrices(rawTipsData, priceMap, true, brokerSettleStr), refCpiData);
  if (fedTips.length) { const s = calculateSAO(fedTips); fedTips.forEach((b, i) => b.saoYield = s[i]); }
  if (mktTips.length) { const s = calculateSAO(mktTips); mktTips.forEach((b, i) => b.saoYield = s[i]); }

  // Treasury Yields (1.3.1.7).
  const fedNominalBondsAll = treasuryYieldsFromPrices(rawNominalsData);
  const fedNominalBonds = fedNominalBondsAll.filter(b => !isStrip(b.cusip));

  // Spot curves (1.3.4).
  const fits = {
    [FEDINVEST]: {
      nominal: spotCurveFit(fedNominalBonds, TREASURIES_SPOT_FIT),
      tips: spotCurveFit(fedTips, TIPS_SPOT_FIT),
      tips_sa: spotCurveFit(fedTips, TIPS_SA_SPOT_FIT),
    },
    [MARKET]: {
      nominal: spotCurveFit(mktNominalBonds, TREASURIES_SPOT_FIT),
      tips: spotCurveFit(mktTips, TIPS_SPOT_FIT),
      tips_sa: spotCurveFit(mktTips, TIPS_SA_SPOT_FIT),
    },
  };
  const fed = fits[FEDINVEST], mkt = fits[MARKET];
  log(`Fitted spot curves — FedInvest: nominal=${!!fed.nominal} tips=${!!fed.tips} tips_sa=${!!fed.tips_sa}; `
    + `Market: nominal=${!!mkt.nominal} tips=${!!mkt.tips} tips_sa=${!!mkt.tips_sa}`);

  // S13.
  const securityRows = [
    ...fedNominalBondsAll.map(b => nominalSecurityRow(b, FEDINVEST, fedInvestNominalType(b.type, b.cusip), fedSettleStr)),
    ...mktNominalBondsAll.map(b => nominalSecurityRow(b, MARKET, b.cusipType, brokerSettleStr)),
    ...fedTips.map(b => tipsSecurityRow(b, FEDINVEST, fedSettleStr)),
    ...mktTips.map(b => tipsSecurityRow(b, MARKET, brokerSettleStr)),
  ];
  const spotRows = [
    ...spotRowsFromFits(fits[FEDINVEST], FEDINVEST),
    ...spotRowsFromFits(fits[MARKET], MARKET),
  ];
  log(`YieldCurves.csv: ${securityRows.length} security rows, ${spotRows.length} spot rows.`);

  // S14 (Market only) and S15 (Market only).
  const beiRows = breakevenRows(mktTips, mktNominalBonds);
  log(`Computed breakeven inflation for ${beiRows.length} TIPS.`);
  const spreads = spreadRows(mktTips, mktNominalBondsAll);
  log(`Computed bid/ask spreads for ${spreads.length} securities.`);

  return {
    dates,
    yieldCurvesCsv: buildYieldCurvesCsv({ dates, securityRows, spotRows }),
    breakevenCsv: buildBreakevenCsv({ dates, rows: beiRows }),
    spreadsCsv: buildSpreadsCsv({ dates, rows: spreads }),
    counts: { securityRows: securityRows.length, spotRows: spotRows.length, breakeven: beiRows.length, spreads: spreads.length },
  };
}
