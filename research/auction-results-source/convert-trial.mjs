// Trial conversion of S5 to the columns of treasury_securities_auctions_v2, and its audit (Migration_Plan.md step 4).
// Run: node research/auction-results-source/convert-trial.mjs <the copy of Auctions.csv made before the conversion>
// Writes data/Auctions_converted_trial.csv and data/conversion-audit.txt. Nothing is published.
// The audit judges the conversion against field-map.csv (which columns each old column became) and does not use the
// conversion's own tables.
import fs from 'node:fs';
import { parseCsv } from '../../shared/src/csv.js';
import { convertOldRow, S5_COLUMNS, DROPPED_OLD_COLUMNS, isNull } from '../../shared/src/auction-results.js';

const dir = new URL('./data/', import.meta.url);
const old = parseCsv(fs.readFileSync(process.argv[2], 'utf8'));
const oldColumns = Object.keys(old[0]);
const converted = old.map(convertOldRow);

const esc = v => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
fs.writeFileSync(new URL('Auctions_converted_trial.csv', dir),
  [S5_COLUMNS.join(','), ...converted.map(({ row }) => S5_COLUMNS.map(c => esc(row[c])).join(','))].join('\n') + '\n');

const out = [];
const say = s => { out.push(s); console.log(s); };

// 1. Rows and keys
const oldKeys = old.map(r => `${r.cusip}|${r.auction_date}`);
const newKeys = converted.map(({ row }) => `${row.cusip}|${row.comp_auction_close_date}`);
say(`1. Rows: ${old.length} before, ${converted.length} after. Distinct keys (CUSIP and auction date): ${new Set(oldKeys).size} before, ${new Set(newKeys).size} after. Keys equal: ${oldKeys.every((k, i) => k === newKeys[i])}. Columns: ${oldColumns.length} before, ${S5_COLUMNS.length} after.`);

// 2. Every stated value of every old column is in a column it became
const map = parseCsv(fs.readFileSync(new URL('./field-map.csv', import.meta.url), 'utf8'));
const [cOld, cRel, cNew] = Object.keys(map[0]);
// A derived column (noncomp_accepted) is checked in 4, not by finding its value in a column it became.
const destinations = new Map(map.filter(r => r[cOld] !== '(none)' && r[cRel] !== 'derived').map(r => [r[cOld], r[cNew] ? r[cNew].split(' + ') : []]));
const numeric = v => Number.isFinite(Number(v)) && v.trim() !== '';
const holds = (col, value, row, dests) => {
  const v = value.replace(/^'(?=-)/, '');
  return dests.some(d => {
    const cell = row[d];
    if (isNull(cell)) return false;
    if (cell === v || cell === `${v} ET` || cell.toLowerCase() === v.toLowerCase()) return true;
    if (numeric(cell) && numeric(v) && Number(cell) === Number(v)) return true;
    const term = /^(\d+)-(Day|Week|Month|Year)$/.exec(v);
    return term !== null && cell === term[1];
  });
};
say('');
say('2. Stated values of each old column, and how many are in a column it became (columns that became nothing are listed in 5):');
const lost = [];
for (const col of oldColumns) {
  const dests = destinations.get(col);
  if (!dests || dests.length === 0) continue;
  let stated = 0, placed = 0, zero = 0;
  old.forEach((r, i) => {
    if (isNull(r[col])) return;
    stated++;
    if (holds(col, r[col], converted[i].row, dests)) placed++;
    else if (/^0-(Day|Week|Month|Year)$/.test(r[col])) zero++;
    else lost.push(`${r.cusip} ${r.auction_date} ${col} ${r[col]}`);
  });
  const note = stated === placed ? '' : `  <- ${stated - placed} not in ${dests.join(', ')}${zero ? ` (${zero} are zero terms)` : ''}`;
  say(`   ${col.padEnd(34)} stated ${String(stated).padStart(6)}, placed ${String(placed).padStart(6)}${note}`);
}
say(`   Values not placed other than a zero term: ${lost.length}${lost.length ? '\n     ' + lost.slice(0, 40).join('\n     ') : ''}`);

// 3. Where a rule did not apply, or two old columns disagreed
const flags = {};
converted.forEach(({ flags: fs_ }, i) => fs_.forEach(f => { (flags[f.replace(/\d+-(Day|Week|Month|Year)/, 'N-$1').replace(/\d+ of/, 'n of')] ||= []).push(`${old[i].cusip} ${old[i].auction_date}`); }));
say('');
say('3. Rows where a rule did not apply or two old columns disagreed:');
for (const [f, rows] of Object.entries(flags)) say(`   ${f}: ${rows.length} rows${rows.length <= 12 ? ' (' + rows.join(', ') + ')' : ' (first ' + rows.slice(0, 3).join(', ') + ')'}`);
if (Object.keys(flags).length === 0) say('   none');

// 4. noncomp_accepted is derivable
let checked = 0; const broken = [];
for (const r of old) {
  if (isNull(r.noncomp_accepted)) continue;
  const parts = [r.total_accepted, r.comp_accepted, r.fima_noncomp_accepted, r.soma_accepted];
  if (parts.some(isNull)) { broken.push(`${r.cusip} ${r.auction_date} a part is not stated`); continue; }
  checked++;
  const derived = Number(parts[0]) - Number(parts[1]) - Number(parts[2]) - Number(parts[3]);
  if (derived !== Number(r.noncomp_accepted)) broken.push(`${r.cusip} ${r.auction_date} noncomp_accepted ${r.noncomp_accepted}, derived ${derived}`);
}
say('');
say(`4. noncomp_accepted, stated in ${old.filter(r => !isNull(r.noncomp_accepted)).length} rows: total less competitive, FIMA and SOMA awarded equals it in ${checked - broken.filter(b => !b.includes('a part')).length} of ${checked} rows with all parts stated; ${broken.length} rows do not match or lack a part${broken.length ? '\n     ' + broken.slice(0, 20).join('\n     ') : ''}`);

// 5. Old columns that became nothing
say('');
say('5. Old columns not carried: ' + DROPPED_OLD_COLUMNS.map(c => `${c} (stated in ${old.filter(r => !isNull(r[c])).length} rows)`).join(', '));
const unaccounted = oldColumns.filter(c => !(destinations.get(c)?.length) && !DROPPED_OLD_COLUMNS.includes(c));
say(`   Old columns in neither a destination of field-map.csv, nor the list above, nor 4: ${unaccounted.length ? unaccounted.join(', ') : 'none'}`);

fs.writeFileSync(new URL('conversion-audit.txt', dir), out.join('\n') + '\n');
