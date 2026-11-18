
import { getAccessToken } from "./api";
import { API_BASE_URL } from "../config/api";

/**
 * AUMVEDA Vendor Web
 * Employee Password Management
 *
 * PATCH /api/v1/vendor/team/{user_id}/password
 *
 * Security:
 * - Owner-only backend authorization
 * - No password persistence in localStorage
 * - No automatic mutation retries
 * - No password included in the response
 */


function errorMessage(data, fallback) {
  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data?.detail)) {
    return (
      data.detail
        .map((item) => item?.msg)
        .filter(Boolean)
        .join("; ") || fallback
    );
  }

  return fallback;
}

export const employeePasswordApi = {
  async resetPassword(userId, newPassword) {
    if (
      typeof userId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)
    ) {
      throw new Error("Invalid employee identifier.");
    }

    if (
      typeof newPassword !== "string" ||
      newPassword.length === 0
    ) {
      throw new Error("New password is required.");
    }

    const token = getAccessToken();

    if (!token) {
      throw new Error(
        "Your session has expired. Please sign in again."
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/vendor/team/${encodeURIComponent(userId)}/password`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          new_password: newPassword,
        }),
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
          ? "Vendor Owner authorization is required."
          : response.status === 404
            ? "Employee was not found in this vendor team."
            : "Unable to update employee password.";

      const error = new Error(
        errorMessage(data, fallback)
      );

      error.status = response.status;
      throw error;
    }

    if (
      data?.status !== "success" ||
      data?.password_updated !== true ||
      data?.user_id !== userId
    ) {
      throw new Error(
        "The password update could not be confirmed. Check the account before retrying."
      );
    }

    return data;
  },
};
