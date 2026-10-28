
import { useEffect, useMemo, useState } from 'react';
import { getResource } from '../services/adminService.js';

const sections = [
  ['payments', 'Payments'],
  ['refunds', 'Refunds'],
  ['vendor-ledger', 'Vendor Ledger'],
  ['vendor-payouts', 'Vendor Payouts'],
];

function formatColumnName(value) {
  return String(value)
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayValue(value, column) {
  if (value == null || value === '') return '—';

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  if (
    typeof value === 'string' &&
    /(^|_)(created_at|updated_at|paid_at|refunded_at|processed_at|transaction_date|payment_date|payout_date|date)$/.test(
      column
    )
  ) {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  }

  return String(value);
}

function getRecords(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function getAmount(item) {
  const amount = item.amount ?? item.total_amount ?? item.payout_amount;

  if (amount == null || amount === '') return null;

  const number = Number(amount);
  return Number.isFinite(number) ? number : null;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function Finance() {
  const [section, setSection] = useState('payments');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');
    setItems([]);

    getResource('finance', { section })
      .then((result) => {
        if (active) {
          setItems(getRecords(result));
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Unable to load finance records.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [section, reload]);

  const columns = useMemo(
    () => (items.length ? Object.keys(items[0]).slice(0, 7) : []),
    [items]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) =>
      Object.values(item).some((value) =>
        String(
          value !== null && typeof value === 'object'
            ? JSON.stringify(value)
            : value ?? ''
        )
          .toLowerCase()
          .includes(query)
      )
    );
  }, [items, search]);

  const summary = useMemo(() => {
    const amounts = items.map(getAmount).filter((amount) => amount !== null);

    return {
      records: items.length,
      amountCount: amounts.length,
      amountTotal: amounts.reduce((total, amount) => total + amount, 0),
    };
  }, [items]);

  return (
    <section className="module-page finance-page">
      <style>{`
        .finance-page {
          color: #26352D;
        }

        .finance-page .finance-summary {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .finance-page .finance-stat {
          min-width: 0;
          padding: 17px 18px;
          border: 1px solid #e4e9e1;
          border-radius: 12px;
          background: #fff;
        }

        .finance-page .finance-stat-label {
          margin-bottom: 8px;
          color: #737d73;
          font-size: 12px;
        }

        .finance-page .finance-stat-value {
          color: #26352D;
          font-size: 24px;
          line-height: 1.3;
          font-weight: 650;
          overflow-wrap: anywhere;
        }

        .finance-page .finance-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding: 14px 18px;
          border-bottom: 1px solid #edf0eb;
        }

        .finance-page .finance-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .finance-page .finance-tabs button {
          padding: 8px 11px;
          color: #625e54;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .finance-page .finance-tabs button:hover {
          background: #f6f7f3;
        }

        .finance-page .finance-tabs button.selected {
          color: #344d38;
          background: #e8ebdf;
          border-color: #d5ddce;
          font-weight: 700;
        }

        .finance-page .finance-tools {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .finance-page .finance-tools input {
          width: 190px;
          min-width: 0;
          min-height: 36px;
          padding: 7px 10px;
          border: 1px solid #dfe5dc;
          border-radius: 8px;
          color: #344438;
          background: #fff;
          font: inherit;
          font-size: 12px;
        }

        .finance-page .finance-refresh {
          min-height: 36px;
          padding: 7px 11px;
          border: 1px solid #dfe5dc;
          border-radius: 8px;
          color: #344b39;
          background: #fff;
          font: inherit;
          font-size: 12px;
          cursor: pointer;
        }

        .finance-page .finance-refresh:hover {
          background: #f5f7f3;
        }

        .finance-page .finance-count {
          padding: 12px 18px 0;
          color: #777f78;
          font-size: 12px;
        }

        .finance-page .finance-empty {
          padding: 40px 18px;
          text-align: center;
        }

        .finance-page .finance-empty h3 {
          margin: 12px 0 6px;
          color: #344438;
          font-size: 16px;
        }

        .finance-page .finance-empty p {
          margin: 0;
          color: #7b847c;
          font-size: 13px;
        }

        .finance-page .finance-error {
          padding: 20px;
          color: #a13d3d;
          font-size: 13px;
        }

        .finance-page .finance-retry {
          margin-top: 10px;
          padding: 8px 12px;
          border: 1px solid #e5ceca;
          border-radius: 7px;
          color: #913f38;
          background: #fff;
          cursor: pointer;
        }

        .finance-page .finance-value {
          min-width: 130px;
          max-width: 320px;
          overflow-wrap: anywhere;
          white-space: normal;
          font-size: 12px;
        }

        @media (max-width: 700px) {
          .finance-page .finance-summary {
            gap: 8px;
          }

          .finance-page .finance-stat {
            padding: 12px;
          }

          .finance-page .finance-stat-label {
            font-size: 11px;
          }

          .finance-page .finance-stat-value {
            font-size: 20px;
          }

          .finance-page .finance-toolbar {
            align-items: stretch;
            padding: 12px;
          }

          .finance-page .finance-tabs {
            width: 100%;
          }

          .finance-page .finance-tabs button {
            flex: 1 1 auto;
          }

          .finance-page .finance-tools {
            width: 100%;
          }

          .finance-page .finance-tools input {
            flex: 1;
            width: 100%;
          }

          .finance-page .finance-count {
            padding: 12px 12px 0;
          }
        }

        @media (max-width: 380px) {
          .finance-page .finance-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="module-intro">
        <div>
          <h2>Finance</h2>
          <p>Review payment, refund, and vendor payout records.</p>
        </div>
      </div>

      <div className="finance-summary">
        <div className="finance-stat">
          <div className="finance-stat-label">Records in this section</div>
          <div className="finance-stat-value">
            {loading ? '—' : summary.records}
          </div>
        </div>

        <div className="finance-stat">
          <div className="finance-stat-label">
            Total of available amount fields
          </div>
          <div className="finance-stat-value">
            {loading || summary.amountCount === 0
              ? '—'
              : formatCurrency(summary.amountTotal)}
          </div>
        </div>
      </div>

      <div className="module-card">
        <div className="finance-toolbar">
          <div
            className="finance-tabs"
            role="tablist"
            aria-label="Finance records"
          >
            {sections.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={section === value ? 'selected' : ''}
                role="tab"
                aria-selected={section === value}
                onClick={() => {
                  setSection(value);
                  setSearch('');
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="finance-tools">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search records…"
              aria-label="Search finance records"
            />

            <button
              type="button"
              className="finance-refresh"
              onClick={() => setReload((current) => current + 1)}
              disabled={loading}
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {!loading && !error && (
          <div className="finance-count">
            Showing {filteredItems.length} of {items.length} records
          </div>
        )}

        {loading ? (
          <div className="loading-state">Loading finance records…</div>
        ) : error ? (
          <div className="finance-error" role="alert">
            <div>{error}</div>
            <button
              type="button"
              className="finance-retry"
              onClick={() => setReload((current) => current + 1)}
            >
              Try again
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="finance-empty">
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
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 10h18M7 15h3" />
            </svg>

            <h3>
              {items.length === 0
                ? 'No finance records yet'
                : 'No matching records'}
            </h3>

            <p>
              {items.length === 0
                ? 'Records will appear here when transactions are available.'
                : 'Try a different search term.'}
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column}>{formatColumnName(column)}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item, index) => (
                  <tr key={item.id ?? `${section}-${index}`}>
                    {columns.map((column) => (
                      <td key={column}>
                        <div className="finance-value">
                          {displayValue(item[column], column)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
