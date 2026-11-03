import { useEffect, useState } from 'react';
import {
  TicketPercent,
  Plus,
  Search,
  Pencil,
  Power,
  X,
  Tag,
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
          <p>
            Create and manage discount coupons for your AUMVEDA customers.
          </p>
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
          <div>
            <small>Total coupons</small>
            <strong>{coupons.length}</strong>
          </div>
        </div>

        <div className="coupon-stat-card">
          <span className="coupon-stat-icon"><Tag size={20} /></span>
          <div>
            <small>Active coupons</small>
            <strong>{coupons.filter((item) => item.is_active).length}</strong>
          </div>
        </div>

        <div className="coupon-stat-card">
          <span className="coupon-stat-icon"><Power size={20} /></span>
          <div>
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
          <div>
            <h3>All Coupons</h3>
            <p>Manage your discount campaigns</p>
          </div>
          <span>{coupons.length} coupons</span>
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
                          title="Edit coupon"
                          onClick={() => openEditForm(coupon)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          title={coupon.is_active ? 'Deactivate' : 'Activate'}
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

      {showForm && (
        <div className="coupon-modal-backdrop">
          <div className="coupon-modal">
            <div className="coupon-modal-header">
              <div>
                <span className="coupons-eyebrow">COUPON MANAGEMENT</span>
                <h3>{editingId ? 'Edit Coupon' : 'Create New Coupon'}</h3>
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
    </section>
  );
}