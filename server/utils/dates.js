'use strict';
const config = require('../config');

const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: config.TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

/** Fecha local (YYYY-MM-DD) del negocio para un instante dado. */
function localDate(date = new Date()) {
  return dayFormatter.format(date);
}

/** Suma días a una fecha YYYY-MM-DD sin problemas de zona horaria. */
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

/** Día de la semana de una fecha YYYY-MM-DD: 0 = domingo ... 6 = sábado. */
function weekday(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function dateRange(from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

module.exports = { localDate, addDays, weekday, dateRange };
