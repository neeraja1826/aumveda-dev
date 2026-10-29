
import { useEffect, useState } from 'react';
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

export default function Returns() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reload, setReload] = useState(0);
  const [draftStatuses, setDraftStatuses] = useState({});
  const [draftNotes, setDraftNotes] = useState({});
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
        setDraftNotes({});
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
    const notes = draftNotes[returnId] ?? '';

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
      await updateReturnRequestStatus(returnId, nextStatus, notes);
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
                  <th>Return ID</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Reason</th>
                  <th>Current Status</th>
                  <th>Update Status</th>
                  <th>Admin Notes</th>
                  <th>Action</th>
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
                    <tr key={returnId ?? index}>
                      <td>{returnId ?? '—'}</td>
                      <td>
                        {item.order_number ??
                          item.order?.order_number ??
                          item.order_id ??
                          '—'}
                      </td>
                      <td>{getCustomer(item)}</td>
                      <td>
                        {item.reason ??
                          item.return_reason ??
                          item.description ??
                          '—'}
                      </td>
                      <td>
                        <span className={`return-status-pill return-status-${currentStatus}`}>
                          {formatStatus(currentStatus)}
                        </span>
                      </td>
                      <td>
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
                      <td>
                        <input
                          type="text"
                          aria-label={`Admin notes for return ${returnId}`}
                          placeholder="Optional note"
                          maxLength={1000}
                          value={draftNotes[returnId] ?? ''}
                          disabled={isUpdating || nextStatuses.length === 0}
                          onChange={(event) =>
                            setDraftNotes((current) => ({
                              ...current,
                              [returnId]: event.target.value,
                            }))
                          }
                          className="return-note-input"
                        />
                      </td>
                      <td className="return-action-cell">
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

      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 11, lineHeight: 1.6 }}>
        Note: marking a return as completed updates its workflow status; it
        does not by itself confirm that a refund payment was successfully
        processed.
      </p>
    </section>
  );
}
