
import { apiRequest } from './api';

function normalizeProduct(response) {
  const product = response?.data ?? response;

  if (
    !product ||
    typeof product !== 'object' ||
    Array.isArray(product)
  ) {
    return null;
  }

  const images = Array.isArray(product.product_images)
    ? product.product_images
    : [];

  const variants = Array.isArray(product.product_variants)
    ? product.product_variants
    : [];

  const variant =
    product.variant ??
    variants.find((item) => item.is_default) ??
    variants.find((item) => item.is_active) ??
    variants[0] ??
    null;

  return {
    ...product,

    image:
      product.image ??
      product.image_url ??
      product.thumbnail ??
      images.find((item) => item.is_primary)?.image_url ??
      images[0]?.image_url ??
      null,

    rating: product.rating ?? product.average_rating ?? 0,
    review_count: product.review_count ?? 0,

    variant,

    price: product.price ?? variant?.price ?? 0,

    compare_at_price:
      product.compare_at_price ??
      variant?.compare_at_price ??
      0,

    description:
      product.description ??
      product.short_description ??
      '',

    related_products: Array.isArray(product.related_products)
      ? product.related_products
      : [],
  };
}

export async function getProducts({
  search,
  categoryId,
  subcategoryId,
  limit = 20,
  offset = 0,
} = {}) {
  const params = new URLSearchParams();

  params.append('limit', String(limit));
  params.append('offset', String(offset));

  if (categoryId && String(categoryId).toLowerCase() !== 'all') {
    params.append('category_id', String(categoryId));
  }

  if (subcategoryId && String(subcategoryId).toLowerCase() !== 'all') {
    params.append('subcategory_id', String(subcategoryId));
  }

  const response = await apiRequest(
    `/products?${params.toString()}`
  );

  const list = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.products)
        ? response.products
        : [];

  let products = list
    .map(normalizeProduct)
    .filter(Boolean);

  const term = String(search ?? '').trim().toLowerCase();

  if (term) {
    products = products.filter((product) =>
      [
        product.name,
        product.slug,
        product.description,
        product.short_description,
      ].some((value) =>
        String(value ?? '').toLowerCase().includes(term)
      )
    );
  }

  return products;
}

export async function getProductBySlug(slug) {
  const response = await apiRequest(
    `/products/${encodeURIComponent(slug)}`
  );

  const product = normalizeProduct(response);

  if (!product) {
    return null;
  }

  // Keep API-provided related products if they exist.
  if (product.related_products.length > 0) {
    return product;
  }

  // Otherwise, use existing products as similar-product candidates.
  try {
    const products = await getProducts({
      limit: 20,
      offset: 0,
    });

    console.log("CURRENT PRODUCT:", product.id, product.name);
    console.log("PRODUCT CATEGORY:", product.category_id);
    console.log("PRODUCT LIST COUNT:", products.length);

    const otherProducts = products.filter(
      (item) => String(item.id) !== String(product.id)
    );

    // Prefer products from the same category when category IDs exist.
    const sameCategory = product.category_id
      ? otherProducts.filter(
          (item) =>
            String(item.category_id) ===
            String(product.category_id)
        )
      : [];

    console.log(
        "SIMILAR PRODUCTS:",
        (sameCategory.length > 0 ? sameCategory : otherProducts)
          .slice(0, 4)
          .map((item) => ({ id: item.id, name: item.name }))
    );

    return {
      ...product,
      related_products: (
        sameCategory.length > 0
          ? sameCategory
          : otherProducts
      ).slice(0, 4),
    };
  } catch (error) {
    console.warn(
      'Could not load similar products:',
      error?.message || error
    );

    // A recommendation failure must not break product details.
    return product;
  }
}

export async function getProductById(productId) {
  const response = await apiRequest(
    `/products/${encodeURIComponent(productId)}`
  );

  return normalizeProduct(response);
}
