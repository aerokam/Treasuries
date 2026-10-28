// Maps every field of auctions_query to treasury_securities_auctions_v2 and TreasuryDirect, and writes field-map.csv.
// FiscalData publishes no mapping from the old table to the new one, so the mapping is built from three sources:
// the two tables' labels and definitions, the values of the auctions both tables state, and (for TreasuryDirect)
// each camelCase name read as words against the v2 label. A mapping is confirmed by value where the overlap states a value.
// Run: node research/auction-results-source/field-map.mjs
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const FD = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od';
const TD = 'https://www.treasurydirect.gov/TA_WS/securities';
const getJson = async url => (await fetch(url)).json();

const isNull = v => v == null || v === '' || v === 'null';
const day = v => String(v).slice(0, 10);
const key = (cusip, date) => `${cusip}|${day(date)}`;
const norm = v => (isNull(v) ? null : String(v).trim().replace(/T00:00:00$/, '').replace(/ E[SD]?T$/, '').toLowerCase());
const same = (a, b) => {
  a = norm(a); b = norm(b);
  if (a === b) return true;
  return a !== null && b !== null && Number.isFinite(+a) && Number.isFinite(+b) && +a === +b;
};

const [old, v2, td] = await Promise.all([
  getJson(`${FD}/auctions_query?page[size]=1000&filter=auction_date:gte:2025-12-01&sort=-auction_date`),
  getJson(`${FD}/treasury_securities_auctions_v2?page[size]=1000&sort=-comp_auction_close_date`),
  getJson(`${TD}/auctioned?format=json&days=4000`),
]);
const oldFields = Object.keys(old.data[0]), v2Fields = Object.keys(v2.data[0]), tdFields = Object.keys(td[0]);
const v2ByKey = new Map(v2.data.map(r => [key(r.cusip, r.comp_auction_close_date), r]));
const tdByKey = new Map(td.map(r => [key(r.cusip, r.competitiveAuctionCloseDate), r]));
const oldV2 = old.data.map(r => [r, v2ByKey.get(key(r.cusip, r.auction_date))]).filter(p => p[1]);
const v2Td = v2.data.map(r => [r, tdByKey.get(key(r.cusip, r.comp_auction_close_date))]).filter(p => p[1]);

// Old field -> [new fields, relation, note]. A field that keeps its name is entered below as 'same name'.
const R = {
  auction_date: [['comp_auction_close_date'], 'renamed', 'v2 also states noncomp_auction_close_date, equal in every auction compared'],
  price_per100: [['high_price'], 'renamed', 'the old table states this value twice, as price_per100 and high_price; v2 states it once'],
  accrued_int_per100: [['accrued_int', 'accrued_int_per_amount'], 'reshaped', 'v2 states one amount and the face amount it is per'],
  accrued_int_per1000: [['accrued_int', 'accrued_int_per_amount'], 'reshaped', 'v2 states one amount and the face amount it is per'],
  adj_accrued_int_per1000: [['adj_accrued_int', 'accrued_int_per_amount'], 'reshaped', 'v2 states one amount and the face amount it is per'],
  unadj_accrued_int_per1000: [['unadj_accrued_int', 'accrued_int_per_amount'], 'reshaped', 'v2 states one amount and the face amount it is per'],
  std_int_payment_per1000: [['std_int_payment', 'std_int_payment_per_amt'], 'reshaped', 'v2 states one amount and the face amount it is per'],
  tiin_conversion_factor_per1000: [['tiin_conversion_factor', 'tiin_convers_factor_per_amt'], 'reshaped', 'v2 states one factor and the face amount it is per'],
  allocation_pctage: [['allotted_pctage_high_rate', 'allotted_pctage_high_yield', 'allotted_pct_hi_discnt_margin'], 'reshaped', 'one old column is three in v2: by rate (Bills), yield (Notes, Bonds, TIPS) or discount margin (FRN)'],
  allocation_pctage_decimals: [['allotted_high_pctage_decimals'], 'renamed', ''],
  auction_format: [['pricing_method'], 'renamed', 'case differs in 5 of 352 auctions (Single-Price, Single-price)'],
  max_single_bid: [['max_recog_single_rate_bid', 'max_recog_single_yield_bid', 'max_single_bid'], 'reshaped', 'one old column is three in v2: by rate (Bills), yield (Notes, Bonds, TIPS) or discount margin (FRN); v2 states max_single_bid for FRNs only'],
  avg_med_discnt_rate: [['med_rate', 'avg_rate'], 'reshaped', 'one old column is two in v2: the median for a single-price auction, the average for a multiple-price auction'],
  avg_med_yield: [['med_yield', 'avg_yield'], 'reshaped', 'one old column is two in v2: the median for a single-price auction, the average for a multiple-price auction'],
  avg_med_discnt_margin: [['med__discnt_margin', 'avg_discnt_margin'], 'reshaped', 'one old column is two in v2: the median for a single-price auction, the average for a multiple-price auction'],
  avg_med_investment_rate: [['avg_investment_rate'], 'renamed', 'no auction in the overlap states it'],
  avg_med_price: [['avg_price'], 'renamed', 'no auction in the overlap states it'],
  back_dated: [['dated_date_diff_issue_date'], 'renamed', ''],
  back_dated_date: [['dated_date'], 'renamed', 'old states it only where the dated date differs from the issue date'],
  call_date: [['eligible_call_date'], 'renamed', 'no auction in the overlap states it'],
  cash_management_bill_cmb: [['cash_management_bill'], 'renamed', ''],
  closing_time_comp: [['comp_auction_close_time'], 'renamed', 'v2 states it for 2 of 367 auctions; the old table states it for every auction'],
  closing_time_noncomp: [['noncomp_auction_close_time'], 'renamed', 'v2 states it for 2 of 367 auctions; the old table states it for every auction'],
  comp_accepted: [['subtot_comp_inside_awrd'], 'renamed', 'inside of the offering amount'],
  comp_tendered: [['subtot_comp_inside_recog'], 'renamed', 'inside of the offering amount'],
  comp_tenders_accepted: [[], 'dropped in v2', 'states Yes in every auction; no v2 field states it'],
  direct_bidder_accepted: [['dir_bid_comp_par_awarded'], 'renamed', ''],
  direct_bidder_tendered: [['dir_bid_comp_par_recog'], 'renamed', ''],
  indirect_bidder_accepted: [['indir_bid_comp_par_awarded'], 'renamed', ''],
  indirect_bidder_tendered: [['indir_bid_comp_par_recog'], 'renamed', ''],
  primary_dealer_accepted: [['prim_deal_comp_par_awarded'], 'renamed', ''],
  primary_dealer_tendered: [['prim_deal_comp_par_recog'], 'renamed', ''],
  est_pub_held_mat_by_type_amt: [['private_holdings'], 'renamed', 'the old label says publicly held and the v2 label says privately held; the values are equal'],
  fima_noncomp_accepted: [['fima_noncomp_par_awarded'], 'renamed', 'awarded and recognized are equal in every auction compared, so the labels decide'],
  fima_noncomp_tendered: [['fima_noncomp_par_recog'], 'renamed', 'awarded and recognized are equal in every auction compared, so the labels decide'],
  first_int_period: [['first_int_payment_length'], 'renamed', 'the old definition says a date; the values are Normal, Long and Short'],
  first_int_payment_date: [[], 'dropped in v2', 'the old table states the date; v2 and TreasuryDirect state only the length'],
  high_discnt_rate: [['high_rate'], 'renamed', ''],
  high_investment_rate: [['investment_rate'], 'renamed', ''],
  low_discnt_rate: [['low_rate'], 'renamed', ''],
  inflation_index_security: [['inflation_protected'], 'renamed', ''],
  mat_date: [['maturing_date'], 'renamed', 'equal to the issue date in every auction compared, so the labels decide'],
  min_to_issue: [['min_to_issue_amt'], 'renamed', 'constant in the overlap, so the labels decide'],
  multiples_to_bid: [['multiples_to_bid_amt'], 'renamed', 'constant in the overlap, so the labels decide'],
  multiples_to_issue: [['multiples_to_issue_amt'], 'renamed', 'constant in the overlap, so the labels decide'],
  noncomp_accepted: [['grand_total_par_awarded', 'subtot_comp_inside_awrd', 'fima_noncomp_par_awarded', 'soma_noncomp_par_awarded'], 'derived', 'no v2 field states it; it equals total less competitive, FIMA and SOMA awarded'],
  noncomp_tenders_accepted: [['noncomp_bids_accepted'], 'renamed', 'constant in the overlap, so the labels decide'],
  original_cusip: [['announcemtd_cusip'], 'renamed', 'one auction in the overlap states it'],
  ref_cpi_on_dated_date: [['ref_cpi_on_orig_dated_date'], 'renamed', ''],
  security_term_day_month: [['security_term_day', 'security_term_month'], 'reshaped', 'old states 56-Day, v2 states 56 in a day column or a month column'],
  security_term_week_year: [['security_term_week', 'security_term_year'], 'reshaped', 'old states 6-Week, v2 states 6 in a week column or a year column'],
  soma_accepted: [['soma_noncomp_par_awarded'], 'renamed', 'awarded and recognized are equal in every auction compared, so the labels decide'],
  soma_tendered: [['soma_noncomp_par_recog'], 'renamed', 'awarded and recognized are equal in every auction compared, so the labels decide'],
  soma_included: [['soma_inside_amt'], 'renamed', ''],
  tint_cusip_1: [[], 'dropped in v2', 'neither v2 nor TreasuryDirect states it'],
  tint_cusip_2: [[], 'dropped in v2', 'neither v2 nor TreasuryDirect states it'],
  total_accepted: [['grand_total_par_awarded'], 'renamed', ''],
  total_tendered: [['grand_total_par_recog'], 'renamed', ''],
  treas_retail_accepted: [[], 'dropped in v2', 'TreasuryDirect states it as retailNoncompetitiveParAwarded'],
  treas_retail_tenders_accepted: [['retail_bids_accepted'], 'renamed', 'constant in the overlap, so the labels decide'],
};
const OLD_TO_TD_EXTRA = { treas_retail_accepted: 'retailNoncompetitiveParAwarded' };

// Agreement over the auctions where the old table and v2 both state a value.
const agreement = (oldField, newField) => {
  let both = 0, agree = 0;
  for (const [o, n] of oldV2) {
    if (isNull(o[oldField]) || isNull(n[newField])) continue;
    both++;
    if (same(o[oldField], n[newField])) agree++;
  }
  return { both, agree };
};

// v2 -> TreasuryDirect: the v2 label and the camelCase name read as words, ties broken by value.
const syn = { recog: 'recognized', awrd: 'awarded', amt: 'amount', pctage: 'percentage', discnt: 'discount', prim: 'primary', indir: 'indirect', indirct: 'indirect', dir: 'direct', deal: 'dealer', dealers: 'dealer', bidders: 'bidder', tenders: 'bids', tender: 'bids', mkt: 'market', int: 'interest', comp: 'competitive', noncomp: 'noncompetitive', orig: 'original', subtot: 'subtotal', t: 'tentative', filenm: 'file name', apprx: 'approx', approximate: 'approx', med: 'median', avg: 'average' };
const words = s => new Set(s.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).map(w => syn[w] || w).join(' ').split(' '));
const jaccard = (a, b) => [...a].filter(x => b.has(x)).length / new Set([...a, ...b]).size;
const v2ToTd = {};
for (const f of v2Fields) {
  if (f === 'record_date') continue; // FiscalData's own date field; its values equal issueDate, which issue_date already maps to
  const label = words(v2.meta.labels[f]);
  const scored = tdFields.map(g => {
    const valued = v2Td.filter(([a, b]) => !isNull(a[f]) || !isNull(b[g]));
    const agree = valued.length > 0 && valued.every(([a, b]) => same(a[f], b[g]));
    return { g, score: jaccard(label, words(g)) + (agree ? 0.5 : 0) };
  }).sort((a, b) => b.score - a.score);
  v2ToTd[f] = scored[0].g;
}
const tdTaken = Object.values(v2ToTd);
const tdDuplicates = tdTaken.filter((g, i) => tdTaken.indexOf(g) !== i);
const tdOnly = tdFields.filter(g => !tdTaken.includes(g));

const v2TdStatus = f => {
  const g = v2ToTd[f];
  if (!g) return 'v2 only';
  const valued = v2Td.filter(([a, b]) => !isNull(a[f]) || !isNull(b[g]));
  if (valued.length === 0) return 'not stated in the overlap';
  const bad = valued.filter(([a, b]) => !same(a[f], b[g]));
  if (bad.length === 0) return 'same';
  const v2Null = bad.filter(([a, b]) => isNull(a[f]) && !isNull(b[g])).length;
  const tdNull = bad.filter(([a, b]) => !isNull(a[f]) && isNull(b[g])).length;
  const differ = bad.length - v2Null - tdNull;
  return `differs in ${bad.length} of ${valued.length} auctions: v2 null ${v2Null}, TreasuryDirect null ${tdNull}, both stated and unequal ${differ}`;
};

const rows = [['old field (auctions_query)', 'relation', 'v2 field(s)', 'overlap check (auctions where both state a value)', 'TreasuryDirect field', 'v2 against TreasuryDirect', 'note']];
const claimed = new Set();
const summary = {};
for (const f of oldFields) {
  const [targets, relation, note] = R[f] ?? [v2Fields.includes(f) ? [f] : [], v2Fields.includes(f) ? 'same name' : 'UNMAPPED', ''];
  targets.forEach(t => claimed.add(t));
  let check = '';
  if (relation === 'same name' || relation === 'renamed') {
    const { both, agree } = agreement(f, targets[0]);
    check = both === 0 ? 'no auction states both' : `${agree} of ${both} equal`;
  } else if (relation === 'reshaped' || relation === 'derived') check = 'see note';
  const tdField = OLD_TO_TD_EXTRA[f] ?? (targets.length === 1 ? v2ToTd[targets[0]] : targets.map(t => v2ToTd[t]).join(' + '));
  const status = targets.length === 1 ? v2TdStatus(targets[0]) : '';
  rows.push([f, relation, targets.join(' + '), check, tdField, status, note]);
  summary[relation] = (summary[relation] ?? 0) + 1;
}
for (const f of v2Fields.filter(f => !claimed.has(f))) {
  rows.push(['(none)', 'new in v2', f, '', v2ToTd[f] ?? '(none)', v2TdStatus(f), '']);
}
for (const g of tdOnly) rows.push(['(none)', 'TreasuryDirect only', '(none)', '', g, '', '']);

const csv = rows.map(r => r.map(c => (/[",\n]/.test(c) ? `"${String(c).replace(/"/g, '""')}"` : c)).join(',')).join('\n') + '\n';
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'field-map.csv'), csv);

console.log(`Auctions compared: old and v2 ${oldV2.length}; v2 and TreasuryDirect ${v2Td.length}`);
console.log('auctions_query fields by relation to v2:', summary);
console.log(`v2 fields no auctions_query field maps to: ${v2Fields.filter(f => !claimed.has(f)).length} of ${v2Fields.length}`);
console.log(`v2 fields matched to a TreasuryDirect field: ${Object.keys(v2ToTd).length} of ${v2Fields.length}; TreasuryDirect fields matched twice: ${tdDuplicates.length}; TreasuryDirect fields with no v2 field: ${tdOnly.join(', ')}`);
const statuses = {};
v2Fields.forEach(f => { const s = v2TdStatus(f).replace(/ .*/, ''); statuses[s] = (statuses[s] ?? 0) + 1; });
console.log('v2 against TreasuryDirect:', statuses);
console.log('v2 fields that differ from TreasuryDirect:');
v2Fields.filter(f => v2TdStatus(f).startsWith('differs')).forEach(f => console.log(`  ${f} -> ${v2ToTd[f]}: ${v2TdStatus(f)}`));
console.log('renamed or same-name fields whose overlap check is not unanimous:');
rows.slice(1).filter(r => /^\d+ of \d+ equal$/.test(r[3]) && r[3].split(' ')[0] !== r[3].split(' ')[2]).forEach(r => console.log(`  ${r[0]} -> ${r[2]}: ${r[3]}`));
console.log('UNMAPPED:', rows.slice(1).filter(r => r[1] === 'UNMAPPED').map(r => r[0]));
