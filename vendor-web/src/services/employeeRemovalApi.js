
import {
  getAccessToken,
} from "./api";
import { API_BASE_URL } from "../config/api";

/*
 * AUMVEDA Vendor Web
 * Employee Removal API
 *
 * DELETE /api/v1/vendor/team/{user_id}
 *
 * Only a Vendor Owner can call this endpoint.
 * The backend validates vendor membership.
 *
 * The Supabase Auth identity is preserved.
 */


function extractErrorMessage(data, fallback) {
  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join("; ") || fallback;
  }

  if (typeof data?.message === "string") {
    return data.message;
  }

  return fallback;
}

export const employeeRemovalApi = {
  async removeEmployee(userId) {
    if (
      !userId ||
      typeof userId !== "string"
    ) {
      throw new Error(
        "A valid employee ID is required."
      );
    }

    const token = getAccessToken();

    if (!token) {
      throw new Error(
        "Your login session is unavailable. Please sign in again."
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/vendor/team/${encodeURIComponent(userId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const fallback =
        response.status === 403
          ? "Only the Vendor Owner can remove employees."
          : response.status === 404
            ? "Employee membership was not found."
            : "Unable to remove employee.";

      const error = new Error(
        extractErrorMessage(data, fallback)
      );

      error.status = response.status;

      throw error;
    }

    if (
      data?.status !== "success" ||
      data?.auth_account_deleted !== false ||
      String(data?.user_id) !== userId
    ) {
      throw new Error(
        "Employee removal could not be confirmed. Refresh the Team directory before attempting another action."
      );
    }

    return data;
  },
};
