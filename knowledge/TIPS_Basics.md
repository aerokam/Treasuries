# 2.1 TIPS Basics

## Dependencies
**Requires:** [Bond Basics](./Bond_Basics.md), whose terms and Yield Calculation Conventions apply to a TIPS unchanged.

---

## TIPS-Specific Terms

**[TIPS](./DATA_DICTIONARY.md#tips) (Treasury Inflation-Protected Securities):** Marketable Treasury securities whose principal is adjusted by changes in the Consumer Price Index.

- **[Quantity](./DATA_DICTIONARY.md#quantity):** Number of TIPS held; qty 1 = $1,000 par (e.g., qty 50 = $50,000 par).
- **[Par](./DATA_DICTIONARY.md#par):** Quantity × $1,000 (e.g., $50,000). The par excludes the inflation adjustment.
- **[Inflation-Adjusted Principal](./DATA_DICTIONARY.md#inflation-adjusted-principal):** The principal after the adjustment for inflation or deflation: the par times the Index Ratio. It is the amount on which interest is calculated and which is repaid at maturity, unless the [par](./DATA_DICTIONARY.md#par) is greater ([31 CFR 356 §356.5](./31_CFR_356_Definitions_And_Formulas.md)).

**[CPI-U NSA](./DATA_DICTIONARY.md#cpi-nsa):** Consumer Price Index for All Urban Consumers, Not Seasonally Adjusted.
- Published monthly by the Bureau of Labor Statistics.
- Released mid-month for the prior month.

- **[Reference CPI](./DATA_DICTIONARY.md#ref-cpi):** Daily interpolated value used for TIPS calculations.
  - **Legal Authority:** 31 CFR § 356 Appendix B, Section I, Paragraph B.
  - **Principle:** The Reference CPI for the first day of any month is the CPI-U NSA for the third month preceding that month.

```
For the 1st of the month:
  Ref CPI(month, 1) = CPI-U(month - 3)
  Example: Ref CPI for April 1st uses the CPI-U for January.

For days 2-31:
  Ref CPI(month, day) = Ref CPI(month, 1) +
                       (Ref CPI(month+1, 1) - Ref CPI(month, 1)) *
                       (day - 1) / daysInMonth
```

> **Two derivations, one authority.** The daily Ref CPI is obtained two ways that must agree. The value **retrieved** from TreasuryDirect ([Ref CPI (S3)](./DATA_DICTIONARY.md#s3)) is **authoritative** and every app uses it. The value **calculated** by the interpolation above is the **fallback** when retrieval fails. Both are implemented once in `shared/src/ref-cpi.js`. See [DATA_DICTIONARY.md#ref-cpi](./DATA_DICTIONARY.md#ref-cpi).

**[Dated Date](./DATA_DICTIONARY.md#dated-date):** The 15th of the month in which the TIPS was issued.

**Ref CPI on the Dated Date:** The Ref CPI on the Dated Date, constant for the life of the TIPS.

- **[Index Ratio](./DATA_DICTIONARY.md#index-ratio):**
```
indexRatio(date) = refCPI(date) / refCPI(datedDate)
```

---

## Inflation-Adjusted Calculations

**Inflation-Adjusted Principal:**
```
adjustedPrincipal = par * indexRatio
```
The Index Ratio in this formula is rounded as [Inflation-Adjusted Principal](./DATA_DICTIONARY.md#inflation-adjusted-principal) states.

**Inflation-Adjusted Annual Interest (per TIPS):**
```
adjustedAnnualInterest = adjustedPrincipal * couponRate
```

**Inflation-Adjusted Semi-Annual Interest:**
```
adjustedSemiAnnualInterest = adjustedAnnualInterest / 2
```

---

## TIPS-Specific Rules

**TIPS Maturity Dates:** The 15th of a month. Every outstanding TIPS matures in January, February, April, July or October.

**Last-Year Interest (TIPS):** ([Last-Year Interest](./DATA_DICTIONARY.md#last-year-interest))
- A January to June maturity pays 1 coupon in its final year.
- A July to December maturity pays 2 coupons in its final year.
```
For Jan maturity (month 1 < 7):
  lastYearInterest = adjustedAnnualInterest * 0.5

For Jul maturity (month 7 ≥ 7):
  lastYearInterest = adjustedAnnualInterest * 1.0
```

**[P+I per TIPS](./DATA_DICTIONARY.md#pi-per-tips):**
The total inflation-adjusted cash flow (Inflation-Adjusted Principal + Last-Year Interest) received in the year the security matures.
```
piPerBond = adjustedPrincipal + lastYearInterest
```

**[Cost per TIPS](./DATA_DICTIONARY.md#cost-per-tips):**
The nominal cost to purchase one $1,000 par unit.
```
costPerBond = price/100 × indexRatio × 1,000
```

**[Accrued Interest](./DATA_DICTIONARY.md#accrued-interest-adjusted):**
Extends [Bond Basics §Accrued Interest](./Bond_Basics.md) the same way Inflation-Adjusted Principal extends [Par](./DATA_DICTIONARY.md#par): take the nominal accrued interest per $100 par (Actual/Actual day count, the A/E convention of Yield Calculation Conventions and Duration below) and apply the Index Ratio, rounded as [Inflation-Adjusted Principal](./DATA_DICTIONARY.md#inflation-adjusted-principal) states, because Treasury rounds the Index Ratio in every calculation that depends on it.
```
accruedPerBond = round5(accruedInterestNominal / 100 × indexRatio × 1,000)   // real dollars per bond, to 5 decimal places
```
Total settlement cost to acquire a TIPS = Cost per TIPS + Accrued Interest.

---

## Yield Calculation Conventions

Those of [Bond Basics §Yield Calculation Conventions](./Bond_Basics.md): `frequency=2`, Actual/Actual day count, no near-maturity exception. A TIPS carries a coupon, so [Bond Basics §Treasury Bill Yield (Investment Rate)](./Bond_Basics.md), which is for a security with no coupon, does not apply to it.

---

## Duration

**Macaulay Duration:** The present-value–weighted average time to receive a bond's cash flows, measured in years ([Duration](./DATA_DICTIONARY.md#duration)).

It uses the convention of the yield to maturity: **Actual/Actual day count, semi-annual compounding** (frequency = 2). It matches Google Sheets `DURATION(settlement, maturity, coupon, yld, 2, 1)`.

The fractional first coupon period `w = DSC/E` (DSC is the days from settlement to the next coupon, E the length of that coupon period in days) avoids the ±0.5 y error of rounding to the nearest whole coupon period. The next coupon is the first one strictly after settlement, so on a coupon date DSC = E and w = 1. The full formula is in [4.0 §calculateDuration](../TipsLadderManager/knowledge/4.0_Computation_Modules.md).

**Modified Duration:** The first derivative of price with respect to yield, normalized by price:

```
MD = -(1/P) · dP/dy = macaulayDuration / (1 + yld/2)
```

This is exact for semi-annual compounding, as differentiating the present-value sum shows. It measures price sensitivity: a bond with modified duration 8 loses approximately 8% of price for a +1% parallel shift in yield (to first order; convexity is the second-order correction).

**Guard conditions (both `calculateDuration` and `calculateMDuration`):**
- Return `null` if `settlement >= maturity`
- Return `null` if `yld ≤ −2`; negative yields between −2 and 0 are valid and are not filtered out
