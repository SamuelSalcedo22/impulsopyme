import { html } from '../core/html.js';
import { api, setToken } from '../core/api.js';
import { setSession } from '../core/state.js';
import { navigate } from '../core/router.js';
import { t, getLocale, locales } from '../core/i18n.js';
import { formField } from '../molecules/formField.js';
import { input } from '../atoms/field.js';
import { button } from '../atoms/button.js';
import { handleSubmit, formErrorSlot } from './shared.js';

export default {
  public: true,
  titleKey: 'auth.login_title',
  view() {
    return html`<form novalidate class="flex flex-col gap-4" aria-labelledby="login-title">
      <div class="mb-2">
        <h2 id="login-title" class="font-display text-2xl font-bold">${t('auth.login_title')}</h2>
        <p class="mt-1 text-sm text-ink-2">${t('auth.login_text')}</p>
      </div>
      ${formField({ label: t('fields.username'), name: 'username', required: true, control: input({ name: 'username', autocomplete: 'username' }) })}
      ${formField({ label: t('fields.password'), name: 'password', required: true, control: input({ name: 'password', type: 'password', autocomplete: 'current-password' }) })}
      ${formErrorSlot()}
      ${button({ label: t('auth.login_action'), type: 'submit', className: 'w-full' })}
      <p class="text-center text-sm text-ink-2">${t('auth.no_account')} <a class="font-semibold text-ember hover:underline" href="#/register">${t('auth.register_link')}</a></p>
    </form>`;
  },
  mount(root) {
    const form = root.querySelector('form');
    form.querySelector('input')?.focus();
    handleSubmit(form, async (data) => {
      const result = await api.post('/auth/login', data);
      setToken(result.token);
      setSession(result);
      navigate('/dashboard');
    });
  }
};
