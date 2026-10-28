// tips-ref.js — the rows of TIPS reference data (S2) and how 1.6 builds them from
// treasury_securities_auctions_v2 (E3). Spec: knowledge/1.6_Fetch_TIPS_Reference_Data.md.

export const TIPS_REF_COLUMNS = ['cusip', 'maturity', 'datedDate', 'coupon', 'datedDateRefCpi', 'term'];

// The v2 fields 1.6 reads, by their real names (the API answers HTTP 400 to any other name).
export const TIPS_REF_V2_FIELDS = ['cusip', 'ref_cpi_on_orig_dated_date', 'dated_date', 'maturity_date', 'security_term', 'int_rate'];

const stated = v => v != null && String(v).trim() !== '' && String(v).trim().toLowerCase() !== 'null';

// One row per TIPS whose v2 record states its interest rate and its dated date Ref CPI.
// v2 also lists an announced auction before it is held, with both null.
export function tipsRefFromV2(apiRows) {
  return apiRows
    .filter(r => stated(r.cusip) && stated(r.int_rate) && stated(r.ref_cpi_on_orig_dated_date))
    .map(r => ({
      cusip: r.cusip,
      maturity: r.maturity_date,
      datedDate: r.dated_date,
      coupon: parseFloat(r.int_rate) / 100, // decimal (e.g. 0.00125)
      datedDateRefCpi: parseFloat(r.ref_cpi_on_orig_dated_date),
      term: r.security_term,
    }));
}

// The stored rows with the new rows over them by CUSIP, in order of maturity. v2 states only the
// auctions since 2025-12-29, so the older rows are kept.
export function mergeTipsRef(existingRows, newRows) {
  const byCusip = new Map(existingRows.map(r => [r.cusip, r]));
  for (const r of newRows) byCusip.set(r.cusip, r);
  return [...byCusip.values()].sort((a, b) =>
    String(a.maturity).localeCompare(String(b.maturity)) || String(a.cusip).localeCompare(String(b.cusip)));
}

export function tipsRefCsv(rows) {
  return [TIPS_REF_COLUMNS.join(','), ...rows.map(r => TIPS_REF_COLUMNS.map(c => r[c]).join(','))].join('\n') + '\n';
}
