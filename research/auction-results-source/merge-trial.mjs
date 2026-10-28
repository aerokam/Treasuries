// Trial merge of the whole treasury_securities_auctions_v2 table over the converted S5 (Migration_Plan.md step 5), and its audit.
// Run: node research/auction-results-source/merge-trial.mjs <the copy of Auctions.csv made before the conversion>
// Writes data/Auctions_merged_trial.csv and data/merge-audit.txt. Nothing is published.
import fs from 'node:fs';
import { parseCsv } from '../../shared/src/csv.js';
import { convertOldRow, mergeAuctionRows, S5_COLUMNS, isNull } from '../../shared/src/auction-results.js';

const FD = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od';
const DATE = 'comp_auction_close_date';
const dir = new URL('./data/', import.meta.url);

const converted = parseCsv(fs.readFileSync(process.argv[2], 'utf8')).map(r => convertOldRow(r).row);
const response = await (await fetch(`${FD}/treasury_securities_auctions_v2?page[size]=10000&sort=-${DATE}`)).json();
const v2 = response.data.map(r => Object.fromEntries(S5_COLUMNS.map(c => [c, isNull(r[c]) ? 'null' : String(r[c])])));
const v2Unknown = Object.keys(response.data[0]).filter(c => !S5_COLUMNS.includes(c));

const { rows: merged, added } = mergeAuctionRows(converted, v2);

const esc = v => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
fs.writeFileSync(new URL('Auctions_merged_trial.csv', dir),
  [S5_COLUMNS.join(','), ...merged.map(r => S5_COLUMNS.map(c => esc(r[c])).join(','))].join('\n') + '\n');

const out = [];
const say = s => { out.push(s); console.log(s); };
const key = r => `${r.cusip}|${r[DATE]}`;
const before = new Map(converted.map(r => [key(r), r]));
const v2Keys = new Set(v2.map(key));
const numeric = v => v.trim() !== '' && Number.isFinite(Number(v));
const agree = (c, a, b) => a === b || (numeric(a) && numeric(b) && Number(a) === Number(b)) || (c === 'pricing_method' && a.toLowerCase() === b.toLowerCase()) || (c === 'cpi_base_reference_period' && a.replace(/=100$/, '') === b.replace(/=100$/, ''));

say(`1. The new table states ${v2.length} auctions (${v2.at(-1)[DATE]} to ${v2[0][DATE]}), ${v2Unknown.length} of its fields are not S5 columns${v2Unknown.length ? ': ' + v2Unknown.join(', ') : ''}. S5 holds ${converted.length} rows. After the merge: ${merged.length} rows, ${added} added, ${v2.length - added} merged into an existing row. Dates ${merged.at(-1)[DATE]} to ${merged[0][DATE]}.`);
const addedRows = v2.filter(r => !before.has(key(r)));
say(`   Added: ${addedRows.map(r => `${r.cusip} ${r[DATE]} ${r.security_term}`).join('; ')}`);
const absent = converted.filter(r => r[DATE] >= v2.at(-1)[DATE] && !v2Keys.has(key(r)));
say(`   S5 rows dated within the new table's range that the new table does not state: ${absent.length}${absent.length ? ' (' + absent.map(r => `${r.cusip} ${r[DATE]}`).join(', ') + ')' : ''}`);

const kept = {}, filled = {}, disagree = {};
for (const r of v2) {
  const b = before.get(key(r));
  if (!b) continue;
  for (const c of S5_COLUMNS) {
    if (isNull(r[c])) { if (!isNull(b[c])) kept[c] = (kept[c] || 0) + 1; continue; }
    if (isNull(b[c])) filled[c] = (filled[c] || 0) + 1;
    else if (!agree(c, b[c], r[c])) (disagree[c] ||= []).push(`${r.cusip} ${r[DATE]}: S5 ${b[c]}, new table ${r[c]}`);
  }
}
const total = o => Object.values(o).reduce((s, v) => s + (Array.isArray(v) ? v.length : v), 0);
const list = o => Object.entries(o).sort((a, b) => (Array.isArray(b[1]) ? b[1].length : b[1]) - (Array.isArray(a[1]) ? a[1].length : a[1])).map(([c, v]) => `${c} ${Array.isArray(v) ? v.length : v}`).join(', ');
say('');
say(`2. Cells where both state a value and the values differ other than in form (number digits, case, =100): ${total(disagree)}${total(disagree) ? '\n   ' + Object.entries(disagree).map(([c, v]) => `${c}: ${v.slice(0, 5).join(' | ')}`).join('\n   ') : ''}`);
say(`3. Cells where the new table states a value and S5 stated none (new information), in rows S5 held: ${total(filled)}. By column: ${list(filled)}`);
say(`4. Cells where the new table states null and the converted value is kept: ${total(kept)}. By column: ${list(kept)}`);

const fromV2 = merged.filter(r => r[DATE] >= v2.at(-1)[DATE]);
const stated = c => merged.filter(r => !isNull(r[c])).length;
const newColumns = S5_COLUMNS.filter(c => merged.every(r => r[DATE] >= v2.at(-1)[DATE] || isNull(r[c])));
say('');
say(`5. Columns that state a value only from ${v2.at(-1)[DATE]} on: ${newColumns.length}. Rows from that date: ${fromV2.length}.`);
say(`   Rows before it: ${merged.length - fromV2.length}. Columns with no stated value anywhere: ${S5_COLUMNS.filter(c => stated(c) === 0).join(', ') || 'none'}`);
say(`6. Rows with a stated grand_total_par_awarded: ${stated('grand_total_par_awarded')} of ${merged.length}. Rows without one: ${merged.filter(r => isNull(r.grand_total_par_awarded)).map(r => `${r.cusip} ${r[DATE]} ${r.security_term}`).join('; ')}`);
fs.writeFileSync(new URL('merge-audit.txt', dir), out.join('\n') + '\n');
