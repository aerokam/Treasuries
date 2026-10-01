# Testing Conventions

Rulings about how this app's test suite (`npm test`, `npm run test:e2e`) is built and what it may
and may not depend on. Not a spec — a spec says what the app does; this says what a test is allowed
to assume while checking that. Settled by the developer across several sessions; previously existed
only in commit messages and code comments, which is why this file exists.

## Live market data, never a committed snapshot

`tests/e2e/app.spec.js` and `tests/run.js` read every piece of market data a test needs — Market
quotes, SA/SAO yields, Ref CPI, TIPS reference data, the bond-holiday calendar — directly from R2 at
run time (`r2Text` in `app.spec.js`, `tests/market-fixture.js` for `run.js`), never from a file
committed to the repo. A committed copy can only age: `tests/e2e/RefCPI.csv` ran out the day
settlement passed its last row, and a committed quotes file lacked every bond issued after the copy
was taken (e.g. the TIPS maturing July 2036). Two values are rewritten on top of the live data, since
a test run is not itself a download day: the Fidelity download date becomes today (it drives
settlement), and the first line of the FedInvest file becomes the settlement date.

Consequence: the test suite needs live network access to R2, and the E2E browser sandbox has none —
see 3.1 Data Pipeline §5.0 for the fixture-mocking mechanics this requires.

**The test clock is never pinned to an old date.** A pinned date is exactly the committed-snapshot
problem in a different form — it quietly assumes today's market shape matches some date in the past,
and stops being true the moment that stops holding.

## No test depends on specific holdings

`SampleHoldings.csv` and any file derived from a real broker account (`FidelityAllAccounts.csv`,
`SchwabAllAccounts.csv`, `VanguardAllAccounts.csv`, `ladder-fixtures.js`) change: the account sells
positions and TIPS mature out of it. No test may assert on a specific CUSIP or maturity year these
files happen to hold today — only on a property that holds for *any* holdings (a shape, an
invariant, a relationship between two computed figures). `scripts/generate-test-fixtures.js`
regenerates these from the real account each time it runs (see Process below); a test that baked in
today's CUSIPs would fail the next time that script runs, for a reason that has nothing to do with a
real regression.

## Don't build fixtures for the hypothetical

Prefer the formats actually seen in the wild — a real broker export, this app's own current
Holdings/DARA-plan export format — over hand-built files covering a corner case nothing has actually
produced. A fixture for a case that doesn't occur is speculative coverage: it can't be checked against
reality, and it's one more file to keep in sync with the export format as that format evolves.

## "Round trip"

A round trip means: **Build** a ladder, **export** it (Holdings file), **import** that file into
**Rebalance**, run **Rebalance**. The expected result is zero trades, with one accepted exception —
see 2.0 TIPS Ladders §Retained Bracket Excess's own "Round-Trip Rounding Note" (a rounded excess
target can leave up to one bond's worth of residual, bought into the active lower bracket on the next
cycle). A round-trip test asserts against that invariant (≤1 bond of churn, cash within one bond's
cost), never bit-perfect idempotency.

## Tolerances state what they're a percentage of, and never hide a real bias

An assertion that depends on the day's actual market shape (whether a Future 30Y fallback path
fires, how close `avgAmt` lands to `DARA`) states the invariant that holds regardless of that shape,
with any tolerance expressed as a percentage of the spec's own named quantity — not a bare number
that reads as more precise than it is. A tolerance must never paper over a real, one-directional
bias: `2.0 TIPS Ladders §Gap Year Coverage Model` originally stated the `avgAmt ≈ DARA` residual as a
fixed "~0.6%" bound; real runs against live market data showed it is not symmetric noise but a
one-directional overfunding bias that varies with the day's own shape (observed 0.3-1.7% of `DARA`,
never below it) — the spec was corrected to assert the direction, not a specific percentage, with the
direction being the real invariant to test.

## Silent-skip guards fail loudly instead

A test helper that quietly filters out or skips what it can't find (`.filter(h =>
tipsMarketData.has(h.cusip))`, `if (existsSync(...))`) makes a broken assumption shrink the test's
coverage instead of failing it — the test still goes green, just checking less than it claims to.
About a dozen of these remain in `tests/run.js`, not yet swept; each one found should fail loudly
(throw, not filter) rather than being patched quietly in place.

## Process: the fixture-refresh pipeline

The broker importer runs `scripts/generate-test-fixtures.js`, which regenerates the holdings/DARA
fixtures above from the real account and commits + pushes the refresh. `.githooks/pre-push` runs the
full unit and E2E suites and blocks that push (or any push) on a failure — this file's rulings exist
to keep that gate meaningful rather than a thing contributors route around. The ingestion scripts
themselves (what fetches and writes R2) are specified at 3.1 Data Pipeline §2.0, not here.
