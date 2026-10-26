import { html, raw } from '../core/html.js';
import { icon } from '../atoms/icon.js';
import { t } from '../core/i18n.js';

/**
 * Organismo: ventana modal accesible (foco atrapado, Escape para cerrar, devuelve el foco).
 * Devuelve {root, close}. El contenido se arma con `body` y los botones del formulario usan data-action="close".
 */
export function openModal({ title, body, size = 'md', onClose } = {}) {
  const previous = document.activeElement;
  const root = document.createElement('div');
  root.className = 'fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6';
  const width = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' }[size];
  root.innerHTML = html`
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" data-action="close"></div>
    <section class="modal-in glass-card relative flex max-h-[92vh] w-full ${raw(width)} flex-col !rounded-b-none bg-[var(--g-color-anthracite-800)]/95 !p-0 sm:!rounded-b-[var(--s-radius-card)]" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="flex items-center justify-between gap-4 border-b border-glass-border px-6 py-4">
        <h2 id="modal-title" class="min-w-0 break-words font-display text-xl font-bold">${title}</h2>
        <button type="button" class="btn btn-ghost btn-icon btn-sm" data-action="close" aria-label="${t('common.close')}">${icon('x', { size: 18 })}</button>
      </header>
      <div class="overflow-y-auto px-6 py-5" data-modal-body>${body}</div>
    </section>`.text;
  document.body.appendChild(root);
  document.body.style.overflow = 'hidden';

  const focusable = () => [...root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled);
  const close = () => {
    root.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    previous?.focus?.();
    onClose?.();
  };
  function onKey(event) {
    if (event.key === 'Escape') { event.stopPropagation(); close(); return; }
    if (event.key !== 'Tab') return;
    const items = focusable();
    if (!items.length) return;
    const first = items[0]; const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', onKey);
  root.addEventListener('click', (event) => { if (event.target.closest('[data-action="close"]')) close(); });
  (root.querySelector('[autofocus], input, select, textarea') || focusable()[1] || focusable()[0])?.focus();
  return { root, close, body: root.querySelector('[data-modal-body]') };
}

/** Confirmación de acciones destructivas: dice exactamente qué se hará. */
export function confirmDialog({ title, text, confirmLabel, danger = true }) {
  return new Promise((resolve) => {
    let decided = false;
    const modal = openModal({
      title,
      size: 'sm',
      body: html`<p class="text-ink-2">${text}</p>
        <div class="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" class="btn btn-ghost" data-action="close"><span>${t('common.cancel')}</span></button>
          <button type="button" class="btn btn-primary ${danger ? '!bg-[var(--g-color-rose-500)]' : ''}" data-confirm><span>${confirmLabel}</span></button>
        </div>`.text,
      onClose: () => { if (!decided) resolve(false); }
    });
    modal.root.querySelector('[data-confirm]').addEventListener('click', () => { decided = true; modal.close(); resolve(true); });
  });
}
