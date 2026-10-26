'use strict';
const express = require('express');
const { getDb } = require('../db/connection');
const { notFound } = require('../errors');
const v = require('../utils/validate');

const router = express.Router();

const SELECT = `
  SELECT c.id, c.name, c.phone, c.email, c.notes,
         COUNT(s.id) AS purchases, COALESCE(SUM(s.total), 0) AS totalSpent, MAX(s.sold_date) AS lastPurchase
  FROM customers c LEFT JOIN sales s ON s.customer_id = c.id`;

function readBody(b) {
  return {
    name: v.text(b.name, 'name', { max: 100 }),
    phone: v.text(b.phone, 'phone', { required: false, max: 30 }),
    email: v.email(b.email, 'email'),
    notes: v.text(b.notes, 'notes', { required: false, max: 500 })
  };
}

router.get('/', (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : '%';
  const items = getDb().prepare(`${SELECT} WHERE c.business_id = ? AND (c.name LIKE ? OR c.phone LIKE ?) GROUP BY c.id ORDER BY totalSpent DESC, c.name COLLATE NOCASE`).all(req.user.businessId, q, q);
  res.json({ items });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const id = v.id(req.params.id, 'id');
  const item = db.prepare(`${SELECT} WHERE c.id = ? AND c.business_id = ? GROUP BY c.id`).get(id, req.user.businessId);
  if (!item) throw notFound('customers.not_found');
  const recent = db.prepare('SELECT id, total, payment_method AS paymentMethod, sold_at AS soldAt FROM sales WHERE customer_id = ? ORDER BY sold_at DESC LIMIT 10').all(id);
  const favorites = db.prepare(
    `SELECT p.name, SUM(si.quantity) AS units FROM sale_items si
     JOIN sales s ON s.id = si.sale_id JOIN products p ON p.id = si.product_id
     WHERE s.customer_id = ? GROUP BY p.id ORDER BY units DESC LIMIT 5`
  ).all(id);
  res.json({ ...item, recent, favorites });
});

router.post('/', (req, res) => {
  const db = getDb();
  const b = readBody(req.body);
  const id = db.prepare('INSERT INTO customers (business_id, name, phone, email, notes) VALUES (?, ?, ?, ?, ?)').run(req.user.businessId, b.name, b.phone, b.email, b.notes).lastInsertRowid;
  res.status(201).json(db.prepare(`${SELECT} WHERE c.id = ? GROUP BY c.id`).get(id));
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const id = v.id(req.params.id, 'id');
  const b = readBody(req.body);
  const info = db.prepare('UPDATE customers SET name = ?, phone = ?, email = ?, notes = ? WHERE id = ? AND business_id = ?').run(b.name, b.phone, b.email, b.notes, id, req.user.businessId);
  if (!info.changes) throw notFound('customers.not_found');
  res.json(db.prepare(`${SELECT} WHERE c.id = ? GROUP BY c.id`).get(id));
});

router.delete('/:id', (req, res) => {
  const id = v.id(req.params.id, 'id');
  const info = getDb().prepare('DELETE FROM customers WHERE id = ? AND business_id = ?').run(id, req.user.businessId);
  if (!info.changes) throw notFound('customers.not_found');
  res.status(204).end();
});

module.exports = router;
