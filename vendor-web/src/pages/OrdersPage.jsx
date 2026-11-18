import "./OrdersPage.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowRight,
  Box,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  LoaderCircle,
  MapPin,
  Package,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  X,
  XCircle,
} from "lucide-react";

import { vendorApi } from "../services/api";
import { shippingApi } from "../services/shippingApi";

const PREPARATION = [
  "pending",
  "accepted",
  "packed",
];

const DELIVERY = [
  "shipped",
  "delivered",
];

const CLOSED = [
  "cancelled",
  "returned",
  "refunded",
];

const FILTERS = [
  "all",
  ...PREPARATION,
  ...DELIVERY,
  ...CLOSED,
];

const NEXT_STATUS = {
  pending: "accepted",
  accepted: "packed",
};

const checkboxStyle = {
  width: 18,
  height: 18,
  accentColor: "#256344",
  cursor: "pointer",
  flexShrink: 0,
};

function statusOf(value) {
  return String(value || "pending")
    .trim()
    .toLowerCase();
}

function words(value) {
  return String(value || "Unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function number(value) {
  return Number(value || 0)
    .toLocaleString("en-IN");
}

function money(value, currency = "INR") {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount.toFixed(2)}`;
  }
}

function dateText(value) {
  if (!value) return "—";

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

function unwrapList(response) {
  if (Array.isArray(response)) {
    return response;
  }

  for (const value of [
    response?.data?.orders,
    response?.orders,
    response?.data,
  ]) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function unwrapOrder(response) {
  const value =
    response?.data?.order ??
    response?.order ??
    response?.data ??
    response;

  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value
    : null;
}

function unwrapSummary(response) {
  return (
    response?.data?.summary ??
    response?.summary ??
    response?.data ??
    response ??
    {}
  );
}

function displayStatus(statuses) {
  if (
    !Array.isArray(statuses) ||
    !statuses.length
  ) {
    return "pending";
  }

  const values = statuses.map(statusOf);

  for (const terminal of [
    "delivered",
    "returned",
    "refunded",
    "cancelled",
  ]) {
    if (
      values.every(
        (item) => item === terminal
      )
    ) {
      return terminal;
    }
  }

  if (values.includes("pending")) {
    return "pending";
  }

  if (values.includes("accepted")) {
    return "accepted";
  }

  if (values.includes("packed")) {
    return "packed";
  }

  if (values.includes("shipped")) {
    return "shipped";
  }

  return values[0];
}

function canAccept(item) {
  return item.can_accept ??
    (
      item.status === "pending" &&
      !item.is_allocated
    );
}

function canPack(item) {
  return item.can_pack ??
    (
      item.status === "accepted" &&
      !item.is_allocated
    );
}

function canShip(item) {
  return item.can_move_to_shipping ??
    (
      item.status === "packed" &&
      !item.is_allocated &&
      !item.shipment_id
    );
}

function StatusIcon({
  status,
  size = 16,
}) {
  if (status === "pending") {
    return <Clock3 size={size} />;
  }

  if (status === "packed") {
    return <PackageCheck size={size} />;
  }

  if (status === "shipped") {
    return <Truck size={size} />;
  }

  if (CLOSED.includes(status)) {
    return <XCircle size={size} />;
  }

  return <CheckCircle2 size={size} />;
}

function StatusBadge({ status }) {
  const value = statusOf(status);

  return (
    <span
      className={`avo-status avo-status-${value}`}
    >
      <StatusIcon
        status={value}
        size={14}
      />

      {words(value)}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <article className="avo-metric">
      <div className="avo-metric-icon">
        <Icon size={19} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </article>
  );
}

function AddressBlock({ address }) {
  if (!address) {
    return <p>Address unavailable.</p>;
  }

  if (typeof address === "string") {
    return <p>{address}</p>;
  }

  const name =
    address.full_name ||
    address.recipient_name ||
    address.name;

  const lines = [
    address.address_line1,
    address.address_line2,
    address.street,
    address.area,
    address.landmark,
    address.city,
    address.state,
    address.postal_code ||
      address.pincode,
    address.country,
  ].filter(Boolean);

  return (
    <div className="avo-address">
      {name && <strong>{name}</strong>}

      <p>
        {lines.join(", ") ||
          "Address unavailable."}
      </p>

      {(address.phone ||
        address.mobile) && (
        <span>
          {address.phone ||
            address.mobile}
        </span>
      )}
    </div>
  );
}

function PreparationTimeline({
  status,
}) {
  const index = DELIVERY.includes(status)
    ? PREPARATION.length - 1
    : PREPARATION.indexOf(status);

  return (
    <div className="avo-item-timeline">
      {PREPARATION.map((step, i) => (
        <div
          key={step}
          className={[
            "avo-timeline-step",
            i <= index
              ? "avo-timeline-done"
              : "",
            step === status
              ? "avo-timeline-current"
              : "",
          ].join(" ")}
        >
          <span>
            {i <= index
              ? <Check size={12} />
              : i + 1}
          </span>

          <small>{words(step)}</small>
        </div>
      ))}
    </div>
  );
}

function OrderItem({
  item,
  currency,
  busy,
  checked,
  onToggle,
  onRequestStatus,
  onMoveToShipping,
}) {
  const status = statusOf(
    item.status
  );

  const next =
    canAccept(item)
      ? "accepted"
      : canPack(item)
        ? "packed"
        : null;

  const selectable =
    canAccept(item) ||
    canPack(item) ||
    canShip(item);

  const allocated =
    item.is_allocated ||
    Boolean(item.shipment_id);

  return (
    <article
      className="avo-item"
      style={
        checked
          ? {
              borderColor: "#256344",
              boxShadow:
                "0 0 0 1px #256344",
            }
          : undefined
      }
    >
      <div className="avo-item-top">
        <div className="avo-item-product">
          <input
            type="checkbox"
            style={checkboxStyle}
            checked={checked}
            disabled={
              busy || !selectable
            }
            onChange={() =>
              onToggle(item.id)
            }
            aria-label={`Select ${
              item.product_name
            }`}
          />

          <span className="avo-item-icon">
            <Package size={20} />
          </span>

          <div>
            <strong>
              {item.product_name ||
                "Product"}
            </strong>

            <span>
              {item.variant_name ||
                "Default Variant"}
            </span>

            <small>
              SKU: {item.sku || "—"}
            </small>
          </div>
        </div>

        <div className="avo-item-amounts">
          <div>
            <small>Quantity</small>

            <strong>
              {number(item.quantity)}
            </strong>
          </div>

          <div>
            <small>Item Total</small>

            <strong>
              {money(
                item.total_price,
                currency
              )}
            </strong>
          </div>
        </div>
      </div>

      {CLOSED.includes(status) ? (
        <div className="avo-cancelled-item">
          <XCircle size={16} />

          {words(status)} — no further
          fulfillment actions.
        </div>
      ) : (
        <PreparationTimeline
          status={status}
        />
      )}

      {allocated && (
        <div
          style={{
            padding: "12px 18px",
            background: "#F1F7F1",
            color: "#24583B",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <Truck size={17} />

          <strong>
            Shipment assigned
          </strong>

          <span>
            AWB:{" "}
            {item.awb_number ||
              "Assigned"}
          </span>

          {item.shipment_status && (
            <span>
              · {words(
                item.shipment_status
              )}
            </span>
          )}
        </div>
      )}

      <footer className="avo-item-footer">
        <StatusBadge status={status} />

        <div className="avo-item-actions">
          {next && (
            <button
              type="button"
              className="avo-action"
              disabled={busy}
              onClick={() =>
                onRequestStatus(
                  [item],
                  next
                )
              }
            >
              <StatusIcon
                status={next}
                size={15}
              />

              {next === "accepted"
                ? "Accept Item"
                : "Mark Packed"}
            </button>
          )}

          {canShip(item) && (
            <button
              type="button"
              className="avo-action"
              disabled={busy}
              onClick={() =>
                onMoveToShipping([
                  item,
                ])
              }
            >
              <Truck size={15} />

              Move to Shipping

              <ArrowRight size={15} />
            </button>
          )}

          {allocated &&
            !CLOSED.includes(status) && (
              <span className="avo-final">
                {status === "delivered"
                  ? "Delivered"
                  : "Manage in Shipping"}
              </span>
            )}

          {!allocated &&
            status === "shipped" && (
              <span className="avo-final">
                Shipping in progress
              </span>
            )}

          {!allocated &&
            status === "delivered" && (
              <span className="avo-final">
                Delivered
              </span>
            )}
        </div>
      </footer>
    </article>
  );
}

function BulkActions({
  items,
  selectedIds,
  busy,
  onChangeSelection,
  onRequestStatus,
  onMoveToShipping,
}) {
  const available = items.filter(
    (item) =>
      canAccept(item) ||
      canPack(item) ||
      canShip(item)
  );

  const pending = items.filter(
    canAccept
  );

  const accepted = items.filter(
    canPack
  );

  const packed = items.filter(
    canShip
  );

  const selected = available.filter(
    (item) =>
      selectedIds.includes(item.id)
  );

  const selectedPending =
    selected.filter(canAccept);

  const selectedAccepted =
    selected.filter(canPack);

  const selectedPacked =
    selected.filter(canShip);

  const allSelected =
    available.length > 0 &&
    available.every((item) =>
      selectedIds.includes(item.id)
    );

  return (
    <section
      style={{
        padding: 18,
        border: "1px solid #DCE8DB",
        borderRadius: 12,
        background: "#F5F9F4",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 15,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: "#17482E",
              fontSize: 16,
            }}
          >
            Bulk Order Actions
          </h3>

          <p
            style={{
              margin: "5px 0 0",
              fontSize: 13,
              color: "#667D68",
            }}
          >
            Process multiple products
            at once.
          </p>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#24583B",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            style={checkboxStyle}
            checked={allSelected}
            disabled={
              busy ||
              !available.length
            }
            onChange={() =>
              onChangeSelection(
                allSelected
                  ? []
                  : available.map(
                      (item) => item.id
                    )
              )
            }
          />

          Select All
          ({selected.length}/
          {available.length})
        </label>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="avo-button avo-button-primary"
          disabled={
            busy || !pending.length
          }
          onClick={() =>
            onRequestStatus(
              pending,
              "accepted",
              true
            )
          }
        >
          <CheckCircle2 size={16} />

          Accept All
          ({pending.length})
        </button>

        <button
          type="button"
          className="avo-button avo-button-primary"
          disabled={
            busy || !accepted.length
          }
          onClick={() =>
            onRequestStatus(
              accepted,
              "packed",
              true
            )
          }
        >
          <PackageCheck size={16} />

          Mark All Packed
          ({accepted.length})
        </button>

        <button
          type="button"
          className="avo-button avo-button-primary"
          disabled={
            busy || !packed.length
          }
          onClick={() =>
            onMoveToShipping(
              packed
            )
          }
        >
          <Truck size={16} />

          Move All to Shipping
          ({packed.length})
        </button>
      </div>

      {selected.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            paddingTop: 14,
            marginTop: 14,
            borderTop:
              "1px solid #DCE8DB",
          }}
        >
          {selectedPending.length > 0 && (
            <button
              type="button"
              className="avo-button avo-button-light"
              disabled={busy}
              onClick={() =>
                onRequestStatus(
                  selectedPending,
                  "accepted"
                )
              }
            >
              Accept Selected
              ({selectedPending.length})
            </button>
          )}

          {selectedAccepted.length > 0 && (
            <button
              type="button"
              className="avo-button avo-button-light"
              disabled={busy}
              onClick={() =>
                onRequestStatus(
                  selectedAccepted,
                  "packed"
                )
              }
            >
              Pack Selected
              ({selectedAccepted.length})
            </button>
          )}

          {selectedPacked.length > 0 && (
            <button
              type="button"
              className="avo-button avo-button-primary"
              disabled={busy}
              onClick={() =>
                onMoveToShipping(
                  selectedPacked
                )
              }
            >
              <Truck size={16} />

              Move Selected to Shipping
              ({selectedPacked.length})
            </button>
          )}

          <button
            type="button"
            className="avo-button avo-button-light"
            disabled={busy}
            onClick={() =>
              onChangeSelection([])
            }
          >
            Clear Selection
          </button>
        </div>
      )}

      <p
        style={{
          fontSize: 12,
          color: "#627765",
          marginBottom: 0,
          marginTop: 14,
        }}
      >
        Actions apply only to eligible
        products. Already assigned
        products cannot be shipped twice.
      </p>
    </section>
  );
}

function ConfirmStatusOverlay({
  action,
  busy,
  error,
  onCancel,
  onConfirm,
}) {
  if (!action) return null;

  return (
    <div className="avo-confirm-overlay">
      <div
        className="avo-confirm"
        role="alertdialog"
        aria-modal="true"
        aria-label="Confirm status update"
      >
        <div className="avo-confirm-icon">
          <CheckCircle2 size={24} />
        </div>

        <h3>Confirm Status Update</h3>

        <p>
          Mark{" "}
          <strong>
            {action.items.length === 1
              ? action.items[0]
                  .product_name
              : `${action.items.length} products`}
          </strong>{" "}
          as{" "}
          <strong>
            {words(
              action.nextStatus
            )}
          </strong>
          ?
        </p>

        {error && (
          <div className="avo-alert avo-alert-error">
            <AlertCircle size={16} />

            {error}
          </div>
        )}

        <div className="avo-confirm-actions">
          <button
            type="button"
            className="avo-button avo-button-light"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            className="avo-button avo-button-primary"
            style={{
              background: "#256344",
              color: "#FFFFFF",
            }}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? (
              <>
                <LoaderCircle
                  size={16}
                  className="avo-spin"
                />

                Updating...
              </>
            ) : (
              "Yes, Update"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderDetailsModal({
  order,
  loading,
  error,
  notice,
  busy,
  selectedIds,
  onChangeSelection,
  confirmAction,
  onClose,
  onRequestStatus,
  onMoveToShipping,
  onCancelConfirm,
  onConfirmAction,
}) {
  useEffect(() => {
    const old =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function onKey(event) {
      if (
        event.key === "Escape" &&
        !busy
      ) {
        if (confirmAction) {
          onCancelConfirm();
        } else {
          onClose();
        }
      }
    }

    document.addEventListener(
      "keydown",
      onKey
    );

    return () => {
      document.body.style.overflow =
        old;

      document.removeEventListener(
        "keydown",
        onKey
      );
    };
  }, [
    busy,
    confirmAction,
    onClose,
    onCancelConfirm,
  ]);

  const items =
    Array.isArray(order?.items)
      ? order.items
      : [];

  function toggleItem(itemId) {
    onChangeSelection(
      selectedIds.includes(itemId)
        ? selectedIds.filter(
            (id) => id !== itemId
          )
        : [...selectedIds, itemId]
    );
  }

  return (
    <div
      className="avo-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !busy &&
          !confirmAction &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <section
        className="avo-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Order management"
      >
        <header className="avo-modal-header">
          <div>
            <span className="avo-eyebrow">
              ORDER MANAGEMENT
            </span>

            <h2>
              {order?.order_number ||
                "Order Details"}
            </h2>

            <p>
              Accept, pack and prepare
              products for shipping.
            </p>
          </div>

          <button
            type="button"
            className="avo-modal-close"
            disabled={
              busy ||
              loading ||
              Boolean(confirmAction)
            }
            aria-label="Close order"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>

        <div className="avo-modal-body">
          {loading && (
            <div className="avo-modal-state">
              <LoaderCircle className="avo-spin" />

              Loading order...
            </div>
          )}

          {!!error &&
            !confirmAction && (
              <div className="avo-alert avo-alert-error">
                <AlertCircle size={17} />

                {error}
              </div>
            )}

          {!!notice && (
            <div className="avo-alert avo-alert-success">
              <CheckCircle2 size={17} />

              {notice}
            </div>
          )}

          {!loading && order && (
            <>
              <section className="avo-order-overview">
                <div>
                  <small>Order Number</small>

                  <strong>
                    {order.order_number}
                  </strong>
                </div>

                <div>
                  <small>Placed On</small>

                  <strong>
                    {dateText(
                      order.created_at
                    )}
                  </strong>
                </div>

                <div>
                  <small>Vendor Items</small>

                  <strong>
                    {number(
                      order.vendor_item_count
                    )}
                  </strong>
                </div>

                <div>
                  <small>Vendor Total</small>

                  <strong>
                    {money(
                      order.vendor_total,
                      order.currency
                    )}
                  </strong>
                </div>
              </section>

              <div className="avo-details-grid">
                <section className="avo-detail-card">
                  <h3>
                    <MapPin size={18} />

                    Shipping Address
                  </h3>

                  <AddressBlock
                    address={
                      order.shipping_address
                    }
                  />
                </section>

                <section className="avo-detail-card">
                  <h3>
                    <CreditCard size={18} />

                    Payment Information
                  </h3>

                  {[
                    [
                      "Payment Method",
                      words(
                        order.payment_method
                      ),
                    ],
                    [
                      "Payment Status",
                      words(
                        order.payment_status
                      ),
                    ],
                    [
                      "Currency",
                      order.currency ||
                        "INR",
                    ],
                  ].map(([label, value]) => (
                    <div
                      className="avo-detail-row"
                      key={label}
                    >
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </section>
              </div>

              <section className="avo-fulfillment">
                <header className="avo-section-header">
                  <div>
                    <span className="avo-eyebrow">
                      ITEM FULFILLMENT
                    </span>

                    <h2>Your Order Items</h2>

                    <p>
                      Process products
                      together or separately.
                    </p>
                  </div>

                  <span className="avo-results">
                    {items.length} items
                  </span>
                </header>

                <BulkActions
                  items={items}
                  selectedIds={selectedIds}
                  busy={busy}
                  onChangeSelection={
                    onChangeSelection
                  }
                  onRequestStatus={
                    onRequestStatus
                  }
                  onMoveToShipping={
                    onMoveToShipping
                  }
                />

                <div className="avo-items-list">
                  {items.map((item) => (
                    <OrderItem
                      key={item.id}
                      item={item}
                      currency={
                        order.currency
                      }
                      busy={busy}
                      checked={
                        selectedIds.includes(
                          item.id
                        )
                      }
                      onToggle={
                        toggleItem
                      }
                      onRequestStatus={
                        onRequestStatus
                      }
                      onMoveToShipping={
                        onMoveToShipping
                      }
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        <ConfirmStatusOverlay
          action={confirmAction}
          busy={busy}
          error={error}
          onCancel={onCancelConfirm}
          onConfirm={onConfirmAction}
        />
      </section>
    </div>
  );
}

export default function OrdersPage() {
  const navigate = useNavigate();

  const operationLock = useRef(false);

  const [orders, setOrders] =
    useState([]);

  const [summary, setSummary] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [selectedIds, setSelectedIds] =
    useState([]);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [orderLoading, setOrderLoading] =
    useState(false);

  const [orderError, setOrderError] =
    useState("");

  const [orderNotice, setOrderNotice] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [confirmAction, setConfirmAction] =
    useState(null);

  const [error, setError] =
    useState("");

  const loadOrders = useCallback(
    async (initial = false) => {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const [
          ordersResponse,
          summaryResponse,
        ] = await Promise.all([
          vendorApi.getOrders(),

          vendorApi
            .getOrdersSummary()
            .catch(() => null),
        ]);

        setOrders(
          unwrapList(ordersResponse)
        );

        setSummary(
          unwrapSummary(
            summaryResponse
          )
        );

        setError("");
      } catch (err) {
        setError(
          err?.message ||
          "Unable to load orders."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadOrders(true);
  }, [loadOrders]);

  const refreshOrder = useCallback(
    async (orderId) => {
      const response =
        await vendorApi.getOrder(
          orderId
        );

      const result =
        unwrapOrder(response);

      if (
        !result ||
        !Array.isArray(result.items)
      ) {
        throw new Error(
          "Invalid order details."
        );
      }

      setSelectedOrder(result);

      setSelectedIds((previous) =>
        previous.filter((id) =>
          result.items.some(
            (item) =>
              item.id === id &&
              (
                canAccept(item) ||
                canPack(item) ||
                canShip(item)
              )
          )
        )
      );

      return result;
    },
    []
  );

  const openOrder = useCallback(
    async (entry) => {
      const orderId =
        entry?.order_id ||
        entry?.id;

      if (
        !orderId ||
        operationLock.current
      ) {
        return;
      }

      operationLock.current = true;

      setSelectedOrder({
        order_id: orderId,
        order_number:
          entry.order_number,
      });

      setSelectedIds([]);
      setModalOpen(true);
      setOrderLoading(true);
      setOrderError("");
      setOrderNotice("");
      setConfirmAction(null);

      try {
        await refreshOrder(orderId);
      } catch (err) {
        setOrderError(
          err?.message ||
          "Unable to load order."
        );
      } finally {
        setOrderLoading(false);
        operationLock.current = false;
      }
    },
    [refreshOrder]
  );

  const closeModal = useCallback(
    () => {
      if (
        busy ||
        orderLoading ||
        confirmAction
      ) {
        return;
      }

      setModalOpen(false);
      setSelectedOrder(null);
      setSelectedIds([]);
      setOrderError("");
      setOrderNotice("");
    },
    [
      busy,
      orderLoading,
      confirmAction,
    ]
  );

  function requestStatusChange(
    items,
    nextStatus,
    allItems = false
  ) {
    if (busy || !items.length) {
      return;
    }

    const eligible =
      nextStatus === "accepted"
        ? items.filter(canAccept)
        : items.filter(canPack);

    if (!eligible.length) {
      setOrderError(
        "No eligible products."
      );

      return;
    }

    setOrderError("");
    setOrderNotice("");

    setConfirmAction({
      items: eligible,
      nextStatus,
      allItems,
    });
  }

  const cancelConfirm =
    useCallback(() => {
      if (busy) return;

      setConfirmAction(null);
      setOrderError("");
    }, [busy]);

  async function confirmStatusChange() {
    if (
      !confirmAction ||
      operationLock.current
    ) {
      return;
    }

    const {
      items,
      nextStatus,
      allItems,
    } = confirmAction;

    const orderId =
      selectedOrder?.order_id;

    if (!orderId) return;

    operationLock.current = true;

    setBusy(true);
    setOrderError("");
    setOrderNotice("");

    try {
      if (
        items.length === 1 &&
        !allItems
      ) {
        await vendorApi
          .updateOrderItemStatus(
            items[0].id,
            {
              status: nextStatus,
            }
          );
      } else {
        await shippingApi
          .bulkUpdateOrderStatus(
            orderId,
            nextStatus,
            items.map(
              (item) => item.id
            )
          );
      }

      setConfirmAction(null);
      setSelectedIds([]);

      setOrderNotice(
        `${items.length} product(s) marked ${words(
          nextStatus
        )} successfully.`
      );

      await Promise.all([
        refreshOrder(orderId),
        loadOrders(),
      ]);
    } catch (err) {
      setOrderError(
        err?.message ||
        "Unable to update products."
      );
    } finally {
      setBusy(false);
      operationLock.current = false;
    }
  }

  function moveToShipping(items) {
    if (
      busy ||
      !selectedOrder?.order_id
    ) {
      return;
    }

    const eligible =
      items.filter(canShip);

    if (!eligible.length) {
      setOrderError(
        "No packed, unassigned products are available."
      );

      return;
    }

    const params =
      new URLSearchParams();

    params.set(
      "orderId",
      selectedOrder.order_id
    );

    eligible.forEach((item) => {
      params.append(
        "orderItemIds",
        item.id
      );
    });

    setModalOpen(false);

    navigate(
      `/shipping?${params.toString()}`
    );
  }

  const filteredOrders = useMemo(
    () => {
      const needle =
        search.trim().toLowerCase();

      return orders.filter((order) => {
        const text = [
          order.order_number,
          order.order_id,
          order.payment_method,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (
          needle &&
          !text.includes(needle)
        ) {
          return false;
        }

        if (statusFilter === "all") {
          return true;
        }

        return (
          order.item_statuses || []
        ).some(
          (status) =>
            statusOf(status) ===
            statusFilter
        );
      });
    },
    [
      orders,
      search,
      statusFilter,
    ]
  );

  const statusCounts =
    summary.status_counts || {};

  return (
    <div className="avo-page">
      <header className="avo-page-header">
        <div>
          <span className="avo-eyebrow">
            VENDOR OPERATIONS
          </span>

          <h1>Order Management</h1>

          <p>
            Accept and pack products
            individually or together.
          </p>
        </div>

        <button
          type="button"
          className="avo-button avo-button-light"
          disabled={refreshing}
          onClick={() => loadOrders()}
        >
          <RefreshCw size={16} />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="avo-alert avo-alert-error">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      <section className="avo-metrics">
        <MetricCard
          icon={ShoppingBag}
          label="Total Orders"
          value={number(
            summary.total_orders ??
            orders.length
          )}
          description="Orders containing your products"
        />

        <MetricCard
          icon={Package}
          label="Order Items"
          value={number(
            summary.total_order_items ??
            orders.reduce(
              (sum, order) =>
                sum +
                Number(
                  order.vendor_item_count || 0
                ),
              0
            )
          )}
          description="Your individual order items"
        />

        <MetricCard
          icon={Box}
          label="Units Ordered"
          value={number(
            summary.total_quantity ??
            orders.reduce(
              (sum, order) =>
                sum +
                Number(
                  order.vendor_quantity || 0
                ),
              0
            )
          )}
          description="Total ordered quantity"
        />

        <MetricCard
          icon={IndianRupee}
          label="Order Value"
          value={
            summary.total_value == null
              ? "—"
              : money(
                  summary.total_value
                )
          }
          description="Recorded vendor order value"
        />
      </section>

      <section className="avo-pipeline">
        <header className="avo-section-header">
          <div>
            <span className="avo-eyebrow">
              ORDER PREPARATION
            </span>

            <h2>Fulfillment Overview</h2>

            <p>
              Accept and pack here.
              Manage delivery in Shipping.
            </p>
          </div>

          <button
            type="button"
            className="avo-button avo-button-light"
            onClick={() =>
              navigate("/shipping")
            }
          >
            <Truck size={16} />

            Open Shipping

            <ArrowRight size={16} />
          </button>
        </header>

        <div className="avo-pipeline-grid">
          {PREPARATION.map((stage) => (
            <button
              type="button"
              key={stage}
              className={[
                "avo-pipeline-tile",
                statusFilter === stage
                  ? "avo-pipeline-tile-active"
                  : "",
              ].join(" ")}
              onClick={() =>
                setStatusFilter(
                  statusFilter === stage
                    ? "all"
                    : stage
                )
              }
            >
              <StatusIcon status={stage} />

              <span>{words(stage)}</span>

              <strong>
                {number(
                  statusCounts[stage] ??
                    orders
                      .flatMap(
                        (order) =>
                          order.item_statuses || []
                      )
                      .filter(
                        (status) =>
                          status === stage
                      ).length
                )}
              </strong>
            </button>
          ))}
        </div>

        <div className="avo-secondary-filters">
          {DELIVERY.map((stage) => (
            <button
              type="button"
              key={stage}
              className="avo-cancel-filter"
              onClick={() =>
                setStatusFilter(stage)
              }
            >
              <Truck size={15} />

              {words(stage)}

              <strong>
                {number(
                  statusCounts[stage] ??
                    orders
                      .flatMap(
                        (order) =>
                          order.item_statuses || []
                      )
                      .filter(
                        (status) =>
                          status === stage
                      ).length
                )}
              </strong>
            </button>
          ))}
        </div>
      </section>

      <section className="avo-queue">
        <header className="avo-section-header">
          <div>
            <span className="avo-eyebrow">
              ORDER DESK
            </span>

            <h2>Customer Orders</h2>

            <p>
              Open an order to manage
              its products.
            </p>
          </div>

          <span className="avo-results">
            {filteredOrders.length}
            {" results"}
          </span>
        </header>

        <div className="avo-toolbar">
          <label className="avo-search">
            <Search size={18} />

            <input
              type="search"
              value={search}
              placeholder="Search orders..."
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >
                <X size={16} />
              </button>
            )}
          </label>

          <label className="avo-filter">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              {FILTERS.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status === "all"
                    ? "All Fulfillment Statuses"
                    : words(status)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <div className="avo-empty">
            <LoaderCircle className="avo-spin" />

            <h3>Loading orders...</h3>
          </div>
        ) : !filteredOrders.length ? (
          <div className="avo-empty">
            <ShoppingBag size={28} />

            <h3>No matching orders</h3>

            <p>
              New orders will appear here.
            </p>
          </div>
        ) : (
          <div className="avo-orders-list">
            {filteredOrders.map(
              (order) => (
                <button
                  type="button"
                  className="avo-order-card"
                  key={order.order_id}
                  onClick={() =>
                    openOrder(order)
                  }
                >
                  <div>
                    <strong>
                      {order.order_number}
                    </strong>

                    <small>
                      {dateText(
                        order.created_at
                      )}
                      {" · "}
                      {order.vendor_item_count}
                      {" products"}
                    </small>
                  </div>

                  <div>
                    <StatusBadge
                      status={displayStatus(
                        order.item_statuses
                      )}
                    />

                    <strong>
                      {money(
                        order.vendor_total,
                        order.currency
                      )}
                    </strong>
                  </div>

                  <ArrowRight size={17} />
                </button>
              )
            )}
          </div>
        )}
      </section>

      {modalOpen &&
        createPortal(
          <OrderDetailsModal
            order={selectedOrder}
            loading={orderLoading}
            error={orderError}
            notice={orderNotice}
            busy={busy}
            selectedIds={selectedIds}
            onChangeSelection={
              setSelectedIds
            }
            confirmAction={confirmAction}
            onClose={closeModal}
            onRequestStatus={
              requestStatusChange
            }
            onMoveToShipping={
              moveToShipping
            }
            onCancelConfirm={
              cancelConfirm
            }
            onConfirmAction={
              confirmStatusChange
            }
          />,
          document.body
        )}
    </div>
  );
}