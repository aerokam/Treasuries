// yield-curve-stores.test.js — Coverage for shared/src/yield-curve-stores.js, which builds
// Yield curves (S13), Breakeven inflation (S14) and Bid and ask spreads (S15) as text
// (knowledge/1.3_Calculate_Yield_Curve_Data_Sets.md; layouts in knowledge/DATA_DICTIONARY.md
// #s13, #s14, #s15), and for csv.js#parseCsvWithPreamble, which reads a store with lines before its header.
// Run: node shared/tests/yield-curve-stores.test.js
//
// Deterministic: every input is written here, nothing is fetched. The files are read back by
// header name, as a consumer reads them.

import {
  S13_HEADER, S14_HEADER, S15_HEADER, priceDecimals,
  buildYieldCurvesCsv, buildBreakevenCsv, buildSpreadsCsv, breakevenRows, spreadRows,
  compareSecurityRows, compareSpotRows, fedInvestNominalType, spotRowsFromFits, buildYieldCurveStores,
  marketTipsRowsFromYieldCurves, parseYieldCurvesCsv, parseBreakevenCsv, parseSpreadsCsv,
} from '../src/yield-curve-stores.js';
import { parseCsvWithPreamble } from '../src/csv.js';
import { parseDownloadDate, parseTipsQuotes, parseTreasuryQuotes } from '../src/market-quotes.js';
import { localDate } from '../src/settlement.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } };
const eq = (a, b, msg) => ok(JSON.stringify(a) === JSON.stringify(b), `${msg} (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`);

// ── csv.js#parseCsvWithPreamble ──
{
  const text = '﻿Trade Date,Market,2026-11-03 17:05\nSettlement Date,Market,2026-11-04\nCUSIP,Source,Maturity\nA,Market,2030-01-15\n';
  const p = parseCsvWithPreamble(text, 'CUSIP');
  eq(p.preamble, [['Trade Date', 'Market', '2026-11-03 17:05'], ['Settlement Date', 'Market', '2026-11-04']], 'the lines before the header are the preamble');
  eq(p.rows, [{ CUSIP: 'A', Source: 'Market', Maturity: '2030-01-15' }], 'rows are keyed by header name');
  eq(parseCsvWithPreamble('a,b\n1,2\n', 'CUSIP'), null, 'no header line gives null');
  eq(parseCsvWithPreamble('2026-11-03\ntype,cusip\nTIPS,X\n', 'type').preamble, [['2026-11-03']], 'a single date line');
  eq(parseCsvWithPreamble('type,price,cusip\nTIPS,100,X\n', 'type').rows, [{ type: 'TIPS', price: '100', cusip: 'X' }],
    'columns are found by name, whatever their position');
}

// ── Layout constants ──
eq(S13_HEADER, 'CUSIP,Source,Maturity,Term (y),Type,Coupon,Price,Ask,SA,SAO,Settlement Date SA Factor,Naive Maturity SA Factor,Maturity SA Factor,SA Price Factor,SA Price,Spot,Spot SA', 'S13 header');
eq(S14_HEADER, 'TIPS CUSIP,TIPS Maturity,TIPS Coupon,TIPS Ask,TIPS SA,TIPS SAO,Nominal CUSIP,Nominal Maturity,Nominal Coupon,Nominal Ask,Ask BEI,SA BEI,SAO BEI', 'S14 header');
eq(S15_HEADER, 'CUSIP,Maturity,Type,Coupon,Ask Yield,Bid Yield,Yield Spread (bps),Ask Price,Bid Price,Adjusted Ask Price,Adjusted Bid Price,Price Spread %', 'S15 header');

// ── Cell formats ──
ok(priceDecimals(99.821) === 3 && priceDecimals(100) === 3 && priceDecimals(99.71875) === 5 && priceDecimals(99.9785) === 4,
  'a Price keeps the decimals it is quoted to, at least three');
eq(fedInvestNominalType('MARKET BASED NOTE', '912828AA1'), 'Note', 'a FedInvest note is a Note');
eq(fedInvestNominalType('MARKET BASED BILL', '999999AA1'), 'Bill', 'the type S1 states wins over the CUSIP root, and is never Unclassified');
eq(fedInvestNominalType('MARKET BASED BOND', '912810AA1'), 'Bond', 'a FedInvest bond is a Bond');

// ── S13 text from hand-made rows ──
const dates = {
  fedInvest: { trade: '2026-11-03', settle: '2026-11-03' },
  market: { trade: '2026-11-03 17:05', settle: '2026-11-04' },
};
const sec = (cusip, source, maturity, term, type, coupon, price, extra = {}) =>
  ({ cusip, source, maturity, term, type, coupon, price, ask: 0.04, ...extra });
const tipsExtra = { sa: 0.01, sao: 0.011, settleSaFactor: 1.00248, naiveMaturitySaFactor: 0.99878, maturitySaFactor: 0.9988903495597089, saPriceFactor: 1.003593638122416, saPrice: 100.57112206988542 };
const securityRows = [
  sec('B', 'Market', '2030-02-15', 3.2, 'Note', 0.04, 100),
  sec('C', 'Market', '2028-01-15', 1.2, 'TIPS', 0.0125, 100.211, tipsExtra),
  sec('C', 'FedInvest', '2028-01-15', 1.2, 'TIPS', 0.0125, 100.21875, tipsExtra),
  sec('A', 'Market', '2030-02-15', 3.2, 'Note', 0.03, 100),
  sec('A0', 'Market', '2030-02-15', 3.2, 'Note', 0.03, 100),
  sec('A', 'FedInvest', '2030-02-15', 3.19, 'Note', 0.03, 100),
];
const spotRows = [
  { cusip: 'Spot', source: 'Market', maturity: '', term: 1, type: 'TIPS', spot: 0.02, spotSa: 0.021 },
  { cusip: 'Spot', source: 'Market', maturity: '', term: 0.5, type: 'Treasury', spot: 0.04 },
  { cusip: 'Spot', source: 'FedInvest', maturity: '', term: 1, type: 'TIPS', spot: 0.0201, spotSa: 0.0211 },
  { cusip: 'Spot', source: 'Market', maturity: '', term: 1, type: 'BEI', spot: 0.02, spotSa: null },
  { cusip: 'Spot', source: 'FedInvest', maturity: '', term: 1, type: 'Treasury', spot: 0.04 },
];
const s13 = buildYieldCurvesCsv({ dates, securityRows, spotRows });
{
  const lines = s13.split('\n');
  eq(lines.slice(0, 4), ['Trade Date,FedInvest,2026-11-03', 'Settlement Date,FedInvest,2026-11-03', 'Trade Date,Market,2026-11-03 17:05', 'Settlement Date,Market,2026-11-04'], 'S13: four date lines, each date in the Maturity column');
  eq(lines[4], S13_HEADER, 'S13: header is the fifth line');
  ok(s13.endsWith('\n') && !s13.endsWith('\n\n'), 'S13 ends with one line break');

  const p = parseCsvWithPreamble(s13, 'CUSIP');
  ok(p.preamble.length === 4 && p.preamble.every(c => c.length === 3), 'S13: four preamble lines of three cells');
  eq(p.rows.filter(r => r.CUSIP !== 'Spot').map(r => `${r.CUSIP}/${r.Source}`),
    ['C/FedInvest', 'C/Market', 'A/FedInvest', 'A/Market', 'A0/Market', 'B/Market'],
    'S13: security rows in order of Maturity, Coupon, CUSIP, Term and Source');
  const firstSpot = p.rows.findIndex(r => r.CUSIP === 'Spot');
  ok(firstSpot === 6 && p.rows.slice(firstSpot).every(r => r.CUSIP === 'Spot'), 'S13: spot rows follow all the security rows');
  eq(p.rows.slice(firstSpot).map(r => `${r.Type}/${r['Term (y)']}/${r.Source}`),
    ['BEI/1.000/Market', 'TIPS/1.000/FedInvest', 'TIPS/1.000/Market', 'Treasury/0.500/Market', 'Treasury/1.000/FedInvest'],
    'S13: spot rows in order of Type, Term and Source');
  ok(p.rows.slice(firstSpot).every(r => r.Maturity === '' && r.Coupon === '' && r.Price === '' && r.Ask === ''), 'S13: a spot row has no Maturity, Coupon, Price or Ask');

  const tips = p.rows.find(r => r.CUSIP === 'C' && r.Source === 'Market');
  eq([tips.Coupon, tips.Price, tips.Ask, tips.SA, tips.SAO], ['0.0125000', '100.211', '0.0400000', '0.0100000', '0.0110000'], 'S13: TIPS row Coupon, Price, Ask, SA, SAO');
  eq([tips['Settlement Date SA Factor'], tips['Naive Maturity SA Factor'], tips['Maturity SA Factor'], tips['SA Price Factor'], tips['SA Price']],
    ['1.00248', '0.99878', '0.99889', '1.00359', '100.571'], 'S13: the five SA working values, factors to five decimals and the SA Price to the decimals of the Price');
  const fedTips = p.rows.find(r => r.CUSIP === 'C' && r.Source === 'FedInvest');
  eq([fedTips.Price, fedTips['SA Price']], ['100.21875', '100.57112'], 'S13: the SA Price has the decimals of its row\'s Price');
  const note = p.rows.find(r => r.CUSIP === 'B');
  eq([note.Coupon, note.Price, note.Ask], ['0.0400000', '100.000', '0.0400000'], 'S13: a nominal row has Coupon, Price and Ask');
  ok(p.rows.filter(r => r.Type !== 'TIPS' && r.CUSIP !== 'Spot').every(r =>
    ['SA', 'SAO', 'Settlement Date SA Factor', 'Naive Maturity SA Factor', 'Maturity SA Factor', 'SA Price Factor', 'SA Price', 'Spot', 'Spot SA'].every(k => r[k] === '')),
    'S13: the TIPS-only columns are blank on every other security row');
  const spotTips = p.rows.find(r => r.CUSIP === 'Spot' && r.Type === 'TIPS' && r.Source === 'Market');
  eq([spotTips.Spot, spotTips['Spot SA'], spotTips.SA, spotTips['SA Price']], ['0.0200000', '0.0210000', '', ''], 'S13: a spot row has Spot and Spot SA only');
  const bei = p.rows.find(r => r.CUSIP === 'Spot' && r.Type === 'BEI');
  eq([bei.Spot, bei['Spot SA']], ['0.0200000', ''], 'S13: a null spot cell is blank');
}
{
  // marketTipsRowsFromYieldCurves: the Market TIPS security rows, by header name.
  const rows = marketTipsRowsFromYieldCurves(s13);
  eq(rows.map(r => r.cusip), ['C'], 'S13 reader: only the Market TIPS security row (not FedInvest, a nominal or a spot row)');
  eq([rows[0].maturity, rows[0].coupon, rows[0].ask_yield, rows[0].sa_yield, rows[0].sao_yield],
    ['2028-01-15', '0.0125000', '0.0400000', '0.0100000', '0.0110000'], 'S13 reader: the cells as written, under the keys of the retired S10');
  eq([rows[0].settleSaFactor, rows[0].naiveMaturitySaFactor, rows[0].maturitySaFactor, rows[0].saPriceFactor, rows[0].saPrice],
    ['1.00248', '0.99878', '0.99889', '1.00359', '100.571'], 'S13 reader: the five working values');

  // Column order does not matter after CUSIP (the first cell of the header line): the same rows with the other columns reversed.
  const lines = s13.trim().split('\n');
  const reorder = l => { const c = l.split(','); return [c[0], ...c.slice(1).reverse()].join(','); };
  const reversed = lines.map((l, i) => i < 4 ? l : reorder(l)).join('\n') + '\n';
  eq(marketTipsRowsFromYieldCurves(reversed), rows, 'S13 reader: columns found by header name, not position');

  // A TIPS with no SA Yield has blank sa_yield and sao_yield cells, as in S10.
  const noSa = buildYieldCurvesCsv({ dates, securityRows: [sec('T', 'Market', '2030-07-15', 3.7, 'TIPS', 0.01, 100, { sa: NaN, sao: NaN })], spotRows: [] });
  const t = marketTipsRowsFromYieldCurves(noSa)[0];
  eq([t.cusip, t.ask_yield, t.sa_yield, t.sao_yield], ['T', '0.0400000', '', ''], 'S13 reader: a blank SA and SAO cell is an empty string');

  let threw = false;
  try { marketTipsRowsFromYieldCurves('a,b\n1,2\n'); } catch { threw = true; }
  ok(threw, 'S13 reader: text with no header line throws');
}
{
  // NaN working values (a TIPS with no SA Yield) are blank, not "NaN".
  const nan = NaN;
  const csv = buildYieldCurvesCsv({ dates, securityRows: [sec('T', 'Market', '2030-07-15', 3.7, 'TIPS', 0.01, 100, { sa: nan, sao: nan, settleSaFactor: 1.002, naiveMaturitySaFactor: nan, maturitySaFactor: nan, saPriceFactor: nan, saPrice: nan })], spotRows: [] });
  ok(!/NaN/.test(csv), 'S13: no NaN is written');
  eq(parseCsvWithPreamble(csv, 'CUSIP').rows[0]['Settlement Date SA Factor'], '1.00200', 'S13: the working values that exist are kept');
}
{
  let threw = false;
  try { buildYieldCurvesCsv({ dates: { fedInvest: { trade: '2026-11-03', settle: '2026-11-03' }, market: { trade: null, settle: '2026-11-04' } }, securityRows: [], spotRows: [] }); } catch { threw = true; }
  ok(threw, 'a missing date is an error, not a blank date line');
}
ok(compareSecurityRows(sec('A', 'FedInvest', '2030-01-01', 1, 'Note', 0.03), sec('A', 'Market', '2030-01-01', 1, 'Note', 0.03)) < 0, 'Source is the last key of the security rows');
ok(compareSpotRows({ type: 'TIPS', term: 2, source: 'Market' }, { type: 'Treasury', term: 1, source: 'FedInvest' }) < 0, 'Type is the first key of the spot rows');

// ── spotRowsFromFits: three rows per term, blank outside a fit's range ──
{
  const fit = (tMin, tMax, level) => ({ tMin, tMax, z: () => level, sane: () => true });
  const rows = spotRowsFromFits({ nominal: fit(0.5, 3, 4), tips: fit(1, 3, 1.5), tips_sa: fit(1, 3, 1.4) }, 'Market');
  ok(rows.length % 3 === 0 && rows.every(r => r.cusip === 'Spot' && r.maturity === '' && r.source === 'Market'), 'spot rows: Spot, no Maturity, three per term');
  const at = (t, type) => rows.find(r => r.term === t && r.type === type);
  ok(at(0.5, 'Treasury').spot > 0.039 && at(0.5, 'TIPS').spot == null && at(0.5, 'BEI').spot == null, 'spot rows: a cell is blank where its fit has no value at that term');
  ok(at(2, 'BEI').spot > 0.02 && at(2, 'BEI').spotSa > at(2, 'BEI').spot - 1, 'spot rows: BEI is the nominal spot less the TIPS spot');
  ok(at(2, 'TIPS').spotSa < at(2, 'TIPS').spot, 'spot rows: Spot SA is the SA fit');
  eq(spotRowsFromFits({ nominal: null, tips: null, tips_sa: null }, 'Market'), [], 'spot rows: no fits, no rows');
}

// ── S14 / S15 from hand-made securities ──
const md = s => localDate(s);
const tipsSec = (cusip, maturity, coupon, askYield, saYield, saoYield, price, bidPrice, bidYield) => ({
  cusip, maturity, maturityDate: md(maturity), coupon, askYield, saYield, saoYield, price, bidPrice, bidYield,
  adjAskPrice: price * 1.3, adjBidPrice: bidPrice * 1.3,
});
const nomSec = (cusip, cusipType, maturity, coupon, yld, price, bidPrice, bidYield) =>
  ({ cusip, cusipType, maturity, maturityDate: md(maturity), coupon, yield: yld, price, bidPrice, bidYield });
{
  const nominals = [nomSec('N1', 'Note', '2029-01-15', 0.04, 0.041, 100, 99.9, 0.0415), nomSec('N2', 'Bond', '2031-01-15', 0.045, 0.043, 101, 100.8, 0.0435)];
  const tips = [tipsSec('T1', '2029-07-15', 0.01, 0.015, 0.014, NaN, 100, 99.8, 0.016), tipsSec('T2', '2031-07-15', 0.0125, 0.017, 0.016, 0.0165, 101, 100.7, 0.0175)];
  const rows = breakevenRows(tips, nominals);
  eq(rows.map(r => `${r.tips_cusip}>${r.nominal_cusip}`), ['T1>N1', 'T2>N2'], 'S14: each TIPS against the nominal nearest in maturity, in the order of the TIPS');
  ok(rows[0].nominal_coupon === 0.04, 'S14: nominal_coupon');
  const csv = buildBreakevenCsv({ dates, rows });
  const lines = csv.split('\n');
  eq(lines.slice(0, 3), ['Trade Date,2026-11-03 17:05', 'Settlement Date,2026-11-04', S14_HEADER], 'S14: two Market date lines, then the header');
  const p = parseCsvWithPreamble(csv, 'TIPS CUSIP');
  ok(p.preamble.length === 2 && p.rows.length === 2, 'S14: read back by header name');
  const r1 = p.rows[0];
  eq([r1['TIPS CUSIP'], r1['TIPS Maturity'], r1['TIPS Coupon'], r1['TIPS Ask'], r1['TIPS SA'], r1['TIPS SAO']], ['T1', '2029-07-15', '0.0100000', '0.0150000', '0.0140000', ''], 'S14: a TIPS with no SAO Yield has a blank sao cell');
  eq([r1['Nominal CUSIP'], r1['Nominal Maturity'], r1['Nominal Coupon'], r1['Nominal Ask']], ['N1', '2029-01-15', '0.0400000', '0.0410000'], 'S14: the nominal columns, with nominal_coupon');
  eq([r1['Ask BEI'], r1['SA BEI'], r1['SAO BEI']], ['0.0260000', '0.0270000', ''], 'S14: breakevens are the nominal yield less the TIPS yield');
}
{
  const nominals = [
    nomSec('Z', 'STRIPS', '2030-02-15', 0, 0.04, 80, 79.9, 0.0405),
    nomSec('Y', 'Unclassified', '2030-02-15', 0.03, 0.04, 99, 98.9, 0.0405),
    nomSec('X', 'Note', '2030-02-15', 0.03, 0.04, 100, 99.9, 0.0405),
    nomSec('W', 'Bill', '2027-01-15', 0, 0.04, 98, 97.9, 0.0405),
  ];
  const tips = [tipsSec('T', '2030-02-15', 0.0125, 0.015, 0.014, 0.0145, 100, 99.8, 0.016)];
  const rows = spreadRows(tips, nominals);
  eq(rows.map(r => `${r.security_type}/${r.cusip}`), ['Bill/W', 'STRIPS/Z', 'TIPS/T', 'Note/X', 'Unclassified/Y'], 'S15: every security including STRIPS and Unclassified, in order of maturity, coupon and CUSIP');
  const csv = buildSpreadsCsv({ dates, rows });
  eq(csv.split('\n').slice(0, 3), ['Trade Date,2026-11-03 17:05', 'Settlement Date,2026-11-04', S15_HEADER], 'S15: two Market date lines, then the header');
  const p = parseCsvWithPreamble(csv, 'CUSIP');
  const byType = Object.fromEntries(p.rows.map(r => [r['Type'], r]));
  ok(byType.TIPS['Adjusted Ask Price'] === '130.0000' && byType.TIPS['Adjusted Bid Price'] === '129.7400', 'S15: a TIPS has its adjusted prices');
  ok(['Bill', 'STRIPS', 'Note', 'Unclassified'].every(t => byType[t]['Adjusted Ask Price'] === '' && byType[t]['Adjusted Bid Price'] === ''), 'S15: the adjusted prices are blank on every other security');
  ok(byType.TIPS['Price Spread %'] === '0.2000000', 'S15: a TIPS price spread is calculated from its adjusted prices');
  ok(byType.Note['Price Spread %'] === '0.1000000' && byType.Note['Yield Spread (bps)'] === '5.0000000', 'S15: a nominal price spread and yield spread');
}

// ── The whole of 1.3, from the texts of the four stores it reads ──
{
  const notes = [], strips = [], tipsCusips = [];
  const marketLines = ['2026-11-03 17:05', 'type,cusip,maturity,coupon,askPrice,bidPrice,adjAskPrice,adjBidPrice'];
  const fedLines = ['2026-11-03', 'type,cusip,maturity,coupon,datedDateCpi,price,yield'];
  for (let i = 0; i < 9; i++) {
    const cusip = `91282CA${String(i).padStart(2, '0')}`, mat = `${2027 + i}-05-15`;
    marketLines.push(`Treasury,${cusip},${mat},0.04,100,99.9,,`);
    fedLines.push(`MARKET BASED NOTE,${cusip},${mat},0.04,,100.03125,0.04`);
    notes.push(cusip);
  }
  marketLines.push('Treasury,912797A01,2027-02-18,0,96.5,96.4,,');
  fedLines.push('MARKET BASED BILL,912797A01,2027-02-18,0,,96.45,0.04');
  marketLines.push('Treasury,912803A01,2031-11-15,0,80,79.5,,');
  marketLines.push('Treasury,999999A01,2032-11-15,0.03,99,98.9,,');
  for (let i = 0; i < 7; i++) {
    const cusip = `912810B${String(i).padStart(2, '0')}`, mat = i % 2 ? `${2028 + Math.floor(i / 2)}-07-15` : `${2028 + Math.floor(i / 2)}-01-15`;
    marketLines.push(`TIPS,${cusip},${mat},0.0125,100.211,100.05,130.5,130.3`);
    fedLines.push(`TIPS,${cusip},${mat},0.0125,250,100.21875,0.0121`);
    tipsCusips.push(cusip);
  }
  const s4 = ['Ref CPI Date,Ref CPI NSA,Ref CPI SA,SA Factor'];
  for (const d of ['2025-01-15', '2025-07-15', '2026-01-15', '2026-07-15', '2026-11-03', '2026-11-04']) s4.push(`${d},300,300,${d.endsWith('-07-15') ? '0.99800' : d.endsWith('-01-15') ? '1.00100' : '1.00248'}`);
  s4.push('2028-01-15,300,300,1.00123');   // a published Maturity Date
  const out = buildYieldCurveStores({
    yieldsText: fedLines.join('\n') + '\n', refCpiText: s4.join('\n') + '\n',
    holidayText: '"Wednesday, November 11, 2026",Veterans Day\n', quotesText: marketLines.join('\n') + '\n',
  });

  ok(out.dates.market.trade === '2026-11-03 17:05' && out.dates.market.settle === '2026-11-04' && out.dates.fedInvest.trade === '2026-11-03', 'whole: the dates of the two sources');
  const s13p = parseCsvWithPreamble(out.yieldCurvesCsv, 'CUSIP');
  eq(s13p.preamble, [['Trade Date', 'FedInvest', '2026-11-03'], ['Settlement Date', 'FedInvest', '2026-11-03'], ['Trade Date', 'Market', '2026-11-03 17:05'], ['Settlement Date', 'Market', '2026-11-04']], 'whole S13: date lines');
  const secs = s13p.rows.filter(r => r.CUSIP !== 'Spot');
  const spots = s13p.rows.filter(r => r.CUSIP === 'Spot');
  ok(s13p.rows.indexOf(spots[0]) === secs.length, 'whole S13: security rows, then spot rows');
  ok(secs.length === (9 + 1 + 7) + (9 + 1 + 1 + 1 + 7), 'whole S13: every security of both sources, STRIPS and Unclassified on the Market side');
  ok(secs.some(r => r.Source === 'Market' && r.Type === 'STRIPS') && secs.some(r => r.Source === 'Market' && r.Type === 'Unclassified'), 'whole S13: Market STRIPS and Unclassified are security rows');
  ok(!secs.some(r => r.Source === 'FedInvest' && (r.Type === 'Unclassified' || r.Type === '')), 'whole S13: a FedInvest row is never Unclassified');
  ok(secs.some(r => r.Source === 'FedInvest' && r.Type === 'Bill') && secs.some(r => r.Source === 'FedInvest' && r.Type === 'Note'), 'whole S13: FedInvest Type is the one S1 states');
  for (let i = 1; i < secs.length; i++) {
    const a = secs[i - 1], b = secs[i];
    ok(compareSecurityRows(
      { maturity: a.Maturity, coupon: +a.Coupon, cusip: a.CUSIP, term: +a['Term (y)'], source: a.Source },
      { maturity: b.Maturity, coupon: +b.Coupon, cusip: b.CUSIP, term: +b['Term (y)'], source: b.Source }) <= 0, `whole S13: security rows ordered at row ${i}`);
  }
  const tipsRows = secs.filter(r => r.Type === 'TIPS');
  ok(tipsRows.length === 14 && tipsRows.every(r => r['SA Price Factor'] !== '' && r['SA Price'] !== '' && r.SA !== '' && r['Settlement Date SA Factor'] !== ''), 'whole S13: every TIPS row has its SA working values');
  ok(secs.filter(r => r.Type !== 'TIPS').every(r => r.SA === '' && r.SAO === '' && r['SA Price Factor'] === '' && r['SA Price'] === '' && r['Maturity SA Factor'] === ''), 'whole S13: no other security row has one');
  const exact = tipsRows.find(r => r.Maturity === '2028-01-15' && r.Source === 'Market');
  ok(exact['Naive Maturity SA Factor'] === '1.00123' && exact['Maturity SA Factor'] === '1.00123', 'whole S13: S4 holds the Maturity Date, the two factors are the same exact value');
  const projected = tipsRows.find(r => r.Maturity === '2028-07-15' && r.Source === 'Market');
  ok(projected['Naive Maturity SA Factor'] === '0.99800' && +projected['Maturity SA Factor'] > 0.998 && +projected['Maturity SA Factor'] < 1, 'whole S13: otherwise the Maturity SA Factor is the naive value scaled toward 1.0');
  ok(Math.abs(+projected['SA Price Factor'] - (+projected['Settlement Date SA Factor']) / (+projected['Maturity SA Factor'])) < 2e-5, 'whole S13: SA Price Factor is settlement over maturity, to five decimals');
  ok(Math.abs(+projected['SA Price'] - (+projected.Price) * (+projected['SA Price Factor'])) < 0.0105, 'whole S13: SA Price is the Price times the SA Price Factor');
  ok(spots.length > 0 && spots.every(r => r.Maturity === '' && ['Treasury', 'TIPS', 'BEI'].includes(r.Type)), 'whole S13: spot rows of the three Types');
  for (let i = 1; i < spots.length; i++) {
    const a = spots[i - 1], b = spots[i];
    ok(compareSpotRows({ type: a.Type, term: +a['Term (y)'], source: a.Source }, { type: b.Type, term: +b['Term (y)'], source: b.Source }) <= 0, `whole S13: spot rows ordered at row ${i}`);
  }

  const s14p = parseCsvWithPreamble(out.breakevenCsv, 'TIPS CUSIP');
  eq(s14p.preamble, [['Trade Date', '2026-11-03 17:05'], ['Settlement Date', '2026-11-04']], 'whole S14: date lines');
  ok(s14p.rows.length === 7 && s14p.rows.every(r => notes.includes(r['Nominal CUSIP']) && r['Nominal Coupon'] === '0.0400000'), 'whole S14: one row per Market TIPS, against a Note, with its coupon (never a STRIPS or Unclassified)');
  ok(s14p.rows.every((r, i) => i === 0 || s14p.rows[i - 1]['TIPS Maturity'] <= r['TIPS Maturity']), 'whole S14: rows in maturity order');

  const s15p = parseCsvWithPreamble(out.spreadsCsv, 'CUSIP');
  eq(s15p.preamble, [['Trade Date', '2026-11-03 17:05'], ['Settlement Date', '2026-11-04']], 'whole S15: date lines');
  ok(s15p.rows.length === 9 + 1 + 1 + 1 + 7, 'whole S15: one row per Market security');
  eq([...new Set(s15p.rows.map(r => r['Type']))].sort(), ['Bill', 'Note', 'STRIPS', 'TIPS', 'Unclassified'], 'whole S15: security types, STRIPS and Unclassified included');
  ok(s15p.rows.filter(r => r['Type'] === 'TIPS').every(r => r['Adjusted Ask Price'] !== '' && r['Adjusted Bid Price'] !== '') && s15p.rows.filter(r => r['Type'] !== 'TIPS').every(r => r['Adjusted Ask Price'] === '' && r['Adjusted Bid Price'] === ''), 'whole S15: adjusted prices are a TIPS\'s only');
  for (let i = 1; i < s15p.rows.length; i++) {
    const a = s15p.rows[i - 1], b = s15p.rows[i];
    ok(a['Maturity'] < b['Maturity'] || (a['Maturity'] === b['Maturity'] && (+a['Coupon'] < +b['Coupon'] || (+a['Coupon'] === +b['Coupon'] && a['CUSIP'] <= b['CUSIP']))), `whole S15: ordered at row ${i}`);
  }

  // The S13 reader returns one row per Market TIPS of the built text, with the SA Yield of S14's row for the same CUSIP.
  const marketTips = marketTipsRowsFromYieldCurves(out.yieldCurvesCsv);
  ok(marketTips.length === 7 && marketTips.every(r => s14p.rows.some(b => b['TIPS CUSIP'] === r.cusip && b['TIPS SA'] === r.sa_yield && b['TIPS Ask'] === r.ask_yield)),
    'whole S13 reader: one row per Market TIPS, agreeing with S14 on the Ask and SA Yield');

  // The readers of 3.1, on the built texts: the same dates, rows and counts as the writer's.
  const y = parseYieldCurvesCsv(out.yieldCurvesCsv);
  eq(y.dates, out.dates, 'whole parseYieldCurvesCsv: the dates of both sources');
  ok(y.securities.length === out.counts.securityRows && y.spot.length === out.counts.spotRows, 'whole parseYieldCurvesCsv: every security and spot row');
  ok(y.securities.every((r, i) => r.cusip === secs[i].CUSIP && r.source === secs[i].Source), 'whole parseYieldCurvesCsv: security rows in file order');
  const b = parseBreakevenCsv(out.breakevenCsv);
  eq(b.dates, out.dates.market, 'whole parseBreakevenCsv: the Market dates');
  ok(b.rows.length === out.counts.breakeven && b.rows.every(r => Math.abs(r.askBei - (r.nominalAsk - r.tipsAsk)) < 2e-7), 'whole parseBreakevenCsv: Ask BEI is Nominal Ask less TIPS Ask');
  const s = parseSpreadsCsv(out.spreadsCsv);
  eq(s.dates, out.dates.market, 'whole parseSpreadsCsv: the Market dates');
  ok(s.rows.length === out.counts.spreads && s.rows.every((r, i) => r.cusip === s15p.rows[i].CUSIP), 'whole parseSpreadsCsv: every row in file order');

  // The Market quotes the file was built from, read back the way the writer reads them.
  const quotes = marketLines.join('\n');
  ok(parseDownloadDate(quotes) === '2026-11-03 17:05' && parseTipsQuotes(quotes).length === 7 && parseTreasuryQuotes(quotes, { settleIso: '2026-11-04' }).length === 9 + 3, 'the writer reads S7 by header name');
}

// ── Readers (3.1): the inverse of the builders, by header name ──
const throws = f => { try { f(); return false; } catch { return true; } };
// The same text with every column after the first in reverse order, the date lines included
// (each padded to the width of the header first, so that its date stays under its column name).
const reverseColumns = text => {
  const lines = text.trim().split('\n').map(l => l.split(','));
  const width = Math.max(...lines.map(c => c.length));
  return lines.map(c => { const p = [...c, ...Array(width - c.length).fill('')]; return [p[0], ...p.slice(1).reverse()].join(','); }).join('\n') + '\n';
};
{
  const y = parseYieldCurvesCsv(s13);
  eq(y.dates, dates, 'parseYieldCurvesCsv: the four dates, the Market Trade Date with its time');
  eq(y.securities.map(r => `${r.cusip}/${r.source}`), ['C/FedInvest', 'C/Market', 'A/FedInvest', 'A/Market', 'A0/Market', 'B/Market'], 'parseYieldCurvesCsv: security rows in file order');
  const t = y.securities[1];
  eq(t, {
    cusip: 'C', source: 'Market', maturity: '2028-01-15', termYears: 1.2, type: 'TIPS', coupon: 0.0125, price: 100.211,
    ask: 0.04, sa: 0.01, sao: 0.011, settleSaFactor: 1.00248, naiveMaturitySaFactor: 0.99878, maturitySaFactor: 0.99889,
    saPriceFactor: 1.00359, saPrice: 100.571,
  }, 'parseYieldCurvesCsv: a TIPS security row, numbers as numbers');
  const n = y.securities.find(r => r.cusip === 'B');
  ok(n.type === 'Note' && n.ask === 0.04 && [n.sa, n.sao, n.settleSaFactor, n.naiveMaturitySaFactor, n.maturitySaFactor, n.saPriceFactor, n.saPrice].every(Number.isNaN),
    'parseYieldCurvesCsv: a blank cell is NaN');
  ok(!('spot' in n) && !('spotSa' in n), 'parseYieldCurvesCsv: a security row has no spot keys');
  eq(y.spot.map(r => `${r.type}/${r.termYears}/${r.source}`), ['BEI/1/Market', 'TIPS/1/FedInvest', 'TIPS/1/Market', 'Treasury/0.5/Market', 'Treasury/1/FedInvest'], 'parseYieldCurvesCsv: spot rows in file order');
  const bei = y.spot[0];
  ok(Object.keys(bei).sort().join() === 'source,spot,spotSa,termYears,type' && bei.spot === 0.02 && Number.isNaN(bei.spotSa), 'parseYieldCurvesCsv: a spot row, its blank Spot SA NaN');
  ok(Number.isNaN(y.spot.find(r => r.type === 'Treasury').spotSa), 'parseYieldCurvesCsv: Spot SA is NaN on a Treasury spot row');

  eq(JSON.stringify(parseYieldCurvesCsv(reverseColumns(s13))), JSON.stringify(y), 'parseYieldCurvesCsv: columns found by header name, not position');
  ok(throws(() => parseYieldCurvesCsv('a,b\n1,2\n')), 'parseYieldCurvesCsv: no header line throws');
  ok(throws(() => parseYieldCurvesCsv(s13.split('\n').filter(l => l !== 'Trade Date,Market,2026-11-03 17:05').join('\n'))), 'parseYieldCurvesCsv: a missing date line throws');
  ok(throws(() => parseYieldCurvesCsv(s13.replace('Spot SA', 'Spot S'))), 'parseYieldCurvesCsv: a missing column throws');
}
{
  const nominals = [nomSec('N1', 'Note', '2029-01-15', 0.04, 0.041, 100, 99.9, 0.0415)];
  const tips = [tipsSec('T1', '2029-07-15', 0.01, 0.015, 0.014, NaN, 100, 99.8, 0.016)];
  const csv = buildBreakevenCsv({ dates, rows: breakevenRows(tips, nominals) });
  const b = parseBreakevenCsv(csv);
  eq(b.dates, dates.market, 'parseBreakevenCsv: the two Market dates');
  const r = b.rows[0];
  ok(b.rows.length === 1 && r.tipsCusip === 'T1' && r.tipsMaturity === '2029-07-15' && r.tipsCoupon === 0.01 && r.tipsAsk === 0.015 && r.tipsSa === 0.014
    && r.nominalCusip === 'N1' && r.nominalMaturity === '2029-01-15' && r.nominalCoupon === 0.04 && r.nominalAsk === 0.041
    && r.askBei === 0.026 && r.saBei === 0.027, 'parseBreakevenCsv: a row, numbers as numbers');
  ok(Number.isNaN(r.tipsSao) && Number.isNaN(r.saoBei), 'parseBreakevenCsv: a blank cell is NaN');
  eq(JSON.stringify(parseBreakevenCsv(reverseColumns(csv))), JSON.stringify(b), 'parseBreakevenCsv: columns found by header name, not position');
  ok(throws(() => parseBreakevenCsv(csv.split('\n').slice(1).join('\n'))), 'parseBreakevenCsv: a missing date line throws');
}
{
  const nominals = [nomSec('X', 'Note', '2030-02-15', 0.03, 0.04, 100, 99.9, 0.0405)];
  const tips = [tipsSec('T', '2030-02-15', 0.0125, 0.015, 0.014, 0.0145, 100, 99.8, 0.016)];
  const csv = buildSpreadsCsv({ dates, rows: spreadRows(tips, nominals) });
  const s = parseSpreadsCsv(csv);
  eq(s.dates, dates.market, 'parseSpreadsCsv: the two Market dates');
  const byType = Object.fromEntries(s.rows.map(r => [r.type, r]));
  eq(Object.keys(byType.TIPS), ['cusip', 'maturity', 'type', 'coupon', 'askYield', 'bidYield', 'yieldSpreadBps', 'askPrice', 'bidPrice', 'adjustedAskPrice', 'adjustedBidPrice', 'priceSpreadPct'], 'parseSpreadsCsv: the keys of a row');
  ok(byType.TIPS.adjustedAskPrice === 130 && byType.TIPS.adjustedBidPrice === 129.74 && byType.TIPS.priceSpreadPct === 0.2, 'parseSpreadsCsv: a TIPS row, numbers as numbers');
  ok(byType.Note.yieldSpreadBps === 5 && byType.Note.priceSpreadPct === 0.1 && Number.isNaN(byType.Note.adjustedAskPrice) && Number.isNaN(byType.Note.adjustedBidPrice), 'parseSpreadsCsv: a blank adjusted price is NaN');
  eq(JSON.stringify(parseSpreadsCsv(reverseColumns(csv))), JSON.stringify(s), 'parseSpreadsCsv: columns found by header name, not position');
  ok(throws(() => parseSpreadsCsv('Trade Date,2026-11-03 17:05\n' + S15_HEADER + '\n')), 'parseSpreadsCsv: a missing Settlement Date line throws');
}

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
