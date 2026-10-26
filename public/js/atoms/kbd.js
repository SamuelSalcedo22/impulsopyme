import { html } from '../core/html.js';

/** Átomo: tecla de atajo (por ejemplo Ctrl K). */
export const kbd = (text) => html`<kbd class="rounded-lg border border-glass-border bg-glass px-2 py-0.5 text-xs text-ink-2">${text}</kbd>`;
