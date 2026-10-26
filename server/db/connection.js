'use strict';
const { Database } = require('./sqlite');
const config = require('../config');
const { applySchema } = require('./schema');

let instance = null;

/** Abre (una sola vez) la base de datos SQLite: un único archivo, sin servidor. */
function getDb(file = config.DB_FILE) {
  if (instance) return instance;
  instance = new Database(file);
  instance.pragma('journal_mode = WAL');
  instance.pragma('foreign_keys = ON');
  applySchema(instance);
  return instance;
}

function closeDb() {
  if (instance) instance.close();
  instance = null;
}

module.exports = { getDb, closeDb };
