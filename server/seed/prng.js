'use strict';
/** Generador pseudoaleatorio determinista (mulberry32): mismos datos de ejemplo en cada instalación. */
function createRng(seed = 20261111) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    between: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    /** Poisson por el método de Knuth; para medias altas usa aproximación normal. */
    poisson(lambda) {
      if (lambda <= 0) return 0;
      if (lambda > 30) {
        const u = Math.max(next(), 1e-9);
        const v = next();
        const n = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * n));
      }
      const L = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      do { k += 1; p *= next(); } while (p > L);
      return k - 1;
    }
  };
}

module.exports = { createRng };
