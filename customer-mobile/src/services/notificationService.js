import { apiRequest } from './api';

export async function getCustomerNotifications({
  limit = 20,
  offset = 0,
  signal,
} = {}) {
  const query = `limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(
    offset,
  )}`;
  const response = await apiRequest(`/notifications?${query}`, {
    signal,
  });

  if (
    !Array.isArray(response?.items) ||
    !Number.isInteger(response.total) ||
    !Number.isInteger(response.unread_count)
  ) {
    throw new Error('The notifications response was not in the expected format.');
  }

  return {
    items: response.items,
    total: response.total,
    unreadCount: response.unread_count,
  };
}

export async function markCustomerNotificationRead(notificationId) {
  if (!notificationId) {
    throw new Error('Notification ID is required.');
  }

  return apiRequest(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
    {
      method: 'PATCH',
      body: {},
    }
  );
}

export async function markAllCustomerNotificationsRead() {
  return apiRequest('/notifications/read-all', {
    method: 'PATCH',
    body: {},
  });
}
