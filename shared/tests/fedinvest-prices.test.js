// fedinvest-prices.test.js — Regression coverage for shared/src/fedinvest-prices.js.
// Run: node shared/tests/fedinvest-prices.test.js
//
// Added when scripts/getYieldsFedInvest.js and scripts/getFedInvestPricesForDate.js's separate
// copies of the 1.1.2/1.1.3 merge rules were consolidated onto this module (projects/CLAUDE.md
// §2a no-redundancy directive). Pins the selection rules knowledge/1.1_Download_FedInvest_Prices.md
// #select-prices-and-add-tips-reference-data states: the BUY/SELL/END OF DAY price fallback, an FRN dropped
// by the type filter, and a TIPS S2 does not hold dropped rather than written with no metadata.

import {
  FEDINVEST_TYPES, parseFedInvestPriceRows, parseTipsRefMap,
  selectPrice, selectPricedSecurity, parseFedInvestPrices, serializeS1,
} from '../src/fedinvest-prices.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } };

// ── selectPrice: SELL and END OF DAY fallback ──────────────────────────────────
ok(selectPrice({ buy: 101.5, sell: 0, eod: 0 }) === 101.5, 'selectPrice takes BUY when present');
ok(selectPrice({ buy: 0, sell: 99.75, eod: 0 }) === 99.75, 'selectPrice falls through to SELL when BUY is 0');
ok(selectPrice({ buy: 0, sell: 0, eod: 100.125 }) === 100.125, 'selectPrice falls through to END OF DAY when BUY and SELL are both 0');
ok(selectPrice({ buy: 0, sell: 0, eod: 0 }) === null, 'selectPrice is null when all three are 0');

// ── parseFedInvestPriceRows + FEDINVEST_TYPES: FRN dropped ─────────────────────
{
  const csv = [
    '912828AB1,TIPS,0.125,01/15/2030,,101.500000,101.450000,101.480000',
    '912828AB2,FRN,0.000,01/15/2027,,99.900000,99.890000,99.895000',
    '912828AB3,MARKET BASED NOTE,1.250,01/15/2032,,98.500000,98.400000,98.450000',
  ].join('\n');
  const rows = parseFedInvestPriceRows(csv).filter(r => FEDINVEST_TYPES.has(r.type));
  ok(rows.length === 2, `FRN dropped by FEDINVEST_TYPES filter: expected 2 rows, got ${rows.length}`);
  ok(!rows.some(r => r.type === 'FRN'), 'no FRN row survives the type filter');
  ok(rows.some(r => r.cusip === '912828AB1' && r.type === 'TIPS'), 'TIPS row kept');
  ok(rows.some(r => r.cusip === '912828AB3' && r.type === 'MARKET BASED NOTE'), 'MARKET BASED NOTE row kept');
}

// ── selectPricedSecurity: TIPS missing from S2 is dropped ──────────────────────
{
  const refMap = parseTipsRefMap(
    'cusip,maturity,datedDate,coupon,datedDateRefCpi,term\n' +
    '912828AB1,2030-01-15,2020-01-15,0.00125,250.5,10'
  );
  const inRef = { cusip: '912828AB1', type: 'TIPS', coupon: 0.125, maturity: '01/15/2030', buy: 101.5, sell: 0, eod: 0 };
  const notInRef = { cusip: '912828ZZ9', type: 'TIPS', coupon: 0.125, maturity: '01/15/2031', buy: 102.0, sell: 0, eod: 0 };

  const sel1 = selectPricedSecurity(inRef, refMap);
  ok(sel1 !== null, 'a TIPS S2 holds is kept');
  ok(sel1.maturity === '2030-01-15', "kept TIPS takes S2's maturity, not E1's");
  ok(sel1.coupon === 0.00125, "kept TIPS takes S2's coupon, not E1's RATE");
  ok(sel1.datedDateCpi === 250.5, "kept TIPS takes S2's dated date Ref CPI");
  ok(sel1.price === 101.5, 'kept TIPS keeps its selected price');

  const sel2 = selectPricedSecurity(notInRef, refMap);
  ok(sel2 === null, 'a TIPS S2 does not hold is dropped (null)');

  // Non-TIPS keeps its own RATE and MATURITY DATE (converted MM/DD/YYYY -> YYYY-MM-DD).
  const bond = { cusip: '912828XY1', type: 'MARKET BASED BOND', coupon: 2.5, maturity: '02/15/2045', buy: 0, sell: 97.25, eod: 0 };
  const sel3 = selectPricedSecurity(bond, refMap);
  ok(sel3.maturity === '2045-02-15', 'non-TIPS maturity converted from MM/DD/YYYY to YYYY-MM-DD');
  ok(sel3.coupon === 2.5, "non-TIPS keeps E1's own RATE");
  ok(sel3.price === 97.25, 'non-TIPS price falls through BUY(0) to SELL');
}

// ── parseFedInvestPrices: S1 text, the inverse of serializeS1 ──────────────────
{
  const text = serializeS1('2026-11-03', [
    { type: 'TIPS', cusip: '912828AB1', maturity: '2030-01-15', coupon: 0.00125, datedDateCpi: 250.5, price: 101.5, yield: 0.01 },
    { type: 'MARKET BASED NOTE', cusip: '912828AB3', maturity: '2032-01-15', coupon: 1.25, datedDateCpi: '', price: 98.5, yield: 0.04 },
  ]);
  const p = parseFedInvestPrices(text);
  ok(p.settlementDate === '2026-11-03', 'parseFedInvestPrices: the Settlement Date of the first line');
  ok(p.tips.length === 1 && p.tips[0].cusip === '912828AB1' && p.tips[0].price === '101.5', 'parseFedInvestPrices: the TIPS rows, cells as written');
  ok(p.nominals.length === 1 && p.nominals[0].type === 'MARKET BASED NOTE', 'parseFedInvestPrices: every other row is a nominal');
  ok([...p.tips, ...p.nominals].every(r => r.settlementDate === '2026-11-03'), 'parseFedInvestPrices: every row has the Settlement Date');
  const throws = s => { try { parseFedInvestPrices(s); return false; } catch { return true; } };
  ok(throws('cusip,price\nX,100\n'), 'parseFedInvestPrices: no header line throws');
  ok(throws('type,cusip\nTIPS,X\n'), 'parseFedInvestPrices: no Settlement Date line throws');
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
