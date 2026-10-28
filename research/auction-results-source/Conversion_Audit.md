# Trial conversion of Auction results (S5): audit

Result of [Migration_Plan.md](Migration_Plan.md) step 4, run 2026-10-28 on the copy of S5 made before the conversion (`Treasuries/backup/Auctions_2026-10-28_before-v2-names.csv` in R2). `convert-trial.mjs` converts every row with `convertOldRow` of [auction-results.js](../../shared/src/auction-results.js) and writes `data/Auctions_converted_trial.csv` (gitignored) and `data/conversion-audit.txt`, the full per-column table. Nothing is published.

The audit judges the conversion by [field-map.csv](field-map.csv), which names the columns each old column became, and does not use the conversion's own tables.

## Result

1. **Rows.** 11,162 before and after. The 11,162 keys (CUSIP and auction date) are distinct and equal row by row. Columns: 114 before, 181 after.
2. **Values.** Every stated value of every old column is in a column it became, except the zero terms of item 5 and the columns of item 8. Over the 108 old columns that became at least one column, 0 values are missing. A column that became several (`allocation_pctage`, `max_single_bid`, the `avg_med_*` columns, the per-amount columns, the terms) has its stated count equal to the sum of the counts of the columns it became.
3. **Two old columns for one new column.** `price_per100` and `high_price`, `back_dated_date` and `dated_date`, `original_cusip` and `announcemtd_cusip` never state different values in the same row. The same holds for `accrued_int_per100`, `accrued_int_per1000` and the other per-amount columns, which never state different face amounts in the same row.
4. **`noncomp_accepted`.** Stated in 6,269 rows. Total less competitive, FIMA and SOMA awarded equals it in 6,269 of 6,269.
5. **Zero terms.** `security_term_day_month` is `0-Month` in 2,021 rows and `security_term_week_year` is `0-Week` in 934 rows. The new table states nothing for a zero term, so the conversion writes nothing (the 356 auctions compared with the new table agree). The term stays in `security_term` and in the column of its other unit.
6. **No pricing method.** 11 rows from 2026-10-21 to 2026-10-28, the rows filled from TreasuryDirect, state an average or median with no `auction_format`. They are written as the median, which is what TreasuryDirect states and what the new table states for the 4 of them it shares. Step 5 replaces them with the new table's values.
7. **Apostrophe.** FiscalData's CSV wrote `'-0.035000` in `low_discnt_margin` of 91282CRD5 (2026-09-23), the only such cell. The conversion writes `-0.035000`.
8. **Columns not carried.** `noncomp_accepted` (item 4), `comp_tenders_accepted` (6,274 rows), `first_int_payment_date` (2,791), `tint_cusip_1` (121), `tint_cusip_2` (4) and `treas_retail_accepted` (6,268).

## Agreement with the new table

[auction-conversion.test.js](../../shared/tests/auction-conversion.test.js) compares the converted rows with the new table's rows for the 356 auctions to 2026-10-22 that S5 and the new table both state (23,323 pairs of stated values). All agree, as text or as a number, except two differences between the sources: the case of `pricing_method` (`Single-Price` against `Single-price`, in 5 auctions) and `cpi_base_reference_period` (`1982-1984=100` against `1982-1984`, in 1 auction). The test found the one mapping error of the first field map: `max_single_bid` is three fields of the new table, not a same-name field.

## Formats the conversion keeps

- **Numbers** keep the digits S5 holds (`5.125000`); the new table writes `5.125`. The auctions merged from the new table in step 5 take its form.
- **Close times** are the old time followed by ` ET` (`01:00 PM ET`). The new table states `11:30 AM ET` for 2 auctions and no 1:00 PM time.
- **`price_per_amt`** is `100` in every row, as the new table states in all 367 auctions.
- **Missing values** are `null`, as FiscalData's CSV writes them. The file grows from 8.7 MB to 12.3 MB because 67 columns the old table never had are `null` before 2025-12-29.
