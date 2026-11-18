import { getAccessToken } from "./api";
import { API_BASE_URL } from "../config/api";

// ============================================================
// COMMON VENDOR REQUEST
// ============================================================

async function vendorRequest(
  path,
  { method = "GET", body, signal } = {}
) {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Please sign in again.");
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/vendor${path}`,
      {
        method,
        signal,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          ...(body !== undefined
            ? {
                "Content-Type": "application/json",
              }
            : {}),
        },
        ...(body !== undefined
          ? {
              body: JSON.stringify(body),
            }
          : {}),
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
// HELPERS
// ============================================================

function returnPath(returnId) {
  if (!returnId) {
    throw new Error("Return request ID is required.");
  }

  return `/returns/${encodeURIComponent(returnId)}`;
}

function normalizeNotes(value) {
  return String(value || "").trim() || null;
}

const VALID_FULFILLMENT_STATUSES = [
  "picked_up",
  "in_transit",
  "exchange_handover_completed",
  "item_received",
  "quality_verified",
  "quality_review_required",
];

// ============================================================
// RETURNS AND EXCHANGES API
// ============================================================

export const returnsApi = {

  // ==========================================================
  // 1. GET RETURN AND EXCHANGE REQUESTS
  // ==========================================================

  getReturns: (filters = {}, signal) => {
    const params = new URLSearchParams();

    if (
      filters.request_type &&
      filters.request_type !== "all"
    ) {
      params.set(
        "request_type",
        filters.request_type
      );
    }

    if (
      filters.status &&
      filters.status !== "all"
    ) {
      params.set("status", filters.status);
    }

    params.set(
      "limit",
      String(filters.limit ?? 50)
    );

    params.set(
      "offset",
      String(filters.offset ?? 0)
    );

    return vendorRequest(
      `/returns?${params.toString()}`,
      { signal }
    );
  },

  // ==========================================================
  // 2. GET RETURN DETAILS
  // ==========================================================

  getReturn: (returnId, signal) =>
    vendorRequest(
      returnPath(returnId),
      { signal }
    ),

  // ==========================================================
  // 3. GET RETURN HISTORY
  // ==========================================================

  getHistory: (returnId, signal) =>
    vendorRequest(
      `${returnPath(returnId)}/history`,
      { signal }
    ),

  // ==========================================================
  // 4. PACK REPLACEMENT PRODUCT
  // ==========================================================

  packReplacement: (returnId, notes = null) =>
    vendorRequest(
      `${returnPath(returnId)}/pack`,
      {
        method: "POST",
        body: {
          notes: normalizeNotes(notes),
        },
      }
    ),

  // ==========================================================
  // 5. SCHEDULE RETURN PICKUP
  // ==========================================================

  schedulePickup: (returnId, options = {}) => {
    const scheduledAt = new Date(
      options.pickup_scheduled_at || ""
    );

    const courierName = String(
      options.courier_name || ""
    ).trim();

    const awbSource =
      options.awb_source || "automatic";

    const awbNumber = String(
      options.awb_number || ""
    ).trim();

    if (Number.isNaN(scheduledAt.getTime())) {
      throw new Error(
        "Select a valid pickup date and time."
      );
    }

    if (scheduledAt.getTime() <= Date.now()) {
      throw new Error(
        "Pickup must be scheduled for a future date and time."
      );
    }

    if (
      courierName.length < 2 ||
      courierName.length > 150
    ) {
      throw new Error(
        "Courier name must contain 2-150 characters."
      );
    }

    if (
      !["automatic", "manual"].includes(awbSource)
    ) {
      throw new Error("Invalid AWB source.");
    }

    if (
      awbSource === "manual" &&
      (
        awbNumber.length < 3 ||
        awbNumber.length > 200
      )
    ) {
      throw new Error(
        "AWB number must contain 3-200 characters."
      );
    }

    return vendorRequest(
      `${returnPath(returnId)}/schedule-pickup`,
      {
        method: "POST",
        body: {
          pickup_scheduled_at:
            scheduledAt.toISOString(),

          courier_name: courierName,

          awb_source: awbSource,

          awb_number:
            awbSource === "manual"
              ? awbNumber
              : null,

          vendor_notes: normalizeNotes(
            options.vendor_notes
          ),
        },
      }
    );
  },

  // ==========================================================
  // 6. UPDATE RETURN FULFILLMENT STATUS
  // ==========================================================

  updateStatus: (returnId, status, notes = null) => {
    if (
      !VALID_FULFILLMENT_STATUSES.includes(status)
    ) {
      throw new Error(
        "Unsupported return fulfillment status."
      );
    }

    const normalizedNotes = normalizeNotes(notes);

    if (
      status === "quality_review_required" &&
      !normalizedNotes
    ) {
      throw new Error(
        "Enter the reason for the quality issue."
      );
    }

    return vendorRequest(
      `${returnPath(returnId)}/status`,
      {
        method: "PATCH",
        body: {
          status,
          notes: normalizedNotes,
        },
      }
    );
  },

  // ==========================================================
  // 7. REQUEST CUSTOMER REFUND
  // ==========================================================

  requestRefund: (returnId, notes = null) =>
    vendorRequest(
      `${returnPath(returnId)}/request-refund`,
      {
        method: "POST",
        body: {
          notes: normalizeNotes(notes),
        },
      }
    ),

  // ==========================================================
  // 8. COMPLETE EXCHANGE
  // ==========================================================

  completeExchange: (returnId, notes = null) =>
    vendorRequest(
      `${returnPath(returnId)}/complete-exchange`,
      {
        method: "POST",
        body: {
          notes: normalizeNotes(notes),
        },
      }
    ),
};

export default returnsApi;