import { useEffect, useState } from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getAdminNotification,
  markAdminNotificationRead,
} from '../services/adminService.js';
import OrderNotificationDetails from '../components/OrderNotificationDetails.jsx';
import NotificationReferenceDetails from '../components/NotificationReferenceDetails.jsx';

export default function NotificationDetails() {
  const { notificationId } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readError, setReadError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadNotification() {
      setLoading(true);
      setError('');
      setReadError('');

      try {
        const result = await getAdminNotification(notificationId);
        const item = result?.notification ?? result;

        if (!active) return;
        setNotification(item);

        if (item?.id && !item.is_read) {
          try {
            await markAdminNotificationRead(item.id);
            if (active) {
              setNotification((current) =>
                current ? { ...current, is_read: true } : current
              );
            }
          } catch (requestError) {
            if (active) {
              setReadError(
                requestError.message || 'Unable to mark this notification as read.'
              );
            }
          }
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Unable to load this notification.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadNotification();
    return () => {
      active = false;
    };
  }, [notificationId]);

  function viewProduct() {
    if (!notification?.vendor_id || !notification?.product_id) return;

    const approvalStatus =
      String(notification.approval_status || '').toLowerCase() === 'pending'
        ? 'pending'
        : 'all';
    const query = new URLSearchParams({
      productId: String(notification.product_id),
      approvalStatus,
    });

    navigate(
      `/admin/vendors/${encodeURIComponent(notification.vendor_id)}?${query.toString()}`
    );
  }

  const referenceType = notification?.reference_type;
  const notificationType = String(
    notification?.notification_type || ''
  ).toLowerCase();
  const isProductNotification =
    referenceType === 'product' ||
    referenceType === 'products' ||
    referenceType === 'vendor_product' ||
    referenceType === 'vendor_products' ||
    referenceType === 'vendor_product_updated' ||
    Boolean(notification?.product_id);
  const isProductUpdateNotification =
    isProductNotification &&
    notificationType.includes('product') &&
    notificationType.includes('update');
  const isOrderNotification =
    referenceType === 'order' || referenceType === 'orders';

  return (
    <section className="module-page notification-detail-page">
      <button
        type="button"
        className="secondary-button"
        onClick={() => navigate('/admin/notifications')}
      >
        <ArrowLeft size={16} />
        Back to notifications
      </button>

      <div className="module-card notification-detail-card">
        {loading ? (
          <div className="loading-state">Loading notification...</div>
        ) : error ? (
          <div className="error-state" role="alert">{error}</div>
        ) : notification ? (
          <>
            <div className="notification-detail-icon" aria-hidden="true">
              <Package size={23} />
            </div>
            <span className="notification-detail-eyebrow">
              {isProductUpdateNotification
                ? 'PRODUCT UPDATE'
                : isProductNotification
                  ? 'PRODUCT APPROVAL'
                  : 'ADMIN NOTIFICATION'}
            </span>
            <h1>
              {isProductUpdateNotification
                ? notification.title || 'Vendor product updated'
                : isProductNotification
                  ? 'New product uploaded for approval'
                : notification.title || 'Notification'}
            </h1>

            {isProductNotification ? (
              <>
                <p className="notification-detail-message">
                  {isProductUpdateNotification
                    ? notification.message ||
                      (notification.product_name
                        ? `${notification.product_name} was updated by ${notification.vendor_name || 'the vendor'}.`
                        : 'Product update details are unavailable.')
                    : notification.product_name
                      ? `${notification.product_name} was submitted by ${notification.vendor_name || 'a vendor'} for approval.`
                      : `A new product was submitted by ${notification.vendor_name || 'a vendor'} for approval.`}
                </p>
                <div className="notification-detail-vendor">
                  <span>Vendor</span>
                  <strong>{notification.vendor_name || 'Vendor details unavailable'}</strong>
                </div>
                {notification.vendor_id && notification.product_id && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={viewProduct}
                  >
                    View product
                  </button>
                )}
              </>
            ) : isOrderNotification ? (
              <>
                <p className="notification-detail-message">
                  {notification.message || 'Order notification'}
                </p>
                {notification.order ? (
                  <OrderNotificationDetails order={notification.order} />
                ) : (
                  <div className="error-state" role="status">
                    Order details are unavailable.
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="notification-detail-message">
                  {notification.message || 'No message available.'}
                </p>
                {notification.reference_record ? (
                  <NotificationReferenceDetails
                    record={notification.reference_record}
                    referenceType={referenceType}
                  />
                ) : notification.reference_id ? (
                  <div className="error-state" role="status">
                    Referenced record details are unavailable.
                  </div>
                ) : null}
              </>
            )}

            {readError && (
              <div className="error-state" role="alert">{readError}</div>
            )}
          </>
        ) : (
          <div className="error-state" role="alert">
            Notification not found.
          </div>
        )}
      </div>

      <style>{`
        .notification-detail-page {
          display: grid;
          gap: 18px;
        }

        .notification-detail-card {
          max-width: 760px;
          padding: 32px;
        }

        .notification-detail-icon {
          display: grid;
          width: 48px;
          height: 48px;
          place-items: center;
          border-radius: 14px;
          background: #e8f3ef;
          color: #286b65;
          margin-bottom: 18px;
        }

        .notification-detail-eyebrow {
          color: #718582;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .08em;
        }

        .notification-detail-card h1 {
          margin: 8px 0;
          color: #203b37;
          font-size: 24px;
        }

        .notification-detail-message {
          color: #526461;
          line-height: 1.6;
        }

        .notification-detail-vendor {
          display: grid;
          gap: 4px;
          margin: 22px 0;
        }

        .notification-detail-vendor span {
          color: #718582;
          font-size: 12px;
        }
      `}</style>
    </section>
  );
}
