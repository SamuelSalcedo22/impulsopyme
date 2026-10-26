import { html } from '../core/html.js';
import { icon } from '../atoms/icon.js';
import { chip } from '../atoms/chip.js';
import { t } from '../core/i18n.js';
import { number, money, dateLong, weekdayPlural } from '../core/format.js';

const ICONS = { stockout_risk: 'alert', below_minimum: 'inventory', low_rotation: 'box', weekday_peak: 'calendar', demand_up: 'trending-up', demand_down: 'trending-down', low_margin: 'cash', anomaly_up: 'trending-up', anomaly_down: 'trending-down' };
const TONES = { high: 'negative', medium: 'warning', low: '', info: 'ember' };

/** Da formato a los parámetros numéricos del servidor para que el texto salga natural en cada idioma. */
function format(type, p) {
  const out = { ...p };
  if ('stock' in p) out.stock = number(p.stock, 1);
  if ('minStock' in p) out.minStock = number(p.minStock, 1);
  if ('coverDays' in p) out.coverDays = number(p.coverDays, 1);
  if ('idleValue' in p) out.idleValue = money(p.idleValue);
  if ('soldLast30' in p) out.soldLast30 = number(p.soldLast30, 1);
  if ('peakUnits' in p) out.peakUnits = number(p.peakUnits);
  if ('weekday' in p) out.weekday = weekdayPlural(p.weekday);
  if ('date' in p) out.date = dateLong(p.date);
  if ('change' in p) out.change = Math.abs(p.change);
  if (type.startsWith('anomaly')) out.pct = Math.round(Math.abs(p.ratio - 1) * 100);
  out.supplier = p.supplier || t('insights.generic_supplier');
  return out;
}

/** Convierte un hallazgo del servidor (tipo + parámetros) en título y texto del idioma actual. */
export function insightText(insight) {
  const params = format(insight.type, insight.params);
  const bodyKey = insight.params.driver ? `insights.${insight.type}.body_driver` : `insights.${insight.type}.body`;
  return { title: t(`insights.${insight.type}.title`, params), body: t(bodyKey, params) };
}

/** Molécula: tarjeta de un hallazgo de la IA, con gravedad, título y explicación accionable. */
export function insightCard(insight, { compact = false } = {}) {
  const { title, body } = insightText(insight);
  const tone = TONES[insight.severity];
  return html`<article class="flex gap-3 rounded-control border border-glass-border bg-glass p-4">
    <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-glass-strong ${tone === 'negative' ? 'text-negative' : tone === 'warning' ? 'text-warning' : 'text-ink-2'}">${icon(ICONS[insight.type] || 'info', { size: 18 })}</span>
    <div class="min-w-0">
      <div class="flex flex-wrap items-center gap-2"><h3 class="font-body text-[0.95rem] font-bold leading-snug">${title}</h3>${compact ? '' : chip(t(`insights.severity.${insight.severity}`), { tone })}</div>
      <p class="mt-1 text-sm leading-relaxed text-ink-2">${body}</p>
    </div>
  </article>`;
}
