// ref-cpi.test.js — Verification that the two Ref CPI derivations AGREE.
// Run: node shared/tests/ref-cpi.test.js
//
// This is the "redundancy that verifies": the calculated NSA Ref CPI
// (refCpiFromMonthly, 31 CFR App. B) must reproduce the authoritative
// retrieved series (RefCPI.csv from TreasuryDirect). A mismatch means either
// bad data or a bug in the interpolation — exactly the failure mode that
// derailed the TipsReference session.

import { lookupRefCpi, refCpiFromMonthly, monthlyCpiMap, indexRatio } from '../src/ref-cpi.js';

const R2 = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const REFCPI_URL    = `${R2}/TIPS/RefCPI.csv`;
const CPI_URL       = `${R2}/bls/CPI.csv`;
const REFCPINSASA_URL = `${R2}/TIPS/RefCpiNsaSa.csv`;

// Published Ref CPI is rounded to 5 dp; our calc is exact real arithmetic.
const TOL = 1e-3;

let pass = 0, fail = 0;
const ok  = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } };

async function fetchText(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

function parseRefCpi(text) {
  return text.trim().split('\n').slice(1).map(l => {
    const [date, refCpi] = l.split(',');
    return { date: date.trim(), refCpi: parseFloat(refCpi) };
  });
}

// CPI.csv columns: year, period(M01..M12), periodName, NSA, SA
function parseCpi(text) {
  return text.trim().split('\n').slice(1).map(l => {
    const [year, period, , NSA, SA] = l.split(',');
    return { year, period, nsa: parseFloat(NSA), sa: parseFloat(SA) };
  });
}

async function main() {
  console.log('Fetching authoritative RefCPI.csv and monthly CPI.csv ...');
  const [refText, cpiText] = await Promise.all([fetchText(REFCPI_URL), fetchText(CPI_URL)]);
  const retrieved = parseRefCpi(refText);
  const cpiRows   = parseCpi(cpiText);
  const monthlyNsa = monthlyCpiMap(cpiRows.map(r => ({ year: r.year, period: r.period, value: r.nsa })));

  console.log(`Retrieved ${retrieved.length} daily rows; ${cpiRows.length} monthly CPI rows.\n`);

  // ── Cross-check: calculated NSA must reproduce retrieved, where computable ──
  let compared = 0, maxDiff = 0, maxDiffDate = '';
  for (const row of retrieved) {
    const calc = refCpiFromMonthly(row.date, monthlyNsa);
    if (calc == null) continue;            // outside monthly coverage — skip
    compared++;
    const diff = Math.abs(calc - row.refCpi);
    if (diff > maxDiff) { maxDiff = diff; maxDiffDate = row.date; }
  }
  ok(compared > 1000, `expected to compare many dates (got ${compared})`);
  ok(maxDiff <= TOL, `calc vs retrieved max diff ${maxDiff.toExponential(3)} on ${maxDiffDate} exceeds TOL ${TOL}`);
  console.log(`Cross-check: compared ${compared} dates, max |calc − retrieved| = ${maxDiff.toExponential(3)} (${maxDiffDate || 'n/a'})`);

  // ── Regression: shared calc must reproduce the live RefCpiNsaSa.csv (NSA + SA) ──
  // Guards calcRefCpi.js (which now imports refCpiFromMonthly) and the SA sole-source path.
  const monthlySa = monthlyCpiMap(cpiRows.map(r => ({ year: r.year, period: r.period, value: r.sa })));
  const nsaSaText = await fetchText(REFCPINSASA_URL);
  // Header: "Ref CPI Date,Ref CPI NSA,Ref CPI SA,SA Factor"
  const nsaSaRows = nsaSaText.trim().split('\n').slice(1).map(l => {
    const [date, nsa, sa, factor] = l.split(',');
    return { date: date.trim(), nsa: parseFloat(nsa), sa: parseFloat(sa), factor: parseFloat(factor) };
  });
  let nsaSaCompared = 0, nsaMax = 0, saMax = 0;
  for (const row of nsaSaRows) {
    const cn = refCpiFromMonthly(row.date, monthlyNsa);
    const cs = refCpiFromMonthly(row.date, monthlySa);
    if (cn == null || cs == null) continue;
    nsaSaCompared++;
    nsaMax = Math.max(nsaMax, Math.abs(cn - row.nsa));
    saMax  = Math.max(saMax,  Math.abs(cs - row.sa));
  }
  ok(nsaSaCompared > 1000, `RefCpiNsaSa compare count (${nsaSaCompared})`);
  ok(nsaMax <= TOL, `RefCpiNsaSa NSA max diff ${nsaMax.toExponential(3)} > TOL`);
  ok(saMax  <= TOL, `RefCpiNsaSa SA max diff ${saMax.toExponential(3)} > TOL`);
  console.log(`RefCpiNsaSa regression: ${nsaSaCompared} dates, NSA max ${nsaMax.toExponential(3)}, SA max ${saMax.toExponential(3)}`);

  // ── lookupRefCpi edge cases ──
  const sample = retrieved[Math.floor(retrieved.length / 2)];
  ok(lookupRefCpi(retrieved, sample.date) === sample.refCpi, 'exact-date lookup returns that day');
  ok(lookupRefCpi(retrieved, '1900-01-01') === null, 'date before range → null');
  ok(lookupRefCpi(retrieved, '2999-01-01') === null, 'date beyond last published → null');
  ok(lookupRefCpi([], '2026-01-15') === null, 'empty rows → null');

  // ── indexRatio ──
  ok(Math.abs(indexRatio(300, 150) - 2) < 1e-12, 'indexRatio basic');
  ok(indexRatio(300, 0) === null, 'indexRatio zero base → null');
  ok(indexRatio(null, 150) === null, 'indexRatio null refCpi → null');

  console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(err => { console.error(err); process.exit(1); });
