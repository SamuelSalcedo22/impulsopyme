'use strict';
const { mean, std, linearFit, sum } = require('./stats');
const { addDays, weekday } = require('../utils/dates');

const MIN_DAYS = 21;

/**
 * Pronóstico de ventas diarias: estacionalidad semanal (factor por día) + tendencia lineal amortiguada.
 * series: [{date:'YYYY-MM-DD', value:number}] ordenada y sin huecos.
 */
function fitModel(series, trainDays = 84) {
  const window = series.slice(-trainDays);
  const overall = mean(window.map((p) => p.value)) || 1;

  const buckets = Array.from({ length: 7 }, () => []);
  for (const p of window) buckets[weekday(p.date)].push(p.value);
  // Se encoge 15% hacia 1 para que un día atípico no distorsione todo el patrón semanal.
  const factors = buckets.map((vals) => (vals.length ? 0.85 * (mean(vals) / overall) + 0.15 : 1));

  const deseason = window.map((p) => p.value / (factors[weekday(p.date)] || 1));
  const { a, b } = linearFit(deseason);
  const n = deseason.length;
  const fitted = deseason.map((_, i) => (a + b * i) * factors[weekday(window[i].date)]);
  const residuals = window.map((p, i) => p.value - fitted[i]);
  const sigma = std(residuals);

  // La pendiente se amortigua (60%) y se limita a ±1.5% de la media diaria para no extrapolar de más.
  const cap = overall * 0.015;
  const slope = Math.max(-cap, Math.min(cap, b * 0.6));
  const endLevel = a + b * (n - 1);
  return { factors, slope, endLevel, sigma, overall, lastDate: window[window.length - 1].date };
}

function predict(model, horizon) {
  const points = [];
  for (let k = 1; k <= horizon; k += 1) {
    const date = addDays(model.lastDate, k);
    const base = (model.endLevel + model.slope * k) * model.factors[weekday(date)];
    const value = Math.max(0, base);
    const spread = 1.28 * model.sigma * Math.sqrt(1 + k / 30);
    points.push({ date, value, low: Math.max(0, value - spread), high: value + spread });
  }
  return points;
}

const wape = (actual, forecast) => {
  const total = sum(actual);
  return total ? sum(actual.map((a, i) => Math.abs(a - forecast[i]))) / total : 0;
};

/** Backtest: entrena sin los últimos `holdout` días y compara contra "igual día de la semana pasada". */
function backtest(series, holdout = 14) {
  if (series.length < MIN_DAYS + holdout) return null;
  const train = series.slice(0, -holdout);
  const test = series.slice(-holdout);
  const predicted = predict(fitModel(train), holdout).map((p) => p.value);
  const naive = test.map((_, i) => {
    const idx = train.length + i - 7;
    return series[idx] ? series[idx].value : mean(train.map((p) => p.value));
  });
  const actual = test.map((p) => p.value);
  const model = wape(actual, predicted);
  const baseline = wape(actual, naive);
  return {
    holdoutDays: holdout,
    accuracy: Math.max(0, 1 - model),
    baselineAccuracy: Math.max(0, 1 - baseline),
    improvement: baseline > 0 ? (baseline - model) / baseline : 0
  };
}

function forecastSales(series, horizon = 14) {
  if (series.length < MIN_DAYS) return { insufficient: true, minDays: MIN_DAYS, points: [], total: 0 };
  const model = fitModel(series);
  const points = predict(model, horizon);
  return {
    insufficient: false,
    points,
    total: sum(points.map((p) => p.value)),
    weekdayFactors: model.factors,
    backtest: backtest(series)
  };
}

module.exports = { forecastSales, fitModel, predict, backtest, MIN_DAYS };
