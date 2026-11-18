import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Filter,
  Package,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  archiveProduct,
  addProductImage,
  adjustInventoryStock,
  createProduct,
  getProduct,
  getResource,
  replaceProductImage,
  updateProduct,
  updateProductApproval,
  updateResourceStatus,
} from '../services/adminService.js';
import { AyurvedicHeroBanner } from '../components/AyurvedicDoodles.jsx';
import Pagination, {
  ADMIN_LIST_PAGE_SIZE,
} from '../components/Pagination.jsx';

const statuses = [
  'draft',
  'active',
  'archived',
];

const blankVariant = () => ({
  sku: '',
  name: '',
  price: '',
  compare_at_price: '',
  cost_price: '',
  stock_quantity: '0',
  attributesText: '{}',
  is_active: true,
});

const blankImage = () => ({
  id: null,
  variant_id: null,
  image_url: '',
  alt_text: '',
  sort_order: '0',
  is_primary: false,
});

const blankForm = () => ({
  vendor_id: '',
  category_id: '',
  name: '',
  slug: '',
  short_description: '',
  description: '',
  ingredients: '',
  benefits: '',
  directions: '',
  warnings: '',
  status: 'draft',
  is_featured: false,
  variants: [blankVariant()],
  images: [blankImage()],
});

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toForm(product) {
  const form = blankForm();

  const variants = (product.product_variants || product.variants || []).map(
    (variant) => ({
      ...variant,
      id: variant.id,
      sku: variant.sku ?? '',
      name: variant.name ?? '',
      price: String(variant.price ?? ''),
      compare_at_price: String(variant.compare_at_price ?? ''),
      cost_price: String(variant.cost_price ?? ''),
      stock_quantity: String(variant.stock_quantity ?? 0),
      attributesText: JSON.stringify(variant.attributes ?? {}, null, 2),
      is_active: variant.is_active ?? true,
    })
  );

  const images = (
    product.product_images ||
    product.images ||
    []
  ).map((image) => ({
    id: image.id || null,
    variant_id: image.variant_id || null,
    image_url: image.image_url || '',
    alt_text: image.alt_text || '',
    sort_order: String(image.sort_order ?? 0),
    is_primary: Boolean(image.is_primary),
  }));

  return {
    ...form,
    ...product,
    vendor_id: product.vendor_id || '',
    category_id: product.category_id || '',
    variants: variants.length ? variants : [blankVariant()],
    images: images.length ? images : [blankImage()],
  };
}


function normalizePayload(form, includeVendor) {
  const cleanText = (value) => String(value ?? '').trim();

  const variants = (form.variants || [])
    .filter((variant) =>
      cleanText(variant.price) !== '' ||
      cleanText(variant.sku) ||
      cleanText(variant.name)
    )
    .map((variant) => {
      let attributes;

      try {
        attributes = JSON.parse(
          cleanText(variant.attributesText) || '{}'
        );
      } catch {
        throw new Error(
          'Variant attributes must contain valid JSON.'
        );
      }

      if (
        !attributes ||
        Array.isArray(attributes) ||
        typeof attributes !== 'object'
      ) {
        throw new Error(
          'Variant attributes must be a JSON object.'
        );
      }

      const priceText = cleanText(variant.price);
      const compareText = cleanText(variant.compare_at_price);
      const costText = cleanText(variant.cost_price);

      if (!priceText) {
        throw new Error(
          'Enter a price for every variant you add.'
        );
      }

      const price = Number(priceText);
      const compareAtPrice = compareText
        ? Number(compareText)
        : null;
      const costPrice = costText
        ? Number(costText)
        : null;
      const stockQuantity = Number(
        variant.stock_quantity ?? 0
      );

      if (!Number.isFinite(price) || price < 0) {
        throw new Error('Enter a valid variant price.');
      }

      if (
        compareAtPrice !== null &&
        (!Number.isFinite(compareAtPrice) ||
          compareAtPrice < price)
      ) {
        throw new Error(
          'Compare-at price must be greater than or equal to price.'
        );
      }

      if (
        costPrice !== null &&
        (!Number.isFinite(costPrice) || costPrice < 0)
      ) {
        throw new Error('Enter a valid cost price.');
      }

      if (
        !Number.isInteger(stockQuantity) ||
        stockQuantity < 0
      ) {
        throw new Error(
          'Stock quantity must be a non-negative integer.'
        );
      }

      const normalizedVariant = {
        sku: cleanText(variant.sku) || null,
        name: cleanText(variant.name) || null,
        price,
        compare_at_price: compareAtPrice,
        cost_price: costPrice,
        stock_quantity: stockQuantity,
        attributes,
        is_active: Boolean(variant.is_active),
      };
      if (variant.id) {
        return {
          ...normalizedVariant,
          id: variant.id,
        };
      }

      return normalizedVariant;
    });

  const images = (form.images || [])
    .filter((image) => cleanText(image.image_url))
    .map((image) => {
      const imageUrl = cleanText(image.image_url);

      if (!/^https?:\/\//i.test(imageUrl)) {
        throw new Error(
          'Image URLs must start with http:// or https://.'
        );
      }

      return {
        image_url: imageUrl,
        alt_text: cleanText(image.alt_text) || null,
        sort_order: Number(image.sort_order || 0),
        is_primary: Boolean(image.is_primary),
      };
    });

  if (images.filter((image) => image.is_primary).length > 1) {
    throw new Error('Select only one primary image.');
  }

  const payload = {
    category_id: form.category_id,
    name: cleanText(form.name),
    slug: cleanText(form.slug).toLowerCase(),
    short_description:
      cleanText(form.short_description) || null,
    description: cleanText(form.description) || null,
    ingredients: cleanText(form.ingredients) || null,
    benefits: cleanText(form.benefits) || null,
    directions: cleanText(form.directions) || null,
    warnings: cleanText(form.warnings) || null,
    status: form.status,
    is_featured: Boolean(form.is_featured),
    variants,
    images,
  };

  if (includeVendor) {
    payload.vendor_id = form.vendor_id;
  }

  return payload;
}


function getCollection(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function getVariantAttributes(variant) {
  let attributes = variant.attributes;
  if (!attributes && variant.attributesText) {
    try {
      attributes = JSON.parse(variant.attributesText);
    } catch {
      return [];
    }
  }

  if (
    !attributes ||
    typeof attributes !== 'object' ||
    Array.isArray(attributes)
  ) {
    return [];
  }

  return Object.entries(attributes).filter(
    ([, value]) => value !== null && value !== ''
  );
}

function formatAttributeLabel(value) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAttributeValue(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    return value.map(formatAttributeValue).join(', ');
  }
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(
        ([key, nestedValue]) =>
          `${formatAttributeLabel(key)}: ${formatAttributeValue(nestedValue)}`
      )
      .join(', ');
  }
  return String(value);
}

function ProductDetailsView({
  product,
  categories,
  vendors,
  approvalStatus,
  approvalLoading,
  approvalError,
  onClose,
  onEdit,
  onApprove,
  onReject,
}) {
  const variants = product.variants || [];
  const images = product.images || [];
  const primaryImage =
    images.find((image) => image.is_primary && image.image_url) ||
    images.find((image) => image.image_url);
  const primaryVariant =
    variants.find((variant) => variant.is_active !== false) ||
    variants[0];
  const category = categories.find(
    (item) => item.id === product.category_id
  );
  const vendor = vendors.find(
    (item) => item.id === product.vendor_id
  );
  const detailFields = [
    { label: 'Description', value: product.description },
    { label: 'Ingredients', value: product.ingredients },
    { label: 'Benefits', value: product.benefits },
    { label: 'Directions', value: product.directions },
    { label: 'Warnings', value: product.warnings },
  ].filter((field) => field.value);

  const formatPrice = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount)
      ? `₹${amount.toLocaleString('en-IN')}`
      : '—';
  };

  return (
    <div className="product-details-view">
      <div className="product-details-hero">
        <div className="product-details-media">
          {primaryImage ? (
            <img
              src={primaryImage.image_url}
              alt={primaryImage.alt_text || product.name || 'Product'}
            />
          ) : (
            <div className="product-details-image-fallback">
              <Package size={42} />
            </div>
          )}

          {images.length > 1 && (
            <div className="product-details-thumbnails">
              {images
                .filter((image) => image.image_url)
                .map((image) => (
                  <img
                    key={image.id || image.image_url}
                    src={image.image_url}
                    alt={image.alt_text || ''}
                  />
                ))}
            </div>
          )}
        </div>

        <div className="product-details-overview">
          <div className="product-details-badges">
            <span className={`product-detail-status status-${product.status || 'draft'}`}>
              {product.status || 'draft'}
            </span>
            {category?.name && (
              <span className="product-detail-category">
                {category.name}
              </span>
            )}
            {product.is_featured && (
              <span className="product-detail-featured">
                Featured
              </span>
            )}
          </div>

          <h2>{product.name || 'Unnamed product'}</h2>
          {product.short_description && (
            <p className="product-details-short-description">
              {product.short_description}
            </p>
          )}

          <div className="product-details-price">
            {formatPrice(primaryVariant?.price)}
          </div>

          <div className="product-details-meta">
            <div>
              <span>Rating</span>
              <strong>
                {Number(product.average_rating || 0).toFixed(1)}
                {' '}({product.review_count || 0} reviews)
              </strong>
            </div>
            <div>
              <span>Category</span>
              <strong>{category?.name || '—'}</strong>
            </div>
            <div>
              <span>Vendor</span>
              <strong>
                {vendor?.business_name ||
                  vendor?.name ||
                  vendor?.legal_name ||
                  '—'}
              </strong>
            </div>
            <div>
              <span>Variants</span>
              <strong>{variants.length}</strong>
            </div>
          </div>
        </div>
      </div>

      <section className="product-details-section">
        <h3>Product information</h3>
        {detailFields.length ? (
          <div className="product-details-copy-grid">
            {detailFields.map((field) => (
              <div key={field.label}>
                <h4>{field.label}</h4>
                <p>{field.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="product-details-empty">
            No additional product information.
          </p>
        )}
      </section>

      <section className="product-details-section">
        <h3>Variants and stock</h3>
        {variants.length ? (
          <div className="product-details-variant-list">
            {variants.map((variant, index) => {
              const attributes = getVariantAttributes(variant);

              return (
                <article
                  className="product-details-variant"
                  key={variant.id || `variant-${index}`}
                >
                  <div className="product-details-variant-heading">
                    <h4>{variant.name || `Variant ${index + 1}`}</h4>
                    <span
                      className={
                        variant.is_active === false
                          ? 'is-inactive'
                          : 'is-active'
                      }
                    >
                      {variant.is_active === false ? 'Inactive' : 'Active'}
                    </span>
                  </div>
                  <dl>
                    <div><dt>SKU</dt><dd>{variant.sku || '—'}</dd></div>
                    <div><dt>Price</dt><dd>{formatPrice(variant.price)}</dd></div>
                    <div><dt>Compare-at price</dt><dd>{formatPrice(variant.compare_at_price)}</dd></div>
                    <div><dt>Stock</dt><dd>{variant.stock_quantity ?? 0} units</dd></div>
                  </dl>
                  {attributes.length > 0 && (
                    <div className="product-details-attribute-list">
                      {attributes.map(([key, value]) => (
                        <span key={key}>
                          <strong>{formatAttributeLabel(key)}:</strong>{' '}
                          {formatAttributeValue(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="product-details-empty">
            No product variants have been added.
          </p>
        )}
      </section>

      {approvalError && (
        <div className="error-state product-review-error" role="alert">
          {approvalError}
        </div>
      )}

      <div className="product-details-footer">
        {approvalStatus === 'pending' && (
          <div className="product-details-approval-actions">
            <button
              type="button"
              className="product-review-reject-button"
              onClick={onReject}
              disabled={approvalLoading}
            >
              <XCircle size={15} />
              {approvalLoading ? 'Updating...' : 'Reject'}
            </button>
            <button
              type="button"
              className="product-review-approve-button"
              onClick={onApprove}
              disabled={approvalLoading}
            >
              <CheckCircle2 size={15} />
              {approvalLoading ? 'Updating...' : 'Approve'}
            </button>
          </div>
        )}
        <button
          type="button"
          className="secondary-button"
          onClick={onClose}
        >
          Close
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={onEdit}
        >
          Edit product
        </button>
      </div>
    </div>
  );
}

export default function Products() {
  const fetchBatchSize = 100;
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({
  all: 0,
  approved: 0,
  pending: 0,
  rejected: 0,
});
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [reload, setReload] = useState(0);
  const [viewOnly, setViewOnly] = useState(false);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  const productPageCount = Math.max(
    1,
    Math.ceil(items.length / ADMIN_LIST_PAGE_SIZE)
  );
  const productPage = Math.min(currentPage, productPageCount - 1);
  const pageItems = items.slice(
    productPage * ADMIN_LIST_PAGE_SIZE,
    (productPage + 1) * ADMIN_LIST_PAGE_SIZE
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(blankForm);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [modalApprovalError, setModalApprovalError] = useState('');
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [imageBusyIndex, setImageBusyIndex] = useState(-1);
  const [adjustingVariantIndex, setAdjustingVariantIndex] =
    useState(-1);
  const [stockAdjustmentAction, setStockAdjustmentAction] =
    useState('add');
  const [stockAdjustmentQuantity, setStockAdjustmentQuantity] =
    useState('1');
  const [stockAdjustmentNotes, setStockAdjustmentNotes] =
    useState('');
  const [stockAdjustmentError, setStockAdjustmentError] =
    useState('');
  const [stockAdjustmentLoading, setStockAdjustmentLoading] =
    useState(false);
  const modalProduct = items.find(
    (item) => String(item.id) === String(editingId)
  );
  const modalApprovalStatus =
    modalProduct?.approval_status ||
    (modalProduct?.status === 'active'
      ? 'approved'
      : modalProduct?.status === 'rejected'
        ? 'rejected'
        : 'pending');

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim()),
      300
    );

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;

    async function loadFilterOptions() {
      try {
        const [categoryResult, vendorResult] = await Promise.all([
          getResource('categories'),
          getResource('vendors'),
        ]);
        if (active) {
          setCategories(getCollection(categoryResult));
          setVendors(getCollection(vendorResult));
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.message ||
              'Unable to load product filters.'
          );
        }
      } finally {
        if (active) setFilterOptionsLoading(false);
      }
    }

    loadFilterOptions();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError('');

      try {
        const filters = {
  ...(debouncedSearch
    ? { search: debouncedSearch }
    : {}),
  ...(status ? { status } : {}),
  ...(approvalFilter
    ? { approval_status: approvalFilter }
    : {}),
  ...(categoryFilter
    ? { category_id: categoryFilter }
    : {}),
  ...(vendorFilter ? { vendor_id: vendorFilter } : {}),
  ...(featuredOnly ? { featured: true } : {}),
};
        const firstResult = await getResource('products', {
          ...filters,
          limit: fetchBatchSize,
          offset: 0,
        });
        const firstBatch = getCollection(firstResult);
        const productTotal = Array.isArray(firstResult)
          ? firstBatch.length
          : Number(firstResult?.total) || firstBatch.length;
        const offsets = [];

        for (
          let offset = fetchBatchSize;
          offset < productTotal;
          offset += fetchBatchSize
        ) {
          offsets.push(offset);
        }

        const remainingResults = await Promise.all(
          offsets.map((offset) =>
            getResource('products', {
              ...filters,
              limit: fetchBatchSize,
              offset,
            })
          )
        );
        const allProducts = [
          ...firstBatch,
          ...remainingResults.flatMap(getCollection),
        ];

        if (active) {
          setItems(allProducts);
          setSelectedIds([]);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.message ||
              'Unable to load products.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [
    debouncedSearch,
    status,
    approvalFilter,
    categoryFilter,
    vendorFilter,
    featuredOnly,
    reload,
  ]);

  useEffect(() => {
  let cancelled = false;

  async function loadCounts() {
    try {
      const [allResult, approvedResult, pendingResult, rejectedResult] =
        await Promise.all([
          getResource('products', { limit: 1 }),
          getResource('products', {
            approval_status: 'approved',
            limit: 1,
          }),
          getResource('products', {
            approval_status: 'pending',
            limit: 1,
          }),
          getResource('products', {
            approval_status: 'rejected',
            limit: 1,
          }),
        ]);

      if (cancelled) return;

      setCounts({
        all: Number(allResult?.total ?? 0),
        approved: Number(approvedResult?.total ?? 0),
        pending: Number(pendingResult?.total ?? 0),
        rejected: Number(rejectedResult?.total ?? 0),
      });
    } catch (error) {
      console.error('Unable to load product counts:', error);
    }
  }

  loadCounts();

  return () => {
    cancelled = true;
  };
}, [reload]);

  async function loadFormOptions() {
    setLoadingOptions(true);
    setFormError('');

    try {
      const [categoryResult, vendorResult] =
        await Promise.all([
          getResource('categories'),
          getResource('vendors'),
        ]);

      setCategories(getCollection(categoryResult));
      setVendors(getCollection(vendorResult));
    } catch (requestError) {
      setFormError(
        `Unable to load categories or vendors: ${
          requestError.message
        }`
      );
    } finally {
      setLoadingOptions(false);
    }
  }

  function resetStockAdjustment() {
    setAdjustingVariantIndex(-1);
    setStockAdjustmentAction('add');
    setStockAdjustmentQuantity('1');
    setStockAdjustmentNotes('');
    setStockAdjustmentError('');
  }

  async function openCreate() {
    resetStockAdjustment();
    setEditingId('');
    setViewOnly(false);
    setForm(blankForm());
    setFormError('');
    setModalOpen(true);

    await loadFormOptions();
  }

  async function openEdit(product, readOnly = false) {
    resetStockAdjustment();
    setEditingId(product.id);
    setViewOnly(readOnly);
    setForm(blankForm());
    setFormError('');
    setModalApprovalError('');
    setModalOpen(true);
    setLoadingProduct(true);

    const optionsPromise =
      categories.length && vendors.length
        ? Promise.resolve()
        : loadFormOptions();

    try {
      const detail = await getProduct(product.id);
      setForm(toForm(detail || product));
    } catch (requestError) {
      setFormError(
        requestError.message ||
          'Unable to load product details.'
      );
    } finally {
      setLoadingProduct(false);
    }

    await optionsPromise;
  }

  async function openDuplicate(product) {
    resetStockAdjustment();
    setEditingId('');
    setViewOnly(false);
    setForm(blankForm());
    setFormError('');
    setModalOpen(true);
    setLoadingProduct(true);

    const optionsPromise =
      categories.length && vendors.length
        ? Promise.resolve()
        : loadFormOptions();

    try {
      const detail = await getProduct(product.id);
      const duplicate = toForm(detail || product);
      const copyName = `${duplicate.name || 'Product'} (Copy)`;
      const uniqueSuffix = Date.now().toString(36);
      duplicate.name = copyName;
      duplicate.slug = `${makeSlug(duplicate.slug || duplicate.name)}-${uniqueSuffix}`;
      duplicate.variants = duplicate.variants.map((variant) => {
        const copy = { ...variant };
        delete copy.id;
        return copy;
      });
      setForm(duplicate);
    } catch (requestError) {
      setFormError(
        requestError.message ||
          'Unable to load product for duplication.'
      );
    } finally {
      setLoadingProduct(false);
    }

    await optionsPromise;
  }

  function setField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateVariant(index, field, value) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, i) =>
        i === index
          ? { ...variant, [field]: value }
          : variant
      ),
    }));
  }

  function openStockAdjustment(index) {
    resetStockAdjustment();
    setAdjustingVariantIndex(index);
  }

  async function handleStockAdjustment(index) {
    const variant = form.variants[index];
    const quantity = Number(stockAdjustmentQuantity);
    const currentStock = Number(variant?.stock_quantity ?? 0);

    if (!variant?.id) {
      setStockAdjustmentError(
        'Save this variant before adjusting its stock.'
      );
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setStockAdjustmentError(
        'Enter a positive whole-number quantity.'
      );
      return;
    }

    if (
      stockAdjustmentAction === 'remove' &&
      quantity > currentStock
    ) {
      setStockAdjustmentError(
        'Removal quantity cannot exceed the available stock.'
      );
      return;
    }

    setStockAdjustmentLoading(true);
    setStockAdjustmentError('');

    try {
      await adjustInventoryStock({
        variant_id: variant.id,
        action: stockAdjustmentAction,
        quantity,
        notes: stockAdjustmentNotes.trim() || null,
      });

      const nextStock =
        currentStock +
        (stockAdjustmentAction === 'add' ? quantity : -quantity);
      updateVariant(index, 'stock_quantity', String(nextStock));
      setAdjustingVariantIndex(-1);
      setStockAdjustmentQuantity('1');
      setStockAdjustmentNotes('');
      setReload((current) => current + 1);
    } catch (requestError) {
      setStockAdjustmentError(
        requestError.message ||
          'Unable to adjust stock. Please try again.'
      );
    } finally {
      setStockAdjustmentLoading(false);
    }
  }

  function updateImage(index, field, value) {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, i) => ({
        ...image,
        ...(field === 'is_primary' && value
          ? { is_primary: false }
          : {}),
        ...(i === index ? { [field]: value } : {}),
      })),
    }));
  }

  async function handleImageFile(index, file) {
    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      setFormError('Choose a valid JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image must be 5 MB or smaller.');
      return;
    }

    if (imageBusyIndex !== -1) return;

    if (!editingId) {
      setFormError('Save the product before uploading images.');
      return;
    }

    setImageBusyIndex(index);
    setFormError('');

    try {
      const image = form.images[index];

      const result = image.id
        ? await replaceProductImage(editingId, image.id, file)
        : await addProductImage(editingId, image, file);

      const savedImage = result?.image;

      if (!savedImage?.image_url) {
        throw new Error(
          'The backend did not return the updated image URL.'
        );
      }

      setForm((current) => {
        const nextImages = [...current.images];

        if (savedImage.is_primary) {
          nextImages.forEach((item, i) => {
            if (i !== index) {
              nextImages[i] = {
                ...item,
                is_primary: false,
              };
            }
          });
        }

        nextImages[index] = {
          ...nextImages[index],
          ...savedImage,
          sort_order: String(
            savedImage.sort_order ??
            nextImages[index].sort_order ??
            0
          ),
          is_primary: Boolean(savedImage.is_primary),
        };

        return {
          ...current,
          images: nextImages,
        };
      });
    } catch (error) {
      setFormError(
        error.message || 'Unable to upload product image.'
      );
    } finally {
      setImageBusyIndex(-1);
    }
  }
async function changeApproval(product, approvalStatus) {
  const currentApproval =
    product.approval_status || 'pending';

  if (currentApproval === approvalStatus) {
    return false;
  }

  const actionLabel =
    approvalStatus === 'approved'
      ? 'approve'
      : 'reject';

  if (
    !window.confirm(
      `${actionLabel.charAt(0).toUpperCase()}${actionLabel.slice(
        1
      )} "${product.name || 'this product'}"?`
    )
  ) {
    return false;
  }

  setUpdatingId(product.id);
  setError('');
  setModalApprovalError('');

  try {
    const result = await updateProductApproval(
      product.id,
      approvalStatus
    );

    const updatedProduct =
      result?.product || result?.data || {};

    setItems((current) =>
      current.map((item) =>
        item.id === product.id
          ? {
              ...item,
              ...updatedProduct,
              approval_status: approvalStatus,
              ...(approvalStatus === 'approved'
                ? { status: 'active' }
                : approvalStatus === 'rejected'
                  ? { status: 'rejected' }
                  : {}),
            }
          : item
      )
    );

    setReload((current) => current + 1);
    return true;
  } catch (requestError) {
    const message =
      requestError.message ||
      `Unable to ${actionLabel} product.`;
    setError(
      message
    );
    setModalApprovalError(message);
    return false;
  } finally {
    setUpdatingId('');
  }
}

async function handleModalApproval(approvalStatus) {
  if (!modalProduct) {
    setError('Unable to find this product in the current list.');
    return;
  }

  setModalApprovalError('');
  const updated = await changeApproval(modalProduct, approvalStatus);
  if (updated) setModalOpen(false);
}
  async function changeStatus(product, newStatus) {
  if (newStatus === product.status) return;

  setUpdatingId(product.id);
  setError('');

  try {
    await updateResourceStatus(
      'products',
      product.id,
      newStatus
    );

    setItems((current) =>
      current.map((item) =>
        item.id === product.id
          ? { ...item, status: newStatus }
          : item
      )
    );

    if (status && status !== newStatus) {
      setReload((current) => current + 1);
    }
  } catch (requestError) {
    setError(
      requestError.message ||
        'Unable to update product status.'
    );
    setReload((current) => current + 1);
  } finally {
    setUpdatingId('');
  }
}

function toggleProductSelection(productId) {
  setSelectedIds((current) =>
    current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]
  );
}

function toggleCurrentPageSelection() {
  const pageIds = pageItems.map((item) => item.id);
  const allSelected =
    pageIds.length > 0 &&
    pageIds.every((id) => selectedIds.includes(id));

  setSelectedIds((current) =>
    allSelected
      ? current.filter((id) => !pageIds.includes(id))
      : [...new Set([...current, ...pageIds])]
  );
}

async function saveProduct(event) {

  event.preventDefault();
  setFormError('');

  if (
    !form.name.trim() ||
    !form.slug.trim() ||
    !form.category_id
  ) {
    console.log('2. Product validation failed');

    setFormError(
      'Product name, slug, and category are required.'
    );
    return;
  }

  if (!editingId && !form.vendor_id) {
    setFormError('Select a vendor for this product.');
    return;
  }

  let payload;

  try {

    payload = normalizePayload(form, !editingId);


  } catch (validationError) {
    console.error('Payload validation failed:', validationError);

    setFormError(validationError.message);
    return;
  }

  setSaving(true);
  try {
    if (editingId) {

      await updateProduct(editingId, payload);

    } else {
      await createProduct(payload);
    }

    setModalOpen(false);
    setReload((current) => current + 1);

  } catch (requestError) {
    console.error('Product save failed:', requestError);

    setFormError(
      requestError.message || 'Unable to save product.'
    );
  } finally {
    setSaving(false);
  }
}


  async function handleArchive(product) {
    const confirmed = window.confirm(
      `Archive "${product.name || 'this product'}"? ` +
        'It will remain in the database but will no longer be active.'
    );

    if (!confirmed) return;

    setUpdatingId(product.id);
    setError('');

    try {
      await archiveProduct(product.id);

      setItems((current) =>
        current.map((item) =>
          item.id === product.id
            ? { ...item, status: 'archived' }
            : item
        )
      );

      if (status && status !== 'archived') {
        setReload((current) => current + 1);
      }
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to archive product.'
      );
    } finally {
      setUpdatingId('');
    }
  }

  async function duplicateProduct(product) {
    try {
      resetStockAdjustment();
      const full = await getProduct(product.id);
      const item = full?.data || full || product;
      setEditingId('');
      setViewOnly(false);
      setForm({
        ...blankForm(),
        category_id: item.category_id || '',
        vendor_id: item.vendor_id || '',
        name: `${item.name || ''} (Copy)`.trim(),
        slug: `${item.slug || ''}-copy`.trim().toLowerCase(),
        short_description: item.short_description || '',
        description: item.description || '',
        ingredients: item.ingredients || '',
        benefits: item.benefits || '',
        directions: item.directions || '',
        warnings: item.warnings || '',
        status: 'draft',
        is_featured: false,
        variants:
          Array.isArray(item.variants) && item.variants.length > 0
            ? item.variants.map((v) => ({
                ...v,
                id: null,
                sku: v.sku ? `${v.sku}-COPY` : '',
              }))
            : [blankVariant()],
        images: Array.isArray(item.images)
          ? item.images.map((img) => ({ ...img, id: null }))
          : [],
      });
      setFormError('');
      setModalOpen(true);
      await loadFormOptions();
    } catch (err) {
      setError(err.message || 'Unable to duplicate product.');
    }
  }

  async function handleBulkActionWithValue(action) {
  if (!action || selectedIds.length === 0) return;

  const selectedCount = selectedIds.length;

  let confirmationMessage = '';

  if (action === 'approved') {
    confirmationMessage = `Approve ${selectedCount} selected product${
      selectedCount === 1 ? '' : 's'
    }?`;
  } else if (action === 'rejected') {
    confirmationMessage = `Reject ${selectedCount} selected product${
      selectedCount === 1 ? '' : 's'
    }?`;
  } else if (action === 'archived') {
    confirmationMessage = `Archive ${selectedCount} selected product${
      selectedCount === 1 ? '' : 's'
    }?`;
  }

  if (confirmationMessage && !window.confirm(confirmationMessage)) {
    setBulkAction('');
    return;
  }

  setBulkSaving(true);
  setError('');

  try {
    await Promise.all(
      selectedIds.map((productId) => {
        if (
          action === 'approved' ||
          action === 'rejected'
        ) {
          return updateProductApproval(
            productId,
            action
          );
        }

        if (action === 'archived') {
          return archiveProduct(productId);
        }

        return null;
      })
    );

    setSelectedIds([]);
    setBulkAction('');
    setReload((current) => current + 1);
  } catch (requestError) {
    setError(
      requestError.message ||
        'Unable to update selected products.'
    );

    setReload((current) => current + 1);
  } finally {
    setBulkSaving(false);
  }
}

  const getCategoryBadgeClass = (categoryName = '') => {
    const name = String(categoryName).toLowerCase();
    if (name.includes('skin')) return 'cat-badge-purple';
    if (name.includes('personal')) return 'cat-badge-violet';
    if (name.includes('hair')) return 'cat-badge-green';
    if (name.includes('immunity')) return 'cat-badge-amber';
    return 'cat-badge-teal';
  };

  const getProductSku = (product) => {
    if (product.variants?.[0]?.sku) return product.variants[0].sku;
    if (product.sku) return product.sku;
    const cat = (product.category_name || product.name || 'SKN')
      .replace(/[^A-Za-z]/g, '')
      .slice(0, 3)
      .toUpperCase();
    const idNum = String(product.id || '')
      .replace(/\D/g, '')
      .slice(-3)
      .padStart(3, '0');
    return `${cat}-${idNum || '001'}`;
  };

  return (
    <section className="module-page products-page">
      {/* Hero Banner */}
      <div className="product-hero-card">
        <div className="product-hero-content">
          <span className="product-hero-tag">AUMVEDA HERBAL CATALOG</span>
          <h2>Products &amp; Ayurvedic Formulations</h2>
          <p>
            Manage, update, and organize all products in your Ayurvedic catalog.
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => setReload((current) => current + 1)}
          disabled={loading}
        >
          Refresh
        </button>
      </div>
{/* Product Approval Summary */}
<div className="product-approval-tabs">
  <button
    type="button"
    className={`product-approval-tab all ${
      approvalFilter === '' ? 'active' : ''
    }`}
    onClick={() => {
      setApprovalFilter('');
      setCurrentPage(0);
    }}
  >
    <div className="approval-tab-icon">
      <Package size={20} />
    </div>

    <div className="approval-tab-content">
      <span>All Products</span>
      <strong>{counts.all}</strong>
    </div>
  </button>

  <button
    type="button"
    className={`product-approval-tab approved ${
      approvalFilter === 'approved' ? 'active' : ''
    }`}
    onClick={() => {
      setApprovalFilter('approved');
      setCurrentPage(0);
    }}
  >
    <div className="approval-tab-icon">
      <CheckCircle2 size={20} />
    </div>

    <div className="approval-tab-content">
      <span>Approved</span>
      <strong>{counts.approved}</strong>
    </div>
  </button>

  <button
    type="button"
    className={`product-approval-tab pending ${
      approvalFilter === 'pending' ? 'active' : ''
    }`}
    onClick={() => {
      setApprovalFilter('pending');
      setCurrentPage(0);
    }}
  >
    <div className="approval-tab-icon">
      <Clock3 size={20} />
    </div>

    <div className="approval-tab-content">
      <span>Pending</span>
      <strong>{counts.pending}</strong>
    </div>
  </button>

  <button
    type="button"
    className={`product-approval-tab rejected ${
      approvalFilter === 'rejected' ? 'active' : ''
    }`}
    onClick={() => {
      setApprovalFilter('rejected');
      setCurrentPage(0);
    }}
  >
    <div className="approval-tab-icon">
      <XCircle size={20} />
    </div>

    <div className="approval-tab-content">
      <span>Rejected</span>
      <strong>{counts.rejected}</strong>
    </div>
  </button>
</div>
      {/* Main Filter & Search Toolbar */}
      <div className="products-toolbar">
        <div className="products-search-wrap">
          <Search size={18} className="products-search-icon" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(0);
            }}
            placeholder="Search products by name, SKU, or description..."
            aria-label="Search products"
          />
        </div>

        <div className="products-actions-group">
          <select
            value={categoryFilter}
            disabled={filterOptionsLoading}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setCurrentPage(0);
            }}
            aria-label="Filter by category"
            className="products-select-control"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
  value={status}
  onChange={(event) => {
    setStatus(event.target.value);
    setCurrentPage(0);
  }}
  aria-label="Filter by product status"
  className="products-select-control"
>
  <option value="">All Product Status</option>
  <option value="active">Active</option>
  <option value="draft">Draft</option>
  <option value="rejected">Rejected</option>
  <option value="archived">Archived</option>
</select>

          <select
            value={vendorFilter}
            disabled={filterOptionsLoading}
            onChange={(event) => {
              setVendorFilter(event.target.value);
              setCurrentPage(0);
            }}
            aria-label="Filter by vendor"
            className="products-select-control"
          >
            <option value="">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.business_name ||
                  vendor.name ||
                  vendor.legal_name ||
                  vendor.id}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={`products-funnel-btn ${featuredOnly ? 'is-active' : ''}`}
            onClick={() => {
              setFeaturedOnly((curr) => !curr);
              setCurrentPage(0);
            }}
            title={featuredOnly ? 'Showing Featured only' : 'Filter by featured'}
            aria-label="Filter featured products"
          >
            <Filter size={17} />
          </button>

          <select
  value={bulkAction}
  onChange={(event) => {
    const action = event.target.value;

    if (!action || selectedIds.length === 0) {
      setBulkAction(action);
      return;
    }

    setBulkAction(action);
    handleBulkActionWithValue(action);
  }}
  disabled={bulkSaving || selectedIds.length === 0}
  aria-label="Bulk actions"
  className="products-select-control products-bulk-select"
>
  <option value="">Bulk Actions</option>
  <option value="approved">Approve Selected</option>
  <option value="rejected">Reject Selected</option>
  <option value="archived">Archive Selected</option>
</select>

          <button
            type="button"
            className="products-create-button"
            onClick={openCreate}
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="products-table-card">
        {selectedIds.length > 0 && (
          <div className="products-bulk-indicator">
            <span>
              {selectedIds.length} product
              {selectedIds.length === 1 ? '' : 's'} selected
            </span>
            <button
              type="button"
              className="products-bulk-clear-btn"
              onClick={() => setSelectedIds([])}
            >
              Clear selection
            </button>
          </div>
        )}

        {error && (
          <div className="error-state" role="alert">
            {error}
            <button
              type="button"
              onClick={() => setReload((current) => current + 1)}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">Loading products...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            No products found. Try changing your search or filters.
          </div>
        ) : (
          <div className="products-table-scroll">
            <table className="products-data-table">
              <thead>
                <tr>
                  <th className="th-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        pageItems.length > 0 &&
                        pageItems.every((item) =>
                          selectedIds.includes(item.id)
                        )
                      }
                      onChange={toggleCurrentPageSelection}
                      aria-label="Select all products on this page"
                    />
                  </th>
                  <th className="th-product">PRODUCT</th>
                  <th className="th-vendor">VENDOR</th>
                  <th className="th-sku">SKU</th>
                  <th className="th-category">CATEGORY</th>
                  <th className="th-price">PRICE</th>
                  <th className="th-stock">STOCK</th>
                  <th className="th-rating">RATING</th>
                  <th className="th-featured">FEATURED</th>
                  <th className="th-status">STATUS</th>
                  <th className="th-approval">APPROVAL</th>
                  <th className="th-actions">ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {pageItems.map((product) => {
                  const sku = getProductSku(product);
                  const categoryName = product.category_name || 'General';
                  const badgeClass = getCategoryBadgeClass(categoryName);
                  const price =
                    product.price == null ||
                    !Number.isFinite(Number(product.price))
                      ? '—'
                      : `₹${Number(product.price).toLocaleString('en-IN')}`;
                  const stock = product.stock_quantity ?? 0;
                  const approvalStatus =
  product.approval_status || 'pending';


                  return (
                    <tr
                      key={product.id}
                      className={`product-row-clickable ${
                        selectedIds.includes(product.id)
                          ? 'row-selected'
                          : ''
                      }`}
                      tabIndex={0}
                      aria-label={`Open details for ${product.name || 'product'}`}
                      onClick={() => openEdit(product, true)}
                      onKeyDown={(event) => {
                        if (
                          event.target === event.currentTarget &&
                          (event.key === 'Enter' || event.key === ' ')
                        ) {
                          event.preventDefault();
                          openEdit(product, true);
                        }
                      }}
                    >
                      <td
                        className="td-checkbox"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(product.id)}
                          onChange={() =>
                            toggleProductSelection(product.id)
                          }
                          aria-label={`Select ${product.name || 'product'}`}
                        />
                      </td>

                      <td className="td-product">
                        <div className="product-info-cell">
                          {product.primary_image_url ||
                          product.image_url ? (
                            <img
                              className="product-thumbnail"
                              src={
                                product.primary_image_url ||
                                product.image_url
                              }
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <div className="product-thumbnail product-thumbnail-fallback">
                              <Package size={20} color="#607666" />
                            </div>
                          )}

                          <div className="product-text-meta">
                            <strong className="product-title">
                              {product.name || product.id}
                            </strong>
                            <span className="product-subtitle">
                              {product.short_description ||
                                'Ayurvedic wellness product'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="td-vendor">
                        <div className="vendor-info-cell">
                          <strong className="vendor-name">
                            {product.vendor_business_name ||
                              product.vendor_name ||
                              product.vendor?.business_name ||
                              product.vendor?.name ||
                              product.vendor?.legal_name ||
                              '—'}
                          </strong>
                          {(product.vendor?.email || product.vendor_email) && (
                            <span className="vendor-email">
                              {product.vendor?.email || product.vendor_email}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="td-sku">
                        <span className="sku-badge">{sku}</span>
                      </td>

                      <td className="td-category">
                        <span className={`cat-pill ${badgeClass}`}>
                          {categoryName}
                        </span>
                      </td>

                      <td className="td-price">
                        <strong>{price}</strong>
                      </td>

                      <td className="td-stock">
                        <strong
                          className={
                            Number(stock) > 0 ? 'stock-in' : 'stock-out'
                          }
                        >
                          {stock}
                        </strong>
                      </td>

                      <td className="td-rating">
                        <div className="rating-pill">
                          <Star
                            size={14}
                            className="star-icon"
                            fill="#FBBF24"
                            color="#FBBF24"
                          />
                          <span>
                            {Number(product.average_rating || 0).toFixed(1)}
                          </span>
                        </div>
                      </td>

                      <td className="td-featured">
                        {product.is_featured ? (
                          <span className="featured-pill is-featured">
                            Featured
                          </span>
                        ) : (
                          <span className="featured-pill is-standard">
                            Standard
                          </span>
                        )}
                      </td>

                      <td className="td-status">
                        <div
                          className={`status-pill-wrap status-${product.status || 'draft'}`}
                        >
                          <span className="status-pill-select">
                            {product.status === 'active'
                              ? 'Active'
                              : product.status === 'draft'
                                ? 'Draft'
                                : product.status === 'archived'
                                  ? 'Archived'
                                  : product.status === 'rejected'
                                    ? 'Rejected'
                                    : product.status || '—'}
                          </span>
                        </div>
                      </td>

                      <td className="td-approval">
                        <div
                          className={`status-pill-wrap status-${approvalStatus}`}
                        >
                          {approvalStatus === 'approved' && (
                            <CheckCircle2
                              size={13}
                              className="status-pill-icon"
                            />
                          )}
                          {approvalStatus === 'pending' && (
                            <Clock3
                              size={13}
                              className="status-pill-icon"
                            />
                          )}
                          {approvalStatus === 'rejected' && (
                            <XCircle
                              size={13}
                              className="status-pill-icon"
                            />
                          )}
                          <span className="status-pill-select">
                            {approvalStatus === 'approved'
                              ? 'Approved'
                              : approvalStatus === 'rejected'
                                ? 'Rejected'
                                : 'Pending'}
                          </span>
                        </div>
                      </td>

                      <td
                        className="td-actions"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="product-row-actions">
                          <button
                            type="button"
                            className="action-icon-btn edit-btn"
                            onClick={() => openEdit(product)}
                            disabled={updatingId === product.id}
                            title="Edit product"
                            aria-label={`Edit ${product.name || 'product'}`}
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            className="action-icon-btn archive-btn"
                            onClick={() => handleArchive(product)}
                            disabled={
                              updatingId === product.id ||
                              product.status === 'archived'
                            }
                            title={
                              product.status === 'archived'
                                ? 'Product already archived'
                                : 'Archive product'
                            }
                            aria-label={`Archive ${product.name || 'product'}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          totalItems={items.length}
          currentPage={productPage}
          pageSize={ADMIN_LIST_PAGE_SIZE}
          onPageChange={setCurrentPage}
          loading={loading}
          itemLabel="products"
        />
      </div>

      {modalOpen && (
        <div
          className="product-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving &&
              !stockAdjustmentLoading
            ) {
              setModalOpen(false);
            }
          }}
        >
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <div className="product-modal-header">
              <div>
                <h3 id="product-modal-title">
                  {viewOnly
                    ? 'Product details'
                    : editingId
                      ? 'Edit product'
                      : 'Add product'}
                </h3>
                <p>
                  {viewOnly
                    ? 'Product information, images, variants and stock.'
                    : 'Enter the catalog details and variant inventory.'}
                </p>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={() => setModalOpen(false)}
                disabled={
                  saving ||
                  stockAdjustmentLoading ||
                  imageBusyIndex !== -1
                }
                aria-label="Close product form"
              >
                ×
              </button>
            </div>

            {loadingProduct || loadingOptions ? (
              <div className="loading-state">
                Loading product form...
              </div>
            ) : viewOnly ? (
              <ProductDetailsView
                product={form}
                categories={categories}
                vendors={vendors}
                approvalStatus={modalApprovalStatus}
                approvalLoading={updatingId === editingId}
                approvalError={modalApprovalError}
                onClose={() => setModalOpen(false)}
                onEdit={() => openEdit({ id: editingId })}
                onApprove={() => handleModalApproval('approved')}
                onReject={() => handleModalApproval('rejected')}
              />
            ) : (
              <form
                className="product-form"
                onSubmit={saveProduct}
              >
                {formError && (
                  <div className="error-state" role="alert">
                    {formError}
                  </div>
                )}

                <div className="product-form-grid">
                  {!editingId && (
                    <label>
                      Vendor
                      <select
                        value={form.vendor_id}
                        onChange={(event) =>
                          setField(
                            'vendor_id',
                            event.target.value
                          )
                        }
                        required
                      >
                        <option value="">
                          Select vendor
                        </option>

                        {vendors.map((vendor) => (
                          <option
                            key={vendor.id}
                            value={vendor.id}
                          >
                            {vendor.business_name ||
                              vendor.name ||
                              vendor.legal_name ||
                              vendor.id}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <label>
                    Category
                    <select
                      value={form.category_id}
                      onChange={(event) =>
                        setField(
                          'category_id',
                          event.target.value
                        )
                      }
                      required
                    >
                      <option value="">
                        Select category
                      </option>

                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Product name
                    <input
                      value={form.name}
                      onChange={(event) => {
                        const value = event.target.value;

                        setForm((current) => ({
                          ...current,
                          name: value,
                          ...(!editingId && !current.slug
                            ? { slug: makeSlug(value) }
                            : {}),
                        }));
                      }}
                      required
                      maxLength={255}
                    />
                  </label>

                  <label>
                    Slug
                    <input
                      value={form.slug}
                      onChange={(event) =>
                        setField(
                          'slug',
                          makeSlug(event.target.value)
                        )
                      }
                      required
                      maxLength={255}
                    />
                  </label>

                  <label>
                    Status
                    <select
                      value={form.status || 'draft'}
                      onChange={(event) =>
                        setField('status', event.target.value)
                      }
                    >
                      {statuses.map((value) => (
                        <option key={value} value={value}>
                          {value.charAt(0).toUpperCase() +
                            value.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="product-checkbox-label">
                    <input
                      type="checkbox"
                      checked={Boolean(form.is_featured)}
                      onChange={(event) =>
                        setField(
                          'is_featured',
                          event.target.checked
                        )
                      }
                    />
                    Featured product
                  </label>

                  <label className="product-form-full">
                    Short description
                    <textarea
                      rows="2"
                      value={form.short_description || ''}
                      onChange={(event) =>
                        setField(
                          'short_description',
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label className="product-form-full">
                    Description
                    <textarea
                      rows="3"
                      value={form.description || ''}
                      onChange={(event) =>
                        setField(
                          'description',
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Ingredients
                    <textarea
                      rows="2"
                      value={form.ingredients || ''}
                      onChange={(event) =>
                        setField(
                          'ingredients',
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Benefits
                    <textarea
                      rows="2"
                      value={form.benefits || ''}
                      onChange={(event) =>
                        setField(
                          'benefits',
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Directions
                    <textarea
                      rows="2"
                      value={form.directions || ''}
                      onChange={(event) =>
                        setField(
                          'directions',
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Warnings
                    <textarea
                      rows="2"
                      value={form.warnings || ''}
                      onChange={(event) =>
                        setField(
                          'warnings',
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>

                <div className="product-form-section-heading">
                  <div>
                    <h4>Variants & pricing</h4>
                    <p>
                      Add a variant for each size or pack
                      option.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        variants: [
                          ...current.variants,
                          blankVariant(),
                        ],
                      }))
                    }
                  >
                    + Add variant
                  </button>
                </div>

                {form.variants.map((variant, index) => (
                  <div
                    className="product-editor-card"
                    key={`variant-${index}`}
                  >
                    <div className="product-editor-card-heading">
                      <strong>Variant {index + 1}</strong>

                      <button
                        type="button"
                        className="text-danger-button"
                        disabled={
                          stockAdjustmentLoading ||
                          adjustingVariantIndex !== -1
                        }
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            variants:
                              current.variants.filter(
                                (_, i) => i !== index
                              ),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>

                    <div className="product-form-grid">
                      <label>
                        Variant name / size
                        <input
                          value={variant.name}
                          onChange={(event) =>
                            updateVariant(
                              index,
                              'name',
                              event.target.value
                            )
                          }
                          placeholder="e.g. 100 g"
                        />
                      </label>

                      <label>
                        SKU
                        <input
                          value={variant.sku}
                          onChange={(event) =>
                            updateVariant(
                              index,
                              'sku',
                              event.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        Price
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={variant.price}
                          onChange={(event) =>
                            updateVariant(
                              index,
                              'price',
                              event.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        Compare-at price
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={variant.compare_at_price}
                          onChange={(event) =>
                            updateVariant(
                              index,
                              'compare_at_price',
                              event.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        Cost price
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={variant.cost_price}
                          onChange={(event) =>
                            updateVariant(
                              index,
                              'cost_price',
                              event.target.value
                            )
                          }
                        />
                      </label>

                      {variant.id ? (
                        <div className="product-stock-field">
                          <label>
                            Current stock
                            <input
                              type="number"
                              value={variant.stock_quantity}
                              readOnly
                            />
                          </label>
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={
                              saving || stockAdjustmentLoading
                            }
                            onClick={() =>
                              openStockAdjustment(index)
                            }
                          >
                            Adjust stock
                          </button>
                        </div>
                      ) : (
                        <label>
                          Initial stock quantity
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={variant.stock_quantity}
                            onChange={(event) =>
                              updateVariant(
                                index,
                                'stock_quantity',
                                event.target.value
                              )
                            }
                          />
                        </label>
                      )}

                      {adjustingVariantIndex === index && (
                        <div className="product-stock-adjustment product-form-full">
                          <strong>Stock adjustment</strong>
                          <div className="product-stock-adjustment-grid">
                            <label>
                              Adjustment type
                              <select
                                value={stockAdjustmentAction}
                                onChange={(event) =>
                                  setStockAdjustmentAction(
                                    event.target.value
                                  )
                                }
                                disabled={stockAdjustmentLoading}
                              >
                                <option value="add">Add stock</option>
                                <option value="remove">Remove stock</option>
                              </select>
                            </label>
                            <label>
                              Quantity
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={stockAdjustmentQuantity}
                                onChange={(event) =>
                                  setStockAdjustmentQuantity(
                                    event.target.value
                                  )
                                }
                                disabled={stockAdjustmentLoading}
                              />
                            </label>
                            <label className="product-stock-adjustment-notes">
                              Reason / Notes
                              <input
                                value={stockAdjustmentNotes}
                                onChange={(event) =>
                                  setStockAdjustmentNotes(
                                    event.target.value
                                  )
                                }
                                maxLength={500}
                                disabled={stockAdjustmentLoading}
                                placeholder="Optional reason for this adjustment"
                              />
                            </label>
                          </div>
                          {stockAdjustmentError && (
                            <div className="error-state" role="alert">
                              {stockAdjustmentError}
                            </div>
                          )}
                          <div className="product-stock-adjustment-actions">
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={resetStockAdjustment}
                              disabled={stockAdjustmentLoading}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="primary-button"
                              onClick={() =>
                                handleStockAdjustment(index)
                              }
                              disabled={stockAdjustmentLoading || saving}
                            >
                              {stockAdjustmentLoading
                                ? 'Saving...'
                                : 'Save adjustment'}
                            </button>
                          </div>
                        </div>
                      )}

                      <label className="product-form-full">
                        Attributes (JSON object)
                        <textarea
                          rows="2"
                          value={variant.attributesText}
                          onChange={(event) =>
                            updateVariant(
                              index,
                              'attributesText',
                              event.target.value
                            )
                          }
                          placeholder={'{ "weight": "100 g" }'}
                        />
                      </label>

                      <label className="product-checkbox-label">
                        <input
                          type="checkbox"
                          checked={variant.is_active}
                          onChange={(event) =>
                            updateVariant(
                              index,
                              'is_active',
                              event.target.checked
                            )
                          }
                        />
                        Variant active
                      </label>
                    </div>
                  </div>
                ))}

                <div className="product-form-section-heading">
                  <div>
                    <h4>Product images</h4>
                    <p>
                      Paste an image URL or upload an image file.
                      Save the product before uploading files.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={imageBusyIndex !== -1}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        images: [
                          ...current.images,
                          blankImage(),
                        ],
                      }))
                    }
                  >
                    + Add image
                  </button>
                </div>

                {form.images.map((image, index) => (
                  <div
                    className="product-editor-card"
                    key={`image-${index}`}
                  >
                    <div className="product-editor-card-heading">
                      <strong>Image {index + 1}</strong>

                      <button
                        type="button"
                        className="text-danger-button"
                        disabled={imageBusyIndex !== -1}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            images: current.images.filter(
                              (_, i) => i !== index
                            ),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>

                    <div className="product-form-grid">
                      <label className="product-form-full">
                        Image URL
                        <input
                          type="url"
                          value={image.image_url}
                          onChange={(event) =>
                            updateImage(
                              index,
                              'image_url',
                              event.target.value
                            )
                          }
                          placeholder="https://..."
                        />
                      </label>

                      <label className="product-image-upload-label">
                        {image.id
                          ? 'Replace image file'
                          : 'Upload new image file'}

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={imageBusyIndex !== -1 || !editingId}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            handleImageFile(index, file);
                            event.target.value = '';
                          }}
                        />

                        {imageBusyIndex === index && (
                          <small role="status">
                            Uploading image and updating product record...
                          </small>
                        )}

                        {image.image_url && (
                          <img
                            className="product-image-preview"
                            src={image.image_url}
                            alt={
                              image.alt_text ||
                              `Product image ${index + 1}`
                            }
                          />
                        )}
                      </label>

                      <label>
                        Alt text
                        <input
                          value={image.alt_text}
                          onChange={(event) =>
                            updateImage(
                              index,
                              'alt_text',
                              event.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        Sort order
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={image.sort_order}
                          onChange={(event) =>
                            updateImage(
                              index,
                              'sort_order',
                              event.target.value
                            )
                          }
                        />
                      </label>

                      <label className="product-checkbox-label">
                        <input
                          type="checkbox"
                          checked={image.is_primary}
                          onChange={(event) =>
                            updateImage(
                              index,
                              'is_primary',
                              event.target.checked
                            )
                          }
                        />
                        Primary image
                      </label>
                    </div>
                  </div>
                ))}
                <div className="product-form-footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setModalOpen(false)}
                    disabled={
                      saving ||
                      stockAdjustmentLoading ||
                      imageBusyIndex !== -1
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      saving ||
                      stockAdjustmentLoading ||
                      adjustingVariantIndex !== -1 ||
                      imageBusyIndex !== -1
                    }
                  >
                    {saving
                      ? 'Saving...'
                      : editingId
                        ? 'Save changes'
                        : 'Create product'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      <style>{`
        .products-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
        }

        /* Hero Banner */
       .product-hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 120px;
  padding: 24px 26px;
  margin-bottom: 4px;
  border: 1px solid #c8ddc8;
  border-radius: 16px;
  background:
    radial-gradient(
      circle at 85% 20%,
      rgba(188, 221, 190, 0.35),
      transparent 35%
    ),
    linear-gradient(
      135deg,
      #f7fbf6 0%,
      #eaf4e8 100%
    );
  box-sizing: border-box;
}

.product-hero-content {
  min-width: 0;
}

.product-hero-tag {
  display: block;
  margin-bottom: 7px;
  color: #276345;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.product-hero-content h2 {
  margin: 0;
  color: #143b28;
  font-size: 22px;
  line-height: 1.25;
}

.product-hero-content p {
  margin: 7px 0 0;
  color: #607565;
  font-size: 12px;
}

.product-hero-card .primary-button {
  flex-shrink: 0;
  min-width: 92px;
}
        /* Toolbar Row */
        .product-hero-card {
          flex-wrap: wrap;
        }

        .products-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  margin-bottom: 14px;
  border: 1px solid #dce8dc;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 3px 12px rgba(18, 61, 43, 0.04);
}

.products-search-wrap {
  position: relative;
  flex: 1;
  min-width: 280px;
}

.products-search-wrap input {
  width: 100%;
  height: 42px;
  padding: 0 14px 0 40px;
  border: 1px solid #d5e4d2;
  border-radius: 11px;
  background: #fbfdfb;
  color: #173f2d;
  font-size: 13px;
  box-sizing: border-box;
}

.products-actions-group {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: nowrap;
}

.products-select-control {
  height: 42px;
  padding: 0 13px;
  border: 1px solid #d5e4d2;
  border-radius: 11px;
  background: #ffffff;
  color: #22422e;
  font-size: 12px;
  font-weight: 600;
}

.products-bulk-select {
  min-width: 145px;
}

.products-create-button {
  height: 42px;
  padding: 0 17px;
  border-radius: 11px;
  white-space: nowrap;
}

        .products-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #718475;
          pointer-events: none;
        }

        .products-search-wrap input {
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

        .products-search-wrap input:focus {
          border-color: #276345;
          outline: none;
          box-shadow: 0 0 0 3px rgba(39, 99, 69, 0.12);
        }

        .products-actions-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .products-select-control {
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

        .products-select-control:focus {
          border-color: #276345;
          box-shadow: 0 0 0 2px rgba(39, 99, 69, 0.1);
        }

        .products-bulk-select {
          min-width: 130px;
        }

        .products-funnel-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 11px;
          border: 1px solid #D5E4D2;
          background: #FFFFFF;
          color: #22422E;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .products-funnel-btn:hover,
        .products-funnel-btn.is-active {
          border-color: #276345;
          background: #E8F5E9;
          color: #15803D;
        }

        .products-create-button {
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

        .products-create-button:hover {
          background: #113417;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(23, 63, 29, 0.28);
        }

        /* Products Table Card */
        .products-table-card {
          border-radius: 16px;
          background: #FFFFFF;
          border: 1px solid #E1EBE0;
          overflow: hidden;
          box-shadow: 0 1px 6px rgba(18, 61, 43, 0.03);
        }

        .products-bulk-indicator {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 18px;
          background: #E8F5E9;
          border-bottom: 1px solid #C8E6C9;
          color: #166534;
          font-size: 12.5px;
          font-weight: 600;
        }

        .products-bulk-clear-btn {
          background: none;
          border: none;
          color: #15803D;
          text-decoration: underline;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .products-table-scroll {
          width: 100%;
          overflow-x: auto;
        }

        .products-data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .products-data-table thead {
          background: #E8F0E4;
        }

        .products-data-table th {
          padding: 12px 14px;
          color: #22422E;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border-bottom: 1px solid #DCE6D9;
          white-space: nowrap;
        }

        .products-data-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #EEF3ED;
          vertical-align: middle;
          color: #374151;
          font-size: 13px;
          background: #FFFFFF;
        }

        .products-data-table tr:hover td {
          background: #FAFDF9;
        }

        .products-data-table tr.product-row-clickable {
          cursor: pointer;
        }

        .products-data-table tr.product-row-clickable:focus-visible {
          outline: 2px solid #276345;
          outline-offset: -2px;
        }

        .products-data-table tr.row-selected td {
          background: #F2F8F1;
        }

        .products-data-table input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: var(--brand-deep);
          cursor: pointer;
          border-radius: 4px;
        }

        .th-checkbox, .td-checkbox {
          width: 44px;
          text-align: center;
          padding-left: 18px !important;
        }

        .product-info-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 220px;
        }

        .vendor-info-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 150px;
          max-width: 190px;
        }

        .vendor-name {
          color: var(--brand-primary);
          font-size: 12.5px;
          font-weight: 650;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .vendor-email {
          color: #718475;
          font-size: 10.5px;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-thumbnail {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          object-fit: cover;
          background: #F3F7F2;
          border: 1px solid #E2ECE0;
          flex-shrink: 0;
        }

        .product-thumbnail-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #EDF4EC;
        }

        .product-text-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .product-title {
          color: var(--brand-primary);
          font-size: 13.5px;
          font-weight: 700;
          line-height: 1.3;
        }

        .product-subtitle {
          color: #718475;
          font-size: 11.5px;
          line-height: 1.3;
          max-width: 240px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sku-badge {
          color: #374151;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        /* Category Pastel Badges */
        .cat-pill {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 11.5px;
          font-weight: 500;
          white-space: nowrap;
        }

        .cat-badge-purple {
          background: #F3E8FF;
          color: #7E22CE;
        }

        .cat-badge-violet {
          background: #EDE9FE;
          color: #6D28D9;
        }

        .cat-badge-green {
          background: #DCFCE7;
          color: #15803D;
        }

        .cat-badge-amber {
          background: #FEF3C7;
          color: #B45309;
        }

        .cat-badge-teal {
          background: #CCFBF1;
          color: #0F766E;
        }

        .td-price strong {
          color: var(--brand-primary);
          font-weight: 700;
          font-size: 13.5px;
        }

        .td-stock strong {
          font-size: 13.5px;
          font-weight: 700;
        }

        .stock-in {
          color: #15803D;
        }

        .stock-out {
          color: #DC2626;
        }

        /* Rating pill */
        .rating-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12.5px;
          font-weight: 600;
          color: #374151;
        }

        .star-icon {
          flex-shrink: 0;
        }

        /* Featured pill */
        .featured-pill {
          display: inline-block;
          padding: 3px 12px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .featured-pill.is-standard {
          background: #F3F4F6;
          color: #4B5563;
          border: 1px solid #E5E7EB;
        }

        .featured-pill.is-featured {
          background: #1F4D32;
          color: #FFFFFF;
        }

        /* Status pill */
        .status-pill-wrap {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          background: #DCFCE7;
          border: 1px solid #BBF7D0;
          color: #15803D;
          font-size: 12px;
          font-weight: 600;
        }

        .status-pill-wrap.status-pending {
          background: #FEF3C7;
          border-color: #FDE68A;
          color: #B45309;
        }

        .status-pill-wrap.status-draft {
          background: #F3F4F6;
          border-color: #E5E7EB;
          color: #6B7280;
        }

        .status-pill-wrap.status-archived {
          background: #FEE2E2;
          border-color: #FECACA;
          color: #B91C1C;
        }

        .status-pill-icon {
          flex-shrink: 0;
        }

        /* Seamless Single-Layer Select Inside Status Pill (No Double Border) */
        .products-page .status-pill-wrap select.status-pill-select,
        .status-pill-wrap select {
          appearance: none !important;
          -webkit-appearance: none !important;
          border: none !important;
          background: transparent !important;
          background-color: transparent !important;
          box-shadow: none !important;
          outline: none !important;
          border-radius: 0 !important;
          color: inherit !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          padding: 0 16px 0 2px !important;
          margin: 0 !important;
          height: auto !important;
          line-height: inherit !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2315803D' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 0 center !important;
          background-size: 10px !important;
        }

        .status-pill-wrap.status-pending select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23B45309' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;
        }

        .status-pill-wrap.status-draft select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;
        }

        .status-pill-wrap.status-archived select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23B91C1C' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;
        }

        /* Action Buttons */
        .product-action-btn-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .action-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #DCE6D9;
          background: #FFFFFF;
          color: #2D4C38;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-icon-btn:hover {
          background: #EAF4EA;
          border-color: #276345;
          color: var(--brand-primary);
        }

        .action-icon-btn.delete-btn {
          border-color: #FED7D7;
          color: #E53E3E;
        }

        .action-icon-btn.delete-btn:hover {
          background: #FFF5F5;
          border-color: #E53E3E;
          color: #C53030;
        }

        .action-icon-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .empty-state, .loading-state {
          padding: 48px 24px;
          text-align: center;
          color: #718475;
          font-size: 13.5px;
        }

        @media (max-width: 640px) {
          .products-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .products-actions-group {
            width: 100%;
            justify-content: space-between;
          }
          .products-select-control {
            flex: 1 1 120px;
          }
        }

        .product-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 24px;
          overflow-y: auto;
          background: rgba(18, 61, 43, 0.45);
          backdrop-filter: blur(8px);
        }

        .product-modal {
          width: min(100%, 980px);
          max-height: none;
          margin: auto;
          overflow: hidden;
          border-radius: 20px;
          background: #FFFFFF;
          border: 1px solid #E2ECE0;
          box-shadow: 0 24px 70px rgba(18, 61, 43, 0.2);
        }

        .product-modal-header {
          position: sticky;
          top: 0;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          padding: 24px 28px;
          border-bottom: 1px solid #EDF3EC;
          background: #FFFFFF;
        }

        .product-modal-header h3 {
          margin: 0;
          color: var(--brand-primary);
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
        }

        .product-modal-header p {
          margin: 6px 0 0;
          color: #716F68;
          font-size: 13px;
        }

        .modal-close-button {
          width: 36px;
          height: 36px;
          border: 1px solid #D5E4D2;
          border-radius: 10px;
          background: var(--page-background);
          color: var(--brand-primary);
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: background 0.15s;
        }

        .modal-close-button:hover {
          background: #E8F2E7;
        }

        .product-form {
          padding: 24px 28px 28px;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
        }

        .product-details-view {
          padding: 24px 28px 28px;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          color: var(--brand-primary);
        }

        .product-details-hero {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
          gap: 28px;
          align-items: start;
        }

        .product-details-media {
          min-width: 0;
        }

        .product-details-media > img,
        .product-details-image-fallback {
          display: grid;
          place-items: center;
          width: 100%;
          aspect-ratio: 1 / 1;
          max-height: 420px;
          border: 1px solid #E2ECE0;
          border-radius: 16px;
          background: #F7FAF6;
          object-fit: contain;
          color: #7A8F7C;
        }

        .product-details-thumbnails {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          overflow-x: auto;
        }

        .product-details-thumbnails img {
          width: 58px;
          height: 58px;
          flex: 0 0 58px;
          border: 1px solid #DCE9D9;
          border-radius: 9px;
          object-fit: cover;
        }

        .product-details-overview {
          min-width: 0;
          padding-top: 4px;
        }

        .product-details-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 14px;
        }

        .product-details-badges > span {
          display: inline-flex;
          align-items: center;
          min-height: 27px;
          padding: 4px 10px;
          border: 1px solid #DCE9D9;
          border-radius: 999px;
          background: #F7FAF6;
          color: #345640;
          font-size: 11px;
          font-weight: 650;
          text-transform: capitalize;
        }

        .product-details-badges .product-detail-status.status-active {
          border-color: #BBF7D0;
          background: #DCFCE7;
          color: #15803D;
        }

        .product-details-badges .product-detail-status.status-pending {
          border-color: #FDE68A;
          background: #FEF3C7;
          color: #B45309;
        }

        .product-details-badges .product-detail-status.status-rejected,
        .product-details-badges .product-detail-status.status-archived,
        .product-details-badges .product-detail-status.status-draft {
          border-color: #E5E7EB;
          background: #F3F4F6;
          color: #4B5563;
        }

        .product-details-overview h2 {
          margin: 0;
          color: var(--brand-primary);
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(24px, 3vw, 34px);
          line-height: 1.2;
        }

        .product-details-short-description {
          margin: 10px 0 0;
          color: #647568;
          font-size: 14px;
          line-height: 1.6;
        }

        .product-details-price {
          margin-top: 18px;
          color: var(--brand-deep);
          font-size: 25px;
          font-weight: 750;
        }

        .product-details-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .product-details-meta > div {
          min-width: 0;
          padding: 12px;
          border: 1px solid #E4ECE1;
          border-radius: 10px;
          background: #FBFCFA;
        }

        .product-details-meta span {
          display: block;
          margin-bottom: 5px;
          color: #718475;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .product-details-meta strong {
          display: block;
          overflow-wrap: anywhere;
          color: #264331;
          font-size: 12px;
        }

        .product-details-section {
          margin-top: 26px;
        }

        .product-details-section > h3 {
          margin: 0 0 12px;
          padding-bottom: 9px;
          border-bottom: 1px solid #E7EEE5;
          color: var(--brand-primary);
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18px;
        }

        .product-details-copy-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .product-details-copy-grid > div {
          padding: 14px;
          border: 1px solid #E4ECE1;
          border-radius: 10px;
          background: #FBFCFA;
        }

        .product-details-copy-grid h4 {
          margin: 0 0 6px;
          color: #355840;
          font-size: 12px;
        }

        .product-details-copy-grid p,
        .product-details-empty {
          margin: 0;
          color: #617267;
          font-size: 13px;
          line-height: 1.65;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .product-details-variant-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .product-details-variant {
          min-width: 0;
          padding: 14px;
          border: 1px solid #E2ECE0;
          border-radius: 12px;
          background: #FBFCFA;
        }

        .product-details-variant-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .product-details-variant-heading h4 {
          margin: 0;
          color: #22422E;
          font-size: 13px;
        }

        .product-details-variant-heading span {
          font-size: 11px;
          font-weight: 650;
        }

        .product-details-variant-heading .is-active {
          color: #15803D;
        }

        .product-details-variant-heading .is-inactive {
          color: #A33D2A;
        }

        .product-details-variant dl {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin: 14px 0 0;
        }

        .product-details-variant dl > div {
          min-width: 0;
        }

        .product-details-variant dt {
          color: #718475;
          font-size: 10px;
          text-transform: uppercase;
        }

        .product-details-variant dd {
          margin: 3px 0 0;
          color: #264331;
          font-size: 12px;
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        .product-details-attribute-list {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 12px;
        }

        .product-details-attribute-list > span {
          padding: 6px 9px;
          border: 1px solid #E2ECE0;
          border-radius: 7px;
          background: #F7FAF6;
          color: #617267;
          font-size: 11px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .product-details-attribute-list strong {
          color: #355840;
        }

        .product-details-footer {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #E7EEE5;
        }

        .product-details-approval-actions {
          display: flex;
          gap: 8px;
          margin-right: auto;
        }

        .product-review-approve-button,
        .product-review-reject-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 38px;
          padding: 0 14px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .product-review-approve-button {
          border: 1px solid #287653;
          background: #287653;
          color: #FFFFFF;
        }

        .product-review-reject-button {
          border: 1px solid #E1B7B3;
          background: #FFFFFF;
          color: #A3332A;
        }

        .product-review-approve-button:disabled,
        .product-review-reject-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .product-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .product-form label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: var(--brand-primary);
          font-size: 12px;
          font-weight: 600;
          min-width: 0;
        }

        .product-form input:not([type="checkbox"]),
        .product-form select,
        .product-form textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #D5E4D2;
          border-radius: 10px;
          padding: 11px 13px;
          background: #FFFFFF;
          color: var(--brand-primary);
          font: inherit;
          font-size: 13px;
          font-weight: 400;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .product-form input:not([type="checkbox"]):focus,
        .product-form select:focus,
        .product-form textarea:focus {
          border-color: #276345;
          box-shadow: 0 0 0 3px rgba(39, 99, 69, 0.14);
          outline: none;
        }

        .product-form textarea {
          resize: vertical;
        }

        .product-form-full {
          grid-column: 1 / -1;
        }

        .product-form .product-checkbox-label {
          flex-direction: row;
          align-items: center;
          gap: 10px;
          min-height: 40px;
          cursor: pointer;
        }

        .product-form .product-checkbox-label input {
          accent-color: var(--brand-primary);
          width: 17px;
          height: 17px;
        }

        .product-form-section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin: 28px 0 14px;
          padding-bottom: 12px;
          border-bottom: 1px solid #EDF3EC;
        }

        .product-form-section-heading h4 {
          margin: 0;
          color: var(--brand-primary);
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 16px;
          font-weight: 700;
        }

        .product-form-section-heading p {
          margin: 4px 0 0;
          color: #716F68;
          font-size: 12px;
        }

        .product-editor-card {
          margin-bottom: 16px;
          padding: 20px 22px;
          border: 1px solid #E2ECE0;
          border-radius: 16px;
          background: #FFFFFF;
          box-shadow: 0 2px 10px rgba(18, 61, 43, 0.03);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .product-editor-card:hover {
          border-color: #BED8BD;
          box-shadow: 0 6px 18px rgba(18, 61, 43, 0.06);
        }

        .product-stock-field {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          min-width: 0;
        }

        .product-stock-field label {
          flex: 1;
          min-width: 0;
        }

        .product-stock-field button {
          min-height: 40px;
          white-space: nowrap;
        }

        .product-stock-adjustment {
          padding: 16px;
          border: 1px solid #DCE9D9;
          border-radius: 12px;
          background: #F7FAF6;
        }

        .product-stock-adjustment > strong {
          display: block;
          margin-bottom: 12px;
          color: var(--brand-primary);
          font-size: 13px;
        }

        .product-stock-adjustment-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .product-stock-adjustment-notes {
          grid-column: 1 / -1;
        }

        .product-stock-adjustment-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 12px;
        }

        .product-image-upload-label {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .product-image-upload-label input[type="file"] {
          width: 100%;
          padding: 12px;
          border: 1.5px dashed #CDE2CB;
          border-radius: 10px;
          background: var(--page-background);
          cursor: pointer;
          color: var(--brand-primary);
          font-size: 12.5px;
          transition: border-color 0.18s, background-color 0.18s;
        }

        .product-image-upload-label input[type="file"]:hover {
          border-color: #276345;
          background: #F0F6EF;
        }

        .product-image-preview {
          width: 120px;
          height: 120px;
          object-fit: contain;
          padding: 6px;
          border: 1px solid #E2ECE0;
          border-radius: 10px;
          background: #FFFFFF;
          box-shadow: 0 2px 8px rgba(18, 61, 43, 0.04);
        }

        .product-image-upload-label small {
          color: #5F6E64;
          font-size: 12px;
        }

        .product-editor-card-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          color: var(--brand-primary);
          font-size: 13.5px;
          font-weight: 700;
        }

        .product-form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 22px;
          margin-top: 22px;
          border-top: 1px solid #EDF3EC;
        }

        @media (max-width: 700px) {
          .products-page .module-toolbar select {
            flex: 1 1 140px;
          }

          .products-page .data-table th,
          .products-page .data-table td {
            padding: 12px;
          }

          .products-intro-actions {
            width: 100%;
            justify-content: space-between;
          }

          .product-modal-backdrop {
            padding: 10px;
          }

          .product-modal {
            border-radius: 14px;
          }

          .product-modal-header,
          .product-form,
          .product-details-view {
            padding-left: 18px;
            padding-right: 18px;
          }

          .product-details-hero {
            grid-template-columns: minmax(0, 1fr);
            gap: 18px;
          }

          .product-details-media > img,
          .product-details-image-fallback {
            max-height: 320px;
          }

          .product-details-copy-grid,
          .product-details-variant-list {
            grid-template-columns: minmax(0, 1fr);
          }

          .product-form-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .product-stock-field {
            align-items: stretch;
            flex-direction: column;
          }

          .product-stock-adjustment-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .product-stock-adjustment-notes {
            grid-column: auto;
          }

          .product-form-full {
            grid-column: auto;
          }

          .product-form-section-heading {
            align-items: flex-start;
          }
        }
      /* =========================================
   PRODUCT APPROVAL SUMMARY
========================================= */

.product-approval-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 20px 0;
}

.product-approval-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 88px;
  padding: 16px 18px;
  border: 1px solid #dce8dc;
  border-radius: 16px;
  background: #ffffff;
  color: #173f2d;
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.product-approval-tab:hover {
  transform: translateY(-2px);
  border-color: #b9d5bd;
  box-shadow: 0 8px 20px rgba(25, 70, 45, 0.08);
}

.product-approval-tab.active {
  border-color: #276345;
  box-shadow: 0 8px 22px rgba(39, 99, 69, 0.12);
}

/* Icon */

.approval-tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  border-radius: 13px;
}

.approval-tab-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.approval-tab-content span {
  font-size: 12px;
  font-weight: 600;
  color: #668070;
}

.approval-tab-content strong {
  font-size: 25px;
  line-height: 1;
  font-weight: 700;
  color: #173f2d;
}

/* All */

.product-approval-tab.all {
  background: linear-gradient(
    135deg,
    #f3faf4 0%,
    #ffffff 100%
  );
}

.product-approval-tab.all .approval-tab-icon {
  background: #e1f3e5;
  color: #276345;
}

.product-approval-tab.all.active {
  background: #edf8ef;
}

/* Approved */

.product-approval-tab.approved {
  background: linear-gradient(
    135deg,
    #f2fbf4 0%,
    #ffffff 100%
  );
}

.product-approval-tab.approved .approval-tab-icon {
  background: #d9f3df;
  color: #15803d;
}

.product-approval-tab.approved.active {
  background: #eaf8ed;
  border-color: #9ed4aa;
}

/* Pending */

.product-approval-tab.pending {
  background: linear-gradient(
    135deg,
    #fffaf0 0%,
    #ffffff 100%
  );
}

.product-approval-tab.pending .approval-tab-icon {
  background: #fff0c9;
  color: #c47b00;
}

.product-approval-tab.pending.active {
  background: #fff8e7;
  border-color: #e8ca82;
}

/* Rejected */

.product-approval-tab.rejected {
  background: linear-gradient(
    135deg,
    #fff5f4 0%,
    #ffffff 100%
  );
}

.product-approval-tab.rejected .approval-tab-icon {
  background: #ffe0dd;
  color: #c0392b;
}

.product-approval-tab.rejected.active {
  background: #fff0ee;
  border-color: #e8aaa3;
}
      `}</style>
    </section>
  );
}