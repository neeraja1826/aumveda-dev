
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import { teamManagementApi } from "../../services/teamManagementApi";

function unwrapRoles(response) {
  const data = Array.isArray(response)
    ? response
    : Array.isArray(response?.roles)
      ? response.roles
      : Array.isArray(response?.data?.roles)
        ? response.data.roles
        : Array.isArray(response?.data)
          ? response.data
          : [];

  return data
    .filter((role) => role && typeof role === "object")
    .map((role) => ({
      id: String(role.id || ""),
      name: role.role_name || role.name || "Unnamed Role",
      description: role.description || "",
      is_active: role.is_active === true,
    }))
    .filter((role) => role.id);
}

function getAssignedIds(member) {
  const raw = Array.isArray(member?.custom_role_ids)
    ? member.custom_role_ids
    : Array.isArray(member?.custom_roles)
      ? member.custom_roles.map(
          (role) => role.id || role.role_id
        )
      : [];

  return [...new Set(raw.map(String).filter(Boolean))];
}

export default function EmployeeCustomRolesModal({
  member,
  onClose,
  onSuccess,
}) {
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState([]);
  const [original, setOriginal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busyRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function initialize() {
      setLoading(true);
      setError("");

      try {
        const response = await teamManagementApi.getRoles();
        if (!active) return;

        const normalized = unwrapRoles(response);
        const assigned = getAssignedIds(member);
        const activeIds = new Set(
          normalized.filter((role) => role.is_active)
            .map((role) => role.id)
        );

        const current = assigned.filter((id) => activeIds.has(id));

        setRoles(normalized);
        setSelected(current);
        setOriginal(current);
      } catch (err) {
        if (active) {
          setError(
            err?.message || "Unable to load custom roles."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [member]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && !busyRef.current) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const activeRoles = useMemo(
    () => roles.filter((role) => role.is_active),
    [roles]
  );

  const inactiveAssignedRoles = useMemo(() => {
    const assigned = new Set(getAssignedIds(member));

    return roles.filter(
      (role) => assigned.has(role.id) && !role.is_active
    );
  }, [member, roles]);

  const changed = useMemo(() => {
    const a = [...selected].sort();
    const b = [...original].sort();

    return JSON.stringify(a) !== JSON.stringify(b) ||
      inactiveAssignedRoles.length > 0;
  }, [selected, original, inactiveAssignedRoles]);

  function close() {
    if (!busyRef.current) onClose();
  }

  function toggle(roleId) {
    if (busyRef.current) return;

    setSelected((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId]
    );
  }

  async function submit(event) {
    event.preventDefault();

    if (busyRef.current || loading || !member?.user_id) {
      return;
    }

    const roleIds = [...new Set(selected)];

    if (roleIds.length === 0) {
      setError("Select at least one active custom role.");
      return;
    }

    const validIds = new Set(
      activeRoles.map((role) => role.id)
    );

    if (roleIds.some((id) => !validIds.has(id))) {
      setError("An invalid or inactive role was selected.");
      return;
    }

    if (!changed) {
      close();
      return;
    }

    busyRef.current = true;
    setSaving(true);
    setError("");

    try {
      await teamManagementApi.assignMemberRoles(
        member.user_id,
        roleIds
      );

      // The backend mutation succeeded. Do not repeat it
      // if a subsequent directory refresh fails.
      onSuccess(member);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to confirm role assignment. Refresh before retrying."
      );
    } finally {
      busyRef.current = false;
      setSaving(false);
    }
  }

  return (
    <div
      className="avt-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        className="avt-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Edit Custom Roles"
      >
        <header className="avt-modal-header">
          <span className="avt-modal-header-icon">
            <ShieldCheck size={23} />
          </span>

          <div>
            <span className="avt-eyebrow">
              EMPLOYEE PERMISSIONS
            </span>
            <h2>Edit Custom Roles</h2>
          </div>

          <button
            type="button"
            className="avt-icon-button"
            aria-label="Close editor"
            disabled={saving}
            onClick={close}
          >
            <X size={20} />
          </button>
        </header>

        <form className="avt-role-form" onSubmit={submit}>
          <div className="avt-modal-body">
            <div className="avt-role-subject">
              <ShieldCheck size={25} />
              <div>
                <span>Manage access for</span>
                <strong>
                  {member?.full_name || "Employee"}
                </strong>
                <small>{member?.email || ""}</small>
              </div>
            </div>

            <p
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                margin: "16px 0",
              }}
            >
              Select one or more active custom roles.
              Saving replaces this employee's previous
              assignments. Owner privileges cannot be
              assigned.
            </p>

            {loading ? (
              <div className="avt-modal-state">
                <LoaderCircle
                  size={22}
                  className="avt-spin"
                />
                Loading roles...
              </div>
            ) : (
              <div className="avt-role-options">
                {activeRoles.map((role) => (
                  <label
                    key={role.id}
                    className={`avt-role-choice ${
                      selected.includes(role.id)
                        ? "avt-role-choice-active"
                        : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(role.id)}
                      onChange={() => toggle(role.id)}
                      disabled={saving}
                    />

                    <span className="avt-role-choice-icon">
                      <ShieldCheck size={21} />
                    </span>

                    <span className="avt-role-choice-content">
                      <strong>{role.name}</strong>
                      <small>
                        {role.description ||
                          "Custom employee access"}
                      </small>
                    </span>

                    {selected.includes(role.id) && (
                      <CheckCircle2
                        size={17}
                        color="#397550"
                      />
                    )}
                  </label>
                ))}

                {activeRoles.length === 0 && (
                  <p>No active custom roles are available.</p>
                )}
              </div>
            )}

            {inactiveAssignedRoles.length > 0 && (
              <div
                className="avt-note avt-note-warning"
                style={{ marginTop: 16 }}
              >
                <AlertCircle size={19} />
                <p>
                  Previously assigned inactive roles:{" "}
                  {inactiveAssignedRoles
                    .map((role) => role.name)
                    .join(", ")}. They will be excluded
                  when you save.
                </p>
              </div>
            )}

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
                onClick={close}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="avt-button avt-button-primary"
                disabled={
                  loading ||
                  saving ||
                  selected.length === 0 ||
                  !changed
                }
              >
                {saving ? (
                  <LoaderCircle
                    size={17}
                    className="avt-spin"
                  />
                ) : (
                  <ShieldCheck size={17} />
                )}

                {saving ? "Saving..." : "Save Custom Roles"}
              </button>
            </footer>
          </div>
        </form>
      </section>
    </div>
  );
}
