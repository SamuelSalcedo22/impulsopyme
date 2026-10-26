'use strict';
/**
 * Configuración central. Todo lo sensible (credenciales de Google, secreto JWT)
 * vive en el servidor y nunca se envía al navegador.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
require('dotenv').config({ path: process.env.ENV_FILE || path.join(ROOT, '.env'), quiet: true });

const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const CREDENTIALS_DIR = process.env.CREDENTIALS_DIR || path.join(ROOT, 'credentials');
fs.mkdirSync(DATA_DIR, { recursive: true });

function loadSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const file = path.join(DATA_DIR, 'jwt-secret');
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim();
  const secret = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(file, secret, { mode: 0o600 });
  return secret;
}

module.exports = {
  ROOT,
  PORT: Number(process.env.PORT) || 3000,
  HOST: process.env.HOST || '127.0.0.1',
  DATA_DIR,
  CREDENTIALS_DIR,
  PUBLIC_DIR: path.join(ROOT, 'public'),
  DB_FILE: process.env.DB_FILE || path.join(DATA_DIR, 'impulsopyme.sqlite'),
  JWT_SECRET: loadSecret(),
  JWT_EXPIRES: process.env.JWT_EXPIRES || '7d',
  TIMEZONE: process.env.TIMEZONE || 'America/Bogota',
  AI: {
    location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    model: process.env.VERTEX_MODEL || 'gemini-2.5-flash',
    timeoutMs: Number(process.env.VERTEX_TIMEOUT_MS) || 25000
  }
};
