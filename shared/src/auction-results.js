// The rules of 1.4 Fetch auction results that combine two sources into Auction results (S5):
// the merge of FiscalData rows, and the fill from TreasuryDirect; and the conversion of a row
// of the frozen auctions_query to the columns of treasury_securities_auctions_v2 (the migration of S5).
// Specified in knowledge/1.4_Fetch_Auction_Results.md.

// TreasuryDirect (E15) field -> S5 column. The one place the mapping is stated in code.
export const TD_TO_S5 = [
  ['cusip', 'cusip'],
  ['competitiveAuctionCloseDate', 'comp_auction_close_date'],
  ['securityType', 'security_type'],
  ['securityTerm', 'security_term'],
  ['originalSecurityTerm', 'original_security_term'],
  ['reopening', 'reopening'],
  ['inflationProtected', 'inflation_protected'],
  ['announcementDate', 'announcemt_date'],
  ['issueDate', 'issue_date'],
  ['maturityDate', 'maturity_date'],
  ['datedDate', 'dated_date'],
  ['offeringAmount', 'offering_amt'],
  ['investmentRate', 'investment_rate'],
  ['highRate', 'high_rate'],
  ['lowRate', 'low_rate'],
  ['medianRate', 'med_rate'],
  ['highYield', 'high_yield'],
  ['interestRate', 'int_rate'],
  ['lowYield', 'low_yield'],
  ['medianYield', 'med_yield'],
  ['highPrice', 'high_price'],
  ['highDiscountMargin', 'high_discnt_margin'],
  ['spread', 'spread'],
  ['unadjustedPrice', 'unadj_price'],
  ['adjustedPrice', 'adj_price'],
  ['indexRatioOnIssueDate', 'index_ratio_on_issue_date'],
  ['referenceCpiOnIssueDate', 'ref_cpi_on_issue_date'],
  ['bidToCoverRatio', 'bid_to_cover_ratio'],
  ['grandTotalParAwarded', 'grand_total_par_awarded'],
  ['grandTotalParRecognized', 'grand_total_par_recog'],
  ['subtotalCompetitiveParAwardedInsideOfOfferingAmount', 'subtot_comp_inside_awrd'],
  ['subtotalCompetitiveParRecognizedInsideOfOfferingAmount', 'subtot_comp_inside_recog'],
  ['primaryDealersCompetitiveParAwarded', 'prim_deal_comp_par_awarded'],
  ['primaryDealersCompetitiveParRecognized', 'prim_deal_comp_par_recog'],
  ['directBiddersCompetitiveParAwarded', 'dir_bid_comp_par_awarded'],
  ['directBiddersCompetitiveParRecognized', 'dir_bid_comp_par_recog'],
  ['indirectBiddersCompetitiveParAwarded', 'indir_bid_comp_par_awarded'],
  ['indirectBiddersCompetitiveParRecognized', 'indir_bid_comp_par_recog'],
];

export const TD_COLUMNS = TD_TO_S5.map(([, col]) => col);

// FiscalData writes a missing value as the string `null`; a cell the script never filled is empty.
export const isNull = v => v == null || v === '' || v === 'null';

// The date (YYYY-MM-DD) and minutes after midnight in New York at `d`.
export function easternNow(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(d).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

const rowKey = r => `${r.cusip}|${r.comp_auction_close_date}`;

const byAuctionDateThenTerm = (a, b) => {
  if (b.comp_auction_close_date > a.comp_auction_close_date) return 1;
  if (b.comp_auction_close_date < a.comp_auction_close_date) return -1;
  return (a.security_term || '').localeCompare(b.security_term || '');
};

// A row of treasury_securities_auctions_v2 as FiscalData returns it in JSON -> a row of S5: every value a string,
// every missing value `null`.
export const rowFromNewTable = raw => Object.fromEntries(Object.entries(raw).map(([col, v]) => [col, isNull(v) ? 'null' : String(v)]));

// A fetched row replaces the existing row of the same key, except in a column where the
// fetched value is null and the existing value is not: that column keeps the existing value.
export function mergeAuctionRows(existing, incoming) {
  const map = new Map(existing.map(r => [rowKey(r), r]));
  let added = 0;
  for (const r of incoming) {
    const key = rowKey(r);
    const old = map.get(key);
    if (!old) { added++; map.set(key, r); continue; }
    const merged = { ...r };
    for (const col of Object.keys(old)) if (isNull(merged[col]) && !isNull(old[col])) merged[col] = old[col];
    map.set(key, merged);
  }
  return { rows: Array.from(map.values()).sort(byAuctionDateThenTerm), added };
}

// TreasuryDirect states a date as YYYY-MM-DDT00:00:00; S5 holds YYYY-MM-DD.
const tdValue = v => String(v).replace(/^(\d{4}-\d\d-\d\d)T.*$/, '$1');

// For each TreasuryDirect auction: fill the null columns of the S5 row of the same key from the
// columns TD_TO_S5 maps, or add a row holding those columns when no S5 row has the key.
// `headers` are the S5 columns; every column of an added row that TD_TO_S5 does not map is `null`.
export function fillFromTreasuryDirect(rows, headers, tdRows) {
  const map = new Map(rows.map(r => [rowKey(r), r]));
  let filled = 0, added = 0;
  for (const td of tdRows) {
    const stated = {};
    for (const [field, col] of TD_TO_S5) if (!isNull(td[field])) stated[col] = tdValue(td[field]);
    if (!stated.cusip || !stated.comp_auction_close_date) continue;
    const key = rowKey(stated);
    const row = map.get(key);
    if (!row) {
      map.set(key, Object.fromEntries(headers.map(h => [h, stated[h] ?? 'null'])));
      added++;
      continue;
    }
    let changed = false;
    for (const [col, value] of Object.entries(stated)) {
      if (isNull(row[col])) { row[col] = value; changed = true; }
    }
    if (changed) filled++;
  }
  return { rows: Array.from(map.values()).sort(byAuctionDateThenTerm), filled, added };
}

// ── Conversion of an auctions_query row to the S5 columns ─────────────────────
// S5 states the columns of treasury_securities_auctions_v2, in its order. The field-by-field basis
// of the conversion is research/auction-results-source/field-map.csv.
export const S5_COLUMNS = [
  'record_date', 'cusip', 'security_type', 'security_desc', 'comp_auction_close_date',
  'comp_auction_close_time', 'noncomp_auction_close_date', 'noncomp_auction_close_time', 'issue_date',
  'price_per_amt', 'maturity_date', 'pdf_filenm_announcemt', 'pdf_filenm_spec_announcemt',
  'pdf_filenm_comp_results', 'pdf_filenm_noncomp_results', 'xml_filenm_announcemt',
  'xml_filenm_comp_results', 'xml_filenm_noncomp_results', 'accrued_int', 'accrued_int_per_amount',
  'adj_accrued_int', 'adj_currently_outstanding', 'adj_price', 'allotted_pct_hi_discnt_margin',
  'allotted_high_pctage_decimals', 'allotted_pctage_high_rate', 'allotted_pctage_high_yield',
  'announcemtd_corpus_cusip', 'announcemtd_cusip', 'announcemtd_orig_dated_date',
  'announcemtd_orig_issue_date', 'announcemtd_reopening', 'announcemtd_security_desc',
  'announcemtd_security_type', 'announcemt_date', 'comp_apprx_amt_remaining', 'avg_discnt_margin',
  'avg_investment_rate', 'avg_price', 'avg_rate', 'avg_yield', 'bid_to_cover_ratio', 'callable',
  'called_date', 'cash_management_bill', 'comp_bid_decimals', 'comp_bid_expression',
  'comp_discnt_margin_bid_increm', 'comp_rate_bid_increments', 'comp_yield_bid_increments', 'corpus_cusip',
  'cpi_base_reference_period', 'currently_outstanding', 'dated_date', 'dated_date_diff_issue_date',
  'dir_bid_comp_par_awarded', 'dir_bid_comp_par_recog', 'dir_bid_noncomp_par_awarded',
  'dir_bid_noncomp_par_recog', 'direct_ppt_bids_accepted', 'direct_ppt_inside_amt', 'eligible_call_date',
  'fima_comp_bids_accepted', 'fima_included', 'fima_noncomp_bids_accepted', 'fima_noncomp_inside_amt',
  'fima_noncomp_par_awarded', 'fima_noncomp_par_recog', 'first_int_payment_length', 'floating_rate',
  'int_payment_frequency', 'grand_total_par_awarded', 'grand_total_par_recog', 'high_discnt_margin',
  'high_rate', 'high_yield', 'frn_index_determination_date', 'frn_index_determination_rate',
  'announcemtd_index_ratio', 'index_ratio_on_issue_date', 'indir_bid_comp_par_awarded',
  'indir_bid_comp_par_recog', 'indir_bid_noncomp_par_awarded', 'indir_bid_noncomp_recog',
  'indirct_ppt_bids_accepted', 'indirct_ppt_inside_amt', 'inflation_protected', 'int_rate',
  'investment_rate', 'long_short_first_int_payment', 'long_short_first_int_pmt_amt', 'low_discnt_margin',
  'low_discnt_margin_threshold', 'low_investment_rate', 'low_price', 'low_rate', 'low_rate_threshold',
  'low_yield', 'low_yield_threshold', 'maturing_date', 'maturing_securities_type', 'max_comp_award',
  'max_noncomp_award', 'max_single_bid', 'max_recog_single_rate_bid', 'max_recog_single_yield_bid',
  'med__discnt_margin', 'med__discnt_margin_threshold', 'med_rate', 'med_rate_threshold', 'med_yield',
  'med_yield_threshold', 'min_strip_amt', 'min_bid_amt', 'min_to_issue_amt', 'multiples_to_bid_amt',
  'multiples_to_issue_amt', 'nlp_exclusion_amt', 'nlp_reporting_threshold', 'noncomp_bids_accepted',
  'offering_amt', 'original_dated_date', 'original_issue_date', 'original_security_term', 'high_price',
  'pricing_method', 'prim_deal_bids_accepted', 'prim_deal_comp_par_awarded', 'prim_deal_comp_par_recog',
  'prim_deal_inside', 'prim_deal_noncomp_par_awarded', 'prim_deal_noncomp_recog', 'private_holdings',
  'announcemtd_ref_cpi', 'ref_cpi_on_issue_date', 'ref_cpi_on_orig_dated_date', 'reopening',
  'retail_noncomp_par_recog', 'security_term', 'security_term_day', 'security_term_month',
  'security_term_week', 'security_term_year', 'series', 'soma_bids_accepted', 'soma_holdings',
  'soma_inside_amt', 'soma_noncomp_par_awarded', 'soma_noncomp_par_recog', 'spread', 'std_int_payment',
  'std_int_payment_per_amt', 'strippable', 'subtot_comp_inside_awrd', 'subtot_comp_outside_awrd',
  'subtot_comp_inside_recog', 'subtot_comp_outside_recog', 'subtot_noncomp_inside_awrd',
  'subtot_noncomp_outside_awrd', 'subtot_noncomp_inside_recog', 'subtot_noncomp_outside_recog',
  'technique', 't_dir_bid_noncomp_recog', 't_fima_noncomp_par_recog', 't_indir_bid_noncomp_recog',
  't_prim_dealer_noncomp_recog', 't_retail_noncomp_par_recog', 't_soma_noncomp_par_recog',
  'tsubtot_noncomp_inside_recog', 'tsubtot_noncomp_outside_recog', 'tiin_conversion_factor',
  'tiin_convers_factor_per_amt', 'total_mkt_amt_outstanding', 'total_par_inside_awarded',
  'total_par_outside_awarded', 'total_par_inside_recog', 'total_par_outside_recog', 'retail_bids_accepted',
  'retail_inside_amt', 'unadj_accrued_int', 'unadj_price',
];

// auctions_query column -> S5 column, for a column that is renamed and states the same data.
// A column that keeps its name is copied under it.
const RENAMED = {
  auction_date: 'comp_auction_close_date', price_per100: 'high_price',
  allocation_pctage_decimals: 'allotted_high_pctage_decimals', auction_format: 'pricing_method',
  avg_med_investment_rate: 'avg_investment_rate', avg_med_price: 'avg_price',
  back_dated: 'dated_date_diff_issue_date', back_dated_date: 'dated_date', call_date: 'eligible_call_date',
  cash_management_bill_cmb: 'cash_management_bill', closing_time_comp: 'comp_auction_close_time',
  closing_time_noncomp: 'noncomp_auction_close_time', comp_accepted: 'subtot_comp_inside_awrd',
  comp_tendered: 'subtot_comp_inside_recog', direct_bidder_accepted: 'dir_bid_comp_par_awarded',
  direct_bidder_tendered: 'dir_bid_comp_par_recog', est_pub_held_mat_by_type_amt: 'private_holdings',
  fima_noncomp_accepted: 'fima_noncomp_par_awarded', fima_noncomp_tendered: 'fima_noncomp_par_recog',
  first_int_period: 'first_int_payment_length', high_discnt_rate: 'high_rate',
  high_investment_rate: 'investment_rate', indirect_bidder_accepted: 'indir_bid_comp_par_awarded',
  indirect_bidder_tendered: 'indir_bid_comp_par_recog', low_discnt_rate: 'low_rate', mat_date: 'maturing_date',
  min_to_issue: 'min_to_issue_amt', multiples_to_bid: 'multiples_to_bid_amt',
  multiples_to_issue: 'multiples_to_issue_amt', noncomp_tenders_accepted: 'noncomp_bids_accepted',
  original_cusip: 'announcemtd_cusip', primary_dealer_accepted: 'prim_deal_comp_par_awarded',
  primary_dealer_tendered: 'prim_deal_comp_par_recog', ref_cpi_on_dated_date: 'ref_cpi_on_orig_dated_date',
  soma_accepted: 'soma_noncomp_par_awarded', soma_included: 'soma_inside_amt',
  soma_tendered: 'soma_noncomp_par_recog', total_accepted: 'grand_total_par_awarded',
  total_tendered: 'grand_total_par_recog', treas_retail_tenders_accepted: 'retail_bids_accepted',
  inflation_index_security: 'inflation_protected',
};

// An old column that states an amount per a face amount: [old column, S5 amount column, S5 face amount column, face amount].
const PER_AMOUNT = [
  ['accrued_int_per100', 'accrued_int', 'accrued_int_per_amount', '100'],
  ['accrued_int_per1000', 'accrued_int', 'accrued_int_per_amount', '1000'],
  ['adj_accrued_int_per1000', 'adj_accrued_int', 'accrued_int_per_amount', '1000'],
  ['unadj_accrued_int_per1000', 'unadj_accrued_int', 'accrued_int_per_amount', '1000'],
  ['std_int_payment_per1000', 'std_int_payment', 'std_int_payment_per_amt', '1000'],
  ['tiin_conversion_factor_per1000', 'tiin_conversion_factor', 'tiin_convers_factor_per_amt', '1000'],
];

// allocation_pctage and max_single_bid are one column in auctions_query and three in S5, by whether the auction
// states a rate, a yield or a discount margin: [old column that says which, S5 allocation column, S5 maximum single bid column].
const BY_RATE_YIELD_OR_MARGIN = [
  ['high_discnt_rate', 'allotted_pctage_high_rate', 'max_recog_single_rate_bid'],
  ['high_yield', 'allotted_pctage_high_yield', 'max_recog_single_yield_bid'],
  ['high_discnt_margin', 'allotted_pct_hi_discnt_margin', 'max_single_bid'],
];

// avg_med_* -> [old column, S5 median column, S5 average column].
const AVG_MED = [
  ['avg_med_discnt_rate', 'med_rate', 'avg_rate'],
  ['avg_med_yield', 'med_yield', 'avg_yield'],
  ['avg_med_discnt_margin', 'med__discnt_margin', 'avg_discnt_margin'],
];

const TERM_UNIT_COLUMN = { Day: 'security_term_day', Month: 'security_term_month', Week: 'security_term_week', Year: 'security_term_year' };

// The old columns S5 no longer holds: noncomp_accepted is total less competitive, FIMA and SOMA awarded;
// the others state a value for the old auctions and have no S5 column.
export const DROPPED_OLD_COLUMNS = ['noncomp_accepted', 'comp_tenders_accepted', 'first_int_payment_date', 'tint_cusip_1', 'tint_cusip_2', 'treas_retail_accepted'];

// The old columns that are the source of an S5 column, the one of the same name first.
const SOURCES = {};
for (const col of S5_COLUMNS) SOURCES[col] = [col];
for (const [old, col] of Object.entries(RENAMED)) SOURCES[col].push(old);
SOURCES.max_single_bid = []; // S5 states it for a discount margin only; convertOldRow places the old column by BY_RATE_YIELD_OR_MARGIN

// FiscalData's CSV writes an apostrophe before a negative number; S5 holds the number.
const withoutApostrophe = v => v.replace(/^'(?=-)/, '');

const sameValue = (a, b) => a === b || (Number.isFinite(Number(a)) && Number(a) === Number(b));

// One auctions_query row -> { row: the S5 columns, flags: each place a rule did not apply or two old columns disagreed }.
export function convertOldRow(old) {
  const row = Object.fromEntries(S5_COLUMNS.map(c => [c, 'null']));
  const flags = [];
  const stated = c => !isNull(old[c]);

  for (const col of S5_COLUMNS) {
    const from = SOURCES[col].filter(stated);
    if (from.length === 0) continue;
    row[col] = old[from[0]];
    if (row[col] !== withoutApostrophe(row[col])) { row[col] = withoutApostrophe(row[col]); flags.push(`${from[0]} began with an apostrophe`); }
    for (const other of from.slice(1)) if (!sameValue(old[other], old[from[0]])) flags.push(`${from[0]} and ${other} differ`);
  }

  for (const col of ['comp_auction_close_time', 'noncomp_auction_close_time']) if (!isNull(row[col])) row[col] = `${row[col]} ET`;
  row.price_per_amt = '100';

  for (const [oldCol, amountCol, perCol, per] of PER_AMOUNT) {
    if (!stated(oldCol)) continue;
    if (!isNull(row[amountCol])) flags.push(`${oldCol} and another column state ${amountCol}`);
    row[amountCol] = old[oldCol];
    if (!isNull(row[perCol]) && row[perCol] !== per) flags.push(`${perCol} is ${row[perCol]} and ${oldCol} is per ${per}`);
    else row[perCol] = per;
  }

  for (const [oldCol, index] of [['allocation_pctage', 1], ['max_single_bid', 2]]) {
    if (!stated(oldCol)) continue;
    const by = BY_RATE_YIELD_OR_MARGIN.filter(kind => stated(kind[0]));
    if (by.length === 1) row[by[0][index]] = old[oldCol];
    else flags.push(`${oldCol} with ${by.length} of high_discnt_rate, high_yield and high_discnt_margin stated`);
  }

  // The median of a single-price auction, the average of a multiple-price auction. The rows with no
  // auction_format are the auctions filled from TreasuryDirect, which states the median.
  const average = /^(multi-price|price-based)$/i.test(old.auction_format);
  for (const [oldCol, medianCol, averageCol] of AVG_MED) {
    if (!stated(oldCol)) continue;
    if (!stated('auction_format')) flags.push(`${oldCol} with no auction_format, written as the median`);
    row[average ? averageCol : medianCol] = old[oldCol];
  }

  for (const oldCol of ['security_term_day_month', 'security_term_week_year']) {
    if (!stated(oldCol)) continue;
    const m = /^(\d+)-(Day|Week|Month|Year)$/.exec(old[oldCol]);
    if (!m) flags.push(`${oldCol} ${old[oldCol]} is not a number and a unit`);
    else if (Number(m[1]) === 0) flags.push(`${oldCol} ${old[oldCol]} is zero`);
    else row[TERM_UNIT_COLUMN[m[2]]] = m[1];
  }

  return { row, flags };
}
