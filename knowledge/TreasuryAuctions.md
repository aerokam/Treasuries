# Treasury Auctions (App Overview)

**Treasury Auctions** lists the results of every U.S. Treasury auction held since 1980 (Bills, Notes, Bonds and TIPS), the auctions FiscalData has announced, and Treasury's tentative auction schedule. Each list has its own tab, and the Historical Auctions tab filters, sorts and reorders its columns like a spreadsheet.

---

## Data flow diagram

Treasury Auctions is process 5 on [Level 1](/knowledge/DFD_LEVEL1), and [Level 2](/knowledge/DFD_LEVEL2_TREASURYAUCTIONS) draws its four processes. It reads [Auction results (S5)](./DATA_DICTIONARY.md#s5) and [Tentative auction schedule (S9)](./DATA_DICTIONARY.md#s9) from R2, and [Upcoming Auctions](./DATA_DICTIONARY.md#upcoming-auctions) from [FiscalData (E3)](./DATA_DICTIONARY.md#e3) directly.

## Specs

| Spec | What it specifies |
|---|---|
| [5.1 Load auction data](../TreasuryAuctions/knowledge/5.1_Load_Auction_Data.md) | What the page fetches and passes on, and the status it shows. |
| [5.2 Render Historical Auctions](../TreasuryAuctions/knowledge/5.2_Render_Historical_Auctions.md) | The views, their rows and default columns, and the row cap. |
| [5.3 Render Upcoming Auctions](../TreasuryAuctions/knowledge/5.3_Render_Upcoming_Auctions.md) | The rows and columns of the tab, including how an upcoming auction is flagged TIPS. |
| [5.4 Render Tentative Schedule](../TreasuryAuctions/knowledge/5.4_Render_Tentative_Schedule.md) | The rows and columns of the tab. |
| [Filtering and Columns](../TreasuryAuctions/knowledge/Filtering_And_Columns.md) | Column formats, typed filters, calendar date ranges, sorting, the column chooser and column widths. |

## Reference specs

- [FiscalData auctions_query Reference](./AuctionsQuery_Reference.md): the query parameters, operators and fields of the endpoint that [Fetch auction results (1.4)](./1.4_Fetch_Auction_Results.md) reads.
