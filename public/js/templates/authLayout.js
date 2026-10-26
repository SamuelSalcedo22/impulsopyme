import { html } from '../core/html.js';
import { logo } from '../atoms/logo.js';
import { icon } from '../atoms/icon.js';
import { t, getLocale, locales } from '../core/i18n.js';

/**
 * Plantilla de acceso (inicio de sesión y registro). A la izquierda la promesa del producto,
 * a la derecha el formulario. En pantallas pequeñas la promesa pasa arriba, más corta.
 */
export function authLayout({ content }) {
  const locale = getLocale();
  const points = [['trending-up', 'auth.point_forecast'], ['alert', 'auth.point_alerts'], ['inventory', 'auth.point_stock']];
  return html`<div class="relative grid min-h-screen overflow-hidden lg:grid-cols-[1.1fr_1fr]">
    <section class="relative flex flex-col justify-between gap-10 overflow-hidden p-6 sm:p-10 lg:p-14">
      <div class="hero-glow" style="inset:-30% auto auto -20%"></div>
      <div class="relative flex items-center justify-between gap-4">
        ${logo({ size: 44, withName: true })}
        <div class="inline-flex rounded-chip border border-glass-border bg-glass p-0.5 lg:hidden" role="group" aria-label="${t('settings.language')}">
          ${locales().map((code) => html`<button type="button" data-action="set-locale" data-locale="${code}" aria-pressed="${code === locale}" class="rounded-chip px-3 py-1.5 text-xs font-bold ${code === locale ? 'bg-glass-strong text-ink' : 'text-ink-muted'}">${code.toUpperCase()}</button>`)}
        </div>
      </div>
      <div class="relative max-w-xl">
        <h1 class="font-display text-[2.2rem] font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">${t('auth.hero_title')}</h1>
        <p class="mt-5 max-w-md text-lg text-ink-2">${t('auth.hero_text')}</p>
        <ul class="mt-8 hidden flex-col gap-3 sm:flex">
          ${points.map(([name, key]) => html`<li class="flex items-center gap-3 text-ink-2"><span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-glass-strong text-ember">${icon(name, { size: 18 })}</span><span>${t(key)}</span></li>`)}
        </ul>
      </div>
      <p class="relative hidden text-sm text-ink-muted lg:block">${t('auth.footer')}</p>
    </section>
    <section class="relative flex items-center justify-center p-4 pb-10 sm:p-8 lg:p-12">
      <div class="glass-card w-full max-w-md">${content}</div>
    </section>
  </div>`;
}
