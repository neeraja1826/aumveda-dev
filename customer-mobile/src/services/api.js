
import { API_BASE_URL } from '../constants/config';

/**
 * Shared API request function for the AUMVEDA mobile app.
 *
 * Supports:
 * - GET, POST, PUT, PATCH, DELETE
 * - Optional Bearer token authentication
 * - Custom request headers
 * - JSON request and response handling
 * - Clear error messages for failed requests
 * - Deployed Render backend connectivity
 */

console.log('ACTIVE API BASE URL:', API_BASE_URL);

export async function apiRequest(endpoint, options = {}) {
  // Avoid duplicate slashes between the base URL and endpoint.
  const baseUrl = API_BASE_URL.replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  const method = options.method || 'GET';

  // Prepare request headers.
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  // Set JSON content type when sending a body.
  if (options.body !== undefined && options.body !== null) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach authentication only when a token is provided.
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  console.log(`API ${method}: ${url}`);
  console.log(
    'API AUTH:',
    options.token ? 'Bearer token attached' : 'Public request'
  );

  let response;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {
    response = await fetch(url, {
      method,
      headers,
      body:
        options.body !== undefined && options.body !== null
          ? JSON.stringify(options.body)
          : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    console.error(
      `Network error: ${endpoint}`,
      error?.message || String(error)
    );

    if (error?.name === 'AbortError') {
      throw new Error(
        `Request timed out after 15 seconds: ${endpoint}`
      );
    }

    throw new Error(
      `Cannot connect to the AUMVEDA backend at ${API_BASE_URL}. ` +
      'Check your internet connection and confirm that the backend is available.'
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // Read the response body.
  const text = await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `Invalid JSON response from ${endpoint} ` +
        `(HTTP ${response.status}).`
      );
    }
  }

  console.log(`API RESULT: ${endpoint} — HTTP ${response.status}`);

  // Handle unsuccessful HTTP responses.
  if (!response.ok) {
    const detail = data?.detail ?? data?.message ?? data;

    const message = Array.isArray(detail)
      ? detail
          .map((item) => {
            const field = Array.isArray(item.loc)
              ? item.loc.join('.')
              : 'field';

            return `${field}: ${item.msg ?? JSON.stringify(item)}`;
          })
          .join('; ')
      : typeof detail === 'string'
        ? detail
        : JSON.stringify(detail);

    throw new Error(
      `${endpoint}: ${message || `HTTP ${response.status}`}`
    );
  }

  return data;
}
