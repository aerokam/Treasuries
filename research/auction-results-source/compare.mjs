// Compares the three auction sources on the same auctions, reading each live.
// Run: node research/auction-results-source/compare.mjs
const FD = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od';
const TD = 'https://www.treasurydirect.gov/TA_WS/securities';

const isNull = v => v == null || v === '' || v === 'null';
const day = v => String(v).slice(0, 10);
const key = (cusip, date) => `${cusip}|${day(date)}`;
const norm = v => (isNull(v) ? null : String(v).replace(/T00:00:00$/, ''));
const same = (a, b) => {
  a = norm(a); b = norm(b);
  if (a === null || b === null) return a === b;
  return a === b || (Number.isFinite(Number(a)) && Number(a) === Number(b));
};
const getJson = async url => (await fetch(url)).json();

const [v2, old, td, tdAnnounced, tdUpcoming] = await Promise.all([
  getJson(`${FD}/treasury_securities_auctions_v2?page[size]=1000&sort=-comp_auction_close_date`),
  getJson(`${FD}/auctions_query?page[size]=1&sort=-auction_date`),
  getJson(`${TD}/auctioned?format=json&days=4000`),
  getJson(`${TD}/announced?format=json`),
  getJson(`${TD}/upcoming?format=json`),
]);
const v2rows = v2.data;
const v2Fields = Object.keys(v2rows[0]);
const tdFields = Object.keys(td[0]);
const oldFields = Object.keys(old.data[0]);

console.log(`Fields: TreasuryDirect ${tdFields.length}, treasury_securities_auctions_v2 ${v2Fields.length}, auctions_query ${oldFields.length}`);
console.log(`auctions_query names kept in v2: ${oldFields.filter(f => v2Fields.includes(f)).length}, changed: ${oldFields.filter(f => !v2Fields.includes(f)).length}`);

const dates = rows => rows.map(r => day(r.comp_auction_close_date ?? r.competitiveAuctionCloseDate)).sort();
const v2d = dates(v2rows), tdd = dates(td);
console.log(`v2: ${v2rows.length} auctions, ${v2d[0]} to ${v2d.at(-1)}`);
console.log(`TreasuryDirect auctioned (days=4000): ${td.length} auctions, ${tdd[0]} to ${tdd.at(-1)}; announced ${tdAnnounced.length}; upcoming ${tdUpcoming.length}`);

const tdByKey = new Map(td.map(r => [key(r.cusip, r.competitiveAuctionCloseDate), r]));
const pairs = v2rows.map(r => [r, tdByKey.get(key(r.cusip, r.comp_auction_close_date))]).filter(p => p[1]);
console.log(`Auctions in both: ${pairs.length}`);

let identical = 0, allNull = 0;
const differing = [];
for (const f of v2Fields) {
  if (!pairs.some(([a]) => !isNull(a[f]))) { allNull++; continue; }
  const match = tdFields.some(g => pairs.every(([a, b]) => same(a[f], b[g])));
  if (match) identical++; else differing.push(f);
}
console.log(`v2 fields with an identical TreasuryDirect field over those auctions: ${identical}; null in every row: ${allNull}; no identical field: ${differing.length} (${differing.join(', ')})`);
console.log(`Same results XML file name: ${pairs.filter(([a, b]) => a.xml_filenm_comp_results === b.treasuryAuctionResultsXmlFileName).length} of ${pairs.length}`);

const minutes = s => Number(s.slice(11, 13)) * 60 + Number(s.slice(14, 16)) + Number(s.slice(17, 19)) / 60;
const closeMinutes = t => { const m = /^(\d\d?):(\d\d) (AM|PM)/.exec(t); return (Number(m[1]) % 12 + (m[3] === 'PM' ? 12 : 0)) * 60 + Number(m[2]); };
const lag = td.filter(r => day(r.updatedTimestamp) === day(r.competitiveAuctionCloseDate) && r.grandTotalParAwarded)
  .map(r => minutes(r.updatedTimestamp) - closeMinutes(r.competitiveAuctionCloseTime)).sort((a, b) => a - b);
console.log(`TreasuryDirect updatedTimestamp after the competitive close, auctions updated on their own date (${lag.length}): median ${lag[Math.floor(lag.length / 2)].toFixed(1)} min, max ${lag.at(-1).toFixed(1)} min`);

for (const [label, fmt] of [['xml', 'xml'], ['csv', 'csv']]) {
  const r = await fetch(`${TD}/auctioned?format=${fmt}&days=5`);
  console.log(`TreasuryDirect format=${label}: HTTP ${r.status}`);
}
