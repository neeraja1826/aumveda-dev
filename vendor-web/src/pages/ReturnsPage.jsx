import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  RotateCcw,
  Package,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
  Clock3,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  X,
} from "lucide-react";

import { returnsApi } from "../services/returnsApi";

import "./returns.css";

// ============================================================
// CONFIGURATION
// ============================================================

const PAGE_SIZE = 20;

const STATUS_LABELS = {
  approved: "Approved",
  awaiting_pickup: "Awaiting Pickup",
  replacement_preparation: "Replacement Preparation",
  replacement_packed: "Replacement Packed",
  pickup_scheduled: "Pickup Scheduled",
  picked_up: "Picked Up",
  exchange_handover_completed: "Exchange Handover Completed",
  in_transit: "In Transit",
  item_received: "Item Received",
  quality_verified: "Quality Verified",
  quality_review_required: "Quality Review Required",
  replacement_processing: "Replacement Processing",
  refund_processing: "Refund Processing",
  refund_pending: "Refund Pending",
  completed: "Completed",
  cancelled: "Cancelled",
};

const RETURN_STAGES = [
  { key: "awaiting_pickup", label: "Approved" },
  { key: "pickup_scheduled", label: "Pickup Scheduled" },
  { key: "picked_up", label: "Picked Up" },
  { key: "in_transit", label: "In Transit" },
  { key: "item_received", label: "Received" },
  { key: "quality_verified", label: "Quality Check" },
  { key: "refund_pending", label: "Refund Pending" },
  { key: "completed", label: "Completed" },
];

const EXCHANGE_STAGES = [
  { key: "replacement_preparation", label: "Approved" },
  { key: "replacement_packed", label: "Packed" },
  { key: "pickup_scheduled", label: "Pickup Scheduled" },
  { key: "exchange_handover_completed", label: "Exchanged" },
  { key: "in_transit", label: "In Transit" },
  { key: "item_received", label: "Received" },
  { key: "quality_verified", label: "Quality Check" },
  { key: "completed", label: "Completed" },
];

// ============================================================
// HELPERS
// ============================================================

function formatStatus(value) {
  return (
    STATUS_LABELS[value] ||
    String(value || "Not available")
      .replace(/_/g, " ")
  );
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function formatReason(value) {
  if (!value) {
    return "—";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function isExchange(item) {
  return (
    item?.request_type === "replacement" ||
    item?.display_request_type === "exchange"
  );
}

function getStage(item) {
  if (!item) {
    return "";
  }

  if (item.status === "completed") {
    return "completed";
  }

  if (item.status === "cancelled") {
    return "cancelled";
  }

  return (
    item.fulfillment?.fulfillment_status ||
    item.fulfillment_status ||
    (
      item.status === "approved"
        ? isExchange(item)
          ? "replacement_preparation"
          : "awaiting_pickup"
        : item.status
    )
  );
}

function formatAddress(address) {
  if (!address) {
    return "Not available";
  }

  if (typeof address === "string") {
    return address;
  }

  const values = [
    address.full_name || address.name,

    address.address_line1 ||
      address.address_line_1 ||
      address.address1 ||
      address.street,

    address.address_line2 ||
      address.address_line_2 ||
      address.address2,

    address.landmark,
    address.city,
    address.state,

    address.pincode ||
      address.postal_code ||
      address.zip_code,

    address.country,
  ];

  return (
    values.filter(Boolean).join(", ") ||
    "Not available"
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  return (
    <span
      className={`returns-status returns-status--${status || "unknown"}`}
    >
      <span className="returns-status-dot" />

      {formatStatus(status)}
    </span>
  );
}

// ============================================================
// REQUEST TYPE BADGE
// ============================================================

function TypeBadge({ item }) {
  const exchange = isExchange(item);

  return (
    <span
      className={
        exchange
          ? "returns-type returns-type--exchange"
          : "returns-type returns-type--return"
      }
    >
      {exchange ? (
        <RefreshCw size={13} />
      ) : (
        <RotateCcw size={13} />
      )}

      {exchange ? "Exchange" : "Return"}
    </span>
  );
}

// ============================================================
// STATISTICS CARD
// ============================================================

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}) {
  return (
    <div className={`returns-stat returns-stat--${tone}`}>
      <div className="returns-stat-icon">
        <Icon size={21} strokeWidth={1.8} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

// ============================================================
// WORKFLOW PROGRESS
// ============================================================

function WorkflowProgress({ item }) {
  const stages = isExchange(item)
    ? EXCHANGE_STAGES
    : RETURN_STAGES;

  const stage = getStage(item);

  const displayStage =
    stage === "quality_review_required"
      ? "item_received"
      : stage === "refund_processing"
        ? "refund_pending"
        : stage;

  const currentIndex = stages.findIndex(
    (entry) => entry.key === displayStage
  );

  return (
    <div className="returns-workflow">
      {stages.map((entry, index) => {
        const completed =
          (
            currentIndex >= 0 &&
            index < currentIndex
          ) ||
          stage === "completed";

        const active =
          currentIndex === index &&
          stage !== "completed";

        return (
          <div
            key={entry.key}
            className={[
              "returns-workflow-step",
              completed ? "is-completed" : "",
              active ? "is-active" : "",
            ].filter(Boolean).join(" ")}
          >
            <div className="returns-step-circle">
              {completed ? (
                <CheckCircle2 size={17} />
              ) : (
                index + 1
              )}
            </div>

            <span>{entry.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// AVAILABLE WORKFLOW ACTIONS
// ============================================================

function getAvailableActions(item) {
  const stage = getStage(item);
  const exchange = isExchange(item);

  if (
    item.status === "completed" ||
    item.status === "cancelled"
  ) {
    return [];
  }

  switch (stage) {
    case "replacement_preparation":
      if (
        item.replacement_selection_missing ||
        !item.replacement?.variant?.id
      ) {
        return [];
      }

      return [
        {
          key: "pack",
          label: "Pack Replacement",
        },
      ];

    case "awaiting_pickup":
    case "replacement_packed":
      return [
        {
          key: "schedule",
          label: "Schedule Pickup",
        },
      ];

    case "pickup_scheduled":
      if (!item.fulfillment?.pickup_scheduled_at) {
        return [];
      }

      return exchange
        ? [
            {
              key: "status",
              status: "exchange_handover_completed",
              label: "Confirm Exchange Handover",
            },
          ]
        : [
            {
              key: "status",
              status: "picked_up",
              label: "Confirm Pickup",
            },
          ];

    case "picked_up":
    case "exchange_handover_completed":
      return [
        {
          key: "status",
          status: "in_transit",
          label: "Mark In Transit",
        },
      ];

    case "in_transit":
      return [
        {
          key: "status",
          status: "item_received",
          label: "Confirm Item Received",
        },
      ];

    case "item_received":
      return [
        {
          key: "status",
          status: "quality_verified",
          label: "Quality Check Passed",
        },
        {
          key: "status",
          status: "quality_review_required",
          label: "Report Quality Issue",
          warning: true,
        },
      ];

    case "quality_verified":
      return exchange
        ? [
            {
              key: "complete",
              label: "Complete Exchange",
            },
          ]
        : [
            {
              key: "refund",
              label: "Request Refund",
            },
          ];

    default:
      return [];
  }
}

// ============================================================
// DETAIL FIELD
// ============================================================

function DetailField({ label, value }) {
  return (
    <div className="returns-detail-field">
      <span>{label}</span>

      <strong>
        {value !== null &&
        value !== undefined &&
        value !== ""
          ? value
          : "—"}
      </strong>
    </div>
  );
}

// ============================================================
// ACTION FORM
// ============================================================

function ActionForm({
  action,
  busy,
  error,
  onCancel,
  onSubmit,
}) {
  const [notes, setNotes] = useState("");

  const [pickupDate, setPickupDate] =
    useState("");

  const [courier, setCourier] =
    useState("");

  const [awbSource, setAwbSource] =
    useState("automatic");

  const [awbNumber, setAwbNumber] =
    useState("");

  const scheduling =
    action.key === "schedule";

  const notesRequired =
    action.status === "quality_review_required";

  function handleSubmit(event) {
    event.preventDefault();

    if (busy) {
      return;
    }

    onSubmit({
      notes: notes.trim() || null,
      pickup_scheduled_at: pickupDate,
      courier_name: courier,
      awb_source: awbSource,
      awb_number: awbNumber,
      vendor_notes: notes.trim() || null,
    });
  }

  return (
    <form
      className="returns-action-form"
      onSubmit={handleSubmit}
    >
      <div className="returns-action-heading">
        <h3>{action.label}</h3>

        <button
          type="button"
          className="returns-icon-button"
          onClick={onCancel}
          disabled={busy}
          aria-label="Cancel action"
        >
          <X size={18} />
        </button>
      </div>

      {action.status ===
        "exchange_handover_completed" && (
        <div className="returns-information">
          Confirm only after the replacement has
          been delivered and the original item
          has been collected from the customer.
        </div>
      )}

      {action.key === "refund" && (
        <div className="returns-information">
          This submits a refund request for
          processing. It does not transfer
          money to the customer.
        </div>
      )}

      {action.key === "complete" && (
        <div className="returns-information">
          Confirm that the exchange and product
          quality verification have been completed.
        </div>
      )}

      {scheduling && (
        <>
          <div className="returns-form-grid">
            <label>
              Pickup Date & Time

              <input
                type="datetime-local"
                value={pickupDate}
                onChange={(event) =>
                  setPickupDate(event.target.value)
                }
                disabled={busy}
                required
              />
            </label>

            <label>
              Courier Name

              <input
                type="text"
                value={courier}
                onChange={(event) =>
                  setCourier(event.target.value)
                }
                placeholder="Enter courier name"
                minLength={2}
                maxLength={150}
                disabled={busy}
                required
              />
            </label>

            <label>
              AWB Source

              <select
                value={awbSource}
                onChange={(event) =>
                  setAwbSource(event.target.value)
                }
                disabled={busy}
              >
                <option value="automatic">
                  Automatic Reference
                </option>

                <option value="manual">
                  Manual AWB
                </option>
              </select>
            </label>

            {awbSource === "manual" && (
              <label>
                AWB Number

                <input
                  type="text"
                  value={awbNumber}
                  onChange={(event) =>
                    setAwbNumber(event.target.value)
                  }
                  placeholder="Enter courier AWB"
                  minLength={3}
                  maxLength={200}
                  disabled={busy}
                  required
                />
              </label>
            )}
          </div>

          {awbSource === "automatic" && (
            <div className="returns-information">
              An internal tracking reference will
              be generated. This does not
              automatically book a courier pickup.
            </div>
          )}
        </>
      )}

      <label className="returns-notes-field">
        {notesRequired
          ? "Reason for Quality Issue *"
          : "Vendor Notes (Optional)"}

        <textarea
          rows={3}
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          placeholder="Enter additional details..."
          disabled={busy}
          required={notesRequired}
        />
      </label>

      {error && (
        <div className="returns-error" role="alert">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      <div className="returns-form-actions">
        <button
          type="button"
          className="returns-button"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="returns-button returns-button--primary"
          disabled={busy}
        >
          {busy
            ? "Processing..."
            : action.label}
        </button>
      </div>
    </form>
  );
}

// ============================================================
// RETURN DETAILS
// ============================================================

function ReturnDetails({
  item,
  history,
  loading,
  error,
  busy,
  action,
  actionError,
  onClose,
  onSelectAction,
  onCancelAction,
  onSubmitAction,
}) {
  const exchange = isExchange(item);

  const stage = getStage(item);

  const original = item?.original_item;

  const fulfillment = item?.fulfillment;

  const replacement = item?.replacement;

  const actions = item
    ? getAvailableActions(item)
    : [];

  return (
    <section className="returns-details">
      <div className="returns-details-header">
        <div>
          <span className="returns-eyebrow">
            REQUEST MANAGEMENT
          </span>

          <h2>
            {exchange
              ? "Exchange Details"
              : "Return Details"}
          </h2>

          {item && (
            <p>
              Order #{item.order?.order_number ||
                item.order_id ||
                "—"}
            </p>
          )}
        </div>

        <button
          type="button"
          className="returns-icon-button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close details"
        >
          <X size={22} />
        </button>
      </div>

      {loading && (
        <div className="returns-empty returns-details-loading">
          <RefreshCw
            size={23}
            className="returns-spinner"
          />

          Loading request details...
        </div>
      )}

      {error && (
        <div
          className="returns-error"
          role="alert"
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {!loading && !error && item && (
        <>
          <div className="returns-detail-badges">
            <TypeBadge item={item} />
            <StatusBadge status={stage} />
          </div>

          {/* FULFILLMENT PROGRESS */}

          <div className="returns-section">
            <h3>
              <Truck size={18} />
              Fulfillment Progress
            </h3>

            <WorkflowProgress item={item} />
          </div>

          {/* ORIGINAL PRODUCT */}

          <div className="returns-section">
            <h3>
              <Package size={18} />
              Original Product
            </h3>

            <div className="returns-detail-grid">
              <DetailField
                label="Product"
                value={original?.product_name}
              />

              <DetailField
                label="Variant"
                value={original?.variant_name}
              />

              <DetailField
                label="SKU"
                value={original?.sku}
              />

              <DetailField
                label="Requested Quantity"
                value={item.requested_quantity}
              />

              <DetailField
                label="Unit Price"
                value={formatMoney(original?.unit_price)}
              />

              <DetailField
                label="Original Line Total"
                value={formatMoney(original?.total_price)}
              />
            </div>
          </div>

          {/* REPLACEMENT PRODUCT */}

          {exchange && (
            <div className="returns-section">
              <h3>
                <PackageCheck size={18} />
                Replacement Product
              </h3>

              {item.replacement_selection_missing ||
              !replacement?.variant?.id ? (
                <div className="returns-error">
                  <AlertCircle size={18} />

                  Replacement product selection is
                  missing. Packing cannot be
                  performed.
                </div>
              ) : (
                <div className="returns-detail-grid">
                  <DetailField
                    label="Product"
                    value={replacement.product?.name}
                  />

                  <DetailField
                    label="Variant"
                    value={replacement.variant?.name}
                  />

                  <DetailField
                    label="Replacement SKU"
                    value={replacement.variant?.sku}
                  />

                  <DetailField
                    label="Available Stock"
                    value={replacement.variant?.stock_quantity}
                  />

                  <DetailField
                    label="Replacement Price"
                    value={formatMoney(
                      replacement.variant?.price
                    )}
                  />

                  <DetailField
                    label="Variant Status"
                    value={
                      replacement.variant?.is_active
                        ? "Active"
                        : "Inactive"
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* CUSTOMER REQUEST */}

          <div className="returns-section">
            <h3>
              <ClipboardCheck size={18} />
              Customer Request
            </h3>

            <div className="returns-detail-grid">
              <DetailField
                label="Reason"
                value={formatReason(item.reason)}
              />

              <DetailField
                label="Requested On"
                value={formatDate(item.created_at)}
              />

              <DetailField
                label="Request Status"
                value={formatStatus(item.status)}
              />
            </div>

            <div className="returns-description">
              <span>Customer Description</span>

              <p>
                {item.description ||
                  "No additional description."}
              </p>
            </div>
          </div>

          {/* PICKUP AND COURIER */}

          <div className="returns-section">
            <h3>
              <Truck size={18} />
              Pickup & Courier Details
            </h3>

            <div className="returns-description">
              <span>Pickup Address</span>

              <p>
                {formatAddress(
                  fulfillment?.pickup_address ||
                  item.order?.shipping_address
                )}
              </p>
            </div>

            <div className="returns-detail-grid">
              <DetailField
                label="Pickup Schedule"
                value={formatDate(
                  fulfillment?.pickup_scheduled_at
                )}
              />

              <DetailField
                label="Courier"
                value={fulfillment?.courier_name}
              />

              <DetailField
                label="AWB Number"
                value={fulfillment?.awb_number}
              />

              <DetailField
                label="AWB Source"
                value={fulfillment?.awb_source}
              />

              <DetailField
                label="Picked Up On"
                value={formatDate(
                  fulfillment?.picked_up_at
                )}
              />

              <DetailField
                label="Received On"
                value={formatDate(
                  fulfillment?.received_at
                )}
              />

              {exchange && (
                <DetailField
                  label="Replacement Delivered"
                  value={formatDate(
                    fulfillment?.replacement_delivered_at
                  )}
                />
              )}
            </div>
          </div>

          {/* QUALITY VERIFICATION */}

          <div className="returns-section">
            <h3>
              <CheckCircle2 size={18} />
              Quality Verification
            </h3>

            <div className="returns-detail-grid">
              <DetailField
                label="Quality Status"
                value={
                  fulfillment?.quality_status
                    ? formatStatus(
                        fulfillment.quality_status
                      )
                    : "Not verified"
                }
              />

              <DetailField
                label="Verified On"
                value={formatDate(
                  fulfillment?.quality_verified_at
                )}
              />
            </div>

            {fulfillment?.quality_notes && (
              <div className="returns-description">
                <span>Quality Notes</span>

                <p>{fulfillment.quality_notes}</p>
              </div>
            )}

            {fulfillment?.vendor_notes && (
              <div className="returns-description">
                <span>Vendor Notes</span>

                <p>{fulfillment.vendor_notes}</p>
              </div>
            )}
          </div>

          {/* STATUS INFORMATION */}

          {stage === "quality_review_required" && (
            <div className="returns-information">
              This request requires further quality
              review. Refund or exchange completion
              is currently unavailable.
            </div>
          )}

          {(
            stage === "refund_pending" ||
            stage === "refund_processing"
          ) && (
            <div className="returns-information">
              Refund processing is pending.
              The request will be completed after
              the refund is confirmed.
            </div>
          )}

          {stage === "pickup_scheduled" &&
            !fulfillment?.pickup_scheduled_at && (
              <div className="returns-information">
                Pickup is marked as scheduled,
                but its fulfillment details are
                missing. Verify this record before
                proceeding.
              </div>
            )}

          {stage === "completed" && (
            <div className="returns-completed-banner">
              <CheckCircle2 size={20} />

              {exchange
                ? "Exchange completed successfully."
                : "Return completed successfully."}
            </div>
          )}

          {/* AVAILABLE ACTIONS */}

          {actions.length > 0 && (
            <div className="returns-section">
              <h3>
                <ArrowRight size={18} />
                Available Actions
              </h3>

              {!action ? (
                <div className="returns-action-buttons">
                  {actions.map((entry) => (
                    <button
                      type="button"
                      key={entry.status || entry.key}
                      disabled={busy}
                      className={
                        entry.warning
                          ? "returns-button returns-button--warning"
                          : "returns-button returns-button--primary"
                      }
                      onClick={() =>
                        onSelectAction(entry)
                      }
                    >
                      {entry.label}

                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
              ) : (
                <ActionForm
                  key={action.status || action.key}
                  action={action}
                  busy={busy}
                  error={actionError}
                  onCancel={onCancelAction}
                  onSubmit={onSubmitAction}
                />
              )}
            </div>
          )}

          {/* REQUEST HISTORY */}

          <div className="returns-section">
            <h3>
              <Clock3 size={18} />
              Request History
            </h3>

            {!history.length ? (
              <div className="returns-history-empty">
                No recorded history.
              </div>
            ) : (
              <div className="returns-history">
                {history.map((entry, index) => (
                  <div
                    className="returns-history-item"
                    key={entry.id || index}
                  >
                    <div className="returns-history-dot" />

                    <div className="returns-history-content">
                      <strong>
                        {formatStatus(
                          entry.new_status
                        )}
                      </strong>

                      {entry.previous_status && (
                        <span>
                          Previous:{" "}
                          {formatStatus(
                            entry.previous_status
                          )}
                        </span>
                      )}

                      {entry.notes && (
                        <p>{entry.notes}</p>
                      )}

                      <small>
                        {formatDate(
                          entry.created_at
                        )}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

// ============================================================
// MAIN RETURNS PAGE
// ============================================================

export default function ReturnsPage() {
  const operationLock = useRef(false);

  const [items, setItems] = useState([]);

  const [total, setTotal] = useState(0);

  const [requestType, setRequestType] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [search, setSearch] =
    useState("");

  const [page, setPage] = useState(1);

  const [revision, setRevision] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [selectedId, setSelectedId] =
    useState(null);

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [history, setHistory] =
    useState([]);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [detailError, setDetailError] =
    useState("");

  const [action, setAction] =
    useState(null);

  const [actionError, setActionError] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  // ==========================================================
  // LOAD REQUESTS
  // ==========================================================

  useEffect(() => {
    const controller = new AbortController();

    async function loadReturns() {
      setLoading(true);
      setError("");

      try {
        const result =
          await returnsApi.getReturns(
            {
              request_type: requestType,
              status: statusFilter,
              limit: PAGE_SIZE,
              offset: (page - 1) * PAGE_SIZE,
            },
            controller.signal
          );

        if (controller.signal.aborted) {
          return;
        }

        const nextItems =
          Array.isArray(result?.items)
            ? result.items
            : [];

        const nextTotal =
          Number(result?.total || 0);

        const lastPage = Math.max(
          1,
          Math.ceil(nextTotal / PAGE_SIZE)
        );

        if (page > lastPage) {
          setPage(lastPage);
          return;
        }

        setItems(nextItems);
        setTotal(nextTotal);

        // Close expanded details when the selected
        // request no longer exists on the current page.
        setSelectedId((current) => {
          if (
            current &&
            !nextItems.some(
              (entry) => entry.id === current
            )
          ) {
            return null;
          }

          return current;
        });
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err?.message ||
              "Unable to load return requests."
          );

          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadReturns();

    return () => controller.abort();
  }, [
    requestType,
    statusFilter,
    page,
    revision,
  ]);

  // ==========================================================
  // LOAD SELECTED REQUEST
  // ==========================================================

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const controller = new AbortController();

    async function loadDetails() {
      setDetailLoading(true);
      setDetailError("");
      setSelectedItem(null);
      setHistory([]);

      try {
        const [detail, historyResult] =
          await Promise.all([
            returnsApi.getReturn(
              selectedId,
              controller.signal
            ),

            returnsApi.getHistory(
              selectedId,
              controller.signal
            ),
          ]);

        if (controller.signal.aborted) {
          return;
        }

        setSelectedItem(detail);

        const nextHistory =
          Array.isArray(historyResult)
            ? historyResult
            : historyResult?.items ||
              historyResult?.history ||
              [];

        setHistory(
          Array.isArray(nextHistory)
            ? nextHistory
            : []
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          setDetailError(
            err?.message ||
              "Unable to load request details."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setDetailLoading(false);
        }
      }
    }

    loadDetails();

    return () => controller.abort();
  }, [selectedId, revision]);

  // ==========================================================
  // DISPLAY FILTERS
  // ==========================================================

  const filteredItems = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((item) => {
      const values = [
        item.id,
        item.order_id,
        item.order?.order_number,
        item.original_item?.product_name,
        item.original_item?.sku,
        item.replacement?.product?.name,
        item.fulfillment?.awb_number,
        item.reason,
        formatReason(item.reason),
      ];

      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [items, search]);

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const stats = useMemo(() => {
    return {
      returns: items.filter(
        (item) => !isExchange(item)
      ).length,

      exchanges: items.filter(
        isExchange
      ).length,

      completed: items.filter(
        (item) =>
          item.status === "completed"
      ).length,
    };
  }, [items]);

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE)
  );

  // ==========================================================
  // REFRESH
  // ==========================================================

  function refreshPage() {
    if (busy || operationLock.current) {
      return;
    }

    setNotice("");
    setAction(null);
    setActionError("");

    setRevision((value) => value + 1);
  }

  // ==========================================================
  // CLOSE EXPANDED DETAILS
  // ==========================================================

  function closeRequest() {
    if (busy || operationLock.current) {
      return;
    }

    setSelectedId(null);
    setSelectedItem(null);
    setHistory([]);
    setAction(null);
    setActionError("");
    setDetailError("");
    setDetailLoading(false);
  }

  // ==========================================================
  // OPEN / TOGGLE INLINE REQUEST DETAILS
  // ==========================================================

  function openRequest(id) {
    if (busy || operationLock.current) {
      return;
    }

    // Clicking the same request closes its details.
    if (selectedId === id) {
      closeRequest();
      return;
    }

    // Opening a different request closes the previous one.
    setSelectedItem(null);
    setDetailLoading(true);
    setDetailError("");
    setHistory([]);
    setAction(null);
    setActionError("");
    setNotice("");

    setSelectedId(id);
  }

  // ==========================================================
  // EXECUTE WORKFLOW ACTION
  // ==========================================================

  async function executeAction(payload) {
    if (
      !selectedItem ||
      !action ||
      operationLock.current ||
      detailLoading ||
      selectedItem.id !== selectedId
    ) {
      return;
    }

    operationLock.current = true;

    setBusy(true);
    setActionError("");
    setNotice("");

    try {
      const id = selectedItem.id;

      let result;

      switch (action.key) {
        case "pack":
          result =
            await returnsApi.packReplacement(
              id,
              payload.notes
            );
          break;

        case "schedule":
          result =
            await returnsApi.schedulePickup(
              id,
              payload
            );
          break;

        case "status":
          result =
            await returnsApi.updateStatus(
              id,
              action.status,
              payload.notes
            );
          break;

        case "refund":
          result =
            await returnsApi.requestRefund(
              id,
              payload.notes
            );
          break;

        case "complete":
          result =
            await returnsApi.completeExchange(
              id,
              payload.notes
            );
          break;

        default:
          throw new Error(
            "Unsupported return action."
          );
      }

      if (result?.success === false) {
        throw new Error(
          result?.message ||
            "The operation could not be completed."
        );
      }

      setNotice(
        action.key === "refund"
          ? "Refund request submitted successfully."
          : "Request updated successfully."
      );

      setAction(null);
      setDetailLoading(true);
      setSelectedItem(null);

      // Refresh the selected request and table without
      // moving the details to the bottom of the page.
      setRevision((value) => value + 1);
    } catch (err) {
      setActionError(
        err?.status === 403
          ? "You do not have permission to perform this action."
          : err?.message ||
            "Unable to complete the action."
      );
    } finally {
      operationLock.current = false;
      setBusy(false);
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="returns-page">
      {/* PAGE HEADER */}

      <header className="returns-page-header">
        <div>
          <span className="returns-eyebrow">
            ORDER FULFILLMENT
          </span>

          <h1>Returns & Exchanges</h1>

          <p>
            Manage approved customer returns,
            exchanges, pickups and refund requests.
          </p>
        </div>

        <button
          type="button"
          className="returns-button returns-refresh"
          disabled={loading || busy}
          onClick={refreshPage}
        >
          <RefreshCw
            size={16}
            className={
              loading ? "returns-spinner" : ""
            }
          />

          {loading
            ? "Loading..."
            : "Refresh"}
        </button>
      </header>

      {/* SUMMARY CARDS */}

      <div className="returns-stats">
        <StatCard
          label="Matching Requests"
          value={total}
          icon={RotateCcw}
          tone="green"
        />

        <StatCard
          label="Returns on This Page"
          value={stats.returns}
          icon={Package}
          tone="orange"
        />

        <StatCard
          label="Exchanges on This Page"
          value={stats.exchanges}
          icon={RefreshCw}
          tone="blue"
        />

        <StatCard
          label="Completed on This Page"
          value={stats.completed}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      {/* SUCCESS MESSAGE */}

      {notice && (
        <div
          className="returns-success"
          role="status"
        >
          <CheckCircle2 size={18} />

          {notice}

          <button
            type="button"
            className="returns-icon-button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div
          className="returns-error"
          role="alert"
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* REQUEST LIST */}

      <section className="returns-list-card">
        <div className="returns-list-heading">
          <div>
            <h2>Customer Requests</h2>

            <p>
              Approved returns and exchanges
              assigned to your business.
            </p>
          </div>

          <span className="returns-result-count">
            {total} Requests
          </span>
        </div>

        {/* FILTERS */}

        <div className="returns-filters">
          <div className="returns-tabs">
            {[
              ["all", "All Requests"],
              ["return", "Returns"],
              ["replacement", "Exchanges"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                disabled={busy}
                className={
                  requestType === value
                    ? "returns-tab active"
                    : "returns-tab"
                }
                onClick={() => {
                  closeRequest();
                  setPage(1);
                  setRequestType(value);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="returns-filter-controls">
            <div className="returns-search">
              <Search size={17} />

              <input
                type="search"
                value={search}
                placeholder="Search this page..."
                disabled={busy}
                aria-label="Search return requests"
                onChange={(event) => {
                  closeRequest();
                  setSearch(event.target.value);
                }}
              />
            </div>

            <select
              className="returns-filter-select"
              value={statusFilter}
              disabled={busy}
              aria-label="Filter request status"
              onChange={(event) => {
                closeRequest();
                setPage(1);

                setStatusFilter(
                  event.target.value
                );
              }}
            >
              <option value="all">
                All Statuses
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="pickup_scheduled">
                Pickup Scheduled
              </option>

              <option value="item_received">
                Item Received
              </option>

              <option value="replacement_processing">
                Replacement Processing
              </option>

              <option value="refund_processing">
                Refund Processing
              </option>

              <option value="completed">
                Completed
              </option>
            </select>
          </div>
        </div>

        {/* REQUESTS TABLE */}

        {loading ? (
          <div className="returns-empty">
            <RefreshCw
              size={25}
              className="returns-spinner"
            />

            <h3>Loading Requests</h3>

            <p>
              Retrieving your return and exchange requests.
            </p>
          </div>
        ) : error ? (
          <div className="returns-empty">
            <AlertCircle size={32} />

            <h3>Unable to Load Requests</h3>

            <button
              type="button"
              className="returns-button"
              onClick={refreshPage}
            >
              Try Again
            </button>
          </div>
        ) : !filteredItems.length ? (
          <div className="returns-empty">
            <RotateCcw size={36} />

            <h3>No Requests Found</h3>

            <p>
              No approved requests match
              the selected filters.
            </p>
          </div>
        ) : (
          <div className="returns-table-wrapper">
            <table className="returns-table">
              <thead>
                <tr>
                  <th>Order & Product</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Requested On</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => {
                  const expanded =
                    selectedId === item.id;

                  return (
                    <Fragment key={item.id}>
                      {/* MAIN REQUEST ROW */}

                      <tr
                        className={
                          expanded
                            ? "returns-row-expanded"
                            : ""
                        }
                      >
                        <td>
                          <div className="returns-product-cell">
                            <strong>
                              {item.original_item?.product_name ||
                                "Product"}
                            </strong>

                            <span>
                              Order #{
                                item.order?.order_number ||
                                item.order_id ||
                                "—"
                              }
                            </span>

                            <small>
                              {item.original_item?.variant_name ||
                                ""}
                            </small>
                          </div>
                        </td>

                        <td>
                          <TypeBadge item={item} />
                        </td>

                        <td>
                          {item.requested_quantity ?? "—"}
                        </td>

                        <td>
                          <span
                            className="returns-reason"
                            title={formatReason(item.reason)}
                          >
                            {formatReason(item.reason)}
                          </span>
                        </td>

                        <td>
                          <StatusBadge
                            status={getStage(item)}
                          />
                        </td>

                        <td>
                          {formatDate(item.created_at)}
                        </td>

                        <td>
                          <button
                            type="button"
                            className={
                              expanded
                                ? "returns-view-button is-expanded"
                                : "returns-view-button"
                            }
                            disabled={busy}
                            aria-expanded={expanded}
                            aria-controls={
                              expanded
                                ? `return-details-${item.id}`
                                : undefined
                            }
                            onClick={() =>
                              openRequest(item.id)
                            }
                          >
                            {expanded ? (
                              <>
                                Hide Details
                                <ChevronUp size={15} />
                              </>
                            ) : (
                              <>
                                View Details
                                <ChevronDown size={15} />
                              </>
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* INLINE EXPANDABLE DETAILS */}

                      {expanded && (
                        <tr
                          className="returns-expanded-details-row"
                          id={`return-details-${item.id}`}
                        >
                          <td
                            colSpan={7}
                            className="returns-expanded-details-cell"
                          >
                            <ReturnDetails
                              item={selectedItem}
                              history={history}
                              loading={detailLoading}
                              error={detailError}
                              busy={busy}
                              action={action}
                              actionError={actionError}
                              onClose={closeRequest}
                              onSelectAction={(nextAction) => {
                                setActionError("");
                                setAction(nextAction);
                              }}
                              onCancelAction={() => {
                                setAction(null);
                                setActionError("");
                              }}
                              onSubmitAction={executeAction}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}

        {!loading && !error && total > 0 && (
          <div className="returns-pagination">
            <span>
              Page {page} of {totalPages}
              {" · "}
              {total} matching requests
            </span>

            <div>
              <button
                type="button"
                className="returns-button"
                disabled={page <= 1 || busy}
                onClick={() => {
                  closeRequest();
                  setPage((value) => value - 1);
                }}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                className="returns-button"
                disabled={
                  page >= totalPages || busy
                }
                onClick={() => {
                  closeRequest();
                  setPage((value) => value + 1);
                }}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* REFUND INFORMATION */}

      <div className="returns-footer-note">
        <IndianRupee size={17} />

        <span>
          Customer refunds are subject to Admin
          processing and confirmation. Vendors
          cannot directly release customer refunds.
        </span>
      </div>
    </main>
  );
}