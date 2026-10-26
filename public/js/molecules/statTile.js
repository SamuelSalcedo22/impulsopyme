import { html, cx } from '../core/html.js';

/**
 * Molécula: cifra grande con etiqueta pequeña y una línea de color debajo (como en la referencia).
 * Las etiquetas pueden ocupar varias líneas: nunca se trunca el texto traducido.
 */
export function statTile({ value, label, tone = 'ember', className = '' }) {
  const colors = { ember: 'bg-ember', amber: 'bg-series-1', sky: 'bg-series-4', lime: 'bg-positive' };
  return html`<div class="${cx('min-w-0', className)}">
    <p class="stat-number text-xl sm:text-[1.65rem]">${value}</p>
    <p class="mt-2 text-sm text-ink-2">${label}</p>
    <span class="mt-2 block h-[3px] w-14 rounded-full ${colors[tone] || colors.ember}"></span>
  </div>`;
}
