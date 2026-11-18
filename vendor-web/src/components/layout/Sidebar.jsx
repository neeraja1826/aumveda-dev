import "./Sidebar.css";

import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingBag,
  Truck,
  RotateCcw,
  IndianRupee,
  Wallet,
  UsersRound,
  Store,
  LogOut,
  ChevronRight,
  CircleCheck,
  Leaf,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  useBranding,
} from "../../context/BrandingContext";

import AumvedaLogo from "../common/AumvedaLogo";

/* ============================================================
   NAVIGATION CONFIGURATION
   pageKey maps to vendorPermissions.js
============================================================ */

const mainNavigation = [
  {
    label: "Dashboard",
    path: "/dashboard",
    pageKey: "dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    path: "/products",
    pageKey: "products",
    icon: Package,
  },
  {
    label: "Orders",
    path: "/orders",
    pageKey: "orders",
    icon: ShoppingBag,
  },
  {
    label: "Shipping",
    path: "/shipping",
    pageKey: "shipping",
    icon: Truck,
  },
  {
    label: "Returns & Exchanges",
    path: "/returns",
    pageKey: "shipping",
    icon: RotateCcw,
  },
  {
    label: "Inventory",
    path: "/inventory",
    pageKey: "inventory",
    icon: Warehouse,
  },
];

const businessNavigation = [
  {
    label: "Earnings",
    path: "/earnings",
    pageKey: "earnings",
    icon: IndianRupee,
  },
  {
    label: "Payouts",
    path: "/payouts",
    pageKey: "payouts",
    icon: Wallet,
  },
  {
    label: "Team",
    path: "/team",
    pageKey: "team",
    icon: UsersRound,
  },
  {
    label: "Business Profile",
    path: "/profile",
    pageKey: "profile",
    icon: Store,
  },
];

/* ============================================================
   NAVIGATION GROUP
============================================================ */

function NavigationGroup({
  title,
  items,
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="sidebar-navigation-group">
      <p className="sidebar-section-title">
        {title}
      </p>

      <div className="sidebar-navigation-list">
        {items.map(
          ({
            label,
            path,
            icon: Icon,
          }) => (
            <NavLink
              key={path}
              to={path}
              end
              title={label}
              className={({ isActive }) =>
                `sidebar-link${
                  isActive ? " active" : ""
                }`
              }
            >
              <span className="sidebar-link-icon">
                <Icon
                  size={19}
                  strokeWidth={1.85}
                />
              </span>

              <span className="sidebar-link-label">
                {label}
              </span>

              <ChevronRight
                size={15}
                strokeWidth={1.8}
                className="sidebar-link-arrow"
              />
            </NavLink>
          )
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SIDEBAR
============================================================ */

export default function Sidebar() {
  const navigate = useNavigate();

  const {
    vendor,
    membership,
    isOwner,
    canAccess,
    permissionsReady,
    logout,
  } = useAuth();

  const {
    branding,
  } = useBranding();

  const businessName =
    vendor?.business_name ||
    "Vendor Business";

  const businessRole = isOwner
    ? "Owner"
    : (
        membership?.member_role ||
        "Staff"
      );

  const isApproved =
    String(
      vendor?.status || ""
    ).toLowerCase() === "approved";

  const businessInitial =
    businessName
      .trim()
      .charAt(0)
      .toUpperCase() || "V";

  /* ==========================================================
     FILTER NAVIGATION USING BACKEND PERMISSIONS
  ========================================================== */

  const visibleMainNavigation =
    permissionsReady
      ? mainNavigation.filter(
          (item) => canAccess(item.pageKey)
        )
      : [];

  const visibleBusinessNavigation =
    permissionsReady
      ? businessNavigation.filter(
          (item) => canAccess(item.pageKey)
        )
      : [];

  /* ==========================================================
     LOGOUT
  ========================================================== */

  async function handleLogout() {
    await logout();

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <aside className="sidebar">

      {/* BRAND */}

      <div className="sidebar-brand">
        <div className="sidebar-logo-container">
          <AumvedaLogo
            className="sidebar-logo"
          />
        </div>

        <div className="sidebar-brand-content">
          <strong className="sidebar-brand-name">
            {branding?.site_name ||
              "AUMVEDA"}
          </strong>

          <span className="sidebar-brand-subtitle">
            VENDOR WORKSPACE
          </span>
        </div>
      </div>

      {/* BUSINESS ACCOUNT */}

      <div className="vendor-summary">
        <div className="vendor-summary-top">
          <span className="vendor-summary-eyebrow">
            YOUR BUSINESS
          </span>

          {isApproved && (
            <CircleCheck
              size={16}
              className="vendor-verified-icon"
              aria-label="Approved business"
            />
          )}
        </div>

        <div className="vendor-summary-content">
          <div className="vendor-avatar">
            {businessInitial}
          </div>

          <div className="vendor-summary-details">
            <strong title={businessName}>
              {businessName}
            </strong>

            <span>
              {businessRole}
            </span>
          </div>
        </div>

        {isApproved && (
          <span className="vendor-status-label">
            <span className="vendor-status-dot" />
            Approved Partner
          </span>
        )}
      </div>

      {/* PERMISSION-BASED NAVIGATION */}

      <nav
        className="sidebar-nav"
        aria-label="Vendor navigation"
      >
        <NavigationGroup
          title="WORKSPACE"
          items={visibleMainNavigation}
        />

        <NavigationGroup
          title="BUSINESS MANAGEMENT"
          items={visibleBusinessNavigation}
        />
      </nav>

      {/* BOTTOM CONTENT */}

      <div className="sidebar-bottom">
        <div className="sidebar-partner-note">
          <div className="sidebar-partner-note-icon">
            <Leaf
              size={17}
              strokeWidth={1.75}
            />
          </div>

          <div>
            <strong>
              Grow with AUMVEDA
            </strong>

            <span>
              Your wellness business,
              beautifully managed.
            </span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
          title="Sign out"
        >
          <LogOut
            size={19}
            strokeWidth={1.85}
          />

          <span>
            Sign Out
          </span>

          <ChevronRight
            size={15}
            className="sidebar-logout-arrow"
          />
        </button>
      </div>

    </aside>
  );
}