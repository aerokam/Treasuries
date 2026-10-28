# FiscalData treasury_securities_auctions_v2 Reference

**Endpoint:** `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/treasury_securities_auctions_v2` of [FiscalData (E3)](./DATA_DICTIONARY.md#e3), titled "Treasury Securities Auctions Data (Updated)". It requires no authentication. Every value is returned as a string, and a missing value is the string `null`.

[Fetch auction results (1.4)](./1.4_Fetch_Auction_Results.md) reads it, and [Auction results (S5)](./DATA_DICTIONARY.md#s5) holds what it returns, with a column FiscalData states as `null` filled from [TreasuryDirect (E15)](./DATA_DICTIONARY.md#e15) where [1.4](./1.4_Fetch_Auction_Results.md#treasurydirect) maps it. Measured 2026-10-28, the endpoint states 181 fields for 367 auctions from 2025-12-29, including the auctions announced and not yet held, which state `null` in their result columns. S5 holds the 181 columns, and holds the auctions before 2025-12-29 converted from the `auctions_query` table (see [1.4](./1.4_Fetch_Auction_Results.md#s5-names)).

It replaces the `auctions_query` endpoint, which FiscalData stopped updating after the auction of 2026-10-22 and decommissions in Spring 2027. The Upcoming Auctions come from the `upcoming_auctions_v2` endpoint, which replaces `upcoming_auctions`: it states the same 9 fields, with `auction_date` renamed `comp_auction_close_date`.

The field-by-field correspondence between the two tables, and with [TreasuryDirect (E15)](./DATA_DICTIONARY.md#e15), is [field-map.csv](../research/auction-results-source/field-map.csv).

---

## Query Parameters

| Parameter | Example | Behavior |
|---|---|---|
| `fields` | `fields=cusip,comp_auction_close_date,security_type` | Comma-separated. Omitted, every field is returned. A `sort` or `filter` field must be among the `fields`, or the request fails with `Field '...' does not exist`. |
| `filter` | `filter=security_type:eq:Bill,reopening:eq:No` | Comma-separated conditions, all of which must hold. |
| `sort` | `sort=-comp_auction_close_date` | A `-` prefix sorts descending. |
| `format` | `format=json` | `json` (the default), `csv` or `xml`. The CSV writes an apostrophe before a negative number. |
| `page[number]` | `page[number]=1` | Starts at 1. |
| `page[size]` | `page[size]=10000` | 100 rows when omitted. A value above 10000 returns HTTP 400 (`Invalid Query Param`), so a larger result is read by increasing `page[number]`. |

A name that is not a field of the table, in `fields`, `filter` or `sort`, returns HTTP 400.

## Filter Operators

- Supported: `eq`, `lt`, `lte`, `gt`, `gte` and `in`, with `in` taking `(val1,val2)`.
- Not supported: `neq` and `nin` return HTTP 400.
- Write a date as `YYYY-MM-DD`: `comp_auction_close_date:gte:2026-01-01`.

## TIPS

- `security_type:eq:TIPS` returns no rows, because FiscalData states a TIPS as `Note` or `Bond`.
- Select TIPS with `inflation_protected:eq:Yes`.

## `security_type` and `security_term`

| `security_type` | Typical `security_term` values |
|---|---|
| `Bill` | `4-Week`, `8-Week`, `13-Week`, `17-Week`, `26-Week`, `52-Week` |
| `Note` | `2-Year`, `3-Year`, `5-Year`, `7-Year`, `10-Year` |
| `Bond` | `20-Year`, `30-Year` |

A reopening states its remaining term in `security_term` (`9-Year 10-Month` for a reopened 10-Year TIPS) and the term it was issued with in `original_security_term`. The term is also stated as a number in the column of its unit: `security_term_day`, `security_term_week`, `security_term_month` or `security_term_year`.

---

## Fields

### Identity
| Field | Meaning |
|---|---|
| `cusip` | [CUSIP](./DATA_DICTIONARY.md#cusip) |
| `security_type` | `Bill`, `Note` or `Bond` |
| `security_term` | The term of the security at this auction |
| `original_security_term` | The term at the original issue |
| `reopening` | `Yes` or `No` |
| `inflation_protected` | `Yes` for a TIPS, `No` otherwise |

### Dates
| Field | Meaning |
|---|---|
| `announcemt_date` | The announcement date |
| `comp_auction_close_date` | The auction date: the date of the competitive close |
| `issue_date` | The date the security is issued |
| `maturity_date` | The [Maturity Date](./DATA_DICTIONARY.md#maturity-date) |
| `dated_date` | The [Dated Date](./DATA_DICTIONARY.md#dated-date) |
| `original_issue_date` | The issue date of the original issue of a reopening |

### Price and Rate
| Field | Meaning |
|---|---|
| `int_rate` | The [Coupon Rate](./DATA_DICTIONARY.md#coupon-rate) of a Note, Bond or TIPS |
| `high_yield` | The high [Yield](./DATA_DICTIONARY.md#yield) of a Note, Bond or TIPS |
| `investment_rate` | The high investment rate of a Bill |
| `high_price` | The high [Price](./DATA_DICTIONARY.md#price), per the face amount `price_per_amt` (100) |
| `accrued_int` | The accrued interest, per the face amount `accrued_int_per_amount` (100 or 1000) |

### Size and Demand
| Field | Meaning |
|---|---|
| `offering_amt` | The amount offered, in dollars |
| `subtot_comp_inside_awrd` | The competitive bids awarded inside the offering amount |
| `grand_total_par_awarded` | The total par awarded |
| `grand_total_par_recog` | The total par recognized |
| `bid_to_cover_ratio` | The bid-to-cover ratio |
| `prim_deal_comp_par_awarded` | The competitive par awarded to primary dealers |
| `dir_bid_comp_par_awarded` | The competitive par awarded to direct bidders |
| `indir_bid_comp_par_awarded` | The competitive par awarded to indirect bidders |

### TIPS Only
| Field | Meaning |
|---|---|
| `unadj_price` | The price before the [Index Ratio](./DATA_DICTIONARY.md#index-ratio) applies |
| `adj_price` | The [Adjusted Price](./DATA_DICTIONARY.md#adjusted-price) |
| `ref_cpi_on_orig_dated_date` | The [Ref CPI](./DATA_DICTIONARY.md#ref-cpi) on the Dated Date of the original issue |
| `ref_cpi_on_issue_date` | The Ref CPI on the issue date |
| `index_ratio_on_issue_date` | The Index Ratio on the issue date |
| `adj_accrued_int` | The accrued interest after the Index Ratio applies, per the face amount `accrued_int_per_amount` |
