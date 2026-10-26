'use strict';
const express = require('express');
const { getDb } = require('../db/connection');
const { localDate, addDays } = require('../utils/dates');

const router = express.Router();

/** Escapa un valor para CSV (comillas, comas y saltos de línea; previene inyección de fórmulas en Excel). */
function csvCell(value) {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function sendCsv(res, filename, header, rows) {
  const lines = [header.map(csvCell).join(',')];
  for (const row of rows) lines.push(row.map(csvCell).join(','));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(`﻿${lines.join('\r\n')}\r\n`);
}

router.get('/sales.csv', (req, res) => {
  const from = String(req.query.from || addDays(localDate(), -29));
  const to = String(req.query.to || localDate());
  const rows = getDb().prepare(
    `SELECT s.id, s.sold_at, COALESCE(c.name, ''), s.payment_method, s.total
     FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
     WHERE s.business_id = ? AND s.sold_date BETWEEN ? AND ? ORDER BY s.sold_at`
  ).raw().all(req.user.businessId, from, to);
  sendCsv(res, `ventas_${from}_${to}.csv`, ['venta', 'fecha', 'cliente', 'pago', 'total'], rows);
});

router.get('/inventory.csv', (req, res) => {
  const rows = getDb().prepare(
    `SELECT p.sku, p.name, COALESCE(c.name, ''), COALESCE(s.name, ''), p.unit, p.cost, p.price, p.stock, p.min_stock
     FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN suppliers s ON s.id = p.supplier_id
     WHERE p.business_id = ? AND p.active = 1 ORDER BY p.name COLLATE NOCASE`
  ).raw().all(req.user.businessId);
  sendCsv(res, `inventario_${localDate()}.csv`, ['sku', 'producto', 'categoria', 'proveedor', 'unidad', 'costo', 'precio', 'existencias', 'minimo'], rows);
});

router.get('/products.csv', (req, res) => {
  const from = String(req.query.from || addDays(localDate(), -29));
  const to = String(req.query.to || localDate());
  const rows = getDb().prepare(
    `SELECT p.name, COALESCE(c.name, ''), SUM(si.quantity), SUM(si.quantity * si.unit_price), SUM(si.quantity * (si.unit_price - si.unit_cost))
     FROM sale_items si JOIN sales s ON s.id = si.sale_id JOIN products p ON p.id = si.product_id LEFT JOIN categories c ON c.id = p.category_id
     WHERE s.business_id = ? AND s.sold_date BETWEEN ? AND ? GROUP BY p.id ORDER BY 4 DESC`
  ).raw().all(req.user.businessId, from, to);
  sendCsv(res, `productos_${from}_${to}.csv`, ['producto', 'categoria', 'unidades', 'ingresos', 'utilidad'], rows);
});

module.exports = router;
