import { html, raw, esc, cx } from '../core/html.js';
import { icon } from './icon.js';

/** Convierte {id: 5, tab: 'x'} en data-id="5" data-tab="x" con valores escapados. */
export function dataAttrs(data = {}) {
  return raw(Object.entries(data).map(([key, value]) => `data-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}="${esc(value)}"`).join(' '));
}

/**
 * Átomo: botón. El ancho NUNCA se fija al texto (regla de internacionalización):
 * crece con el contenido y el texto largo se parte en vez de recortarse.
 */
export function button({ label, variant = 'primary', size = 'md', iconName = '', action = '', type = 'button', disabled = false, data = {}, className = '', iconRight = false } = {}) {
  const classes = cx('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', className);
  const glyph = iconName ? icon(iconName, { size: size === 'sm' ? 16 : 18 }) : '';
  return html`<button type="${type}" class="${classes}" ${action ? raw(`data-action="${esc(action)}"`) : ''} ${dataAttrs(data)} ${disabled ? raw('disabled') : ''}>${iconRight ? '' : glyph}<span>${label}</span>${iconRight ? glyph : ''}</button>`;
}

/** Botón que solo muestra un ícono; exige una etiqueta accesible. */
export function iconButton({ iconName, label, action = '', variant = 'ghost', size = 'md', className = '', data = {} }) {
  const classes = cx('btn btn-icon', `btn-${variant}`, size === 'sm' && 'btn-sm', className);
  return html`<button type="button" class="${classes}" aria-label="${label}" title="${label}" ${action ? raw(`data-action="${esc(action)}"`) : ''} ${dataAttrs(data)}>${icon(iconName, { size: size === 'sm' ? 16 : 20 })}</button>`;
}
