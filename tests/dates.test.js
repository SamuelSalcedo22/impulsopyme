'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { addDays, weekday, dateRange, localDate } = require('../server/utils/dates');

test('addDays cruza meses y años sin problemas de zona horaria', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('weekday: 0 es domingo', () => {
  assert.equal(weekday('2026-11-11'), 3);
  assert.equal(weekday('2026-11-08'), 0);
});

test('dateRange incluye ambos extremos', () => {
  assert.deepEqual(dateRange('2026-02-27', '2026-03-02'), ['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02']);
});

test('localDate usa la zona de Bogotá', () => {
  assert.equal(localDate(new Date('2026-06-01T03:00:00Z')), '2026-05-31');
});
