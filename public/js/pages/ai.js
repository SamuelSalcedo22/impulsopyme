import { html } from '../core/html.js';
import { api } from '../core/api.js';
import { t, tn, getLocale } from '../core/i18n.js';
import { money, moneyCompact, number, percent, dateLong, dateShort, dateTime } from '../core/format.js';
import { pageHeader } from '../templates/pageTemplate.js';
import { tabs } from '../molecules/tabs.js';
import { segmented } from '../molecules/segmented.js';
import { statTile } from '../molecules/statTile.js';
import { insightCard } from '../molecules/insightCard.js';
import { emptyState } from '../molecules/emptyState.js';
import { errorMessage } from '../molecules/errorMessage.js';
import { delta, chip } from '../atoms/chip.js';
import { icon } from '../atoms/icon.js';
import { button } from '../atoms/button.js';
import { spinner } from '../atoms/spinner.js';
import { lineChart } from '../organisms/charts.js';
import { navigate, link } from '../core/router.js';

const TABS = ['forecast', 'alerts', 'assistant'];

function forecastTab(data, horizon) {
  const f = data.forecast;
  if (f.insufficient) return html`<div class="glass-card">${emptyState({ iconName: 'trending-up', title: t('ai.not_enough_title'), text: t('ai.not_enough_text', { n: f.minDays }) })}</div>`;
  const s = data.summary;
  const hist = f.history;
  const labels = [...hist.map((p) => p.date), ...f.points.map((p) => p.date)];
  const pad = (n) => Array(n).fill(null);
  const lastActual = hist[hist.length - 1].value;
  const actual = [...hist.map((p) => p.value), ...pad(f.points.length)];
  const predicted = [...pad(hist.length - 1), lastActual, ...f.points.map((p) => p.value)];
  const band = { low: [...pad(hist.length), ...f.points.map((p) => p.low)], high: [...pad(hist.length), ...f.points.map((p) => p.high)], color: 'var(--s-color-data-series-3)' };
  const bt = f.backtest;

  return html`
    <section class="glass-card relative overflow-hidden" aria-labelledby="fc-title">
      <div class="hero-glow"></div>
      <div class="relative">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="fc-title" class="text-sm font-semibold text-ink-2">${t('ai.next7')}</h2>
            <p class="stat-number mt-3 text-[2.4rem] sm:text-6xl">${money(s.next7)}</p>
            <div class="mt-4 flex flex-wrap items-center gap-2">${delta(s.change)}<span class="text-sm text-ink-muted">${t('ai.vs_last7')}</span></div>
          </div>
          ${bt ? html`<div class="max-w-xs rounded-control border border-glass-border bg-glass p-4 text-sm">
            <p class="stat-number text-3xl text-positive">${percent(bt.accuracy)}</p>
            <p class="mt-2 font-semibold">${t('ai.accuracy_title')}</p>
            <p class="mt-1 text-ink-2">${t('ai.accuracy_text', { days: bt.holdoutDays, baseline: percent(bt.baselineAccuracy) })}</p></div>` : ''}
        </div>
        <div class="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
          ${statTile({ value: money(s.bestDayValue), label: t('ai.best_day', { day: dateLong(s.bestDay) }), tone: 'ember' })}
          ${statTile({ value: moneyCompact(f.total), label: t('ai.total_horizon', { n: horizon }), tone: 'amber' })}
          ${statTile({ value: money(s.last7), label: t('ai.last7'), tone: 'sky' })}
        </div>
        <div class="mt-8">
          ${lineChart({ labels, band, series: [
            { name: t('ai.actual'), color: 'var(--s-color-data-series-2)', values: actual },
            { name: t('ai.forecast'), color: 'var(--s-color-data-series-3)', values: predicted, dashed: true }
          ], format: money, axisFormat: moneyCompact, height: 260, ariaLabel: t('ai.chart_label', { n: horizon }) })}
          <p class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-muted"><span class="inline-flex items-center gap-2"><i class="h-0.5 w-5 rounded bg-series-2"></i>${t('ai.actual')}</span><span class="inline-flex items-center gap-2"><i class="h-0.5 w-5 rounded bg-series-3"></i>${t('ai.forecast')}</span><span class="inline-flex items-center gap-2"><i class="h-3 w-5 rounded bg-series-3/20"></i>${t('ai.range')}</span></p>
        </div>
      </div>
    </section>

    <div class="mt-5 grid gap-5 lg:grid-cols-2">
      <section class="glass-card" aria-labelledby="ro-title">
        <h2 id="ro-title" class="font-display text-lg font-bold">${t('ai.reorder_title')}</h2>
        <p class="mb-5 mt-1 text-sm text-ink-2">${t('ai.reorder_text')}</p>
        ${data.reorder.length ? html`<ul class="flex flex-col gap-2.5">${data.reorder.map((r) => html`<li class="rounded-control bg-glass p-4">
          <div class="flex flex-wrap items-start justify-between gap-2"><p class="min-w-0 break-words font-semibold">${r.name}</p>${chip(t('ai.buy', { n: number(r.suggested), unit: r.unit }), { tone: 'ember' })}</div>
          <p class="mt-1 text-sm text-ink-2">${t('ai.reorder_line', { stock: number(r.stock, 1), unit: r.unit, days: number(r.coverDays, 1) })}${r.supplier ? ` · ${r.supplier}` : ''}</p></li>`)}</ul>`
          : emptyState({ iconName: 'check', title: t('ai.reorder_none_title'), text: t('ai.reorder_none_text') })}
      </section>
      <section class="glass-card" aria-labelledby="an-title">
        <h2 id="an-title" class="font-display text-lg font-bold">${t('ai.anomalies_title')}</h2>
        <p class="mb-5 mt-1 text-sm text-ink-2">${t('ai.anomalies_text')}</p>
        ${data.anomalies.length ? html`<div class="flex flex-col gap-3">${data.insights.filter((i) => i.type.startsWith('anomaly')).map((i) => insightCard(i))}</div>`
          : emptyState({ iconName: 'check', title: t('ai.anomalies_none_title'), text: t('ai.anomalies_none_text') })}
      </section>
    </div>`;
}

function alertsTab(data) {
  const list = data.insights.filter((i) => !i.type.startsWith('anomaly'));
  if (!list.length) return html`<div class="glass-card">${emptyState({ iconName: 'check', title: t('ai.alerts_none_title'), text: t('ai.alerts_none_text') })}</div>`;
  const groups = ['high', 'medium', 'low', 'info'].map((sev) => ({ sev, items: list.filter((i) => i.severity === sev) })).filter((g) => g.items.length);
  return html`<div class="flex flex-col gap-5">${groups.map((g) => html`<section class="glass-card" aria-label="${t(`insights.severity.${g.sev}`)}">
    <h2 class="mb-4 font-display text-lg font-bold">${t(`ai.group_${g.sev}`)} <span class="ml-1 text-base font-normal text-ink-muted">${g.items.length}</span></h2>
    <div class="grid gap-3 lg:grid-cols-2">${g.items.map((i) => insightCard(i, { compact: true }))}</div></section>`)}</div>`;
}

function narrativeBlock(result) {
  return html`<div class="rounded-control border border-glass-border bg-glass p-5">
    <p class="text-lg leading-relaxed">${result.narrative}</p>
    <p class="mt-3 text-xs text-ink-muted">${t('ai.generated_at', { date: dateTime(result.generatedAt) })}${result.cached ? ` · ${t('ai.from_today')}` : ''}</p></div>
    <h3 class="mb-3 mt-6 font-body text-sm font-bold text-ink-2">${t('ai.actions_title')}</h3>
    <ol class="flex flex-col gap-3">${result.actions.map((a, i) => html`<li class="flex gap-4 rounded-control bg-glass p-4"><span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ember font-display text-sm font-bold">${i + 1}</span><div class="min-w-0"><p class="break-words font-semibold">${a.title}</p><p class="mt-1 break-words text-sm text-ink-2">${a.detail}</p></div></li>`)}</ol>`;
}

function assistantTab(status) {
  if (!status.configured) {
    return html`<section class="glass-card relative overflow-hidden"><div class="hero-glow"></div><div class="relative max-w-xl">
      <span class="flex h-12 w-12 items-center justify-center rounded-full bg-glass-strong text-ember">${icon('ai', { size: 24 })}</span>
      <h2 class="mt-5 font-display text-2xl font-bold">${t('ai.assistant_off_title')}</h2>
      <p class="mt-2 text-ink-2">${t('ai.assistant_off_text')}</p>
      <div class="mt-6"><a class="btn btn-primary" href="${link('/settings', { tab: 'ai' })}">${t('ai.assistant_off_action')}</a></div></div></section>`;
  }
  return html`<section class="glass-card relative overflow-hidden"><div class="hero-glow"></div><div class="relative">
    <div class="flex flex-wrap items-start justify-between gap-4"><div class="max-w-xl"><h2 class="font-display text-2xl font-bold">${t('ai.assistant_title')}</h2><p class="mt-2 text-ink-2">${t('ai.assistant_text')}</p></div>
      <div class="flex gap-3">${button({ label: t('ai.generate'), iconName: 'ai', action: 'generate' })}</div></div>
    <div class="mt-6" data-narrative aria-live="polite"><p class="text-sm text-ink-muted">${t('ai.assistant_idle', { model: status.model })}</p></div></div></section>`;
}

export default {
  titleKey: 'nav.ai',
  crumbs: (loc) => [{ label: t('nav.ai'), path: '/ai' }, { label: t(`ai.tab_${TABS.includes(loc.query.tab) ? loc.query.tab : 'forecast'}`) }],
  async load(loc) {
    const tab = TABS.includes(loc.query.tab) ? loc.query.tab : 'forecast';
    const horizon = [7, 14, 30].includes(Number(loc.query.h)) ? Number(loc.query.h) : 14;
    const [insights, status] = await Promise.all([tab === 'assistant' ? Promise.resolve(null) : api.get(`/ai/insights?horizon=${horizon}`), api.get('/ai/status')]);
    return { tab, horizon, insights, status };
  },
  view({ tab, horizon, insights, status }) {
    const nav = tabs({ items: TABS.map((k) => ({ key: k, label: t(`ai.tab_${k}`) })), active: tab, path: '/ai' });
    const actions = tab === 'forecast' ? segmented({ options: [7, 14, 30].map((n) => ({ value: n, label: t('ai.horizon_days', { n }) })), value: horizon, action: 'set-horizon', label: t('ai.horizon') }) : '';
    return html`${pageHeader({ title: t('ai.title'), subtitle: t('ai.subtitle'), actions: nav })}
      ${tab === 'forecast' ? html`<div class="mb-5 flex justify-end">${actions}</div>${forecastTab(insights, horizon)}` : tab === 'alerts' ? alertsTab(insights) : assistantTab(status)}`;
  },
  mount(el, data) {
    el.addEventListener('click', async (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) return;
      if (target.dataset.action === 'set-horizon') navigate(`/ai?tab=forecast&h=${target.dataset.value}`);
      if (target.dataset.action === 'generate') {
        const box = el.querySelector('[data-narrative]');
        target.disabled = true;
        box.innerHTML = `<div class="flex items-center gap-3 text-ink-2">${spinner().text}<span>${t('ai.generating')}</span></div>`;
        try {
          const result = await api.post('/ai/narrative', { locale: getLocale(), force: Boolean(box.dataset.done) });
          box.dataset.done = '1';
          box.innerHTML = narrativeBlock(result).text;
          target.querySelector('span').textContent = t('ai.regenerate');
        } catch (error) {
          box.innerHTML = errorMessage(error).text;
        } finally { target.disabled = false; }
      }
    });
  }
};
