'use strict';
const express = require('express');
const { getDb } = require('../db/connection');
const { notFound, conflict } = require('../errors');
const v = require('../utils/validate');

const router = express.Router();

router.get('/', (req, res) => {
  const items = getDb().prepare(
    `SELECT c.id, c.name, COUNT(p.id) AS productCount
     FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.active = 1
     WHERE c.business_id = ? GROUP BY c.id ORDER BY c.name COLLATE NOCASE`
  ).all(req.user.businessId);
  res.json({ items });
});

router.post('/', (req, res) => {
  const db = getDb();
  const name = v.text(req.body.name, 'name', { max: 60 });
  if (db.prepare('SELECT 1 FROM categories WHERE business_id = ? AND name = ? COLLATE NOCASE').get(req.user.businessId, name)) throw conflict('categories.duplicate');
  const id = db.prepare('INSERT INTO categories (business_id, name) VALUES (?, ?)').run(req.user.businessId, name).lastInsertRowid;
  res.status(201).json({ id, name, productCount: 0 });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const id = v.id(req.params.id, 'id');
  const name = v.text(req.body.name, 'name', { max: 60 });
  const info = db.prepare('UPDATE categories SET name = ? WHERE id = ? AND business_id = ?').run(name, id, req.user.businessId);
  if (!info.changes) throw notFound('categories.not_found');
  res.json({ id, name });
});

router.delete('/:id', (req, res) => {
  const id = v.id(req.params.id, 'id');
  const info = getDb().prepare('DELETE FROM categories WHERE id = ? AND business_id = ?').run(id, req.user.businessId);
  if (!info.changes) throw notFound('categories.not_found');
  res.status(204).end();
});

module.exports = router;
