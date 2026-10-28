import { apiRequest } from './api';

export async function login(
  email,
  password
) {
  return apiRequest(
    '/auth/login',
    {
      method: 'POST',
      body: {
        email,
        password,
      },
    }
  );
}

export async function register(
  name,
  email,
  password
) {
  return apiRequest(
    '/auth/register',
    {
      method: 'POST',
      body: {
        name,
        email,
        password,
      },
    }
  );
}

export async function getProfile(token) {
  return apiRequest('/auth/profile', { token });
}

export async function forgotPassword(
  email
) {
  return apiRequest(
    '/auth/forgot-password',
    {
      method: 'POST',
      body: {
        email,
      },
    }
  );
}

export async function resetPassword(
  accessToken,
  password
) {
  return apiRequest(
    '/auth/reset-password',
    {
      method: 'POST',
      token: accessToken,
      body: {
        password,
      },
    }
  );
}