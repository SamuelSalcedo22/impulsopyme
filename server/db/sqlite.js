'use strict';
/**
 * Adaptador sobre el SQLite integrado de Node (node:sqlite). Así no hay módulos nativos que compilar
 * (ni Visual Studio en Windows, ni reconstrucciones para Electron). Expone la parte de la API
 * que usa la app: pragma, exec, prepare().run/get/all/raw, transaction y close.
 */
const { DatabaseSync } = require('node:sqlite');

class Statement {
  constructor(stmt) { this.stmt = stmt; }
  run(...params) { return this.stmt.run(...params); }
  get(...params) { return this.stmt.get(...params); }
  all(...params) { return this.stmt.all(...params); }
  /** Devuelve las filas como arreglos (para CSV). */
  raw() {
    const stmt = this.stmt;
    return { all: (...params) => { stmt.setReturnArrays(true); try { return stmt.all(...params); } finally { stmt.setReturnArrays(false); } } };
  }
}

class Database {
  constructor(file) {
    this.db = new DatabaseSync(file);
    this.depth = 0;
  }

  pragma(text) { this.db.exec(`PRAGMA ${text}`); }
  exec(sql) { this.db.exec(sql); }
  prepare(sql) { return new Statement(this.db.prepare(sql)); }
  close() { this.db.close(); }

  /** Envuelve una función en una transacción (anidable con puntos de guardado). */
  transaction(fn) {
    return (...args) => {
      const name = `sp${this.depth}`;
      this.db.exec(this.depth === 0 ? 'BEGIN' : `SAVEPOINT ${name}`);
      this.depth += 1;
      try {
        const result = fn(...args);
        this.depth -= 1;
        this.db.exec(this.depth === 0 ? 'COMMIT' : `RELEASE ${name}`);
        return result;
      } catch (error) {
        this.depth -= 1;
        this.db.exec(this.depth === 0 ? 'ROLLBACK' : `ROLLBACK TO ${name}`);
        throw error;
      }
    };
  }
}

module.exports = { Database };
