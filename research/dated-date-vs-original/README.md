# Dated Date versus Original Dated Date in Auction results

**Question.** Is the [Dated Date](../../knowledge/DATA_DICTIONARY.md#dated-date) of an auction ever different from its Original Dated Date?

**Data.** [Auction results (S5)](../../knowledge/DATA_DICTIONARY.md#s5), `Treasuries/Auctions.csv`, read live: 11,185 rows, auctions through 2026-08-20. Fields `dated_date` and `original_dated_date`. S5 writes an empty `original_dated_date` as the text `null`.

**Method.** `node research/dated-date-vs-original/find-differing-dated-dates.mjs` classifies every row and prints the rows where the two dates differ.

## Result

Yes: 54 rows, each a different CUSIP, all reopenings.

| `reopening` | `original_dated_date` | Rows |
|---|---|---|
| Yes | empty | 5,485 |
| No | empty | 5,088 |
| Yes | equal to `dated_date` | 549 |
| No | equal to `dated_date` | 9 |
| Yes | different from `dated_date` | 54 |

`announcemtd_orig_dated_date` is empty in every row.

The 54 rows fall in two groups, by the gap from `original_dated_date` to `dated_date`:

1. **181-184 days, 32 rows.** 29-Year 4-Month and 6-Month bonds, Aug 15 against Feb 15 of the same year (17): 912810QF8, QP6, QV3, RA8, RF7, RL4, RR1, RW0, SB5, SG4, SM1, SV1, TE8, TP3, TY4, UH9, US5. 19-Year 6-Month bonds, Jul 15 against Jan 15 (2): 912810PV4, PZ5. 29-Year 6-Month bond, Nov 15 against May 15 (1): 912810PX0. 4-Year 4-Month and 6-Month notes, Oct 15 against Apr 15 (11): 912828HW3, KM1, MY3, QD5, SQ4, UX6, C99, K33, Q60, X39, 9128284H0. 9-Year 4-Month note, 2008-08-15 against 2008-02-15 (1): 912828HR4. Auction dates 2008-2026.
2. **730-2,556 days, 22 rows.** `dated_date` and `original_dated_date` fall on the same day of the year, except Feb 29 against Feb 28 (912828UR9). 2-Year notes (10): 912828SY7, TM2, TS9, TW0, UR9, ST8, F62, C57, WG1, 91282CGH8. 5-Year notes (8): 912828RE2, RH5, M80, N30, W71, XT2, Z78, 91282CGQ8. 3-Year note (1): 912828TY6, 2019-11-15 against 2012-11-15. 2008 notes with 6-Year 4-Month, 6-Year 7-Month and 6-Year 10-Month terms (3): 912828DM9, DV9, EE6. Auction dates 2008-2026.

Cross-check: for 912828RE2, SY7 and TY6, the CUSIP's `maturity_date` and its first auction row agree with `original_dated_date`, so in the later row `dated_date` is the one that moved.
