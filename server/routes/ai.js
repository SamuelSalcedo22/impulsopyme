'use strict';
const express = require('express');
const { getDb } = require('../db/connection');
const { buildInsights } = require('../services/insights');
const vertex = require('../ai/vertex');
const { forbidden, badRequest } = require('../errors');
const { localDate } = require('../utils/dates');

const router = express.Router();

router.get('/status', (_req, res) => res.json(vertex.status()));

/** Análisis local (estadística propia): siempre disponible, aunque no haya credenciales de Google. */
router.get('/insights', (req, res) => {
  const horizon = Math.min(Math.max(Number(req.query.horizon) || 14, 7), 28);
  res.json(buildInsights(req.user.businessId, { horizon }));
});

/** Resumen en lenguaje natural con Vertex AI. Se guarda por día e idioma para no gastar cuota de más. */
router.post('/narrative', async (req, res) => {
  const db = getDb();
  const locale = req.body.locale === 'en' ? 'en' : 'es';
  const day = localDate();
  const { businessId } = req.user;

  if (!req.body.force) {
    const cached = db.prepare('SELECT payload FROM ai_cache WHERE business_id = ? AND locale = ? AND day = ?').get(businessId, locale, day);
    if (cached) return res.json({ ...JSON.parse(cached.payload), cached: true });
  }

  const insights = buildInsights(businessId);
  if (insights.forecast.insufficient) throw badRequest('ai.not_enough_data');
  const business = db.prepare('SELECT type FROM businesses WHERE id = ?').get(businessId);

  const stats = {
    businessType: business.type,
    nextWeekForecast: Math.round(insights.summary.next7),
    lastWeekActual: Math.round(insights.summary.last7),
    changeVsLastWeek: insights.summary.change == null ? null : Math.round(insights.summary.change * 100) / 100,
    forecastAccuracy: insights.forecast.backtest ? Math.round(insights.forecast.backtest.accuracy * 100) : null,
    anomalies: insights.anomalies.slice(0, 3).map((a) => ({ date: a.date, ratioVsExpected: Math.round(a.ratio * 100) / 100, driver: a.driver?.product || null })),
    alerts: insights.insights.filter((i) => i.severity !== 'info').slice(0, 8).map((i) => ({ type: i.type, ...i.params })),
    reorder: insights.reorder.slice(0, 5).map((r) => ({ product: r.name, stock: r.stock, coverDays: r.coverDays, suggested: r.suggested }))
  };

  const result = await vertex.narrate(stats, locale);
  const payload = { ...result, generatedAt: new Date().toISOString() };
  db.prepare('INSERT OR REPLACE INTO ai_cache (business_id, locale, day, payload) VALUES (?, ?, ?, ?)').run(businessId, locale, day, JSON.stringify(payload));
  res.json({ ...payload, cached: false });
});

router.put('/credentials', (req, res) => {
  if (req.user.role !== 'owner') throw forbidden();
  res.json(vertex.saveCredentials(req.body.key));
});

router.delete('/credentials', (req, res) => {
  if (req.user.role !== 'owner') throw forbidden();
  vertex.removeCredentials();
  res.json(vertex.status());
});

module.exports = router;
