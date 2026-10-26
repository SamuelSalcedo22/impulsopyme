'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const load = (l) => JSON.parse(fs.readFileSync(path.join(ROOT, 'public/i18n', `${l}.json`), 'utf8'));
const es = load('es');
const en = load('en');

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out); else out[key] = v;
  }
  return out;
}
const fes = flatten(es);
const fen = flatten(en);

function walk(dir, ext, files = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) walk(full, ext, files); else if (full.endsWith(ext)) files.push(full);
  }
  return files;
}

test('español e inglés tienen exactamente las mismas claves', () => {
  const onlyEs = Object.keys(fes).filter((k) => !(k in fen));
  const onlyEn = Object.keys(fen).filter((k) => !(k in fes));
  assert.deepEqual(onlyEs, [], 'faltan en inglés');
  assert.deepEqual(onlyEn, [], 'faltan en español');
});

test('los marcadores {nombre} coinciden entre idiomas', () => {
  const holes = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join(',');
  const bad = Object.keys(fes).filter((k) => holes(fes[k]) !== holes(fen[k]));
  assert.deepEqual(bad, []);
});

test('toda clave usada en la interfaz existe en el diccionario', () => {
  const missing = new Set();
  for (const file of walk(path.join(ROOT, 'public/js'), '.js')) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)) if (!(m[1] in fes)) missing.add(`${m[1]} (${path.basename(file)})`);
    for (const m of src.matchAll(/\btn\(\s*'([a-zA-Z0-9_.]+)'/g)) {
      for (const suffix of ['one', 'other']) if (!(`${m[1]}_${suffix}` in fes)) missing.add(`${m[1]}_${suffix} (${path.basename(file)})`);
    }
  }
  assert.deepEqual([...missing], []);
});

test('todo código de error del servidor tiene mensaje de tres partes', () => {
  const codes = new Set();
  for (const file of walk(path.join(ROOT, 'server'), '.js')) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/'((?:auth|common|validation|stock|sales|products|customers|suppliers|categories|ai)\.[a-z_]+)'/g)) codes.add(m[1]);
  }
  const missing = [...codes].filter((c) => !es.errors[c] || !en.errors[c]);
  assert.deepEqual(missing, []);
  for (const c of Object.keys(es.errors)) {
    for (const part of ['what', 'todo']) assert.ok(es.errors[c][part] && en.errors[c][part], `${c}.${part} vacío`);
    assert.ok(!/\b(error|exception|undefined|null|500)\b/i.test(es.errors[c].what), `${c} muestra jerga interna`);
  }
});
