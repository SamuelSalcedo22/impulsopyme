import { html, cx } from '../core/html.js';
import { api, setToken } from '../core/api.js';
import { setSession } from '../core/state.js';
import { navigate } from '../core/router.js';
import { t, getLocale } from '../core/i18n.js';
import { formField } from '../molecules/formField.js';
import { input } from '../atoms/field.js';
import { button } from '../atoms/button.js';
import { icon } from '../atoms/icon.js';
import { handleSubmit, formErrorSlot } from './shared.js';

/** Registro en dos pasos cortos: tú, y luego tu negocio. El tipo de negocio decide el catálogo de ejemplo. */
export default {
  public: true,
  titleKey: 'auth.register_title',
  async load() { return api.get('/auth/business-types'); },
  view(types) {
    return html`<form novalidate class="flex flex-col gap-4" aria-labelledby="reg-title">
      <div class="mb-1">
        <h2 id="reg-title" class="font-display text-2xl font-bold">${t('auth.register_title')}</h2>
        <p class="mt-1 text-sm text-ink-2">${t('auth.register_text')}</p>
      </div>
      <fieldset class="flex flex-col gap-3">
        <legend class="mb-2 text-sm font-semibold text-ink-2">${t('fields.businessType')}</legend>
        <div class="grid grid-cols-2 gap-3">
          ${types.items.map((type, i) => html`<label class="group relative cursor-pointer">
            <input type="radio" name="businessType" value="${type.key}" class="peer sr-only-live" data-default-name="${t(`businessTypes.${type.key}.sample_name`)}" ${i === 0 ? html`checked` : ''} />
            <span class="flex h-full flex-col gap-2 rounded-control border border-glass-border bg-glass p-4 transition-colors duration-fast peer-checked:border-ember peer-checked:bg-[color-mix(in_srgb,var(--s-color-action-primary)_16%,transparent)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--s-color-action-focus)]">
              <span class="text-ember">${icon(type.icon, { size: 24 })}</span>
              <span class="font-semibold leading-tight">${t(`businessTypes.${type.key}.name`)}</span>
              <span class="text-xs text-ink-muted">${t(`businessTypes.${type.key}.hint`)}</span>
            </span>
          </label>`)}
        </div>
      </fieldset>
      ${formField({ label: t('fields.businessName'), name: 'businessName', required: true, control: input({ name: 'businessName', value: t(`businessTypes.${types.items[0].key}.sample_name`) }) })}
      ${formField({ label: t('fields.name'), name: 'name', required: true, control: input({ name: 'name', autocomplete: 'name' }) })}
      ${formField({ label: t('fields.username'), name: 'username', required: true, hint: t('auth.username_hint'), control: input({ name: 'username', autocomplete: 'username' }) })}
      ${formField({ label: t('fields.password'), name: 'password', required: true, hint: t('auth.password_hint'), control: input({ name: 'password', type: 'password', autocomplete: 'new-password' }) })}
      <label class="flex cursor-pointer items-start gap-3 rounded-control border border-glass-border bg-glass p-3 text-sm">
        <input type="checkbox" name="sampleData" checked class="mt-1 h-4 w-4 accent-[var(--s-color-action-primary)]" />
        <span><b class="block">${t('auth.sample_title')}</b><span class="text-ink-2">${t('auth.sample_text')}</span></span>
      </label>
      ${formErrorSlot()}
      ${button({ label: t('auth.register_action'), type: 'submit', className: 'w-full' })}
      <p class="text-center text-sm text-ink-2">${t('auth.have_account')} <a class="font-semibold text-ember hover:underline" href="#/login">${t('auth.login_link')}</a></p>
    </form>`;
  },
  mount(root) {
    const form = root.querySelector('form');
    const name = form.querySelector('[name="businessName"]');
    let touched = false;
    name.addEventListener('input', () => { touched = true; });
    form.querySelectorAll('[name="businessType"]').forEach((radio) => radio.addEventListener('change', () => {
      if (!touched) name.value = radio.dataset.defaultName;
    }));
    handleSubmit(form, async (data) => {
      const result = await api.post('/auth/register', { ...data, locale: getLocale() });
      setToken(result.token);
      setSession(result);
      navigate('/dashboard');
    });
  }
};
