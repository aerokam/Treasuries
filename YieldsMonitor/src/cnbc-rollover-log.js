import { localDate, toIsoDate } from '../../shared/src/settlement.js';

// cnbc-rollover-log.js — the observed record of which real TIPS bond each CNBC canonical-
// maturity symbol (US1YTIPS, US2YTIPS, ...) was actually quoting on a given past date.
// Bond identity — today vs. history:
// CNBC's restQuote endpoint (fetchTipsBondMeta) only exposes each symbol's CURRENT
// underlying bond, not a historical CUSIP-per-date mapping — so it's used as the
// authoritative source for TODAY's point only. For every other (historical) point,
// the bond identity comes from CNBC_ROLLOVER_LOG below: an empirically OBSERVED record
// of which maturity each symbol actually quoted, not a predicted one. A calendar rule
// ("rolls every 6 months, on the 15th of the origin-auction month, always the same
// family") was tried and falsified twice: not just a variable lag after the checkpoint,
// but sometimes a different origin-auction family altogether (US1YTIPS/US2YTIPS have
// matched 5-year-origin Apr15/Oct15 bonds at some points, not just the 10-year-origin
// Jan15/Jul15 family) — no fixed rule reproduces this. Rollover dates are instead pinned
// individually by cross-checking CNBC's own historical yield against real FedInvest
// settlement prices (TreasuryDirect's historical price tool) for every plausible
// candidate bond (any TIPS maturity in the plausible tenor range, any family), computing
// each candidate's implied yield via bond-math.js and taking whichever bond's implied
// yield is closest to CNBC's reported yield that day. FedInvest's `sell` price (what a
// holder receives — the bid) is used, falling back to `buy` (the ask) when a candidate
// has no active bid that day (`sell=0`) — CNBC's own quotes are bid-side, so `sell` is
// the correct proxy, not `buy`. (An earlier version of this had the two backwards —
// `buy`-primary — which silently corrupted several pinned dates below: it manufactured
// a brief intermediate cohort in Feb 2025 that doesn't survive the corrected price, and
// shifted two other boundary dates by a few days.) The raw `eod` evaluated price is not
// used at all: it was found to produce a stale, misleading price on at least one no-bid
// day. Some transitions resolve to more than one intermediate cohort in quick succession
// rather than a single clean flip; each is recorded as its own entry rather than picked
// as one "the" transition date. Not every period resolves: when candidate bonds' implied
// yields are too close together to disambiguate reliably (a flat 1-2yr TIPS curve), that
// stretch is left as an explicit gap rather than guessed — including gaps *between* two
// resolved cohorts, recorded as a `{ from, maturity: null }` entry (no TipsRef.csv row
// has a null maturity, so resolveTipsBond() naturally returns "no match" for that span).

export const CNBC_ROLLOVER_LOG = {
  US1YTIPS: [
    // FALLBACK-DERIVED (2014-04-01 .. 2024-02-29): the empirical CNBC-vs-FedInvest cross-check
    // can't disambiguate candidates this far back (same "too close together" problem as the
    // 2023-08-19..2024-02 stretch previously left as a gap) — but per explicit direction, a
    // quoted yield with no SA counterpart at all is worse than a lower-confidence SA value, so
    // this range is filled instead of left empty. Method: for each date, pick whichever real
    // TIPS in TipsRef.csv (already issued, not yet matured) has a maturity closest to date+1yr;
    // walk forward and emit an entry each time that pick changes (script: see git history of
    // this file's PR, not checked in). This is NOT a claim that CNBC's US1YTIPS quote actually
    // tracked this exact CUSIP on these dates — see Known limitations. Sanity check: the last
    // entry here (maturity 2025-01-15) lands exactly on the first cross-checked entry below, so
    // the two methods agree at the boundary.
    { from: '2014-04-01', maturity: '2015-04-15' },
    { from: '2014-06-02', maturity: '2015-07-15' },
    { from: '2014-10-16', maturity: '2016-01-15' },
    { from: '2015-03-02', maturity: '2016-04-15' },
    { from: '2015-06-01', maturity: '2016-07-15' },
    { from: '2015-10-16', maturity: '2017-01-15' },
    { from: '2016-03-02', maturity: '2017-04-15' },
    { from: '2016-05-31', maturity: '2017-07-15' },
    { from: '2016-10-17', maturity: '2018-01-15' },
    { from: '2017-03-02', maturity: '2018-04-15' },
    { from: '2017-05-31', maturity: '2018-07-15' },
    { from: '2017-10-16', maturity: '2019-01-15' },
    { from: '2018-03-02', maturity: '2019-04-15' },
    { from: '2018-05-31', maturity: '2019-07-15' },
    { from: '2018-10-16', maturity: '2020-01-15' },
    { from: '2019-03-01', maturity: '2020-04-15' },
    { from: '2019-05-31', maturity: '2020-07-15' },
    { from: '2019-10-16', maturity: '2021-01-15' },
    { from: '2020-03-02', maturity: '2021-04-15' },
    { from: '2020-06-01', maturity: '2021-07-15' },
    { from: '2020-10-16', maturity: '2022-01-15' },
    { from: '2021-03-02', maturity: '2022-04-15' },
    { from: '2021-05-31', maturity: '2022-07-15' },
    { from: '2021-10-18', maturity: '2023-01-15' },
    { from: '2022-03-02', maturity: '2023-04-15' },
    { from: '2022-05-31', maturity: '2023-07-15' },
    { from: '2022-10-17', maturity: '2024-01-15' },
    { from: '2023-03-01', maturity: '2024-04-15' },
    { from: '2023-05-31', maturity: '2024-07-15' },
    { from: '2023-08-31', maturity: '2024-10-15' },
    { from: '2023-12-01', maturity: '2025-01-15' },
    // CROSS-CHECKED (empirical CNBC-vs-FedInvest match) from here on.
    { from: '2024-03-01', maturity: '2025-01-15' },
    { from: '2024-06-10', maturity: '2025-04-15' },
    { from: '2024-07-22', maturity: '2025-07-15' },
    { from: '2025-01-17', maturity: '2025-10-15' },
    // 2025-02-15..2025-02-25: previously a `maturity: null` gap (candidates within a few bp,
    // flipping non-monotonically day to day) — per the same fill-don't-gap direction, the prior
    // cohort (2025-10-15) is just left in effect through this narrow window instead; the SA
    // error from picking either side is bounded by that same sub-few-bp closeness.
    { from: '2025-02-26', maturity: '2026-01-15' },
    { from: '2025-07-10', maturity: '2026-04-15' }, // corrected from 2025-07-14 — re-bisected under sell-primary price
    { from: '2025-08-01', maturity: '2026-07-15' }, // corrected from 2025-08-04 — re-bisected under sell-primary price
    { from: '2026-02-10', maturity: '2027-01-15' },
    { from: '2026-09-01', maturity: '2027-07-15' }, // cross-checked: bisected between 2026-08-31 (still prior cohort, diffs 3-7bp) and 2026-09-01 (new cohort, diffs ~0.5bp)
  ],
  US2YTIPS: [
    // FALLBACK-DERIVED (2014-04-01 .. 2024-02-29) — same method as US1YTIPS above, target
    // maturity closest to date+2yr instead of date+1yr. Sanity check: the last entry here
    // (2026-01-15) lands exactly on the first cross-checked entry below.
    { from: '2014-04-01', maturity: '2016-04-15' },
    { from: '2014-06-02', maturity: '2016-07-15' },
    { from: '2014-10-16', maturity: '2017-01-15' },
    { from: '2015-03-02', maturity: '2017-04-15' },
    { from: '2015-06-01', maturity: '2017-07-15' },
    { from: '2015-10-16', maturity: '2018-01-15' },
    { from: '2016-03-02', maturity: '2018-04-15' },
    { from: '2016-05-31', maturity: '2018-07-15' },
    { from: '2016-10-17', maturity: '2019-01-15' },
    { from: '2017-03-02', maturity: '2019-04-15' },
    { from: '2017-05-31', maturity: '2019-07-15' },
    { from: '2017-10-16', maturity: '2020-01-15' },
    { from: '2018-03-01', maturity: '2020-04-15' },
    { from: '2018-05-31', maturity: '2020-07-15' },
    { from: '2018-10-16', maturity: '2021-01-15' },
    { from: '2019-03-04', maturity: '2021-04-15' },
    { from: '2019-05-31', maturity: '2021-07-15' },
    { from: '2019-10-16', maturity: '2022-01-15' },
    { from: '2020-03-02', maturity: '2022-04-15' },
    { from: '2020-06-01', maturity: '2022-07-15' },
    { from: '2020-10-16', maturity: '2023-01-15' },
    { from: '2021-03-02', maturity: '2023-04-15' },
    { from: '2021-05-31', maturity: '2023-07-15' },
    { from: '2021-10-18', maturity: '2024-01-15' },
    { from: '2022-03-01', maturity: '2024-04-15' },
    { from: '2022-05-31', maturity: '2024-07-15' },
    { from: '2022-08-31', maturity: '2024-10-15' },
    { from: '2022-12-01', maturity: '2025-01-15' },
    { from: '2023-03-02', maturity: '2025-04-15' },
    { from: '2023-05-31', maturity: '2025-07-15' },
    { from: '2023-08-31', maturity: '2025-10-15' },
    { from: '2023-12-01', maturity: '2026-01-15' },
    // CROSS-CHECKED (empirical CNBC-vs-FedInvest match) from here on — same rollover events as
    // US1YTIPS above; 1Y/2Y roll together.
    { from: '2024-03-01', maturity: '2026-01-15' },
    { from: '2024-06-10', maturity: '2026-04-15' },
    { from: '2024-07-22', maturity: '2026-07-15' },
    { from: '2025-01-17', maturity: '2026-10-15' },
    // 2025-02-15..2025-02-25: see US1YTIPS above — filled by carrying the prior cohort forward
    // rather than left as a gap.
    { from: '2025-02-26', maturity: '2027-01-15' },
    { from: '2025-07-10', maturity: '2027-04-15' },
    { from: '2025-08-01', maturity: '2027-07-15' },
    { from: '2026-02-10', maturity: '2028-01-15' },
    { from: '2026-09-01', maturity: '2028-07-15' }, // cross-checked: same rollover event as US1YTIPS above — bisected between 2026-08-31 (still prior cohort, diffs 5-7bp) and 2026-09-01 (new cohort, diffs ~0.6-2.8bp)
  ],
  // US5YTIPS: the empirical cross-check is unresolvable here too (candidate 5-Year cohorts'
  // yields sit too close together to disambiguate, same as US10YTIPS below), so the issue-date
  // fallback (see the ISSUE-DATE FALLBACK note above US10YTIPS further down) applies here as
  // well: flip = first trading day strictly after the last business day of the month containing
  // the new cohort's TipsRef.csv datedDate (5-Year: Apr/Oct — annual Apr-only through 2019,
  // semiannual Apr+Oct from Oct 2019).
  // Not extended earlier than the 2006-04-15-dated cohort: 5-Year TIPS had their own issuance
  // hiatus (last pre-2004 cohort dated 1997-07-15, maturing 2002-07-15; no cohort again until
  // 2006-04-15), so CNBC's US5YTIPS quotes during that dead stretch (history exists back to
  // 2004) aren't a real on-the-run 5-Year TIPS and are left an explicit gap, same reasoning as
  // US30YTIPS's 2001-2010 hiatus below.
  US5YTIPS: [
    { from: '2006-05-01', maturity: '2011-04-15' },
    { from: '2007-05-01', maturity: '2012-04-15' },
    { from: '2008-05-01', maturity: '2013-04-15' },
    { from: '2009-05-01', maturity: '2014-04-15' },
    { from: '2010-05-03', maturity: '2015-04-15' },
    { from: '2011-05-02', maturity: '2016-04-15' },
    { from: '2012-05-01', maturity: '2017-04-15' },
    { from: '2013-05-01', maturity: '2018-04-15' },
    { from: '2014-05-01', maturity: '2019-04-15' },
    { from: '2015-05-01', maturity: '2020-04-15' },
    { from: '2016-05-02', maturity: '2021-04-15' },
    { from: '2017-05-01', maturity: '2022-04-15' },
    { from: '2018-05-01', maturity: '2023-04-15' },
    { from: '2019-05-01', maturity: '2024-04-15' },
    { from: '2019-11-01', maturity: '2024-10-15' },
    { from: '2020-05-01', maturity: '2025-04-15' },
    { from: '2020-11-02', maturity: '2025-10-15' },
    { from: '2021-05-03', maturity: '2026-04-15' },
    { from: '2021-11-01', maturity: '2026-10-15' },
    { from: '2022-05-02', maturity: '2027-04-15' },
    { from: '2022-11-01', maturity: '2027-10-15' },
    { from: '2023-05-01', maturity: '2028-04-15' },
    { from: '2023-11-01', maturity: '2028-10-15' },
    { from: '2024-05-01', maturity: '2029-04-15' },
    { from: '2024-11-01', maturity: '2029-10-15' },
    { from: '2025-05-01', maturity: '2030-04-15' },
    { from: '2025-11-03', maturity: '2030-10-15' }, // issue-date fallback extends earlier than the previously cross-checked 2026-03-20 for this same maturity — superseded, dropped
    { from: '2026-06-01', maturity: '2031-04-15' }, // cross-checked (kept as-is over the derived 2026-05-01 — moot either way, CNBC has no raw data in that gap; see rollover log narrative)
  ],
  // US10YTIPS: genuinely unresolvable by the empirical cross-check above, not merely
  // unattempted. Consecutive 10-Year TIPS cohorts (issued every Jan/Jul) mature only
  // ~6 months apart, and at that curve region (~9-10yr) real-yield differences between
  // adjacent cohorts are consistently sub-1.5bp — smaller than the noise floor of the
  // CNBC/FedInvest comparison itself (confirmed against 8 dates spanning the most
  // recent, otherwise-cleanest rollover window, Aug 2026; a sanity check against a
  // deliberately-wrong ~1.5yr-off candidate the same day showed an 8.5bp gap, so the
  // method itself works — the two adjacent 10Y candidates are just too close on the
  // curve to tell apart). Matches the front-end-only seasonal-residual finding in
  // YieldCurves/knowledge/SAO_Residual_Analysis.md.
  //
  // ISSUE-DATE FALLBACK (a second, lower-confidence pinning method, used only where the
  // empirical cross-check above is provably unresolvable — this is NOT a reversion to the
  // falsified "assume a calendar rule" approach; it's the opposite conclusion from the same
  // evidence. The cross-check fails here *because* adjacent cohorts' yields are too close to
  // tell apart, which is exactly the situation where the flip date barely matters: the SA
  // error from picking the "wrong" day is bounded by that same sub-1.5bp gap, not by tens of
  // bp like the falsified calendar rules were. Rule (empirically validated against the one
  // cross-checked US30YTIPS transition below: last business day of Feb 2026 was Fri 2026-02-27,
  // still the prior cohort; the new cohort was first seen 2026-03-02, the next trading day —
  // exact match): flip = the first trading day strictly after the last business day of the
  // month containing the new cohort's TipsRef.csv `datedDate` (10-Year: Jan/Jul; 30-Year: Feb).
  // Applied here to every US10YTIPS cohort back through TipsRef.csv (all 54 10-Year rows,
  // 1997 through today — including through the 2002-2003 issuance hiatus, which the rule
  // handles automatically: the 2012-07-15 cohort's `from` just spans the ~13 months until
  // the next actual cohort, no special-casing needed), and to every US30YTIPS cohort before
  // the one cross-checked entry below (which is left untouched — more precise than the
  // derived rule for that one case, even though the rule reproduces it exactly). US30YTIPS
  // is NOT extended earlier than 2023-03-01: 30-Year TIPS issuance itself had a ~9-year dead
  // stretch (2001-2010) where no 30-Year TIPS existed at all, so a mechanically-derived
  // "current cohort" for that gap wouldn't correspond to a real, actively-issued bond.
  US10YTIPS: [
    { from: '1997-02-03', maturity: '2007-01-15' },
    { from: '1998-02-02', maturity: '2008-01-15' },
    { from: '1999-02-01', maturity: '2009-01-15' },
    { from: '2000-02-01', maturity: '2010-01-15' },
    { from: '2001-02-01', maturity: '2011-01-15' },
    { from: '2002-02-01', maturity: '2012-01-15' },
    { from: '2002-08-01', maturity: '2012-07-15' }, // issuance hiatus follows — no 2013-01-15 cohort; this entry spans until the next real cohort below
    { from: '2003-08-01', maturity: '2013-07-15' },
    { from: '2004-02-02', maturity: '2014-01-15' },
    { from: '2004-08-02', maturity: '2014-07-15' },
    { from: '2005-02-01', maturity: '2015-01-15' },
    { from: '2005-08-01', maturity: '2015-07-15' },
    { from: '2006-02-01', maturity: '2016-01-15' },
    { from: '2006-08-01', maturity: '2016-07-15' },
    { from: '2007-02-01', maturity: '2017-01-15' },
    { from: '2007-08-01', maturity: '2017-07-15' },
    { from: '2008-02-01', maturity: '2018-01-15' },
    { from: '2008-08-01', maturity: '2018-07-15' },
    { from: '2009-02-02', maturity: '2019-01-15' },
    { from: '2009-08-03', maturity: '2019-07-15' },
    { from: '2010-02-01', maturity: '2020-01-15' },
    { from: '2010-08-02', maturity: '2020-07-15' },
    { from: '2011-02-01', maturity: '2021-01-15' },
    { from: '2011-08-01', maturity: '2021-07-15' },
    { from: '2012-02-01', maturity: '2022-01-15' },
    { from: '2012-08-01', maturity: '2022-07-15' },
    { from: '2013-02-01', maturity: '2023-01-15' },
    { from: '2013-08-01', maturity: '2023-07-15' },
    { from: '2014-02-03', maturity: '2024-01-15' },
    { from: '2014-08-01', maturity: '2024-07-15' },
    { from: '2015-02-02', maturity: '2025-01-15' },
    { from: '2015-08-03', maturity: '2025-07-15' },
    { from: '2016-02-01', maturity: '2026-01-15' },
    { from: '2016-08-01', maturity: '2026-07-15' },
    { from: '2017-02-01', maturity: '2027-01-15' },
    { from: '2017-08-01', maturity: '2027-07-15' },
    { from: '2018-02-01', maturity: '2028-01-15' },
    { from: '2018-08-01', maturity: '2028-07-15' },
    { from: '2019-02-01', maturity: '2029-01-15' },
    { from: '2019-08-01', maturity: '2029-07-15' },
    { from: '2020-02-03', maturity: '2030-01-15' },
    { from: '2020-08-03', maturity: '2030-07-15' },
    { from: '2021-02-01', maturity: '2031-01-15' },
    { from: '2021-08-02', maturity: '2031-07-15' },
    { from: '2022-02-01', maturity: '2032-01-15' },
    { from: '2022-08-01', maturity: '2032-07-15' },
    { from: '2023-02-01', maturity: '2033-01-15' },
    { from: '2023-08-01', maturity: '2033-07-15' },
    { from: '2024-02-01', maturity: '2034-01-15' },
    { from: '2024-08-01', maturity: '2034-07-15' },
    { from: '2025-02-03', maturity: '2035-01-15' },
    { from: '2025-08-01', maturity: '2035-07-15' }, // same computed flip date as US1YTIPS/US2YTIPS's cross-checked 2025-08-01 entries above — independent confirmation the issue-date rule is right, since that entry was pinned by yield cross-check, not this rule
    { from: '2026-02-02', maturity: '2036-01-15' },
    { from: '2026-08-03', maturity: '2036-07-15' }, // current cohort
  ],
  US30YTIPS: [
    { from: '2023-03-01', maturity: '2053-02-15' }, // issue-date fallback (see note above)
    { from: '2024-03-01', maturity: '2054-02-15' }, // issue-date fallback
    { from: '2025-03-03', maturity: '2055-02-15' }, // issue-date fallback — this transition was ambiguous under the empirical cross-check (same pattern as the Feb 2025 US1YTIPS gap) and wasn't cross-checkable
    { from: '2026-03-02', maturity: '2056-02-15' }, // cross-checked (see method above): bisected between 2026-02-27 (still prior cohort, 2055-02-15) and 2026-03-02 (next trading day)
  ],
};

// Resolves the TIPS bond (maturity + coupon) actually behind `sym` on tradeDate, per the
// observed rollover history in CNBC_ROLLOVER_LOG above. Returns null (a gap, not a guess)
// when tradeDate predates the earliest entry we've cross-checked, or TipsRef.csv doesn't
// have a matching maturity.
export function resolveTipsBond(tradeDate, sym, refRows) {
  const log = CNBC_ROLLOVER_LOG[sym];
  if (!log || !refRows) return null;
  const tradeDateStr = toIsoDate(tradeDate);
  let entry = null;
  for (const e of log) { if (e.from <= tradeDateStr) entry = e; else break; }
  if (!entry) return null;
  const candidates = refRows.filter(r => r.maturity === entry.maturity);
  if (!candidates.length) return null;
  candidates.sort((a, b) => (a.datedDate < b.datedDate ? 1 : -1)); // most recently dated first
  const chosen = candidates[0];
  return { maturity: localDate(chosen.maturity), coupon: parseFloat(chosen.coupon) };
}

