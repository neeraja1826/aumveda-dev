import { apiRequest } from './api';

export async function getCart(token) {
  const response = await apiRequest('/cart', { token });
  return response?.data ?? null;
}

export async function addCartItem({
  token,
  variantId,
  quantity = 1,
}) {
  const response = await apiRequest('/cart/items', {
    method: 'POST',
    token,
    body: {
      variant_id: variantId,
      quantity,
    },
  });

  return response?.data ?? null;
}

export async function updateCartItem(token, itemId, quantity) {
  const response = await apiRequest(
    `/cart/items/${encodeURIComponent(itemId)}`,
    {
      method: 'PATCH',
      token,
      body: { quantity },
    }
  );

  return response?.data ?? null;
}

export async function removeCartItem(token, itemId) {
  const response = await apiRequest(
    `/cart/items/${encodeURIComponent(itemId)}`,
    { method: 'DELETE', token }
  );

  return response?.data ?? null;
}

export async function clearCart(token) {
  const response = await apiRequest('/cart', {
    method: 'DELETE',
    token,
  });
  return response?.data ?? null;
}