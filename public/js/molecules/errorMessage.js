import { html } from '../core/html.js';
import { icon } from '../atoms/icon.js';
import { button } from '../atoms/button.js';
import { errorParts, t } from '../core/i18n.js';

/**
 * Molécula: mensaje de error con las tres partes que pide la guía de contenido:
 * 1. Qué pasó (en lenguaje del usuario)  2. Por qué (solo si ayuda a actuar)  3. Qué hacer ahora.
 * Nunca muestra códigos internos: el código solo sirve para elegir el texto.
 */
export function errorMessage(error, { retryAction = '' } = {}) {
  const { what, why, todo } = errorParts(error?.code || 'common.unexpected', error?.params);
  return html`<div class="flex gap-3 rounded-control border border-[color-mix(in_srgb,var(--s-color-text-negative)_40%,transparent)] bg-[color-mix(in_srgb,var(--s-color-text-negative)_10%,transparent)] p-4" role="alert">
    <span class="mt-0.5 text-negative">${icon('alert', { size: 22 })}</span>
    <div class="min-w-0">
      <p class="font-semibold">${what}</p>
      ${why ? html`<p class="mt-1 text-sm text-ink-2">${why}</p>` : ''}
      <p class="mt-1 text-sm text-ink-2">${todo}</p>
      ${retryAction ? html`<div class="mt-3">${button({ label: t('common.retry'), variant: 'ghost', size: 'sm', action: retryAction, iconName: 'refresh' })}</div>` : ''}
    </div>
  </div>`;
}

/** Texto plano de las tres partes, para toasts. */
export function errorSummary(error) {
  const { what, todo } = errorParts(error?.code || 'common.unexpected', error?.params);
  return `${what} ${todo}`;
}
