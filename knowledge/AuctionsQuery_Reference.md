# FiscalData auctions_query Reference

**Endpoint:** `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query` of [FiscalData (E3)](./DATA_DICTIONARY.md#e3). It requires no authentication. Every value is returned as a string, and a missing value is the string `null`.

[Fetch auction results (1.4)](./1.4_Fetch_Auction_Results.md) reads it, and [Auction results (S5)](./DATA_DICTIONARY.md#s5) holds what it returns. Measured 2026-10-17, the endpoint states 114 fields and S5 has the same 114 columns.

---

## Query Parameters

| Parameter | Example | Behavior |
|---|---|---|
| `fields` | `fields=cusip,auction_date,security_type` | Comma-separated. Omitted, every field is returned. A `sort` or `filter` field must be among the `fields`, or the request fails with `Field '...' does not exist`. |
| `filter` | `filter=security_type:eq:Bill,reopening:eq:No` | Comma-separated conditions, all of which must hold. |
| `sort` | `sort=-auction_date` | A `-` prefix sorts descending. |
| `format` | `format=csv` | `json` (the default), `csv` or `xml`. |
| `page[number]` | `page[number]=1` | Starts at 1. |
| `page[size]` | `page[size]=10000` | 100 rows when omitted. A value above 10000 returns HTTP 400 (`Invalid Query Param`), so a larger result is read by increasing `page[number]`. |

## Filter Operators

- Supported: `eq`, `lt`, `lte`, `gt`, `gte` and `in`, with `in` taking `(val1,val2)`.
- Not supported: `neq` and `nin` return HTTP 400.
- Write a date as `YYYY-MM-DD`: `auction_date:gte:2024-01-01`.

## TIPS

- `security_type:eq:TIPS` returns no rows, because FiscalData states a TIPS as `Note` or `Bond`.
- Select TIPS with `inflation_index_security:eq:Yes`.

## `security_type` and `security_term`

| `security_type` | Typical `security_term` values |
|---|---|
| `Bill` | `4-Week`, `8-Week`, `13-Week`, `17-Week`, `26-Week`, `52-Week` |
| `Note` | `2-Year`, `3-Year`, `5-Year`, `7-Year`, `10-Year` |
| `Bond` | `20-Year`, `30-Year` |

A reopening states its remaining term in `security_term` (`9-Year 10-Month` for a reopened 10-Year TIPS) and the term it was issued with in `original_security_term`.

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
| `inflation_index_security` | `Yes` for a TIPS, `No` otherwise |

### Dates
| Field | Meaning |
|---|---|
| `announcemt_date` | The announcement date |
| `auction_date` | The auction date |
| `issue_date` | The date the security is issued |
| `maturity_date` | The [Maturity Date](./DATA_DICTIONARY.md#maturity-date) |
| `dated_date` | The [Dated Date](./DATA_DICTIONARY.md#dated-date) |
| `original_issue_date` | The issue date of the original issue of a reopening |

### Price and Rate
| Field | Meaning |
|---|---|
| `int_rate` | The [Coupon Rate](./DATA_DICTIONARY.md#coupon-rate) of a Note, Bond or TIPS |
| `high_yield` | The high [Yield](./DATA_DICTIONARY.md#yield) of a Note, Bond or TIPS |
| `high_investment_rate` | The high investment rate of a Bill |
| `high_price` | The high [Price](./DATA_DICTIONARY.md#price) |
| `accrued_int_per1000` | The accrued interest per $1,000 |

### Size and Demand
| Field | Meaning |
|---|---|
| `offering_amt` | The amount offered, in dollars |
| `comp_accepted` | The competitive bids accepted |
| `total_accepted` | The total accepted |
| `total_tendered` | The total tendered |
| `bid_to_cover_ratio` | The bid-to-cover ratio |
| `primary_dealer_accepted` | The amount accepted from primary dealers |
| `direct_bidder_accepted` | The amount accepted from direct bidders |
| `indirect_bidder_accepted` | The amount accepted from indirect bidders |

### TIPS Only
| Field | Meaning |
|---|---|
| `unadj_price` | The price before the [Index Ratio](./DATA_DICTIONARY.md#index-ratio) applies |
| `adj_price` | The [Adjusted Price](./DATA_DICTIONARY.md#adjusted-price) |
| `ref_cpi_on_dated_date` | The [Ref CPI](./DATA_DICTIONARY.md#ref-cpi) on the Dated Date |
| `ref_cpi_on_issue_date` | The Ref CPI on the issue date |
| `index_ratio_on_issue_date` | The Index Ratio on the issue date |
| `adj_accrued_int_per1000` | The accrued interest per $1,000 after the Index Ratio applies |
