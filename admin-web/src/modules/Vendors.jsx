import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import {
  getResource,
  updateResourceStatus,
  updateVendorActiveStatus,
  getVendorDetails,
  createVendor,
  updateProductApproval,
} from '../services/adminService.js';

const statuses = ['pending', 'approved', 'rejected', 'suspended'];
const VENDOR_DETAILS_PAGE_SIZE = 10;

const emptyVendorForm = {
  business_name: '',
  email: '',
  phone: '',
  password: '',
  confirm_password: '',
  legal_name: '',
  description: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  commission_rate: 0,
};

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN');
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export default function Vendors() {
  const navigate = useNavigate();
  const { vendorId } = useParams();
  const [items, setItems] = useState([]);

  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [updatingId, setUpdatingId] = useState('');
  const [reload, setReload] = useState(0);

  /*
   * Vendor details page
   */
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  /*
   * Create vendor
   */
  const [showCreateVendor, setShowCreateVendor] = useState(false);
  const [creatingVendor, setCreatingVendor] = useState(false);
  const [createVendorError, setCreateVendorError] = useState('');
  const [createdVendorCredentials, setCreatedVendorCredentials] =
    useState(null);

  const [vendorForm, setVendorForm] = useState(emptyVendorForm);

  /*
   * Load vendor list
   */
  useEffect(() => {
    if (vendorId) {
      return undefined;
    }

    let active = true;

    const params = {
      ...(status ? { status } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    };

    Promise.resolve()
      .then(() => {
        if (!active) return undefined;
        setLoading(true);
        setError('');
        return getResource('vendors', params);
      })
      .then((result) => {
        if (!active) return;

        setItems(result?.items || []);
      })
      .catch((requestError) => {
        if (!active) return;

        setError(
          requestError.message || 'Unable to load vendors.'
        );
      })
      .finally(() => {
        if (!active) return;

        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status, search, reload, vendorId]);

  /*
   * Open vendor details page
   */
  function openVendorDetails(item) {
    setSelectedVendor(item);
    navigate(`/admin/vendors/${encodeURIComponent(item.id)}`);
  }

  useEffect(() => {
    if (!vendorId) {
      return undefined;
    }

    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return undefined;
        setDetailsLoading(true);
        setDetailsError('');
        setVendorDetails(null);
        return getVendorDetails(vendorId);
      })
      .then((result) => {
        if (!active) return;
        setVendorDetails(result?.data ?? result);
      })
      .catch((requestError) => {
        if (!active) return;
        setDetailsError(
          requestError.message ||
            'Unable to load vendor details.'
        );
      })
      .finally(() => {
        if (active) setDetailsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [vendorId, reload]);

  /*
   * Back to vendor list
   */
  function closeVendorDetails() {
    setSelectedVendor(null);
    setVendorDetails(null);
    setDetailsError('');
    navigate('/admin/vendors');
  }

  /*
   * Update approval status
   */
  async function changeStatus(item, value) {
    if (updatingId) return;

    setUpdatingId(item.id);
    setError('');

    try {
      await updateResourceStatus(
        'vendors',
        item.id,
        value
      );

      setReload((current) => current + 1);
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to update vendor status.'
      );
    } finally {
      setUpdatingId('');
    }
  }

  /*
   * Activate / deactivate vendor
   */
  async function changeActiveStatus(item, isActive) {
    if (updatingId) return;

    setUpdatingId(item.id);
    setError('');

    try {
      await updateVendorActiveStatus(
        item.id,
        isActive
      );

      setReload((current) => current + 1);
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to update vendor account.'
      );
    } finally {
      setUpdatingId('');
    }
  }

  function handleAccountAction(item, action) {
    if (action === 'activate') {
      return changeActiveStatus(item, true);
    }

    if (action === 'deactivate') {
      return changeActiveStatus(item, false);
    }

    if (action === 'suspend') {
      return changeStatus(item, 'suspended');
    }
  }

  /*
   * Create vendor
   */
  async function handleCreateVendor(event) {
    event.preventDefault();

    if (creatingVendor) return;

    if (
      vendorForm.password !==
      vendorForm.confirm_password
    ) {
      setCreateVendorError(
        'Password and confirm password do not match.'
      );

      return;
    }

    setCreatingVendor(true);
    setCreateVendorError('');
    setCreatedVendorCredentials(null);

    try {
      const payload = {
        business_name:
          vendorForm.business_name.trim(),

        email:
          vendorForm.email.trim(),

        phone:
          vendorForm.phone.trim(),

        password:
          vendorForm.password,

        legal_name:
          vendorForm.legal_name.trim() ||
          undefined,

        description:
          vendorForm.description.trim() ||
          undefined,

        address_line1:
          vendorForm.address_line1.trim() ||
          undefined,

        address_line2:
          vendorForm.address_line2.trim() ||
          undefined,

        city:
          vendorForm.city.trim() ||
          undefined,

        state:
          vendorForm.state.trim() ||
          undefined,

        postal_code:
          vendorForm.postal_code.trim() ||
          undefined,

        country:
          vendorForm.country.trim() ||
          'India',

        commission_rate:
          Number(vendorForm.commission_rate) || 0,
      };

      const result =
        await createVendor(payload);

      const data =
        result?.data ??
        result;

      setCreatedVendorCredentials({
        email:
          data?.credentials?.email ||
          payload.email,

        password:
          data?.credentials
            ?.temporary_password ||
          '',
      });

      setReload((current) => current + 1);
    } catch (requestError) {
      setCreateVendorError(
        requestError.message ||
          'Unable to create vendor account.'
      );
    } finally {
      setCreatingVendor(false);
    }
  }

  function resetCreateVendor() {
    setShowCreateVendor(false);
    setCreatedVendorCredentials(null);
    setCreateVendorError('');
    setVendorForm(emptyVendorForm);
  }

  /*
   * Vendor Details is now a page,
   * NOT a popup.
   */
  if (vendorId) {
    return (
      <VendorDetailsPage
        key={vendorId}
        selectedVendor={
          selectedVendor?.id === vendorId
            ? selectedVendor
            : null
        }
        vendorDetails={vendorDetails}
        loading={detailsLoading}
        error={detailsError}
        onBack={closeVendorDetails}
        onRefresh={() => setReload((current) => current + 1)}
      />
    );
  }

  /*
   * Vendor list
   */
  return (
    <section className="module-page vendors-page">
      {/* Hero Banner */}
      <div className="vendor-hero-card">
        <div className="vendor-hero-content">
          <span className="vendor-hero-tag">AUMVEDA APOTHECARY PARTNERS</span>
          <h2>Vendors &amp; Herbal Suppliers</h2>
        </div>

        <div className="vendor-hero-badge">
          <span className="vendor-pulse-dot" />
          <span>{items.length} Suppliers</span>
        </div>
      </div>

      {/* Main Filter & Search Toolbar */}
      <div className="vendor-toolbar">
        <div className="vendor-search-wrap">
          <Search size={18} className="vendor-search-icon" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search business name or email..."
            aria-label="Search vendors"
          />
        </div>

        <div className="vendor-actions-group">
          <button
            type="button"
            className="primary-button"
            onClick={() => setReload((current) => current + 1)}
            disabled={loading}
          >
            Refresh
          </button>

          <button
            type="button"
            className="vendor-create-button"
            onClick={() => {
              setCreateVendorError('');
              setCreatedVendorCredentials(null);
              setShowCreateVendor(true);
            }}
          >
            <Plus size={16} />
            <span>Create Vendor</span>
          </button>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter vendors by approval status"
            className="vendor-status-select"
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="vendor-table-card">
        {error && (
          <div className="error-state" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">Loading vendors…</div>
        ) : items.length === 0 ? (
          <div className="empty-state">No vendors found.</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table vendor-list-table">
              <thead>
                <tr>
                  <th className="th-business">BUSINESS</th>
                  <th className="th-contact">CONTACT</th>
                  <th className="th-location">LOCATION</th>
                  <th className="th-commission">COMMISSION</th>
                  <th className="th-joined">JOINED</th>
                  <th className="th-account-actions">ACCOUNT ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="vendor-row-clickable"
                    onClick={() => openVendorDetails(item)}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openVendorDetails(item);
                      }
                    }}
                  >
                    <td className="td-business">
                      <div className="vendor-profile">
                        {item.logo_url ? (
                          <img
                            src={item.logo_url}
                            alt=""
                            className="vendor-logo"
                            loading="lazy"
                          />
                        ) : (
                          <div className="vendor-logo vendor-logo-fallback">
                            {(item.business_name || 'V')
                              .trim()
                              .charAt(0)
                              .toLowerCase()}
                          </div>
                        )}

                        <div className="vendor-profile-text">
                          <strong className="vendor-name">
                            {item.business_name || 'Unnamed vendor'}
                          </strong>
                          <div className="vendor-subtitle">
                            {item.slug || item.legal_name || '—'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="td-contact">
                      <div className="vendor-contact-email">
                        {item.email || '—'}
                      </div>
                      <div className="vendor-subtitle">
                        {item.phone || 'No phone'}
                      </div>
                    </td>

                    <td className="td-location">
                      {[item.city, item.state].filter(Boolean).join(', ') || '—'}
                    </td>

                    <td className="td-commission">
                      <strong>{item.commission_rate ?? 0}%</strong>
                    </td>

                    <td className="td-joined">
                      {formatDate(item.created_at)}
                    </td>

                    <td
                      className="td-account-actions"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <select
                        className="vendor-account-actions-select"
                        value=""
                        disabled={updatingId === item.id}
                        onChange={(event) =>
                          handleAccountAction(item, event.target.value)
                        }
                        aria-label={`Account actions for ${item.business_name || 'vendor'}`}
                      >
                        <option value="" disabled>
                          Choose action
                        </option>
                        <option value="activate">Activate</option>
                        <option value="deactivate">Deactivate</option>
                        <option value="suspend">Suspend</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateVendor && (
        <CreateVendorModal
          form={vendorForm}
          setForm={setVendorForm}
          loading={creatingVendor}
          error={createVendorError}
          credentials={
            createdVendorCredentials
          }
          onSubmit={handleCreateVendor}
          onClose={resetCreateVendor}
        />
      )}

      <VendorStyles />

    </section>
  );
}


/* ============================================================
   VENDOR DETAILS PAGE
============================================================ */

function VendorDetailsPage({
  selectedVendor,
  vendorDetails,
  loading,
  error,
  onBack,
  onRefresh,
}) {
  const [productPage, setProductPage] = useState(0);
  const [orderPage, setOrderPage] = useState(0);
  const [notificationPage, setNotificationPage] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedProductId = searchParams.get('productId') || '';
  const requestedApprovalStatus = searchParams.get('approvalStatus') || 'all';
  const [productStatus, setProductStatus] = useState(requestedApprovalStatus);
  const [productApprovalLoading, setProductApprovalLoading] = useState(false);
  const [productApprovalError, setProductApprovalError] = useState('');

  const details = vendorDetails || {};

  const vendor =
    details.vendor ||
    (vendorDetails ? details : selectedVendor) ||
    {};

  const teamMembers =
    Array.isArray(details.team_members)
      ? details.team_members
      : Array.isArray(details.team)
        ? details.team
        : [];

  const stats = details.stats || {};

  const orders =
    Array.isArray(details.orders)
      ? details.orders
      : [];

  const orderItems = Array.isArray(details.order_items)
    ? details.order_items
    : [];

  /* ============================================================
     PRODUCT STATUS FILTER

     The existing products API currently returns `status: "active"`
     for approved/live products. Vendor approval is displayed in the
     UI as Approved, Pending, or Rejected without changing the
     existing product `status` field. If the API later returns a
     dedicated approval field, that field takes precedence.
  ============================================================ */

  const products = Array.isArray(details.products)
    ? details.products
    : [];

  const getProductApprovalStatus = (product) => {
    const status = String(product?.status ?? "")
      .trim()
      .toLowerCase();

    if (status === "draft" || status === "pending") {
      return status;
    }

    const dedicatedStatus =
      product?.approval_status ??
      product?.approvalStatus ??
      product?.product_approval_status ??
      product?.productApprovalStatus;

    if (dedicatedStatus != null && String(dedicatedStatus).trim()) {
      return String(dedicatedStatus).trim().toLowerCase();
    }

    // Existing backend uses `active` for live/approved products.
    if (status === "active") return "approved";

    if (status === "rejected") return "rejected";

    return status;
  };

  const submittedProducts = products.filter((product) =>
    ["pending", "approved", "rejected"].includes(
      getProductApprovalStatus(product)
    )
  );
  const pendingProductsCount = submittedProducts.filter(
    (product) => getProductApprovalStatus(product) === "pending"
  ).length;

  const filteredProducts =
    productStatus === "all"
      ? submittedProducts
      : submittedProducts.filter(
          (product) =>
            getProductApprovalStatus(product) === productStatus
        );

  const visibleProducts = filteredProducts.slice(
    productPage * VENDOR_DETAILS_PAGE_SIZE,
    (productPage + 1) * VENDOR_DETAILS_PAGE_SIZE
  );

  const visibleOrderItems = orderItems.slice(
    orderPage * VENDOR_DETAILS_PAGE_SIZE,
    (orderPage + 1) * VENDOR_DETAILS_PAGE_SIZE
  );

  const ordersById = new Map(
    orders.map((order) => [
      String(order.id),
      order,
    ])
  );

  const productsById = new Map(
    products.map((product) => [
      String(product.id),
      product,
    ])
  );

  const selectedProduct = products.find(
    (product) => String(product.id) === String(requestedProductId)
  ) || null;

  function openProduct(product) {
    if (!product?.id) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('productId', String(product.id));
    setSearchParams(nextParams);
    setProductApprovalError('');
  }

  function closeProductDetails() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('productId');
    setSearchParams(nextParams);
    setProductApprovalError('');
  }

  async function handleProductApproval(product, approvalStatus) {
    if (!product?.id || productApprovalLoading) return;

    setProductApprovalLoading(true);
    setProductApprovalError('');

    try {
      await updateProductApproval(product.id, approvalStatus);
      onRefresh();
    } catch (requestError) {
      setProductApprovalError(
        requestError.message ||
          `Unable to ${approvalStatus === 'approved' ? 'approve' : 'reject'} product.`
      );
    } finally {
      setProductApprovalLoading(false);
    }
  }

  return (
    <section className="module-page vendor-details-page">

      {/* ==================================================
          TOP BAR
      ================================================== */}

      <div className="vendor-details-topbar">

        <button
          type="button"
          className="vendor-back-button"
          onClick={onBack}
        >
          ← Back to Vendors
        </button>

        <button
          type="button"
          className="primary-button"
          onClick={onRefresh}
          disabled={loading}
        >
          Refresh
        </button>

      </div>


      {/* ==================================================
          VENDOR HEADER
      ================================================== */}

      <div className="vendor-details-hero">

        <div className="vendor-details-identity">

          {vendor.logo_url ? (
            <img
              src={vendor.logo_url}
              alt=""
              className="vendor-details-logo"
            />
          ) : (
            <div className="vendor-details-logo vendor-details-logo-fallback">
              {(vendor.business_name || "V")
                .trim()
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div>

            <div className="vendor-details-eyebrow">
              VENDOR PROFILE
            </div>

            <h1>
              {vendor.business_name ||
                "Unnamed Vendor"}
            </h1>

            <p>
              {vendor.legal_name ||
                "Business profile and operational overview"}
            </p>

          </div>

        </div>


        <div className="vendor-details-statuses">

          <span
            className={`vendor-status-pill status-${
              vendor.status || "pending"
            }`}
          >
            {vendor.status || "pending"}
          </span>

          <span
            className={`vendor-status-pill ${
              vendor.is_active
                ? "status-active"
                : "status-inactive"
            }`}
          >
            {vendor.is_active
              ? "Active"
              : "Inactive"}
          </span>

        </div>

      </div>


      {/* ==================================================
          LOADING / ERROR / CONTENT
      ================================================== */}

      {loading ? (

        <div className="loading-state vendor-details-loading">
          Loading vendor details…
        </div>

      ) : error ? (

        <div
          className="error-state vendor-details-loading"
          role="alert"
        >
          {error}
        </div>

      ) : (

        <>

          {/* ==================================================
              SUMMARY CARDS
          ================================================== */}

          <div className="vendor-stat-grid">

            <VendorStatCard
              href="#vendor-products"
              label="Total Products"
              value={submittedProducts.length}
              hint="Products submitted by this vendor"
            />

            <VendorStatCard
              href="#vendor-products"
              label="Pending Approval"
              value={pendingProductsCount}
              hint="Products awaiting Admin review"
            />

            <VendorStatCard
              href="#vendor-team"
              label="Team Members"
              value={teamMembers.length}
              hint="Owner and business team"
            />

            <VendorStatCard
              href="#vendor-orders"
              label="Total Orders"
              value={
                stats.total_orders ??
                orders.length
              }
              hint="Orders containing vendor products"
            />

          </div>


          {/* ==================================================
              BUSINESS + EARNINGS
          ================================================== */}

          <div className="vendor-details-layout">

            <section className="vendor-info-card">

              <SectionHeading
                title="Business Information"
                description="Vendor account and business profile details."
              />

              <div className="vendor-info-grid">

                <InfoField
                  label="Business Name"
                  value={vendor.business_name}
                />

                <InfoField
                  label="Legal Name"
                  value={vendor.legal_name}
                />

                <InfoField
                  label="Email"
                  value={vendor.email}
                />

                <InfoField
                  label="Phone"
                  value={vendor.phone}
                />

                <InfoField
                  label="Address"
                  value={[
                    vendor.address_line1,
                    vendor.address_line2,
                    vendor.city,
                    vendor.state,
                    vendor.postal_code,
                    vendor.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                />

                <InfoField
                  label="Commission Rate"
                  value={`${vendor.commission_rate ?? 0}%`}
                />

                <InfoField
                  label="Joined"
                  value={formatDate(
                    vendor.created_at
                  )}
                />

                <InfoField
                  label="Vendor ID"
                  value={vendor.id}
                />

              </div>

              {vendor.description && (

                <div className="vendor-description-block">

                  <span>
                    Description
                  </span>

                  <p>
                    {vendor.description}
                  </p>

                </div>

              )}

            </section>


            <section className="vendor-info-card">

              <SectionHeading
                title="Earnings"
                description="Current calculated earnings summary."
              />

              <div className="vendor-earnings-list">

                <SummaryRow
                  label="Vendor net earnings"
                  value={formatCurrency(
                    stats.vendor_net_earnings ??
                      stats.total_earnings ??
                      0
                  )}
                />

                <SummaryRow
                  label="Total sales"
                  value={formatCurrency(
                    stats.total_sales ?? 0
                  )}
                />

                <SummaryRow
                  label="Pending business requests"
                  value={
                    stats.pending_requests ?? 0
                  }
                />

              </div>

            </section>

          </div>


          {/* ==================================================
              PRODUCTS
          ================================================== */}

          <DetailTableCard
            id="vendor-products"
            title="Products"
            description="Products this vendor has submitted for Admin review."
            count={filteredProducts.length}
            empty="No products submitted for approval."
            footer={
              filteredProducts.length > 0 ? (
                <VendorDetailPagination
                  page={productPage}
                  pageSize={VENDOR_DETAILS_PAGE_SIZE}
                  total={filteredProducts.length}
                  label="products"
                  onPageChange={setProductPage}
                />
              ) : null
            }
          >

            {/* ==================================================
                PRODUCT STATUS CHIPS
            ================================================== */}

            <div className="vendor-product-status-chips">

  <button
    type="button"
    className={`vendor-product-status-chip ${
      productStatus === "approved" ? "active" : ""
    }`}
    onClick={() => {
      setProductStatus("approved");
      setProductPage(0);
    }}
  >
    Approved
  </button>

  <button
    type="button"
    className={`vendor-product-status-chip ${
      productStatus === "pending" ? "active" : ""
    }`}
    onClick={() => {
      setProductStatus("pending");
      setProductPage(0);
    }}
  >
    Pending
  </button>

  <button
    type="button"
    className={`vendor-product-status-chip ${
      productStatus === "rejected" ? "active" : ""
    }`}
    onClick={() => {
      setProductStatus("rejected");
      setProductPage(0);
    }}
  >
    Rejected
  </button>

</div>


            {/* ==================================================
                FILTERED PRODUCTS
            ================================================== */}

            {filteredProducts.length > 0 ? (

              <table className="data-table vendor-detail-table">

                <thead>

                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Variants</th>
                    <th>Stock</th>
                    <th>Created</th>
                  </tr>

                </thead>

                <tbody>

                  {visibleProducts.map((product) => {

                    const images = Array.isArray(
                      product.images
                    )
                      ? product.images
                      : [];

                    const productImage =
                      images.find(
                        (image) =>
                          image.is_primary &&
                          image.image_url
                      ) ||
                      images.find(
                        (image) =>
                          image.image_url
                      );

                    const productStatusValue =
                      getProductApprovalStatus(product) ||
                      "—";

                    return (

                      <tr
                        key={product.id}
                        className={`vendor-product-row-clickable ${
                          String(requestedProductId) === String(product.id)
                            ? 'is-selected'
                            : ''
                        }`}
                        onClick={() => openProduct(product)}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openProduct(product);
                          }
                        }}
                      >

                        {/* Product */}

                        <td>

                          <div className="vendor-product-info">

                            {productImage ? (

                              <img
                                src={
                                  productImage.image_url
                                }
                                alt=""
                                className="vendor-product-image"
                                loading="lazy"
                              />

                            ) : (

                              <div
                                className="vendor-product-image vendor-product-image-fallback"
                                aria-hidden="true"
                              >
                                —
                              </div>

                            )}

                            <div>

                              <strong>
                                {product.name ||
                                  "Unnamed Product"}
                              </strong>

                              <div className="vendor-subtitle">
                                {product.slug ||
                                  product.id ||
                                  "—"}
                              </div>

                            </div>

                          </div>

                        </td>


                        {/* Price */}

                        <td>
                          {product.price == null
                            ? "—"
                            : formatCurrency(
                                product.price
                              )}
                        </td>


                        {/* Status */}

                        <td>

                          <span
                            className={`vendor-product-status-text status-${String(
                              productStatusValue
                            ).toLowerCase()}`}
                          >
                            {productStatusValue}
                          </span>

                        </td>


                        {/* Variants */}

                        <td>
                          {product.variant_count ??
                            product.variants?.length ??
                            0}
                        </td>


                        {/* Stock */}

                        <td>
                          {product.total_stock ?? 0}
                        </td>


                        {/* Created */}

                        <td>
                          {formatDate(
                            product.created_at
                          )}
                        </td>

                      </tr>

                    );
                  })}

                </tbody>

              </table>

            ) : (

              <div className="vendor-product-filter-empty">
                No {productStatus} products found for this vendor.
              </div>

            )}

          </DetailTableCard>


          {/* ==================================================
              SELECTED PRODUCT DETAILS

              A notification can open this vendor page with
              ?productId=<product-id>. The exact pending product
              is selected here and can be approved or rejected.
          ================================================== */}

          {selectedProduct && (
            <SelectedProductDetails
              product={selectedProduct}
              approvalStatus={getProductApprovalStatus(selectedProduct)}
              loading={productApprovalLoading}
              error={productApprovalError}
              onClose={closeProductDetails}
              onApprove={() =>
                handleProductApproval(selectedProduct, 'approved')
              }
              onReject={() =>
                handleProductApproval(selectedProduct, 'rejected')
              }
            />
          )}


          {/* ==================================================
              TEAM MEMBERS
          ================================================== */}

          <DetailTableCard
            id="vendor-team"
            title="Team Members"
            description="People linked to this vendor business."
            count={teamMembers.length}
            empty="No team members found."
          >

            {teamMembers.length > 0 && (

              <table className="data-table vendor-detail-table">

                <thead>

                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Permission Mode</th>
                    <th>Joined</th>
                  </tr>

                </thead>

                <tbody>

                  {teamMembers.map(
                    (member) => (

                      <tr
                        key={
                          member.user_id ||
                          member.id
                        }
                      >

                        <td>

                          <strong>
                            {member.full_name ||
                              member.profile?.full_name ||
                              member.name ||
                              "Team Member"}
                          </strong>

                          <div className="vendor-subtitle">
                            {member.email ||
                              member.profile?.email ||
                              member.profile?.phone ||
                              member.user_id ||
                              "—"}
                          </div>

                        </td>

                        <td>
                          {member.member_role ||
                            member.role ||
                            member.profile?.role ||
                            "—"}
                        </td>

                        <td>
                          {member.is_active === false
                            ? "Inactive"
                            : "Active"}
                        </td>

                        <td>
                          {member.permission_mode ||
                            "—"}
                        </td>

                        <td>
                          {formatDate(
                            member.created_at ||
                              member.profile?.created_at
                          )}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

          </DetailTableCard>


          {/* ==================================================
              ORDERS
          ================================================== */}

          <DetailTableCard
            id="vendor-orders"
            title="Orders"
            description="Products in orders containing items from this vendor."
            count={orders.length}
            empty="No orders found for this vendor."
            footer={
              <VendorDetailPagination
                page={orderPage}
                pageSize={VENDOR_DETAILS_PAGE_SIZE}
                total={orderItems.length}
                label="order items"
                onPageChange={setOrderPage}
              />
            }
          >

            {orderItems.length > 0 && (

              <table className="data-table vendor-detail-table">

                <thead>

                  <tr>
                    <th>Product</th>
                    <th>Order ID</th>
                    <th>Variant</th>
                    <th>No. of items</th>
                    <th>Price</th>
                    <th>Delivery status</th>
                    <th>Payment status</th>
                  </tr>

                </thead>

                <tbody>

                  {visibleOrderItems.map(
                    (item, index) => {

                      const order =
                        ordersById.get(
                          String(
                            item.order_id
                          )
                        ) || {};

                      const product =
                        productsById.get(
                          String(
                            item.product_id
                          )
                        ) || {};

                      const productName =
                        item.product_name ||
                        product.name ||
                        "Unnamed Product";

                      const variantName =
                        item.variant_name ||
                        item.variant?.name ||
                        "—";

                      return (

                        <tr
                          key={
                            item.id ||
                            `${item.order_id}-${item.product_id}-${orderPage * VENDOR_DETAILS_PAGE_SIZE + index}`
                          }
                        >

                          <td>
                            <strong>
                              {productName}
                            </strong>
                          </td>

                          <td>
                            {order.order_number ||
                              order.id ||
                              item.order_id ||
                              "—"}
                          </td>

                          <td>
                            {variantName}
                          </td>

                          <td>
                            {Number(
                              item.quantity || 0
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              item.unit_price ??
                                item.total_price
                            )}
                          </td>

                          <td>
                            {item.status ||
                              order.delivery_status ||
                              order.status ||
                              "—"}
                          </td>

                          <td>
                            {order.payment_status ||
                              "—"}
                          </td>

                        </tr>

                      );
                    }
                  )}

                </tbody>

              </table>

            )}

          </DetailTableCard>


          {/* ==================================================
              REQUESTS & ACTIVITY
          ================================================== */}

          <VendorActivitySection
            id="vendor-notifications"
            activities={
              details.requests_activity ??
              vendor.requests_activity
            }
            page={notificationPage}
            pageSize={VENDOR_DETAILS_PAGE_SIZE}
            onPageChange={setNotificationPage}
          />

        </>

      )}

      <VendorStyles />

    </section>
  );
}



function SelectedProductDetails({
  product,
  approvalStatus,
  loading,
  error,
  onClose,
  onApprove,
  onReject,
}) {
  const images = Array.isArray(product?.images)
    ? product.images
    : [];

  const primaryImage =
    images.find(
      (image) => image?.is_primary && image?.image_url
    ) ||
    images.find((image) => image?.image_url) ||
    null;

  const variants = Array.isArray(product?.variants)
    ? product.variants
    : [];

  const categories = Array.isArray(product?.categories)
    ? product.categories
    : [];

  return (
    <div
      className="vendor-product-modal-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        id="vendor-selected-product"
        className="vendor-product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-selected-product-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
      >
        <div className="vendor-section-heading vendor-selected-product-heading">
          <div>
            <div className="vendor-details-eyebrow">SELECTED PRODUCT</div>
            <h2 id="vendor-selected-product-title">
              {product?.name || 'Unnamed Product'}
            </h2>
            <p>
              Review the complete product information and approval state before taking action.
            </p>
          </div>

          <div className="vendor-product-modal-heading-actions">
            <span
              className={`vendor-product-status-text status-${String(
                approvalStatus || 'neutral'
              ).toLowerCase()}`}
            >
              {approvalStatus || 'Info'}
            </span>
            <button
              type="button"
              className="vendor-product-modal-close"
              onClick={onClose}
              aria-label="Close product details"
              autoFocus
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {error && (
          <div className="error-state vendor-product-approval-error" role="alert">
            {error}
          </div>
        )}

      <div className="vendor-selected-product-layout">
        <div className="vendor-selected-product-media">
          {primaryImage ? (
            <img
              src={primaryImage.image_url}
              alt={product?.name || 'Product'}
              className="vendor-selected-product-image"
            />
          ) : (
            <div className="vendor-selected-product-image vendor-selected-product-image-fallback">
              No image
            </div>
          )}

          {images.length > 1 && (
            <div className="vendor-selected-product-thumbs">
              {images.slice(0, 5).map((image, index) => (
                <img
                  key={image?.id || image?.image_url || index}
                  src={image?.image_url}
                  alt=""
                  loading="lazy"
                />
              ))}
            </div>
          )}
        </div>

        <div className="vendor-selected-product-fields">
          <InfoField label="Product Name" value={product?.name} />
          <InfoField label="SKU" value={product?.sku} />
          <InfoField label="Slug" value={product?.slug} />
          <InfoField
            label="Price"
            value={
              product?.price == null
                ? null
                : formatCurrency(product.price)
            }
          />
          <InfoField
            label="Compare at Price"
            value={
              product?.compare_at_price == null
                ? null
                : formatCurrency(product.compare_at_price)
            }
          />
          <InfoField label="Category" value={product?.category_name || product?.category?.name} />
          <InfoField label="Operational Status" value={product?.status} />
          <InfoField label="Approval Status" value={approvalStatus} />
          <InfoField label="Stock" value={product?.total_stock ?? product?.stock_quantity} />
          <InfoField label="Created" value={formatDate(product?.created_at)} />
          <InfoField label="Product ID" value={product?.id} />
        </div>
      </div>

      {product?.description && (
        <div className="vendor-selected-product-description">
          <span>Description</span>
          <p>{product.description}</p>
        </div>
      )}

      {categories.length > 0 && (
        <div className="vendor-selected-product-meta">
          <span>Categories</span>
          <div>
            {categories.map((category, index) => (
              <span key={category?.id || category?.name || index}>
                {category?.name || category?.title || String(category)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="vendor-selected-product-section">
        <div className="vendor-selected-product-section-heading">
          <div>
            <h3>Variants</h3>
            <p>{variants.length} variant{variants.length === 1 ? '' : 's'}</p>
          </div>
        </div>

        {variants.length > 0 ? (
          <div className="table-scroll">
            <table className="data-table vendor-detail-table">
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, index) => (
                  <tr key={variant?.id || variant?.sku || index}>
                    <td>{variant?.name || variant?.title || '—'}</td>
                    <td>{variant?.sku || '—'}</td>
                    <td>
                      {variant?.price == null
                        ? '—'
                        : formatCurrency(variant.price)}
                    </td>
                    <td>{variant?.stock_quantity ?? variant?.stock ?? 0}</td>
                    <td>{variant?.status || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="vendor-empty-section">No variants found for this product.</div>
        )}
      </div>

      {approvalStatus === 'pending' && (
        <div className="vendor-product-approval-actions">
          <div>
            <strong>Pending Approval</strong>
            <p>This product was submitted by the vendor and is waiting for admin approval.</p>
          </div>

          <div className="vendor-product-approval-buttons">
            <button
              type="button"
              className="vendor-product-reject-button"
              onClick={onReject}
              disabled={loading}
            >
              {loading ? 'Updating…' : 'Reject Product'}
            </button>
            <button
              type="button"
              className="vendor-product-approve-button"
              onClick={onApprove}
              disabled={loading}
            >
              {loading ? 'Updating…' : 'Approve Product'}
            </button>
          </div>
        </div>
      )}
      </section>
    </div>
  );
}

function VendorActivitySection({
  id,
  activities,
  page,
  pageSize,
  onPageChange,
}) {
  const entries = Array.isArray(activities)
    ? activities
    : [];
  const visibleEntries = entries.slice(
    page * pageSize,
    (page + 1) * pageSize
  );

  return (
    <section
      id={id}
      className="vendor-info-card"
      tabIndex={-1}
    >
      <SectionHeading
        title="Vendor Notifications & Activity"
        description="Product submissions, business profile changes, and branding requests from this vendor."
      />

      {entries.length === 0 ? (
        <div className="vendor-empty-section">
          No vendor requests or activity found.
        </div>
      ) : (
        <div className="vendor-activity-list">
          {visibleEntries.map((activity, index) => {
            const statusValue = String(
              activity.status || ''
            ).toLowerCase();

            const isRequest =
              activity.source ===
                'vendor_profile_change_requests' ||
              activity.source ===
                'vendor_branding_requests';
            const requestFields = Object.entries(
              activity.request || {}
            ).filter(
              ([key]) =>
                ![
                  'id',
                  'vendor_id',
                  'user_id',
                  'created_at',
                  'updated_at',
                  'status',
                ].includes(key)
            );

            return (
              <div
                key={`${activity.source || 'activity'}-${
                  activity.id || page * pageSize + index
                }`}
                className="vendor-activity-item"
              >
                <div className="vendor-activity-main">
                  <div className="vendor-activity-title-row">
                    <strong>{activity.title || 'Vendor activity'}</strong>
                    <span
                      className={`vendor-activity-type ${
                        isRequest
                          ? 'is-request'
                          : 'is-activity'
                      }`}
                    >
                      {isRequest ? 'Request' : 'Activity'}
                    </span>
                  </div>

                  <p>
                    {activity.description || '—'}
                  </p>

                  <small>
                    {formatDate(activity.created_at)}
                  </small>

                  {isRequest && requestFields.length > 0 && (
                    <details className="vendor-request-details">
                      <summary>View request details</summary>
                      <dl>
                        {requestFields.map(([key, value]) => (
                          <div key={key}>
                            <dt>
                              {key
                                .replace(/_/g, ' ')
                                .replace(/\b\w/g, (letter) =>
                                  letter.toUpperCase()
                                )}
                            </dt>
                            <dd>
                              {value == null
                                ? '—'
                                : typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  )}
                </div>

                <div className="vendor-activity-status">
                  <span
                    className={`vendor-activity-status-pill status-${
                      statusValue || 'neutral'
                    }`}
                  >
                    {activity.status || 'Info'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <VendorDetailPagination
        page={page}
        pageSize={pageSize}
        total={entries.length}
        label="notifications"
        onPageChange={onPageChange}
      />
    </section>
  );
}


/* ============================================================
   SMALL COMPONENTS
============================================================ */

function VendorStatCard({
  href,
  label,
  value,
  hint,
}) {
  return (
    <a
      href={href}
      className="vendor-stat-card vendor-stat-link"
    >

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {hint}
      </small>

    </a>
  );
}

function SectionHeading({
  title,
  description,
}) {
  return (
    <div className="vendor-section-heading">

      <div>

        <h2>
          {title}
        </h2>

        <p>
          {description}
        </p>

      </div>

    </div>
  );
}

function InfoField({
  label,
  value,
}) {
  return (
    <div className="vendor-info-field">

      <span>
        {label}
      </span>

      <strong>
        {value || '—'}
      </strong>

    </div>
  );
}

function SummaryRow({
  label,
  value,
}) {
  return (
    <div>

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

function VendorDetailPagination({
  page,
  pageSize,
  total,
  label,
  onPageChange,
}) {
  const pageCount = Math.ceil(total / pageSize);

  if (pageCount <= 1) return null;

  const firstItem = page * pageSize + 1;
  const lastItem = Math.min((page + 1) * pageSize, total);

  return (
    <nav
      className="vendor-detail-pagination"
      aria-label={`${label} pagination`}
    >
      <span>
        Showing {firstItem}–{lastItem} of {total} {label}
      </span>

      <div>
        <button
          type="button"
          onClick={() => onPageChange((current) => current - 1)}
          disabled={page === 0}
          aria-label={`Previous ${label} page`}
        >
          Previous
        </button>

        <span className="vendor-detail-pagination-page">
          Page {page + 1} of {pageCount}
        </span>

        <button
          type="button"
          onClick={() => onPageChange((current) => current + 1)}
          disabled={page >= pageCount - 1}
          aria-label={`Next ${label} page`}
        >
          Next
        </button>
      </div>
    </nav>
  );
}

function DetailTableCard({
  id,
  title,
  description,
  count,
  empty,
  children,
  footer,
}) {
  return (
    <section
      id={id}
      className="vendor-info-card"
      tabIndex={-1}
    >

      <div className="vendor-section-heading">

        <div>

          <h2>
            {title}
          </h2>

          <p>
            {description}
          </p>

        </div>

        <span className="vendor-section-count">
          {count}
        </span>

      </div>

      {count === 0 && !children ? (

        <div className="vendor-empty-section">
          {empty}
        </div>

      ) : (

        <div className="table-scroll">
          {children}
        </div>

      )}

      {footer}

    </section>
  );
}


/* ============================================================
   CREATE VENDOR MODAL
   This remains a popup because it is for creating a vendor.
============================================================ */

function CreateVendorModal({
  form,
  setForm,
  loading,
  error,
  credentials,
  onSubmit,
  onClose,
}) {
  const update = (
    key,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <div
      className="vendor-modal-overlay"
      onClick={() =>
        !loading && onClose()
      }
    >

      <section
        className="vendor-create-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <div className="vendor-modal-header">

          <div>

            <h3>
              {credentials
                ? 'Vendor Account Created'
                : 'Create Vendor Account'}
            </h3>

            <p>
              {credentials
                ? 'Share the generated credentials securely with the vendor.'
                : 'Create the vendor account and generate login credentials.'}
            </p>

          </div>

          <button
            type="button"
            className="vendor-modal-close"
            onClick={() =>
              !loading && onClose()
            }
          >
            ×
          </button>

        </div>


        {credentials ? (

          <div className="vendor-credentials-success">

            <div className="vendor-success-icon">
              ✓
            </div>

            <h4>
              Vendor Account Created
            </h4>

            <div className="vendor-credential-row">

              <span>
                Email
              </span>

              <strong>
                {credentials.email}
              </strong>

            </div>

            <div className="vendor-credential-row">

              <span>
                Temporary Password
              </span>

              <strong>
                {credentials.password ||
                  'Not returned by API'}
              </strong>

            </div>

            <div className="vendor-credential-warning">
              Save these credentials before closing this window.
              The temporary password should be shared securely.
            </div>

            <div className="vendor-modal-footer">

              <button
                type="button"
                className="vendor-create-submit"
                onClick={onClose}
              >
                Done
              </button>

            </div>

          </div>

        ) : (

          <form
            className="vendor-create-form"
            onSubmit={onSubmit}
          >

            {error && (
              <div
                className="error-state"
                role="alert"
              >
                {error}
              </div>
            )}


            <div className="vendor-form-section">

              <h4>
                Account Information
              </h4>

              <div className="vendor-form-grid">

                <Field label="Business Name *">
                  <input
                    value={form.business_name}
                    onChange={(event) =>
                      update(
                        'business_name',
                        event.target.value
                      )
                    }
                    required
                    maxLength={255}
                  />
                </Field>

                <Field label="Email *">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      update(
                        'email',
                        event.target.value
                      )
                    }
                    required
                    maxLength={255}
                  />
                </Field>

                <Field label="Phone *">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      update(
                        'phone',
                        event.target.value
                      )
                    }
                    required
                    minLength={5}
                    maxLength={50}
                  />
                </Field>

                <Field label="Password *">
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      update(
                        'password',
                        event.target.value
                      )
                    }
                    required
                    minLength={6}
                    maxLength={100}
                  />
                </Field>

                <Field label="Confirm Password *">
                  <input
                    type="password"
                    value={form.confirm_password}
                    onChange={(event) =>
                      update(
                        'confirm_password',
                        event.target.value
                      )
                    }
                    required
                    minLength={6}
                    maxLength={100}
                  />
                </Field>

              </div>

            </div>


            <div className="vendor-form-section">

              <h4>
                Business Details
              </h4>

              <div className="vendor-form-grid">

                <Field label="Legal Name">
                  <input
                    value={form.legal_name}
                    onChange={(event) =>
                      update(
                        'legal_name',
                        event.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Commission Rate (%) *">
                  <input
                    type="number"
                    value={form.commission_rate}
                    onChange={(event) =>
                      update(
                        'commission_rate',
                        event.target.value
                      )
                    }
                    min="0"
                    max="100"
                    step="0.01"
                    required
                  />
                </Field>

                <Field
                  label="Description"
                  full
                >
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      update(
                        'description',
                        event.target.value
                      )
                    }
                    rows={3}
                  />
                </Field>

              </div>

            </div>


            <div className="vendor-form-section">

              <h4>
                Address
              </h4>

              <div className="vendor-form-grid">

                <Field
                  label="Address Line 1"
                  full
                >
                  <input
                    value={form.address_line1}
                    onChange={(event) =>
                      update(
                        'address_line1',
                        event.target.value
                      )
                    }
                  />
                </Field>

                <Field
                  label="Address Line 2"
                  full
                >
                  <input
                    value={form.address_line2}
                    onChange={(event) =>
                      update(
                        'address_line2',
                        event.target.value
                      )
                    }
                  />
                </Field>

                <Field label="City">
                  <input
                    value={form.city}
                    onChange={(event) =>
                      update(
                        'city',
                        event.target.value
                      )
                    }
                  />
                </Field>

                <Field label="State">
                  <input
                    value={form.state}
                    onChange={(event) =>
                      update(
                        'state',
                        event.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Postal Code">
                  <input
                    value={form.postal_code}
                    onChange={(event) =>
                      update(
                        'postal_code',
                        event.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Country">
                  <input
                    value={form.country}
                    onChange={(event) =>
                      update(
                        'country',
                        event.target.value
                      )
                    }
                  />
                </Field>

              </div>

            </div>


            <div className="vendor-modal-footer">

              <button
                type="button"
                className="vendor-create-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="vendor-create-submit"
                disabled={loading}
              >
                {loading
                  ? 'Creating Account...'
                  : 'Create Vendor Account'}
              </button>

            </div>

          </form>

        )}

      </section>

    </div>
  );
}

function Field({
  label,
  children,
  full = false,
}) {
  return (
    <label
      className={
        full
          ? 'vendor-form-full'
          : ''
      }
    >
      <span>
        {label}
      </span>

      {children}
    </label>
  );
}


/* ============================================================
   STYLES
============================================================ */

function VendorStyles() {
  return (
    <style>{`
      .vendors-page {
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-width: 0;
      }

      /* Hero Banner */
      .vendor-hero-card {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 22px 28px;
        border-radius: 16px;
        background: linear-gradient(135deg, #E6F1E3 0%, #EDF6EB 60%, #E2EFE0 100%);
        border: 1px solid #D8E7D4;
        box-shadow: 0 2px 10px rgba(18, 61, 43, 0.04);
      }

      .vendor-hero-content {
        max-width: 600px;
      }

      .vendor-hero-tag {
        display: inline-block;
        color: #1F5133;
        font-size: 10.5px;
        font-weight: 800;
        letter-spacing: 1.6px;
        text-transform: uppercase;
        margin-bottom: 6px;
      }

      .vendor-hero-content h2 {
        margin: 0;
        color: var(--brand-primary);
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 26px;
        font-weight: 700;
        letter-spacing: -0.2px;
        line-height: 1.25;
      }

      .vendor-hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 16px;
        border-radius: 9999px;
        background: #FFFFFF;
        border: 1px solid #D8E7D4;
        color: var(--brand-primary);
        font-size: 12.5px;
        font-weight: 700;
        box-shadow: 0 2px 6px rgba(18, 61, 43, 0.04);
      }

      .vendor-pulse-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #16A34A;
        box-shadow: 0 0 0 2.5px rgba(22, 163, 74, 0.2);
      }

      /* Toolbar */
      .vendor-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .vendor-search-wrap {
        position: relative;
        flex: 1 1 340px;
        min-width: 260px;
      }

      .vendor-search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: #718475;
        pointer-events: none;
      }

      .vendor-search-wrap input {
        width: 100%;
        padding: 10px 14px 10px 40px;
        border-radius: 12px;
        border: 1px solid #D5E4D2;
        background: #FFFFFF;
        color: var(--brand-primary);
        font-size: 13px;
        transition: border-color 0.15s, box-shadow 0.15s;
        box-sizing: border-box;
      }

      .vendor-search-wrap input:focus {
        border-color: #276345;
        outline: none;
        box-shadow: 0 0 0 3px rgba(39, 99, 69, 0.12);
      }

      .vendor-actions-group {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .vendor-create-button {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 9px 18px;
        border-radius: 11px;
        border: 1px solid #144422;
        background: var(--brand-deep);
        color: #FFFFFF;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(23, 63, 29, 0.2);
        transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .vendor-create-button:hover {
        background: #113417;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(23, 63, 29, 0.28);
      }

      .vendor-status-select {
        padding: 9px 14px;
        border-radius: 11px;
        border: 1px solid #D5E4D2;
        background: #FFFFFF;
        color: #22422E;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        outline: none;
        transition: border-color 0.15s;
      }

      .vendor-status-select:focus {
        border-color: #276345;
        box-shadow: 0 0 0 2px rgba(39, 99, 69, 0.1);
      }

      /* Main Table Card */
      .vendor-table-card {
        border-radius: 16px;
        background: #FFFFFF;
        border: 1px solid #E1EBE0;
        overflow: hidden;
        box-shadow: 0 1px 6px rgba(18, 61, 43, 0.03);
      }

      .vendor-list-table {
        width: 100%;
        table-layout: fixed;
        border-collapse: collapse;
        text-align: left;
      }

      .vendor-list-table thead {
        background: #E8F0E4;
      }

      .vendor-list-table th {
        padding: 11px 12px;
        color: #22422E;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        border-bottom: 1px solid #DCE6D9;
        white-space: nowrap;
      }

      .vendor-list-table td {
        padding: 11px 12px;
        border-bottom: 1px solid #EEF3ED;
        vertical-align: middle;
        color: #374151;
        font-size: 13px;
        background: #FFFFFF;
      }

      /* Proportional column widths */
      .th-business, .td-business { width: 28%; min-width: 190px; }
      .th-contact, .td-contact { width: 22%; min-width: 160px; }
      .th-location, .td-location { width: 14%; min-width: 110px; }
      .th-commission, .td-commission { width: 95px; text-align: left; }
      .th-joined, .td-joined { width: 105px; text-align: left; }
      .th-account-actions, .td-account-actions { width: 150px; text-align: left; }

      .vendor-list-table tr:hover td {
        background: #FAFDF9;
      }

      .vendor-row-clickable {
        cursor: pointer;
      }

      .vendor-profile {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 200px;
      }

      .vendor-logo {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
        border: 1px solid #DCECD9;
      }

      .vendor-logo-fallback {
        display: grid;
        place-items: center;
        background: #DCECD9;
        color: var(--brand-primary);
        font-weight: 700;
        font-size: 14px;
      }

      .vendor-profile-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .vendor-name {
        color: var(--brand-primary);
        font-size: 13.5px;
        font-weight: 700;
        line-height: 1.3;
      }

      .vendor-subtitle {
        color: #718475;
        font-size: 11.5px;
        line-height: 1.3;
      }

      .vendor-contact-email {
        color: var(--brand-primary);
        font-size: 13px;
        font-weight: 500;
      }

      .td-commission strong {
        color: var(--brand-primary);
        font-weight: 600;
        font-size: 13px;
      }

      .td-location,
      .td-joined {
        color: #374151;
        font-size: 13px;
      }

      /* Single-layer account action select */
      .vendor-account-actions-select {
        appearance: none !important;
        -webkit-appearance: none !important;
        width: 100%;
        max-width: 150px;
        padding: 7px 30px 7px 12px !important;
        border: 1px solid #D1E0D1 !important;
        border-radius: 10px !important;
        background-color: #F7FAF6 !important;
        color: var(--brand-primary) !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        outline: none !important;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23123D2B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;
        background-repeat: no-repeat !important;
        background-position: right 10px center !important;
        background-size: 10px !important;
        transition: all 0.15s ease !important;
      }

      .vendor-account-actions-select:hover:not(:disabled),
      .vendor-account-actions-select:focus {
        border-color: #276345 !important;
        background-color: #FFFFFF !important;
        box-shadow: 0 0 0 3px rgba(39, 99, 69, 0.12) !important;
      }

      .vendor-account-actions-select:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* ===========================
         DETAILS PAGE
      =========================== */

      .vendor-details-page {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .vendor-details-page .vendor-product-info {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 190px;
      }

      .vendor-details-page .vendor-product-image {
        width: 44px;
        height: 44px;
        flex: 0 0 44px;
        border: 1px solid #e4e9e3;
        border-radius: 8px;
        object-fit: cover;
        background: #f7faf7;
      }

      .vendor-details-page .vendor-product-image-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #77747a;
        font-size: 16px;
      }

      .vendor-details-page .vendor-subtitle {
        margin-top: 4px;
        color: #77747a;
        font-size: 11px;
        overflow-wrap: anywhere;
      }

      .vendor-details-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .vendor-back-button {
        padding: 9px 13px;
        border: 1px solid #d5e0d5;
        border-radius: 8px;
        background: #fff;
        color: var(--brand-primary);
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }

      .vendor-back-button:hover {
        background: #f5f9f5;
        border-color: #276345;
      }

      .vendor-details-hero {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        padding: 24px 28px;
        border: 1px solid #D8E7D4;
        border-radius: 16px;
        background: linear-gradient(135deg, #E6F1E3 0%, #EDF6EB 60%, #E2EFE0 100%);
        box-shadow: 0 2px 10px rgba(18, 61, 43, 0.04);
      }

      .vendor-details-identity {
        display: flex;
        align-items: center;
        gap: 16px;
        min-width: 0;
      }

      .vendor-details-logo {
        width: 64px;
        height: 64px;
        flex-shrink: 0;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #FFFFFF;
        box-shadow: 0 2px 8px rgba(18, 61, 43, 0.08);
      }

      .vendor-details-logo-fallback {
        display: grid;
        place-items: center;
        background: #DCECD9;
        color: var(--brand-primary);
        font-size: 24px;
        font-weight: 700;
      }

      .vendor-details-eyebrow {
        margin-bottom: 4px;
        color: #1F5133;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.5px;
      }

      .vendor-details-hero h1 {
        margin: 0;
        color: var(--brand-primary);
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 26px;
        font-weight: 700;
        letter-spacing: -0.2px;
      }

      .vendor-details-hero p {
        margin: 4px 0 0;
        color: #556B5C;
        font-size: 13px;
      }

      .vendor-details-statuses {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .vendor-status-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 72px;
        padding: 5px 14px;
        border-radius: 9999px;
        font-size: 11.5px;
        font-weight: 700;
        text-transform: capitalize;
        border: 1px solid transparent;
      }

      .status-approved,
      .status-active {
        background: #DCFCE7;
        color: #15803D;
        border-color: #BBF7D0;
      }

      .status-pending {
        background: #FEF3C7;
        color: #B45309;
        border-color: #FDE68A;
      }

      .status-rejected,
      .status-suspended,
      .status-inactive {
        background: #FEE2E2;
        color: #B91C1C;
        border-color: #FECACA;
      }

      .vendor-stat-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }

      .vendor-stat-card {
        display: block;
        padding: 18px 20px;
        border: 1px solid #E1EBE0;
        border-radius: 14px;
        background: #FFFFFF;
        color: inherit;
        text-decoration: none;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 1px 4px rgba(18, 61, 43, 0.03);
      }

      .vendor-stat-link {
        cursor: pointer;
      }

      .vendor-stat-link:hover {
        transform: translateY(-2px);
        border-color: #BED8BD;
        box-shadow: 0 6px 18px rgba(18, 61, 43, 0.08);
      }

      .vendor-stat-link:focus-visible {
        outline: 2px solid #276345;
        outline-offset: 3px;
      }

      .vendor-info-card[id] {
        scroll-margin-top: 24px;
      }

      .vendor-stat-card span,
      .vendor-stat-card small {
        display: block;
      }

      .vendor-stat-card span {
        font-size: 12.5px;
        font-weight: 600;
        color: #556B5C;
      }

      .vendor-stat-card strong {
        display: block;
        margin: 6px 0 4px;
        color: var(--brand-primary);
        font-size: 26px;
        font-weight: 700;
      }

      .vendor-stat-card small {
        font-size: 11.5px;
        color: #8C9990;
        line-height: 1.4;
      }

      .vendor-details-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.8fr);
        gap: 18px;
      }

      .vendor-info-card {
        padding: 22px 24px;
        border: 1px solid #E1EBE0;
        border-radius: 16px;
        background: #FFFFFF;
        box-shadow: 0 1px 6px rgba(18, 61, 43, 0.03);
      }

      .vendor-section-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 18px;
      }

      .vendor-section-heading h2 {
        margin: 0;
        color: var(--brand-primary);
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 18px;
        font-weight: 700;
      }
        font-size: 17px;
      }

      .vendor-section-heading p {
        margin: 5px 0 0;
        color: #77747a;
        font-size: 12px;
      }

      .vendor-section-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 30px;
        height: 30px;
        padding: 0 8px;
        border-radius: 8px;
        background: #edf5ec;
        color: var(--brand-primary);
        font-size: 12px;
        font-weight: 700;
      }

      .vendor-info-grid {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .vendor-info-field {
        min-width: 0;
        padding-bottom: 12px;
        border-bottom: 1px solid #edf0ed;
      }

      .vendor-info-field span,
      .vendor-description-block > span {
        display: block;
        margin-bottom: 5px;
        color: #77747a;
        font-size: 11px;
        font-weight: 600;
      }

      .vendor-info-field strong {
        display: block;
        color: #252a26;
        font-size: 13px;
        overflow-wrap: anywhere;
      }

      .vendor-description-block {
        margin-top: 18px;
        padding: 14px;
        border-radius: 10px;
        background: var(--page-background);
      }

      .vendor-description-block p {
        margin: 0;
        color: #4f544f;
        font-size: 13px;
        line-height: 1.55;
      }

      .vendor-earnings-list {
        display: grid;
        gap: 10px;
      }

      .vendor-earnings-list > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #edf0ed;
      }

      .vendor-earnings-list span {
        color: #77747a;
        font-size: 12px;
      }

      .vendor-earnings-list strong {
        color: var(--brand-primary);
        font-size: 13px;
      }

      .vendor-empty-section,
      .vendor-details-loading {
        padding: 30px;
        text-align: center;
      }

      .vendor-detail-pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid #edf0ed;
        color: #77747a;
        font-size: 12px;
      }

      .vendor-detail-pagination > div {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .vendor-detail-pagination button {
        min-height: 34px;
        padding: 0 11px;
        border: 1px solid #d5e0d5;
        border-radius: 7px;
        background: #fff;
        color: var(--brand-primary);
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }

      .vendor-detail-pagination button:hover:not(:disabled) {
        border-color: #276345;
        background: #f5f9f5;
      }

      .vendor-detail-pagination button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .vendor-detail-pagination-page {
        color: #555b56;
        white-space: nowrap;
      }

      .vendor-activity-list {
        display: flex;
        flex-direction: column;
      }

      .vendor-activity-item {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 15px 0;
        border-bottom: 1px solid #edf0ed;
      }

      .vendor-activity-item:last-child {
        border-bottom: 0;
      }

      .vendor-activity-main {
        min-width: 0;
      }

      .vendor-activity-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .vendor-activity-title-row strong {
        color: var(--brand-primary);
        font-size: 13px;
      }

      .vendor-activity-title-row p,
      .vendor-activity-main p {
        margin: 5px 0;
        color: #555b56;
        font-size: 12px;
      }

      .vendor-activity-main small {
        color: #77747a;
        font-size: 11px;
      }

      .vendor-request-details {
        margin-top: 10px;
        color: #276345;
        font-size: 12px;
      }

      .vendor-request-details summary {
        width: fit-content;
        cursor: pointer;
        font-weight: 600;
      }

      .vendor-request-details dl {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px 16px;
        margin: 10px 0 0;
      }

      .vendor-request-details dl > div {
        min-width: 0;
      }

      .vendor-request-details dt {
        color: #77747a;
        font-size: 10px;
        font-weight: 600;
        text-transform: capitalize;
      }

      .vendor-request-details dd {
        margin: 3px 0 0;
        color: #263b2f;
        overflow-wrap: anywhere;
      }

      .vendor-activity-type,
      .vendor-activity-status-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 4px 8px;
        font-size: 10px;
        font-weight: 700;
        text-transform: capitalize;
      }

      .vendor-activity-type.is-request {
        background: #fff5df;
        color: #8b6415;
      }

      .vendor-activity-type.is-activity {
        background: #edf5ec;
        color: #276345;
      }

      .vendor-activity-status {
        flex-shrink: 0;
      }

      .vendor-activity-status-pill.status-pending {
        background: #fff5df;
        color: #8b6415;
      }

      .vendor-activity-status-pill.status-approved,
      .vendor-activity-status-pill.status-active,
      .vendor-activity-status-pill.status-published {
        background: #e8f2e7;
        color: var(--brand-primary);
      }

      .vendor-activity-status-pill.status-rejected,
      .vendor-activity-status-pill.status-suspended {
        background: #fdf1f0;
        color: #a3332a;
      }

      .vendor-activity-status-pill.status-neutral {
        background: #f1f3f1;
        color: #666;
      }

      /* ===========================
         CREATE VENDOR MODAL
      =========================== */

      .vendor-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(
          18,
          30,
          24,
          0.55
        );
      }

      .vendor-create-modal {
        width: 100%;
        max-width: 760px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 24px;
        border-radius: 14px;
        background: #fff;
        box-shadow:
          0 20px 60px
          rgba(0, 0, 0, 0.2);
      }

      .vendor-modal-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 24px;
      }

      .vendor-modal-header h3 {
        margin: 0;
        color: var(--brand-primary);
        font-size: 20px;
      }

      .vendor-modal-header p {
        margin: 6px 0 0;
        color: #77747a;
        font-size: 13px;
      }

      .vendor-modal-close {
        border: 0;
        background: transparent;
        color: #555;
        font-size: 28px;
        cursor: pointer;
      }

      .vendor-create-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .vendor-form-section {
        padding: 18px;
        border: 1px solid #e8ebe7;
        border-radius: 10px;
        background: #fafcf9;
      }

      .vendor-form-section h4 {
        margin: 0 0 16px;
        color: var(--brand-primary);
        font-size: 14px;
      }

      .vendor-form-grid {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .vendor-form-grid label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        color: #555b56;
        font-size: 12px;
        font-weight: 600;
      }

      .vendor-form-full {
        grid-column: 1 / -1;
      }

      .vendor-form-grid input,
      .vendor-form-grid textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 12px;
        border: 1px solid #d9dfd9;
        border-radius: 7px;
        background: #fff;
        color: #252a26;
        font-size: 13px;
        outline: none;
      }

      .vendor-form-grid input:focus,
      .vendor-form-grid textarea:focus {
        border-color: #276345;
        box-shadow:
          0 0 0 2px
          rgba(39, 99, 69, 0.08);
      }

      .vendor-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 18px;
      }

      .vendor-create-submit {
        padding: 10px 18px;
        border: 0;
        border-radius: 7px;
        background: var(--brand-primary);
        color: #fff;
        font-weight: 600;
        cursor: pointer;
      }

      .vendor-create-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .vendor-create-cancel {
        padding: 10px 18px;
        border: 1px solid #d5ddd5;
        border-radius: 7px;
        background: #fff;
        color: #555b56;
        font-weight: 600;
        cursor: pointer;
      }

      .vendor-credentials-success {
        padding: 10px 0;
        text-align: center;
      }

      .vendor-success-icon {
        width: 46px;
        height: 46px;
        margin: 0 auto 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #e8f2e7;
        color: var(--brand-primary);
        font-size: 24px;
        font-weight: 700;
      }

      .vendor-credentials-success h4 {
        margin: 0 0 18px;
        color: var(--brand-primary);
        font-size: 18px;
      }

      .vendor-credential-row {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        padding: 13px 15px;
        margin-top: 8px;
        border: 1px solid #e2e7e2;
        border-radius: 8px;
        background: #fafcf9;
        text-align: left;
      }

      .vendor-credential-row span {
        color: #77747a;
        font-size: 12px;
      }

      .vendor-credential-row strong {
        color: var(--brand-primary);
        font-size: 13px;
        word-break: break-all;
      }

      .vendor-credential-warning {
        margin-top: 14px;
        padding: 12px;
        border-radius: 8px;
        background: #fff8e8;
        color: #735c25;
        font-size: 12px;
        line-height: 1.5;
        text-align: left;
      }



      .vendor-product-row-clickable {
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .vendor-product-row-clickable:hover td,
      .vendor-product-row-clickable.is-selected td {
        background: #f4f9f3;
      }

      .vendor-product-row-clickable:focus-visible td {
        background: #f4f9f3;
        outline: 2px solid #276345;
        outline-offset: -2px;
      }

      .vendor-product-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 1100;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(18, 30, 24, 0.6);
      }

      .vendor-product-modal {
        width: min(960px, 100%);
        max-height: min(90vh, 900px);
        overflow: auto;
        overscroll-behavior: contain;
        padding: 24px;
        border-radius: 16px;
        background: #fff;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.24);
      }

      .vendor-selected-product-heading {
        align-items: flex-start;
      }

      .vendor-selected-product-heading h2 {
        margin-top: 2px;
      }

      .vendor-product-modal-heading-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .vendor-product-modal-close {
        display: grid;
        width: 36px;
        height: 36px;
        place-items: center;
        border: 1px solid #e1e9e0;
        border-radius: 9px;
        background: #fff;
        color: #526461;
        cursor: pointer;
      }

      .vendor-product-modal-close:hover {
        background: #f3f8f2;
        color: #276345;
      }

      .vendor-selected-product-layout {
        display: grid;
        grid-template-columns: minmax(220px, 0.55fr) minmax(0, 1.45fr);
        gap: 24px;
        align-items: start;
      }

      .vendor-selected-product-media {
        min-width: 0;
      }

      .vendor-selected-product-image {
        width: 100%;
        max-width: 300px;
        aspect-ratio: 1 / 1;
        display: block;
        object-fit: contain;
        border: 1px solid #e1ebe0;
        border-radius: 14px;
        background: #f8fbf7;
      }

      .vendor-selected-product-image-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #7b887e;
        font-size: 12px;
      }

      .vendor-selected-product-thumbs {
        display: flex;
        gap: 8px;
        margin-top: 10px;
        flex-wrap: wrap;
      }

      .vendor-selected-product-thumbs img {
        width: 48px;
        height: 48px;
        border: 1px solid #dfe9de;
        border-radius: 8px;
        object-fit: cover;
        background: #f8fbf7;
      }

      .vendor-selected-product-fields {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px 18px;
      }

      .vendor-selected-product-description {
        margin-top: 20px;
        padding: 15px;
        border-radius: 10px;
        background: #f7faf6;
        border: 1px solid #e7eee5;
      }

      .vendor-selected-product-description > span,
      .vendor-selected-product-meta > span {
        display: block;
        margin-bottom: 6px;
        color: #66746a;
        font-size: 11px;
        font-weight: 700;
      }

      .vendor-selected-product-description p {
        margin: 0;
        color: #39463e;
        font-size: 13px;
        line-height: 1.6;
        white-space: pre-wrap;
      }

      .vendor-selected-product-meta {
        margin-top: 16px;
      }

      .vendor-selected-product-meta > div {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
      }

      .vendor-selected-product-meta > div > span {
        padding: 5px 9px;
        border-radius: 999px;
        background: #edf5ec;
        color: #276345;
        font-size: 11px;
        font-weight: 600;
      }

      .vendor-selected-product-section {
        margin-top: 22px;
        padding-top: 20px;
        border-top: 1px solid #e9eee8;
      }

      .vendor-selected-product-section-heading {
        margin-bottom: 12px;
      }

      .vendor-selected-product-section-heading h3 {
        margin: 0;
        color: var(--brand-primary);
        font-size: 14px;
      }

      .vendor-selected-product-section-heading p {
        margin: 4px 0 0;
        color: #7a857d;
        font-size: 11px;
      }

      .vendor-product-approval-error {
        margin-bottom: 16px;
        padding: 10px 12px;
      }

      .vendor-product-approval-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        margin-top: 22px;
        padding: 16px;
        border: 1px solid #eadfbf;
        border-radius: 12px;
        background: #fffaf0;
      }

      .vendor-product-approval-actions strong {
        display: block;
        color: #6f5214;
        font-size: 13px;
      }

      .vendor-product-approval-actions p {
        margin: 4px 0 0;
        color: #7d6a3b;
        font-size: 11.5px;
        line-height: 1.45;
      }

      .vendor-product-approval-buttons {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }

      .vendor-product-approve-button,
      .vendor-product-reject-button {
        min-height: 36px;
        padding: 0 14px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }

      .vendor-product-approve-button {
        border: 1px solid #287653;
        background: #287653;
        color: #fff;
      }

      .vendor-product-approve-button:hover:not(:disabled) {
        background: #236746;
        border-color: #236746;
      }

      .vendor-product-reject-button {
        border: 1px solid #e1b7b3;
        background: #fff;
        color: #a3332a;
      }

      .vendor-product-reject-button:hover:not(:disabled) {
        background: #fdf1f0;
        border-color: #c97a73;
      }

      .vendor-product-approve-button:disabled,
      .vendor-product-reject-button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }


      @media (max-width: 1000px) {

        .vendor-stat-grid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .vendor-details-layout {
          grid-template-columns: 1fr;
        }

        .vendor-selected-product-layout {
          grid-template-columns: 1fr;
        }

        .vendor-selected-product-image {
          max-width: 260px;
        }

      }


      @media (max-width: 620px) {

        .vendor-product-modal-overlay {
          align-items: flex-end;
          padding: 0;
        }

        .vendor-product-modal {
          max-height: 94vh;
          padding: 18px;
          border-radius: 16px 16px 0 0;
        }

        .vendor-selected-product-heading {
          gap: 10px;
        }

        .vendor-product-modal-heading-actions {
          gap: 6px;
        }

        .vendor-toolbar {
          align-items: stretch !important;
        }

        .vendor-toolbar input[type="search"],
        .vendor-toolbar select {
          width: 100%;
        }

        .vendor-details-hero {
          align-items: flex-start;
          flex-direction: column;
        }

        .vendor-details-statuses {
          justify-content: flex-start;
        }

        .vendor-stat-grid,
        .vendor-info-grid,
        .vendor-form-grid {
          grid-template-columns: 1fr;
        }

        .vendor-form-full {
          grid-column: auto;
        }

        .vendor-credential-row {
          flex-direction: column;
          gap: 5px;
        }

        .vendor-detail-pagination {
          align-items: flex-start;
          flex-direction: column;
        }

        .vendor-selected-product-fields {
          grid-template-columns: 1fr;
        }

        .vendor-product-approval-actions {
          align-items: flex-start;
          flex-direction: column;
        }

        .vendor-product-approval-buttons {
          width: 100%;
        }

        .vendor-product-approval-buttons button {
          flex: 1;
        }

        .vendor-detail-pagination > div {
          width: 100%;
          justify-content: space-between;
        }

      }
      .vendor-details-page .vendor-product-status-chips {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .vendor-details-page .vendor-product-status-chip {
        appearance: none;
        border: 1px solid #dce7dc;
        background: #ffffff;
        color: #526457;
        padding: 7px 15px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        line-height: 1;
        cursor: pointer;
        transition:
          background 0.2s ease,
          border-color 0.2s ease,
          color 0.2s ease;
      }

      .vendor-details-page .vendor-product-status-chip:hover {
        background: #f3f8f3;
        border-color: #b9d1bb;
        color: #245d3f;
      }

      .vendor-details-page .vendor-product-status-chip.active {
        background: #287653;
        border-color: #287653;
        color: #ffffff;
      }

      .vendor-details-page .vendor-product-status-chip.active:hover {
        background: #236746;
        border-color: #236746;
        color: #ffffff;
      }

      .vendor-details-page .vendor-product-filter-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 90px;
        padding: 20px;
        border: 1px dashed #dce7dc;
        border-radius: 8px;
        background: #fafcf9;
        color: #78847b;
        font-size: 12px;
      }

      .vendor-details-page .vendor-product-status-text {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 4px 9px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 600;
        text-transform: capitalize;
      }

      .vendor-details-page .vendor-product-status-text.status-approved {
        background: #e8f6eb;
        color: #287653;
      }

      .vendor-details-page .vendor-product-status-text.status-pending {
        background: #fff5dc;
        color: #9a6a00;
      }

      .vendor-details-page .vendor-product-status-text.status-rejected {
        background: #fdeceb;
        color: #b64b42;
      }
    `}</style>
  );
}