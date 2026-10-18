# Data and Views

**Implemented by:** `TreasuryAuctions/src/app.js` (`loadData`, `renderTable`, `renderBody`, `renderUpcoming`, `renderTentative`), `TreasuryAuctions/index.html`

Load the auction results, the upcoming auctions and the tentative schedule, and draw each in its own tab. How the tables filter, sort and format is specified in [Filtering and Columns](./1.0_Filtering_And_Columns.md).

<a id="load"></a>
## Load

When the page opens and when the user clicks Refresh:

- Fetch three sources in parallel, each with the browser cache bypassed:
  - [Auction results (S5)](../../knowledge/DATA_DICTIONARY.md#s5), from its public R2 URL.
  - [Upcoming Auctions](../../knowledge/DATA_DICTIONARY.md#upcoming-auctions), from the `upcoming_auctions` endpoint of [FiscalData (E3)](../../knowledge/DATA_DICTIONARY.md#e3): the fields `cusip`, `announcemt_date`, `auction_date`, `issue_date`, `security_term`, `security_type` and `reopening`, for `auction_date` on or after the current UTC date, sorted by `announcemt_date` and then `auction_date`.
  - [Tentative auction schedule (S9)](../../knowledge/DATA_DICTIONARY.md#s9), from its public R2 URL.
- Read each `AuctionCalendarDate` node of S9 as one schedule row:
  - Keep `AuctionDate`, `SecurityTermWeekYear`, `SecurityType`, `AnnouncementDate` and `SettlementDate` as stated.
  - Set Reopen, TIPS and the floating rate flag to "Yes" where `ReOpeningIndicator`, `TIPS` or `FloatingRate` is `Y`, and to "No" otherwise.
  - Drop a node with a blank `AuctionDate`.
  - Sort the rows by auction date, ascending. A parse error leaves the schedule empty.
- Read S5 under its header row, so the columns of the Historical Auctions tab are the columns of S5.
- Draw the Historical Auctions tab, then the Upcoming Auctions tab.
- When S5 does not load, show the status "Failed to load auction data: " and the reason, and draw nothing further.
- When the upcoming auctions do not load, the Upcoming Auctions tab reads "No upcoming auction data available."; when they load with no rows it reads "No upcoming auctions found."
- When S9 does not load or has no rows, the Tentative Schedule tab reads "No tentative schedule data available." and the schedule flags no upcoming auction as TIPS.
- Show the status "Updated: " and the local time when the load completes.
- State the row count of the active tab in the tab bar. A load or a filter change on another tab leaves it unchanged.

<a id="historical-auctions"></a>
## Historical Auctions

- Show the rows of S5 in the order the file states, newest auction date first, for the view the user selects in the sidebar:

  | View | Rows shown | Columns shown by default |
  |---|---|---|
  | All | every row | `cusip`, `security_type`, `inflation_index_security`, `security_term`, `original_security_term`, `maturity_date`, `auction_date`, `issue_date`, `high_yield`, `int_rate`, `high_investment_rate`, `high_price` |
  | Bills | `security_type` is `Bill` | `cusip`, `security_term`, `original_security_term`, `maturity_date`, `auction_date`, `issue_date`, `high_investment_rate`, `high_price` |
  | Notes & Bonds | `security_type` is not `Bill` and `inflation_index_security` is not `Yes` | `cusip`, `security_term`, `original_security_term`, `maturity_date`, `auction_date`, `issue_date`, `high_yield`, `int_rate`, `high_price`, `inflation_index_security` |
  | TIPS | `inflation_index_security` is `Yes` | `cusip`, `security_term`, `original_security_term`, `maturity_date`, `auction_date`, `issue_date`, `dated_date`, `high_yield`, `int_rate`, `unadj_price`, `index_ratio_on_issue_date`, `adj_price`, `ref_cpi_on_dated_date`, `ref_cpi_on_issue_date` |

- Apply the calendar date ranges and the typed column filters of [Filtering and Columns](./1.0_Filtering_And_Columns.md) to those rows, then the sort.
- Cap the table at the first 100 rows, and state "Showing 100 of " the row count " rows — use date range to see more" in the tab bar, when the view is not TIPS and no calendar date range is set. The cap counts the rows left after the typed filters.
- Show every row, and state the row count followed by " rows", for the TIPS view or when any calendar date range is set.
- Alternate the row shading at each change of auction date.
- Keep the two header rows and the first column in place while the table scrolls.
- Clear the typed filters, the sort and the calendar date ranges when the user selects a view. Each view keeps its visible columns and their order until the page reloads.

<a id="upcoming-auctions"></a>
## Upcoming Auctions

- Show one row for each upcoming auction, in the order the feed states, with the columns CUSIP, Announced, Auction Date, Issue Date, Term, Type, Reopen and TIPS. Show the dates as mm/dd/yyyy. This tab has no filter row and no sort.
- State the number of rows followed by " upcoming auctions" in the tab bar. The message rows of [Load](#load) are not counted.
- Set TIPS to "Yes", in bold green, when any of these holds, and to "No" otherwise:
  - The Type contains the text "TIPS", in any case.
  - S9 has a row with the same auction date and the same Term, in any case, whose TIPS flag is "Yes".
  - The CUSIP is the CUSIP of an S5 row whose `inflation_index_security` is `Yes`. This identifies a reopened TIPS, which FiscalData states with its remaining term (9-Year 10-Month for a reopened 10-Year TIPS) and which the Term of S9 does not match. Measured 2026-10-17, all 160 reopened TIPS auctions in S5 carry the CUSIP of an earlier TIPS auction.

<a id="tentative-schedule"></a>
## Tentative Schedule

- Show the rows of S9 whose floating rate flag is "No", in auction date order, with the columns Auction Date, Term, Type, Reopen, TIPS, Announcement Date and Settlement Date. Show the three dates as mm/dd/yyyy. The Type is the `SecurityType` S9 states.
- Show a TIPS flag of "Yes" in bold green.
- Alternate the row shading at each change of auction date.
- Apply the typed column filters and the sort of [Filtering and Columns](./1.0_Filtering_And_Columns.md).
- Leave the row count of the tab bar blank.
