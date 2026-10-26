import { html } from '../core/html.js';
import { api } from '../core/api.js';
import { state } from '../core/state.js';
import { navigate, link } from '../core/router.js';
import { t, tn } from '../core/i18n.js';
import { money, moneyCompact, number, dateTime, percent } from '../core/format.js';
import { pageHeader } from '../templates/pageTemplate.js';
import { statTile } from '../molecules/statTile.js';
import { segmented } from '../molecules/segmented.js';
import { insightCard } from '../molecules/insightCard.js';
import { emptyState } from '../molecules/emptyState.js';
import { delta, chip } from '../atoms/chip.js';
import { icon } from '../atoms/icon.js';
import { lineChart, barList, donut } from '../organisms/charts.js';

const SERIES = ['var(--s-color-data-series-1)', 'var(--s-color-data-series-3)', 'var(--s-color-data-series-4)', 'var(--s-color-data-series-2)', 'var(--s-color-data-positive)'];

function greeting() {
  const hour = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Bogota' })) % 24;
  return t(hour < 12 ? 'dashboard.greeting_morning' : hour < 19 ? 'dashboard.greeting_afternoon' : 'dashboard.greeting_evening', { name: (state.user?.name || '').split(' ')[0] });
}

export default {
  titleKey: 'nav.dashboard',
  crumbs: () => [{ label: t('nav.dashboard') }],
  async load(loc) {
    const range = [7, 30, 90].includes(Number(loc.query.range)) ? Number(loc.query.range) : 30;
    const [summary, insights] = await Promise.all([api.get(`/dashboard?range=${range}`), api.get('/ai/insights?horizon=7').catch(() => null)]);
    if (insights) state.alertCount = insights.insights.filter((i) => i.severity === 'high' || i.severity === 'medium').length;
    return { summary, insights, range };
  },
  view({ summary: d, insights, range }) {
    const k = d.kpis;
    const attention = (insights?.insights || []).filter((i) => i.severity !== 'info').slice(0, 3);
    const totalCat = d.byCategory.reduce((s, c) => s + c.revenue, 0) || 1;
    const topMax = Math.max(...d.topProducts.map((p) => p.revenue), 1);
    const noData = d.daily.every((x) => x.revenue === 0);

    return html`
      ${pageHeader({
        title: greeting(),
        subtitle: t('dashboard.subtitle', { business: state.business?.name }),
        actions: segmented({ options: [7, 30, 90].map((n) => ({ value: n, label: t('dashboard.range_days', { n }) })), value: range, action: 'set-range', label: t('charts.range') })
      })}

      <div class="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <section class="glass-card relative overflow-hidden" aria-labelledby="hero-title">
          <div class="hero-glow"></div>
          <div class="relative">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 id="hero-title" class="text-sm font-semibold text-ink-2">${t('dashboard.revenue_title', { n: range })}</h2>
                <p class="stat-number mt-3 text-[2.6rem] sm:text-6xl">${money(k.revenue)}</p>
                <div class="mt-4 flex flex-wrap items-center gap-2">${delta(k.revenueChange)}<span class="text-sm text-ink-muted">${t('dashboard.vs_previous')}</span></div>
              </div>
              <div class="rounded-control border border-glass-border bg-glass px-4 py-3 text-sm">
                <p class="text-ink-muted">${t('dashboard.today')}</p>
                <p class="stat-number mt-1 text-xl">${money(k.today)}</p>
                <p class="mt-1 text-xs text-ink-2">${tn('dashboard.today_sales', k.todayTickets)}</p>
              </div>
            </div>
            <div class="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
              ${statTile({ value: number(k.tickets), label: t('dashboard.tickets'), tone: 'ember' })}
              ${statTile({ value: moneyCompact(k.averageTicket), label: t('dashboard.average_ticket'), tone: 'amber' })}
              ${statTile({ value: moneyCompact(k.profit), label: t('dashboard.profit'), tone: 'lime' })}
              ${statTile({ value: percent(k.margin), label: t('dashboard.margin'), tone: 'sky' })}
            </div>
            <div class="mt-8">
              ${noData ? emptyState({ iconName: 'sales', title: t('dashboard.empty_title'), text: t('dashboard.empty_text'), actionLabel: t('dashboard.empty_action'), action: 'go-sales' })
                : lineChart({ labels: d.daily.map((x) => x.date), series: [{ name: t('dashboard.revenue'), color: SERIES[0], values: d.daily.map((x) => x.revenue), area: true }], format: money, axisFormat: moneyCompact, height: 230, ariaLabel: t('dashboard.chart_label', { n: range }) })}
            </div>
          </div>
        </section>

        <div class="flex flex-col gap-5">
          <section class="glass-card" aria-labelledby="attn-title">
            <div class="mb-4 flex items-center justify-between gap-3">
              <h2 id="attn-title" class="font-display text-lg font-bold">${t('dashboard.attention')}</h2>
              <a class="text-sm font-semibold text-ember hover:underline" href="${link('/ai', { tab: 'alerts' })}">${t('common.see_all')}</a>
            </div>
            ${attention.length
              ? html`<div class="flex flex-col gap-3">${attention.map((i) => insightCard(i, { compact: true }))}</div>`
              : html`<div class="flex items-center gap-3 rounded-control bg-glass p-4 text-sm text-ink-2"><span class="text-positive">${icon('check', { size: 20 })}</span>${t('dashboard.attention_clear')}</div>`}
          </section>

          <section class="glass-card" aria-labelledby="recent-title">
            <h2 id="recent-title" class="mb-4 font-display text-lg font-bold">${t('dashboard.recent_sales')}</h2>
            ${d.recent.length ? html`<ul class="flex flex-col gap-2.5">${d.recent.map((s) => html`<li class="flex items-center justify-between gap-3 rounded-control bg-glass px-4 py-3">
              <div class="min-w-0"><p class="break-words font-semibold">${s.customerName || t('sales.walk_in')}</p><p class="text-xs text-ink-muted">${dateTime(s.soldAt)} · ${t(`payment.${s.paymentMethod}`)}</p></div>
              <b class="shrink-0 tabular-nums">${money(s.total)}</b></li>`)}</ul>`
              : html`<p class="text-sm text-ink-2">${t('dashboard.no_sales_yet')}</p>`}
          </section>
        </div>
      </div>

      <div class="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section class="glass-card" aria-labelledby="top-title">
          <h2 id="top-title" class="mb-5 font-display text-lg font-bold">${t('dashboard.top_products')}</h2>
          ${d.topProducts.length ? html`<div class="table-head grid-cols-[1fr_auto] sm:grid-cols-[1.6fr_.6fr_1fr_1.2fr]"><span>${t('fields.product')}</span><span class="hidden sm:block">${t('dashboard.units')}</span><span class="text-right sm:text-left">${t('dashboard.revenue')}</span><span class="hidden sm:block">${t('dashboard.share')}</span></div>
            <div class="flex flex-col gap-2">${d.topProducts.map((p, i) => html`<div class="table-row grid-cols-[1fr_auto] sm:grid-cols-[1.6fr_.6fr_1fr_1.2fr]">
              <span class="flex min-w-0 items-center gap-3"><i class="h-2.5 w-2.5 shrink-0 rounded-full" style="background:${SERIES[i % SERIES.length]}"></i><span class="break-words font-semibold">${p.name}</span></span>
              <span class="hidden tabular-nums text-ink-2 sm:block">${number(p.units, 1)} ${p.unit}</span>
              <b class="text-right tabular-nums sm:text-left">${money(p.revenue)}</b>
              <span class="hidden sm:block"><span class="block h-2 overflow-hidden rounded-full bg-glass-strong"><span class="block h-full rounded-full" style="width:${Math.max(4, (p.revenue / topMax) * 100)}%;background:${SERIES[i % SERIES.length]}"></span></span></span>
            </div>`)}</div>` : emptyState({ iconName: 'box', title: t('dashboard.no_top_title'), text: t('dashboard.no_top_text') })}
        </section>

        <div class="flex flex-col gap-5">
          <section class="glass-card" aria-labelledby="cat-title">
            <h2 id="cat-title" class="mb-5 font-display text-lg font-bold">${t('dashboard.by_category')}</h2>
            ${d.byCategory.length ? donut({ segments: d.byCategory.slice(0, 5).map((c, i) => ({ label: c.name, value: c.revenue, color: SERIES[i % SERIES.length], display: percent(c.revenue / totalCat) })), centerValue: moneyCompact(totalCat), centerLabel: t('dashboard.total') }) : html`<p class="text-sm text-ink-2">${t('dashboard.no_sales_yet')}</p>`}
          </section>
          <section class="glass-card" aria-labelledby="stock-title">
            <div class="mb-4 flex items-center justify-between gap-3"><h2 id="stock-title" class="font-display text-lg font-bold">${t('dashboard.stock_title')}</h2><a class="text-sm font-semibold text-ember hover:underline" href="${link('/inventory')}">${t('common.see_all')}</a></div>
            <div class="grid grid-cols-2 gap-4">
              ${statTile({ value: number(d.stock.products), label: t('dashboard.stock_products'), tone: 'sky' })}
              ${statTile({ value: moneyCompact(d.stock.inventoryValue), label: t('dashboard.stock_value'), tone: 'lime' })}
              ${statTile({ value: number(d.stock.lowStock), label: t('dashboard.stock_low'), tone: 'amber' })}
              ${statTile({ value: number(d.stock.outOfStock), label: t('dashboard.stock_out'), tone: 'ember' })}
            </div>
          </section>
        </div>
      </div>

      ${d.byPayment.length ? html`<section class="glass-card mt-5" aria-labelledby="pay-title"><h2 id="pay-title" class="mb-5 font-display text-lg font-bold">${t('dashboard.by_payment')}</h2>
        ${barList(d.byPayment.map((p) => ({ label: t(`payment.${p.method}`), value: p.revenue, display: money(p.revenue) })))}</section>` : ''}`;
  },
  mount(el, data, loc) {
    el.addEventListener('click', (event) => {
      const range = event.target.closest('[data-action="set-range"]');
      if (range) navigate(`/dashboard?range=${range.dataset.value}`);
      if (event.target.closest('[data-action="go-sales"]')) navigate('/sales');
    });
  }
};
