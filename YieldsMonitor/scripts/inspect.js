// inspect.js — feed inspector / living documentation (read-only, no writes).
// On demand, pulls every CNBC feed for one symbol and prints an annotated report:
// resolution per range, whether the CURRENT day is showing yet, and the three close
// concepts (3PM daily-close basis vs 17:05 session print vs live) side by side.
// Run this whenever you forget how the data pipeline works.
//
// Usage: node scripts/inspect.js [SYMBOL]   (default US10YTIPS)

const ET_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
});

function parseT(s) {
  const y = +s.slice(0, 4), mo = +s.slice(4, 6) - 1, d = +s.slice(6, 8);
  const h = +s.slice(8, 10) || 0, mi = +s.slice(10, 12) || 0, se = +s.slice(12, 14) || 0;
  let dt = new Date(Date.UTC(y, mo, d, h, mi, se));
  for (let i = 0; i < 2; i++) {
    const p = ET_FMT.formatToParts(dt).reduce((a, x) => ({ ...a, [x.type]: x.value }), {});
    const diff = Date.UTC(y, mo, d, h, mi, se) - Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    if (diff === 0) break;
    dt = new Date(dt.getTime() + diff);
  }
  return dt;
}
function etDate(raw) { const f = ET_FMT.format(parseT(raw)); const m = f.match(/(\d\d)\/(\d\d)\/(\d{4})/); return `${m[3]}-${m[1]}-${m[2]}`; }
function etHM(raw) { const f = ET_FMT.format(parseT(raw)); const m = f.match(/(\d\d):(\d\d)/); return `${m[1]}:${m[2]}`; }
function mins(raw) { const m = ET_FMT.format(parseT(raw)).match(/ (\d\d):(\d\d)/); return +m[1] * 60 + +m[2]; }
function num(v) { return parseFloat(String(v).replace('%', '')); }

function buildUrl(symbol, timeRange) {
  const params = {
    operationName: 'getQuoteChartData',
    variables: JSON.stringify({ symbol, timeRange }),
    extensions: JSON.stringify({ persistedQuery: { version: 1, sha256Hash: '9e1670c29a10707c417a1efd327d4b2b1d456b77f1426e7e84fb7d399416bb6b' } })
  };
  return 'https://webql-redesign.cnbcfm.com/graphql?' + Object.entries(params).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
}
async function fetchBars(symbol, range) {
  try { const r = await fetch(buildUrl(symbol, range)); const j = await r.json(); return j?.data?.chartData?.priceBars || []; }
  catch { return []; }
}

function resLabel(bars) {
  if (bars.length < 2) return '—';
  const d = bars.map(b => Date.UTC(+b.tradeTime.slice(0, 4), +b.tradeTime.slice(4, 6) - 1, +b.tradeTime.slice(6, 8)) / 86400000);
  const g = []; for (let i = 1; i < d.length; i++) g.push(d[i] - d[i - 1]);
  g.sort((a, b) => a - b); const med = g[Math.floor(g.length / 2)];
  return med <= 1 ? 'daily' : med <= 4 ? 'daily(+wknd)' : med <= 10 ? 'weekly' : med <= 45 ? 'monthly' : 'quarterly';
}
// per-day close print of an intraday feed: last bar before the post-17:00 session gap
function sessionClose(bars, day) {
  const arr = bars.filter(b => etDate(b.tradeTime) === day).sort((a, b) => mins(a.tradeTime) - mins(b.tradeTime));
  const exact = arr.find(b => etHM(b.tradeTime) === '17:05');
  if (exact) return { hm: '17:05', v: num(exact.close) };
  const post = arr.filter(b => mins(b.tradeTime) >= 17 * 60);
  let cp = post[0] || null;
  for (let i = 1; i < post.length; i++) { if (mins(post[i].tradeTime) - mins(post[i - 1].tradeTime) > 20) { cp = post[i - 1]; break; } cp = post[i]; }
  return cp ? { hm: etHM(cp.tradeTime), v: num(cp.close) } : null;
}
function nearest(bars, day, target) {
  let best = null; for (const b of bars) { if (etDate(b.tradeTime) !== day) continue; const dd = Math.abs(mins(b.tradeTime) - target); if (dd <= 8 && (!best || dd < best.dd)) best = { dd, v: num(b.close), hm: etHM(b.tradeTime) }; } return best;
}

async function main() {
  const sym = process.argv[2] || 'US10YTIPS';
  const nowET = ET_FMT.format(new Date());
  const todayET = nowET.match(/(\d\d)\/(\d\d)\/(\d{4})/).slice(1);
  const today = `${todayET[2]}-${todayET[0]}-${todayET[1]}`;
  const [m1, m3, m6, y5, all, d5, d1] = await Promise.all(
    ['1M', '3M', '6M', '5Y', 'ALL', '5D', '1D'].map(r => fetchBars(sym, r)));

  console.log(`\n=== Feed Inspector: ${sym} @ ${nowET} ET ===\n`);

  console.log('DAILY-CLOSE FEEDS  (history basis; value ≈ ~3PM benchmark, stamped 00:00)');
  for (const [r, ui, b] of [['1M', '1Y', m1], ['3M', '2Y', m3], ['6M', '3Y', m6], ['5Y', '10Y', y5], ['ALL', 'ALL', all]]) {
    if (!b.length) { console.log(`  ${r.padEnd(3)}(${ui.padEnd(3)})  unavailable / null  ← flaky feed`); continue; }
    const last = b[b.length - 1], lday = etDate(last.tradeTime);
    const cur = lday === today ? '  [CURRENT DAY: showing — PROVISIONAL until settled]' : `  [current day NOT yet present; latest completed ${lday}]`;
    console.log(`  ${r.padEnd(3)}(${ui.padEnd(3)})  ${String(b.length).padStart(4)} bars  ${resLabel(b).padEnd(12)}  last ${lday}=${num(last.close).toFixed(4)}${cur}`);
  }

  console.log('\nINTRADAY FEEDS  (live, 24h continuous; not stored — app fetches real-time)');
  for (const [r, ui, b] of [['1D', '2D', d1], ['5D', '10D', d5]]) {
    if (!b.length) { console.log(`  ${r.padEnd(3)}(${ui.padEnd(3)})  unavailable`); continue; }
    const last = b[b.length - 1];
    console.log(`  ${r.padEnd(3)}(${ui.padEnd(3)})  ${String(b.length).padStart(4)} bars  ${r === '1D' ? '1-min' : '5-min'}  last ${etDate(last.tradeTime)} ${etHM(last.tradeTime)}=${num(last.close).toFixed(4)}`);
  }

  // cross-check on the most recent completed day common to daily + 1D
  const dailyLast = m3[m3.length - 1];
  const dailyDay = dailyLast ? etDate(dailyLast.tradeTime) : null;
  const cmpDay = dailyDay === today ? today : dailyDay; // may be provisional
  const sc = sessionClose(d1, cmpDay) || sessionClose(d5, cmpDay);
  const at15 = nearest(d5, cmpDay, 15 * 60);
  const live = d1.length ? num(d1[d1.length - 1].close) : null;
  console.log(`\nCROSS-CHECK  (day ${cmpDay}${cmpDay === today ? ', provisional' : ''})`);
  console.log(`  daily-close (history) : ${dailyLast ? num(dailyLast.close).toFixed(4) : '—'}   ≈ ~3PM benchmark`);
  console.log(`  ~15:00 intraday       : ${at15 ? at15.v.toFixed(4) + ` [${at15.hm}]` : '—'}   (sanity: daily should ≈ this)`);
  console.log(`  17:05 session print   : ${sc ? sc.v.toFixed(4) + ` [${sc.hm}]` : '—'}   (actual session end; shown in 2D/10D)`);
  console.log(`  live latest           : ${live != null ? live.toFixed(4) : '—'}`);

  console.log(`\nLEGEND / HOW IT WORKS`);
  console.log(`  • History (1Y+) stores the DAILY-feed close ≈ ~3PM benchmark (Treasury CMT/real ~3:30PM; Tradeweb 3/4PM).`);
  console.log(`  • 1Y/2Y/3Y are daily → reread fresh. 10Y weekly, ALL quarterly → persistent merge keeps finer recent resolution.`);
  console.log(`  • 2D/10D show live intraday incl. the 17:05 session-end print (NOT stored).`);
  console.log(`  • Full detail: knowledge/Close_Price_Investigation.md\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
