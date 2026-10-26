/** Estado global mínimo de la sesión. Los componentes lo leen; solo main.js y las páginas de acceso lo escriben. */
const PREFS_KEY = 'impulsopyme.prefs';

function readPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
}

export const state = {
  user: null,
  business: null,
  aiStatus: null,
  alertCount: 0,
  prefs: { sidebarExpanded: false, ...readPrefs() }
};

export function setPref(key, value) {
  state.prefs[key] = value;
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(state.prefs)); } catch { /* sin almacenamiento */ }
}

export function setSession({ user, business }) {
  state.user = user;
  state.business = business;
}

export function clearSession() {
  state.user = null;
  state.business = null;
  state.aiStatus = null;
  state.alertCount = 0;
}
