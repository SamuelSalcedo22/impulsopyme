'use strict';
const express = require('express');
const { getDb } = require('../db/connection');
const { notFound, badRequest } = require('../errors');
const v = require('../utils/validate');
const { localDate } = require('../utils/dates');

const router = express.Router();
const METHODS = ['cash', 'transfer', 'card', 'credit'];

router.get('/', (req, res) => {
  const db = getDb();
  const where = ['s.business_id = ?'];
  const params = [req.user.businessId];
  if (req.query.from) { where.push('s.sold_date >= ?'); params.push(String(req.query.from)); }
  if (req.query.to) { where.push('s.sold_date <= ?'); params.push(String(req.query.to)); }
  if (req.query.customer) { where.push('s.customer_id = ?'); params.push(v.id(req.query.customer, 'customer')); }
  if (req.query.method && METHODS.includes(req.query.method)) { where.push('s.payment_method = ?'); params.push(req.query.method); }
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const total = db.prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(s.total), 0) AS amount FROM sales s WHERE ${where.join(' AND ')}`).get(...params);
  const items = db.prepare(
    `SELECT s.id, s.total, s.payment_method AS paymentMethod, s.sold_at AS soldAt, s.customer_id AS customerId, c.name AS customerName,
            (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS lines
     FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
     WHERE ${where.join(' AND ')} ORDER BY s.sold_at DESC, s.id DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);
  res.json({ items, total: total.n, amount: total.amount });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const id = v.id(req.params.id, 'id');
  const sale = db.prepare(
    `SELECT s.id, s.total, s.payment_method AS paymentMethod, s.sold_at AS soldAt, s.customer_id AS customerId, c.name AS customerName
     FROM sales s LEFT JOIN customers c ON c.id = s.customer_id WHERE s.id = ? AND s.business_id = ?`
  ).get(id, req.user.businessId);
  if (!sale) throw notFound('sales.not_found');
  const items = db.prepare(
    `SELECT si.product_id AS productId, p.name, p.unit, si.quantity, si.unit_price AS unitPrice
     FROM sale_items si JOIN products p ON p.id = si.product_id WHERE si.sale_id = ?`
  ).all(id);
  res.json({ ...sale, items });
});

/** Registra una venta y descuenta el inventario en una sola transacción: o se guarda todo o nada. */
router.post('/', (req, res) => {
  const db = getDb();
  const { businessId, id: userId } = req.user;
  const lines = Array.isArray(req.body.items) ? req.body.items : [];
  if (!lines.length) throw badRequest('sales.empty');
  if (lines.length > 100) throw badRequest('sales.too_many_lines');
  const method = v.oneOf(req.body.paymentMethod, 'paymentMethod', METHODS, { required: false, fallback: 'cash' });
  const customerId = v.optionalId(req.body.customerId, 'customerId');
  if (customerId && !db.prepare('SELECT 1 FROM customers WHERE id = ? AND business_id = ?').get(customerId, businessId)) throw badRequest('validation.invalid_option', { field: 'customerId' });

  const result = db.transaction(() => {
    const getProduct = db.prepare('SELECT id, name, price, cost, stock, track_stock AS trackStock FROM products WHERE id = ? AND business_id = ? AND active = 1');
    const prepared = lines.map((line) => {
      const productId = v.id(line.productId, 'productId');
      const quantity = v.number(line.quantity, 'quantity', { min: 0.001, max: 1e6 });
      const product = getProduct.get(productId, businessId);
      if (!product) throw notFound('products.not_found');
      if (product.trackStock && product.stock < quantity) throw badRequest('stock.insufficient', { product: product.name, available: product.stock });
      return { product, quantity };
    });
    let total = 0;
    for (const { product, quantity } of prepared) total += product.price * quantity;
    const now = new Date();
    const saleId = db.prepare('INSERT INTO sales (business_id, customer_id, user_id, total, payment_method, sold_at, sold_date) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(businessId, customerId, userId, total, method, now.toISOString(), localDate(now)).lastInsertRowid;
    const insertItem = db.prepare('INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, unit_cost) VALUES (?, ?, ?, ?, ?)');
    const decrement = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    const movement = db.prepare("INSERT INTO stock_movements (business_id, product_id, delta, reason) VALUES (?, ?, ?, 'sale')");
    for (const { product, quantity } of prepared) {
      insertItem.run(saleId, product.id, quantity, product.price, product.cost);
      if (product.trackStock) {
        decrement.run(quantity, product.id);
        movement.run(businessId, product.id, -quantity);
      }
    }
    return { id: saleId, total };
  })();

  res.status(201).json(result);
});

/** Anular una venta devuelve las unidades al inventario. */
router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = v.id(req.params.id, 'id');
  const { businessId } = req.user;
  const sale = db.prepare('SELECT id FROM sales WHERE id = ? AND business_id = ?').get(id, businessId);
  if (!sale) throw notFound('sales.not_found');
  db.transaction(() => {
    const items = db.prepare('SELECT si.product_id AS productId, si.quantity, p.track_stock AS trackStock FROM sale_items si JOIN products p ON p.id = si.product_id WHERE si.sale_id = ?').all(id);
    for (const it of items) {
      if (!it.trackStock) continue;
      db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(it.quantity, it.productId);
      db.prepare("INSERT INTO stock_movements (business_id, product_id, delta, reason) VALUES (?, ?, ?, 'void')").run(businessId, it.productId, it.quantity);
    }
    db.prepare('DELETE FROM sales WHERE id = ?').run(id);
  })();
  res.status(204).end();
});

module.exports = router;
