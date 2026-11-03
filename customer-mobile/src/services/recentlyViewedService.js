import { apiRequest } from './api';

export async function recordProductView(productId, token) {
  if (!productId || !token) return null;

  return apiRequest(`/products/${encodeURIComponent(productId)}/view`, {
    method: 'POST',
    token,
  });
}

export async function getRecentlyViewed(token) {
  if (!token) return [];

  const response = await apiRequest(
    '/products/recently-viewed?limit=10',
    {
      method: 'GET',
      token,
    }
  );

  return Array.isArray(response?.data) ? response.data : [];
}
