'use strict';
/**
 * Crea un negocio de demostración (usuario "demo" / contraseña "demo12345") con datos de ejemplo.
 * Uso: npm run seed -- [tienda_barrio|restaurante|papeleria|ferreteria]
 */
const { getDb, closeDb } = require('../db/connection');
const auth = require('../services/auth');
const { BUSINESS_TYPES } = require('./templates');

const type = process.argv[2] || 'tienda_barrio';
if (!BUSINESS_TYPES[type]) {
  console.error(`Tipo desconocido. Opciones: ${Object.keys(BUSINESS_TYPES).join(', ')}`);
  process.exit(1);
}
const db = getDb();
if (db.prepare("SELECT 1 FROM users WHERE username = 'demo'").get()) {
  console.log('El usuario demo ya existe. Borra la carpeta data/ para empezar de cero.');
} else {
  auth.register({ name: 'Cuenta demostración', username: 'demo', password: 'demo12345', businessName: BUSINESS_TYPES[type].defaultName, businessType: type });
  console.log(`Listo: usuario demo / contraseña demo12345 (${BUSINESS_TYPES[type].defaultName})`);
}
closeDb();
