import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatCsv, parseCsv } from '../src/csv.js';

test('formatCsv joins cells with commas and rows with CRLF, ending with CRLF', () => {
  assert.equal(formatCsv(['a', 'b'], [['1', '2'], ['3', '4']]), 'a,b\r\n1,2\r\n3,4\r\n');
});

test('formatCsv quotes a cell holding a comma, a double quote or a line break, and doubles the quote', () => {
  assert.equal(formatCsv(['h'], [['1,234'], ['say "hi"'], ['a\nb']]), 'h\r\n"1,234"\r\n"say ""hi"""\r\n"a\nb"\r\n');
});

test('formatCsv writes null and undefined as empty cells', () => {
  assert.equal(formatCsv(['a', 'b'], [[null, undefined]]), 'a,b\r\n,\r\n');
});

test('formatCsv with no rows writes the header row alone', () => {
  assert.equal(formatCsv(['a', 'b'], []), 'a,b\r\n');
});

test('parseCsv reads back what formatCsv wrote for a cell with a comma', () => {
  const out = parseCsv(formatCsv(['Amt'], [['1,234']]));
  assert.deepEqual(out, [{ Amt: '1,234' }]);
});
