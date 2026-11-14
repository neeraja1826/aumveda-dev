import { useEffect, useMemo, useState } from 'react';
import { Eye, RefreshCw, X, Settings as SettingsIcon } from 'lucide-react';

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
  const [selectedSetting, setSelectedSetting] = useState(null);

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
          setError(
            requestError.message || 'Unable to load site settings.'
          );
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

  function openSettingDetails(setting) {
    setSelectedSetting(setting);
  }

  function closeSettingDetails() {
    setSelectedSetting(null);
  }

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
          width: 240px;
          min-width: 0;
          min-height: 42px;
          padding: 0 14px;
          border: 1px solid #D5E4D2;
          border-radius: 10px;
          background: #FFFFFF;
          color: #123D2B;
          font: inherit;
          font-size: 13px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .settings-page .settings-controls input:focus {
          border-color: #276345;
          box-shadow: 0 0 0 3px rgba(39, 99, 69, 0.12);
          outline: none;
        }

        .settings-page .settings-refresh,
        .settings-page .settings-retry {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 42px;
          padding: 0 16px;
          border: 1px solid #D5E4D2;
          border-radius: 10px;
          background: #FFFFFF;
          color: #123D2B;
          font: inherit;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .settings-page .settings-refresh:hover,
        .settings-page .settings-retry:hover {
          background: #F8FAF7;
          border-color: #276345;
          transform: translateY(-1px);
        }

        .settings-page .settings-refresh:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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

        .settings-page .settings-action {
          width: 120px;
        }

        .settings-page .settings-view-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 11px;
          border: 1px solid #dce4d8;
          border-radius: 8px;
          background: #fff;
          color: #365340;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .settings-page .settings-view-button:hover {
          background: #f4f7f2;
          border-color: #bfcfc0;
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

        .settings-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(30, 43, 34, 0.42);
        }

        .settings-modal {
          width: min(620px, 100%);
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          border: 1px solid #e1e7df;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 24px 70px rgba(35, 52, 40, 0.18);
        }

        .settings-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 22px 24px;
          border-bottom: 1px solid #edf0eb;
        }

        .settings-modal-eyebrow {
          display: block;
          margin-bottom: 6px;
          color: #718074;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .settings-modal-header h2 {
          margin: 0;
          color: #304337;
          font-size: 21px;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }

        .settings-modal-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          border: 1px solid #e0e6df;
          border-radius: 8px;
          background: #fff;
          color: #607064;
          cursor: pointer;
        }

        .settings-modal-close:hover {
          background: #f5f7f3;
        }

        .settings-modal-body {
          padding: 22px 24px;
        }

        .settings-modal-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          margin-bottom: 18px;
          border-radius: 12px;
          background: #f0f5ef;
          color: #55715c;
        }

        .settings-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .settings-detail {
          padding: 13px;
          border: 1px solid #e7ebe5;
          border-radius: 10px;
          background: #fafbf9;
        }

        .settings-detail span {
          display: block;
          margin-bottom: 6px;
          color: #7a847b;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .settings-detail strong {
          display: block;
          color: #36483b;
          font-size: 13px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .settings-detail-value {
          padding: 14px;
          border: 1px solid #e3e9e0;
          border-radius: 10px;
          background: #f7f9f6;
        }

        .settings-detail-value span {
          display: block;
          margin-bottom: 8px;
          color: #7a847b;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .settings-detail-value pre {
          margin: 0;
          max-height: 260px;
          overflow: auto;
          color: #455449;
          font-family: inherit;
          font-size: 12px;
          line-height: 1.6;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .settings-modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px 24px 20px;
          border-top: 1px solid #edf0eb;
        }

        .settings-modal-secondary {
          padding: 8px 14px;
          border: 1px solid #dce4d8;
          border-radius: 8px;
          background: #fff;
          color: #405247;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .settings-modal-secondary:hover {
          background: #f5f7f3;
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

          .settings-detail-grid {
            grid-template-columns: 1fr;
          }

          .settings-modal-overlay {
            padding: 12px;
          }

          .settings-modal-header {
            padding: 18px;
          }

          .settings-modal-body {
            padding: 18px;
          }

          .settings-modal-footer {
            padding-left: 18px;
            padding-right: 18px;
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
              <RefreshCw size={14} />
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            Loading site settings…
          </div>
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
            <SettingsIcon
              size={42}
              strokeWidth={1.4}
              style={{ color: '#9aa795' }}
            />

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
                  <th>Action</th>
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

                    <td className="settings-action">
                      <button
                        type="button"
                        className="settings-view-button"
                        onClick={() => openSettingDetails(item)}
                      >
                        <Eye size={14} />
                        View
                      </button>
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

      {selectedSetting && (
        <div
          className="settings-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSettingDetails();
            }
          }}
        >
          <div
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-details-title"
          >
            <div className="settings-modal-header">
              <div>
                <span className="settings-modal-eyebrow">
                  Platform Configuration
                </span>

                <h2 id="settings-details-title">
                  {getSettingName(selectedSetting)}
                </h2>
              </div>

              <button
                type="button"
                className="settings-modal-close"
                onClick={closeSettingDetails}
                aria-label="Close settings details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="settings-modal-body">
              <div className="settings-modal-icon">
                <SettingsIcon size={23} strokeWidth={1.6} />
              </div>

              <div className="settings-detail-grid">
                <div className="settings-detail">
                  <span>Setting ID</span>
                  <strong>{selectedSetting.id || '—'}</strong>
                </div>

                <div className="settings-detail">
                  <span>Key</span>
                  <strong>
                    {selectedSetting.key ||
                      selectedSetting.name ||
                      '—'}
                  </strong>
                </div>

                <div className="settings-detail">
                  <span>Last Updated</span>
                  <strong>
                    {formatDate(selectedSetting.updated_at)}
                  </strong>
                </div>

                <div className="settings-detail">
                  <span>Status</span>
                  <strong>Read-only</strong>
                </div>
              </div>

              {selectedSetting.description && (
                <div className="settings-detail" style={{ marginBottom: 12 }}>
                  <span>Description</span>
                  <strong>{selectedSetting.description}</strong>
                </div>
              )}

              <div className="settings-detail-value">
                <span>Current Value</span>

                <pre>
                  {formatSettingValue(
                    getSettingValue(selectedSetting)
                  )}
                </pre>
              </div>
            </div>

            <div className="settings-modal-footer">
              <button
                type="button"
                className="settings-modal-secondary"
                onClick={closeSettingDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}