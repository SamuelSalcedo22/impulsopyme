import { html } from '../core/html.js';
import { errorMessage } from '../molecules/errorMessage.js';
import { errorParts } from '../core/i18n.js';
import { toast } from '../organisms/toast.js';
import { errorSummary } from '../molecules/errorMessage.js';

/** Lee un formulario como objeto. Los vacíos quedan como cadena vacía; los checkbox como boolean. */
export function formData(form) {
  const out = {};
  new FormData(form).forEach((value, key) => { out[key] = typeof value === 'string' ? value.trim() : value; });
  form.querySelectorAll('input[type="checkbox"]').forEach((box) => { out[box.name] = box.checked; });
  return out;
}

export function clearFieldErrors(form) {
  form.querySelectorAll('[data-error-for]').forEach((el) => { el.textContent = ''; });
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  const box = form.querySelector('[data-form-error]');
  if (box) box.innerHTML = '';
}

/** Un error que apunta a un campo se muestra junto a ese campo; los demás, arriba del formulario. */
export function showFormError(form, error) {
  const field = error?.params?.field;
  const slot = field && form.querySelector(`[data-error-for="${field}"]`);
  if (slot) {
    const { what, todo } = errorParts(error.code, error.params);
    slot.textContent = `${what} ${todo}`;
    const input = form.querySelector(`[name="${field}"]`);
    input?.setAttribute('aria-invalid', 'true');
    input?.focus();
    return;
  }
  const box = form.querySelector('[data-form-error]');
  if (box) box.innerHTML = errorMessage(error).text;
  else toast(errorSummary(error), { tone: 'error' });
}

/**
 * Envía un formulario: bloquea el botón mientras trabaja, limpia errores previos y
 * muestra el error donde corresponde. `action` recibe los datos y puede lanzar un ApiError.
 */
export function handleSubmit(form, action) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      await action(formData(form));
    } catch (error) {
      showFormError(form, error);
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}

export const formErrorSlot = () => html`<div data-form-error class="empty:hidden"></div>`;
