import { html, cx } from '../core/html.js';
import { icon } from '../atoms/icon.js';
import { link } from '../core/router.js';

/** Molécula: elemento del menú lateral (ícono + etiqueta). Colapsado muestra solo el ícono con título. */
export function navItem({ path, iconName, label, active, expanded, badge = 0 }) {
  return html`<a href="${link(path)}" class="${cx('nav-item', !expanded && 'justify-center !px-0')}" ${active ? html`aria-current="page"` : ''} title="${label}" aria-label="${expanded ? '' : label}">
    <span class="relative shrink-0">${icon(iconName, { size: 22 })}${badge ? html`<span class="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-ember ring-2 ring-[var(--s-color-surface-rail)]"></span>` : ''}</span>
    ${expanded ? html`<span class="min-w-0 break-words text-[0.95rem] font-semibold leading-tight">${label}</span>` : ''}
  </a>`;
}
