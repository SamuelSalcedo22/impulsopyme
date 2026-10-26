/** Cliente HTTP del backend. Lanza ApiError con el código estable que el servidor define. */
const TOKEN_KEY = 'impulsopyme.token';

export class ApiError extends Error {
  constructor(status, code, params) {
    super(code);
    this.status = status;
    this.code = code;
    this.params = params || {};
  }
}

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (token) => { try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); } catch { /* sin almacenamiento */ } };

const listeners = new Set();
export const onSessionExpired = (fn) => listeners.add(fn);

async function request(method, path, body) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'common.offline');
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = data.error || { code: 'common.unexpected', params: {} };
    if (response.status === 401 && error.code.startsWith('auth.session')) listeners.forEach((fn) => fn());
    throw new ApiError(response.status, error.code, error.params);
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body = {}) => request('POST', path, body),
  put: (path, body = {}) => request('PUT', path, body),
  patch: (path, body = {}) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path)
};

/** Descarga un archivo autenticado (CSV) y lo entrega al navegador. */
export async function download(path, filename) {
  const response = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!response.ok) throw new ApiError(response.status, 'common.unexpected');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
