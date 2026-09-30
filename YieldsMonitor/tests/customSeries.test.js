// customSeries.test.js — Run: node YieldsMonitor/tests/customSeries.test.js
import assert from 'node:assert/strict';
import { layerCustomSeries, archiveDatesToRead, customBounds, showMarkers, countVisible, MAX_ARCHIVE_DAYS } from '../src/custom-series.js';

const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' });
const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' });
const etDay = d => ymd.format(d);
const isWeekend = d => /Sat|Sun/.test(wd.format(d));
// ET wall-clock -> Date, in EDT (UTC-4) for the September 2026 dates used here
const et = (day, hm) => new Date(`2026-09-${day}T${hm}:00-04:00`);
const pt = (day, hm, y) => ({ x: et(day, hm), y });
const START = et('21', '00:00').getTime(), END = et('26', '00:00').getTime(); // Mon 21st .. Fri 25th inclusive

// finest resolution per day: 21st has minute bars, 22nd only five-minute, 23rd only a daily point
const out = layerCustomSeries({
  daily: [pt('21', '15:00', 1), pt('22', '15:00', 2), pt('23', '15:00', 3)],
  fiveMin: [pt('21', '10:00', 10), pt('22', '10:00', 11), pt('22', '10:05', 12)],
  minute: [pt('21', '09:31', 20), pt('21', '09:30', 21)],
  startMs: START, endMs: END, etDay, isWeekend,
});
assert.deepEqual(out.map(p => p.y), [21, 20, 11, 12, 3]);                       // 21st: minute only; 22nd: five-minute only; 23rd: daily
assert.deepEqual(out.map(p => +p.x), [...out.map(p => +p.x)].sort((a, b) => a - b)); // sorted

// window edges and weekends drop points; equal timestamps keep the last
const edge = layerCustomSeries({
  minute: [pt('20', '12:00', 1), pt('21', '12:00', 2), pt('21', '12:00', 3), pt('26', '00:00', 4), pt('27', '12:00', 5)], // 20th and 27th are weekend days
  startMs: START, endMs: END, etDay, isWeekend });
assert.deepEqual(edge.map(p => p.y), [3]);                                        // 20th weekend, 26th at END excluded, 27th weekend

// archive dates: window Mon 14 .. Fri 25, live one-minute feed starts Tue 22, today Wed 23
const wdays = ['20260914', '20260915', '20260916', '20260917', '20260918', '20260921'];
const nextDate = d => { const t = new Date(Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8) + 1)); return t.toISOString().slice(0, 10).replace(/-/g, ''); };
assert.deepEqual(archiveDatesToRead(wdays, '20260922', '20260923', nextDate),
  ['20260914', '20260915', '20260916', '20260917', '20260918', '20260919', '20260921', '20260922']);
// today has no file, and a live feed that reaches back excludes the days it covers
assert.deepEqual(archiveDatesToRead(['20260922', '20260923'], null, '20260923', nextDate), ['20260922']);
assert.deepEqual(archiveDatesToRead(['20260921', '20260922'], '20260921', '20260923', nextDate), []);
// only the most recent MAX_ARCHIVE_DAYS weekdays are read
const fifteen = ['20260803', '20260804', '20260805', '20260806', '20260807', '20260810', '20260811', '20260812', '20260813', '20260814', '20260817', '20260818', '20260819', '20260820', '20260821'];
const got = archiveDatesToRead(fifteen, null, '20261231', nextDate);
assert.equal(MAX_ARCHIVE_DAYS, 10);
assert.equal(got.includes('20260807'), false);  // the 5 oldest weekdays are outside the 10 most recent
assert.equal(got.includes('20260810'), true);   // first of the 10 most recent
assert.equal(got.includes('20260822'), true);   // the day after the last one, for its evening bars

// bounds run from the first point to one minute past the last; a single timestamp gets one minute either side
assert.equal(customBounds([]), null);
assert.deepEqual(customBounds([{ x: new Date(1000000) }, { x: new Date(11000000) }]), { min: 1000000, max: 11000000 + 60000 });
assert.deepEqual(customBounds([{ x: new Date(5000000) }]), { min: 5000000 - 60000, max: 5000000 + 60000 });

// markers appear once adjacent visible points are at least 8 px apart
assert.equal(showMarkers(100, 800), true);   // 8 px each
assert.equal(showMarkers(101, 800), false);  // just under 8 px
assert.equal(showMarkers(1, 800), false);    // a single point has no spacing to judge
assert.equal(showMarkers(0, 800), false);

// countVisible is inclusive at both ends
const pts = [1, 2, 3, 4, 5].map(n => ({ x: n }));
assert.equal(countVisible(pts, 2, 4), 3);
assert.equal(countVisible(pts, 6, 9), 0);
assert.equal(countVisible(pts, 0, 1), 1);
console.log('customSeries: all assertions passed');
