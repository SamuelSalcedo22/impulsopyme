'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { flatten, resolve } = require('../scripts/build-tokens');

const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, '../design/tokens.json'), 'utf8'));

test('todas las referencias de tokens se resuelven', () => {
  const flat = flatten(tokens);
  for (const [name, value] of Object.entries(flat)) {
    if (typeof value !== 'string') continue;
    const resolved = resolve(value, flat);
    assert.ok(!/\{[^}]+\}/.test(resolved), `${name} tiene una referencia sin resolver: ${resolved}`);
  }
});

test('los tokens de componente solo dependen de semánticos o globales', () => {
  const component = JSON.stringify(tokens.component);
  const refs = [...component.matchAll(/\{([a-z][\w.-]*)\}/g)].map((m) => m[1].split('.')[0]);
  for (const r of refs) assert.ok(['semantic', 'global'].includes(r));
});
