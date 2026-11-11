import { supabase } from '../lib/supabase';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL_PRODUCTION;
console.log("AUMVEDA API BASE URL:", API_BASE_URL);
export async function apiRequest(endpoint, options = {}) {
  const baseUrl = API_BASE_URL?.replace(/\/+$/, '');

  if (!baseUrl) {
    throw new Error(
      'API URL is not configured. Check EXPO_PUBLIC_API_URL_LOCAL and EXPO_PUBLIC_API_URL_PRODUCTION in .env'
    );
  }

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  const {
    responseType,
    token: _token,
    ...requestOptions
  } = options;

  const response = await fetch(url, {
    ...requestOptions,
    body:
      requestOptions.body !== undefined &&
      requestOptions.body !== null
        ? typeof requestOptions.body === 'string'
          ? requestOptions.body
          : JSON.stringify(requestOptions.body)
        : undefined,
    headers: {
      ...(requestOptions.body !== undefined &&
      requestOptions.body !== null
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {}),
      ...(requestOptions.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `API ${response.status}: ${text || response.statusText}`
    );
  }

  if (responseType === 'blob') {
    return response.blob();
  }

  if (responseType === 'arrayBuffer') {
    return response.arrayBuffer();
  }

  return response.json();
}