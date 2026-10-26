import { html, raw, esc, cx } from '../core/html.js';

/** Átomos de formulario: input, select y textarea comparten la clase .field (tokens de componente). */
export function input({ name, type = 'text', value = '', placeholder = '', required = false, autocomplete = 'off', min, max, step, id = '', className = '', inputmode = '', ariaLabel = '' }) {
  const extra = [min !== undefined && `min="${esc(min)}"`, max !== undefined && `max="${esc(max)}"`, step !== undefined && `step="${esc(step)}"`, inputmode && `inputmode="${esc(inputmode)}"`, ariaLabel && `aria-label="${esc(ariaLabel)}"`].filter(Boolean).join(' ');
  return html`<input class="${cx('field', className)}" id="${id || `f-${name}`}" name="${name}" type="${type}" value="${value}" placeholder="${placeholder}" autocomplete="${autocomplete}" ${required ? raw('required') : ''} ${raw(extra)} />`;
}

export function select({ name, options = [], value = '', id = '', className = '', ariaLabel = '' }) {
  return html`<select class="${cx('field', className)}" id="${id || `f-${name}`}" name="${name}" ${ariaLabel ? raw(`aria-label="${esc(ariaLabel)}"`) : ''}>
    ${options.map((o) => html`<option value="${o.value}" ${String(o.value) === String(value) ? raw('selected') : ''}>${o.label}</option>`)}
  </select>`;
}

export function textarea({ name, value = '', placeholder = '', rows = 3, id = '' }) {
  return html`<textarea class="field py-3" id="${id || `f-${name}`}" name="${name}" rows="${rows}" placeholder="${placeholder}">${value}</textarea>`;
}
