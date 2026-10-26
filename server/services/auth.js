'use strict';
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/connection');
const { BUSINESS_TYPES } = require('../seed/templates');
const { seedBusiness } = require('../seed/generate');
const { signToken } = require('../middleware/auth');
const { AppError, badRequest, conflict, unauthorized } = require('../errors');
const v = require('../utils/validate');

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,30}$/;

function publicUser(row) {
  return { id: row.id, name: row.name, username: row.username, role: row.role, locale: row.locale, businessId: row.business_id ?? row.businessId };
}

function businessOf(db, businessId) {
  return db.prepare('SELECT id, name, type, currency FROM businesses WHERE id = ?').get(businessId);
}

function register(body) {
  const db = getDb();
  const name = v.text(body.name, 'name', { min: 2, max: 80 });
  const username = v.text(body.username, 'username', { min: 3, max: 30 });
  if (!USERNAME_RE.test(username)) throw badRequest('validation.invalid_username');
  const password = v.text(body.password, 'password', { min: 8, max: 100 });
  const businessName = v.text(body.businessName, 'businessName', { min: 2, max: 80 });
  const businessType = v.oneOf(body.businessType, 'businessType', Object.keys(BUSINESS_TYPES));
  const locale = v.oneOf(body.locale, 'locale', ['es', 'en'], { required: false, fallback: 'es' });
  const withSample = body.sampleData !== false;

  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) throw conflict('auth.username_taken');
  const hash = bcrypt.hashSync(password, 10);

  const run = db.transaction(() => {
    const businessId = db.prepare('INSERT INTO businesses (name, type) VALUES (?, ?)').run(businessName, businessType).lastInsertRowid;
    const userId = db.prepare('INSERT INTO users (business_id, name, username, password_hash, locale) VALUES (?, ?, ?, ?, ?)').run(businessId, name, username, hash, locale).lastInsertRowid;
    if (withSample) seedBusiness(db, businessId, businessType);
    return { businessId, userId };
  });
  const { businessId, userId } = run();

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  return { token: signToken(user), user: publicUser(user), business: businessOf(db, businessId) };
}

function login(body, limiter, req) {
  const db = getDb();
  const username = v.text(body.username, 'username', { max: 60 });
  const password = v.text(body.password, 'password', { max: 100 });
  const key = limiter.key(req, username);
  if (limiter.isBlocked(key)) throw new AppError(429, 'auth.too_many_attempts');

  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  // Se compara siempre contra un hash para no revelar si el usuario existe por el tiempo de respuesta.
  const ok = bcrypt.compareSync(password, row ? row.password_hash : '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinva');
  if (!row || !ok) {
    limiter.fail(key);
    throw unauthorized('auth.invalid_credentials');
  }
  limiter.reset(key);
  return { token: signToken(row), user: publicUser(row), business: businessOf(db, row.business_id) };
}

function me(userId) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!row) throw unauthorized('auth.session_expired');
  return { user: publicUser(row), business: businessOf(db, row.business_id) };
}

function updateProfile(userId, body) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const name = body.name !== undefined ? v.text(body.name, 'name', { min: 2, max: 80 }) : row.name;
  const locale = body.locale !== undefined ? v.oneOf(body.locale, 'locale', ['es', 'en']) : row.locale;
  db.prepare('UPDATE users SET name = ?, locale = ? WHERE id = ?').run(name, locale, userId);
  if (body.newPassword) {
    const current = v.text(body.currentPassword, 'currentPassword', { max: 100 });
    if (!bcrypt.compareSync(current, row.password_hash)) throw unauthorized('auth.invalid_credentials');
    const next = v.text(body.newPassword, 'newPassword', { min: 8, max: 100 });
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(next, 10), userId);
  }
  return me(userId);
}

function updateBusiness(businessId, body) {
  const db = getDb();
  const row = businessOf(db, businessId);
  const name = body.name !== undefined ? v.text(body.name, 'name', { min: 2, max: 80 }) : row.name;
  const type = body.type !== undefined ? v.oneOf(body.type, 'type', Object.keys(BUSINESS_TYPES)) : row.type;
  db.prepare('UPDATE businesses SET name = ?, type = ? WHERE id = ?').run(name, type, businessId);
  return businessOf(db, businessId);
}

module.exports = { register, login, me, updateProfile, updateBusiness };
