'use strict';
const { mean, sum } = require('./stats');
const { weekday } = require('../utils/dates');

/**
 * Reglas por producto. Cada producto llega como:
 * { id, name, unit, stock, minStock, cost, price, leadTime, supplierName, units: [{date, qty}] (últimos 56 días, sin huecos) }
 * Devuelve insights con {type, severity, params, entity} para que la interfaz los traduzca (ES/EN).
 */
function analyzeProduct(p) {
  const last28 = p.units.slice(-28).map((u) => u.qty);
  const prev28 = p.units.slice(-56, -28).map((u) => u.qty);
  const avgDaily = mean(last28);
  const insights = [];
  const entity = { type: 'product', id: p.id };
  const lead = p.leadTime || 3;
  const cover = avgDaily > 0 ? p.stock / avgDaily : Infinity;

  // 1) Riesgo de agotarse antes de que llegue el reabastecimiento
  if (avgDaily >= 0.3 && (p.stock <= 0 || cover <= lead + 1)) {
    insights.push({ type: 'stockout_risk', severity: p.stock <= 0 || cover <= lead ? 'high' : 'medium', entity, params: { product: p.name, stock: p.stock, unit: p.unit, coverDays: Math.max(0, Math.round(cover * 10) / 10), leadDays: lead, supplier: p.supplierName } });
  } else if (avgDaily >= 0.3 && p.stock <= p.minStock) {
    insights.push({ type: 'below_minimum', severity: 'medium', entity, params: { product: p.name, stock: p.stock, minStock: p.minStock, unit: p.unit } });
  }

  // 2) Baja rotación: demasiado tiempo de cobertura con dinero inmovilizado
  const idle = p.stock * p.cost;
  if (cover > 120 && idle >= 40000) {
    insights.push({ type: 'low_rotation', severity: 'low', entity, params: { product: p.name, stock: p.stock, unit: p.unit, soldLast30: Math.round(sum(p.units.slice(-30).map((u) => u.qty)) * 10) / 10, idleValue: Math.round(idle) } });
  }

  // 3) Día fuerte de la semana: "las ventas aumentan los viernes; revisar inventario antes de ese día"
  if (avgDaily >= 1.5) {
    const byDow = Array.from({ length: 7 }, () => []);
    p.units.slice(-56).forEach((u) => byDow[weekday(u.date)].push(u.qty));
    const means = byDow.map((vals) => mean(vals));
    const overall = mean(means) || 1;
    let best = 0;
    means.forEach((m, d) => { if (m > means[best]) best = d; });
    const uplift = means[best] / overall - 1;
    if (uplift >= 0.4) {
      insights.push({ type: 'weekday_peak', severity: p.stock < means[best] * 1.5 ? 'medium' : 'info', entity, params: { product: p.name, weekday: best, uplift: Math.round(uplift * 100), peakUnits: Math.round(means[best]), stock: p.stock, unit: p.unit } });
    }
  }

  // 4) Cambio de tendencia entre las últimas dos mensualidades
  const prevAvg = mean(prev28);
  if (avgDaily >= 1 && prevAvg >= 1) {
    const change = avgDaily / prevAvg - 1;
    if (change >= 0.35) insights.push({ type: 'demand_up', severity: 'info', entity, params: { product: p.name, change: Math.round(change * 100) } });
    if (change <= -0.35) insights.push({ type: 'demand_down', severity: 'low', entity, params: { product: p.name, change: Math.round(change * 100) } });
  }

  // 5) Margen muy bajo en un producto que se vende mucho
  const margin = p.price > 0 ? (p.price - p.cost) / p.price : 0;
  if (avgDaily >= 3 && margin < 0.14) {
    insights.push({ type: 'low_margin', severity: 'low', entity, params: { product: p.name, margin: Math.round(margin * 100) } });
  }

  return { avgDaily, cover, insights };
}

/** Cantidad sugerida para cubrir el plazo del proveedor más una semana de ventas. */
function reorderSuggestion(p, avgDaily) {
  const lead = p.leadTime || 3;
  const need = avgDaily * (lead + 7);
  const qty = Math.ceil(need - p.stock);
  return qty > 0 ? qty : 0;
}

module.exports = { analyzeProduct, reorderSuggestion };
