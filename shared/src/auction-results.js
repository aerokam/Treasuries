// The rules of 1.4 Fetch auction results that combine two sources into Auction results (S5):
// the merge of FiscalData rows, and the fill from TreasuryDirect.
// Specified in knowledge/1.4_Fetch_Auction_Results.md.

// TreasuryDirect (E15) field -> S5 column. The one place the mapping is stated in code.
export const TD_TO_S5 = [
  ['cusip', 'cusip'],
  ['competitiveAuctionCloseDate', 'auction_date'],
  ['securityType', 'security_type'],
  ['securityTerm', 'security_term'],
  ['originalSecurityTerm', 'original_security_term'],
  ['reopening', 'reopening'],
  ['inflationProtected', 'inflation_index_security'],
  ['announcementDate', 'announcemt_date'],
  ['issueDate', 'issue_date'],
  ['maturityDate', 'maturity_date'],
  ['datedDate', 'dated_date'],
  ['offeringAmount', 'offering_amt'],
  ['investmentRate', 'high_investment_rate'],
  ['highRate', 'high_discnt_rate'],
  ['lowRate', 'low_discnt_rate'],
  ['medianRate', 'avg_med_discnt_rate'],
  ['highYield', 'high_yield'],
  ['interestRate', 'int_rate'],
  ['lowYield', 'low_yield'],
  ['medianYield', 'avg_med_yield'],
  ['highPrice', 'high_price'],
  ['highDiscountMargin', 'high_discnt_margin'],
  ['spread', 'spread'],
  ['unadjustedPrice', 'unadj_price'],
  ['adjustedPrice', 'adj_price'],
  ['indexRatioOnIssueDate', 'index_ratio_on_issue_date'],
  ['referenceCpiOnIssueDate', 'ref_cpi_on_issue_date'],
  ['bidToCoverRatio', 'bid_to_cover_ratio'],
  ['grandTotalParAwarded', 'total_accepted'],
  ['grandTotalParRecognized', 'total_tendered'],
  ['subtotalCompetitiveParAwardedInsideOfOfferingAmount', 'comp_accepted'],
  ['subtotalCompetitiveParRecognizedInsideOfOfferingAmount', 'comp_tendered'],
  ['primaryDealersCompetitiveParAwarded', 'primary_dealer_accepted'],
  ['primaryDealersCompetitiveParRecognized', 'primary_dealer_tendered'],
  ['directBiddersCompetitiveParAwarded', 'direct_bidder_accepted'],
  ['directBiddersCompetitiveParRecognized', 'direct_bidder_tendered'],
  ['indirectBiddersCompetitiveParAwarded', 'indirect_bidder_accepted'],
  ['indirectBiddersCompetitiveParRecognized', 'indirect_bidder_tendered'],
];

export const TD_COLUMNS = TD_TO_S5.map(([, col]) => col);

// FiscalData writes a missing value as the string `null`; a cell the script never filled is empty.
export const isNull = v => v == null || v === '' || v === 'null';

// An auction is missing results when its row holds `null` in total_accepted, its auction date is within
// the last MISSING_WINDOW_DAYS days, and its competitive close has passed. A row with no
// closing_time_comp is due from the next date.
export const MISSING_WINDOW_DAYS = 30;

// The competitive closes, in minutes after midnight ET: 11:30 AM and 1:00 PM.
export const CLOSE_MINUTES = [11 * 60 + 30, 13 * 60];
const FIRST_TRY_MINUTES = 10;

// The date (YYYY-MM-DD) and minutes after midnight in New York at `d`.
export function easternNow(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(d).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

// A run is a first try when it starts less than 10 minutes after a competitive close.
export const isFirstTry = now => CLOSE_MINUTES.some(c => now.minutes >= c && now.minutes < c + FIRST_TRY_MINUTES);

const closeMinutes = s => {
  const m = /^(\d\d?):(\d\d) (AM|PM)$/.exec(s || '');
  return m ? (Number(m[1]) % 12 + (m[3] === 'PM' ? 12 : 0)) * 60 + Number(m[2]) : null;
};

const shiftDate = (date, days) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().substring(0, 10);
};

export function missingResults(rows, now) {
  const since = shiftDate(now.date, -MISSING_WINDOW_DAYS);
  return rows.filter(r => {
    if (!isNull(r.total_accepted) || r.auction_date < since || r.auction_date > now.date) return false;
    if (r.auction_date < now.date) return true;
    const close = closeMinutes(r.closing_time_comp);
    return close !== null && now.minutes >= close;
  });
}

const rowKey = r => `${r.cusip}|${r.auction_date}`;

const byAuctionDateThenTerm = (a, b) => {
  if (b.auction_date > a.auction_date) return 1;
  if (b.auction_date < a.auction_date) return -1;
  return (a.security_term || '').localeCompare(b.security_term || '');
};

// A fetched row replaces the existing row of the same key, except in a column where the
// fetched value is null and the existing value is not: that column keeps the existing value.
export function mergeAuctionRows(existing, incoming) {
  const map = new Map(existing.map(r => [rowKey(r), r]));
  let added = 0;
  for (const r of incoming) {
    const old = map.get(rowKey(r));
    if (!old) { added++; map.set(rowKey(r), r); continue; }
    const merged = { ...r };
    for (const col of Object.keys(old)) if (isNull(merged[col]) && !isNull(old[col])) merged[col] = old[col];
    map.set(rowKey(r), merged);
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
    if (!stated.cusip || !stated.auction_date) continue;
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
