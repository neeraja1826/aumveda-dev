
import { useEffect, useState } from 'react';
import {
  getResource,
  updateResourceStatus,
  getOrderDetails,
} from '../services/adminService.js';
import { AyurvedicHeroBanner } from '../components/AyurvedicDoodles.jsx';

const statuses = [
  'placed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
];

export default function Orders() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [reload, setReload] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  async function openOrderDetails(order) {
    setSelectedOrder(order);
    setOrderDetails(null);
    setDetailsError('');
    setDetailsLoading(true);

    try {
      const result = await getOrderDetails(order.id);
      setOrderDetails(result?.data ?? result?.order ?? result);
    } catch (requestError) {
      console.error('Order details error:', requestError);
      setDetailsError(
        requestError.message || 'Unable to load order details.'
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeOrderDetails() {
    setSelectedOrder(null);
    setOrderDetails(null);
    setDetailsError('');
  }

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    getResource('orders', {
      ...(status ? { status } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
      limit: pageSize,
      offset,
    })
      .then((result) => {
        if (!active) return;

        setItems(result.items || []);
        setTotal(result.total || 0);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Unable to load orders.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status, search, offset, reload]);

  async function changeStatus(order, value) {
    if (updatingId) return;

    setUpdatingId(order.id);
    setError('');

    try {
      await updateResourceStatus('orders', order.id, value);
      setReload((current) => current + 1);
    } catch (requestError) {
      setError(requestError.message || 'Unable to update order status.');
    } finally {
      setUpdatingId('');
    }
  }

  const orderStatusSummary = {
    pending: items.filter((order) => order.status === 'pending').length,
    processing: items.filter((order) => order.status === 'processing').length,
    shipped: items.filter((order) => order.status === 'shipped').length,
    delivered: items.filter((order) => order.status === 'delivered').length,
  };

  return (
    <section className="module-page orders-page">
      <AyurvedicHeroBanner
        eyebrow="AUMVEDA DISPATCH & FULFILLMENT"
        title="Customer Orders & Delivery Management"
        description="Monitor prescription and wellness deliveries, process order shipments, and oversee customer fulfillment."
        badgeText={`${total} Total Orders`}
        doodle="tonic"
      />

      <div className="module-card">
        <div className="order-summary-grid">
          <div className="order-summary-card">
            <span>Pending</span>
            <strong>{orderStatusSummary.pending}</strong>
          </div>

          <div className="order-summary-card">
            <span>Processing</span>
            <strong>{orderStatusSummary.processing}</strong>
          </div>

          <div className="order-summary-card">
            <span>Shipped</span>
            <strong>{orderStatusSummary.shipped}</strong>
          </div>

          <div className="order-summary-card">
            <span>Delivered</span>
            <strong>{orderStatusSummary.delivered}</strong>
          </div>
        </div>

        <div className="module-toolbar">
          <span>
            {loading ? 'Loading orders…' : `${total} orders`}
          </span>

          <input
            type="search"
            value={search}
            placeholder="Search order number..."
            aria-label="Search orders"
            onChange={(event) => {
              setSearch(event.target.value);
              setOffset(0);
            }}
          />

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setOffset(0);
            }}
            aria-label="Filter orders by status"
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="error-state" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">Loading orders…</div>
        ) : items.length === 0 ? (
          <div className="empty-state orders-empty-state">
            <div className="orders-empty-icon" aria-hidden="true">
              <svg
                viewBox="0 0 48 48"
                width="44"
                height="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <rect x="9" y="7" width="30" height="34" rx="5" />
                <path d="M17 17h14M17 24h14M17 31h8" />
              </svg>
            </div>
            <h3>
              {status
                ? `No ${status} orders`
                : 'No orders yet'}
            </h3>
            <p>
              {status
                ? 'Try selecting another order status.'
                : 'Orders will appear here when customers place them through the AUMVEDA store.'}
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment Status</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.order_number || item.id}</td>

                    <td>
                      {item.recipient_name ||
                        item.customer_name ||
                        item.customer_id ||
                        '—'}
                    </td>

                    <td>
                      {item.total_amount == null
                        ? '—'
                        : `₹${Number(item.total_amount).toLocaleString(
                            'en-IN'
                          )}`}
                    </td>

                   

                    <td>
                      <span
                        className={`payment-status-badge ${
                          item.payment_status === 'paid'
                            ? 'payment-status-paid'
                            : 'payment-status-pending'
                        }`}
                      >
                        {item.payment_status || 'Unknown'}
                      </span>
                    </td>

                    <td>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString(
                            'en-IN'
                          )
                        : '—'}
                    </td>

                    <td>
                      <select
                        value={item.status || 'pending'}
                        disabled={updatingId !== ''}
                        onChange={(event) =>
                          changeStatus(item, event.target.value)
                        }
                        aria-label={`Status for order ${
                          item.order_number || item.id
                        }`}
                      >
                        {statuses.map((value) => (
                          <option key={value} value={value}>
                            {value.charAt(0).toUpperCase() + value.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => openOrderDetails(item)}
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="orders-pagination">
          <span>
            {total === 0
              ? 'No orders'
              : `Showing ${offset + 1}–${Math.min(
                  offset + items.length,
                  total
                )} of ${total} orders`}
          </span>

          <div>
            <button
              type="button"
              className="secondary-button"
              disabled={offset === 0 || loading}
              onClick={() =>
                setOffset((current) =>
                  Math.max(0, current - pageSize)
                )
              }
            >
              Previous
            </button>

            <button
              type="button"
              className="secondary-button"
              disabled={offset + pageSize >= total || loading}
              onClick={() =>
                setOffset((current) => current + pageSize)
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <div
          className="order-modal-overlay"
          onClick={closeOrderDetails}
        >
          <div
            className="order-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="order-modal-header">
              <div>
                <h2>Order Details</h2>
                <p>
                  {orderDetails?.order_number ||
                    selectedOrder.order_number ||
                    'Loading order...'}
                </p>
              </div>

              <button
                type="button"
                className="order-modal-close"
                onClick={closeOrderDetails}
                aria-label="Close order details"
              >
                ×
              </button>
            </div>

            {detailsLoading && <p>Loading order details...</p>}

            {detailsError && (
              <p className="order-modal-error">{detailsError}</p>
            )}

            {!detailsLoading && orderDetails && (
              <div className="order-modal-content">
                <section className="order-detail-section">
                  <h3>Order Information</h3>
                  <p>
                    <strong>Order Number:</strong>{' '}
                    {orderDetails.order_number || '—'}
                  </p>
                  <p>
                    <strong>Order Status:</strong>{' '}
                    {orderDetails.status || '—'}
                  </p>
                  <p>
  <strong>Payment Status:</strong>{' '}
  <span
    className={`payment-status-badge ${
      orderDetails.payment_status === 'paid'
        ? 'payment-status-paid'
        : 'payment-status-pending'
    }`}
  >
    {orderDetails.payment_status || 'Unknown'}
  </span>
</p>

{orderDetails.status === 'delivered' &&
  orderDetails.payment_status !== 'paid' && (
    <p className="payment-warning">
      Payment verification required: this order is delivered,
      but payment is not marked as paid.
    </p>
  )}
                  <p>
                    <strong>Payment Method:</strong>{' '}
                    {orderDetails.payment_method?.toUpperCase() || '—'}
                  </p>
                  <p>
                    <strong>Order Date:</strong>{' '}
                    {orderDetails.created_at
                      ? new Date(orderDetails.created_at).toLocaleString()
                      : '—'}
                  </p>
                </section>

                <section className="order-detail-section">
                  <h3>Shipping Address</h3>
                  {orderDetails.shipping_address ? (
                    <>
                      <p>
                        <strong>
                          {orderDetails.shipping_address.recipient_name || '—'}
                        </strong>
                      </p>
                      <p>
                        {orderDetails.shipping_address.address_line1 || ''}
                        {orderDetails.shipping_address.address_line2
                          ? `, ${orderDetails.shipping_address.address_line2}`
                          : ''}
                      </p>
                      <p>
                        {[
                          orderDetails.shipping_address.city,
                          orderDetails.shipping_address.state,
                          orderDetails.shipping_address.postal_code,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      <p>{orderDetails.shipping_address.country || ''}</p>
                      <p>
                        Phone: {orderDetails.shipping_address.phone || '—'}
                      </p>
                    </>
                  ) : (
                    <p>No shipping address available.</p>
                  )}
                </section>

                <section className="order-detail-section">
                  <h3>Order Items</h3>

                  {(orderDetails.order_items || []).length > 0 ? (
                    <div className="order-items-list">
                      {orderDetails.order_items.map((item) => (
                        <div className="order-item" key={item.id}>
                          <div>
                            <strong>{item.product_name || 'Product'}</strong>
                            <p>
                              SKU: {item.sku || '—'}
                              {item.variant_name
                                ? ` · ${item.variant_name}`
                                : ''}
                            </p>
                            <p>Quantity: {item.quantity ?? 0}</p>
                          </div>

                          <strong>
                            ₹{Number(item.total_price ?? 0).toFixed(2)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No order items available.</p>
                  )}
                </section>

                <section className="order-detail-section order-price-summary">
                  <h3>Price Summary</h3>
                  <p>
                    <span>Subtotal</span>
                    <span>
                      ₹{Number(orderDetails.subtotal ?? 0).toFixed(2)}
                    </span>
                  </p>
                  <p>
                    <span>Discount</span>
                    <span>
                      −₹{Number(orderDetails.discount ?? 0).toFixed(2)}
                    </span>
                  </p>
                  <p>
                    <span>Shipping</span>
                    <span>
                      ₹{Number(orderDetails.shipping ?? 0).toFixed(2)}
                    </span>
                  </p>
                  <p>
                    <span>Tax</span>
                    <span>₹{Number(orderDetails.tax ?? 0).toFixed(2)}</span>
                  </p>
                  <p className="order-grand-total">
                    <strong>Total</strong>
                    <strong>
                      ₹
                      {Number(
                        orderDetails.total_amount ??
                          orderDetails.total ??
                          0
                      ).toFixed(2)}
                    </strong>
                  </p>
                </section>

                {orderDetails.billing_address && (
                  <section className="order-detail-section">
                    <h3>Billing Address</h3>
                    <p>
                      <strong>
                        {orderDetails.billing_address.recipient_name || '—'}
                      </strong>
                    </p>
                    <p>
                      {[
                        orderDetails.billing_address.address_line1,
                        orderDetails.billing_address.address_line2,
                        orderDetails.billing_address.city,
                        orderDetails.billing_address.state,
                        orderDetails.billing_address.postal_code,
                        orderDetails.billing_address.country,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    <p>
                      Phone: {orderDetails.billing_address.phone || '—'}
                    </p>
                  </section>
                )}

                {orderDetails.customer_notes && (
                  <section className="order-detail-section">
                    <h3>Customer Notes</h3>
                    <p>{orderDetails.customer_notes}</p>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .orders-page .order-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin: 16px 18px 24px;
        }

        .orders-page .order-summary-card {
          padding: 18px;
          background: #fff;
          border: 1px solid #e4ebe4;
          border-radius: 12px;
        }

        .orders-page .order-summary-card span {
          display: block;
          margin-bottom: 10px;
          color: #68756c;
          font-size: 13px;
        }

        .orders-page .order-summary-card strong {
          color: #244b36;
          font-size: 26px;
        }

        .orders-page .module-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .orders-page .module-toolbar > span {
          color: #77747a;
          font-size: 12px;
        }

        .orders-page .orders-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 16px 18px;
          font-size: 12px;
          color: #77747a;
        }

        .orders-page .orders-pagination > div {
          display: flex;
          gap: 8px;
        }

        .orders-page .orders-empty-state {
          padding: 42px 20px;
          text-align: center;
        }

        .orders-page .orders-empty-icon {
          margin-bottom: 12px;
          color: #557563;
        }

        .orders-page .orders-empty-state h3 {
          margin: 0 0 8px;
        }

        .orders-page .orders-empty-state p {
          margin: 0 auto;
          max-width: 420px;
          line-height: 1.6;
          opacity: 0.7;
        }

        .order-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background: rgba(20, 30, 24, 0.55);
        }

        .order-modal {
          width: 100%;
          max-width: 720px;
          max-height: 90vh;
          overflow-y: auto;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .order-modal-header {
          position: sticky;
          top: 0;
          z-index: 1;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 24px;
          background: #fff;
          border-bottom: 1px solid #e8eee8;
        }

        .order-modal-header h2 {
          margin: 0 0 6px;
          color: #244b36;
          font-size: 22px;
        }

        .order-modal-header p {
          margin: 0;
          color: #68756c;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .order-modal-close {
          border: none;
          background: transparent;
          color: #526157;
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
        }

        .order-modal-content {
          padding: 8px 24px 24px;
        }

        .order-detail-section {
          padding: 16px 0;
          border-bottom: 1px solid #e8eee8;
        }

        .order-detail-section h3 {
          margin: 0 0 14px;
          color: #244b36;
          font-size: 16px;
        }

        .order-detail-section p {
          margin: 8px 0;
          color: #536057;
          font-size: 14px;
          overflow-wrap: anywhere;
        }

        .order-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .order-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 14px;
          background: #f7f9f6;
          border-radius: 10px;
        }

        .order-item > strong {
          white-space: nowrap;
          color: #244b36;
        }

        .order-price-summary > p {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .order-price-summary .order-grand-total {
          padding-top: 12px;
          border-top: 1px solid #e0e8e0;
          color: #244b36;
          font-size: 17px;
        }

        .order-modal-error {
          margin: 20px 24px;
          color: #b42318;
        }

        @media (max-width: 620px) {
          .orders-page .module-toolbar {
            align-items: stretch;
          }

          .orders-page .module-toolbar input,
          .orders-page .module-toolbar select {
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .orders-page .order-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .orders-page .order-summary-card {
            padding: 14px;
          }
        }

        @media (max-width: 600px) {
          .order-modal-overlay {
            padding: 10px;
          }

          .order-modal {
            max-height: 94vh;
            border-radius: 12px;
          }

          .order-modal-header,
          .order-modal-content {
            padding-left: 16px;
            padding-right: 16px;
          }

          .order-item {
            flex-direction: column;
            gap: 6px;
          }
        }
          .payment-status-badge {
  display: inline-block;
  padding: 4px 9px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.payment-status-paid {
  color: #216e41;
  background: #e7f5eb;
}

.payment-status-pending {
  color: #8a5a00;
  background: #fff3d6;
}

.payment-warning {
  margin-top: 12px !important;
  padding: 10px 12px;
  border: 1px solid #f0d18a;
  border-radius: 8px;
  background: #fff8e8;
  color: #805600 !important;
  font-size: 13px;
}
      `}</style>
    </section>
  );
}
