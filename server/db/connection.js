'use strict';
/**
 * Acceso a PostgreSQL (el mismo motor en tu computador y en el servidor).
 * Mantiene la forma `prepare(sql).get/all/run` para que las consultas sigan siendo cortas, pero todo es asíncrono.
 *  - Los marcadores `?` se convierten a `$1, $2…`.
 *  - Los alias con mayúsculas (`AS minStock`) se devuelven tal cual, aunque Postgres los pase a minúsculas.
 *  - Los INSERT devuelven `lastInsertRowid` (se agrega `RETURNING id`).
 *  - `transaction()` se puede anidar y las consultas dentro de ella usan automáticamente la misma conexión.
 */
const { AsyncLocalStorage } = require('node:async_hooks');
const { Pool, types } = require('pg');
const config = require('../config');
const { applySchema } = require('./schema');

types.setTypeParser(20, Number); // BIGINT (COUNT, SUM de enteros)
types.setTypeParser(1700, Number); // NUMERIC (AVG, ROUND)

const SCHEMA_NAME_RE = /^[a-z_][a-z0-9_]*$/;

function toPositional(sql) {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}

const aliasCache = new Map();
function aliasMap(sql) {
  if (aliasCache.has(sql)) return aliasCache.get(sql);
  const map = {};
  for (const m of sql.matchAll(/\bAS\s+"?([A-Za-z_][A-Za-z0-9_]*)"?/gi)) {
    if (/[A-Z]/.test(m[1])) map[m[1].toLowerCase()] = m[1];
  }
  const result = Object.keys(map).length ? map : null;
  aliasCache.set(sql, result);
  return result;
}

function fixKeys(row, map) {
  if (!row || !map) return row;
  const out = {};
  for (const key of Object.keys(row)) out[map[key] || key] = row[key];
  return out;
}

class Database {
  constructor(url, schema) {
    this.schema = schema;
    const local = /(localhost|127\.0\.0\.1|\/tmp|host=)/.test(url) && !/sslmode=require/.test(url);
    this.pool = new Pool({
      connectionString: url,
      max: Number(process.env.DB_POOL_MAX) || 8,
      ssl: local ? undefined : { rejectUnauthorized: false },
      ...(schema ? { options: `-c search_path=${schema}` } : {})
    });
    this.pool.on('error', (err) => console.error('Conexión a la base de datos:', err.message));
    this.tx = new AsyncLocalStorage();
    this.ready = null;
  }

  /** Crea el esquema (una sola vez por proceso). */
  init() {
    if (!this.ready) {
      this.ready = (async () => {
        if (this.schema) {
          if (!SCHEMA_NAME_RE.test(this.schema)) throw new Error('DB_SCHEMA inválido');
          await this.pool.query(`CREATE SCHEMA IF NOT EXISTS ${this.schema}`);
        }
        await applySchema(this);
      })();
    }
    return this.ready;
  }

  async query(sql, params = [], rowMode) {
    const runner = this.tx.getStore() || this.pool;
    return runner.query({ text: toPositional(sql), values: params, ...(rowMode ? { rowMode } : {}) });
  }

  async exec(sql) {
    const runner = this.tx.getStore() || this.pool;
    await runner.query(sql);
  }

  prepare(sql) {
    const returning = /^\s*INSERT\s+INTO\s+(?!ai_cache)/i.test(sql) && !/\bRETURNING\b/i.test(sql);
    const text = returning ? `${sql} RETURNING id` : sql;
    const map = aliasMap(sql);
    return {
      run: async (...params) => {
        const res = await this.query(text, params);
        return { changes: res.rowCount, lastInsertRowid: returning ? res.rows[0]?.id : undefined };
      },
      get: async (...params) => fixKeys((await this.query(text, params)).rows[0], map),
      all: async (...params) => (await this.query(text, params)).rows.map((row) => fixKeys(row, map)),
      raw: () => ({ all: async (...params) => (await this.query(text, params, 'array')).rows })
    };
  }

  /** Envuelve una función asíncrona en una transacción (anidable con puntos de guardado). */
  transaction(fn) {
    return async (...args) => {
      const current = this.tx.getStore();
      if (current) {
        const name = `sp_${Math.random().toString(36).slice(2, 10)}`;
        await current.query(`SAVEPOINT ${name}`);
        try {
          const result = await fn(...args);
          await current.query(`RELEASE SAVEPOINT ${name}`);
          return result;
        } catch (error) {
          await current.query(`ROLLBACK TO SAVEPOINT ${name}`);
          throw error;
        }
      }
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const result = await this.tx.run(client, () => fn(...args));
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    };
  }

  async close() {
    if (this.schema && process.env.DB_SCHEMA_DROP === '1') {
      await this.pool.query(`DROP SCHEMA IF EXISTS ${this.schema} CASCADE`).catch(() => {});
    }
    await this.pool.end();
  }
}

let instance = null;

function getDb() {
  if (instance) return instance;
  if (!config.DATABASE_URL) {
    throw new Error('Falta DATABASE_URL: la dirección de tu base de datos PostgreSQL (ver docs/despliegue.md).');
  }
  instance = new Database(config.DATABASE_URL, config.DB_SCHEMA);
  return instance;
}

/** Abre la base y aplica el esquema. */
async function openDb() {
  const db = getDb();
  await db.init();
  return db;
}

async function closeDb() {
  if (instance) {
    const db = instance;
    instance = null;
    await db.close();
  }
}

module.exports = { getDb, openDb, closeDb };
