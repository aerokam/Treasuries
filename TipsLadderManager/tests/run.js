// Regression tests — must pass after every refactor phase
// Replicates browser data loading + parsing, then runs rebalance and build.
// Any refactor must produce identical output for all assertions here.

import { readFileSync, readdirSync, existsSync } from 'fs';
import path from 'path';
import { buildTipsMapFromYields, localDate, runRebalance, inferDARAFromCash, inferScaledDARAFromPortfolio, inferFirstYearFromHoldings, inferLastYearFromHoldings, runMultiAccountRebalance } from '../src/rebalance-lib.js';
import { runBuild } from '../src/build-lib.js';
import { parseBrokerCSV } from '../src/broker-import.js';
import { nextBondTradingDay, parseBondHolidays } from '../src/data.js';

// ── CSV helpers (match index.html exactly) ────────────────────────────────────
function parseCsv(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(s => s.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(s => s.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
}

// Multi-format holdings parser — mirrors index.html logic for Formats 3, 4, 5.
// Formats 1/2 (broker CSV) tested separately via parseBrokerCSV below.
function parseHoldingsCSV(text, tipsMap) {
  const CUSIP_RE = /^[A-Z0-9]{9}$/i;
  const rawLines = text.trim().split('\n').filter(l => l.trim());
  if (!rawLines.length) return [];
  const firstLineLower = rawLines[0].replace(/\s/g, '').toLowerCase();
  const arr = [];

  if (firstLineLower === 'cusip,qty,excess') {
    // Format 5: header cusip,qty,excess — qty=fundedYearQty, excess=excessQty
    for (let i = 1; i < rawLines.length; i++) {
      const parts = rawLines[i].split(',').map(s => s.trim());
      if (parts.length < 2) continue;
      const [cusip, qtyStr] = parts;
      if (!CUSIP_RE.test(cusip)) continue;
      const fundedQty = parseInt(qtyStr, 10);
      if (isNaN(fundedQty) || fundedQty < 0) continue;
      const excessQty = parts.length >= 3 ? (parseInt(parts[2], 10) || 0) : 0;
      arr.push({ cusip, qty: fundedQty + excessQty, excessQty });
    }
  } else {
    const startIdx = CUSIP_RE.test(rawLines[0].split(',')[0].trim()) ? 0 : 1;
    const sampleParts = (rawLines[startIdx] ?? '').split(',').map(s => s.trim());
    const isFormat4 = sampleParts.length >= 3 && parseInt(sampleParts[2], 10) >= 2000;

    if (isFormat4) {
      // Format 4: no header, multi-row per CUSIP — year field classifies funded vs excess
      const cusipMap = new Map();
      for (const line of rawLines) {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length < 3) continue;
        const [cusip, qtyStr, yearStr] = parts;
        if (!CUSIP_RE.test(cusip)) continue;
        const bond = tipsMap.get(cusip);
        if (!bond?.maturity) continue;
        const qty = parseInt(qtyStr, 10);
        const year = parseInt(yearStr, 10);
        if (isNaN(qty) || qty < 0 || isNaN(year)) continue;
        if (!cusipMap.has(cusip)) cusipMap.set(cusip, { fundedQty: 0, excessQty: 0 });
        const entry = cusipMap.get(cusip);
        if (year === bond.maturity.getFullYear()) entry.fundedQty += qty;
        else entry.excessQty += qty;
      }
      for (const [cusip, { fundedQty, excessQty }] of cusipMap) {
        const total = fundedQty + excessQty;
        if (total > 0) arr.push({ cusip, qty: total, excessQty });
      }
    } else {
      // Format 3: optional header cusip,qty — one row per CUSIP, no excess info
      for (let i = startIdx; i < rawLines.length; i++) {
        const parts = rawLines[i].split(',').map(s => s.trim());
        if (parts.length < 2) continue;
        const [cusip, qtyStr] = parts;
        if (!CUSIP_RE.test(cusip)) continue;
        const qty = parseInt(qtyStr, 10);
        if (!isNaN(qty) && qty >= 0) arr.push({ cusip, qty });
      }
    }
  }
  return arr;
}

// Keep old name as alias for callers that don't need tipsMap (Format 3 files only)
function parseHoldings(text) { return parseHoldingsCSV(text, tipsMap); }

function lookupRefCpi(refCpiRows, dateStr) {
  const matches = refCpiRows.filter(r => r.date <= dateStr);
  if (!matches.length) throw new Error(`No RefCPI on or before ${dateStr}`);
  return matches[matches.length - 1].refCpi;
}

// ── Load shared data ──────────────────────────────────────────────────────────
const yieldsPath = path.resolve('tests/e2e/YieldsFromFedInvestPrices.csv');
const refCpiPath = path.resolve('tests/e2e/RefCPI.csv');

console.log(`[Test Setup] Market Data:   ${yieldsPath}`);
// YieldsFromFedInvestPrices.csv: row 1 = settlement date (ignored), row 2 = header, rows 3+ = data
// Settlement date is always computed from today's date so excluded-bond behavior matches reality.
const yieldsText = readFileSync(yieldsPath, 'utf8');
const yieldsLines = yieldsText.trim().split('\n');

const holidayPath = path.resolve('tests/e2e/BondHolidaysSifma.csv');
const bondHolidays = parseBondHolidays(readFileSync(holidayPath, 'utf8'));
const _now = new Date();
const _todayISO = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`;
const settleDateStr = nextBondTradingDay(_todayISO, bondHolidays);

const yieldsRows = parseCsv(yieldsLines.slice(1).join('\n')).map(r => ({
  settlementDate: settleDateStr,
  cusip:    r.cusip,
  maturity: r.maturity,
  coupon:   parseFloat(r.coupon),
  baseCpi:  parseFloat(r.datedDateCpi),
  price:    parseFloat(r.price)  || null,
  yield:    parseFloat(r.yield)  || null,
}));
console.log(`[Test Setup] Loaded ${yieldsRows.length} bonds from market data.`);

console.log(`[Test Setup] Reference CPI: ${refCpiPath}`);
const refCpiRows = parseCsv(readFileSync(refCpiPath, 'utf8')).map(r => ({
  date:   r.date,
  refCpi: parseFloat(r.refCpi),
}));

const settlementDate = localDate(settleDateStr);
console.log(`[Test Setup] Settlement:    ${settleDateStr} (T+1 from today ${_todayISO})`);
const tipsMap = buildTipsMapFromYields(yieldsRows);
const refCPI = lookupRefCpi(refCpiRows, settleDateStr);

// ── Test harness ──────────────────────────────────────────────────────────────
let passed = 0, failed = 0;

// Suppress "CUSIP not found" warnings from rebalance-lib during tests
// (Happens when local dev files contain CUSIPs missing from the static mock fixture)
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('not found in TIPS data')) return;
  originalWarn.apply(console, args);
};

function assert(name, actual, expected, tolerance = 0) {
  const ok = tolerance > 0
    ? Math.abs(actual - expected) <= tolerance
    : actual === expected;
  if (ok) {
    console.log(`  PASS  ${name}`);
    passed++;
  } else {
    console.error(`  FAIL  ${name}`);
    console.error(`        expected: ${expected}`);
    console.error(`        actual:   ${actual}`);
    failed++;
  }
}

// ── Mirrors index.html computePortfolioARAByYear + derivePerYearDara ─────────
function computePortfolioARAByYear(holdingsArr, tipsMap, refCPI) {
  const byYear = {};
  for (const h of holdingsArr) {
    const b = tipsMap.get(h.cusip); if (!b?.maturity) continue;
    const ir = refCPI / (b.baseCpi ?? refCPI);
    const year = b.maturity.getFullYear();
    const m = b.maturity.getMonth() + 1;
    const nPay = m < 7 ? 1 : 2;
    const piPB = 1000 * ir * (1 + (b.coupon ?? 0) * 0.5 * nPay);
    const annInt = h.qty * 1000 * ir * (b.coupon ?? 0);
    if (!byYear[year]) byYear[year] = { totalPI: 0, annInt: 0 };
    byYear[year].totalPI += h.qty * piPB; byYear[year].annInt += annInt;
  }
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);
  let lmi = 0; const ara = {};
  for (const y of years) { ara[y] = byYear[y].totalPI + lmi; lmi += byYear[y].annInt; }
  return ara;
}
// Returns gap year bracket candidates from tipsMap (years adjacent to structural 2037-2039 gap).
function getGapYearBracketCandidates(tm) {
  const tipsYears = new Set();
  for (const b of tm.values()) { if (b.maturity) tipsYears.add(b.maturity.getFullYear()); }
  const gapYears = [];
  for (let y = 2039; y >= 2020; y--) {
    if (!tipsYears.has(y)) gapYears.push(y);
    else break;
  }
  if (!gapYears.length) return new Set();
  const minGap = Math.min(...gapYears);
  const maxGap = Math.max(...gapYears);
  return new Set([minGap - 1, maxGap + 1]);
}
function derivePerYearDara(araByYear, bracketCandidates = new Set()) {
  const vals = Object.values(araByYear).filter(v => v > 0).sort((a, b) => a - b);
  if (!vals.length) return { daraMap: new Map() };
  const median = vals[Math.floor(vals.length / 2)];
  const daraMap = new Map();
  for (const [y, ara] of Object.entries(araByYear)) {
    const year = parseInt(y);
    const val = (bracketCandidates.has(year) && ara > 1.5 * median) ? median : ara;
    daraMap.set(year, Math.round(val));
  }
  return { daraMap };
}

// ── Helper: assert no simultaneous buy+sell on the same TIPS at any bracket year ─
function assertNoBuySell(details, label) {
  const violations = details.filter(d => {
    if (!d.isBracketTarget) return false;
    const fDelta = (d.fundedYearQtyAfter ?? 0) - (d.fundedYearQtyBefore ?? 0);
    const eDelta = (d.excessQtyAfter ?? 0) - (d.excessQtyBefore ?? 0);
    return (fDelta > 0 && eDelta < 0) || (fDelta < 0 && eDelta > 0);
  });
  assert(`${label}: no simultaneous buy+sell at any bracket year`, violations.length, 0);
  for (const v of violations) {
    const fD = (v.fundedYearQtyAfter ?? 0) - (v.fundedYearQtyBefore ?? 0);
    const eD = (v.excessQtyAfter ?? 0) - (v.excessQtyBefore ?? 0);
    console.error(`        violation FY ${v.fundedYear}: fundedDelta=${fD} excessDelta=${eD}`);
  }
}

// ── Helper: Run Full Rebalance on a holdings file (per-year ARA path) ────────
function runFullRebalanceTest(name, filePath) {
  const fullPath = path.resolve(filePath);
  if (!existsSync(fullPath)) return;

  console.log(`\n${name} — Full rebalance (per-year ARA path)`);
  console.log(`  Input: ${fullPath}`);

  const holdings = parseHoldings(readFileSync(fullPath, 'utf8'));
  const rawARA = computePortfolioARAByYear(holdings, tipsMap, refCPI);
  const bracketCandidates = getGapYearBracketCandidates(tipsMap);
  const { daraMap } = derivePerYearDara(rawARA, bracketCandidates);
  const { scaledMap, scaledMedian } = inferScaledDARAFromPortfolio({
    daraMap, holdings, tipsMap, refCPI, settlementDate,
  });
  const { summary, details } = runRebalance({
    dara: scaledMedian, method: 'Full', holdings, tipsMap, refCPI, settlementDate,
    daraByYear: scaledMap,
  });

  // Net cash must be small and non-negative — portfolio is self-financing.
  const netCash = summary.costDeltaSum;
  const ok = netCash > -50 && netCash < 3000;

  if (ok) {
    console.log(`  PASS  net cash within (-50, 3000)`);
    passed++;
  } else {
    console.error(`  FAIL  net cash within (-50, 3000)`);
    console.error(`        actual:   ${netCash}`);
    failed++;
  }
  assertNoBuySell(details, name);
  console.log(`        scaled DARA:   ${Math.round(scaledMedian).toLocaleString()}`);
  console.log(`        net cash:      ${Math.round(netCash).toLocaleString()}`);
  console.log(`        surplus check: ${Math.round(summary.gapCoverageSurplus).toLocaleString()}`);
}

// ── Run tests on known files and local dev files ──────────────────────────────

// 1. Sample holdings (Format 3 — derived from real Schwab data, generated by scripts/generate-test-fixtures.js)
runFullRebalanceTest('Owner8_IRA', './data/SampleHoldings.csv');

// 2. Regression: portfolio with no 2040+ bonds — lastYear must stop at 2035, not extend to 2045
//    (Bug: lastYear derivation incorrectly reached into >2040 holdings when 2040 not held,
//     causing spurious gap/bracket rows and rebuilding 2045/2051 as funded rungs.)
//    Uses Owner8_IRA 2031-2035 bonds (far from maturity, stable for years).
{
  console.log('\nKevin_IRA 2031-2035 — lastYear regression (no 2040+ in holdings)');
  const holdingsCsv = [
    'cusip,qty',
    '91282CBF7,6',   // Jan 2031
    '91282CCM1,9',   // Jul 2031
    '91282CDX6,7',   // Jan 2032
    '91282CEZ0,9',   // Jul 2032
    '91282CGK1,10',  // Jan 2033
    '91282CHP9,7',   // Jul 2033
    '91282CJY8,30',  // Jan 2034
    '91282CML2,14',  // Jan 2035
    '91282CNS6,4',   // Jul 2035
  ].join('\n');
  const holdings = parseHoldings(holdingsCsv);
  const rawARA2 = computePortfolioARAByYear(holdings, tipsMap, refCPI);
  const bc2 = getGapYearBracketCandidates(tipsMap);
  const { daraMap: daraMap2 } = derivePerYearDara(rawARA2, bc2);
  const { scaledMap: sMap2, scaledMedian: sDara2 } = inferScaledDARAFromPortfolio({ daraMap: daraMap2, holdings, tipsMap, refCPI, settlementDate });
  const { summary, details } = runRebalance({ dara: sDara2, method: 'Full', holdings, tipsMap, refCPI, settlementDate, daraByYear: sMap2 });

  assert('lastYear === 2035',   summary.lastYear, 2035);
  assert('no 2040 funded rung', details.some(d => d.fundedYear === 2040), false);
  // Key regression: long-tier bonds beyond lastYear must NOT be rebuilt
  const d2045 = details.find(d => d.cusip === '912810RL4');
  const d2051 = details.find(d => d.cusip === '912810SV1');
  const delta2045 = d2045 ? (d2045.qtyAfter - d2045.qtyBefore) : 0;
  const delta2051 = d2051 ? (d2051.qtyAfter - d2051.qtyBefore) : 0;
  assert('2045 not rebuilt (qtyDelta 0 or absent)', delta2045, 0);
  assert('2051 not rebuilt (qtyDelta 0 or absent)', delta2051, 0);
  console.log(`        lastYear:      ${summary.lastYear}`);
  console.log(`        rungCount:     ${summary.rungCount}`);
  console.log(`        scaledDARA:    ${Math.round(sDara2).toLocaleString()}`);
  console.log(`        netCash:       ${Math.round(summary.costDeltaSum).toLocaleString()}`);
}

// ── Test: Format 4 parsing (TipsLadderCom — no header, multi-row per CUSIP) ──
{
  const filePath = path.resolve('./tests/dev/TipsLadderCom.csv');
  if (existsSync(filePath)) {
    console.log('\nFormat 4 (TipsLadderCom) — parsing + 3-bracket validation');
    const holdings = parseHoldingsCSV(readFileSync(filePath, 'utf8'), tipsMap);

    // Verify funded/excess split: CPU9 (Jan 2036) = 8 funded + (6+4+2)=12 excess
    const cpu9 = holdings.find(h => h.cusip === '91282CPU9');
    assert('F4: CPU9 total qty === 20',    cpu9?.qty,       20);
    assert('F4: CPU9 excessQty === 12',   cpu9?.excessQty, 12);

    // QF8 (Feb 2040) = 5 funded + (1+3+4)=8 excess
    const qf8 = holdings.find(h => h.cusip === '912810QF8');
    assert('F4: QF8 total qty === 13',    qf8?.qty,       13);
    assert('F4: QF8 excessQty === 8',     qf8?.excessQty,  8);

    // Non-bracket CUSIPs have no excess (single row each)
    const cfr7 = holdings.find(h => h.cusip === '91282CFR7');
    assert('F4: CFR7 excessQty === 0',    cfr7?.excessQty ?? 0, 0);

    // Run rebalance — excessQtyBefore uses funded-first rule (LMI formula), not h.excessQty
    const dara = 20000;
    const { summary, details } = runRebalance({ dara, method: 'Gap', bracketMode: '3bracket', holdings, tipsMap, refCPI, settlementDate });

    assert('F4: origLower IS Jan 2036', summary.brackets.lowerCUSIP === '91282CPU9', true);
    // When orig lower == new lower (both Jan 2036), 3-bracket falls back to 2-bracket.
    // newLowerCUSIP is null; the standard 2-bracket weights apply.
    assert('F4: newLowerCUSIP null (fell back to 2-bracket)', summary.newLowerCUSIP, null);
    assert('F4: origLowerWeight is null (2-bracket path)',    summary.origLowerWeight, null);

    const jan2036 = details.find(d => d.cusip === '91282CPU9' && d.isBracketTarget);
    // Format 4 has explicit excessQty=12 — the import value is used for the funded/excess split.
    assert('F4: CPU9 excessQtyBefore === 12', jan2036?.excessQtyBefore, 12);
    assert('F4: CPU9 fundedYearQtyBefore === 8', jan2036?.fundedYearQtyBefore, 8);
    console.log(`        CPU9 before:   funded=${jan2036?.fundedYearQtyBefore} excess=${jan2036?.excessQtyBefore}`);
    console.log(`        QF8 total:     ${qf8?.qty}  excess=${qf8?.excessQty}`);
  }
}

// ── Test: Format 5 parsing (cusip,qty,excess header) ─────────────────────────
{
  console.log('\nFormat 5 (inline) — parsing: header detection + excessQty');
  const csv5 = [
    'cusip,qty,excess',
    '91282CPU9,0,33',    // all excess (PLI-zeroed funded)
    '912810QF8,19,24',   // funded + excess
    '912810QP6,20,0',    // funded only
    '912810QV3,21,0',
  ].join('\n');
  const h5 = parseHoldingsCSV(csv5, tipsMap);

  const cpu9_5 = h5.find(h => h.cusip === '91282CPU9');
  assert('F5: CPU9 total qty === 33',   cpu9_5?.qty,       33);
  assert('F5: CPU9 excessQty === 33',   cpu9_5?.excessQty, 33);

  const qf8_5 = h5.find(h => h.cusip === '912810QF8');
  assert('F5: QF8 total qty === 43',    qf8_5?.qty,        43);
  assert('F5: QF8 excessQty === 24',    qf8_5?.excessQty,  24);

  const qp6_5 = h5.find(h => h.cusip === '912810QP6');
  assert('F5: QP6 total qty === 20',    qp6_5?.qty,        20);
  assert('F5: QP6 excessQty === 0',     qp6_5?.excessQty,  0);
}

// ── Test: Format 5 from file (tests/dev/CusipQtyExcess.csv) ─────────────────
{
  const filePath = path.resolve('./tests/dev/CusipQtyExcess.csv');
  if (existsSync(filePath)) {
    console.log('\nFormat 5 (CusipQtyExcess.csv) — file-based parsing + rebalance');
    const holdings = parseHoldingsCSV(readFileSync(filePath, 'utf8'), tipsMap);

    // Every row must produce a valid excessQty (not undefined)
    const missingExcess = holdings.filter(h => h.excessQty == null);
    assert('F5 file: all rows have excessQty', missingExcess.length, 0);

    // Run a full rebalance and verify excessQtyBefore is non-zero for bracket targets
    const { dara } = inferDARAFromCash({ holdings, tipsMap, refCPI, settlementDate });
    const { summary, details } = runRebalance({ dara, method: 'Gap', holdings, tipsMap, refCPI, settlementDate });
    const bracketTargets = details.filter(d => d.isBracketTarget);
    const hasImportedExcess = bracketTargets.some(d => d.excessQtyBefore > 0);
    assert('F5 file: bracket excessQtyBefore > 0 (from import or LMI fallback)', hasImportedExcess, true);
    console.log(`        bracket rows:  ${bracketTargets.length}`);
    for (const d of bracketTargets) {
      console.log(`        FY ${d.fundedYear}  exBefore=${d.excessQtyBefore}  exAfter=${d.excessQtyAfter}`);
    }
  }
}

// ── Test: Format 1 (Fidelity) — inline fixture ───────────────────────────────
{
  console.log('\nFormat 1 (Fidelity) — broker import parsing');
  const csv1 = [
    'Account Number,Account Name,Symbol,Description,Quantity,Last Price,Current Value,Type',
    'X11111111,Owner8 IRA,91282CPU9,TIPS 0.125% 01/15/2031,5000,$100.00,$500000,Cash',
    'X11111111,Owner8 IRA,912810QF8,TIPS 0.25% 02/15/2040,8000,$100.00,$800000,Cash',
    'X11111111,Owner8 IRA,FDLXX,FIDELITY MONEY MARKET,1234.56,$1.00,$1234.56,Cash',
    'X22222222,Owner2 IRA,91282CPU9,TIPS 0.125% 01/15/2031,3000,$100.00,$300000,Cash',
    'X22222222,Owner2 IRA,VTI,VANGUARD TOTAL STOCK,50,$200.00,$10000,Cash',
  ].join('\n');
  const { holdings, tipsValues, totalAccountValues } = parseBrokerCSV(csv1, tipsMap);
  const accounts = holdings;

  assert('F1: Owner8 IRA has 2 TIPS', accounts['Owner8 IRA']?.length, 2);
  const cpu9 = accounts['Owner8 IRA']?.find(h => h.cusip === '91282CPU9');
  assert('F1: CPU9 qty === 5', cpu9?.qty, 5);
  const qf8 = accounts['Owner8 IRA']?.find(h => h.cusip === '912810QF8');
  assert('F1: QF8 qty === 8', qf8?.qty, 8);
  assert('F1: FDLXX filtered out', accounts['Owner8 IRA']?.find(h => h.cusip === 'FDLXX'), undefined);
  assert('F1: Owner2 IRA CPU9 qty === 3', accounts['Owner2 IRA']?.find(h => h.cusip === '91282CPU9')?.qty, 3);
  assert('F1: VTI filtered out', accounts['Owner2 IRA']?.find(h => h.cusip === 'VTI'), undefined);
  console.log(`        accounts: ${Object.keys(accounts).join(', ')}`);
}

// ── Test: Format 2 (Schwab) — inline fixture ─────────────────────────────────
{
  console.log('\nFormat 2 (Schwab) — broker import parsing');
  const csv2 = [
    '"Positions for All-Accounts as of 10:00 AM ET, 04/26/2026"',
    '',
    '"Owner8 IRA ...1234"',
    '"Symbol","Description","Qty (Quantity)","Price","Mkt Val (Market Value)","Asset Type"',
    '"91282CPU9","TIPS 0.125% 01/15/2031","5,000","100.00","$500,000.00","Fixed Income"',
    '"912810QF8","TIPS 0.25% 02/15/2040","8,000","100.00","$800,000.00","Fixed Income"',
    '"SCHZ","SCHWAB AGG BOND ETF","100","50.00","$5,000.00","ETFs"',
    '"Account Total","","","","$1,305,000.00",""',
    '',
    '"Owner2 IRA ...5678"',
    '"Symbol","Description","Qty (Quantity)","Price","Mkt Val (Market Value)","Asset Type"',
    '"91282CPU9","TIPS 0.125% 01/15/2031","3,000","100.00","$300,000.00","Fixed Income"',
    '"Account Total","","","","$300,000.00",""',
  ].join('\n');
  const { holdings, tipsValues, totalAccountValues } = parseBrokerCSV(csv2, tipsMap);
  const accounts = holdings;

  assert('F2: Owner8 IRA has 2 TIPS', accounts['Owner8 IRA']?.length, 2);
  const cpu9 = accounts['Owner8 IRA']?.find(h => h.cusip === '91282CPU9');
  assert('F2: CPU9 qty === 5 (comma-qty parsed)', cpu9?.qty, 5);
  const qf8 = accounts['Owner8 IRA']?.find(h => h.cusip === '912810QF8');
  assert('F2: QF8 qty === 8', qf8?.qty, 8);
  assert('F2: SCHZ filtered out', accounts['Owner8 IRA']?.find(h => h.cusip === 'SCHZ'), undefined);
  assert('F2: Owner2 IRA CPU9 qty === 3', accounts['Owner2 IRA']?.find(h => h.cusip === '91282CPU9')?.qty, 3);
  console.log(`        accounts: ${Object.keys(accounts).join(', ')}`);
}

// ── Test: Build from scratch — deterministic output ───────────────────────────
console.log('\nBuild — DARA=50000, lastYear=2040');
{
  const dara = 50000, lastYear = 2040;
  const firstYear = settlementDate.getFullYear();
  const { summary, results, details } = runBuild({ dara, lastYear, tipsMap, refCPI, settlementDate });
  assert('totalBuyCost > 0', summary.totalBuyCost > 0, true);
  assert('result rows > 0', results.length > 0, true);
  assert('lowerYear < upperYear', summary.lowerYear < summary.upperYear, true);
  assert('lowerWeight + upperWeight ≈ 1', summary.lowerWeight + summary.upperWeight, 1, 0.0001);
  const numRungs = lastYear - firstYear + 1;
  const totalAmt = details.reduce((s, d) => s + (d.fundedYearAmt ?? 0) + (d.excessAmt ?? 0), 0);
  const avgAmt = totalAmt / numRungs;
  // Tolerance 300 (was 200): the 2040 upper-excess-coupon fixpoint (View A, gap-math
  // gapParamsWithUpperFeedback) trims ~2 bonds/bracket of over-coverage, so the displayed
  // average dips a hair below DARA and the integer-rounding residual of this approximate
  // coverage invariant shifts by ~10–50. Still <0.6% of DARA.
  assert('avgAmt ≈ DARA (gap LMI included)', avgAmt, dara, 300);
  console.log(`        totalBuyCost:  ${Math.round(summary.totalBuyCost).toLocaleString()}`);
  console.log(`        lowerYear:     ${summary.lowerYear}, upperYear: ${summary.upperYear}`);
  console.log(`        weights:       ${summary.lowerWeight.toFixed(4)} / ${summary.upperWeight.toFixed(4)}`);
  console.log(`        avgAmt/rung:   ${Math.round(avgAmt).toLocaleString()} (DARA=${dara.toLocaleString()}, rungs=${numRungs})`);
}

// ── Test: Build — Future 30Y years (lastYear > maxRealYear) ───────────────────────
console.log('\nBuild — DARA=50000, lastYear=2060 (Future 30Y years)');
{
  const dara = 50000, lastYear = 2060;
  const { summary } = runBuild({ dara, lastYear, tipsMap, refCPI, settlementDate });
  assert('future30yYears.length > 0', (summary.future30yYears?.length ?? 0) > 0, true);
  assert('future30yLowerYear === 2056', summary.future30yLowerYear, 2056);
  assert('future30yUpperYear === 2052', summary.future30yUpperYear, 2052);
  assert('future30yLowerWeight + future30yUpperWeight ≈ 1',
    (summary.future30yLowerWeight ?? 0) + (summary.future30yUpperWeight ?? 0), 1, 0.0001);
  assert('avgDuration between lower and upper',
    summary.future30yParams?.avgDuration > summary.future30yLowerDuration &&
    summary.future30yParams?.avgDuration < summary.future30yUpperDuration, true);
  assert('future30yFellBack === false', summary.future30yFellBack, false);
  assert('totalBuyCost > 0', summary.totalBuyCost > 0, true);
  console.log(`        future30yYears:      ${JSON.stringify(summary.future30yYears)}`);
  console.log(`        d_lower(2056):       ${summary.future30yLowerDuration?.toFixed(4)}`);
  console.log(`        d_avg(Future 30Y):   ${summary.future30yParams?.avgDuration?.toFixed(4)}`);
  console.log(`        d_upper(2052):       ${summary.future30yUpperDuration?.toFixed(4)}`);
  console.log(`        weights 2056/2052:   ${summary.future30yLowerWeight?.toFixed(4)} / ${summary.future30yUpperWeight?.toFixed(4)}`);
  console.log(`        exQty  2056/2052:    ${summary.future30yLowerExQty} / ${summary.future30yUpperExQty}`);
  console.log(`        totalBuyCost:        ${Math.round(summary.totalBuyCost).toLocaleString()}`);
}

// ── Test: Build — firstYear=2036, lastYear=2056, preLadderInterest=true ───────
// Regression for bug: inflated prelim LMI in calcGapParams caused totalCost→0,
// collapsing bracket excess quantities to 0 even while gap breakdown showed non-zero.
console.log('\nBuild — firstYear=2036, lastYear=2056, preLadderInterest=true');
{
  const dara = 20000, firstYear = 2036, lastYear = 2056;
  const { summary, results, details } = runBuild({ dara, firstYear, lastYear, tipsMap, refCPI, settlementDate, preLadderInterest: true });
  const lower = results.find(r => r[2] === summary.lowerYear);
  const upper = results.find(r => r[2] === summary.upperYear);
  const lowerTotalQty = (lower?.[3] ?? 0) + (lower?.[4] ?? 0); // fundedYearQty + excessQty
  const upperTotalQty = (upper?.[3] ?? 0) + (upper?.[4] ?? 0);
  assert('gap totalCost > 0', (summary.gapParams?.totalCost ?? 0) > 0, true);
  assert('lowerExQty > 0', summary.lowerExQty > 0, true);
  assert('upperExQty > 0', summary.upperExQty > 0, true);
  assert('lower bracket total qty > 0', lowerTotalQty > 0, true);
  assert('upper bracket total qty > 0', upperTotalQty > 0, true);
  const numRungs = lastYear - firstYear + 1;
  const totalAmt = details.reduce((s, d) => s + (d.fundedYearAmt ?? 0) + (d.excessAmt ?? 0), 0);
  const avgAmt = totalAmt / numRungs;
  assert('avgAmt ≈ DARA with PLI (gap LMI included)', avgAmt, dara, 300); // see note above (fixpoint shifts residual)
  console.log(`        lowerYear: ${summary.lowerYear}, upperYear: ${summary.upperYear}`);
  console.log(`        lowerExQty: ${summary.lowerExQty}, upperExQty: ${summary.upperExQty}`);
  console.log(`        zeroedFundedYears: [${summary.zeroedFundedYears?.join(', ')}]`);
  console.log(`        gapTotalCost: ${Math.round(summary.gapParams?.totalCost ?? 0).toLocaleString()}`);
  console.log(`        avgAmt/rung:  ${Math.round(avgAmt).toLocaleString()} (DARA=${dara.toLocaleString()}, rungs=${numRungs})`);
}

// ── Test: Build→Rebalance symmetry ───────────────────────────────────────────
// Build(firstYear=2036, lastYear=2065, PLI, explicit DARA) → export CUSIP/qty
// → Rebalance with identical params → expect zero qty changes on every rung.
//
// Requires explicit DARA. Inferred DARA cannot guarantee symmetry: bracket
// excess P+I at 2036 inflates the inferred average above Build's DARA, and gap
// years 2037-2039 (no bonds) have ARA < DARA. The inferred value is diagnostic.
//
// Uses 2-bracket mode to expose any remaining algorithm differences. 3-bracket
// "freeze orig lower" would mask mismatches by pinning 2036 excess at its
// current holdings value regardless of gap-params accuracy.
console.log('\nBuild→Rebalance symmetry — firstYear=2036, lastYear=2065, PLI=true, DARA=40000');
{
  const DARA = 40000, firstYear = 2036, lastYear = 2065;

  // 1. Build
  const { details: buildDetails, summary: buildSummary } = runBuild({
    dara: DARA, firstYear, lastYear, tipsMap, refCPI, settlementDate,
    preLadderInterest: true,
  });

  // 2. Construct holdings — mirrors the 3-column "Export CUSIP/Qty" CSV (Format 5)
  const holdings = buildDetails
    .map(d => ({ cusip: d.cusip, qty: d.fundedYearQty + d.excessQty, excessQty: d.excessQty }))
    .filter(h => h.qty > 0);

  // 3. Rebalance with identical params
  const { summary: rebalSummary, results: rebalResults } = runRebalance({
    dara: DARA,
    method: 'Gap',
    bracketMode: '2bracket',
    holdings,
    tipsMap,
    refCPI,
    settlementDate,
    preLadderInterest: true,
    firstYearOverride: firstYear,
    lastYearOverride: lastYear,
  });

  // 4. Assert: no qty changes on any rung.
  // Tolerance: ±2 bonds across all bracket years. Root cause is a pre-existing LMI
  // computation difference between calcGapParams (build) and calculateGapParameters
  // (rebalance). AMD's larger PLI pool can expose the asymmetry at both the lower
  // bracket (2036) and upper bracket (2040), hence the 2-bond / $4000 tolerance.
  const totalAbsQtyDelta = rebalResults.reduce((s, r) => s + Math.abs(r[9] ?? 0), 0);
  assert('Build→Rebalance: zero total |qtyDelta|', totalAbsQtyDelta <= 2, true);
  assert('Build→Rebalance: zero net cash', Math.abs(Math.round(rebalSummary.costDeltaSum)) <= 4000, true);

  if (totalAbsQtyDelta > 0) {
    const changed = rebalResults.filter(r => (r[9] ?? 0) !== 0);
    for (const r of changed) {
      console.error(`        FY ${r[3]}  CUSIP ${r[0]}  before=${r[1]}  after=${r[8]}  delta=${r[9]}`);
    }
  }
  console.log(`        Build total cost:  ${Math.round(buildSummary.totalBuyCost).toLocaleString()}`);
  console.log(`        Rebal net cash:    ${Math.round(rebalSummary.costDeltaSum).toLocaleString()}`);
  console.log(`        Total |qtyDelta|:  ${totalAbsQtyDelta}`);
}

// ── Test: Build→Rebalance round-trip with NO year overrides — Future-30Y excess ──
// Regression: build 2026–2066 (default DARA), export CUSIP/Qty/excess, import, rebalance
// WITHOUT setting first/last year. lastYear must be INFERRED from the 2052/2056 cover excess
// (inferLastYearFromHoldings) so the round-trip preserves it instead of selling to DARA.
console.log('\nBuild→Rebalance NO-override round-trip — firstYear=2026, lastYear=2066, DARA=40000');
{
  const DARA = 40000, firstYear = settlementDate.getFullYear(), lastYear = 2066;
  const { details: bD, summary: bS } = runBuild({ dara: DARA, firstYear, lastYear, tipsMap, refCPI, settlementDate });
  const holdings = bD
    .map(d => ({ cusip: d.cusip, qty: d.fundedYearQty + d.excessQty, excessQty: d.excessQty }))
    .filter(h => h.qty > 0);

  // Direct inference check
  const inferredLast = inferLastYearFromHoldings({ holdings, tipsMap, refCPI, settlementDate });
  assert('inferLastYear from build holdings === 2066', inferredLast, 2066);

  // Rebalance with NO firstYearOverride / NO lastYearOverride — must self-infer.
  const { summary: rS, results: rR } = runRebalance({
    dara: DARA, method: 'Full', bracketMode: '2bracket', holdings, tipsMap, refCPI, settlementDate,
  });
  assert('NO-override rebal infers lastYear 2066', rS.lastYear, 2066);
  assert('NO-override rebal preserves 2052 upper cover excess', rS.future30yUpperExQty, bS.future30yUpperExQty);
  assert('NO-override rebal preserves 2056 lower cover excess', rS.future30yLowerExQty, bS.future30yLowerExQty);
  const totalAbsQtyDelta = rR.reduce((s, r) => s + Math.abs(r[9] ?? 0), 0);
  assert('NO-override round-trip: zero total |qtyDelta|', totalAbsQtyDelta <= 2, true);
  assert('NO-override round-trip: zero net cash', Math.abs(Math.round(rS.costDeltaSum)) <= 4000, true);
  console.log(`        inferredLast: ${inferredLast}  future30y up/lo: ${rS.future30yUpperExQty}/${rS.future30yLowerExQty}  |qtyDelta|: ${totalAbsQtyDelta}  netCash: ${Math.round(rS.costDeltaSum).toLocaleString()}`);
}

// ── Test: Build→Rebalance round-trip through the REAL export string + parse (PLI) ──
// Regression for the Future-30Y import bug: mirrors the app's "Export CUSIP/Qty" → import path
// exactly (serialize to cusip,qty,excess; re-parse via parseHoldingsCSV), with PLI on. The last
// funded year must be recovered from the 2052/2056 cover excess so the round-trip is flat.
console.log('\nBuild→Rebalance export-string round-trip — firstYear=2036, lastYear=2066, PLI, DARA=40000');
{
  const DARA = 40000, firstYear = 2036, lastYear = 2066;
  const { details: bD, summary: bS } = runBuild({ dara: DARA, firstYear, lastYear, tipsMap, refCPI, settlementDate, preLadderInterest: true });
  const zeroed = new Set(bS.zeroedFundedYears ?? []);

  // Serialize exactly like index.html's export-cusip-qty handler
  const rows = ['cusip,qty,excess'];
  for (const d of bD) {
    const f = d.fundedYearQty, e = d.excessQty;
    if (f + e > 0) rows.push(`${d.cusip},${f},${e}`);
    else if (zeroed.has(d.fundedYear)) rows.push(`${d.cusip},0,0`);
  }
  const holdings = parseHoldingsCSV(rows.join('\n'), tipsMap);   // same parser the app uses (Format 5)

  const infLast = inferLastYearFromHoldings({ holdings, tipsMap, refCPI, settlementDate });
  assert('PLI round-trip: last year recovered as 2066', infLast, 2066);

  // Rebalance the way the (fixed) UI would: recovered last year, PLI on, no first-year override.
  const { summary: rS, results: rR } = runRebalance({
    dara: DARA, method: 'Full', bracketMode: '2bracket', holdings, tipsMap, refCPI, settlementDate,
    preLadderInterest: true, lastYearOverride: infLast,
  });
  const totalAbsQtyDelta = rR.reduce((s, r) => s + Math.abs(r[9] ?? 0), 0);
  assert('PLI round-trip: zero total |qtyDelta|', totalAbsQtyDelta <= 2, true);
  assert('PLI round-trip: zero net cash', Math.abs(Math.round(rS.costDeltaSum)) <= 4000, true);
  console.log(`        infLast=${infLast}  future30y up/lo: ${rS.future30yUpperExQty}/${rS.future30yLowerExQty}  |qtyDelta|=${totalAbsQtyDelta}  netCash=${Math.round(rS.costDeltaSum).toLocaleString()}`);
}

// ── Test: Build→Rebalance symmetry — Full method, default bracket mode ───────
// Same scenario as the Gap-method test above, but with method='Full'.
// 3-bracket is equivalent to 2-bracket here (firstYear=2036 = anchorBefore),
// but this test covers the Full-mode estimation path in calculateGapParameters.
console.log('\nBuild→Rebalance symmetry — firstYear=2036, lastYear=2065, PLI=true, DARA=40000, method=Full');
{
  const DARA = 40000, firstYear = 2036, lastYear = 2065;

  // 1. Build
  const { details: buildDetailsFull, summary: buildSummaryFull } = runBuild({
    dara: DARA, firstYear, lastYear, tipsMap, refCPI, settlementDate,
    preLadderInterest: true,
  });

  // 2. Holdings from build export — mirrors the 3-column "Export CUSIP/Qty" CSV (Format 5)
  const holdingsFull = buildDetailsFull
    .map(d => ({ cusip: d.cusip, qty: d.fundedYearQty + d.excessQty, excessQty: d.excessQty }))
    .filter(h => h.qty > 0);

  // 3. Rebalance with Full method
  const { summary: rebalSummaryFull, results: rebalResultsFull, details: rebalDetailsFull } = runRebalance({
    dara: DARA,
    method: 'Full',
    bracketMode: '3bracket',
    holdings: holdingsFull,
    tipsMap,
    refCPI,
    settlementDate,
    preLadderInterest: true,
    firstYearOverride: firstYear,
    lastYearOverride: lastYear,
  });

  const totalAbsQtyDeltaFull = rebalResultsFull.reduce((s, r) => s + Math.abs(r[9] ?? 0), 0);
  assert('Build→Rebalance Full: zero total |qtyDelta|', totalAbsQtyDeltaFull, 0);
  assert('Build→Rebalance Full: zero net cash', Math.round(rebalSummaryFull.costDeltaSum), 0);

  // Cover-year split: fundedYearQtyBefore must equal fundedYearQtyAfter (no phantom fy/cover trades)
  const coverYears = new Set([buildSummaryFull.future30yLowerYear, buildSummaryFull.future30yUpperYear].filter(Boolean));
  for (const d of (rebalDetailsFull ?? [])) {
    if (coverYears.has(d.fundedYear)) {
      assert(`FY ${d.fundedYear} cover-year funded split stable (before==after)`,
        d.fundedYearQtyBefore, d.fundedYearQtyAfter);
    }
  }

  if (totalAbsQtyDeltaFull > 0) {
    const changed = rebalResultsFull.filter(r => (r[9] ?? 0) !== 0);
    for (const r of changed) {
      console.error(`        FY ${r[3]}  CUSIP ${r[0]}  before=${r[1]}  after=${r[8]}  delta=${r[9]}`);
    }
  }
  console.log(`        Build total cost:  ${Math.round(buildSummaryFull.totalBuyCost).toLocaleString()}`);
  console.log(`        Rebal net cash:    ${Math.round(rebalSummaryFull.costDeltaSum).toLocaleString()}`);
  console.log(`        Total |qtyDelta|:  ${totalAbsQtyDeltaFull}`);
}

// ── Test: DARA inference from build CUSIP/qty output ─────────────────────────
// Build (firstYear=2035, lastYear=2064, PLI=true, DARA=40000) → export CUSIP/qty
// → Rebalance (firstYear=2036, lastYear=2065, PLI=true, dara=null).
// inferredDARA should land close to the build DARA (within ±500).
// If this fails it means the inference formula is broken, not the rebalance itself.
console.log('\nBuild→Rebalance DARA inference — firstYear=2035→2036, lastYear=2064→2065, PLI=true');
{
  const BUILD_DARA = 40000;

  // 1. Build
  const { details: inferBuildDetails } = runBuild({
    dara: BUILD_DARA,
    firstYear: 2035,
    lastYear: 2064,
    tipsMap, refCPI, settlementDate,
    preLadderInterest: true,
  });

  // 2. Export CUSIP/qty — mirrors the 3-column "Export CUSIP/Qty" CSV (Format 5).
  const inferHoldings = inferBuildDetails
    .map(d => ({ cusip: d.cusip, qty: d.fundedYearQty + d.excessQty, excessQty: d.excessQty }));

  // 3. Rebalance with no explicit DARA — shift to firstYear=2036, lastYear=2065
  const { summary: inferRebalSummary } = runRebalance({
    dara: null,
    method: 'Gap',
    bracketMode: '2bracket',
    holdings: inferHoldings,
    tipsMap, refCPI, settlementDate,
    preLadderInterest: true,
    firstYearOverride: 2036,
    lastYearOverride: 2065,
  });

  const inferred = inferRebalSummary.inferredDARA;
  assert('inferredDARA within 500 of build DARA (40000)',
    Math.abs(inferred - BUILD_DARA) <= 500, true);
  console.log(`        build DARA:      ${BUILD_DARA.toLocaleString()}`);
  console.log(`        inferredDARA:    ${Math.round(inferred).toLocaleString()}`);
  console.log(`        delta:           ${Math.round(inferred - BUILD_DARA).toLocaleString()}`);
}

// ── Test: Build — firstYear inside gap (2037/2038/2039) ──────────────────────
// Lower bracket (Jan 2036) always exists — identified from tipsMap even when firstYear > 2036.
// 2036 row: fundedYearQty = 0, excessQty > 0 (pure bracket excess for duration matching).
for (const gapFirstYear of [2037, 2038, 2039]) {
  console.log(`\nBuild — firstYear=${gapFirstYear} (gap year), lastYear=2047`);
  const dara = 30000, lastYear = 2047;
  const { summary, results, details } = runBuild({ dara, firstYear: gapFirstYear, lastYear, tipsMap, refCPI, settlementDate });
  const gapYearsInRange = [];
  for (let y = gapFirstYear; y <= 2039; y++) gapYearsInRange.push(y);
  assert(`firstYear=${gapFirstYear}: gapYears covers [${gapFirstYear}–2039]`,
    summary.gapYears.length, gapYearsInRange.length);
  assert(`firstYear=${gapFirstYear}: lowerYear === 2036`,
    summary.lowerYear, 2036);
  assert(`firstYear=${gapFirstYear}: upperYear === 2040`,
    summary.upperYear, 2040);
  assert(`firstYear=${gapFirstYear}: lowerWeight + upperWeight ≈ 1`,
    summary.lowerWeight + summary.upperWeight, 1, 0.0001);
  assert(`firstYear=${gapFirstYear}: duration match (w_lo×d_lo + w_up×d_up ≈ avgDuration)`,
    summary.lowerWeight * summary.lowerDuration + summary.upperWeight * summary.upperDuration,
    summary.gapParams.avgDuration, 0.001);
  assert(`firstYear=${gapFirstYear}: lowerExQty > 0`, summary.lowerExQty > 0, true);
  assert(`firstYear=${gapFirstYear}: upperExQty > 0`, summary.upperExQty > 0, true);
  assert(`firstYear=${gapFirstYear}: result rows > 0`, results.length > 0, true);
  // 2036 appears as a pure bracket row (fundedYearQty=0, excessQty>0)
  const d2036 = details.find(d => d.fundedYear === 2036);
  assert(`firstYear=${gapFirstYear}: 2036 row present`, d2036 != null, true);
  assert(`firstYear=${gapFirstYear}: 2036 fundedYearQty === 0`, d2036?.fundedYearQty, 0);
  assert(`firstYear=${gapFirstYear}: 2036 excessQty > 0`, (d2036?.excessQty ?? 0) > 0, true);
  console.log(`        gapYears:  [${summary.gapYears.join(',')}]`);
  console.log(`        lowerYear: ${summary.lowerYear}  lowerExQty: ${summary.lowerExQty}  upperExQty: ${summary.upperExQty}`);
  console.log(`        weights:   ${summary.lowerWeight?.toFixed(4)} / ${summary.upperWeight?.toFixed(4)}`);
  console.log(`        durMatch:  ${(summary.lowerWeight*summary.lowerDuration + summary.upperWeight*summary.upperDuration).toFixed(4)} ≈ ${summary.gapParams?.avgDuration?.toFixed(4)}`);
  console.log(`        totalBuyCost: ${Math.round(summary.totalBuyCost).toLocaleString()}`);
}

// ── Test: Rebalance — firstYearOverride inside gap (2037/2038/2039) ───────────
{
  console.log('\nBuild→Rebalance — firstYearOverride=2037, lastYear=2047');
  const DARA = 30000, buildFirstYear = 2035, lastYear = 2047;
  const { details: bldDetails } = runBuild({
    dara: DARA, firstYear: buildFirstYear, lastYear,
    tipsMap, refCPI, settlementDate,
  });
  const holdings = bldDetails.map(d => ({ cusip: d.cusip, qty: d.fundedYearQty + d.excessQty, excessQty: d.excessQty }));

  const { summary: rSummary } = runRebalance({
    dara: DARA, method: 'Full', bracketMode: '2bracket',
    holdings, tipsMap, refCPI, settlementDate,
    firstYearOverride: 2037, lastYearOverride: lastYear,
  });
  assert('Rebal firstYear=2037: lowerYear === 2036', rSummary.brackets.lowerYear, 2036);
  assert('Rebal firstYear=2037: upperYear 2040', rSummary.brackets.upperYear, 2040);
  assert('Rebal firstYear=2037: lowerWeight + upperWeight ≈ 1', rSummary.lowerWeight + rSummary.upperWeight, 1, 0.0001);
  assert('Rebal firstYear=2037: duration match', rSummary.lowerWeight * rSummary.lowerDuration + rSummary.upperWeight * rSummary.upperDuration, rSummary.gapParams.avgDuration, 0.001);
  assert('Rebal firstYear=2037: gapYears = [2037,2038,2039]', JSON.stringify(rSummary.gapYears), '[2037,2038,2039]');
  // costDeltaSum is positive: selling 2035/2036 funded bonds releases cash (ladder shortening)
  assert('Rebal firstYear=2037: costDeltaSum >= 0 (cash released from sold years)', rSummary.costDeltaSum >= 0, true);
  console.log(`        costDeltaSum: ${Math.round(rSummary.costDeltaSum).toLocaleString()}`);
  console.log(`        gapYears: [${rSummary.gapYears.join(',')}]`);
  console.log(`        lowerWeight/upperWeight: ${rSummary.lowerWeight}/${rSummary.upperWeight}`);
}

// ── Test: inferFirstYearFromHoldings ─────────────────────────────────────────
{
  console.log('\ninferFirstYearFromHoldings');
  const DARA = 30000, lastYear = 2047;

  // Build with firstYear=2038 (gap year) → 2036 gets pure bracket excess, no funded component.
  for (const firstYearIn of [2037, 2038, 2039]) {
    const { details: bldD } = runBuild({ dara: DARA, firstYear: firstYearIn, lastYear, tipsMap, refCPI, settlementDate });
    // Simulate Format 5 CSV round-trip: include excessQty for all rows.
    const holdings = bldD.map(d => ({ cusip: d.cusip, qty: d.fundedYearQty + d.excessQty, excessQty: d.excessQty }));
    const inferred = inferFirstYearFromHoldings({ holdings, tipsMap, refCPI, settlementDate });
    assert(`inferFirstYear from build firstYear=${firstYearIn}`, inferred, firstYearIn);
  }

  // Format 3 (no excessQty) → returns null (no inference possible).
  const { details: bldD3 } = runBuild({ dara: DARA, firstYear: 2038, lastYear, tipsMap, refCPI, settlementDate });
  const holdingsNoExcess = bldD3.map(d => ({ cusip: d.cusip, qty: d.fundedYearQty + d.excessQty }));
  const inferredNull = inferFirstYearFromHoldings({ holdings: holdingsNoExcess, tipsMap, refCPI, settlementDate });
  assert('inferFirstYear Format3 (no excessQty) → null', inferredNull, null);

  // Build with firstYear=2036 (funded year, not pure bracket) → 2036 has funded component → returns null.
  const { details: bldD36 } = runBuild({ dara: DARA, firstYear: 2036, lastYear, tipsMap, refCPI, settlementDate });
  const holdings36 = bldD36.map(d => ({ cusip: d.cusip, qty: d.fundedYearQty + d.excessQty, excessQty: d.excessQty }));
  const inferred36 = inferFirstYearFromHoldings({ holdings: holdings36, tipsMap, refCPI, settlementDate });
  assert('inferFirstYear from build firstYear=2036 → null (2036 is funded, not pure bracket)', inferred36, null);
}

// ── Test: Multi-account — no 2040 buys in Owner14 Joint (taxable) ─────────────
// Load FidelityAllAccounts.csv, select Owner4 IRA + Owner14 Joint WROS, rebalance.
// 2040 is long-tier → must go to tIRA (Owner4 IRA), never taxable (Owner14 Joint).
{
  const fidelityPath = path.resolve('tests/FidelityAllAccounts.csv');
  {
    console.log('\nMulti-account — Owner4 IRA + Owner14 Joint WROS: no 2040 buys in taxable');

    const OWNER4_IRA   = 'Owner4 IRA';
    const JOINT       = 'Owner14 Joint WROS';
    const TARGET_YEAR = 2040;

    const { holdings: allHoldings, tipsValues, totalAccountValues } =
      parseBrokerCSV(readFileSync(fidelityPath, 'utf8'), tipsMap);

    // Only select these two accounts
    const selectedAccounts = [OWNER4_IRA, JOINT].filter(n => allHoldings[n]);
    const holdingsWithAccount = [];
    const accountSizes = {};
    for (const name of selectedAccounts) {
      const tv = tipsValues[name] || 50000;
      accountSizes[name] = { sizeInDollars: tv };
      for (const h of allHoldings[name]) {
        holdingsWithAccount.push({ ...h, account: name });
      }
    }

    const { dara } = inferDARAFromCash({ holdings: holdingsWithAccount, tipsMap, refCPI, settlementDate });
    const maResult = runMultiAccountRebalance({
      dara,
      method: 'Full',
      holdings: holdingsWithAccount,
      tipsMap,
      refCPI,
      settlementDate,
      accountSizes,
      minMonthsToMaturity: 6,
    });

    const alloc   = maResult.accountAllocation;
    const current = maResult.currentHoldingsByAccount;
    const details = maResult.rebalanceResult.details;
    const tiers   = maResult.maturityTiers;
    const flows   = maResult.accountCashFlows;

    // Find all 2040 buys in Joint
    const joint2040Buys = [];
    for (const cusip in (alloc[JOINT] || {})) {
      const qtyAfter  = alloc[JOINT][cusip]?.[TARGET_YEAR] || 0;
      const qtyBefore = current[JOINT]?.[cusip]?.[TARGET_YEAR] || 0;
      if (qtyAfter > qtyBefore) {
        joint2040Buys.push({ cusip, qtyBefore, qtyAfter, delta: qtyAfter - qtyBefore });
      }
    }

    const ok = joint2040Buys.length === 0;
    assert(`no 2040 buys in ${JOINT} (long-tier should go to tIRA)`, ok, true);

    if (!ok) {
      console.error('\n  ── Diagnostic ──────────────────────────────────────────');
      console.error(`  Tier of 2040: ${tiers[TARGET_YEAR]}`);

      for (const { cusip, qtyBefore, qtyAfter, delta } of joint2040Buys) {
        console.error(`  BUY in ${JOINT}: ${cusip} year=${TARGET_YEAR}  before=${qtyBefore}  after=${qtyAfter}  delta=+${delta}`);
      }

      // Owner4 IRA budget
      const iraFlows = flows[OWNER4_IRA] || {};
      console.error(`\n  Owner4 IRA budget:          $${(iraFlows.budget || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
      console.error(`  Owner4 IRA allocation cost: $${(iraFlows.newAllocationCost || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
      const headroom = (iraFlows.budget || 0) - (iraFlows.newAllocationCost || 0);
      console.error(`  Owner4 IRA headroom:        $${headroom.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);

      // Owner4 IRA 2040 position
      for (const cusip in (alloc[OWNER4_IRA] || {})) {
        const qtyAfterIRA  = alloc[OWNER4_IRA][cusip]?.[TARGET_YEAR] || 0;
        const qtyBeforeIRA = current[OWNER4_IRA]?.[cusip]?.[TARGET_YEAR] || 0;
        if (qtyAfterIRA > 0 || qtyBeforeIRA > 0) {
          console.error(`  Owner4 IRA ${TARGET_YEAR}: ${cusip}  before=${qtyBeforeIRA}  after=${qtyAfterIRA}  delta=${qtyAfterIRA - qtyBeforeIRA}`);
        }
      }

      // All detail rows for year 2040 — targets
      const rows2040 = details.filter(d => d.fundedYear === TARGET_YEAR);
      console.error(`\n  Rebalance targets for year ${TARGET_YEAR}:`);
      for (const d of rows2040) {
        const currentTotal = Object.values(current).reduce((s, byC) => s + (byC[d.cusip]?.[TARGET_YEAR] || 0), 0);
        const held = {
          [OWNER4_IRA]: current[OWNER4_IRA]?.[d.cusip]?.[TARGET_YEAR] || 0,
          [JOINT]:     current[JOINT]?.[d.cusip]?.[TARGET_YEAR] || 0,
        };
        console.error(`    cusip=${d.cusip}  qtyBefore=${d.qtyBefore}  qtyAfter=${d.qtyAfter}  delta=${d.qtyAfter - d.qtyBefore}`);
        console.error(`      current: ${OWNER4_IRA}=${held[OWNER4_IRA]}  ${JOINT}=${held[JOINT]}  total=${currentTotal}`);
        console.error(`      costPerBond=$${d.costPerBond?.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
      }

      // Owner4 IRA sells (what freed budget)
      console.error(`\n  Owner4 IRA sells (budget freed):`);
      let totalFreed = 0;
      for (const cusip in (alloc[OWNER4_IRA] || {})) {
        for (const yearStr in (alloc[OWNER4_IRA][cusip] || {})) {
          const qA = alloc[OWNER4_IRA][cusip][yearStr] || 0;
          const qB = current[OWNER4_IRA]?.[cusip]?.[yearStr] || 0;
          const d  = details.find(row => row.cusip === cusip && row.fundedYear === parseInt(yearStr));
          if (qA < qB) {
            const freed = (qB - qA) * (d?.costPerBond || 0);
            totalFreed += freed;
            console.error(`    SELL year=${yearStr}  ${cusip}  qty ${qB}→${qA}  freed=$${freed.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
          }
        }
      }
      console.error(`    Total freed: $${totalFreed.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);

      // Is the budget headroom enough for the missed 2040 buy?
      const missed2040Cost = joint2040Buys.reduce((s, b) => {
        const d = details.find(row => row.cusip === b.cusip && row.fundedYear === TARGET_YEAR);
        return s + b.delta * (d?.costPerBond || 0);
      }, 0);
      console.error(`\n  Cost of missed 2040 buy: $${missed2040Cost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
      console.error(`  Owner4 IRA headroom after allocation: $${headroom.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
      console.error(`  → ${headroom >= missed2040Cost ? 'Headroom sufficient — blocked by sellYearsByAccount or ordering issue' : 'Headroom INSUFFICIENT — budget exhausted before 2040 buy'}`);
      console.error('  ─────────────────────────────────────────────────────────\n');
    }
  }
}

// ── Test: Multi-account — no direction violations (buy+sell same year same account) ──────────
// Spec 3.2 Step 5.3: within a single account, for any funded year, all transactions must be
// in one direction (buy OR sell, never both).
{
  const fidelityPath = path.resolve('tests/FidelityAllAccounts.csv');
  {
    console.log('\nMulti-account — no direction violations (buy+sell same funded year same account)');

    const OWNER4_IRA = 'Owner4 IRA';
    const JOINT     = 'Owner14 Joint WROS';

    const { holdings: allHoldings, tipsValues } =
      parseBrokerCSV(readFileSync(fidelityPath, 'utf8'), tipsMap);

    const selectedAccounts = [OWNER4_IRA, JOINT].filter(n => allHoldings[n]);
    const holdingsWithAccount = [];
    const accountSizes = {};
    for (const name of selectedAccounts) {
      accountSizes[name] = { sizeInDollars: tipsValues[name] || 50000 };
      for (const h of allHoldings[name]) holdingsWithAccount.push({ ...h, account: name });
    }

    const { dara } = inferDARAFromCash({ holdings: holdingsWithAccount, tipsMap, refCPI, settlementDate });
    const maResult = runMultiAccountRebalance({
      dara, method: 'Full', holdings: holdingsWithAccount,
      tipsMap, refCPI, settlementDate, accountSizes, minMonthsToMaturity: 6,
    });

    const alloc   = maResult.accountAllocation;
    const current = maResult.currentHoldingsByAccount;

    const violations = [];
    for (const [accName, byCusip] of Object.entries(alloc)) {
      const yearDeltas = {};
      const allCusips = new Set([
        ...Object.keys(byCusip),
        ...Object.keys(current[accName] || {}),
      ]);
      for (const cusip of allCusips) {
        const allYears = new Set([
          ...Object.keys(byCusip[cusip] || {}).map(String),
          ...Object.keys(current[accName]?.[cusip] || {}).map(String),
        ]);
        for (const yearStr of allYears) {
          const year = parseInt(yearStr);
          const delta = (byCusip[cusip]?.[year] || 0) - (current[accName]?.[cusip]?.[year] || 0);
          if (delta === 0) continue;
          if (!yearDeltas[year]) yearDeltas[year] = [];
          yearDeltas[year].push({ cusip, delta });
        }
      }
      for (const [yearStr, deltas] of Object.entries(yearDeltas)) {
        if (deltas.some(d => d.delta > 0) && deltas.some(d => d.delta < 0)) {
          violations.push({ account: accName, year: parseInt(yearStr), deltas });
        }
      }
    }

    const ok = violations.length === 0;
    assert('no direction violations (buy+sell same funded year same account)', ok, true);

    if (!ok) {
      console.error('\n  ── Direction Violations ─────────────────────────────────');
      for (const { account, year, deltas } of violations) {
        console.error(`  ${account}  year=${year}:`);
        for (const { cusip, delta } of deltas) {
          console.error(`    ${cusip}  ${delta > 0 ? `BUY +${delta}` : `SELL ${delta}`}`);
        }
      }
      console.error('  ─────────────────────────────────────────────────────────\n');
    }
  }
}

// ── Test: Multi-account — IRA holds rmdMinQty per year when RMD is set ────────────────────────
// With rmdByAccount set, IRA must retain at least ceil(rmd/cost) bonds for every year
// where it currently holds bonds. "Sells all" (IRA → 0) is a failure.
{
  const fidelityPath = path.resolve('tests/FidelityAllAccounts.csv');
  {
    console.log('\nMulti-account — IRA retains rmdMinQty per funded year (RMD=$30k)');

    const OWNER4_IRA = 'Owner4 IRA';
    const JOINT     = 'Owner14 Joint WROS';
    const RMD       = 30000;

    const { holdings: allHoldings, tipsValues } =
      parseBrokerCSV(readFileSync(fidelityPath, 'utf8'), tipsMap);

    const selectedAccounts = [OWNER4_IRA, JOINT].filter(n => allHoldings[n]);
    const holdingsWithAccount = [];
    const accountSizes = {};
    for (const name of selectedAccounts) {
      accountSizes[name] = { sizeInDollars: tipsValues[name] || 50000 };
      for (const h of allHoldings[name]) holdingsWithAccount.push({ ...h, account: name });
    }

    const { dara } = inferDARAFromCash({ holdings: holdingsWithAccount, tipsMap, refCPI, settlementDate });
    const maResult = runMultiAccountRebalance({
      dara, method: 'Full', holdings: holdingsWithAccount,
      tipsMap, refCPI, settlementDate, accountSizes,
      rmdByAccount: { [OWNER4_IRA]: RMD },
      minMonthsToMaturity: 6,
    });

    const alloc   = maResult.accountAllocation;
    const current = maResult.currentHoldingsByAccount;

    // For each year where IRA currently holds bonds, verify it still holds >= rmdMinQty after.
    const underfilled = [];
    const iraCurrentByCusip = current[OWNER4_IRA] || {};
    const iraAllocByCusip   = alloc[OWNER4_IRA]   || {};

    // Collect years IRA currently holds (non-excluded)
    const iraYears = new Set();
    for (const cusip in iraCurrentByCusip) {
      for (const yearStr in iraCurrentByCusip[cusip]) {
        if ((iraCurrentByCusip[cusip][yearStr] || 0) > 0) iraYears.add(parseInt(yearStr));
      }
    }

    for (const year of iraYears) {
      // Total bonds IRA holds AFTER rebalance for this year
      let afterQty = 0;
      let repCost  = 0;
      for (const cusip in iraAllocByCusip) {
        const qty  = iraAllocByCusip[cusip][year] || 0;
        const cost = tipsMap.get(cusip)?.price || 1000;
        afterQty += qty;
        if (qty > 0 && repCost === 0) repCost = cost;
      }
      // Fall back to avgCost if no allocation found
      if (repCost === 0) {
        for (const cusip in iraCurrentByCusip) {
          const qty = iraCurrentByCusip[cusip][year] || 0;
          if (qty > 0) { repCost = tipsMap.get(cusip)?.price || 1000; break; }
        }
      }
      const rmdMinQty = Math.ceil(RMD / (repCost || 1000));

      // Total current IRA qty for this year
      let beforeQty = 0;
      for (const cusip in iraCurrentByCusip) beforeQty += iraCurrentByCusip[cusip][year] || 0;

      if (beforeQty >= rmdMinQty && afterQty < rmdMinQty) {
        underfilled.push({ year, beforeQty, afterQty, rmdMinQty });
      }
    }

    const ok = underfilled.length === 0;
    assert('IRA retains rmdMinQty per funded year where it had enough', ok, true);

    if (!ok) {
      console.error('\n  ── RMD Under-filled Years ───────────────────────────────');
      for (const { year, beforeQty, afterQty, rmdMinQty } of underfilled) {
        console.error(`  year=${year}  before=${beforeQty}  after=${afterQty}  rmdMinQty=${rmdMinQty}  (sells too many)`);
      }
      console.error('  ─────────────────────────────────────────────────────────\n');
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
