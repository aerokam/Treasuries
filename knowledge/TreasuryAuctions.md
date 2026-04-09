# TreasuryAuctions (App Overview)

**TreasuryAuctions** is a tool for monitoring and analyzing U.S. Treasury auction results (Bills, Notes, Bonds, and TIPS). It provides historical data and real-time updates on upcoming issuances.

---

## 1.0 App Context (Level 1 DFD)

```mermaid
graph LR
    %% Data Stores (S)
    S5[(S5 Auctions.csv)]
    E3[E3 FiscalData API]

    %% Processes (P)
    P1((1.0 Auction Search))
    P2((2.0 Historical Trends))
    P3((3.0 Interactive Filters))

    %% User (E)
    U[User / Investor]

    %% Inbound Data
    S5 --> P1
    E3 -->|Live Fetch| P1
    
    %% Internal Flows
    P1 --> P2
    P2 --> P3
    
    %% User Interaction
    U <-->|Search / Filter| P3

    %% Links to Specs
    click P1 "#/md/TreasuryAuctions/knowledge/Data_Pipeline.md" "View Data Logic"
    click S5 "#/md/knowledge/DataStores.md#s5" "View Schema"
```

---

## 2.0 Core Processes

### [1.0 Auction Search](../TreasuryAuctions/knowledge/Data_Pipeline.md)
Retrieves auction results from both the local `Auctions.csv` database and the live FiscalData API.
- **Goal**: Enable exploration of historical auction performance (e.g., high yields, bid-to-cover ratios).
- **Sources**: FiscalData (accounting/od/auctions_query).

---

## 3.0 Foundational Logic (The Engine Room)

- **[Auctions Query Reference](../../knowledge/AuctionsQuery_Reference.md)**: Technical guide to the FiscalData API fields and query logic.
- **[Data Pipeline](../../knowledge/Data_Pipeline.md)**: Details on the local **Auction Refresh** job that maintains the historical database.
