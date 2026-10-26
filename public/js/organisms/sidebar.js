import { html, cx } from '../core/html.js';
import { logo } from '../atoms/logo.js';
import { icon } from '../atoms/icon.js';
import { navItem } from '../molecules/navItem.js';
import { NAV_GROUPS, SETTINGS_ITEM } from './nav.js';
import { t } from '../core/i18n.js';
import { state } from '../core/state.js';

/**
 * Organismo: barra lateral colapsable (navegación global persistente).
 * Colapsada es un riel de íconos de 84 px; expandida muestra etiquetas que se ajustan a varias líneas,
 * así un idioma con textos más largos no rompe el diseño.
 */
export function sidebar({ activeBase }) {
  const expanded = state.prefs.sidebarExpanded;
  return html`<aside class="${cx('hidden shrink-0 flex-col rounded-[28px] bg-[var(--c-sidebar-bg)] p-3 shadow-[inset_0_0_0_1px_var(--s-color-surface-glass-border)] transition-[width] duration-base md:sticky md:top-4 md:flex md:h-[calc(100vh-2rem)]', expanded ? 'w-[248px]' : 'w-[84px]')}" aria-label="${t('nav.main')}">
    <a href="#/dashboard" class="${cx('mb-4 mt-2 flex items-center', expanded ? 'px-2' : 'justify-center')}" aria-label="${t('app.name')}">${logo({ size: 40, withName: expanded })}</a>
    <nav class="flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden">
      ${NAV_GROUPS.map((group, index) => html`<div class="${cx('flex flex-col gap-1.5', index > 0 && 'border-t border-glass-border pt-4')}">
        ${group.items.map((item) => navItem({ path: item.path, iconName: item.icon, label: t(item.label), active: activeBase === item.path, expanded, badge: item.path === '/ai' ? state.alertCount : 0 }))}
      </div>`)}
    </nav>
    <div class="mt-4 flex flex-col gap-1.5 border-t border-glass-border pt-4">
      ${navItem({ path: SETTINGS_ITEM.path, iconName: SETTINGS_ITEM.icon, label: t(SETTINGS_ITEM.label), active: activeBase === SETTINGS_ITEM.path, expanded })}
      <button type="button" data-action="toggle-sidebar" class="${cx('nav-item w-full', !expanded && 'justify-center !px-0')}" aria-expanded="${expanded}" title="${expanded ? t('nav.collapse') : t('nav.expand')}">
        ${icon(expanded ? 'chevrons-left' : 'chevrons-right', { size: 22 })}
        ${expanded ? html`<span class="text-[0.95rem] font-semibold">${t('nav.collapse')}</span>` : html`<span class="sr-only-live">${t('nav.expand')}</span>`}
      </button>
    </div>
  </aside>`;
}
