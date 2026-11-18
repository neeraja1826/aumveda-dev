import { getAccessToken } from "./api";
import { API_BASE_URL } from "../config/api";

// ============================================================
// AUMVEDA VENDOR WEB - NOTIFICATION API
// ============================================================

export const NOTIFICATION_CHANGE_EVENT =
  "aumveda:vendor-notifications-changed";

// ============================================================
// AUTHENTICATED REQUEST
// ============================================================

async function notificationRequest(
  path,
  { method = "GET", signal } = {}
) {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Please sign in again.");
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/vendor/notifications${path}`,
      {
        method,
        signal,
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new Error(
      "Could not reach Vendor Backend. Check your connection."
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  const result = contentType.includes(
    "application/json"
  )
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail = result?.detail;

    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail
              .map((entry) => entry.msg)
              .filter(Boolean)
              .join(". ")
          : typeof result?.message === "string"
            ? result.message
            : `Request failed (${response.status}).`;

    const error = new Error(message);

    error.status = response.status;
    error.data = result;

    throw error;
  }

  return result;
}

// ============================================================
// NOTIFICATION CHANGE EVENT
// Keeps Navbar and Notifications Page synchronized.
// ============================================================

function notifyNotificationChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(NOTIFICATION_CHANGE_EVENT)
    );
  }
}

// ============================================================
// NOTIFICATION API
// ============================================================

export const notificationApi = {

  // ==========================================================
  // 1. GET PERSONAL NOTIFICATIONS
  // ==========================================================

  getNotifications: (filters = {}, signal) => {
    const params = new URLSearchParams();

    const readStatus =
      filters.read_status || "all";

    if (
      !["all", "read", "unread"].includes(readStatus)
    ) {
      throw new Error(
        "Invalid notification read status."
      );
    }

    params.set("read_status", readStatus);

    if (
      filters.notification_type &&
      filters.notification_type !== "all"
    ) {
      params.set(
        "notification_type",
        filters.notification_type
      );
    }

    params.set(
      "limit",
      String(filters.limit ?? 20)
    );

    params.set(
      "offset",
      String(filters.offset ?? 0)
    );

    return notificationRequest(
      `?${params.toString()}`,
      { signal }
    );
  },

  // ==========================================================
  // 2. GET UNREAD COUNT
  // ==========================================================

  getUnreadCount: (signal) =>
    notificationRequest(
      "/unread-count",
      { signal }
    ),

  // ==========================================================
  // 3. MARK SINGLE NOTIFICATION AS READ
  // ==========================================================

  markAsRead: async (notificationId) => {
    if (!notificationId) {
      throw new Error(
        "Notification ID is required."
      );
    }

    const result = await notificationRequest(
      `/${encodeURIComponent(notificationId)}/read`,
      {
        method: "PATCH",
      }
    );

    notifyNotificationChange();

    return result;
  },

  // ==========================================================
  // 4. MARK ALL PERSONAL NOTIFICATIONS AS READ
  // ==========================================================

  markAllAsRead: async () => {
    const result = await notificationRequest(
      "/read-all",
      {
        method: "PATCH",
      }
    );

    notifyNotificationChange();

    return result;
  },
};

export default notificationApi;