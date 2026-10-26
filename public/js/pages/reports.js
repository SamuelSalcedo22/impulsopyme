import { html } from '../core/html.js';
import { download } from '../core/api.js';
import { t } from '../core/i18n.js';
import { today } from '../core/format.js';
import { pageHeader } from '../templates/pageTemplate.js';
import { formField } from '../molecules/formField.js';
import { errorSummary } from '../molecules/errorMessage.js';
import { input } from '../atoms/field.js';
import { button } from '../atoms/button.js';
import { icon } from '../atoms/icon.js';
import { toast } from '../organisms/toast.js';

const REPORTS = [
  { key: 'sales', icon: 'sales', file: 'ventas', ranged: true },
  { key: 'products', icon: 'box', file: 'productos', ranged: true },
  { key: 'inventory', icon: 'inventory', file: 'inventario', ranged: false }
];

function daysAgo(n) {
  const d = new Date(`${today()}T12:00:00`);
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('en-CA');
}

export default {
  titleKey: 'nav.reports',
  crumbs: () => [{ label: t('nav.reports') }],
  view() {
    return html`${pageHeader({ title: t('reports.title'), subtitle: t('reports.subtitle') })}
    <section class="glass-card mb-5">
      <h2 class="mb-4 font-display text-lg font-bold">${t('reports.period')}</h2>
      <div class="grid max-w-xl gap-4 sm:grid-cols-2">
        ${formField({ label: t('reports.from'), name: 'from', control: input({ name: 'from', type: 'date', value: daysAgo(29) }) })}
        ${formField({ label: t('reports.to'), name: 'to', control: input({ name: 'to', type: 'date', value: today() }) })}
      </div>
    </section>
    <div class="grid gap-5 md:grid-cols-3">${REPORTS.map((r) => html`<article class="glass-card flex flex-col gap-4">
      <span class="flex h-12 w-12 items-center justify-center rounded-full bg-glass-strong text-ember">${icon(r.icon, { size: 24 })}</span>
      <div class="flex-1"><h3 class="font-display text-lg font-bold">${t(`reports.${r.key}_title`)}</h3><p class="mt-1 text-sm text-ink-2">${t(`reports.${r.key}_text`)}</p>${r.ranged ? '' : html`<p class="mt-2 text-xs text-ink-muted">${t('reports.no_period')}</p>`}</div>
      ${button({ label: t('reports.download'), variant: 'ghost', iconName: 'download', action: 'download', data: { report: r.key } })}
    </article>`)}</div>
    <p class="mt-5 text-sm text-ink-muted">${t('reports.excel_tip')}</p>`;
  },
  mount(el) {
    el.addEventListener('click', async (event) => {
      const target = event.target.closest('[data-action="download"]');
      if (!target) return;
      const report = REPORTS.find((r) => r.key === target.dataset.report);
      const from = el.querySelector('[name="from"]').value;
      const to = el.querySelector('[name="to"]').value;
      const query = report.ranged ? `?from=${from}&to=${to}` : '';
      target.disabled = true;
      try {
        await download(`/reports/${report.key}.csv${query}`, `${report.file}${report.ranged ? `_${from}_${to}` : `_${today()}`}.csv`);
        toast(t('reports.downloaded'));
      } catch (error) { toast(errorSummary(error), { tone: 'error' }); } finally { target.disabled = false; }
    });
  }
};
