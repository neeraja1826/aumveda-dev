import { apiRequest } from './api';

export async function getAddresses(token) {
  const response = await apiRequest(
    '/addresses',
    {
      token,
    }
  );

  return response?.data ?? [];
}

export async function getAddress(
  token,
  addressId
) {
  const response = await apiRequest(
    `/addresses/${encodeURIComponent(addressId)}`,
    {
      token,
    }
  );

  return response?.data ?? null;
}

export async function createAddress(
  token,
  address
) {
  const response = await apiRequest(
    '/addresses',
    {
      method: 'POST',
      token,
      body: address,
    }
  );

  return response?.data ?? null;
}

export async function updateAddress(
  token,
  addressId,
  address
) {
  const response = await apiRequest(
    `/addresses/${encodeURIComponent(addressId)}`,
    {
      method: 'PATCH',
      token,
      body: address,
    }
  );

  return response?.data ?? null;
}

export async function deleteAddress(
  token,
  addressId
) {
  return apiRequest(
    `/addresses/${encodeURIComponent(addressId)}`,
    {
      method: 'DELETE',
      token,
    }
  );
}

export async function setDefaultAddress(
  token,
  addressId
) {
  const response = await apiRequest(
    `/addresses/${encodeURIComponent(addressId)}/default`,
    {
      method: 'PATCH',
      token,
    }
  );

  return response?.data ?? null;
}