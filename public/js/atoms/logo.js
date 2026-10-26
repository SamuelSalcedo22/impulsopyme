import { html, cx } from '../core/html.js';

/** Átomo: marca de ImpulsoPYME. `withName` agrega el nombre en tipografía Syne. */
export function logo({ size = 40, withName = false, className = '' } = {}) {
  return html`<span class="${cx('inline-flex items-center gap-3', className)}">
    <img src="/assets/logo.svg" width="${size}" height="${size}" alt="" />
    ${withName ? html`<span class="font-display text-xl font-bold tracking-tight">Impulso<span class="text-ember">PYME</span></span>` : ''}
  </span>`;
}
