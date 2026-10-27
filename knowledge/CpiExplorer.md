# CPI Explorer (App Overview)

**CPI Explorer** charts U.S. Consumer Price Index data from three series: the monthly [CPI-U NSA](./DATA_DICTIONARY.md#cpi-nsa), the monthly [CPI-U SA](./DATA_DICTIONARY.md#cpi-sa) and the daily [Ref CPI](./DATA_DICTIONARY.md#ref-cpi). The user selects any combination of the series to overlay on one chart, one of five display modes, and a date range. A logarithmic vertical axis is available for the index level.

---

## Data flow diagram

CPI Explorer is process 7 on [Level 1](/knowledge/DFD_LEVEL1), and [Level 2](/knowledge/DFD_LEVEL2_CPIEXPLORER) draws its three processes. It reads [CPI history (S8)](./DATA_DICTIONARY.md#s8) and [Ref CPI (S3)](./DATA_DICTIONARY.md#s3) from R2 when the page opens. [Fetch CPI history (1.12)](./1.12_Fetch_CPI_History.md) writes S8 and [Fetch daily Ref CPI (1.13)](./1.13_Fetch_Daily_Ref_CPI.md) writes S3.

## Specs

| Spec | What it specifies |
|---|---|
| [7.1 Load CPI data](../CpiExplorer/knowledge/7.1_Load_CPI_Data.md) | Loading and parsing the two stores. |
| [7.2 Calculate CPI series](../CpiExplorer/knowledge/7.2_Calculate_CPI_Series.md) | The five calculations. |
| [7.3 Render CPI chart](../CpiExplorer/knowledge/7.3_Render_CPI_Chart.md) | The controls, the rendering and the chart. |
