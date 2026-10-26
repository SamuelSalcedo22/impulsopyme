import { html } from '../core/html.js';
import { icon } from '../atoms/icon.js';
import { link } from '../core/router.js';
import { t } from '../core/i18n.js';

/**
 * Molécula: migas de pan (navegación contextual). Indica la profundidad y permite volver rápido.
 * crumbs: [{label, path?}]; el último es la página actual y no es un enlace.
 */
export function breadcrumb(crumbs = []) {
  const items = [{ label: t('app.name'), path: '/dashboard' }, ...crumbs];
  return html`<nav aria-label="${t('nav.breadcrumb')}">
    <ol class="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
      ${items.map((c, i) => {
        const last = i === items.length - 1;
        return html`<li class="flex items-center gap-1.5">
          ${i > 0 ? icon('chevron-right', { size: 14 }) : ''}
          ${last || !c.path ? html`<span ${last ? html`aria-current="page"` : ''} class="${last ? 'text-ink-2' : ''}">${c.label}</span>` : html`<a class="hover:text-ink" href="${link(c.path)}">${c.label}</a>`}
        </li>`;
      })}
    </ol>
  </nav>`;
}
