# TipsLadderManager (App Overview)

**TipsLadderManager** is a browser-based tool for designing and rebalancing TIPS (Treasury Inflation-Protected Securities) ladders. It serves as both a practical utility for wealth management and an educational resource for first-principles financial math.

---

## 1.0 App Context (Level 1 DFD)

*Superseded by the generated [Level 2 diagram](/knowledge/DFD_LEVEL2_TIPSLADDERMANAGER) — a draft, not yet a finished decomposition (see its own notes for the open questions). The Mermaid sketch this section used to carry was hand-drawn before that generator existed and had drifted from the code (e.g. it named the dormant FedInvest source as the only source, and showed no path for the app's default Market-quotes source); it is removed rather than fixed in place, since the generated diagram now owns this.*

---

## 2.0 Core Processes

### [1.0 Ladder Construction (Build Mode)](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md)
The algorithm for building a new ladder from scratch.
- **Inputs**: [DARA](./DATA_DICTIONARY.md#dara), First Year and Last Year, Current Market Yields.
- **Key Constraints**: Longest-to-shortest construction, [Gap Year](./DATA_DICTIONARY.md#gap-years) handling via [Bracket Years](./DATA_DICTIONARY.md#bracket-year).

### [2.0 Ladder Rebalancing (Rebalance Mode)](../TipsLadderManager/knowledge/3.0_TIPS_Ladder_Rebalancing.md)
The logic for aligning existing holdings to a target.
- **Inputs**: Current Holdings (Manual/Import), [DARA](./DATA_DICTIONARY.md#dara) (Inferred/User), [RefCPI](./DATA_DICTIONARY.md#ref-cpi).
- **There is a single rebalance mode**: it rebuilds the ladder from the current portfolio toward the per-year DARA targets, buying and selling as required. An earlier "Gap-only" (minimal-trades) mode was scrapped.
- **Technically Precise Algorithm**: [View 3.0 Specs](../TipsLadderManager/knowledge/3.0_TIPS_Ladder_Rebalancing.md).

### [3.0 Broker Data Ingestion](../TipsLadderManager/knowledge/2.1_Broker_Import.md)
Normalizes exported CSV data from brokers (Fidelity, Schwab) into the app's internal holding format.

---

## 3.0 Foundational Logic (The Engine Room)

These documents contain the "bottom-level" technical specifications required to rebuild the app:

- **[Bond Ladder Foundations (1.0)](../TipsLadderManager/knowledge/1.0_Bond_Ladders.md)**: Conceptual groundwork for any ladder (Nominal or TIPS).
- **[Computation Modules (4.0)](../TipsLadderManager/knowledge/4.0_Computation_Modules.md)**: Mathematical functions for PV, Duration, and Accrued Interest.
- **[UI & Schema (5.0)](../TipsLadderManager/knowledge/5.0_UI_Schema.md)**: Data structures for the internal ladder model and DOM mapping.
- **[Bond Math (shared)](./Bond_Basics.md)**: Global financial formulas used across all apps.

---

## 4.0 Data Lifecycle

TipsLadderManager fetches its market context from Cloudflare R2 on every page load.
- **[TIPS Data Pipeline (3.1)](../TipsLadderManager/knowledge/3.1_Data_Pipeline.md)**: Detailed specs for the ingestion of prices and metadata.
- **Source (default)**: `FidelityTreasuriesTips.csv`, broker market prices, updated several times per weekday.
- **Source (dormant cross-check)**: `YieldsFromFedInvestPrices.csv` (updated daily ~1 PM ET), not exposed in the app UI.
- **Source**: `RefCPI.csv` (updated monthly on BLS release).
- **Persistence**: User holdings are stored in browser `localStorage`.
