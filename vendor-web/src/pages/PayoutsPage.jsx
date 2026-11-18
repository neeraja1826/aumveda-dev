
import "./PayoutsPage.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Eye,
  IndianRupee,
  Info,
  Landmark,
  LoaderCircle,
  RefreshCw,
  Search,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";

import { Link } from "react-router-dom";
import { vendorApi } from "../services/api";


const EMPTY_SUMMARY = {
  total_payouts: 0,
  pending_payouts: 0,
  pending_amount: 0,
  processing_payouts: 0,
  processing_amount: 0,
  paid_payouts: 0,
  paid_amount: 0,
  failed_payouts: 0,
  failed_amount: 0,
};

const STATUSES = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
];


function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}


function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number(value));
}


function formatDate(value, withTime = false) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(date);
}


function statusLabel(value) {
  const status = String(value || "").toLowerCase();

  return {
    pending: "Pending",
    processing: "Processing",
    paid: "Paid",
    failed: "Failed",
  }[status] || "Unknown";
}


function normalizePayouts(response) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data?.payouts)) {
    return response.data.payouts;
  }

  if (Array.isArray(response?.payouts)) {
    return response.payouts;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}


function normalizeSummary(response) {
  const value =
    response?.data?.summary ||
    response?.summary ||
    response?.data ||
    response ||
    {};

  return {
    total_payouts: number(value.total_payouts),
    pending_payouts: number(value.pending_payouts),
    pending_amount: number(value.pending_amount),
    processing_payouts: number(
      value.processing_payouts
    ),
    processing_amount: number(
      value.processing_amount
    ),
    paid_payouts: number(value.paid_payouts),
    paid_amount: number(value.paid_amount),
    failed_payouts: number(value.failed_payouts),
    failed_amount: number(value.failed_amount),
  };
}


function normalizeDetail(response) {
  const value =
    response?.data?.payout ||
    response?.payout ||
    response?.data ||
    response;

  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value
    : null;
}


function PayoutBadge({ status }) {
  const normalized = String(
    status || "pending"
  ).toLowerCase();

  const Icon =
    normalized === "paid"
      ? CheckCircle2
      : normalized === "failed"
        ? XCircle
        : Clock3;

  return (
    <span
      className={
        `avpay-badge avpay-badge--${normalized}`
      }
    >
      <Icon size={14} />
      {statusLabel(normalized)}
    </span>
  );
}


function PayoutMetric({
  title,
  amount,
  count,
  icon: Icon,
  tone = "default",
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      className={
        `avpay-metric avpay-metric--${tone} ${
          active ? "avpay-metric--active" : ""
        }`
      }
      aria-pressed={active}
      onClick={onClick}
    >
      <div className="avpay-metric-top">
        <span>{title}</span>

        <span className="avpay-metric-icon">
          <Icon size={20} />
        </span>
      </div>

      <strong>{currency(amount)}</strong>

      <small>
        {count} payout{count === 1 ? "" : "s"}
      </small>
    </button>
  );
}


function DetailRow({ label, value, code = false }) {
  return (
    <div className="avpay-detail-row">
      <span>{label}</span>

      <strong
        className={
          code ? "avpay-monospace" : ""
        }
      >
        {value}
      </strong>
    </div>
  );
}


function PayoutModal({
  payout,
  loading,
  error,
  onClose,
}) {
  useEffect(() => {
    function onEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      onEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        onEscape
      );
    };
  }, [onClose]);


  return (
    <div
      className="avpay-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="avpay-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avpay-dialog-title"
      >
        <header className="avpay-modal-header">
          <div>
            <span className="avpay-eyebrow">
              PAYMENT DETAILS
            </span>

            <h2 id="avpay-dialog-title">
              Vendor Payout
            </h2>

            <p>
              Transfer information recorded by
              the platform.
            </p>
          </div>

          <button
            type="button"
            className="avpay-modal-close"
            onClick={onClose}
            aria-label="Close payout details"
          >
            <X size={20} />
          </button>
        </header>

        {loading ? (
          <div className="avpay-modal-state">
            <LoaderCircle
              className="avpay-spin"
              size={30}
            />

            <p>Loading payout details...</p>
          </div>
        ) : error ? (
          <div className="avpay-modal-state">
            <AlertCircle size={28} />

            <p>{error}</p>
          </div>
        ) : !payout ? (
          <div className="avpay-modal-state">
            <p>No payout information available.</p>
          </div>
        ) : (
          <div className="avpay-modal-body">
            <div className="avpay-detail-hero">
              <span>VENDOR PAYOUT AMOUNT</span>

              <strong>
                {currency(payout.amount)}
              </strong>

              <PayoutBadge status={payout.status} />
            </div>

            <div className="avpay-detail-card">
              <h3>Transfer Information</h3>

              <DetailRow
                label="Payout ID"
                value={payout.id || "—"}
                code
              />

              <DetailRow
                label="Payment Reference"
                value={
                  payout.payment_reference ||
                  "Not assigned"
                }
                code
              />

              <DetailRow
                label="Transfer Status"
                value={statusLabel(payout.status)}
              />

              <DetailRow
                label="Record Created"
                value={formatDate(
                  payout.created_at,
                  true
                )}
              />

              <DetailRow
                label="Last Updated"
                value={formatDate(
                  payout.updated_at,
                  true
                )}
              />

              <DetailRow
                label="Processed At"
                value={formatDate(
                  payout.processed_at,
                  true
                )}
              />
            </div>

            <div className="avpay-detail-note">
              <Info size={17} />

              <p>
                This record reflects the payout
                status stored by AUMVEDA. A Paid
                status indicates that the platform
                recorded the transfer as completed.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}


export default function PayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [summary, setSummary] = useState(
    EMPTY_SUMMARY
  );

  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedPayout, setSelectedPayout] =
    useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] =
    useState(false);

  const [detailError, setDetailError] =
    useState("");

  const requestRef = useRef(0);


  const loadPayouts = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const [
          recordsResponse,
          summaryResponse,
        ] = await Promise.all([
          vendorApi.getPayouts(),
          vendorApi.getPayoutsSummary(),
        ]);

        setPayouts(
          normalizePayouts(recordsResponse)
        );

        setSummary(
          normalizeSummary(summaryResponse)
        );

        setLoaded(true);
      } catch (err) {
        setError(
          err?.message ||
          "Unable to load payout records."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );


  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);


  const filteredPayouts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return payouts.filter((payout) => {
      const searchable = [
        payout.id,
        payout.payment_reference,
        payout.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !keyword ||
        searchable.includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        String(payout.status || "")
          .toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payouts, search, statusFilter]);


  const visibleAmount = useMemo(
    () =>
      filteredPayouts.reduce(
        (total, payout) =>
          total + number(payout.amount),
        0
      ),
    [filteredPayouts]
  );


  async function openPayout(payout) {
    const currentRequest = ++requestRef.current;

    setSelectedPayout(null);
    setDetailError("");
    setDetailLoading(true);
    setModalOpen(true);

    try {
      const response = await vendorApi.getPayout(
        payout.id
      );

      if (currentRequest !== requestRef.current) {
        return;
      }

      const result = normalizeDetail(response);

      if (!result) {
        throw new Error(
          "Payout information was not returned."
        );
      }

      setSelectedPayout(result);
    } catch (err) {
      if (currentRequest === requestRef.current) {
        setDetailError(
          err?.message ||
          "Unable to load payout details."
        );
      }
    } finally {
      if (currentRequest === requestRef.current) {
        setDetailLoading(false);
      }
    }
  }


  const closeModal = useCallback(() => {
    requestRef.current += 1;

    setModalOpen(false);
    setSelectedPayout(null);
    setDetailLoading(false);
    setDetailError("");
  }, []);


  function changeStatusFilter(value) {
    setStatusFilter((current) =>
      current === value ? "all" : value
    );
  }


  if (loading && !loaded) {
    return (
      <div className="avpay-page">
        <div className="avpay-page-state">
          <LoaderCircle
            className="avpay-spin"
            size={30}
          />

          <h2>Loading payouts</h2>

          <p>
            Retrieving your payment records.
          </p>
        </div>
      </div>
    );
  }


  if (error && !loaded) {
    return (
      <div className="avpay-page">
        <div className="avpay-page-state">
          <AlertCircle size={30} />

          <h2>Payouts unavailable</h2>

          <p>{error}</p>

          <button
            type="button"
            className="avpay-btn avpay-btn--primary"
            onClick={() => loadPayouts()}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="avpay-page">

      {/* HEADER */}

      <header className="avpay-page-header">
        <div>
          <span className="avpay-eyebrow">
            AUMVEDA VENDOR FINANCE
          </span>

          <h1>Payout Center</h1>

          <p>
            Track payments transferred or scheduled
            by the platform to your business.
          </p>
        </div>

        <div className="avpay-header-actions">
          <Link
            to="/earnings"
            className="avpay-btn avpay-btn--outline"
          >
            <ArrowLeft size={16} />
            My Earnings
          </Link>

          <button
            type="button"
            className="avpay-btn avpay-btn--primary"
            disabled={refreshing}
            onClick={() => loadPayouts(true)}
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "avpay-spin" : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </header>


      {/* ERRORS */}

      {error && (
        <div className="avpay-alert" role="alert">
          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}


      {/* SUMMARY */}

      <section className="avpay-summary-grid">
        <article className="avpay-main-card">
          <div className="avpay-main-card-top">
            <div>
              <span>TOTAL RECEIVED</span>

              <h2>Completed Payouts</h2>
            </div>

            <span className="avpay-main-icon">
              <IndianRupee size={23} />
            </span>
          </div>

          <strong>
            {currency(summary.paid_amount)}
          </strong>

          <p>
            Amount recorded as paid by AUMVEDA
            to your business.
          </p>

          <div className="avpay-main-footer">
            <CheckCircle2 size={17} />

            {summary.paid_payouts} completed{" "}
            payout
            {summary.paid_payouts === 1 ? "" : "s"}
          </div>
        </article>


        <div className="avpay-metrics-grid">
          <PayoutMetric
            title="Pending"
            amount={summary.pending_amount}
            count={summary.pending_payouts}
            icon={Clock3}
            tone="pending"
            active={statusFilter === "pending"}
            onClick={() =>
              changeStatusFilter("pending")
            }
          />

          <PayoutMetric
            title="Processing"
            amount={summary.processing_amount}
            count={summary.processing_payouts}
            icon={Landmark}
            tone="processing"
            active={statusFilter === "processing"}
            onClick={() =>
              changeStatusFilter("processing")
            }
          />

          <PayoutMetric
            title="Failed"
            amount={summary.failed_amount}
            count={summary.failed_payouts}
            icon={XCircle}
            tone="failed"
            active={statusFilter === "failed"}
            onClick={() =>
              changeStatusFilter("failed")
            }
          />
        </div>
      </section>


      {/* NOTICE */}

      <div className="avpay-information">
        <Info size={20} />

        <div>
          <strong>About your payouts</strong>

          <p>
            Only Admin can initiate and process
            vendor transfers. Pending and processing
            amounts are not yet received funds.
            Failed payouts are shown separately and
            are not counted as completed transfers.
          </p>
        </div>
      </div>


      {/* PAYOUT HISTORY */}

      <section className="avpay-section">
        <header className="avpay-section-header">
          <div>
            <span className="avpay-eyebrow">
              PAYMENT HISTORY
            </span>

            <h2>Your Payouts</h2>

            <p>
              Individual transfers and their
              recorded processing status.
            </p>
          </div>

          <div className="avpay-record-count">
            <strong>
              {summary.total_payouts}
            </strong>

            <span>total payout records</span>
          </div>
        </header>


        {/* FILTERS */}

        <div className="avpay-toolbar">
          <div className="avpay-search">
            <Search size={17} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={
                "Search payment reference or payout ID..."
              }
              aria-label="Search payouts"
            />

            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            aria-label="Filter payout status"
          >
            {STATUSES.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>


        {/* PAYOUT RECORDS */}

        {filteredPayouts.length === 0 ? (
          <div className="avpay-empty">
            <WalletCards size={32} />

            <h3>
              {payouts.length === 0
                ? "No payouts recorded yet"
                : "No matching payouts"}
            </h3>

            <p>
              {payouts.length === 0
                ? "Your payment records will appear here when AUMVEDA schedules or records a transfer."
                : "Try another search or payout status."}
            </p>

            {(search || statusFilter !== "all") && (
              <button
                type="button"
                className="avpay-btn avpay-btn--outline"
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
          <div className="avpay-table-wrap">
            <table className="avpay-table">
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Payout Reference</th>
                  <th>Status</th>
                  <th>Processed</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayouts.map((payout) => (
                  <tr key={payout.id}>
                    <td>
                      {formatDate(payout.created_at)}
                    </td>

                    <td>
                      <strong className="avpay-reference">
                        {payout.payment_reference ||
                          "Not assigned"}
                      </strong>

                      <small>
                        ID:{" "}
                        {String(payout.id || "")
                          .slice(0, 8)}
                      </small>
                    </td>

                    <td>
                      <PayoutBadge
                        status={payout.status}
                      />
                    </td>

                    <td>
                      {formatDate(
                        payout.processed_at
                      )}
                    </td>

                    <td className="avpay-amount">
                      <strong>
                        {currency(payout.amount)}
                      </strong>
                    </td>

                    <td>
                      <button
                        type="button"
                        className={
                          "avpay-btn avpay-btn--outline avpay-view-btn"
                        }
                        onClick={() =>
                          openPayout(payout)
                        }
                      >
                        <Eye size={15} />
                        View
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}


        <footer className="avpay-table-footer">
          <span>
            Showing {filteredPayouts.length} of{" "}
            {payouts.length} payout records
          </span>

          <span>
            Filtered total: {currency(visibleAmount)}
          </span>
        </footer>
      </section>


      {/* MODAL */}

      {modalOpen && (
        <PayoutModal
          payout={selectedPayout}
          loading={detailLoading}
          error={detailError}
          onClose={closeModal}
        />
      )}

    </div>
  );
}
