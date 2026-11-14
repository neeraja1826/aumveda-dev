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
      bannersResponse,
      categoriesResponse,
      productsResponse,
      couponsResponse,
      newArrivalsResponse,
      campaignsResponse,
      categoryBannersResponse,
      homeConfigurationResponse,
    ] = await Promise.all([
      safeRequest('/home/app-banners', []),
      safeRequest('/home/categories', []),
      safeRequest('/home/featured-products', []),
      safeRequest('/home/coupons', []),
      safeRequest('/home/new-arrivals', []),
      safeRequest('/home/category-campaigns', []),

      // Category banners uploaded from Admin Web
      safeRequest('/home/category-banners', []),
      safeRequest(
        '/home/configuration?platform=app&page=home',
        { sections: [] }
      ),
    ]);

    const homeConfiguration = getPayload(
      homeConfigurationResponse,
      {}
    );

    const result = {
      hero: null,

      // Existing home banners
      banners: getArray(bannersResponse),

      // Existing categories
      categories: getArray(categoriesResponse),

      // Existing products
      featuredProducts: getArray(productsResponse),

      decorations: [],

      coupons: getArray(couponsResponse),
      newArrivals: getArray(newArrivalsResponse),
      categoryCampaigns: getArray(campaignsResponse),

      // NEW: Category promotional banners
      categoryBanners: getArray(categoryBannersResponse),

      homeSections: Array.isArray(homeConfiguration?.sections)
        ? homeConfiguration.sections
        : [],
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