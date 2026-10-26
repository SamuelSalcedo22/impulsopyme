import { html } from '../core/html.js';
import { api } from '../core/api.js';
import { t, tn } from '../core/i18n.js';
import { money, number, dateShort, dateTime } from '../core/format.js';
import { pageHeader } from '../templates/pageTemplate.js';
import { searchBox } from '../molecules/searchBox.js';
import { formField } from '../molecules/formField.js';
import { emptyState } from '../molecules/emptyState.js';
import { errorSummary } from '../molecules/errorMessage.js';
import { input, textarea } from '../atoms/field.js';
import { button, iconButton } from '../atoms/button.js';
import { avatar } from '../atoms/avatar.js';
import { openModal, confirmDialog } from '../organisms/modal.js';
import { toast } from '../organisms/toast.js';
import { handleSubmit, formErrorSlot } from './shared.js';

function rows(items) {
  if (!items.length) return emptyState({ iconName: 'customers', title: t('customers.none_title'), text: t('customers.none_text'), actionLabel: t('customers.add'), action: 'new' });
  return html`<div class="table-head hidden grid-cols-[2fr_1fr_1fr_1fr_auto] lg:grid"><span>${t('fields.name')}</span><span>${t('customers.purchases')}</span><span>${t('customers.spent')}</span><span>${t('customers.last')}</span><span class="w-[132px]"></span></div>
  <div class="flex flex-col gap-2">${items.map((c) => html`<article class="table-row grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
    <button type="button" data-action="detail" data-id="${c.id}" class="flex min-w-0 items-center gap-3 text-left">${avatar(c.name, { size: 38 })}<span class="min-w-0"><span class="block break-words font-semibold">${c.name}</span><span class="block break-words text-xs text-ink-muted">${c.phone || c.email || t('customers.no_contact')}</span></span></button>
    <div class="tabular-nums text-ink-2"><span class="text-xs text-ink-muted lg:hidden">${t('customers.purchases')}: </span>${number(c.purchases)}</div>
    <div class="font-semibold tabular-nums"><span class="text-xs font-normal text-ink-muted lg:hidden">${t('customers.spent')}: </span>${money(c.totalSpent)}</div>
    <div class="text-sm text-ink-2"><span class="text-xs text-ink-muted lg:hidden">${t('customers.last')}: </span>${c.lastPurchase ? dateShort(c.lastPurchase) : '—'}</div>
    <div class="flex justify-end gap-1">${iconButton({ iconName: 'pencil', label: t('common.edit'), action: 'edit', data: { id: c.id }, size: 'sm' })}${iconButton({ iconName: 'trash', label: t('common.delete'), action: 'delete', data: { id: c.id }, size: 'sm' })}</div>
  </article>`)}</div>`;
}

export default {
  titleKey: 'nav.customers',
  crumbs: () => [{ label: t('nav.customers') }],
  async load() { return (await api.get('/customers')).items; },
  view(items, loc) {
    return html`${pageHeader({ title: t('customers.title'), subtitle: t('customers.subtitle'), actions: button({ label: t('customers.add'), iconName: 'plus', action: 'new' }) })}
    <section class="glass-card">
      <div class="mb-5">${searchBox({ placeholder: t('customers.search'), className: 'max-w-md' })}</div>
      <div data-list>${rows(items)}</div>
    </section>`;
  },
  mount(el, items, loc, ctx) {
    const byId = (id) => items.find((c) => c.id === Number(id));
    el.querySelector('[data-search]').addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      el.querySelector('[data-list]').innerHTML = rows(items.filter((c) => !q || c.name.toLowerCase().includes(q) || (c.phone || '').includes(q))).text;
    });

    const form = (c) => {
      const editing = Boolean(c);
      const v = c || { name: '', phone: '', email: '', notes: '' };
      const modal = openModal({
        title: editing ? t('customers.edit_title') : t('customers.new_title'),
        size: 'sm',
        body: html`<form novalidate class="flex flex-col gap-1">
          ${formField({ label: t('fields.name'), name: 'name', required: true, control: input({ name: 'name', value: v.name }) })}
          ${formField({ label: t('fields.phone'), name: 'phone', control: input({ name: 'phone', type: 'tel', value: v.phone || '', autocomplete: 'tel' }) })}
          ${formField({ label: t('fields.email'), name: 'email', control: input({ name: 'email', type: 'email', value: v.email || '' }) })}
          ${formField({ label: t('fields.notes'), name: 'notes', control: textarea({ name: 'notes', value: v.notes || '' }) })}
          ${formErrorSlot()}
          <div class="mt-2 flex flex-wrap justify-end gap-3">${button({ label: t('common.cancel'), variant: 'ghost', action: 'close' })}${button({ label: t('common.save'), type: 'submit' })}</div>
        </form>`.text
      });
      handleSubmit(modal.root.querySelector('form'), async (values) => {
        if (editing) await api.put(`/customers/${c.id}`, values); else await api.post('/customers', values);
        modal.close();
        toast(editing ? t('customers.saved') : t('customers.created'));
        ctx.reload();
      });
    };

    const detail = async (id) => {
      try {
        const c = await api.get(`/customers/${id}`);
        openModal({
          title: c.name,
          size: 'md',
          body: html`<div class="grid gap-5 sm:grid-cols-2">
            <section><h3 class="mb-3 font-body text-sm font-bold text-ink-2">${t('customers.favorites')}</h3>
              ${c.favorites.length ? html`<ul class="flex flex-col gap-2">${c.favorites.map((f) => html`<li class="flex justify-between gap-3 rounded-control bg-glass px-4 py-2.5 text-sm"><span class="break-words">${f.name}</span><b class="tabular-nums">${number(f.units, 1)}</b></li>`)}</ul>` : html`<p class="text-sm text-ink-2">${t('customers.no_history')}</p>`}</section>
            <section><h3 class="mb-3 font-body text-sm font-bold text-ink-2">${t('customers.recent')}</h3>
              ${c.recent.length ? html`<ul class="flex flex-col gap-2">${c.recent.map((s) => html`<li class="flex justify-between gap-3 rounded-control bg-glass px-4 py-2.5 text-sm"><span class="text-ink-2">${dateTime(s.soldAt)}</span><b class="tabular-nums">${money(s.total)}</b></li>`)}</ul>` : html`<p class="text-sm text-ink-2">${t('customers.no_history')}</p>`}</section>
          </div>
          ${c.notes ? html`<p class="mt-5 rounded-control bg-glass p-4 text-sm text-ink-2">${c.notes}</p>` : ''}`.text
        });
      } catch (error) { toast(errorSummary(error), { tone: 'error' }); }
    };

    el.addEventListener('click', async (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) return;
      const { action, id } = target.dataset;
      if (action === 'new') form(null);
      else if (action === 'edit') form(byId(id));
      else if (action === 'detail') detail(id);
      else if (action === 'delete') {
        const c = byId(id);
        if (await confirmDialog({ title: t('customers.delete_title'), text: t('customers.delete_text', { name: c.name }), confirmLabel: t('customers.delete_action') })) {
          try { await api.delete(`/customers/${c.id}`); toast(t('customers.deleted')); ctx.reload(); } catch (error) { toast(errorSummary(error), { tone: 'error' }); }
        }
      }
    });
  }
};
