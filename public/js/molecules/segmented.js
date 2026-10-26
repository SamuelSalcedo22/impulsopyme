import { html, cx } from '../core/html.js';
import { dataAttrs } from '../atoms/button.js';

/** Molécula: selector de una opción entre pocas (por ejemplo el rango de días). Dispara data-action. */
export function segmented({ options, value, action, label }) {
  return html`<div role="group" aria-label="${label}" class="inline-flex gap-1 rounded-chip border border-glass-border bg-glass p-1">
    ${options.map((o) => html`<button type="button" data-action="${action}" ${dataAttrs({ value: o.value })} aria-pressed="${String(o.value) === String(value)}"
      class="${cx('rounded-chip px-3.5 py-1.5 text-sm font-semibold transition-colors duration-fast', String(o.value) === String(value) ? 'bg-glass-strong text-ink shadow-[inset_0_0_0_1px_var(--s-color-surface-glass-border)]' : 'text-ink-muted hover:text-ink')}">${o.label}</button>`)}
  </div>`;
}
