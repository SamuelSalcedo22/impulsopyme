import { state, setPref } from './state.js';

/**
 * Modo claro y oscuro. La preferencia puede ser 'system' (sigue al sistema operativo), 'light' o 'dark'.
 * Solo cambia el atributo data-theme de <html>; los colores salen de los tokens semánticos.
 */
const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
const META = { light: '#F5EFE8', dark: '#18191B' };

export function themePref() {
  return ['light', 'dark'].includes(state.prefs.theme) ? state.prefs.theme : 'system';
}

export function currentTheme() {
  const pref = themePref();
  if (pref !== 'system') return pref;
  return media && media.matches ? 'light' : 'dark';
}

export function applyTheme() {
  const theme = currentTheme();
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META[theme]);
  return theme;
}

export function setTheme(pref, onChange) {
  setPref('theme', pref);
  applyTheme();
  onChange?.();
}

/** Cambio rápido desde la barra: pasa al tema contrario del que se ve ahora. */
export function toggleTheme(onChange) {
  setTheme(currentTheme() === 'light' ? 'dark' : 'light', onChange);
}

export function watchSystemTheme(onChange) {
  media?.addEventListener?.('change', () => { if (themePref() === 'system') { applyTheme(); onChange?.(); } });
}
