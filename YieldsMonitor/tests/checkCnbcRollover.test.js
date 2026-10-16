import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldPush } from '../scripts/checkCnbcRollover.js';

test('pushes when local main has no unpushed commits and origin/main is not ahead', () => {
  assert.equal(shouldPush({ ahead: 0, behind: 0 }).push, true);
});

test('skips the push when local main has unpushed commits, and says how many', () => {
  const d = shouldPush({ ahead: 3, behind: 0 });
  assert.equal(d.push, false);
  assert.match(d.reason, /local main has 3 unpushed commit/);
});

test('skips the push when origin/main is ahead of local main', () => {
  const d = shouldPush({ ahead: 0, behind: 2 });
  assert.equal(d.push, false);
  assert.match(d.reason, /origin\/main is ahead/);
});

test('skips the push when both counts are nonzero, reporting the unpushed commits', () => {
  const d = shouldPush({ ahead: 1, behind: 1 });
  assert.equal(d.push, false);
  assert.match(d.reason, /1 unpushed commit/);
});

test('skips the push when a count could not be read', () => {
  assert.equal(shouldPush({ ahead: null, behind: null }).push, false);
  assert.equal(shouldPush({ ahead: 0, behind: null }).push, false);
  assert.equal(shouldPush({ ahead: NaN, behind: 0 }).push, false);
});
