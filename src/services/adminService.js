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
      `/admin/finance/${section}${queryString ? `?${queryString}` : ''}`
    );
  }

  if (resource === 'reports') {
    const report = params.report || 'orders';
    const query = new URLSearchParams(params.query || {});
    const queryString = query.toString();

    return apiRequest(
      `/admin/reports/${report}${queryString ? `?${queryString}` : ''}`
    );
  }

  const path = resources[resource];

  if (!path) {
    throw new Error(`Unsupported admin resource: ${resource}`);
  }

  const query = new URLSearchParams(params);
  const queryString = query.toString();

  return apiRequest(`${path}${queryString ? `?${queryString}` : ''}`);
}

export const createCategory = (category) =>
  apiRequest('/admin/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: category.name.trim(),
      slug: category.slug.trim().toLowerCase(),
      parent_id: category.parent_id ?? null,
    }),
  });

export const getProduct = (productId) =>
  apiRequest(`/admin/products/${encodeURIComponent(productId)}`);

export const createProduct = (product) =>
  apiRequest('/admin/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });

export const updateProduct = (productId, product) =>
  apiRequest(`/admin/products/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    body: JSON.stringify(product),
  });

export const archiveProduct = (productId) =>
  apiRequest(`/admin/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });

export function updateResourceStatus(resource, id, value) {
  const encodedId = encodeURIComponent(id);

  if (resource === 'orders') {
    return apiRequest(`/admin/orders/${encodedId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: value }),
    });
  }

  const paths = {
    products:
      `/admin/products/${encodedId}/status?new_status=${encodeURIComponent(value)}`,
    vendors:
      `/admin/vendors/${encodedId}/status?new_status=${encodeURIComponent(value)}`,
    reviews:
      `/admin/reviews/${encodedId}/status?new_status=${encodeURIComponent(value)}`,
    customers:
      `/admin/customers/${encodedId}/active?is_active=${encodeURIComponent(value)}`,
  };

  if (!paths[resource]) {
    throw new Error(`Status updates are not supported for ${resource}.`);
  }

  return apiRequest(paths[resource], {
    method: 'PATCH',
  });
}
export const updateCategory = (categoryId, category) =>
  apiRequest(
    `/admin/categories/${encodeURIComponent(categoryId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        name: category.name.trim(),
        slug: category.slug.trim().toLowerCase(),
        parent_id: category.parent_id ?? null,
      }),
    }
  );
// Update category settings
export const updateCategorySettings = (categoryId, changes) =>
  apiRequest(
    `/admin/categories/${encodeURIComponent(categoryId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }
  );

// Delete category
export const deleteCategory = (categoryId) =>
  apiRequest(
    `/admin/categories/${encodeURIComponent(categoryId)}`,
    {
      method: 'DELETE',
    }
  );
export const updateVendorActiveStatus = (vendorId, isActive) =>
  apiRequest(
    `/admin/vendors/${encodeURIComponent(vendorId)}/active?is_active=${isActive}`,
    { method: 'PATCH' }
  );

export const getVendorDetails = (vendorId) =>
  apiRequest(`/admin/vendors/${encodeURIComponent(vendorId)}`);

export const getInventoryStock = (params = {}) => {
  const query = new URLSearchParams(params).toString();

  return apiRequest(
    `/admin/inventory/stock${query ? `?${query}` : ''}`
  );
};
export const adjustInventoryStock = (payload) =>
  apiRequest("/admin/inventory/stock/adjust", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const getOrderDetails = (orderId) =>
  apiRequest(`/admin/orders/${encodeURIComponent(orderId)}`);

/* Admin Returns */

export const getReturnRequests = (params = {}) => {
  const query = new URLSearchParams();

  if (params.status) {
    query.set('status', params.status);
  }

  query.set('limit', String(params.limit ?? 50));
  query.set('offset', String(params.offset ?? 0));

  return apiRequest(`/admin/returns?${query.toString()}`);
};

export const updateReturnRequestStatus = (
  returnId,
  status,
  notes = ''
) => {
  if (!returnId) {
    throw new Error('Return request ID is required.');
  }

  return apiRequest(
    `/admin/returns/${encodeURIComponent(returnId)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }),
    }
  );
};
