
import { useEffect, useState } from 'react';
import {
  getResource,
  updateResourceStatus,
  updateVendorActiveStatus,
  getVendorDetails,
  createVendor,
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
  const [showCreateVendor, setShowCreateVendor] = useState(false);
const [creatingVendor, setCreatingVendor] = useState(false);
const [createVendorError, setCreateVendorError] = useState('');
const [createdVendorCredentials, setCreatedVendorCredentials] = useState(null);

const [vendorForm, setVendorForm] = useState({
  business_name: '',
  email: '',
  phone: '',
  password: '',
  confirm_password: '',
  legal_name: '',
  description: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  commission_rate: 0,
});

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

  async function handleCreateVendor(event) {
    event.preventDefault();

    if (creatingVendor) return;

    if (vendorForm.password !== vendorForm.confirm_password) {
      setCreateVendorError('Password and confirm password do not match.');
      return;
    }

    setCreatingVendor(true);
    setCreateVendorError('');
    setCreatedVendorCredentials(null);

    try {
      const payload = {
        business_name: vendorForm.business_name.trim(),
        email: vendorForm.email.trim(),
        phone: vendorForm.phone.trim(),
        password: vendorForm.password,
        legal_name: vendorForm.legal_name.trim() || undefined,
        description: vendorForm.description.trim() || undefined,
        address_line1: vendorForm.address_line1.trim() || undefined,
        address_line2: vendorForm.address_line2.trim() || undefined,
        city: vendorForm.city.trim() || undefined,
        state: vendorForm.state.trim() || undefined,
        postal_code: vendorForm.postal_code.trim() || undefined,
        country: vendorForm.country.trim() || 'India',
        commission_rate: Number(vendorForm.commission_rate) || 0,
      };

      const result = await createVendor(payload);

      const data = result?.data ?? result;

      setCreatedVendorCredentials({
        email: data?.credentials?.email || payload.email,
        password: data?.credentials?.temporary_password || '',
      });

      setReload((current) => current + 1);
    } catch (requestError) {
      setCreateVendorError(
        requestError.message || 'Unable to create vendor account.'
      );
    } finally {
      setCreatingVendor(false);
    }
  }

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
          <button
  type="button"
  className="vendor-create-button"
  onClick={() => {
    setCreateVendorError('');
    setCreatedVendorCredentials(null);
    setShowCreateVendor(true);
  }}
>
  + Create Vendor
</button>

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
              </tbody>
            </table>
          </div>
        )}
      </div>

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
    {showCreateVendor && (
  <div
    className="vendor-modal-overlay"
    onClick={() => {
      if (!creatingVendor) {
        setShowCreateVendor(false);
      }
    }}
  >
    <section
      className="vendor-create-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-vendor-title"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="vendor-modal-header">
        <div>
          <h3 id="create-vendor-title">Create Vendor Account</h3>
          <p>
            Create the vendor account and generate login credentials.
          </p>
        </div>

        <button
          type="button"
          className="vendor-modal-close"
          onClick={() => {
            if (!creatingVendor) {
              setShowCreateVendor(false);
            }
          }}
          aria-label="Close create vendor"
        >
          ×
        </button>
      </div>

      {createdVendorCredentials ? (
        <div className="vendor-credentials-success">
          <div className="vendor-success-icon">✓</div>

          <h4>Vendor Account Created</h4>

          <p>
            The vendor account has been created successfully.
            Share these credentials with the vendor.
          </p>

          <div className="vendor-credential-row">
            <span>Email</span>
            <strong>{createdVendorCredentials.email}</strong>
          </div>

          <div className="vendor-credential-row">
            <span>Temporary Password</span>
            <strong>{createdVendorCredentials.password}</strong>
          </div>

          <div className="vendor-credential-warning">
            Save these credentials before closing this window.
            The temporary password should be shared securely with
            the vendor.
          </div>

          <div className="vendor-modal-footer">
            <button
              type="button"
              className="vendor-modal-done"
              onClick={() => {
                setShowCreateVendor(false);
                setCreatedVendorCredentials(null);

                setVendorForm({
                  business_name: '',
                  email: '',
                  phone: '',
                  password: '',
                  confirm_password: '',
                  legal_name: '',
                  description: '',
                  address_line1: '',
                  address_line2: '',
                  city: '',
                  state: '',
                  postal_code: '',
                  country: 'India',
                  commission_rate: 0,
                });
              }}
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form
          className="vendor-create-form"
          onSubmit={handleCreateVendor}
        >
          {createVendorError && (
            <div className="error-state" role="alert">
              {createVendorError}
            </div>
          )}

          <div className="vendor-form-section">
            <h4>Account Information</h4>

            <div className="vendor-form-grid">
              <label>
                <span>Business Name *</span>
                <input
                  type="text"
                  value={vendorForm.business_name}
                  onChange={(event) =>
                    setVendorForm((current) => ({
                      ...current,
                      business_name: event.target.value,
                    }))
                  }
                  required
                  maxLength={255}
                />
              </label>

              <label>
                <span>Email *</span>
                <input
                  type="email"
                  value={vendorForm.email}
                  onChange={(event) =>
                    setVendorForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  required
                  maxLength={255}
                />
              </label>

              <label>
                <span>Phone *</span>
                <input
                  type="tel"
                  value={vendorForm.phone}
                  onChange={(event) =>
                    setVendorForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  required
                  minLength={5}
                  maxLength={50}
                />
              </label>

              <label>
                <span>Password *</span>
                <input
                  type="password"
                  value={vendorForm.password}
                  onChange={(event) =>
                    setVendorForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  required
                  minLength={6}
                  maxLength={100}
                />
              </label>

              <div className="vendor-form-field">
                <label htmlFor="vendor-confirm-password">
                  Confirm Password <span>*</span>
                </label>
                <input
                  id="vendor-confirm-password"
                  type="password"
                  value={vendorForm.confirm_password}
                  onChange={(event) =>
                    setVendorForm((current) => ({
                      ...current,
                      confirm_password: event.target.value,
                    }))
                  }
                  required
                  minLength={6}
                  maxLength={100}
                  placeholder="Confirm password"
                />
              </div>
            </div>
          </div>

          <div className="vendor-form-section">
            <h4>Business Details</h4>

            <div className="vendor-form-grid">
              <label>
                <span>Legal Name</span>
                <input
                  type="text"
                  value={vendorForm.legal_name}
                  onChange={(event) =>
                    setVendorForm((current) => ({
                      ...current,
                      legal_name: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Commission Rate (%) *</span>
                <input
                  type="number"
                  value={vendorForm.commission_rate}
                  onChange={(event) =>
                    setVendorForm((current) => ({
                      ...current,
                      commission_rate: event.target.value,
                    }))
                  }
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </label>

              <label className="vendor-form-full">
                <span>Description</span>
                <textarea
                  value={vendorForm.description}
                  onChange={(event) =>
                    setVendorForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                />
              </label>
            </div>
          </div>

          <div className="vendor-form-section">
            <h4>Address</h4>

            <div className="vendor-form-grid">
              <label className="vendor-form-full">
                <span>Address Line 1</span>
                <input
                  type="text"
                  value={vendorForm.address_line1}
                  onChange={(event) =>
                    setVendorForm((current) => ({
                      ...current,
                      address_line1: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="vendor-form-full">
                <span>Address Line 2</span>
                <input
                  type="text"
                  value={vendorForm.address_line2}
                  onChange={(event) =>
                    setVendorForm((current) => ({
                      ...current,
                      address_line2: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>City</span>
                <input
                  type="text"
                  value={vendorForm.city}
                  onChange={(event) =>
                    setVendorForm((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>State</span>
                <input
                  type="text"
                  value={vendorForm.state}
                  onChange={(event) =>
                    setVendorForm((current) => ({
                      ...current,
                      state: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Postal Code</span>
                <input
                  type="text"
                  value={vendorForm.postal_code}
                  onChange={(event) =>
                    setVendorForm((current) => ({
                      ...current,
                      postal_code: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Country</span>
                <input
                  type="text"
                  value={vendorForm.country}
                  onChange={(event) =>
                    setVendorForm((current) => ({
                      ...current,
                      country: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </div>

          <div className="vendor-modal-footer">
            <button
              type="button"
              className="vendor-create-cancel"
              onClick={() => setShowCreateVendor(false)}
              disabled={creatingVendor}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="vendor-create-submit"
              disabled={creatingVendor}
            >
              {creatingVendor
                ? 'Creating Account...'
                : 'Create Vendor Account'}
            </button>
          </div>
        </form>
      )}
    </section>
  </div>
)}

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

.vendors-page .vendor-create-button {
  position: relative;
  z-index: 20;
  padding: 9px 15px;
  border: 1px solid #123d2b;
  border-radius: 8px;
  background: #123d2b;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  pointer-events: auto;
}

.vendors-page .vendor-create-button:hover {
  background: #1b503a;
}

.vendors-page .vendor-create-modal {
  width: 100%;
  max-width: 760px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.vendors-page .vendor-create-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.vendors-page .vendor-form-section {
  padding: 18px;
  border: 1px solid #e8ebe7;
  border-radius: 10px;
  background: #fafcf9;
}

.vendors-page .vendor-form-section h4 {
  margin: 0 0 16px;
  color: #123d2b;
  font-size: 14px;
}

.vendors-page .vendor-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.vendors-page .vendor-form-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vendors-page .vendor-form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vendors-page .vendor-form-field label {
  color: #555b56;
  font-size: 12px;
  font-weight: 600;
}

.vendors-page .vendor-form-grid label span {
  color: #555b56;
  font-size: 12px;
  font-weight: 600;
}

.vendors-page .vendor-form-grid input,
.vendors-page .vendor-form-grid textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #d9dfd9;
  border-radius: 7px;
  background: #fff;
  color: #252a26;
  font-size: 13px;
  outline: none;
}

.vendors-page .vendor-form-grid input:focus,
.vendors-page .vendor-form-grid textarea:focus {
  border-color: #276345;
  box-shadow: 0 0 0 2px rgba(39, 99, 69, 0.08);
}

.vendors-page .vendor-form-full {
  grid-column: 1 / -1;
}

.vendors-page .vendor-create-submit {
  padding: 10px 18px;
  border: 0;
  border-radius: 7px;
  background: #123d2b;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.vendors-page .vendor-create-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.vendors-page .vendor-create-cancel {
  padding: 10px 18px;
  border: 1px solid #d5ddd5;
  border-radius: 7px;
  background: #fff;
  color: #555b56;
  font-weight: 600;
  cursor: pointer;
}

.vendors-page .vendor-create-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.vendors-page .vendor-credentials-success {
  padding: 10px 0;
  text-align: center;
}

.vendors-page .vendor-success-icon {
  width: 46px;
  height: 46px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e8f2e7;
  color: #123d2b;
  font-size: 24px;
  font-weight: 700;
}

.vendors-page .vendor-credentials-success h4 {
  margin: 0;
  color: #123d2b;
  font-size: 18px;
}

.vendors-page .vendor-credentials-success > p {
  margin: 8px auto 20px;
  max-width: 520px;
  color: #716f68;
  font-size: 13px;
  line-height: 1.5;
}

.vendors-page .vendor-credential-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 13px 15px;
  margin-top: 8px;
  border: 1px solid #e2e7e2;
  border-radius: 8px;
  background: #fafcf9;
  text-align: left;
}

.vendors-page .vendor-credential-row span {
  color: #77747a;
  font-size: 12px;
}

.vendors-page .vendor-credential-row strong {
  color: #123d2b;
  font-size: 13px;
  word-break: break-all;
}

.vendors-page .vendor-credential-warning {
  margin-top: 14px;
  padding: 12px;
  border-radius: 8px;
  background: #fff8e8;
  color: #735c25;
  font-size: 12px;
  line-height: 1.5;
  text-align: left;
}

@media (max-width: 620px) {
  .vendors-page .vendor-form-grid {
    grid-template-columns: 1fr;
  }

  .vendors-page .vendor-form-full {
    grid-column: auto;
  }

  .vendors-page .vendor-credential-row {
    flex-direction: column;
    gap: 5px;
  }
}
      `}</style>
    </section>
  );
}
