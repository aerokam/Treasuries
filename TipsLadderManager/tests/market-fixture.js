// Serves the tests/e2e/*.csv fixtures to the app's own data loader.
//
// Tests must not re-implement the market-data load: which source is live is decided inside
// shared/src/market-data.js's loadMarketData() (3.1 §4.0 Yield Sources), and a test that parses a CSV itself has to
// pick a source, which is the one thing it cannot get right by construction. Installing this shim
// and calling loadMarketData() gives a test exactly the rows, dates, and source the app gets.
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'e2e');

// The tests run on one pinned day, never the real one. Every fixture in tests/e2e is a snapshot of a
// single day's market (quotes, Ref CPI, SA yields), and the real clock walks away from it: bonds
// mature, the Ref CPI file runs out, month-end passes. Pinning "today" to the snapshot day keeps the
// quotes, the holdings priced against them, and the settlement date one consistent day indefinitely.
// To move the snapshot forward, refresh every tests/e2e fixture and change this date together.
export const PINNED_TODAY = '2026-07-24';

// Node side: make `new Date()` and Date.now() return the pinned day. The browser side does the same
// through page.clock.setFixedTime (tests/e2e/app.spec.js).
export function installPinnedClock() {
  const RealDate = Date;
  const t = new RealDate(PINNED_TODAY + 'T12:00:00').getTime();
  class PinnedDate extends RealDate {
    constructor(...args) { if (args.length === 0) super(t); else super(...args); }
    static now() { return t; }
  }
  globalThis.Date = PinnedDate;
}

// The Fidelity download date drives the settlement date, so it is rewritten to the pinned day:
// the fixture carries a fixed historical footer.
export function fidelityWithPinnedDownloadDate(raw) {
  const [y, mo, dy] = PINNED_TODAY.split('-');
  return raw.replace(/Date downloaded.*$/m, `Date downloaded   ${mo}/${dy}/${y} 12:00 PM`);
}

// FedInvest's fixture carries its own settlement date on line 1; keep it in step with the pinned day too,
// so the dormant cross-check path behaves the same way when it is switched on.
export function fedInvestWithPinnedSettlement(raw, settleDateStr) {
  const lines = raw.split('\n');
  lines[0] = settleDateStr;
  return lines.join('\n');
}

// Replaces global fetch with a reader over the fixture directory, matched on the URL's basename.
export function installFixtureFetch({ settleDateStr } = {}) {
  globalThis.fetch = async (url) => {
    const name = String(url).split('/').pop().split('?')[0];
    let body;
    try { body = readFileSync(path.join(FIXTURES, name), 'utf8'); }
    catch {
      return { ok: false, status: 404, async text() { return ''; } };
    }
    if (name === 'FidelityTreasuriesTips.csv') body = fidelityWithPinnedDownloadDate(body);
    if (name === 'YieldsFromFedInvestPrices.csv' && settleDateStr) {
      body = fedInvestWithPinnedSettlement(body, settleDateStr);
    }
    return { ok: true, status: 200, async text() { return body; } };
  };
}
