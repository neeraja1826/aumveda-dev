
import "./PendingApprovalPage.css";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Store,
} from "lucide-react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const STATUS_CONTENT = {
  pending: {
    icon: Clock3,
    label: "APPLICATION PENDING",
    title: "Your vendor account is awaiting review",
    description:
      "Your business registration has been received. Your vendor dashboard will become available once your account is approved.",
    tone: "pending",
  },
  under_review: {
    icon: ShieldCheck,
    label: "APPLICATION UNDER REVIEW",
    title: "Your business is being reviewed",
    description:
      "Your vendor application is currently under review. Dashboard access will be available after approval.",
    tone: "pending",
  },
  rejected: {
    icon: AlertCircle,
    label: "APPLICATION NOT APPROVED",
    title: "Your vendor application was not approved",
    description:
      "Your vendor application has been marked as rejected. Please contact the platform administrator for further information.",
    tone: "rejected",
  },
  suspended: {
    icon: ShieldAlert,
    label: "ACCOUNT SUSPENDED",
    title: "Your vendor account is suspended",
    description:
      "Your vendor account is currently suspended. Please contact the platform administrator for assistance.",
    tone: "rejected",
  },
};

function normalizeStatus(value) {
  return String(value || "unknown")
    .trim()
    .toLowerCase();
}

function formatStatus(value) {
  return String(value || "Unknown")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PendingApprovalPage() {
  const navigate = useNavigate();

  const {
    user,
    vendor,
    loading,
    approved,
    membership,
    membershipActive,
    refreshUser,
    logout,
  } = useAuth();

  const [checking, setChecking] = React.useState(false);
  const [checkError, setCheckError] = React.useState("");

  async function handleRefresh() {
    if (checking) return;

    setChecking(true);
    setCheckError("");

    try {
      await refreshUser();
    } catch (error) {
      setCheckError(
        error?.message ||
        "Unable to check your approval status."
      );
    } finally {
      setChecking(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <main className="avpa-page">
        <div className="avpa-loading">
          <LoaderCircle size={29} className="avpa-spin" />
          <span>Checking vendor account status...</span>
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    approved &&
    (!membership || membershipActive)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  const status = normalizeStatus(vendor?.status);

  const inactiveMembership =
    membership && !membershipActive;

  const content = inactiveMembership
    ? {
        icon: ShieldAlert,
        label: "MEMBERSHIP INACTIVE",
        title: "Your vendor membership is inactive",
        description:
          "Your membership has been deactivated. Contact the vendor owner or an authorized administrator to restore access.",
        tone: "rejected",
      }
    : STATUS_CONTENT[status] || {
        icon: ShieldAlert,
        label: "ACCOUNT STATUS",
        title: "Your vendor account is not yet available",
        description:
          "Your vendor profile or approval status is unavailable. Check again or contact the platform administrator.",
        tone: "pending",
      };

  const Icon = content.icon;

  return (
    <main className="avpa-page">
      <section className="avpa-card">
        <div className="avpa-brand">
          <span className="avpa-brand-icon">
            <Store size={23} />
          </span>
          <strong>AUMVEDA</strong>
          <span>Vendor Portal</span>
        </div>

        <div className={`avpa-status-symbol avpa-tone-${content.tone}`}>
          <Icon size={34} strokeWidth={1.7} />
        </div>

        <span className="avpa-eyebrow">{content.label}</span>

        <h1>{content.title}</h1>

        <p className="avpa-description">
          {content.description}
        </p>

        <div className="avpa-business-card">
          <span>REGISTERED BUSINESS</span>

          <strong>
            {vendor?.business_name || "Vendor Account"}
          </strong>

          <div>
            <span>Current status</span>
            <b>
              {inactiveMembership
                ? "Inactive Membership"
                : formatStatus(status)}
            </b>
          </div>
        </div>

        {checkError && (
          <div className="avpa-error" role="alert">
            <AlertCircle size={17} />
            {checkError}
          </div>
        )}

        <div className="avpa-actions">
          <button
            type="button"
            className="avpa-button avpa-button-primary"
            disabled={checking}
            onClick={handleRefresh}
          >
            {checking ? (
              <LoaderCircle
                size={17}
                className="avpa-spin"
              />
            ) : (
              <RefreshCw size={17} />
            )}
            {checking ? "Checking..." : "Check Status"}
          </button>

          <button
            type="button"
            className="avpa-button avpa-button-light"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>

        <div className="avpa-footer">
          <ShieldCheck size={17} />
          <span>
            Your account status is managed by the platform.
            Checking status does not submit a new application.
          </span>
        </div>
      </section>
    </main>
  );
}
