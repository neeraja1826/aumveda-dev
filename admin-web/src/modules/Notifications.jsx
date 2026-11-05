
import { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  ShoppingBag,
  Store,
  Package,
  CreditCard,
  RotateCcw,
  Check,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';

import { AyurvedicHeroBanner } from '../components/AyurvedicDoodles.jsx';

import {
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from '../services/adminService.js';

const notificationIcons = {
  new_order: ShoppingBag,
  new_vendor: Store,
  new_product: Package,
  new_payment: CreditCard,
  new_return: RotateCcw,
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

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const [filter, setFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [updatingId, setUpdatingId] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const [reload, setReload] = useState(0);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        limit: 50,
        offset: 0,
      };

      if (filter === 'unread') {
        params.is_read = false;
      } else if (filter === 'read') {
        params.is_read = true;
      }

      const [notificationResult, countResult] = await Promise.all([
        getAdminNotifications(params),
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
  }, [filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications, reload]);

  async function handleMarkAsRead(notificationId) {
    if (updatingId) return;

    setUpdatingId(notificationId);
    setError('');
    setSuccess('');

    try {
      await markAdminNotificationRead(notificationId);

      setSuccess('Notification marked as read.');
      await loadNotifications();
    } catch (requestError) {
      setError(
        requestError.message || 'Unable to update notification.'
      );
    } finally {
      setUpdatingId('');
    }
  }

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

          <div className="notification-filters">
            {['all', 'unread', 'read'].map((value) => (
              <button
                key={value}
                type="button"
                className={`notification-filter ${
                  filter === value ? 'active' : ''
                }`}
                onClick={() => {
                  setFilter(value);
                  setSuccess('');
                }}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>

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
              {filter === 'unread'
                ? 'You are all caught up. No unread notifications.'
                : filter === 'read'
                  ? 'No read notifications available.'
                  : 'Notifications will appear here when admin events are generated.'}
            </span>
          </div>

        ) : (

          /* Notification Items */
          <div className="notification-list">

            {items.map((item) => {
              const Icon =
                notificationIcons[item.notification_type] || Bell;

              return (
                <article
                  key={item.id}
                  className={`notification-item ${
                    item.is_read ? 'read' : 'unread'
                  }`}
                >

                  <div className="notification-icon">
                    <Icon size={19} strokeWidth={1.8} />
                  </div>

                  <div className="notification-content">

                    <div className="notification-heading">
                      <strong>{item.title}</strong>

                      {!item.is_read && (
                        <span className="notification-unread-dot" />
                      )}
                    </div>

                    <p>{item.message}</p>

                    <div className="notification-meta">
                      <span className="notification-type">
                        {(item.notification_type || 'general')
                          .replaceAll('_', ' ')}
                      </span>

                      <span className="notification-date">
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                  </div>

                  {!item.is_read && (
                    <button
                      type="button"
                      className="notification-read-button"
                      onClick={() => handleMarkAsRead(item.id)}
                      disabled={updatingId === item.id}
                      title="Mark notification as read"
                    >
                      <Check size={15} />

                      <span>
                        {updatingId === item.id
                          ? 'Updating...'
                          : 'Mark read'}
                      </span>
                    </button>
                  )}

                </article>
              );
            })}

          </div>
        )}

      </div>
    </section>
  );
}
<style>{`
  .notifications-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px;
    color: #263238;
  }

  .notification-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .notification-summary-card,
  .notification-item {
    padding: 20px;
    border: 1px solid #e8edef;
    border-radius: 12px;
    background: #fff;
  }

  .notification-item.unread {
    background: #f5fafa;
    border-color: #d5e9e6;
  }

  .notification-filters {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .notification-filters button {
    padding: 9px 14px;
    border: 1px solid #e1e7e9;
    border-radius: 8px;
    background: #fff;
    cursor: pointer;
  }

  .notification-filters button.active {
    background: #eaf4f3;
    border-color: #a8ceca;
    color: #286b65;
  }

  @media (max-width: 768px) {
    .notifications-page {
      padding: 16px;
    }

    .notification-summary {
      grid-template-columns: 1fr;
    }
  }
`}</style>