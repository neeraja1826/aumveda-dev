
const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');

if (!baseUrl) {
  throw new Error('VITE_API_BASE_URL is not configured.');
}

const TOKEN_KEY = 'admin_access_token';

export function getAdminToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAdminToken(token) {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    throw new Error(
      `Unable to save admin token: ${error.message}`,
      { cause: error }
    );
  }
}

export async function apiRequest(path, options = {}) {
  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;

  const headers = new Headers(options.headers || {});
  const token = getAdminToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (
    options.body != null &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  let response;

  try {
    response = await fetch(`${baseUrl}${normalizedPath}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(
      `Cannot reach the admin API at ${baseUrl}: ${error.message}`,
      { cause: error }
    );
  }

  let result = null;
  const contentType = response.headers.get('content-type') || '';

  if (response.status !== 204) {
    if (contentType.includes('application/json')) {
      result = await response.json();
    } else {
      result = await response.text();
    }
  }

  if (!response.ok) {
    const detail =
      result && typeof result === 'object'
        ? result.detail || result.message
        : result;

    throw new Error(
      detail || `API request failed (HTTP ${response.status}).`
    );
  }

  return result;
}
