# Knowledge Base Verification Suite (Manual)

Follow these steps to verify that the navigation, rendering and drill-down features of the knowledge map are working correctly. The automated checks are in `knowledge/tests/UI/knowledge.spec.js` (`npm run test:UI:KnowledgeMap`).

## 1. Context Diagram & Top-Level Navigation
- [ ] Open `http://localhost:8080/knowledge/DFD_LEVEL0`.
- [ ] **Top Header**: Verify the only link above the diagram is the **Portal** back link. Everything else is reached by drilling into the diagram, or from the Spec Index below it.
- [ ] **Diagram Shape**: Verify one process circle, **0 Treasury Investors Portal**, with the fourteen external entities and the **User** around it. Every flow arrow carries a label, and no data store is drawn at this level.
- [ ] **Spec Index**: Click **TipsLadderManager**.
    - *Expected*: Opens the rendered overview in the viewer.
- [ ] **Back Navigation**: From inside the viewer, click **← KNOWLEDGE MAP**.
    - *Expected*: Returns to `/knowledge/DFD_LEVEL0` (the full visual map). The viewer should not attempt to render an HTML file — if the guard trips, it redirects automatically.
- [ ] **Spec Index**: Click **Data Stores**.
    - *Expected*: Opens `DATA_DICTIONARY.md` at §2.0 Data Stores in the viewer.
- [ ] **Source Drilling**: Click **FedInvest** in the map.
    - *Expected*: Opens `DATA_DICTIONARY.md` at the E1 schema section, which states the `Prices For:` date and the eight columns of the price table.
- [ ] **Process Drilling**: Click the **0 Treasury Investors Portal** circle.
    - *Expected*: Opens the Level 1 diagram (`DFD_LEVEL1.html`).

## 2. Document Drill-Down (Inside Apps)
- [ ] From Level 1, click the **4 Ladder Manager** circle.
    - *Expected*: Opens the Level 2 diagram of TipsLadderManager.
- [ ] **Process**: Click a process circle.
    - *Expected*: Opens the rendered spec of that process.
- [ ] **Store**: Click a data store in the diagram.
    - *Expected*: Navigates to `DATA_DICTIONARY.md` and scrolls to the entry of that store. **NO RAW MD SHOULD BE VISIBLE.**

## 3. Data Inspection (CSV Previews)
- [ ] Open **Data Stores** from the Spec Index of the Map.
- [ ] **Preview Toggle**: Click **View Preview** in the entry of `YieldsFromFedInvestPrices.csv`.
    - *Expected*: A table with the first 10 rows appears.
- [ ] **Toggle Off**: Click the **View Preview** link again.
    - *Expected*: The table disappears.

## 4. Anchor Handling (Inside YieldCurves)
- [ ] Open the **YieldCurves** overview from the Spec Index.
- [ ] **Process Click**: Click **Adjust for seasonality** in the Process specs table.
    - *Expected*: Navigates to the detailed `3.2_Adjust_For_Seasonality.md` document.

## 5. Ingestion Pipeline
- [ ] Open **Data Pipeline** from the Spec Index.
- [ ] **Ownership**: Verify that §2.0 lists the ingestion jobs as `[LOCAL]` Windows tasks and names no other scheduler.
- [ ] **Fidelity Status**: Verify the Fidelity quotes appear as local Windows tasks.
