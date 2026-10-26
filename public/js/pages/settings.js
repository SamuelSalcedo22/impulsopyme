import { html } from '../core/html.js';
import { api } from '../core/api.js';
import { state, setSession } from '../core/state.js';
import { t, getLocale, setLocale } from '../core/i18n.js';
import { pageHeader } from '../templates/pageTemplate.js';
import { tabs } from '../molecules/tabs.js';
import { formField } from '../molecules/formField.js';
import { errorMessage, errorSummary } from '../molecules/errorMessage.js';
import { input, select } from '../atoms/field.js';
import { button } from '../atoms/button.js';
import { chip } from '../atoms/chip.js';
import { icon } from '../atoms/icon.js';
import { confirmDialog } from '../organisms/modal.js';
import { toast } from '../organisms/toast.js';
import { handleSubmit, formErrorSlot } from './shared.js';

const TABS = ['profile', 'business', 'ai'];
const TYPES = ['tienda_barrio', 'restaurante', 'papeleria', 'ferreteria'];

function profile() {
  return html`<section class="glass-card max-w-2xl"><h2 class="mb-1 font-display text-lg font-bold">${t('settings.profile_title')}</h2><p class="mb-5 text-sm text-ink-2">${t('settings.profile_text')}</p>
    <form novalidate data-form="profile" class="flex flex-col gap-1">
      ${formField({ label: t('fields.name'), name: 'name', required: true, control: input({ name: 'name', value: state.user.name }) })}
      ${formField({ label: t('fields.username'), name: 'username', hint: t('settings.username_fixed'), control: input({ name: 'username', value: state.user.username, className: 'opacity-60', ariaLabel: t('fields.username') }) })}
      ${formField({ label: t('settings.language'), name: 'locale', control: select({ name: 'locale', value: getLocale(), options: [{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }] }) })}
      ${formErrorSlot()}
      <div class="mt-2">${button({ label: t('common.save'), type: 'submit' })}</div>
    </form></section>
    <section class="glass-card mt-5 max-w-2xl"><h2 class="mb-1 font-display text-lg font-bold">${t('settings.password_title')}</h2><p class="mb-5 text-sm text-ink-2">${t('settings.password_text')}</p>
    <form novalidate data-form="password" class="flex flex-col gap-1">
      ${formField({ label: t('settings.current_password'), name: 'currentPassword', required: true, control: input({ name: 'currentPassword', type: 'password', autocomplete: 'current-password' }) })}
      ${formField({ label: t('settings.new_password'), name: 'newPassword', required: true, hint: t('auth.password_hint'), control: input({ name: 'newPassword', type: 'password', autocomplete: 'new-password' }) })}
      ${formErrorSlot()}
      <div class="mt-2">${button({ label: t('settings.password_action'), type: 'submit' })}</div>
    </form></section>`;
}

function business() {
  return html`<section class="glass-card max-w-2xl"><h2 class="mb-1 font-display text-lg font-bold">${t('settings.business_title')}</h2><p class="mb-5 text-sm text-ink-2">${t('settings.business_text')}</p>
    <form novalidate data-form="business" class="flex flex-col gap-1">
      ${formField({ label: t('fields.businessName'), name: 'name', required: true, control: input({ name: 'name', value: state.business.name }) })}
      ${formField({ label: t('fields.businessType'), name: 'type', hint: t('settings.type_hint'), control: select({ name: 'type', value: state.business.type, options: TYPES.map((k) => ({ value: k, label: t(`businessTypes.${k}.name`) })) }) })}
      ${formErrorSlot()}
      <div class="mt-2">${button({ label: t('common.save'), type: 'submit' })}</div>
    </form></section>`;
}

function ai(status) {
  return html`<section class="glass-card max-w-2xl"><div class="flex flex-wrap items-start justify-between gap-3"><div><h2 class="mb-1 font-display text-lg font-bold">${t('settings.ai_title')}</h2><p class="text-sm text-ink-2">${t('settings.ai_text')}</p></div>
    ${status.configured ? chip(t('settings.ai_on'), { tone: 'positive', iconName: 'check' }) : chip(t('settings.ai_off'), { iconName: 'info' })}</div>
    ${status.configured ? html`<dl class="mt-5 grid gap-3 text-sm sm:grid-cols-3">
      <div class="rounded-control bg-glass p-3"><dt class="text-ink-muted">${t('settings.ai_project')}</dt><dd class="mt-1 break-all font-semibold">${status.project}</dd></div>
      <div class="rounded-control bg-glass p-3"><dt class="text-ink-muted">${t('settings.ai_region')}</dt><dd class="mt-1 break-all font-semibold">${status.location}</dd></div>
      <div class="rounded-control bg-glass p-3"><dt class="text-ink-muted">${t('settings.ai_model')}</dt><dd class="mt-1 break-all font-semibold">${status.model}</dd></div></dl>` : ''}
    <form novalidate data-form="ai" class="mt-6 flex flex-col gap-1">
      ${formField({ label: t('settings.ai_file'), name: 'key', hint: t('settings.ai_file_hint'), control: html`<input type="file" name="keyfile" accept="application/json,.json" class="field !py-2.5 file:mr-4 file:rounded-full file:border-0 file:bg-glass-strong file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-ink" />` })}
      <div class="flex items-start gap-3 rounded-control bg-glass p-3 text-sm text-ink-2"><span class="mt-0.5 text-ember">${icon('shield', { size: 18 })}</span><span>${t('settings.ai_privacy')}</span></div>
      ${formErrorSlot()}
      <div class="mt-3 flex flex-wrap gap-3">${button({ label: status.configured ? t('settings.ai_replace') : t('settings.ai_connect'), type: 'submit', iconName: 'key' })}${status.configured ? button({ label: t('settings.ai_remove'), variant: 'ghost', action: 'remove-ai' }) : ''}</div>
    </form></section>`;
}

export default {
  titleKey: 'nav.settings',
  crumbs: (loc) => [{ label: t('nav.settings'), path: '/settings' }, { label: t(`settings.tab_${TABS.includes(loc.query.tab) ? loc.query.tab : 'profile'}`) }],
  async load(loc) {
    const tab = TABS.includes(loc.query.tab) ? loc.query.tab : 'profile';
    return { tab, status: tab === 'ai' ? await api.get('/ai/status') : null };
  },
  view({ tab, status }) {
    return html`${pageHeader({ title: t('settings.title'), subtitle: t('settings.subtitle'), actions: tabs({ items: TABS.map((k) => ({ key: k, label: t(`settings.tab_${k}`) })), active: tab, path: '/settings' }) })}
      ${tab === 'profile' ? profile() : tab === 'business' ? business() : ai(status)}`;
  },
  mount(el, { tab }, loc, ctx) {
    const rerenderAll = () => window.dispatchEvent(new HashChangeEvent('hashchange'));
    const profileForm = el.querySelector('[data-form="profile"]');
    if (profileForm) handleSubmit(profileForm, async (v) => {
      const result = await api.patch('/auth/me', { name: v.name, locale: v.locale });
      setSession(result);
      setLocale(v.locale);
      toast(t('settings.saved'));
      rerenderAll();
    });
    const passwordForm = el.querySelector('[data-form="password"]');
    if (passwordForm) handleSubmit(passwordForm, async (v) => {
      await api.patch('/auth/me', { currentPassword: v.currentPassword, newPassword: v.newPassword });
      passwordForm.reset();
      toast(t('settings.password_changed'));
    });
    const businessForm = el.querySelector('[data-form="business"]');
    if (businessForm) handleSubmit(businessForm, async (v) => {
      const result = await api.patch('/auth/business', v);
      state.business = result.business;
      toast(t('settings.saved'));
      rerenderAll();
    });
    const aiForm = el.querySelector('[data-form="ai"]');
    if (aiForm) {
      handleSubmit(aiForm, async () => {
        const file = aiForm.querySelector('[name="keyfile"]').files[0];
        if (!file) { const e = new Error('x'); e.code = 'validation.required'; e.params = { field: 'key' }; throw e; }
        let key;
        try { key = JSON.parse(await file.text()); } catch { const e = new Error('x'); e.code = 'ai.invalid_key'; e.params = { field: 'key' }; throw e; }
        await api.put('/ai/credentials', { key });
        toast(t('settings.ai_connected'));
        ctx.reload();
      });
      aiForm.addEventListener('click', async (event) => {
        if (!event.target.closest('[data-action="remove-ai"]')) return;
        if (await confirmDialog({ title: t('settings.ai_remove_title'), text: t('settings.ai_remove_text'), confirmLabel: t('settings.ai_remove') })) {
          try { await api.delete('/ai/credentials'); toast(t('settings.ai_removed')); ctx.reload(); } catch (error) { toast(errorSummary(error), { tone: 'error' }); }
        }
      });
    }
  }
};
