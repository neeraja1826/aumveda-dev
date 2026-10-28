
import { useEffect, useState } from 'react';
import {
  getResource,
  updateResourceStatus,
} from '../services/adminService.js';

export default function Customers() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    const params = {};
    if (search.trim()) params.search = search.trim();
    if (activeFilter !== '') params.active = activeFilter;

    getResource('customers', params)
      .then((result) => {
        if (active) setItems(result.items || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, activeFilter, reload]);

  async function toggleCustomer(customer) {
    if (updatingId) return;

    setUpdatingId(customer.id);
    setError('');

    try {
      await updateResourceStatus(
        'customers',
        customer.id,
        !customer.is_active
      );

      setReload((current) => current + 1);
    } catch (requestError) {
      setError(requestError.message || 'Unable to update customer status.');
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <section className="module-page customers-page">
      <div className="module-intro">
        <div>
          <h2>Customers</h2>
          <p>View customer profiles and manage account status.</p>
        </div>
      </div>

      <div className="module-toolbar">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search customers..."
          aria-label="Search customers"
        />

        <select
          value={activeFilter}
          onChange={(event) => setActiveFilter(event.target.value)}
          aria-label="Filter by account status"
        >
          <option value="">All customers</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {error && (
        <div className="error-state" role="alert">
          {error}
        </div>
      )}

      <div className="module-card">
        {loading ? (
          <div className="loading-state">Loading customers...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">No customers found.</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {items.map((customer) => (
                  <tr key={customer.id}>
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
                          <div className="customer-id">
                            {customer.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>{customer.phone || '—'}</td>
                    <td>{customer.role || 'customer'}</td>
                    <td>
                      {customer.created_at
                        ? new Date(customer.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <span
                        className={
                          customer.is_active
                            ? 'customer-status active'
                            : 'customer-status inactive'
                        }
                      >
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={updatingId !== ''}
                        onClick={() => toggleCustomer(customer)}
                      >
                        {updatingId === customer.id
                          ? 'Updating...'
                          : customer.is_active
                            ? 'Deactivate'
                            : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
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
          background: #e9eee7;
          color: #285447;
          font-weight: 600;
        }

        .customers-page .customer-id {
          margin-top: 4px;
          max-width: 210px;
          overflow-wrap: anywhere;
          font-size: 11px;
          opacity: 0.6;
        }

        .customers-page .customer-status {
          display: inline-block;
          padding: 4px 9px;
          border-radius: 20px;
          font-size: 12px;
        }

        .customers-page .customer-status.active {
          background: #e7f3e9;
          color: #28643b;
        }

        .customers-page .customer-status.inactive {
          background: #fbe9e7;
          color: #a3332a;
        }

        @media (max-width: 620px) {
          .customers-page .module-toolbar {
            flex-direction: column;
          }

          .customers-page .module-toolbar input,
          .customers-page .module-toolbar select {
            width: 100%;
            min-width: 0;
          }
        }
      `}</style>
    </section>
  );
}
