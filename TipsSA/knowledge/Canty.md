# Seasonally Adjusted Prices for Inflation-Linked Bonds
**Author:** Paul Canty (Risk January 2009)

## Overview
This paper proposes a method for calculating the **Seasonally Adjusted Clean Price (SACP)** of inflation-linked bonds (ILBs) to isolate and remove the effects of seasonality and short-term carry. This allows for a clearer view of the underlying inflationary trend (Breakeven Inflation).

## Key Concepts
- **Seasonality**: Periodic and recurrent influences (e.g., clothing, energy) that affect CPI.
- **Carry**: The difference between the forward rate and the spot rate.
- **Decomposition**: The inflation index $I_t$ is decomposed into a trend component $T_t$ and a seasonal component $S_t$:
  $$I_t = T_t \cdot S_t$$

## Core Formulas (Annual Coupons)
The relationship between the quoted Clean Price ($CP$) and the Seasonally Adjusted Clean Price ($SACP$) for a bond with settlement date $Settle$ and maturity date $Maturity$:

### Exact Relationship (Equation 13)
$$SACP = CP \frac{S_{Settle}}{S_{Maturity}} + RAI \left( \frac{S_{Settle}}{S_{Maturity}} - 1 \right)$$
*Where $RAI$ is the Real Accrued Interest.*

### Approximation (Equation 14)
When $RAI$ is small relative to $CP$:
$$SACP \approx CP \frac{S_{Settle}}{S_{Maturity}}$$

## Semiannual Coupons (Equation 17)
For bonds like US TIPS, the SACP is a weighted average based on the two seasonal factors ($S_1, S_2$) of the coupon payment months:
$$SACP = CP \frac{w_1 \frac{S_{Settle}}{S_1} + w_2 \frac{S_{Settle}}{S_2}}{w_1 + w_2}$$
*Weights $w_1, w_2$ are the approximate contributions to the clean price from each coupon cycle.*

## Fully Adjusted Clean Price (FACP)
To account for one-off shocks (outliers $O_t$), the index is decomposed as $I_t = T_t S_t O_t$:
$$FACP = CP \frac{S_{Settle}}{S_{Maturity}} \frac{1}{O_{Maturity}}$$

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
