import { html, esc } from '../core/html.js';
import { icon } from '../atoms/icon.js';

/**
 * Organismo: avisos breves. Confirman lo que acaba de pasar con el mismo verbo del botón
 * ("Guardar cambios" -> "Cambios guardados") y se anuncian a lectores de pantalla.
 */
let host = null;

function ensureHost() {
  if (host) return host;
  host = document.createElement('div');
  host.setAttribute('role', 'status');
  host.setAttribute('aria-live', 'polite');
  host.className = 'fixed bottom-24 right-4 z-[80] flex max-w-[min(26rem,calc(100vw-2rem))] flex-col gap-2 md:bottom-6 md:right-6';
  document.body.appendChild(host);
  return host;
}

export function toast(message, { tone = 'success', duration = 4200 } = {}) {
  const node = document.createElement('div');
  const glyph = tone === 'error' ? 'alert' : 'check';
  const color = tone === 'error' ? 'text-negative' : 'text-positive';
  node.className = 'toast-in glass-panel flex items-start gap-3 !rounded-2xl bg-[var(--g-color-anthracite-950)]/90 px-4 py-3 text-sm shadow-2xl';
  node.innerHTML = `<span class="mt-0.5 ${color}">${icon(glyph, { size: 18 })}</span><span class="min-w-0 break-words">${esc(message)}</span>`;
  ensureHost().appendChild(node);
  setTimeout(() => node.remove(), duration);
}
