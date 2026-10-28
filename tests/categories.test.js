'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('./_env');
const { start, stop } = require('../server/index');
let server; let base; let token;
const call = async (method, url, body) => {
  const res = await fetch(`${base}/api${url}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};
test.before(async () => {
  const r = await start({ port: 0 }); server = r.server; base = `http://127.0.0.1:${r.port}`;
  const reg = await call('POST', '/auth/register', { name: 'Test Uno', username: 'test_uno', password: 'clave12345', businessName: 'Negocio Uno', businessType: 'papeleria', sampleData: false });
  token = reg.body.token;
});
test.after(async () => { await stop(server); });

test('categorías: crear, evitar duplicados y eliminar', async () => {
  const created = await call('POST', '/categories', { name: 'Cuadernos' });
  assert.equal(created.status, 201);
  const dup = await call('POST', '/categories', { name: 'Cuadernos' });
  assert.equal(dup.body.error.code, 'categories.duplicate');
  assert.equal((await call('DELETE', `/categories/${created.body.id}`)).status, 204);
  assert.equal((await call('GET', '/categories')).body.items.length, 0);
});
