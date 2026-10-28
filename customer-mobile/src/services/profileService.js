import { apiRequest } from './api';

export async function getProfile() {
  const response = await apiRequest('/profile');
  return response?.data ?? null;
}

export async function updateProfile(profile, token) {
  const response = await apiRequest('/profile', {
    method: 'PATCH',
    token,
    body: profile,
  });

  return response?.data ?? null;
}