# Par, Principal, and Face Value

[Par](../../knowledge/DATA_DICTIONARY.md#par) is the term of the Treasury regulations: "par amount" means the stated value of a security at original issuance ([31 CFR 356.2](../../knowledge/31_CFR_356_Definitions_And_Formulas.md)). It applies to any amount of securities, such as $1,000, $10,000 or the total of an auction. [Face Value](../../knowledge/DATA_DICTIONARY.md#face-value) is a synonym, used in different contexts. Principal is the amount that earns interest and is repaid at maturity. For a nominal Treasury, par and principal are the same amount, and for a TIPS they are not.

## A Nominal Treasury

For a nominal Treasury note of one $1,000 unit:

- **Par** is $1,000.
- **Principal** is $1,000, the amount on which interest is calculated and the amount repaid at maturity.

## A TIPS

- **Par** stays at $1,000 per TIPS. It excludes the inflation adjustment.
- **Principal** is the [Inflation-Adjusted Principal](../../knowledge/DATA_DICTIONARY.md#inflation-adjusted-principal): the par multiplied by the [Index Ratio](../../knowledge/DATA_DICTIONARY.md#index-ratio). If cumulative inflation since the Dated Date is 20%, the Inflation-Adjusted Principal of a $1,000 TIPS is $1,200.
- **Interest** is a fixed percentage of the Inflation-Adjusted Principal, and not of the par.
- **At maturity** Treasury pays the Inflation-Adjusted Principal or the par, whichever is greater.

## Price

A price is expressed as a percentage of par. A price of 98 is 98% of par, which is $980 for a par of $1,000. A price is unadjusted unless qualified: the [Adjusted Price](../../knowledge/DATA_DICTIONARY.md#adjusted-price) of a TIPS is its price multiplied by the Index Ratio.
