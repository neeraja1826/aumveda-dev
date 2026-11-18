
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  MailPlus,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserRoundPlus,
  X,
} from "lucide-react";

import { teamManagementApi } from "../services/teamManagementApi";

import "./TeamAccessPanel.css";


// ============================================================
// AUMVEDA VENDOR WEB
// CUSTOM ROLES & EMPLOYEE ACCESS MANAGEMENT
//
// Features:
// 1. List custom roles
// 2. Create custom roles
// 3. Edit custom roles
// 4. Activate / deactivate custom roles
// 5. Assign multiple roles to employees
// 6. Accounts & Earnings permission
// 7. Vendor Owner protection
// 8. Owner-created employee accounts
// 9. Optional legacy staff invitations
//
// Employee creation:
// - Employee full name
// - Employee email
// - Owner-selected password
// - Confirm password
// - Multiple custom roles
// - FastAPI employee creation
// - Team list refresh
//
// Security:
// - Backend verifies Vendor Owner
// - Backend determines vendor ID
// - No Owner privileges assigned
// - Password is never stored in localStorage
// - Password is never returned in success messages
// - No automatic account-creation retries
// ============================================================


// ============================================================
// FEATURE CONFIGURATION
// ============================================================

const ACCOUNTS_EARNINGS_ENABLED =
  import.meta.env.VITE_ENABLE_ACCOUNTS_EARNINGS ===
  "true";

const INVITATIONS_ENABLED =
  import.meta.env.VITE_ENABLE_STAFF_INVITATIONS ===
  "true";


// ============================================================
// PERMISSION CONFIGURATION
// ============================================================

const PERMISSION_GROUPS = [
  {
    title: "Dashboard",
    values: [
      [
        "dashboard.view",
        "View operational dashboard",
      ],
    ],
  },
  {
    title: "Products",
    values: [
      [
        "products.view",
        "View products",
      ],
      [
        "products.create",
        "Create products and variants",
      ],
      [
        "products.update",
        "Edit products",
      ],
      [
        "products.images",
        "Manage product images",
      ],
    ],
  },
  {
    title: "Inventory",
    values: [
      [
        "inventory.view",
        "View inventory",
      ],
      [
        "inventory.update",
        "Update stock",
      ],
    ],
  },
  {
    title: "Orders",
    values: [
      [
        "orders.view",
        "View orders",
      ],
      [
        "orders.update",
        "Update order status",
      ],
    ],
  },
  {
    title: "Shipping",
    values: [
      [
        "shipping.view",
        "View shipments",
      ],
      [
        "shipping.update",
        "Create and update shipments",
      ],
    ],
  },
  {
    title: "Accounts & Earnings",
    values: [
      [
        "earnings.view",
        "View vendor earnings and earnings summary",
      ],
    ],
  },
];

const VALID_PERMISSIONS = new Set(
  PERMISSION_GROUPS.flatMap((group) =>
    group.values.map(([key]) => key)
  )
);

const EMPTY_ROLE = {
  role_name: "",
  description: "",
  permissions: [],
};

const EMPTY_EMPLOYEE = {
  full_name: "",
  email: "",
  password: "",
  confirm_password: "",
  role_ids: [],
};


// ============================================================
// HELPERS
// ============================================================

function normalizePermissions(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const permissions = value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (
        item &&
        typeof item === "object"
      ) {
        return (
          item.permission_key ||
          item.key ||
          ""
        );
      }

      return "";
    })
    .filter(Boolean);

  return [...new Set(permissions)];
}


function normalizeRole(role) {
  if (
    !role ||
    typeof role !== "object"
  ) {
    return null;
  }

  return {
    ...role,

    id: String(role.id || ""),

    role_name:
      role.role_name ||
      role.name ||
      "Unnamed role",

    description:
      role.description || "",

    is_active:
      role.is_active === true,

    permissions: normalizePermissions(
      role.permissions ||
      role.permission_keys ||
      []
    ),
  };
}


function unwrapRoles(response) {
  let data = [];

  if (Array.isArray(response)) {
    data = response;
  } else if (
    Array.isArray(response?.roles)
  ) {
    data = response.roles;
  } else if (
    Array.isArray(response?.data?.roles)
  ) {
    data = response.data.roles;
  } else if (
    Array.isArray(response?.data)
  ) {
    data = response.data;
  }

  return data
    .map(normalizeRole)
    .filter(
      (role) =>
        role !== null &&
        Boolean(role.id)
    );
}


function getErrorMessage(
  error,
  fallback = "Unable to complete the operation."
) {
  if (
    error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
}


function RoleName({ role }) {
  return (
    role?.role_name ||
    "Unnamed role"
  );
}


// ============================================================
// NOTIFICATION
// ============================================================

function Message({
  error = "",
  success = "",
  onDismiss,
}) {
  if (!error && !success) {
    return null;
  }

  return (
    <div
      className={`ata-alert ${
        error ? "ata-error" : "ata-success"
      }`}
      role={error ? "alert" : "status"}
    >
      {error ? (
        <AlertCircle size={18} />
      ) : (
        <CheckCircle2 size={18} />
      )}

      <span>
        {error || success}
      </span>

      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        <X size={17} />
      </button>
    </div>
  );
}


// ============================================================
// PERMISSION PICKER
// ============================================================

function PermissionPicker({
  selected = [],
  onChange,
  disabled = false,
}) {
  const selectedKeys = new Set(selected);

  function togglePermission(key) {
    if (disabled) {
      return;
    }

    if (
      key === "earnings.view" &&
      !ACCOUNTS_EARNINGS_ENABLED
    ) {
      return;
    }

    if (selectedKeys.has(key)) {
      onChange(
        selected.filter(
          (item) => item !== key
        )
      );
    } else {
      onChange([
        ...selected,
        key,
      ]);
    }
  }

  return (
    <div className="ata-permission-grid">
      {PERMISSION_GROUPS.map((group) => (
        <fieldset
          key={group.title}
          className="ata-permission-group"
          disabled={disabled}
        >
          <legend>
            {group.title}
          </legend>

          {group.values.map(
            ([key, label]) => {
              const pending =
                key === "earnings.view" &&
                !ACCOUNTS_EARNINGS_ENABLED;

              return (
                <label
                  key={key}
                  className="ata-permission-choice"
                  title={
                    pending
                      ? "Backend Earnings permission is not enabled."
                      : label
                  }
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedKeys.has(key)
                    }
                    disabled={
                      disabled || pending
                    }
                    onChange={() =>
                      togglePermission(key)
                    }
                  />

                  <span>
                    {label}

                    {pending && (
                      <small
                        style={{
                          display: "block",
                          marginTop: 4,
                          fontSize: 11,
                          color: "#9a7946",
                        }}
                      >
                        Backend integration required
                      </small>
                    )}
                  </span>

                  {pending && (
                    <LockKeyhole size={14} />
                  )}
                </label>
              );
            }
          )}
        </fieldset>
      ))}
    </div>
  );
}


// ============================================================
// CUSTOM ROLE SELECTOR
// ============================================================

function RoleSelector({
  roles = [],
  selected = [],
  onChange,
  disabled = false,
}) {
  function toggleRole(
    roleId,
    checked
  ) {
    if (disabled) {
      return;
    }

    if (checked) {
      onChange([
        ...new Set([
          ...selected,
          roleId,
        ]),
      ]);
    } else {
      onChange(
        selected.filter(
          (id) => id !== roleId
        )
      );
    }
  }

  return (
    <div className="ata-role-options">
      {roles.length === 0 && (
        <p className="ata-hint">
          No active custom roles are available.
          Create and activate a role first.
        </p>
      )}

      {roles.map((role) => (
        <label key={role.id}>
          <input
            type="checkbox"
            checked={
              selected.includes(role.id)
            }
            disabled={disabled}
            onChange={(event) =>
              toggleRole(
                role.id,
                event.target.checked
              )
            }
          />

          <span>
            <strong>
              <RoleName role={role} />
            </strong>

            <small>
              {role.permissions.length}{" "}
              permission(s)
            </small>
          </span>
        </label>
      ))}
    </div>
  );
}


// ============================================================
// MODAL COMPONENT
// ============================================================

function Dialog({
  title,
  onClose,
  children,
  locked = false,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (
        event.key === "Escape" &&
        !locked
      ) {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose, locked]);

  return (
    <div
      className="ata-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !locked
        ) {
          onClose();
        }
      }}
    >
      <section
        className="ata-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h3>
            {title}
          </h3>

          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            disabled={locked}
          >
            <X size={19} />
          </button>
        </header>

        {children}
      </section>
    </div>
  );
}


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function TeamAccessPanel({
  members = [],
  onMemberChange,
}) {
  // ----------------------------------------------------------
  // DATA STATE
  // ----------------------------------------------------------

  const [roles, setRoles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ----------------------------------------------------------
  // MODAL STATE
  // ----------------------------------------------------------

  const [dialog, setDialog] =
    useState(null);

  const [roleForm, setRoleForm] =
    useState({
      ...EMPTY_ROLE,
      permissions: [],
    });

  const [
    selectedMember,
    setSelectedMember,
  ] = useState("");

  const [
    selectedRoles,
    setSelectedRoles,
  ] = useState([]);

  // ----------------------------------------------------------
  // EMPLOYEE CREATION STATE
  // ----------------------------------------------------------

  const [
    employeeForm,
    setEmployeeForm,
  ] = useState({
    ...EMPTY_EMPLOYEE,
    role_ids: [],
  });

  const [
    showEmployeePassword,
    setShowEmployeePassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  // ----------------------------------------------------------
  // LEGACY INVITATION STATE
  // ----------------------------------------------------------

  const [inviteName, setInviteName] =
    useState("");

  const [inviteEmail, setInviteEmail] =
    useState("");

  // ----------------------------------------------------------
  // MUTATION LOCK
  // ----------------------------------------------------------

  const busyRef = useRef(false);


  // ==========================================================
  // REFRESH CUSTOM ROLES
  // ==========================================================

  const refreshRoles = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const response =
          await teamManagementApi.getRoles();

        const normalized =
          unwrapRoles(response);

        setRoles(normalized);

        return true;
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            "Unable to load custom roles."
          )
        );

        return false;
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    []
  );


  useEffect(() => {
    refreshRoles();
  }, [refreshRoles]);


  // ==========================================================
  // DERIVED DATA
  // ==========================================================

  const activeRoles = useMemo(
    () =>
      roles.filter(
        (role) => role.is_active
      ),
    [roles]
  );

  const assignableMembers = useMemo(
    () =>
      (
        Array.isArray(members)
          ? members
          : []
      ).filter(
        (member) =>
          String(
            member?.member_role || ""
          ).toLowerCase() !== "owner"
      ),
    [members]
  );


  // ==========================================================
  // NOTIFICATION HELPERS
  // ==========================================================

  function clearMessages() {
    setError("");
    setSuccess("");
  }


  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const closeDialog = useCallback(() => {
    if (busyRef.current) {
      return;
    }

    setDialog(null);
    setError("");

    // Remove credentials from component state
    // when the employee modal closes.

    setEmployeeForm({
      ...EMPTY_EMPLOYEE,
      role_ids: [],
    });

    setShowEmployeePassword(false);
    setShowConfirmPassword(false);
  }, []);


  // ==========================================================
  // OPEN ROLE EDITOR
  // ==========================================================

  function openRoleEditor(
    role = null
  ) {
    if (busyRef.current) {
      return;
    }

    clearMessages();

    setRoleForm({
      role_name:
        role?.role_name || "",

      description:
        role?.description || "",

      permissions:
        normalizePermissions(
          role?.permissions || []
        ),
    });

    setDialog({
      type: "role",
      role,
    });
  }


  // ==========================================================
  // OPEN ROLE ASSIGNMENT
  // ==========================================================

  function openAssignment() {
    if (busyRef.current) {
      return;
    }

    clearMessages();

    setSelectedMember(
      assignableMembers[0]?.user_id || ""
    );

    setSelectedRoles([]);

    setDialog({
      type: "assign",
    });
  }


  // ==========================================================
  // OPEN EMPLOYEE CREATION
  // ==========================================================

  function openEmployeeCreation() {
    if (busyRef.current) {
      return;
    }

    clearMessages();

    setEmployeeForm({
      ...EMPTY_EMPLOYEE,
      role_ids: [],
    });

    setShowEmployeePassword(false);
    setShowConfirmPassword(false);

    setDialog({
      type: "employee",
    });
  }


  // ==========================================================
  // UPDATE EMPLOYEE FORM
  // ==========================================================

  function updateEmployeeField(
    field,
    value
  ) {
    setEmployeeForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }


  // ==========================================================
  // OPEN LEGACY INVITATION
  // ==========================================================

  function openInvitation() {
    if (
      !INVITATIONS_ENABLED ||
      busyRef.current
    ) {
      return;
    }

    clearMessages();

    setInviteName("");
    setInviteEmail("");
    setSelectedRoles([]);

    setDialog({
      type: "invite",
    });
  }


  // ==========================================================
  // SHARED MUTATION HANDLER
  // ==========================================================

  async function runMutation({
    task,
    successMessage,
    refreshTeam = false,
    refreshRoleList = true,
  }) {
    if (busyRef.current) {
      return false;
    }

    busyRef.current = true;
    setBusy(true);

    clearMessages();

    let mutationSucceeded = false;

    try {
      await task();

      mutationSucceeded = true;

      setDialog(null);

      setSuccess(successMessage);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to save changes."
        )
      );
    }

    if (mutationSucceeded) {
      const warnings = [];

      if (refreshRoleList) {
        const rolesLoaded =
          await refreshRoles(false);

        if (!rolesLoaded) {
          warnings.push(
            "The custom-role list could not be refreshed."
          );
        }
      }

      if (
        refreshTeam &&
        typeof onMemberChange === "function"
      ) {
        try {
          const result =
            await onMemberChange();

          if (result === false) {
            warnings.push(
              "The Team directory could not be refreshed."
            );
          }
        } catch {
          warnings.push(
            "The Team directory could not be refreshed."
          );
        }
      }

      if (warnings.length) {
        setError(
          "The change was saved, but " +
          warnings.join(" ")
        );
      }
    }

    busyRef.current = false;
    setBusy(false);

    return mutationSucceeded;
  }


  // ==========================================================
  // CREATE / EDIT CUSTOM ROLE
  // ==========================================================

  function submitRole(event) {
    event.preventDefault();

    if (
      busyRef.current ||
      dialog?.type !== "role"
    ) {
      return;
    }

    const payload = {
      role_name:
        roleForm.role_name.trim(),

      description:
        roleForm.description.trim() ||
        null,

      permissions:
        normalizePermissions(
          roleForm.permissions
        ),
    };

    if (
      payload.role_name.length < 2 ||
      payload.role_name.length > 80
    ) {
      setError(
        "Role name must contain 2 to 80 characters."
      );

      return;
    }

    if (
      payload.permissions.length === 0
    ) {
      setError(
        "Select at least one permission."
      );

      return;
    }

    if (
      payload.permissions.some(
        (key) =>
          !VALID_PERMISSIONS.has(key)
      )
    ) {
      setError(
        "One or more selected permissions are invalid."
      );

      return;
    }

    if (
      !ACCOUNTS_EARNINGS_ENABLED &&
      payload.permissions.includes(
        "earnings.view"
      )
    ) {
      setError(
        "Accounts & Earnings permission is not enabled."
      );

      return;
    }

    const existingRole =
      dialog.role;

    runMutation({
      task: () =>
        existingRole
          ? teamManagementApi.updateRole(
              existingRole.id,
              payload
            )
          : teamManagementApi.createRole(
              payload
            ),

      successMessage:
        existingRole
          ? "Custom role updated successfully."
          : "Custom role created successfully.",

      refreshTeam: false,
      refreshRoleList: true,
    });
  }


  // ==========================================================
  // ASSIGN ROLES TO EXISTING EMPLOYEE
  // ==========================================================

  function submitAssignment(event) {
    event.preventDefault();

    if (busyRef.current) {
      return;
    }

    const member =
      assignableMembers.find(
        (item) =>
          item.user_id === selectedMember
      );

    if (!member) {
      setError(
        "Select a valid non-owner employee."
      );

      return;
    }

    const roleIds = [
      ...new Set(selectedRoles),
    ];

    if (!roleIds.length) {
      setError(
        "Select at least one active custom role."
      );

      return;
    }

    const activeRoleIds = new Set(
      activeRoles.map(
        (role) => role.id
      )
    );

    if (
      roleIds.some(
        (id) => !activeRoleIds.has(id)
      )
    ) {
      setError(
        "One or more selected roles are no longer active."
      );

      return;
    }

    runMutation({
      task: () =>
        teamManagementApi.assignMemberRoles(
          selectedMember,
          roleIds
        ),

      successMessage:
        "Custom roles assigned successfully.",

      refreshTeam: true,
      refreshRoleList: false,
    });
  }


  // ==========================================================
  // CREATE EMPLOYEE ACCOUNT
  //
  // POST /api/v1/vendor/team/employees
  //
  // IMPORTANT:
  // JavaScript string normalization uses
  // .split(...).join(" "), not Python " ".join().
  //
  // No fixed application password length.
  // Supabase Auth may enforce its own policy.
  // ==========================================================

  async function submitEmployee(event) {
    event.preventDefault();

    if (
      busyRef.current ||
      dialog?.type !== "employee"
    ) {
      return;
    }

    // --------------------------------------------------------
    // 1. NORMALIZE NAME
    // --------------------------------------------------------

    const name = employeeForm.full_name
      .trim()
      .split(/\s+/)
      .join(" ");

    // --------------------------------------------------------
    // 2. NORMALIZE EMAIL
    // --------------------------------------------------------

    const email = employeeForm.email
      .trim()
      .toLowerCase();

    // --------------------------------------------------------
    // 3. READ PASSWORD
    //
    // Do not trim or alter the password.
    // --------------------------------------------------------

    const password =
      employeeForm.password;

    const confirmPassword =
      employeeForm.confirm_password;

    // --------------------------------------------------------
    // 4. GET SELECTED ROLES
    // --------------------------------------------------------

    const roleIds = [
      ...new Set(
        employeeForm.role_ids
      ),
    ];

    // --------------------------------------------------------
    // 5. VALIDATE NAME
    // --------------------------------------------------------

    if (
      name.length < 2 ||
      name.length > 150
    ) {
      setError(
        "Employee name must contain 2 to 150 characters."
      );

      return;
    }

    // --------------------------------------------------------
    // 6. VALIDATE EMAIL
    // --------------------------------------------------------

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setError(
        "Enter a valid employee email address."
      );

      return;
    }

    // --------------------------------------------------------
    // 7. VALIDATE PASSWORD
    //
    // Any nonempty application-level length
    // is accepted.
    // Supabase may reject weak passwords.
    // --------------------------------------------------------

    if (
      typeof password !== "string" ||
      password.length === 0
    ) {
      setError(
        "Employee password is required."
      );

      return;
    }

    // --------------------------------------------------------
    // 8. CONFIRM PASSWORD
    // --------------------------------------------------------

    if (
      password !== confirmPassword
    ) {
      setError(
        "Password and confirmation do not match."
      );

      return;
    }

    // --------------------------------------------------------
    // 9. VALIDATE ROLE COUNT
    // --------------------------------------------------------

    if (
      roleIds.length === 0 ||
      roleIds.length > 100
    ) {
      setError(
        "Select between 1 and 100 custom roles."
      );

      return;
    }

    // --------------------------------------------------------
    // 10. VERIFY ACTIVE ROLES
    // --------------------------------------------------------

    const activeRoleIds = new Set(
      activeRoles.map(
        (role) => role.id
      )
    );

    if (
      roleIds.some(
        (id) =>
          !activeRoleIds.has(id)
      )
    ) {
      setError(
        "One or more selected custom roles are no longer active."
      );

      return;
    }

    // --------------------------------------------------------
    // 11. BUILD API PAYLOAD
    //
    // No vendor_id or member_role is supplied.
    // --------------------------------------------------------

    const payload = {
      full_name: name,
      email,
      password,
      role_ids: roleIds,
    };

    // --------------------------------------------------------
    // 12. PREVENT DUPLICATE SUBMISSIONS
    // --------------------------------------------------------

    busyRef.current = true;
    setBusy(true);

    clearMessages();

    try {
      // ------------------------------------------------------
      // 13. CREATE EMPLOYEE
      // ------------------------------------------------------

      const response =
        await teamManagementApi.createEmployee(
          payload
        );

      // ------------------------------------------------------
      // 14. VERIFY SUCCESS RESPONSE
      // ------------------------------------------------------

      if (
        response?.status !== "success" ||
        response?.account_status !== "active"
      ) {
        throw new Error(
          "Employee creation could not be confirmed. " +
          "Review the account before retrying."
        );
      }

      // ------------------------------------------------------
      // 15. CLEAR CREDENTIALS
      // ------------------------------------------------------

      setEmployeeForm({
        ...EMPTY_EMPLOYEE,
        role_ids: [],
      });

      setShowEmployeePassword(false);
      setShowConfirmPassword(false);

      // ------------------------------------------------------
      // 16. CLOSE DIALOG
      // ------------------------------------------------------

      setDialog(null);

      // ------------------------------------------------------
      // 17. SUCCESS MESSAGE
      // ------------------------------------------------------

      setSuccess(
        `Employee "${name}" created successfully. ` +
        "They can log in using their email " +
        "and the password provided."
      );

      // ------------------------------------------------------
      // 18. REFRESH TEAM DIRECTORY
      // ------------------------------------------------------

      if (
        typeof onMemberChange === "function"
      ) {
        try {
          const result =
            await onMemberChange();

          if (result === false) {
            setError(
              "Employee created successfully, but " +
              "the Team directory could not be refreshed."
            );
          }
        } catch {
          setError(
            "Employee created successfully, but " +
            "the Team directory could not be refreshed."
          );
        }
      }
    } catch (err) {
      // Do not automatically retry.
      // Auth account creation may already
      // have completed on the backend.

      setError(
        getErrorMessage(
          err,
          "Unable to create employee account. " +
          "Check account status before retrying."
        )
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }


  // ==========================================================
  // LEGACY INVITATION
  // ==========================================================

  function submitInvitation(event) {
    event.preventDefault();

    if (
      busyRef.current ||
      !INVITATIONS_ENABLED
    ) {
      return;
    }

    const name =
      inviteName.trim();

    const email =
      inviteEmail.trim().toLowerCase();

    const roleIds = [
      ...new Set(selectedRoles),
    ];

    if (
      name.length < 2 ||
      !email.includes("@") ||
      !roleIds.length
    ) {
      setError(
        "Enter an employee name, email and at least one role."
      );

      return;
    }

    runMutation({
      task: () =>
        teamManagementApi.inviteMember({
          full_name: name,
          email,
          role_ids: roleIds,
        }),

      successMessage:
        "Staff invitation initiated successfully.",

      refreshTeam: true,
      refreshRoleList: false,
    });
  }


  // ==========================================================
  // ACTIVATE / DEACTIVATE CUSTOM ROLE
  // ==========================================================

  function changeRoleStatus(role) {
    if (busyRef.current) {
      return;
    }

    const nextActive =
      !role.is_active;

    const action = nextActive
      ? "activate"
      : "deactivate";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} ` +
        `"${role.role_name}"?`
      );

    if (!confirmed) {
      return;
    }

    runMutation({
      task: () =>
        teamManagementApi.setRoleActive(
          role.id,
          nextActive
        ),

      successMessage:
        nextActive
          ? "Custom role activated successfully."
          : "Custom role deactivated successfully.",

      refreshTeam: false,
      refreshRoleList: true,
    });
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section
      className="ata-panel"
      aria-label="Custom roles and staff access"
    >

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="ata-header">
        <div>
          <span className="avt-eyebrow">
            ACCESS MANAGEMENT
          </span>

          <h2>
            Custom Roles & Staff Access
          </h2>

          <p>
            Create employee accounts, configure
            custom roles and manage staff access.
          </p>
        </div>

        <div className="ata-actions">

          {/* REFRESH */}

          <button
            type="button"
            className="avt-button avt-button-light"
            disabled={loading || busy}
            onClick={async () => {
              clearMessages();

              await refreshRoles();
            }}
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "avt-spin"
                  : ""
              }
            />

            Refresh
          </button>

          {/* ASSIGN ROLES */}

          <button
            type="button"
            className="avt-button avt-button-light"
            onClick={openAssignment}
            disabled={
              loading ||
              busy ||
              !assignableMembers.length ||
              !activeRoles.length
            }
          >
            <ShieldCheck size={16} />

            Assign Roles
          </button>

          {/* CREATE ROLE */}

          <button
            type="button"
            className="avt-button avt-button-light"
            onClick={() =>
              openRoleEditor()
            }
            disabled={loading || busy}
          >
            <Plus size={16} />

            New Role
          </button>

          {/* ADD EMPLOYEE */}

          <button
            type="button"
            className="avt-button avt-button-primary"
            onClick={openEmployeeCreation}
            disabled={
              loading ||
              busy ||
              !activeRoles.length
            }
          >
            <UserRoundPlus size={16} />

            Add Employee
          </button>
        </div>
      </header>


      {/* =====================================================
          NOTIFICATIONS
      ===================================================== */}

      <Message
        error={dialog ? "" : error}
        success={dialog ? "" : success}
        onDismiss={clearMessages}
      />


      {/* =====================================================
          EMPLOYEE ACCOUNTS STRIP
      ===================================================== */}

      <div className="ata-invite-strip">
        <div>
          <UserRoundPlus size={21} />

          <span>
            <strong>
              Employee Accounts
            </strong>

            <small>
              Create individual employee logins
              with passwords and selected custom
              roles. Employees use the existing
              Vendor Web login page.
            </small>
          </span>
        </div>

        <button
          type="button"
          className="avt-button avt-button-light"
          onClick={openEmployeeCreation}
          disabled={
            loading ||
            busy ||
            !activeRoles.length
          }
        >
          <Plus size={16} />

          Add Employee
        </button>
      </div>


      {/* =====================================================
          LEGACY INVITATION STRIP
      ===================================================== */}

      {INVITATIONS_ENABLED && (
        <div className="ata-invite-strip">
          <div>
            <MailPlus size={21} />

            <span>
              <strong>
                Invite Team Member by Email
              </strong>

              <small>
                Legacy email invitation workflow.
              </small>
            </span>
          </div>

          <button
            type="button"
            className="avt-button avt-button-light"
            onClick={openInvitation}
            disabled={
              loading ||
              busy ||
              !activeRoles.length
            }
          >
            <MailPlus size={16} />

            Invite Staff
          </button>
        </div>
      )}


      {/* =====================================================
          CUSTOM ROLE LIST
      ===================================================== */}

      {loading ? (
        <div className="ata-state">
          <LoaderCircle
            size={22}
            className="avt-spin"
          />

          Loading custom roles...
        </div>
      ) : roles.length === 0 ? (
        <div className="ata-state">
          <ShieldCheck size={24} />

          No custom roles yet. Create your
          first role before adding employees.
        </div>
      ) : (
        <div className="ata-roles">
          {roles.map((role) => (
            <article
              key={role.id}
              className="ata-role-card"
            >
              <div className="ata-role-top">
                <span className="ata-role-mark">
                  <ShieldCheck size={19} />
                </span>

                <span
                  className={`ata-state-pill ${
                    role.is_active
                      ? "ata-active"
                      : "ata-inactive"
                  }`}
                >
                  {role.is_active
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

              <h3>
                <RoleName role={role} />
              </h3>

              <p>
                {role.description ||
                  "No description provided."}
              </p>

              <small>
                {role.permissions.length}{" "}
                permission(s)
              </small>

              <div className="ata-chips">
                {role.permissions.map(
                  (permission) => (
                    <span key={permission}>
                      {permission}
                    </span>
                  )
                )}
              </div>

              <footer>
                <button
                  type="button"
                  className="avt-button avt-button-light"
                  onClick={() =>
                    openRoleEditor(role)
                  }
                  disabled={busy}
                >
                  <Pencil size={15} />

                  Edit
                </button>

                <button
                  type="button"
                  className={`avt-button ${
                    role.is_active
                      ? "avt-button-danger"
                      : "avt-button-soft"
                  }`}
                  onClick={() =>
                    changeRoleStatus(role)
                  }
                  disabled={busy}
                >
                  {role.is_active
                    ? "Deactivate"
                    : "Activate"}
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}


      {/* =====================================================
          ADD EMPLOYEE MODAL
      ===================================================== */}

      {dialog?.type === "employee" && (
        <Dialog
          title="Add New Employee"
          onClose={closeDialog}
          locked={busy}
        >
          <form
            className="ata-form"
            onSubmit={submitEmployee}
            autoComplete="off"
          >
            <p className="ata-hint">
              Create a separate login for an
              employee and assign their custom
              roles. The employee can use the
              password you provide to log in.
            </p>

            {/* EMPLOYEE FULL NAME */}

            <label>
              Employee Full Name

              <input
                type="text"
                required
                minLength={2}
                maxLength={150}
                autoComplete="off"
                placeholder="Enter employee full name"
                value={
                  employeeForm.full_name
                }
                disabled={busy}
                onChange={(event) =>
                  updateEmployeeField(
                    "full_name",
                    event.target.value
                  )
                }
              />
            </label>

            {/* EMPLOYEE EMAIL */}

            <label>
              Employee Email

              <input
                type="email"
                required
                autoComplete="off"
                placeholder="employee@company.com"
                value={
                  employeeForm.email
                }
                disabled={busy}
                onChange={(event) =>
                  updateEmployeeField(
                    "email",
                    event.target.value
                  )
                }
              />
            </label>

            {/* EMPLOYEE PASSWORD */}

            <label>
              Employee Password

              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <input
                  type={
                    showEmployeePassword
                      ? "text"
                      : "password"
                  }
                  required
                  autoComplete="new-password"
                  placeholder="Enter employee password"
                  value={
                    employeeForm.password
                  }
                  disabled={busy}
                  onChange={(event) =>
                    updateEmployeeField(
                      "password",
                      event.target.value
                    )
                  }
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                />

                <button
                  type="button"
                  className="avt-button avt-button-light"
                  aria-label={
                    showEmployeePassword
                      ? "Hide employee password"
                      : "Show employee password"
                  }
                  onClick={() =>
                    setShowEmployeePassword(
                      (value) => !value
                    )
                  }
                  disabled={busy}
                >
                  {showEmployeePassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </span>
            </label>

            {/* CONFIRM PASSWORD */}

            <label>
              Confirm Password

              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter employee password"
                  value={
                    employeeForm.confirm_password
                  }
                  disabled={busy}
                  onChange={(event) =>
                    updateEmployeeField(
                      "confirm_password",
                      event.target.value
                    )
                  }
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                />

                <button
                  type="button"
                  className="avt-button avt-button-light"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmation"
                      : "Show confirmation"
                  }
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  disabled={busy}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </span>
            </label>

            <p className="ata-hint">
              Choose an employee password.
              Changing it after login is optional.
              A strong password is recommended.
              Supabase Auth may enforce its own
              password policy.
            </p>

            {/* ASSIGN CUSTOM ROLES */}

            <div className="ata-section-title">
              Assign Custom Roles

              <small>
                Select one or more active roles.
                Vendor Owner privileges cannot
                be assigned.
              </small>
            </div>

            <RoleSelector
              roles={activeRoles}
              selected={
                employeeForm.role_ids
              }
              onChange={(roleIds) =>
                updateEmployeeField(
                  "role_ids",
                  roleIds
                )
              }
              disabled={busy}
            />

            {/* ERROR MESSAGE */}

            <Message
              error={error}
              onDismiss={() =>
                setError("")
              }
            />

            {/* ACTION BUTTONS */}

            <footer>
              <button
                type="button"
                className="avt-button avt-button-light"
                onClick={closeDialog}
                disabled={busy}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="avt-button avt-button-primary"
                disabled={
                  busy ||
                  !employeeForm.full_name.trim() ||
                  !employeeForm.email.trim() ||
                  employeeForm.password.length === 0 ||
                  employeeForm.password !==
                    employeeForm.confirm_password ||
                  !employeeForm.role_ids.length
                }
              >
                {busy ? (
                  <LoaderCircle
                    size={16}
                    className="avt-spin"
                  />
                ) : (
                  <UserRoundPlus size={16} />
                )}

                {busy
                  ? "Creating Employee..."
                  : "Create Employee"}
              </button>
            </footer>
          </form>
        </Dialog>
      )}


      {/* =====================================================
          CREATE / EDIT ROLE MODAL
      ===================================================== */}

      {dialog?.type === "role" && (
        <Dialog
          title={
            dialog.role
              ? "Edit Custom Role"
              : "Create Custom Role"
          }
          onClose={closeDialog}
          locked={busy}
        >
          <form
            className="ata-form"
            onSubmit={submitRole}
          >
            <label>
              Role Name

              <input
                type="text"
                value={
                  roleForm.role_name
                }
                minLength={2}
                maxLength={80}
                required
                disabled={busy}
                placeholder="e.g. Accounts Executive"
                onChange={(event) =>
                  setRoleForm(
                    (previous) => ({
                      ...previous,
                      role_name:
                        event.target.value,
                    })
                  )
                }
              />
            </label>

            <label>
              Description

              <textarea
                rows={2}
                maxLength={500}
                disabled={busy}
                value={
                  roleForm.description
                }
                placeholder="Describe this role"
                onChange={(event) =>
                  setRoleForm(
                    (previous) => ({
                      ...previous,
                      description:
                        event.target.value,
                    })
                  )
                }
              />
            </label>

            <div className="ata-section-title">
              Allowed Permissions

              <small>
                Operational permissions and
                approved Earnings access can
                be assigned. Team Management,
                Payouts and ownership remain
                protected.
              </small>
            </div>

            <PermissionPicker
              selected={
                roleForm.permissions
              }
              disabled={busy}
              onChange={(permissions) =>
                setRoleForm(
                  (previous) => ({
                    ...previous,
                    permissions,
                  })
                )
              }
            />

            {!ACCOUNTS_EARNINGS_ENABLED && (
              <p className="ata-hint">
                Accounts & Earnings requires
                backend permission integration.
              </p>
            )}

            <Message
              error={error}
              onDismiss={() =>
                setError("")
              }
            />

            <footer>
              <button
                type="button"
                className="avt-button avt-button-light"
                onClick={closeDialog}
                disabled={busy}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="avt-button avt-button-primary"
                disabled={
                  busy ||
                  !roleForm.permissions.length
                }
              >
                {busy ? (
                  <LoaderCircle
                    size={16}
                    className="avt-spin"
                  />
                ) : (
                  <Check size={16} />
                )}

                {busy
                  ? "Saving..."
                  : "Save Role"}
              </button>
            </footer>
          </form>
        </Dialog>
      )}


      {/* =====================================================
          ASSIGN CUSTOM ROLES MODAL
      ===================================================== */}

      {dialog?.type === "assign" && (
        <Dialog
          title="Assign Custom Roles"
          onClose={closeDialog}
          locked={busy}
        >
          <form
            className="ata-form"
            onSubmit={submitAssignment}
          >
            <p className="ata-hint">
              Select an employee and assign
              one or more custom roles. Saving
              replaces their previous role
              assignments. Vendor Owner access
              cannot be modified.
            </p>

            <label>
              Team Member

              <span className="ata-select">
                <select
                  value={
                    selectedMember
                  }
                  disabled={busy}
                  onChange={(event) => {
                    setSelectedMember(
                      event.target.value
                    );

                    setSelectedRoles([]);
                  }}
                >
                  {assignableMembers.map(
                    (member) => (
                      <option
                        key={
                          member.user_id
                        }
                        value={
                          member.user_id
                        }
                      >
                        {member.full_name ||
                          member.user_id}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown size={16} />
              </span>
            </label>

            <div className="ata-section-title">
              Select Active Roles
            </div>

            <RoleSelector
              roles={activeRoles}
              selected={
                selectedRoles
              }
              onChange={
                setSelectedRoles
              }
              disabled={busy}
            />

            <Message
              error={error}
              onDismiss={() =>
                setError("")
              }
            />

            <footer>
              <button
                type="button"
                className="avt-button avt-button-light"
                onClick={closeDialog}
                disabled={busy}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="avt-button avt-button-primary"
                disabled={
                  busy ||
                  !selectedMember ||
                  !selectedRoles.length
                }
              >
                {busy
                  ? "Saving..."
                  : "Save Assignments"}
              </button>
            </footer>
          </form>
        </Dialog>
      )}


      {/* =====================================================
          LEGACY STAFF INVITATION MODAL
      ===================================================== */}

      {dialog?.type === "invite" &&
        INVITATIONS_ENABLED && (
          <Dialog
            title="Invite Staff Member"
            onClose={closeDialog}
            locked={busy}
          >
            <form
              className="ata-form"
              onSubmit={submitInvitation}
            >
              <p className="ata-hint">
                Send a Supabase Auth invitation
                to the employee email address.
              </p>

              <label>
                Full Name

                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={150}
                  value={inviteName}
                  disabled={busy}
                  onChange={(event) =>
                    setInviteName(
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Email

                <input
                  type="email"
                  required
                  value={inviteEmail}
                  disabled={busy}
                  onChange={(event) =>
                    setInviteEmail(
                      event.target.value
                    )
                  }
                />
              </label>

              <div className="ata-section-title">
                Assign Active Roles
              </div>

              <RoleSelector
                roles={activeRoles}
                selected={selectedRoles}
                onChange={
                  setSelectedRoles
                }
                disabled={busy}
              />

              <Message
                error={error}
                onDismiss={() =>
                  setError("")
                }
              />

              <footer>
                <button
                  type="button"
                  className="avt-button avt-button-light"
                  onClick={closeDialog}
                  disabled={busy}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="avt-button avt-button-primary"
                  disabled={
                    busy ||
                    !inviteName.trim() ||
                    !inviteEmail.trim() ||
                    !selectedRoles.length
                  }
                >
                  <MailPlus size={16} />

                  {busy
                    ? "Sending..."
                    : "Send Invitation"}
                </button>
              </footer>
            </form>
          </Dialog>
        )}
    </section>
  );
}
