# Fund Holdings (App Overview)

**Fund Holdings** shows the holdings of eight Treasury and TIPS funds, one tab for each fund, by CUSIP, with each holding's yield, term and duration and the fund's weighted averages.

---

## Data flow diagram

Fund Holdings is process 9 on [Level 1](/knowledge/DFD_LEVEL1), and [Level 2](/knowledge/DFD_LEVEL2_FUNDHOLDINGS) draws its two processes. It reads [Fund holdings (S11)](./DATA_DICTIONARY.md#s11) from R2. [Enrich fund holdings (1.14)](./1.14_Enrich_Fund_Holdings.md) writes it.

## Specs

| Spec | What it specifies |
|---|---|
| [9.1 Load fund holdings](../FundHoldings/knowledge/9.1_Load_Fund_Holdings.md) | The tabs, the file each loads and the line stated above the table. |
| [9.2 Render fund holdings](../FundHoldings/knowledge/9.2_Render_Fund_Holdings.md) | The columns, cell formats, footer, sort and column widths. |
