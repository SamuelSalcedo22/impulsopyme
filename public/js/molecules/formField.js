import { html, raw } from '../core/html.js';

/** Molécula: etiqueta + control + ayuda + espacio para el error de ese campo. */
export function formField({ label, name, control, hint = '', required = false, id = '' }) {
  const fieldId = id || `f-${name}`;
  return html`<div class="flex flex-col gap-2">
    <label for="${fieldId}" class="text-sm font-semibold text-ink-2">${label}${required ? html`<span class="text-ember" aria-hidden="true"> *</span>` : ''}</label>
    ${control}
    ${hint ? html`<p class="text-xs text-ink-muted" id="${fieldId}-hint">${hint}</p>` : ''}
    <p class="min-h-[1rem] text-xs text-negative" data-error-for="${name}" role="alert"></p>
  </div>`;
}

export const rawControl = (markup) => raw(markup);
