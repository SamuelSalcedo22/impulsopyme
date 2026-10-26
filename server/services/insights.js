'use strict';
const { getDb } = require('../db/connection');
const { localDate, addDays, dateRange, weekday } = require('../utils/dates');
const { forecastSales } = require('../analytics/forecast');
const { detectAnomalies } = require('../analytics/anomalies');
const { analyzeProduct, reorderSuggestion } = require('../analytics/productInsights');
const { mean, sum } = require('../analytics/stats');

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2, info: 3 };

function loadDailyRevenue(db, businessId, from, to) {
  const rows = db.prepare('SELECT sold_date AS date, SUM(total) AS value FROM sales WHERE business_id = ? AND sold_date BETWEEN ? AND ? GROUP BY sold_date').all(businessId, from, to);
  const map = new Map(rows.map((r) => [r.date, r.value]));
  return dateRange(from, to).map((date) => ({ date, value: map.get(date) || 0 }));
}

function loadProductUnits(db, businessId, from, to) {
  const rows = db.prepare(
    `SELECT si.product_id AS id, s.sold_date AS date, SUM(si.quantity) AS qty
     FROM sale_items si JOIN sales s ON s.id = si.sale_id
     WHERE s.business_id = ? AND s.sold_date BETWEEN ? AND ? GROUP BY si.product_id, s.sold_date`
  ).all(businessId, from, to);
  const byProduct = new Map();
  for (const r of rows) {
    if (!byProduct.has(r.id)) byProduct.set(r.id, new Map());
    byProduct.get(r.id).set(r.date, r.qty);
  }
  return byProduct;
}

/** Atribuye una anomalía al producto que más se desvió de su comportamiento normal ese día. */
function findDriver(anomaly, products, unitsByProduct, days) {
  let best = null;
  for (const p of products) {
    const map = unitsByProduct.get(p.id);
    if (!map) continue;
    const qty = map.get(anomaly.date) || 0;
    const peers = days.filter((d) => d !== anomaly.date && weekday(d) === weekday(anomaly.date)).map((d) => map.get(d) || 0);
    const expected = mean(peers);
    const delta = (qty - expected) * p.price;
    if (!best || Math.abs(delta) > Math.abs(best.delta)) best = { product: p.name, delta, qty, expected };
  }
  return best ? { product: best.product, units: Math.round(best.qty), expectedUnits: Math.round(best.expected) } : null;
}

function buildInsights(businessId, { horizon = 14 } = {}) {
  const db = getDb();
  const today = localDate();
  const yesterday = addDays(today, -1);

  const firstSale = db.prepare('SELECT MIN(sold_date) AS d FROM sales WHERE business_id = ?').get(businessId).d;
  const empty = { horizon, forecast: { insufficient: true, minDays: 21, points: [], total: 0, history: [] }, anomalies: [], insights: [], reorder: [], summary: null };
  if (!firstSale || firstSale >= yesterday) return empty;

  const series = loadDailyRevenue(db, businessId, firstSale, yesterday);
  const forecast = forecastSales(series, horizon);
  const history = series.slice(-28);

  const days56 = dateRange(addDays(yesterday, -55), yesterday);
  const unitsByProduct = loadProductUnits(db, businessId, days56[0], yesterday);

  const products = db.prepare(
    `SELECT p.id, p.name, p.unit, p.stock, p.min_stock AS minStock, p.cost, p.price, COALESCE(s.lead_time_days, 3) AS leadTime, s.name AS supplierName
     FROM products p LEFT JOIN suppliers s ON s.id = p.supplier_id
     WHERE p.business_id = ? AND p.active = 1 AND p.track_stock = 1`
  ).all(businessId);

  const insights = [];
  const reorder = [];
  for (const p of products) {
    const map = unitsByProduct.get(p.id) || new Map();
    const units = days56.map((date) => ({ date, qty: map.get(date) || 0 }));
    const result = analyzeProduct({ ...p, units });
    insights.push(...result.insights);
    const suggested = reorderSuggestion(p, result.avgDaily);
    if (suggested > 0 && result.avgDaily >= 0.3 && (p.stock <= p.minStock || result.cover <= p.leadTime + 3)) {
      reorder.push({ productId: p.id, name: p.name, unit: p.unit, stock: p.stock, suggested, supplier: p.supplierName, coverDays: Math.round(result.cover * 10) / 10 });
    }
  }
  reorder.sort((a, b) => a.coverDays - b.coverDays);

  // Los días fuertes se limitan a los 3 de mayor impacto para no saturar la pantalla.
  const peaks = insights.filter((i) => i.type === 'weekday_peak').sort((a, b) => b.params.peakUnits * b.params.uplift - a.params.peakUnits * a.params.uplift);
  const keepPeaks = new Set(peaks.slice(0, 3));
  for (let i = insights.length - 1; i >= 0; i -= 1) if (insights[i].type === 'weekday_peak' && !keepPeaks.has(insights[i])) insights.splice(i, 1);

  const anomalies = detectAnomalies(series).map((a) => ({ ...a, driver: findDriver(a, products, unitsByProduct, days56) }));
  for (const a of anomalies) {
    insights.push({ type: a.direction === 'up' ? 'anomaly_up' : 'anomaly_down', severity: 'medium', entity: { type: 'day', date: a.date }, params: { date: a.date, ratio: Math.round(a.ratio * 100) / 100, driver: a.driver?.product || null } });
  }

  insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  let summary = null;
  if (!forecast.insufficient) {
    const next7 = sum(forecast.points.slice(0, 7).map((p) => p.value));
    const last7 = sum(series.slice(-7).map((p) => p.value));
    const best = forecast.points.slice(0, 7).reduce((acc, p) => (p.value > acc.value ? p : acc), forecast.points[0]);
    summary = { next7, last7, change: last7 > 0 ? next7 / last7 - 1 : null, bestDay: best.date, bestDayValue: best.value };
  }

  return { horizon, forecast: { ...forecast, history }, anomalies, insights, reorder: reorder.slice(0, 8), summary };
}

module.exports = { buildInsights };
