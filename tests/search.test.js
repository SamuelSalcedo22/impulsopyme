'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'impulsopyme-'));
process.env.DATA_DIR = dir;
process.env.CREDENTIALS_DIR = path.join(dir, 'cred');
process.env.JWT_SECRET = 'prueba';
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
test.after(async () => { await stop(server); fs.rmSync(dir, { recursive: true, force: true }); });

test('búsqueda global encuentra productos, clientes y ventas por número', async () => {
  const p = (await call('POST', '/products', { name: 'Cuaderno rayado', price: 3000, cost: 2000, stock: 10 })).body;
  await call('POST', '/customers', { name: 'Cuadra Pérez' });
  const sale = (await call('POST', '/sales', { items: [{ productId: p.id, quantity: 1 }] })).body;
  const found = (await call('GET', '/search?q=cuad')).body;
  assert.equal(found.products.length, 1);
  assert.equal(found.customers.length, 1);
  const bySale = (await call('GET', `/search?q=%23${sale.id}`)).body;
  assert.equal(bySale.sales[0].id, sale.id);
  assert.deepEqual((await call('GET', '/search?q=a')).body.products, []);
});

test('ajuste de existencias: entrada, merma y límite en cero', async () => {
  const p = (await call('POST', '/products', { name: 'Borrador', price: 500, cost: 200, stock: 5 })).body;
  assert.equal((await call('POST', `/products/${p.id}/stock`, { delta: 10, reason: 'restock' })).body.stock, 15);
  assert.equal((await call('POST', `/products/${p.id}/stock`, { delta: -3, reason: 'waste' })).body.stock, 12);
  const over = await call('POST', `/products/${p.id}/stock`, { delta: -50 });
  assert.equal(over.body.error.code, 'stock.negative');
});
