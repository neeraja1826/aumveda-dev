import "./NotificationsPage.css";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Bell,
  BellOff,
  CheckCheck,
  Check,
  RefreshCw,
  ShoppingBag,
  RotateCcw,
  KeyRound,
  ArrowRight,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CircleCheck,
  CircleX,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import notificationApi, {
  NOTIFICATION_CHANGE_EVENT,
} from "../services/notificationApi";

// ============================================================
// CONFIGURATION
// ============================================================

const PAGE_SIZE = 20;

const REFRESH_INTERVAL = 5000;

// ============================================================
// READ FILTERS
// ============================================================

const READ_FILTERS = [
  {
    label: "All Notifications",
    value: "all",
  },
  {
    label: "Unread",
    value: "unread",
  },
  {
    label: "Read",
    value: "read",
  },
];

// ============================================================
// NOTIFICATION CATEGORIES
// ============================================================

const NOTIFICATION_TYPES = [
  {
    label: "All Categories",
    value: "all",
  },
  {
    label: "New Orders",
    value: "new_order",
  },
  {
    label: "Product Approvals",
    value: "product_approved",
  },
  {
    label: "Product Rejections",
    value: "product_rejected",
  },
  {
    label: "Return Requests",
    value: "return_request_approved",
  },
  {
    label: "Exchange Requests",
    value: "exchange_request_approved",
  },
];

// ============================================================
// NOTIFICATION CONFIGURATION
// ============================================================

const NOTIFICATION_CONFIG = {
  new_order: {
    icon: ShoppingBag,
    label: "New Order",
    path: "/orders",
    pageKey: "orders",
    color: "green",
  },

  product_approved: {
    icon: CircleCheck,
    label: "Product Approved",
    path: "/products",
    pageKey: "products",
    color: "green",
  },

  product_rejected: {
    icon: CircleX,
    label: "Product Rejected",
    path: "/products",
    pageKey: "products",
    color: "red",
    customStyle: {
      color: "#B91C1C",
      backgroundColor: "#FEE2E2",
    },
  },

  return_request_approved: {
    icon: RotateCcw,
    label: "Return Request",
    path: "/returns",
    pageKey: "shipping",
    color: "orange",
  },

  exchange_request_approved: {
    icon: RotateCcw,
    label: "Exchange Request",
    path: "/returns",
    pageKey: "shipping",
    color: "blue",
  },

  employee_password_request: {
    icon: KeyRound,
    label: "Password Assistance",
    path: "/team",
    pageKey: "team",
    color: "purple",
  },
};

const DEFAULT_CONFIG = {
  icon: Bell,
  label: "General Notification",
  path: null,
  pageKey: null,
  color: "green",
};

// ============================================================
// DATE FORMATTER
// ============================================================

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

// ============================================================
// NOTIFICATION CARD
// ============================================================

function NotificationCard({
  notification,
  canOpen,
  onRead,
  onOpen,
  busy,
}) {
  const config =
    NOTIFICATION_CONFIG[
      notification.notification_type
    ] || DEFAULT_CONFIG;

  const Icon = config.icon;

  return (
    <article
      className={`avn-notification-card ${
        !notification.is_read
          ? "unread"
          : ""
      }`}
    >

      <div
        className={`avn-notification-icon ${config.color}`}
        style={config.customStyle}
      >
        <Icon
          size={22}
          strokeWidth={1.8}
        />
      </div>

      <div className="avn-notification-content">

        <div className="avn-notification-meta">

          <span
            className={`avn-type-badge ${config.color}`}
            style={config.customStyle}
          >
            {config.label}
          </span>

          {!notification.is_read && (
            <span className="avn-unread-indicator">
              <span />
              Unread
            </span>
          )}

        </div>

        <h3>
          {notification.title || "Notification"}
        </h3>

        <p>
          {notification.message}
        </p>

        <div className="avn-notification-date">

          <Clock size={13} />

          <span>
            {formatDate(notification.created_at)}
          </span>

        </div>

      </div>

      <div className="avn-notification-actions">

        {!notification.is_read && (
          <button
            type="button"
            className="avn-read-button"
            disabled={busy}
            onClick={() =>
              onRead(notification.id)
            }
          >
            <Check size={16} />
            Mark as read
          </button>
        )}

        {canOpen && (
          <button
            type="button"
            className="avn-open-button"
            disabled={busy}
            onClick={() =>
              onOpen(
                notification,
                config.path
              )
            }
          >
            View Details

            <ArrowRight size={15} />

          </button>
        )}

      </div>

    </article>
  );
}

// ============================================================
// MAIN NOTIFICATIONS PAGE
// ============================================================

export default function NotificationsPage() {
  const navigate = useNavigate();

  const {
    user,
    membership,
    isOwner,
    canAccess,
    permissionsReady,
  } = useAuth();

  const userId =
    user?.id ||
    user?.user_id ||
    membership?.user_id;

  // ==========================================================
  // STATE
  // ==========================================================

  const [notifications, setNotifications] =
    useState([]);

  const [readStatus, setReadStatus] =
    useState("all");

  const [notificationType, setNotificationType] =
    useState("all");

  const [offset, setOffset] =
    useState(0);

  const [total, setTotal] =
    useState(0);

  const [hasMore, setHasMore] =
    useState(false);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [busyId, setBusyId] =
    useState(null);

  const [markingAll, setMarkingAll] =
    useState(false);

  const [refreshKey, setRefreshKey] =
    useState(0);

  const busy = Boolean(
    busyId || markingAll
  );

  // ==========================================================
  // AVAILABLE CATEGORIES
  // ==========================================================

  const availableTypes = isOwner
    ? [
        ...NOTIFICATION_TYPES,
        {
          label: "Password Assistance",
          value: "employee_password_request",
        },
      ]
    : NOTIFICATION_TYPES;

  // ==========================================================
  // MANUAL REFRESH
  // ==========================================================

  const refreshNotifications = useCallback(() => {
    setRefreshKey(
      (previous) => previous + 1
    );
  }, []);

  // ==========================================================
  // RESET ACCOUNT DATA
  // ==========================================================

  useEffect(() => {
    setNotifications([]);
    setUnreadCount(0);
    setTotal(0);
    setHasMore(false);
    setOffset(0);
    setReadStatus("all");
    setNotificationType("all");
    setError("");
    setActionError("");
    setSuccessMessage("");
    setLoading(Boolean(userId));
  }, [userId]);

  // ==========================================================
  // AUTOMATIC FETCH AND REFRESH
  // ==========================================================

  useEffect(() => {
    if (!userId || !permissionsReady) {
      return;
    }

    if (busy) return;

    let active = true;

    let requestInProgress = false;

    let refreshRequested = false;

    let controller = null;

    async function loadNotifications(
      silent = false
    ) {
      if (!active) return;

      if (requestInProgress) {
        refreshRequested = true;
        return;
      }

      requestInProgress = true;

      const requestController =
        new AbortController();

      controller = requestController;

      const timeout = window.setTimeout(() => {
        requestController.abort();
      }, 15000);

      if (!silent) {
        setLoading(true);
        setError("");
      }

      try {
        const result =
          await notificationApi.getNotifications(
            {
              read_status: readStatus,
              notification_type: notificationType,
              limit: PAGE_SIZE,
              offset,
            },
            requestController.signal
          );

        if (
          !active ||
          requestController.signal.aborted
        ) {
          return;
        }

        if (!Array.isArray(result?.data)) {
          throw new Error(
            "Invalid notifications API response."
          );
        }

        const nextTotal =
          Math.max(
            0,
            Number(result.total) || 0
          );

        // Move back a page if the current page
        // becomes empty following a read operation.

        if (
          offset > 0 &&
          offset >= nextTotal
        ) {
          setOffset(
            Math.max(
              0,
              Math.floor(
                Math.max(0, nextTotal - 1) /
                  PAGE_SIZE
              ) * PAGE_SIZE
            )
          );

          return;
        }

        let nextUnreadCount =
          result.unread_count;

        if (
          nextUnreadCount === undefined ||
          nextUnreadCount === null ||
          !Number.isFinite(
            Number(nextUnreadCount)
          )
        ) {
          const countResult =
            await notificationApi.getUnreadCount(
              requestController.signal
            );

          nextUnreadCount =
            countResult?.unread_count;
        }

        if (
          !active ||
          requestController.signal.aborted
        ) {
          return;
        }

        setNotifications(result.data);

        setTotal(nextTotal);

        setHasMore(
          Boolean(result.has_more)
        );

        setUnreadCount(
          Math.max(
            0,
            Number(nextUnreadCount) || 0
          )
        );

        setError("");

      } catch (err) {
        if (!active) return;

        if (err?.name === "AbortError") {
          if (!silent) {
            setError(
              "The notification request timed out. Please try again."
            );
          }

          return;
        }

        // Preserve the current notification list
        // if a background refresh temporarily fails.

        if (!silent) {
          setError(
            err?.message ||
              "Unable to load notifications."
          );
        }

        if (
          err?.status === 401 ||
          err?.status === 403
        ) {
          setNotifications([]);
          setTotal(0);
          setHasMore(false);
          setUnreadCount(0);
        }

        console.warn(
          "Notifications refresh failed:",
          err.message
        );

      } finally {
        window.clearTimeout(timeout);

        requestInProgress = false;

        if (
          controller === requestController
        ) {
          controller = null;
        }

        if (active) {
          setLoading(false);

          if (refreshRequested) {
            refreshRequested = false;

            loadNotifications(true);
          }
        }
      }
    }

    function handleBackgroundRefresh() {
      loadNotifications(true);
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState === "visible"
      ) {
        loadNotifications(true);
      }
    }

    // Initial request with loading state.

    loadNotifications(false);

    // Background refresh without UI flickering.

    const interval = window.setInterval(
      handleBackgroundRefresh,
      REFRESH_INTERVAL
    );

    window.addEventListener(
      "focus",
      handleBackgroundRefresh
    );

    window.addEventListener(
      NOTIFICATION_CHANGE_EVENT,
      handleBackgroundRefresh
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      active = false;

      controller?.abort();

      window.clearInterval(interval);

      window.removeEventListener(
        "focus",
        handleBackgroundRefresh
      );

      window.removeEventListener(
        NOTIFICATION_CHANGE_EVENT,
        handleBackgroundRefresh
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };

  }, [
    userId,
    permissionsReady,
    readStatus,
    notificationType,
    offset,
    refreshKey,
    busy,
  ]);

  // ==========================================================
  // CLEAR SUCCESS MESSAGE
  // ==========================================================

  useEffect(() => {
    if (!successMessage) return;

    const timeout = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3500);

    return () => {
      window.clearTimeout(timeout);
    };

  }, [successMessage]);

  // ==========================================================
  // RELATED MODULE PERMISSIONS
  // ==========================================================

  function canOpenNotification(notification) {
    const config =
      NOTIFICATION_CONFIG[
        notification.notification_type
      ];

    if (
      !config?.path ||
      !config?.pageKey ||
      !permissionsReady
    ) {
      return false;
    }

    if (
      notification.notification_type ===
        "employee_password_request" &&
      !isOwner
    ) {
      return false;
    }

    return canAccess(config.pageKey);
  }

  // ==========================================================
  // FILTER HANDLERS
  // ==========================================================

  function handleReadFilter(value) {
    setReadStatus(value);
    setOffset(0);
    setActionError("");
  }

  function handleTypeFilter(value) {
    setNotificationType(value);
    setOffset(0);
    setActionError("");
  }

  // ==========================================================
  // MARK SINGLE NOTIFICATION AS READ
  // ==========================================================

  async function handleMarkAsRead(id) {
    if (busy) return;

    setBusyId(id);

    setActionError("");
    setSuccessMessage("");

    try {
      await notificationApi.markAsRead(id);

      setNotifications((previous) => {
        if (readStatus === "unread") {
          return previous.filter(
            (item) => item.id !== id
          );
        }

        return previous.map((item) =>
          item.id === id
            ? {
                ...item,
                is_read: true,
              }
            : item
        );
      });

      setUnreadCount((previous) =>
        Math.max(0, previous - 1)
      );

      setSuccessMessage(
        "Notification marked as read."
      );

      refreshNotifications();

    } catch (err) {
      setActionError(
        err?.message ||
          "Unable to update notification."
      );

    } finally {
      setBusyId(null);
    }
  }

  // ==========================================================
  // MARK ALL AS READ
  // ==========================================================

  async function handleMarkAllAsRead() {
    if (busy || unreadCount === 0) {
      return;
    }

    setMarkingAll(true);

    setActionError("");
    setSuccessMessage("");

    try {
      await notificationApi.markAllAsRead();

      setUnreadCount(0);

      setOffset(0);

      setNotifications((previous) => {
        if (readStatus === "unread") {
          return [];
        }

        return previous.map((item) => ({
          ...item,
          is_read: true,
        }));
      });

      setSuccessMessage(
        "All notifications marked as read."
      );

      refreshNotifications();

    } catch (err) {
      setActionError(
        err?.message ||
          "Unable to update notifications."
      );

    } finally {
      setMarkingAll(false);
    }
  }

  // ==========================================================
  // OPEN RELATED MODULE
  // ==========================================================

  async function handleOpenNotification(
    notification,
    path
  ) {
    if (
      busy ||
      !path ||
      !canOpenNotification(notification)
    ) {
      return;
    }

    setBusyId(notification.id);

    setActionError("");

    try {
      if (!notification.is_read) {
        await notificationApi.markAsRead(
          notification.id
        );
      }

      // New Order -> Orders
      // Product Approved -> Products
      // Product Rejected -> Products
      // Return / Exchange -> Returns
      // Password Assistance -> Team

      navigate(path);

    } catch (err) {
      setActionError(
        err?.message ||
          "Unable to open notification."
      );

    } finally {
      setBusyId(null);
    }
  }

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const currentPage =
    Math.floor(offset / PAGE_SIZE) + 1;

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE)
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="avn-page">

      {/* PAGE HEADER */}

      <header className="avn-page-header">

        <div className="avn-page-heading">

          <div className="avn-header-icon">
            <Bell
              size={25}
              strokeWidth={1.8}
            />
          </div>

          <div>

            <h1>Notifications</h1>

            <p>
              Stay updated with your business
              activity and important alerts.
            </p>

          </div>

        </div>

        <div className="avn-header-actions">

          <button
            type="button"
            className="avn-refresh-button"
            disabled={loading || busy}
            onClick={refreshNotifications}
          >

            <RefreshCw
              size={17}
              className={
                loading ? "avn-spinning" : ""
              }
            />

            Refresh

          </button>

          <button
            type="button"
            className="avn-mark-all-button"
            disabled={
              loading ||
              busy ||
              Boolean(error) ||
              unreadCount === 0
            }
            onClick={handleMarkAllAsRead}
          >

            <CheckCheck size={18} />

            {markingAll
              ? "Updating..."
              : "Mark all as read"}

          </button>

        </div>

      </header>

      {/* SUMMARY */}

      <div className="avn-summary">

        <div className="avn-summary-icon">
          <Bell size={22} />
        </div>

        <div className="avn-summary-text">

          <span>
            Unread notifications
          </span>

          <strong>
            {unreadCount}
          </strong>

        </div>

        <div className="avn-summary-message">

          {unreadCount === 0
            ? "You're all caught up!"
            : "You have new updates to review."}

        </div>

      </div>

      {/* SUCCESS MESSAGE */}

      {successMessage && (
        <div
          className="avn-success-message"
          role="status"
        >
          <CheckCheck size={18} />

          {successMessage}

        </div>
      )}

      {/* ERROR MESSAGE */}

      {actionError && (
        <div
          className="avn-error-message"
          role="alert"
        >
          <AlertCircle size={18} />

          {actionError}

        </div>
      )}

      {/* NOTIFICATION PANEL */}

      <div className="avn-list-panel">

        <div className="avn-toolbar">

          <div className="avn-tabs">

            {READ_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                disabled={busy}
                aria-pressed={
                  readStatus === filter.value
                }
                className={`avn-tab ${
                  readStatus === filter.value
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleReadFilter(filter.value)
                }
              >

                {filter.label}

                {filter.value === "unread" &&
                  unreadCount > 0 && (
                    <span className="avn-tab-count">
                      {unreadCount}
                    </span>
                  )}

              </button>
            ))}

          </div>

          <select
            className="avn-category-select"
            aria-label="Notification category"
            value={notificationType}
            disabled={busy}
            onChange={(event) =>
              handleTypeFilter(
                event.target.value
              )
            }
          >

            {availableTypes.map((type) => (
              <option
                key={type.value}
                value={type.value}
              >
                {type.label}
              </option>
            ))}

          </select>

        </div>

        {/* LOADING */}

        {loading ? (

          <div className="avn-state">

            <RefreshCw
              size={28}
              className="avn-spinning"
            />

            <h3>
              Loading notifications...
            </h3>

          </div>

        ) : error ? (

          <div className="avn-state avn-error-state">

            <AlertCircle size={34} />

            <h3>
              Unable to load notifications
            </h3>

            <p>{error}</p>

            <button
              type="button"
              className="avn-refresh-button"
              onClick={refreshNotifications}
            >
              Try Again
            </button>

          </div>

        ) : notifications.length === 0 ? (

          <div className="avn-state">

            <div className="avn-empty-icon">
              <BellOff size={34} />
            </div>

            <h3>
              No notifications found
            </h3>

            <p>
              {readStatus === "unread"
                ? "You have no unread notifications."
                : "There are no notifications matching your selection."}
            </p>

          </div>

        ) : (

          <div className="avn-notification-list">

            {notifications.map(
              (notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  canOpen={
                    canOpenNotification(notification)
                  }
                  busy={busy}
                  onRead={handleMarkAsRead}
                  onOpen={handleOpenNotification}
                />
              )
            )}

          </div>

        )}

        {/* PAGINATION */}

        {!loading && !error && total > 0 && (

          <footer className="avn-pagination">

            <span className="avn-pagination-info">

              Showing {offset + 1}–
              {Math.min(
                offset + notifications.length,
                total
              )}{" "}
              of {total} notifications

            </span>

            <div className="avn-pagination-controls">

              <button
                type="button"
                aria-label="Previous page"
                disabled={offset === 0 || busy}
                onClick={() =>
                  setOffset((previous) =>
                    Math.max(
                      0,
                      previous - PAGE_SIZE
                    )
                  )
                }
              >

                <ChevronLeft size={18} />

              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                aria-label="Next page"
                disabled={!hasMore || busy}
                onClick={() =>
                  setOffset((previous) =>
                    previous + PAGE_SIZE
                  )
                }
              >

                <ChevronRight size={18} />

              </button>

            </div>

          </footer>

        )}

      </div>

    </section>
  );
}