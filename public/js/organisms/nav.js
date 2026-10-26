/** Mapa de navegación: la arquitectura de información de la app vive en un solo lugar. */
export const NAV_GROUPS = [
  { key: 'main', items: [{ path: '/dashboard', icon: 'dashboard', label: 'nav.dashboard' }] },
  { key: 'operation', items: [
    { path: '/sales', icon: 'sales', label: 'nav.sales' },
    { path: '/inventory', icon: 'inventory', label: 'nav.inventory' }
  ] },
  { key: 'relations', items: [
    { path: '/customers', icon: 'customers', label: 'nav.customers' },
    { path: '/suppliers', icon: 'suppliers', label: 'nav.suppliers' }
  ] },
  { key: 'intelligence', items: [
    { path: '/ai', icon: 'ai', label: 'nav.ai' },
    { path: '/reports', icon: 'reports', label: 'nav.reports' }
  ] }
];

export const SETTINGS_ITEM = { path: '/settings', icon: 'settings', label: 'nav.settings' };

export const ALL_ITEMS = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS_ITEM];
export const MOBILE_PRIMARY = ['/dashboard', '/sales', '/inventory', '/ai'];
