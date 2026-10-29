import { useEffect, useMemo, useState } from 'react';
import {
  archiveProduct,
  createProduct,
  getProduct,
  getResource,
  updateProduct,
  updateResourceStatus,
} from '../services/adminService.js';

const statuses = [
  'draft',
  'pending',
  'active',
  'rejected',
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

  const variants = (
    product.product_variants ||
    product.variants ||
    []
  ).map((variant) => ({
    sku: variant.sku || '',
    name: variant.name || '',
    price: String(variant.price ?? ''),
    compare_at_price:
      variant.compare_at_price == null
        ? ''
        : String(variant.compare_at_price),
    cost_price:
      variant.cost_price == null
        ? ''
        : String(variant.cost_price),
    stock_quantity: String(variant.stock_quantity ?? 0),
    attributesText: JSON.stringify(
      variant.attributes || {},
      null,
      2
    ),
    is_active: variant.is_active !== false,
  }));

  const images = (
    product.product_images ||
    product.images ||
    []
  ).map((image) => ({
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
  const variants = form.variants
    .filter(
      (variant) =>
        variant.price !== '' ||
        variant.sku.trim() ||
        variant.name.trim()
    )
    .map((variant) => {
      let attributes;

      try {
        attributes = JSON.parse(
          variant.attributesText || '{}'
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

      if (variant.price === '') {
        throw new Error(
          'Enter a price for every variant you add.'
        );
      }

      const price = Number(variant.price);
      const compareAtPrice =
        variant.compare_at_price === ''
          ? null
          : Number(variant.compare_at_price);
      const costPrice =
        variant.cost_price === ''
          ? null
          : Number(variant.cost_price);
      const stockQuantity = Number(
        variant.stock_quantity || 0
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

      return {
        sku: variant.sku.trim() || null,
        name: variant.name.trim() || null,
        price,
        compare_at_price: compareAtPrice,
        cost_price: costPrice,
        stock_quantity: stockQuantity,
        attributes,
        is_active: Boolean(variant.is_active),
      };
    });

  const images = form.images
    .filter((image) => image.image_url.trim())
    .map((image) => {
      const imageUrl = image.image_url.trim();

      if (!/^https?:\/\//i.test(imageUrl)) {
        throw new Error(
          'Image URLs must start with http:// or https://.'
        );
      }

      return {
        image_url: imageUrl,
        alt_text: image.alt_text.trim() || null,
        sort_order: Number(image.sort_order || 0),
        is_primary: Boolean(image.is_primary),
      };
    });

  if (images.filter((image) => image.is_primary).length > 1) {
    throw new Error('Select only one primary image.');
  }

  const payload = {
    category_id: form.category_id,
    name: form.name.trim(),
    slug: form.slug.trim().toLowerCase(),
    short_description:
      form.short_description.trim() || null,
    description: form.description.trim() || null,
    ingredients: form.ingredients.trim() || null,
    benefits: form.benefits.trim() || null,
    directions: form.directions.trim() || null,
    warnings: form.warnings.trim() || null,
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

export default function Products() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [reload, setReload] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(blankForm);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [loadingProduct, setLoadingProduct] = useState(false);

  const visibleCount = useMemo(
    () => items.length,
    [items]
  );

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim()),
      300
    );

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError('');

      try {
        const result = await getResource('products', {
          ...(debouncedSearch
            ? { search: debouncedSearch }
            : {}),
          ...(status ? { status } : {}),
        });

        if (active) {
          setItems(getCollection(result));
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
  }, [debouncedSearch, status, reload]);

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

  async function openCreate() {
    setEditingId('');
    setForm(blankForm());
    setFormError('');
    setModalOpen(true);

    await loadFormOptions();
  }

  async function openEdit(product) {
    setEditingId(product.id);
    setForm(blankForm());
    setFormError('');
    setModalOpen(true);
    setLoadingProduct(true);

    const optionsPromise = loadFormOptions();

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

      if (
        status &&
        status !== newStatus
      ) {
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

  async function saveProduct(event) {
    event.preventDefault();
    setFormError('');

    if (
      !form.name.trim() ||
      !form.slug.trim() ||
      !form.category_id
    ) {
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
      setFormError(
        requestError.message ||
          'Unable to save product.'
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

  return (
    <section className="module-page products-page">
      <div className="module-intro">
        <div>
          <h2>Products</h2>
          <p>
            Manage catalog details, variants, pricing,
            images, and publication status.
          </p>
        </div>

        <div className="products-intro-actions">
          <span className="products-count">
            {visibleCount}{' '}
            {visibleCount === 1 ? 'product' : 'products'}
          </span>

          <button
            type="button"
            className="primary-button"
            onClick={openCreate}
          >
            + Add product
          </button>
        </div>
      </div>

      <div className="module-card">
        <div className="module-toolbar">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search products..."
            aria-label="Search products"
          />

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            aria-label="Filter product status"
          >
            <option value="">All statuses</option>
            {statuses.map((itemStatus) => (
              <option
                key={itemStatus}
                value={itemStatus}
              >
                {itemStatus.charAt(0).toUpperCase() +
                  itemStatus.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="error-state" role="alert">
            {error}
            <button
              type="button"
              onClick={() =>
                setReload((current) => current + 1)
              }
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            Loading products...
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            No products found. Try changing your search
            or filters.
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Reviews</th>
                  <th>Featured</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-name">
                        {product.name || product.id}
                      </div>
                      <div className="product-description">
                        {product.short_description ||
                          'No description available'}
                      </div>
                      <div className="product-slug">
                        {product.slug || ''}
                      </div>
                    </td>

                    <td>
                      {Number(
                        product.average_rating || 0
                      ).toFixed(1)}
                    </td>

                    <td>{product.review_count ?? 0}</td>

                    <td>
                      <span
                        className={`featured-badge ${
                          product.is_featured
                            ? 'is-featured'
                            : ''
                        }`}
                      >
                        {product.is_featured
                          ? 'Featured'
                          : 'Standard'}
                      </span>
                    </td>

                    <td>
                      <select
                        value={product.status || 'draft'}
                        disabled={updatingId === product.id}
                        onChange={(event) =>
                          changeStatus(
                            product,
                            event.target.value
                          )
                        }
                        aria-label={`Status for ${
                          product.name || 'product'
                        }`}
                      >
                        {statuses.map((itemStatus) => (
                          <option
                            key={itemStatus}
                            value={itemStatus}
                          >
                            {itemStatus
                              .charAt(0)
                              .toUpperCase() +
                              itemStatus.slice(1)}
                          </option>
                        ))}
                      </select>

                      {updatingId === product.id && (
                        <span className="status-saving">
                          Saving...
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="product-row-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => openEdit(product)}
                          disabled={
                            updatingId === product.id
                          }
                        >
                          Edit
                        </button>

                        {product.status !== 'archived' && (
                          <button
                            type="button"
                            className="text-danger-button"
                            onClick={() =>
                              handleArchive(product)
                            }
                            disabled={
                              updatingId === product.id
                            }
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="product-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
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
                  {editingId ? 'Edit product' : 'Add product'}
                </h3>
                <p>
                  Enter the catalog details and variant
                  inventory.
                </p>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                aria-label="Close product form"
              >
                ×
              </button>
            </div>

            {loadingProduct || loadingOptions ? (
              <div className="loading-state">
                Loading product form...
              </div>
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

                      <label>
                        Stock quantity
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
                      Paste publicly accessible image URLs.
                      File uploads are not included in this form.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
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
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={saving}
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
          align-content: start;
          min-width: 0;
        }

        .products-page .module-card {
          min-height: 240px;
          overflow: hidden;
        }

        .products-page .module-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          background: #fffefd;
        }

        .products-page .module-toolbar input {
          flex: 1 1 220px;
          min-width: 0;
        }

        .products-page .module-toolbar select {
          flex: 0 1 180px;
        }

        .products-intro-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .products-count {
          color: #77747a;
          font-size: 13px;
        }

        .products-page .table-scroll {
          width: 100%;
          overflow-x: auto;
        }

        .products-page .data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .products-page .data-table th,
        .products-page .data-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #eee6dc;
          vertical-align: middle;
          white-space: nowrap;
        }

        .products-page .data-table th {
          color: #77747a;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .04em;
        }

        .products-page .product-name {
          color: #343522;
          font-weight: 600;
          white-space: normal;
        }

        .products-page .product-description {
          max-width: 280px;
          margin-top: 4px;
          color: #77747a;
          font-size: 12px;
          white-space: normal;
        }

        .products-page .product-slug {
          margin-top: 4px;
          color: #8b888c;
          font-size: 11px;
        }

        .products-page .featured-badge {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          background: #f2f0eb;
          color: #77747a;
          font-size: 11px;
        }

        .products-page .featured-badge.is-featured {
          background: #e7eee5;
          color: #344955;
        }

        .products-page .status-saving {
          display: block;
          margin-top: 4px;
          color: #77747a;
          font-size: 11px;
        }

        .products-page .error-state button {
          margin-left: 12px;
          cursor: pointer;
        }

        .product-row-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .products-page .secondary-button,
        .products-page .primary-button,
        .products-page .text-danger-button {
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .products-page .primary-button {
          border: 1px solid #285447;
          background: #285447;
          color: white;
        }

        .products-page .secondary-button {
          border: 1px solid #d9d3c9;
          background: white;
          color: #343522;
        }

        .products-page .text-danger-button {
          border: 1px solid transparent;
          background: transparent;
          color: #a3332a;
        }

        .products-page button:disabled {
          opacity: .55;
          cursor: not-allowed;
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
          background: rgba(24, 30, 27, .56);
        }

        .product-modal {
          width: min(100%, 980px);
          max-height: none;
          margin: auto;
          overflow: hidden;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 20px 60px rgba(0,0,0,.2);
        }

        .product-modal-header {
          position: sticky;
          top: 0;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          padding: 22px 24px;
          border-bottom: 1px solid #eee6dc;
          background: #fff;
        }

        .product-modal-header h3 {
          margin: 0;
          color: #343522;
          font-size: 20px;
        }

        .product-modal-header p {
          margin: 6px 0 0;
          color: #77747a;
          font-size: 13px;
        }

        .modal-close-button {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 8px;
          background: #f4f1ec;
          color: #343522;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
        }

        .product-form {
          padding: 22px 24px 24px;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
        }

        .product-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .product-form label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #45443d;
          font-size: 12px;
          font-weight: 600;
          min-width: 0;
        }

        .product-form input:not([type="checkbox"]),
        .product-form select,
        .product-form textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #ded9d0;
          border-radius: 8px;
          padding: 10px 11px;
          background: #fff;
          color: #343522;
          font: inherit;
          font-weight: 400;
          outline-color: #789783;
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
          gap: 9px;
          min-height: 40px;
        }

        .product-form .product-checkbox-label input {
          accent-color: #285447;
        }

        .product-form-section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin: 26px 0 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #eee6dc;
        }

        .product-form-section-heading h4 {
          margin: 0;
          color: #343522;
          font-size: 15px;
        }

        .product-form-section-heading p {
          margin: 5px 0 0;
          color: #77747a;
          font-size: 12px;
        }

        .product-editor-card {
          margin-bottom: 12px;
          padding: 16px;
          border: 1px solid #e9e3da;
          border-radius: 12px;
          background: #fffdfa;
        }

        .product-editor-card-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          color: #343522;
          font-size: 13px;
        }

        .product-form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 20px;
          margin-top: 20px;
          border-top: 1px solid #eee6dc;
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
            padding: 8px;
          }

          .product-modal {
            border-radius: 12px;
          }

          .product-modal-header,
          .product-form {
            padding-left: 16px;
            padding-right: 16px;
          }

          .product-form-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .product-form-full {
            grid-column: auto;
          }

          .product-form-section-heading {
            align-items: flex-start;
          }
        }
      `}</style>
    </section>
  );
}