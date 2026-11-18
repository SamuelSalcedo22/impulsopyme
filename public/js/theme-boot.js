/* Aplica el tema antes de pintar, para que no parpadee. Lo completa core/theme.js. */
(function () {
  var pref = 'system';
  try { pref = (JSON.parse(localStorage.getItem('impulsopyme.prefs')) || {}).theme || 'system'; } catch (e) { /* sin almacenamiento */ }
  var light = pref === 'light' || (pref === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches);
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
})();
