
import "./ProductsPage.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Archive,
  Trash2,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  FilePenLine,
  Images,
  Layers3,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Send,
  SlidersHorizontal,
  Star,
  Warehouse,
  X,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { vendorApi } from "../services/api";


/* ============================================================
   AUMVEDA VENDOR WEB — PRODUCTS PAGE

   Product approval flow:
   draft -> pending -> active / rejected

   Vendor can submit draft and rejected products.
   Only authorized operators can approve or reject.

   This page never changes approval status directly.
   It calls the dedicated Vendor Backend API.
============================================================ */


/* ============================================================
   UTILITIES
============================================================ */

function normalizeProducts(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.products)) {
    return response.products;
  }

  if (Array.isArray(response?.data?.products)) {
    return response.data.products;
  }

  return [];
}


function normalizeStatus(value) {
  return String(value || "draft")
    .trim()
    .toLowerCase();
}


function formatStatus(value) {
  return normalizeStatus(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}


function formatNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? new Intl.NumberFormat("en-IN").format(number)
    : "—";
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}


function getVariantCount(product) {
  if (product.variant_count != null) {
    return Number(product.variant_count) || 0;
  }

  if (Array.isArray(product.variants)) {
    return product.variants.length;
  }

  return 0;
}


function getProductStock(product) {
  if (product.total_stock != null) {
    const amount = Number(product.total_stock);

    return Number.isFinite(amount)
      ? amount
      : null;
  }

  if (Array.isArray(product.variants)) {
    return product.variants.reduce(
      (total, variant) =>
        total + (
          Number(variant.stock_quantity) || 0
        ),
      0
    );
  }

  return null;
}


function getImageUrl(product) {
  const candidates = [
    product.primary_image_url,
    product.image_url,
    product.image,
    product.primary_image,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === "string" &&
      candidate.trim()
    ) {
      return candidate;
    }

    if (
      candidate &&
      typeof candidate === "object" &&
      typeof candidate.image_url === "string"
    ) {
      return candidate.image_url;
    }
  }

  return null;
}


function canSubmitForApproval(product) {
  const currentStatus = normalizeStatus(
    product?.status
  );

  return (
    currentStatus === "draft" ||
    currentStatus === "rejected"
  );
}


function canArchiveProduct(product) {
  const currentStatus = normalizeStatus(
    product?.status
  );

  return (
    currentStatus === "draft" ||
    currentStatus === "rejected" ||
    currentStatus === "active"
  );
}


function isContentEditable(product) {
  return canSubmitForApproval(product);
}


/* ============================================================
   STAT CARD
============================================================ */

function ProductStat({
  icon: Icon,
  label,
  value,
  tone = "green",
}) {
  return (
    <div className={`avp-stat avp-stat--${tone}`}>
      <div className="avp-stat-icon">
        <Icon
          size={21}
          strokeWidth={1.8}
        />
      </div>

      <div className="avp-stat-info">
        <span>{label}</span>
        <strong>{formatNumber(value)}</strong>
      </div>
    </div>
  );
}


/* ============================================================
   PRODUCT THUMBNAIL
============================================================ */

function ProductThumbnail({ product }) {
  const [broken, setBroken] = useState(false);

  const url = getImageUrl(product);

  useEffect(() => {
    setBroken(false);
  }, [url]);

  return (
    <div className="avp-thumbnail">
      {url && !broken ? (
        <img
          src={url}
          alt={product.name || "Product"}
          loading="lazy"
          onError={() => setBroken(true)}
        />
      ) : (
        <Package
          size={25}
          strokeWidth={1.5}
        />
      )}
    </div>
  );
}


/* ============================================================
   PRODUCT ROW
============================================================ */


function ProductRevisionEditor({ product, onClose }) {
  const [revision, setRevision] = useState(null);
  const [form, setForm] = useState({});
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  const fields = [
    ["name", "Product Name"],
    ["short_description", "Short Description"],
    ["description", "Description"],
    ["ingredients", "Ingredients"],
    ["benefits", "Benefits"],
    ["directions", "Directions"],
    ["warnings", "Warnings"],
  ];

  function applyRevision(response) {
    const value =
      response?.data?.revision ??
      response?.revision ??
      response?.data ??
      response;

    if (!value?.id || !value?.status) {
      throw new Error("Invalid revision response.");
    }

    setRevision(value);
    setForm(value.product_data || {});
  }

  async function perform(action) {
    if (working) return;

    setWorking(true);
    setMessage("");

    try {
      await action();
    } catch (err) {
      setMessage(err?.message || "Unable to complete action.");
    } finally {
      setWorking(false);
    }
  }

  async function loadRevision() {
    try {
      const response = await vendorApi.getRevision(product.id);
      if (response) applyRevision(response);
    } catch (err) {
      if (err?.status !== 404) throw err;
    }
  }

  useEffect(() => {
    perform(loadRevision);
  }, [product.id]);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div className="aum-revision-modal" role="dialog" aria-modal="true" style={{
        background: "#FFFFFF",
        color: "#111827",
        width: "min(960px, 100%)",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: 24,
        borderRadius: 14,
      }}>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          
        <style>{`
          .aum-revision-modal {
            box-sizing: border-box !important;
            min-width: 0;
            overflow-x: hidden !important;
            padding: 28px !important;
            border-radius: 20px !important;
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
            font-family: inherit;
          }

          .aum-revision-modal *,
          .aum-revision-modal *::before,
          .aum-revision-modal *::after {
            box-sizing: border-box;
          }

          .aum-revision-modal h2 {
            font-size: 24px;
            color: #173E32;
            font-weight: 700;
            margin: 0;
          }

          .aum-revision-modal > p {
            font-size: 13px;
            line-height: 1.6;
            color: #64748B;
            margin: 12px 0;
          }

          .aum-revision-close {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border: 1px solid #DCE5DF;
            border-radius: 10px;
            background: #F5F8F6;
            color: #173E32;
            cursor: pointer;
          }

          .aum-revision-close:hover {
            background: #E5EDE8;
          }

          .aum-revision-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
            margin-top: 24px;
            width: 100%;
            min-width: 0;
          }

          .aum-revision-field {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px;
            width: 100%;
            min-width: 0;
            margin: 0 !important;
          }

          .aum-revision-field strong {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #173E32;
          }

          .aum-revision-field textarea {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            margin: 0 !important;
            padding: 12px 14px !important;
            border: 1px solid #DCE5DF !important;
            border-radius: 10px !important;
            background: #FAFCFA;
            font-family: inherit;
            font-size: 14px;
            line-height: 1.5;
            color: #263B32;
            resize: vertical;
            outline: none;
          }

          .aum-revision-field textarea:focus {
            border-color: #397A58 !important;
            box-shadow: 0 0 0 3px rgba(57, 122, 88, 0.1);
          }

          .aum-revision-field-name,
          .aum-revision-field-short_description,
          .aum-revision-field-description {
            grid-column: 1 / -1;
          }

          .aum-revision-field-name textarea {
            min-height: 46px;
            resize: none;
          }

          .aum-revision-footer {
            position: sticky;
            bottom: 0;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
            background: #FFFFFF;
            border-top: 1px solid #E5EDE8;
            margin-top: 24px;
            padding: 18px 0 4px;
          }

          .aum-revision-footer button {
            display: inline-flex !important;
            justify-content: center;
            align-items: center;
            gap: 8px;
            margin: 0 !important;
            padding: 12px 20px !important;
            border-radius: 10px !important;
            font-weight: 600;
            cursor: pointer;
          }

          .aum-revision-footer button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          @media (max-width: 640px) {
            .aum-revision-modal {
              padding: 18px !important;
            }

            .aum-revision-grid {
              grid-template-columns: minmax(0, 1fr);
              gap: 15px;
            }

            .aum-revision-footer {
              flex-direction: column;
              align-items: stretch;
            }

            .aum-revision-footer button {
              width: 100%;
            }
          }
        `}</style>

          <h2>Edit Product</h2>
          <button className="aum-revision-close" type="button" aria-label="Close editor" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p>
          Product changes require Admin approval.
          Your existing published product remains unchanged.
        </p>

        {!!revision && (
          <p><strong>Status:</strong> {revision.status}</p>
        )}

        {!!revision?.rejection_reason && (
          <p style={{ color: "#B91C1C" }}>
            Rejection reason: {revision.rejection_reason}
          </p>
        )}

        {(!revision ||
          ["approved", "rejected"].includes(revision.status)) && (
          <button
            type="button"
            className="avp-action-button"
            disabled={working}
            onClick={() => perform(async () => {
              applyRevision(
                await vendorApi.createRevision(product.id)
              );
            })}
          >
            Create Revision
          </button>
        )}

        {revision?.status === "draft" && (
          <>
            <div className="aum-revision-grid">
            {fields.map(([key, label]) => (
              <label className={`aum-revision-field aum-revision-field-${key}`} key={key} style={{
                display: "block",
                marginTop: 14,
              }}>
                <strong>{label}</strong>

                <textarea
                  rows={key === "name" ? 1 : 3}
                  disabled={working}
                  value={String(form[key] ?? "")}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      [key]: event.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: 10,
                    border: "1px solid #D1D5DB",
                    borderRadius: 8,
                    boxSizing: "border-box",
                  }}
                />
              </label>
            ))}
            </div>

            <div className="aum-revision-footer">
            <button
              type="button"
              className="avp-action-button"
              disabled={working}
              style={{ marginTop: 16 }}
              onClick={() => perform(async () => {
                if (!String(form.name || "").trim()) {
                  throw new Error("Product name is required.");
                }

                const payload = Object.fromEntries(
                  fields.map(([key]) => [key, form[key] ?? ""])
                );

                await vendorApi.updateRevision(product.id, payload);
                await loadRevision();
                setMessage("Revision draft saved successfully.");
              })}
            >
              Save Revision Draft
            </button>

            <button
              type="button"
              className="avp-action-button"
              disabled={working}
              style={{
                marginTop: 16,
                marginLeft: 10,
                background: "#166534",
                color: "#FFFFFF",
              }}
              onClick={() => {
                const confirmed = window.confirm(
                  "Submit this product revision for Admin approval? The current published product will remain unchanged until approval."
                );

                if (!confirmed) return;

                perform(async () => {
                  if (!String(form.name || "").trim()) {
                    throw new Error("Product name is required.");
                  }

                  const payload = Object.fromEntries(
                    fields.map(([key]) => [
                      key,
                      form[key] ?? "",
                    ])
                  );

                  await vendorApi.updateRevision(
                    product.id,
                    payload
                  );

                  await vendorApi.submitRevision(product.id);

                  await loadRevision();

                  setMessage(
                    "Product revision submitted for Admin approval."
                  );
                });
              }}
            >
              <Send size={16} />
              Submit Revision for Approval
            </button>
            </div>

          </>
        )}

        {revision?.status === "pending" && (
          <p>Awaiting Admin approval. Editing is locked.</p>
        )}

        {working && <p>Processing...</p>}
        {!!message && <p>{message}</p>}

      </div>
    </div>
  );
}

function ProductRow({
  product,
  archiving,
  submitting,
  onArchive,
  onDeletionComplete,
  onSubmitForApproval,
}) {
  const navigate = useNavigate();
  const [revisionOpen, setRevisionOpen] = useState(false);

  const currentStatus = normalizeStatus(
    product.status
  );


  const [deletion, setDeletion] = useState(null);
  const [deletionOpen, setDeletionOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [deletionBusy, setDeletionBusy] = useState(false);
  const [deletionError, setDeletionError] = useState("");
  const [deletionLoading, setDeletionLoading] = useState(
    currentStatus === "active"
  );

  const deletionPending = deletion?.status === "pending";

  const canDelete =
    currentStatus === "draft" ||
    currentStatus === "active";

  useEffect(() => {
    let cancelled = false;

    if (currentStatus !== "active") {
      setDeletion(null);
      setDeletionLoading(false);
      return;
    }

    setDeletionLoading(true);
    setDeletionError("");

    vendorApi.getProductDeletionRequest(product.id)
      .then((response) => {
        if (!cancelled) {
          setDeletion(response?.data ?? null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setDeletionError(
            error?.message ||
            "Unable to load deletion status."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDeletionLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [product, currentStatus]);

  function openDeletionDialog() {
    setDeletionReason("");
    setDeletionError("");
    setDeletionOpen(true);
  }

  async function handleDeletion() {

    if (deletionBusy || deletionPending) return;

    if (
      currentStatus === "active" &&
      !deletionReason.trim()
    ) {
      setDeletionError("Please enter a deletion reason.");
      return;
    }

    setDeletionBusy(true);
    setDeletionError("");

    try {

      if (currentStatus === "draft") {

        await vendorApi.deleteDraftProduct(product.id);

      } else {

        const response =
          await vendorApi.requestProductDeletion(
            product.id,
            deletionReason.trim()
          );

        setDeletion(response?.data ?? null);

      }

      setDeletionOpen(false);

      await onDeletionComplete?.();

    } catch (error) {

      setDeletionError(
        error?.message ||
        "Unable to process product deletion."
      );

    } finally {
      setDeletionBusy(false);
    }
  }

  const stock = getProductStock(product);

  const variantCount = getVariantCount(product);

  const rating = Number(product.average_rating);

  const ratingAvailable =
    Number(product.review_count || 0) > 0 &&
    Number.isFinite(rating);

  const allowSubmit = canSubmitForApproval(
    product
  );

  const allowArchive = canArchiveProduct(
    product
  );

  const allowContentEditing = isContentEditable(
    product
  );

  const busy = archiving || submitting;

  return (
    <tr>
      {/* PRODUCT IDENTITY */}
      <td>
        <div className="avp-product-identity">
          <ProductThumbnail product={product} />

          <div className="avp-product-details">
            <strong title={product.name}>
              {product.name || "Unnamed Product"}
            </strong>

            <span title={product.slug || ""}>
              {product.slug || "No product slug"}
            </span>
          </div>
        </div>
      </td>

      {/* APPROVAL STATUS */}
      <td>
        <span
          className={
            `avp-status avp-status--${currentStatus}`
          }
        >
          <span className="avp-status-dot" />
          {formatStatus(currentStatus)}
        </span>

        {deletionPending && (
          <div className="avp-deletion-pending">
            Deletion Pending Approval
          </div>
        )}

        {deletion?.status === "rejected" && (
          <div className="avp-deletion-rejected">
            <strong>Deletion Rejected</strong>
            <span>{deletion.rejection_reason}</span>
          </div>
        )}

        {deletionError && !deletionOpen && (
          <div className="avp-deletion-rejected">
            {deletionError}
          </div>
        )}
      </td>

      {/* VARIANTS */}
      <td>
        <div className="avp-table-number">
          <Layers3 size={16} />
          {formatNumber(variantCount)}
        </div>
      </td>

      {/* STOCK */}
      <td>
        <div className="avp-stock-cell">
          <strong>
            {stock === null
              ? "—"
              : formatNumber(stock)}
          </strong>

          <small>
            {stock === null
              ? "Stock unavailable"
              : stock === 0
                ? "Out of stock"
                : "Units in stock"}
          </small>
        </div>
      </td>

      {/* RATING */}
      <td>
        {ratingAvailable ? (
          <span className="avp-rating">
            <Star
              size={15}
              fill="currentColor"
            />

            {rating.toFixed(1)}

            <small>
              ({formatNumber(product.review_count)})
            </small>
          </span>
        ) : (
          <span className="avp-muted">
            No reviews
          </span>
        )}
      </td>

      {/* LAST UPDATED */}
      <td>
        <span className="avp-date">
          {formatDate(product.updated_at)}
        </span>
      </td>

      {/* ACTIONS */}
      <td>
        <div
          className="avp-row-actions"
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {currentStatus === "active" && (
            <button
              type="button"
              className="avp-action-button"
              disabled={deletionPending || deletionLoading}
              onClick={() => setRevisionOpen(true)}
            >
              <FilePenLine size={16} />
              <span>Edit Product</span>
            </button>
          )}

          {revisionOpen && (
            <ProductRevisionEditor
              product={product}
              onClose={() => setRevisionOpen(false)}
            />
          )}

          {/* VARIANTS */}
          <button
            type="button"
            className="avp-action-button"
            title={
              allowContentEditing
                ? "Manage product variants"
                : (
                  currentStatus === "active"
                    ? "View approved variants; inventory updates remain available separately"
                    : "View product variants (editing locked)"
                )
            }
            aria-label={
              `View variants for ${product.name}`
            }
            onClick={() =>
              navigate(
                `/products/${product.id}/variants`
              )
            }
          >
            <Layers3 size={16} />

            <span>
              Variants
            </span>
          </button>

          {/* IMAGES */}
          <button
            type="button"
            className="avp-icon-action"
            title={
              allowContentEditing
                ? "Manage product images"
                : "View product images (editing locked)"
            }
            aria-label={
              `View images for ${product.name}`
            }
            onClick={() =>
              navigate(
                `/products/${product.id}/images`
              )
            }
          >
            <Images size={17} />
          </button>

          {/* SUBMIT FOR APPROVAL */}
          {allowSubmit && (
            <button
              type="button"
              className="avp-action-button"
              title={
                currentStatus === "rejected"
                  ? "Resubmit product for approval"
                  : "Submit product for approval"
              }
              aria-label={
                `Submit ${product.name} for approval`
              }
              disabled={busy}
              onClick={() =>
                onSubmitForApproval(product)
              }
              style={{
                whiteSpace: "nowrap",
              }}
            >
              {submitting ? (
                <RefreshCw
                  size={16}
                  className="avp-spin"
                />
              ) : (
                <Send size={16} />
              )}

              <span>
                {submitting
                  ? "Submitting..."
                  : currentStatus === "rejected"
                    ? "Resubmit"
                    : "Submit"}
              </span>
            </button>
          )}

          {/* PRODUCT DELETION */}

          {canDelete && (
            <button
              type="button"
              className="avp-delete-product-button"
              disabled={
                busy ||
                deletionBusy ||
                deletionLoading ||
                deletionPending
              }
              onClick={openDeletionDialog}
              title={
                deletionPending
                  ? "Deletion awaiting Admin approval"
                  : "Delete product"
              }
            >
              <Trash2 size={16} />

              <span>
                {deletionPending
                  ? "Deletion Pending"
                  : "Delete Product"}
              </span>
            </button>
          )}

          {deletionOpen && (
            <div className="avp-deletion-overlay">

              <div
                className="avp-deletion-dialog"
                role="dialog"
                aria-modal="true"
                aria-label="Delete Product"
              >

                <div className="avp-deletion-header">

                  <div className="avp-deletion-icon">
                    <Trash2 size={25} />
                  </div>

                  <button
                    type="button"
                    className="avp-deletion-close"
                    aria-label="Close dialog"
                    disabled={deletionBusy}
                    onClick={() => setDeletionOpen(false)}
                  >
                    <X size={21} />
                  </button>

                </div>

                <h2>Delete Product</h2>

                <p className="avp-deletion-name">
                  {product.name}
                </p>

                <p className="avp-deletion-description">
                  {currentStatus === "draft"
                    ? "This unpublished draft will be removed from your product catalogue."
                    : "This request requires Admin approval. Your product will remain available to customers until the request is approved."}
                </p>

                {currentStatus === "active" && (
                  <div className="avp-deletion-field">

                    <label htmlFor={`delete-reason-${product.id}`}>
                      Deletion Reason *
                    </label>

                    <textarea
                      id={`delete-reason-${product.id}`}
                      rows={4}
                      maxLength={1000}
                      value={deletionReason}
                      disabled={deletionBusy}
                      placeholder="Enter your reason for deleting this product..."
                      onChange={(event) =>
                        setDeletionReason(event.target.value)
                      }
                    />

                    <small>
                      {deletionReason.length}/1000
                    </small>

                  </div>
                )}

                {deletionError && (
                  <div
                    role="alert"
                    className="avp-deletion-error"
                  >
                    {deletionError}
                  </div>
                )}

                <div className="avp-deletion-footer">

                  <button
                    type="button"
                    className="avp-deletion-cancel"
                    disabled={deletionBusy}
                    onClick={() => setDeletionOpen(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="avp-deletion-confirm"
                    disabled={
                      deletionBusy ||
                      (
                        currentStatus === "active" &&
                        !deletionReason.trim()
                      )
                    }
                    onClick={handleDeletion}
                  >
                    <Trash2 size={16} />

                    {deletionBusy
                      ? "Processing..."
                      : currentStatus === "draft"
                        ? "Delete Draft"
                        : "Request Deletion"}
                  </button>

                </div>

              </div>
            </div>
          )}

          {/* EXISTING ARCHIVE ACTION */}
          {!canDelete && (
          <button
            type="button"
            className={
              "avp-icon-action " +
              "avp-icon-action--danger"
            }
            title={
              currentStatus === "pending"
                ? "Cannot archive during approval review"
                : currentStatus === "archived"
                  ? "Already archived"
                  : "Archive product"
            }
            aria-label={
              `Archive ${product.name}`
            }
            disabled={
              busy || !allowArchive
            }
            onClick={() => onArchive(product)}
          >
            {archiving ? (
              <RefreshCw
                size={17}
                className="avp-spin"
              />
            ) : (
              <Archive size={17} />
            )}
          </button>
          )}
        </div>
      </td>
    </tr>
  );
}


/* ============================================================
   PRODUCTS PAGE
============================================================ */

export default function ProductsPage() {
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Archive operation.
  const [archivingId, setArchivingId] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);

  // Submit for approval operation.
  const [submittingId, setSubmittingId] = useState(null);
  const [submitTarget, setSubmitTarget] = useState(null);


  /* ==========================================================
     LOAD PRODUCTS
  ========================================================== */

  const loadProducts = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await vendorApi.getProducts();

        setProducts(normalizeProducts(response));
        setLoadedOnce(true);

        return true;
      } catch (err) {
        setError(
          err?.message ||
          "Unable to load the product catalogue."
        );

        return false;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );


  useEffect(() => {
    loadProducts();
  }, [loadProducts]);


  /* ==========================================================
     PRODUCT SUMMARY
  ========================================================== */

  const summary = useMemo(() => {
    return products.reduce(
      (totals, product) => {
        const current = normalizeStatus(
          product.status
        );

        totals.total += 1;

        if (current === "active") {
          totals.active += 1;
        }

        if (current === "draft") {
          totals.draft += 1;
        }

        if (current === "pending") {
          totals.pending += 1;
        }

        if (current === "rejected") {
          totals.rejected += 1;
        }

        if (current === "archived") {
          totals.archived += 1;
        }

        return totals;
      },
      {
        total: 0,
        active: 0,
        draft: 0,
        pending: 0,
        rejected: 0,
        archived: 0,
      }
    );
  }, [products]);


  /* ==========================================================
     SEARCH AND STATUS FILTER
  ========================================================== */

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const currentStatus = normalizeStatus(
        product.status
      );

      const variants = Array.isArray(
        product.variants
      )
        ? product.variants
        : [];

      const searchable = [
        product.name,
        product.slug,
        ...variants.map(
          (variant) => variant.sku
        ),
        ...variants.map(
          (variant) => variant.name
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchable.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        currentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    products,
    search,
    statusFilter,
  ]);


  /* ==========================================================
     ARCHIVE PRODUCT
  ========================================================== */

  async function handleArchive() {
    const product = archiveTarget;

    if (
      !product ||
      !canArchiveProduct(product) ||
      archivingId ||
      submittingId
    ) {
      return;
    }

    setArchivingId(product.id);
    setArchiveTarget(null);

    setError("");
    setSuccess("");

    try {
      await vendorApi.deleteProduct(product.id);

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                status: "archived",
              }
            : item
        )
      );

      setSuccess(
        `"${product.name}" was archived successfully.`
      );

      // Reconcile the catalogue with backend state.
      try {
        const response = await vendorApi.getProducts();

        setProducts(normalizeProducts(response));
      } catch {
        // Preserve successful archive feedback.
        // Refresh can be retried manually.
      }
    } catch (err) {
      setError(
        err?.message ||
        "Unable to archive product."
      );
    } finally {
      setArchivingId(null);
    }
  }


  /* ==========================================================
     SUBMIT PRODUCT FOR APPROVAL
  ========================================================== */

  async function handleSubmitForApproval() {
    const product = submitTarget;

    if (
      !product ||
      !canSubmitForApproval(product) ||
      submittingId ||
      archivingId
    ) {
      return;
    }

    setSubmittingId(product.id);

    setError("");
    setSuccess("");

    try {
      // This is the real FastAPI endpoint.
      // The frontend never writes status directly.
      const response =
        await vendorApi.submitProductForApproval(
          product.id
        );

      if (
        response?.status !== "pending" &&
        response?.product?.status !== "pending"
      ) {
        throw new Error(
          "The backend did not confirm that the product is pending."
        );
      }

      // Close the confirmation only after success.
      setSubmitTarget(null);

      // Reflect confirmed backend status immediately.
      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                status: "pending",
                updated_at:
                  response?.product?.updated_at ||
                  item.updated_at,
              }
            : item
        )
      );

      setSuccess(
        `"${product.name}" was submitted for approval successfully.`
      );

      // Retrieve the latest server-side product states.
      // Don't turn a successful submission into an error
      // just because the follow-up refresh fails.
      try {
        const latestResponse =
          await vendorApi.getProducts();

        setProducts(
          normalizeProducts(latestResponse)
        );
      } catch {
        // User can refresh manually.
      }
    } catch (err) {
      setError(
        err?.message ||
        "Unable to submit product for approval."
      );
    } finally {
      setSubmittingId(null);
    }
  }


  /* ==========================================================
     INITIAL LOADING
  ========================================================== */

  if (loading && !loadedOnce) {
    return (
      <div className="avp-page">
        <div className="avp-loading">
          <RefreshCw
            size={30}
            className="avp-spin"
          />

          <strong>
            Loading your products
          </strong>

          <p>
            Retrieving your vendor catalogue.
          </p>
        </div>
      </div>
    );
  }


  /* ==========================================================
     INITIAL ERROR
  ========================================================== */

  if (error && !loadedOnce) {
    return (
      <div className="avp-page">
        <div className="avp-loading">
          <CircleAlert size={35} />

          <h2>
            Unable to load products
          </h2>

          <p>{error}</p>

          <button
            type="button"
            className={
              "avp-button avp-button--primary"
            }
            onClick={() => loadProducts()}
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }


  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="avp-page">

      {/* ======================================================
          PAGE INTRO
      ====================================================== */}

      <section className="avp-intro">
        <div className="avp-intro-copy">
          <span className="avp-eyebrow">
            PRODUCT MANAGEMENT
          </span>

          <h1>
            Your product catalogue
          </h1>

          <p>
            Organise your products, manage stock and
            keep your AUMVEDA store ready for customers.
          </p>
        </div>

        <div className="avp-intro-actions">
          <button
            type="button"
            className={
              "avp-button avp-button--secondary"
            }
            disabled={refreshing}
            onClick={() => loadProducts(true)}
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "avp-spin" : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <Link
            to="/products/new"
            className={
              "avp-button avp-button--primary"
            }
          >
            <Plus size={18} />
            Add New Product
          </Link>
        </div>
      </section>


      {/* ======================================================
          ERROR MESSAGE
      ====================================================== */}

      {error && (
        <div
          className={
            "avp-message avp-message--error"
          }
          role="alert"
        >
          <CircleAlert size={18} />

          <span>{error}</span>

          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}


      {/* ======================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {success && (
        <div
          className={
            "avp-message avp-message--success"
          }
          role="status"
        >
          <CheckCircle2 size={18} />

          <span>{success}</span>

          <button
            type="button"
            aria-label="Dismiss success message"
            onClick={() => setSuccess("")}
          >
            <X size={16} />
          </button>
        </div>
      )}


      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <section
        className="avp-stats"
        aria-label="Product statistics"
      >
        <ProductStat
          icon={Package}
          label="Total Products"
          value={summary.total}
          tone="green"
        />

        <ProductStat
          icon={PackageCheck}
          label="Active Products"
          value={summary.active}
          tone="sage"
        />

        <ProductStat
          icon={FilePenLine}
          label="Draft Products"
          value={summary.draft}
          tone="cream"
        />

        <ProductStat
          icon={Archive}
          label="Archived Products"
          value={summary.archived}
          tone="neutral"
        />
      </section>


      {/* ======================================================
          CATALOGUE
      ====================================================== */}

      <section className="avp-catalogue">
        <header className="avp-catalogue-header">
          <div>
            <span className="avp-eyebrow">
              YOUR INVENTORY
            </span>

            <h2>
              All Products
            </h2>

            <p>
              Search and manage products registered
              under your business.
            </p>

            <p
              style={{
                marginTop: "8px",
                fontSize: "13px",
              }}
            >
              {formatNumber(summary.pending)} awaiting review
              {" · "}
              {formatNumber(summary.rejected)} rejected
            </p>
          </div>

          <span className="avp-result-count">
            {formatNumber(
              filteredProducts.length
            )}{" "}
            results
          </span>
        </header>


        {/* ====================================================
            SEARCH AND FILTERS
        ==================================================== */}

        <div className="avp-toolbar">
          <label className="avp-search">
            <Search size={19} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={
                "Search products, SKU or variant..."
              }
              aria-label="Search products"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={
                  "Clear product search"
                }
              >
                <X size={16} />
              </button>
            )}
          </label>

          <label className="avp-filter">
            <SlidersHorizontal size={17} />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              aria-label={
                "Filter by product status"
              }
            >
              <option value="all">
                All statuses
              </option>

              <option value="active">
                Active
              </option>

              <option value="draft">
                Draft
              </option>

              <option value="pending">
                Pending Approval
              </option>

              <option value="rejected">
                Rejected
              </option>

              <option value="archived">
                Archived
              </option>
            </select>

            <ChevronDown size={15} />
          </label>
        </div>


        {/* ====================================================
            EMPTY STATE
        ==================================================== */}

        {filteredProducts.length === 0 ? (
          <div className="avp-empty">
            <span className="avp-empty-icon">
              <ClipboardList size={30} />
            </span>

            <h3>
              {products.length === 0
                ? "Your catalogue is empty"
                : "No matching products"}
            </h3>

            <p>
              {products.length === 0
                ? (
                  "Add your first product to start " +
                  "building your vendor catalogue."
                )
                : (
                  "Try another search term or clear " +
                  "your filters."
                )}
            </p>

            {products.length === 0 ? (
              <Link
                to="/products/new"
                className={
                  "avp-button avp-button--primary"
                }
              >
                <Plus size={17} />
                Add Product
              </Link>
            ) : (
              <button
                type="button"
                className={
                  "avp-button avp-button--secondary"
                }
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="avp-table-scroll">
            <table className="avp-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Variants</th>
                  <th>Stock</th>
                  <th>Rating</th>
                  <th>Updated</th>
                  <th>Manage</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map(
                  (product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      archiving={
                        archivingId === product.id
                      }
                      submitting={
                        submittingId === product.id
                      }
                      onArchive={setArchiveTarget}
                      onDeletionComplete={() =>
                        loadProducts(true)
                      }
                      onSubmitForApproval={
                        setSubmitTarget
                      }
                    />
                  )
                )}
              </tbody>
            </table>
          </div>
        )}


        {/* ====================================================
            CATALOGUE FOOTER
        ==================================================== */}

        {filteredProducts.length > 0 && (
          <footer className="avp-catalogue-footer">
            <span>
              Showing{" "}
              {filteredProducts.length} of{" "}
              {products.length} products
            </span>

            <Link to="/inventory">
              Open Inventory
              <ArrowRight size={16} />
            </Link>
          </footer>
        )}
      </section>


      {/* ======================================================
          SUBMIT FOR APPROVAL CONFIRMATION
      ====================================================== */}

      {submitTarget && (
        <div
          className="avp-dialog-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !submittingId
            ) {
              setSubmitTarget(null);
            }
          }}
        >
          <div
            className="avp-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="avp-submit-title"
            aria-describedby="avp-submit-description"
          >
            <span className="avp-dialog-icon">
              <Send size={25} />
            </span>

            <h2 id="avp-submit-title">
              Submit product for approval?
            </h2>

            <p id="avp-submit-description">
              <strong>
                {submitTarget.name}
              </strong>{" "}
              will be sent for review.
            </p>

            <p>
              Before submitting, make sure your product
              has a complete description, at least one
              active variant with a valid price, and at
              least one product image.
            </p>

            <p>
              Once submitted, its status will change to
              <strong> Pending</strong>. Product details,
              images, and pricing will be locked while
              awaiting approval.
            </p>

            <div className="avp-dialog-actions">
              <button
                type="button"
                className={
                  "avp-button avp-button--secondary"
                }
                disabled={Boolean(submittingId)}
                onClick={() =>
                  setSubmitTarget(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  "avp-button avp-button--primary"
                }
                disabled={Boolean(submittingId)}
                onClick={
                  handleSubmitForApproval
                }
              >
                {submittingId ? (
                  <RefreshCw
                    size={17}
                    className="avp-spin"
                  />
                ) : (
                  <Send size={17} />
                )}

                {submittingId
                  ? "Submitting..."
                  : "Submit for Approval"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ======================================================
          ARCHIVE CONFIRMATION
      ====================================================== */}

      {archiveTarget && (
        <div
          className="avp-dialog-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !archivingId
            ) {
              setArchiveTarget(null);
            }
          }}
        >
          <div
            className="avp-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="avp-archive-title"
          >
            <span className="avp-dialog-icon">
              <Archive size={25} />
            </span>

            <h2 id="avp-archive-title">
              Archive this product?
            </h2>

            <p>
              <strong>
                {archiveTarget.name}
              </strong>{" "}
              will be marked as archived.
              It will no longer be an active product
              listing.
            </p>

            <div className="avp-dialog-actions">
              <button
                type="button"
                className={
                  "avp-button avp-button--secondary"
                }
                disabled={Boolean(archivingId)}
                onClick={() =>
                  setArchiveTarget(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  "avp-button avp-button--danger"
                }
                disabled={Boolean(archivingId)}
                onClick={handleArchive}
              >
                {archivingId ? (
                  <RefreshCw
                    size={17}
                    className="avp-spin"
                  />
                ) : (
                  <Archive size={17} />
                )}

                {archivingId
                  ? "Archiving..."
                  : "Archive Product"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
