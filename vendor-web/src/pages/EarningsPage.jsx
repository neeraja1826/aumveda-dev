
import "./EarningsPage.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  IndianRupee,
  Info,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Search,
  WalletCards,
  X,
} from "lucide-react";

import { Link } from "react-router-dom";
import { vendorApi } from "../services/api";


const EMPTY_SUMMARY = {
  confirmed_earnings: 0,
  projected_earnings: 0,
  confirmed_order_items: 0,
  projected_order_items: 0,
  unreconciled_legacy_items: 0,
  settlement_balance_verified: false,
};

const STATUS_FILTERS = [
  { value: "all", label: "All earnings" },
  { value: "confirmed", label: "Confirmed" },
  { value: "projected", label: "Projected" },
];

const DATE_FILTERS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
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


function formatDate(value) {
  if (!value) return "—";

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


function dateMatches(value, filter) {
  if (filter === "all") return true;
  if (!value) return false;

  const date = new Date(value);
  const now = new Date();

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  if (filter === "today") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

  const days = Number(filter);

  if (!Number.isFinite(days) || days <= 0) {
    return true;
  }

  const cutoff = new Date(
    now.getTime() - days * 24 * 60 * 60 * 1000
  );

  return date >= cutoff && date <= now;
}


function unwrapObject(response) {
  return (
    response?.data?.summary ||
    response?.summary ||
    response?.data ||
    response ||
    {}
  );
}


function normalizeSummary(response) {
  const value = unwrapObject(response);

  return {
    confirmed_earnings: number(
      value.confirmed_earnings ??
      value.net_ledger_amount
    ),

    projected_earnings: number(
      value.projected_earnings
    ),

    confirmed_order_items: number(
      value.confirmed_order_items ??
      value.ledger_entry_count
    ),

    projected_order_items: number(
      value.projected_order_items
    ),

    unreconciled_legacy_items: number(
      value.unreconciled_legacy_items
    ),

    settlement_balance_verified:
      value.settlement_balance_verified === true,
  };
}


function normalizeEntries(response) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data?.entries)) {
    return response.data.entries;
  }

  if (Array.isArray(response?.entries)) {
    return response.entries;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}


function EarningsCard({
  title,
  amount,
  description,
  icon: Icon,
  variant = "default",
}) {
  return (
    <article
      className={`ave-finance-card ave-finance-card--${variant}`}
    >
      <div className="ave-finance-card-top">
        <span>{title}</span>

        <span className="ave-finance-card-icon">
          <Icon size={20} strokeWidth={1.8} />
        </span>
      </div>

      <strong>{currency(amount)}</strong>

      <p>{description}</p>
    </article>
  );
}


function EarningsStatus({ status }) {
  const confirmed = status === "confirmed";

  return (
    <span
      className={
        confirmed
          ? "ave-status ave-status--confirmed"
          : "ave-status ave-status--projected"
      }
    >
      {confirmed ? (
        <CheckCircle2 size={14} />
      ) : (
        <Clock3 size={14} />
      )}

      {confirmed ? "Confirmed" : "Projected"}
    </span>
  );
}


export default function EarningsPage() {
  const [summary, setSummary] = useState(
    EMPTY_SUMMARY
  );

  const [entries, setEntries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [dateFilter, setDateFilter] =
    useState("all");


  const loadEarnings = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const [
          historyResponse,
          summaryResponse,
        ] = await Promise.all([
          vendorApi.getEarnings(),
          vendorApi.getEarningsSummary(),
        ]);

        setEntries(
          normalizeEntries(historyResponse)
        );

        setSummary(
          normalizeSummary(summaryResponse)
        );

        setLoaded(true);
      } catch (err) {
        setError(
          err?.message ||
          "Unable to load your earnings."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );


  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);


  const filteredEntries = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return entries.filter((entry) => {
      const searchable = [
        entry.order_number,
        entry.product_name,
        entry.order_item_id,
        entry.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !keyword ||
        searchable.includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        entry.status === statusFilter;

      const matchesDate = dateMatches(
        entry.created_at,
        dateFilter
      );

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    entries,
    search,
    statusFilter,
    dateFilter,
  ]);


  const visibleTotal = useMemo(
    () =>
      filteredEntries.reduce(
        (total, entry) =>
          total + number(entry.amount),
        0
      ),
    [filteredEntries]
  );


  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("all");
  }


  if (loading && !loaded) {
    return (
      <div className="ave-page">
        <div className="ave-page-state">
          <LoaderCircle
            className="ave-spin"
            size={30}
          />

          <h2>Loading your earnings</h2>

          <p>
            Retrieving your net earnings and
            order history.
          </p>
        </div>
      </div>
    );
  }


  if (error && !loaded) {
    return (
      <div className="ave-page">
        <div className="ave-page-state">
          <AlertCircle size={30} />

          <h2>Earnings unavailable</h2>

          <p>{error}</p>

          <button
            type="button"
            className="ave-btn ave-btn--primary"
            onClick={() => loadEarnings()}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="ave-page">

      {/* HEADER */}

      <header className="ave-page-header">
        <div>
          <span className="ave-eyebrow">
            AUMVEDA VENDOR FINANCE
          </span>

          <h1>My Earnings</h1>

          <p>
            Track your net earnings from customer
            orders after the agreed platform
            deductions.
          </p>
        </div>

        <div className="ave-header-actions">
          <button
            type="button"
            className="ave-btn ave-btn--outline"
            disabled={refreshing}
            onClick={() => loadEarnings(true)}
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "ave-spin" : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <Link
            to="/payouts"
            className="ave-btn ave-btn--primary"
          >
            <WalletCards size={17} />
            View Payouts
          </Link>
        </div>
      </header>


      {/* API ERROR */}

      {error && (
        <div
          className="ave-alert ave-alert--error"
          role="alert"
        >
          <AlertCircle size={18} />

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


      {/* SUMMARY */}

      <section className="ave-summary-grid">
        <EarningsCard
          title="Confirmed Earnings"
          amount={summary.confirmed_earnings}
          description={
            "Net earnings from delivered orders with confirmed payment."
          }
          icon={IndianRupee}
          variant="primary"
        />

        <EarningsCard
          title="Projected Earnings"
          amount={summary.projected_earnings}
          description={
            "Potential net earnings from eligible orders awaiting completion."
          }
          icon={Clock3}
        />

        <EarningsCard
          title="Total Net Order Value"
          amount={
            summary.confirmed_earnings +
            summary.projected_earnings
          }
          description={
            "Combined confirmed and projected amounts; not a payout balance."
          }
          icon={PackageCheck}
        />
      </section>


      {/* ORDER COUNTS */}

      <section className="ave-quick-stats">
        <div>
          <span>
            <CheckCircle2 size={18} />
            Confirmed order items
          </span>

          <strong>
            {summary.confirmed_order_items}
          </strong>
        </div>

        <div>
          <span>
            <Clock3 size={18} />
            Projected order items
          </span>

          <strong>
            {summary.projected_order_items}
          </strong>
        </div>

        <div>
          <span>
            <FileText size={18} />
            Legacy items to reconcile
          </span>

          <strong>
            {summary.unreconciled_legacy_items}
          </strong>
        </div>
      </section>


      {/* IMPORTANT INFORMATION */}

      <div className="ave-information">
        <Info size={20} />

        <div>
          <strong>
            How your earnings are calculated
          </strong>

          <p>
            The amounts shown are your net
            entitlements calculated using the
            commission agreement captured for each
            order. Confirmed earnings require
            delivery and payment confirmation.
            They do not mean the funds have already
            been transferred.
          </p>
        </div>
      </div>


      {summary.unreconciled_legacy_items > 0 && (
        <div className="ave-information ave-information--warning">
          <AlertCircle size={20} />

          <div>
            <strong>
              Historical orders pending reconciliation
            </strong>

            <p>
              {summary.unreconciled_legacy_items}{" "}
              older order item(s) have no recorded
              commission snapshot. They are excluded
              from calculated earnings until the
              platform reconciles them.
            </p>
          </div>
        </div>
      )}


      {/* ORDER EARNINGS HISTORY */}

      <section className="ave-section">
        <div className="ave-section-header">
          <div>
            <span className="ave-eyebrow">
              FINANCIAL HISTORY
            </span>

            <h2>Order Earnings</h2>

            <p>
              Your net earnings by product and order.
            </p>
          </div>

          <div className="ave-filter-total">
            <span>VISIBLE NET AMOUNT</span>

            <strong>
              {currency(visibleTotal)}
            </strong>
          </div>
        </div>


        {/* FILTERS */}

        <div className="ave-toolbar">
          <div className="ave-search">
            <Search size={17} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={
                "Search product, order or reference..."
              }
              aria-label="Search earnings"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="ave-selects">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              aria-label="Filter earnings status"
            >
              {STATUS_FILTERS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(event.target.value)
              }
              aria-label="Filter earnings by date"
            >
              {DATE_FILTERS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>


        {/* RESULTS */}

        {filteredEntries.length === 0 ? (
          <div className="ave-empty">
            <WalletCards size={31} />

            <h3>
              {entries.length === 0
                ? "No eligible earnings yet"
                : "No matching records"}
            </h3>

            <p>
              {entries.length === 0
                ? "Net earnings for eligible orders will appear here."
                : "Try changing the search or filters."}
            </p>

            {(search ||
              statusFilter !== "all" ||
              dateFilter !== "all") && (
              <button
                type="button"
                className="ave-btn ave-btn--outline"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="ave-table-wrap">
            <table className="ave-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Date</th>
                  <th>Earning Status</th>
                  <th className="ave-money-cell">
                    Net Earnings
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredEntries.map(
                  (entry, index) => (
                    <tr
                      key={
                        entry.order_item_id ||
                        entry.id ||
                        index
                      }
                    >
                      <td>
                        <span className="ave-order-number">
                          {entry.order_number ||
                            "Order"}
                        </span>
                      </td>

                      <td>
                        <strong className="ave-product-name">
                          {entry.product_name ||
                            "Product"}
                        </strong>
                      </td>

                      <td>
                        {entry.quantity ?? "—"}
                      </td>

                      <td>
                        {formatDate(entry.created_at)}
                      </td>

                      <td>
                        <EarningsStatus
                          status={entry.status}
                        />
                      </td>

                      <td className="ave-money-cell">
                        <strong>
                          {currency(entry.amount)}
                        </strong>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        <footer className="ave-table-footer">
          <span>
            Showing {filteredEntries.length} of{" "}
            {entries.length} earnings records
          </span>

          {(search ||
            statusFilter !== "all" ||
            dateFilter !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}
        </footer>
      </section>


      {/* PAYOUT LINK */}

      <section className="ave-bottom-banner">
        <span className="ave-bottom-icon">
          <WalletCards size={23} />
        </span>

        <div>
          <strong>
            Looking for money transferred to you?
          </strong>

          <p>
            Open Payouts to see pending, processing,
            completed and failed transfers recorded
            by the platform.
          </p>
        </div>

        <Link to="/payouts">
          View Payouts
          <ArrowRight size={17} />
        </Link>
      </section>

    </div>
  );
}
