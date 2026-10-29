
import { useEffect, useState } from 'react';
import {
  getResource,
  updateResourceStatus,
  updateVendorActiveStatus,
  getVendorDetails,
} from '../services/adminService.js';
import { AyurvedicHeroBanner } from '../components/AyurvedicDoodles.jsx';

const statuses = ['pending', 'approved', 'rejected', 'suspended'];

export default function Vendors() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [reload, setReload] = useState(0);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  async function openVendorDetails(item) {
    setSelectedVendor(item);
    setVendorDetails(null);
    setDetailsError('');
    setDetailsLoading(true);

    try {
      const result = await getVendorDetails(item.id);
      console.log('Vendor details API response:', result);

      const details = result?.data ?? result?.vendor ?? result;
      setVendorDetails(details);
      console.log('Vendor details state:', details);
    } catch (error) {
      console.error('Vendor details error:', error);
      setDetailsError(
        error.message || 'Unable to load vendor details.'
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeVendorDetails() {
    setSelectedVendor(null);
    setVendorDetails(null);
    setDetailsError('');
  }

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    const params = {
      ...(status ? { status } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    };

    getResource('vendors', params)
      .then((result) => {
        if (active) setItems(result.items || []);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Unable to load vendors.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status, search, reload]);

  async function changeStatus(item, value) {
    if (updatingId) return;

    setUpdatingId(item.id);
    setError('');

    try {
      await updateResourceStatus('vendors', item.id, value);
      setReload((current) => current + 1);
    } catch (requestError) {
      setError(requestError.message || 'Unable to update vendor status.');
    } finally {
      setUpdatingId('');
    }
  }

  async function changeActiveStatus(item, isActive) {
    if (updatingId) return;

    setUpdatingId(item.id);
    setError('');

    try {
      await updateVendorActiveStatus(item.id, isActive);
      setReload((current) => current + 1);
    } catch (requestError) {
      setError(
        requestError.message || 'Unable to update vendor account.'
      );
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <section className="module-page vendors-page">
      <AyurvedicHeroBanner
        eyebrow="AUMVEDA APOTHECARY PARTNERS"
        title="Vendors & Herbal Suppliers"
        description="Review artisan apothecary partners, herbal manufacturers, commission rates, and account approvals."
        badgeText={`${items.length} Suppliers`}
        doodle="tonic"
      />

      <div className="module-card">
        <div className="module-toolbar">
          <span>{items.length} vendors</span>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search business name or email..."
            aria-label="Search vendors"
          />

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter vendors by approval status"
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
          <div className="loading-state">Loading vendors…</div>
        ) : items.length === 0 ? (
          <div className="empty-state">No vendors found.</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Commission</th>
                  <th>Joined</th>
                  <th>Approval status</th>
                  <th>Account</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
  <div className="vendor-profile">
    {item.logo_url ? (
      <img
        src={item.logo_url}
        alt=""
        className="vendor-logo"
        loading="lazy"
      />
    ) : (
      <div className="vendor-logo vendor-logo-fallback">
        {(item.business_name || 'V')
          .trim()
          .charAt(0)
          .toUpperCase()}
      </div>
    )}

    <div>
      <strong>
        {item.business_name || 'Unnamed vendor'}
      </strong>
      <div className="vendor-subtitle">
        {item.legal_name || item.slug || '—'}
      </div>

      <button
  type="button"
  className="vendor-details-button"
  onClick={() => {
    openVendorDetails(item);
  }}
>
  View details
</button>
    </div>
  </div>
</td>
                  

                    <td>
                      <div>{item.email || '—'}</div>
                      <div className="vendor-subtitle">
                        {item.phone || 'No phone'}
                      </div>
                    </td>

                    <td>
                      {[item.city, item.state]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </td>

                    <td>{item.commission_rate ?? 0}%</td>

                    <td>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : '—'}
                    </td>

                    <td>
                      <select
                        value={item.status || 'pending'}
                        disabled={updatingId !== ''}
                        onChange={(event) =>
                          changeStatus(item, event.target.value)
                        }
                        aria-label={`Approval status for ${
                          item.business_name || 'vendor'
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
                      <div className="vendor-account-actions">
                        <span
                          className={`vendor-account-status ${
                            item.is_active ? 'is-active' : 'is-inactive'
                          }`}
                        >
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>

                        <button
                          type="button"
                          className="vendor-account-toggle"
                          disabled={updatingId !== ''}
                          onClick={() =>
                            changeActiveStatus(item, !item.is_active)
                          }
                        >
                          {updatingId === item.id
                            ? 'Updating...'
                            : item.is_active
                              ? 'Deactivate'
                              : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {selectedVendor && (
  <div
    className="vendor-modal-overlay"
    onClick={closeVendorDetails}
  >
    <section
      className="vendor-details-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vendor-details-title"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="vendor-modal-header">
        <div>
          <h3 id="vendor-details-title">Vendor Details</h3>
          <p>Business and account information</p>
        </div>

        <button
          type="button"
          className="vendor-modal-close"
          onClick={closeVendorDetails}
          aria-label="Close vendor details"
        >
          ×
        </button>
      </div>

      {detailsLoading ? (
        <div className="loading-state">Loading vendor details…</div>
      ) : detailsError ? (
        <div className="error-state" role="alert">
          {detailsError}
        </div>
      ) : vendorDetails ? (
        <div className="vendor-details-grid">
          <div>
            <span>Business name</span>
            <strong>
              {vendorDetails.business_name ||
                selectedVendor.business_name ||
                '—'}
            </strong>
          </div>

          <div>
            <span>Legal name</span>
            <strong>
              {vendorDetails.legal_name ||
                selectedVendor.legal_name ||
                '—'}
            </strong>
          </div>

          <div>
            <span>Email</span>
            <strong>
              {vendorDetails.email || selectedVendor.email || '—'}
            </strong>
          </div>

          <div>
            <span>Phone</span>
            <strong>
              {vendorDetails.phone || selectedVendor.phone || '—'}
            </strong>
          </div>

          <div>
            <span>Location</span>
            <strong>
              {[
                vendorDetails.city || selectedVendor.city,
                vendorDetails.state || selectedVendor.state,
              ]
                .filter(Boolean)
                .join(', ') || '—'}
            </strong>
          </div>

          <div>
            <span>Commission</span>
            <strong>
              {vendorDetails.commission_rate ??
                selectedVendor.commission_rate ??
                0}%
            </strong>
          </div>

          <div>
            <span>Approval status</span>
            <strong>
              {vendorDetails.status || selectedVendor.status || 'pending'}
            </strong>
          </div>

          <div>
            <span>Account status</span>
            <strong>
              {(vendorDetails.is_active ?? selectedVendor.is_active)
                ? 'Active'
                : 'Inactive'}
            </strong>
          </div>

          <div>
            <span>Joined</span>
            <strong>
              {(vendorDetails.created_at || selectedVendor.created_at)
                ? new Date(
                    vendorDetails.created_at || selectedVendor.created_at
                  ).toLocaleDateString('en-IN')
                : '—'}
            </strong>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          No vendor details available.
        </div>
      )}

      <div className="vendor-modal-footer">
        <button
          type="button"
          className="vendor-modal-done"
          onClick={closeVendorDetails}
        >
          Close
        </button>
      </div>
    </section>
  </div>
)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .vendors-page .module-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .vendors-page .module-toolbar > span {
          color: #77747a;
          font-size: 12px;
        }

        .vendors-page .module-toolbar input[type="search"] {
          flex: 1;
          min-width: 220px;
        }

        .vendors-page .vendor-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 210px;
        }

        .vendors-page .vendor-logo {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .vendors-page .vendor-logo-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #E8F2E7;
          color: #123D2B;
          font-weight: 700;
          border: 1px solid #CDE2CB;
          border-radius: 8px;
        }

        .vendors-page .vendor-subtitle {
          margin-top: 4px;
          font-size: 12px;
          color: #716F68;
          overflow-wrap: anywhere;
        }

        .vendors-page .vendor-account-status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 600;
        }

        .vendors-page .vendor-account-status.is-active {
          background: #E8F2E7;
          color: #123D2B;
          border: 1px solid #CDE2CB;
        }

        .vendors-page .vendor-account-status.is-inactive {
          background: #FDF1F0;
          color: #A3332A;
          border: 1px solid #F8CECA;
        }

        .vendors-page .vendor-account-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .vendors-page .vendor-account-toggle {
          padding: 7px 12px;
          border: 1px solid #D5E4D2;
          border-radius: 8px;
          background: #FFFFFF;
          color: #123D2B;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .vendors-page .vendor-account-toggle:hover:not(:disabled) {
          background: #F8FAF7;
          border-color: #276345;
          transform: translateY(-1px);
        }

        .vendors-page .vendor-account-toggle:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (max-width: 620px) {
          .vendors-page .module-toolbar {
            align-items: stretch;
          }

          .vendors-page .module-toolbar input[type="search"],
          .vendors-page .module-toolbar select {
            width: 100%;
          }
        }
          .vendors-page .vendor-details-button {
  display: inline-block;
  width: auto;
  margin-top: 8px;
  padding: 5px 9px;
  border: 1px solid #d9dce3;
  border-radius: 6px;
  background: #fff;
  color: #285447;
  font-size: 11px;
  cursor: pointer;
  pointer-events: auto;
}
.vendors-page .vendor-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(18, 30, 24, 0.55);
}

.vendors-page .vendor-details-modal {
  width: 100%;
  max-width: 620px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 24px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.vendors-page .vendor-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.vendors-page .vendor-modal-header h3 {
  margin: 0;
  color: #123d2b;
  font-size: 20px;
}

.vendors-page .vendor-modal-header p {
  margin: 6px 0 0;
  color: #77747a;
  font-size: 13px;
}

.vendors-page .vendor-modal-close {
  border: 0;
  background: transparent;
  color: #555;
  font-size: 28px;
  cursor: pointer;
}

.vendors-page .vendor-details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.vendors-page .vendor-details-grid > div {
  min-width: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.vendors-page .vendor-details-grid span {
  display: block;
  margin-bottom: 6px;
  color: #77747a;
  font-size: 12px;
}

.vendors-page .vendor-details-grid strong {
  display: block;
  color: #252a26;
  font-size: 14px;
  overflow-wrap: anywhere;
}

.vendors-page .vendor-modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.vendors-page .vendor-modal-done {
  padding: 10px 20px;
  border: 0;
  border-radius: 7px;
  background: #123d2b;
  color: #fff;
  cursor: pointer;
}

@media (max-width: 520px) {
  .vendors-page .vendor-details-modal {
    padding: 18px;
  }

  .vendors-page .vendor-details-grid {
    grid-template-columns: 1fr;
  }
}
      `}</style>
    </section>
  );
}
