import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toTradingTime, fromTradingTime, inTradingSession } from '../src/trading-time.js';

const ms = iso => new Date(iso).getTime();

test('a session runs 08:00 to 17:05 ET, weekdays only', () => {
  assert.equal(inTradingSession(ms('2026-10-08T11:59:00Z')), false);
  assert.equal(inTradingSession(ms('2026-10-08T12:00:00Z')), true);
  assert.equal(inTradingSession(ms('2026-10-08T21:05:00Z')), true);
  assert.equal(inTradingSession(ms('2026-10-08T21:06:00Z')), false);
  assert.equal(inTradingSession(ms('2026-10-10T15:00:00Z')), false);
});

test('in-session moments round-trip through the compact axis, across a DST change', () => {
  for (const iso of ['2026-10-08T12:00:00Z', '2026-10-09T21:05:00Z', '2026-10-12T15:30:00Z', '2026-11-02T13:00:00Z', '2026-11-03T13:00:00Z']) {
    assert.equal(fromTradingTime(toTradingTime(ms(iso))), ms(iso));
  }
});

test('Friday close to Monday open is one 20-minute gap; consecutive weekdays the same', () => {
  const gap = (a, b) => (toTradingTime(ms(b)) - toTradingTime(ms(a))) / 60000;
  assert.equal(gap('2026-10-09T21:05:00Z', '2026-10-12T12:00:00Z'), 20);
  assert.equal(gap('2026-10-08T21:05:00Z', '2026-10-09T12:00:00Z'), 20);
  assert.equal(gap('2026-11-02T13:00:00Z', '2026-11-03T13:00:00Z'), 565);
});

test('moments outside a session take the nearest edge of their own day', () => {
  assert.equal(toTradingTime(ms('2026-10-08T05:00:00Z')), toTradingTime(ms('2026-10-08T12:00:00Z')));
  assert.equal(toTradingTime(ms('2026-10-08T23:00:00Z')), toTradingTime(ms('2026-10-08T21:05:00Z')));
  assert.equal(toTradingTime(ms('2026-10-10T15:00:00Z')), toTradingTime(ms('2026-10-09T21:05:00Z')));
});
