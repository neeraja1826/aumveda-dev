
import "./ProfilePage.css";

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
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Mail,
  MapPin,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Store,
  Upload,
  X,
  XCircle,
} from "lucide-react";

import { vendorApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

/* ============================================================
   CONFIGURATION
============================================================ */

const EMPTY_FORM = {
  business_name: "",
  legal_name: "",
  description: "",
  email: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  tax_id: "",
};

const SECTIONS = [
  {
    key: "store_information",
    number: "01",
    id: "avbp-store",
    label: "Store Information",
    fields: ["business_name", "description"],
  },
  {
    key: "contact_information",
    number: "02",
    id: "avbp-contact",
    label: "Contact Information",
    fields: ["email", "phone"],
  },
  {
    key: "business_address",
    number: "03",
    id: "avbp-address",
    label: "Business Address",
    fields: [
      "address_line1",
      "address_line2",
      "city",
      "state",
      "postal_code",
      "country",
    ],
  },
  {
    key: "legal_tax",
    number: "04",
    id: "avbp-compliance",
    label: "Legal & Tax Details",
    fields: ["legal_name", "tax_id"],
  },
];

const FIELD_LABELS = {
  business_name: "Business Name",
  description: "Business Description",
  email: "Business Email",
  phone: "Phone Number",
  address_line1: "Address Line 1",
  address_line2: "Address Line 2",
  city: "City",
  state: "State",
  postal_code: "Postal Code",
  country: "Country",
  legal_name: "Legal Name",
  tax_id: "Tax ID",
};

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/* ============================================================
   RESPONSE HELPERS
============================================================ */

function unwrapObject(response, key) {
  const value =
    response?.data?.[key] ??
    response?.[key] ??
    response?.data ??
    response;

  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value
    : null;
}

function normalizeProfile(response) {
  const vendor = unwrapObject(response, "vendor");

  if (
    vendor &&
    ("business_name" in vendor || "id" in vendor)
  ) {
    return vendor;
  }

  const profile = unwrapObject(response, "profile");

  if (
    profile &&
    ("business_name" in profile || "id" in profile)
  ) {
    return profile;
  }

  return null;
}

function normalizeBranding(response) {
  const data = unwrapObject(response, "branding");

  if (!data) return null;

  return {
    ...data,
    approved: data.approved || {},
    pending: data.pending || {},
    latest: data.latest || {},
  };
}

function normalizeRequests(response) {
  const candidates = [
    response,
    response?.requests,
    response?.items,
    response?.data,
    response?.data?.requests,
    response?.data?.items,
    response?.data?.data,
  ];

  const found = candidates.find(Array.isArray);

  if (!found) {
    throw new Error(
      "The profile change requests API returned an unexpected response."
    );
  }

  return found
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item)
    )
    .sort((a, b) => {
      const aTime = Date.parse(
        a.created_at || a.updated_at || ""
      );
      const bTime = Date.parse(
        b.created_at || b.updated_at || ""
      );

      return (
        (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0)
      );
    });
}

function mapProfileToForm(profile) {
  return Object.fromEntries(
    Object.keys(EMPTY_FORM).map((field) => [
      field,
      String(profile?.[field] ?? ""),
    ])
  );
}

function cleanValue(value) {
  return String(value ?? "").trim();
}

function formatStatus(value) {
  return String(value || "Unknown")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatCommission(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? `${number}%`
    : "—";
}

function shortId(value) {
  return value
    ? String(value).slice(0, 8)
    : "—";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function getErrorMessage(error, fallback) {
  const detail =
    error?.data?.detail ??
    error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return (
      detail
        .map((item) => item?.msg || item?.message)
        .filter(Boolean)
        .join(". ") || fallback
    );
  }

  return error?.message || fallback;
}

function getSectionChanges(section, form, baseline) {
  const changes = {};

  section.fields.forEach((field) => {
    const proposed = cleanValue(form[field]);
    const current = cleanValue(baseline[field]);

    if (proposed !== current) {
      changes[field] = proposed;
    }
  });

  return changes;
}

function getSectionPendingRequest(requests, sectionKey) {
  return requests.find(
    (request) =>
      request.section === sectionKey &&
      String(request.status).toLowerCase() ===
        "pending"
  );
}

function getLatestSectionRequest(requests, sectionKey) {
  return requests.find(
    (request) => request.section === sectionKey
  );
}

/* ============================================================
   COMMON COMPONENTS
============================================================ */

function StatusBadge({ status }) {
  const value = String(status || "unknown")
    .trim()
    .toLowerCase();

  return (
    <span className={`avbp-status avbp-status-${value}`}>
      <BadgeCheck size={15} />
      {formatStatus(value)}
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <article className="avbp-summary-card">
      <span className="avbp-summary-icon">
        <Icon size={20} strokeWidth={1.8} />
      </span>

      <div>
        <span>{label}</span>
        <strong title={String(value)}>
          {value}
        </strong>
      </div>
    </article>
  );
}

function ProfileField({
  label,
  required = false,
  wide = false,
  hint,
  children,
}) {
  return (
    <label
      className={`avbp-field ${
        wide ? "avbp-field-wide" : ""
      }`}
    >
      <span className="avbp-field-label">
        {label}
        {required && <b> *</b>}
      </span>

      {children}

      {hint && <small>{hint}</small>}
    </label>
  );
}

function RequestStatus({
  request,
  compact = false,
}) {
  if (!request) return null;

  const status = String(
    request.status || "unknown"
  ).toLowerCase();

  const configuration = {
    pending: {
      Icon: Clock3,
      color: "#b7791f",
      background: "rgba(245,158,11,0.10)",
      border: "rgba(245,158,11,0.25)",
      title: "Pending Admin Approval",
    },
    approved: {
      Icon: CheckCircle2,
      color: "#15803d",
      background: "rgba(34,197,94,0.10)",
      border: "rgba(34,197,94,0.25)",
      title: "Approved",
    },
    rejected: {
      Icon: XCircle,
      color: "#dc2626",
      background: "rgba(239,68,68,0.10)",
      border: "rgba(239,68,68,0.25)",
      title: "Rejected",
    },
  };

  const config =
    configuration[status] ||
    configuration.pending;

  const Icon = config.Icon;

  return (
    <div
      style={{
        padding: compact ? "7px 11px" : "12px 14px",
        borderRadius: 11,
        background: config.background,
        border: `1px solid ${config.border}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        minWidth: 0,
      }}
    >
      <Icon
        size={compact ? 15 : 18}
        color={config.color}
        style={{ flexShrink: 0, marginTop: 2 }}
      />

      <div style={{ minWidth: 0 }}>
        <strong
          style={{
            display: "block",
            fontSize: compact ? 12 : 13,
            color: config.color,
          }}
        >
          {config.title}
        </strong>

        {!compact && status === "pending" && (
          <small>
            Current approved information remains
            unchanged until Admin approval.
          </small>
        )}

        {!compact &&
          status === "rejected" &&
          request.rejection_reason && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 12,
                overflowWrap: "anywhere",
              }}
            >
              Reason: {request.rejection_reason}
            </p>
          )}
      </div>
    </div>
  );
}

function SectionFooter({
  section,
  changes,
  pendingRequest,
  latestRequest,
  busy,
  onSubmit,
  onDiscard,
}) {
  const count = Object.keys(changes).length;
  const hasChanges = count > 0;

  return (
    <div
      className="avbp-save-bar"
      style={{
        marginTop: 18,
        flexWrap: "wrap",
        gap: 14,
      }}
    >
      <div
        className="avbp-save-status"
        style={{ flex: "1 1 260px" }}
      >
        <span
          className={`avbp-save-dot ${
            hasChanges
              ? "avbp-save-dot-pending"
              : ""
          }`}
        />

        <div>
          <strong>
            {pendingRequest
              ? "Awaiting Admin Review"
              : hasChanges
                ? `${count} unsaved ${
                    count === 1 ? "field" : "fields"
                  }`
                : "No unsaved changes"}
          </strong>

          <small>
            {pendingRequest
              ? "A new request can be submitted after this review."
              : hasChanges
                ? "Submitting will request Admin approval."
                : latestRequest?.status === "approved"
                  ? "Latest request approved."
                  : "Approved details are up to date."}
          </small>
        </div>
      </div>

      <div
        className="avbp-save-actions"
        style={{
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          className="avbp-button avbp-button-light"
          disabled={!hasChanges || busy}
          onClick={() => onDiscard(section.key)}
        >
          <RotateCcw size={16} />
          Discard
        </button>

        <button
          type="button"
          className="avbp-button avbp-button-primary"
          disabled={
            !hasChanges ||
            Boolean(pendingRequest) ||
            busy
          }
          onClick={() => onSubmit(section.key)}
        >
          {busy ? (
            <LoaderCircle
              size={16}
              className="avbp-spin"
            />
          ) : (
            <Send size={16} />
          )}

          {busy
            ? "Submitting..."
            : pendingRequest
              ? "Approval Pending"
              : "Submit for Approval"}
        </button>
      </div>
    </div>
  );
}

function FormSection({
  number,
  title,
  description,
  icon: Icon,
  id,
  request,
  children,
  footer,
}) {
  return (
    <section
      id={id}
      className="avbp-form-section"
    >
      <div className="avbp-section-heading">
        <span className="avbp-section-icon">
          <Icon size={20} />
        </span>

        <div style={{ minWidth: 0 }}>
          <span className="avbp-eyebrow">
            SECTION {number}
          </span>

          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>

      {request && (
        <div style={{ margin: "12px 0 16px" }}>
          <RequestStatus request={request} />
        </div>
      )}

      <div className="avbp-form-grid">
        {children}
      </div>

      {footer}
    </section>
  );
}

function BrandingCard({
  type,
  title,
  imageUrl,
  uploading,
  blocked,
  inputRef,
  onUpload,
}) {
  const isLogo = type === "logo";

  return (
    <article className="avbp-brand-card">
      <header className="avbp-brand-card-heading">
        <div>
          <span className="avbp-eyebrow">
            {isLogo
              ? "BRAND IDENTITY"
              : "STOREFRONT MEDIA"}
          </span>

          <h3>{title}</h3>

          <p>
            {isLogo
              ? "Your store's current logo. Changes appear immediately."
              : "Your current store banner. Changes appear immediately."}
          </p>
        </div>

        <span className="avbp-brand-type">
          {isLogo ? "Logo" : "Banner"}
        </span>
      </header>

      <div
        className={`avbp-brand-preview ${
          isLogo
            ? "avbp-brand-preview-logo"
            : "avbp-brand-preview-banner"
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
          />
        ) : (
          <div className="avbp-brand-empty">
            <ImageIcon size={30} />

            <strong>
              No {type} uploaded
            </strong>

            <small>
              Upload an image to display it
              immediately.
            </small>
          </div>
        )}
      </div>

      <div className="avbp-brand-approved">
        {imageUrl ? (
          <>
            <CheckCircle2 size={17} />
            Current image in use
          </>
        ) : (
          <>
            <ImageIcon size={17} />
            No image available
          </>
        )}
      </div>

      <div className="avbp-brand-upload">
        <input
          ref={inputRef}
          type="file"
          hidden
          accept="image/jpeg,image/png,image/webp"
          disabled={blocked}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";

            if (file) {
              onUpload(type, file);
            }
          }}
        />

        <button
          type="button"
          className="avbp-button avbp-button-light avbp-upload-button"
          disabled={blocked}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <LoaderCircle
              size={17}
              className="avbp-spin"
            />
          ) : (
            <Upload size={17} />
          )}

          {uploading
            ? "Uploading..."
            : `Upload New ${
                isLogo ? "Logo" : "Banner"
              }`}
        </button>

        <small>
          JPG, PNG or WEBP · Maximum 5 MB ·
          Updates immediately
        </small>
      </div>
    </article>
  );
}

function RequestHistory({ requests }) {
  const [showAll, setShowAll] = useState(false);

  const visibleRequests = showAll
    ? requests
    : requests.slice(0, 5);

  const labelBySection = Object.fromEntries(
    SECTIONS.map((section) => [
      section.key,
      section.label,
    ])
  );

  return (
    <section
      className="avbp-brand-studio"
      style={{ marginTop: 22 }}
    >
      <header className="avbp-panel-heading">
        <span className="avbp-panel-icon">
          <Clock3 size={21} />
        </span>

        <div>
          <span className="avbp-eyebrow">
            APPROVAL ACTIVITY
          </span>

          <h2>Profile Change Requests</h2>

          <p>
            Track submitted business information
            changes and Admin decisions.
          </p>
        </div>
      </header>

      {requests.length === 0 ? (
        <div
          style={{
            padding: "20px",
            border: "1px dashed var(--avbp-border, #d9dfe6)",
            borderRadius: 14,
            fontSize: 13,
            opacity: 0.8,
          }}
        >
          No profile change requests yet.
          Changes submitted for approval will
          appear here.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          {visibleRequests.map((request) => {
            const changes =
              request.proposed_changes &&
              typeof request.proposed_changes ===
                "object"
                ? request.proposed_changes
                : {};

            return (
              <article
                key={request.id}
                style={{
                  padding: "15px 17px",
                  borderRadius: 14,
                  border:
                    "1px solid var(--avbp-border, #e5e7eb)",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: 14,
                      }}
                    >
                      {labelBySection[
                        request.section
                      ] ||
                        formatStatus(
                          request.section
                        )}
                    </strong>

                    <small>
                      Submitted{" "}
                      {formatDate(
                        request.created_at
                      )}
                    </small>
                  </div>

                  <RequestStatus
                    request={request}
                    compact
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 7,
                  }}
                >
                  {Object.entries(changes).map(
                    ([field, value]) => (
                      <div
                        key={field}
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          justifyContent:
                            "space-between",
                          gap: 8,
                          fontSize: 12,
                          overflowWrap: "anywhere",
                        }}
                      >
                        <span
                          style={{ opacity: 0.7 }}
                        >
                          {FIELD_LABELS[field] ||
                            formatStatus(field)}
                        </span>

                        <strong>
                          {value === null ||
                          value === ""
                            ? "(empty)"
                            : String(value)}
                        </strong>
                      </div>
                    )
                  )}
                </div>

                {request.status === "rejected" &&
                  request.rejection_reason && (
                    <p
                      style={{
                        margin: "12px 0 0",
                        fontSize: 12,
                        color: "#dc2626",
                        overflowWrap: "anywhere",
                      }}
                    >
                      Rejection reason:{" "}
                      {request.rejection_reason}
                    </p>
                  )}

                {request.reviewed_at && (
                  <small
                    style={{
                      display: "block",
                      marginTop: 10,
                      opacity: 0.7,
                    }}
                  >
                    Reviewed{" "}
                    {formatDate(
                      request.reviewed_at
                    )}
                  </small>
                )}
              </article>
            );
          })}

          {requests.length > 5 && (
            <button
              type="button"
              className="avbp-button avbp-button-light"
              style={{ justifySelf: "center" }}
              onClick={() =>
                setShowAll((current) => !current)
              }
            >
              {showAll
                ? "Show Less"
                : `View All ${requests.length} Requests`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   MAIN BUSINESS PROFILE PAGE
============================================================ */

export default function ProfilePage() {
  const { syncVendorProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [branding, setBranding] = useState(null);

  const [requests, setRequests] = useState([]);

  const [form, setForm] = useState({
    ...EMPTY_FORM,
  });

  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [submittingSection, setSubmittingSection] =
    useState(null);

  const [uploadingType, setUploadingType] =
    useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const formRef = useRef(form);
  const baselineRef = useRef({
    ...EMPTY_FORM,
  });

  const mutationLock = useRef(false);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  /* ==========================================================
     CHANGED FIELDS BY SECTION
  ========================================================== */

  const sectionChanges = useMemo(() => {
    const baseline = mapProfileToForm(profile);

    return Object.fromEntries(
      SECTIONS.map((section) => [
        section.key,
        getSectionChanges(
          section,
          form,
          baseline
        ),
      ])
    );
  }, [form, profile]);

  const hasChanges = useMemo(
    () =>
      Object.values(sectionChanges).some(
        (changes) =>
          Object.keys(changes).length > 0
      ),
    [sectionChanges]
  );

  const pendingCount = requests.filter(
    (request) =>
      request.status === "pending"
  ).length;

  const completedCount = requests.filter(
    (request) =>
      request.status === "approved"
  ).length;

  const rejectedCount = requests.filter(
    (request) =>
      request.status === "rejected"
  ).length;

  /* ==========================================================
     LOAD PROFILE, BRANDING AND CHANGE REQUESTS
  ========================================================== */

  const loadPage = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const [
          profileResponse,
          brandingResponse,
          requestsResponse,
        ] = await Promise.all([
          vendorApi.getProfile(),
          vendorApi.getBranding(),
          vendorApi.getProfileChangeRequests(),
        ]);

        const nextProfile =
          normalizeProfile(profileResponse);

        if (!nextProfile) {
          throw new Error(
            "The profile API did not return a valid business profile."
          );
        }

        const nextBranding =
          normalizeBranding(brandingResponse);

        const nextRequests =
          normalizeRequests(requestsResponse);

        const nextBaseline =
          mapProfileToForm(nextProfile);

        const oldBaseline =
          baselineRef.current;

        const oldForm = formRef.current;

        // Preserve unsaved edits when Refresh is clicked.
        // Unmodified fields receive new server values.

        const nextForm =
          silent && loaded
            ? Object.fromEntries(
                Object.keys(EMPTY_FORM).map(
                  (field) => [
                    field,
                    cleanValue(
                      oldForm[field]
                    ) !==
                    cleanValue(
                      oldBaseline[field]
                    )
                      ? oldForm[field]
                      : nextBaseline[field],
                  ]
                )
              )
            : nextBaseline;

        setProfile(nextProfile);
        setBranding(nextBranding);
        setRequests(nextRequests);
        setForm(nextForm);

        baselineRef.current =
          nextBaseline;

        formRef.current = nextForm;

        if (
          typeof syncVendorProfile === "function"
        ) {
          syncVendorProfile(nextProfile);
        }

        setLoaded(true);

        return true;
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            "Unable to load business profile."
          )
        );

        return false;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [syncVendorProfile, loaded]
  );

  useEffect(() => {
    // Do not use 'loaded' to trigger another fetch.
    // Fetch once on mount; manual Refresh handles reloads.
    if (!loaded && !loading) return;
  }, [loaded, loading]);

  const initialLoadRef = useRef(false);

  useEffect(() => {
    if (initialLoadRef.current) return;

    initialLoadRef.current = true;

    loadPage(false);
  }, [loadPage]);

  /* ==========================================================
     FORM HANDLERS
  ========================================================== */

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => {
      const next = {
        ...current,
        [name]: value,
      };

      formRef.current = next;

      return next;
    });

    setSuccess("");
  }

  function discardSection(sectionKey) {
    if (mutationLock.current) return;

    const section = SECTIONS.find(
      (item) => item.key === sectionKey
    );

    if (!section) return;

    const baseline =
      baselineRef.current;

    setForm((current) => {
      const next = { ...current };

      section.fields.forEach((field) => {
        next[field] =
          baseline[field] ?? "";
      });

      formRef.current = next;

      return next;
    });

    setError("");
    setSuccess("");
  }

  function discardAll() {
    if (mutationLock.current) return;

    const restored = {
      ...baselineRef.current,
    };

    setForm(restored);
    formRef.current = restored;

    setError("");
    setSuccess("");
  }

  /* ==========================================================
     SUBMIT ONE SECTION FOR ADMIN APPROVAL
  ========================================================== */

  async function submitSection(sectionKey) {
    if (mutationLock.current) return;

    const section = SECTIONS.find(
      (item) => item.key === sectionKey
    );

    if (!section || !profile) return;

    const pendingRequest =
      getSectionPendingRequest(
        requests,
        sectionKey
      );

    if (pendingRequest) {
      setError(
        `${section.label} already has a pending Admin approval request.`
      );
      return;
    }

    const proposedChanges =
      getSectionChanges(
        section,
        formRef.current,
        baselineRef.current
      );

    if (
      Object.keys(proposedChanges).length === 0
    ) {
      setError(
        `There are no changes in ${section.label}.`
      );
      return;
    }

    if (
      "business_name" in proposedChanges &&
      !proposedChanges.business_name
    ) {
      setError(
        "Business name cannot be empty."
      );
      return;
    }

    if (
      "email" in proposedChanges &&
      proposedChanges.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        proposedChanges.email
      )
    ) {
      setError(
        "Enter a valid business email address."
      );
      return;
    }

    mutationLock.current = true;
    setSubmittingSection(sectionKey);

    setError("");
    setSuccess("");

    try {
      await vendorApi.submitProfileChangeRequest({
        section: sectionKey,
        proposed_changes: proposedChanges,
      });

      // Reload canonical request history.
      // The vendor's approved values must remain
      // unchanged while Admin approval is pending.

      const requestsResponse =
        await vendorApi.getProfileChangeRequests();

      setRequests(
        normalizeRequests(requestsResponse)
      );

      // Reset only the section just submitted.
      // Preserve edits in other sections.

      discardSubmittedFields(
        section,
        proposedChanges
      );

      setSuccess(
        `${section.label} changes submitted for Admin approval. Your current approved information remains unchanged.`
      );
    } catch (err) {
      // If the submission succeeded but refreshing
      // the list failed, reload the list separately
      // before attempting another submission.
      setError(
        getErrorMessage(
          err,
          `Unable to complete the ${section.label} approval request. Refresh the page to verify its status before retrying.`
        )
      );
    } finally {
      mutationLock.current = false;
      setSubmittingSection(null);
    }
  }

  function discardSubmittedFields(
    section,
    submittedChanges
  ) {
    const baseline =
      baselineRef.current;

    setForm((current) => {
      const next = { ...current };

      section.fields.forEach((field) => {
        // Preserve edits made after the request
        // was submitted, if any.
        if (
          Object.prototype.hasOwnProperty.call(
            submittedChanges,
            field
          ) &&
          cleanValue(next[field]) ===
            submittedChanges[field]
        ) {
          next[field] =
            baseline[field] ?? "";
        }
      });

      formRef.current = next;

      return next;
    });
  }

  /* ==========================================================
     BRAND UPLOAD — IMMEDIATE UPDATE
  ========================================================== */

  async function handleBrandUpload(type, file) {
    if (
      !file ||
      uploadingType ||
      mutationLock.current
    ) {
      return;
    }

    setError("");
    setSuccess("");

    if (!IMAGE_TYPES.includes(file.type)) {
      setError(
        "Only JPG, PNG and WEBP images are supported."
      );
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError(
        "The selected image must be 5 MB or smaller."
      );
      return;
    }

    mutationLock.current = true;
    setUploadingType(type);

    try {
      if (type === "logo") {
        await vendorApi.uploadBrandingLogo(file);
      } else {
        await vendorApi.uploadBrandingBanner(file);
      }

      const profileResponse =
        await vendorApi.getProfile();

      const updatedProfile =
        normalizeProfile(profileResponse);

      if (!updatedProfile) {
        throw new Error(
          "Branding uploaded, but the updated profile could not be loaded."
        );
      }

      const nextBaseline =
        mapProfileToForm(updatedProfile);

      const oldBaseline =
        baselineRef.current;

      setForm((current) => {
        const next = Object.fromEntries(
          Object.keys(EMPTY_FORM).map(
            (field) => [
              field,
              cleanValue(
                current[field]
              ) !==
              cleanValue(
                oldBaseline[field]
              )
                ? current[field]
                : nextBaseline[field],
            ]
          )
        );

        formRef.current = next;

        return next;
      });

      baselineRef.current =
        nextBaseline;

      setProfile(updatedProfile);

      if (
        typeof syncVendorProfile === "function"
      ) {
        syncVendorProfile(updatedProfile);
      }

      try {
        const brandingResponse =
          await vendorApi.getBranding();

        setBranding(
          normalizeBranding(brandingResponse)
        );
      } catch {
        // Profile already contains current logo/banner.
      }

      setSuccess(
        `${
          type === "logo" ? "Logo" : "Banner"
        } updated successfully.`
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          `Unable to update ${type}.`
        )
      );
    } finally {
      mutationLock.current = false;
      setUploadingType(null);
    }
  }

  /* ==========================================================
     SECTION UI HELPERS
  ========================================================== */

  function getSectionFooter(sectionKey) {
    const section = SECTIONS.find(
      (item) => item.key === sectionKey
    );

    const pendingRequest =
      getSectionPendingRequest(
        requests,
        sectionKey
      );

    const latestRequest =
      getLatestSectionRequest(
        requests,
        sectionKey
      );

    return (
      <SectionFooter
        section={section}
        changes={
          sectionChanges[sectionKey] || {}
        }
        pendingRequest={pendingRequest}
        latestRequest={latestRequest}
        busy={
          submittingSection !== null ||
          uploadingType !== null ||
          refreshing
        }
        onSubmit={submitSection}
        onDiscard={discardSection}
      />
    );
  }

  function getSectionRequest(sectionKey) {
    return (
      getSectionPendingRequest(
        requests,
        sectionKey
      ) ||
      getLatestSectionRequest(
        requests,
        sectionKey
      )
    );
  }

  const busy =
    submittingSection !== null ||
    uploadingType !== null ||
    refreshing;

  /* ==========================================================
     LOADING / ERROR
  ========================================================== */

  if (loading && !loaded) {
    return (
      <div className="avbp-page">
        <div className="avbp-loading">
          <LoaderCircle
            size={32}
            className="avbp-spin"
          />

          <strong>
            Loading Business Profile
          </strong>

          <p>
            Retrieving your store, branding
            and approval request details.
          </p>
        </div>
      </div>
    );
  }

  if (error && !loaded) {
    return (
      <div className="avbp-page">
        <div className="avbp-loading">
          <AlertCircle size={32} />

          <h2>
            Business Profile unavailable
          </h2>

          <p>{error}</p>

          <button
            type="button"
            className="avbp-button avbp-button-primary"
            onClick={() => loadPage(false)}
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentLogo =
    profile?.logo_url ||
    branding?.approved?.logo_url ||
    "";

  const currentBanner =
    profile?.banner_url ||
    branding?.approved?.banner_url ||
    "";

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="avbp-page">
      {/* PAGE HEADER */}

      <header className="avbp-header">
        <div>
          <span className="avbp-eyebrow">
            MERCHANT IDENTITY
          </span>

          <h1>Business Profile</h1>

          <p>
            Manage your business identity,
            branding and Admin-approved
            profile information.
          </p>
        </div>

        <button
          type="button"
          className="avbp-button avbp-button-light"
          disabled={busy}
          onClick={() => loadPage(true)}
        >
          <RefreshCw
            size={17}
            className={
              refreshing ? "avbp-spin" : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh Profile"}
        </button>
      </header>

      {/* ALERTS */}

      {error && (
        <div
          className="avbp-alert avbp-alert-error"
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
          className="avbp-alert avbp-alert-success"
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

      {/* STOREFRONT PREVIEW */}

      <section className="avbp-storefront">
        <div className="avbp-storefront-banner">
          {currentBanner ? (
            <img
              src={currentBanner}
              alt="Current store banner"
            />
          ) : (
            <div className="avbp-banner-placeholder">
              <ImageIcon size={33} />
              <span>
                YOUR STOREFRONT BANNER
              </span>
            </div>
          )}
        </div>

        <div className="avbp-storefront-body">
          <div className="avbp-storefront-logo">
            {currentLogo ? (
              <img
                src={currentLogo}
                alt={`${
                  profile?.business_name || "Store"
                } logo`}
              />
            ) : (
              <Store size={37} />
            )}
          </div>

          <div className="avbp-storefront-info">
            <div className="avbp-storefront-title">
              <div>
                <span className="avbp-eyebrow">
                  CUSTOMER-FACING STORE
                </span>

                <h2>
                  {profile?.business_name ||
                    "Your Business"}
                </h2>
              </div>

              <StatusBadge
                status={profile?.status}
              />
            </div>

            <p>
              {profile?.description ||
                "Add a business description to introduce your store to customers."}
            </p>

            <div className="avbp-storefront-meta">
              {profile?.city && (
                <span>
                  <MapPin size={15} />

                  {[
                    profile.city,
                    profile.state,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}

              {profile?.email && (
                <span>
                  <Mail size={15} />
                  {profile.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ACCOUNT OVERVIEW */}

      <section
        className="avbp-summary"
        aria-label="Business account overview"
      >
        <SummaryCard
          icon={BadgeCheck}
          label="Vendor Status"
          value={formatStatus(
            profile?.status
          )}
        />

        <SummaryCard
          icon={ShieldCheck}
          label="Account Status"
          value={
            profile?.is_active === true
              ? "Active"
              : profile?.is_active === false
                ? "Inactive"
                : "Not reported"
          }
        />

        <SummaryCard
          icon={Building2}
          label="Commission Rate"
          value={formatCommission(
            profile?.commission_rate
          )}
        />

        <SummaryCard
          icon={Store}
          label="Vendor ID"
          value={shortId(profile?.id)}
        />
      </section>

      {/* BRANDING */}

      <section className="avbp-brand-studio">
        <header className="avbp-panel-heading">
          <span className="avbp-panel-icon">
            <ImageIcon size={21} />
          </span>

          <div>
            <span className="avbp-eyebrow">
              STORE BRANDING
            </span>

            <h2>Store Branding</h2>

            <p>
              Upload your store logo and banner.
              Changes become active immediately
              without Admin approval.
            </p>
          </div>
        </header>

        <div className="avbp-branding-grid">
          <BrandingCard
            type="logo"
            title="Store Logo"
            imageUrl={currentLogo}
            uploading={
              uploadingType === "logo"
            }
            blocked={busy}
            inputRef={logoInputRef}
            onUpload={handleBrandUpload}
          />

          <BrandingCard
            type="banner"
            title="Store Banner"
            imageUrl={currentBanner}
            uploading={
              uploadingType === "banner"
            }
            blocked={busy}
            inputRef={bannerInputRef}
            onUpload={handleBrandUpload}
          />
        </div>
      </section>

      {/* APPROVAL OVERVIEW */}

      <section
        className="avbp-brand-studio"
        style={{ marginTop: 22 }}
      >
        <header className="avbp-panel-heading">
          <span className="avbp-panel-icon">
            <ShieldCheck size={21} />
          </span>

          <div>
            <span className="avbp-eyebrow">
              ADMIN REVIEW
            </span>

            <h2>Business Profile Approvals</h2>

            <p>
              Business information changes
              require Admin approval before
              becoming visible on your store.
            </p>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          {[
            {
              label: "Pending",
              count: pendingCount,
              Icon: Clock3,
              color: "#b7791f",
            },
            {
              label: "Approved",
              count: completedCount,
              Icon: CheckCircle2,
              color: "#16a34a",
            },
            {
              label: "Rejected",
              count: rejectedCount,
              Icon: XCircle,
              color: "#dc2626",
            },
          ].map(
            ({
              label,
              count,
              Icon,
              color,
            }) => (
              <article
                key={label}
                className="avbp-summary-card"
                style={{
                  minWidth: 0,
                }}
              >
                <span className="avbp-summary-icon">
                  <Icon
                    size={20}
                    color={color}
                  />
                </span>

                <div>
                  <span>{label}</span>
                  <strong>{count}</strong>
                </div>
              </article>
            )
          )}
        </div>
      </section>

      {/* BUSINESS INFORMATION */}

      <div className="avbp-settings">
        <div className="avbp-settings-heading">
          <div>
            <span className="avbp-eyebrow">
              STORE SETTINGS
            </span>

            <h2>Business Information</h2>

            <p>
              Edit each section and submit its
              changes separately for Admin
              approval.
            </p>
          </div>

          {hasChanges && (
            <span className="avbp-unsaved">
              Unsaved Changes
            </span>
          )}
        </div>

        <div className="avbp-settings-layout">
          <nav
            className="avbp-section-nav"
            aria-label="Business profile sections"
          >
            {SECTIONS.map((section) => {
              const pending =
                getSectionPendingRequest(
                  requests,
                  section.key
                );

              return (
                <a
                  key={section.key}
                  href={`#${section.id}`}
                >
                  <span>
                    {section.number}
                  </span>

                  {section.label}

                  {pending && (
                    <Clock3
                      size={13}
                      color="#b7791f"
                      style={{ marginLeft: 5 }}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          <div className="avbp-form-sections">

            {/* SECTION 01 — STORE */}

            <FormSection
              number="01"
              id="avbp-store"
              icon={Store}
              title="Store Information"
              description="Manage your business name and description. Changes require Admin approval."
              request={getSectionRequest(
                "store_information"
              )}
              footer={getSectionFooter(
                "store_information"
              )}
            >
              <ProfileField
                label="Business Name"
                required
              >
                <input
                  name="business_name"
                  type="text"
                  value={form.business_name}
                  onChange={handleChange}
                  required
                  maxLength={200}
                  disabled={busy}
                  placeholder="Enter business name"
                />
              </ProfileField>

              <ProfileField
                label="Business Description"
                wide
              >
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  disabled={busy}
                  rows={5}
                  placeholder="Describe your business and products..."
                />
              </ProfileField>
            </FormSection>

            {/* SECTION 02 — CONTACT */}

            <FormSection
              number="02"
              id="avbp-contact"
              icon={Mail}
              title="Contact Information"
              description="Business email and phone changes require Admin approval."
              request={getSectionRequest(
                "contact_information"
              )}
              footer={getSectionFooter(
                "contact_information"
              )}
            >
              <ProfileField label="Business Email">
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="business@example.com"
                />
              </ProfileField>

              <ProfileField label="Phone Number">
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="Business phone number"
                />
              </ProfileField>
            </FormSection>

            {/* SECTION 03 — ADDRESS */}

            <FormSection
              number="03"
              id="avbp-address"
              icon={MapPin}
              title="Business Address"
              description="Submit address changes for Admin verification."
              request={getSectionRequest(
                "business_address"
              )}
              footer={getSectionFooter(
                "business_address"
              )}
            >
              <ProfileField
                label="Address Line 1"
                wide
              >
                <input
                  name="address_line1"
                  value={form.address_line1}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="Street address, building or premises"
                />
              </ProfileField>

              <ProfileField
                label="Address Line 2"
                wide
              >
                <input
                  name="address_line2"
                  value={form.address_line2}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="Area, landmark or additional address"
                />
              </ProfileField>

              <ProfileField label="City">
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="City"
                />
              </ProfileField>

              <ProfileField label="State">
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="State"
                />
              </ProfileField>

              <ProfileField label="Postal Code">
                <input
                  name="postal_code"
                  value={form.postal_code}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="Postal code"
                />
              </ProfileField>

              <ProfileField label="Country">
                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="Country"
                />
              </ProfileField>
            </FormSection>

            {/* SECTION 04 — LEGAL & TAX */}

            <FormSection
              number="04"
              id="avbp-compliance"
              icon={FileText}
              title="Legal & Tax Details"
              description="Registered legal name and tax information require Admin approval."
              request={getSectionRequest(
                "legal_tax"
              )}
              footer={getSectionFooter(
                "legal_tax"
              )}
            >
              <ProfileField label="Legal Name">
                <input
                  name="legal_name"
                  type="text"
                  value={form.legal_name}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="Registered legal name"
                />
              </ProfileField>

              <ProfileField label="Tax ID">
                <input
                  name="tax_id"
                  value={form.tax_id}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="Registered tax identifier"
                />
              </ProfileField>

              <ProfileField
                label="Store Slug"
                hint="Assigned by the platform."
              >
                <input
                  value={profile?.slug || ""}
                  disabled
                  readOnly
                  aria-label="Store slug"
                />
              </ProfileField>

              <div className="avbp-readonly-note">
                <ShieldCheck size={18} />

                <p>
                  Your store slug, vendor approval
                  status and commission rate are
                  managed by the platform and
                  cannot be edited here.
                </p>
              </div>
            </FormSection>
          </div>
        </div>

        {/* UNSAVED EDITS SUMMARY */}

        <div className="avbp-save-bar">
          <div className="avbp-save-status">
            <span
              className={`avbp-save-dot ${
                hasChanges
                  ? "avbp-save-dot-pending"
                  : ""
              }`}
            />

            <div>
              <strong>
                {hasChanges
                  ? "You have unsubmitted changes"
                  : "Business information up to date"}
              </strong>

              <small>
                {hasChanges
                  ? "Submit each edited section separately for Admin approval."
                  : "New business information changes require Admin approval."}
              </small>
            </div>
          </div>

          <div className="avbp-save-actions">
            <button
              type="button"
              className="avbp-button avbp-button-light"
              disabled={!hasChanges || busy}
              onClick={discardAll}
            >
              <RotateCcw size={17} />
              Discard All Edits
            </button>
          </div>
        </div>
      </div>

      {/* APPROVAL HISTORY */}

      <RequestHistory requests={requests} />

    </div>
  );
}
