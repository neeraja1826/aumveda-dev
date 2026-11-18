
import {
  Navigate,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  AlertCircle,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";

function AccessMessage({
  icon: Icon,
  title,
  description,
  onRetry,
  onLogout,
  retryLabel = "Try Again",
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#f7f9f5",
        color: "#173e32",
      }}
    >
      <section
        role="alert"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "32px",
          background: "#ffffff",
          border: "1px solid #e1e9de",
          borderRadius: "16px",
          boxShadow:
            "0 12px 35px rgba(29,65,43,0.06)",
          textAlign: "center",
        }}
      >
        <Icon
          size={35}
          color="#397550"
        />

        <h2
          style={{
            margin: "18px 0 10px",
            fontFamily:
              'Georgia, "Times New Roman", serif',
            fontSize: "25px",
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin: "0 0 24px",
            color: "#788a7e",
            fontSize: "13px",
            lineHeight: "1.7",
          }}
        >
          {description}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 17px",
                border: 0,
                borderRadius: "9px",
                background: "#1e523d",
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={16} />
              {retryLabel}
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 17px",
                border: "1px solid #dce7da",
                borderRadius: "9px",
                background: "#ffffff",
                color: "#356449",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default function ProtectedRoute() {
  const navigate = useNavigate();

  const {
    user,
    vendor,
    membership,
    loading,
    authError,
    approved,
    membershipActive,
    permissionsReady,
    refreshUser,
    logout,
  } = useAuth();

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: "12px",
          color: "#28553b",
        }}
      >
        <LoaderCircle
          size={25}
          className="avbp-spin"
        />

        <span>
          Verifying vendor access...
        </span>
      </div>
    );
  }

  /* ==========================================================
     SESSION VERIFICATION ERROR
  ========================================================== */

  if (authError && !user) {
    return (
      <AccessMessage
        icon={AlertCircle}
        title="Unable to Verify Your Session"
        description={authError}
        onRetry={refreshUser}
        onLogout={handleLogout}
      />
    );
  }

  /* ==========================================================
     NOT LOGGED IN
  ========================================================== */

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /* ==========================================================
     MISSING VENDOR PROFILE
  ========================================================== */

  if (!vendor) {
    return (
      <AccessMessage
        icon={ShieldAlert}
        title="Vendor Profile Unavailable"
        description={
          "Your login was verified, but the vendor " +
          "profile could not be loaded. Refresh your " +
          "session or contact the platform administrator."
        }
        onRetry={refreshUser}
        onLogout={handleLogout}
      />
    );
  }

  /* ==========================================================
     MISSING MEMBERSHIP
  ========================================================== */

  if (!membership) {
    return (
      <AccessMessage
        icon={LockKeyhole}
        title="Vendor Membership Unavailable"
        description={
          "No vendor team membership was returned " +
          "for this account."
        }
        onRetry={refreshUser}
        onLogout={handleLogout}
      />
    );
  }

  /* ==========================================================
     INACTIVE MEMBERSHIP
  ========================================================== */

  if (!membershipActive) {
    return (
      <AccessMessage
        icon={LockKeyhole}
        title="Membership Inactive"
        description={
          "Your vendor team membership is currently " +
          "inactive. Contact the Vendor Owner or an " +
          "authorized administrator."
        }
        onLogout={handleLogout}
      />
    );
  }

  /* ==========================================================
     PENDING APPROVAL
  ========================================================== */

  if (!approved) {
    return (
      <Navigate
        to="/pending-approval"
        replace
      />
    );
  }

  /* ==========================================================
     AUTHORIZATION REQUIRED
     Never render protected pages if /auth/me
     did not return valid authorization.
  ========================================================== */

  if (!permissionsReady) {
    return (
      <AccessMessage
        icon={ShieldAlert}
        title="Unable to Load Permissions"
        description={
          "Your account was authenticated, but " +
          "your access permissions could not be " +
          "verified. Please refresh your session."
        }
        onRetry={refreshUser}
        onLogout={handleLogout}
      />
    );
  }

  return <Outlet />;
}
