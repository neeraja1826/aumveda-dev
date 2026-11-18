
import { useEffect, useRef, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  X,
} from "lucide-react";

import {
  employeePasswordApi,
} from "../../services/employeePasswordApi";

/**
 * AUMVEDA Employee Password Reset Modal
 *
 * Only mounted when an Owner opens password reset
 * for an existing employee.
 *
 * The backend remains the authority for:
 * - Owner authentication
 * - Vendor isolation
 * - Employee membership verification
 * - Owner account protection
 * - Password policy
 *
 * No automatic API retries.
 */

export default function EmployeePasswordResetModal({
  member,
  onClose,
  onSuccess,
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmation, setShowConfirmation] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submittingRef = useRef(false);

  const passwordMatches =
    password.length > 0 &&
    password === confirmation;

  const canSubmit =
    passwordMatches && !saving;

  useEffect(() => {
    function onKeyDown(event) {
      if (
        event.key === "Escape" &&
        !submittingRef.current
      ) {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [onClose]);

  function close() {
    if (submittingRef.current) return;

    setPassword("");
    setConfirmation("");
    setError("");

    onClose();
  }

  async function submit(event) {
    event.preventDefault();

    if (
      submittingRef.current ||
      !canSubmit ||
      !member?.user_id
    ) {
      return;
    }

    submittingRef.current = true;
    setSaving(true);
    setError("");

    try {
      await employeePasswordApi.resetPassword(
        member.user_id,
        password
      );

      setPassword("");
      setConfirmation("");
      setShowPassword(false);
      setShowConfirmation(false);

      onSuccess(member);
    } catch (err) {
      // Do not retry automatically.
      // A timeout could happen after a successful
      // Supabase Auth password update.

      setPassword("");
      setConfirmation("");

      setError(
        err?.message ||
          "Unable to confirm the password update. Check the account before retrying."
      );
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }

  const labelStyle = {
    display: "block",
    color: "#254b39",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
  };

  const fieldStyle = {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #d8e3d7",
    background: "#fff",
    borderRadius: 9,
    fontSize: 14,
    outlineColor: "#397550",
  };

  return (
    <div
      className="avt-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
    >
      <section
        className="avt-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Reset Employee Password"
      >
        <header className="avt-modal-header">
          <span className="avt-modal-header-icon">
            <KeyRound size={23} />
          </span>

          <div>
            <span className="avt-eyebrow">
              ACCOUNT SECURITY
            </span>

            <h2>Reset Employee Password</h2>
          </div>

          <button
            type="button"
            className="avt-icon-button"
            onClick={close}
            disabled={saving}
            aria-label="Close password reset"
          >
            <X size={20} />
          </button>
        </header>

        <form
          className="avt-role-form"
          onSubmit={submit}
          autoComplete="off"
        >
          <div className="avt-modal-body">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
                padding: 16,
                border: "1px solid #e0e8dc",
                borderRadius: 12,
                background: "#f8faf6",
                marginBottom: 22,
              }}
            >
              <KeyRound
                size={24}
                color="#397550"
              />

              <div style={{ minWidth: 0 }}>
                <strong
                  style={{
                    display: "block",
                    color: "#234b36",
                    fontSize: 15,
                  }}
                >
                  {member?.full_name ||
                    "Employee"}
                </strong>

                <span
                  style={{
                    display: "block",
                    color: "#788a7e",
                    fontSize: 12,
                    overflowWrap: "anywhere",
                    marginTop: 3,
                  }}
                >
                  {member?.email ||
                    "Email unavailable"}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label
                htmlFor="aumveda-new-employee-password"
                style={labelStyle}
              >
                New Password
              </label>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                }}
              >
                <input
                  id="aumveda-new-employee-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  disabled={saving}
                  required
                  style={fieldStyle}
                />

                <button
                  type="button"
                  className="avt-button avt-button-light"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  disabled={saving}
                  aria-label={
                    showPassword
                      ? "Hide new password"
                      : "Show new password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 15 }}>
              <label
                htmlFor="aumveda-confirm-employee-password"
                style={labelStyle}
              >
                Confirm New Password
              </label>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                }}
              >
                <input
                  id="aumveda-confirm-employee-password"
                  type={
                    showConfirmation
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  value={confirmation}
                  onChange={(event) =>
                    setConfirmation(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  required
                  style={fieldStyle}
                />

                <button
                  type="button"
                  className="avt-button avt-button-light"
                  onClick={() =>
                    setShowConfirmation(
                      (value) => !value
                    )
                  }
                  disabled={saving}
                  aria-label={
                    showConfirmation
                      ? "Hide confirmation"
                      : "Show confirmation"
                  }
                >
                  {showConfirmation ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {confirmation.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginTop: 10,
                    fontSize: 12,
                    color: passwordMatches
                      ? "#397550"
                      : "#b54739",
                  }}
                >
                  {passwordMatches ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <AlertCircle size={15} />
                  )}

                  {passwordMatches
                    ? "Passwords match"
                    : "Passwords do not match"}
                </div>
              )}
            </div>

            <div
              className="avt-note"
              style={{ marginTop: 18 }}
            >
              <LockKeyhole size={19} />

              <p>
                The new password will be updated
                in Supabase Auth. The employee's
                existing roles, permissions and
                membership status will not change.
                Supabase applies the configured
                password policy.
              </p>
            </div>

            {error && (
              <div
                className="avt-alert avt-alert-error"
                role="alert"
                style={{ marginTop: 17 }}
              >
                <AlertCircle size={18} />

                <span>{error}</span>
              </div>
            )}

            <footer
              className="avt-modal-footer"
              style={{ marginTop: 23 }}
            >
              <button
                type="button"
                className="avt-button avt-button-light"
                onClick={close}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="avt-button avt-button-primary"
                disabled={!canSubmit}
              >
                {saving ? (
                  <LoaderCircle
                    size={17}
                    className="avt-spin"
                  />
                ) : (
                  <KeyRound size={17} />
                )}

                {saving
                  ? "Updating Password..."
                  : "Update Password"}
              </button>
            </footer>
          </div>
        </form>
      </section>
    </div>
  );
}
