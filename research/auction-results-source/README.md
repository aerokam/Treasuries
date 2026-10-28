# Auction results source

**Question:** which source states the [Auction Results](../../knowledge/DATA_DICTIONARY.md#auction-results) that [1.4](../../knowledge/1.4_Fetch_Auction_Results.md) writes to [Auction results (S5)](../../knowledge/DATA_DICTIONARY.md#s5): `auctions_query` of [FiscalData (E3)](../../knowledge/DATA_DICTIONARY.md#e3), the `treasury_securities_auctions_v2` table of FiscalData, or [TreasuryDirect (E15)](../../knowledge/DATA_DICTIONARY.md#e15)?

**Trigger:** measured 2026-10-28, `auctions_query` states no auction after 2026-10-22. FiscalData states that table receives no new data and is decommissioned in Spring 2027, and that `treasury_securities_auctions_v2` ("Treasury Securities Auctions Data (Updated)") receives the new data.

**Method:** `compare.mjs` reads the three sources live and compares them on the same auctions, matched by CUSIP and competitive close date. Run on 2026-10-28.

## Result

| | `auctions_query` | `treasury_securities_auctions_v2` | TreasuryDirect (E15) |
|---|---|---|---|
| Fields per auction | 114 | 181 | 187 |
| Auctions stated | to 2026-10-22 | 367, from 2025-12-29, including auctions announced to 2026-10-29 | 250, from 2025-05-22 (the response is capped at 250 auctions) |
| Field names | snake_case | snake_case, 59 of the 114 `auctions_query` names changed | camelCase |
| Query | `filter`, `sort`, `page[size]` to 10,000, `format` json, csv, xml | the same | `days` only; `format` json only (xml and csv return HTTP 406) |
| Lists of upcoming auctions | `upcoming_auctions` endpoint | the table lists announced auctions with `null` results | `announced` (250 auctions) and `upcoming` (6 auctions) endpoints, same 187 fields |
| Results after the competitive close | measured 2026-10-21: `null` for days (1.4) | not measured: both 2026-10-28 results were stated 28 minutes after the close | `updatedTimestamp` median 4.0 minutes over 250 auctions |

1. **`treasury_securities_auctions_v2` and TreasuryDirect state one set of fields.** Over the 179 auctions in both, 154 of the 181 v2 fields hold a value identical to a TreasuryDirect field, 20 are `null` in every row, and 7 differ in content: the two close times (`11:30 AM ET` against `11:30 AM`), the non-competitive results file name, `security_term_week`, `max_recog_single_rate_bid`, and `security_term` in 1 auction (`119-Day` against `17-Week`). The results XML file name each states is the same in 179 of 179 auctions.
2. **No source of higher authority was found.** Both state the file name of the Treasury's results XML for each auction. TreasuryDirect's own API page now points to the Fiscal Service community site (`api-community.fiscal.treasury.gov`) for its documentation, which renders only in a browser and was not read.
3. **`updatedTimestamp` is the last update, not the first statement of results.** Its median is 4.0 minutes after the competitive close, as [E15](../../knowledge/DATA_DICTIONARY.md#e15) states; its maximum is 109.2 minutes, for an auction updated again after its results.
4. **The v2 table has no timestamp of results.** Its `record_date` is a date up to 6 days after the auction, so its delay is measured by reading it at the competitive close of an auction day.

## Open

- v2's delay after the competitive close: read it every 30 seconds from each close on an auction day, and record the first reading that states `grand_total_par_awarded`.
