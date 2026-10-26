import { html, $ } from './core/html.js';
import { initI18n, setLocale, t, getLocale } from './core/i18n.js';
import { api, getToken, setToken, onSessionExpired } from './core/api.js';
import { state, setSession, clearSession, setPref } from './core/state.js';
import { defineRoutes, parseHash, navigate, startRouter, resolve } from './core/router.js';
import { appShell } from './templates/appShell.js';
import { authLayout } from './templates/authLayout.js';
import { skeleton } from './atoms/spinner.js';
import { errorMessage } from './molecules/errorMessage.js';
import { bindCharts } from './organisms/charts.js';
import { openCommandPalette } from './organisms/commandPalette.js';
import { openModal } from './organisms/modal.js';
import { moreMenu } from './organisms/bottomNav.js';
import { toast } from './organisms/toast.js';

import login from './pages/login.js';
import register from './pages/register.js';
import dashboard from './pages/dashboard.js';
import sales from './pages/sales.js';
import inventory from './pages/inventory.js';
import customers from './pages/customers.js';
import suppliers from './pages/suppliers.js';
import ai from './pages/ai.js';
import reports from './pages/reports.js';
import settings from './pages/settings.js';
import notFound from './pages/notFound.js';

const root = document.getElementById('app');
let renderToken = 0;

defineRoutes({ '/login': login, '/register': register, '/dashboard': dashboard, '/sales': sales, '/inventory': inventory, '/customers': customers, '/suppliers': suppliers, '/ai': ai, '/reports': reports, '/settings': settings }, notFound);

/** Cada página declara: public, titleKey, crumbs(loc), load(loc), view(data, loc, ctx), mount(el, data, loc, ctx). */
async function render() {
  const loc = parseHash();
  if (loc.path === '/') { navigate(state.user ? '/dashboard' : '/login', { replace: true }); return; }
  const page = resolve(loc);
  if (!page.public && !state.user) { navigate('/login', { replace: true }); return; }
  if (page.public && state.user) { navigate('/dashboard', { replace: true }); return; }
  document.title = `${t(page.titleKey || 'app.name')} · ${t('app.name')}`;
  const token = ++renderToken;

  if (page.public) {
    let data = null;
    try { data = page.load ? await page.load(loc) : null; } catch (error) { data = null; root.innerHTML = authLayout({ content: errorMessage(error, { retryAction: 'retry-page' }) }).text; return; }
    if (token !== renderToken) return;
    root.innerHTML = authLayout({ content: page.view(data, loc) }).text;
    page.mount?.(root, data, loc);
    return;
  }

  root.innerHTML = appShell({
    activeBase: loc.base,
    crumbs: page.crumbs ? page.crumbs(loc) : [],
    content: html`<div class="flex flex-col gap-4">${skeleton({ height: 90 })}${skeleton({ height: 280 })}</div>`
  }).text;
  const view = $('#view');
  const ctx = { rerender: () => {}, reload: async () => {} };
  let data = null;

  const paint = () => {
    if (token !== renderToken) return;
    const el = document.createElement('div');
    el.className = 'view-in';
    el.innerHTML = page.view(data, loc, ctx).text;
    view.replaceChildren(el);
    bindCharts(el);
    page.mount?.(el, data, loc, ctx);
  };
  const load = async () => {
    try {
      data = page.load ? await page.load(loc) : null;
    } catch (error) {
      if (token !== renderToken) return false;
      view.innerHTML = errorMessage(error, { retryAction: 'retry-page' }).text;
      return false;
    }
    return token === renderToken;
  };
  ctx.rerender = paint;
  ctx.reload = async () => { if (await load()) paint(); };
  if (await load()) paint();
}

/* ---------- Acciones globales (barra lateral, barra superior, atajos) ---------- */
document.addEventListener('click', (event) => {
  const actionEl = event.target.closest('[data-action]');
  const menu = $('[data-account-menu]');
  if (menu && !menu.hidden && !event.target.closest('[data-account-menu]') && actionEl?.dataset.action !== 'toggle-account') menu.hidden = true;
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  if (action === 'toggle-sidebar') { setPref('sidebarExpanded', !state.prefs.sidebarExpanded); render(); }
  else if (action === 'open-search') openCommandPalette();
  else if (action === 'set-locale') changeLocale(actionEl.dataset.locale);
  else if (action === 'toggle-account') { const m = $('[data-account-menu]'); if (m) m.hidden = !m.hidden; }
  else if (action === 'logout') logout();
  else if (action === 'open-more') openModal({ title: t('nav.more'), body: moreMenu().text, size: 'sm' });
  else if (action === 'retry-page') render();
});

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && state.user) { event.preventDefault(); openCommandPalette(); }
});

async function changeLocale(locale) {
  if (!locale || locale === getLocale()) return;
  setLocale(locale);
  if (state.user) api.patch('/auth/me', { locale }).catch(() => {});
  render();
}

function logout() {
  setToken(null);
  clearSession();
  navigate('/login');
}

onSessionExpired(() => {
  setToken(null);
  clearSession();
  toast(t('auth.session_expired_toast'), { tone: 'error' });
  navigate('/login');
});

/* ---------- Arranque ---------- */
async function boot() {
  await initI18n();
  if (getToken()) {
    try {
      const me = await api.get('/auth/me');
      setSession(me);
      if (me.user.locale && me.user.locale !== getLocale() && !localStorage.getItem('impulsopyme.locale')) setLocale(me.user.locale);
      api.get('/ai/insights?horizon=7').then((r) => { state.alertCount = r.insights.filter((i) => i.severity === 'high' || i.severity === 'medium').length; }).catch(() => {});
    } catch { setToken(null); }
  }
  startRouter(render);
}

boot();
