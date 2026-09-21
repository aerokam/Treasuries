# TIPS deflation floor: has it ever paid out?

## Question

At maturity, a TIPS redeems at the greater of its inflation-adjusted principal or its original
face value (the minimum-par, or deflation-floor, guarantee). Has any TIPS ever actually matured
with an Index Ratio below 1.000, meaning the floor changed the redemption amount?

## Method

1. Pull every historical TIPS auction record from Treasury's own data (`Treasuries/Auctions.csv`
   in R2), collapse the original-issue and reopening rows for each CUSIP down to one row per real
   security, and take its base ("dated date") Ref CPI from the original-issue auction record.
2. Pull Treasury's own published daily Ref CPI series (`TIPS/RefCPI.csv` in R2, 1997-01-15
   onward) and look up the Ref CPI on each security's maturity date directly — no interpolation
   or calculation involved for this step.
3. `indexRatioAtMaturity = RefCPI(maturity date) / RefCPI(dated date)`, for every CUSIP that has
   already matured.
4. Cross-check: independently recompute the Ref CPI at each security's base date from raw BLS
   CPI-U (NSA) monthly data (series `CUUR0000SA0`) via the 31 CFR 356 App. B interpolation
   formula, and compare to Treasury's own published value for that date. Two unrelated sources
   agreeing on the same number is what makes the result trustworthy; the script aborts if they
   don't.

## Result

56 TIPS CUSIPs have matured as of the last run. The base-date cross-check matched Treasury's own
figures on all 56 (0 mismatches). The lowest index ratio at maturity found was **1.07073** (the
5-year TIPS dated 2012-04-15, CUSIP 912828SQ4, maturing 2017-04-15). None matured below 1.000 —
the deflation floor has never changed a redemption amount for an originally-auctioned TIPS.

Full results: `TIPS/TipsIndexRatioAtMaturity.csv` in R2, one row per matured CUSIP, sorted by
index ratio ascending.

## Rerunning

```
node find-min-index-ratio.mjs            # writes data/TipsIndexRatioAtMaturity.csv locally
node find-min-index-ratio.mjs --upload   # also pushes it to R2 (needs the repo-root .env R2 credentials)
```

All three data sources are fetched live, so a rerun picks up any newly matured CUSIP and the
latest published Ref CPI automatically.

## Known gap

BLS can withhold a month's CPI-U figure (for example, October 2025 was withheld, most likely due
to that month's government shutdown). The cross-check in step 4 simply skips a base date that
falls in such a gap rather than failing; it does not affect step 2, which never depends on the
BLS series in the first place.
