# Portal Primer (App Overview)

**Portal Primer** is a guided walkthrough of the portal, app by app, with the Treasury and TIPS terminology behind each screen, as a deck of pages with three calculators that run on live data.

---

## Data flow diagram

Portal Primer is process 10 on [Level 1](/knowledge/DFD_LEVEL1), and [Level 2](/knowledge/DFD_LEVEL2_PRIMER) draws its four processes. It reads [FedInvest prices (S1)](./DATA_DICTIONARY.md#s1), [TIPS reference data (S2)](./DATA_DICTIONARY.md#s2) and [Ref CPI (S3)](./DATA_DICTIONARY.md#s3) from R2, and its own deck content.

## Specs

| Spec | What it specifies |
|---|---|
| [1.0 Primer](../Primer/knowledge/1.0_Primer.md) | What the pages say. |
| [10.1 Load deck](../Primer/knowledge/10.1_Load_Deck.md) | The syntax of the deck file and its parse into pages. |
| [10.2 Load market data](../Primer/knowledge/10.2_Load_Market_Data.md) | The stores read and the featured TIPS and note. |
| [10.3 Run calculators](../Primer/knowledge/10.3_Run_Calculators.md) | The three calculators. |
| [10.4 Render deck pages](../Primer/knowledge/10.4_Render_Deck_Pages.md) | The pages, the table of contents and the navigation. |
