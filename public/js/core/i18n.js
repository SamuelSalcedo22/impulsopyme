/**
 * Internacionalización. Ningún texto visible está escrito en el código: todo sale de
 * /i18n/<idioma>.json. Cambiar de idioma no recarga la página.
 */
const SUPPORTED = ['es', 'en'];
const STORAGE_KEY = 'impulsopyme.locale';
const dictionaries = {};
let current = 'es';

async function load(locale) {
  if (dictionaries[locale]) return;
  const response = await fetch(`/i18n/${locale}.json`);
  dictionaries[locale] = await response.json();
}

function detect() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.includes(saved)) return saved;
  } catch { /* almacenamiento no disponible */ }
  return (navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
}

export async function initI18n(locale = detect()) {
  await Promise.all(SUPPORTED.map(load));
  setLocale(locale);
}

export function setLocale(locale) {
  current = SUPPORTED.includes(locale) ? locale : 'es';
  try { localStorage.setItem(STORAGE_KEY, current); } catch { /* sin almacenamiento */ }
  document.documentElement.lang = current;
}

export const getLocale = () => current;
export const intlLocale = () => (current === 'en' ? 'en-US' : 'es-CO');
export const locales = () => SUPPORTED;

function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), dict);
}

function interpolate(text, params = {}) {
  return String(text).replace(/\{(\w+)\}/g, (_, name) => (params[name] !== undefined && params[name] !== null ? params[name] : `{${name}}`));
}

/** Traduce una clave. Si falta en el idioma actual usa español; si tampoco existe, devuelve la clave. */
export function t(key, params) {
  const value = lookup(dictionaries[current], key) ?? lookup(dictionaries.es, key);
  return value === undefined ? key : interpolate(value, params);
}

/** Plurales simples: usa key_one cuando n === 1 y key_other en los demás casos. */
export function tn(key, n, params = {}) {
  return t(`${key}_${n === 1 ? 'one' : 'other'}`, { n, ...params });
}

/** Mensaje de error con tres partes: qué pasó, por qué (si ayuda) y qué hacer ahora. */
export function errorParts(code, params = {}) {
  const entry = dictionaries[current]?.errors?.[code] ?? dictionaries.es?.errors?.[code] ?? dictionaries[current]?.errors?.['common.unexpected'];
  const translated = { ...params };
  if (params.field) translated.field = t(`fields.${params.field}`);
  return {
    what: interpolate(entry.what, translated),
    why: entry.why ? interpolate(entry.why, translated) : '',
    todo: interpolate(entry.todo, translated)
  };
}
