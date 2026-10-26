/**
 * Plantillas HTML seguras. Todo valor interpolado se escapa salvo que ya sea HTML generado
 * por otro componente (clase Safe). Así ningún dato del usuario puede inyectar código.
 */
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

export class Safe {
  constructor(text) { this.text = text; }
  toString() { return this.text; }
}

/** Marca un texto como HTML de confianza (solo para SVG o HTML propio, nunca para datos del usuario). */
export const raw = (text) => new Safe(text);

function render(value) {
  if (value == null || value === false || value === true) return '';
  if (value instanceof Safe) return value.text;
  if (Array.isArray(value)) return value.map(render).join('');
  return esc(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((value, i) => { out += render(value) + strings[i + 1]; });
  return new Safe(out);
}

/** Convierte una lista de clases condicionales en un string: cx('a', cond && 'b'). */
export const cx = (...parts) => parts.filter(Boolean).join(' ');

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Delegación de eventos: un solo listener por contenedor, con data-action en los elementos. */
export function on(root, type, selector, handler) {
  root.addEventListener(type, (event) => {
    const target = event.target.closest(selector);
    if (target && root.contains(target)) handler(event, target);
  });
}
