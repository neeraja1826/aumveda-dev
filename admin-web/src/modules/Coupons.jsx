import { useEffect, useState } from 'react';
import {
  TicketPercent,
  Plus,
  Search,
  Pencil,
  Power,
  X,
  Tag,
  Eye,
} from 'lucide-react';

import {
  getCoupons,
  createCoupon,
  updateCoupon,
  updateCouponActiveStatus,
} from '../services/adminService.js';

const COUPON_PLACEMENTS = [
  { value: 'home', label: 'Home Page' },
  { value: 'cart', label: 'Shopping Cart' },
  { value: 'checkout', label: 'Checkout' },
  { value: 'product_details', label: 'Product Details' },
];

const emptyForm = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_value: '0',
  max_discount_amount: '',
  starts_at: '',
  expires_at: '',
  usage_limit: '',
  per_customer_limit: '1',
  first_order_only: false,
  is_active: true,
  display_locations: [],
};

function getLocalDateTime(value) {
  if (!value) return '';

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

function getItems(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function formatDate(value) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDiscount(coupon) {
  if (coupon.discount_type === 'percentage') {
    return `${coupon.discount_value}% OFF`;
  }

  return `₹${Number(coupon.discount_value).toLocaleString('en-IN')} OFF`;
}

function getPlacementLabel(location) {
  return (
    COUPON_PLACEMENTS.find((item) => item.value === location)?.label ||
    location
  );
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [reload, setReload] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadCoupons() {
      setLoading(true);
      setError('');

      try {
        const params = {};

        if (search.trim()) params.search = search.trim();

        if (status !== 'all') {
          params.is_active = status === 'active';
        }

        const result = await getCoupons(params);

        if (active) {
          setCoupons(getItems(result));
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load coupons.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCoupons();

    return () => {
      active = false;
    };
  }, [reload, search, status]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function togglePlacement(value) {
    setForm((current) => {
      const selected = current.display_locations || [];

      return {
        ...current,
        display_locations: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      };
    });
  }

  function openCreateForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      starts_at: getLocalDateTime(new Date()),
      expires_at: getLocalDateTime(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ),
    });
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function openEditForm(coupon) {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code || '',
      description: coupon.description || '',
      discount_type: coupon.discount_type || 'percentage',
      discount_value: String(coupon.discount_value ?? ''),
      min_order_value: String(coupon.min_order_value ?? 0),
      max_discount_amount:
        coupon.max_discount_amount == null
          ? ''
          : String(coupon.max_discount_amount),
      starts_at: getLocalDateTime(coupon.starts_at),
      expires_at: getLocalDateTime(coupon.expires_at),
      usage_limit:
        coupon.usage_limit == null ? '' : String(coupon.usage_limit),
      per_customer_limit: String(coupon.per_customer_limit ?? 1),
      first_order_only: Boolean(coupon.first_order_only),
      is_active: Boolean(coupon.is_active),
      display_locations: coupon.display_locations || [],
    });

    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function openDetails(coupon) {
    setSelectedCoupon(coupon);
  }

  function closeDetails() {
    setSelectedCoupon(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!form.code.trim()) {
      setError('Please enter a coupon code.');
      return;
    }

    if (!form.discount_value || Number(form.discount_value) <= 0) {
      setError('Please enter a valid discount value.');
      return;
    }

    if (!form.starts_at || !form.expires_at) {
      setError('Please select the start and expiry dates.');
      return;
    }

    if (new Date(form.expires_at) <= new Date(form.starts_at)) {
      setError('Expiry date must be after the start date.');
      return;
    }

    if (!form.display_locations.length) {
      setError('Please select at least one display location.');
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_value: Number(form.min_order_value || 0),
      max_discount_amount: form.max_discount_amount
        ? Number(form.max_discount_amount)
        : null,
      starts_at: new Date(form.starts_at).toISOString(),
      expires_at: new Date(form.expires_at).toISOString(),
      usage_limit: form.usage_limit
        ? Number(form.usage_limit)
        : null,
      per_customer_limit: Number(form.per_customer_limit || 1),
      first_order_only: Boolean(form.first_order_only),
      is_active: Boolean(form.is_active),
      display_locations: form.display_locations,
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateCoupon(editingId, payload);
        setSuccess('Coupon updated successfully.');
      } else {
        await createCoupon(payload);
        setSuccess('Coupon created successfully.');
      }

      closeForm();
      setReload((current) => current + 1);
    } catch (err) {
      setError(err.message || 'Unable to save coupon.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(coupon) {
    const nextStatus = !coupon.is_active;

    setError('');
    setSuccess('');

    try {
      await updateCouponActiveStatus(coupon.id, nextStatus);

      setSuccess(
        `Coupon ${nextStatus ? 'activated' : 'deactivated'} successfully.`
      );

      setReload((current) => current + 1);
    } catch (err) {
      setError(err.message || 'Unable to update coupon status.');
    }
  }

  return (
    <section className="module-page coupons-page">
      <div className="coupons-heading">
        <div>
          <span className="coupons-eyebrow">PROMOTIONS & OFFERS</span>
          <h2>Coupons</h2>
        </div>

        <button
          type="button"
          className="coupon-primary-btn"
          onClick={openCreateForm}
        >
          <Plus size={18} />
          Create Coupon
        </button>
      </div>

      {error && <div className="error-state">{error}</div>}
      {success && <div className="coupon-success">{success}</div>}

      <div className="coupon-stats">
        <div className="coupon-stat-card">
          <span className="coupon-stat-icon"><TicketPercent size={20} /></span>
          <div className="coupon-stat-info">
            <small>Total coupons</small>
            <strong>{coupons.length}</strong>
          </div>
        </div>

        <div className="coupon-stat-card">
          <span className="coupon-stat-icon"><Tag size={20} /></span>
          <div className="coupon-stat-info">
            <small>Active coupons</small>
            <strong>{coupons.filter((item) => item.is_active).length}</strong>
          </div>
        </div>

        <div className="coupon-stat-card">
          <span className="coupon-stat-icon"><Power size={20} /></span>
          <div className="coupon-stat-info">
            <small>Inactive coupons</small>
            <strong>{coupons.filter((item) => !item.is_active).length}</strong>
          </div>
        </div>
      </div>

      <div className="coupon-toolbar">
        <div className="coupon-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search coupon code..."
          />
        </div>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter coupons by status"
        >
          <option value="all">All coupons</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="coupon-table-card">
        <div className="coupon-table-title">
          <h3>All Coupons</h3>
          <span className="count-badge">{coupons.length} {coupons.length === 1 ? 'coupon' : 'coupons'}</span>
        </div>

        {loading ? (
          <div className="coupon-empty">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="coupon-empty">
            <TicketPercent size={34} />
            <strong>No coupons found</strong>
            <span>Create your first coupon to get started.</span>
          </div>
        ) : (
          <div className="coupon-table-scroll">
            <table className="coupon-table">
              <thead>
                <tr>
                  <th>Coupon</th>
                  <th>Displayed / applied</th>
                  <th>Discount</th>
                  <th>Minimum order</th>
                  <th>Valid until</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td>
                      <strong className="coupon-code">
                        {coupon.code}
                      </strong>
                      <small>{coupon.description || 'No description'}</small>
                    </td>

                    <td>
                      <div className="coupon-location-list">
                        {Array.isArray(coupon.display_locations) &&
                        coupon.display_locations.length > 0 ? (
                          coupon.display_locations.map((location) => (
                            <span key={location}>
                              {getPlacementLabel(location)}
                            </span>
                          ))
                        ) : (
                          <span className="is-unspecified">
                            Not specified
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <strong>{formatDiscount(coupon)}</strong>
                    </td>

                    <td>
                      ₹{Number(coupon.min_order_value || 0).toLocaleString('en-IN')}
                    </td>

                    <td>{formatDate(coupon.expires_at)}</td>

                    <td>
                      <span
                        className={`coupon-status ${
                          coupon.is_active ? 'is-active' : 'is-inactive'
                        }`}
                      >
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td>
                      <div className="coupon-actions">
                        <button
                          type="button"
                          className="coupon-view-btn"
                          title="View coupon details"
                          aria-label={`View ${coupon.code} details`}
                          onClick={() => openDetails(coupon)}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          title="Edit coupon"
                          aria-label={`Edit ${coupon.code}`}
                          onClick={() => openEditForm(coupon)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          title={coupon.is_active ? 'Deactivate' : 'Activate'}
                          aria-label={`${coupon.is_active ? 'Deactivate' : 'Activate'} ${coupon.code}`}
                          onClick={() => toggleStatus(coupon)}
                        >
                          <Power size={16} />
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

      {selectedCoupon && (
        <div
          className="coupon-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetails();
          }}
        >
          <div
            className="coupon-modal coupon-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="coupon-modal-header">
              <div>
                <span className="coupons-eyebrow">COUPON DETAILS</span>
                <h3 id="coupon-details-title">
                  {selectedCoupon.code || 'Coupon'}
                </h3>
              </div>

              <button
                type="button"
                className="coupon-close-btn"
                onClick={closeDetails}
                aria-label="Close coupon details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="coupon-details-grid">
              <div className="coupon-detail-item">
                <span>Description</span>
                <strong>{selectedCoupon.description || 'No description'}</strong>
              </div>
              <div className="coupon-detail-item">
                <span>Status</span>
                <strong>{selectedCoupon.is_active ? 'Active' : 'Inactive'}</strong>
              </div>
              <div className="coupon-detail-item">
                <span>Discount</span>
                <strong>{formatDiscount(selectedCoupon)}</strong>
              </div>
              <div className="coupon-detail-item">
                <span>Minimum order</span>
                <strong>₹{Number(selectedCoupon.min_order_value || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div className="coupon-detail-item">
                <span>Maximum discount</span>
                <strong>
                  {selectedCoupon.max_discount_amount == null
                    ? 'No limit'
                    : `₹${Number(selectedCoupon.max_discount_amount).toLocaleString('en-IN')}`}
                </strong>
              </div>
              <div className="coupon-detail-item">
                <span>Total usage limit</span>
                <strong>{selectedCoupon.usage_limit ?? 'Unlimited'}</strong>
              </div>
              <div className="coupon-detail-item">
                <span>Uses per customer</span>
                <strong>{selectedCoupon.per_customer_limit ?? 1}</strong>
              </div>
              <div className="coupon-detail-item">
                <span>First order only</span>
                <strong>{selectedCoupon.first_order_only ? 'Yes' : 'No'}</strong>
              </div>
              <div className="coupon-detail-item">
                <span>Starts</span>
                <strong>{formatDate(selectedCoupon.starts_at)}</strong>
              </div>
              <div className="coupon-detail-item">
                <span>Expires</span>
                <strong>{formatDate(selectedCoupon.expires_at)}</strong>
              </div>
            </div>

            <div className="coupon-detail-locations">
              <span>Display locations</span>
              <div>
                {(selectedCoupon.display_locations || []).length
                  ? selectedCoupon.display_locations.map((location) => (
                      <span key={location}>
                        {getPlacementLabel(location)}
                      </span>
                    ))
                  : <span>Not specified</span>}
              </div>
            </div>

            <div className="coupon-modal-footer">
              <button
                type="button"
                className="coupon-secondary-btn"
                onClick={closeDetails}
              >
                Close
              </button>
              <button
                type="button"
                className="coupon-primary-btn"
                onClick={() => {
                  closeDetails();
                  openEditForm(selectedCoupon);
                }}
              >
                <Pencil size={16} />
                Edit Coupon
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div
          className="coupon-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              closeForm();
            }
          }}
        >
          <div
            className="coupon-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="coupon-modal-header">
              <div>
                <span className="coupons-eyebrow">COUPON MANAGEMENT</span>
                <h3 id="coupon-form-title">
                  {editingId ? 'Edit Coupon' : 'Create New Coupon'}
                </h3>
              </div>

              <button
                type="button"
                className="coupon-close-btn"
                onClick={closeForm}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="coupon-form-grid">
                <label className="coupon-field full-width">
                  Coupon code *
                  <input
                    value={form.code}
                    onChange={(event) =>
                      updateField(event.target.name, event.target.value.toUpperCase())
                    }
                    name="code"
                    placeholder="e.g. WELCOME10"
                    maxLength={40}
                    required
                  />
                </label>

                <label className="coupon-field full-width">
                  Description
                  <input
                    value={form.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    placeholder="e.g. Welcome discount for new customers"
                  />
                </label>

                <label className="coupon-field">
                  Discount type *
                  <select
                    value={form.discount_type}
                    onChange={(event) => updateField('discount_type', event.target.value)}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed amount (₹)</option>
                  </select>
                </label>

                <label className="coupon-field">
                  Discount value *
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={form.discount_type === 'percentage' ? 100 : undefined}
                    value={form.discount_value}
                    onChange={(event) => updateField('discount_value', event.target.value)}
                    required
                  />
                </label>

                <label className="coupon-field">
                  Minimum order value (₹)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.min_order_value}
                    onChange={(event) => updateField('min_order_value', event.target.value)}
                  />
                </label>

                <label className="coupon-field">
                  Maximum discount (₹)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.max_discount_amount}
                    onChange={(event) => updateField('max_discount_amount', event.target.value)}
                    placeholder="Optional"
                  />
                </label>

                <label className="coupon-field">
                  Starts at *
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(event) => updateField('starts_at', event.target.value)}
                    required
                  />
                </label>

                <label className="coupon-field">
                  Expires at *
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(event) => updateField('expires_at', event.target.value)}
                    required
                  />
                </label>

                <label className="coupon-field">
                  Total usage limit
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.usage_limit}
                    onChange={(event) => updateField('usage_limit', event.target.value)}
                    placeholder="Unlimited"
                  />
                </label>

                <label className="coupon-field">
                  Uses per customer
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.per_customer_limit}
                    onChange={(event) => updateField('per_customer_limit', event.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="coupon-placement-section">
                <h4>Where should this coupon appear? *</h4>
                <p>Select one or more locations in the customer app.</p>

                <div className="coupon-placement-grid">
                  {COUPON_PLACEMENTS.map((placement) => (
                    <label key={placement.value}>
                      <input
                        type="checkbox"
                        checked={form.display_locations.includes(placement.value)}
                        onChange={() => togglePlacement(placement.value)}
                      />
                      <span>{placement.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="coupon-checkboxes">
                <label>
                  <input
                    type="checkbox"
                    checked={form.first_order_only}
                    onChange={(event) => updateField('first_order_only', event.target.checked)}
                  />
                  First order only
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) => updateField('is_active', event.target.checked)}
                  />
                  Activate coupon immediately
                </label>
              </div>

              {error && <div className="error-state">{error}</div>}

              <div className="coupon-modal-footer">
                <button
                  type="button"
                  className="coupon-secondary-btn"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="coupon-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Save Changes'
                      : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .coupons-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .coupons-eyebrow {
          display: block;
          color: #276345;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          margin-bottom: 3px;
        }
        .coupons-heading h2 {
          margin: 0;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          color: #123D2B;
        }
        .coupon-primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 18px;
          border: 1px solid #123D2B;
          border-radius: 11px;
          background: linear-gradient(135deg, #173F1D 0%, #123D2B 100%);
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(18, 61, 43, 0.16);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .coupon-primary-btn:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 16px rgba(18, 61, 43, 0.24);
        }
        .coupon-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }
        .coupon-stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          background: #FFFFFF;
          border: 1px solid #E2ECE0;
          border-radius: 16px;
          box-shadow: 0 4px 16px -2px rgba(18, 61, 43, 0.04);
          transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s;
        }
        .coupon-stat-card:hover {
          transform: translateY(-2.5px);
          box-shadow: 0 10px 24px -4px rgba(18, 61, 43, 0.09);
          border-color: #BED8BD;
        }
        .coupon-stat-icon {
          display: grid;
          place-items: center;
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: #E8F2E7;
          color: #123D2B;
          border: 1px solid #CDE2CB;
          flex-shrink: 0;
        }
        .coupon-stat-info small {
          display: block;
          color: #5F6E64;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .coupon-stat-info strong {
          display: block;
          color: #123D2B;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          line-height: 1;
        }
        .coupon-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }
        .coupon-search {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 42px;
          padding: 0 14px;
          border: 1px solid #D5E4D2;
          border-radius: 10px;
          background: #FFFFFF;
          flex: 1;
          max-width: 420px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .coupon-search:focus-within {
          border-color: #276345;
          box-shadow: 0 0 0 3px rgba(39, 99, 69, 0.12);
        }
        .coupon-search input {
          border: 0;
          outline: none;
          font-size: 13px;
          color: #123D2B;
          width: 100%;
        }
        .coupon-toolbar select {
          min-height: 42px;
          padding: 0 34px 0 14px;
          border: 1px solid #D5E4D2;
          border-radius: 10px;
          background: #FFFFFF;
          color: #123D2B;
          font-size: 13px;
          font-weight: 500;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23276345' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 12px;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .coupon-toolbar select:focus {
          border-color: #276345;
          box-shadow: 0 0 0 3px rgba(39, 99, 69, 0.12);
          outline: none;
        }
        .coupon-table-card {
          background: #FFFFFF;
          border: 1px solid #E2ECE0;
          border-radius: 16px;
          box-shadow: 0 4px 20px -2px rgba(18, 61, 43, 0.04);
          overflow: hidden;
        }
        .coupon-table-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid #EDF3EC;
          background: #FFFFFF;
        }
        .coupon-table-title h3 {
          margin: 0;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18px;
          color: #123D2B;
          font-weight: 700;
        }
        .count-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 20px;
          background: #E8F2E7;
          color: #123D2B;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid #CDE2CB;
        }
        .coupon-table-scroll {
          overflow-x: auto;
        }
        .coupon-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }
        .coupon-table th {
          padding: 14px 20px;
          color: #43624D;
          background: #F6F9F5;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          white-space: nowrap;
          border-bottom: 1px solid #E2ECE0;
        }
        .coupon-table td {
          padding: 16px 20px;
          color: #1E2D24;
          border-bottom: 1px solid #EDF3EC;
          vertical-align: middle;
        }
        .coupon-table tbody tr {
          transition: background-color 0.15s ease;
        }
        .coupon-table tbody tr:hover {
          background: #F8FBF7;
        }
        .coupon-code {
          display: inline-block;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
          font-weight: 700;
          color: #123D2B;
          background: #F4F8F3;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid #DCE9DA;
          letter-spacing: 0.5px;
        }
        .coupon-table td small {
          display: block;
          margin-top: 5px;
          color: #5F6E64;
          font-size: 12px;
          line-height: 1.4;
        }
        .coupon-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .coupon-actions button,
        .coupon-view-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid #D5E4D2;
          border-radius: 8px;
          background: #FAFDF9;
          color: #123D2B;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .coupons-page .coupon-actions button,
        .coupons-page .coupon-actions .coupon-view-btn {
          box-sizing: border-box;
          width: 34px !important;
          min-width: 34px !important;
          height: 34px !important;
          min-height: 34px !important;
          padding: 0 !important;
          flex: 0 0 34px;
        }
        .coupons-page .coupon-actions button svg {
          display: block;
          width: 16px;
          height: 16px;
          flex: 0 0 16px;
        }
        .coupon-actions button:hover,
        .coupon-view-btn:hover {
          background: #123D2B;
          color: #FFFFFF;
          border-color: #123D2B;
          transform: translateY(-1px);
        }
        .coupon-location-list {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          min-width: 120px;
        }
        .coupon-location-list span {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border: 1px solid #D7E8D3;
          border-radius: 999px;
          background: #F1F7EE;
          color: #28523A;
          font-size: 10px;
          font-weight: 600;
          white-space: nowrap;
        }
        .coupon-location-list .is-unspecified {
          border-color: #E5E8E4;
          background: #F7F8F6;
          color: #707A72;
          font-weight: 400;
        }
        .coupon-details-modal {
          max-width: 680px;
        }
        .coupons-page .coupon-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow-y: auto;
          background: rgba(14, 40, 28, 0.52);
          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
        }
        .coupons-page .coupon-modal {
          box-sizing: border-box;
          width: min(720px, 100%);
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          background: #FFFFFF;
          border: 1px solid #E2ECE0;
          border-radius: 18px;
          box-shadow: 0 24px 70px rgba(18, 61, 43, 0.22);
        }
        .coupons-page .coupon-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }
        .coupons-page .coupon-modal-header > div {
          min-width: 0;
        }
        .coupons-page .coupon-modal-header h3 {
          margin: 4px 0 0;
          color: #123D2B;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 21px;
        }
        .coupons-page .coupon-close-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 36px;
          width: 36px;
          height: 36px;
          padding: 0;
        }
        .coupons-page .coupon-modal > form {
          padding: 22px 28px 28px;
        }
        .coupons-page .coupon-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .coupons-page .coupon-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
          color: #31483A;
          font-size: 12px;
          font-weight: 600;
        }
        .coupons-page .coupon-field.full-width {
          grid-column: 1 / -1;
        }
        .coupons-page .coupon-field input,
        .coupons-page .coupon-field select {
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          height: 42px;
          padding: 0 12px;
          border: 1px solid #D5E4D2;
          border-radius: 9px;
          outline: none;
          background: #FFFFFF;
          color: #123D2B;
          font: inherit;
          font-size: 13px;
          font-weight: 400;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .coupons-page .coupon-field input:focus,
        .coupons-page .coupon-field select:focus {
          border-color: #276345;
          box-shadow: 0 0 0 3px rgba(39, 99, 69, 0.12);
        }
        .coupons-page .coupon-placement-section {
          margin-top: 22px;
          padding: 18px;
          border: 1px solid #E2ECE0;
          border-radius: 12px;
          background: #F8FAF7;
        }
        .coupons-page .coupon-placement-section h4 {
          margin: 0;
          color: #123D2B;
          font-size: 13px;
        }
        .coupons-page .coupon-placement-section > p {
          margin: 5px 0 14px;
          color: #68786C;
          font-size: 12px;
        }
        .coupons-page .coupon-placement-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px;
        }
        .coupons-page .coupon-placement-grid label,
        .coupons-page .coupon-checkboxes label {
          display: flex;
          align-items: center;
          gap: 9px;
          min-height: 40px;
          padding: 8px 11px;
          border: 1px solid #E1E9E0;
          border-radius: 9px;
          background: #FFFFFF;
          color: #31483A;
          font-size: 12px;
          cursor: pointer;
        }
        .coupons-page .coupon-placement-grid input,
        .coupons-page .coupon-checkboxes input {
          width: 16px;
          height: 16px;
          margin: 0;
          accent-color: #276345;
          flex: 0 0 16px;
        }
        .coupons-page .coupon-checkboxes {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
        }
        .coupons-page .coupon-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
          padding-top: 16px;
          border-top: 1px solid #EDF3EC;
        }
        .coupons-page .coupon-secondary-btn {
          min-height: 40px;
          padding: 0 16px;
          border: 1px solid #D5E4D2;
          border-radius: 10px;
          background: #FFFFFF;
          color: #123D2B;
          font-size: 13px;
          font-weight: 600;
        }
        .coupons-page .coupon-modal-footer button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .coupon-details-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          padding: 24px 28px;
        }
        .coupon-detail-item {
          padding: 15px 16px;
          border: 1px solid #E2ECE0;
          border-radius: 12px;
          background: #F8FAF7;
        }
        .coupon-detail-item span,
        .coupon-detail-locations > span {
          display: block;
          margin-bottom: 6px;
          color: #5F6E64;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .coupon-detail-item strong {
          color: #123D2B;
          font-size: 13.5px;
          line-height: 1.4;
        }
        .coupon-detail-locations {
          padding: 0 28px 24px;
        }
        .coupon-detail-locations > div {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .coupon-detail-locations > div span {
          padding: 5px 12px;
          border-radius: 20px;
          background: #E8F5E9;
          color: #1B5E20;
          border: 1px solid #C8E6C9;
          font-size: 12px;
          font-weight: 600;
        }
        @media (max-width: 640px) {
          .coupon-stats {
            grid-template-columns: 1fr;
          }
          .coupons-page .coupon-modal-backdrop {
            align-items: flex-start;
            padding: 12px;
          }
          .coupons-page .coupon-modal {
            max-height: calc(100vh - 24px);
          }
          .coupons-page .coupon-modal > form {
            padding: 18px 16px 20px;
          }
          .coupons-page .coupon-form-grid,
          .coupons-page .coupon-placement-grid {
            grid-template-columns: 1fr;
          }
          .coupons-page .coupon-field.full-width {
            grid-column: auto;
          }
          .coupons-page .coupon-placement-section {
            padding: 14px;
          }
          .coupon-details-grid {
            grid-template-columns: 1fr;
            padding-left: 16px;
            padding-right: 16px;
          }
          .coupon-detail-locations {
            padding-left: 16px;
            padding-right: 16px;
          }
        }
      `}</style>

    </section>
  );
}