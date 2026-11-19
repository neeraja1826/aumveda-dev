import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../constants/config';

const REVIEW_IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function pickReviewImage() {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Allow photo library access to choose a review image.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets?.[0];
  if (!asset?.uri) {
    throw new Error('Unable to read the selected review image.');
  }

  const fileExtension = asset.fileName
    ?.split('.')
    .pop()
    ?.toLowerCase();
  const inferredType = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  }[fileExtension];
  const mimeType = asset.mimeType?.toLowerCase() || inferredType;

  if (!mimeType || !REVIEW_IMAGE_EXTENSIONS[mimeType]) {
    throw new Error('Choose a JPEG, PNG, or WebP image.');
  }

  const extension = REVIEW_IMAGE_EXTENSIONS[mimeType];

  return {
    ...asset,
    fileName: asset.fileName || `review.${extension}`,
    mimeType,
  };
}

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
  image,
  token,
}) {
  const url = `${API_BASE_URL}/reviews`;

  try {
    console.log('Review POST URL:', url);

    if (!token) {
      throw new Error('Please log in to submit a review.');
    }

    const payload = {
      product_id: productId,
      rating,
      title: title?.trim() || null,
      review_text: reviewText?.trim() || null,
      ...(orderItemId ? { order_item_id: orderItemId } : {}),
    };
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    let body;

    if (image) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      formData.append('image', {
        uri: image.uri,
        name: image.fileName || 'review-image.jpg',
        type: image.mimeType || 'image/jpeg',
      });
      body = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(payload);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
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
