
import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  deleteAdminReview,
  getResource,
} from '../services/adminService.js';
import { AyurvedicHeroBanner } from '../components/AyurvedicDoodles.jsx';

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
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [reload, setReload] = useState(0);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return undefined;
        setLoading(true);
        setError('');
        return getResource('reviews', { limit: 100 });
      })
      .then(async (result) => {
        if (!active) return;

        const firstItems = Array.isArray(result)
          ? result
          : result?.items || [];
        const total = Array.isArray(result)
          ? firstItems.length
          : Number(result?.total) || firstItems.length;
        const offsets = [];

        for (let offset = 100; offset < total; offset += 100) {
          offsets.push(offset);
        }

        const remainingResults = await Promise.all(
          offsets.map((offset) =>
            getResource('reviews', { limit: 100, offset })
          )
        );
        const reviews = [
          ...firstItems,
          ...remainingResults.flatMap((page) =>
            Array.isArray(page) ? page : page?.items || []
          ),
        ];

        if (active) setItems(reviews);
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
  }, [reload]);

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
        item.rating,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [items, search]);

  function closeReviewDetails() {
    setSelectedReview(null);
  }

  async function handleDeleteReview(review) {
    if (deletingId !== null) return;

    const confirmed = window.confirm(
      `Delete this review for ${getProductName(review)}? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(review.id);
    setError('');

    try {
      await deleteAdminReview(review.id);
      setItems((current) =>
        current.filter((item) => item.id !== review.id)
      );
      setSelectedReview((current) =>
        current?.id === review.id ? null : current
      );
    } catch (requestError) {
      setError(requestError.message || 'Unable to delete review.');
    } finally {
      setDeletingId(null);
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
          grid-template-columns: minmax(180px, 240px);
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

        .reviews-page .review-controls input {
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

        .reviews-page .review-controls input:focus {
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
          color: #D9A52E;
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

        .reviews-page .review-view-button {
          white-space: nowrap;
        }

        .reviews-page .review-row-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }

        .reviews-page .review-delete-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid #F3CCCC;
          border-radius: 8px;
          background: #FFF8F8;
          color: #A3332A;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .reviews-page .review-delete-button:hover:not(:disabled) {
          border-color: #D98983;
          background: #FDF1F0;
          color: #7F1D1D;
        }

        .reviews-page .review-delete-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .review-detail-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(14, 40, 28, 0.48);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .review-detail-modal {
          width: min(620px, 100%);
          max-height: 90vh;
          overflow: auto;
          padding: 28px;
          border: 1px solid #E2ECE0;
          border-radius: 20px;
          background: #FFFFFF;
          box-shadow: 0 24px 70px rgba(18, 61, 43, 0.22);
        }

        .review-detail-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 18px;
          border-bottom: 1px solid #EDF3EC;
        }

        .review-detail-eyebrow {
          display: block;
          margin-bottom: 5px;
          color: #276345;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .review-detail-header h3 {
          margin: 0;
          color: #123D2B;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          font-weight: 700;
        }

        .review-detail-close {
          width: 36px;
          height: 36px;
          border: 1px solid #D5E4D2;
          border-radius: 10px;
          background: #F8FAF7;
          color: #123D2B;
          font-size: 22px;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .review-detail-close:hover {
          background: #E8F2E7;
          border-color: #276345;
        }

        .review-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 20px;
        }

        .review-detail-grid > div,
        .review-detail-comment {
          padding: 14px 16px;
          border: 1px solid #E2ECE0;
          border-radius: 12px;
          background: #F8FAF7;
        }

        .review-detail-grid span,
        .review-detail-comment > span {
          display: block;
          margin-bottom: 5px;
          color: #5F6E64;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .review-detail-grid strong {
          display: block;
          color: #123D2B;
          font-size: 13.5px;
          overflow-wrap: anywhere;
        }

        .review-detail-comment {
          margin-top: 16px;
        }

        .review-detail-comment p {
          margin: 0;
          color: #5F6E64;
          font-size: 13.5px;
          line-height: 1.7;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        @media (max-width: 700px) {
          .review-detail-grid {
            grid-template-columns: 1fr;
          }

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

          .reviews-page .review-controls input {
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

      <AyurvedicHeroBanner
        eyebrow="AUMVEDA CUSTOMER TESTIMONIALS"
        title="Reviews, Ratings & Herbal Feedback"
        description="Read customer feedback and remove reviews when necessary."
        badgeText={`${items.length} Reviews`}
        doodle="flower"
      />

      <div className="review-summary">
        <div className="review-stat">
          <div className="review-stat-label">Customer reviews</div>
          <div className="review-stat-value">{items.length}</div>
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
                : 'Try another search term.'}
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
                  <th>Actions</th>
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
                      <div className="review-row-actions">
                        <button
                          type="button"
                          className="secondary-button review-view-button"
                          onClick={() => setSelectedReview(item)}
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          className="review-delete-button"
                          onClick={() => handleDeleteReview(item)}
                          disabled={deletingId !== null}
                          title="Delete review"
                          aria-label={`Delete review for ${getProductName(item)}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
      {selectedReview && (
        <div
          className="review-detail-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeReviewDetails();
          }}
        >
          <div className="review-detail-modal" role="dialog" aria-modal="true" aria-labelledby="review-detail-title">
            <div className="review-detail-header">
              <div>
                <span className="review-detail-eyebrow">Review Details</span>
                <h3 id="review-detail-title">{getProductName(selectedReview)}</h3>
              </div>
              <button type="button" className="review-detail-close" onClick={closeReviewDetails} aria-label="Close review details">×</button>
            </div>

            <div className="review-detail-grid">
              <div><span>Review ID</span><strong>{selectedReview.id ?? '—'}</strong></div>
              <div><span>Customer</span><strong>{getCustomerName(selectedReview)}</strong></div>
              <div><span>Rating</span><strong>{selectedReview.rating != null ? `${selectedReview.rating} / 5` : '—'}</strong></div>
              <div><span>Date</span><strong>{formatDate(selectedReview.created_at || selectedReview.updated_at)}</strong></div>
            </div>

            <div className="review-detail-comment">
              <span>Customer Feedback</span>
              <p>{getComment(selectedReview)}</p>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
