import { apiRequest } from './api';

export async function getCategories() {
  const response = await apiRequest('/categories');
  return response?.data ?? [];
}

export async function getCategoryBySlug(slug) {
  const response = await apiRequest(
    `/categories/${encodeURIComponent(slug)}`
  );

  return response?.data ?? null;
}