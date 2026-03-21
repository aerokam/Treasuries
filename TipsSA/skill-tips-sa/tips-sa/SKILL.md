# TIPS Seasonal Adjustments (TipsSA)

This skill provides expertise in analyzing and applying seasonal factors to Treasury Inflation-Protected Securities (TIPS), primarily based on the methodology by Paul Canty.

## Workflow: Applying Seasonal Factors

1.  **Identify Reference Date ($t$):** Use the settlement date for the trade.
2.  **Calculate Interpolated Seasonal Factor ($S_t$):**
    *   TIPS use a 3-month lag for the Reference CPI.
    *   Formula: $S_t = S_{m-3} + \frac{d-1}{D} (S_{m-2} - S_{m-3})$
    *   $d$: Day of the month. $D$: Total days in month.
3.  **Adjust the Index Ratio ($IR_t$):**
    *   $IR_t^{SA} = \frac{IR_t}{S_t}$
4.  **Adjust the Price:**
    *   $Price_{dirty}^{SA} = \frac{Price_{dirty}}{S_t}$

## Key Mathematical Constants

*   **Additive vs Multiplicative:** Ensure factors are applied correctly. Multiplicative factors ($s_m$) should product to 1 over a year; additive factors ($\sigma_m$) should sum to 0.
*   **3-Month Lag:** Crucial for TIPS. The seasonal factor for January $(m=1)$ impacts the April Reference CPI.

## Domain Expertise: The Canty Method

Use the Paul Canty (2009) "saw-tooth" analysis to identify cheap/rich TIPS based on their maturity month.
*   **Spring maturities** (higher inflation months) typically have higher carry.
*   **Autumn maturities** (lower inflation months) have lower carry.
*   Seasonality-adjusted yields ($Yield^{SA}$) allow for a "fair" comparison across the curve.

## Reference Material
*   See `references/canty_paper.md` for the full algorithmic summary.
*   See `references/bond_math.md` for core spreadsheet formulas (PV, Duration, Yield).
