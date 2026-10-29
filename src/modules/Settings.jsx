
import { useEffect, useMemo, useState } from 'react';
import { getResource } from '../services/adminService.js';
import { AyurvedicHeroBanner } from '../components/AyurvedicDoodles.jsx';

function formatSettingValue(value) {
  if (value == null || value === '') return '—';

  if (typeof value === 'boolean') {
    return value ? 'Enabled' : 'Disabled';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

function getSettingName(item) {
  return item.key || item.name || item.id || 'Unnamed setting';
}

function getSettingValue(item) {
  return item.value ?? item.setting_value ?? item.config_value ?? null;
}

function getSettings(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

export default function Settings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    getResource('settings')
      .then((result) => {
        if (active) {
          setItems(getSettings(result));
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Unable to load site settings.');
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
        getSettingName(item),
        formatSettingValue(getSettingValue(item)),
        item.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [items, search]);

  return (
    <section className="module-page settings-page">
      <style>{`
        .settings-page {
          color: #26352D;
        }

        .settings-page .settings-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding: 15px 18px;
          border-bottom: 1px solid #edf0eb;
        }

        .settings-page .settings-count {
          color: #777f78;
          font-size: 12px;
        }

        .settings-page .settings-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .settings-page .settings-controls input {
          width: 220px;
          min-width: 0;
          min-height: 37px;
          padding: 8px 10px;
          border: 1px solid #dfe5dc;
          border-radius: 8px;
          background: #fff;
          color: #344438;
          font: inherit;
          font-size: 12px;
        }

        .settings-page .settings-refresh,
        .settings-page .settings-retry {
          min-height: 36px;
          padding: 8px 12px;
          border: 1px solid #dce4d8;
          border-radius: 8px;
          background: #fff;
          color: #344b39;
          font: inherit;
          font-size: 12px;
          cursor: pointer;
        }

        .settings-page .settings-refresh:hover,
        .settings-page .settings-retry:hover {
          background: #f5f7f3;
        }

        .settings-page .settings-key {
          min-width: 150px;
          color: #344b39;
          font-size: 12px;
          font-weight: 650;
          overflow-wrap: anywhere;
        }

        .settings-page .settings-description {
          margin-top: 5px;
          color: #858d85;
          font-size: 11px;
          line-height: 1.5;
        }

        .settings-page .settings-value {
          min-width: 220px;
          max-width: 500px;
          color: #59665b;
          font-size: 12px;
          line-height: 1.6;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .settings-page .settings-date {
          min-width: 125px;
          color: #737d73;
          font-size: 12px;
        }

        .settings-page .settings-note {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin: 14px 0 0;
          padding: 12px 14px;
          border: 1px solid #e3e8df;
          border-radius: 9px;
          background: #f7f8f4;
          color: #687366;
          font-size: 11px;
          line-height: 1.6;
        }

        .settings-page .settings-error {
          padding: 20px;
          color: #a13d3d;
          font-size: 13px;
        }

        .settings-page .settings-empty {
          padding: 40px 18px;
          text-align: center;
        }

        .settings-page .settings-empty h3 {
          margin: 12px 0 6px;
          color: #344438;
          font-size: 16px;
        }

        .settings-page .settings-empty p {
          margin: 0;
          color: #7b847c;
          font-size: 13px;
        }

        @media (max-width: 700px) {
          .settings-page .settings-toolbar {
            align-items: stretch;
            padding: 13px;
          }

          .settings-page .settings-controls {
            width: 100%;
          }

          .settings-page .settings-controls input {
            flex: 1;
            width: 100%;
          }

          .settings-page .settings-value {
            min-width: 180px;
          }
        }
      `}</style>

      <AyurvedicHeroBanner
        eyebrow="AUMVEDA SYSTEM CONFIGURATION"
        title="Settings & Platform Governance"
        description="View live store environment variables, regional delivery rules, policy parameters, and security policies."
        badgeText="Core Governance"
        doodle="leaf"
      />

      <div className="module-card">
        <div className="settings-toolbar">
          <span className="settings-count">
            {loading
              ? 'Loading settings…'
              : `Showing ${filteredItems.length} of ${items.length} settings`}
          </span>

          <div className="settings-controls">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search settings…"
              aria-label="Search site settings"
            />

            <button
              type="button"
              className="settings-refresh"
              disabled={loading}
              onClick={() => setReload((current) => current + 1)}
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading site settings…</div>
        ) : error ? (
          <div className="settings-error" role="alert">
            <div>{error}</div>
            <button
              type="button"
              className="settings-retry"
              onClick={() => setReload((current) => current + 1)}
            >
              Try again
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="settings-empty">
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
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.6 2.8-.2-.1a1.7 1.7 0 0 0-1.8.2 1.7 1.7 0 0 0-.8 1.5v.2h-3.2v-.2a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1-2.8-1.6.1-.2a1.7 1.7 0 0 0-.2-1.8A1.7 1.7 0 0 0 4.8 16h-.2v-3.2h.2a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8L6 9.8l1.6-2.8.2.1a1.7 1.7 0 0 0 1.8-.2 1.7 1.7 0 0 0 .8-1.5v-.2h3.2v.2a1.7 1.7 0 0 0 1.1 1.6 1.7 1.7 0 0 0 1.8-.3l.1-.1 2.8 1.6-.1.2a1.7 1.7 0 0 0 .2 1.8 1.7 1.7 0 0 0 1.5.8h.2v3.2h-.2a1.7 1.7 0 0 0-1.1.8z" />
            </svg>

            <h3>
              {items.length === 0
                ? 'No settings available'
                : 'No matching settings'}
            </h3>

            <p>
              {items.length === 0
                ? 'The API did not return any site configuration values.'
                : 'Try a different search term.'}
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Setting</th>
                  <th>Value</th>
                  <th>Last Updated</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item, index) => (
                  <tr key={item.id ?? item.key ?? index}>
                    <td>
                      <div className="settings-key">
                        {getSettingName(item)}
                      </div>

                      {item.description && (
                        <div className="settings-description">
                          {item.description}
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="settings-value">
                        {formatSettingValue(getSettingValue(item))}
                      </div>
                    </td>

                    <td>
                      <div className="settings-date">
                        {formatDate(item.updated_at)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="settings-note">
        <span aria-hidden="true">ⓘ</span>
        <span>
          These settings are read-only. Changes are not available through the
          current admin API.
        </span>
      </div>
    </section>
  );
}
