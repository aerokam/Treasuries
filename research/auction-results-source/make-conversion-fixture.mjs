// Writes shared/tests/auction-conversion.fixture.json: the auctions to 2026-10-22 that S5 (as auctions_query and TreasuryDirect filled it)
// and treasury_securities_auctions_v2 both state, each as the old row and the new row, holding only the columns that state a value.
// Run: node research/auction-results-source/make-conversion-fixture.mjs <the copy of Auctions.csv made before the conversion>
import fs from 'node:fs';
import { parseCsv } from '../../shared/src/csv.js';
import { isNull } from '../../shared/src/auction-results.js';

const FD = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od';
const old = parseCsv(fs.readFileSync(process.argv[2], 'utf8'));
const v2 = (await (await fetch(`${FD}/treasury_securities_auctions_v2?page[size]=1000&sort=-comp_auction_close_date`)).json()).data;

const stated = row => Object.fromEntries(Object.entries(row).filter(([, v]) => !isNull(v)));
// auctions_query states no auction after 2026-10-22; the S5 rows after it were filled from TreasuryDirect.
const oldByKey = new Map(old.filter(r => r.auction_date <= '2026-10-22').map(r => [`${r.cusip}|${r.auction_date}`, r]));
const pairs = v2.map(r => [oldByKey.get(`${r.cusip}|${r.comp_auction_close_date}`), r]).filter(([o]) => o);

const out = new URL('../../shared/tests/auction-conversion.fixture.json', import.meta.url);
fs.writeFileSync(out, JSON.stringify({
  captured: new Date().toISOString().slice(0, 10),
  pairs: pairs.map(([o, n]) => ({ old: stated(o), v2: stated(n) })),
}));
console.log(`${pairs.length} auctions in both tables, written to ${out.pathname}`);
