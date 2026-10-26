import { html } from '../core/html.js';
import { sidebar } from '../organisms/sidebar.js';
import { topbar } from '../organisms/topbar.js';
import { bottomNav } from '../organisms/bottomNav.js';

/**
 * Plantilla: estructura de toda pantalla autenticada.
 * Barra lateral (navegación global) + barra superior (migas, búsqueda, cuenta) + contenido de la página.
 */
export function appShell({ activeBase, crumbs, content }) {
  return html`<a href="#view" class="sr-only-live focus:not-sr-only">Skip</a>
  <div class="flex min-h-screen items-start gap-4 p-3 md:p-4">
    ${sidebar({ activeBase })}
    <div class="flex min-w-0 flex-1 flex-col gap-6 px-1 pb-28 pt-1 md:pb-8 md:pr-2">
      ${topbar({ crumbs })}
      <main id="view" tabindex="-1" class="min-w-0 flex-1 outline-none">${content}</main>
    </div>
    ${bottomNav({ activeBase })}
  </div>`;
}
