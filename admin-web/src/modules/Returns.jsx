
import { useEffect, useState } from 'react';
import { Package, X } from 'lucide-react';
import {
  getReturnRequests,
  updateReturnRequestStatus,
} from '../services/adminService.js';
import { AyurvedicHeroBanner } from '../components/AyurvedicDoodles.jsx';

const statuses = [
  'requested',
  'under_review',
  'approved',
  'rejected',
  'pickup_scheduled',
  'item_received',
  'replacement_processing',
  'refund_processing',
  'completed',
  'cancelled',
];

const allowedTransitions = {
  requested: ['under_review', 'approved', 'rejected', 'cancelled'],
  under_review: ['approved', 'rejected', 'cancelled'],
  approved: ['pickup_scheduled', 'item_received', 'cancelled'],
  pickup_scheduled: ['item_received', 'cancelled'],
  item_received: [
    'replacement_processing',
    'refund_processing',
    'completed',
  ],
  replacement_processing: ['completed'],
  refund_processing: ['completed'],
  rejected: [],
  completed: [],
  cancelled: [],
};

function formatStatus(status = '') {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getReturnId(item) {
  return item.id ?? item.return_id ?? item.return_request_id;
}

function getCustomer(item) {
  return (
    item.customer_name ??
    item.customer?.full_name ??
    item.customer?.name ??
    item.customer_email ??
    item.user_email ??
    '—'
  );
}

function getCustomerId(item) {
  return item.customer_id ?? item.customer?.id ?? '—';
}

function getProductName(item) {
  return (
    item.product_name ??
    item.product?.name ??
    item.order_item?.product_name ??
    'Product details unavailable'
  );
}

function getProductImage(item) {
  return (
    item.product_image_url ??
    item.product?.image_url ??
    item.order_item?.image_url ??
    item.image_url ??
    ''
  );
}

function getOrderId(item) {
  return item.order_id ?? item.order?.id ?? '—';
}

function getOrderDisplay(item) {
  return (
    item.order_number ??
    item.order?.order_number ??
    getOrderId(item)
  );
}

function getReturnReason(item) {
  return (
    item.reason ??
    item.return_reason ??
    item.description ??
    '—'
  );
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const amount = Number(value);
  return Number.isFinite(amount)
    ? `₹${amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : '—';
}

function ReturnDetailsModal({ item, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const orderItem = item.order_item || {};
  const product = item.product || {};
  const imageUrl = getProductImage(item);
  const unitPrice = orderItem.unit_price ?? item.unit_price;
  const totalPrice =
    orderItem.total_price ??
    item.total_price ??
    (unitPrice != null && item.requested_quantity != null
      ? Number(unitPrice) * Number(item.requested_quantity)
      : null);
  const quantity =
    item.requested_quantity ??
    item.quantity ??
    orderItem.quantity ??
    '—';

  return (
    <div
      className="return-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="return-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-detail-title"
      >
        <header className="return-detail-header">
          <div>
            <span>Return request</span>
            <h2 id="return-detail-title">Request details</h2>
          </div>
          <button
            type="button"
            className="return-detail-close"
            onClick={onClose}
            aria-label="Close return details"
          >
            <X size={18} />
          </button>
        </header>

        <div className="return-detail-body">
          <div className="return-detail-product">
            {imageUrl ? (
              <img src={imageUrl} alt={getProductName(item)} />
            ) : (
              <div className="return-detail-product-placeholder">
                <Package size={28} />
              </div>
            )}
            <div>
              <span>Product</span>
              <strong>{getProductName(item)}</strong>
              {orderItem.variant_name && (
                <small>{orderItem.variant_name}</small>
              )}
            </div>
          </div>

          <dl className="return-detail-grid">
            <div>
              <dt>Order ID</dt>
              <dd>{getOrderId(item)}</dd>
            </div>
            <div>
              <dt>Order number</dt>
              <dd>{getOrderDisplay(item)}</dd>
            </div>
            <div>
              <dt>Return ID</dt>
              <dd>{getReturnId(item) || '—'}</dd>
            </div>
            <div>
              <dt>Customer name</dt>
              <dd>{getCustomer(item)}</dd>
            </div>
            <div>
              <dt>Customer ID</dt>
              <dd>{getCustomerId(item)}</dd>
            </div>
            <div>
              <dt>Unit price</dt>
              <dd>{formatPrice(unitPrice)}</dd>
            </div>
            <div>
              <dt>Total price</dt>
              <dd>{formatPrice(totalPrice)}</dd>
            </div>
            <div>
              <dt>Quantity</dt>
              <dd>{quantity}</dd>
            </div>
            <div>
              <dt>Request type</dt>
              <dd>{formatStatus(item.request_type || 'return')}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{formatStatus(item.status || 'requested')}</dd>
            </div>
            <div className="return-detail-reason">
              <dt>Reason</dt>
              <dd>{getReturnReason(item)}</dd>
            </div>
            {item.description && item.description !== item.reason && (
              <div className="return-detail-reason">
                <dt>Additional details</dt>
                <dd>{item.description}</dd>
              </div>
            )}
            {product.id && (
              <div>
                <dt>Product ID</dt>
                <dd>{product.id}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>
    </div>
  );
}

export default function Returns() {
  const [items, setItems] = useState([]);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [status, setStatus] = useState('');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reload, setReload] = useState(0);
  const [draftStatuses, setDraftStatuses] = useState({});
  const [updatingId, setUpdatingId] = useState('');
  const pageSize = 20;

  useEffect(() => {
    let active = true;

    async function loadReturns() {
      setLoading(true);
      setError('');
      setSuccess('');

      try {
        const result = await getReturnRequests({
          ...(status ? { status } : {}),
          limit: pageSize,
          offset,
        });

        if (!active) return;

        const rows = Array.isArray(result)
          ? result
          : result?.items ?? result?.data?.items ?? [];

        setItems(rows);
        setTotal(
          result?.total ??
            result?.data?.total ??
            rows.length
        );
        setDraftStatuses({});
      } catch (requestError) {
        if (active) {
          setError(
            requestError.message || 'Unable to load return requests.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReturns();

    return () => {
      active = false;
    };
  }, [status, offset, reload]);

  async function saveStatus(item) {
    const returnId = getReturnId(item);
    const currentStatus = item.status;
    const nextStatus = draftStatuses[returnId] ?? currentStatus;

    if (!returnId) {
      setError('This return request does not contain an ID.');
      return;
    }

    if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
      setError('This status change is not allowed.');
      return;
    }

    if (updatingId) return;

    setUpdatingId(returnId);
    setError('');
    setSuccess('');

    try {
      await updateReturnRequestStatus(returnId, nextStatus);
      setSuccess(`Return status updated to ${formatStatus(nextStatus)}.`);
      setReload((current) => current + 1);
    } catch (requestError) {
      setError(
        requestError.message || 'Unable to update the return status.'
      );
    } finally {
      setUpdatingId('');
    }
  }

  const currentPage = Math.floor(offset / pageSize) + 1;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="module-page returns-page">
      <AyurvedicHeroBanner
        eyebrow="AUMVEDA REVERSE LOGISTICS"
        title="Returns, Replacements & Refunds"
        description="Review customer return requests, inspect returned remedies, and manage resolution transitions."
        badgeText={`${total} Requests`}
        doodle="leaf"
      >
        <button
          type="button"
          className="primary-button"
          onClick={() => setReload((current) => current + 1)}
          disabled={loading}
        >
          Refresh
        </button>
      </AyurvedicHeroBanner>

      <div className="stat-grid">
        <div className="stat-card">
          <span>Requests on this page</span>
          <strong>{items.length}</strong>
        </div>
        <div className="stat-card">
          <span>Total matching requests</span>
          <strong>{total}</strong>
        </div>
        <div className="stat-card">
          <span>Under review on this page</span>
          <strong>
            {items.filter((item) => item.status === 'under_review').length}
          </strong>
        </div>
        <div className="stat-card">
          <span>Awaiting pickup on this page</span>
          <strong>
            {items.filter((item) => item.status === 'pickup_scheduled').length}
          </strong>
        </div>
      </div>

      <div className="module-card">
        <div className="module-toolbar">
          <span>
            {loading ? 'Loading return requests…' : `${total} requests`}
          </span>

          <select
            value={status}
            aria-label="Filter return requests by status"
            onChange={(event) => {
              setStatus(event.target.value);
              setOffset(0);
            }}
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {formatStatus(value)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="error-state" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            style={{
              padding: '12px 18px',
              color: '#365b35',
              background: '#f0f6eb',
              fontSize: 12,
            }}
          >
            {success}
          </div>
        )}

        {loading ? (
          <div className="loading-state">Loading return requests…</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            {status
              ? `No return requests found with status "${formatStatus(status)}".`
              : 'No return requests found.'}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="return-product-heading">Product</th>
                  <th className="return-order-heading">Order ID</th>
                  <th className="return-id-heading">Return ID</th>
                  <th className="return-customer-heading">Customer</th>
                  <th className="return-current-status-heading">Current Status</th>
                  <th className="return-update-status-heading">Update Status</th>
                  <th className="return-action-heading">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const returnId = getReturnId(item);
                  const currentStatus = item.status ?? 'requested';
                  const nextStatuses =
                    allowedTransitions[currentStatus] ?? [];
                  const draftStatus =
                    draftStatuses[returnId] ?? currentStatus;
                  const isUpdating = updatingId === returnId;

                  return (
                    <tr
                      key={returnId ?? index}
                      className="return-row-clickable"
                      tabIndex={0}
                      onClick={() => setSelectedReturn(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedReturn(item);
                        }
                      }}
                      aria-label={`View return details for ${getProductName(item)}`}
                    >
                      <td className="return-product-cell">
                        <div className="return-product-summary">
                          {getProductImage(item) ? (
                            <img
                              className="return-product-image"
                              src={getProductImage(item)}
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <span className="return-product-image-fallback">
                              <Package size={18} />
                            </span>
                          )}
                          <strong>{getProductName(item)}</strong>
                        </div>
                      </td>
                      <td className="return-order-cell">
                        {getOrderDisplay(item)}
                      </td>
                      <td className="return-id-cell">
                        {returnId ?? '—'}
                      </td>
                      <td className="return-customer-cell">
                        <strong>{getCustomer(item)}</strong>
                      </td>
                      <td>
                        <span className={`return-status-pill return-status-${currentStatus}`}>
                          {formatStatus(currentStatus)}
                        </span>
                      </td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <select
                          className="return-status-select"
                          aria-label={`New status for return ${returnId}`}
                          value={draftStatus}
                          disabled={isUpdating || nextStatuses.length === 0}
                          onChange={(event) =>
                            setDraftStatuses((current) => ({
                              ...current,
                              [returnId]: event.target.value,
                            }))
                          }
                        >
                          <option value={currentStatus}>
                            {formatStatus(currentStatus)} (current)
                          </option>
                          {nextStatuses.map((nextStatus) => (
                            <option key={nextStatus} value={nextStatus}>
                              {formatStatus(nextStatus)}
                            </option>
                          ))}
                        </select>
                        {nextStatuses.length === 0 && (
                          <div style={{ marginTop: 5, color: '#77747a', fontSize: 10 }}>
                            No further transitions
                          </div>
                        )}
                      </td>
                      <td
                        className="return-action-cell"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="primary-button return-save-button"
                          disabled={
                            isUpdating ||
                            nextStatuses.length === 0 ||
                            draftStatus === currentStatus
                          }
                          onClick={() => saveStatus(item)}
                        >
                          {isUpdating ? 'Saving…' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > pageSize && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              padding: 16,
              borderTop: '1px solid var(--border)',
            }}
          >
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>
              Page {currentPage} of {pageCount}
            </span>
            <button
              type="button"
              className="secondary-button"
              disabled={offset === 0}
              onClick={() =>
                setOffset((current) => Math.max(0, current - pageSize))
              }
            >
              Previous
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={offset + pageSize >= total}
              onClick={() => setOffset((current) => current + pageSize)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div style={{ margin: 0, padding: '14px 18px', background: '#FAF9F4', border: '1px solid #E2ECE0', borderRadius: 12, color: '#5F6E64', fontSize: 12, lineHeight: 1.6 }}>
        <strong style={{ color: '#123D2B' }}>Workflow Note:</strong> Marking a return as completed updates its workflow status; it does not by itself confirm that a refund payment was successfully processed.
      </div>

      {selectedReturn && (
        <ReturnDetailsModal
          item={selectedReturn}
          onClose={() => setSelectedReturn(null)}
        />
      )}
    </section>
  );
}
