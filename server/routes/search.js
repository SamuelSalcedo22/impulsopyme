'use strict';
const express = require('express');
const { getDb } = require('../db/connection');

const router = express.Router();

/** Búsqueda global (Ctrl+K): productos, clientes, proveedores y ventas por número. */
router.get('/', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ products: [], customers: [], suppliers: [], sales: [] });
  const db = getDb();
  const like = `%${q}%`;
  const { businessId } = req.user;
  const products = db.prepare('SELECT id, name, sku, stock, unit, price FROM products WHERE business_id = ? AND active = 1 AND (name LIKE ? OR sku LIKE ?) ORDER BY name COLLATE NOCASE LIMIT 6').all(businessId, like, like);
  const customers = db.prepare('SELECT id, name, phone FROM customers WHERE business_id = ? AND (name LIKE ? OR phone LIKE ?) ORDER BY name COLLATE NOCASE LIMIT 5').all(businessId, like, like);
  const suppliers = db.prepare('SELECT id, name, contact FROM suppliers WHERE business_id = ? AND (name LIKE ? OR contact LIKE ?) ORDER BY name COLLATE NOCASE LIMIT 5').all(businessId, like, like);
  const num = Number(q.replace('#', ''));
  const sales = Number.isInteger(num) && num > 0
    ? db.prepare('SELECT id, total, sold_at AS soldAt FROM sales WHERE business_id = ? AND id = ?').all(businessId, num)
    : [];
  res.json({ products, customers, suppliers, sales });
});

module.exports = router;
