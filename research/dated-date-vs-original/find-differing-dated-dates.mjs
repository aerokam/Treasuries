// Lists every row of Auction results (S5) whose dated_date differs from original_dated_date.
// An original_dated_date of "null" or empty is treated as not stated.
const URL = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/Auctions.csv';

function parse(s) {
  const rows = []; let r = [], f = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { r.push(f); f = ''; }
    else if (c === '\n') { r.push(f.replace(/\r$/, '')); rows.push(r); r = []; f = ''; }
    else f += c;
  }
  if (f || r.length) { r.push(f); rows.push(r); }
  return rows;
}

const text = await (await fetch(URL, { cache: 'no-store' })).text();
const rows = parse(text).filter(r => r.length > 50);
const h = rows[0], ix = n => h.indexOf(n);
const [d, o, a, re, ty, tm, ac, is, mt, cu] =
  ['dated_date', 'original_dated_date', 'announcemtd_orig_dated_date', 'reopening', 'security_type',
   'security_term', 'comp_auction_close_date', 'issue_date', 'maturity_date', 'cusip'].map(ix);
const stated = v => v && v !== 'null';

const tally = {}, differing = [];
for (const r of rows.slice(1)) {
  const rel = !stated(r[o]) ? 'original empty' : r[d] === r[o] ? 'equal' : 'differs';
  const key = `reopening=${r[re]}, original ${rel}`;
  tally[key] = (tally[key] || 0) + 1;
  if (rel === 'differs') differing.push(r);
}
console.log('rows', rows.length - 1);
console.log('announcemtd_orig_dated_date stated in', rows.slice(1).filter(r => stated(r[a])).length, 'rows');
console.log(tally);
for (const r of differing.sort((x, y) => x[ac].localeCompare(y[ac])))
  console.log([r[cu], r[ac], r[ty], r[tm], 'issue', r[is], 'D', r[d], 'O', r[o], 'mat', r[mt]].join(' '));
