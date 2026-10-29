
import { useEffect, useMemo, useState } from 'react';
import { getReportsOverview, getResource } from '../services/adminService.js';
import { AyurvedicHeroBanner } from '../components/AyurvedicDoodles.jsx';

const summaryFields = [
  ['Customers', 'customers'],
  ['Vendors', 'vendors'],
  ['Approved vendors', 'approved_vendors'],
  ['Pending vendors', 'pending_vendors'],
  ['Products', 'products'],
  ['Active products', 'active_products'],
  ['Pending products', 'pending_products'],
  ['Orders', 'orders'],
];

const reportOptions = [
  ['orders', 'Orders'],
  ['products', 'Products'],
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
    /(^|_)(created_at|updated_at|ordered_at|date)$/.test(column)
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

export default function Reports() {
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');

  const [report, setReport] = useState('orders');
  const [items, setItems] = useState([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState('');
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    setOverviewLoading(true);
    setOverviewError('');

    getReportsOverview()
      .then((result) => {
        if (active) setOverview(result);
      })
      .catch((requestError) => {
        if (active) {
          setOverviewError(
            requestError.message || 'Unable to load report overview.'
          );
        }
      })
      .finally(() => {
        if (active) setOverviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    setReportLoading(true);
    setReportError('');
    setItems([]);

    getResource('reports', { report })
      .then((result) => {
        if (active) setItems(getRecords(result));
      })
      .catch((requestError) => {
        if (active) {
          setReportError(
            requestError.message || 'Unable to load the selected report.'
          );
        }
      })
      .finally(() => {
        if (active) setReportLoading(false);
      });

    return () => {
      active = false;
    };
  }, [report, reload]);

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

  function retryOverview() {
    // Reloading the page is unnecessary; use the current overview effect
    // by keeping overview refresh separate from the detailed report.
    setOverviewLoading(true);
    setOverviewError('');

    getReportsOverview()
      .then((result) => setOverview(result))
      .catch((requestError) =>
        setOverviewError(
          requestError.message || 'Unable to load report overview.'
        )
      )
      .finally(() => setOverviewLoading(false));
  }

  return (
    <section className="module-page reports-page">
      <style>{`
        .reports-page {
          color: #26352D;
        }

        .reports-page .report-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .reports-page .report-metric {
          min-width: 0;
          padding: 15px;
          background: #fff;
          border: 1px solid #e4e9e1;
          border-radius: 11px;
        }

        .reports-page .report-metric-label {
          display: block;
          color: #737d73;
          font-size: 11px;
          line-height: 1.5;
        }

        .reports-page .report-metric-value {
          display: block;
          margin-top: 8px;
          color: #344b39;
          font-size: 22px;
          font-weight: 650;
          overflow-wrap: anywhere;
        }

        .reports-page .report-overview-error {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 16px;
          padding: 13px 15px;
          border: 1px solid #ecd6d1;
          border-radius: 9px;
          color: #963e37;
          background: #fffafa;
          font-size: 12px;
        }

        .reports-page .report-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding: 15px 18px;
          border-bottom: 1px solid #edf0eb;
        }

        .reports-page .report-toolbar-title {
          color: #344438;
          font-size: 13px;
          font-weight: 650;
        }

        .reports-page .report-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .reports-page .report-controls select,
        .reports-page .report-controls input {
          min-height: 37px;
          padding: 8px 10px;
          border: 1px solid #dfe5dc;
          border-radius: 8px;
          background: #fff;
          color: #344438;
          font: inherit;
          font-size: 12px;
        }

        .reports-page .report-controls input {
          width: 200px;
          min-width: 0;
        }

        .reports-page .report-refresh,
        .reports-page .report-retry {
          min-height: 36px;
          padding: 8px 11px;
          border: 1px solid #dce4d8;
          border-radius: 8px;
          background: #fff;
          color: #344b39;
          font: inherit;
          font-size: 12px;
          cursor: pointer;
        }

        .reports-page .report-refresh:hover,
        .reports-page .report-retry:hover {
          background: #f5f7f3;
        }

        .reports-page .report-count {
          padding: 12px 18px 0;
          color: #777f78;
          font-size: 12px;
        }

        .reports-page .report-empty {
          padding: 40px 18px;
          text-align: center;
        }

        .reports-page .report-empty h3 {
          margin: 12px 0 6px;
          color: #344438;
          font-size: 16px;
        }

        .reports-page .report-empty p {
          margin: 0;
          color: #7b847c;
          font-size: 13px;
        }

        .reports-page .report-error {
          padding: 20px;
          color: #a13d3d;
          font-size: 13px;
        }

        .reports-page .report-cell {
          min-width: 110px;
          max-width: 320px;
          overflow-wrap: anywhere;
          white-space: normal;
          font-size: 12px;
        }

        @media (max-width: 900px) {
          .reports-page .report-metrics {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .reports-page .report-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .reports-page .report-metric {
            padding: 12px;
          }

          .reports-page .report-metric-value {
            font-size: 20px;
          }

          .reports-page .report-toolbar {
            align-items: stretch;
            padding: 13px;
          }

          .reports-page .report-controls {
            width: 100%;
          }

          .reports-page .report-controls select,
          .reports-page .report-controls input {
            flex: 1;
            width: 100%;
          }

          .reports-page .report-count {
            padding: 12px 13px 0;
          }
        }

        @media (max-width: 350px) {
          .reports-page .report-metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <AyurvedicHeroBanner
        eyebrow="AUMVEDA BUSINESS ANALYTICS"
        title="Reports, Metrics & Store Intelligence"
        description="Review operational summaries, sales trends, supplier performance, and detailed inventory metrics."
        badgeText="Analytics Engine"
        doodle="leaf"
      />

      {overviewError && (
        <div className="report-overview-error" role="alert">
          <span>{overviewError}</span>
          <button
            type="button"
            className="report-retry"
            onClick={retryOverview}
          >
            Retry overview
          </button>
        </div>
      )}

      <div className="report-metrics">
        {summaryFields.map(([label, key]) => (
          <article className="report-metric" key={key}>
            <span className="report-metric-label">{label}</span>
            <strong className="report-metric-value">
              {overviewLoading
                ? '—'
                : overview?.[key] == null
                  ? '—'
                  : Number(overview[key]).toLocaleString('en-IN')}
            </strong>
          </article>
        ))}
      </div>

      <div className="module-card">
        <div className="report-toolbar">
          <strong className="report-toolbar-title">Detailed report</strong>

          <div className="report-controls">
            <select
              value={report}
              onChange={(event) => {
                setReport(event.target.value);
                setSearch('');
              }}
              aria-label="Choose report"
            >
              {reportOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search report…"
              aria-label="Search detailed report"
            />

            <button
              type="button"
              className="report-refresh"
              disabled={reportLoading}
              onClick={() => setReload((current) => current + 1)}
            >
              {reportLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {!reportLoading && !reportError && (
          <div className="report-count">
            Showing {filteredItems.length} of {items.length} records
          </div>
        )}

        {reportLoading ? (
          <div className="loading-state">Loading {report} report…</div>
        ) : reportError ? (
          <div className="report-error" role="alert">
            <div>{reportError}</div>
            <button
              type="button"
              className="report-retry"
              onClick={() => setReload((current) => current + 1)}
            >
              Try again
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="report-empty">
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
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M8 7h8M8 11h8" />
            </svg>

            <h3>
              {items.length === 0
                ? 'No records available'
                : 'No matching records'}
            </h3>

            <p>
              {items.length === 0
                ? `There are currently no records in the ${report} report.`
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
                  <tr key={item.id ?? `${report}-${index}`}>
                    {columns.map((column) => (
                      <td key={column}>
                        <div className="report-cell">
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
