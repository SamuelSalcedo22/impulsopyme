import { html } from '../core/html.js';
import { icon } from '../atoms/icon.js';

/** Molécula: campo de búsqueda con ícono. Filtra en la propia página (data-search). */
export function searchBox({ placeholder, value = '', name = 'q', className = '' }) {
  return html`<label class="relative block ${className}">
    <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">${icon('search', { size: 18 })}</span>
    <input class="field pl-11" type="search" name="${name}" value="${value}" placeholder="${placeholder}" aria-label="${placeholder}" autocomplete="off" data-search />
  </label>`;
}
