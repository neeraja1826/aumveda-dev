import { apiRequest } from './api';

export async function getWishlist(token) {
  const response = await apiRequest('/wishlist', {
    token,
  });

  return response?.data ?? [];
}

export async function addToWishlist(productId, token) {
  return apiRequest(`/wishlist/${productId}`, {
    method: 'POST',
    token,
  });
}

export async function removeFromWishlist(productId, token) {
  return apiRequest(`/wishlist/${productId}`, {
    method: 'DELETE',
    token,
  });
}

export async function getWishlistStatus(productId, token) {
  const response = await apiRequest(
    `/wishlist/${productId}/status`,
    {
      token,
    }
  );

  return response?.data?.wishlisted ?? false;
}