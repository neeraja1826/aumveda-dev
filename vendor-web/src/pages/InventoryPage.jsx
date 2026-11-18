
import "./InventoryPage.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Boxes,
  CheckCircle2,
  ChevronDown,
  Clock3,
  History,
  LoaderCircle,
  Minus,
  Package,
  PackageCheck,
  PackageX,
  RefreshCw,
  Search,
  Settings2,
  SlidersHorizontal,
  Warehouse,
  X,
} from "lucide-react";

import { vendorApi } from "../services/api";


const EMPTY_FORM = {
  operation: "increase",
  quantity: "",
  low_stock_threshold: "",
};

const STOCK_FILTERS = [
  { value: "all", label: "All Stock" },
  { value: "healthy", label: "Healthy Stock" },
  { value: "low", label: "Low Stock" },
  { value: "out", label: "Out of Stock" },
];

function normalizeInventory(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.inventory)) {
    return response.data.inventory;
  }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  if (Array.isArray(response?.inventory)) {
    return response.inventory;
  }
  return [];
}

function normalizeHistory(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.history)) {
    return response.data.history;
  }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  if (Array.isArray(response?.history)) {
    return response.history;
  }
  return [];
}

function safeNumber(value, fallback = 0) {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }

  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(
    safeNumber(value)
  );
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);
  if (!Number.isFinite(number)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(number);
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatOperation(value) {
  const labels = {
    increase: "Stock Increased",
    decrease: "Stock Decreased",
    set: "Stock Set",
  };

  const key = String(value || "").toLowerCase();

  return labels[key] ||
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "Inventory Change";
}

function stockDetails(item) {
  const stock = Math.max(
    0,
    safeNumber(item?.stock_quantity)
  );

  const threshold = Math.max(
    0,
    safeNumber(
      item?.low_stock_threshold ??
      item?.attributes?.low_stock_threshold,
      5
    )
  );

  if (stock === 0 || item?.is_out_of_stock === true) {
    return {
      stock,
      threshold,
      label: "Out of Stock",
      tone: "danger",
    };
  }

  if (
    stock <= threshold ||
    item?.is_low_stock === true
  ) {
    return {
      stock,
      threshold,
      label: "Low Stock",
      tone: "warning",
    };
  }

  return {
    stock,
    threshold,
    label: "Healthy",
    tone: "success",
  };
}

function previewStock(current, operation, rawQuantity) {
  if (rawQuantity === "") return current;

  const quantity = Number(rawQuantity);
  if (!Number.isFinite(quantity)) return current;

  if (operation === "increase") {
    return current + quantity;
  }

  if (operation === "decrease") {
    return current - quantity;
  }

  if (operation === "set") {
    return quantity;
  }

  return current;
}

function isWholeNonNegative(value) {
  if (value === "" || value === null || value === undefined) {
    return false;
  }

  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0;
}

function HealthCard({
  icon: Icon,
  label,
  value,
  description,
  tone = "green",
}) {
  return (
    <article className="avi-health-card">
      <span className={`avi-health-icon avi-tone-${tone}`}>
        <Icon size={21} strokeWidth={1.8} />
      </span>

      <div className="avi-health-copy">
        <span>{label}</span>
        <strong>{formatNumber(value)}</strong>
        <small>{description}</small>
      </div>
    </article>
  );
}

function StockBadge({ item }) {
  const details = stockDetails(item);

  return (
    <span className={`avi-badge avi-badge-${details.tone}`}>
      <span className="avi-badge-dot" />
      {details.label}
    </span>
  );
}

function StockMeter({ item }) {
  const details = stockDetails(item);

  // This is a relative stock-health indicator,
  // not a warehouse capacity percentage.
  const reference = Math.max(details.threshold * 3, 10);
  const width = Math.min(
    100,
    (details.stock / reference) * 100
  );

  return (
    <div
      className={`avi-stock-meter avi-meter-${details.tone}`}
      title="Stock level relative to alert threshold"
    >
      <span style={{ width: `${width}%` }} />
    </div>
  );
}

function InventoryRow({ item, onAdjust, onHistory }) {
  const details = stockDetails(item);

  return (
    <tr>
      <td>
        <div className="avi-product">
          <span className="avi-product-icon">
            <Package size={20} />
          </span>

          <div>
            <strong title={item.product_name || ""}>
              {item.product_name || "Unnamed Product"}
            </strong>

            <small>
              {item.product_status || "Product"}
            </small>
          </div>
        </div>
      </td>

      <td>
        <span className="avi-variant-name">
          {item.variant_name || "Default"}
        </span>
      </td>

      <td>
        <code className="avi-sku">
          {item.sku || "—"}
        </code>
      </td>

      <td>
        <strong className="avi-price">
          {formatCurrency(item.price)}
        </strong>
      </td>

      <td>
        <div className="avi-stock-cell">
          <div>
            <strong>{formatNumber(details.stock)}</strong>
            <small>units</small>
          </div>

          <StockMeter item={item} />
        </div>
      </td>

      <td>
        <strong className="avi-threshold">
          {formatNumber(details.threshold)}
        </strong>
      </td>

      <td>
        <StockBadge item={item} />
      </td>

      <td>
        <div className="avi-row-actions">
          <button
            type="button"
            className="avi-row-adjust"
            onClick={() => onAdjust(item)}
          >
            <Settings2 size={16} />
            Adjust
          </button>

          <button
            type="button"
            className="avi-row-history"
            onClick={() => onHistory(item)}
            title="View Stock History"
            aria-label={`View history for ${item.variant_name || "variant"}`}
          >
            <History size={17} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function OperationOption({
  icon: Icon,
  title,
  description,
  value,
  selected,
  onChange,
  disabled,
}) {
  return (
    <label
      className={`avi-operation ${
        selected ? "avi-operation-selected" : ""
      }`}
    >
      <input
        type="radio"
        name="operation"
        value={value}
        checked={selected}
        onChange={onChange}
        disabled={disabled}
      />

      <span className="avi-operation-icon">
        <Icon size={19} />
      </span>

      <strong>{title}</strong>
      <small>{description}</small>
    </label>
  );
}

function InventoryAdjustModal({
  item,
  form,
  saving,
  error,
  onChange,
  onSubmit,
  onClose,
}) {
  const current = stockDetails(item).stock;
  const next = previewStock(
    current,
    form.operation,
    form.quantity
  );

  const difference = next - current;
  const isInvalid =
    !isWholeNonNegative(form.quantity) ||
    (form.operation !== "set" && Number(form.quantity) === 0) ||
    !isWholeNonNegative(form.low_stock_threshold) ||
    next < 0 ||
    !Number.isSafeInteger(next);

  useEffect(() => {
    function onEscape(event) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }

    document.addEventListener("keydown", onEscape);
    return () =>
      document.removeEventListener("keydown", onEscape);
  }, [onClose, saving]);

  return (
    <div
      className="avi-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        className="avi-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avi-adjust-title"
      >
        <header className="avi-modal-header">
          <div>
            <span className="avi-eyebrow">
              INVENTORY OPERATION
            </span>

            <h2 id="avi-adjust-title">
              Adjust Stock
            </h2>

            <p>
              {item.product_name || "Product"}
              {" · "}
              {item.variant_name || "Default"}
              {item.sku ? ` · ${item.sku}` : ""}
            </p>
          </div>

          <button
            type="button"
            className="avi-modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close adjustment"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={onSubmit}>
          {error && (
            <div
              className="avi-alert avi-alert-error"
              role="alert"
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="avi-comparison">
            <div>
              <span>Current Stock</span>
              <strong>{formatNumber(current)}</strong>
            </div>

            <span className="avi-comparison-arrow">
              {difference > 0 ? (
                <ArrowUp size={20} />
              ) : difference < 0 ? (
                <ArrowDown size={20} />
              ) : (
                <Minus size={20} />
              )}
            </span>

            <div>
              <span>New Stock</span>
              <strong
                className={next < 0 ? "avi-negative" : ""}
              >
                {formatNumber(next)}
              </strong>
            </div>
          </div>

          <div className="avi-modal-section-title">
            Select Operation
          </div>

          <div className="avi-operation-grid">
            <OperationOption
              icon={ArrowUp}
              title="Increase"
              description="Add new stock"
              value="increase"
              selected={form.operation === "increase"}
              onChange={onChange}
              disabled={saving}
            />

            <OperationOption
              icon={ArrowDown}
              title="Decrease"
              description="Remove stock"
              value="decrease"
              selected={form.operation === "decrease"}
              onChange={onChange}
              disabled={saving}
            />

            <OperationOption
              icon={Minus}
              title="Set Quantity"
              description="Replace current stock"
              value="set"
              selected={form.operation === "set"}
              onChange={onChange}
              disabled={saving}
            />
          </div>

          <div className="avi-form-grid">
            <label className="avi-field">
              <span>Quantity *</span>

              <input
                type="number"
                name="quantity"
                min="0"
                step="1"
                required
                value={form.quantity}
                onChange={onChange}
                disabled={saving}
                placeholder={
                  form.operation === "set"
                    ? "Enter final stock quantity"
                    : "Enter quantity to adjust"
                }
              />
            </label>

            <label className="avi-field">
              <span>Low Stock Alert Level *</span>

              <input
                type="number"
                name="low_stock_threshold"
                min="0"
                step="1"
                required
                value={form.low_stock_threshold}
                onChange={onChange}
                disabled={saving}
              />
            </label>
          </div>

          <div className="avi-adjust-preview">
            <div>
              <span>Expected Change</span>
              <strong
                className={
                  difference > 0
                    ? "avi-positive"
                    : difference < 0
                      ? "avi-negative"
                      : ""
                }
              >
                {difference > 0
                  ? `+${formatNumber(difference)}`
                  : formatNumber(difference)}
              </strong>
            </div>

            <div>
              <span>Resulting Stock</span>
              <strong>{formatNumber(next)}</strong>
            </div>
          </div>

          {next < 0 && (
            <div className="avi-modal-warning">
              <AlertTriangle size={17} />
              Stock cannot be reduced below zero.
            </div>
          )}

          <footer className="avi-modal-actions">
            <button
              type="button"
              className="avi-button avi-button-light"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="avi-button avi-button-primary"
              disabled={saving || isInvalid}
            >
              {saving ? (
                <LoaderCircle
                  size={17}
                  className="avi-spin"
                />
              ) : (
                <CheckCircle2 size={17} />
              )}

              {saving
                ? "Saving Adjustment..."
                : "Confirm Adjustment"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function HistoryRow({ transaction }) {
  const delta = safeNumber(transaction.quantity_delta);
  const positive = delta >= 0;

  return (
    <div className="avi-history-row">
      <span
        className={`avi-history-icon ${
          positive
            ? "avi-history-positive"
            : "avi-history-negative"
        }`}
      >
        {positive ? (
          <ArrowUp size={17} />
        ) : (
          <ArrowDown size={17} />
        )}
      </span>

      <div className="avi-history-info">
        <strong>
          {formatOperation(transaction.transaction_type)}
        </strong>

        <span>
          {transaction.notes || "Inventory adjustment"}
        </span>

        <small>
          {formatDateTime(transaction.created_at)}
        </small>
      </div>

      <strong
        className={`avi-history-delta ${
          positive ? "avi-positive" : "avi-negative"
        }`}
      >
        {delta > 0 ? "+" : ""}
        {formatNumber(delta)}
      </strong>
    </div>
  );
}

function InventoryHistoryModal({
  item,
  history,
  loading,
  error,
  onClose,
}) {
  useEffect(() => {
    function onEscape(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onEscape);
    return () =>
      document.removeEventListener("keydown", onEscape);
  }, [onClose]);

  return (
    <div
      className="avi-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="avi-modal avi-history-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avi-history-title"
      >
        <header className="avi-modal-header">
          <div>
            <span className="avi-eyebrow">
              INVENTORY ACTIVITY
            </span>

            <h2 id="avi-history-title">
              Stock History
            </h2>

            <p>
              {item?.product_name || "Product"}
              {" · "}
              {item?.variant_name || "Default"}
            </p>
          </div>

          <button
            type="button"
            className="avi-modal-close"
            onClick={onClose}
            aria-label="Close history"
          >
            <X size={20} />
          </button>
        </header>

        {loading ? (
          <div className="avi-history-state">
            <LoaderCircle
              size={29}
              className="avi-spin"
            />
            <strong>Loading stock history...</strong>
          </div>
        ) : error ? (
          <div className="avi-history-state">
            <AlertCircle size={29} />
            <strong>History unavailable</strong>
            <p>{error}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="avi-history-state">
            <History size={30} />
            <strong>No stock activity recorded</strong>
            <p>
              Recorded inventory transactions will
              appear here when available.
            </p>
          </div>
        ) : (
          <div className="avi-history-list">
            {history.map((transaction, index) => (
              <HistoryRow
                key={transaction.id || index}
                transaction={transaction}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adjustError, setAdjustError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const [historyItem, setHistoryItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const loadInventory = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await vendorApi.getInventory();
      setInventory(normalizeInventory(response));
      setLoaded(true);
      return true;
    } catch (err) {
      setError(
        err?.message || "Unable to load inventory."
      );
      return false;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const summary = useMemo(() => {
    return inventory.reduce(
      (result, item) => {
        const details = stockDetails(item);

        result.variants += 1;
        result.totalStock += details.stock;

        if (details.tone === "danger") {
          result.outOfStock += 1;
        } else if (details.tone === "warning") {
          result.lowStock += 1;
        } else {
          result.healthy += 1;
        }

        return result;
      },
      {
        variants: 0,
        totalStock: 0,
        healthy: 0,
        lowStock: 0,
        outOfStock: 0,
      }
    );
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    const term = search.trim().toLowerCase();

    return inventory.filter((item) => {
      const haystack = [
        item.product_name,
        item.variant_name,
        item.sku,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !term || haystack.includes(term);

      const details = stockDetails(item);

      const matchesFilter =
        stockFilter === "all" ||
        (stockFilter === "healthy" && details.tone === "success") ||
        (stockFilter === "low" && details.tone === "warning") ||
        (stockFilter === "out" && details.tone === "danger");

      return matchesSearch && matchesFilter;
    });
  }, [inventory, search, stockFilter]);

  function openAdjust(item) {
    const details = stockDetails(item);

    setSelectedItem(item);
    setForm({
      operation: "increase",
      quantity: "",
      low_stock_threshold: String(details.threshold),
    });

    setAdjustError("");
    setSuccess("");
    setAdjustOpen(true);
  }

  function closeAdjust() {
    if (saving) return;

    setAdjustOpen(false);
    setSelectedItem(null);
    setAdjustError("");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setAdjustError("");
  }

  async function handleInventoryUpdate(event) {
    event.preventDefault();

    if (!selectedItem || saving) return;

    const quantity = Number(form.quantity);
    const threshold = Number(form.low_stock_threshold);

    if (!isWholeNonNegative(form.quantity)) {
      setAdjustError(
        "Quantity must be a non-negative whole number."
      );
      return;
    }

    if (form.operation !== "set" && quantity === 0) {
      setAdjustError(
        "Enter a quantity greater than zero for this adjustment."
      );
      return;
    }

    if (!isWholeNonNegative(form.low_stock_threshold)) {
      setAdjustError(
        "Low-stock threshold must be a non-negative whole number."
      );
      return;
    }

    const currentStock = stockDetails(selectedItem).stock;
    const nextStock = previewStock(
      currentStock,
      form.operation,
      form.quantity
    );

    if (nextStock < 0 || !Number.isSafeInteger(nextStock)) {
      setAdjustError(
        "This adjustment would produce an invalid stock quantity."
      );
      return;
    }

    setSaving(true);
    setAdjustError("");
    setError("");
    setSuccess("");

    try {
      await vendorApi.updateInventory(
        selectedItem.variant_id,
        {
          operation: form.operation,
          quantity,
          low_stock_threshold: threshold,
        }
      );

      setAdjustOpen(false);
      setSelectedItem(null);

      setSuccess("Inventory updated successfully.");

      await loadInventory(true);
    } catch (err) {
      setAdjustError(
        err?.message || "Unable to update inventory."
      );
    } finally {
      setSaving(false);
    }
  }

  async function openHistory(item) {
    setHistoryItem(item);
    setHistory([]);
    setHistoryError("");
    setHistoryOpen(true);
    setHistoryLoading(true);

    try {
      const response = await vendorApi.getInventoryHistory(
        item.variant_id
      );

      setHistory(normalizeHistory(response));
    } catch (err) {
      setHistoryError(
        err?.message ||
        "Unable to load inventory history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  if (loading && !loaded) {
    return (
      <div className="avi-page">
        <div className="avi-loading">
          <LoaderCircle
            size={32}
            className="avi-spin"
          />
          <strong>Loading inventory</strong>
          <p>Retrieving the latest stock information.</p>
        </div>
      </div>
    );
  }

  if (error && !loaded) {
    return (
      <div className="avi-page">
        <div className="avi-loading">
          <AlertCircle size={32} />
          <h2>Inventory unavailable</h2>
          <p>{error}</p>

          <button
            type="button"
            className="avi-button avi-button-primary"
            onClick={() => loadInventory()}
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="avi-page">
      {/* HEADER */}
      <header className="avi-header">
        <div>
          <span className="avi-eyebrow">
            STOCK OPERATIONS
          </span>

          <h1>Inventory Management</h1>

          <p>
            Keep track of product stock, identify low
            inventory and make accurate stock adjustments.
          </p>
        </div>

        <button
          type="button"
          className="avi-button avi-button-light"
          disabled={refreshing || saving}
          onClick={() => loadInventory(true)}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "avi-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh Inventory"}
        </button>
      </header>

      {/* ALERTS */}
      {error && (
        <div
          className="avi-alert avi-alert-error"
          role="alert"
        >
          <AlertCircle size={19} />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div
          className="avi-alert avi-alert-success"
          role="status"
        >
          <CheckCircle2 size={19} />
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <section
        className="avi-health-grid"
        aria-label="Inventory summary"
      >
        <HealthCard
          icon={Boxes}
          label="Tracked Variants"
          value={summary.variants}
          description="Product options"
        />

        <HealthCard
          icon={Warehouse}
          label="Available Units"
          value={summary.totalStock}
          description="Across tracked variants"
          tone="sage"
        />

        <HealthCard
          icon={PackageCheck}
          label="Healthy Stock"
          value={summary.healthy}
          description="Above alert threshold"
          tone="success"
        />

        <HealthCard
          icon={AlertTriangle}
          label="Low Stock"
          value={summary.lowStock}
          description="Needs attention"
          tone="warning"
        />

        <HealthCard
          icon={PackageX}
          label="Out of Stock"
          value={summary.outOfStock}
          description="Zero or unavailable"
          tone="danger"
        />
      </section>

      {/* INVENTORY TABLE */}
      <section className="avi-board">
        <header className="avi-board-heading">
          <div>
            <span className="avi-eyebrow">
              STOCK OVERVIEW
            </span>

            <h2>Variant Inventory</h2>

            <p>
              Search, filter and update the stock of
              your product variants.
            </p>
          </div>

          <span className="avi-results">
            {formatNumber(filteredInventory.length)}
            {" / "}
            {formatNumber(inventory.length)}
            {" variants"}
          </span>
        </header>

        <div className="avi-toolbar">
          <label className="avi-search">
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search product, variant or SKU..."
              aria-label="Search inventory"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear inventory search"
              >
                <X size={16} />
              </button>
            )}
          </label>

          <label className="avi-filter">
            <SlidersHorizontal size={17} />

            <select
              value={stockFilter}
              onChange={(event) =>
                setStockFilter(event.target.value)
              }
              aria-label="Filter by stock condition"
            >
              {STOCK_FILTERS.map((filter) => (
                <option
                  key={filter.value}
                  value={filter.value}
                >
                  {filter.label}
                </option>
              ))}
            </select>

            <ChevronDown size={16} />
          </label>
        </div>

        {filteredInventory.length === 0 ? (
          <div className="avi-empty">
            <span className="avi-empty-icon">
              <Warehouse size={31} />
            </span>

            <h3>
              {inventory.length === 0
                ? "No inventory records yet"
                : "No matching inventory"}
            </h3>

            <p>
              {inventory.length === 0
                ? "Stock records will appear after product variants are registered."
                : "Try a different search or stock filter."}
            </p>

            {inventory.length > 0 && (
              <button
                type="button"
                className="avi-button avi-button-light"
                onClick={() => {
                  setSearch("");
                  setStockFilter("all");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="avi-table-scroll">
            <table className="avi-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>SKU</th>
                  <th>Selling Price</th>
                  <th>Available Stock</th>
                  <th>Alert Level</th>
                  <th>Stock Health</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredInventory.map((item) => (
                  <InventoryRow
                    key={item.variant_id}
                    item={item}
                    onAdjust={openAdjust}
                    onHistory={openHistory}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredInventory.length > 0 && (
          <footer className="avi-board-footer">
            Showing {filteredInventory.length}
            {" of "}
            {inventory.length}
            {" tracked variants"}
          </footer>
        )}
      </section>

      {/* ADJUSTMENT DIALOG */}
      {adjustOpen && selectedItem && (
        <InventoryAdjustModal
          item={selectedItem}
          form={form}
          saving={saving}
          error={adjustError}
          onChange={handleFormChange}
          onSubmit={handleInventoryUpdate}
          onClose={closeAdjust}
        />
      )}

      {/* HISTORY DIALOG */}
      {historyOpen && (
        <InventoryHistoryModal
          item={historyItem}
          history={history}
          loading={historyLoading}
          error={historyError}
          onClose={() => {
            setHistoryOpen(false);
            setHistoryItem(null);
          }}
        />
      )}
    </div>
  );
}
