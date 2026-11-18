
import "./ProductVariantsPage.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Archive,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Crown,
  Images,
  IndianRupee,
  Layers3,
  LoaderCircle,
  Package,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Star,
  TrendingDown,
  Warehouse,
  X,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { vendorApi } from "../services/api";


const EMPTY_VARIANT = {
  name: "",
  sku: "",
  size_value: "",
  size_unit: "ml",
  price: "",
  compare_at_price: "",
  cost_price: "",
  stock_quantity: "0",
  low_stock_threshold: "5",
  is_default: false,
  is_active: true,
};

const SIZE_UNITS = [
  ["ml", "Millilitres (ml)"],
  ["l", "Litres (L)"],
  ["g", "Grams (g)"],
  ["kg", "Kilograms (kg)"],
  ["pcs", "Pieces"],
  ["capsules", "Capsules"],
  ["tablets", "Tablets"],
];


function unwrapProduct(response) {
  const value =
    response?.data?.product ||
    response?.data ||
    response?.product ||
    response;

  return value &&
    !Array.isArray(value) &&
    typeof value === "object"
    ? value
    : null;
}


function unwrapVariants(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data?.variants)) {
    return response.data.variants;
  }

  if (Array.isArray(response?.variants)) {
    return response.variants;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}


function normalizeVariant(variant) {
  const attributes =
    variant?.attributes &&
    typeof variant.attributes === "object" &&
    !Array.isArray(variant.attributes)
      ? variant.attributes
      : {};

  return {
    ...variant,
    size_value:
      variant.size_value ??
      attributes.size_value ??
      null,
    size_unit:
      variant.size_unit ??
      attributes.size_unit ??
      "ml",
    low_stock_threshold:
      variant.low_stock_threshold ??
      attributes.low_stock_threshold ??
      5,
    is_default:
      Boolean(
        variant.is_default ??
        attributes.is_default ??
        false
      ),
    is_active: variant.is_active !== false,
  };
}


function numberOrNull(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(
    Number(value) || 0
  );
}


function formatCurrency(value) {
  const number = numberOrNull(value);

  if (number === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(number);
}


function formatSize(variant) {
  const value = variant.size_value;

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not specified";
  }

  return `${value} ${variant.size_unit || ""}`;
}


function getStockState(variant) {
  const stock = Number(variant.stock_quantity) || 0;

  const threshold =
    numberOrNull(variant.low_stock_threshold) ?? 5;

  if (stock <= 0) {
    return {
      label: "Out of stock",
      tone: "danger",
    };
  }

  if (stock <= threshold) {
    return {
      label: `${formatNumber(stock)} · Low stock`,
      tone: "warning",
    };
  }

  return {
    label: `${formatNumber(stock)} in stock`,
    tone: "success",
  };
}


function getMargin(priceValue, costValue) {
  if (
    priceValue === "" ||
    costValue === ""
  ) {
    return null;
  }

  const price = numberOrNull(priceValue);
  const cost = numberOrNull(costValue);

  if (
    price === null ||
    cost === null ||
    price <= 0
  ) {
    return null;
  }

  return ((price - cost) / price) * 100;
}


function validateVariant(form) {
  if (!form.name.trim()) {
    return "Variant name is required.";
  }

  if (!form.sku.trim()) {
    return "SKU is required.";
  }

  if (!/^[A-Za-z0-9._-]+$/.test(form.sku.trim())) {
    return "SKU can contain letters, numbers, hyphens, underscores and periods.";
  }

  const price = numberOrNull(form.price);

  if (price === null || price < 0) {
    return "Enter a valid non-negative selling price.";
  }

  for (const field of [
    "compare_at_price",
    "cost_price",
    "size_value",
  ]) {
    const value = form[field];

    if (
      value !== "" &&
      (numberOrNull(value) === null || Number(value) < 0)
    ) {
      return "Price, cost and size values cannot be negative.";
    }
  }

  const mrp = numberOrNull(form.compare_at_price);

  if (mrp !== null && mrp < price) {
    return "MRP / compare price cannot be less than the selling price.";
  }

  for (const field of [
    "stock_quantity",
    "low_stock_threshold",
  ]) {
    const number = numberOrNull(form[field]);

    if (
      number === null ||
      !Number.isSafeInteger(number) ||
      number < 0
    ) {
      return "Stock quantity and low-stock threshold must be non-negative whole numbers.";
    }
  }

  return "";
}


function SummaryCard({
  icon: Icon,
  title,
  value,
  subtitle,
  tone = "green",
}) {
  return (
    <article className="avv-summary-card">
      <span className={`avv-summary-icon avv-tone-${tone}`}>
        <Icon size={22} strokeWidth={1.8} />
      </span>

      <div>
        <span className="avv-summary-title">
          {title}
        </span>

        <strong title={String(value)}>
          {value}
        </strong>

        {subtitle && <small>{subtitle}</small>}
      </div>
    </article>
  );
}


function StatusPill({ text, tone = "neutral" }) {
  return (
    <span className={`avv-pill avv-pill-${tone}`}>
      <span className="avv-pill-dot" />
      {text}
    </span>
  );
}


function VariantRow({
  variant,
  busy,
  onEdit,
  onDeactivate,
}) {
  const stock = getStockState(variant);

  const hasComparePrice =
    numberOrNull(variant.compare_at_price) !== null &&
    Number(variant.compare_at_price) >
      Number(variant.price);

  return (
    <tr>
      <td>
        <div className="avv-variant-identity">
          <span className="avv-variant-icon">
            <Layers3 size={19} />
          </span>

          <div>
            <strong>{variant.name || "Unnamed variant"}</strong>
            <small>{formatSize(variant)}</small>
          </div>
        </div>
      </td>

      <td>
        <code className="avv-sku">
          {variant.sku || "—"}
        </code>
      </td>

      <td>
        <div className="avv-price">
          <strong>{formatCurrency(variant.price)}</strong>

          {hasComparePrice && (
            <small>
              {formatCurrency(variant.compare_at_price)}
            </small>
          )}
        </div>
      </td>

      <td>
        <StatusPill
          text={stock.label}
          tone={stock.tone}
        />
      </td>

      <td>
        {variant.is_default ? (
          <span className="avv-default-label">
            <Star size={14} fill="currentColor" />
            Default
          </span>
        ) : (
          <span className="avv-muted">—</span>
        )}
      </td>

      <td>
        <StatusPill
          text={variant.is_active ? "Active" : "Inactive"}
          tone={
            variant.is_active
              ? "success"
              : "neutral"
          }
        />
      </td>

      <td>
        <div className="avv-row-actions">
          <button
            type="button"
            className="avv-row-edit"
            onClick={() => onEdit(variant)}
            disabled={busy}
            aria-label={`Edit ${variant.name}`}
          >
            <Pencil size={16} />
            Edit
          </button>

          <button
            type="button"
            className="avv-row-deactivate"
            onClick={() => onDeactivate(variant)}
            disabled={busy || !variant.is_active}
            aria-label={`Deactivate ${variant.name}`}
            title={
              variant.is_active
                ? "Deactivate variant"
                : "Already inactive"
            }
          >
            {busy ? (
              <LoaderCircle
                size={17}
                className="avv-spin"
              />
            ) : (
              <Archive size={17} />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}


function VariantField({
  title,
  required = false,
  hint,
  children,
}) {
  return (
    <label className="avv-field">
      <span className="avv-field-label">
        {title}
        {required && <b> *</b>}
      </span>

      {children}

      {hint && <small>{hint}</small>}
    </label>
  );
}


function VariantFormModal({
  form,
  editing,
  inventoryLocked = false,
  saving,
  error,
  onChange,
  onSubmit,
  onClose,
}) {
  const margin = getMargin(
    form.price,
    form.cost_price
  );

  useEffect(() => {
    function onEscape(event) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }

    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener(
        "keydown",
        onEscape
      );
    };
  }, [onClose, saving]);

  return (
    <div
      className="avv-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        className="avv-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avv-modal-title"
      >
        <header className="avv-modal-header">
          <div>
            <span className="avv-eyebrow">
              {editing ? "EDIT PRODUCT OPTION" : "NEW PRODUCT OPTION"}
            </span>

            <h2 id="avv-modal-title">
              {editing ? "Edit Variant" : "Add a Variant"}
            </h2>

            <p>
              Set the product option's name, price,
              stock and availability.
            </p>
          </div>

          <button
            type="button"
            className="avv-modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close variant form"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={onSubmit} className="avv-modal-form">
          {error && (
            <div className="avv-alert avv-alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="avv-form-section">
            <div className="avv-form-section-heading">
              <Layers3 size={19} />
              <strong>Variant Information</strong>
            </div>

            <div className="avv-form-grid">
              <VariantField title="Variant Name" required>
                <input
                  autoFocus
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="e.g. 200 ml"
                  required
                  maxLength={100}
                />
              </VariantField>

              <VariantField title="SKU" required>
                <input
                  name="sku"
                  value={form.sku}
                  onChange={onChange}
                  placeholder="e.g. BHR-OIL-200"
                  required
                  maxLength={100}
                />
              </VariantField>

              <VariantField title="Size Value">
                <input
                  type="number"
                  name="size_value"
                  min="0"
                  step="any"
                  value={form.size_value}
                  onChange={onChange}
                  placeholder="e.g. 200"
                />
              </VariantField>

              <VariantField title="Size Unit">
                <select
                  name="size_unit"
                  value={form.size_unit}
                  onChange={onChange}
                >
                  {SIZE_UNITS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </VariantField>
            </div>
          </div>

          <div className="avv-form-section">
            <div className="avv-form-section-heading">
              <IndianRupee size={19} />
              <strong>Pricing Information</strong>
            </div>

            <div className="avv-form-grid">
              <VariantField title="Selling Price (₹)" required>
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={onChange}
                  placeholder="349.00"
                  required
                />
              </VariantField>

              <VariantField title="MRP / Compare Price (₹)">
                <input
                  type="number"
                  name="compare_at_price"
                  min="0"
                  step="0.01"
                  value={form.compare_at_price}
                  onChange={onChange}
                  placeholder="399.00"
                />
              </VariantField>

              <VariantField title="Cost Price (₹)">
                <input
                  type="number"
                  name="cost_price"
                  min="0"
                  step="0.01"
                  value={form.cost_price}
                  onChange={onChange}
                  placeholder="200.00"
                />
              </VariantField>

              <div className="avv-margin">
                <span>Estimated Gross Margin</span>
                <strong>
                  {margin === null
                    ? "—"
                    : `${margin.toFixed(1)}%`}
                </strong>
                <small>
                  Before fees, taxes and other costs
                </small>
              </div>
            </div>
          </div>

          <div className="avv-form-section">
            <div className="avv-form-section-heading">
              <Warehouse size={19} />
              <strong>Inventory</strong>
            </div>

            <div className="avv-form-grid">
              <VariantField title="Stock Quantity" required>
                <input
                  type="number"
                  name="stock_quantity"
                  disabled={inventoryLocked}
                  min="0"
                  step="1"
                  value={form.stock_quantity}
                  onChange={onChange}
                  required
                />
              </VariantField>

              <VariantField
                title="Low Stock Alert Level"
                required
                hint="A stock alert is shown when the quantity reaches this level."
              >
                <input
                  type="number"
                  name="low_stock_threshold"
                  disabled={inventoryLocked}
                  min="0"
                  step="1"
                  value={form.low_stock_threshold}
                  onChange={onChange}
                  required
                />
              </VariantField>
            </div>
          </div>

          <div className="avv-form-options">
            <label className="avv-option">
              <input
                type="checkbox"
                name="is_default"
                checked={form.is_default}
                onChange={onChange}
              />

              <div>
                <strong>Default Variant</strong>
                <small>
                  Preselect this variant for customers.
                </small>
              </div>
            </label>

            <label className="avv-option">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={onChange}
              />

              <div>
                <strong>Active Variant</strong>
                <small>
                  Keep this option available in your catalogue.
                </small>
              </div>
            </label>
          </div>

          <footer className="avv-modal-actions">
            <button
              type="button"
              className="avv-button avv-button-light"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="avv-button avv-button-primary"
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle size={18} className="avv-spin" />
              ) : (
                <Save size={18} />
              )}

              {saving
                ? "Saving..."
                : editing
                  ? "Update Variant"
                  : "Save Variant"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}


export default function ProductVariantsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [revision, setRevision] = useState(null);
  const [variantsReady, setVariantsReady] = useState(false);

  const productStatus =
    String(product?.status || "").toLowerCase();

  const revisionMode =
    productStatus === "active" &&
    ["draft", "pending"].includes(revision?.status);

  const canEdit =
    variantsReady &&
    (
      ["draft", "rejected"].includes(productStatus) ||
      (revisionMode && revision?.status === "draft")
    );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const [form, setForm] = useState({
    ...EMPTY_VARIANT,
  });


  const loadPage = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setPageError("");

      try {
        setVariantsReady(false);

        const productResponse =
          await vendorApi.getProduct(productId);

        const productData = unwrapProduct(productResponse);

        let currentRevision = null;

        if (String(productData?.status).toLowerCase() === "active") {
          try {
            const response =
              await vendorApi.getRevision(productId);

            const candidate =
              response?.data?.revision ??
              response?.revision ??
              response?.data ??
              response;

            currentRevision = candidate?.id ? candidate : null;
          } catch (err) {
            if (err?.status !== 404) throw err;
          }
        }

        const useRevision =
          ["draft", "pending"].includes(currentRevision?.status);

        const variantResponse = useRevision
          ? await vendorApi.getRevisionVariants(productId)
          : await vendorApi.getProductVariants(productId);

        setRevision(currentRevision);
        setVariantsReady(true);

        setProduct(unwrapProduct(productResponse));

        setVariants(
          unwrapVariants(variantResponse).map(
            normalizeVariant
          )
        );

        setLoaded(true);
        return true;
      } catch (err) {
        setPageError(
          err?.message ||
          "Unable to load product variants."
        );

        return false;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [productId]
  );


  useEffect(() => {
    setLoaded(false);
    setProduct(null);
    setVariants([]);
    setShowForm(false);
    setPageError("");
    setSuccess("");

    loadPage();
  }, [loadPage]);


  const summary = useMemo(() => {
    const active = variants.filter(
      (variant) => variant.is_active
    );

    const totalStock = active.reduce(
      (sum, variant) =>
        sum + (Number(variant.stock_quantity) || 0),
      0
    );

    const lowStock = active.filter((variant) => {
      const stock =
        Number(variant.stock_quantity) || 0;

      const threshold =
        numberOrNull(variant.low_stock_threshold) ?? 5;

      return stock <= threshold;
    }).length;

    const defaultVariant = variants.find(
      (variant) => variant.is_default
    );

    return {
      total: variants.length,
      active: active.length,
      totalStock,
      lowStock,
      defaultVariant,
    };
  }, [variants]);


  function openCreateForm() {
    if (!canEdit) return;
    setEditingVariant(null);

    setForm({
      ...EMPTY_VARIANT,
      is_default: variants.length === 0,
    });

    setFormError("");
    setShowForm(true);
  }


  function openEditForm(variant) {
    if (!canEdit) return;
    setEditingVariant(variant);

    setForm({
      name: variant.name || "",
      sku: variant.sku || "",
      size_value: variant.size_value ?? "",
      size_unit: variant.size_unit || "ml",
      price: variant.price ?? "",
      compare_at_price:
        variant.compare_at_price ?? "",
      cost_price: variant.cost_price ?? "",
      stock_quantity:
        String(variant.stock_quantity ?? 0),
      low_stock_threshold:
        String(variant.low_stock_threshold ?? 5),
      is_default: Boolean(variant.is_default),
      is_active: variant.is_active !== false,
    });

    setFormError("");
    setShowForm(true);
  }


  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingVariant(null);
    setFormError("");
  }


  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setFormError("");
  }


  async function handleSubmit(event) {
    event.preventDefault();

    if (!canEdit || saving) {
      return;
    }

    const validationError = validateVariant(form);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError("");
    setPageError("");
    setSuccess("");

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      size_value: numberOrNull(form.size_value),
      size_unit: form.size_unit || null,
      price: Number(form.price),
      compare_at_price:
        numberOrNull(form.compare_at_price),
      cost_price:
        numberOrNull(form.cost_price),
      stock_quantity:
        Number(form.stock_quantity),
      low_stock_threshold:
        Number(form.low_stock_threshold),
      is_default: Boolean(form.is_default),
      is_active: Boolean(form.is_active),
    };

    const isEditing = Boolean(editingVariant);

    try {
      if (isEditing) {
        if (revisionMode) {
          const revisionPayload = { ...payload };

          delete revisionPayload.stock_quantity;
          delete revisionPayload.low_stock_threshold;

          await vendorApi.updateRevisionVariant(
            productId,
            editingVariant.id,
            revisionPayload
          );
        } else {
          await vendorApi.updateProductVariant(
            editingVariant.id,
            payload
          );
        }
      } else {
        if (revisionMode) {
          await vendorApi.createRevisionVariant(
            productId,
            payload
          );
        } else {
          await vendorApi.createProductVariant(
            productId,
            payload
          );
        }
      }

      setShowForm(false);
      setEditingVariant(null);

      setSuccess(
        isEditing
          ? "Variant updated successfully."
          : "Variant added successfully."
      );

      await loadPage(true);
    } catch (err) {
      setFormError(
        err?.message ||
        "Unable to save variant."
      );
    } finally {
      setSaving(false);
    }
  }


  async function handleDeactivate() {
    const variant = deactivateTarget;

    if (!canEdit || !variant || deletingId) {
      return;
    }

    setDeletingId(variant.id);
    setDeactivateTarget(null);
    setPageError("");
    setSuccess("");

    try {
      if (revisionMode) {
        await vendorApi.deleteRevisionVariant(
          productId,
          variant.id
        );
      } else {
        await vendorApi.deleteProductVariant(
          variant.id
        );
      }

      setSuccess(
        `"${variant.name}" was deactivated.`
      );

      await loadPage(true);
    } catch (err) {
      setPageError(
        err?.message ||
        "Unable to deactivate variant."
      );
    } finally {
      setDeletingId(null);
    }
  }


  if (loading && !loaded) {
    return (
      <div className="avv-page">
        <div className="avv-loading">
          <LoaderCircle
            size={32}
            className="avv-spin"
          />

          <strong>Loading product variants</strong>
          <p>Retrieving pricing and stock details.</p>
        </div>
      </div>
    );
  }


  if (pageError && !loaded) {
    return (
      <div className="avv-page">
        <div className="avv-loading">
          <AlertCircle size={32} />

          <h2>Unable to load variants</h2>
          <p>{pageError}</p>

          <button
            type="button"
            className="avv-button avv-button-primary"
            onClick={() => loadPage()}
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="avv-page">

      <header className="avv-page-header">
        <div>
          <button
            type="button"
            className="avv-back-link"
            onClick={() => navigate("/products")}
          >
            <ArrowLeft size={17} />
            Back to Products
          </button>

          <span className="avv-eyebrow">
            PRODUCT MANAGEMENT
          </span>

          <h1>
            {product?.name || "Product Variants"}
          </h1>

          <p>
            Manage product sizes, SKUs, selling prices,
            inventory and customer availability.
          </p>
        </div>

        <div className="avv-header-actions">
          <button
            type="button"
            className="avv-button avv-button-light"
            disabled={refreshing}
            onClick={() => loadPage(true)}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "avv-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            className="avv-button avv-button-primary"
            disabled={!canEdit}
            onClick={openCreateForm}
          >
            <Plus size={18} />
            Add Variant
          </button>
        </div>
      </header>


      {revisionMode && (
        <div className="avv-alert">
          Revision status: {revision.status}.
          Pricing and variant changes require Admin approval.
          Existing stock is managed separately through Inventory.
        </div>
      )}

      {!canEdit && (
        <div className="avv-alert">
          {revision?.status === "pending"
            ? "Revision awaiting Admin approval. Editing is locked."
            : "Create a product revision to edit published variants."}
        </div>
      )}

      {pageError && (
        <div className="avv-alert avv-alert-error" role="alert">
          <AlertCircle size={19} />
          <span>{pageError}</span>
        </div>
      )}

      {success && (
        <div className="avv-alert avv-alert-success" role="status">
          <CheckCircle2 size={19} />
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
          >
            <X size={17} />
          </button>
        </div>
      )}


      <section className="avv-summary">
        <SummaryCard
          icon={Layers3}
          title="Total Variants"
          value={formatNumber(summary.total)}
          subtitle="Product options"
        />

        <SummaryCard
          icon={PackageCheck}
          title="Active Variants"
          value={formatNumber(summary.active)}
          subtitle="Currently enabled"
          tone="sage"
        />

        <SummaryCard
          icon={Warehouse}
          title="Available Stock"
          value={formatNumber(summary.totalStock)}
          subtitle="Units across active variants"
        />

        <SummaryCard
          icon={TrendingDown}
          title="Stock Alerts"
          value={formatNumber(summary.lowStock)}
          subtitle="Low or out-of-stock options"
          tone="warning"
        />
      </section>


      <section className="avv-catalogue">
        <div className="avv-catalogue-header">
          <div>
            <span className="avv-eyebrow">
              PRODUCT OPTIONS
            </span>

            <h2>Variant Management</h2>

            <p>
              View and update the pricing and stock
              of each product variant.
            </p>
          </div>

          <span className="avv-count">
            {summary.total} variants
          </span>
        </div>

        {variants.length === 0 ? (
          <div className="avv-empty">
            <span className="avv-empty-icon">
              <Layers3 size={31} />
            </span>

            <h3>No variants added yet</h3>

            <p>
              Add at least one product variant to
              configure its selling price, SKU and stock.
            </p>

            <button
              type="button"
              className="avv-button avv-button-primary"
              disabled={!canEdit}
            onClick={openCreateForm}
            >
              <Plus size={18} />
              Add First Variant
            </button>
          </div>
        ) : (
          <div className="avv-table-scroll">
            <table className="avv-table">
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>SKU</th>
                  <th>Selling Price</th>
                  <th>Stock</th>
                  <th>Default</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {variants.map((variant) => (
                  <VariantRow
                    key={variant.id}
                    variant={variant}
                    busy={
                      !canEdit ||
                      deletingId === variant.id ||
                      refreshing
                    }
                    onEdit={openEditForm}
                    onDeactivate={setDeactivateTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>


      <div className="avv-bottom-actions">
        <button
          type="button"
          className="avv-button avv-button-light"
          onClick={() => navigate("/products")}
        >
          <ArrowLeft size={17} />
          Back to Catalogue
        </button>

        <button
          type="button"
          className="avv-button avv-button-primary"
          disabled={variants.length === 0}
          onClick={() =>
            navigate(`/products/${productId}/images`)
          }
        >
          <Images size={18} />
          Continue to Images
          <ArrowRight size={17} />
        </button>
      </div>


      {showForm && (
        <VariantFormModal
          form={form}
          editing={Boolean(editingVariant)}
          inventoryLocked={revisionMode && Boolean(editingVariant)}
          saving={saving}
          error={formError}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}


      {deactivateTarget && (
        <div
          className="avv-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeactivateTarget(null);
            }
          }}
        >
          <section
            className="avv-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="avv-confirm-title"
          >
            <span className="avv-confirm-icon">
              <Archive size={25} />
            </span>

            <h2 id="avv-confirm-title">
              Deactivate this variant?
            </h2>

            <p>
              <strong>{deactivateTarget.name}</strong>
              {" "}will be marked inactive. You can
              review its details in the variant list.
            </p>

            <div className="avv-confirm-actions">
              <button
                type="button"
                className="avv-button avv-button-light"
                onClick={() => setDeactivateTarget(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="avv-button avv-button-danger"
                onClick={handleDeactivate}
              >
                <Archive size={17} />
                Deactivate
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
