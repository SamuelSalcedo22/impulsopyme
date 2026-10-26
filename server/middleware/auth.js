'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config');
const { getDb } = require('../db/connection');
const { unauthorized } = require('../errors');

function signToken(user) {
  return jwt.sign({ sub: user.id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES });
}

/** Exige sesión válida y deja req.user con el negocio al que pertenece. */
function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw unauthorized('auth.session_missing');
  let payload;
  try {
    payload = jwt.verify(token, config.JWT_SECRET);
  } catch {
    throw unauthorized('auth.session_expired');
  }
  const user = getDb()
    .prepare('SELECT id, business_id AS businessId, name, username, role, locale FROM users WHERE id = ?')
    .get(payload.sub);
  if (!user) throw unauthorized('auth.session_expired');
  req.user = user;
  next();
}

module.exports = { signToken, requireAuth };
