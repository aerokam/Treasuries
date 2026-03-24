# Seasonally Adjusted Prices for Inflation-Linked Bonds
**Author:** Paul Canty (Risk January 2009)

## Overview
This paper proposes a method for calculating the **Seasonally Adjusted Clean Price (SACP)** and **Fully Adjusted Clean Price (FACP)** of inflation-linked bonds (ILBs). The goal is to isolate and remove the effects of seasonality, short-term carry, and one-off shocks (outliers) to expose the underlying inflationary trend (Breakeven Inflation).

## Key Concepts
- **Seasonality ($S_t$)**: Periodic and recurrent influences (e.g., clothing, energy) that affect CPI.
- **Carry**: The difference between the forward rate and the spot rate, often driven by the indexation lag.
- **Outliers ($O_t$)**: Expected future one-off shocks (e.g., VAT changes, gasoline price volatility) that diverge from the seasonal trend.
- **Decomposition**: The inflation index $I_t$ is decomposed as:
  $$I_t = T_t \cdot S_t \cdot O_t$$
  Where $T_t$ is the trend component.

## Core Formulas (Annual Coupons)
The relationship between the quoted Clean Price ($CP$) and the Seasonally Adjusted Clean Price ($SACP$):

### Exact Relationship (Equation 13)
$$SACP = CP \frac{S_{Settle}}{S_{Maturity}} + RAI \left( \frac{S_{Settle}}{S_{Maturity}} - 1 \right)$$
*Where $RAI$ is the Real Accrued Interest.*

### Approximation (Equation 14)
When $RAI$ is small relative to $CP$ (typical for TIPS):
$$SACP \approx CP \frac{S_{Settle}}{S_{Maturity}}$$

## Fully Adjusted Clean Price (FACP) & Outliers
The **Outlier Index ($O_t$)** captures known or expected shocks. For example, in the TIPS market, gasoline price volatility since the last CPI release can be treated as an outlier.

### FACP Definition (Equation 21)
To strip out both seasonality and one-off outliers:
$$FACP = CP \frac{S_{Settle}}{S_{Maturity}} \frac{1}{O_{Maturity}}$$
This provides the most accurate "trend" price for relative value analysis.

## Seasonally Adjusted Forward Prices
The inflation protection in ILBs contains known, historical inflation due to the **indexation lag** (3 months for Canadian-style/TIPS). To strip out "carry," one must consider forward-looking breakeven rates starting from the last known index publication.

- **Forward Period**: Between $t_{Settle-lag}$ and $t_{Settle}$.
- **Method**: Calculate the forward price up to the furthest known settlement date given the latest CPI release. This excludes the "known" inflation from the valuation.

## Semiannual Coupons (Equation 17)
For bonds like US TIPS, the SACP is a weighted average based on the two seasonal factors ($S_1, S_2$) of the coupon payment months:
$$SACP = CP \left( \frac{w_1 \frac{S_{Settle}}{S_1} + w_2 \frac{S_{Settle}}{S_2}}{w_1 + w_2} \right)$$
*Weights $w_1, w_2$ are the real discount factors implied by the bond's real yield ($RY$):*
$$w_i = \sum \frac{C_i}{(1 + RY)^{t_i}}$$

## Appendix A: Forward Index & Interpolation
### Forward Index Calculation
For a base date $t$ and forward date $T$:
$$I_T = I_t \frac{S_T}{S_t} \exp(r_{t,T}(T - t))$$
Where $r_{t,T}$ is the continuously compounded trend rate of growth.

### Interpolated Lag (TIPS/Canadian-style)
$$I_{Interp} = I_1 + w(I_2 - I_1)$$
Where $w = 1 - (d_1 - 1)/d_2$, $d_1$ is the day of the month of settlement, and $d_2$ is the days in the month.
Canty suggests the approximation $I_{Interp} \approx T_{Interp} S_{Interp}$ is sufficient as cross terms are negligible.

## Example Seasonal Factors (Table B)
| Month | Multiplicative Factor | Additive (%) |
| :--- | :--- | :--- |
| January | 0.996 | -0.5 |
| February | 0.996 | 0.0 |
| March | 1.001 | 0.5 |
| April | 1.003 | 0.2 |
| May | 1.003 | 0.0 |
| June | 1.004 | 0.1 |
| July | 1.000 | -0.4 |
| August | 0.999 | -0.1 |
| September | 1.000 | 0.1 |
| October | 1.000 | 0.0 |
| November | 0.999 | -0.1 |
| December | 1.001 | 0.2 |
