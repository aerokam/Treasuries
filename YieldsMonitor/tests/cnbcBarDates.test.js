// cnbcBarDates.test.js — Run: node YieldsMonitor/tests/cnbcBarDates.test.js
// Expected values are read off the calendar and from the observed feed, not computed with the
// module: CNBC labeled the week of Sun 2026-09-20 with a close that equals the 09/25 daily close.
import assert from 'node:assert/strict';
import { weeklyPeriod, quarterlyPeriod, isSunday, isQuarterStart, addDays, mergeHistory } from '../scripts/cnbcBarDates.js';

assert.deepEqual(weeklyPeriod('20260920'), { start: '20260920', end: '20260926', closeDate: '20260925' });
assert.equal(weeklyPeriod('20200329').closeDate, '20200403');   // week of 03/30/2020, close Fri 04/03
assert.equal(weeklyPeriod('20191229').closeDate, '20200103');   // crosses a year boundary

assert.deepEqual(quarterlyPeriod('20200401'), { start: '20200401', end: '20200630', closeDate: '20200630' }); // Tue
assert.equal(quarterlyPeriod('20200101').closeDate, '20200331'); // Tue
assert.equal(quarterlyPeriod('20211001').closeDate, '20211231'); // Fri
assert.equal(quarterlyPeriod('20220401').closeDate, '20220630'); // Thu
assert.equal(quarterlyPeriod('20200701').closeDate, '20200930'); // Wed
assert.equal(quarterlyPeriod('20191001').closeDate, '20191231'); // Tue
assert.equal(quarterlyPeriod('20211001').end, '20211231');
assert.equal(quarterlyPeriod('20260101').closeDate, '20260331'); // Tue
// a quarter ending on a weekend rolls back to Friday: Sat 2018-06-30 -> Fri 06-29; Sun 2017-12-31 -> Fri 12-29
assert.equal(quarterlyPeriod('20180401').closeDate, '20180629');
assert.equal(quarterlyPeriod('20171001').closeDate, '20171229');
assert.equal(quarterlyPeriod('20140701').closeDate, '20140930'); // Tue

assert.equal(isSunday('20260920'), true);
assert.equal(isSunday('20260925'), false);
assert.equal(isQuarterStart('20200401'), true);
assert.equal(isQuarterStart('20200402'), false);
assert.equal(isQuarterStart('20200501'), false);
assert.equal(addDays('20200228', 2), '20200301'); // leap year

// mergeHistory — observed 10Y TIPS case: weekly bar Sun 03/29/2020 closes -0.463 (that week's Friday is 04/03).
const T = '20260928';
let m = mergeHistory(
  { 20200329: -0.463, 20200405: -0.495, 20200401: -0.693 },           // as stored under the old start-label dating
  { ALL: [{ date: '20200401', y: -0.693 }], '5Y': [{ date: '20200329', y: -0.463 }, { date: '20200405', y: -0.495 }] }, T);
assert.deepEqual(m, { 20200403: -0.463, 20200410: -0.495 });        // re-dated to Fridays; quarterly point dropped, weeks cover the quarter

// quarterly-only era (no weekly, no daily): dated the quarter's last weekday
m = mergeHistory({ 20140401: 0.5 }, { ALL: [{ date: '20140401', y: 0.5 }, { date: '20140701', y: 0.7 }] }, T);
assert.deepEqual(m, { 20140630: 0.5, 20140930: 0.7 });

// a daily date inside the period wins: Good Friday week with a Thursday daily bar takes no weekly point
m = mergeHistory({}, { '6M': [{ date: '20260402', y: 3.9 }], '5Y': [{ date: '20260329', y: 3.95 }] }, T);
assert.deepEqual(m, { 20260402: 3.9 });

// a period that has not ended is skipped (current week / current quarter)
m = mergeHistory({}, { '5Y': [{ date: '20260927', y: 1 }], ALL: [{ date: '20260701', y: 2 }] }, '20260928');
assert.deepEqual(m, {});

// a stored genuine daily on a quarter-start label whose value differs from the quarterly bar is kept
m = mergeHistory({ 20240401: 4.4 }, { ALL: [{ date: '20240401', y: 9.9 }], '6M': [{ date: '20240401', y: 4.4 }] }, T);
assert.equal(m['20240401'], 4.4);

// stored quarter-start-labeled point older than the daily feeds, beyond the ALL feed's reach: re-dated, value kept
m = mergeHistory({ 19800101: 14.63 }, { ALL: [{ date: '19890101', y: 9.7 }], '6M': [{ date: '20230928', y: 4.6 }] }, T);
assert.equal(m['19800331'], 14.63);
assert.equal(m['19800101'], undefined);

// idempotent: re-running over its own output changes nothing
const feeds = { ALL: [{ date: '20200401', y: -0.693 }, { date: '20140401', y: 0.5 }], '5Y': [{ date: '20200329', y: -0.463 }] };
const once = mergeHistory({ 20200329: -0.463, 20140401: 0.5 }, feeds, T);
assert.deepEqual(mergeHistory(once, feeds, T), once);
console.log('cnbcBarDates: all assertions passed');
