import { supabase } from '../lib/supabase';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL_PRODUCTION;

export async function apiRequest(endpoint, options = {}) {
  const baseUrl = API_BASE_URL?.replace(/\/+$/, '');

  if (!baseUrl) {
    throw new Error(
      'API URL is not configured. Check EXPO_PUBLIC_API_URL_LOCAL and EXPO_PUBLIC_API_URL_PRODUCTION in .env'
    );
  }

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;


  // Get the current logged-in user's session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  const response = await fetch(url, {
  ...options,
  body:
    options.body !== undefined && options.body !== null
      ? typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body)
      : undefined,
  headers: {
    'Content-Type': 'application/json',
    ...(accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {}),
    ...(options.headers || {}),
  },
});

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `API ${response.status}: ${text || response.statusText}`
    );
  }

  return response.json();
}