import { apiRequest } from './api';


// ============================================================
// RECORD PRODUCT VIEW
// ============================================================

export async function recordRecentlyViewed(
  productId,
  token
) {
  if (!productId || !token) {
    return null;
  }

  return apiRequest(
    '/recently-viewed',
    {
      method: 'POST',

      token,

      body: {
        product_id: String(productId),
      },
    }
  );
}


// ============================================================
// GET RECENTLY VIEWED
// ============================================================

export async function getRecentlyViewed(
  token
) {
  if (!token) {
    return [];
  }

  const response =
    await apiRequest(
      '/recently-viewed',
      {
        method: 'GET',
        token,
      }
    );

  return response?.data ?? [];
}