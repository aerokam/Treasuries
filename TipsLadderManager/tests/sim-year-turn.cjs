// Year-turn simulation: a verification harness, not part of npm test. Run from TipsLadderManager/:
//   node tests/sim-year-turn.cjs && node tests/_sim_run.js ; then delete tests/_sim_run.js (it is gitignored).
// Synthetic bonds need 9-character CUSIPs: the file parsers drop shorter ones.
// Year-turn simulation (verification harness, not a committed test): the clock is March 2027, so the settlement year
// is 2027; every bond that matures before then is gone; the Jan 2037 10-year and the Feb 2057 30-year exist.
const fs=require("fs");
let t=fs.readFileSync("tests/run.js","utf8");
function rep(a,b){ if(!t.includes(a)) throw new Error("missing "+a.slice(0,60)); t=t.replace(a,b); }
rep("const _now = new Date();",`{ const RD = Date; const T = new RD('2027-03-01T12:00:00').getTime();
  globalThis.Date = class extends RD { constructor(...a) { if (a.length === 0) super(T); else super(...a); } static now() { return T; } }; }
const _now = new Date();`);
rep("const { yieldsRows, refCpiRows, bondHolidays, saYieldByCusip, settleDateStr } = _market;",`const { yieldsRows, refCpiRows, bondHolidays, saYieldByCusip, settleDateStr } = _market;
{ // extend Ref CPI flat through May 2027
  const last = refCpiRows[refCpiRows.length - 1];
  const RD = Date.prototype.constructor;
  for (let d = new Date(last.date + 'T12:00:00'); ; ) { d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12); const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); refCpiRows.push({ ...last, date: iso }); if (iso >= '2027-05-31') break; }
}`);
const a="const tipsMarketData = buildTipsMarketData(yieldsRows, saYieldByCusip);";
rep(a,a+`
{
  const cutoff = new Date(2027, 2, 2);
  for (const [c, b] of [...tipsMarketData.entries()]) if (b.maturity && b.maturity < cutoff) tipsMarketData.delete(c);
  const find = (y, m) => [...tipsMarketData.values()].find(b => b.maturity && b.maturity.getFullYear() === y && b.maturity.getMonth() + 1 === m);
  const j36 = find(2036, 1), f56 = find(2056, 2);
  const cl = (b, cusip, y, m) => ({ ...b, cusip, maturity: new Date(y, m - 1, 15) });
  tipsMarketData.set('SYN37JAN1', cl(j36, 'SYN37JAN1', 2037, 1));
  tipsMarketData.set('SYN57FEB1', cl(f56, 'SYN57FEB1', 2057, 2));
  console.log('[SIM2] settlement year', settlementDate.getFullYear(), 'gap', JSON.stringify(getGapYears(tipsMarketData)), 'TIPS', tipsMarketData.size);
}`);
fs.writeFileSync("tests/_sim_run.js",t);
