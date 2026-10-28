'use strict';
const express = require('express');
const { getDb } = require('../db/connection');

const router = express.Router();

/** Búsqueda global (Ctrl+K): productos, clientes, proveedores y ventas por número. */
router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ products: [], customers: [], suppliers: [], sales: [] });
  const db = getDb();
  const like = `%${q}%`;
  const { businessId } = req.user;
  const products = await db.prepare('SELECT id, name, sku, stock, unit, price FROM products WHERE business_id = ? AND active = 1 AND (name ILIKE ? OR sku ILIKE ?) ORDER BY lower(name) LIMIT 6').all(businessId, like, like);
  const customers = await db.prepare('SELECT id, name, phone FROM customers WHERE business_id = ? AND (name ILIKE ? OR phone ILIKE ?) ORDER BY lower(name) LIMIT 5').all(businessId, like, like);
  const suppliers = await db.prepare('SELECT id, name, contact FROM suppliers WHERE business_id = ? AND (name ILIKE ? OR contact ILIKE ?) ORDER BY lower(name) LIMIT 5').all(businessId, like, like);
  const num = Number(q.replace('#', ''));
  const sales = Number.isInteger(num) && num > 0
    ? await db.prepare('SELECT id, total, sold_at AS soldAt FROM sales WHERE business_id = ? AND id = ?').all(businessId, num)
    : [];
  res.json({ products, customers, suppliers, sales });
});

module.exports = router;
