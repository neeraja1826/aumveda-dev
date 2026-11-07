
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
  X,
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

const formatNotificationType = (value) =>
  (value || 'general').replaceAll('_', ' ');

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

  const [selectedNotification, setSelectedNotification] = useState(null);

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

      if (selectedNotification?.id === notificationId) {
        setSelectedNotification((current) =>
          current
            ? {
                ...current,
                is_read: true,
              }
            : current
        );
      }

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

      if (selectedNotification) {
        setSelectedNotification((current) =>
          current
            ? {
                ...current,
                is_read: true,
              }
            : current
        );
      }
    } catch (requestError) {
      setError(
        requestError.message || 'Unable to mark notifications as read.'
      );
    } finally {
      setMarkingAll(false);
    }
  }

  function openNotificationDetails(notification) {
    setSelectedNotification(notification);
  }

  function closeNotificationDetails() {
    setSelectedNotification(null);
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
                      <strong>{item.title || 'Notification'}</strong>

                      {!item.is_read && (
                        <span className="notification-unread-dot" />
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
                    <button
                      type="button"
                      className="notification-view-button"
                      onClick={() => openNotificationDetails(item)}
                    >
                      View Details
                    </button>

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
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Notification Details Modal */}
      {selectedNotification && (
        <div
          className="notification-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeNotificationDetails();
            }
          }}
        >
          <div
            className="notification-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-details-title"
          >
            <div className="notification-modal-header">
              <div>
                <span className="notification-modal-eyebrow">
                  Notification Details
                </span>

                <h2 id="notification-details-title">
                  {selectedNotification.title || 'Notification'}
                </h2>
              </div>

              <button
                type="button"
                className="notification-modal-close"
                onClick={closeNotificationDetails}
                aria-label="Close notification details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="notification-modal-icon">
              {(() => {
                const Icon =
                  notificationIcons[
                    selectedNotification.notification_type
                  ] || Bell;

                return <Icon size={24} strokeWidth={1.8} />;
              })()}
            </div>

            <div className="notification-details-grid">
              <div className="notification-detail-item">
                <span>Notification ID</span>
                <strong>{selectedNotification.id || '—'}</strong>
              </div>

              <div className="notification-detail-item">
                <span>Type</span>
                <strong>
                  {formatNotificationType(
                    selectedNotification.notification_type
                  )}
                </strong>
              </div>

              <div className="notification-detail-item">
                <span>Status</span>
                <strong
                  className={
                    selectedNotification.is_read
                      ? 'detail-status read-status'
                      : 'detail-status unread-status'
                  }
                >
                  {selectedNotification.is_read ? 'Read' : 'Unread'}
                </strong>
              </div>

              <div className="notification-detail-item">
                <span>Date & Time</span>
                <strong>
                  {formatDate(selectedNotification.created_at)}
                </strong>
              </div>

              {selectedNotification.recipient && (
                <div className="notification-detail-item">
                  <span>Recipient</span>
                  <strong>
                    {typeof selectedNotification.recipient === 'object'
                      ? JSON.stringify(selectedNotification.recipient)
                      : selectedNotification.recipient}
                  </strong>
                </div>
              )}

              {selectedNotification.recipient_id && (
                <div className="notification-detail-item">
                  <span>Recipient ID</span>
                  <strong>{selectedNotification.recipient_id}</strong>
                </div>
              )}
            </div>

            <div className="notification-message-box">
              <span>Message</span>
              <p>
                {selectedNotification.message ||
                  'No message available.'}
              </p>
            </div>

            <div className="notification-modal-footer">
              {!selectedNotification.is_read && (
                <button
                  type="button"
                  className="notification-read-button"
                  onClick={() =>
                    handleMarkAsRead(selectedNotification.id)
                  }
                  disabled={
                    updatingId === selectedNotification.id
                  }
                >
                  <Check size={15} />
                  {updatingId === selectedNotification.id
                    ? 'Updating...'
                    : 'Mark as Read'}
                </button>
              )}

              <button
                type="button"
                className="notification-modal-secondary"
                onClick={closeNotificationDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
.notification-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
}

.notification-view-button,
.notification-modal-secondary {
  padding: 8px 12px;
  border: 1px solid #dce5e5;
  border-radius: 8px;
  background: #fff;
  color: #365c58;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.notification-view-button:hover,
.notification-modal-secondary:hover {
  background: #f5f9f8;
  border-color: #b9d3d0;
}

.notification-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(24, 38, 37, 0.45);
}

.notification-modal {
  width: min(620px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  border: 1px solid #e3ebea;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(31, 50, 48, 0.18);
}

.notification-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 24px 18px;
  border-bottom: 1px solid #edf1f1;
}

.notification-modal-eyebrow {
  display: block;
  margin-bottom: 6px;
  color: #6b8582;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.notification-modal-header h2 {
  margin: 0;
  color: #263b39;
  font-size: 22px;
  line-height: 1.25;
}

.notification-modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid #e1e8e7;
  border-radius: 8px;
  background: #fff;
  color: #526967;
  cursor: pointer;
}

.notification-modal-close:hover {
  background: #f5f9f8;
}

.notification-modal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin: 22px 24px 18px;
  border-radius: 14px;
  background: #eaf4f3;
  color: #286b65;
}

.notification-details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 0 24px 20px;
}

.notification-detail-item {
  padding: 14px;
  border: 1px solid #edf1f1;
  border-radius: 10px;
  background: #fafcfc;
}

.notification-detail-item span,
.notification-message-box > span {
  display: block;
  margin-bottom: 6px;
  color: #718582;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.notification-detail-item strong {
  display: block;
  overflow-wrap: anywhere;
  color: #2c403e;
  font-size: 13px;
  line-height: 1.45;
}

.detail-status {
  text-transform: capitalize;
}

.read-status {
  color: #4f6d68 !important;
}

.unread-status {
  color: #286b65 !important;
}

.notification-message-box {
  margin: 0 24px 22px;
  padding: 16px;
  border: 1px solid #e5eeee;
  border-radius: 10px;
  background: #f7fbfa;
}

.notification-message-box p {
  margin: 0;
  color: #405452;
  font-size: 14px;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.notification-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 24px 22px;
  border-top: 1px solid #edf1f1;
}

@media (max-width: 768px) {
  .notification-actions {
    width: 100%;
    margin-left: 0;
  }

  .notification-view-button,
  .notification-read-button {
    flex: 1;
  }

  .notification-details-grid {
    grid-template-columns: 1fr;
  }

  .notification-modal-overlay {
    padding: 12px;
  }

  .notification-modal-header {
    padding: 20px 18px 16px;
  }

  .notification-modal-icon {
    margin-left: 18px;
    margin-right: 18px;
  }

  .notification-details-grid {
    padding-left: 18px;
    padding-right: 18px;
  }

  .notification-message-box {
    margin-left: 18px;
    margin-right: 18px;
  }

  .notification-modal-footer {
    padding-left: 18px;
    padding-right: 18px;
  }
}
`}</style>
    </section>
  );
}