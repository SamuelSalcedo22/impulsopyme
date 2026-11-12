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
const PRODUCTION = process.env.NODE_ENV === 'production';

function loadSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (PRODUCTION) throw new Error('Falta JWT_SECRET: en el servidor debe ser una variable de entorno fija.');
  const file = path.join(DATA_DIR, 'jwt-secret');
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim();
  const secret = crypto.randomBytes(48).toString('hex');
  fs.mkdirSync(DATA_DIR, { recursive: true }); // solo en desarrollo: en el servidor no hay carpeta de datos
  fs.writeFileSync(file, secret, { mode: 0o600 });
  return secret;
}

module.exports = {
  ROOT,
  PORT: Number(process.env.PORT) || 3000,
  PRODUCTION,
  HOST: process.env.HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1'),
  /** Cuenta de demostración que se crea sola si la base está vacía (para quien evalúa la app). */
  DEMO: { username: process.env.DEMO_USERNAME || '', password: process.env.DEMO_PASSWORD || '', type: process.env.DEMO_BUSINESS_TYPE || 'tienda_barrio' },
  DATA_DIR,
  CREDENTIALS_DIR,
  PUBLIC_DIR: path.join(ROOT, 'public'),
  DATABASE_URL: process.env.DATABASE_URL || '',
  DB_SCHEMA: process.env.DB_SCHEMA || '',
  JWT_SECRET: loadSecret(),
  JWT_EXPIRES: process.env.JWT_EXPIRES || '7d',
  TIMEZONE: process.env.TIMEZONE || 'America/Bogota',
  AI: {
    location: process.env.GOOGLE_CLOUD_LOCATION || 'global',
    model: process.env.VERTEX_MODEL || 'gemini-3.5-flash',
    /** Si el modelo configurado ya no existe, se prueban estos (en el punto global, que tiene los modelos nuevos). */
    fallbacks: [
      { model: 'gemini-3.5-flash', location: 'global' },
      { model: 'gemini-3.8-flash', location: 'global' },
      { model: 'gemini-3.1-flash-lite', location: 'global' },
      { model: 'gemini-3-flash', location: 'global' }
    ],
    timeoutMs: Number(process.env.VERTEX_TIMEOUT_MS) || 25000
  }
};
