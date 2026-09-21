# Research

A home for investigative work that answers a specific question using the repo's data sources,
but is not part of any one app's spec or code. Each subfolder is one investigation: a script that
fetches its own data live, a README stating the question, method, and result, and (gitignored)
generated output under `data/`.

Prior research of this kind exists but was not consolidated here, and its results' current
location is not tracked. This folder is the home for investigations going forward; move an
existing one here if it resurfaces.

## Index

- [tips-deflation-floor](tips-deflation-floor/README.md) — has any TIPS matured with an index
  ratio below 1.0. Result: no. Output: `TIPS/TipsIndexRatioAtMaturity.csv` in R2.
