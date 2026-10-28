'use strict';
/** Si se definen DEMO_USERNAME y DEMO_PASSWORD, crea esa cuenta con datos de ejemplo cuando aún no existe. */
const config = require('../config');
const { getDb } = require('../db/connection');
const auth = require('../services/auth');
const { BUSINESS_TYPES } = require('./templates');

async function ensureDemo() {
  const { username, password, type } = config.DEMO;
  if (!username || !password) return false;
  const exists = await getDb().prepare('SELECT 1 FROM users WHERE lower(username) = lower(?)').get(username);
  if (exists) return false;
  const template = BUSINESS_TYPES[type] || BUSINESS_TYPES.tienda_barrio;
  await auth.register({ name: 'Cuenta de demostración', username, password, businessName: template.defaultName, businessType: BUSINESS_TYPES[type] ? type : 'tienda_barrio' });
  console.log(`Cuenta de demostración creada: ${username}`);
  return true;
}

module.exports = { ensureDemo };
