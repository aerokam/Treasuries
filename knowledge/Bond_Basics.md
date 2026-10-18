# 1.0 Bond Basics

## Dependencies
**None** (foundation layer)

---

## Scope
"Treasury" here means U.S. Treasury securities: bills, notes, bonds and TIPS. The market uses "bond" for any of them. Treasury distinguishes [Treasury Bills](./DATA_DICTIONARY.md#treasury-bill) (original maturity up to 1 year), [Treasury Notes](./DATA_DICTIONARY.md#treasury-note) (2 to 10 years) and [Treasury Bonds](./DATA_DICTIONARY.md#treasury-bond) (over 10 years), and issues [TIPS](./DATA_DICTIONARY.md#tips) as notes or bonds. "Bond" below is the $1,000 par unit, and the security type is named where it matters.

---

## Core Terms

- **[Quantity](./DATA_DICTIONARY.md#quantity):** The number of $1,000 units of a security (e.g., 50).
- **[Par](./DATA_DICTIONARY.md#par):** The stated value of a security at original issuance, for any amount of securities (e.g., $50,000 for a quantity of 50). A [Price](./DATA_DICTIONARY.md#price) is a percentage of it. [Face Value](./DATA_DICTIONARY.md#face-value) is a synonym. The current principal value of a TIPS is its [Inflation-Adjusted Principal](./DATA_DICTIONARY.md#inflation-adjusted-principal) (see [TIPS Basics](./TIPS_Basics.md)).
- **[Annual Interest (Nominal)](./DATA_DICTIONARY.md#annual-interest-nominal):** The fixed annual coupon rate multiplied by the par of a nominal Treasury. For a TIPS it is multiplied by the Inflation-Adjusted Principal instead.
  ```
  annualInterest = par * couponRate (nominal)
  ```
  *(See [TIPS Basics](./TIPS_Basics.md) for the inflation-adjusted interest formulas.)*
- **[Price](./DATA_DICTIONARY.md#price):** Market value expressed as percentage of par (e.g., 102.5 = 102.5% of par). The [clean price](./DATA_DICTIONARY.md#clean-price) is the quoted price, excluding accrued interest.
- **[Accrued Interest](./DATA_DICTIONARY.md#accrued-interest-nominal):** Interest earned by the current holder since the last coupon payment, owed by the buyer to the seller at settlement. It uses the **Actual/Actual day count**, and is not a flat half-coupon.
  ```
  A = days elapsed since the last coupon date
  E = days in the current coupon period
  accruedInterest = (couponRate/2 × 100) × (A / E)   // per $100 par
  ```
  A bond bought on a coupon date owes no accrued interest (A = 0), because the coupon paid that day is the seller's. A bond bought the day after a coupon date owes almost none, and one bought the day before the next coupon date owes nearly the full semiannual coupon. The dirty price, which is what the buyer pays, is the clean price plus the accrued interest.
  *(See [TIPS Basics](./TIPS_Basics.md) for the inflation-adjusted extension.)*
- **[Settlement Date](./DATA_DICTIONARY.md#settlement-date):** The trade date plus 1 bond trading day (T+1) for a secondary market trade.
- **[Maturity Date](./DATA_DICTIONARY.md#maturity-date):** The date on which principal is repaid to the holder.
- **Last-Year Interest Payments:** Coupons are paid every 6 months, on the Maturity Date's month and day and 6 months from it, so the [Last-Year Interest](./DATA_DICTIONARY.md#last-year-interest) payments in the year of maturity depend on the maturity month:
  - A January to June maturity pays 1 coupon in its final year.
  - A July to December maturity pays 2 coupons in its final year.

---

## Yield Calculation Conventions

The [Yield](./DATA_DICTIONARY.md#yield) to maturity of a coupon-bearing Treasury note or bond uses semi-annual compounding and the Actual/Actual day count, as Excel's `YIELD(settlement, maturity, rate, pr, redemption, 2, 1)` does, with `frequency=2` fixed however close settlement is to maturity. Every remaining period, the final one included, is priced with the same multi-period present value formula, and no separate convention applies near maturity. A TIPS uses the same convention ([TIPS Basics](./TIPS_Basics.md)).

A settlement date within 6 months of maturity does not make the final coupon period the only one left: a settlement just before an intermediate coupon date can also be under 6 months from maturity. Whether a period is the last is therefore decided from the coupon dates and not from the days to maturity.

**Measured 2026-10-17** on [Market quotes (S7)](./DATA_DICTIONARY.md#s7) downloaded 2026-10-16, with settlement on 2026-10-19 and securities more than 7 days from maturity, the yield calculated from the ask price by `yieldFromPrice` differs from the file's `Ask yield to maturity` by:

| Securities | Count | Median | Largest | Over 0.1 bp |
|---|---|---|---|---|
| Coupon-bearing nominal Treasuries | 353 | 0.061 bp | 6.3 bp | 57 |
| TIPS | 52 | 0.059 bp | 0.14 bp | 1 |
| Zero-coupon nominal Treasuries | 293 | 0.055 bp | 3.9 bp | 38 |

Price carries more digits than the file's yield, which is rounded to 3 decimal places (0.1 bp), so the yield calculated from price is the more precise of the two. [Market quotes (S7)](./DATA_DICTIONARY.md#s7) states the yield that [Yield Curves](../YieldCurves/knowledge/3.1_Parse_Sources_And_Calculate_Yields.md) calculates from price.

---

## Treasury Bill Yield (Investment Rate)

A Treasury Bill has no coupon, so the `frequency=2` convention does not apply to it directly. Treasury specifies an investment-rate (coupon-equivalent yield, CEY) formula, split by remaining maturity, in [Price, Yield and Rate Calculations for a Treasury Bill](https://www.treasurydirect.gov/instit/annceresult/press/preanre/2004/ofcalc6decbill.pdf).

**y (days in year)**: in both formulas below, `y` is the number of days from settlement to the same calendar date one year later, 365 or 366 when that twelve-month span crosses Feb 29. Whether the settlement-to-maturity window itself contains Feb 29 does not decide it: a bill settling in January and maturing in February never reaches Feb 29 in its window even in a leap year, and still uses y=366 because the year following settlement does. `r` is the days from settlement to maturity.

**A bill of not more than one half-year to maturity** (`r < y/2`):
```
i = ((100 - P) / P) × (y / r)
```

**A bill of more than one half-year to maturity** (`r ≥ y/2`), by Treasury's basic formula
```
P [1 + (r - y/2)(i/y)] (1 + i/2) = 100
```
which, as a quadratic `a·i² + b·i + c = 0`, is solved for `i`:
```
a = (r / 2y) - 0.25
b = r / y
c = (P - 100) / P
i = (-b + √(b² - 4ac)) / (2a)
```

**Implementation.** `yieldFromPrice` applies the simple formula to a security with a coupon rate of 0 and under half a year to maturity, which is the one case where the result differs from the compound `frequency=2` formula. For every other case it uses the `frequency=2` path, with a zero-coupon security as one final cash flow. It does not solve the quadratic. For the worked example of the Treasury document (settlement 1990-06-07, maturity 1991-06-06, P=92.265000) the quadratic gives i=8.2373% and `yieldFromPrice` gives 8.2377%.

Implemented by: `shared/src/bond-math.js` — `daysInYearFrom(settle)`, `yieldFromPrice()`.
