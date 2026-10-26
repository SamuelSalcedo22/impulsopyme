import { html } from '../core/html.js';

/** Plantilla de página: título, apoyo opcional y acciones principales alineadas a la derecha. */
export function pageHeader({ title, subtitle = '', actions = '' }) {
  return html`<div class="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
    <div class="min-w-0 max-w-2xl">
      <h1 class="break-words font-display text-[1.9rem] font-bold leading-tight sm:text-4xl">${title}</h1>
      ${subtitle ? html`<p class="mt-2 text-ink-2">${subtitle}</p>` : ''}
    </div>
    ${actions ? html`<div class="flex flex-wrap items-center gap-3">${actions}</div>` : ''}
  </div>`;
}
