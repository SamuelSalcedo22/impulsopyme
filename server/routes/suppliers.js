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

router.get('/', async (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : '%';
  const items = await getDb().prepare(`${SELECT} WHERE s.business_id = ? AND (s.name ILIKE ? OR s.contact ILIKE ?) ORDER BY lower(s.name)`).all(req.user.businessId, q, q);
  res.json({ items });
});

router.get('/:id', async (req, res) => {
  const db = getDb();
  const id = v.id(req.params.id, 'id');
  const item = await db.prepare(`${SELECT} WHERE s.id = ? AND s.business_id = ?`).get(id, req.user.businessId);
  if (!item) throw notFound('suppliers.not_found');
  const products = await db.prepare('SELECT id, name, stock, min_stock AS minStock, unit, cost FROM products WHERE supplier_id = ? AND active = 1 ORDER BY lower(name)').all(id);
  res.json({ ...item, products });
});

router.post('/', async (req, res) => {
  const db = getDb();
  const b = readBody(req.body);
  const id = (await db.prepare('INSERT INTO suppliers (business_id, name, contact, phone, email, lead_time_days, notes) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(req.user.businessId, b.name, b.contact, b.phone, b.email, b.leadTimeDays, b.notes)).lastInsertRowid;
  res.status(201).json(await db.prepare(`${SELECT} WHERE s.id = ?`).get(id));
});

router.put('/:id', async (req, res) => {
  const db = getDb();
  const id = v.id(req.params.id, 'id');
  const b = readBody(req.body);
  const info = await db.prepare('UPDATE suppliers SET name = ?, contact = ?, phone = ?, email = ?, lead_time_days = ?, notes = ? WHERE id = ? AND business_id = ?')
    .run(b.name, b.contact, b.phone, b.email, b.leadTimeDays, b.notes, id, req.user.businessId);
  if (!info.changes) throw notFound('suppliers.not_found');
  res.json(await db.prepare(`${SELECT} WHERE s.id = ?`).get(id));
});

router.delete('/:id', async (req, res) => {
  const id = v.id(req.params.id, 'id');
  const info = await getDb().prepare('DELETE FROM suppliers WHERE id = ? AND business_id = ?').run(id, req.user.businessId);
  if (!info.changes) throw notFound('suppliers.not_found');
  res.status(204).end();
});

module.exports = router;
