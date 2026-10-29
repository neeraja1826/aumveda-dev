
import { apiRequest } from './api';

function getPayload(response, fallback = null) {
  if (response == null) return fallback;

  const body = response.data ?? response;

  return body?.data ?? body ?? fallback;
}

function getArray(response) {
  const value = getPayload(response, []);
  return Array.isArray(value) ? value : [];
}

const HOME_CACHE_TTL = 5 * 60 * 1000;

let homeCache = null;
let homeCacheTime = 0;
let homeRequest = null;

export async function getHomeData({
  token = null,
  forceRefresh = false,
} = {}) {
  const now = Date.now();

  if (
    !forceRefresh &&
    homeCache &&
    now - homeCacheTime < HOME_CACHE_TTL
  ) {
    return homeCache;
  }

  if (!forceRefresh && homeRequest) {
    return homeRequest;
  }

  const request = (async () => {
    const safeRequest = async (endpoint, fallback) => {
      try {
        return await apiRequest(endpoint);
      } catch (error) {
        console.error(
          `Home API failed: ${endpoint}`,
          error?.message || error
        );

        return fallback;
      }
    };

    const [
      categoriesResponse,
      productsResponse,
      bundlesResponse,
    ] = await Promise.all([
      safeRequest('/home/categories', []),
      safeRequest('/home/featured-products', []),
      safeRequest('/home/bundles', []),
    ]);

    const result = {
      hero: null,
      categories: getArray(categoriesResponse),
      featuredProducts: getArray(productsResponse),
      decorations: [],
      bundles: getArray(bundlesResponse),
    };

    homeCache = result;
    homeCacheTime = Date.now();

    return result;
  })();

  if (!forceRefresh) {
    homeRequest = request;
  }

  try {
    return await request;
  } finally {
    if (homeRequest === request) {
      homeRequest = null;
    }
  }
}

export const getHomeConcerns = async () => {
  const response = await apiRequest('/home/concerns');
  return getArray(response);
};

export async function recordRecentlyViewed(productId, token) {
  if (!productId || !token) return null;

  return apiRequest(`/recently-viewed/${productId}`, {
    method: 'POST',
    token,
  });
}
