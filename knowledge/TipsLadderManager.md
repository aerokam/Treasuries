# TipsLadderManager (App Overview)

**TipsLadderManager** is a browser-based tool for designing and rebalancing [TIPS Ladders](./DATA_DICTIONARY.md#tips-ladder). It serves as a practical utility and as an educational resource: every number on screen traces to a calculation chain.

---

## Data flow diagram

Ladder Manager is process 4 on [Level 1](/knowledge/DFD_LEVEL1). Its [Level 2 diagram](/knowledge/DFD_LEVEL2_TIPSLADDERMANAGER) shows the five processes below, the data stores process 4.1 reads and the flows between them.

## Process specs

| Process | Spec | What it does |
|---|---|---|
| 4.1 | [Load market data](../TipsLadderManager/knowledge/4.1_Load_Market_Data.md) | Reads the market quotes, the TIPS reference data, the Ref CPI, the SA and SAO yields and the Bond Holidays, and sets the [Settlement Date](./DATA_DICTIONARY.md#settlement-date). |
| 4.2 | [Import holdings and DARA plan](../TipsLadderManager/knowledge/4.2_Import_Holdings_And_DARA_Plan.md) | Reads the [Holdings File](./DATA_DICTIONARY.md#holdings-file) and the [DARA Plan File](./DATA_DICTIONARY.md#dara-plan-file) that the Import menu offers. |
| 4.3 | [Build ladder](../TipsLadderManager/knowledge/4.3_Build_Ladder.md) | Builds a TIPS Ladder from a [DARA](./DATA_DICTIONARY.md#dara), a First Year and a Last Year. |
| 4.4 | [Rebalance ladder](../TipsLadderManager/knowledge/4.4_Rebalance_Ladder.md) | Computes the trades that bring the holdings to the ladder, as [TIPS Ladder Rebalancing (3.0)](../TipsLadderManager/knowledge/3.0_TIPS_Ladder_Rebalancing.md) states. There is one rebalance. |
| 4.5 | [Render and export](../TipsLadderManager/knowledge/5.0_UI_Schema.md) | Draws the build and rebalance results, with the popups of [UI Layout (6.0)](../TipsLadderManager/knowledge/6.0_UI_Layout.md); [Export (2.1)](../TipsLadderManager/knowledge/2.1_Export.md) specifies the Export menu. |

## Foundations

- [Bond Ladders (1.0)](../TipsLadderManager/knowledge/1.0_Bond_Ladders.md): the concepts of any ladder, nominal or TIPS.
- [TIPS Ladders (2.0)](../TipsLadderManager/knowledge/2.0_TIPS_Ladders.md): Build, with the Gap Years and the Future 30Y years.
- [Computation Modules (4.0)](../TipsLadderManager/knowledge/4.0_Computation_Modules.md): the functions the processes call.
- [Data Pipeline (3.1)](../TipsLadderManager/knowledge/3.1_Data_Pipeline.md): the sources `loadMarketData()` chooses between.
- [Bond Basics](./Bond_Basics.md) and [TIPS Basics](./TIPS_Basics.md): the formulas shared by every app.

The app keeps no holdings in the browser. The files that the Export menu writes carry the holdings and the DARA Plan between sessions.
