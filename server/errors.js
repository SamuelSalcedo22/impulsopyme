'use strict';
/**
 * Errores de la aplicación. El servidor NUNCA envía texto técnico al usuario:
 * envía un `code` estable y `params`; la interfaz lo traduce a un mensaje con
 * tres partes (qué pasó, por qué, qué hacer ahora) en el idioma elegido.
 */
class AppError extends Error {
  constructor(status, code, params = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.params = params;
  }
}

const badRequest = (code, params) => new AppError(400, code, params);
const unauthorized = (code = 'auth.session_expired', params) => new AppError(401, code, params);
const forbidden = (code = 'auth.forbidden', params) => new AppError(403, code, params);
const notFound = (code = 'common.not_found', params) => new AppError(404, code, params);
const conflict = (code, params) => new AppError(409, code, params);

module.exports = { AppError, badRequest, unauthorized, forbidden, notFound, conflict };
