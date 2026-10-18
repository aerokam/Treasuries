# Par, Principal, and Face Value

[Face Value](../../knowledge/DATA_DICTIONARY.md#face-value) and [Par Value](../../knowledge/DATA_DICTIONARY.md#par-value) are synonyms, used in different contexts: Face Value for the amount held, and Par Value for the amount a [Price](../../knowledge/DATA_DICTIONARY.md#price) is stated against. Principal is the amount that earns interest and is repaid at maturity. For a nominal Treasury the three are the same amount, and for a TIPS they are not.

## A Nominal Treasury

For a nominal Treasury note of one $1,000 unit:

- **Face Value** is $1,000.
- **Par Value** is $1,000.
- **Principal** is $1,000, the amount on which interest is calculated and the amount repaid at maturity.

## A TIPS

- **Face Value and Par Value** stay at $1,000 per TIPS. They are the unadjusted amount.
- **Principal** is the [Inflation-Adjusted Principal](../../knowledge/DATA_DICTIONARY.md#inflation-adjusted-principal): the Face Value multiplied by the [Index Ratio](../../knowledge/DATA_DICTIONARY.md#index-ratio). If cumulative inflation since the Dated Date is 20%, the Inflation-Adjusted Principal of a $1,000 TIPS is $1,200.
- **Interest** is a fixed percentage of the Inflation-Adjusted Principal, and not of the Face Value.
- **At maturity** Treasury pays the Inflation-Adjusted Principal or the Par Value, whichever is greater.

## Price

A price is expressed as a percentage of par. A price of 98 is 98% of par, which is $980 for a par value of $1,000. A price is unadjusted unless qualified: the [Adjusted Price](../../knowledge/DATA_DICTIONARY.md#adjusted-price) of a TIPS is its price multiplied by the Index Ratio.
