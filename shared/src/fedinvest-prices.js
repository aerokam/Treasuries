// fedinvest-prices.js — FedInvest (E1) price-row parsing, TIPS/Treasury selection, yield
// calculation and S1 (YieldsFromFedInvestPrices.csv) serialization.
// Spec: knowledge/1.1_Download_FedInvest_Prices.md
//
// Shared by scripts/getYieldsFedInvest.js (the daily job: all four E1 types, uploads S1 to
// R2) and scripts/getFedInvestPricesForDate.js (the historical tool: TIPS only, writes a
// local file in S1's composition). Both scripts still run their own HTTP session/CSRF
// dance against FedInvest's endpoints — that part differs (today's endpoint vs. the
// date-selection flow) and is not shared — but the row parsing, selection and yield rules
// below are the same transformation in both, so per projects/CLAUDE.md §2a this is their
// one implementation.

import { yieldFromPrice } from './bond-math.js';
import { localDate } from './settlement.js';
import { parseCsv } from './csv.js';

// E1 SECURITY TYPE values 1.1.2 keeps. FRN and every other type is dropped by omission —
// a caller filters parseFedInvestPriceRows()'s output against this set (or a subset of it,
// as the historical tool does with TIPS alone).
export const FEDINVEST_TYPES = new Set(['TIPS', 'MARKET BASED BILL', 'MARKET BASED NOTE', 'MARKET BASED BOND']);

// spec: 1.1_Download_FedInvest_Prices.md#select-tips-and-treasury-prices
// Parses E1's CSV price-table rows (CUSIP,SECURITY TYPE,RATE,MATURITY DATE,CALL DATE,BUY,
// SELL,END OF DAY,...) into one object per CUSIP data row. `maturity` is left as E1 states
// it (MM/DD/YYYY); `coupon`/`buy`/`sell`/`eod` are parsed floats, each falling through to 0
// on a blank or unparseable cell.
export function parseFedInvestPriceRows(text) {
  return text.trim().split('\n')
    .filter(l => /^[A-Z0-9]{9},/.test(l))   // CUSIP data rows only
    .map(line => {
      const c = line.split(',').map(s => s.trim());
      return {
        cusip:    c[0],
        type:     c[1],
        coupon:   parseFloat(c[2]),
        maturity: c[3],
        buy:      parseFloat(c[5]) || 0,
        sell:     parseFloat(c[6]) || 0,
        eod:      parseFloat(c[7]) || 0,
      };
    });
}

// spec: 1.1_Download_FedInvest_Prices.md#select-tips-and-treasury-prices
// The BUY price, the SELL price where BUY is empty or zero, the END OF DAY price where
// both are. Null when a row has none of the three.
export function selectPrice(row) {
  return row.buy || row.sell || row.eod || null;
}

// FedInvest maturity dates are MM/DD/YYYY — convert to YYYY-MM-DD.
export function parseFedInvestDate(str) {
  const [m, d, y] = str.split('/').map(Number);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// spec: 1.1_Download_FedInvest_Prices.md#select-tips-and-treasury-prices
// Parses S2 (TipsRef.csv, header cusip,maturity,datedDate,coupon,datedDateRefCpi,term) into
// a Map keyed by CUSIP, via shared/src/csv.js#parseCsv.
export function parseTipsRefMap(text) {
  return new Map(parseCsv(text).map(r => [r.cusip, {
    maturity:        r.maturity,
    coupon:          parseFloat(r.coupon),
    datedDateRefCpi: parseFloat(r.datedDateRefCpi),
  }]));
}

// spec: 1.1_Download_FedInvest_Prices.md#select-tips-and-treasury-prices
// Merges one parsed E1 row with S2's TIPS metadata (or E1's own RATE/MATURITY DATE for a
// non-TIPS security), applying the BUY/SELL/END OF DAY price selection. Returns null for a
// TIPS that S2 does not hold — that row is dropped, not included in the TIPS Prices output.
export function selectPricedSecurity(row, tipsRefMap) {
  const price = selectPrice(row);
  if (row.type === 'TIPS') {
    const ref = tipsRefMap.get(row.cusip);
    if (!ref) return null;
    return {
      type: row.type, cusip: row.cusip,
      maturity: ref.maturity, coupon: ref.coupon, datedDateCpi: ref.datedDateRefCpi,
      price,
    };
  }
  return {
    type: row.type, cusip: row.cusip,
    maturity: parseFedInvestDate(row.maturity), coupon: row.coupon, datedDateCpi: '',
    price,
  };
}

// spec: 1.1_Download_FedInvest_Prices.md#calculate-yields
// Yield of a selected security's Clean Price at settleDateStr (a YYYY-MM-DD string), via
// shared/src/bond-math.js#yieldFromPrice. Null for a security with no price.
export function yieldForSecurity(security, settleDateStr) {
  if (!security.price) return null;
  return yieldFromPrice(security.price, security.coupon, localDate(settleDateStr), localDate(security.maturity));
}

// spec: 1.1_Download_FedInvest_Prices.md#calculate-yields
// Serializes S1 in its composition (DATA_DICTIONARY.md#s1): the settlement date on line 1,
// the header, then one line per row. `formatYield` lets a caller keep its own existing
// number formatting — getYieldsFedInvest.js writes toFixed(8), getFedInvestPricesForDate.js
// writes the number unformatted; both are preserved as-is rather than unified.
export function serializeS1(settleDateStr, rows, formatYield = (y) => (y ?? '')) {
  const header = 'type,cusip,maturity,coupon,datedDateCpi,price,yield';
  const lines = rows.map(r =>
    [r.type, r.cusip, r.maturity, r.coupon, r.datedDateCpi, r.price ?? '', formatYield(r.yield)].join(',')
  );
  return [settleDateStr, header, ...lines].join('\n') + '\n';
}
