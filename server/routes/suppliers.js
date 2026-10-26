'use strict';
const express = require('express');
const { getDb } = require('../db/connection');
const { notFound } = require('../errors');
const v = require('../utils/validate');

const router = express.Router();

const SELECT = `
  SELECT s.id, s.name, s.contact, s.phone, s.email, s.notes, s.lead_time_days AS leadTimeDays,
         (SELECT COUNT(*) FROM products p WHERE p.supplier_id = s.id AND p.active = 1) AS productCount,
         (SELECT COUNT(*) FROM products p WHERE p.supplier_id = s.id AND p.active = 1 AND p.track_stock = 1 AND p.stock <= p.min_stock) AS lowStockCount
  FROM suppliers s`;

function readBody(b) {
  return {
    name: v.text(b.name, 'name', { max: 100 }),
    contact: v.text(b.contact, 'contact', { required: false, max: 80 }),
    phone: v.text(b.phone, 'phone', { required: false, max: 30 }),
    email: v.email(b.email, 'email'),
    leadTimeDays: Math.round(v.number(b.leadTimeDays, 'leadTimeDays', { required: false, fallback: 3, max: 90 })),
    notes: v.text(b.notes, 'notes', { required: false, max: 500 })
  };
}

router.get('/', (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : '%';
  const items = getDb().prepare(`${SELECT} WHERE s.business_id = ? AND (s.name LIKE ? OR s.contact LIKE ?) ORDER BY s.name COLLATE NOCASE`).all(req.user.businessId, q, q);
  res.json({ items });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const id = v.id(req.params.id, 'id');
  const item = db.prepare(`${SELECT} WHERE s.id = ? AND s.business_id = ?`).get(id, req.user.businessId);
  if (!item) throw notFound('suppliers.not_found');
  const products = db.prepare('SELECT id, name, stock, min_stock AS minStock, unit, cost FROM products WHERE supplier_id = ? AND active = 1 ORDER BY name COLLATE NOCASE').all(id);
  res.json({ ...item, products });
});

router.post('/', (req, res) => {
  const db = getDb();
  const b = readBody(req.body);
  const id = db.prepare('INSERT INTO suppliers (business_id, name, contact, phone, email, lead_time_days, notes) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(req.user.businessId, b.name, b.contact, b.phone, b.email, b.leadTimeDays, b.notes).lastInsertRowid;
  res.status(201).json(db.prepare(`${SELECT} WHERE s.id = ?`).get(id));
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const id = v.id(req.params.id, 'id');
  const b = readBody(req.body);
  const info = db.prepare('UPDATE suppliers SET name = ?, contact = ?, phone = ?, email = ?, lead_time_days = ?, notes = ? WHERE id = ? AND business_id = ?')
    .run(b.name, b.contact, b.phone, b.email, b.leadTimeDays, b.notes, id, req.user.businessId);
  if (!info.changes) throw notFound('suppliers.not_found');
  res.json(db.prepare(`${SELECT} WHERE s.id = ?`).get(id));
});

router.delete('/:id', (req, res) => {
  const id = v.id(req.params.id, 'id');
  const info = getDb().prepare('DELETE FROM suppliers WHERE id = ? AND business_id = ?').run(id, req.user.businessId);
  if (!info.changes) throw notFound('suppliers.not_found');
  res.status(204).end();
});

module.exports = router;
