# Largest Changes in the 30-Year TIPS Yield

Measured changes in the [Yield](../../knowledge/DATA_DICTIONARY.md#yield) of the 30-Year TIPS, symbol `US30YTIPS` in [Yields Monitor](../README.md), between consecutive closes, between Friday closes, and over 5 trading days.
**Basis of every figure:** [Yield history (S6)](../../knowledge/DATA_DICTIONARY.md#s6) as read from R2 on 2026-10-24, symbol `US30YTIPS`, whose last point is dated 2026-10-22 (3.062%), and the close of 2026-10-23 (3.087%) read from CNBC's daily feeds on 2026-10-25. Changes are in basis points (bp, 1 bp = 0.01 percentage point), the Yield at the end date less the Yield at the start date.

## 1. Data

- **Close basis.** Each point is the daily close of CNBC's daily chart-bar feeds, the benchmark close at about 15:00 ET, and not the 17:05 ET session close ([Close Price Investigation](../knowledge/Close_Price_Investigation.md)). A change between two such closes differs from a change between two 17:05 ET closes. On 2026-10-22 the first is −12.0 bp (3.182% to 3.062%). The second is −10.0 bp (3.156% at 17:05 ET on 2026-10-21 to 3.056% at 17:03 ET on 2026-10-22, the last bar of the archived snapshot).
- **Resolution.** S6 holds the symbol at daily resolution from 2023-03-23, at weekly resolution from 2016-07-08 to 2023-03-17, each weekly point dated that week's Friday, and at coarser resolution before 2016-07-08 ([1.7 Update yield history](../../knowledge/1.7_Update_Yield_History.md)). Section 2 therefore covers 2023-03-24 onward, Section 4 covers 2023-03-30 onward, and Section 3 covers 2016-07-15 onward.
- **Saturday-dated points.** S6 holds a Saturday-dated point for each week from 2023-03-25 through 2025-09-13, 117 points in all, each beside a Friday point of the same week that differs from it by up to 4.6 bp. Those points are excluded, so each week has the one Friday point.
- **Close of 2026-10-23.** S6 holds no point for 2026-10-23: the YieldsHistory task drops the current Eastern-time day, and its next run is 2026-10-26. The daily feeds (`1M`, `3M` and `6M`) hold two bars dated 2026-10-23 on 2026-10-25, 3.0870 and 3.099%. The first is the benchmark close and the second the session close, the two-bar state that [Close Price Investigation §8](../knowledge/Close_Price_Investigation.md) records for a Friday until the market reopens on Sunday. The benchmark bar, 3.087%, is used, and the `1D` feed's 14:59 ET bar of 2026-10-23 reads 3.0870 as well. This one point is not read from S6.
- **Holidays.** A week whose Friday is a [Bond Holiday](../../knowledge/DATA_DICTIONARY.md#bond-holiday) ends at its last trading day: 2024-03-28, 2025-04-17, 2025-07-03, 2026-07-02.

## 2. Largest changes between consecutive closes

904 changes, 2023-03-24 to 2026-10-23. Root mean square: 4.1 bp. A change whose start date is a Friday or the day before a Bond Holiday spans the weekend or the holiday.

**Largest decreases**

| Rank | End date | Start date | Change (bp) | Yield (%) |
|---|---|---|---|---|
| 1 | 2023-11-02 Thu | 2023-11-01 Wed | −15.1 | 2.481 → 2.330 |
| 2 | 2023-12-14 Thu | 2023-12-13 Wed | −14.7 | 1.981 → 1.834 |
| 3 | 2023-08-23 Wed | 2023-08-22 Tue | −12.9 | 2.070 → 1.941 |
| 4 | 2026-10-22 Thu | 2026-10-21 Wed | −12.0 | 3.182 → 3.062 |
| 5 | 2023-10-10 Tue | 2023-10-06 Fri | −11.4 | 2.547 → 2.433 |
| 6 | 2023-07-12 Wed | 2023-07-11 Tue | −11.3 | 1.790 → 1.677 |
| 7 | 2023-12-13 Wed | 2023-12-12 Tue | −11.0 | 2.091 → 1.981 |
| 8 | 2025-04-14 Mon | 2025-04-11 Fri | −10.7 | 2.712 → 2.605 |
| 9 | 2023-08-04 Fri | 2023-08-03 Thu | −10.4 | 1.978 → 1.874 |
| 10 | 2023-12-05 Tue | 2023-12-04 Mon | −10.1 | 2.181 → 2.080 |
| 11 | 2024-11-25 Mon | 2024-11-22 Fri | −9.5 | 2.294 → 2.199 |
| 12 | 2023-10-13 Fri | 2023-10-12 Thu | −9.2 | 2.484 → 2.392 |
| 13 | 2026-08-19 Wed | 2026-08-18 Tue | −8.9 | 3.055 → 2.966 |
| 14 | 2024-06-03 Mon | 2024-05-31 Fri | −8.5 | 2.307 → 2.222 |
| 15 | 2025-02-05 Wed | 2025-02-04 Tue | −8.4 | 2.381 → 2.297 |

**Largest increases**

| Rank | End date | Start date | Change (bp) | Yield (%) |
|---|---|---|---|---|
| 1 | 2025-04-07 Mon | 2025-04-04 Fri | +17.5 | 2.268 → 2.443 |
| 2 | 2023-10-12 Thu | 2023-10-11 Wed | +12.5 | 2.359 → 2.484 |
| 3 | 2023-03-27 Mon | 2023-03-24 Fri | +11.7 | 1.454 → 1.571 |
| 4 | 2024-02-02 Fri | 2024-02-01 Thu | +11.3 | 1.918 → 2.031 |
| 5 | 2026-03-20 Fri | 2026-03-19 Thu | +11.3 | 2.622 → 2.735 |
| 6 | 2023-09-25 Mon | 2023-09-22 Fri | +11.1 | 2.169 → 2.280 |
| 7 | 2023-11-09 Thu | 2023-11-08 Wed | +10.9 | 2.202 → 2.311 |
| 8 | 2025-05-21 Wed | 2025-05-20 Tue | +10.8 | 2.657 → 2.765 |
| 9 | 2023-10-03 Tue | 2023-10-02 Mon | +10.7 | 2.407 → 2.514 |
| 10 | 2024-11-12 Tue | 2024-11-08 Fri | +10.7 | 2.161 → 2.268 |
| 11 | 2023-09-21 Thu | 2023-09-20 Wed | +10.6 | 2.113 → 2.219 |
| 12 | 2024-04-15 Mon | 2024-04-12 Fri | +10.5 | 2.271 → 2.376 |
| 13 | 2024-04-10 Wed | 2024-04-09 Tue | +10.4 | 2.184 → 2.288 |
| 14 | 2024-07-01 Mon | 2024-06-28 Fri | +10.2 | 2.216 → 2.318 |
| 15 | 2024-06-07 Fri | 2024-06-06 Thu | +10.1 | 2.139 → 2.240 |

- 2026-10-22 ranks 4th of 904 changes by decrease: −12.0 bp, 2.9 times the root mean square.
- The 15 largest decreases fall in 2023 (9), 2024 (2), 2025 (2) and 2026 (2). The 15 largest increases fall in 2023 (6), 2024 (6), 2025 (2) and 2026 (1).

## 3. Largest changes between Friday closes

537 weeks, 2016-07-15 to 2026-10-23, each week's change between the closes of consecutive weeks. Root mean square: 9.2 bp. The weeks do not overlap. Several of the weeks below start or end at a negative Yield, and a change in bp is not scaled to the level of the Yield.

**Largest decreases**

| Rank | End date | Start date | Change (bp) | Yield (%) |
|---|---|---|---|---|
| 1 | 2020-03-27 Fri | 2020-03-20 Fri | −39.8 | 0.273 → −0.125 |
| 2 | 2020-03-06 Fri | 2020-02-28 Fri | −32.5 | 0.154 → −0.171 |
| 3 | 2022-12-02 Fri | 2022-11-25 Fri | −29.8 | 1.436 → 1.138 |
| 4 | 2022-03-04 Fri | 2022-02-25 Fri | −25.7 | 0.084 → −0.173 |
| 5 | 2023-11-03 Fri | 2023-10-27 Fri | −24.2 | 2.523 → 2.281 |
| 6 | 2020-04-24 Fri | 2020-04-17 Fri | −23.4 | −0.023 → −0.257 |
| 7 | 2023-12-15 Fri | 2023-12-08 Fri | −23.0 | 2.068 → 1.838 |
| 8 | 2023-01-06 Fri | 2022-12-30 Fri | −21.7 | 1.681 → 1.464 |
| 9 | 2022-11-25 Fri | 2022-11-18 Fri | −20.7 | 1.643 → 1.436 |
| 10 | 2022-10-28 Fri | 2022-10-21 Fri | −19.1 | 1.853 → 1.662 |
| 11 | 2022-11-11 Fri | 2022-11-04 Fri | −18.8 | 1.776 → 1.588 |
| 12 | 2019-09-20 Fri | 2019-09-13 Fri | −16.3 | 0.654 → 0.491 |
| 13 | 2022-07-15 Fri | 2022-07-08 Fri | −16.2 | 1.040 → 0.878 |
| 14 | 2026-10-16 Fri | 2026-10-09 Fri | −16.2 | 3.340 → 3.178 |
| 15 | 2016-12-23 Fri | 2016-12-16 Fri | −15.9 | 1.194 → 1.035 |

**Largest increases**

| Rank | End date | Start date | Change (bp) | Yield (%) |
|---|---|---|---|---|
| 1 | 2020-03-13 Fri | 2020-03-06 Fri | +56.8 | −0.171 → 0.397 |
| 2 | 2025-04-11 Fri | 2025-04-04 Fri | +44.4 | 2.268 → 2.712 |
| 3 | 2022-09-30 Fri | 2022-09-23 Fri | +36.6 | 1.388 → 1.754 |
| 4 | 2022-01-07 Fri | 2021-12-31 Fri | +29.4 | −0.459 → −0.165 |
| 5 | 2022-05-06 Fri | 2022-04-29 Fri | +25.5 | 0.412 → 0.667 |
| 6 | 2019-09-13 Fri | 2019-09-06 Fri | +23.5 | 0.419 → 0.654 |
| 7 | 2023-10-06 Fri | 2023-09-29 Fri | +21.8 | 2.329 → 2.547 |
| 8 | 2022-04-08 Fri | 2022-04-01 Fri | +21.2 | −0.013 → 0.199 |
| 9 | 2021-12-10 Fri | 2021-12-03 Fri | +20.3 | −0.586 → −0.383 |
| 10 | 2022-02-04 Fri | 2022-01-28 Fri | +20.0 | −0.151 → 0.049 |
| 11 | 2024-12-13 Fri | 2024-12-06 Fri | +19.9 | 2.134 → 2.333 |
| 12 | 2021-02-19 Fri | 2021-02-12 Fri | +19.3 | −0.159 → 0.034 |
| 13 | 2022-12-23 Fri | 2022-12-16 Fri | +19.1 | 1.422 → 1.613 |
| 14 | 2018-10-05 Fri | 2018-09-28 Fri | +17.5 | 1.056 → 1.231 |
| 15 | 2022-09-02 Fri | 2022-08-26 Fri | +17.0 | 0.863 → 1.033 |

- The week ending 2026-10-23 changes by −9.1 bp (3.178% to 3.087%), ranking 60th of 537 weeks by decrease. The week ending 2026-10-16 ranks 14th.

## 4. Largest changes over 5 trading days

900 changes, each between the close 5 trading days before the end date and the close on the end date, 2023-03-30 to 2026-10-23. Root mean square: 8.7 bp. The windows overlap, so one move appears in several adjacent ranks.

**Largest decreases**

| Rank | End date | Start date | Change (bp) | Yield (%) |
|---|---|---|---|---|
| 1 | 2023-11-08 Wed | 2023-11-01 Wed | −27.9 | 2.481 → 2.202 |
| 2 | 2023-11-07 Tue | 2023-10-31 Tue | −26.7 | 2.520 → 2.253 |
| 3 | 2024-06-05 Wed | 2024-05-29 Wed | −24.7 | 2.380 → 2.133 |
| 4 | 2023-11-03 Fri | 2023-10-27 Fri | −24.2 | 2.523 → 2.281 |
| 5 | 2023-12-15 Fri | 2023-12-08 Fri | −23.0 | 2.068 → 1.838 |
| 6 | 2023-12-18 Mon | 2023-12-11 Mon | −21.6 | 2.095 → 1.879 |
| 7 | 2023-12-19 Tue | 2023-12-12 Tue | −21.5 | 2.091 → 1.876 |
| 8 | 2024-08-05 Mon | 2024-07-29 Mon | −20.7 | 2.184 → 1.977 |
| 9 | 2026-10-15 Thu | 2026-10-07 Wed | −20.0 | 3.385 → 3.185 |
| 10 | 2023-11-06 Mon | 2023-10-30 Mon | −19.8 | 2.523 → 2.325 |
| 11 | 2024-02-01 Thu | 2024-01-25 Thu | −19.4 | 2.112 → 1.918 |
| 12 | 2023-12-14 Thu | 2023-12-07 Thu | −19.0 | 2.024 → 1.834 |
| 13 | 2025-09-09 Tue | 2025-09-02 Tue | −19.0 | 2.680 → 2.490 |
| 14 | 2025-09-11 Thu | 2025-09-04 Thu | −19.0 | 2.602 → 2.412 |
| 15 | 2025-04-28 Mon | 2025-04-21 Mon | −18.5 | 2.687 → 2.502 |

**Largest increases**

| Rank | End date | Start date | Change (bp) | Yield (%) |
|---|---|---|---|---|
| 1 | 2025-04-11 Fri | 2025-04-04 Fri | +44.4 | 2.268 → 2.712 |
| 2 | 2025-04-10 Thu | 2025-04-03 Thu | +35.4 | 2.303 → 2.657 |
| 3 | 2026-09-28 Mon | 2026-09-21 Mon | +26.2 | 3.044 → 3.306 |
| 4 | 2026-09-29 Tue | 2026-09-22 Tue | +24.5 | 3.067 → 3.312 |
| 5 | 2023-09-26 Tue | 2023-09-19 Tue | +24.4 | 2.089 → 2.333 |
| 6 | 2025-04-08 Tue | 2025-04-01 Tue | +24.1 | 2.283 → 2.524 |
| 7 | 2023-09-27 Wed | 2023-09-20 Wed | +23.6 | 2.113 → 2.349 |
| 8 | 2025-04-09 Wed | 2025-04-02 Wed | +23.6 | 2.320 → 2.556 |
| 9 | 2023-09-25 Mon | 2023-09-18 Mon | +23.4 | 2.046 → 2.280 |
| 10 | 2023-08-03 Thu | 2023-07-27 Thu | +23.0 | 1.748 → 1.978 |
| 11 | 2024-02-08 Thu | 2024-02-01 Thu | +22.5 | 1.918 → 2.143 |
| 12 | 2023-08-02 Wed | 2023-07-26 Wed | +22.1 | 1.662 → 1.883 |
| 13 | 2023-10-06 Fri | 2023-09-29 Fri | +21.8 | 2.329 → 2.547 |
| 14 | 2024-04-16 Tue | 2024-04-09 Tue | +21.1 | 2.184 → 2.395 |
| 15 | 2024-12-13 Fri | 2024-12-06 Fri | +19.9 | 2.134 → 2.333 |

- The window ending 2026-10-22 starts 2026-10-15 and changes by −12.3 bp (3.185% to 3.062%), ranking 49th of 900 changes by decrease.
