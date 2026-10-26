import { html } from '../core/html.js';
import { api } from '../core/api.js';
import { t, tn } from '../core/i18n.js';
import { money, number, dateTime } from '../core/format.js';
import { pageHeader } from '../templates/pageTemplate.js';
import { tabs } from '../molecules/tabs.js';
import { searchBox } from '../molecules/searchBox.js';
import { segmented } from '../molecules/segmented.js';
import { emptyState } from '../molecules/emptyState.js';
import { errorSummary } from '../molecules/errorMessage.js';
import { select } from '../atoms/field.js';
import { button, iconButton } from '../atoms/button.js';
import { chip } from '../atoms/chip.js';
import { icon } from '../atoms/icon.js';
import { openModal, confirmDialog } from '../organisms/modal.js';
import { toast } from '../organisms/toast.js';
import { navigate } from '../core/router.js';

const METHODS = ['cash', 'transfer', 'card', 'credit'];
const METHOD_ICON = { cash: 'cash', transfer: 'mobile', card: 'card', credit: 'clock' };

/* El carrito vive fuera de la vista para que no se pierda al cambiar de pestaña. */
const cart = { lines: [], method: 'cash', customerId: '' };

const total = () => cart.lines.reduce((s, l) => s + l.product.price * l.quantity, 0);

function productGrid(products, q) {
  const needle = q.trim().toLowerCase();
  const list = products.filter((p) => !needle || p.name.toLowerCase().includes(needle) || (p.sku || '').toLowerCase().includes(needle));
  if (!list.length) return emptyState({ iconName: 'search', title: t('sales.no_match_title'), text: t('sales.no_match_text') });
  return html`<div class="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">${list.map((p) => {
    const out = p.trackStock && p.stock <= 0;
    return html`<button type="button" data-action="add" data-id="${p.id}" ${out ? html`disabled` : ''} class="group flex min-h-[104px] flex-col justify-between gap-3 rounded-[22px] border border-glass-border bg-glass p-4 text-left transition-all duration-fast hover:-translate-y-0.5 hover:bg-glass-strong disabled:cursor-not-allowed disabled:opacity-45">
      <span class="break-words font-semibold leading-snug">${p.name}</span>
      <span class="flex items-end justify-between gap-2"><b class="tabular-nums text-ember">${money(p.price)}</b><span class="text-xs ${p.trackStock && p.stock <= p.minStock ? 'text-warning' : 'text-ink-muted'}">${out ? t('sales.out_of_stock') : p.trackStock ? `${number(p.stock, 1)} ${p.unit}` : ''}</span></span>
    </button>`;
  })}</div>`;
}

function cartPanel(customers) {
  return html`<div class="flex h-full flex-col">
    <div class="mb-4 flex items-center justify-between gap-3"><h2 class="font-display text-lg font-bold">${t('sales.cart')}</h2>${cart.lines.length ? html`<button type="button" data-action="clear" class="text-sm font-semibold text-ink-muted hover:text-ink">${t('sales.clear')}</button>` : ''}</div>
    ${cart.lines.length ? html`<ul class="flex flex-col gap-2.5">${cart.lines.map((l, i) => html`<li class="rounded-control bg-glass p-3">
      <div class="flex items-start justify-between gap-3"><p class="min-w-0 break-words text-sm font-semibold">${l.product.name}</p>${iconButton({ iconName: 'x', label: t('sales.remove'), action: 'remove', data: { i }, size: 'sm', className: '!min-h-[28px] !min-w-[28px]' })}</div>
      <div class="mt-2 flex items-center justify-between gap-3">
        <div class="inline-flex items-center gap-1">${iconButton({ iconName: 'minus', label: t('sales.less'), action: 'dec', data: { i }, size: 'sm' })}<input type="number" min="0" step="any" inputmode="decimal" value="${l.quantity}" data-qty="${i}" aria-label="${t('fields.quantity')}" class="field !min-h-[36px] w-16 !px-2 text-center tabular-nums" />${iconButton({ iconName: 'plus', label: t('sales.more'), action: 'inc', data: { i }, size: 'sm' })}</div>
        <b class="tabular-nums">${money(l.product.price * l.quantity)}</b>
      </div></li>`)}</ul>`
      : html`<div class="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center text-ink-2"><span class="text-ink-muted">${icon('cart', { size: 30 })}</span><p class="text-sm">${t('sales.cart_empty')}</p></div>`}
    <div class="mt-auto flex flex-col gap-4 pt-5">
      <div><p class="mb-2 text-sm font-semibold text-ink-2">${t('fields.paymentMethod')}</p>
        <div class="grid grid-cols-2 gap-2">${METHODS.map((m) => html`<button type="button" data-action="method" data-value="${m}" aria-pressed="${cart.method === m}" class="flex min-h-[44px] items-center gap-2 rounded-control border px-3 text-sm font-semibold ${cart.method === m ? 'border-ember bg-[color-mix(in_srgb,var(--s-color-action-primary)_16%,transparent)]' : 'border-glass-border bg-glass text-ink-2 hover:bg-glass-strong'}">${icon(METHOD_ICON[m], { size: 18 })}<span class="break-words text-left">${t(`payment.${m}`)}</span></button>`)}</div></div>
      <label class="flex flex-col gap-2 text-sm font-semibold text-ink-2">${t('sales.customer_optional')}${select({ name: 'customerId', value: cart.customerId, options: [{ value: '', label: t('sales.walk_in') }, ...customers.map((c) => ({ value: c.id, label: c.name }))] })}</label>
      <div class="flex items-end justify-between gap-3 border-t border-glass-border pt-4"><span class="text-ink-2">${t('sales.total')}</span><b class="stat-number text-3xl">${money(total())}</b></div>
      <div data-sale-error class="empty:hidden text-sm text-negative" role="alert"></div>
      ${button({ label: cart.lines.length ? t('sales.charge', { total: money(total()) }) : t('sales.charge_empty'), action: 'charge', disabled: !cart.lines.length, className: 'w-full' })}
    </div></div>`;
}

function historyRows(items) {
  if (!items.length) return emptyState({ iconName: 'sales', title: t('sales.history_none_title'), text: t('sales.history_none_text') });
  return html`<div class="table-head hidden grid-cols-[.6fr_1.2fr_1.4fr_1fr_1fr] md:grid"><span>#</span><span>${t('fields.date')}</span><span>${t('fields.customer')}</span><span>${t('fields.paymentMethod')}</span><span class="text-right">${t('sales.total')}</span></div>
  <div class="flex flex-col gap-2">${items.map((s) => html`<button type="button" data-action="detail" data-id="${s.id}" class="table-row grid-cols-2 text-left md:grid-cols-[.6fr_1.2fr_1.4fr_1fr_1fr]">
    <span class="font-semibold tabular-nums">#${s.id}</span><span class="text-sm text-ink-2">${dateTime(s.soldAt)}</span>
    <span class="col-span-2 break-words md:col-span-1">${s.customerName || t('sales.walk_in')}</span>
    <span>${chip(t(`payment.${s.paymentMethod}`), { iconName: METHOD_ICON[s.paymentMethod] })}</span><b class="text-right tabular-nums">${money(s.total)}</b>
  </button>`)}</div>`;
}

export default {
  titleKey: 'nav.sales',
  crumbs: (loc) => [{ label: t('nav.sales'), path: loc.query.tab === 'history' ? '/sales' : undefined }, ...(loc.query.tab === 'history' ? [{ label: t('sales.tab_history') }] : [])],
  async load(loc) {
    const tab = loc.query.tab === 'history' ? 'history' : 'new';
    if (tab === 'history') {
      const method = loc.query.method || '';
      const sales = await api.get(`/sales?limit=100${method ? `&method=${method}` : ''}`);
      return { tab, sales, method };
    }
    const [products, customers] = await Promise.all([api.get('/products?limit=500'), api.get('/customers')]);
    return { tab, products: products.items, customers: customers.items };
  },
  view(data, loc) {
    const header = pageHeader({ title: t('sales.title'), subtitle: t(data.tab === 'new' ? 'sales.subtitle_new' : 'sales.subtitle_history'), actions: tabs({ items: [{ key: 'new', label: t('sales.tab_new') }, { key: 'history', label: t('sales.tab_history') }], active: data.tab, path: '/sales' }) });
    if (data.tab === 'history') {
      return html`${header}<section class="glass-card">
        <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
          ${segmented({ label: t('fields.paymentMethod'), action: 'filter-method', value: data.method, options: [{ value: '', label: t('sales.all_methods') }, ...METHODS.map((m) => ({ value: m, label: t(`payment.${m}`) }))] })}
          <p class="text-sm text-ink-2">${tn('sales.history_summary', data.sales.total, { amount: money(data.sales.amount) })}</p>
        </div>
        ${historyRows(data.sales.items)}</section>`;
    }
    return html`${header}<div class="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
      <section class="glass-card" aria-label="${t('sales.products')}"><div class="mb-5">${searchBox({ placeholder: t('sales.search') })}</div><div data-grid>${productGrid(data.products, '')}</div></section>
      <aside class="glass-card xl:sticky xl:top-4 xl:self-start" data-cart>${cartPanel(data.customers)}</aside>
    </div>`;
  },
  mount(el, data, loc, ctx) {
    if (data.tab === 'history') {
      el.addEventListener('click', async (event) => {
        const target = event.target.closest('[data-action]');
        if (!target) return;
        if (target.dataset.action === 'filter-method') navigate(`/sales?tab=history${target.dataset.value ? `&method=${target.dataset.value}` : ''}`);
        if (target.dataset.action === 'detail') openDetail(target.dataset.id, ctx);
      });
      if (loc.query.sale) openDetail(loc.query.sale, ctx);
      return;
    }

    const cartEl = el.querySelector('[data-cart]');
    const draw = () => { cartEl.innerHTML = cartPanel(data.customers).text; };
    const find = (id) => data.products.find((p) => p.id === Number(id));
    const cap = (line) => (line.product.trackStock ? Math.min(line.quantity, line.product.stock) : line.quantity);

    el.querySelector('[data-search]').addEventListener('input', (e) => { el.querySelector('[data-grid]').innerHTML = productGrid(data.products, e.target.value).text; });

    el.addEventListener('change', (event) => {
      if (event.target.name === 'customerId') cart.customerId = event.target.value;
      if (event.target.dataset.qty !== undefined) {
        const line = cart.lines[Number(event.target.dataset.qty)];
        const value = Number(event.target.value);
        line.quantity = Number.isFinite(value) && value > 0 ? value : 1;
        line.quantity = cap(line);
        draw();
      }
    });

    el.addEventListener('click', async (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) return;
      const { action, id, i, value } = target.dataset;
      if (action === 'add') {
        const product = find(id);
        const existing = cart.lines.find((l) => l.product.id === product.id);
        if (existing) existing.quantity = cap({ product, quantity: existing.quantity + 1 }); else cart.lines.push({ product, quantity: 1 });
        draw();
      } else if (action === 'inc' || action === 'dec') {
        const line = cart.lines[Number(i)];
        line.quantity = action === 'inc' ? cap({ product: line.product, quantity: line.quantity + 1 }) : Math.max(1, line.quantity - 1);
        draw();
      } else if (action === 'remove') { cart.lines.splice(Number(i), 1); draw(); }
      else if (action === 'clear') { cart.lines = []; draw(); }
      else if (action === 'method') { cart.method = value; draw(); }
      else if (action === 'charge') {
        target.disabled = true;
        try {
          const sale = await api.post('/sales', { items: cart.lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })), paymentMethod: cart.method, customerId: cart.customerId || null });
          toast(t('sales.registered', { total: money(sale.total) }));
          cart.lines = []; cart.customerId = '';
          ctx.reload();
        } catch (error) {
          target.disabled = false;
          cartEl.querySelector('[data-sale-error]').textContent = errorSummary(error);
        }
      }
    });
  }
};

async function openDetail(id, ctx) {
  try {
    const sale = await api.get(`/sales/${id}`);
    const modal = openModal({
      title: t('sales.detail_title', { id: sale.id }),
      size: 'md',
      body: html`<p class="mb-4 text-sm text-ink-2">${dateTime(sale.soldAt)} · ${sale.customerName || t('sales.walk_in')} · ${t(`payment.${sale.paymentMethod}`)}</p>
        <ul class="flex flex-col gap-2">${sale.items.map((l) => html`<li class="flex items-center justify-between gap-3 rounded-control bg-glass px-4 py-2.5 text-sm"><span class="min-w-0 break-words"><b>${number(l.quantity, 2)}</b> ${l.unit} · ${l.name}</span><b class="shrink-0 tabular-nums">${money(l.quantity * l.unitPrice)}</b></li>`)}</ul>
        <div class="mt-5 flex items-end justify-between gap-3 border-t border-glass-border pt-4"><span class="text-ink-2">${t('sales.total')}</span><b class="stat-number text-3xl">${money(sale.total)}</b></div>
        <div class="mt-6 flex flex-wrap justify-end gap-3">${button({ label: t('sales.void'), variant: 'ghost', action: 'void-sale', iconName: 'trash' })}${button({ label: t('common.close'), action: 'close' })}</div>`.text
    });
    modal.root.querySelector('[data-action="void-sale"]').addEventListener('click', async () => {
      if (!await confirmDialog({ title: t('sales.void_title', { id: sale.id }), text: t('sales.void_text', { total: money(sale.total) }), confirmLabel: t('sales.void_action') })) return;
      try { await api.delete(`/sales/${sale.id}`); modal.close(); toast(t('sales.voided')); ctx.reload(); } catch (error) { toast(errorSummary(error), { tone: 'error' }); }
    });
  } catch (error) { toast(errorSummary(error), { tone: 'error' }); }
}
