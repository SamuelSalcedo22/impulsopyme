'use strict';
/** Estadística básica sin dependencias. */
const sum = (a) => a.reduce((x, y) => x + y, 0);
const mean = (a) => (a.length ? sum(a) / a.length : 0);

function std(a) {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(sum(a.map((x) => (x - m) ** 2)) / (a.length - 1));
}

function median(a) {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Desviación absoluta mediana escalada: robusta ante los picos que queremos detectar. */
function robustSigma(a) {
  const m = median(a);
  return 1.4826 * median(a.map((x) => Math.abs(x - m)));
}

/** Regresión lineal simple y = a + b*x con x = 0..n-1. */
function linearFit(y) {
  const n = y.length;
  if (n < 2) return { a: y[0] || 0, b: 0 };
  const xm = (n - 1) / 2;
  const ym = mean(y);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (i - xm) * (y[i] - ym);
    den += (i - xm) ** 2;
  }
  const b = den ? num / den : 0;
  return { a: ym - b * xm, b };
}

module.exports = { sum, mean, std, median, robustSigma, linearFit };
