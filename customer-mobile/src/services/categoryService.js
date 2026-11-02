import { apiRequest } from './api';

// Fetch parent categories with nested subcategories.
export async function getCategories() {
  const response = await apiRequest('/categories');

  return Array.isArray(response?.data)
    ? response.data
    : [];
}

// Fetch one category with its subcategories.
export async function getCategoryBySlug(slug) {
  if (!slug) return null;

  const response = await apiRequest(
    `/categories/${encodeURIComponent(slug)}`
  );

  return response?.data ?? null;
}

// Fetch active subcategories belonging to a parent.
