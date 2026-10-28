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

test('clientes: crear, editar, historial y eliminar', async () => {
  const c = (await call('POST', '/customers', { name: 'Doña Marta', phone: '3001234567' })).body;
  assert.equal(c.purchases, 0);
  const edited = await call('PUT', `/customers/${c.id}`, { name: 'Doña Marta R.', phone: '3001234567' });
  assert.equal(edited.body.name, 'Doña Marta R.');
  const product = (await call('POST', '/products', { name: 'Lápiz', price: 800, cost: 400, stock: 50 })).body;
  await call('POST', '/sales', { items: [{ productId: product.id, quantity: 3 }], customerId: c.id });
  const detail = (await call('GET', `/customers/${c.id}`)).body;
  assert.equal(detail.purchases, 1);
  assert.equal(detail.totalSpent, 2400);
  assert.equal(detail.favorites[0].name, 'Lápiz');
  assert.equal((await call('DELETE', `/customers/${c.id}`)).status, 204);
  assert.equal((await call('GET', `/customers/${c.id}`)).body.error.code, 'customers.not_found');
});

test('clientes: correo inválido se rechaza con el campo', async () => {
  const bad = await call('POST', '/customers', { name: 'Sin correo', email: 'nope' });
  assert.equal(bad.body.error.code, 'validation.invalid_email');
  assert.equal(bad.body.error.params.field, 'email');
});
