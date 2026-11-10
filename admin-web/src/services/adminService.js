
import { apiRequest } from './api.js';

const resources = {
  products: '/admin/products',
  categories: '/admin/categories',
  vendors: '/admin/vendors',
  customers: '/admin/customers',
  orders: '/admin/orders',
  inventory: '/admin/inventory/transactions',
  reviews: '/admin/reviews',
  settings: '/admin/settings',
  support: '/admin/support/tickets',
};

export const getDashboardSummary = () =>
  apiRequest('/admin/dashboard/summary');

export const getReportsOverview = () =>
  apiRequest('/admin/reports/overview');

export function getResource(resource, params = {}) {
  if (resource === 'finance') {
    const section = params.section || 'payments';
    const query = new URLSearchParams(params.query || {});
    const queryString = query.toString();

    return apiRequest(
      `/admin/finance/${section}${
        queryString ? `?${queryString}` : ''
      }`
    );
  }

  if (resource === 'reports') {
    const report = params.report || 'orders';
    const query = new URLSearchParams(params.query || {});
    const queryString = query.toString();

    return apiRequest(
      `/admin/reports/${report}${
        queryString ? `?${queryString}` : ''
      }`
    );
  }

  const path = resources[resource];

  if (!path) {
    throw new Error(
      `Unsupported admin resource: ${resource}`
    );
  }

  const query = new URLSearchParams(params);
  const queryString = query.toString();

  return apiRequest(
    `${path}${queryString ? `?${queryString}` : ''}`
  );
}

/* ============================================================
   CATEGORIES
============================================================ */

export const createCategory = (category) =>
  apiRequest('/admin/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: category.name.trim(),
      slug: category.slug.trim().toLowerCase(),
      parent_id: category.parent_id || null,
      description: category.description || null,
      image_url: category.image_url || null,
      show_on_home: category.show_on_home ?? false,
      home_sort_order: Number(
        category.home_sort_order ?? 0
      ),
      sort_order: Number(
        category.sort_order ?? 0
      ),
      is_active: category.is_active ?? true,
    }),
  });

/* ============================================================
   PRODUCTS
============================================================ */

export const getProduct = (productId) =>
  apiRequest(
    `/admin/products/${encodeURIComponent(productId)}`
  );

export const createProduct = (product) =>
  apiRequest('/admin/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });

export const updateProduct = (productId, product) =>
  apiRequest(
    `/admin/products/${encodeURIComponent(productId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(product),
    }
  );

export const archiveProduct = (productId) =>
  apiRequest(
    `/admin/products/${encodeURIComponent(productId)}`,
    {
      method: 'DELETE',
    }
  );

/* ============================================================
   RESOURCE STATUS
============================================================ */

export function updateResourceStatus(
  resource,
  id,
  value
) {
  const encodedId = encodeURIComponent(id);

  if (resource === 'orders') {
    return apiRequest(
      `/admin/orders/${encodedId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: value,
        }),
      }
    );
  }

  const paths = {
    products:
      `/admin/products/${encodedId}/status?new_status=${encodeURIComponent(
        value
      )}`,

    vendors:
      `/admin/vendors/${encodedId}/status?new_status=${encodeURIComponent(
        value
      )}`,

    reviews:
      `/admin/reviews/${encodedId}/status?new_status=${encodeURIComponent(
        value
      )}`,

    customers:
      `/admin/customers/${encodedId}/active?is_active=${encodeURIComponent(
        value
      )}`,
  };

  if (!paths[resource]) {
    throw new Error(
      `Status updates are not supported for ${resource}.`
    );
  }

  return apiRequest(paths[resource], {
    method: 'PATCH',
  });
}

/* ============================================================
   CATEGORY UPDATE
============================================================ */

export const updateCategory = (
  categoryId,
  category
) =>
  apiRequest(
    `/admin/categories/${encodeURIComponent(
      categoryId
    )}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        name: category.name.trim(),
        slug: category.slug
          .trim()
          .toLowerCase(),
        parent_id: category.parent_id || null,
        description:
          category.description ?? null,
        image_url:
          category.image_url ?? null,
      }),
    }
  );

// Update category settings
export const updateCategorySettings = (
  categoryId,
  changes
) =>
  apiRequest(
    `/admin/categories/${encodeURIComponent(
      categoryId
    )}`,
    {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }
  );

// Delete category
export const deleteCategory = (categoryId) =>
  apiRequest(
    `/admin/categories/${encodeURIComponent(
      categoryId
    )}`,
    {
      method: 'DELETE',
    }
  );

/* ============================================================
   VENDORS
============================================================ */

export const updateVendorActiveStatus = (
  vendorId,
  isActive
) =>
  apiRequest(
    `/admin/vendors/${encodeURIComponent(
      vendorId
    )}/active?is_active=${isActive}`,
    {
      method: 'PATCH',
    }
  );

export const getVendorDetails = (vendorId) =>
  apiRequest(
    `/admin/vendors/${encodeURIComponent(vendorId)}`
  );

export async function createVendor(payload) {
  return apiRequest('/admin/vendors/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/* ============================================================
   INVENTORY
============================================================ */

export const getInventoryStock = (
  params = {}
) => {
  const query = new URLSearchParams(params)
    .toString();

  return apiRequest(
    `/admin/inventory/stock${
      query ? `?${query}` : ''
    }`
  );
};

export const adjustInventoryStock = (
  payload
) =>
  apiRequest(
    '/admin/inventory/stock/adjust',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

/* ============================================================
   ORDERS
============================================================ */

export const getOrderDetails = (orderId) =>
  apiRequest(
    `/admin/orders/${encodeURIComponent(orderId)}`
  );

/* ============================================================
   RETURNS
============================================================ */

export const getReturnRequests = (
  params = {}
) => {
  const query = new URLSearchParams();

  if (params.status) {
    query.set('status', params.status);
  }

  query.set(
    'limit',
    String(params.limit ?? 50)
  );

  query.set(
    'offset',
    String(params.offset ?? 0)
  );

  return apiRequest(
    `/admin/returns?${query.toString()}`
  );
};

export const updateReturnRequestStatus = (
  returnId,
  status,
  notes = ''
) => {
  if (!returnId) {
    throw new Error(
      'Return request ID is required.'
    );
  }

  return apiRequest(
    `/admin/returns/${encodeURIComponent(
      returnId
    )}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        ...(notes.trim()
          ? { notes: notes.trim() }
          : {}),
      }),
    }
  );
};

/* ============================================================
   PRODUCT IMAGES
============================================================ */

export const replaceProductImage = (
  productId,
  imageId,
  file
) => {
  const body = new FormData();

  body.append('file', file);

  return apiRequest(
    `/admin/products/${encodeURIComponent(
      productId
    )}/images/${encodeURIComponent(
      imageId
    )}/replace`,
    {
      method: 'POST',
      body,
    }
  );
};

export const addProductImage = (
  productId,
  image,
  file
) => {
  const body = new FormData();

  body.append('file', file);
  body.append(
    'alt_text',
    image.alt_text || ''
  );
  body.append(
    'sort_order',
    String(image.sort_order ?? 0)
  );
  body.append(
    'is_primary',
    String(Boolean(image.is_primary))
  );

  if (image.variant_id) {
    body.append(
      'variant_id',
      image.variant_id
    );
  }

  return apiRequest(
    `/admin/products/${encodeURIComponent(
      productId
    )}/images`,
    {
      method: 'POST',
      body,
    }
  );
};

/* ============================================================
   COUPONS
============================================================ */

export const getCoupons = (params = {}) => {
  const query = new URLSearchParams(params)
    .toString();

  return apiRequest(
    `/admin/coupons${
      query ? `?${query}` : ''
    }`
  );
};

export const createCoupon = (coupon) =>
  apiRequest('/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(coupon),
  });

export const updateCoupon = (
  couponId,
  coupon
) =>
  apiRequest(
    `/admin/coupons/${encodeURIComponent(
      couponId
    )}`,
    {
      method: 'PATCH',
      body: JSON.stringify(coupon),
    }
  );

export const updateCouponActiveStatus = (
  couponId,
  isActive
) =>
  apiRequest(
    `/admin/coupons/${encodeURIComponent(
      couponId
    )}/active?is_active=${isActive}`,
    {
      method: 'PATCH',
    }
  );

/* ============================================================
   NOTIFICATIONS
============================================================ */

export const getAdminNotifications = (
  params = {}
) => {
  const query = new URLSearchParams();

  if (
    params.is_read !== undefined &&
    params.is_read !== ''
  ) {
    query.set(
      'is_read',
      String(params.is_read)
    );
  }

  if (params.notification_type) {
    query.set(
      'notification_type',
      params.notification_type
    );
  }

  query.set(
    'limit',
    String(params.limit ?? 50)
  );

  query.set(
    'offset',
    String(params.offset ?? 0)
  );

  return apiRequest(
    `/admin/notifications?${query.toString()}`
  );
};

export const getAdminUnreadCount = () =>
  apiRequest(
    '/admin/notifications/unread-count'
  );

export const markAdminNotificationRead = (
  notificationId
) =>
  apiRequest(
    `/admin/notifications/${encodeURIComponent(
      notificationId
    )}/read`,
    {
      method: 'PATCH',
    }
  );

export const markAllAdminNotificationsRead =
  () =>
    apiRequest(
      '/admin/notifications/read-all',
      {
        method: 'PATCH',
      }
    );

/* ============================================================
   SUPPORT
============================================================ */

export async function getSupportSummary() {
  return apiRequest(
    '/admin/support/summary'
  );
}

export async function getSupportTickets(
  params = {}
) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {
        query.append(key, value);
      }
    }
  );

  const queryString = query.toString();

  return apiRequest(
    `/admin/support/tickets${
      queryString
        ? `?${queryString}`
        : ''
    }`
  );
}

export async function getSupportTicket(
  ticketId
) {
  return apiRequest(
    `/admin/support/tickets/${ticketId}`
  );
}

export async function updateSupportTicket(
  ticketId,
  payload
) {
  return apiRequest(
    `/admin/support/tickets/${ticketId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
}

export async function replySupportTicket(
  ticketId,
  message
) {
  return apiRequest(
    `/admin/support/tickets/${ticketId}/reply`,
    {
      method: 'POST',
      body: JSON.stringify({
        message,
      }),
    }
  );
}

/* ============================================================
   APP PROMOTIONAL BANNERS
   Deals of the Week / Home Banner
============================================================ */

export async function getBanners(
  params = {}
) {
  const query = new URLSearchParams();

  if (params.platform) {
    query.append('platform', params.platform);
  }

  if (params.placement) {
    query.append('placement', params.placement);
  }

  if (params.publish_status) {
    query.append('publish_status', params.publish_status);
  }

  const queryString = query.toString();

  return apiRequest(
    `/admin/banners${queryString ? `?${queryString}` : ''}`
  );
}

export async function getWebCategoryCampaignBanners() {
  return getBanners({
    platform: 'web',
    placement: 'category-campaign',
  });
}

export async function getWebHeroBanners() {
  return apiRequest(
    '/admin/banners?platform=web&placement=hero'
  );
}

export async function createWebHeroBanner(formData) {
  return apiRequest('/admin/banners', {
    method: 'POST',
    body: formData,
  });
}

export async function createBanner(
  formData
) {
  return apiRequest('/admin/banners', {
    method: 'POST',
    body: formData,
  });
}

export async function updateBanner(bannerId, formData) {
  return apiRequest(
    `/admin/banners/${encodeURIComponent(bannerId)}`,
    {
      method: 'PATCH',
      body: formData,
    }
  );
}

export async function deleteBanner(bannerId) {
  return apiRequest(
    `/admin/banners/${encodeURIComponent(bannerId)}`,
    {
      method: 'DELETE',
    }
  );
}

/* ============================================================
   APP CATEGORY BANNERS
============================================================ */

export async function getCategoryBanners(
  params = {}
) {
  const query = new URLSearchParams();

  if (params.category_id) {
    query.append(
      'category_id',
      params.category_id
    );
  }

  if (params.publish_status) {
    query.append(
      'publish_status',
      params.publish_status
    );
  }

  const queryString = query.toString();

  return apiRequest(
    `/admin/banners/category${
      queryString
        ? `?${queryString}`
        : ''
    }`
  );
}

export async function createCategoryBanner(
  formData
) {
  return apiRequest(
    '/admin/banners/category',
    {
      method: 'POST',
      body: formData,
    }
  );
}
/* ============================================================
   ADMIN CATEGORY CAMPAIGNS
============================================================ */

export async function getCategoryCampaigns(params = {}) {
  const query = new URLSearchParams();

  // App or Web
  if (params.platform) {
    query.append('platform', params.platform);
  }

  // Optional category filter
  if (params.category_id) {
    query.append('category_id', params.category_id);
  }

  // Optional active/inactive filter
  if (params.is_active !== undefined) {
    query.append('is_active', String(params.is_active));
  }

  const queryString = query.toString();

  return apiRequest(
    `/admin/banners/category-campaigns${
      queryString ? `?${queryString}` : ''
    }`
  );
}


export async function createCategoryCampaign(formData) {
  return apiRequest('/admin/banners/category-campaigns', {
    method: 'POST',
    body: formData,
  });
}


export async function updateCategoryCampaign(
  campaignId,
  formData
) {
  return apiRequest(
    `/admin/banners/category-campaigns/${encodeURIComponent(
      campaignId
    )}`,
    {
      method: 'PATCH',
      body: formData,
    }
  );
}


export async function deleteCategoryCampaign(
  campaignId,
  platform
) {
  const query = new URLSearchParams();

  query.append('platform', platform);

  return apiRequest(
    `/admin/banners/category-campaigns/${encodeURIComponent(
      campaignId
    )}?${query.toString()}`,
    {
      method: 'DELETE',
    }
  );
}
export async function getShopByNeedImages() {
  return apiRequest('/admin/banners/storage/shop-by-need');
}
export async function syncShopByNeed() {
  return apiRequest('/admin/banners/storage/sync-shop-by-need', {
    method: 'POST',
  });
}
export async function getMainPromoBanners() {
  return apiRequest('/admin/banners/storage/main-promo-banner');
}

export async function syncMainPromoBanners() {
  return apiRequest('/admin/banners/storage/sync-main-promo-banner', {
    method: 'POST',
  });
}