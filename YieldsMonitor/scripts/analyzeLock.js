// analyzeLock.js — read lock-probe.csv and pin, per completed day, the overnight time at
// which CNBC revised that day's daily bar to its final (~3PM benchmark) value and stopped
// moving. See Close_Price_Investigation.md §8.
//
// For each symbol + bar_date, walks the time-ordered samples and reports the LOCK time:
// the earliest fetchedAtET after which bar_val never changes again. A collapsed timeline
// (one line per distinct value) shows the live→frozen transition. The current (latest) day
// is skipped — it is still provisional. Days already constant before the first sample show
// "(locked before window)" — push the probe earlier if you need to catch their transition.
//
// Usage: node scripts/analyzeLock.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '../data/yields-history/lock-probe/lock-probe.csv');

const rows = fs.readFileSync(FILE, 'utf8').trim().split('\n').slice(1).map(line => {
  // fetchedAtET and live_et are quoted (contain a comma); split on commas outside quotes.
  const f = line.match(/("[^"]*"|[^,]*)/g).filter((_, i) => i % 2 === 0);
  return { t: f[0].replace(/"/g, ''), symbol: f[1], date: f[2], val: f[3] };
});

// group: symbol -> date -> ordered samples (file order is chronological)
const bySym = {};
for (const r of rows) {
  (bySym[r.symbol] ??= {});
  (bySym[r.symbol][r.date] ??= []).push({ t: r.t, val: r.val });
}

for (const symbol of Object.keys(bySym)) {
  const dates = Object.keys(bySym[symbol]).sort();
  const currentDay = dates[dates.length - 1]; // latest = provisional, skip
  console.log(`\n==== ${symbol} ====`);
  for (const date of dates) {
    if (date === currentDay) continue;
    const s = bySym[symbol][date];
    const finalVal = s[s.length - 1].val;
    // lock = first index from which val stays === finalVal to the end
    let lockIdx = s.length - 1;
    while (lockIdx > 0 && s[lockIdx - 1].val === finalVal) lockIdx--;
    // collapsed timeline: one entry per value change
    const timeline = [];
    for (const x of s) if (!timeline.length || timeline[timeline.length - 1].val !== x.val) timeline.push(x);

    const lockMsg = lockIdx === 0
      ? '(locked before window — value constant from first sample)'
      : `locked @ ${s[lockIdx].t}  (last changed from ${s[lockIdx - 1].val} → ${finalVal})`;
    console.log(`  ${date}: final=${finalVal}  ${lockMsg}`);
    if (timeline.length > 1) {
      console.log('    timeline: ' + timeline.map(x => `${x.t.slice(-8)}=${x.val}`).join('  '));
    }
  }
}
