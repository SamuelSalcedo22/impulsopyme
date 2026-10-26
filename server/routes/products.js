'use strict';
const express = require('express');
const { getDb } = require('../db/connection');
const { notFound, badRequest } = require('../errors');
const v = require('../utils/validate');
const { localDate, addDays } = require('../utils/dates');

const router = express.Router();

const SORTS = {
  name: 'p.name COLLATE NOCASE ASC',
  stock: 'p.stock ASC',
  price: 'p.price DESC',
  margin: '(p.price - p.cost) / NULLIF(p.price, 0) DESC',
  recent: 'p.id DESC'
};

const SELECT = `
  SELECT p.id, p.sku, p.name, p.unit, p.price, p.cost, p.stock, p.min_stock AS minStock, p.track_stock AS trackStock, p.active,
         p.category_id AS categoryId, c.name AS categoryName, p.supplier_id AS supplierId, s.name AS supplierName
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN suppliers s ON s.id = p.supplier_id`;

function readBody(body, db, businessId) {
  const categoryId = v.optionalId(body.categoryId, 'categoryId');
  const supplierId = v.optionalId(body.supplierId, 'supplierId');
  if (categoryId && !db.prepare('SELECT 1 FROM categories WHERE id = ? AND business_id = ?').get(categoryId, businessId)) throw badRequest('validation.invalid_option', { field: 'categoryId' });
  if (supplierId && !db.prepare('SELECT 1 FROM suppliers WHERE id = ? AND business_id = ?').get(supplierId, businessId)) throw badRequest('validation.invalid_option', { field: 'supplierId' });
  return {
    name: v.text(body.name, 'name', { max: 120 }),
    sku: v.text(body.sku, 'sku', { required: false, max: 40 }),
    unit: v.text(body.unit, 'unit', { required: false, max: 16 }) || 'und',
    price: v.number(body.price, 'price', { max: 1e9 }),
    cost: v.number(body.cost, 'cost', { max: 1e9 }),
    stock: v.number(body.stock, 'stock', { required: false, fallback: 0, max: 1e7 }),
    minStock: v.number(body.minStock, 'minStock', { required: false, fallback: 0, max: 1e7 }),
    trackStock: body.trackStock === false || body.trackStock === 0 ? 0 : 1,
    categoryId,
    supplierId
  };
}

router.get('/', (req, res) => {
  const db = getDb();
  const { businessId } = req.user;
  const where = ['p.business_id = ?', 'p.active = 1'];
  const params = [businessId];
  if (req.query.q) { where.push('(p.name LIKE ? OR p.sku LIKE ?)'); params.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  if (req.query.category) { where.push('p.category_id = ?'); params.push(v.id(req.query.category, 'category')); }
  if (req.query.supplier) { where.push('p.supplier_id = ?'); params.push(v.id(req.query.supplier, 'supplier')); }
  if (req.query.status === 'low') where.push('p.track_stock = 1 AND p.stock <= p.min_stock AND p.stock > 0');
  if (req.query.status === 'out') where.push('p.track_stock = 1 AND p.stock <= 0');
  if (req.query.status === 'ok') where.push('(p.track_stock = 0 OR p.stock > p.min_stock)');
  const order = SORTS[req.query.sort] || SORTS.name;
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const total = db.prepare(`SELECT COUNT(*) AS n FROM products p WHERE ${where.join(' AND ')}`).get(...params).n;
  const items = db.prepare(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...params, limit, offset);
  res.json({ items, total });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const id = v.id(req.params.id, 'id');
  const item = db.prepare(`${SELECT} WHERE p.id = ? AND p.business_id = ?`).get(id, req.user.businessId);
  if (!item) throw notFound('products.not_found');
  const since = addDays(localDate(), -29);
  const sold = db.prepare(
    `SELECT COALESCE(SUM(si.quantity), 0) AS units, COALESCE(SUM(si.quantity * si.unit_price), 0) AS revenue
     FROM sale_items si JOIN sales s ON s.id = si.sale_id WHERE si.product_id = ? AND s.sold_date >= ?`
  ).get(id, since);
  const movements = db.prepare('SELECT delta, reason, created_at AS createdAt FROM stock_movements WHERE product_id = ? ORDER BY id DESC LIMIT 10').all(id);
  res.json({ ...item, last30: sold, movements });
});

router.post('/', (req, res) => {
  const db = getDb();
  const b = readBody(req.body, db, req.user.businessId);
  const id = db.prepare(
    `INSERT INTO products (business_id, sku, name, category_id, supplier_id, unit, price, cost, stock, min_stock, track_stock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(req.user.businessId, b.sku, b.name, b.categoryId, b.supplierId, b.unit, b.price, b.cost, b.stock, b.minStock, b.trackStock).lastInsertRowid;
  if (b.stock) db.prepare("INSERT INTO stock_movements (business_id, product_id, delta, reason) VALUES (?, ?, ?, 'initial')").run(req.user.businessId, id, b.stock);
  res.status(201).json(db.prepare(`${SELECT} WHERE p.id = ?`).get(id));
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const id = v.id(req.params.id, 'id');
  const current = db.prepare('SELECT stock FROM products WHERE id = ? AND business_id = ?').get(id, req.user.businessId);
  if (!current) throw notFound('products.not_found');
  const b = readBody(req.body, db, req.user.businessId);
  db.prepare(
    `UPDATE products SET sku = ?, name = ?, category_id = ?, supplier_id = ?, unit = ?, price = ?, cost = ?, stock = ?, min_stock = ?, track_stock = ? WHERE id = ?`
  ).run(b.sku, b.name, b.categoryId, b.supplierId, b.unit, b.price, b.cost, b.stock, b.minStock, b.trackStock, id);
  if (b.stock !== current.stock) db.prepare("INSERT INTO stock_movements (business_id, product_id, delta, reason) VALUES (?, ?, ?, 'adjustment')").run(req.user.businessId, id, b.stock - current.stock);
  res.json(db.prepare(`${SELECT} WHERE p.id = ?`).get(id));
});

/** Entrada o salida manual de inventario (compra, merma, conteo). */
router.post('/:id/stock', (req, res) => {
  const db = getDb();
  const id = v.id(req.params.id, 'id');
  const delta = v.number(req.body.delta, 'delta', { min: -1e7, max: 1e7 });
  const reason = v.oneOf(req.body.reason, 'reason', ['restock', 'waste', 'adjustment'], { required: false, fallback: 'adjustment' });
  const row = db.prepare('SELECT stock FROM products WHERE id = ? AND business_id = ?').get(id, req.user.businessId);
  if (!row) throw notFound('products.not_found');
  if (row.stock + delta < 0) throw badRequest('stock.negative', { available: row.stock });
  db.transaction(() => {
    db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(delta, id);
    db.prepare('INSERT INTO stock_movements (business_id, product_id, delta, reason) VALUES (?, ?, ?, ?)').run(req.user.businessId, id, delta, reason);
  })();
  res.json(db.prepare(`${SELECT} WHERE p.id = ?`).get(id));
});

/** Se desactiva en lugar de borrar para conservar el historial de ventas. */
router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = v.id(req.params.id, 'id');
  const info = db.prepare('UPDATE products SET active = 0 WHERE id = ? AND business_id = ?').run(id, req.user.businessId);
  if (!info.changes) throw notFound('products.not_found');
  res.status(204).end();
});

module.exports = router;
