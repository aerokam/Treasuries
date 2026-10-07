# Future 30Y Cover Excess: Net Cash, Duration Drift, Yield Sensitivity and the Choice of Covers

Research behind [2.0 §Future 30Y Simulated Outstanding TIPS](../knowledge/2.0_TIPS_Ladders.md#future-30y-simulated-outstanding-tips). Where a newer analysis overrides a result here, the result is replaced, not appended to.

**Basis of every figure:** market data of 2026-10-07, DARA $100,000, ladder 2027 to 2063, Lower cover 2048 and Upper cover 2052 (the rule gave the 2049 on 2026-10-06 and the 2048 on 2026-10-07), static yield curve, each security keeping its yield, index ratios at their settlement values. Computed by building the ladder, running the Future 30Y rebalance at each issue date, and measuring on each issue date.

## 1. The Net Cash at each issue date is the accretion of the Cover Excess

The Cover Excess is bought at a discount (the 2048 at $861 per TIPS against par of $1,355, the 2052 at $534 against $1,200). Its price rises toward par every year, while the Synthetic TIPS are priced near par and barely move. Selling the Cover Excess down at each issue date therefore brings in more than the Simulated Outstanding Future 30Y TIPS cost.

| Issue date | Cover value growth since the previous date | Synthetic cost growth | Net Cash |
|---|---|---|---|
| 2027-02-26 | $5,185 | $38 | $5,945 |
| 2028-02-29 | $12,462 | $56 | $11,559 |
| 2029-02-28 | $11,193 | $49 | $11,762 |
| 2030-02-28 | $9,731 | $40 | $9,454 |
| 2031-02-28 | $7,914 | $31 | $8,822 |
| 2032-02-27 | $5,665 | $22 | $4,995 |
| 2033-02-28 | $3,085 | $11 | $3,007 |
| Total | $55,236 | $247 | $55,544 |

Net Cash equals the first column less the second, apart from whole-TIPS rounding. The Cover Excess price growth is 0.8% to 3.2% a year, close to the yield, because its coupons are 1% and 0.125%.

## 2. Lifetime discount against what is realized by the sales

At the Pass 1 quantities (531 of the 2048 and 304 of the 2052) the discount to maturity is $464,889 ($262,246 and $202,642). The sales end in 2033, so only $55,236 is realized. The earlier AMD credited the lifetime figure, held to maturity, to funded years up to 2048 and 2052.

## 3. The credit with Net Cash equals the credit as if all the Future 30Y TIPS had been issued today

Each funded year before the first Future 30Y year is credited with the simulated TIPS coupons, the Cover Excess coupons and the Net Cash. The comparison figure is the full annual coupon of every Future 30Y TIPS, $21,026 a year.

| Year | Simulated TIPS coupons | Cover Excess coupons | Net Cash | Total credit | Ratio to $21,026 |
|---|---|---|---|---|---|
| 2027 | $1,350 | $6,915 | $5,945 | $14,210 | 68% |
| 2028 | $4,101 | $5,347 | $11,559 | $21,007 | 100% |
| 2029 | $6,953 | $3,785 | $11,762 | $22,499 | 107% |
| 2030 | $9,906 | $2,446 | $9,454 | $21,806 | 104% |
| 2031 | $12,960 | $1,368 | $8,822 | $23,150 | 110% |
| 2032 | $16,116 | $586 | $4,995 | $21,697 | 103% |
| 2033 | $19,373 | $138 | $3,007 | $22,517 | 107% |
| 2034 on | $21,026 | $0 | $0 | $21,026 | 100% |

Over 2027 to 2033 the total credit is $146.9K against $147.2K, within 0.2%. 2027 is low because the first sale comes about four months after settlement, and the accretion since is realized in 2028.

Conclusion the spec relies on: the excess stands in for holding the Future 30Y TIPS as if all had been issued today. Its return, delivered as accretion at each sale, takes the place of the coupons those TIPS would pay. Crediting the Net Cash to the funded year of the year it is delivered removes the overfunding.

## 4. The duration match drifts in years but not in dollars

Measured just before each rebalance, the Cover Excess held since the last one against the Future 30Y TIPS not yet issued plus the one about to be issued.

| Date | Duration of the held covers | Duration of the Future 30Y TIPS | Drift | Value of the covers | Fall of the covers for +100 bp | Fall of the Future 30Y TIPS for +100 bp |
|---|---|---|---|---|---|---|
| 2027-02-26 | 19.54 | 19.76 | −0.21 | $624,761 | $122,107 | $122,304 |
| 2028-02-29 | 19.14 | 19.58 | −0.44 | $551,758 | $105,584 | $105,641 |
| 2029-02-28 | 18.94 | 19.41 | −0.47 | $468,889 | $88,812 | $88,723 |
| 2030-02-28 | 18.74 | 19.23 | −0.49 | $381,374 | $71,468 | $71,492 |
| 2031-02-28 | 18.54 | 19.06 | −0.52 | $291,367 | $54,012 | $53,984 |
| 2032-02-27 | 18.34 | 18.88 | −0.54 | $196,761 | $36,088 | $36,224 |
| 2033-02-28 | 18.13 | 18.70 | −0.57 | $100,420 | $18,210 | $18,216 |

The durations of the covers and of the Future 30Y TIPS both decline, at slightly different rates (about 0.4 years a year for the covers against 0.17). Part of the difference is offset by the accrued market discount realized at each rebalance, which has raised the value of the covers. The remaining difference is tiny, $6 to $197 for a 100 bp move, under 0.2%, so it is not worth correcting. Matching on a midpoint of today's and next year's duration would buy almost nothing under a static curve.

## 5. A parallel yield shift moves the Net Cash little but can break the duration match

A parallel shift of every yield from the first issue date.

| Shift | −100 bp | −50 bp | 0 | +50 bp | +100 bp |
|---|---|---|---|---|---|
| Net Cash total | $55,746 | $56,779 | $55,544 | $52,653 | $48,611 |
| Duration match reached at every issue date | no | no | yes | yes | yes |

After a fall the target duration of the Future 30Y TIPS not yet issued rises above the Upper cover's duration, which shortens with age: at −50 bp in 2032 (target 19.69 against 19.34), at −100 bp in 2031 and 2032. A ladder to 2063 (N = 7) sits at the edge of what the covers can reach.

## 6. A margin for the Lower cover

The rule picks the longest modified duration at or below that of the first Synthetic TIPS (2057). That duration depends on the market yield: 18.98 on 2026-10-06 and 18.77 on 2026-10-08, with the Lower cover moving from the 2049 (18.94, then 18.92) to the 2048 (18.23). The covers' own durations barely move with yield: for a +100 bp parallel shift the 2047 falls from 17.77 to about 17.41, while the first Synthetic TIPS falls from 18.77 to 16.57.

Measuring the first Synthetic TIPS at a fixed yield of 4% instead of the market yield gives 17.35, which fixes the target and leaves only the covers' durations to move. The Lower cover is then the 2046 (16.80), with a margin of 0.55 years. It would change only if the 2047's duration fell below 17.35 or the 2046's rose above it, which takes yield moves of more than 100 bp.

The choice costs nothing. For a Lower cover of 2048, 2047 or 2046 with the 2052 as Upper cover, N is 7 in every case (the match is reached to a last year of 2063 and missed from 2064), the Net Cash total to 2063 is $56K, $58K and $58K, and the credit with Net Cash is 99% to 100% of the full annual coupons of every Future 30Y TIPS over the years of the rebalances, for a last year of 2059 or later.

| First Synthetic TIPS yield | Duration | Lower cover | Margin in years |
|---|---|---|---|
| Market, 3.407% | 18.77 | 2048 | 0.54 |
| 3.907% | 17.62 | 2046 | 0.82 |
| 4.032% | 17.35 | 2046 | 0.54 |
| 4.407% | 16.57 | 2045 | 0.09 |
