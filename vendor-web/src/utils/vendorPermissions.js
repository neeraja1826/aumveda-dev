
/*
 * AUMVEDA Vendor Web
 * Centralized Role-Based Access Control
 *
 * Permissions come from:
 * GET /api/v1/vendor/auth/me
 *
 * authorization.permissions
 *
 * The backend remains the security authority.
 */

export const VENDOR_PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",

  PRODUCTS_VIEW: "products.view",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_IMAGES: "products.images",

  ORDERS_VIEW: "orders.view",
  ORDERS_UPDATE: "orders.update",

  SHIPPING_VIEW: "shipping.view",

  INVENTORY_VIEW: "inventory.view",
  INVENTORY_UPDATE: "inventory.update",

  EARNINGS_VIEW: "earnings.view",
};

export const VENDOR_PAGE_RULES = {
  dashboard: {
    path: "/dashboard",
    ownerOnly: false,
    permissions: [
      VENDOR_PERMISSIONS.DASHBOARD_VIEW,
    ],
  },

  products: {
    path: "/products",
    ownerOnly: false,
    permissions: [
      VENDOR_PERMISSIONS.PRODUCTS_VIEW,
    ],
  },

  productCreate: {
    path: "/products/new",
    ownerOnly: false,
    permissions: [
      VENDOR_PERMISSIONS.PRODUCTS_CREATE,
    ],
  },

  productVariants: {
    ownerOnly: false,
    permissions: [
      VENDOR_PERMISSIONS.PRODUCTS_UPDATE,
    ],
  },

  productImages: {
    ownerOnly: false,
    permissions: [
      VENDOR_PERMISSIONS.PRODUCTS_IMAGES,
    ],
  },

  orders: {
    path: "/orders",
    ownerOnly: false,
    permissions: [
      VENDOR_PERMISSIONS.ORDERS_VIEW,
    ],
  },

  shipping: {
    path: "/shipping",
    ownerOnly: false,
    permissions: [
      VENDOR_PERMISSIONS.SHIPPING_VIEW,
    ],
  },

  inventory: {
    path: "/inventory",
    ownerOnly: false,
    permissions: [
      VENDOR_PERMISSIONS.INVENTORY_VIEW,
    ],
  },

  earnings: {
    path: "/earnings",
    ownerOnly: false,
    permissions: [
      VENDOR_PERMISSIONS.EARNINGS_VIEW,
    ],
  },

  payouts: {
    path: "/payouts",
    ownerOnly: true,
    permissions: [],
  },

  team: {
    path: "/team",
    ownerOnly: true,
    permissions: [],
  },

  profile: {
    path: "/profile",
    ownerOnly: true,
    permissions: [],
  },
};

/*
 * Explicit authorization is required.
 * Employees do not inherit Owner privileges.
 */
export function canAccessVendorPage(
  pageKey,
  {
    isOwner = false,
    permissions = [],
  } = {}
) {
  const rule = VENDOR_PAGE_RULES[pageKey];

  if (!rule) {
    return false;
  }

  if (isOwner === true) {
    return true;
  }

  if (rule.ownerOnly) {
    return false;
  }

  const grantedPermissions = new Set(
    Array.isArray(permissions)
      ? permissions.filter(
          (item) => typeof item === "string"
        )
      : []
  );

  return rule.permissions.some(
    (permission) => grantedPermissions.has(permission)
  );
}

/*
 * Find the employee's first accessible page.
 *
 * Owners always start on Dashboard.
 * Employees start on the first page they
 * are permitted to view.
 */
export function getVendorHomePath(
  access = {}
) {
  if (access.isOwner === true) {
    return "/dashboard";
  }

  const preferredPages = [
    "dashboard",
    "products",
    "orders",
    "shipping",
    "inventory",
    "earnings",
  ];

  for (const pageKey of preferredPages) {
    if (canAccessVendorPage(pageKey, access)) {
      return VENDOR_PAGE_RULES[pageKey].path;
    }
  }

  return "/no-access";
}
