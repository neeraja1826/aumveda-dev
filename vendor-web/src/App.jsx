import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import VendorLayout from "./components/layout/VendorLayout";

import ProtectedRoute from "./routes/ProtectedRoute";
import PermissionRoute from "./routes/PermissionRoute";

import { useAuth } from "./context/AuthContext";

import LoginPage from "./pages/auth/LoginPage";
import AcceptInvitePage from "./pages/auth/AcceptInvitePage";

import PendingApprovalPage from "./pages/PendingApprovalPage";
import DashboardPage from "./pages/DashboardPage";

import ProductsPage from "./pages/ProductsPage";
import AddProductPage from "./pages/AddProductPage";
import ProductVariantsPage from "./pages/ProductVariantsPage";
import ProductImagesPage from "./pages/ProductImagesPage";

import InventoryPage from "./pages/InventoryPage";
import OrdersPage from "./pages/OrdersPage";
import ShippingPage from "./pages/ShippingPage";
import ReturnsPage from "./pages/ReturnsPage";

import EarningsPage from "./pages/EarningsPage";
import PayoutsPage from "./pages/PayoutsPage";

import ProfilePage from "./pages/ProfilePage";
import TeamPage from "./pages/TeamPage";

import NotificationsPage from "./pages/NotificationsPage";

/* ============================================================
   DEFAULT LANDING PAGE
============================================================ */

function VendorHomeRedirect() {
  const {
    loading,
    permissionsReady,
    homePath,
  } = useAuth();

  if (loading || !permissionsReady) {
    return null;
  }

  return (
    <Navigate
      to={homePath}
      replace
    />
  );
}

/* ============================================================
   NO ACCESSIBLE MODULES
============================================================ */

function NoAccessPage() {
  const {
    logout,
  } = useAuth();

  return (
    <section
      style={{
        maxWidth: "520px",
        margin: "70px auto",
        padding: "32px",
        background: "#ffffff",
        border: "1px solid #e1e9de",
        borderRadius: "16px",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          color: "#173e32",
          marginTop: 0,
        }}
      >
        No Modules Assigned
      </h2>

      <p
        style={{
          color: "#788a7e",
          lineHeight: 1.7,
        }}
      >
        Your account is active, but you do not
        currently have permission to view any
        workspace modules. Contact your Vendor
        Owner to update your assigned roles.
      </p>

      <button
        type="button"
        onClick={logout}
        style={{
          padding: "11px 20px",
          background: "#1e523d",
          color: "#ffffff",
          border: 0,
          borderRadius: "9px",
          cursor: "pointer",
        }}
      >
        Sign Out
      </button>
    </section>
  );
}

/* ============================================================
   ROUTES
============================================================ */

export default function App() {
  return (
    <Routes>

      {/* PUBLIC ROUTES */}

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/accept-invite"
        element={<AcceptInvitePage />}
      />

      <Route
        path="/pending-approval"
        element={<PendingApprovalPage />}
      />

      {/* AUTHENTICATED VENDOR ROUTES */}

      <Route element={<ProtectedRoute />}>
        <Route element={<VendorLayout />}>

          {/* DEFAULT VENDOR HOME */}

          <Route
            index
            element={<VendorHomeRedirect />}
          />

          {/* DASHBOARD */}

          <Route
            element={
              <PermissionRoute pageKey="dashboard" />
            }
          >
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />
          </Route>

          {/* PRODUCTS */}

          <Route
            element={
              <PermissionRoute pageKey="products" />
            }
          >
            <Route
              path="/products"
              element={<ProductsPage />}
            />
          </Route>

          {/* CREATE PRODUCT */}

          <Route
            element={
              <PermissionRoute pageKey="productCreate" />
            }
          >
            <Route
              path="/products/new"
              element={<AddProductPage />}
            />
          </Route>

          {/* PRODUCT VARIANTS */}

          <Route
            element={
              <PermissionRoute pageKey="productVariants" />
            }
          >
            <Route
              path="/products/:productId/variants"
              element={<ProductVariantsPage />}
            />
          </Route>

          {/* PRODUCT IMAGES */}

          <Route
            element={
              <PermissionRoute pageKey="productImages" />
            }
          >
            <Route
              path="/products/:productId/images"
              element={<ProductImagesPage />}
            />
          </Route>

          {/* INVENTORY */}

          <Route
            element={
              <PermissionRoute pageKey="inventory" />
            }
          >
            <Route
              path="/inventory"
              element={<InventoryPage />}
            />
          </Route>

          {/* ORDERS */}

          <Route
            element={
              <PermissionRoute pageKey="orders" />
            }
          >
            <Route
              path="/orders"
              element={<OrdersPage />}
            />
          </Route>

          {/* SHIPPING */}

          <Route
            element={
              <PermissionRoute pageKey="shipping" />
            }
          >
            <Route
              path="/shipping"
              element={<ShippingPage />}
            />

            {/* RETURNS & EXCHANGES */}

            <Route
              path="/returns"
              element={<ReturnsPage />}
            />
          </Route>

          {/* EARNINGS */}

          <Route
            element={
              <PermissionRoute pageKey="earnings" />
            }
          >
            <Route
              path="/earnings"
              element={<EarningsPage />}
            />
          </Route>

          {/* PAYOUTS - OWNER ONLY */}

          <Route
            element={
              <PermissionRoute pageKey="payouts" />
            }
          >
            <Route
              path="/payouts"
              element={<PayoutsPage />}
            />
          </Route>

          {/* TEAM - OWNER ONLY */}

          <Route
            element={
              <PermissionRoute pageKey="team" />
            }
          >
            <Route
              path="/team"
              element={<TeamPage />}
            />
          </Route>

          {/* BUSINESS PROFILE - OWNER ONLY */}

          <Route
            element={
              <PermissionRoute pageKey="profile" />
            }
          >
            <Route
              path="/profile"
              element={<ProfilePage />}
            />
          </Route>

          {/* PERSONAL NOTIFICATIONS */}

          <Route
            path="/notifications"
            element={<NotificationsPage />}
          />

          {/* NO ACCESS PAGE */}

          <Route
            path="/no-access"
            element={<NoAccessPage />}
          />

          {/* UNKNOWN ROUTES */}

          <Route
            path="*"
            element={<VendorHomeRedirect />}
          />

        </Route>
      </Route>

    </Routes>
  );
}