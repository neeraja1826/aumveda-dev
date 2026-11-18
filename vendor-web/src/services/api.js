
/* ============================================================
   AUMVEDA VENDOR WEB
   API SERVICE

   Frontend: React + Vite
   Backend: FastAPI Vendor Backend

   All vendor operations pass through FastAPI.

   Business Profile:
   - Business information requires Admin approval.
   - Business email and phone require Admin approval.
   - Logo and banner changes are immediate.
   - Vendors cannot approve their own changes.

   Product Approval:
   - Vendor submits draft/rejected product.
   - Admin reviews product.
   - Vendor cannot approve own products.
============================================================ */


/* ============================================================
   CONFIGURATION
============================================================ */

import { API_BASE_URL } from "../config/api";

const ACCESS_TOKEN_KEY =
  "aumveda_vendor_access_token";

const REFRESH_TOKEN_KEY =
  "aumveda_vendor_refresh_token";


/* ============================================================
   TOKEN HELPERS
============================================================ */

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getAuthToken() {
  return getAccessToken();
}

export function saveAuthTokens(
  accessTokenOrTokens,
  refreshToken
) {
  if (
    accessTokenOrTokens &&
    typeof accessTokenOrTokens === "object"
  ) {
    const {
      access_token,
      refresh_token,
    } = accessTokenOrTokens;

    if (access_token) {
      localStorage.setItem(
        ACCESS_TOKEN_KEY,
        access_token
      );
    }

    if (refresh_token) {
      localStorage.setItem(
        REFRESH_TOKEN_KEY,
        refresh_token
      );
    }

    return;
  }

  if (accessTokenOrTokens) {
    localStorage.setItem(
      ACCESS_TOKEN_KEY,
      accessTokenOrTokens
    );
  }

  if (refreshToken) {
    localStorage.setItem(
      REFRESH_TOKEN_KEY,
      refreshToken
    );
  }
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function saveTokens(tokens) {
  saveAuthTokens(tokens);
}

export function clearTokens() {
  clearAuthTokens();
}


/* ============================================================
   COMMON REQUEST HELPER
============================================================ */

async function request(
  path,
  options = {},
  requiresAuth = true
) {
  const headers = {
    ...(options.headers || {}),
  };

  const isFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  if (
    options.body !== undefined &&
    options.body !== null &&
    !isFormData
  ) {
    headers["Content-Type"] =
      "application/json";
  }

  if (isFormData) {
    delete headers["Content-Type"];
    delete headers["content-type"];
  }

  if (requiresAuth) {
    const token = getAccessToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers,
    }
  );

  const contentType =
    response.headers.get("content-type") || "";

  let data = null;

  if (response.status !== 204) {
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text || null;
    }
  }

  if (!response.ok) {
    let message = "Request failed.";

    if (data && typeof data === "object") {
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (
        typeof data.message === "string"
      ) {
        message = data.message;
      } else if (
        Array.isArray(data.detail)
      ) {
        message =
          data.detail
            .map(
              (item) =>
                item?.msg ||
                item?.message ||
                JSON.stringify(item)
            )
            .join(", ") || message;
      }
    } else if (
      typeof data === "string" &&
      data.trim()
    ) {
      message = data;
    }

    const error = new Error(message);

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}


/* ============================================================
   VENDOR API
============================================================ */

export const vendorApi = {

  requestProductDeletion: (productId, reason) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/deletion-request`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      }
    ),

  getProductDeletionRequest: (productId) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/deletion-request`,
      { method: "GET" }
    ),

  deleteDraftProduct: (productId) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/draft`,
      { method: "DELETE" }
    ),


  // PRODUCT REVISION APIs

  createRevision: (productId) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/revision`,
      { method: "POST" }
    ),

  getRevision: (productId) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/revision`,
      { method: "GET" }
    ),

  updateRevision: (productId, payload) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/revision`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    ),

  submitRevision: (productId) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/revision/submit`,
      { method: "POST" }
    ),

  getRevisionImages: (productId) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/revision/images`,
      { method: "GET" }
    ),

  uploadRevisionImage: (productId, input) =>
    vendorApi.uploadProductImage(productId, input, true),

  setRevisionPrimaryImage: (productId, imageId) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/revision/images/${encodeURIComponent(imageId)}/primary`,
      { method: "PATCH" }
    ),

  deleteRevisionImage: (productId, imageId) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/revision/images/${encodeURIComponent(imageId)}`,
      { method: "DELETE" }
    ),

  getRevisionVariants: (productId) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/revision/variants`,
      { method: "GET" }
    ),

  createRevisionVariant: (productId, payload) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/revision/variants`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),

  updateRevisionVariant: (productId, variantId, payload) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/revision/variants/${encodeURIComponent(variantId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    ),

  deleteRevisionVariant: (productId, variantId) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/revision/variants/${encodeURIComponent(variantId)}`,
      { method: "DELETE" }
    ),



  /* ==========================================================
     AUTHENTICATION
  ========================================================== */

  register: (payload) =>
    request(
      "/vendor/auth/register",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      false
    ),

  login: (payload) =>
    request(
      "/vendor/auth/login",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      false
    ),

  me: () =>
    request(
      "/vendor/auth/me",
      {
        method: "GET",
      }
    ),


  /* ==========================================================
     BUSINESS PROFILE
  ========================================================== */

  getProfile: () =>
    request(
      "/vendor/profile",
      {
        method: "GET",
      }
    ),

  /*
   * Legacy direct-update method retained for
   * compatibility with existing frontend imports.
   *
   * The backend now blocks direct updates to
   * all business information fields.
   *
   * The Business Profile page must use
   * submitProfileChangeRequest() instead.
   */

  updateProfile: (payload) =>
    request(
      "/vendor/profile",
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    ),


  /* ==========================================================
     BUSINESS PROFILE CHANGE REQUESTS

     STEP 19.9.26.1

     All four sections require Admin approval.

     Valid sections:

     store_information
     contact_information
     business_address
     legal_tax

     Only Vendor Owners can access these APIs.
  ========================================================== */

  submitProfileChangeRequest: (payload) =>
    request(
      "/vendor/profile/change-requests",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),

  getProfileChangeRequests: () =>
    request(
      "/vendor/profile/change-requests",
      {
        method: "GET",
      }
    ),

  getProfileChangeRequest: (requestId) => {
    if (
      requestId === undefined ||
      requestId === null ||
      String(requestId).trim() === ""
    ) {
      throw new Error(
        "A valid profile change request ID is required."
      );
    }

    return request(
      `/vendor/profile/change-requests/${encodeURIComponent(
        String(requestId)
      )}`,
      {
        method: "GET",
      }
    );
  },


  /* ==========================================================
     DASHBOARD
  ========================================================== */

  dashboard: () =>
    request(
      "/vendor/dashboard",
      {
        method: "GET",
      }
    ),


  /* ==========================================================
     CATEGORIES
  ========================================================== */

  getCategories: () =>
    request(
      "/categories",
      {
        method: "GET",
      },
      false
    ),


  /* ==========================================================
     PRODUCTS
  ========================================================== */

  getProducts: () =>
    request(
      "/vendor/products",
      {
        method: "GET",
      }
    ),

  getProduct: (productId) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}`,
      {
        method: "GET",
      }
    ),

  createProduct: (payload) =>
    request(
      "/vendor/products",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),

  updateProduct: (productId, payload) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    ),

  deleteProduct: (productId) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}`,
      {
        method: "DELETE",
      }
    ),


  /* ==========================================================
     PRODUCT APPROVAL

     Allowed vendor submission:
     draft -> pending
     rejected -> pending

     Admin approval remains separate.
  ========================================================== */

  submitProductForApproval: (productId) => {
    if (
      productId === undefined ||
      productId === null ||
      String(productId).trim() === ""
    ) {
      throw new Error(
        "A valid product ID is required for approval submission."
      );
    }

    return request(
      `/vendor/products/${encodeURIComponent(
        String(productId)
      )}/submit-for-approval`,
      {
        method: "POST",
      }
    );
  },


  /* ==========================================================
     PRODUCT VARIANTS
  ========================================================== */

  getProductVariants: (productId) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/variants`,
      {
        method: "GET",
      }
    ),

  createProductVariant: (productId, payload) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/variants`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),

  updateProductVariant: (variantId, payload) =>
    request(
      `/vendor/products/variants/${encodeURIComponent(variantId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    ),

  deleteProductVariant: (variantId) =>
    request(
      `/vendor/products/variants/${encodeURIComponent(variantId)}`,
      {
        method: "DELETE",
      }
    ),


  /* ==========================================================
     PRODUCT IMAGES
  ========================================================== */

  getProductImages: (productId) =>
    request(
      `/vendor/products/${encodeURIComponent(productId)}/images`,
      {
        method: "GET",
      }
    ),

  uploadProductImage: (productId, input, revision = false) => {
    let formData;

    if (
      typeof FormData !== "undefined" &&
      input instanceof FormData
    ) {
      formData = input;
    } else {
      const {
        file,
        altText = "",
        sortOrder = 0,
        isPrimary = false,
      } = input || {};

      if (!file) {
        throw new Error(
          "Please select a product image."
        );
      }

      formData = new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "alt_text",
        altText || ""
      );

      formData.append(
        "sort_order",
        String(sortOrder)
      );

      formData.append(
        "is_primary",
        String(isPrimary)
      );
    }

    const file = formData.get("file");

    if (
      typeof File !== "undefined" &&
      !(file instanceof File)
    ) {
      throw new Error(
        "A valid product image file is required."
      );
    }

    if (!file) {
      throw new Error(
        "Product image file is required."
      );
    }

    return request(
      `/vendor/products/${encodeURIComponent(productId)}${revision ? "/revision" : ""}/images`,
      {
        method: "POST",
        body: formData,
      }
    );
  },

  setPrimaryProductImage: (
    productId,
    imageId
  ) =>
    request(
      `/vendor/products/${encodeURIComponent(
        productId
      )}/images/${encodeURIComponent(
        imageId
      )}/primary`,
      {
        method: "PATCH",
      }
    ),

  deleteProductImage: (
    productId,
    imageId
  ) =>
    request(
      `/vendor/products/${encodeURIComponent(
        productId
      )}/images/${encodeURIComponent(imageId)}`,
      {
        method: "DELETE",
      }
    ),


  /* ==========================================================
     INVENTORY
  ========================================================== */

  getInventory: () =>
    request(
      "/vendor/inventory",
      {
        method: "GET",
      }
    ),

  getLowStock: () =>
    request(
      "/vendor/inventory/low-stock",
      {
        method: "GET",
      }
    ),

  getInventoryVariant: (variantId) =>
    request(
      `/vendor/inventory/${encodeURIComponent(variantId)}`,
      {
        method: "GET",
      }
    ),

  getInventoryHistory: (variantId) =>
    request(
      `/vendor/inventory/${encodeURIComponent(variantId)}/history`,
      {
        method: "GET",
      }
    ),

  updateInventory: (variantId, payload) =>
    request(
      `/vendor/inventory/${encodeURIComponent(variantId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    ),


  /* ==========================================================
     ORDERS
  ========================================================== */

  getOrders: () =>
    request(
      "/vendor/orders",
      {
        method: "GET",
      }
    ),

  getOrdersSummary: () =>
    request(
      "/vendor/orders/summary",
      {
        method: "GET",
      }
    ),

  getOrder: (orderId) =>
    request(
      `/vendor/orders/${encodeURIComponent(orderId)}`,
      {
        method: "GET",
      }
    ),

  getOrderItem: (orderItemId) =>
    request(
      `/vendor/orders/items/${encodeURIComponent(orderItemId)}`,
      {
        method: "GET",
      }
    ),

  updateOrderItemStatus: (orderItemId, payload) =>
    request(
      `/vendor/orders/items/${encodeURIComponent(orderItemId)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    ),


  /* ==========================================================
     EARNINGS
  ========================================================== */

  getEarnings: () =>
    request(
      "/vendor/earnings",
      {
        method: "GET",
      }
    ),

  getEarningsSummary: () =>
    request(
      "/vendor/earnings/summary",
      {
        method: "GET",
      }
    ),


  /* ==========================================================
     PAYOUTS
  ========================================================== */

  getPayouts: () =>
    request(
      "/vendor/payouts",
      {
        method: "GET",
      }
    ),

  getPayoutsSummary: () =>
    request(
      "/vendor/payouts/summary",
      {
        method: "GET",
      }
    ),

  getPayout: (payoutId) =>
    request(
      `/vendor/payouts/${encodeURIComponent(payoutId)}`,
      {
        method: "GET",
      }
    ),


  /* ==========================================================
     BRANDING

     Logo and Banner changes are immediate.

     These do NOT require Admin approval.

     Upload requests use FormData.
  ========================================================== */

  getBranding: () =>
    request(
      "/vendor/branding",
      {
        method: "GET",
      }
    ),

  getBrandingRequests: () =>
    request(
      "/vendor/branding/requests",
      {
        method: "GET",
      }
    ),

  uploadBrandingLogo: (file) => {
    if (!file) {
      throw new Error(
        "Please select a store logo."
      );
    }

    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    return request(
      "/vendor/branding/logo",
      {
        method: "POST",
        body: formData,
      }
    );
  },

  uploadBrandingBanner: (file) => {
    if (!file) {
      throw new Error(
        "Please select a store banner."
      );
    }

    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    return request(
      "/vendor/branding/banner",
      {
        method: "POST",
        body: formData,
      }
    );
  },


  /* ==========================================================
     TEAM MANAGEMENT
  ========================================================== */

  getTeam: () =>
    request(
      "/vendor/team",
      {
        method: "GET",
      }
    ),

  getTeamMember: (userId) =>
    request(
      `/vendor/team/${encodeURIComponent(userId)}`,
      {
        method: "GET",
      }
    ),

  updateTeamRole: (userId, payload) =>
    request(
      `/vendor/team/${encodeURIComponent(userId)}/role`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    ),

  updateTeamStatus: (userId, payload) =>
    request(
      `/vendor/team/${encodeURIComponent(userId)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    ),

};

export default vendorApi;
