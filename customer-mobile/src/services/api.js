
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



export async function apiRequest(endpoint, options = {}) {
  // Build the request URL.
  const baseUrl = API_BASE_URL.replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  const method = options.method || 'GET';
  const timeoutMs = options.timeoutMs ?? 15000;
  const externalSignal = options.signal;

  // Prepare headers.
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (options.body !== undefined && options.body !== null) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const controller = new AbortController();

  let timedOut = false;

  const handleExternalAbort = () => {
    controller.abort();
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      throw new Error(`Request cancelled: ${endpoint}`);
    }

    externalSignal.addEventListener(
      'abort',
      handleExternalAbort,
      { once: true }
    );
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body:
        options.body !== undefined && options.body !== null
          ? JSON.stringify(options.body)
          : undefined,
      signal: controller.signal,
    });

    const text = await response.text();

    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Invalid JSON response from ${endpoint} (HTTP ${response.status}).`
        );
      }
    }

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

  } catch (error) {
    if (timedOut) {
      console.error(`API timeout: ${endpoint}`);

      throw new Error(
        `Request timed out after ${timeoutMs / 1000} seconds: ${endpoint}`
      );
    }

    if (externalSignal?.aborted) {
      console.warn(`Request cancelled externally: ${endpoint}`);

      throw new Error(`Request cancelled: ${endpoint}`);
    }

    console.error(
      `Network error: ${endpoint}`,
      error?.message || String(error)
    );

    if (error?.name === 'AbortError') {
      throw new Error(`Request aborted: ${endpoint}`);
    }

    throw new Error(
      `Cannot connect to the AUMVEDA backend at ${API_BASE_URL}. ` +
      'Check your internet connection and confirm that the backend is available.'
    );

  } finally {
    clearTimeout(timeoutId);

    externalSignal?.removeEventListener(
      'abort',
      handleExternalAbort
    );
  }
}
