import { html } from '../core/html.js';
import { t } from '../core/i18n.js';

/** Átomo: indicador de carga con texto para lectores de pantalla. */
export function spinner({ size = 22 } = {}) {
  return html`<span class="inline-flex items-center" role="status">
    <svg class="animate-spin text-ember" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity=".2" stroke-width="3"/><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
    <span class="sr-only-live">${t('common.loading')}</span>
  </span>`;
}

/** Bloque gris pulsante para reservar el espacio mientras llegan los datos. */
export function skeleton({ height = 120, className = '' } = {}) {
  return html`<div class="animate-pulse rounded-card bg-glass ${className}" style="height:${height}px" aria-hidden="true"></div>`;
}
