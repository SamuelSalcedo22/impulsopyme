'use strict';
const { AppError } = require('../errors');

/** Convierte cualquier error en {error:{code,params}}; los detalles técnicos solo van al log del servidor. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, params: err.params } });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'common.bad_payload', params: {} } });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'common.payload_too_large', params: {} } });
  }
  console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  return res.status(500).json({ error: { code: 'common.unexpected', params: {} } });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'common.not_found', params: {} } });
}

module.exports = { errorHandler, notFoundHandler };
