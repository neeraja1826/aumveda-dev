import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import {
  useSearchParams,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";

import {
  shippingApi,
} from "../services/shippingApi";

import "./shipping.css";

const NEXT_STATUS = {
  ready: "shipped",
  shipped: "in_transit",
  in_transit: "out_for_delivery",
  out_for_delivery: "delivered",
};

const STAGES = [
  "ready",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

const LABELS = {
  ready: "Ready",
  shipped: "Shipped",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  returned: "Returned",
};

const checkboxStyle = {
  width: 18,
  height: 18,
  accentColor: "#256344",
  cursor: "pointer",
  flexShrink: 0,
};

function labelStatus(value) {
  return (
    LABELS[value] ||
    String(value || "Unknown")
      .replace(/_/g, " ")
  );
}

function formatDate(value) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function StatusPill({ status }) {
  return (
    <span
      className={`shipping-pill shipping-pill--${
        status || "ready"
      }`}
    >
      {labelStatus(status)}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="shipping-empty">
      <Icon
        size={27}
        strokeWidth={1.6}
      />

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  );
}

function ErrorMessage({
  message,
}) {
  if (!message) return null;

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        color: "#A12E2E",
        background: "#FFF1F1",
        border: "1px solid #F1CCCC",
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 15,
      }}
    >
      <AlertCircle size={18} />

      <span>{message}</span>
    </div>
  );
}

function SuccessMessage({
  message,
}) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="shipping-complete"
      style={{ marginBottom: 15 }}
    >
      <CheckCircle2 size={17} />

      {message}
    </div>
  );
}

function Modal({
  title,
  eyebrow,
  subtitle,
  busy,
  onClose,
  children,
}) {
  useEffect(() => {
    const previous =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKey(event) {
      if (
        event.key === "Escape" &&
        !busy
      ) {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKey
    );

    return () => {
      document.body.style.overflow =
        previous;

      document.removeEventListener(
        "keydown",
        handleKey
      );
    };
  }, [busy, onClose]);

  return createPortal(
    <div
      className="shipping-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !busy
        ) {
          onClose();
        }
      }}
    >
      <section
        className="shipping-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="shipping-modal-head">
          <div>
            <span className="shipping-eyebrow">
              {eyebrow}
            </span>

            <h3>{title}</h3>

            {subtitle && (
              <p>{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            className="shipping-close"
            disabled={busy}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="shipping-modal-body">
          {children}
        </div>
      </section>
    </div>,
    document.body
  );
}

function AWBForm({
  order,
  items,
  initialIds,
  busy,
  error,
  onCreate,
  onClose,
}) {
  const [selectedIds, setSelectedIds] =
    useState(initialIds);

  const [mode, setMode] =
    useState("automatic");

  const [awb, setAwb] =
    useState("");

  const [courier, setCourier] =
    useState("");

  const selected = items.filter(
    (item) =>
      selectedIds.includes(item.id)
  );

  const totalQuantity =
    selected.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );

  const allSelected =
    items.length > 0 &&
    items.every((item) =>
      selectedIds.includes(item.id)
    );

  function toggleItem(itemId) {
    setSelectedIds((previous) =>
      previous.includes(itemId)
        ? previous.filter(
            (id) => id !== itemId
          )
        : [...previous, itemId]
    );
  }

  function submit(event) {
    event.preventDefault();

    if (
      busy ||
      !selected.length
    ) {
      return;
    }

    onCreate(
      order.order_id,
      selected.map(
        (item) => item.id
      ),
      {
        awb_source: mode,
        awb_number:
          mode === "manual"
            ? awb.trim()
            : undefined,
        courier_name:
          courier.trim() ||
          undefined,
      }
    );
  }

  const invalidManual =
    mode === "manual" &&
    (
      awb.trim().length < 3 ||
      courier.trim().length < 2
    );

  return (
    <Modal
      title="Create Shipment"
      eyebrow="SHIPMENT PREPARATION"
      subtitle={
        order.order_number ||
        order.order_id
      }
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <ErrorMessage
          message={error}
        />

        <section className="shipping-panel">
          <div className="shipping-panel-head">
            <div>
              <h3>Select Products</h3>

              <p>
                Selected products will
                share one AWB number.
              </p>
            </div>

            <span className="shipping-count">
              {selected.length} selected
            </span>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#F0F6EE",
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              style={checkboxStyle}
              checked={allSelected}
              disabled={busy}
              onChange={() =>
                setSelectedIds(
                  allSelected
                    ? []
                    : items.map(
                        (item) => item.id
                      )
                )
              }
            />

            <strong>
              Select All Products
            </strong>
          </label>

          <div className="shipping-item-list">
            {items.map((item) => (
              <label
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 13,
                  marginBottom: 8,
                  border: selectedIds.includes(
                    item.id
                  )
                    ? "1px solid #256344"
                    : "1px solid #DFE8DF",
                  borderRadius: 9,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  style={checkboxStyle}
                  checked={
                    selectedIds.includes(
                      item.id
                    )
                  }
                  disabled={busy}
                  onChange={() =>
                    toggleItem(item.id)
                  }
                />

                <Package
                  size={20}
                  color="#457656"
                />

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <strong>
                    {item.product_name}
                  </strong>

                  <small
                    style={{
                      display: "block",
                      color: "#718274",
                      marginTop: 3,
                    }}
                  >
                    {[
                      item.variant_name,
                      item.sku,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </div>

                <strong>
                  Qty {item.quantity}
                </strong>
              </label>
            ))}
          </div>

          <div
            style={{
              background: "#EAF3E8",
              color: "#24583B",
              padding: 13,
              borderRadius: 9,
              marginTop: 14,
            }}
          >
            <strong>
              {selected.length} products
              · {totalQuantity} units
            </strong>

            <p
              style={{
                margin: "5px 0 0",
                fontSize: 13,
              }}
            >
              {selected.length > 1
                ? "Combined shipment — one AWB for all selected products."
                : "One AWB will be assigned to this shipment."}
            </p>

            {selected.length <
              items.length && (
              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: 12,
                }}
              >
                Unselected products will
                remain available for
                another shipment.
              </p>
            )}
          </div>
        </section>

        <section className="shipping-panel">
          <h3>AWB Assignment Method</h3>

          <p>
            Choose automatic generation
            or a courier-provided AWB.
          </p>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 15,
              marginBottom: 15,
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="awb-mode"
              style={{
                accentColor:
                  "#256344",
              }}
              checked={
                mode === "automatic"
              }
              disabled={busy}
              onChange={() =>
                setMode("automatic")
              }
            />

            <span>
              <strong>
                Generate AUMVEDA AWB
              </strong>

              <small
                style={{
                  display: "block",
                  marginTop: 4,
                }}
              >
                Automatically assign
                one unique AWB.
              </small>
            </span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="awb-mode"
              style={{
                accentColor:
                  "#256344",
              }}
              checked={
                mode === "manual"
              }
              disabled={busy}
              onChange={() =>
                setMode("manual")
              }
            />

            <span>
              <strong>
                Enter Courier AWB
              </strong>

              <small
                style={{
                  display: "block",
                  marginTop: 4,
                }}
              >
                Use the original AWB
                issued by the courier.
              </small>
            </span>
          </label>
        </section>

        <section className="shipping-panel">
          <div className="shipping-dispatch">
            <label>
              Courier Name
              {mode === "automatic"
                ? " (Optional)"
                : ""}

              <input
                value={courier}
                maxLength={150}
                disabled={busy}
                placeholder="e.g. DTDC"
                onChange={(event) =>
                  setCourier(
                    event.target.value
                  )
                }
              />
            </label>

            {mode === "manual" ? (
              <label>
                Courier AWB Number

                <input
                  value={awb}
                  maxLength={200}
                  disabled={busy}
                  autoComplete="off"
                  required
                  placeholder="Enter courier AWB"
                  onChange={(event) =>
                    setAwb(
                      event.target.value
                    )
                  }
                />
              </label>
            ) : (
              <p>
                <ShieldCheck size={16} />

                The backend will generate
                one AWB for this shipment.
              </p>
            )}
          </div>
        </section>

        <div className="shipping-modal-actions">
          <button
            type="button"
            className="shipping-button shipping-button--outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="shipping-button shipping-button--primary"
            disabled={
              busy ||
              !selected.length ||
              invalidManual
            }
          >
            {busy
              ? "Creating..."
              : selected.length > 1
                ? `Create Combined Shipment (${selected.length})`
                : "Create Shipment"}

            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ShipmentDetails({
  shipment,
  busy,
  error,
  onAdvance,
  onClose,
}) {
  const [courier, setCourier] =
    useState(
      shipment.courier_name || ""
    );

  const [confirmation, setConfirmation] =
    useState(false);

  const nextStatus =
    NEXT_STATUS[shipment.status];

  const currentIndex =
    STAGES.indexOf(shipment.status);

  const items =
    shipment.items || [];

  useEffect(() => {
    setCourier(
      shipment.courier_name || ""
    );

    setConfirmation(false);
  }, [
    shipment.id,
    shipment.status,
    shipment.courier_name,
  ]);

  const address =
    shipment.shipping_address;

  const addressText =
    typeof address === "string"
      ? address
      : address
        ? [
            address.full_name,
            address.address_line1,
            address.address_line2,
            address.city,
            address.state,
            address.postal_code ||
              address.pincode,
            address.country,
          ]
            .filter(Boolean)
            .join(", ")
        : "";

  return (
    <Modal
      eyebrow="SHIPMENT DETAILS"
      title={
        shipment.order_number ||
        "Shipment"
      }
      subtitle={`AWB: ${
        shipment.awb_number ||
        "Not available"
      }`}
      busy={busy}
      onClose={onClose}
    >
      <ErrorMessage
        message={error}
      />

      <div className="shipping-detail-line">
        <span>AWB Number</span>

        <strong className="shipping-mono">
          {shipment.awb_number || "—"}
        </strong>
      </div>

      <div className="shipping-detail-line">
        <span>AWB Source</span>

        <strong>
          {shipment.awb_source ===
          "manual"
            ? "Courier Provided"
            : "AUMVEDA Generated"}
        </strong>
      </div>

      <div className="shipping-detail-line">
        <span>Shipment Type</span>

        <strong>
          {items.length > 1
            ? "Combined Shipment"
            : "Individual Shipment"}
        </strong>
      </div>

      <div className="shipping-detail-line">
        <span>Products</span>

        <strong>
          {items.length}
        </strong>
      </div>

      <div className="shipping-detail-line">
        <span>Current Status</span>

        <StatusPill
          status={shipment.status}
        />
      </div>

      <div className="shipping-detail-line">
        <span>Shipped At</span>

        <strong>
          {formatDate(
            shipment.shipped_at
          )}
        </strong>
      </div>

      <div className="shipping-detail-line">
        <span>Delivered At</span>

        <strong>
          {formatDate(
            shipment.delivered_at
          )}
        </strong>
      </div>

      <div className="shipping-stages">
        {STAGES.map((stage, index) => (
          <div
            key={stage}
            className={[
              "shipping-stage",
              index <= currentIndex
                ? "done"
                : "",
            ].join(" ")}
          >
            <span>
              {index <= currentIndex ? (
                <CheckCircle2
                  size={15}
                />
              ) : (
                index + 1
              )}
            </span>

            <small>
              {labelStatus(stage)}
            </small>
          </div>
        ))}
      </div>

      <h4>
        Shipment Items
        ({items.length})
      </h4>

      <section className="shipping-panel">
        <p
          style={{
            color: "#24583B",
            marginTop: 0,
          }}
        >
          All products listed below share
          the same AWB and shipment status.
        </p>

        <div className="shipping-item-list">
          {items.map((item) => (
            <div key={item.id}>
              <div>
                <strong>
                  {item.product_name}
                </strong>

                <small>
                  {[
                    item.variant_name,
                    item.sku,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>

                <small>
                  Item status:{" "}
                  {labelStatus(
                    item.status
                  )}
                </small>
              </div>

              <span>
                Qty{" "}
                {item.shipment_quantity ??
                  item.quantity}
              </span>
            </div>
          ))}
        </div>
      </section>

      {addressText && (
        <div className="shipping-address">
          <MapPin size={17} />

          <span>{addressText}</span>
        </div>
      )}

      <div className="shipping-courier">
        <div className="shipping-detail-line">
          <span>Courier</span>

          <strong>
            {shipment.courier_name ||
              "Not assigned"}
          </strong>
        </div>

        <div className="shipping-detail-line">
          <span>AWB / Tracking Number</span>

          <strong className="shipping-mono">
            {shipment.awb_number ||
              "—"}
          </strong>
        </div>
      </div>

      {nextStatus === "shipped" && (
        <div className="shipping-dispatch">
          <h4>Dispatch Details</h4>

          <p>
            The AWB is already assigned.
            Confirm the courier name.
          </p>

          <label>
            Courier Name

            <input
              value={courier}
              disabled={
                busy ||
                confirmation
              }
              maxLength={150}
              placeholder="Courier name"
              onChange={(event) =>
                setCourier(
                  event.target.value
                )
              }
            />
          </label>
        </div>
      )}

      {nextStatus && (
        <div className="shipping-modal-actions">
          {confirmation ? (
            <div className="shipping-confirm">
              <p>
                Confirm shipment status
                change to{" "}
                <strong>
                  {labelStatus(
                    nextStatus
                  )}
                </strong>
                ?

                This updates all{" "}
                {items.length} linked
                products.
              </p>

              <div>
                <button
                  type="button"
                  className="shipping-button shipping-button--outline"
                  disabled={busy}
                  onClick={() =>
                    setConfirmation(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="shipping-button shipping-button--primary"
                  style={{
                    color: "#FFFFFF",
                    background: "#256344",
                  }}
                  disabled={busy}
                  onClick={() =>
                    onAdvance(
                      shipment.id,
                      nextStatus,
                      courier
                    )
                  }
                >
                  {busy
                    ? "Updating..."
                    : "Confirm Update"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="shipping-button shipping-button--primary"
              disabled={
                busy ||
                !shipment.awb_number ||
                (
                  nextStatus === "shipped" &&
                  courier.trim().length < 2
                )
              }
              onClick={() =>
                setConfirmation(true)
              }
            >
              Mark as{" "}
              {labelStatus(nextStatus)}

              <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}

      {shipment.status ===
        "delivered" && (
        <p className="shipping-complete">
          <CheckCircle2 size={17} />

          All products in this shipment
          have been delivered.
        </p>
      )}
    </Modal>
  );
}

export default function ShippingPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const operationLock = useRef(false);

  const [readyItems, setReadyItems] =
    useState([]);

  const [shipments, setShipments] =
    useState([]);

  const [preparing, setPreparing] =
    useState(null);

  const [selected, setSelected] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [modalError, setModalError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  const loadData = useCallback(
    async ({
      initial = false,
      signal,
    } = {}) => {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const [
          ready,
          current,
        ] = await Promise.all([
          shippingApi.getReadyItems(
            signal
          ),

          shippingApi.getShipments(
            signal
          ),
        ]);

        if (signal?.aborted) {
          return;
        }

        setReadyItems(
          Array.isArray(ready)
            ? ready
            : []
        );

        setShipments(
          Array.isArray(current)
            ? current
            : []
        );

        setError("");
      } catch (err) {
        if (
          err?.name !== "AbortError" &&
          !signal?.aborted
        ) {
          setError(
            err?.message ||
            "Unable to load shipping."
          );
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller =
      new AbortController();

    loadData({
      initial: true,
      signal: controller.signal,
    });

    return () =>
      controller.abort();
  }, [loadData]);

  // Group packed products by order.
  const readyOrders = useMemo(
    () => {
      const groups = new Map();

      readyItems.forEach((item) => {
        if (!item.order_id) {
          return;
        }

        if (
          !groups.has(item.order_id)
        ) {
          groups.set(
            item.order_id,
            {
              order_id:
                item.order_id,

              order_number:
                item.order_number,

              items: [],
            }
          );
        }

        groups
          .get(item.order_id)
          .items
          .push(item);
      });

      return Array.from(
        groups.values()
      );
    },
    [readyItems]
  );

  const readyByOrder = useMemo(
    () =>
      new Map(
        readyOrders.map((order) => [
          order.order_id,
          order,
        ])
      ),
    [readyOrders]
  );

  // Consume the Orders page handoff once.
  useEffect(() => {
    if (
      loading ||
      error ||
      busy ||
      preparing ||
      selected
    ) {
      return;
    }

    const legacyItemId =
      searchParams.get(
        "orderItemId"
      );

    const orderId =
      searchParams.get("orderId");

    const requestedIds =
      searchParams.getAll(
        "orderItemIds"
      );

    if (
      legacyItemId &&
      !requestedIds.length
    ) {
      requestedIds.push(
        legacyItemId
      );
    }

    if (
      !orderId &&
      !requestedIds.length
    ) {
      return;
    }

    const requestedOrder =
      orderId ||
      readyItems.find(
        (item) =>
          requestedIds.includes(
            item.id
          )
      )?.order_id;

    const group =
      readyByOrder.get(
        requestedOrder
      );

    const ids = group
      ? group.items
          .filter((item) =>
            requestedIds.includes(
              item.id
            )
          )
          .map((item) => item.id)
      : [];

    if (
      group?.items.length &&
      (
        ids.length > 0 ||
        !requestedIds.length
      )
    ) {
      setPreparing({
        orderId:
          group.order_id,

        initialIds:
          requestedIds.length
            ? ids
            : group.items.map(
                (item) => item.id
              ),
      });

      setModalError("");

      if (
        requestedIds.length >
        ids.length &&
        ids.length > 0
      ) {
        setNotice(
          "Some selected products are no longer available for shipping."
        );
      }
    } else {
      setNotice(
        "The selected products are no longer available. Refresh Orders."
      );
    }

    const params =
      new URLSearchParams(
        searchParams
      );

    params.delete("orderId");
    params.delete("orderItemId");
    params.delete("orderItemIds");

    setSearchParams(params, {
      replace: true,
    });
  }, [
    loading,
    error,
    busy,
    preparing,
    selected,
    searchParams,
    readyItems,
    readyByOrder,
    setSearchParams,
  ]);

  const counts = useMemo(
    () => ({
      ready:
        readyItems.length,

      total:
        shipments.length,

      active:
        shipments.filter(
          (item) =>
            ![
              "delivered",
              "returned",
            ].includes(item.status)
        ).length,

      delivered:
        shipments.filter(
          (item) =>
            item.status ===
            "delivered"
        ).length,
    }),
    [readyItems, shipments]
  );

  const visibleShipments =
    useMemo(() => {
      const needle =
        query.trim().toLowerCase();

      return shipments.filter(
        (item) => {
          if (
            filter === "active" &&
            [
              "delivered",
              "returned",
            ].includes(item.status)
          ) {
            return false;
          }

          if (
            filter === "delivered" &&
            item.status !== "delivered"
          ) {
            return false;
          }

          const text = [
            item.id,
            item.order_number,
            item.awb_number,
            item.courier_name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return (
            !needle ||
            text.includes(needle)
          );
        }
      );
    }, [
      shipments,
      query,
      filter,
    ]);

  function openPreparation(
    order,
    initialIds = null
  ) {
    if (operationLock.current) {
      return;
    }

    setModalError("");
    setNotice("");

    setPreparing({
      orderId:
        order.order_id,

      initialIds:
        initialIds ||
        order.items.map(
          (item) => item.id
        ),
    });
  }

  const closePreparation =
    useCallback(() => {
      if (busy) return;

      setPreparing(null);
      setModalError("");
    }, [busy]);

  const closeShipment =
    useCallback(() => {
      if (busy) return;

      setSelected(null);
      setModalError("");
    }, [busy]);

  async function createShipment(
    orderId,
    itemIds,
    options
  ) {
    if (
      operationLock.current ||
      !itemIds.length
    ) {
      return;
    }

    operationLock.current = true;

    setBusy(true);
    setModalError("");
    setNotice("");

    try {
      const result =
        await shippingApi
          .createCombinedShipment(
            orderId,
            itemIds,
            options
          );

      setPreparing(null);

      setNotice(
        `Shipment created with ${
          itemIds.length
        } product(s). AWB: ${
          result.awb_number ||
          "Assigned"
        }`
      );

      await loadData();

      if (result.shipment_id) {
        try {
          const details =
            await shippingApi
              .getShipment(
                result.shipment_id
              );

          setSelected(details);
        } catch {
          // Shipment has already been created.
          // It can be opened from the list.
        }
      }
    } catch (err) {
      setModalError(
        err?.message ||
        "Unable to create shipment."
      );
    } finally {
      operationLock.current = false;
      setBusy(false);
    }
  }

  async function openShipment(
    shipmentId
  ) {
    if (operationLock.current) {
      return;
    }

    operationLock.current = true;

    setBusy(true);
    setError("");
    setModalError("");

    try {
      const result =
        await shippingApi
          .getShipment(shipmentId);

      setSelected(result);
    } catch (err) {
      setError(
        err?.message ||
        "Unable to load shipment."
      );
    } finally {
      operationLock.current = false;
      setBusy(false);
    }
  }

  async function advanceShipment(
    shipmentId,
    target,
    courier
  ) {
    if (
      operationLock.current ||
      !selected
    ) {
      return;
    }

    operationLock.current = true;

    setBusy(true);
    setModalError("");
    setNotice("");

    try {
      const latest =
        await shippingApi
          .getShipment(shipmentId);

      if (
        NEXT_STATUS[latest.status] !==
        target
      ) {
        setSelected(latest);

        throw new Error(
          "Shipment status has changed. Review the latest status."
        );
      }

      const result =
        await shippingApi.updateStatus(
          shipmentId,
          {
            status: target,

            ...(target === "shipped"
              ? {
                  courier_name:
                    courier.trim(),
                }
              : {}),
          }
        );

      // Immediately reflect the successful update.
      setSelected((previous) => ({
        ...previous,
        ...(result?.shipment || {}),
        status: target,

        items: (
          previous?.items || []
        ).map((item) => ({
          ...item,

          status:
            target === "delivered"
              ? "delivered"
              : target === "shipped"
                ? "shipped"
                : item.status,
        })),
      }));

      setNotice(
        `Shipment marked ${labelStatus(
          target
        )} successfully.`
      );

      try {
        const updated =
          await shippingApi
            .getShipment(
              shipmentId
            );

        setSelected(updated);
      } catch {
        setNotice(
          "Shipment updated successfully. Refresh to load the latest details."
        );
      }

      await loadData();
    } catch (err) {
      setModalError(
        err?.message ||
        "Unable to update shipment."
      );
    } finally {
      operationLock.current = false;
      setBusy(false);
    }
  }

  const preparationOrder =
    preparing
      ? readyByOrder.get(
          preparing.orderId
        )
      : null;

  return (
    <div className="shipping-page">
      <header className="shipping-page-head">
        <div>
          <span className="shipping-eyebrow">
            VENDOR OPERATIONS
          </span>

          <h1>Shipping Management</h1>

          <p>
            Create combined or separate
            shipments with one AWB per
            shipment.
          </p>
        </div>

        <button
          type="button"
          className="shipping-button shipping-button--outline"
          disabled={
            refreshing || busy
          }
          onClick={() => loadData()}
        >
          <RefreshCw size={16} />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </header>

      <ErrorMessage
        message={error}
      />

      <SuccessMessage
        message={notice}
      />

      <section className="shipping-stats">
        {[
          {
            label:
              "Ready to Ship",
            value: counts.ready,
            Icon: Package,
          },

          {
            label:
              "Active Shipments",
            value: counts.active,
            Icon: Truck,
          },

          {
            label: "Delivered",
            value: counts.delivered,
            Icon: CheckCircle2,
          },

          {
            label:
              "Total Shipments",
            value: counts.total,
            Icon: Clock3,
          },
        ].map(
          ({
            label,
            value,
            Icon,
          }) => (
            <article
              className="shipping-stat"
              key={label}
            >
              <Icon size={19} />

              <span>{label}</span>

              <strong>{value}</strong>
            </article>
          )
        )}
      </section>

      <section className="shipping-panel">
        <div className="shipping-panel-head">
          <div>
            <h3>Ready to Ship</h3>

            <p>
              Select an entire order or
              individual packed products.
            </p>
          </div>

          <span className="shipping-count">
            {readyItems.length} items
          </span>
        </div>

        {loading ? (
          <p className="shipping-loading">
            Loading packed orders...
          </p>
        ) : !readyOrders.length ? (
          <EmptyState
            icon={PackageCheck}
            title="No parcels waiting"
            description="Packed products will appear here."
          />
        ) : (
          <div
            style={{
              display: "grid",
              gap: 14,
            }}
          >
            {readyOrders.map(
              (order) => (
                <article
                  key={order.order_id}
                  style={{
                    padding: 16,
                    border:
                      "1px solid #DCE8DB",
                    borderRadius: 12,
                    background:
                      "#FAFCF9",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      flexWrap: "wrap",
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <strong
                        className="shipping-mono"
                        style={{
                          color:
                            "#24583B",
                        }}
                      >
                        {order.order_number ||
                          order.order_id}
                      </strong>

                      <p
                        style={{
                          margin:
                            "5px 0 0",
                          fontSize: 13,
                        }}
                      >
                        {order.items.length}
                        {" packed products"}
                        {" · "}
                        {order.items.reduce(
                          (sum, item) =>
                            sum +
                            Number(
                              item.quantity || 0
                            ),
                          0
                        )}
                        {" units"}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="shipping-button shipping-button--primary"
                      disabled={busy}
                      onClick={() =>
                        openPreparation(
                          order
                        )
                      }
                    >
                      <Truck size={16} />

                      {order.items.length > 1
                        ? "Create Combined Shipment"
                        : "Create Shipment"}

                      <ArrowRight
                        size={15}
                      />
                    </button>
                  </div>

                  <div className="shipping-table-wrap">
                    <table className="shipping-table">
                      <thead>
                        <tr>
                          <th>Product</th>

                          <th>Quantity</th>

                          <th>Status</th>

                          <th className="shipping-action-col">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {order.items.map(
                          (item) => (
                            <tr
                              key={
                                item.id
                              }
                            >
                              <td>
                                <strong>
                                  {item.product_name}
                                </strong>

                                <small>
                                  {[
                                    item.variant_name,
                                    item.sku,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </small>
                              </td>

                              <td>
                                {item.quantity}
                              </td>

                              <td>
                                <StatusPill
                                  status="ready"
                                />
                              </td>

                              <td className="shipping-action-col">
                                <button
                                  type="button"
                                  className="shipping-button shipping-button--outline"
                                  disabled={
                                    busy
                                  }
                                  onClick={() =>
                                    openPreparation(
                                      order,
                                      [
                                        item.id,
                                      ]
                                    )
                                  }
                                >
                                  Ship Separately

                                  <ArrowRight
                                    size={15}
                                  />
                                </button>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      <section className="shipping-panel">
        <div className="shipping-panel-head">
          <div>
            <h3>Shipment Tracking</h3>

            <p>
              Manage delivery for each
              shipment using its AWB.
            </p>
          </div>
        </div>

        <div className="shipping-toolbar">
          <div className="shipping-search">
            <Search size={17} />

            <input
              value={query}
              aria-label="Search shipments"
              placeholder="Search order, AWB or courier..."
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
            />
          </div>

          <div className="shipping-tabs">
            {[
              ["all", "All"],
              ["active", "Active"],
              ["delivered", "Delivered"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  filter === value
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setFilter(value)
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="shipping-loading">
            Loading shipments...
          </p>
        ) : !visibleShipments.length ? (
          <EmptyState
            icon={Truck}
            title="No matching shipments"
            description="Created shipments will appear here."
          />
        ) : (
          <div className="shipping-table-wrap">
            <table className="shipping-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>AWB Number</th>
                  <th>Courier</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Created</th>

                  <th className="shipping-action-col">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleShipments.map(
                  (shipment) => (
                    <tr key={shipment.id}>
                      <td className="shipping-mono">
                        {shipment.order_number ||
                          "—"}
                      </td>

                      <td className="shipping-mono">
                        <strong>
                          {shipment.awb_number ||
                            "—"}
                        </strong>

                        <small>
                          {shipment.awb_source ===
                          "manual"
                            ? "Courier issued"
                            : "AUMVEDA issued"}
                        </small>
                      </td>

                      <td>
                        {shipment.courier_name ||
                          "Not assigned"}
                      </td>

                      <td>
                        <strong>
                          {shipment.item_count ??
                            "—"}
                          {" products"}
                        </strong>

                        <small>
                          {shipment.item_count > 1
                            ? "Combined shipment"
                            : "Individual shipment"}
                        </small>
                      </td>

                      <td>
                        <StatusPill
                          status={
                            shipment.status
                          }
                        />
                      </td>

                      <td>
                        {formatDate(
                          shipment.created_at
                        )}
                      </td>

                      <td className="shipping-action-col">
                        <button
                          type="button"
                          className="shipping-button shipping-button--outline"
                          disabled={busy}
                          onClick={() =>
                            openShipment(
                              shipment.id
                            )
                          }
                        >
                          Manage

                          <ArrowRight
                            size={15}
                          />
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {preparing &&
        preparationOrder && (
          <AWBForm
            key={
              preparing.orderId
            }
            order={
              preparationOrder
            }
            items={
              preparationOrder.items
            }
            initialIds={
              preparing.initialIds
            }
            busy={busy}
            error={modalError}
            onCreate={createShipment}
            onClose={
              closePreparation
            }
          />
        )}

      {selected && (
        <ShipmentDetails
          key={selected.id}
          shipment={selected}
          busy={busy}
          error={modalError}
          onAdvance={
            advanceShipment
          }
          onClose={closeShipment}
        />
      )}
    </div>
  );
}