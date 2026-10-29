import { apiRequest } from './api';


export async function getProfile() {
  const response = await apiRequest('/profile');

  console.log(
    'PROFILE API RESPONSE:',
    JSON.stringify(response, null, 2)
  );

  return response?.data ?? null;
}

export async function updateProfile(profile, token) {
  const response = await apiRequest('/profile', {
    method: 'PATCH',
    token,
    body: profile,
  });

  console.log(
    'PROFILE UPDATE RESPONSE:',
    JSON.stringify(response, null, 2)
  );

  return response?.data ?? null;
}


