# Migration of Auction results (S5) to the treasury_securities_auctions_v2 field names

**Premise:** [FiscalData (E3)](../../knowledge/DATA_DICTIONARY.md#e3) stays the source of [Auction results (S5)](../../knowledge/DATA_DICTIONARY.md#s5); one set of column names, the `treasury_securities_auctions_v2` names, for every row; no value of a column the new table names is lost. The findings behind each step are in [README.md](README.md), and the field-by-field mapping is [field-map.csv](field-map.csv).

**S5 today** (measured 2026-10-28): 11,162 rows, 1980-01-02 to 2026-10-28, 114 columns under the `auctions_query` names. `treasury_securities_auctions_v2` states 367 auctions from 2025-12-29, so it cannot replace the history: S5 is the only store that holds the auctions before 2025-12-29, and it stays the only one.

## Consumers of the old names and endpoints

| Consumer | Reads | Change |
|---|---|---|
| `scripts/getAuctions.js`, `shared/src/auction-results.js` ([1.4](../../knowledge/1.4_Fetch_Auction_Results.md)) | `auctions_query`, TreasuryDirect, S5 | read the new table; the TreasuryDirect field map targets the new names |
| `scripts/fetchTipsRef.js` ([1.6](../../knowledge/1.6_Fetch_TIPS_Reference_Data.md)) | `auctions_query`, every TIPS ever auctioned | read S5, because the new table starts 2025-12-29 |
| `TreasuryAuctions/src/app.js` ([5.1](../../TreasuryAuctions/knowledge/5.1_Load_Auction_Data.md), 5.2, 5.3) | S5 columns by name, `upcoming_auctions` | new column names; `upcoming_auctions_v2` |
| `shared/tests/auction-results.*`, `TreasuryAuctions/tests/UI/auctions_*.spec.js` | old names | new names |
| Specs and the DD | S5, E3, Auction Results, Upcoming Auctions entries; 1.4, 1.6, 5.1 to 5.3, `Filtering_And_Columns.md`, `AuctionsQuery_Reference.md`, the Level 2 diagrams | rewritten to the new names and endpoints |

## Steps

1. **Copy S5 as it is.** Write `Treasuries/Auctions.csv` to a dated R2 object and to a local file. Every later step can be rerun from that copy.
2. **Write the conversion once, in `shared/src/auction-results.js`.** One function turns an old-named row into a new-named row, using [field-map.csv](field-map.csv):
   - 54 same-name columns and 41 renamed columns: copy the value.
   - `*_per100` and `*_per1000`: write the amount to the one new column and the face amount (100 or 1000) to its per-amount column. `accrued_int_per100` and `accrued_int_per1000` become `accrued_int`, `adj_accrued_int_per1000` becomes `adj_accrued_int` and `unadj_accrued_int_per1000` becomes `unadj_accrued_int`, and the three share the one column `accrued_int_per_amount`. A reader of an amount divides by its per-amount column and multiplies by the face amount it wants.
   - `allocation_pctage` and `max_single_bid`: write each to the rate, yield or discount margin column, by which of `high_discnt_rate`, `high_yield` and `high_discnt_margin` the row states.
   - each `avg_med_*`: write it to the median column when `pricing_method` is `Single-Price`, to the average column otherwise.
   - `security_term_day_month` and `security_term_week_year`: write the number to the day, month, week or year column its unit names.
   - times: write `11:30 AM ET`, the form the new table states.
   - `noncomp_accepted`: write nothing; the new columns hold what it was derived from (total, competitive, FIMA and SOMA awarded).
3. **Check the conversion against the new table.** Convert the 352 auctions both tables state and compare each converted value with the value the new table states, column by column. This is a test in `shared/tests/` that fails on any value that differs, so the field map is verified by two independent sources and not asserted.
4. **Trial conversion of all 11,162 rows, written to a local file.** The audit must report, before anything is published:
   - the row count and the set of CUSIP and auction date keys are unchanged;
   - for every old column, its count of stated values equals the count in the column or columns it became (a split column sums to the original);
   - the rows where a rule in step 2 does not apply, such as a row with both `accrued_int_per100` and `accrued_int_per1000`, a row with no pricing method, or a unit other than day, week, month or year;
   - for the old rows with `noncomp_accepted` stated, total less competitive, FIMA and SOMA awarded equals it, so dropping the column loses nothing.
   Stop here for review of the audit.
5. **Read all 367 auctions of the new table once and merge them over the converted rows.** The new table's value replaces the converted value where it states one; the converted value stays where the new table states `null` (the close times, 365 of 367). This adds the 65 columns the old table never had to the auctions from 2025-12-29, and adds the auctions announced and not yet held. Auctions before 2025-12-29 keep `null` in those columns, because no source states them.
6. **Columns with no new name are dropped.** `comp_tenders_accepted`, `first_int_payment_date`, `tint_cusip_1`, `tint_cusip_2` and `treas_retail_accepted` hold values for the old auctions and have no field in the new table. No app, job or test reads them (searched 2026-10-28). Their values stay in the copy of step 1 and not in S5. (Decision 2, ruled.)
7. **Change the ingestion job ([1.4](../../knowledge/1.4_Fetch_Auction_Results.md)).**
   - Read the new table for the auctions of the last N days (decision 1) on every run, and merge by CUSIP and auction date, so FiscalData's later corrections to a recent auction are taken.
   - Drop the read from 1980. The new table cannot supply it, so a missing S5 is an error to restore from the copy of step 1.
   - Drop the first-try and repeat rule and the missing-results rule, which read `closing_time_comp`, because the new table states the close time for 2 of 367 auctions and the job now reads the recent days on every run. Write S5 only when its rows change, as today.
   - Keep the TreasuryDirect fill, retargeted to the new names, until the new table's delay after the competitive close is measured (decision 3).
8. **Publish.** Upload the converted S5 and push the changes to the app, [1.6](../../knowledge/1.6_Fetch_TIPS_Reference_Data.md) and the tests together. (Decision 4.)
9. **Repoint the other readers.** `fetchTipsRef.js` reads S5. The Upcoming Auctions fetch of [5.1](../../TreasuryAuctions/knowledge/5.1_Load_Auction_Data.md) reads `upcoming_auctions_v2`, filtered and sorted on `comp_auction_close_date`. This step does not depend on the others and can ship first.
10. **Specs, DD and diagrams in the same pass as the code.** `AuctionsQuery_Reference.md` becomes the reference of the new table. The TreasuryDirect entry of the DD and its field map in 1.4 change only if decision 3 drops it.

## Decisions

1. **N, the number of days the job re-reads:** 30, as today. Ruled.
2. **The 5 columns with no new name:** dropped (step 6). Ruled.
3. **TreasuryDirect:** open. The developer expects it is not needed. 1.4 added the fill because the old table stated no results for days after a close (measured 2026-10-21), which the endpoint freeze does not explain, so the new table's delay (the Open item of the README) decides it.
4. **Publish:** replace the object `Treasuries/Auctions.csv` and push the app within minutes of each other. The name does not change. The copy of step 1 restores the old file. Between the two, the old app reads a file whose columns are renamed. Ruled.
