'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { mean, median, std, robustSigma, linearFit } = require('../server/analytics/stats');
const { forecastSales, MIN_DAYS } = require('../server/analytics/forecast');
const { detectAnomalies } = require('../server/analytics/anomalies');
const { addDays } = require('../server/utils/dates');

/** Serie sintética: base semanal marcada (viernes fuertes) y ruido determinista. */
function series(days, { spikeAt = -1, spike = 1 } = {}) {
  const start = '2026-06-01';
  const factors = [0.8, 0.9, 0.9, 1, 1.1, 1.5, 1.3];
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(start, i);
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
    const noise = 1 + (((i * 37) % 11) - 5) / 100;
    return { date, value: 100000 * factors[dow] * noise * (i === spikeAt ? spike : 1) };
  });
}

test('estadística básica', () => {
  assert.equal(mean([2, 4, 6]), 4);
  assert.equal(median([5, 1, 3]), 3);
  assert.equal(median([1, 2, 3, 4]), 2.5);
  assert.ok(Math.abs(std([2, 4, 4, 4, 5, 5, 7, 9]) - 2.138) < 0.01);
  assert.ok(robustSigma([1, 1, 1, 1, 100]) < 1, 'un valor extremo no debe inflar la desviación robusta');
  const fit = linearFit([1, 3, 5, 7]);
  assert.ok(Math.abs(fit.b - 2) < 1e-9);
});

test('no pronostica con muy pocos días', () => {
  const result = forecastSales(series(MIN_DAYS - 1), 7);
  assert.equal(result.insufficient, true);
  assert.deepEqual(result.points, []);
});

test('el pronóstico respeta el patrón semanal', () => {
  const data = series(90);
  const result = forecastSales(data, 14);
  assert.equal(result.insufficient, false);
  assert.equal(result.points.length, 14);
  const strongDay = result.points.find((p) => new Date(`${p.date}T12:00:00Z`).getUTCDay() === 5);
  const monday = result.points.find((p) => new Date(`${p.date}T12:00:00Z`).getUTCDay() === 1);
  assert.ok(strongDay.value > monday.value * 1.4, 'el día fuerte debe pronosticarse claramente más alto que el lunes');
  for (const p of result.points) assert.ok(p.low <= p.value && p.value <= p.high && p.low >= 0);
});

test('el modelo supera al cálculo ingenuo en la validación', () => {
  const result = forecastSales(series(120), 14);
  assert.ok(result.backtest.accuracy > result.backtest.baselineAccuracy);
  assert.ok(result.backtest.accuracy > 0.85);
});

test('detecta un día anómalo y no marca días normales', () => {
  const normal = detectAnomalies(series(70));
  assert.equal(normal.length, 0);
  const found = detectAnomalies(series(70, { spikeAt: 60, spike: 2.2 }));
  assert.equal(found.length, 1);
  assert.equal(found[0].direction, 'up');
  assert.equal(found[0].date, addDays('2026-06-01', 60));
});
