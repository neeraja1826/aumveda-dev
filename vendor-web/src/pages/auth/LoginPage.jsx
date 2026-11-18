
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  Leaf,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Package,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sprout,
  TrendingUp,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useBranding } from "../../context/BrandingContext";
import AumvedaLogo from "../../components/common/AumvedaLogo";

import "./LoginPage.css";

/* =====================================================
   AUTHENTICATION HELPERS
===================================================== */

function destinationFor(user, vendor, membership) {
  if (!user) return null;

  if (
    membership?.is_active === false ||
    membership?.membership_active === false
  ) {
    return "/pending-approval";
  }

  if (!vendor) return "/dashboard";

  return String(vendor.status || "")
    .trim()
    .toLowerCase() === "approved"
    ? "/dashboard"
    : "/pending-approval";
}

function unwrap(response) {
  return response?.data || response || {};
}

/* =====================================================
   DECORATIVE WORKSPACE
===================================================== */

function WorkspacePreview() {
  const heights = [36, 51, 44, 66, 53, 73, 62, 86, 78];

  return (
    <div className="av6-preview" aria-hidden="true">
      <div className="av6-preview-window">
        <div className="av6-preview-toolbar">
          <div className="av6-preview-dots">
            <i />
            <i />
            <i />
          </div>
          <span>AUMVEDA WORKSPACE</span>
          <Leaf size={14} />
        </div>

        <div className="av6-preview-body">
          <div className="av6-preview-sidebar">
            <div className="av6-preview-side-logo">
              <Leaf size={17} />
            </div>
            <i className="av6-side-active" />
            <i />
            <i />
            <i />
          </div>

          <div className="av6-preview-content">
            <div className="av6-preview-heading">
              <div>
                <small>YOUR BUSINESS SPACE</small>
                <strong>Grow with confidence.</strong>
              </div>
              <span>
                <Sprout size={18} />
              </span>
            </div>

            <div className="av6-preview-metrics">
              {[
                { icon: Package, name: "Products" },
                { icon: PackageCheck, name: "Orders" },
                { icon: TrendingUp, name: "Growth" },
              ].map(({ icon: Icon, name }) => (
                <div key={name}>
                  <Icon size={17} />
                  <strong>{name}</strong>
                  <i />
                </div>
              ))}
            </div>

            <div className="av6-preview-chart">
              <div>
                <strong>Business overview</strong>
                <BarChart3 size={16} />
              </div>
              <div className="av6-preview-bars">
                {heights.map((height, index) => (
                  <i
                    key={index}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="av6-floating av6-floating-top">
        <span><ShieldCheck size={20} /></span>
        <div>
          <strong>One connected space</strong>
          <small>Your business, simplified</small>
        </div>
      </div>

      <div className="av6-floating av6-floating-bottom">
        <span><Sparkles size={19} /></span>
        <div>
          <strong>Grow naturally</strong>
          <small>Thoughtfully designed</small>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   MAIN LOGIN PAGE
===================================================== */

export default function LoginPage() {
  const navigate = useNavigate();

  const {
    login,
    user,
    vendor,
    membership,
    loading,
    authError,
    refreshUser,
  } = useAuth();

  const { branding } = useBranding();

  const siteName = branding?.site_name || "AUMVEDA";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");

  const destination = destinationFor(
    user,
    vendor,
    membership
  );

  useEffect(() => {
    if (!loading && destination) {
      navigate(destination, { replace: true });
    }
  }, [loading, destination, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await login(cleanEmail, password);
      const result = unwrap(response);

      const nextRoute =
        destinationFor(
          result.user,
          result.vendor,
          result.membership
        ) || "/dashboard";

      navigate(nextRoute, { replace: true });
    } catch (err) {
      setError(
        err?.message ||
        "Unable to sign in. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetry() {
    if (retrying) return;

    setRetrying(true);

    try {
      await refreshUser();
    } finally {
      setRetrying(false);
    }
  }

  if (loading || destination) {
    return (
      <main className="av6-loading">
        <span className="av6-loading-logo">
          <Leaf size={28} />
        </span>
        <LoaderCircle className="av6-spin" size={28} />
        <h2>Welcome to {siteName}</h2>
        <p>Preparing your vendor workspace...</p>
      </main>
    );
  }

  return (
    <main className="av6-page">

      {/* LEFT SHOWCASE */}

      <section className="av6-showcase">
        <div className="av6-showcase-glow" aria-hidden="true" />

        <header className="av6-brand-header">
          <div className="av6-brand">
            <div className="av6-brand-logo">
              <AumvedaLogo />
            </div>

            <div>
              <strong>{siteName}</strong>
              <span>VENDOR BUSINESS PORTAL</span>
            </div>
          </div>

          <div className="av6-partner-tag">
            <span />
            PARTNER SPACE
          </div>
        </header>

        <div className="av6-showcase-middle">
          <div className="av6-hero">
            <div className="av6-hero-label">
              <span />
              THE BUSINESS SIDE OF WELLNESS
            </div>

            <h1>
              Where <em>nature</em>
              <br />
              meets <span>ambition.</span>
            </h1>

            <p>
              Your products, orders and business growth —
              beautifully brought together in one
              thoughtful workspace.
            </p>
          </div>

          <div className="av6-preview-area">
            <WorkspacePreview />
          </div>
        </div>

        <footer className="av6-showcase-footer">
          <span><Leaf size={16} /> ROOTED IN WELLNESS</span>
          <span>DESIGNED FOR GROWTH</span>
        </footer>
      </section>

      {/* RIGHT LOGIN */}

      <section className="av6-access">
        <header className="av6-access-header">
          <div className="av6-mobile-brand">
            <AumvedaLogo />
            <strong>{siteName}</strong>
          </div>

          <div className="av6-secure-tag">
            <ShieldCheck size={17} />
            <span>SECURE VENDOR ACCESS</span>
          </div>
        </header>

        <div className="av6-access-center">

          <div className="av6-welcome">
            <span className="av6-overline">
              <span />
              WELCOME TO YOUR SPACE
            </span>

            <h2>
              Good to have
              <br />
              <em>you back.</em>
            </h2>

            <p>
              Sign in to continue managing your
              {` ${siteName} `}business.
            </p>
          </div>

          <div className="av6-login-card">
            <div className="av6-card-accent" />

            <div className="av6-card-heading">
              <div>
                <span>VENDOR ACCOUNT</span>
                <h3>Sign in</h3>
                <p>Enter your registered credentials.</p>
              </div>

              <div className="av6-card-icon">
                <Leaf size={24} strokeWidth={1.7} />
              </div>
            </div>

            {authError && (
              <div className="av6-alert av6-alert-info">
                <AlertCircle size={18} />
                <div>
                  <strong>Session verification</strong>
                  <p>{authError}</p>
                  <button
                    type="button"
                    disabled={retrying}
                    onClick={handleRetry}
                  >
                    <RefreshCw
                      size={14}
                      className={retrying ? "av6-spin" : ""}
                    />
                    {retrying ? "Checking..." : "Retry session"}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="av6-alert av6-alert-error" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form
              className="av6-form"
              onSubmit={handleSubmit}
            >
              <div className="av6-field">
                <label htmlFor="av6-email">
                  Email address
                </label>

                <div className="av6-input-wrap">
                  <span className="av6-input-icon">
                    <Mail size={19} strokeWidth={1.8} />
                  </span>

                  <input
                    id="av6-email"
                    className="av6-input-control"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                    }}
                    placeholder="name@yourbusiness.com"
                    autoComplete="username"
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="av6-field">
                <label htmlFor="av6-password">
                  Password
                </label>

                <div className="av6-input-wrap">
                  <span className="av6-input-icon">
                    <LockKeyhole
                      size={19}
                      strokeWidth={1.8}
                    />
                  </span>

                  <input
                    id="av6-password"
                    className="av6-input-control"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={submitting}
                    required
                  />

                  <button
                    className="av6-password-toggle"
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="av6-submit"
                disabled={submitting}
              >
                <span>
                  {submitting
                    ? "Signing in..."
                    : "Enter your workspace"}
                </span>

                <span className="av6-submit-icon">
                  {submitting ? (
                    <LoaderCircle
                      size={19}
                      className="av6-spin"
                    />
                  ) : (
                    <ArrowRight size={21} />
                  )}
                </span>
              </button>
            </form>

            <div className="av6-approval">
              <CheckCircle2 size={17} />
              <span>
                Your workspace is unlocked after
                vendor approval.
              </span>
            </div>
          </div>

          <div className="av6-trust-note">
            <Sparkles size={17} />
            <span>
              Thoughtfully designed for natural
              wellness businesses.
            </span>
          </div>
        </div>

        <footer className="av6-access-footer">
          <span>© {new Date().getFullYear()} {siteName}</span>
          <span>GROW NATURALLY</span>
        </footer>
      </section>
    </main>
  );
}
