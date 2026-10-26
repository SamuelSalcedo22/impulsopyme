import { html, esc } from '../core/html.js';
import { api } from '../core/api.js';
import { t, tn } from '../core/i18n.js';
import { money, number, percent } from '../core/format.js';
import { pageHeader } from '../templates/pageTemplate.js';
import { searchBox } from '../molecules/searchBox.js';
import { formField } from '../molecules/formField.js';
import { emptyState } from '../molecules/emptyState.js';
import { segmented } from '../molecules/segmented.js';
import { input, select } from '../atoms/field.js';
import { button, iconButton } from '../atoms/button.js';
import { chip } from '../atoms/chip.js';
import { openModal, confirmDialog } from '../organisms/modal.js';
import { toast } from '../organisms/toast.js';
import { errorSummary } from '../molecules/errorMessage.js';
import { navigate } from '../core/router.js';
import { handleSubmit, formErrorSlot } from './shared.js';

const UNITS = ['und', 'kg', 'g', 'lb', 'l', 'ml', 'caja', 'paquete', 'porción', 'm'];

function statusOf(p) {
  if (!p.trackStock) return 'untracked';
  if (p.stock <= 0) return 'out';
  if (p.stock <= p.minStock) return 'low';
  return 'ok';
}

const STATUS_TONE = { out: 'negative', low: 'warning', ok: 'positive', untracked: '' };

function filterProducts(items, f) {
  const q = f.q.trim().toLowerCase();
  const list = items.filter((p) => (!q || p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
    && (!f.category || String(p.categoryId) === f.category)
    && (!f.status || (f.status === 'attention' ? ['low', 'out'].includes(statusOf(p)) : statusOf(p) === f.status)));
  const sorters = {
    name: (a, b) => a.name.localeCompare(b.name),
    stock: (a, b) => a.stock - b.stock,
    price: (a, b) => b.price - a.price,
    margin: (a, b) => (b.price - b.cost) / (b.price || 1) - (a.price - a.cost) / (a.price || 1)
  };
  return list.sort(sorters[f.sort] || sorters.name);
}

function rows(items) {
  if (!items.length) return emptyState({ iconName: 'inventory', title: t('inventory.none_title'), text: t('inventory.none_text'), actionLabel: t('inventory.add'), action: 'new-product' });
  return html`<div class="table-head hidden grid-cols-[2.2fr_1fr_1fr_1fr_auto] lg:grid"><span>${t('fields.product')}</span><span>${t('fields.stock')}</span><span>${t('fields.price')}</span><span>${t('inventory.margin')}</span><span class="w-[132px]"></span></div>
  <div class="flex flex-col gap-2">${items.map((p) => {
    const status = statusOf(p);
    const margin = p.price > 0 ? (p.price - p.cost) / p.price : 0;
    return html`<article class="table-row grid-cols-1 lg:grid-cols-[2.2fr_1fr_1fr_1fr_auto]">
      <div class="min-w-0"><p class="break-words font-semibold">${p.name}</p><p class="break-words text-xs text-ink-muted">${[p.categoryName, p.supplierName].filter(Boolean).join(' · ') || t('inventory.no_category')}</p></div>
      <div class="flex flex-wrap items-center gap-2"><b class="tabular-nums">${p.trackStock ? number(p.stock, 2) : '—'}</b><span class="text-xs text-ink-muted">${p.trackStock ? p.unit : t('inventory.not_tracked')}</span>${status !== 'ok' && status !== 'untracked' ? chip(t(`inventory.status_${status}`), { tone: STATUS_TONE[status] }) : ''}</div>
      <div class="tabular-nums"><span class="lg:hidden text-xs text-ink-muted">${t('fields.price')}: </span>${money(p.price)}</div>
      <div class="tabular-nums text-ink-2"><span class="lg:hidden text-xs text-ink-muted">${t('inventory.margin')}: </span>${percent(margin)}</div>
      <div class="flex items-center justify-end gap-1">
        ${p.trackStock ? iconButton({ iconName: 'plus', label: t('inventory.adjust_stock'), action: 'adjust', data: { id: p.id }, size: 'sm' }) : ''}
        ${iconButton({ iconName: 'pencil', label: t('common.edit'), action: 'edit-product', data: { id: p.id }, size: 'sm' })}
        ${iconButton({ iconName: 'trash', label: t('common.delete'), action: 'delete-product', data: { id: p.id }, size: 'sm' })}
      </div>
    </article>`;
  })}</div>`;
}

export default {
  titleKey: 'nav.inventory',
  crumbs: () => [{ label: t('nav.inventory') }],
  async load() {
    const [products, categories, suppliers] = await Promise.all([api.get('/products?limit=500'), api.get('/categories'), api.get('/suppliers')]);
    return { products: products.items, categories: categories.items, suppliers: suppliers.items };
  },
  view(data, loc) {
    const f = { q: loc.query.q || '', category: loc.query.category || '', status: loc.query.status || '', sort: loc.query.sort || 'name' };
    const counts = { all: data.products.length, attention: data.products.filter((p) => ['low', 'out'].includes(statusOf(p))).length };
    return html`
      ${pageHeader({
        title: t('inventory.title'),
        subtitle: t('inventory.subtitle', { n: counts.all }),
        actions: html`${button({ label: t('inventory.categories'), variant: 'ghost', iconName: 'box', action: 'categories' })}${button({ label: t('inventory.add'), iconName: 'plus', action: 'new-product' })}`
      })}
      <section class="glass-card">
        <div class="mb-5 flex flex-wrap items-center gap-3">
          ${searchBox({ placeholder: t('inventory.search'), value: f.q, className: 'min-w-[14rem] flex-1' })}
          ${select({ name: 'category', ariaLabel: t('fields.category'), className: '!w-auto', value: f.category, options: [{ value: '', label: t('inventory.all_categories') }, ...data.categories.map((c) => ({ value: c.id, label: c.name }))] })}
          ${select({ name: 'sort', ariaLabel: t('inventory.sort'), className: '!w-auto', value: f.sort, options: ['name', 'stock', 'price', 'margin'].map((k) => ({ value: k, label: t(`inventory.sort_${k}`) })) })}
        </div>
        <div class="mb-5">${segmented({ label: t('inventory.filter'), action: 'set-status', value: f.status, options: [{ value: '', label: t('inventory.filter_all') }, { value: 'attention', label: `${t('inventory.filter_attention')} (${counts.attention})` }, { value: 'ok', label: t('inventory.filter_ok') }] })}</div>
        <div data-list>${rows(filterProducts(data.products, f))}</div>
      </section>`;
  },
  mount(el, data, loc, ctx) {
    const f = { q: loc.query.q || '', category: loc.query.category || '', status: loc.query.status || '', sort: loc.query.sort || 'name' };
    const byId = (id) => data.products.find((p) => p.id === Number(id));
    const repaint = () => { el.querySelector('[data-list]').innerHTML = rows(filterProducts(data.products, f)).text; };

    let timer;
    el.querySelector('[data-search]').addEventListener('input', (e) => { clearTimeout(timer); timer = setTimeout(() => { f.q = e.target.value; repaint(); }, 120); });
    el.querySelector('[name="category"]').addEventListener('change', (e) => { f.category = e.target.value; repaint(); });
    el.querySelector('[name="sort"]').addEventListener('change', (e) => { f.sort = e.target.value; repaint(); });

    const productForm = (product) => {
      const editing = Boolean(product);
      const p = product || { name: '', sku: '', unit: 'und', price: '', cost: '', stock: 0, minStock: 0, trackStock: 1, categoryId: '', supplierId: '' };
      const modal = openModal({
        title: editing ? t('inventory.edit_title') : t('inventory.new_title'),
        size: 'md',
        body: html`<form novalidate class="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          <div class="sm:col-span-2">${formField({ label: t('fields.name'), name: 'name', required: true, control: input({ name: 'name', value: p.name }) })}</div>
          ${formField({ label: t('fields.price'), name: 'price', required: true, control: input({ name: 'price', type: 'number', min: 0, step: 'any', inputmode: 'decimal', value: p.price }) })}
          ${formField({ label: t('fields.cost'), name: 'cost', required: true, hint: t('inventory.cost_hint'), control: input({ name: 'cost', type: 'number', min: 0, step: 'any', inputmode: 'decimal', value: p.cost }) })}
          ${formField({ label: t('fields.category'), name: 'categoryId', control: select({ name: 'categoryId', value: p.categoryId ?? '', options: [{ value: '', label: t('inventory.no_category') }, ...data.categories.map((c) => ({ value: c.id, label: c.name }))] }) })}
          ${formField({ label: t('fields.supplier'), name: 'supplierId', control: select({ name: 'supplierId', value: p.supplierId ?? '', options: [{ value: '', label: t('inventory.no_supplier') }, ...data.suppliers.map((s) => ({ value: s.id, label: s.name }))] }) })}
          ${formField({ label: t('fields.unit'), name: 'unit', control: select({ name: 'unit', value: p.unit, options: UNITS.map((u) => ({ value: u, label: u })) }) })}
          ${formField({ label: t('fields.sku'), name: 'sku', control: input({ name: 'sku', value: p.sku || '' }) })}
          ${editing ? '' : formField({ label: t('inventory.initial_stock'), name: 'stock', control: input({ name: 'stock', type: 'number', min: 0, step: 'any', inputmode: 'decimal', value: p.stock }) })}
          ${formField({ label: t('fields.minStock'), name: 'minStock', hint: t('inventory.min_hint'), control: input({ name: 'minStock', type: 'number', min: 0, step: 'any', inputmode: 'decimal', value: p.minStock }) })}
          <label class="flex items-center gap-3 text-sm sm:col-span-2"><input type="checkbox" name="trackStock" ${p.trackStock ? 'checked' : ''} class="h-4 w-4 accent-[var(--s-color-action-primary)]" /><span><b>${t('inventory.track')}</b> <span class="text-ink-2">${t('inventory.track_hint')}</span></span></label>
          <div class="sm:col-span-2">${formErrorSlot()}</div>
          <div class="mt-3 flex flex-wrap justify-end gap-3 sm:col-span-2">${button({ label: t('common.cancel'), variant: 'ghost', action: 'close' })}${button({ label: t('common.save'), type: 'submit' })}</div>
        </form>`.text
      });
      handleSubmit(modal.root.querySelector('form'), async (values) => {
        const payload = { ...values, stock: editing ? p.stock : values.stock || 0, categoryId: values.categoryId || null, supplierId: values.supplierId || null };
        if (editing) await api.put(`/products/${p.id}`, payload); else await api.post('/products', payload);
        modal.close();
        toast(editing ? t('inventory.saved') : t('inventory.created'));
        ctx.reload();
      });
    };

    const adjustForm = (p) => {
      const modal = openModal({
        title: t('inventory.adjust_title', { name: p.name }),
        size: 'sm',
        body: html`<form novalidate class="flex flex-col gap-1">
          <p class="mb-3 text-sm text-ink-2">${t('inventory.adjust_current', { stock: number(p.stock, 2), unit: p.unit })}</p>
          ${formField({ label: t('inventory.adjust_reason'), name: 'reason', control: select({ name: 'reason', options: ['restock', 'waste', 'adjustment'].map((k) => ({ value: k, label: t(`inventory.reason_${k}`) })) }) })}
          ${formField({ label: t('inventory.adjust_amount'), name: 'delta', required: true, hint: t('inventory.adjust_hint'), control: input({ name: 'delta', type: 'number', step: 'any', inputmode: 'decimal' }) })}
          ${formErrorSlot()}
          <div class="mt-3 flex flex-wrap justify-end gap-3">${button({ label: t('common.cancel'), variant: 'ghost', action: 'close' })}${button({ label: t('inventory.adjust_action'), type: 'submit' })}</div>
        </form>`.text
      });
      handleSubmit(modal.root.querySelector('form'), async (values) => {
        let delta = Number(values.delta);
        if (!Number.isFinite(delta) || values.delta === '') delta = NaN;
        if (values.reason === 'waste') delta = -Math.abs(delta);
        if (values.reason === 'restock') delta = Math.abs(delta);
        await api.post(`/products/${p.id}/stock`, { delta, reason: values.reason });
        modal.close();
        toast(t('inventory.stock_updated'));
        ctx.reload();
      });
    };

    const categoriesModal = () => {
      const draw = (items) => html`<ul class="mb-4 flex flex-col gap-2">${items.length ? items.map((c) => html`<li class="flex items-center justify-between gap-3 rounded-control bg-glass px-4 py-2.5"><span class="min-w-0 break-words font-semibold">${c.name} <span class="text-xs font-normal text-ink-muted">${tn('inventory.products_count', c.productCount)}</span></span>${iconButton({ iconName: 'trash', label: t('common.delete'), action: 'delete-category', data: { id: c.id }, size: 'sm' })}</li>`) : html`<li class="text-sm text-ink-2">${t('inventory.no_categories')}</li>`}</ul>`;
      const modal = openModal({
        title: t('inventory.categories'),
        size: 'sm',
        body: html`<div data-cats>${draw(data.categories)}</div>
          <form novalidate class="flex flex-col gap-1">${formField({ label: t('inventory.new_category'), name: 'name', control: input({ name: 'name' }) })}${formErrorSlot()}<div class="flex justify-end">${button({ label: t('common.add'), type: 'submit' })}</div></form>`.text,
        onClose: () => ctx.reload()
      });
      const refresh = async () => { data.categories = (await api.get('/categories')).items; modal.root.querySelector('[data-cats]').innerHTML = draw(data.categories).text; };
      handleSubmit(modal.root.querySelector('form'), async (values) => { await api.post('/categories', values); modal.root.querySelector('form').reset(); await refresh(); });
      modal.root.addEventListener('click', async (event) => {
        const del = event.target.closest('[data-action="delete-category"]');
        if (!del) return;
        try { await api.delete(`/categories/${del.dataset.id}`); await refresh(); } catch (error) { toast(errorSummary(error), { tone: 'error' }); }
      });
    };

    el.addEventListener('click', async (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'new-product') productForm(null);
      else if (action === 'edit-product') productForm(byId(target.dataset.id));
      else if (action === 'adjust') adjustForm(byId(target.dataset.id));
      else if (action === 'categories') categoriesModal();
      else if (action === 'set-status') { f.status = target.dataset.value; navigate(`/inventory?${new URLSearchParams(Object.entries(f).filter(([, v]) => v))}`); }
      else if (action === 'delete-product') {
        const p = byId(target.dataset.id);
        if (await confirmDialog({ title: t('inventory.delete_title'), text: t('inventory.delete_text', { name: p.name }), confirmLabel: t('inventory.delete_action') })) {
          try { await api.delete(`/products/${p.id}`); toast(t('inventory.deleted')); ctx.reload(); } catch (error) { toast(errorSummary(error), { tone: 'error' }); }
        }
      }
    });
  }
};
