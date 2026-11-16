import { API_BASE_URL } from '../constants/config';
/**
 * Get approved reviews for a product.
 */
export async function getProductReviews(productId) {
  const url = `${API_BASE_URL}/reviews/product/${encodeURIComponent(
    productId
  )}`;

  try {
    console.log('Review GET URL:', url);

    const response = await fetch(url);
    const responseText = await response.text();

    console.log('Review GET status:', response.status);
    console.log('Review GET response:', responseText);

console.log('Review API status:', response.status);
console.log('Review API response:', responseText);
    if (!response.ok) {
      throw new Error(
        `Unable to load product reviews (${response.status}).`
      );
    }

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error('Invalid response received from reviews API.');
    }

    return Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    console.log('Review GET error:', error.message);
    throw error;
  }
}

export async function getCustomerOrderReviews(token, orderId, signal) {
  if (!token) {
    throw new Error('Please log in to view your order reviews.');
  }

  if (!orderId) {
    throw new Error('Order ID is required.');
  }

  const response = await fetch(
    `${API_BASE_URL}/reviews/order/${encodeURIComponent(orderId)}`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal,
    }
  );
  const responseText = await response.text();
  let result;

  try {
    result = responseText ? JSON.parse(responseText) : {};
  } catch {
    if (response.ok) {
      throw new Error('The server returned an invalid order reviews response.');
    }
    result = {};
  }

  if (!response.ok) {
    const detail = result.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : result.message || `Unable to load order reviews (${response.status}).`;

    throw new Error(message);
  }

  if (!Array.isArray(result.data)) {
    throw new Error('The order reviews response was not in the expected format.');
  }

  return result.data;
}

/**
 * Submit a product review.
 * The backend must verify authentication and purchase eligibility.
 */
export async function submitProductReview({
  productId,
  rating,
  title,
  reviewText,
  orderItemId,
  token,
}) {
  const url = `${API_BASE_URL}/reviews`;

  try {
    console.log('Review POST URL:', url);

    if (!token) {
      throw new Error('Please log in to submit a review.');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: productId,
        rating,
        title: title?.trim() || null,
        review_text: reviewText?.trim() || null,
        ...(orderItemId ? { order_item_id: orderItemId } : {}),
      }),
    });

    const responseText = await response.text();

    console.log('Review API status:', response.status);
    console.log('Review API response:', responseText);

    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error(
        `The server returned an invalid response (${response.status}).`
      );
    }

    if (!response.ok) {
      const detail = result.detail;

      const message =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail
                .map((item) => item.msg || JSON.stringify(item))
                .join(', ')
            : result.message ||
              `Unable to submit review (${response.status}).`;

      throw new Error(message);
    }

    return result;
  } catch (error) {
    console.log('Review POST error:', error.message);
    throw error;
  }
}
