import { html, cx } from '../core/html.js';
import { link } from '../core/router.js';

/**
 * Molécula: pestañas internas (navegación contextual). Segmentan vistas de un mismo nivel;
 * el estado vive en la URL (?tab=...), así se puede recargar o compartir.
 */
export function tabs({ items, active, path }) {
  return html`<div role="tablist" class="flex max-w-full gap-1 overflow-x-auto rounded-chip border border-glass-border bg-glass p-1">
    ${items.map((item) => html`<a role="tab" href="${link(path, { tab: item.key })}" aria-selected="${item.key === active}"
      class="${cx('whitespace-nowrap rounded-chip px-4 py-2 text-sm font-semibold transition-colors duration-fast', item.key === active ? 'bg-ember text-white' : 'text-ink-2 hover:bg-glass-strong hover:text-ink')}">${item.label}</a>`)}
  </div>`;
}
