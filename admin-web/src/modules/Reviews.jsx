
import { useEffect, useMemo, useState } from 'react';
import { getResource, updateResourceStatus } from '../services/adminService.js';

const statuses = ['pending', 'approved', 'rejected'];

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
};

const getCustomerName = (review) =>
  review.customer_name || review.full_name || review.customer_id || 'Customer';

const getProductName = (review) =>
  review.product_name || review.product?.name || review.product_id || '—';

const getComment = (review) =>
  review.comment || review.content || review.review_text || review.description || 'No written feedback';

export default function Reviews() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    getResource('reviews', status ? { status } : {})
      .then((result) => {
        if (active) {
          setItems(Array.isArray(result) ? result : result?.items || []);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Unable to load reviews.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status, reload]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) =>
      [
        item.id,
        item.title,
        getCustomerName(item),
        getProductName(item),
        getComment(item),
        item.status,
        item.rating,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [items, search]);

  const summary = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((item) => item.status === 'pending').length,
      approved: items.filter((item) => item.status === 'approved').length,
    }),
    [items]
  );

  async function changeStatus(review, value) {
    if (updatingId !== null) return;

    const previousStatus = review.status;

    setUpdatingId(review.id);
    setError('');

    // Update the visible row immediately.
    setItems((current) =>
      current.map((item) =>
        item.id === review.id ? { ...item, status: value } : item
      )
    );

    try {
      await updateResourceStatus('reviews', review.id, value);
      setReload((current) => current + 1);
    } catch (requestError) {
      // Restore the original status if the API request fails.
      setItems((current) =>
        current.map((item) =>
          item.id === review.id
            ? { ...item, status: previousStatus }
            : item
        )
      );

      setError(requestError.message || 'Unable to update review status.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="module-page reviews-page">
      <style>{`
        .reviews-page {
          color: #26352D;
        }

        .reviews-page .review-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .reviews-page .review-stat {
          padding: 17px 18px;
          border: 1px solid #e4e9e1;
          border-radius: 12px;
          background: #fff;
        }

        .reviews-page .review-stat-label {
          margin-bottom: 8px;
          color: #737d73;
          font-size: 12px;
        }

        .reviews-page .review-stat-value {
          color: #26352D;
          font-size: 25px;
          font-weight: 650;
          line-height: 1.2;
        }

        .reviews-page .review-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding: 15px 18px;
          border-bottom: 1px solid #edf0eb;
        }

        .reviews-page .review-count {
          color: #777f78;
          font-size: 12px;
        }

        .reviews-page .review-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .reviews-page .review-controls input,
        .reviews-page .review-controls select,
        .reviews-page .review-status-select {
          min-height: 36px;
          max-width: 100%;
          padding: 7px 10px;
          border: 1px solid #dfe5dc;
          border-radius: 8px;
          background: #fff;
          color: #344438;
          font: inherit;
          font-size: 12px;
        }

        .reviews-page .review-controls input {
          width: 210px;
        }

        .reviews-page .review-status-select {
          min-width: 112px;
          text-transform: capitalize;
        }

        .reviews-page .review-controls input:focus,
        .reviews-page .review-controls select:focus,
        .reviews-page .review-status-select:focus {
          outline: 2px solid #cbd8c7;
          outline-offset: 1px;
        }

        .reviews-page .review-customer {
          min-width: 135px;
          color: #354638;
          font-weight: 600;
        }

        .reviews-page .review-id {
          margin-top: 4px;
          color: #8a9289;
          font-size: 11px;
          font-weight: 400;
        }

        .reviews-page .review-product {
          min-width: 130px;
          color: #465448;
        }

        .reviews-page .review-rating {
          color: #344d38;
          font-weight: 650;
          white-space: nowrap;
        }

        .reviews-page .review-star {
          margin-right: 4px;
          color: #b38b38;
        }

        .reviews-page .review-comment {
          min-width: 230px;
          max-width: 360px;
          color: #69736b;
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
          white-space: normal;
        }

        .reviews-page .review-date {
          min-width: 100px;
          color: #737d73;
          font-size: 12px;
          white-space: nowrap;
        }

        .reviews-page .review-badge {
          display: inline-flex;
          align-items: center;
          padding: 5px 9px;
          border-radius: 20px;
          background: #f0f2ed;
          color: #5e6c5b;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .reviews-page .review-badge[data-status="approved"] {
          background: #e8f1e7;
          color: #376642;
        }

        .reviews-page .review-badge[data-status="pending"] {
          background: #f7f0df;
          color: #896b2c;
        }

        .reviews-page .review-badge[data-status="rejected"] {
          background: #f7e9e7;
          color: #9b4c45;
        }

        .reviews-page .review-empty {
          padding: 40px 18px;
          text-align: center;
        }

        .reviews-page .review-empty h3 {
          margin: 12px 0 6px;
          color: #344438;
          font-size: 16px;
        }

        .reviews-page .review-empty p {
          margin: 0;
          color: #7b847c;
          font-size: 13px;
        }

        .reviews-page .review-error {
          padding: 18px;
          color: #a13d3d;
          font-size: 13px;
        }

        .reviews-page .review-retry {
          margin-top: 10px;
          padding: 8px 12px;
          border: 1px solid #e5ceca;
          border-radius: 7px;
          background: #fff;
          color: #913f38;
          cursor: pointer;
        }

        @media (max-width: 700px) {
          .reviews-page .review-summary {
            gap: 8px;
          }

          .reviews-page .review-stat {
            padding: 12px;
          }

          .reviews-page .review-stat-label {
            font-size: 11px;
          }

          .reviews-page .review-stat-value {
            font-size: 21px;
          }

          .reviews-page .review-toolbar {
            align-items: stretch;
            padding: 13px;
          }

          .reviews-page .review-controls {
            width: 100%;
          }

          .reviews-page .review-controls input,
          .reviews-page .review-controls select {
            flex: 1;
            width: 100%;
            min-width: 0;
          }
        }

        @media (max-width: 380px) {
          .reviews-page .review-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="module-intro">
        <div>
          <h2>Reviews</h2>
          <p>Manage product ratings and customer feedback.</p>
        </div>
      </div>

      <div className="review-summary">
        <div className="review-stat">
          <div className="review-stat-label">Reviews loaded</div>
          <div className="review-stat-value">{summary.total}</div>
        </div>

        <div className="review-stat">
          <div className="review-stat-label">Pending approval</div>
          <div className="review-stat-value">{summary.pending}</div>
        </div>

        <div className="review-stat">
          <div className="review-stat-label">Approved reviews</div>
          <div className="review-stat-value">{summary.approved}</div>
        </div>
      </div>

      <div className="module-card">
        <div className="review-toolbar">
          <span className="review-count">
            Showing {loading ? '…' : filteredItems.length} of {items.length} reviews
          </span>

          <div className="review-controls">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reviews…"
              aria-label="Search reviews"
            />

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter review status"
            >
              <option value="">All statuses</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading reviews…</div>
        ) : error && items.length === 0 ? (
          <div className="review-error" role="alert">
            <div>{error}</div>
            <button
              type="button"
              className="review-retry"
              onClick={() => setReload((current) => current + 1)}
            >
              Try again
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="review-empty">
            <svg
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: '#9aa795' }}
              aria-hidden="true"
            >
              <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
            </svg>

            <h3>
              {items.length === 0
                ? 'No reviews yet'
                : 'No matching reviews'}
            </h3>

            <p>
              {items.length === 0
                ? 'Customer feedback will appear here when reviews are submitted.'
                : 'Try another search term or select a different status.'}
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Feedback</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="review-customer">
                        {getCustomerName(item)}
                      </div>
                      <div className="review-id">
                        ID: {item.id ?? '—'}
                      </div>
                    </td>

                    <td>
                      <div className="review-product">
                        {getProductName(item)}
                      </div>
                    </td>

                    <td>
                      <span className="review-rating">
                        <span className="review-star">★</span>
                        {item.rating ?? '—'}
                      </span>
                    </td>

                    <td>
                      <div className="review-comment">
                        {getComment(item)}
                      </div>
                    </td>

                    <td>
                      <div className="review-date">
                        {formatDate(item.created_at || item.updated_at)}
                      </div>
                    </td>

                    <td>
                      <select
                        className="review-status-select"
                        value={item.status || 'pending'}
                        disabled={updatingId !== null}
                        onChange={(event) =>
                          changeStatus(item, event.target.value)
                        }
                        aria-label={`Status for review ${item.id}`}
                      >
                        {statuses.map((value) => (
                          <option key={value} value={value}>
                            {value.charAt(0).toUpperCase() + value.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && items.length > 0 && (
          <div className="review-error" role="alert">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
