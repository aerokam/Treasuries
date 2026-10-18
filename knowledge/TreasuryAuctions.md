# Treasury Auctions (App Overview)

**Treasury Auctions** lists the results of every U.S. Treasury auction held since 1980 (Bills, Notes, Bonds and TIPS), the auctions FiscalData has announced, and Treasury's tentative auction schedule. Each list has its own tab, and the Historical Auctions tab filters, sorts and reorders its columns like a spreadsheet.

---

## Data flow diagram

Treasury Auctions is process 5 on [Level 1](/knowledge/DFD_LEVEL1). It reads [Auction results (S5)](./DATA_DICTIONARY.md#s5) and [Tentative auction schedule (S9)](./DATA_DICTIONARY.md#s9) from R2, and [Upcoming Auctions](./DATA_DICTIONARY.md#upcoming-auctions) from [FiscalData (E3)](./DATA_DICTIONARY.md#e3) directly.

## Specs

| Spec | What it specifies |
|---|---|
| [Data and Views](../TreasuryAuctions/knowledge/Data_And_Views.md) | What the page loads and the rows and columns of each tab, including how an upcoming auction is flagged TIPS. |
| [Filtering and Columns](../TreasuryAuctions/knowledge/1.0_Filtering_And_Columns.md) | Column formats, typed filters, calendar date ranges, sorting, the column chooser and column widths. |

## Reference specs

- [FiscalData auctions_query Reference](./AuctionsQuery_Reference.md): the query parameters, operators and fields of the endpoint that [Fetch auction results (1.4)](./1.4_Fetch_Auction_Results.md) reads.
