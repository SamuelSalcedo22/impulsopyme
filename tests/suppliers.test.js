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

test('proveedores: productos asignados y conteo de por reponer', async () => {
  const s = (await call('POST', '/suppliers', { name: 'Distribuidora Sur', leadTimeDays: 2 })).body;
  await call('POST', '/products', { name: 'Resma carta', price: 15000, cost: 11000, stock: 1, minStock: 5, supplierId: s.id });
  const list = (await call('GET', '/suppliers')).body.items;
  assert.equal(list[0].productCount, 1);
  assert.equal(list[0].lowStockCount, 1);
  const detail = (await call('GET', `/suppliers/${s.id}`)).body;
  assert.equal(detail.products[0].name, 'Resma carta');
});
