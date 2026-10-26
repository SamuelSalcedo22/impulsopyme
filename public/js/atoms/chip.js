import { html, cx } from '../core/html.js';
import { icon } from './icon.js';

/** Átomo: etiqueta pequeña con tono semántico (positive, negative, warning, ember). */
export function chip(label, { tone = '', iconName = '', className = '' } = {}) {
  return html`<span class="${cx('chip', tone && `chip--${tone}`, className)}">${iconName ? icon(iconName, { size: 14 }) : ''}${label}</span>`;
}

/** Variación porcentual con flecha: verde si sube, rosa si baja. */
export function delta(value, { digits = 0, suffix = '' } = {}) {
  if (value === null || value === undefined || !Number.isFinite(value)) return html`<span class="chip">—</span>`;
  const up = value >= 0;
  const text = `${up ? '+' : ''}${(value * 100).toFixed(digits)}%${suffix}`;
  return chip(text, { tone: up ? 'positive' : 'negative', iconName: up ? 'trending-up' : 'trending-down' });
}
