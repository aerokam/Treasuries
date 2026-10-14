import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toTradingTime, fromTradingTime, inTradingSession, isWeekendMoment } from '../src/trading-time.js';

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

// weekend days have no width, so their day ticks are dropped
assert.equal(isWeekendMoment(ms('2026-10-10T16:00:00Z')), true);  // Saturday noon ET
assert.equal(isWeekendMoment(ms('2026-10-11T03:59:00Z')), true);  // Saturday 23:59 ET
assert.equal(isWeekendMoment(ms('2026-10-09T16:00:00Z')), false); // Friday
assert.equal(isWeekendMoment(ms('2026-10-12T04:00:00Z')), false); // Monday 00:00 ET

// one session with its separator counts as one calendar day when a unit is chosen from drawn width
import { toCalendarScaledTime } from '../src/trading-time.js';
const DAY = 86400000;
assert.equal(
  Math.round(toCalendarScaledTime(ms('2026-10-09T12:00:00Z')) - toCalendarScaledTime(ms('2026-10-08T12:00:00Z'))),
  DAY,
);
// Friday open to Monday open is one session apart, not three days
assert.equal(
  Math.round(toCalendarScaledTime(ms('2026-10-12T12:00:00Z')) - toCalendarScaledTime(ms('2026-10-09T12:00:00Z'))),
  DAY,
);

// tick spacing: the smallest round step that leaves at most maxTicks ticks
import { niceTickStep, alignedTicks } from '../src/trading-time.js';
const MINUTE = 60000, HOUR = 3600000;
assert.equal(niceTickStep(3 * HOUR, 6), 30 * MINUTE);   // 3 hours visible: half-hours, not hours
assert.equal(niceTickStep(2 * HOUR, 10), 15 * MINUTE);
assert.equal(niceTickStep(20 * MINUTE, 8), 5 * MINUTE);
assert.equal(niceTickStep(9 * HOUR, 10), HOUR);
assert.equal(niceTickStep(10 * DAY, 8), 2 * DAY);
assert.equal(niceTickStep(5000 * DAY, 8), null);         // beyond the steps: a calendar unit is used
// ticks fall on round ET wall-clock times (EDT, UTC-4 on this date)
assert.deepEqual(
  alignedTicks(ms('2026-10-13T14:07:00Z'), ms('2026-10-13T15:03:00Z'), 15 * MINUTE).map(t => new Date(t).toISOString().slice(11, 16)),
  ['14:15', '14:30', '14:45', '15:00'],
);
assert.deepEqual(
  alignedTicks(ms('2026-10-13T14:07:00Z'), ms('2026-10-13T20:00:00Z'), 3 * HOUR).map(t => new Date(t).toISOString().slice(11, 16)),
  ['16:00', '19:00'], // 12:00 and 15:00 ET
);
