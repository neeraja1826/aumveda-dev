const LOCAL_API_URL = process.env.EXPO_PUBLIC_API_URL_LOCAL;
const PRODUCTION_API_URL =
  process.env.EXPO_PUBLIC_API_URL_PRODUCTION;

export const API_BASE_URL =
  PRODUCTION_API_URL || LOCAL_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    'API URL is missing. Set EXPO_PUBLIC_API_URL_PRODUCTION or EXPO_PUBLIC_API_URL_LOCAL.'
  );
}

export const APP_NAME =
  process.env.EXPO_PUBLIC_APP_NAME || 'AUMVEDA';
export const API_TIMEOUT = Number(
  process.env.EXPO_PUBLIC_API_TIMEOUT || 15000
);
