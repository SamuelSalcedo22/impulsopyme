'use strict';
/** Cabeceras de seguridad básicas, sin dependencias extra. */
function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self'; base-uri 'self'; form-action 'self'"
  );
  next();
}

/** Limita intentos de inicio de sesión por IP + usuario (en memoria). */
function createLoginLimiter({ max = 8, windowMs = 10 * 60 * 1000 } = {}) {
  const attempts = new Map();
  return {
    key: (req, username) => `${req.ip}|${String(username || '').toLowerCase()}`,
    isBlocked(key) {
      const entry = attempts.get(key);
      if (!entry) return false;
      if (Date.now() - entry.first > windowMs) { attempts.delete(key); return false; }
      return entry.count >= max;
    },
    fail(key) {
      const entry = attempts.get(key);
      if (!entry || Date.now() - entry.first > windowMs) attempts.set(key, { count: 1, first: Date.now() });
      else entry.count += 1;
    },
    reset(key) { attempts.delete(key); }
  };
}

module.exports = { securityHeaders, createLoginLimiter };
