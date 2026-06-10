// analyzeCloseWindow.js — investigation (not pipeline).
// Reads an archived intraday snapshot and characterizes the close-window structure
// per ET trading day: last pre-17:00 print, post-close print(s), the session gap,
// and evening resume. Tests whether a canonical "~17:05 consolidation" print exists.
//
// Usage: node scripts/analyzeCloseWindow.js US5YTIPS [YYYYMMDD]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARCH = path.join(__dirname, '../data/yield-history/intraday-raw');

// "MM/DD/YYYY, HH:MM:SS" -> {day:'MMDD', mins: minutesSinceMidnightET, hhmm}
function etParts(et) {
  const m = et.match(/(\d\d)\/(\d\d)\/(\d{4}), (\d\d):(\d\d):(\d\d)/);
  const [, MM, DD, , hh, mm] = m;
  return { day: `${MM}/${DD}`, mins: +hh * 60 + +mm, hhmm: `${hh}:${mm}` };
}

function analyzeFeed(label, bars) {
  console.log(`\n  --- ${label} feed (${bars.length} bars) ---`);
  // group by ET day
  const byDay = {};
  for (const b of bars) {
    const p = etParts(b.et);
    (byDay[p.day] = byDay[p.day] || []).push({ ...b, ...p });
  }
  for (const day of Object.keys(byDay)) {
    const arr = byDay[day];
    // bars within 16:30-20:00 window
    const win = arr.filter(b => b.mins >= 16 * 60 + 30 && b.mins <= 20 * 60);
    if (win.length === 0) continue;
    const lastPre = [...arr].reverse().find(b => b.mins < 17 * 60);
    const postClose = arr.filter(b => b.mins >= 17 * 60);
    // find the session gap: first gap > 20 min among postClose bars
    let closePrint = null, resume = null;
    if (postClose.length > 0) {
      closePrint = postClose[0];
      for (let i = 1; i < postClose.length; i++) {
        if (postClose[i].mins - postClose[i - 1].mins > 20) {
          closePrint = postClose[i - 1]; // last print before the gap
          resume = postClose[i];
          break;
        }
      }
      if (!resume) closePrint = postClose[postClose.length - 1];
    }
    const fmt = b => b ? `${b.hhmm}=${b.close}` : '—';
    const drift = (lastPre && closePrint && lastPre.close !== '%' )
      ? (parseFloat(closePrint.close) - parseFloat(lastPre.close)).toFixed(4) : '?';
    console.log(`    ${day}: lastPre17=${fmt(lastPre)}  closePrint=${fmt(closePrint)}  (Δ${drift})  resume=${fmt(resume)}`);
  }
}

function main() {
  const sym = process.argv[2] || 'US5YTIPS';
  const dir = path.join(ARCH, sym);
  const date = process.argv[3] || fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().pop().replace('.json', '');
  const snap = JSON.parse(fs.readFileSync(path.join(dir, `${date}.json`), 'utf8'));
  console.log(`${sym}  archive ${date}  (fetched ${snap.fetchedAtET})`);
  for (const range of ['1D', '5D']) {
    if (snap.feeds[range]?.bars) analyzeFeed(range, snap.feeds[range].bars);
  }
}

main();
