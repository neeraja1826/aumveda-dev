
import { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  ShoppingBag,
  Store,
  Package,
  CreditCard,
  RotateCcw,
  Truck,
  LifeBuoy,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';

import { AyurvedicHeroBanner } from '../components/AyurvedicDoodles.jsx';

import {
  getAdminNotifications,
  getAdminUnreadCount,
  markAllAdminNotificationsRead,
} from '../services/adminService.js';
import { Link } from 'react-router-dom';

const notificationIcons = {
  new_order: ShoppingBag,
  new_vendor: Store,
  new_product: Package,
  new_payment: CreditCard,
  new_return: RotateCcw,
  order: ShoppingBag,
  orders: ShoppingBag,
  payment: CreditCard,
  payments: CreditCard,
  vendor_payout: CreditCard,
  vendor_payouts: CreditCard,
  payout: CreditCard,
  refund: RotateCcw,
  refunds: RotateCcw,
  return_request: RotateCcw,
  return_requests: RotateCcw,
  product: Package,
  products: Package,
  vendor_product: Package,
  vendor_products: Package,
  vendor_product_updated: Package,
  product_variant: Package,
  product_variants: Package,
  shipment: Truck,
  shipments: Truck,
  support_ticket: LifeBuoy,
  support_tickets: LifeBuoy,
};

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatNotificationType = (value) =>
  (value || 'general').replaceAll('_', ' ');

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [markingAll, setMarkingAll] = useState(false);

  const [reload, setReload] = useState(0);


  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [notificationResult, countResult] = await Promise.all([
        getAdminNotifications({
          limit: 50,
          offset: 0,
        }),
        getAdminUnreadCount(),
      ]);

      const notificationItems = Array.isArray(notificationResult)
        ? notificationResult
        : notificationResult?.items || [];

      setItems(notificationItems);
      setTotal(notificationResult?.total ?? notificationItems.length);
      setUnreadCount(countResult?.unread_count ?? 0);
    } catch (requestError) {
      setError(
        requestError.message || 'Unable to load notifications.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications, reload]);

  async function handleMarkAllAsRead() {
    if (!unreadCount || markingAll) return;

    setMarkingAll(true);
    setError('');
    setSuccess('');

    try {
      await markAllAdminNotificationsRead();

      setSuccess('All notifications marked as read.');
      await loadNotifications();

    } catch (requestError) {
      setError(
        requestError.message || 'Unable to mark notifications as read.'
      );
    } finally {
      setMarkingAll(false);
    }
  }

  const readCount = items.filter((item) => item.is_read).length;

  return (
    <section className="module-page notifications-page">
      {/* Page Header */}
      <AyurvedicHeroBanner
        eyebrow="AUMVEDA ADMIN UPDATES"
        title="Notifications"
        description="Stay updated with important orders, vendors, products, payments and store activities."
        badgeText={`${unreadCount} Unread`}
        doodle="leaf"
      >
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setSuccess('');
            setReload((current) => current + 1);
          }}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </AyurvedicHeroBanner>

      {/* Summary Cards */}
      <div className="notification-summary">
        <div className="notification-stat">
          <span>Total Notifications</span>
          <strong>{total}</strong>
        </div>

        <div className="notification-stat">
          <span>Unread Notifications</span>
          <strong>{unreadCount}</strong>
        </div>

        <div className="notification-stat">
          <span>Read on This Page</span>
          <strong>{readCount}</strong>
        </div>
      </div>

      {/* Notifications List */}
      <div className="module-card">
        {/* Toolbar */}
        <div className="notification-toolbar">
          <button
            type="button"
            className="notification-mark-all"
            onClick={handleMarkAllAsRead}
            disabled={!unreadCount || markingAll}
          >
            <CheckCheck size={15} />
            {markingAll ? 'Updating...' : 'Mark all as read'}
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="notification-success" role="status">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-state" role="alert">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="loading-state">
            Loading notifications...
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="notification-empty">
            <div className="notification-empty-icon">
              <Bell size={30} />
            </div>

            <strong>No notifications found</strong>

            <span>
              Notifications will appear here when admin events are generated.
            </span>
          </div>
        ) : (
          /* Notification Items */
          <div className="notification-list">
            {items.map((item) => {
              const Icon =
                notificationIcons[item.reference_type] ||
                notificationIcons[item.notification_type] ||
                Bell;

              return (
                <Link
                  key={item.id}
                  to={`/admin/notifications/${encodeURIComponent(item.id)}`}
                  state={{ notification: item }}
                  className={`notification-item ${
                    item.is_read ? 'read' : 'unread'
                  } notification-item-clickable`}
                  aria-label={[
                    item.title || 'Notification',
                    item.is_read ? null : 'Unread',
                    item.message,
                    formatDate(item.created_at),
                    'Open notification details',
                  ].filter(Boolean).join('. ')}
                >
                  <div className="notification-icon">
                    <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                  </div>

                  <div className="notification-content">
                    <div className="notification-heading">
                      <strong>{item.title || 'Notification'}</strong>

                      {!item.is_read && (
                        <span
                          className="notification-unread-dot"
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    <p>{item.message || 'No message available.'}</p>

                    <div className="notification-meta">
                      <span className="notification-type">
                        {formatNotificationType(item.notification_type)}
                      </span>

                      <span className="notification-date">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="notification-actions">
                    <span className="notification-open-hint">
                      Open details
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
.notification-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
}

.notification-item-clickable {
  cursor: pointer;
  color: inherit;
  text-decoration: none;
}

.notification-open-hint {
  color: #718582;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .notification-actions {
    width: 100%;
    margin-left: 0;
    justify-content: flex-end;
  }
}
`}</style>
    </section>
  );
}