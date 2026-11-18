
import "./DashboardPage.css";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  CircleAlert,
  Clock3,
  IndianRupee,
  LayoutDashboard,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
  Wallet,
  Warehouse,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { vendorApi } from "../services/api";


/* ============================================================
   HELPERS
============================================================ */

function asNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function formatNumber(value) {
  const number = asNumber(value);

  return number === null
    ? "—"
    : new Intl.NumberFormat("en-IN").format(number);
}


function formatCurrency(value) {
  const number = asNumber(value);

  if (number === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(number);
}


function formatStatus(value) {
  return String(value || "unknown")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}


function readDashboard(response) {
  const data = response?.data || response;

  return data?.stats || data || {};
}


/* ============================================================
   METRIC CARD
============================================================ */

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  to,
  tone = "green",
}) {
  return (
    <Link
      to={to}
      className={`avd-metric avd-metric--${tone}`}
    >
      <div className="avd-metric-top">
        <span className="avd-metric-icon">
          <Icon size={19} strokeWidth={1.8} />
        </span>

        <ArrowRight
          size={15}
          className="avd-metric-arrow"
        />
      </div>

      <div className="avd-metric-body">
        <span className="avd-metric-label">
          {label}
        </span>

        <strong className="avd-metric-value">
          {value}
        </strong>

        <span className="avd-metric-description">
          {description}
        </span>
      </div>
    </Link>
  );
}


/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  icon: Icon,
  title,
  description,
  to,
}) {
  return (
    <Link
      to={to}
      className="avd-action"
    >
      <span className="avd-action-icon">
        <Icon
          size={18}
          strokeWidth={1.8}
        />
      </span>

      <span className="avd-action-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>

      <ChevronRight
        size={16}
        className="avd-action-arrow"
      />
    </Link>
  );
}


/* ============================================================
   STATUS ROW
============================================================ */

function StatusRow({
  icon: Icon,
  label,
  value,
  state = "neutral",
}) {
  return (
    <div className="avd-status-row">
      <span
        className={
          `avd-status-icon avd-status-icon--${state}`
        }
      >
        <Icon
          size={17}
          strokeWidth={1.8}
        />
      </span>

      <span className="avd-status-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </span>

      <span
        className={
          `avd-status-dot avd-status-dot--${state}`
        }
      />
    </div>
  );
}


/* ============================================================
   DASHBOARD PAGE
============================================================ */

export default function DashboardPage() {
  const {
    vendor,
    syncVendorProfile,
  } = useAuth();

  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [logoFailed, setLogoFailed] = useState(false);


  /* ==========================================================
     LOAD DASHBOARD STATISTICS
  ========================================================== */

  const loadDashboard = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await vendorApi.dashboard();

        setDashboard(
          readDashboard(response)
        );
      } catch (err) {
        setError(
          err?.message ||
          "Unable to load vendor dashboard."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );


  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);


  /* ==========================================================
     REFRESH BUSINESS PROFILE
     
     This keeps Dashboard branding synchronized
     with the vendor profile stored in the backend.
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    async function refreshVendorProfile() {
      try {
        const response =
          await vendorApi.getProfile();

        const data =
          response?.data || response;

        const profile =
          data?.vendor ||
          data?.profile ||
          data;

        if (
          !cancelled &&
          profile &&
          typeof profile === "object" &&
          !Array.isArray(profile) &&
          typeof syncVendorProfile === "function"
        ) {
          syncVendorProfile(profile);
        }
      } catch {
        // Keep existing vendor context when
        // the profile refresh is unavailable.
      }
    }

    refreshVendorProfile();

    return () => {
      cancelled = true;
    };
  }, [syncVendorProfile]);


  /* ==========================================================
     BUSINESS INFORMATION
  ========================================================== */

  const businessName =
    vendor?.business_name || "Your Business";

  const businessLogo =
    vendor?.logo_url || "";

  const businessBanner =
    vendor?.banner_url || "";

  useEffect(() => {
    setLogoFailed(false);
  }, [businessLogo]);

  const businessStatus = String(
    vendor?.status || "unknown"
  )
    .trim()
    .toLowerCase();

  const isApproved =
    businessStatus === "approved";


  /* ==========================================================
     SINGLE DASHBOARD BANNER

     - Uploaded banner becomes background.
     - No separate storefront banner.
     - Dark overlay maintains text readability.
     - Uploaded logo is displayed fully.
     - Existing welcome actions remain unchanged.
  ========================================================== */

  const welcomeBannerStyle = {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",

    minHeight: "250px",

    backgroundColor: "#173e32",

    backgroundImage: businessBanner
      ? `linear-gradient(
          90deg,
          rgba(10, 42, 30, 0.96) 0%,
          rgba(10, 42, 30, 0.91) 35%,
          rgba(10, 42, 30, 0.68) 60%,
          rgba(10, 42, 30, 0.30) 100%
        ), url("${businessBanner}")`
      : undefined,

    backgroundSize: "cover",

    backgroundPosition: "center",

    backgroundRepeat: "no-repeat",
  };


  /* ==========================================================
     DASHBOARD STATISTICS
  ========================================================== */

  const stats = dashboard || {};

  const productTotal = asNumber(
    stats.products?.total
  );

  const activeProducts = asNumber(
    stats.products?.active
  );

  const draftProducts = asNumber(
    stats.products?.draft
  );

  const totalOrders = asNumber(
    stats.orders?.total_orders
  );

  const totalOrderItems = asNumber(
    stats.orders?.total_order_items
  );

  const pendingOrderItems = asNumber(
    stats.orders?.pending_order_items
  );

  const ledgerTotal = asNumber(
    stats.earnings?.ledger_total
  );

  const pendingPayout = asNumber(
    stats.earnings?.pending_payout
  );

  const paidPayout = asNumber(
    stats.earnings?.paid_payout
  );


  /* ==========================================================
     LOADING STATE
  ========================================================== */

  if (loading && dashboard === null) {
    return (
      <div className="avd-dashboard">
        <div className="avd-loading">
          <span className="avd-loading-spinner" />

          <strong>
            Loading your dashboard
          </strong>

          <p>
            Retrieving your latest business information.
          </p>
        </div>
      </div>
    );
  }


  /* ==========================================================
     ERROR STATE
  ========================================================== */

  if (error && dashboard === null) {
    return (
      <div className="avd-dashboard">
        <div className="avd-error-state">
          <span className="avd-error-icon">
            <CircleAlert size={26} />
          </span>

          <h2>Dashboard unavailable</h2>

          <p>{error}</p>

          <button
            type="button"
            className="avd-button avd-button--primary"
            onClick={() => loadDashboard()}
          >
            <RefreshCw size={16} />

            Try Again
          </button>
        </div>
      </div>
    );
  }


  /* ==========================================================
     MAIN DASHBOARD
  ========================================================== */

  return (
    <div className="avd-dashboard">

      {/* ======================================================
          SINGLE BRANDED WELCOME BANNER
      ====================================================== */}

      <section
        className="avd-welcome"
        style={welcomeBannerStyle}
      >
        <div
          className="avd-welcome-content"
          style={{
            position: "relative",
            zIndex: 1,
          }}
        >

          {/* SMALL STORE LOGO */}

          {businessLogo && !logoFailed && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                width: "64px",
                height: "64px",

                marginBottom: "14px",
                padding: "7px",

                borderRadius: "14px",

                background: "#ffffff",

                border:
                  "1px solid rgba(255,255,255,0.7)",

                boxShadow:
                  "0 6px 20px rgba(0,0,0,0.15)",
              }}
            >
              <img
                src={businessLogo}
                alt={`${businessName} logo`}
                onError={() => setLogoFailed(true)}
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  objectPosition: "center",
                }}
              />
            </div>
          )}


          {/* WORKSPACE LABEL */}

          <span className="avd-welcome-eyebrow">
            <LayoutDashboard size={14} />
            YOUR BUSINESS WORKSPACE
          </span>


          {/* WELCOME HEADING */}

          <h1>
            Welcome back,
            <span>{businessName}</span>
          </h1>


          {/* DESCRIPTION */}

          <p>
            Manage your products, track orders,
            and grow your AUMVEDA business—all
            in one place.
          </p>


          {/* WELCOME ACTIONS */}

          <div className="avd-welcome-actions">
            <Link
              to="/products/new"
              className="avd-button avd-button--light"
            >
              <Plus size={16} />

              Add Product
            </Link>

            <Link
              to="/orders"
              className="avd-button avd-button--outline"
            >
              View Orders

              <ArrowRight size={16} />
            </Link>
          </div>
        </div>


        {/* BUSINESS STATUS */}

        <div
          className="avd-welcome-aside"
          style={{
            position: "relative",
            zIndex: 1,
          }}
        >
          <div className="avd-welcome-status">
            <span className="avd-welcome-status-icon">
              <BadgeCheck size={19} />
            </span>

            <span>
              <small>
                BUSINESS STATUS
              </small>

              <strong>
                {formatStatus(businessStatus)}
              </strong>
            </span>
          </div>
        </div>
      </section>


      {/* ======================================================
          BUSINESS OVERVIEW HEADING
      ====================================================== */}

      <div className="avd-section-heading">
        <div>
          <span className="avd-eyebrow">
            BUSINESS OVERVIEW
          </span>

          <h2>
            Your business at a glance
          </h2>

          <p>
            Live overview of your vendor account.
          </p>
        </div>

        <button
          type="button"
          className="avd-refresh"
          disabled={refreshing}
          onClick={() => loadDashboard(true)}
        >
          <RefreshCw
            size={15}
            className={
              refreshing ? "avd-spin" : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh Data"}
        </button>
      </div>


      {/* DASHBOARD REFRESH ERROR */}

      {error && (
        <div
          className="avd-inline-error"
          role="alert"
        >
          <CircleAlert size={17} />

          <span>
            Could not refresh dashboard: {error}.
            Previously loaded values are shown.
          </span>
        </div>
      )}


      {/* ======================================================
          BUSINESS METRICS
      ====================================================== */}

      <section
        className="avd-metrics"
        aria-label="Business statistics"
      >

        <MetricCard
          icon={Package}
          label="Total Products"
          value={formatNumber(productTotal)}
          description="Catalogue products"
          to="/products"
          tone="green"
        />

        <MetricCard
          icon={PackageCheck}
          label="Active Products"
          value={formatNumber(activeProducts)}
          description="Active listings"
          to="/products"
          tone="sage"
        />

        <MetricCard
          icon={ShoppingBag}
          label="Total Orders"
          value={formatNumber(totalOrders)}
          description="Customer orders"
          to="/orders"
          tone="cream"
        />

        <MetricCard
          icon={Clock3}
          label="Pending Order Items"
          value={formatNumber(pendingOrderItems)}
          description="Awaiting processing"
          to="/orders"
          tone="gold"
        />

        <MetricCard
          icon={TrendingUp}
          label="Ledger Total"
          value={formatCurrency(ledgerTotal)}
          description="Recorded ledger amount"
          to="/earnings"
          tone="sage"
        />

        <MetricCard
          icon={Wallet}
          label="Pending Payouts"
          value={formatCurrency(pendingPayout)}
          description="Awaiting settlement"
          to="/payouts"
          tone="green"
        />
      </section>


      {/* ======================================================
          QUICK ACTIONS + STORE HEALTH
      ====================================================== */}

      <section className="avd-main-grid">

        {/* QUICK ACTIONS */}

        <article className="avd-panel">
          <div className="avd-panel-heading">
            <div>
              <span className="avd-eyebrow">
                QUICK ACTIONS
              </span>

              <h3>
                Manage your store
              </h3>

              <p>
                Access your daily business tasks.
              </p>
            </div>

            <span className="avd-panel-heading-icon">
              <Store size={19} />
            </span>
          </div>

          <div className="avd-actions">

            <QuickAction
              icon={Plus}
              title="Add New Product"
              description="Create a catalogue listing"
              to="/products/new"
            />

            <QuickAction
              icon={ShoppingBag}
              title="Manage Orders"
              description="Review customer orders"
              to="/orders"
            />

            <QuickAction
              icon={Warehouse}
              title="Manage Inventory"
              description="Update stock and availability"
              to="/inventory"
            />

            <QuickAction
              icon={IndianRupee}
              title="Earnings & Payouts"
              description="Review financial activity"
              to="/earnings"
            />
          </div>
        </article>


        {/* STORE HEALTH */}

        <article className="avd-panel">
          <div className="avd-panel-heading">
            <div>
              <span className="avd-eyebrow">
                STORE HEALTH
              </span>

              <h3>
                Business status
              </h3>

              <p>
                Your store's current information.
              </p>
            </div>

            <span className="avd-panel-heading-icon">
              <BadgeCheck size={19} />
            </span>
          </div>

          <div className="avd-status-list">

            <StatusRow
              icon={BadgeCheck}
              label="Vendor account"
              value={formatStatus(businessStatus)}
              state={
                isApproved
                  ? "good"
                  : "attention"
              }
            />

            <StatusRow
              icon={Package}
              label="Product catalogue"
              value={
                productTotal === null
                  ? "Unavailable"
                  : `${formatNumber(productTotal)} total products`
              }
              state={
                productTotal === null
                  ? "neutral"
                  : productTotal > 0
                    ? "good"
                    : "attention"
              }
            />

            <StatusRow
              icon={PackageCheck}
              label="Draft products"
              value={
                draftProducts === null
                  ? "Unavailable"
                  : `${formatNumber(draftProducts)} drafts`
              }
              state="neutral"
            />

            <StatusRow
              icon={ShoppingBag}
              label="Order items"
              value={
                totalOrderItems === null
                  ? "Unavailable"
                  : `${formatNumber(totalOrderItems)} total items`
              }
              state="neutral"
            />
          </div>
        </article>
      </section>


      {/* ======================================================
          FINANCIAL OVERVIEW
      ====================================================== */}

      <section className="avd-finance-panel">

        <div className="avd-finance-heading">
          <div>
            <span className="avd-eyebrow">
              FINANCIAL OVERVIEW
            </span>

            <h3>
              Settlement summary
            </h3>

            <p>
              Your recorded financial activity.
            </p>
          </div>

          <Link
            to="/payouts"
            className="avd-text-link"
          >
            View Payouts
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="avd-finance-grid">

          <div className="avd-finance-item">
            <span>
              Pending Settlement
            </span>

            <strong>
              {formatCurrency(pendingPayout)}
            </strong>

            <small>
              Awaiting payout
            </small>
          </div>

          <div className="avd-finance-item">
            <span>
              Paid Settlements
            </span>

            <strong>
              {formatCurrency(paidPayout)}
            </strong>

            <small>
              Completed payouts
            </small>
          </div>

          <div className="avd-finance-item">
            <span>
              Ledger Total
            </span>

            <strong>
              {formatCurrency(ledgerTotal)}
            </strong>

            <small>
              Recorded ledger entries
            </small>
          </div>
        </div>

        <p className="avd-finance-note">
          Financial values reflect current backend records.
          Ledger entries may include multiple transaction types.
        </p>
      </section>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <section className="avd-footer-strip">

        <span className="avd-footer-icon">
          <Store size={20} />
        </span>

        <div>
          <strong>
            Your AUMVEDA business workspace
          </strong>

          <p>
            Manage your catalogue and business information.
          </p>
        </div>

        <Link to="/profile">
          Business Profile
          <ChevronRight size={16} />
        </Link>
      </section>

    </div>
  );
}
