# TIPS Reference (App Overview)

**TIPS Reference** shows one row for every TIPS in [TIPS reference data (S2)](./DATA_DICTIONARY.md#s2), with the quote of [Market quotes (S7)](./DATA_DICTIONARY.md#s7) where there is one, the [Index Ratio](./DATA_DICTIONARY.md#index-ratio) at a Ref CPI Date the user selects, the Term and Duration, and the next coupon.

---

## Data flow diagram

TIPS Reference is process 6 on [Level 1](/knowledge/DFD_LEVEL1), and [Level 2](/knowledge/DFD_LEVEL2_TIPSREFERENCE) draws its four processes. It reads S2, S7, [Ref CPI (S3)](./DATA_DICTIONARY.md#s3) and [Bond holidays (S16)](./DATA_DICTIONARY.md#s16) from R2 when the page opens.

## Specs

| Spec | What it specifies |
|---|---|
| [6.1 Load TIPS data](../TipsReference/knowledge/6.1_Load_TIPS_Data.md) | The rows, the quote joined to each, and the Term and durations. |
| [6.2 Calculate index ratios and coupons](../TipsReference/knowledge/6.2_Calculate_Index_Ratios_And_Coupons.md) | The Ref CPI Date, the Index Ratio, the Adj Price and the next coupon. |
| [6.3 Render TIPS table](../TipsReference/knowledge/6.3_Render_TIPS_Table.md) | The header, the columns, the sort, the filters, the outstanding choice and the Coupon Calculation window. |
| [6.4 Export TIPS table](../TipsReference/knowledge/6.4_Export_TIPS_Table.md) | The csv file. |
