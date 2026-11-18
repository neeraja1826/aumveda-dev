
import "./TeamPage.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Eye,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  UserRound,
  Users,
  UserX,
  X,
} from "lucide-react";

import { vendorApi } from "../services/api";
import { employeeRemovalApi } from "../services/employeeRemovalApi";
import EmployeePasswordResetModal from "../components/team/EmployeePasswordResetModal";
import EmployeeCustomRolesModal from "../components/team/EmployeeCustomRolesModal";
import TeamAccessPanel from "./TeamAccessPanel";

/*
 * ============================================================
 * AUMVEDA VENDOR WEB — TEAM WORKSPACE
 * STEP 18D.7
 *
 * Complete employee management:
 * - Team overview
 * - Employee directory
 * - Search/filter employees
 * - View member details
 * - Create employees via TeamAccessPanel
 * - Create and manage custom roles
 * - Edit assigned custom roles directly
 * - Change legacy membership roles
 * - Activate/deactivate employees
 * - Reset employee passwords
 * - Delete employee vendor membership
 *
 * Security:
 * - Backend enforces Vendor Owner authorization
 * - Owner accounts cannot be changed
 * - No password saved in TeamPage
 * - Deletion preserves Supabase Auth identity
 * - Role replacement uses existing atomic backend API
 * ============================================================
 */

const MEMBER_ROLES = [
  "manager",
  "staff",
  "inventory",
  "orders",
];

const FILTER_ROLES = [
  "owner",
  ...MEMBER_ROLES,
];

const ROLE_DESCRIPTIONS = {
  manager: "General vendor operations management.",
  staff: "Standard vendor team membership.",
  inventory: "Inventory operations.",
  orders: "Order and shipping operations.",
};

// ============================================================
// HELPERS
// ============================================================

function unwrapMembers(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.members)) return response.members;
  if (Array.isArray(response?.data?.members)) {
    return response.data.members;
  }
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function unwrapMember(response) {
  const value =
    response?.data?.member ??
    response?.data ??
    response?.member ??
    response;

  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value
    : null;
}

function roleName(value) {
  return String(value || "Unknown")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function memberRole(member) {
  return String(member?.member_role || "")
    .trim()
    .toLowerCase();
}

function isOwner(member) {
  return memberRole(member) === "owner";
}

function isCustomMember(member) {
  return String(member?.permission_mode || "")
    .trim()
    .toLowerCase() === "custom";
}

function isMemberActive(member) {
  return (
    member?.membership_active === true ||
    (member?.membership_active == null &&
      member?.is_active === true)
  );
}

function getCustomRoles(member) {
  return Array.isArray(member?.custom_roles)
    ? member.custom_roles
    : [];
}

function customRoleName(role) {
  return role?.name || role?.role_name || "Custom Role";
}

function dateText(value, includeTime = false) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(date);
}

function initials(name) {
  const parts = String(name || "Vendor Member")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "VM";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

// ============================================================
// SMALL UI COMPONENTS
// ============================================================

function Avatar({ member, large = false }) {
  return (
    <span
      className={`avt-avatar ${
        large ? "avt-avatar-large" : ""
      }`}
    >
      {member?.avatar_url ? (
        <img
          src={member.avatar_url}
          alt={member.full_name || "Team member"}
        />
      ) : (
        <span>{initials(member?.full_name)}</span>
      )}
    </span>
  );
}

function RoleBadge({ role }) {
  const normalized = String(role || "staff").toLowerCase();

  return (
    <span className={`avt-role avt-role-${normalized}`}>
      {normalized === "owner" ? (
        <ShieldCheck size={14} />
      ) : (
        <BadgeCheck size={14} />
      )}
      {roleName(normalized)}
    </span>
  );
}

function MembershipBadge({ active }) {
  return (
    <span
      className={`avt-membership ${
        active
          ? "avt-membership-active"
          : "avt-membership-inactive"
      }`}
    >
      <span className="avt-membership-dot" />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function CustomRoleBadges({ member }) {
  if (!isCustomMember(member)) {
    return (
      <span className="avt-system-role">
        Legacy membership permissions
      </span>
    );
  }

  const roles = getCustomRoles(member);

  if (roles.length === 0) {
    return (
      <span className="avt-system-role">
        No custom roles assigned
      </span>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 7,
        alignItems: "center",
      }}
    >
      {roles.map((role, index) => (
        <span
          key={role.id || role.role_id || index}
          title={
            role.is_active === false
              ? "Inactive custom role"
              : "Assigned custom role"
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            border: "1px solid #dce7da",
            background:
              role.is_active === false
                ? "#f6f2ed"
                : "#edf6ee",
            color:
              role.is_active === false
                ? "#8a755c"
                : "#285a40",
          }}
        >
          <ShieldCheck size={13} />
          {customRoleName(role)}
          {role.is_active === false && " (Inactive)"}
        </span>
      ))}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  note,
  tone = "green",
}) {
  return (
    <article className="avt-summary-card">
      <span className={`avt-summary-icon avt-tone-${tone}`}>
        <Icon size={22} strokeWidth={1.8} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

// ============================================================
// TEAM MEMBER CARD
// ============================================================

function MemberCard({
  member,
  busy,
  disabled,
  onView,
  onEditRole,
  onToggleStatus,
}) {
  const active = isMemberActive(member);
  const owner = isOwner(member);
  const custom = isCustomMember(member);

  return (
    <article
      className={`avt-member-card ${
        active ? "" : "avt-member-card-inactive"
      }`}
    >
      <div className="avt-member-top">
        <Avatar member={member} />
        <MembershipBadge active={active} />
      </div>

      <div className="avt-member-identity">
        <h3>{member.full_name || "Unnamed Member"}</h3>
        <span
          title={member.email || ""}
          style={{ overflowWrap: "anywhere" }}
        >
          {member.email || "Email unavailable"}
        </span>
      </div>

      <div className="avt-member-roles">
        <RoleBadge role={member.member_role} />
        <span className="avt-system-role">
          {custom ? "Custom permissions" : "Legacy permissions"}
        </span>
      </div>

      <div style={{ padding: "10px 0", minHeight: 48 }}>
        <div
          style={{
            marginBottom: 7,
            fontSize: 11,
            fontWeight: 700,
            color: "#788a7e",
          }}
        >
          ASSIGNED ROLES
        </div>
        <CustomRoleBadges member={member} />
      </div>

      <div className="avt-member-meta">
        <div>
          <span>Phone</span>
          <strong>{member.phone || "Not provided"}</strong>
        </div>
        <div>
          <span>Joined</span>
          <strong>{dateText(member.joined_at)}</strong>
        </div>
      </div>

      <footer className="avt-member-actions">
        <button
          type="button"
          className="avt-button avt-button-light"
          onClick={() => onView(member)}
          disabled={disabled}
        >
          <Eye size={16} />
          Details
        </button>

        {!custom && (
          <button
            type="button"
            className="avt-button avt-button-light"
            onClick={() => onEditRole(member)}
            disabled={disabled || owner}
          >
            {owner ? (
              <LockKeyhole size={16} />
            ) : (
              <UserCog size={16} />
            )}
            Role
          </button>
        )}

        <button
          type="button"
          className={`avt-button ${
            active ? "avt-button-danger" : "avt-button-soft"
          }`}
          onClick={() => onToggleStatus(member)}
          disabled={disabled || owner}
        >
          {busy ? (
            <LoaderCircle size={16} className="avt-spin" />
          ) : active ? (
            <UserX size={16} />
          ) : (
            <UserCheck size={16} />
          )}

          {owner
            ? "Owner Protected"
            : busy
              ? "Updating..."
              : active
                ? "Deactivate"
                : "Activate"}
        </button>
      </footer>
    </article>
  );
}

// ============================================================
// SHARED DIALOG
// ============================================================

function ModalFrame({
  title,
  eyebrow,
  icon: Icon,
  children,
  onClose,
  locked = false,
}) {
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && !locked) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, locked]);

  return (
    <div
      className="avt-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !locked
        ) {
          onClose();
        }
      }}
    >
      <section
        className="avt-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="avt-modal-header">
          <span className="avt-modal-header-icon">
            <Icon size={23} />
          </span>

          <div>
            <span className="avt-eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
          </div>

          <button
            type="button"
            className="avt-icon-button"
            aria-label="Close dialog"
            onClick={onClose}
            disabled={locked}
          >
            <X size={20} />
          </button>
        </header>

        {children}
      </section>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="avt-detail-field">
      <span>{label}</span>
      <strong style={{ overflowWrap: "anywhere" }}>
        {value ?? "—"}
      </strong>
    </div>
  );
}

// ============================================================
// EMPLOYEE DETAILS DIALOG
// ============================================================

function MemberDetailsModal({
  member,
  loading,
  error,
  busy,
  onEditRole,
  onToggleStatus,
  onEditCustomRoles,
  onResetPassword,
  onDelete,
  onClose,
}) {
  const owner = isOwner(member);
  const custom = isCustomMember(member);

  return (
    <ModalFrame
      title="Employee Details"
      eyebrow="TEAM ACCESS"
      icon={UserRound}
      onClose={onClose}
      locked={busy}
    >
      {loading ? (
        <div className="avt-modal-state">
          <LoaderCircle size={31} className="avt-spin" />
          <strong>Loading member details</strong>
          <p>Retrieving the latest account information.</p>
        </div>
      ) : error || !member ? (
        <div className="avt-modal-state">
          <AlertCircle size={30} />
          <strong>Unable to load member</strong>
          <p>{error || "Member details are unavailable."}</p>
        </div>
      ) : (
        <div className="avt-modal-body">
          <section className="avt-profile-hero">
            <Avatar member={member} large />
            <div>
              <span className="avt-eyebrow">
                VENDOR TEAM MEMBER
              </span>
              <h3>{member.full_name || "Unnamed Member"}</h3>
              <p
                style={{
                  margin: "6px 0",
                  overflowWrap: "anywhere",
                }}
              >
                {member.email || "Email unavailable"}
              </p>
              <div className="avt-profile-badges">
                <RoleBadge role={member.member_role} />
                <MembershipBadge
                  active={isMemberActive(member)}
                />
              </div>
            </div>
          </section>

          <section className="avt-detail-grid">
            <DetailField
              label="Email Address"
              value={member.email || "Email unavailable"}
            />
            <DetailField
              label="Phone"
              value={member.phone || "Not provided"}
            />
            <DetailField
              label="Membership Role"
              value={roleName(member.member_role)}
            />
            <DetailField
              label="Permission Mode"
              value={roleName(
                member.permission_mode || "legacy"
              )}
            />
            <DetailField
              label="Membership Status"
              value={
                isMemberActive(member) ? "Active" : "Inactive"
              }
            />
            <DetailField
              label="User Profile"
              value={
                member.profile_active === true
                  ? "Active"
                  : member.profile_active === false
                    ? "Inactive"
                    : "Not reported"
              }
            />
            <DetailField
              label="Joined On"
              value={dateText(member.joined_at, true)}
            />
            <DetailField
              label="User ID"
              value={member.user_id || "—"}
            />
          </section>

          {/* ASSIGNED CUSTOM ROLES */}

          <div
            style={{
              marginTop: 22,
              marginBottom: 20,
            }}
          >
            <span className="avt-eyebrow">
              ASSIGNED CUSTOM ROLES
            </span>

            <div style={{ marginTop: 10 }}>
              <CustomRoleBadges member={member} />
            </div>

            {custom && !owner && (
              <>
                <button
                  type="button"
                  className="avt-button avt-button-light"
                  onClick={() => onEditCustomRoles(member)}
                  disabled={busy}
                  style={{ marginTop: 14 }}
                >
                  <ShieldCheck size={17} />
                  Edit Custom Roles
                </button>

                <p
                  style={{
                    marginTop: 11,
                    fontSize: 12,
                    lineHeight: 1.7,
                    color: "#788a7e",
                  }}
                >
                  Add or remove assigned custom roles.
                  Changes will affect the employee's
                  permissions after their session
                  authorization is refreshed.
                </p>
              </>
            )}
          </div>

          {member.profile_active === false && (
            <div className="avt-note avt-note-warning">
              <AlertCircle size={19} />
              <p>
                This user profile is inactive.
                Activating vendor membership will not
                automatically reactivate the profile.
              </p>
            </div>
          )}

          {owner ? (
            <div className="avt-note">
              <ShieldCheck size={19} />
              <p>
                Vendor Owner membership is protected.
                Role, password, membership status and
                ownership cannot be modified here.
              </p>
            </div>
          ) : (
            <>
              {/* ACCOUNT MANAGEMENT */}

              <div style={{ marginTop: 20 }}>
                <span className="avt-eyebrow">
                  ACCOUNT MANAGEMENT
                </span>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 12,
                  }}
                >
                  {!custom && (
                    <button
                      type="button"
                      className="avt-button avt-button-light"
                      onClick={() => onEditRole(member)}
                      disabled={busy}
                    >
                      <UserCog size={17} />
                      Change Role
                    </button>
                  )}

                  <button
                    type="button"
                    className="avt-button avt-button-light"
                    onClick={() => onResetPassword(member)}
                    disabled={busy}
                  >
                    <KeyRound size={17} />
                    Reset Password
                  </button>

                  <button
                    type="button"
                    className={`avt-button ${
                      isMemberActive(member)
                        ? "avt-button-danger"
                        : "avt-button-primary"
                    }`}
                    onClick={() => onToggleStatus(member)}
                    disabled={busy}
                  >
                    {isMemberActive(member) ? (
                      <UserX size={17} />
                    ) : (
                      <UserCheck size={17} />
                    )}

                    {isMemberActive(member)
                      ? "Deactivate Employee"
                      : "Activate Employee"}
                  </button>
                </div>
              </div>

              <div
                className="avt-note"
                style={{ marginTop: 18 }}
              >
                <LockKeyhole size={19} />
                <p>
                  Password reset does not change the
                  employee's roles or membership status.
                  Existing access tokens may remain valid
                  until expiration.
                </p>
              </div>

              {/* DELETE EMPLOYEE */}

              <div
                style={{
                  marginTop: 20,
                  paddingTop: 18,
                  borderTop: "1px solid #e1e9de",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 11,
                    marginBottom: 14,
                  }}
                >
                  <Trash2 size={19} color="#b54739" />
                  <div>
                    <strong
                      style={{
                        display: "block",
                        color: "#8e352b",
                        fontSize: 14,
                      }}
                    >
                      Remove Employee Access
                    </strong>
                    <p
                      style={{
                        margin: "5px 0 0",
                        color: "#788a7e",
                        fontSize: 12,
                        lineHeight: 1.7,
                      }}
                    >
                      Remove this employee from your
                      Vendor Team. Their Supabase Auth
                      identity and profile will remain.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="avt-button avt-button-danger"
                  onClick={() => onDelete(member)}
                  disabled={busy}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    padding: "12px 16px",
                    fontWeight: 700,
                  }}
                >
                  <Trash2 size={17} />
                  Delete Employee
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </ModalFrame>
  );
}

// ============================================================
// LEGACY ROLE EDITOR
// ============================================================

function RoleModal({
  member,
  value,
  error,
  saving,
  onChange,
  onSubmit,
  onClose,
}) {
  return (
    <ModalFrame
      title="Change Membership Role"
      eyebrow="LEGACY MEMBERSHIP CONTROL"
      icon={ShieldCheck}
      onClose={onClose}
      locked={saving}
    >
      <form className="avt-role-form" onSubmit={onSubmit}>
        <div className="avt-role-subject">
          <Avatar member={member} />
          <div>
            <span>Editing legacy membership role for</span>
            <strong>
              {member.full_name || "Team Member"}
            </strong>
          </div>
        </div>

        {error && (
          <div
            className="avt-alert avt-alert-error"
            role="alert"
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="avt-role-options">
          {MEMBER_ROLES.map((role) => (
            <label
              key={role}
              className={`avt-role-choice ${
                value === role
                  ? "avt-role-choice-active"
                  : ""
              }`}
            >
              <input
                type="radio"
                name="member_role"
                value={role}
                checked={value === role}
                disabled={saving}
                onChange={() => onChange(role)}
              />
              <span className="avt-role-choice-icon">
                <UserCog size={21} />
              </span>
              <span className="avt-role-choice-content">
                <strong>{roleName(role)}</strong>
                <small>{ROLE_DESCRIPTIONS[role]}</small>
              </span>
            </label>
          ))}
        </div>

        <div
          className="avt-note"
          style={{ marginTop: 19 }}
        >
          <LockKeyhole size={19} />
          <p>
            Custom-role employees must be managed
            through Edit Custom Roles. Owner promotion
            is not available here.
          </p>
        </div>

        <footer className="avt-modal-footer">
          <button
            type="button"
            className="avt-button avt-button-light"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="avt-button avt-button-primary"
            disabled={
              saving ||
              !value ||
              value === memberRole(member)
            }
          >
            {saving ? (
              <LoaderCircle
                size={17}
                className="avt-spin"
              />
            ) : (
              <CheckCircle2 size={17} />
            )}
            {saving ? "Updating..." : "Update Role"}
          </button>
        </footer>
      </form>
    </ModalFrame>
  );
}

// ============================================================
// STATUS / ROLE CONFIRMATION
// ============================================================

function ConfirmationModal({
  action,
  error,
  saving,
  onConfirm,
  onClose,
}) {
  const member = action.member;
  const changingRole = action.type === "role";
  const activating =
    action.type === "status" && action.active === true;
  const dangerous =
    action.type === "status" && action.active === false;

  return (
    <ModalFrame
      title={
        changingRole
          ? "Confirm Role Change"
          : "Confirm Employee Status"
      }
      eyebrow="SECURITY CONFIRMATION"
      icon={ShieldCheck}
      onClose={onClose}
      locked={saving}
    >
      <div className="avt-confirm-body">
        <span
          className={`avt-confirm-icon ${
            dangerous ? "avt-confirm-icon-danger" : ""
          }`}
        >
          {dangerous ? (
            <UserX size={26} />
          ) : (
            <ShieldCheck size={26} />
          )}
        </span>

        <h3>
          {changingRole
            ? "Confirm Role Change"
            : activating
              ? "Activate Employee"
              : "Deactivate Employee"}
        </h3>

        <p>
          {changingRole
            ? `Change ${
                member.full_name || "this employee"
              } from ${roleName(
                member.member_role
              )} to ${roleName(action.role)}?`
            : `${
                activating ? "Activate" : "Deactivate"
              } ${member.full_name || "this employee"}?`}
        </p>

        {dangerous && (
          <div className="avt-note avt-note-warning">
            <AlertCircle size={19} />
            <p>
              Deactivation blocks vendor access
              without deleting the Auth account.
            </p>
          </div>
        )}

        {error && (
          <div
            className="avt-alert avt-alert-error"
            role="alert"
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="avt-modal-footer">
          <button
            type="button"
            className="avt-button avt-button-light"
            onClick={onClose}
            disabled={saving}
          >
            Go Back
          </button>

          <button
            type="button"
            className={`avt-button ${
              dangerous
                ? "avt-button-danger-solid"
                : "avt-button-primary"
            }`}
            onClick={onConfirm}
            disabled={saving}
          >
            {saving ? (
              <LoaderCircle
                size={17}
                className="avt-spin"
              />
            ) : (
              <CheckCircle2 size={17} />
            )}
            {saving ? "Updating..." : "Confirm Change"}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}

// ============================================================
// DELETE EMPLOYEE CONFIRMATION
// ============================================================

function DeleteEmployeeModal({
  member,
  saving,
  error,
  onConfirm,
  onClose,
}) {
  const [confirmationText, setConfirmationText] =
    useState("");

  const canConfirm =
    confirmationText.trim() === "DELETE" &&
    !saving;

  function submit(event) {
    event.preventDefault();
    if (canConfirm) onConfirm();
  }

  return (
    <ModalFrame
      title="Delete Employee"
      eyebrow="REMOVE VENDOR ACCESS"
      icon={Trash2}
      onClose={onClose}
      locked={saving}
    >
      <form
        className="avt-role-form"
        onSubmit={submit}
      >
        <div className="avt-confirm-body">
          <span className="avt-confirm-icon avt-confirm-icon-danger">
            <Trash2 size={27} />
          </span>

          <h3>Remove this employee?</h3>
          <p>
            You are about to remove this employee
            from the Vendor Team.
          </p>

          <div
            style={{
              padding: 16,
              marginTop: 14,
              background: "#f7f9f5",
              border: "1px solid #e1e9de",
              borderRadius: 12,
              textAlign: "left",
            }}
          >
            <strong
              style={{
                display: "block",
                fontSize: 16,
                color: "#173e32",
              }}
            >
              {member.full_name || "Unnamed Employee"}
            </strong>
            <span
              style={{
                display: "block",
                marginTop: 5,
                color: "#788a7e",
                fontSize: 13,
                overflowWrap: "anywhere",
              }}
            >
              {member.email || "Email unavailable"}
            </span>
          </div>

          <div
            className="avt-note avt-note-warning"
            style={{ marginTop: 17 }}
          >
            <AlertCircle size={19} />
            <p>
              Vendor membership and assigned custom
              roles will be removed. The Supabase Auth
              identity and profile will remain.
            </p>
          </div>

          <label
            style={{
              display: "block",
              textAlign: "left",
              marginTop: 18,
              fontSize: 13,
              fontWeight: 600,
              color: "#173e32",
            }}
          >
            Type DELETE to confirm

            <input
              type="text"
              value={confirmationText}
              onChange={(event) =>
                setConfirmationText(event.target.value)
              }
              placeholder="DELETE"
              autoComplete="off"
              disabled={saving}
              aria-label="Type DELETE to confirm"
              style={{
                boxSizing: "border-box",
                width: "100%",
                marginTop: 9,
                padding: "12px 14px",
                border: "1px solid #dce7da",
                borderRadius: 9,
                background: "#ffffff",
                outlineColor: "#397550",
              }}
            />
          </label>

          {error && (
            <div
              className="avt-alert avt-alert-error"
              role="alert"
              style={{ marginTop: 16 }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <footer className="avt-modal-footer">
            <button
              type="button"
              className="avt-button avt-button-light"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="avt-button avt-button-danger-solid"
              disabled={!canConfirm}
            >
              {saving ? (
                <LoaderCircle
                  size={17}
                  className="avt-spin"
                />
              ) : (
                <Trash2 size={17} />
              )}
              {saving ? "Removing..." : "Delete Employee"}
            </button>
          </footer>
        </div>
      </form>
    </ModalFrame>
  );
}

// ============================================================
// MAIN TEAM PAGE
// ============================================================

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [memberOpen, setMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState(null);
  const [memberLoading, setMemberLoading] =
    useState(false);
  const [memberError, setMemberError] = useState("");

  const [roleMember, setRoleMember] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [roleError, setRoleError] = useState("");

  const [confirmation, setConfirmation] = useState(null);
  const [confirmError, setConfirmError] = useState("");

  const [deletingMember, setDeletingMember] =
    useState(null);
  const [deleteError, setDeleteError] = useState("");

  const [passwordMember, setPasswordMember] =
    useState(null);
  const [customRolesMember, setCustomRolesMember] =
    useState(null);

  const [saving, setSaving] = useState(false);
  const [actionUserId, setActionUserId] =
    useState(null);

  const mutationLock = useRef(false);
  const memberRequestRef = useRef(0);

  // ==========================================================
  // LOAD TEAM
  // ==========================================================

  const loadTeam = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await vendorApi.getTeam();

      setMembers(unwrapMembers(response));
      setLoaded(true);
      return true;
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load vendor team."
      );
      return false;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  // ==========================================================
  // SUMMARY AND FILTERS
  // ==========================================================

  const summary = useMemo(() => {
    const active = members.filter(isMemberActive).length;

    return {
      total: members.length,
      active,
      inactive: members.length - active,
      owners: members.filter(isOwner).length,
      employees: members.filter(
        (member) => !isOwner(member)
      ).length,
    };
  }, [members]);

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return members.filter((member) => {
      const searchableText = [
        member.full_name,
        member.email,
        member.phone,
        member.user_id,
        member.member_role,
        ...getCustomRoles(member).map(customRoleName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !term || searchableText.includes(term);

      const matchesRole =
        roleFilter === "all" ||
        memberRole(member) === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          isMemberActive(member)) ||
        (statusFilter === "inactive" &&
          !isMemberActive(member));

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [members, search, roleFilter, statusFilter]);

  const filtersActive =
    Boolean(search.trim()) ||
    roleFilter !== "all" ||
    statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
  }

  // ==========================================================
  // MEMBER DETAILS
  // ==========================================================

  async function openMember(member) {
    if (mutationLock.current) return;

    const requestId = ++memberRequestRef.current;

    setMemberOpen(true);
    setSelectedMember(null);
    setMemberLoading(true);
    setMemberError("");

    try {
      const response = await vendorApi.getTeamMember(
        member.user_id
      );

      if (requestId !== memberRequestRef.current) {
        return;
      }

      const detail = unwrapMember(response);

      if (!detail) {
        throw new Error(
          "Member details were not returned."
        );
      }

      setSelectedMember(detail);
    } catch (err) {
      if (requestId === memberRequestRef.current) {
        setMemberError(
          err?.message ||
            "Unable to load member details."
        );
      }
    } finally {
      if (requestId === memberRequestRef.current) {
        setMemberLoading(false);
      }
    }
  }

  function closeMember() {
    if (mutationLock.current) return;

    memberRequestRef.current += 1;
    setMemberOpen(false);
    setSelectedMember(null);
    setMemberError("");
    setMemberLoading(false);
  }

  // ==========================================================
  // PASSWORD RESET
  // ==========================================================

  function openPasswordReset(member) {
    if (
      mutationLock.current ||
      !member?.user_id ||
      isOwner(member)
    ) {
      return;
    }

    setPasswordMember({
      user_id: member.user_id,
      full_name: member.full_name,
      email: member.email,
      member_role: member.member_role,
    });

    closeMember();
  }

  function passwordResetSucceeded(member) {
    setPasswordMember(null);
    setError("");

    setSuccess(
      `Password updated successfully for ${
        member.full_name ||
        member.email ||
        "the employee"
      }.`
    );
  }

  // ==========================================================
  // EDIT CUSTOM ROLES
  // ==========================================================

  function openCustomRolesEditor(member) {
    if (
      mutationLock.current ||
      !member?.user_id ||
      isOwner(member) ||
      !isCustomMember(member)
    ) {
      return;
    }

    setCustomRolesMember(member);
    closeMember();
  }

  function customRolesSaved(member) {
    setCustomRolesMember(null);
    setSuccess(
      `Custom roles updated successfully for ${
        member.full_name || "the employee"
      }.`
    );

    // Do not repeat the mutation if refreshing fails.
    loadTeam(true);
  }

  // ==========================================================
  // LEGACY MEMBERSHIP ROLE
  // ==========================================================

  function openRoleEditor(member) {
    if (
      mutationLock.current ||
      isOwner(member) ||
      isCustomMember(member)
    ) {
      return;
    }

    closeMember();
    setRoleMember(member);
    setSelectedRole(memberRole(member) || "staff");
    setRoleError("");
  }

  function closeRoleEditor() {
    if (mutationLock.current) return;

    setRoleMember(null);
    setSelectedRole("");
    setRoleError("");
  }

  function handleRoleSubmit(event) {
    event.preventDefault();

    if (
      !roleMember ||
      isOwner(roleMember) ||
      isCustomMember(roleMember) ||
      mutationLock.current
    ) {
      return;
    }

    if (!MEMBER_ROLES.includes(selectedRole)) {
      setRoleError("Select a valid non-owner role.");
      return;
    }

    if (selectedRole === memberRole(roleMember)) {
      closeRoleEditor();
      return;
    }

    setRoleError("");
    setConfirmError("");

    setConfirmation({
      member: roleMember,
      type: "role",
      role: selectedRole,
    });

    setRoleMember(null);
  }

  // ==========================================================
  // ACTIVATE / DEACTIVATE
  // ==========================================================

  function requestStatusChange(member) {
    if (mutationLock.current || isOwner(member)) {
      return;
    }

    closeMember();

    setConfirmError("");
    setConfirmation({
      member,
      type: "status",
      active: !isMemberActive(member),
    });
  }

  function closeConfirmation() {
    if (mutationLock.current) return;

    setConfirmation(null);
    setConfirmError("");
  }

  // ==========================================================
  // CONFIRM STATUS / LEGACY ROLE CHANGES
  // ==========================================================

  async function confirmChange() {
    if (
      !confirmation ||
      mutationLock.current ||
      isOwner(confirmation.member)
    ) {
      return;
    }

    const action = confirmation;
    const member = action.member;

    if (
      action.type === "role" &&
      isCustomMember(member)
    ) {
      setConfirmError(
        "Use Edit Custom Roles for this employee."
      );
      return;
    }

    mutationLock.current = true;
    setSaving(true);
    setActionUserId(member.user_id);
    setConfirmError("");
    setSuccess("");
    setError("");

    try {
      if (action.type === "role") {
        await vendorApi.updateTeamRole(
          member.user_id,
          {
            member_role: action.role,
          }
        );
      } else {
        await vendorApi.updateTeamStatus(
          member.user_id,
          {
            is_active: action.active,
          }
        );
      }

      setConfirmation(null);
      setRoleMember(null);
      setSelectedRole("");
      setRoleError("");

      setSuccess(
        action.type === "role"
          ? "Membership role updated successfully."
          : `Employee ${
              action.active
                ? "activated"
                : "deactivated"
            } successfully.`
      );

      const refreshed = await loadTeam(true);

      if (!refreshed) {
        setError(
          "Change saved, but the Team directory could not refresh."
        );
      }
    } catch (err) {
      setConfirmError(
        err?.message ||
          "Unable to update this employee."
      );
    } finally {
      mutationLock.current = false;
      setSaving(false);
      setActionUserId(null);
    }
  }

  // ==========================================================
  // DELETE EMPLOYEE
  // ==========================================================

  function requestEmployeeDeletion(member) {
    if (
      mutationLock.current ||
      !member?.user_id ||
      isOwner(member)
    ) {
      return;
    }

    setDeleteError("");
    setDeletingMember({
      user_id: member.user_id,
      full_name: member.full_name,
      email: member.email,
      member_role: member.member_role,
    });

    closeMember();
  }

  async function confirmEmployeeDeletion() {
    if (
      mutationLock.current ||
      !deletingMember ||
      isOwner(deletingMember)
    ) {
      return;
    }

    const employee = deletingMember;

    mutationLock.current = true;
    setSaving(true);
    setActionUserId(employee.user_id);
    setDeleteError("");
    setSuccess("");
    setError("");

    try {
      await employeeRemovalApi.removeEmployee(
        employee.user_id
      );

      setDeletingMember(null);

      setMembers((current) =>
        current.filter(
          (member) =>
            member.user_id !== employee.user_id
        )
      );

      setSuccess(
        `Employee "${
          employee.full_name ||
          employee.email ||
          "Team Member"
        }" removed from the Vendor Team.`
      );

      const refreshed = await loadTeam(true);

      if (!refreshed) {
        setError(
          "Employee removed, but directory refresh failed."
        );
      }
    } catch (err) {
      setDeleteError(
        err?.message ||
          "Unable to confirm employee removal. Refresh before retrying."
      );
    } finally {
      mutationLock.current = false;
      setSaving(false);
      setActionUserId(null);
    }
  }

  // ==========================================================
  // INITIAL LOADING / ERROR
  // ==========================================================

  if (loading && !loaded) {
    return (
      <div className="avt-page">
        <div className="avt-loading">
          <LoaderCircle
            size={32}
            className="avt-spin"
          />
          <strong>Loading Vendor Team</strong>
          <p>Retrieving employee accounts and roles.</p>
        </div>
      </div>
    );
  }

  if (error && !loaded) {
    return (
      <div className="avt-page">
        <div className="avt-loading">
          <AlertCircle size={32} />
          <h2>Team information unavailable</h2>
          <p>{error}</p>

          <button
            type="button"
            className="avt-button avt-button-primary"
            onClick={() => loadTeam()}
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN RENDER
  // ==========================================================

  return (
    <div className="avt-page">
      <header className="avt-header">
        <div>
          <span className="avt-eyebrow">
            PEOPLE &amp; PERMISSIONS
          </span>
          <h1>Team Workspace</h1>
          <p>
            Manage employee accounts, custom roles,
            passwords, memberships and access permissions.
          </p>
        </div>

        <button
          type="button"
          className="avt-button avt-button-light"
          disabled={refreshing || saving}
          onClick={() => loadTeam(true)}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "avt-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh Team"}
        </button>
      </header>

      <div className="avt-note avt-owner-notice">
        <ShieldCheck size={20} />
        <div>
          <strong>
            Owner-controlled employee management
          </strong>
          <p>
            Vendor Owners manage staff accounts and
            permissions. Ownership, Team administration
            and Payouts remain protected.
          </p>
        </div>
      </div>

      {error && (
        <div
          className="avt-alert avt-alert-error"
          role="alert"
        >
          <AlertCircle size={19} />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div
          className="avt-alert avt-alert-success"
          role="status"
        >
          <CheckCircle2 size={19} />
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* TEAM OVERVIEW */}

      <section className="avt-summary">
        <article className="avt-headcount">
          <div className="avt-headcount-header">
            <div>
              <span>TEAM OVERVIEW</span>
              <h2>Total Team Members</h2>
            </div>
            <Users size={26} />
          </div>

          <strong>{summary.total}</strong>

          <div className="avt-headcount-footer">
            <span>
              Active <b>{summary.active}</b>
            </span>
            <span>
              Inactive <b>{summary.inactive}</b>
            </span>
          </div>
        </article>

        <div className="avt-summary-metrics">
          <SummaryCard
            icon={ShieldCheck}
            label="Owners"
            value={summary.owners}
            note="Protected memberships"
            tone="gold"
          />
          <SummaryCard
            icon={UserCog}
            label="Employees"
            value={summary.employees}
            note="Non-owner accounts"
          />
          <SummaryCard
            icon={UserCheck}
            label="Active Access"
            value={summary.active}
            note="Active memberships"
          />
        </div>
      </section>

      {/* EXISTING ADD EMPLOYEE AND CUSTOM ROLES */}

      <TeamAccessPanel
        members={members}
        onMemberChange={() => loadTeam(true)}
      />

      {/* EMPLOYEE DIRECTORY */}

      <section className="avt-directory">
        <header className="avt-directory-header">
          <div>
            <span className="avt-eyebrow">
              EMPLOYEE MANAGEMENT
            </span>
            <h2>Vendor Team</h2>
            <p>
              View employee accounts, edit custom roles,
              reset passwords, and manage account status.
            </p>
          </div>

          <span className="avt-count">
            {filteredMembers.length} of {members.length} members
          </span>
        </header>

        {/* SEARCH AND FILTERS */}

        <div className="avt-toolbar">
          <label className="avt-search">
            <Search size={18} />
            <input
              type="search"
              value={search}
              placeholder="Search name, email, role or user ID..."
              aria-label="Search team members"
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <X size={16} />
              </button>
            )}
          </label>

          <div className="avt-filters">
            <label className="avt-select">
              <select
                value={roleFilter}
                aria-label="Filter by role"
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
              >
                <option value="all">All Roles</option>
                {FILTER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {roleName(role)}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </label>

            <label className="avt-select">
              <select
                value={statusFilter}
                aria-label="Filter by status"
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option value="all">All Members</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown size={16} />
            </label>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="avt-empty">
            <span className="avt-empty-icon">
              <Users size={32} />
            </span>
            <h3>
              {members.length === 0
                ? "No team members available"
                : "No matching members"}
            </h3>
            <p>
              {members.length === 0
                ? "Employee accounts will appear here once they have been added."
                : "Try another search term or reset your filters."}
            </p>
            {filtersActive && (
              <button
                type="button"
                className="avt-button avt-button-light"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="avt-member-grid">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.user_id}
                member={member}
                busy={actionUserId === member.user_id}
                disabled={saving || refreshing}
                onView={openMember}
                onEditRole={openRoleEditor}
                onToggleStatus={requestStatusChange}
              />
            ))}
          </div>
        )}

        <footer className="avt-directory-footer">
          <span>
            Showing {filteredMembers.length} of{" "}
            {members.length} loaded members
          </span>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}
        </footer>
      </section>

      {/* EMPLOYEE DETAILS */}

      {memberOpen && (
        <MemberDetailsModal
          member={selectedMember}
          loading={memberLoading}
          error={memberError}
          busy={saving}
          onEditRole={openRoleEditor}
          onToggleStatus={requestStatusChange}
          onEditCustomRoles={openCustomRolesEditor}
          onResetPassword={openPasswordReset}
          onDelete={requestEmployeeDeletion}
          onClose={closeMember}
        />
      )}

      {/* LEGACY MEMBERSHIP ROLE */}

      {roleMember && (
        <RoleModal
          member={roleMember}
          value={selectedRole}
          error={roleError}
          saving={saving}
          onChange={setSelectedRole}
          onSubmit={handleRoleSubmit}
          onClose={closeRoleEditor}
        />
      )}

      {/* ROLE / STATUS CONFIRMATION */}

      {confirmation && (
        <ConfirmationModal
          action={confirmation}
          error={confirmError}
          saving={saving}
          onConfirm={confirmChange}
          onClose={closeConfirmation}
        />
      )}

      {/* DELETE EMPLOYEE */}

      {deletingMember && (
        <DeleteEmployeeModal
          key={deletingMember.user_id}
          member={deletingMember}
          saving={saving}
          error={deleteError}
          onConfirm={confirmEmployeeDeletion}
          onClose={() => {
            if (!mutationLock.current) {
              setDeletingMember(null);
              setDeleteError("");
            }
          }}
        />
      )}

      {/* RESET EMPLOYEE PASSWORD */}

      {passwordMember && (
        <EmployeePasswordResetModal
          key={passwordMember.user_id}
          member={passwordMember}
          onClose={() => setPasswordMember(null)}
          onSuccess={passwordResetSucceeded}
        />
      )}

      {/* EDIT EMPLOYEE CUSTOM ROLES */}

      {customRolesMember && (
        <EmployeeCustomRolesModal
          key={customRolesMember.user_id}
          member={customRolesMember}
          onClose={() => setCustomRolesMember(null)}
          onSuccess={customRolesSaved}
        />
      )}
    </div>
  );
}
