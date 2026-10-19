import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toTradingTime, fromTradingTime, inTradingSession, isNonTradingMoment, setHolidays } from '../src/trading-time.js';

const ms = iso => new Date(iso).getTime();
setHolidays(new Set(['2026-10-12', '2026-10-10'])); // Columbus Day (Monday); a Saturday entry is ignored

test('a holiday has no trading session', () => {
  assert.equal(inTradingSession(ms('2026-10-12T15:00:00Z')), false);
  assert.equal(inTradingSession(ms('2026-10-13T15:00:00Z')), true);
  assert.equal(isNonTradingMoment(ms('2026-10-12T15:00:00Z')), true);
  assert.equal(isNonTradingMoment(ms('2026-10-13T15:00:00Z')), false);
});

test('Friday close to the Tuesday open after a Monday holiday is one 20-minute gap', () => {
  const gap = (a, b) => (toTradingTime(ms(b)) - toTradingTime(ms(a))) / 60000;
  assert.equal(gap('2026-10-09T21:05:00Z', '2026-10-13T12:00:00Z'), 20);
  assert.equal(toTradingTime(ms('2026-10-12T15:00:00Z')), toTradingTime(ms('2026-10-09T21:05:00Z')));
});

test('moments after a holiday round-trip through the compact axis', () => {
  for (const iso of ['2026-10-09T12:00:00Z', '2026-10-13T15:30:00Z', '2026-10-16T21:05:00Z', '2026-10-19T13:00:00Z']) {
    assert.equal(fromTradingTime(toTradingTime(ms(iso))), ms(iso));
  }
});
