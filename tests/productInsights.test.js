'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeProduct, reorderSuggestion } = require('../server/analytics/productInsights');
const { addDays } = require('../server/utils/dates');

const units = (fn) => Array.from({ length: 56 }, (_, i) => ({ date: addDays('2026-08-01', i), qty: fn(i) }));
const base = { id: 1, name: 'Leche', unit: 'und', cost: 3000, price: 4500, leadTime: 2, supplierName: 'Lácteos' };
const types = (r) => r.insights.map((i) => i.type);

test('avisa riesgo de agotarse cuando el stock no cubre el plazo del proveedor', () => {
  const r = analyzeProduct({ ...base, stock: 5, minStock: 2, units: units(() => 10) });
  assert.ok(types(r).includes('stockout_risk'));
  assert.equal(r.insights.find((i) => i.type === 'stockout_risk').severity, 'high');
});

test('un producto con stock de sobra y ventas estables no genera alertas de stock', () => {
  const r = analyzeProduct({ ...base, stock: 500, minStock: 5, units: units(() => 10) });
  assert.ok(!types(r).includes('stockout_risk'));
  assert.ok(!types(r).includes('below_minimum'));
});

test('detecta baja rotación y demanda en aumento', () => {
  const slow = analyzeProduct({ ...base, stock: 200, minStock: 5, units: units((i) => (i % 14 === 0 ? 1 : 0)) });
  assert.ok(types(slow).includes('low_rotation'));
  const rising = analyzeProduct({ ...base, stock: 500, minStock: 5, units: units((i) => (i < 28 ? 5 : 12)) });
  assert.ok(types(rising).includes('demand_up'));
});

test('sugerencia de pedido cubre plazo + una semana', () => {
  assert.equal(reorderSuggestion({ leadTime: 2, stock: 5 }, 10), 85);
  assert.equal(reorderSuggestion({ leadTime: 2, stock: 500 }, 10), 0);
});
