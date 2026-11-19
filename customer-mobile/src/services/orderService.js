
import { apiRequest } from './api';
import {
  addCartItem,
  clearCart,
  getCart,
} from './cartService';

function getOrderError(error) {
  const message = String(error?.message || '');
  const responseBody = message.match(/^API \d+: ([\s\S]+)$/);

  if (!responseBody) {
    return error;
  }

  try {
    const body = JSON.parse(responseBody[1]);
    if (typeof body?.detail === 'string') {
      return new Error(body.detail, { cause: error });
    }
  } catch {
    return error;
  }

  return error;
}

function getCartLines(items, { allowEmpty = false } = {}) {
  if (!Array.isArray(items)) {
    throw new Error('The cart items were not in the expected format.');
  }

  if (!allowEmpty && items.length === 0) {
    throw new Error('Add at least one item before placing your order.');
  }

  return items.map((item) => {
    const variantId =
      item.variantId ?? item.variant_id ?? item.variant?.id;
    const quantity = Number(item.quantity);

    if (!variantId) {
      throw new Error(
        `${item.name || 'A cart item'} does not have a valid product variant.`
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error(
        `${item.name || 'A cart item'} has an invalid quantity.`
      );
    }

    return { variantId, quantity };
  });
}

async function restoreRemoteCart(token, items) {
  await clearCart(token);

  for (const item of items) {
    await addCartItem({
      token,
      variantId: item.variantId,
      quantity: item.quantity,
    });
  }
}

async function syncRemoteCart(token, items) {
  const requestedItems = getCartLines(items);
  const existingCart = await getCart(token);

  if (!Array.isArray(existingCart?.items)) {
    throw new Error(
      'The saved server cart was not in the expected format.'
    );
  }

  const previousItems = getCartLines(
    existingCart.items.map((item) => ({
      ...item,
      variantId:
        item.variant_id ?? item.variantId ?? item.variant?.id,
    })),
    { allowEmpty: true }
  );

  try {
    await restoreRemoteCart(token, requestedItems);
  } catch (syncError) {
    try {
      await restoreRemoteCart(token, previousItems);
    } catch (restoreError) {
      throw new Error(
        `${syncError.message} The previous server cart could not be restored: ${restoreError.message}`,
        { cause: syncError }
      );
    }

    throw syncError;
  }

  return previousItems;
}

export async function getOrders(token) {
  const response = await apiRequest('/orders', { token });

  if (!Array.isArray(response?.data)) {
    throw new Error(
      'The orders response was not in the expected format.'
    );
  }

  return response.data;
}
export async function downloadOrderInvoice(token, orderId) {
  if (!token) {
    throw new Error('Sign in to download the invoice.');
  }

  if (!orderId) {
    throw new Error('The order ID is missing.');
  }

  const response = await apiRequest(
    `/orders/${encodeURIComponent(orderId)}/invoice`,
    {
      token,
      responseType: 'blob',
    }
  );

  return response;
}
export async function getBuyAgainProducts(token) {
  
  const response = await apiRequest('/orders/buy-again', { token });

  if (!Array.isArray(response?.data)) {
    throw new Error(
      'The Buy Again products response was not in the expected format.'
    );
  }

  return response.data;
}

export async function getOrder(token, orderId) {
  if (!token) {
    throw new Error('Sign in to view this order.');
  }

  if (!orderId) {
    throw new Error('The order ID is missing.');
  }

  const response = await apiRequest(
    `/orders/${encodeURIComponent(orderId)}`,
    { token }
  );

  if (!response?.data || typeof response.data !== 'object') {
    throw new Error(
      'The order response was not in the expected format.'
    );
  }

  return response.data;
}

export async function createOrder({
  token,
  addressId,
  shippingAddress,
  paymentMethod = 'cod',
  items,
  couponCode = null,
  couponPlacement = null,
}) {
  const previousItems = await syncRemoteCart(token, items);
  let response;

  try {
    response = await apiRequest('/orders', {
      method: 'POST',
      token,
      body: {
        address_id: addressId,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        coupon_code: couponCode,
        coupon_placement: couponPlacement,
      },
    });
  } catch (orderError) {
    const readableOrderError = getOrderError(orderError);

    try {
      await restoreRemoteCart(token, previousItems);
    } catch (restoreError) {
      throw new Error(
        `${readableOrderError.message} The previous server cart could not be restored: ${restoreError.message}`,
        { cause: orderError }
      );
    }

    throw readableOrderError;
  }

  if (!response?.data || typeof response.data !== 'object') {
    throw new Error('The order was not returned by the server.');
  }

  return response.data;
}

export async function createBuyNowOrder({
  addressId,
  variantId,
  quantity,
  paymentMethod = 'cod',
  couponCode = null,
  couponPlacement = null,
}) {
  if (!addressId) {
    throw new Error('Please select a delivery address.');
  }

  if (!variantId) {
    throw new Error('The selected product variant is missing.');
  }

  const orderQuantity = Number(quantity);
  if (!Number.isInteger(orderQuantity) || orderQuantity < 1 || orderQuantity > 100) {
    throw new Error('Select a valid quantity between 1 and 100.');
  }

  if (paymentMethod !== 'cod') {
    throw new Error('Only Cash on Delivery is currently supported.');
  }

  if (Boolean(couponCode) !== Boolean(couponPlacement)) {
    throw new Error('Coupon code and placement must be provided together.');
  }

  let response;
  try {
    response = await apiRequest('/orders/buy-now', {
      method: 'POST',
      body: {
        address_id: addressId,
        variant_id: variantId,
        quantity: orderQuantity,
        payment_method: paymentMethod,
        coupon_code: couponCode,
        coupon_placement: couponPlacement,
      },
    });
  } catch (orderError) {
    throw getOrderError(orderError);
  }

  if (
    !response?.data ||
    response.data.success !== true ||
    !response.data.order_id
  ) {
    throw new Error('The Buy Now order was not confirmed.');
  }

  return response.data;
}

export async function validateCustomerCoupon({
  code,
  placement,
  variantId,
  quantity,
}) {
  let response;
  try {
    response = await apiRequest('/orders/coupons/validate', {
      method: 'POST',
      body: {
        code,
        placement,
        ...(variantId
          ? {
              variant_id: variantId,
              quantity,
            }
          : {}),
      },
    });
  } catch (error) {
    throw getOrderError(error);
  }

  if (!response?.data || typeof response.data !== 'object') {
    throw new Error('Coupon validation returned an unexpected response.');
  }

  return response.data;
}

export async function getAvailableCustomerCoupons({
  placement,
  variantId,
  quantity,
}) {
  let response;
  try {
    response = await apiRequest('/orders/coupons/available', {
      method: 'POST',
      body: {
        placement,
        ...(variantId
          ? {
              variant_id: variantId,
              quantity,
            }
          : {}),
      },
    });
  } catch (error) {
    throw getOrderError(error);
  }

  if (!Array.isArray(response?.data)) {
    throw new Error('Available coupons returned an unexpected response.');
  }

  return response.data;
}

/**
 * Fetch return requests for the signed-in customer.
 * Pass orderId to filter requests for a specific order.
 */
export async function getOrderReturnRequests(token, orderId) {
  if (!token) {
    throw new Error('Sign in to view your return requests.');
  }

  const query = orderId
    ? `?order_id=${encodeURIComponent(orderId)}`
    : '';

  const response = await apiRequest(`/returns${query}`, { token });

  if (!Array.isArray(response?.items)) {
    throw new Error(
      'The return requests response was not in the expected format.'
    );
  }

  return response.items;
}

/**
 * Create a return or replacement request for an order item.
 */
export async function createReturnRequest({
  token,
  orderId,
  orderItemId,
  requestType = 'return',
  requestedQuantity = 1,
  reason,
  description,
}) {
  if (!token) {
    throw new Error('Please sign in to request a return.');
  }

  if (!orderId || !orderItemId) {
    throw new Error('Order and order item IDs are required.');
  }

  if (!['return', 'replacement'].includes(requestType)) {
    throw new Error('Choose return or replacement.');
  }

  const quantity = Number(requestedQuantity);

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Enter a valid return quantity.');
  }

  if (!reason?.trim()) {
    throw new Error('Please select a reason for your request.');
  }

  return apiRequest('/returns', {
    method: 'POST',
    token,
    body: {
      order_id: orderId,
      order_item_id: orderItemId,
      request_type: requestType,
      requested_quantity: quantity,
      reason: reason.trim(),
      ...(description?.trim()
        ? { description: description.trim() }
        : {}),
    },
  });
}
