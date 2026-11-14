
import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Eye,
  Filter,
  Pencil,
  Search,
  Trash2,
  UserRoundCheck,
  UserRoundPlus,
  UsersRound,
} from 'lucide-react';
import {
  getResource,
  updateCustomer,
  updateResourceStatus,
} from '../services/adminService.js';

const emptySummary = {
  total_customers: 0,
  active_customers: 0,
  new_this_month: 0,
};

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function getCustomerType(customer) {
  const type = String(customer.customer_type || '').toLowerCase();
  if (type === 'new' || type === 'returning') return type;
  return Number(customer.order_count || 0) > 1
    ? 'returning'
    : 'new';
}

function exportCustomers(customers) {
  const rows = [
    ['Name', 'Email', 'Phone', 'Orders', 'Total spent', 'Last order', 'Joined'],
    ...customers.map((customer) => [
      customer.full_name || '',
      customer.email || '',
      customer.phone || '',
      customer.order_count || 0,
      customer.total_spent || 0,
      customer.last_order_at || '',
      customer.created_at || '',
    ]),
  ];
  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          let cell = String(value ?? '');
          if (/^[=+\-@]/.test(cell)) cell = `'${cell}`;
          return `"${cell.replace(/"/g, '""')}"`;
        })
        .join(',')
    )
    .join('\r\n');
  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Customers() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [registrationFilter, setRegistrationFilter] = useState('');
  const [orderCountFilter, setOrderCountFilter] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [reload, setReload] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    full_name: '',
    phone: '',
  });
  const [savingCustomer, setSavingCustomer] = useState(false);

  useEffect(() => {
    let active = true;

    const params = { limit: 100 };
    if (search.trim()) params.search = search.trim();
    if (activeFilter !== '') params.active = activeFilter;

    Promise.resolve()
      .then(() => {
        if (!active) return undefined;
        setLoading(true);
        setError('');
        return getResource('customers', params);
      })
      .then((result) => {
        if (!active) return;
        if (!result) return;
        setItems(result.items || []);
        setSummary({
          ...emptySummary,
          ...(result.summary || {}),
        });
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.message || 'Unable to load customers.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, activeFilter, reload]);

  const visibleItems = useMemo(() => {
    const now = new Date();

    return items.filter((customer) => {
      const createdAt = customer.created_at
        ? new Date(customer.created_at)
        : null;

      if (registrationFilter && createdAt) {
        const ageInDays =
          (now.getTime() - createdAt.getTime()) / 86400000;
        if (
          registrationFilter === 'month' &&
          (createdAt.getMonth() !== now.getMonth() ||
            createdAt.getFullYear() !== now.getFullYear())
        ) {
          return false;
        }
        if (
          registrationFilter === '30' &&
          (ageInDays < 0 || ageInDays > 30)
        ) {
          return false;
        }
        if (
          registrationFilter === '90' &&
          (ageInDays < 0 || ageInDays > 90)
        ) {
          return false;
        }
      }

      const orderCount = Number(customer.order_count || 0);
      if (
        orderCountFilter === '0' &&
        orderCount !== 0
      ) {
        return false;
      }
      if (
        orderCountFilter === '1-5' &&
        (orderCount < 1 || orderCount > 5)
      ) {
        return false;
      }
      if (orderCountFilter === '6+' && orderCount < 6) {
        return false;
      }

      if (
        customerTypeFilter &&
        getCustomerType(customer) !== customerTypeFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    items,
    registrationFilter,
    orderCountFilter,
    customerTypeFilter,
  ]);

  function toggleCustomerSelection(customerId) {
    setSelectedIds((current) =>
      current.includes(customerId)
        ? current.filter((id) => id !== customerId)
        : [...current, customerId]
    );
  }

  function toggleVisibleSelection() {
    const visibleIds = new Set(visibleItems.map((customer) => customer.id));
    const allSelected =
      visibleItems.length > 0 &&
      visibleItems.every((customer) => selectedIds.includes(customer.id));

    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.has(id))
        : [...new Set([...current, ...visibleIds])]
    );
  }

  async function toggleCustomer(customer) {
    if (updatingId) return;
    if (
      customer.is_active &&
      !window.confirm(
        `Deactivate ${customer.full_name || 'this customer'}? They can be reactivated later.`
      )
    ) {
      return;
    }

    setUpdatingId(customer.id);
    setError('');
    setSuccess('');

    try {
      await updateResourceStatus(
        'customers',
        customer.id,
        !customer.is_active
      );

      setSuccess(
        customer.is_active
          ? 'Customer deactivated.'
          : 'Customer reactivated.'
      );
      setReload((current) => current + 1);
    } catch (requestError) {
      setError(requestError.message || 'Unable to update customer status.');
    } finally {
      setUpdatingId('');
    }
  }

  function closeCustomerDetails() {
    setSelectedCustomer(null);
    setEditingCustomer(false);
    setError('');
  }

  function openCustomerDetails(customer) {
    setSelectedCustomer(customer);
    setEditingCustomer(false);
    setError('');
  }

  function openCustomerEdit(customer) {
    setSelectedCustomer(customer);
    setCustomerForm({
      full_name: customer.full_name || '',
      phone: customer.phone || '',
    });
    setEditingCustomer(true);
    setError('');
  }

  async function saveCustomer(event) {
    event.preventDefault();
    if (!selectedCustomer || savingCustomer) return;

    setSavingCustomer(true);
    setError('');
    setSuccess('');

    try {
      const result = await updateCustomer(selectedCustomer.id, {
        full_name: customerForm.full_name,
        phone: customerForm.phone,
      });
      const updatedCustomer = {
        ...selectedCustomer,
        ...(result?.customer || {}),
        ...customerForm,
      };
      setItems((current) =>
        current.map((customer) =>
          customer.id === updatedCustomer.id
            ? { ...customer, ...updatedCustomer }
            : customer
        )
      );
      setSelectedCustomer(updatedCustomer);
      setEditingCustomer(false);
      setSuccess('Customer profile updated.');
    } catch (requestError) {
      setError(
        requestError.message || 'Unable to update customer.'
      );
    } finally {
      setSavingCustomer(false);
    }
  }

  return (
    <section className="module-page customers-page">
      <header className="customers-page-heading">
        <h1>Customers</h1>
      </header>

      <div className="customer-summary-grid">
        <CustomerSummaryCard
          icon={UsersRound}
          label="Total Customers"
          value={summary.total_customers}
          tone="green"
        />
        <CustomerSummaryCard
          icon={UserRoundCheck}
          label="Active Customers"
          value={summary.active_customers}
          tone="green"
        />
        <CustomerSummaryCard
          icon={UserRoundPlus}
          label="New This Month"
          value={summary.new_this_month}
          tone="gold"
        />
      </div>

      <div className="customer-toolbar">
        <label className="customer-search-field">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, or phone..."
            aria-label="Search by name, email, or phone"
          />
        </label>

        <select
          value={registrationFilter}
          onChange={(event) => setRegistrationFilter(event.target.value)}
          aria-label="Filter by registration date"
        >
          <option value="">Registration Date</option>
          <option value="month">This month</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>

        <select
          value={orderCountFilter}
          onChange={(event) => setOrderCountFilter(event.target.value)}
          aria-label="Filter by order count"
        >
          <option value="">Order Count</option>
          <option value="0">No orders</option>
          <option value="1-5">1–5 orders</option>
          <option value="6+">6+ orders</option>
        </select>

        <select
          value={customerTypeFilter}
          onChange={(event) => setCustomerTypeFilter(event.target.value)}
          aria-label="Filter by customer type"
        >
          <option value="">Customer Type</option>
          <option value="new">New</option>
          <option value="returning">Returning</option>
        </select>

        <button
          type="button"
          className={`customer-filter-button ${
            showAdvancedFilters ? 'is-selected' : ''
          }`}
          onClick={() => setShowAdvancedFilters((current) => !current)}
          aria-label="More customer filters"
          aria-expanded={showAdvancedFilters}
          title="More filters"
        >
          <Filter size={17} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="customer-export-button"
          onClick={() => exportCustomers(visibleItems)}
          disabled={visibleItems.length === 0}
        >
          <Download size={16} aria-hidden="true" />
          Export
        </button>

        {showAdvancedFilters && (
          <select
            className="customer-active-filter"
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value)}
            aria-label="Filter by account status"
          >
            <option value="">All account statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        )}
      </div>

      {error && !selectedCustomer && (
        <div className="error-state" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="customer-success" role="status">
          {success}
        </div>
      )}

      <div className="module-card customer-table-card">
        {loading ? (
          <div className="loading-state">Loading customers...</div>
        ) : visibleItems.length === 0 ? (
          <div className="empty-state">No customers found.</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table customer-table">
              <thead>
                <tr>
                  <th className="customer-checkbox-cell">
                    <input
                      type="checkbox"
                      checked={
                        visibleItems.length > 0 &&
                        visibleItems.every((customer) =>
                          selectedIds.includes(customer.id)
                        )
                      }
                      onChange={toggleVisibleSelection}
                      aria-label="Select all visible customers"
                    />
                  </th>
                  <th>Customer</th>
                  <th>Email / Phone</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Last Order</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleItems.map((customer) => (
                  <tr key={customer.id}>
                    <td className="customer-checkbox-cell">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(customer.id)}
                        onChange={() =>
                          toggleCustomerSelection(customer.id)
                        }
                        aria-label={`Select ${customer.full_name || 'customer'}`}
                      />
                    </td>
                    <td>
                      <div className="customer-profile">
                        {customer.avatar_url ? (
                          <img
                            src={customer.avatar_url}
                            alt=""
                            className="customer-avatar"
                            loading="lazy"
                          />
                        ) : (
                          <div className="customer-avatar customer-avatar-fallback">
                            {(customer.full_name || 'C')
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <div>
                          <strong>
                            {customer.full_name || 'Unnamed customer'}
                          </strong>
                          <div className="customer-joined">
                            Joined: {formatDate(customer.created_at)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div>{customer.email || '—'}</div>
                      <div className="customer-contact-phone">
                        {customer.phone || 'No phone'}
                      </div>
                    </td>
                    <td>{Number(customer.order_count || 0)}</td>
                    <td className="customer-total-spent">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td>{formatDate(customer.last_order_at)}</td>
                    <td>
                      <div className="customer-actions">
                        <button
                          type="button"
                          className="customer-action-button"
                          onClick={() => openCustomerDetails(customer)}
                          aria-label={`View ${customer.full_name || 'customer'}`}
                          title="View customer"
                        >
                          <Eye size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={`customer-action-button ${
                            customer.is_active ? 'is-danger' : 'is-success'
                          }`}
                          disabled={updatingId !== ''}
                          onClick={() => toggleCustomer(customer)}
                          aria-label={
                            customer.is_active
                              ? `Deactivate ${customer.full_name || 'customer'}`
                              : `Reactivate ${customer.full_name || 'customer'}`
                          }
                          title={
                            customer.is_active
                              ? 'Deactivate customer'
                              : 'Reactivate customer'
                          }
                        >
                          {updatingId === customer.id ? (
                            <span className="customer-action-spinner" />
                          ) : customer.is_active ? (
                            <Trash2 size={16} aria-hidden="true" />
                          ) : (
                            <UserRoundCheck size={16} aria-hidden="true" />
                          )}
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

      {selectedCustomer && (
        <div
          className="customer-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCustomerDetails();
          }}
        >
          <div
            className="customer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-details-title"
          >
            <div className="customer-modal-header">
              <div>
                <span className="customer-modal-eyebrow">
                  {editingCustomer ? 'EDIT CUSTOMER' : 'CUSTOMER PROFILE'}
                </span>
                <h2 id="customer-details-title">
                  {editingCustomer
                    ? 'Edit customer details'
                    : selectedCustomer.full_name || 'Unnamed customer'}
                </h2>
              </div>
              <button
                type="button"
                className="customer-modal-close"
                onClick={closeCustomerDetails}
                aria-label="Close customer details"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="error-state" role="alert">
                {error}
              </div>
            )}

            {editingCustomer ? (
              <form className="customer-edit-form" onSubmit={saveCustomer}>
                <label>
                  Full name
                  <input
                    value={customerForm.full_name}
                    onChange={(event) =>
                      setCustomerForm((current) => ({
                        ...current,
                        full_name: event.target.value,
                      }))
                    }
                    maxLength={255}
                    required
                  />
                </label>
                <label>
                  Email
                  <input value={selectedCustomer.email || ''} disabled />
                  <small>Email is managed by the customer’s sign-in account.</small>
                </label>
                <label>
                  Phone
                  <input
                    type="tel"
                    value={customerForm.phone}
                    onChange={(event) =>
                      setCustomerForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    maxLength={50}
                  />
                </label>
                <div className="customer-modal-actions">
                  <button
                    type="button"
                    className="customer-cancel-button"
                    onClick={() => setEditingCustomer(false)}
                    disabled={savingCustomer}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="customer-save-button"
                    disabled={savingCustomer}
                  >
                    {savingCustomer ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="customer-detail-grid">
                  <div className="customer-detail-item">
                    <span>Customer ID</span>
                    <strong>{selectedCustomer.id || '—'}</strong>
                  </div>
                  <div className="customer-detail-item">
                    <span>Email</span>
                    <strong>{selectedCustomer.email || '—'}</strong>
                  </div>
                  <div className="customer-detail-item">
                    <span>Phone</span>
                    <strong>{selectedCustomer.phone || '—'}</strong>
                  </div>
                  <div className="customer-detail-item">
                    <span>Orders</span>
                    <strong>{selectedCustomer.order_count || 0}</strong>
                  </div>
                  <div className="customer-detail-item">
                    <span>Total Spent</span>
                    <strong>{formatCurrency(selectedCustomer.total_spent)}</strong>
                  </div>
                  <div className="customer-detail-item">
                    <span>Last Order</span>
                    <strong>{formatDate(selectedCustomer.last_order_at)}</strong>
                  </div>
                  <div className="customer-detail-item">
                    <span>Account Status</span>
                    <strong>{selectedCustomer.is_active ? 'Active' : 'Inactive'}</strong>
                  </div>
                  <div className="customer-detail-item">
                    <span>Joined</span>
                    <strong>{formatDate(selectedCustomer.created_at)}</strong>
                  </div>
                </div>

                {selectedCustomer.address && (
                  <div className="customer-detail-section">
                    <h3>Address</h3>
                    <p>
                      {typeof selectedCustomer.address === 'string'
                        ? selectedCustomer.address
                        : Object.values(selectedCustomer.address)
                            .filter(Boolean)
                            .join(', ')}
                    </p>
                  </div>
                )}

                <div className="customer-modal-actions">
                  <button
                    type="button"
                    className="customer-save-button"
                    onClick={() => openCustomerEdit(selectedCustomer)}
                  >
                    <Pencil size={15} aria-hidden="true" />
                    Edit customer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`

        .customers-page .customer-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .customers-page .customer-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(20, 28, 23, 0.42);
        }

        .customers-page .customer-modal {
          width: min(720px, 100%);
          max-height: min(760px, 90vh);
          overflow: auto;
          padding: 24px;
          background: #fff;
          border: 1px solid #e1e9e1;
          border-radius: 18px;
          box-shadow: 0 24px 70px rgba(28, 45, 34, 0.18);
        }

        .customers-page .customer-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }

        .customers-page .customer-modal-eyebrow {
          display: block;
          margin-bottom: 6px;
          color: #7a8a7d;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }

        .customers-page .customer-modal h2 {
          margin: 0;
          color: #244b36;
          font-size: 24px;
        }

        .customers-page .customer-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .customers-page .customer-detail-item {
          padding: 16px 18px;
          background: #F8FAF7;
          border: 1px solid #E2ECE0;
          border-radius: 14px;
        }

        .customers-page .customer-detail-item span {
          display: block;
          margin-bottom: 6px;
          color: #5F6E64;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .customers-page .customer-detail-item strong {
          display: block;
          overflow-wrap: anywhere;
          color: #123D2B;
          font-size: 13.5px;
        }

        .customers-page .customer-detail-section {
          margin-top: 18px;
          padding: 18px 20px;
          background: #FAF9F4;
          border: 1px solid #E2ECE0;
          border-radius: 14px;
        }

        .customers-page .customer-detail-section h3 {
          margin: 0 0 8px;
          color: #123D2B;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 15px;
          font-weight: 700;
        }

        .customers-page .customer-detail-section p {
          margin: 0;
          color: #5F6E64;
          font-size: 13px;
          line-height: 1.6;
        }

        @media (max-width: 640px) {
          .customers-page .customer-detail-grid {
            grid-template-columns: 1fr;
          }
        }

        .customers-page .module-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin: 18px 0;
        }

        .customers-page .module-toolbar input {
          flex: 1;
          min-width: 200px;
        }

        .customers-page .module-toolbar select {
          min-width: 150px;
        }

        .customers-page .customer-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 220px;
        }

        .customers-page .customer-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }

        .customers-page .customer-avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #E8F2E7;
          color: #123D2B;
          font-weight: 700;
          border: 1px solid #CDE2CB;
        }

        .customers-page .customer-id {
          margin-top: 4px;
          max-width: 210px;
          overflow-wrap: anywhere;
          font-size: 11px;
          color: #8C9990;
        }

        .customers-page .customer-status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 600;
        }

        .customers-page .customer-status.active {
          background: #E8F2E7;
          color: #123D2B;
          border: 1px solid #CDE2CB;
        }

        .customers-page .customer-status.inactive {
          background: #FDF1F0;
          color: #A3332A;
          border: 1px solid #F8CECA;
        }

        @media (max-width: 620px) {
  
        .customers-page .customer-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .customers-page .customer-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(20, 28, 23, 0.42);
        }

        .customers-page .customer-modal {
          width: min(720px, 100%);
          max-height: min(760px, 90vh);
          overflow: auto;
          padding: 24px;
          background: #fff;
          border: 1px solid #e1e9e1;
          border-radius: 18px;
          box-shadow: 0 24px 70px rgba(28, 45, 34, 0.18);
        }

        .customers-page .customer-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }

        .customers-page .customer-modal-eyebrow {
          display: block;
          margin-bottom: 6px;
          color: #7a8a7d;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }

        .customers-page .customer-modal h2 {
          margin: 0;
          color: #244b36;
          font-size: 24px;
        }

        .customers-page .customer-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .customers-page .customer-detail-item {
          padding: 16px 18px;
          background: #F8FAF7;
          border: 1px solid #E2ECE0;
          border-radius: 14px;
        }

        .customers-page .customer-detail-item span {
          display: block;
          margin-bottom: 6px;
          color: #5F6E64;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .customers-page .customer-detail-item strong {
          display: block;
          overflow-wrap: anywhere;
          color: #123D2B;
          font-size: 13.5px;
        }

        .customers-page .customer-detail-section {
          margin-top: 18px;
          padding: 18px 20px;
          background: #FAF9F4;
          border: 1px solid #E2ECE0;
          border-radius: 14px;
        }

        .customers-page .customer-detail-section h3 {
          margin: 0 0 8px;
          color: #123D2B;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 15px;
          font-weight: 700;
        }

        .customers-page .customer-detail-section p {
          margin: 0;
          color: #5F6E64;
          font-size: 13px;
          line-height: 1.6;
        }

        @media (max-width: 640px) {
          .customers-page .customer-detail-grid {
            grid-template-columns: 1fr;
          }
        }

        .customers-page .module-toolbar {
            flex-direction: column;
          }

          .customers-page .module-toolbar input,
          .customers-page .module-toolbar select {
            width: 100%;
            min-width: 0;
          }
        }

        .customers-page-heading h1 {
          margin: 0 0 4px;
          color: #123D2B;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 24px;
        }

        .customer-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .customer-summary-card {
          display: flex;
          align-items: center;
          gap: 15px;
          min-height: 82px;
          padding: 14px 20px;
          border: 1px solid #DDE9D9;
          border-radius: 15px;
          background: linear-gradient(110deg, #F0F7EC, #E0EFD8);
          box-shadow: 0 4px 12px rgba(18, 61, 43, 0.05);
        }

        .customer-summary-card.tone-gold {
          border-color: #F0E2C7;
          background: linear-gradient(110deg, #FFF8EB, #F8EBD3);
        }

        .customer-summary-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.72);
          color: #23613B;
        }

        .tone-gold .customer-summary-icon {
          color: #A86B1D;
        }

        .customer-summary-label {
          display: block;
          color: #25382B;
          font-size: 12px;
          font-weight: 600;
        }

        .customer-summary-card strong {
          display: block;
          margin-top: 2px;
          color: #111B14;
          font-size: 23px;
          line-height: 1.15;
        }

        .customer-toolbar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .customer-search-field {
          display: flex;
          align-items: center;
          gap: 9px;
          flex: 1 1 250px;
          min-width: 220px;
          height: 42px;
          padding: 0 12px;
          border: 1px solid #DCE7DB;
          border-radius: 10px;
          background: #FFFFFF;
          color: #58675B;
          box-shadow: 0 2px 6px rgba(18, 61, 43, 0.04);
        }

        .customer-search-field:focus-within {
          border-color: #477A56;
          box-shadow: 0 0 0 3px rgba(39, 99, 69, 0.1);
        }

        .customer-search-field input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #123D2B;
          font: inherit;
          font-size: 12px;
        }

        .customer-toolbar select {
          min-width: 138px;
          height: 42px;
          padding: 0 30px 0 12px;
          border: 1px solid #DCE7DB;
          border-radius: 10px;
          background: #FFFFFF;
          color: #27392D;
          font: inherit;
          font-size: 12px;
        }

        .customer-filter-button,
        .customer-export-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 42px;
          padding: 0 14px;
          border: 1px solid #DCE7DB;
          border-radius: 10px;
          background: #FFFFFF;
          color: #123D2B;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .customer-filter-button {
          width: 42px;
          padding: 0;
          background: #EEF6EA;
        }

        .customer-filter-button.is-selected {
          border-color: #38734D;
          background: #DFEEDD;
        }

        .customer-export-button {
          border-color: #123D2B;
          background: #123D2B;
          color: #FFFFFF;
        }

        .customer-filter-button:focus-visible,
        .customer-export-button:focus-visible,
        .customer-action-button:focus-visible {
          outline: 2px solid #3F7650;
          outline-offset: 2px;
        }

        .customer-active-filter {
          flex-basis: 100%;
          margin-left: auto;
        }

        .customer-success {
          padding: 11px 14px;
          border: 1px solid #CDE2CB;
          border-radius: 10px;
          background: #E8F2E7;
          color: #123D2B;
          font-size: 13px;
        }

        .customer-table-card {
          padding: 12px 16px;
          border: 1px solid #E1E9E1;
          border-radius: 14px;
          background: #FFFFFF;
        }

        .customers-page .customer-table {
          min-width: 880px;
        }

        .customers-page .customer-table thead th {
          background: #F0F5EF;
          color: #324839;
          font-size: 10px;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .customers-page .customer-checkbox-cell {
          width: 40px;
          text-align: center;
        }

        .customers-page .customer-checkbox-cell input {
          width: 15px;
          height: 15px;
          accent-color: #24633D;
          cursor: pointer;
        }

        .customers-page .customer-profile {
          min-width: 190px;
          gap: 9px;
        }

        .customers-page .customer-avatar {
          width: 34px;
          height: 34px;
        }

        .customers-page .customer-avatar-fallback {
          font-size: 13px;
        }

        .customers-page .customer-joined,
        .customers-page .customer-contact-phone {
          margin-top: 3px;
          color: #68786C;
          font-size: 11px;
        }

        .customers-page .customer-total-spent {
          color: #1D2D22;
          font-weight: 700;
          white-space: nowrap;
        }

        .customers-page .customer-actions {
          flex-wrap: nowrap;
          gap: 6px;
        }

        .customer-action-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          padding: 0;
          border: 1px solid #DFE8DD;
          border-radius: 9px;
          background: #F5F8F3;
          color: #244C34;
          cursor: pointer;
        }

        .customer-action-button:hover:not(:disabled) {
          border-color: #9BB89A;
          background: #EAF3E7;
        }

        .customer-action-button.is-danger {
          border-color: #F3D5D2;
          background: #FFF1EF;
          color: #B6352F;
        }

        .customer-action-button.is-success {
          border-color: #CDE2CB;
          background: #E8F2E7;
          color: #23613B;
        }

        .customer-action-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .customer-action-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: customer-spin 0.7s linear infinite;
        }

        @keyframes customer-spin {
          to { transform: rotate(360deg); }
        }

        .customer-modal-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border: 1px solid #D5E4D2;
          border-radius: 9px;
          background: #FFFFFF;
          color: #123D2B;
          font-size: 22px;
          cursor: pointer;
        }

        .customer-edit-form {
          display: grid;
          gap: 15px;
        }

        .customer-edit-form label {
          display: grid;
          gap: 7px;
          color: #31483A;
          font-size: 12px;
          font-weight: 600;
        }

        .customer-edit-form input {
          box-sizing: border-box;
          width: 100%;
          min-height: 42px;
          padding: 9px 12px;
          border: 1px solid #D5E4D2;
          border-radius: 9px;
          background: #FFFFFF;
          color: #123D2B;
          font: inherit;
        }

        .customer-edit-form input:disabled {
          background: #F3F6F2;
          color: #778379;
        }

        .customer-edit-form small {
          color: #68786C;
          font-size: 11px;
          font-weight: 400;
        }

        .customer-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 8px;
        }

        .customer-cancel-button,
        .customer-save-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 38px;
          padding: 0 14px;
          border: 1px solid #D5E4D2;
          border-radius: 9px;
          background: #FFFFFF;
          color: #123D2B;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .customer-save-button {
          border-color: #123D2B;
          background: #123D2B;
          color: #FFFFFF;
        }

        @media (max-width: 900px) {
          .customer-summary-grid {
            grid-template-columns: 1fr;
          }

          .customer-toolbar select {
            flex: 1 1 150px;
          }
        }

        @media (max-width: 620px) {
          .customer-toolbar {
            align-items: stretch;
          }

          .customer-search-field {
            flex-basis: 100%;
          }

          .customer-toolbar select {
            flex-basis: 100%;
          }

          .customer-active-filter {
            margin-left: 0;
          }

          .customer-summary-card {
            min-height: 72px;
          }

          .customers-page .customer-modal {
            padding: 18px;
          }
        }
      `}</style>
    </section>
  );
}

function CustomerSummaryCard({ icon: Icon, label, value, tone }) {
  return (
    <article className={`customer-summary-card tone-${tone}`}>
      <span className="customer-summary-icon" aria-hidden="true">
        <Icon size={23} strokeWidth={1.8} />
      </span>
      <div>
        <span className="customer-summary-label">{label}</span>
        <strong>{Number(value || 0).toLocaleString('en-IN')}</strong>
      </div>
    </article>
  );
}
