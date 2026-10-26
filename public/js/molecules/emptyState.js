import { html } from '../core/html.js';
import { icon } from '../atoms/icon.js';
import { button } from '../atoms/button.js';

/** Molécula: pantalla vacía. Siempre invita a una acción concreta en lugar de solo informar. */
export function emptyState({ iconName = 'box', title, text = '', actionLabel = '', action = '' }) {
  return html`<div class="flex flex-col items-center gap-3 px-6 py-12 text-center">
    <span class="flex h-14 w-14 items-center justify-center rounded-full bg-glass-strong text-ink-2">${icon(iconName, { size: 26 })}</span>
    <h3 class="font-display text-lg font-bold">${title}</h3>
    ${text ? html`<p class="max-w-sm text-sm text-ink-2">${text}</p>` : ''}
    ${actionLabel ? button({ label: actionLabel, action, size: 'sm' }) : ''}
  </div>`;
}
