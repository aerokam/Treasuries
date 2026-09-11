# 1.1 Seasonal Factor Drift — Why S_maturity Loses Meaning at Long Horizons

**Evidence for:** [1.0 Seasonal Adjustments](./3.2_Seasonal_Adjustments.md)

**Status:** Research supporting the **S_maturity** input to the seasonal adjustment ([1.0 Seasonal Adjustments](3.2_Seasonal_Adjustments.md)). Same relation to 1.0 that [2.2 SAO Residual Analysis](SAO_Residual_Analysis.md) has to [2.0](3.3_SAO_Adjustment.md).
**Dependencies:** [1.0 Seasonal Adjustments](3.2_Seasonal_Adjustments.md), [Canty](Canty.md), [DATA_DICTIONARY.md#sa-factor](../../knowledge/DATA_DICTIONARY.md#sa-factor), [DATA_DICTIONARY.md#sa-price-factor](../../knowledge/DATA_DICTIONARY.md#sa-price-factor), [DATA_DICTIONARY.md#cpi-sa](../../knowledge/DATA_DICTIONARY.md#cpi-sa).
**Data snapshot:** FRED `CPIAUCNS` (NSA, 1913–) and `CPIAUCSL` (SA, 1947–), monthly, overlap 1947-01 … 2026-07 (954 months). Live [S1](../../knowledge/DataStores.md#s1) and [S4](../../knowledge/DataStores.md#s4), settlement 2026-09-08, 53 TIPS.

---

## 1. The question

The seasonal adjustment multiplies a TIPS clean price by `S_settle / S_maturity`, where `S_t = RefCPI_NSA(t) / RefCPI_SA(t)` is the seasonal factor for the calendar month and day of `t` ([1.0](3.2_Seasonal_Adjustments.md) Level 4). `S_settle` is a known recent daily value. `S_maturity` is not: the maturity date of a long TIPS lies beyond the published Ref CPI series, so `shared/src/ref-cpi.js#saFactorForDate` substitutes the most recent past occurrence of that month and day.

That substitution is Canty's simplifying assumption that the 12 monthly seasonal factors repeat unchanged every year ([Canty](Canty.md) §2, Appendix B; [DATA_DICTIONARY.md#sa-price-factor](../../knowledge/DATA_DICTIONARY.md#sa-price-factor)). This document measures how well the assumption holds as the maturity date moves further from the estimation window, and what the reported seasonal adjustment on long-dated TIPS actually rests on.

Two findings, one structural and one quantitative:

- **Structural (§4.1).** Every TIPS maturing in 2040 or later matures on February 15. The long-end seasonal adjustment is a single uniform shift of the whole long real-yield curve, keyed to one date's factor, with no maturity-month cross-section to corroborate it. This holds regardless of the drift numbers.
- **Quantitative (§4–§7).** Over 1947–2026 the RMS 30-year change in a monthly seasonal factor is about equal to the entire current seasonal amplitude. A credibility factor puts the Feb-15 factor at roughly half its face value by the 30-year point.

---

## 2. How BLS derives its seasonal factors

[1.0 §How BLS Derives the Seasonal Factors](3.2_Seasonal_Adjustments.md#bls-seasonal-factor-estimation) gives the mechanics: X-13ARIMA-SEATS with moving seasonal filters spanning about 5 to 11 years, re-estimated annually with the prior five years revised, and projected factors published one year forward only. The consequence this document measures: BLS provides a factor for the recent past and one year ahead, and no basis for projecting one decades out, so the substitution `saFactorForDate` makes for a distant maturity date is an extrapolation of the current pattern whose error grows with horizon.

---

## 3. Seasonal amplitude, and its own drift

The implied vintage seasonal multiplier is `f(t) = CPIAUCNS(t) / CPIAUCSL(t)`. Because BLS revises only five years, `f` for a month more than five years old is the seasonal estimate frozen at that vintage, which is the quantity needed to measure real change over time.

**Amplitude `A`** — the within-year spread of `f` across the 12 months, recent frozen years:

| Year | sd of `f` | peak-to-trough |
|---|---|---|
| 2015 | 0.296% | 0.933% |
| 2016 | 0.242% | 0.828% |
| 2017 | 0.253% | 0.841% |
| 2018 | 0.294% | 0.994% |
| 2019 | 0.294% | 1.005% |

Pooled 2015–2019: **sd ≈ 0.28% of price, mean peak-to-trough ≈ 0.92%**. On the interpolated daily factor `S` sampled monthly: sd ≈ 0.26%, peak-to-trough ≈ 0.80%.

**The amplitude has roughly tripled since the 1990s.** Within-year sd of `f`: 1990 0.11%, 1995 0.11%, 2000 0.17%, 2005 0.35%, 2010 0.31%, 2015 0.30%, 2020 0.29%. The seasonal pattern the current factors describe is not the pattern of 30 years ago.

---

## 4. Drift of a seasonal factor over a horizon

`sigma_drift(h)` = RMS of `[ f(M, Y+h) − f(M, Y) ]`, pooled over calendar months `M` and all base years `Y`, 1947–2026:

| h (years) | 1 | 2 | 3 | 5 | 10 | 15 | 20 | 25 | 30 |
|---|---|---|---|---|---|---|---|---|---|
| sigma_drift (% of price) | 0.108 | 0.123 | 0.135 | 0.158 | 0.188 | 0.215 | 0.232 | 0.246 | 0.249 |

**At a 30-year horizon the RMS change in a monthly seasonal factor (about 0.25% of price) is about as large as the entire current seasonal amplitude.** A 30-year-old reading of a seasonal factor is as uncertain as the seasonal signal is large.

Restricting base years to post-1990 or post-2000 gives lower drift at long horizons (about 0.13–0.16% at h = 15–20), but those windows hold too few non-overlapping spans to support an h ≥ 20 estimate and still show a directional trend across decades (§6). The all-history figure is the defensible choice for a 2026 to 2050s horizon.

**Fastest-drifting months:** May, June, April and December. **Slowest:** August, September, October. The spring and early-summer window, where motor fuel dominates the seasonal pattern, drifts fastest.

<a id="feb-15-dependency"></a>
### 4.1 The long TIPS curve depends on one date

Every TIPS maturing in 2040 or later matures on **February 15**, the 30-year TIPS maturity ([DATA_DICTIONARY.md §5.1](../../knowledge/DATA_DICTIONARY.md#51-issuance-dependent-values), Maturity-month pattern row; independently confirmed here across the 2040–2056 maturities on the live curve). There is one maturity month at the long end, so the seasonal adjustment there is a single uniform shift of the whole long real-yield curve, keyed entirely to `S(Feb-15)`.

| maturity date | sigma_drift h=10 | h=20 | h=30 | long-run mean `S` | latest `S` |
|---|---|---|---|---|---|
| **Feb-15** (all 30-year TIPS) | 0.154% | 0.235% | **0.290%** | 0.99806 (−0.194%) | 0.99552 (−0.448%) |
| Jan-15 | 0.147% | 0.191% | 0.190% | −0.003% | −0.142% |
| Apr-15 | 0.154% | 0.176% | 0.163% | −0.237% | −0.314% |
| Jul-15 | 0.175% | 0.240% | 0.278% | +0.075% | +0.256% |
| Oct-15 | 0.142% | 0.177% | 0.169% | +0.141% | +0.245% |

`S(Feb-15)` is among the fastest-drifting dates over 30 years (0.29%), and its current value (−0.448%) is about 2.5 times its own 1948–2026 average (−0.194%).

---

## 5. A credibility factor for S_maturity

Treat the current seasonal factor as a signal of [Seasonal Amplitude](../../knowledge/DATA_DICTIONARY.md#seasonal-amplitude) `A` observed through [Seasonal Factor Drift](../../knowledge/DATA_DICTIONARY.md#seasonal-factor-drift) of standard deviation `sigma_drift(h)`. The resulting weight is the [Credibility Factor](../../knowledge/DATA_DICTIONARY.md#credibility-factor). The fraction of `(S_maturity − 1)` worth keeping at horizon `h` is

`w(h) = A^2 / (A^2 + sigma_drift(h)^2)`

with `w(0) = 1` and `w → 0` as the drift band overtakes the amplitude. `A` and `sigma_drift(h)` are both measured above, so the weight has no free parameter.

The app applies `w(h)` at every horizon with no floor, using the per-calendar-month `sigma_drift` (§4.1), and never scales `S_settle` ([1.0 §horizon-dependent-maturity-factor](3.2_Seasonal_Adjustments.md#horizon-dependent-maturity-factor)). `sigma_drift(h)` is a smooth, continuous function of horizon with no discontinuity at any candidate cutoff, so a floor would discard measured 1-to-5-year drift without a measurement to support the boundary. It is unnecessary in practice: `w` is about 0.91 at 1 year and 0.85 at 3, so the front-end adjustment is nearly unchanged, and the SAO fit ([2.0](3.3_SAO_Adjustment.md)) snaps the front end to a smooth curve at full weight, absorbing the small residual. The weighting has its effect beyond about 6 years, where SAO no longer smooths and where the maturity month is eventually always February.

Pooled over the five maturity dates, `A = 0.263%`:

| h (years) | 1 | 3 | 5 | 10 | 15 | 20 | 25 | 30 |
|---|---|---|---|---|---|---|---|---|
| **w(h)** | 0.914 | 0.851 | 0.809 | 0.743 | 0.668 | 0.620 | 0.592 | 0.577 |

For **Feb-15** specifically (`sigma_drift(30) = 0.290%`): **w(30) ≈ 0.45**. Using half the peak-to-trough spread as the amplitude instead of the standard deviation raises w(30) to about 0.76; the standard-deviation form is the conservative choice.

The adjusted input is `S_maturity_eff = 1 + (S_maturity − 1) · w(h)`, where `h` is the years from the current date to the maturity date.

### 5.1 Shrink toward 1.0, not toward a long-run mean

An alternative anchor is each month's long-run mean factor rather than 1.0, keeping `(mean_M − 1)` in full and shrinking only the year-specific deviation. This barely reduces the adjustment, because `(mean_M − 1)` accounts for most of the seasonal amplitude. It also requires choosing which mean: the 1948–2026 mean of `S(Feb-15)` is −0.19%, a level last seen in the 1980s, while the post-2000 mean is −0.44%, close to today's value. The choice between them is a judgment about whether the current motor-fuel-driven seasonal regime mean-reverts, which the data cannot settle. Shrinking toward 1.0 avoids that choice: 1.0 is the value of `S` under no seasonal information, the correct limit as confidence in the projection goes to zero.

---

## 6. Evidence the pattern has changed: motor fuel

Mean `f` by decade, as percent deviation from 1.0:

| era | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1980s | −0.19 | −0.16 | −0.15 | −0.07 | +0.02 | +0.06 | +0.03 | +0.08 | +0.21 | +0.16 | −0.01 | −0.16 |
| 1990s | −0.15 | −0.03 | +0.13 | +0.12 | +0.06 | +0.06 | −0.02 | +0.01 | +0.08 | +0.08 | −0.06 | −0.29 |
| 2000s | −0.44 | −0.26 | +0.10 | +0.34 | +0.40 | +0.37 | +0.21 | +0.11 | +0.04 | −0.02 | −0.24 | −0.58 |
| 2010s | −0.43 | −0.24 | +0.09 | +0.23 | +0.38 | +0.39 | +0.26 | +0.17 | +0.15 | −0.03 | −0.33 | −0.61 |
| 2020s | −0.43 | −0.22 | −0.01 | +0.17 | +0.28 | +0.37 | +0.35 | +0.28 | +0.16 | +0.01 | −0.32 | −0.65 |

The seasonal peak moved from September in the 1980s to May and June from 2000 onward, the spring and summer values roughly quadrupled (June +0.06% to +0.37%), and the winter troughs deepened by a similar amount (December −0.16% to −0.65%). The largest step is 1990s to 2000s, coinciding with the phase-in of federal reformulated and low-volatility summer-blend gasoline and the 2000s rise in the level and volatility of energy prices. This is a structural change in the seasonal pattern over about 20 years, directly on point for extrapolating the 2026 pattern to the 2050s.

---

## 7. Effect on the reported seasonal adjustment

`SA − ask` yield, by maturity year, settlement 2026-09-08 (negative means the SA yield is below the ask yield):

| maturity year | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033 | 2035 | 2040 | 2045 | 2050 | 2054 | 2056 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mean (bp) | −89 | −31 | −19 | −11 | −10 | −9 | −5.4 | −4.3 | −7.3 | −5.1 | −3.8 | −4.2 | −4.1 |

The long-end value is about **−4 bp** and is a genuine output of Canty Eq. 14 from the current series. The 2040–2041 values (about −7 bp) are inflated by the full-curve NSS fit spanning the 2037–2039 gap years, not by seasonality.

Applying the weight (`shared/src/ref-cpi.js#maturitySaFactor`, per-calendar-month `w(h)`, no floor):

| maturity year | 2032 | 2035 | 2040 | 2045 | 2050 | 2054 |
|---|---|---|---|---|---|---|
| `w(h)` | 0.80 | 0.77 / 0.71 | 0.66 | 0.58 | 0.52 | 0.48 |
| `SA − ask`, unweighted (bp) | −13.8 … −2.4 | −6.8 / −1.7 | −7.3 | −5.0 | −3.8 | −4.2 |
| `SA − ask`, weighted (bp) | −12.6 … −3.4 | −6.4 / −2.6 | −6.0 | −3.9 | −2.8 | −3.0 |

(Where two values are shown, the maturity year holds both a January and a July maturity, with different `w`.) The long-end adjustment drops from about −4 bp to about −3 bp. Every weighted front-end value moves by under 1.5 bp, and some move up rather than down, since scaling a maturity in a high-factor month (July, October) toward 1.0 slightly increases `S_settle / S_maturity`.

### 7.1 There is no market cross-section to check against at the long end

At the front end the seasonal adjustment is large and its effect is verifiable: the raw April-to-July ask-yield spread inside 2027–2032 is about 24 bp, and the adjustment removes the maturity-month structure in it, leaving an April-low, October-high SA residual of about 6 bp peak-to-trough (consistent with [2.2](SAO_Residual_Analysis.md) §2). Through 2033–2039 a residual January-high, July-low pattern of about 4 bp remains in the raw yields; it is near the noise floor and cannot be separated from a 10-year issue-cohort effect. From 2040 onward every TIPS matures in February, so there is no maturity-month cross-section: the long-end adjustment cannot be corroborated or refuted against the market, and its size is set entirely by `S(Feb-15)`.

---

## 8. Does the longest data support the adjustment at 20 to 30 years?

Sections 4 and 7 leave the current-year factor weighted about 0.45 to 0.5 at the 2050s maturities, which produces about 3 bp of adjustment there. The full NSA and SA history supports that. Three measurements say so, and the only route to a materially smaller figure is a forecasting judgment the measurements do not support.

**Where the drift saturates is a result, not a limit of the estimate.** Under a stationary reading the RMS change over any horizon saturates at `A * sqrt(2)` = 0.372%. The measured plateau is 0.225% pooled over the five maturity dates and 0.290% for February 15, both well short of that ceiling. Splitting the variance at the plateau, the part that drifts away has a standard deviation of 0.159%, which leaves **about 63% of the seasonal variance as a permanent month effect that does not drift**.

**The February factor is negative in every historical era**: 1980s −0.16%, 1990s −0.03%, 2000s −0.26%, 2010s −0.24%, 2020s −0.22% (§6). Its sign, and roughly its recent magnitude, are structural rather than a property of the current vintage.

**Measured directly, `S(Feb-15)` autocorrelates about 0.50 at a 30-year lag**: `rho(10)` = 0.77, `rho(20)` = 0.54, `rho(30)` = 0.50. The current value is informative about 2054.

Every alternative that follows a measurement lands within 0.15 bp of the method in use, on a 2053 maturity: the [Credibility Factor](../../knowledge/DATA_DICTIONARY.md#credibility-factor) −2.96 bp, a horizon autocorrelation weight −2.98 bp, shrinking to the February long-run mean −2.85 bp. Only setting the maturity factor to 1.0 outright reaches −1.91 bp.

Reaching about 1 bp therefore requires a judgment that the current February level (−0.448%, about 2.3 times its 1948–2026 mean of −0.194%) is a temporary elevation that reverts by the 2050s. §6 shows seasonality can move that far in 20 years, but it moved away from neutral rather than toward it, so that judgment would override the measurements rather than follow them.

---

## 9. Caveats

1. `f` for months inside the last five years is not yet frozen by BLS, and 2020–2022 is genuinely noisy; drift figures leaning on recent base years are weaker than the h ≤ 20 all-history figures.
2. The post-2000 window cannot support an h = 30 drift estimate and rests on fewer than five non-overlapping spans at h = 20–25. The lower drift it shows is suggestive, not established.
3. The shrink-toward-mean anchor (1980s level versus current level) is an unresolved judgment about mean reversion; it is the reason §5.1 recommends shrinking toward 1.0 instead.
4. There is no external long-dated real-yield fair-value series to test whether the long SA curve level is closer to fair value than the ask level. Section 7.1 can only test maturity-month structure, and at the long end there is one month.
5. `A` is non-stationary — it roughly tripled between the 1990s and the mid-2000s (§3) and has been near 0.29% since. `w(h)` uses the 2015–2019 value (0.263% on the interpolated series, §3 and §5); if seasonality keeps growing, `A` is understated and `w` with it.
6. `w(h)` models drift as unbiased noise. Section 6 shows a persistent directional trend, so a trend-aware projection could improve on it in either direction.
7. `rho(30)` in §8 rests on about 1.6 independent 30-year spans in the 1948–2026 window. The error on it is wide. It is the best available estimate and is clearly not near zero, but it is not a tight one.

---

## 10. Reproduction

`YieldCurves/scripts/sa-drift-analyze.mjs` pulls the FRED CPI history and the live R2 stores, computes every table above, and reruns the SA pipeline from `src/app.js` with and without `w(h)`.

## Sources

- [Canty (2009), *Seasonally Adjusted Prices for Inflation-Linked Bonds* — local summary](Canty.md)
- [BLS Handbook of Methods, CPI — Calculation and seasonal adjustment](https://www.bls.gov/opub/hom/cpi/calculation.htm)
- [Gürkaynak, Sack & Wright — *The TIPS Yield Curve and Inflation Compensation* (FEDS 2008-05)](https://www.federalreserve.gov/pubs/feds/2008/200805/200805pap.pdf)
