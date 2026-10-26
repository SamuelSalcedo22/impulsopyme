'use strict';
const { mean, robustSigma } = require('./stats');
const { weekday } = require('../utils/dates');

/**
 * Detecta días con ventas muy distintas a lo esperado para ese día de la semana.
 * Para cada día se calcula el valor esperado con los demás días iguales de la ventana,
 * y se marca si el residuo supera `zLimit` desviaciones robustas y al menos `minRatio` de diferencia.
 */
function detectAnomalies(series, { window = 56, zLimit = 2.5, minRatio = 0.28, max = 5 } = {}) {
  const win = series.slice(-window);
  if (win.length < 21) return [];
  const byDow = Array.from({ length: 7 }, () => []);
  win.forEach((p, i) => byDow[weekday(p.date)].push(i));

  const expected = win.map((p, i) => {
    const peers = byDow[weekday(p.date)].filter((j) => j !== i).map((j) => win[j].value);
    return peers.length ? mean(peers) : mean(win.map((q) => q.value));
  });
  const residuals = win.map((p, i) => p.value - expected[i]);
  const sigma = robustSigma(residuals) || 1;

  const found = [];
  win.forEach((p, i) => {
    const z = residuals[i] / sigma;
    const ratio = expected[i] > 0 ? p.value / expected[i] : 1;
    if (Math.abs(z) >= zLimit && Math.abs(ratio - 1) >= minRatio) {
      found.push({ date: p.date, actual: p.value, expected: expected[i], ratio, z, direction: z > 0 ? 'up' : 'down' });
    }
  });
  return found.sort((x, y) => Math.abs(y.z) - Math.abs(x.z)).slice(0, max).sort((x, y) => (x.date < y.date ? 1 : -1));
}

module.exports = { detectAnomalies };
