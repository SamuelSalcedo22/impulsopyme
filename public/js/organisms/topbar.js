import { html } from '../core/html.js';
import { icon } from '../atoms/icon.js';
import { avatar } from '../atoms/avatar.js';
import { kbd } from '../atoms/kbd.js';
import { breadcrumb } from '../molecules/breadcrumb.js';
import { t, getLocale, locales } from '../core/i18n.js';
import { state } from '../core/state.js';

/**
 * Organismo: barra superior. Lleva las migas de pan, la búsqueda global, el cambio de idioma,
 * las alertas y el menú de la cuenta. Los textos se ajustan: nada tiene ancho fijo.
 */
export function topbar({ crumbs }) {
  const locale = getLocale();
  return html`<header class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
    <div class="min-w-0">${breadcrumb(crumbs)}</div>
    <div class="flex flex-wrap items-center gap-2">
      <button type="button" data-action="open-search" class="btn btn-ghost btn-sm" aria-label="${t('search.open')}">
        ${icon('search', { size: 16 })}<span class="hidden sm:inline">${t('search.placeholder_short')}</span><span class="hidden lg:inline">${kbd('Ctrl K')}</span>
      </button>
      <div class="inline-flex rounded-chip border border-glass-border bg-glass p-0.5" role="group" aria-label="${t('settings.language')}">
        ${locales().map((code) => html`<button type="button" data-action="set-locale" data-locale="${code}" aria-pressed="${code === locale}" class="rounded-chip px-3 py-1.5 text-xs font-bold ${code === locale ? 'bg-glass-strong text-ink' : 'text-ink-muted hover:text-ink'}">${code.toUpperCase()}</button>`)}
      </div>
      <a href="#/ai?tab=alerts" class="btn btn-ghost btn-icon btn-sm relative" aria-label="${t('nav.alerts')}" title="${t('nav.alerts')}">
        ${icon('bell', { size: 18 })}${state.alertCount ? html`<span class="absolute right-2 top-2 h-2 w-2 rounded-full bg-ember"></span>` : ''}
      </a>
      <div class="relative">
        <button type="button" data-action="toggle-account" class="flex items-center gap-2 rounded-chip border border-glass-border bg-glass py-1 pl-1 pr-3 hover:bg-glass-strong" aria-haspopup="menu" aria-label="${t('account.menu')}">
          ${avatar(state.user?.name, { size: 32 })}<span class="hidden max-w-[10rem] truncate text-sm font-semibold sm:inline">${state.user?.name}</span>
        </button>
        <div data-account-menu hidden role="menu" class="glass-panel absolute right-0 top-full z-50 mt-2 w-64 !rounded-2xl bg-[var(--g-color-anthracite-800)]/95 p-2 shadow-2xl">
          <div class="px-3 py-2"><p class="font-semibold">${state.user?.name}</p><p class="break-words text-xs text-ink-muted">${state.business?.name}</p></div>
          <a role="menuitem" href="#/settings" class="nav-item">${icon('settings', { size: 18 })}<span class="text-sm font-semibold">${t('nav.settings')}</span></a>
          <button role="menuitem" type="button" data-action="logout" class="nav-item w-full">${icon('logout', { size: 18 })}<span class="text-sm font-semibold">${t('account.logout')}</span></button>
        </div>
      </div>
    </div>
  </header>`;
}
