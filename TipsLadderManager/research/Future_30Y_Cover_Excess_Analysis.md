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

## 3. The three amounts against the full annual coupons of every Future 30Y TIPS

**Basis of this section:** market data of 2026-10-10, settlement 2026-10-13, Lower cover 2046 (yield 3.309%), Upper cover 2052 (3.333%), anchor 2056 (3.323%), static yields, index ratios at their settlement values. The worked figures are for DARA $100,000 flat, ladder 2026 to 2062 (the Maximum Future 30Y Rungs of 6 that day), over 2026 to 2032, the years from settlement to the last issue date. Each percentage is of one year's full coupons, the Annual Interest (Real) of every Future 30Y TIPS: $17,680 for this ladder.

Over those years the three amounts (the simulated TIPS coupons, the Cover Excess coupons and the Net Cash) come to $1,561 (8.8%) less than the full annual coupons counted on each February 15 and August 15 after settlement. The difference is exactly the sum of four amounts, each worked out from prices from yield and accrued interest:

| Amount | What causes it | 2062 ladder |
|---|---|---|
| 1. Cover Excess at settlement less the cost of the Synthetic TIPS | Whole-TIPS rounding of the Cover Excess, and its quoted price against the price from its yield | −1.5% |
| 2. Return of the Cover Excess less the return of each Future 30Y TIPS from settlement to its issue date (change in dirty price plus coupons paid) | The covers' yields against the anchor yield, and the coupons the Future 30Y TIPS pay out where the Cover Excess grows in price | +1.5% |
| 3. Accrued interest at settlement: Cover Excess less every Future 30Y TIPS | The full annual coupons count the whole first coupon (August 15, 2026 to February 15, 2027), while interest from settlement is only the 125 of its 184 days after settlement. Every Cost per TIPS is a clean price, so no accrued interest is paid at purchase | −11.2% |
| 4. Accrued interest on the issue dates: Simulated Outstanding Future 30Y TIPS bought less Cover Excess sold | Each is bought 11 to 14 days after February 15 at a clean price, and its first coupon is credited whole | +2.4% |
| Total | | −8.8% |

Amount 3 is the one-sided shortfall. Its Future 30Y TIPS part is 59/184 of a half-year coupon, 16.0% of one year's full coupons, less 4.8% for the Cover Excess. It depends on the settlement date alone (none just after February 15 or August 15, up to half a year's coupons just before), not on the number of Future 30Y years, and it falls on the first year. For last years 2057 to 2062 it is −10.5% to −11.2%, while the total is −3.0% to −9.1% for DARA $100,000 flat and −6.3% to −9.0% for $400,000 flat: amount 4 adds 2.0% to 2.5%, and amount 1, the rounding, moves the total either way by up to about 5% at DARA $100,000.

Amount 2 depends on the yields. With the covers' yields within 1.5 bp of the anchor yield, as on this day and with every yield shifted by −50 bp or +50 bp, it stays within 2.5% of one year's full coupons. With every yield moved 5 bp per year of maturity from 2050 (covers 51 bp and 19 bp below the anchor), it reaches −32% at a last year of 2063; moved the other way (covers 49 bp and 21 bp above), +31% at 2062. The Cover Excess earns the yields of the covers, so the three amounts come to about the full annual coupons only while the covers' yields are close to the anchor yield.

**Invariant tested** (tests/run.js, DARA $20,000, $100,000 and $400,000, flat and variable, every last year from the first Future 30Y year to the ladder's last year at most, on the market yields and on every yield shifted by −50 bp and +50 bp): the three amounts less the full annual coupons equal amounts 1 to 4 within $0.01; amount 1 lies within half a Cost per TIPS of each cover plus the quoted price against the price from yield; amount 2 lies within a bound from the mechanism, worked out for each period between issue dates from the growth of a dirty price at the covers' and the anchor yields. In these runs amount 2 reached at most 64% of that bound.

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

After a fall the target duration of the Future 30Y TIPS not yet issued rises above the Upper cover's duration, which shortens with age: at −50 bp in 2032 (target 19.69 against 19.34), at −100 bp in 2031 and 2032. A ladder to 2063 (the Maximum Future 30Y Rungs of 7) sits at the edge of what the covers can reach after a fall in yields.

A rise of the anchor yield to 4% (+59 bp) does not break the Maximum Future 30Y Rungs of 7: the match is reached at every issue date to 2033. A holder who matched today at today's weights is then slightly mismatched until the next rebalance: the held covers are 3.2% more sensitive to yield than the Future 30Y TIPS (dollar duration 1.032 times the Future 30Y TIPS'), about $3,300 for each further 100 bp on $551,000. After a fall of 60 bp the ratio is 0.967 and the match is missed in 2032. These figures use the 2046 as Lower cover.

## 6. A margin for the Lower cover

The rule picks the longest modified duration at or below that of the first Synthetic TIPS (2057). That duration depends on the market yield: 18.98 on 2026-10-06 and 18.77 on 2026-10-08, with the Lower cover moving from the 2049 (18.94, then 18.92) to the 2048 (18.23). The covers' own durations barely move with yield: for a +100 bp parallel shift the 2047 falls from 17.77 to about 17.41, while the first Synthetic TIPS falls from 18.77 to 16.57.

Measuring the first Synthetic TIPS at a fixed yield of 4% instead of the market yield gives 17.35, which fixes the target and leaves only the covers' durations to move. The Lower cover is then the 2046 (16.80), with a margin of 0.55 years. It would change only if the 2047's duration fell below 17.35 or the 2046's rose above it, which takes yield moves of more than 100 bp.

The choice costs nothing. For a Lower cover of 2048, 2047 or 2046 with the 2052 as Upper cover, the Maximum Future 30Y Rungs is 7 in every case (the match is reached to a last year of 2063 and missed from 2064), the Net Cash total to 2063 is $56K, $58K and $58K, and the credit with Net Cash differs from the full annual coupons of every Future 30Y TIPS by the amounts in section 3 in every case.

| First Synthetic TIPS yield | Duration | Lower cover | Margin in years |
|---|---|---|---|
| Market, 3.407% | 18.77 | 2048 | 0.54 |
| 3.907% | 17.62 | 2046 | 0.82 |
| 4.032% | 17.35 | 2046 | 0.54 |
| 4.407% | 16.57 | 2045 | 0.09 |
