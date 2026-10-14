import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lockedRightMin } from '../src/chart-keys.js';

test('lockedRightMin keeps the window width in timestamp units on a plain axis', () => {
  assert.equal(lockedRightMin(100, 400, 1000), 700);
  assert.equal(lockedRightMin(100, 400, 1000, null, 0.5), 850);
});

test('lockedRightMin keeps the width in drawn units on a compact axis', () => {
  // two sessions, [0, 10] and [100, 110]; the span between them takes no width
  const toPos = t => (t <= 10 ? t : t < 100 ? 10 : 10 + (t - 100));
  const fromPos = p => (p <= 10 ? p : p + 90);
  // [5, 50] is 5 wide when drawn; from anchor 108 (position 18) back 5 positions is position 13 = 103
  assert.equal(lockedRightMin(5, 50, 108, { toPos, fromPos }), 103);
  // half the drawn width: 2.5 back from position 18 is 15.5 = 105.5
  assert.equal(lockedRightMin(5, 50, 108, { toPos, fromPos }, 0.5), 105.5);
});
