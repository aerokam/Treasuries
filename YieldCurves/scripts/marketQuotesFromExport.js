// marketQuotesFromExport.js -- turns the raw quote download into the text of Market quotes (S7),
// knowledge/DATA_DICTIONARY.md#s7. Only the columns S7 states are kept; every other column, and
// the quantity quoted beside each price, is dropped here and the raw file is never uploaded.
//
// The raw download's column names are in quoteSource.local.js, which is not in the repository.
//
// Spec: knowledge/1.2_Download_Market_Quotes.md
import { parseCsv } from '../../shared/src/csv.js';
import { EXPORT_COLUMNS as C } from './quoteSource.local.js';

const PRODUCTS = { tips: 'TIPS', treasury: 'Treasury' };

// Strips the ="value" literal-string wrapper the export puts on some fields.
const unwrap = s => (s || '').replace(/^=?["']*/, '').replace(/["']*$/, '').trim();

// "price/quantity(min)" -> the price alone.
const priceOf = s => parseFloat(unwrap(s).split('/')[0].replace(/,/g, ''));
const plain = s => parseFloat(unwrap(s).replace(/,/g, ''));

// MM/DD/YYYY or YYYY-MM-DD -> YYYY-MM-DD, or '' when neither.
function isoMaturity(s) {
  const v = unwrap(s);
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const [mo, dy, yr] = v.split('/');
  return yr ? `${yr}-${mo.padStart(2, '0')}-${dy.padStart(2, '0')}` : '';
}

const num = (v, digits) => (Number.isFinite(v) ? String(+v.toFixed(digits)) : '');

// The instant `now` as "YYYY-MM-DD HH:MM" on the Eastern clock. The zone is named here, so the
// result does not depend on the time zone of the machine the run is on.
export function easternStamp(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(now).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

// Returns { text, stamp, tipsCount, treasuryCount }. The stamp is the time of this run, on the
// Eastern clock; the download's own date line is not read.
export function marketQuotesFromExport(raw, now = new Date()) {
  const stamp = easternStamp(now);

  const out = [];
  const seen = new Set();
  let tipsCount = 0, treasuryCount = 0;
  for (const row of parseCsv(raw.replace(/^﻿/, '').replace(/="([^"]+)"/g, '$1'))) {
    const type = PRODUCTS[unwrap(row[C.product]).toLowerCase()];
    const cusip = unwrap(row[C.cusip]);
    if (!type || !cusip || seen.has(cusip)) continue;
    const maturity = isoMaturity(row[C.maturity]);
    if (!maturity) continue;
    seen.add(cusip);
    if (type === 'TIPS') tipsCount++; else treasuryCount++;
    out.push([
      type, cusip, maturity,
      num(parseFloat(unwrap(row[C.coupon])) / 100 || 0, 8),
      num(priceOf(row[C.ask]), 8),
      num(priceOf(row[C.bid]), 8),
      type === 'TIPS' ? num(plain(row[C.adjAsk]), 8) : '',
      type === 'TIPS' ? num(plain(row[C.adjBid]), 8) : '',
    ].join(','));
  }
  const header = 'type,cusip,maturity,coupon,askPrice,bidPrice,adjAskPrice,adjBidPrice';
  return { text: [stamp, header, ...out].join('\n') + '\n', stamp, tipsCount, treasuryCount };
}
