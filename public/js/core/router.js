/**
 * Enrutador por hash (#/inventario?estado=bajo). Funciona igual en el navegador y dentro de Electron,
 * sin configurar el servidor. Cada ruta declara si necesita sesión.
 */
const routes = new Map();
let notFoundRoute = null;
let handler = null;

export function defineRoutes(table, fallback) {
  Object.entries(table).forEach(([path, route]) => routes.set(path, route));
  notFoundRoute = fallback;
}

export function parseHash(hash = window.location.hash) {
  const raw = hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart = ''] = raw.split('?');
  const path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  const segments = path.split('/').filter(Boolean);
  const base = `/${segments[0] || ''}`;
  return { path, base, param: segments[1] || null, query: Object.fromEntries(new URLSearchParams(queryPart)) };
}

export function navigate(path, { replace = false } = {}) {
  const target = `#${path}`;
  if (window.location.hash === target) { handler?.(); return; }
  if (replace) window.history.replaceState(null, '', target);
  else window.location.hash = path;
  if (replace) handler?.();
}

export function link(path, query) {
  const qs = query ? `?${new URLSearchParams(query)}` : '';
  return `#${path}${qs}`;
}

export function resolve(location) {
  return routes.get(location.base) || notFoundRoute;
}

export function startRouter(onChange) {
  handler = onChange;
  window.addEventListener('hashchange', onChange);
  onChange();
}

export const refresh = () => handler?.();
