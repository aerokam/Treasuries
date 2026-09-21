// find-min-index-ratio.mjs
//
// Question: has any TIPS ever matured with an Index Ratio below 1.000, i.e. has
// the minimum-par (deflation floor) guarantee ever actually paid out for a TIPS
// bought at original auction?
//
// Method: for every matured TIPS CUSIP, look up its base ("dated date") Ref CPI
// from Treasury's own historical auction records, and its Ref CPI on its maturity
// date from Treasury's own published daily Ref CPI series (not a calculation).
// indexRatioAtMaturity = RefCPI(maturity date) / RefCPI(dated date).
//
// A second, fully independent path recomputes Ref CPI at each base date from raw
// BLS CPI-U (NSA) monthly data via the 31 CFR 356 App. B interpolation formula
// (shared/src/ref-cpi.js's refCpiFromMonthly — the same formula this repo's apps
// use) and checks it against Treasury's own published value. If the two
// independent sources didn't agree, the result below would not be trustworthy.
//
// Sources (all fetched live — no hardcoded/pasted numbers):
//   - https://pub-<r2>.r2.dev/Treasuries/Auctions.csv   (Treasury auction records mirror)
//   - https://pub-<r2>.r2.dev/TIPS/RefCPI.csv            (Treasury's published daily Ref CPI, 1997-01-15 onward)
//   - https://api.bls.gov/publicAPI/v2/timeseries/data/  (BLS CPI-U NSA, series CUUR0000SA0 — cross-check only)
//
// Usage: node find-min-index-ratio.mjs [--upload]
//   --upload also pushes the results CSV to R2 at TIPS/TipsIndexRatioAtMaturity.csv
//   (requires the repo-root .env Cloudflare R2 credentials).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseCsv } from '../../shared/src/csv.js';
import { lookupRefCpi, indexRatio, refCpiFromMonthly, monthlyCpiMap } from '../../shared/src/ref-cpi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const R2_BASE = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const AUCTIONS_URL = `${R2_BASE}/Treasuries/Auctions.csv`;
const REFCPI_OFFICIAL_URL = `${R2_BASE}/TIPS/RefCPI.csv`;
const BLS_SERIES_ID = 'CUUR0000SA0'; // CPI-U, NSA, All items, U.S. city average
const OUTPUT_CSV = path.join(__dirname, 'data', 'TipsIndexRatioAtMaturity.csv');
const R2_UPLOAD_KEY = 'TIPS/TipsIndexRatioAtMaturity.csv';

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

// BLS's public (unregistered) API caps a query at 10 years — chunk 1996..current year.
async function fetchBlsMonthlyNsa() {
  const currentYear = new Date().getFullYear();
  const chunks = [];
  for (let y = 1996; y <= currentYear; y += 10) {
    chunks.push([y, Math.min(y + 9, currentYear)]);
  }
  const rows = [];
  for (const [startyear, endyear] of chunks) {
    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesid: [BLS_SERIES_ID], startyear: String(startyear), endyear: String(endyear) }),
    });
    const json = await res.json();
    const series = json?.Results?.series?.[0]?.data ?? [];
    for (const r of series) {
      const value = parseFloat(r.value);
      if (!isNaN(value)) rows.push({ year: r.year, period: r.period, value }); // '-' (withheld month) -> NaN -> skipped
    }
  }
  return monthlyCpiMap(rows);
}

// Collapse Auctions.csv rows (one per auction event — original + every reopening)
// down to one row per real TIPS CUSIP, anchored to its TRUE original dated date.
// Reopening rows sometimes carry the REOPENING's own settlement-adjacent
// "dated_date" rather than the original one (Treasury's own auction-record
// quirk), so the original-issue row (`reopening === 'No'`) is preferred; its
// `ref_cpi_on_dated_date` is authoritative and identical across every row for
// that CUSIP regardless of this quirk.
function collapseToSecurities(auctionRows) {
  const byCusip = new Map();
  for (const r of auctionRows) {
    if (r.inflation_index_security !== 'Yes') continue;
    if (!byCusip.has(r.cusip)) byCusip.set(r.cusip, []);
    byCusip.get(r.cusip).push(r);
  }
  const securities = [];
  for (const [cusip, rows] of byCusip) {
    const orig = rows.find(r => r.reopening === 'No');
    const anyRow = rows[0];
    const refCpiOnDated = parseFloat((orig || anyRow).ref_cpi_on_dated_date);
    let baseDate = orig ? orig.dated_date : null;
    if (!baseDate) {
      const withOrigDated = rows.find(r => r.original_dated_date && r.original_dated_date !== 'null');
      baseDate = withOrigDated ? withOrigDated.original_dated_date : anyRow.dated_date;
    }
    securities.push({
      cusip,
      term: (orig || anyRow).security_term,
      baseDate,
      maturityDate: anyRow.maturity_date,
      refCpiOnDated,
    });
  }
  return securities;
}

async function main() {
  const upload = process.argv.includes('--upload');

  console.log('Fetching Treasury auction records...');
  const auctionRows = parseCsv(await fetchText(AUCTIONS_URL));
  console.log('Fetching Treasury\'s published daily Ref CPI series...');
  const officialRefCpi = parseCsv(await fetchText(REFCPI_OFFICIAL_URL))
    .map(r => ({ date: r.date, refCpi: parseFloat(r.refCpi) }))
    .sort((a, b) => a.date < b.date ? -1 : 1);
  console.log(`  ${officialRefCpi.length} daily rows, ${officialRefCpi[0].date} .. ${officialRefCpi[officialRefCpi.length - 1].date}`);
  console.log('Fetching BLS CPI-U (NSA) monthly series for the independent cross-check...');
  const blsMonthly = await fetchBlsMonthlyNsa();

  const securities = collapseToSecurities(auctionRows);
  const today = new Date().toISOString().slice(0, 10);
  const matured = securities.filter(s => s.maturityDate && s.maturityDate <= today && !isNaN(s.refCpiOnDated));
  console.log(`\nUnique TIPS CUSIPs: ${securities.length} | matured as of ${today}: ${matured.length}`);

  // Cross-check: BLS-recalculated Ref CPI at each base date vs. Treasury's own
  // auction-record ref_cpi_on_dated_date. These are two independent sources for
  // the same number; disagreement would mean the method (or a data source) is
  // wrong and the final answer should not be trusted.
  let crossCheckCount = 0, crossCheckMismatches = 0;
  for (const s of matured) {
    const calc = refCpiFromMonthly(s.baseDate, blsMonthly);
    if (calc == null) continue;
    crossCheckCount++;
    if (Math.abs(calc - s.refCpiOnDated) > 0.01) {
      crossCheckMismatches++;
      console.log(`  CROSS-CHECK MISMATCH ${s.cusip} ${s.baseDate}: Treasury=${s.refCpiOnDated} BLS-recalculated=${calc}`);
    }
  }
  console.log(`Independent cross-check (Treasury base Ref CPI vs. BLS-recalculated): ${crossCheckCount} compared, ${crossCheckMismatches} mismatches`);
  if (crossCheckMismatches > 0) {
    throw new Error('Cross-check mismatches found — investigate before trusting the index-ratio results below.');
  }

  const results = [];
  for (const s of matured) {
    const refCpiAtMaturity = lookupRefCpi(officialRefCpi, s.maturityDate);
    if (refCpiAtMaturity == null) {
      console.log(`  No official Ref CPI published for maturity date ${s.maturityDate} (${s.cusip}) — skipped`);
      continue;
    }
    results.push({
      cusip: s.cusip,
      security_term: s.term,
      dated_date: s.baseDate,
      maturity_date: s.maturityDate,
      ref_cpi_on_dated_date: s.refCpiOnDated,
      ref_cpi_at_maturity: refCpiAtMaturity,
      index_ratio_at_maturity: indexRatio(refCpiAtMaturity, s.refCpiOnDated),
    });
  }
  results.sort((a, b) => a.index_ratio_at_maturity - b.index_ratio_at_maturity);

  const header = ['cusip', 'security_term', 'dated_date', 'maturity_date', 'ref_cpi_on_dated_date', 'ref_cpi_at_maturity', 'index_ratio_at_maturity'];
  const csv = [header.join(',')]
    .concat(results.map(r => header.map(h => r[h]).join(',')))
    .join('\n') + '\n';
  fs.mkdirSync(path.dirname(OUTPUT_CSV), { recursive: true });
  fs.writeFileSync(OUTPUT_CSV, csv);
  console.log(`\nWrote ${results.length} rows to ${OUTPUT_CSV}`);

  console.log('\n=== 10 lowest index ratios at maturity ===');
  results.slice(0, 10).forEach(r => console.log(
    `${r.cusip}  term=${r.security_term.padEnd(11)} dated=${r.dated_date}  matured=${r.maturity_date}  indexRatio=${r.index_ratio_at_maturity}`
  ));

  const below1 = results.filter(r => r.index_ratio_at_maturity < 1.0);
  console.log(`\nTIPS with index ratio < 1.0 at maturity: ${below1.length}`);

  if (upload) {
    const { uploadToR2 } = await import('../../YieldCurves/scripts/r2.js');
    await uploadToR2(R2_UPLOAD_KEY, csv);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
