import { getAccessToken } from "./api";
import { API_BASE_URL } from "../config/api";

async function vendorRequest(
  path,
  { method = "GET", body, signal } = {}
) {
  const token = getAccessToken();

  if (!token) {
    throw new Error(
      "Please sign in again."
    );
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
          ? { body: JSON.stringify(body) }
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

    throw error;
  }

  return result;
}

function buildAwbPayload(options = {}) {
  const source =
    options.awb_source === "manual"
      ? "manual"
      : "automatic";

  const courier = String(
    options.courier_name || ""
  ).trim();

  const awb = String(
    options.awb_number || ""
  ).trim();

  const payload = {
    awb_source: source,
  };

  if (courier.length > 150) {
    throw new Error(
      "Courier name cannot exceed 150 characters."
    );
  }

  if (source === "manual") {
    if (awb.length < 3 || awb.length > 200) {
      throw new Error(
        "Courier AWB must contain 3-200 characters."
      );
    }

    if (courier.length < 2) {
      throw new Error(
        "Enter a valid courier name."
      );
    }

    payload.awb_number = awb;
  }

  if (courier) {
    payload.courier_name = courier;
  }

  return payload;
}

export const shippingApi = {
  getReadyItems: (signal) =>
    vendorRequest("/shipping/ready-items", {
      signal,
    }),

  getShipments: (signal) =>
    vendorRequest("/shipping", {
      signal,
    }),

  getShipment: (shipmentId, signal) =>
    vendorRequest(
      `/shipping/${encodeURIComponent(shipmentId)}`,
      { signal }
    ),

  // Existing individual shipment API.
  createShipment: (
    orderItemId,
    options = {}
  ) => {
    return vendorRequest("/shipping", {
      method: "POST",
      body: {
        order_item_id: orderItemId,
        ...buildAwbPayload(options),
      },
    });
  },

  // Combined or split shipment API.
  createCombinedShipment: (
    orderId,
    orderItemIds,
    options = {}
  ) => {
    const itemIds = [
      ...new Set(
        (orderItemIds || [])
          .filter(Boolean)
          .map(String)
      ),
    ];

    if (!orderId || !itemIds.length) {
      throw new Error(
        "Select at least one packed product."
      );
    }

    return vendorRequest("/shipping", {
      method: "POST",
      body: {
        order_id: orderId,
        order_item_ids: itemIds,
        ...buildAwbPayload(options),
      },
    });
  },

  // Accept all or pack all eligible products.
  bulkUpdateOrderStatus: (
    orderId,
    status,
    orderItemIds = null
  ) => {
    if (!["accepted", "packed"].includes(status)) {
      throw new Error(
        "Unsupported order status."
      );
    }

    const payload = { status };

    if (orderItemIds === null) {
      payload.all_items = true;
    } else {
      payload.order_item_ids = [
        ...new Set(orderItemIds.map(String)),
      ];

      if (!payload.order_item_ids.length) {
        throw new Error(
          "Select at least one eligible product."
        );
      }
    }

    return vendorRequest(
      `/orders/${encodeURIComponent(orderId)}/items/status`,
      {
        method: "PATCH",
        body: payload,
      }
    );
  },

  updateStatus: (shipmentId, payload) => {
    const next = {
      status: payload.status,
    };

    if (payload.status === "shipped") {
      const courier = String(
        payload.courier_name || ""
      ).trim();

      if (
        courier.length < 2 ||
        courier.length > 150
      ) {
        throw new Error(
          "Courier name must contain 2-150 characters."
        );
      }

      next.courier_name = courier;
    }

    return vendorRequest(
      `/shipping/${encodeURIComponent(shipmentId)}/status`,
      {
        method: "PATCH",
        body: next,
      }
    );
  },
};

export default shippingApi;