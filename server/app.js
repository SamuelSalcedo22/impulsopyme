'use strict';
const express = require('express');
const path = require('node:path');
const config = require('./config');
const { getDb } = require('./db/connection');
const { requireAuth } = require('./middleware/auth');
const { securityHeaders } = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

/** Construye la aplicación Express (separada de index.js para poder probarla sin abrir un puerto). */
function createApp() {
  getDb(); // abre la base y aplica el esquema
  const app = express();
  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', require('./routes/auth'));

  const api = express.Router();
  api.use(requireAuth);
  api.use('/products', require('./routes/products'));
  api.use('/categories', require('./routes/categories'));
  api.use('/suppliers', require('./routes/suppliers'));
  api.use('/customers', require('./routes/customers'));
  api.use('/sales', require('./routes/sales'));
  api.use('/dashboard', require('./routes/dashboard'));
  api.use('/search', require('./routes/search'));
  api.use('/reports', require('./routes/reports'));
  api.use('/ai', require('./routes/ai'));
  app.use('/api', api);
  app.use('/api', notFoundHandler);

  app.use(express.static(config.PUBLIC_DIR, { extensions: ['html'], maxAge: 0 }));
  // La interfaz es una SPA: cualquier ruta que no sea archivo ni API devuelve index.html.
  app.use((_req, res) => res.sendFile(path.join(config.PUBLIC_DIR, 'index.html')));

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
