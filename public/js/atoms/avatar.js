import { html, cx } from '../core/html.js';
import { initials } from '../core/format.js';

/** Átomo: círculo con las iniciales de la persona. */
export function avatar(name, { size = 40, className = '' } = {}) {
  return html`<span class="${cx('inline-flex items-center justify-center rounded-full bg-ember/90 font-display font-bold text-white', className)}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.38)}px" aria-hidden="true">${initials(name)}</span>`;
}
