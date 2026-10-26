import { intlLocale } from './i18n.js';

const cache = new Map();
function formatter(key, factory) {
  const full = `${intlLocale()}|${key}`;
  if (!cache.has(full)) cache.set(full, factory());
  return cache.get(full);
}

/** Pesos colombianos sin decimales: $ 1.250.000 */
export const money = (n) => formatter('money', () => new Intl.NumberFormat(intlLocale(), { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })).format(n || 0);

/** Versión compacta para cifras grandes: $ 29,2 M */
export function moneyCompact(n) {
  const abs = Math.abs(n || 0);
  if (abs < 100000) return money(n);
  return formatter('compact', () => new Intl.NumberFormat(intlLocale(), { style: 'currency', currency: 'COP', notation: 'compact', maximumFractionDigits: 1 })).format(n);
}

export const number = (n, digits = 0) => formatter(`n${digits}`, () => new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: digits })).format(n || 0);
export const compact = (n) => formatter('c', () => new Intl.NumberFormat(intlLocale(), { notation: 'compact', maximumFractionDigits: 1 })).format(n || 0);
export const percent = (n, digits = 0) => formatter(`p${digits}`, () => new Intl.NumberFormat(intlLocale(), { style: 'percent', maximumFractionDigits: digits })).format(n || 0);

const parse = (value) => (value.length <= 10 ? new Date(`${value}T12:00:00`) : new Date(value));

export const dateShort = (value) => formatter('ds', () => new Intl.DateTimeFormat(intlLocale(), { day: 'numeric', month: 'short' })).format(parse(value));
export const dateLong = (value) => formatter('dl', () => new Intl.DateTimeFormat(intlLocale(), { weekday: 'long', day: 'numeric', month: 'long' })).format(parse(value));
export const dateTime = (value) => formatter('dt', () => new Intl.DateTimeFormat(intlLocale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })).format(parse(value));
export const time = (value) => formatter('tm', () => new Intl.DateTimeFormat(intlLocale(), { hour: '2-digit', minute: '2-digit' })).format(parse(value));
export const weekdayShort = (value) => formatter('ws', () => new Intl.DateTimeFormat(intlLocale(), { weekday: 'short' })).format(parse(value));

/** Nombre del día de la semana a partir de su índice (0 = domingo). */
export function weekdayName(index, style = 'long') {
  const sunday = new Date(Date.UTC(2024, 0, 7 + index));
  return new Intl.DateTimeFormat(intlLocale(), { weekday: style, timeZone: 'UTC' }).format(sunday);
}

/** "los viernes" / "Fridays": el día en plural según el idioma. */
export function weekdayPlural(index) {
  const name = weekdayName(index);
  return name.endsWith('s') ? name : `${name}s`;
}

export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
