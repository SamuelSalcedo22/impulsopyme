'use strict';
const express = require('express');
const { getDb } = require('../db/connection');
const { localDate, addDays, dateRange } = require('../utils/dates');

const router = express.Router();

function periodStats(db, businessId, from, to) {
  return db.prepare(
    `SELECT COALESCE(SUM(s.total), 0) AS revenue, COUNT(s.id) AS tickets,
            COALESCE((SELECT SUM(si.quantity * (si.unit_price - si.unit_cost)) FROM sale_items si JOIN sales s2 ON s2.id = si.sale_id
                      WHERE s2.business_id = ? AND s2.sold_date BETWEEN ? AND ?), 0) AS profit
     FROM sales s WHERE s.business_id = ? AND s.sold_date BETWEEN ? AND ?`
  ).get(businessId, from, to, businessId, from, to);
}

const pct = (now, before) => (before > 0 ? (now - before) / before : null);

router.get('/', (req, res) => {
  const db = getDb();
  const { businessId } = req.user;
  const range = Math.min(Math.max(Number(req.query.range) || 30, 7), 180);
  const today = localDate();
  const from = addDays(today, -(range - 1));
  const prevFrom = addDays(from, -range);
  const prevTo = addDays(from, -1);

  const current = periodStats(db, businessId, from, today);
  const previous = periodStats(db, businessId, prevFrom, prevTo);
  const todayStats = periodStats(db, businessId, today, today);
  const sameDayLastWeek = periodStats(db, businessId, addDays(today, -7), addDays(today, -7));

  const dailyRows = db.prepare('SELECT sold_date AS date, SUM(total) AS revenue, COUNT(*) AS tickets FROM sales WHERE business_id = ? AND sold_date BETWEEN ? AND ? GROUP BY sold_date').all(businessId, from, today);
  const byDate = new Map(dailyRows.map((r) => [r.date, r]));
  const daily = dateRange(from, today).map((date) => ({ date, revenue: byDate.get(date)?.revenue || 0, tickets: byDate.get(date)?.tickets || 0 }));

  const topProducts = db.prepare(
    `SELECT p.id, p.name, p.unit, SUM(si.quantity) AS units, SUM(si.quantity * si.unit_price) AS revenue,
            SUM(si.quantity * (si.unit_price - si.unit_cost)) AS profit
     FROM sale_items si JOIN sales s ON s.id = si.sale_id JOIN products p ON p.id = si.product_id
     WHERE s.business_id = ? AND s.sold_date BETWEEN ? AND ? GROUP BY p.id ORDER BY revenue DESC LIMIT 6`
  ).all(businessId, from, today);

  const byCategory = db.prepare(
    `SELECT COALESCE(c.name, '—') AS name, SUM(si.quantity * si.unit_price) AS revenue
     FROM sale_items si JOIN sales s ON s.id = si.sale_id JOIN products p ON p.id = si.product_id LEFT JOIN categories c ON c.id = p.category_id
     WHERE s.business_id = ? AND s.sold_date BETWEEN ? AND ? GROUP BY c.id ORDER BY revenue DESC`
  ).all(businessId, from, today);

  const byPayment = db.prepare('SELECT payment_method AS method, SUM(total) AS revenue, COUNT(*) AS tickets FROM sales WHERE business_id = ? AND sold_date BETWEEN ? AND ? GROUP BY payment_method ORDER BY revenue DESC').all(businessId, from, today);

  const stock = db.prepare(
    `SELECT COUNT(*) AS products,
            SUM(CASE WHEN track_stock = 1 AND stock <= 0 THEN 1 ELSE 0 END) AS outOfStock,
            SUM(CASE WHEN track_stock = 1 AND stock > 0 AND stock <= min_stock THEN 1 ELSE 0 END) AS lowStock,
            COALESCE(SUM(CASE WHEN track_stock = 1 THEN stock * cost ELSE 0 END), 0) AS inventoryValue
     FROM products WHERE business_id = ? AND active = 1`
  ).get(businessId);

  const recent = db.prepare(
    `SELECT s.id, s.total, s.payment_method AS paymentMethod, s.sold_at AS soldAt, c.name AS customerName
     FROM sales s LEFT JOIN customers c ON c.id = s.customer_id WHERE s.business_id = ? ORDER BY s.sold_at DESC, s.id DESC LIMIT 5`
  ).all(businessId);

  res.json({
    range,
    kpis: {
      revenue: current.revenue,
      revenueChange: pct(current.revenue, previous.revenue),
      tickets: current.tickets,
      ticketsChange: pct(current.tickets, previous.tickets),
      averageTicket: current.tickets ? current.revenue / current.tickets : 0,
      profit: current.profit,
      margin: current.revenue ? current.profit / current.revenue : 0,
      today: todayStats.revenue,
      todayTickets: todayStats.tickets,
      todayVsLastWeek: pct(todayStats.revenue, sameDayLastWeek.revenue)
    },
    daily,
    topProducts,
    byCategory,
    byPayment,
    stock,
    recent
  });
});

module.exports = router;
