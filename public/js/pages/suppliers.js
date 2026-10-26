import { html } from '../core/html.js';
import { api } from '../core/api.js';
import { t, tn } from '../core/i18n.js';
import { money, number } from '../core/format.js';
import { pageHeader } from '../templates/pageTemplate.js';
import { searchBox } from '../molecules/searchBox.js';
import { formField } from '../molecules/formField.js';
import { emptyState } from '../molecules/emptyState.js';
import { errorSummary } from '../molecules/errorMessage.js';
import { input, textarea } from '../atoms/field.js';
import { button, iconButton } from '../atoms/button.js';
import { chip } from '../atoms/chip.js';
import { icon } from '../atoms/icon.js';
import { openModal, confirmDialog } from '../organisms/modal.js';
import { toast } from '../organisms/toast.js';
import { handleSubmit, formErrorSlot } from './shared.js';

function cards(items) {
  if (!items.length) return emptyState({ iconName: 'suppliers', title: t('suppliers.none_title'), text: t('suppliers.none_text'), actionLabel: t('suppliers.add'), action: 'new' });
  return html`<div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">${items.map((s) => html`<article class="glass-panel flex flex-col gap-4 !rounded-[24px] p-5">
    <div class="flex items-start justify-between gap-3">
      <button type="button" data-action="detail" data-id="${s.id}" class="min-w-0 text-left"><h3 class="break-words font-display text-lg font-bold">${s.name}</h3><p class="break-words text-sm text-ink-2">${s.contact || t('suppliers.no_contact')}</p></button>
      <div class="flex shrink-0 gap-1">${iconButton({ iconName: 'pencil', label: t('common.edit'), action: 'edit', data: { id: s.id }, size: 'sm' })}${iconButton({ iconName: 'trash', label: t('common.delete'), action: 'delete', data: { id: s.id }, size: 'sm' })}</div>
    </div>
    <div class="flex flex-wrap gap-2">${chip(tn('suppliers.products_count', s.productCount), { iconName: 'box' })}${chip(t('suppliers.lead_time', { n: s.leadTimeDays }), { iconName: 'clock' })}${s.lowStockCount ? chip(tn('suppliers.low_count', s.lowStockCount), { tone: 'warning', iconName: 'alert' }) : ''}</div>
    ${s.phone ? html`<a href="tel:${s.phone}" class="flex items-center gap-2 text-sm text-ink-2 hover:text-ink">${icon('phone', { size: 16 })}${s.phone}</a>` : ''}
  </article>`)}</div>`;
}

export default {
  titleKey: 'nav.suppliers',
  crumbs: () => [{ label: t('nav.suppliers') }],
  async load() { return (await api.get('/suppliers')).items; },
  view(items) {
    return html`${pageHeader({ title: t('suppliers.title'), subtitle: t('suppliers.subtitle'), actions: button({ label: t('suppliers.add'), iconName: 'plus', action: 'new' }) })}
    <section class="glass-card">
      <div class="mb-5">${searchBox({ placeholder: t('suppliers.search'), className: 'max-w-md' })}</div>
      <div data-list>${cards(items)}</div>
    </section>`;
  },
  mount(el, items, loc, ctx) {
    const byId = (id) => items.find((s) => s.id === Number(id));
    el.querySelector('[data-search]').addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      el.querySelector('[data-list]').innerHTML = cards(items.filter((s) => !q || s.name.toLowerCase().includes(q) || (s.contact || '').toLowerCase().includes(q))).text;
    });

    const form = (s) => {
      const editing = Boolean(s);
      const v = s || { name: '', contact: '', phone: '', email: '', leadTimeDays: 3, notes: '' };
      const modal = openModal({
        title: editing ? t('suppliers.edit_title') : t('suppliers.new_title'),
        size: 'md',
        body: html`<form novalidate class="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          <div class="sm:col-span-2">${formField({ label: t('fields.name'), name: 'name', required: true, control: input({ name: 'name', value: v.name }) })}</div>
          ${formField({ label: t('fields.contact'), name: 'contact', control: input({ name: 'contact', value: v.contact || '' }) })}
          ${formField({ label: t('fields.phone'), name: 'phone', control: input({ name: 'phone', type: 'tel', value: v.phone || '' }) })}
          ${formField({ label: t('fields.email'), name: 'email', control: input({ name: 'email', type: 'email', value: v.email || '' }) })}
          ${formField({ label: t('fields.leadTimeDays'), name: 'leadTimeDays', hint: t('suppliers.lead_hint'), control: input({ name: 'leadTimeDays', type: 'number', min: 0, max: 90, value: v.leadTimeDays }) })}
          <div class="sm:col-span-2">${formField({ label: t('fields.notes'), name: 'notes', control: textarea({ name: 'notes', value: v.notes || '' }) })}</div>
          <div class="sm:col-span-2">${formErrorSlot()}</div>
          <div class="mt-2 flex flex-wrap justify-end gap-3 sm:col-span-2">${button({ label: t('common.cancel'), variant: 'ghost', action: 'close' })}${button({ label: t('common.save'), type: 'submit' })}</div>
        </form>`.text
      });
      handleSubmit(modal.root.querySelector('form'), async (values) => {
        if (editing) await api.put(`/suppliers/${s.id}`, values); else await api.post('/suppliers', values);
        modal.close();
        toast(editing ? t('suppliers.saved') : t('suppliers.created'));
        ctx.reload();
      });
    };

    const detail = async (id) => {
      try {
        const s = await api.get(`/suppliers/${id}`);
        openModal({
          title: s.name,
          size: 'md',
          body: html`<p class="mb-4 text-sm text-ink-2">${[s.contact, s.phone, s.email].filter(Boolean).join(' · ') || t('suppliers.no_contact')}</p>
            <h3 class="mb-3 font-body text-sm font-bold text-ink-2">${t('suppliers.supplied')}</h3>
            ${s.products.length ? html`<ul class="flex flex-col gap-2">${s.products.map((p) => html`<li class="flex items-center justify-between gap-3 rounded-control bg-glass px-4 py-2.5 text-sm"><span class="min-w-0 break-words font-semibold">${p.name}</span><span class="shrink-0 tabular-nums ${p.stock <= p.minStock ? 'text-warning' : 'text-ink-2'}">${number(p.stock, 1)} ${p.unit} · ${money(p.cost)}</span></li>`)}</ul>` : html`<p class="text-sm text-ink-2">${t('suppliers.no_products')}</p>`}
            ${s.notes ? html`<p class="mt-5 rounded-control bg-glass p-4 text-sm text-ink-2">${s.notes}</p>` : ''}`.text
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
        const s = byId(id);
        if (await confirmDialog({ title: t('suppliers.delete_title'), text: t('suppliers.delete_text', { name: s.name }), confirmLabel: t('suppliers.delete_action') })) {
          try { await api.delete(`/suppliers/${s.id}`); toast(t('suppliers.deleted')); ctx.reload(); } catch (error) { toast(errorSummary(error), { tone: 'error' }); }
        }
      }
    });
  }
};
