import { html, raw, esc } from '../core/html.js';
import { dateShort } from '../core/format.js';
import { t } from '../core/i18n.js';

/**
 * Organismo: gráficos SVG propios (sin librerías), así funcionan sin internet dentro de Electron
 * y toman sus colores de los tokens. Los gráficos con interacción se registran por id.
 */
const registry = new Map();
let uid = 0;

/** Interpolación monótona (Fritsch–Carlson): curva suave que no se pasa de los datos. */
function smoothPath(points) {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M${points[0].x},${points[0].y}`;
  const dx = []; const m = []; const tangents = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i += 1) {
    dx[i] = points[i + 1].x - points[i].x;
    m[i] = (points[i + 1].y - points[i].y) / (dx[i] || 1);
  }
  tangents[0] = m[0]; tangents[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i += 1) tangents[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i += 1) {
    if (m[i] === 0) { tangents[i] = 0; tangents[i + 1] = 0; continue; }
    const a = tangents[i] / m[i]; const b = tangents[i + 1] / m[i];
    const h = Math.hypot(a, b);
    if (h > 3) { const k = 3 / h; tangents[i] = k * a * m[i]; tangents[i + 1] = k * b * m[i]; }
  }
  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i += 1) {
    const h = dx[i] / 3;
    d += ` C${(points[i].x + h).toFixed(1)},${(points[i].y + tangents[i] * h).toFixed(1)} ${(points[i + 1].x - h).toFixed(1)},${(points[i + 1].y - tangents[i + 1] * h).toFixed(1)} ${points[i + 1].x.toFixed(1)},${points[i + 1].y.toFixed(1)}`;
  }
  return d;
}

function niceMax(value) {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

/** Divide una serie con huecos (null) en tramos continuos. */
function segments(values) {
  const out = []; let cur = [];
  values.forEach((v, i) => {
    if (v === null || v === undefined) { if (cur.length) out.push(cur); cur = []; } else cur.push({ i, v });
  });
  if (cur.length) out.push(cur);
  return out;
}

/**
 * Gráfico de líneas con banda opcional y tooltip.
 * series: [{ name, color, values[], dashed?, area? }]   band: { low[], high[], color }
 */
export function lineChart({ labels, series, band = null, height = 240, format = String, axisFormat = format, ariaLabel }) {
  const W = 640; const H = height; const pad = { l: 80, r: 14, t: 16, b: 30 };
  const plotW = W - pad.l - pad.r; const plotH = H - pad.t - pad.b;
  const all = series.flatMap((s) => s.values.filter((v) => v !== null && v !== undefined)).concat(band ? band.high.filter((v) => v != null) : []);
  const max = niceMax(Math.max(...all, 1) * 1.05);
  const x = (i) => pad.l + (labels.length <= 1 ? plotW / 2 : (i / (labels.length - 1)) * plotW);
  const y = (v) => pad.t + plotH - (v / max) * plotH;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const grid = ticks.map((v) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="rgba(255,255,255,.07)" stroke-dasharray="${v === 0 ? '0' : '3 6'}"/><text x="${pad.l - 10}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" fill="var(--s-color-text-muted)" font-size="11">${esc(axisFormat(v))}</text>`).join('');

  const step = Math.max(1, Math.round(labels.length / 6));
  const xLabels = labels.map((l, i) => (i % step === 0 || i === labels.length - 1 ? `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" fill="var(--s-color-text-muted)" font-size="11">${esc(dateShort(l))}</text>` : '')).join('');

  let bandSvg = '';
  if (band) {
    const idx = band.low.map((v, i) => (v == null ? null : i)).filter((i) => i !== null);
    const top = idx.map((i) => ({ x: x(i), y: y(band.high[i]) }));
    const bottom = idx.map((i) => ({ x: x(i), y: y(band.low[i]) })).reverse();
    if (top.length) bandSvg = `<path d="${smoothPath(top)} L${bottom[0].x.toFixed(1)},${bottom[0].y.toFixed(1)} ${smoothPath(bottom).replace(/^M[^C]*/, '')} Z" fill="${band.color}" opacity=".16"/>`;
  }

  const lines = series.map((s) => segments(s.values).map((seg) => {
    const pts = seg.map((p) => ({ x: x(p.i), y: y(p.v) }));
    const path = smoothPath(pts);
    const area = s.area && pts.length > 1 ? `<path d="${path} L${pts[pts.length - 1].x.toFixed(1)},${y(0)} L${pts[0].x.toFixed(1)},${y(0)} Z" fill="url(#area-${s.color.replace(/\W/g, '')})" opacity=".9"/>` : '';
    return `${area}<path d="${path}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linecap="round" ${s.dashed ? 'stroke-dasharray="2 7"' : ''}/>`;
  }).join('')).join('');

  const defs = series.filter((s) => s.area).map((s) => `<linearGradient id="area-${s.color.replace(/\W/g, '')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".30"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`).join('');

  uid += 1;
  const id = `chart-${uid}`;
  registry.set(id, { labels, series, band, x: labels.map((_, i) => x(i) / W), ys: series.map((s) => s.values.map((v) => (v == null ? null : y(v) / H))), format });

  return html`<div class="relative" data-chart-id="${id}">
    <svg viewBox="0 0 ${W} ${H}" class="block w-full" role="img" aria-label="${ariaLabel || ''}"><defs>${raw(defs)}</defs>${raw(grid)}${raw(xLabels)}${raw(bandSvg)}${raw(lines)}
      <g data-hover hidden><line y1="${pad.t}" y2="${H - pad.b}" stroke="rgba(255,255,255,.3)" stroke-dasharray="3 4"/>${raw(series.map((s, k) => `<circle data-dot="${k}" r="5" fill="${s.color}" stroke="var(--g-color-anthracite-900)" stroke-width="2"/>`).join(''))}</g>
    </svg>
    <div data-tip class="pointer-events-none absolute z-10 hidden min-w-[9rem] -translate-x-1/2 rounded-2xl border border-glass-border bg-[var(--g-color-anthracite-950)]/95 px-3 py-2 text-xs shadow-xl"></div>
  </div>`;
}

/** Activa el tooltip de todos los gráficos dentro de `root`. Se llama después de insertar el HTML. */
export function bindCharts(root) {
  root.querySelectorAll('[data-chart-id]').forEach((box) => {
    const model = registry.get(box.dataset.chartId);
    if (!model) return;
    const svg = box.querySelector('svg');
    const hover = box.querySelector('[data-hover]');
    const tip = box.querySelector('[data-tip]');
    const [vbW, vbH] = svg.getAttribute('viewBox').split(' ').slice(2).map(Number);

    const move = (event) => {
      const rect = svg.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width);
      let best = 0;
      model.x.forEach((xv, i) => { if (Math.abs(xv - px) < Math.abs(model.x[best] - px)) best = i; });
      const cx = model.x[best] * vbW;
      hover.hidden = false;
      hover.querySelector('line').setAttribute('x1', cx); hover.querySelector('line').setAttribute('x2', cx);
      const rows = [];
      model.series.forEach((s, k) => {
        const dot = hover.querySelector(`[data-dot="${k}"]`);
        const yv = model.ys[k][best];
        if (yv == null) { dot.setAttribute('visibility', 'hidden'); return; }
        dot.setAttribute('visibility', 'visible'); dot.setAttribute('cx', cx); dot.setAttribute('cy', yv * vbH);
        rows.push(`<div class="flex items-center justify-between gap-4"><span class="flex items-center gap-1.5 text-ink-2"><i class="inline-block h-2 w-2 rounded-full" style="background:${s.color}"></i>${esc(s.name)}</span><b>${esc(model.format(s.values[best]))}</b></div>`);
      });
      if (model.band && model.band.low[best] != null) rows.push(`<div class="text-ink-muted">${esc(t('charts.range', { low: model.format(model.band.low[best]), high: model.format(model.band.high[best]) }))}</div>`);
      tip.innerHTML = `<div class="mb-1 font-semibold">${esc(dateShort(model.labels[best]))}</div>${rows.join('')}`;
      tip.classList.remove('hidden');
      const left = Math.min(Math.max(model.x[best] * rect.width, 80), rect.width - 80);
      tip.style.left = `${left}px`; tip.style.top = '4px';
    };
    const leave = () => { hover.hidden = true; tip.classList.add('hidden'); };
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerleave', leave);
  });
}

/** Línea diminuta para tablas y tarjetas. */
export function sparkline(values, { width = 120, height = 34, color = 'var(--s-color-data-series-1)' } = {}) {
  if (!values.length) return html`<span></span>`;
  const max = Math.max(...values, 1); const min = Math.min(...values, 0);
  const pts = values.map((v, i) => ({ x: 3 + (i / Math.max(values.length - 1, 1)) * (width - 6), y: 3 + (1 - (v - min) / ((max - min) || 1)) * (height - 6) }));
  return html`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true"><path d="${smoothPath(pts)}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg>`;
}

/** Barras horizontales con valor al final. items: [{label, value, display, tone?}] */
export function barList(items, { tone = 'var(--s-color-action-primary)' } = {}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return html`<ul class="flex flex-col gap-3">
    ${items.map((item) => html`<li>
      <div class="mb-1.5 flex items-baseline justify-between gap-3 text-sm"><span class="min-w-0 break-words text-ink-2">${item.label}</span><b class="shrink-0 tabular-nums">${item.display}</b></div>
      <div class="h-2 overflow-hidden rounded-full bg-glass-strong"><div class="h-full rounded-full" style="width:${Math.max(3, (item.value / max) * 100)}%;background:${item.tone || tone}"></div></div>
    </li>`)}
  </ul>`;
}

/** Anillo con leyenda. segments: [{label, value, color, display}] */
export function donut({ segments: parts, centerValue, centerLabel }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const R = 54; const C = 2 * Math.PI * R; let offset = 0;
  const arcs = parts.map((p) => {
    const len = (p.value / total) * C;
    const arc = `<circle cx="70" cy="70" r="${R}" fill="none" stroke="${p.color}" stroke-width="14" stroke-dasharray="${Math.max(len - 3, 0)} ${C}" stroke-dashoffset="${-offset}" transform="rotate(-90 70 70)" stroke-linecap="round"/>`;
    offset += len;
    return arc;
  }).join('');
  return html`<div class="flex flex-wrap items-center gap-6">
    <div class="relative h-[140px] w-[140px] shrink-0">
      <svg viewBox="0 0 140 140" width="140" height="140" aria-hidden="true"><circle cx="70" cy="70" r="${R}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="14"/>${raw(arcs)}</svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center text-center"><span class="stat-number text-xl">${centerValue}</span><span class="text-xs text-ink-muted">${centerLabel}</span></div>
    </div>
    <ul class="flex min-w-[10rem] flex-1 flex-col gap-2.5 text-sm">
      ${parts.map((p) => html`<li class="flex items-center justify-between gap-3"><span class="flex min-w-0 items-center gap-2 text-ink-2"><i class="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style="background:${p.color}"></i><span class="break-words">${p.label}</span></span><b class="shrink-0 tabular-nums">${p.display}</b></li>`)}
    </ul>
  </div>`;
}
