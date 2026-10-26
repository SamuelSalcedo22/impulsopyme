'use strict';
const { badRequest } = require('../errors');

/** Texto obligatorio con largo mínimo y máximo. */
function text(value, field, { min = 1, max = 120, required = true } = {}) {
  const s = value == null ? '' : String(value).trim();
  if (!s) {
    if (required) throw badRequest('validation.required', { field });
    return null;
  }
  if (s.length < min) throw badRequest('validation.too_short', { field, min });
  if (s.length > max) throw badRequest('validation.too_long', { field, max });
  return s;
}

/** Número finito; permite mínimo y máximo. */
function number(value, field, { min = 0, max = 1e12, required = true, fallback = 0 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw badRequest('validation.required', { field });
    return fallback;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) throw badRequest('validation.not_a_number', { field });
  if (n < min) throw badRequest('validation.too_small', { field, min });
  if (n > max) throw badRequest('validation.too_large', { field, max });
  return n;
}

function oneOf(value, field, allowed, { required = true, fallback = null } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw badRequest('validation.required', { field });
    return fallback;
  }
  if (!allowed.includes(value)) throw badRequest('validation.invalid_option', { field });
  return value;
}

function id(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw badRequest('validation.invalid_id', { field });
  return n;
}

function optionalId(value, field) {
  if (value === undefined || value === null || value === '') return null;
  return id(value, field);
}

function email(value, field) {
  const s = text(value, field, { required: false, max: 160 });
  if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw badRequest('validation.invalid_email', { field });
  return s;
}

module.exports = { text, number, oneOf, id, optionalId, email };
