# Testing Conventions

Rulings about how this app's test suite (`npm run test:Unit:TipsLadderManager`, `npm run test:UI:TipsLadderManager`) is built and what it may
and may not depend on. Not a spec — a spec says what the app does; this says what a test is allowed
to assume while checking that. Settled by the developer across several sessions; previously existed
only in commit messages and code comments, which is why this file exists.

## Live market data, never a committed snapshot

`tests/UI/app.spec.js` and `tests/run.js` read every piece of market data a test needs — Market
quotes, SA/SAO yields, Ref CPI, TIPS reference data, the bond-holiday calendar — directly from R2 at
run time (`r2Text` in `app.spec.js`, `tests/market-fixture.js` for `run.js`), never from a file
committed to the repo. A committed copy can only age: a committed `RefCPI.csv` ran out the day
settlement passed its last row, and a committed quotes file lacked every bond issued after the copy
was taken (e.g. the TIPS maturing July 2036). Two values are rewritten on top of the live data, since
a test run is not itself a download day: the Fidelity download date becomes today (it drives
settlement), and the first line of the FedInvest file becomes the settlement date.

Consequence: the test suite needs live network access to R2, and the UI-test browser sandbox has none —
see 3.1 Data Pipeline §5.0 for the fixture-mocking mechanics this requires.

**The test clock is never pinned to an old date.** A pinned date is exactly the committed-snapshot
problem in a different form — it quietly assumes today's market shape matches some date in the past,
and stops being true the moment that stops holding.

## No test depends on specific holdings

`SampleHoldings.csv` and `SampleDaraPlan.csv`, both derived from the real account, change: the account sells
positions and TIPS mature out of it. No test may assert on a specific CUSIP or maturity year these
files happen to hold today — only on a property that holds for *any* holdings (a shape, an
invariant, a relationship between two computed figures). `scripts/generate-test-fixtures.js`
regenerates these from the real account each time it runs (see Process below); a test that baked in
today's CUSIPs would fail the next time that script runs, for a reason that has nothing to do with a
real regression.

**Holdings a test actually constructs come from one of three places, never a copy of a real
account:** a Build export (a real user flow — build a ladder, export it, use that as the holdings
file), hand-made bond rows (a synthetic market built for the test), or a small synthetic far-future
market (the broker-format parser tests use maturities in 2098/99 specifically so they never collide
with real issuance). `SampleHoldings.csv` itself is reserved for properties that hold for any
holdings, never a specific-CUSIP assertion.

**The within-year allocation-policy tests run on a hand-made one-year ladder** — three held
maturities plus an unheld second January issue, built from bond rows five years after settlement —
rather than any real holding. The quantities and index ratios on those rows are deliberately chosen
to fix the ordering the assertions depend on, the same "synthetic market built for the test"
category as the bond-row holdings above, scoped to exactly the one year this test needs.

**UI-test years are written relative to the settlement year, not as literals** — a gap year is `SY + n`,
read from the First Year dropdown, never a hardcoded calendar year, for the same reason as the
derived structural roles above. The Available Cash maturity test names the bonds maturing this year
by looking them up in TIPS reference data rather than hardcoding a CUSIP, and skips — with a stated
reason, not silently — only in the days before the first maturity of the year, when there is
genuinely nothing yet to test.

## Don't build fixtures for the hypothetical

Prefer the formats actually seen in the wild — a real broker export, this app's own current
Holdings/DARA-plan export format — over hand-built files covering a corner case nothing has actually
produced. A fixture for a case that doesn't occur is speculative coverage: it can't be checked against
reality, and it's one more file to keep in sync with the export format as that format evolves.

**Removed under this rule:** `tests/fixtures/yearago/`, `tests/dev/{SampleHoldingsSnapshot,
RetainedExcessTwoYears, TipsLadderCom, CusipQtyExcess}.csv`, `tests/e2e/{OfxInteriorHoles,
CusipQtyEmptyRung}.csv` — hand-built corner cases, not current formats. `3.0 TIPS Ladder
Rebalancing §DARA Reference Date` has been updated to stop citing the removed year-ago fixtures;
`KNOWN_ISSUES.md` still mentions `tests/fixtures/yearago/` in its own historical entries (that file
is `ladder` session's, left as-is — a historical log, not a live reference).

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
**Done** (`7d90508` and earlier): no test filters out a missing bond or skips a missing file anymore —
a missing `SampleHoldings.csv` or fixture now fails loudly instead.

## Structure comes from the market, not literals

A test does not hardcode which year is the structural gap, which TIPS is the active lower bracket,
or where the ladder ends — those shift as Treasury issues. `tests/ladder-fixtures.js`'s `ladderRoles`
derives the gap, the active lower bracket (the latest-maturing TIPS before the gap), the upper
bracket, and the last maturity year from the outstanding TIPS themselves, each run; Build/Rebalance
tests read those derived roles rather than a written-in year. The Future 30Y cover pair is the one
exception — it stays the 2056 and 2052 TIPS (2.0 TIPS Ladders line 676), a fact the spec states
outright rather than something a test derives from the market.

Two Treasury issue dates change this structure and are worth knowing about when a test starts
failing for no apparent reason: the January 2027 auction of the Jan 2037 10-year narrows the
2037-39 gap to 2038-39, and the February 2027 auction of the Feb 2057 30-year moves the Future 30Y
boundary. A verification harness (not a committed test), `TipsLadderManager/tests/sim-year-turn.cjs`,
simulates a March 2027 market to check the suite still holds up after either issue lands — run it
after any change that touches ladder structure. From `TipsLadderManager/`:
```
node tests/sim-year-turn.cjs && node tests/_sim_run.js
```
then delete the generated `tests/_sim_run.js` (gitignored — it's the harness's own scratch output,
not a fixture to keep). Gotcha: a synthetic bond needs a full nine-character CUSIP — the file
parsers silently drop a shorter one rather than erroring, so a shortened placeholder CUSIP just
vanishes from the simulated market with no warning.

As of this writing it fails on two open engine questions, not a harness problem (both `ladder`
session's, not yet fixed):
- The retained-excess round trip, when the active lower bracket's own year holds a single bond —
  reimporting a build/rebalance export can lose the retained identification, producing about 35
  bonds of churn in the simulated market.
- A Pre-Ladder Interest bug when the first year equals the active lower bracket year — the gap's
  total cost drops to 0. `ladder` will fix this and add a regression test once it lands.

(The roll-coupon item once flagged here is resolved — 2.0's own formula is dynamic, and the test
assertion now follows the last real maturity year rather than a fixed one.)

**Known coverage gap:** the 3-bracket custom-plan reallocation signature (the active bond still
being bought alongside large retained legs) could not be reproduced as a fixture. The relevant test
asserts the invariants that must hold at every cut instead of reproducing that exact signature.

## Process: the fixture-refresh pipeline

A Schwab positions download or a Kevin IRA DARA plan download runs
`scripts/generate-test-fixtures.js`, which regenerates `SampleHoldings.csv` and `SampleDaraPlan.csv`
from the real account at one scale factor (0.5), commits them, and pushes that commit alone
([knowledge/Testing.md §4.0](../knowledge/Testing.md)). `.githooks/pre-push` runs the
unit and UI suites and blocks that push (or any push) on a failure — this file's rulings exist
to keep that gate meaningful rather than a thing contributors route around. The ingestion scripts
themselves (what fetches and writes R2) are specified at 3.1 Data Pipeline §2.0, not here.

**Committing `tests/run.js`:** its blob is stored with CRLF line endings, and `git commit -- <path>`
under `core.autocrlf=true` can silently convert it to LF — a whole-file diff that looks like a
rewrite. After committing a change to this file, check `git show HEAD:TipsLadderManager/tests/run.js
| grep -c $'\r'` to confirm the line endings survived.
