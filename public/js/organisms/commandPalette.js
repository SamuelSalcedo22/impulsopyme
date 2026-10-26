import { esc } from '../core/html.js';
import { icon } from '../atoms/icon.js';
import { api } from '../core/api.js';
import { navigate } from '../core/router.js';
import { t } from '../core/i18n.js';
import { money } from '../core/format.js';
import { ALL_ITEMS } from './nav.js';

/**
 * Organismo: búsqueda global (Ctrl+K). Es el sistema de "búsqueda" de la arquitectura de información:
 * encuentra productos, clientes, proveedores y ventas, y también salta a cualquier sección.
 */
let open = false;

function buildSections(data, query) {
  const q = query.toLowerCase();
  const pages = ALL_ITEMS.filter((i) => t(i.label).toLowerCase().includes(q)).map((i) => ({ icon: i.icon, label: t(i.label), sub: t('search.go_to'), path: i.path }));
  return [
    { title: t('search.sections'), items: pages },
    { title: t('nav.inventory'), items: (data?.products || []).map((p) => ({ icon: 'inventory', label: p.name, sub: `${money(p.price)} · ${p.stock} ${p.unit}`, path: `/inventory?q=${encodeURIComponent(p.name)}` })) },
    { title: t('nav.customers'), items: (data?.customers || []).map((c) => ({ icon: 'user', label: c.name, sub: c.phone || '', path: `/customers?id=${c.id}` })) },
    { title: t('nav.suppliers'), items: (data?.suppliers || []).map((s) => ({ icon: 'suppliers', label: s.name, sub: s.contact || '', path: `/suppliers?id=${s.id}` })) },
    { title: t('nav.sales'), items: (data?.sales || []).map((s) => ({ icon: 'sales', label: `${t('sales.sale')} #${s.id}`, sub: money(s.total), path: `/sales?tab=history&sale=${s.id}` })) }
  ].filter((s) => s.items.length);
}

export function openCommandPalette() {
  if (open) return;
  open = true;
  const previous = document.activeElement;
  const root = document.createElement('div');
  root.className = 'fixed inset-0 z-[75] flex items-start justify-center p-4 pt-[12vh]';
  root.innerHTML = `
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" data-close></div>
    <section class="modal-in glass-card relative w-full max-w-xl !rounded-[28px] bg-[var(--g-color-anthracite-800)]/95 !p-0" role="dialog" aria-modal="true" aria-label="${esc(t('search.open'))}">
      <label class="flex items-center gap-3 border-b border-glass-border px-5">
        <span class="text-ink-muted">${icon('search', { size: 20 })}</span>
        <input data-q class="h-14 w-full bg-transparent text-base outline-none placeholder:text-ink-muted" placeholder="${esc(t('search.placeholder'))}" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="palette-list" />
      </label>
      <div id="palette-list" role="listbox" data-list class="max-h-[50vh] overflow-y-auto p-2"></div>
      <p class="border-t border-glass-border px-5 py-3 text-xs text-ink-muted">${esc(t('search.hint'))}</p>
    </section>`;
  document.body.appendChild(root);
  const input = root.querySelector('[data-q]');
  const list = root.querySelector('[data-list]');
  let flat = []; let index = 0; let timer; let token = 0;

  const paint = (data, query) => {
    const sections = buildSections(data, query);
    flat = sections.flatMap((s) => s.items);
    if (!flat.length) { list.innerHTML = `<p class="px-4 py-8 text-center text-sm text-ink-2">${esc(query.length < 2 ? t('search.type_more') : t('search.no_results', { q: query }))}</p>`; return; }
    let n = 0;
    list.innerHTML = sections.map((s) => `<p class="px-3 pb-1 pt-3 text-xs font-semibold text-ink-muted">${esc(s.title)}</p>` + s.items.map((item) => {
      const i = n; n += 1;
      return `<button type="button" role="option" data-i="${i}" aria-selected="${i === index}" class="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left ${i === index ? 'bg-glass-strong' : 'hover:bg-glass'}"><span class="text-ink-2">${icon(item.icon, { size: 18 })}</span><span class="min-w-0 flex-1"><span class="block break-words font-semibold">${esc(item.label)}</span><span class="block break-words text-xs text-ink-muted">${esc(item.sub)}</span></span></button>`;
    }).join('')).join('');
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  };

  const close = () => { root.remove(); open = false; document.removeEventListener('keydown', onKey, true); previous?.focus?.(); };
  const go = (item) => { close(); navigate(item.path); };
  const onKey = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); index = Math.min(index + 1, flat.length - 1); paint(last, input.value); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); index = Math.max(index - 1, 0); paint(last, input.value); }
    else if (event.key === 'Enter' && flat[index]) { event.preventDefault(); go(flat[index]); }
  };
  let last = null;
  input.addEventListener('input', () => {
    index = 0; clearTimeout(timer);
    const query = input.value.trim();
    paint(last, query);
    if (query.length < 2) { last = null; return; }
    timer = setTimeout(async () => {
      const mine = ++token;
      try { const data = await api.get(`/search?q=${encodeURIComponent(query)}`); if (mine === token) { last = data; paint(data, query); } } catch { /* la búsqueda en páginas sigue funcionando */ }
    }, 160);
  });
  list.addEventListener('click', (event) => { const b = event.target.closest('[data-i]'); if (b) go(flat[Number(b.dataset.i)]); });
  root.querySelector('[data-close]').addEventListener('click', close);
  document.addEventListener('keydown', onKey, true);
  paint(null, '');
  input.focus();
}
