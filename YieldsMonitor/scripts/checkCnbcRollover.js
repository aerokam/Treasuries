// checkCnbcRollover.js — daily background check: does CNBC_ROLLOVER_LOG's last entry for each
// TIPS symbol still match the bond CNBC is actually quoting live? If not, the log has gone
// stale — exactly what happened 2026-09-01..2026-09-15 for US1YTIPS/US2YTIPS (see
// YieldsMonitor/knowledge/2.4_Seasonal_Adjustment.md#automated-rollover-check) — and every SA
// calculation since the missed rollover has been using the wrong bond's coupon/maturity.
//
// On a mismatch, resolves the flip date the same day it's noticed rather than waiting for more
// history to accumulate: walks backward from the most recent trading day, computing the new
// candidate bond's implied yield from its real FedInvest price at T+0 settlement (the FedInvest
// historical-price convention — see knowledge/1.1_Download_FedInvest_Prices.md#determine-
// settlement-date) and comparing it to CNBC's own archived quoted yield for that day
// (Treasuries/yields-history/history.json), until the fit flips back to the old candidate. That
// boundary is the flip date. Appends the pinned entry to CNBC_ROLLOVER_LOG and the spec table,
// runs the unit tests, and — only if they pass — commits and pushes both files. On any failure
// (test failure, an unresolvable/ambiguous transition) it reverts its own edits and just logs,
// rather than leaving a half-applied or unverified change behind.
//
// Developer-facing background maintenance only — no UI surface. Run daily via the
// CheckCnbcRollover Windows scheduled task (scripts/setup-windows-tasks.ps1).

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { CNBC_ROLLOVER_LOG } from '../src/cnbc-rollover-log.js';
import { yieldFromPrice } from '../../shared/src/bond-math.js';
import { localDate, toIsoDate } from '../../shared/src/settlement.js';
import { parseCsv } from '../../shared/src/csv.js';
import { parseFedInvestPriceRows } from '../../shared/src/fedinvest-prices.js';
import { fetchPricesForDate } from '../../scripts/getFedInvestPricesForDate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '../..');
const LOG_MODULE_PATH = path.join(REPO_ROOT, 'YieldsMonitor/src/cnbc-rollover-log.js');
const SPEC_MD_PATH = path.join(REPO_ROOT, 'YieldsMonitor/knowledge/2.4_Seasonal_Adjustment.md');
const REL_LOG_MODULE = 'YieldsMonitor/src/cnbc-rollover-log.js';
const REL_SPEC_MD = 'YieldsMonitor/knowledge/2.4_Seasonal_Adjustment.md';

const R2 = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const CNBC_QUOTE_URL = 'https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol';
const SYMBOLS = ['US1YTIPS', 'US2YTIPS', 'US5YTIPS', 'US10YTIPS', 'US30YTIPS'];
// Comfortably covers the "several weeks" worst-case post-checkpoint lag documented in
// 2.4_Seasonal_Adjustment.md — wide enough to find the boundary without scanning forever.
const LOOKBACK_DAYS = 75;
// A candidate's implied yield must land within this many bp of CNBC's actual quoted yield, AND
// beat the other candidate by at least MARGIN_BP, to count as a clean fit for that day — not
// just "closer than the other one". Needed because the archived quoted-yield feed has occasional
// bad points (a known synthetic-tick artifact — see IntradayArchive's gap-isolation handling):
// testing against real data, US1YTIPS's 2026-09-11 point put BOTH candidates within 10bp of the
// archived value (old 1.1bp, new 7.3bp) despite every neighboring day cleanly favoring the new
// cohort by 50-90bp — a plain "whichever is closer" rule misclassifies that single noisy day as
// 'old' and falsely stops the backward walk there. Requiring a decisive margin, not just the
// smaller residual, treats a day like that as 'ambiguous' (skipped, not trusted) instead.
const FIT_THRESHOLD_BP = 10;
const MARGIN_BP = 20;

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// CNBC's batched quote endpoint occasionally drops one symbol from an otherwise-successful
// response (observed in testing — not a documented behavior, just flaky in practice, same
// underlying feed as US5YTIPS's known unreliability in 1.0_Operation.md). A missing symbol
// self-heals on the next daily run either way, but retrying once avoids losing a whole day to
// a transient glitch.
async function fetchLiveQuotesOnce() {
  const url = `${CNBC_QUOTE_URL}?symbols=${SYMBOLS.join('|')}&requestMethod=itv&noform=1&partnerId=2&fund=1&exthrs=1&output=json&events=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      'Referer': 'https://www.cnbc.com/',
    },
  });
  if (!res.ok) throw new Error(`CNBC quote fetch: HTTP ${res.status}`);
  const json = await res.json();
  const quotes = json?.FormattedQuoteResult?.FormattedQuote || [];
  const result = {};
  for (const q of quotes) {
    if (!q.maturity_date || !q.coupon) continue;
    result[q.symbol] = { maturity: q.maturity_date, coupon: parseFloat(String(q.coupon).replace('%', '')) / 100 };
  }
  return result;
}

async function fetchLiveQuotes() {
  let result = await fetchLiveQuotesOnce();
  const missing = SYMBOLS.filter(s => !result[s]);
  if (missing.length) {
    log(`Retrying CNBC quote fetch — missing ${missing.join(', ')} on first attempt`);
    await new Promise(r => setTimeout(r, 3000));
    result = await fetchLiveQuotesOnce();
  }
  return result;
}

export async function fetchArchivedYields() {
  const res = await fetch(`${R2}/Treasuries/yields-history/history.json`);
  if (!res.ok) throw new Error(`history.json fetch: HTTP ${res.status}`);
  const json = await res.json();
  const bySymbol = {};
  for (const sym of SYMBOLS) {
    const byDate = new Map();
    for (const p of (json[sym] || [])) {
      if (!/^\d{14}$/.test(p.x)) continue;
      byDate.set(`${p.x.slice(0, 4)}-${p.x.slice(4, 6)}-${p.x.slice(6, 8)}`, p.y);
    }
    bySymbol[sym] = byDate;
  }
  return bySymbol;
}

export async function fetchTipsRefRows() {
  const res = await fetch(`${R2}/TIPS/TipsRef.csv`);
  if (!res.ok) throw new Error(`TipsRef.csv fetch: HTTP ${res.status}`);
  return parseCsv(await res.text());
}

// Same tie-break resolveTipsBond() uses: most-recently-dated cohort wins when more than one
// TipsRef.csv row shares a maturity (e.g. a 20-Year and a 10-Year TIPS maturing the same day).
export function candidateForMaturity(refRows, maturity, coupon = null) {
  let candidates = refRows.filter(r => r.maturity === maturity);
  if (coupon != null) {
    const matched = candidates.filter(r => Math.abs(parseFloat(r.coupon) - coupon) < 0.0001);
    if (matched.length) candidates = matched;
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => (a.datedDate < b.datedDate ? 1 : -1));
  const chosen = candidates[0];
  return { cusip: chosen.cusip, maturity: chosen.maturity, coupon: parseFloat(chosen.coupon) };
}

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toIsoDate(d);
}

// Classifies one trading day's fit: which candidate's FedInvest-implied yield (T+0 settlement,
// sell-primary price — see 2.4_Seasonal_Adjustment.md's "Price selection") matches CNBC's own
// archived quoted yield for that day.
async function classifyDay(iso, oldCandidate, newCandidate, actualYield) {
  const got = await fetchPricesForDate(iso).catch(() => null);
  if (!got) return null; // weekend, holiday, or not yet published
  const rows = parseFedInvestPriceRows(got.text).filter(r => r.type === 'TIPS');
  const oldRow = rows.find(r => r.cusip === oldCandidate.cusip);
  const newRow = rows.find(r => r.cusip === newCandidate.cusip);
  if (!oldRow || !newRow) return null;
  const oldPrice = oldRow.sell || oldRow.buy || null;
  const newPrice = newRow.sell || newRow.buy || null;
  if (!oldPrice || !newPrice) return null;
  const settle = localDate(iso); // T+0: FedInvest prices settle same-day, not T+1
  const yldOld = yieldFromPrice(oldPrice, oldCandidate.coupon, settle, localDate(oldCandidate.maturity));
  const yldNew = yieldFromPrice(newPrice, newCandidate.coupon, settle, localDate(newCandidate.maturity));
  if (yldOld == null || yldNew == null) return null;
  const diffOldBp = Math.abs(yldOld * 100 - actualYield) * 100;
  const diffNewBp = Math.abs(yldNew * 100 - actualYield) * 100;
  let cls = 'ambiguous';
  if (diffNewBp <= FIT_THRESHOLD_BP && diffOldBp - diffNewBp >= MARGIN_BP) cls = 'new';
  else if (diffOldBp <= FIT_THRESHOLD_BP && diffNewBp - diffOldBp >= MARGIN_BP) cls = 'old';
  return { iso, cls, diffOldBp, diffNewBp };
}

// Walks backward from today through the archived quoted-yield history, looking for the day the
// fit flips from the new candidate to the old one. Returns { flipDate, evidence } or null if the
// window closes without ever finding a clean 'old' fit (transition predates the lookback, or is
// genuinely ambiguous — either way, not something to guess at).
export async function bisectFlipDate(sym, oldCandidate, newCandidate, archivedYields) {
  const floor = isoDaysAgo(LOOKBACK_DAYS);
  const datesDesc = [...archivedYields.keys()].filter(d => d >= floor).sort().reverse();
  let earliestNew = null;
  let earliestNewEvidence = null;
  for (const iso of datesDesc) {
    const actual = archivedYields.get(iso);
    const day = await classifyDay(iso, oldCandidate, newCandidate, actual);
    if (!day) continue;
    log(`  ${sym} ${iso}: old ${day.diffOldBp.toFixed(1)}bp, new ${day.diffNewBp.toFixed(1)}bp -> ${day.cls}`);
    if (day.cls === 'new') {
      earliestNew = iso;
      earliestNewEvidence = day;
    } else if (day.cls === 'old') {
      if (!earliestNew) return null; // never saw a clean 'new' fit before hitting 'old' — inconclusive
      return {
        flipDate: earliestNew,
        newFit: earliestNewEvidence,
        oldFit: day,
      };
    }
    // 'ambiguous': skip without breaking the scan — a single noisy day shouldn't derail the walk.
  }
  return null; // exhausted the lookback window without ever finding the old cohort
}

function insertLogEntry(text, sym, entryLine) {
  const re = new RegExp(`(  ${sym}: \\[[\\s\\S]*?)(\\n  \\],)`);
  if (!re.test(text)) throw new Error(`Could not find ${sym} array in ${REL_LOG_MODULE}`);
  return text.replace(re, `$1\n    ${entryLine}$2`);
}

function insertSpecRow(text, sym, rowLine) {
  const lines = text.split('\n');
  let lastIdx = -1;
  lines.forEach((l, i) => { if (l.startsWith(`| \`${sym}\` |`)) lastIdx = i; });
  if (lastIdx === -1) throw new Error(`Could not find a ${sym} row in ${REL_SPEC_MD}`);
  lines.splice(lastIdx + 1, 0, rowLine);
  return lines.join('\n');
}

function run(cmd) {
  return execSync(cmd, { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
}

export async function main() {
  log('Checking CNBC_ROLLOVER_LOG against live CNBC bond identity...');
  const [liveQuotes, archivedYields, refRows] = await Promise.all([
    fetchLiveQuotes(), fetchArchivedYields(), fetchTipsRefRows(),
  ]);

  const pinned = [];
  for (const sym of SYMBOLS) {
    const live = liveQuotes[sym];
    const entries = CNBC_ROLLOVER_LOG[sym];
    if (!live || !entries || !entries.length) { log(`${sym}: skipped (no live quote or no log entries)`); continue; }
    const lastEntry = entries[entries.length - 1];
    if (lastEntry.maturity === live.maturity) { log(`${sym}: up to date (${live.maturity})`); continue; }

    log(`${sym}: MISMATCH — log's last entry is ${lastEntry.maturity}, live quote is ${live.maturity}. Bisecting...`);
    const oldCandidate = candidateForMaturity(refRows, lastEntry.maturity);
    const newCandidate = candidateForMaturity(refRows, live.maturity, live.coupon);
    if (!oldCandidate || !newCandidate) {
      log(`${sym}: cannot resolve candidate CUSIP(s) from TipsRef.csv — old=${!!oldCandidate} new=${!!newCandidate}. Skipping.`);
      continue;
    }

    const result = await bisectFlipDate(sym, oldCandidate, newCandidate, archivedYields[sym]);
    if (!result) {
      log(`${sym}: could not resolve a clean flip date within ${LOOKBACK_DAYS} days — leaving unpinned for manual review.`);
      continue;
    }
    log(`${sym}: pinned flip date ${result.flipDate} -> ${live.maturity} (new fit ${result.newFit.diffNewBp.toFixed(1)}bp, old fit ${result.oldFit.diffOldBp.toFixed(1)}bp on ${result.oldFit.iso})`);
    pinned.push({ sym, flipDate: result.flipDate, maturity: live.maturity, newFit: result.newFit, oldFit: result.oldFit });
  }

  if (!pinned.length) { log('Nothing to pin. Done.'); return; }

  const today = toIsoDate(new Date());
  let logText = fs.readFileSync(LOG_MODULE_PATH, 'utf8');
  let specText = fs.readFileSync(SPEC_MD_PATH, 'utf8');
  for (const p of pinned) {
    const evidence = `bisected between ${p.oldFit.iso} (old cohort, ~${p.oldFit.diffOldBp.toFixed(1)}bp) and ${p.flipDate} (new cohort, ~${p.newFit.diffNewBp.toFixed(1)}bp)`;
    logText = insertLogEntry(logText, p.sym, `{ from: '${p.flipDate}', maturity: '${p.maturity}' }, // auto-pinned ${today} by checkCnbcRollover.js — ${evidence}`);
    specText = insertSpecRow(specText, p.sym, `| \`${p.sym}\` | ${p.flipDate} | ${p.maturity} | Auto-pinned by the daily rollover check (\`YieldsMonitor/scripts/checkCnbcRollover.js\`) — ${evidence} |`);
  }
  fs.writeFileSync(LOG_MODULE_PATH, logText);
  fs.writeFileSync(SPEC_MD_PATH, specText);

  log('Running unit tests...');
  try {
    run('npm test');
  } catch (err) {
    log('Tests FAILED — reverting edits, not committing.');
    log(err.stdout ? err.stdout.toString() : String(err));
    run(`git checkout -- "${REL_LOG_MODULE}" "${REL_SPEC_MD}"`);
    process.exitCode = 1;
    return;
  }

  log('Tests passed. Committing and pushing...');
  const summary = pinned.map(p => `${p.sym} -> ${p.flipDate}/${p.maturity}`).join(', ');
  const message = [
    `Auto-pin CNBC rollover: ${summary}`,
    '',
    'Detected and pinned by the daily CheckCnbcRollover task — CNBC_ROLLOVER_LOG\'s last',
    'entry no longer matched the live CNBC bond identity. Flip date(s) resolved via the same',
    'FedInvest T+0 cross-check used for every other entry in the log.',
    '',
    'Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>',
  ].join('\n');
  // Written to a temp file and passed via -F rather than -m: an inline -m string with
  // embedded newlines is not reliably quoted through cmd.exe (this script's default shell
  // when run unattended from Task Scheduler).
  const msgFile = path.join(REPO_ROOT, 'logs', `.rollover-commit-msg-${Date.now()}.txt`);
  fs.mkdirSync(path.dirname(msgFile), { recursive: true });
  fs.writeFileSync(msgFile, message);
  try {
    run(`git add "${REL_LOG_MODULE}" "${REL_SPEC_MD}"`);
    run(`git commit -F "${msgFile}"`);
    run('git push origin main');
  } finally {
    fs.rmSync(msgFile, { force: true });
  }
  log('Committed and pushed.');
}

// Only when run directly, so the exported pieces stay importable for testing (see
// getFedInvestPricesForDate.js, which established this pattern).
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('checkCnbcRollover.js')) {
  main().catch(err => { log(`FAILED: ${err.stack || err}`); process.exitCode = 1; });
}
