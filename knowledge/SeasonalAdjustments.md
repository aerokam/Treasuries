# Seasonal Adjustments (App Overview)

**Seasonal Adjustments** presents the seasonal adjustment of TIPS yields as a sequence of full-page annotated charts, drawn from a frozen snapshot of market quotes and Ref CPI.

---

## Data flow diagram

Seasonal Adjustments is process 11 on [Level 1](/knowledge/DFD_LEVEL1), and [Level 2](/knowledge/DFD_LEVEL2_SEASONALADJUSTMENTS) draws its two processes. It reads no R2 store: it reads two snapshot files kept in the app, copies of [SA and SAO yields (S10)](./DATA_DICTIONARY.md#s10) and [Ref CPI NSA and SA (S4)](./DATA_DICTIONARY.md#s4).

## Specs

| Spec | What it specifies |
|---|---|
| [1.0 Seasonal Adjustments Explorer](../SeasonalAdjustments/knowledge/1.0_SeasonalAdjustments_Explorer.md) | What each page shows. |
| [11.1 Load snapshot](../SeasonalAdjustments/knowledge/11.1_Load_Snapshot.md) | The two snapshot files and the seasonal wave. |
| [11.2 Render pages](../SeasonalAdjustments/knowledge/11.2_Render_Pages.md) | How a page is drawn, and the navigation. |
