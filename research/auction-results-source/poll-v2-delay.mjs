// Measures how long after the competitive close treasury_securities_auctions_v2 and TreasuryDirect state an auction's results.
// Reads both every 30 seconds on the auction date and records, per auction, the first reading that states grand_total_par_awarded.
// Run: node research/auction-results-source/poll-v2-delay.mjs [--date YYYY-MM-DD] [--polls N]
// Output: research/auction-results-source/data/v2-delay-<date>.jsonl (one line per reading) and v2-delay-<date>.txt (the result).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { easternNow, isNull } from '../../shared/src/auction-results.js';

const FD = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od';
const TD = 'https://www.treasurydirect.gov/TA_WS/securities';
const INTERVAL_MS = 30_000;
const STOP_MINUTES = 15 * 60; // 3:00 PM ET

const arg = name => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : null; };
const date = arg('date') || easternNow().date;
const maxPolls = Number(arg('polls')) || Infinity;
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
fs.mkdirSync(dir, { recursive: true });
const jsonl = path.join(dir, `v2-delay-${date}.jsonl`);
const report = path.join(dir, `v2-delay-${date}.txt`);

const closeMinutes = s => {
  const m = /^(\d\d?):(\d\d) (AM|PM)/.exec(s || '');
  return m ? (Number(m[1]) % 12 + (m[3] === 'PM' ? 12 : 0)) * 60 + Number(m[2]) : null;
};
const getJson = async url => (await fetch(url)).json();

// first[source][cusip] = minutes after midnight ET (to the second) of the first reading that states the total awarded
const first = { v2: {}, td: {} };
const auctions = {};
const etMinutes = d => { const p = easternNow(d); return p.minutes + d.getSeconds() / 60; };

for (let n = 0; n < maxPolls; n++) {
  const now = new Date();
  const [v2, td] = await Promise.all([
    getJson(`${FD}/treasury_securities_auctions_v2?filter=comp_auction_close_date:eq:${date}&page[size]=100&fields=cusip,security_term,grand_total_par_awarded`),
    getJson(`${TD}/auctioned?format=json&days=3`),
  ]).catch(e => [{ data: [] }, []]);
  const tdToday = td.filter(r => String(r.competitiveAuctionCloseDate).slice(0, 10) === date);
  const stated = { v2: {}, td: {} };
  for (const r of v2.data) {
    auctions[r.cusip] ||= { term: r.security_term };
    stated.v2[r.cusip] = !isNull(r.grand_total_par_awarded);
  }
  for (const r of tdToday) {
    auctions[r.cusip] = { term: r.securityTerm, close: closeMinutes(r.competitiveAuctionCloseTime) };
    stated.td[r.cusip] = !isNull(r.grandTotalParAwarded);
  }
  for (const src of ['v2', 'td']) {
    for (const [cusip, ok] of Object.entries(stated[src])) if (ok && first[src][cusip] === undefined) first[src][cusip] = etMinutes(now);
  }
  fs.appendFileSync(jsonl, JSON.stringify({ at: now.toISOString(), v2: stated.v2, td: stated.td }) + '\n');

  const cusips = Object.keys(auctions);
  const done = cusips.length > 0 && cusips.every(c => first.v2[c] !== undefined && first.td[c] !== undefined);
  if (done || easternNow().minutes >= STOP_MINUTES) break;
  await new Promise(r => setTimeout(r, INTERVAL_MS));
}

const fmt = m => m === undefined ? 'not stated' : `${Math.floor(m / 60)}:${String(Math.floor(m % 60)).padStart(2, '0')}:${String(Math.round((m % 1) * 60)).padStart(2, '0')} ET`;
const after = (m, close) => m === undefined || close == null ? '' : ` (${(m - close).toFixed(1)} min after the close)`;
const lines = [`Results stated by treasury_securities_auctions_v2 and TreasuryDirect, auctions of ${date}, read every ${INTERVAL_MS / 1000} seconds.`];
for (const [cusip, a] of Object.entries(auctions)) {
  lines.push(`${cusip} ${a.term}, close ${a.close == null ? 'unknown' : fmt(a.close)}: v2 ${fmt(first.v2[cusip])}${after(first.v2[cusip], a.close)}; TreasuryDirect ${fmt(first.td[cusip])}${after(first.td[cusip], a.close)}`);
}
fs.writeFileSync(report, lines.join('\n') + '\n');
console.log(lines.join('\n'));
