# Spot Curve Verification

**Evidence for:** [3.4 Fit spot yield curves](./3.4_Fit_Spot_Yield_Curves.md)

The TIPS spot curve of [3.4](./3.4_Fit_Spot_Yield_Curves.md) compared with the Gürkaynak-Sack-Wright fitted TIPS curve ([GSW curve parameters (S12)](../../knowledge/DATA_DICTIONARY.md#s12)), 2026-09-02, against the GSW curve of 2026-08-28.

## Results

- **The decay parameters are not stable when fitted.** With both decay parameters free (a grid search and Gauss-Newton on the four `β`, the fit 3.4 specifies), the Svensson parameters are not uniquely identified. A small change in the bond set moves the curve by ±5 to 8 bp against GSW at different maturities.
- **Fixing the decay parameters removes the instability.** With the two decay parameters fixed at GSW's published values and only the four linear `β` refitted, the fit is a stable ordinary-least-squares solution, and the residual against GSW collapses to a flat level offset. The fit then tracks GSW within about 2 bp from 5 to 20 years, and by more at 2 to 3 years, where TIPS are seasonal and both curves are least reliable. This fit is not implemented.
- **The FedInvest fit is about 2 bp above the market-quote fit** at every maturity. FedInvest's Buy price, used for nearly every security, is a midpoint of dealer bid and ask and lies below a market ask price, so its yield is higher ([Visual Standards](./Visual_Standards.md)). The market-quote (ask) fit is the one closest to GSW.
