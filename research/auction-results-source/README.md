# Auction results source

**Question:** which source states the [Auction Results](../../knowledge/DATA_DICTIONARY.md#auction-results) that [1.4](../../knowledge/1.4_Fetch_Auction_Results.md) writes to [Auction results (S5)](../../knowledge/DATA_DICTIONARY.md#s5): `auctions_query` of [FiscalData (E3)](../../knowledge/DATA_DICTIONARY.md#e3), the `treasury_securities_auctions_v2` table of FiscalData, or [TreasuryDirect (E15)](../../knowledge/DATA_DICTIONARY.md#e15)?

**Trigger:** measured 2026-10-28, `auctions_query` states no auction after 2026-10-22. FiscalData states that table receives no new data and is decommissioned in Spring 2027, and that `treasury_securities_auctions_v2` ("Treasury Securities Auctions Data (Updated)") receives the new data.

**Method:** run on 2026-10-28, both scripts read the sources live.

- `compare.mjs` compares the three sources on the same auctions, matched by CUSIP and competitive close date.
- `field-map.mjs` writes [field-map.csv](field-map.csv): every field of the three sources, its counterpart in the others, and the basis.

## Result

| | `auctions_query` | `treasury_securities_auctions_v2` | TreasuryDirect (E15) |
|---|---|---|---|
| Fields per auction | 114 | 181 | 187 |
| Auctions stated | to 2026-10-22 | 367, from 2025-12-29, including auctions announced to 2026-10-29 | 250, from 2025-05-22 (the response is capped at 250 auctions) |
| Field names | snake_case | snake_case; 59 of the 114 `auctions_query` names are renamed, reshaped, dropped or derived | camelCase |
| Query | `filter`, `sort`, `page[size]` to 10,000, `format` json, csv, xml | the same | `days` only; `format` json only (xml and csv return HTTP 406) |
| Lists of upcoming auctions | `upcoming_auctions` endpoint, latest announcement date 2026-10-22 | the table lists announced auctions with `null` results; the `upcoming_auctions_v2` endpoint is the replacement of `upcoming_auctions` | `announced` (250 auctions) and `upcoming` (6 auctions) endpoints, same 187 fields |
| Results after the competitive close | measured 2026-10-21: `null` for days (1.4) | not measured: both 2026-10-28 results were stated 28 minutes after the close | `updatedTimestamp` median 4.0 minutes over 250 auctions |

### `auctions_query` against `treasury_securities_auctions_v2`

FiscalData publishes no mapping between the two tables. They state 352 auctions in common (2025-12-29 to 2026-10-22), so each old field is mapped by the values both tables state and confirmed by the labels. The old table's definitions are wrong for several fields (`indirect_bidder_accepted` is defined as bids received), so a definition decides nothing.

The 114 old fields:

- **55 keep their name.** Where both tables state a value, 51 are equal in every auction, 3 are not stated by both in any auction, and `cpi_base_reference_period` differs in format (`1982-1984=100` against `1982-1984`, 1 of 10 auctions).
- **41 are renamed and state the same data.** Examples: `total_accepted` is `grand_total_par_awarded`, `high_discnt_rate` is `high_rate`, `comp_accepted` is `subtot_comp_inside_awrd`. 36 are equal in every auction where both state a value. For 10 of the 36 the values cannot separate the new field from its neighbours (a constant `Yes`, or awarded equal to recognized), so the labels decide. 5 are not stated by both in any auction: three the old table never states, and the two close times, which v2 does not state.
- **12 are reshaped.**
  - `allocation_pctage` becomes three fields: by rate, by yield or by discount margin.
  - Each `avg_med_*` becomes a median field and an average field.
  - Each `*_per100` and `*_per1000` becomes one amount with the face amount it is per.
  - `security_term_day_month` and `security_term_week_year` become a number in a day, week, month or year column.
- **5 have no v2 field:** `comp_tenders_accepted`, `first_int_payment_date`, `tint_cusip_1`, `tint_cusip_2` and `treas_retail_accepted`. TreasuryDirect states the last as `retailNoncompetitiveParAwarded`.
- **1 is derived:** `noncomp_accepted` equals the total awarded less the competitive, FIMA and SOMA awarded.

67 of the 181 v2 fields correspond to no old field. They state the bids of each bidder category by competitive and non-competitive, inside and outside the offering amount, the tentative non-competitive amounts, the originally announced security, the bid increments and the thresholds.

### `treasury_securities_auctions_v2` against TreasuryDirect

Each v2 label is the TreasuryDirect name written as words, and the pairing holds for 180 of the 181 v2 fields. The exception is `record_date`, FiscalData's own date field. TreasuryDirect has 7 fields v2 lacks: `competitiveAuctionCloseDateYear`, `noncompetitiveAuctionCloseDateYear`, `daysIssueToMaturity`, `retailNoncompetitiveParAwarded`, `type`, `unadjustedCurrentlyOutstanding` and `updatedTimestamp`.

Over the 179 auctions in both, 153 paired fields are equal, 20 state nothing in those auctions, and 7 differ. A time with or without `ET` is not counted as a difference.

- `comp_auction_close_time` and `noncomp_auction_close_time`: v2 is `null` in 177 of 179 auctions, and in 365 of 367 auctions overall. TreasuryDirect states both for every auction.
- `pdf_filenm_noncomp_results`: v2 is `null` in 162 of 179.
- `pdf_filenm_spec_announcemt`: of 38 auctions where either states a file name, v2 is `null` in 35 and TreasuryDirect in 3.
- `max_recog_single_rate_bid`: v2 is `null` in 1 of 90. `security_term_week`: v2 is `null` in 1 of 89.
- `security_term`: both state a value and differ in 1 auction, the 17-Week Bill of 2026-10-28, which v2 states as `119-Day` and TreasuryDirect as `17-Week`. v2 states `17-Week` for 43 other 17-Week Bills.

Wherever both state a value, the values are equal except in that one `security_term`.

### Upcoming auctions

5.1 reads `upcoming_auctions`, which FiscalData has replaced with `upcoming_auctions_v2` ("Treasury Securities Upcoming Auctions (Updated)").

- **`upcoming_auctions` is frozen.** Its latest announcement date is 2026-10-22 and FiscalData lists its last update as 2026-10-16. Measured 2026-10-28, for auctions dated on or after that day it states 2, `upcoming_auctions_v2` states 6, and the `treasury_securities_auctions_v2` table states 5.
- **`upcoming_auctions_v2` has the same 9 fields,** except that `auction_date` is `comp_auction_close_date`. Its offering amount is `null` for the 3 Bills announced on 2026-10-29.
- **The upcoming list is a different set from the auctions table.** `upcoming_auctions_v2` states 3 auctions that the auctions table lacks: the 13-Week and 26-Week Bills of 2026-11-02 and the 6-Week Bill of 2026-11-03, none announced yet. The auctions table states the 2 auctions held on 2026-10-28, which `upcoming_auctions_v2` omits. So the Upcoming Auctions tab needs its own list.
- **TreasuryDirect's `upcoming` states the same 6 auctions as `upcoming_auctions_v2`.**

### Authority and timing

1. **No source of higher authority was found.** Both state the file name of the Treasury's results XML for each auction, equal in 179 of 179. TreasuryDirect's API page points to the Fiscal Service community site (`api-community.fiscal.treasury.gov`) for its documentation, which renders only in a browser and was not read.
2. **`updatedTimestamp` is the last update, not the first statement of results.** Its median is 4.0 minutes after the competitive close, as [E15](../../knowledge/DATA_DICTIONARY.md#e15) states. Its maximum is 109.2 minutes, for an auction updated again after its results.
3. **The v2 table has no timestamp of results.** Its `record_date` is a date up to 6 days after the auction, so its delay is measured by reading it at the competitive close of an auction day.

## Open

- v2's delay after the competitive close: read it every 30 seconds from each close on an auction day, and record the first reading that states `grand_total_par_awarded`.
