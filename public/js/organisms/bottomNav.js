import { html, cx } from '../core/html.js';
import { icon } from '../atoms/icon.js';
import { ALL_ITEMS, MOBILE_PRIMARY } from './nav.js';
import { link } from '../core/router.js';
import { t } from '../core/i18n.js';

/**
 * Organismo: navegación inferior para pantallas pequeñas (patrón Bottom Nav del curso).
 * Las etiquetas pueden ocupar dos líneas; el resto de secciones se abre desde "Más".
 */
export function bottomNav({ activeBase }) {
  const primary = ALL_ITEMS.filter((i) => MOBILE_PRIMARY.includes(i.path));
  const moreActive = !MOBILE_PRIMARY.includes(activeBase);
  const tab = (active, content, attrs = '') => html`${content}`;
  return html`<nav class="fixed inset-x-3 bottom-3 z-40 flex items-stretch justify-between gap-1 rounded-[26px] border border-glass-border bg-[var(--g-color-anthracite-950)]/90 p-1.5 backdrop-blur-xl md:hidden" aria-label="${t('nav.main')}">
    ${primary.map((item) => html`<a href="${link(item.path)}" ${activeBase === item.path ? html`aria-current="page"` : ''}
      class="${cx('flex min-h-[54px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px] px-1 text-center text-[0.7rem] font-semibold leading-tight', activeBase === item.path ? 'bg-glass-strong text-ink' : 'text-ink-muted')}">
      ${icon(item.icon, { size: 22 })}<span class="max-w-full break-words">${t(item.label)}</span></a>`)}
    <button type="button" data-action="open-more" class="${cx('flex min-h-[54px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px] px-1 text-center text-[0.7rem] font-semibold leading-tight', moreActive ? 'bg-glass-strong text-ink' : 'text-ink-muted')}">
      ${icon('menu', { size: 22 })}<span>${t('nav.more')}</span></button>
  </nav>`;
}

export function moreMenu() {
  const rest = ALL_ITEMS.filter((i) => !MOBILE_PRIMARY.includes(i.path));
  return html`<ul class="flex flex-col gap-2">${rest.map((item) => html`<li><a href="${link(item.path)}" data-action="close" class="nav-item">${icon(item.icon, { size: 22 })}<span class="font-semibold">${t(item.label)}</span></a></li>`)}</ul>`;
}
