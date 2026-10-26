'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

/* La base y el secreto van a una carpeta temporal para no tocar datos reales. */
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'impulsopyme-'));
process.env.DATA_DIR = dir;
process.env.CREDENTIALS_DIR = path.join(dir, 'cred');
process.env.JWT_SECRET = 'prueba';

const { start, stop } = require('../server/index');
let server; let base; let token;

const call = async (method, url, body, auth = true) => {
  const res = await fetch(`${base}/api${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

test.before(async () => {
  ({ server, port: base } = await start({ port: 0 }).then((r) => ({ server: r.server, port: `http://127.0.0.1:${r.port}` })));
});
test.after(async () => { await stop(server); fs.rmSync(dir, { recursive: true, force: true }); });

test('las rutas protegidas exigen sesión', async () => {
  const res = await call('GET', '/products', null, false);
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'auth.session_missing');
});

test('registro, inicio de sesión y credenciales inválidas', async () => {
  const reg = await call('POST', '/auth/register', { name: 'Ana Prueba', username: 'ana_test', password: 'clave12345', businessName: 'Tienda Ana', businessType: 'tienda_barrio', sampleData: false }, false);
  assert.equal(reg.status, 201);
  token = reg.body.token;
  const dup = await call('POST', '/auth/register', { name: 'Otra', username: 'ana_test', password: 'clave12345', businessName: 'X Tienda', businessType: 'tienda_barrio' }, false);
  assert.equal(dup.body.error.code, 'auth.username_taken');
  const bad = await call('POST', '/auth/login', { username: 'ana_test', password: 'incorrecta' }, false);
  assert.equal(bad.status, 401);
  assert.equal(bad.body.error.code, 'auth.invalid_credentials');
  const ok = await call('POST', '/auth/login', { username: 'ana_test', password: 'clave12345' }, false);
  assert.ok(ok.body.token);
});

test('validación devuelve código y campo, sin texto interno', async () => {
  const res = await call('POST', '/products', { name: 'Sin precio', cost: 5 });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'validation.required');
  assert.equal(res.body.error.params.field, 'price');
});

test('una venta descuenta inventario y anularla lo devuelve', async () => {
  const product = (await call('POST', '/products', { name: 'Arroz', price: 3000, cost: 2000, stock: 10, minStock: 2 })).body;
  const sale = await call('POST', '/sales', { items: [{ productId: product.id, quantity: 4 }], paymentMethod: 'cash' });
  assert.equal(sale.status, 201);
  assert.equal(sale.body.total, 12000);
  assert.equal((await call('GET', `/products/${product.id}`)).body.stock, 6);

  const tooMany = await call('POST', '/sales', { items: [{ productId: product.id, quantity: 99 }] });
  assert.equal(tooMany.body.error.code, 'stock.insufficient');
  assert.equal((await call('GET', `/products/${product.id}`)).body.stock, 6, 'una venta rechazada no debe tocar el stock');

  assert.equal((await call('DELETE', `/sales/${sale.body.id}`)).status, 204);
  assert.equal((await call('GET', `/products/${product.id}`)).body.stock, 10);
});

test('los datos de un negocio no son visibles para otro', async () => {
  const mine = (await call('POST', '/products', { name: 'Privado', price: 1, cost: 1 })).body;
  const other = await call('POST', '/auth/register', { name: 'Beto Prueba', username: 'beto_test', password: 'clave12345', businessName: 'Tienda Beto', businessType: 'papeleria', sampleData: false }, false);
  const saved = token; token = other.body.token;
  const peek = await call('GET', `/products/${mine.id}`);
  assert.equal(peek.status, 404);
  assert.equal((await call('GET', '/products')).body.total, 0);
  token = saved;
});

test('el panel y los análisis responden con datos de ejemplo', async () => {
  const reg = await call('POST', '/auth/register', { name: 'Caro Prueba', username: 'caro_test', password: 'clave12345', businessName: 'Rest Caro', businessType: 'restaurante' }, false);
  token = reg.body.token;
  const dash = await call('GET', '/dashboard?range=30');
  assert.ok(dash.body.kpis.revenue > 0);
  const ai = await call('GET', '/ai/insights?horizon=14');
  assert.equal(ai.body.forecast.insufficient, false);
  assert.equal(ai.body.forecast.points.length, 14);
  const status = await call('GET', '/ai/status');
  assert.equal(status.body.configured, false);
});

test('el CSV de reportes es descargable', async () => {
  const res = await fetch(`${base}/api/reports/inventory.csv`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /csv/);
});
