
import { useEffect, useMemo, useState } from 'react';
import {
  getResource,
  getInventoryStock,
  adjustInventoryStock,
} from '../services/adminService.js';

const formatDate = (value) => {
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
};

const getTransactionType = (item) =>
  String(
    item.transaction_type ||
      item.type ||
      item.transaction_type_name ||
      'Unknown'
  ).toLowerCase();

const getQuantity = (item) =>
  item.quantity_change ?? item.quantity_delta ?? item.quantity ?? null;

const getProductName = (item) =>
  item.product_name || item.product?.name || item.product_id || '—';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [reload, setReload] = useState(0);
const [stockFilter, setStockFilter] = useState('all');

  const [stockItems, setStockItems] = useState([]);
  const [stockLoading, setStockLoading] = useState(true);
  const [stockError, setStockError] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [stockReload, setStockReload] = useState(0);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [adjustmentAction, setAdjustmentAction] = useState('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('1');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState('');
  const [adjustmentSuccess, setAdjustmentSuccess] = useState('');

  // Filter current stock by product, variant, SKU, or product ID.
 const filteredStock = useMemo(() => {
  const query = stockSearch.trim().toLowerCase();

  return stockItems.filter((item) => {
    const threshold = Number(
      item.attributes?.low_stock_threshold ?? 10
    );
    const quantity = Number(item.stock_quantity ?? 0);

    const matchesSearch =
      !query ||
      [
        item.product_name,
        item.name,
        item.sku,
        item.product_id,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        );

    const isLowStock = quantity <= threshold;

    const matchesFilter =
      stockFilter === 'all' ||
      (stockFilter === 'low' && isLowStock) ||
      (stockFilter === 'available' && !isLowStock);

    return matchesSearch && matchesFilter;
  });
}, [stockItems, stockSearch, stockFilter]);

  const lowStockCount = useMemo(
    () =>
      stockItems.filter((item) => {
        const threshold = Number(
          item.attributes?.low_stock_threshold ?? 10
        );

        return Number(item.stock_quantity ?? 0) <= threshold;
      }).length,
    [stockItems]
  );

  // Load current stock.
  useEffect(() => {
    let active = true;

    const loadStock = async () => {
      setStockLoading(true);
      setStockError('');

      try {
        const result = await getInventoryStock({
          limit: 100,
          offset: 0,
        });

        if (active) {
          setStockItems(
            Array.isArray(result) ? result : result?.items || []
          );
        }
      } catch (requestError) {
        if (active) {
          setStockError(
            requestError.message || 'Unable to load current stock.'
          );
        }
      } finally {
        if (active) setStockLoading(false);
      }
    };

    loadStock();

    return () => {
      active = false;
    };
  }, [stockReload]);

  // Load inventory transaction history.
  useEffect(() => {
    let active = true;

    const loadTransactions = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await getResource('inventory', {
          limit: 100,
          offset: 0,
        });

        if (active) {
          setItems(
            Array.isArray(result) ? result : result?.items || []
          );
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.message || 'Unable to load inventory transactions.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTransactions();

    return () => {
      active = false;
    };
  }, [reload]);

  const transactionTypes = useMemo(
    () => [...new Set(items.map(getTransactionType))].sort(),
    [items]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesType =
        typeFilter === 'all' ||
        getTransactionType(item) === typeFilter;

      const searchableText = [
        item.id,
        getProductName(item),
        getTransactionType(item),
        item.reference,
        item.reference_id,
        item.reference_type,
        item.notes,
        item.reason,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesType && (!query || searchableText.includes(query));
    });
  }, [items, search, typeFilter]);

  const summary = useMemo(() => {
    const incoming = items.filter((item) => {
      const type = getTransactionType(item);
      return /in|restock|addition|received/.test(type);
    }).length;

    const outgoing = items.filter((item) => {
      const type = getTransactionType(item);
      return /out|sale|deduct|removal|dispatch/.test(type);
    }).length;

    return {
      total: items.length,
      incoming,
      outgoing,
    };
  }, [items]);

  const openAdjustmentForm = (item) => {
    setSelectedVariant(item);
    setAdjustmentAction('add');
    setAdjustmentQuantity('1');
    setAdjustmentNotes('');
    setAdjustmentError('');
    setAdjustmentSuccess('');
  };

  const closeAdjustmentForm = () => {
    if (adjustmentLoading) return;

    setSelectedVariant(null);
    setAdjustmentError('');
    setAdjustmentSuccess('');
  };

  const handleStockAdjustment = async (event) => {
    event.preventDefault();

    if (!selectedVariant) return;

    const quantity = Number(adjustmentQuantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setAdjustmentError('Enter a positive whole-number quantity.');
      return;
    }

    if (
      adjustmentAction === 'remove' &&
      quantity > Number(selectedVariant.stock_quantity ?? 0)
    ) {
      setAdjustmentError(
        'Removal quantity cannot exceed the available stock.'
      );
      return;
    }

    setAdjustmentLoading(true);
    setAdjustmentError('');
    setAdjustmentSuccess('');

    try {
      await adjustInventoryStock({
        variant_id: selectedVariant.id,
        action: adjustmentAction,
        quantity,
        notes: adjustmentNotes.trim() || null,
      });

      setAdjustmentSuccess('Stock adjusted successfully.');
      setSelectedVariant(null);
      setAdjustmentQuantity('1');
      setAdjustmentNotes('');

      // Reload both stock and transaction history.
      setStockReload((current) => current + 1);
      setReload((current) => current + 1);
    } catch (requestError) {
      setAdjustmentError(
        requestError.message || 'Unable to adjust stock. Please try again.'
      );
    } finally {
      setAdjustmentLoading(false);
    }
  };

  return (
    <section className="module-page inventory-page">
      <style>{`
       
.inventory-page .stock-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(20, 32, 24, 0.55);
  backdrop-filter: blur(3px);
}

.inventory-page .stock-modal {
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 24px;
  border: 1px solid #e5e9e4;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.2);
}

.inventory-page .stock-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.inventory-page .stock-modal-header h3 {
  margin: 0;
  color: #263c30;
  font-size: 19px;
}

.inventory-page .stock-modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: 1px solid #e1e6df;
  border-radius: 9px;
  background: #fff;
  color: #34453a;
  cursor: pointer;
  font-size: 21px;
}

.inventory-page .stock-modal-close:hover {
  background: #f3f6f1;
}

.inventory-page .stock-modal-product {
  padding: 13px;
  margin-bottom: 18px;
  border-radius: 10px;
  background: #f5f7f3;
  color: #586456;
  font-size: 13px;
  line-height: 1.7;
}
.inventory-page .transaction-incoming {
  background: #e7f5eb;
  color: #216e41;
}

.inventory-page .transaction-outgoing {
  background: #fff0e8;
  color: #a34218;
}
.inventory-page .stock-modal-product strong {
  display: block;
  color: #263c30;
  font-size: 14px;
}

.inventory-page .stock-modal .adjustment-form {
  display: grid;
  gap: 15px;
}
.inventory-page .inventory-low-stock-link {
  padding: 0;
  border: none;
  background: transparent;
  color: #a15c00;
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.inventory-page .inventory-low-stock-link:hover {
  color: #744200;
}

.inventory-page .stock-modal .adjustment-field {
  display: grid;
  gap: 7px;
}

.inventory-page .stock-modal .adjustment-field label {
  color: #586456;
  font-size: 12px;
  font-weight: 600;
}

.inventory-page .stock-modal .adjustment-field input,
.inventory-page .stock-modal .adjustment-field select,
.inventory-page .stock-modal .adjustment-field textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid #dfe5dd;
  border-radius: 9px;
  background: #fff;
  color: #34453a;
  font: inherit;
  font-size: 13px;
}

.inventory-page .stock-modal .adjustment-field textarea {
  min-height: 85px;
  resize: vertical;
}

.inventory-page .stock-modal .adjustment-field input:focus,
.inventory-page .stock-modal .adjustment-field select:focus,
.inventory-page .stock-modal .adjustment-field textarea:focus {
  outline: 2px solid #cbd8c7;
  outline-offset: 1px;
}

@media (max-width: 480px) {
  .inventory-page .stock-modal-overlay {
    padding: 12px;
  }

  .inventory-page .stock-modal {
    padding: 18px;
    max-height: calc(100vh - 24px);
  }
}

      `}</style>

      <div className="module-intro">
        <div>
          <h2>Inventory</h2>
          <p>Track stock movement and review inventory transactions.</p>
        </div>
      </div>

      {adjustmentSuccess && (
        <div className="inventory-success" role="status">
          {adjustmentSuccess}
        </div>
      )}

      <div className="inventory-summary">
        <div className="inventory-stat">
          <div className="inventory-stat-label">Total transactions</div>
          <div className="inventory-stat-value">{summary.total}</div>
        </div>

        <div className="inventory-stat">
          <div className="inventory-stat-label">Incoming transactions</div>
          <div className="inventory-stat-value">{summary.incoming}</div>
        </div>

        <div className="inventory-stat">
          <div className="inventory-stat-label">Outgoing transactions</div>
          <div className="inventory-stat-value">{summary.outgoing}</div>
        </div>
      </div>

      <div className="module-card inventory-stock-card">
        <div className="inventory-toolbar">
          <div>
            <h3>Current Stock</h3>
           <p className="inventory-count">
  {stockItems.length} product variants ·{' '}
  <button
    type="button"
    className="inventory-low-stock-link"
    onClick={() =>
      setStockFilter((current) =>
        current === 'low' ? 'all' : 'low'
      )
    }
  >
    {lowStockCount} low-stock items
  </button>
</p>
          </div>

          <div className="inventory-controls">
            <input
              type="search"
              value={stockSearch}
              onChange={(event) => setStockSearch(event.target.value)}
              placeholder="Search product or SKU..."
              aria-label="Search current stock"
            />
<select
  value={stockFilter}
  onChange={(event) => setStockFilter(event.target.value)}
  aria-label="Filter stock status"
>
  <option value="all">All stock</option>
  <option value="low">Low stock</option>
  <option value="available">In stock</option>
</select>
            <button
              type="button"
              className="inventory-refresh"
              onClick={() => setStockReload((current) => current + 1)}
              disabled={stockLoading}
            >
              {stockLoading ? 'Loading…' : 'Refresh stock'}
            </button>
          </div>
        </div>

        {stockLoading ? (
          <div className="loading-state">Loading current stock...</div>
        ) : stockError ? (
          <div className="inventory-error" role="alert">
            <div>{stockError}</div>
            <button
              type="button"
              className="inventory-retry"
              onClick={() => setStockReload((current) => current + 1)}
            >
              Try again
            </button>
          </div>
        ) : filteredStock.length === 0 ? (
          <div className="inventory-empty">
            No matching stock records found.
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product / Variant</th>
                  <th>SKU</th>
                  <th>Price</th>
<th>Available stock</th>
<th>Low-stock threshold</th>
<th>Status</th>
<th>Action</th>                
                </tr>
              </thead>

              <tbody>
                {filteredStock.map((item) => {
                  const quantity = Number(item.stock_quantity ?? 0);
                  const threshold = Number(
                    item.attributes?.low_stock_threshold ?? 10
                  );

                  return (
                    <tr key={item.id}>
                      <td>
                        <div>
                          <strong>
                            {item.product_name || 'Unknown product'}
                          </strong>
                          <div className="transaction-id">
                            {item.name || 'Unnamed variant'}
                          </div>
                        </div>
                      </td>

                      <td>{item.sku || '—'}</td>

                      <td>
                        {item.price == null
                          ? '—'
                          : `₹${Number(item.price).toLocaleString('en-IN')}`}
                      </td>

                      <td>{quantity}</td>

<td>{threshold} units</td>

<td>
  <span
    className={`transaction-type ${
      quantity <= threshold
        ? 'stock-low'
        : 'stock-available'
    }`}
  >
    {quantity <= threshold ? 'Low stock' : 'In stock'}
  </span>
</td>

                      <td>
                        <button
                          type="button"
                          className="inventory-refresh"
                          onClick={() => openAdjustmentForm(item)}
                          disabled={adjustmentLoading}
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      
{selectedVariant && (
  <div
    className="stock-modal-overlay"
    onMouseDown={(event) => {
      if (
        event.target === event.currentTarget &&
        !adjustmentLoading
      ) {
        closeAdjustmentForm();
      }
    }}
  >
    <div
      className="stock-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-modal-title"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="stock-modal-header">
        <div>
          <h3 id="stock-modal-title">Adjust Stock</h3>
          <p className="inventory-count" style={{ marginTop: 5 }}>
            Update available inventory
          </p>
        </div>

        <button
          type="button"
          className="stock-modal-close"
          aria-label="Close stock adjustment"
          onClick={closeAdjustmentForm}
          disabled={adjustmentLoading}
        >
          ×
        </button>
      </div>

      <div className="stock-modal-product">
        <strong>
          {selectedVariant.product_name || 'Unknown product'}
        </strong>
        Variant: {selectedVariant.name || 'Unnamed variant'}
        <br />
        SKU: {selectedVariant.sku || '—'}
        <br />
        Available stock:{' '}
        <strong>{selectedVariant.stock_quantity ?? 0} units</strong>
      </div>

      <form
        className="adjustment-form"
        onSubmit={handleStockAdjustment}
      >
        <div className="adjustment-field">
          <label htmlFor="adjustment-action">Adjustment type</label>
          <select
            id="adjustment-action"
            value={adjustmentAction}
            onChange={(event) =>
              setAdjustmentAction(event.target.value)
            }
            disabled={adjustmentLoading}
          >
            <option value="add">Add Stock</option>
            <option value="remove">Remove Stock</option>
          </select>
        </div>

        <div className="adjustment-field">
          <label htmlFor="adjustment-quantity">Quantity</label>
          <input
            id="adjustment-quantity"
            type="number"
            min="1"
            step="1"
            required
            value={adjustmentQuantity}
            onChange={(event) =>
              setAdjustmentQuantity(event.target.value)
            }
            disabled={adjustmentLoading}
          />
        </div>

        <div className="adjustment-field">
          <label htmlFor="adjustment-notes">Reason / Notes</label>
          <textarea
            id="adjustment-notes"
            maxLength={500}
            value={adjustmentNotes}
            onChange={(event) =>
              setAdjustmentNotes(event.target.value)
            }
            placeholder="Enter the reason for this adjustment"
            disabled={adjustmentLoading}
          />
        </div>

        {adjustmentError && (
          <div className="inventory-error" role="alert">
            {adjustmentError}
          </div>
        )}

        <div className="adjustment-actions">
          <button
            type="submit"
            className="adjustment-primary"
            disabled={adjustmentLoading}
          >
            {adjustmentLoading ? 'Saving…' : 'Save Adjustment'}
          </button>

          <button
            type="button"
            className="inventory-refresh"
            onClick={closeAdjustmentForm}
            disabled={adjustmentLoading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}


      <div className="module-card">
        <div className="inventory-toolbar">
          <span className="inventory-count">
            Showing {loading ? '…' : filteredItems.length} of {items.length} transactions
          </span>

          <div className="inventory-controls">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search transactions…"
              aria-label="Search inventory transactions"
            />

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              aria-label="Filter transaction type"
            >
              <option value="all">All types</option>
              {transactionTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="inventory-refresh"
              onClick={() => {
                setReload((current) => current + 1);
                setStockReload((current) => current + 1);
              }}
              disabled={loading || stockLoading}
            >
              {loading || stockLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading inventory transactions…</div>
        ) : error ? (
          <div className="inventory-error" role="alert">
            <div>{error}</div>
            <button
              type="button"
              className="inventory-retry"
              onClick={() => setReload((current) => current + 1)}
            >
              Try again
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="inventory-empty">
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
              <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" />
              <path d="M4.2 7.6 12 12l7.8-4.4M12 12v9M8 5.3l8 4.5" />
            </svg>

            <h3>
              {items.length === 0
                ? 'No inventory transactions yet'
                : 'No matching transactions'}
            </h3>

            <p>
              {items.length === 0
                ? 'Inventory movements will appear here when transactions are recorded.'
                : 'Try changing your search or transaction type filter.'}
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Product / Variant ID</th>
                  <th>Type</th>
                  <th>Quantity change</th>
                  <th>Reference / Reason</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item, index) => {
                  const quantity = getQuantity(item);

                  return (
                    <tr
                      key={item.id ?? `${getProductName(item)}-${index}`}
                    >
                      <td>
                        <span className="transaction-id">
                          {item.id ?? '—'}
                        </span>
                      </td>

                      <td>
  <div>
    <strong>{item.product_name || getProductName(item)}</strong>
    <div className="transaction-id">
      {item.variant_name || item.variant_id || '—'}
    </div>
    {item.sku && (
      <div className="transaction-id">
        SKU: {item.sku}
      </div>
    )}
  </div>
</td>

                      <td>
  <span
    className={`transaction-type ${
      /in|restock|addition|received/.test(
        getTransactionType(item)
      )
        ? 'transaction-incoming'
        : /out|sale|deduct|removal|dispatch/.test(
            getTransactionType(item)
          )
          ? 'transaction-outgoing'
          : ''
    }`}
  >
    {getTransactionType(item)}
  </span>
</td>
                      <td>
                        {quantity == null
                          ? '—'
                          : Number(quantity) > 0
                            ? `+${quantity}`
                            : quantity}
                      </td>

                      <td>
  {item.notes ||
    item.reference_type ||
    item.reference_id ||
    '—'}
</td>

                      <td>
                        {formatDate(item.created_at || item.transaction_date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
