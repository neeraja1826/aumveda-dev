
import "./AddProductPage.css";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  FileText,
  Images,
  Leaf,
  LoaderCircle,
  PackagePlus,
  Plus,
  Save,
  ShieldCheck,
  Send,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { vendorApi } from "../services/api";


const INITIAL_FORM = {
  name: "",
  category_id: "",
  short_description: "",
  description: "",
  ingredients: "",
  benefits: "",
  directions: "",
  warnings: "",
};

const INITIAL_VARIANT = {
  name: "",
  sku: "",
  price: "",
  compare_at_price: "",
  cost_price: "",
  stock_quantity: "0",
};

const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];


function normalizeCollection(response, key) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.[key])) {
    return response[key];
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.[key])) {
    return response.data[key];
  }

  return [];
}


function cleanOptional(value) {
  return String(value || "").trim() || null;
}


function formatFileSize(size) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}


function getCreatedProductId(response) {
  return (
    response?.data?.product?.id ||
    response?.data?.id ||
    response?.product?.id ||
    response?.product_id ||
    response?.id ||
    null
  );
}

function hasVariantInput(variant) {
  return Boolean(
    variant.name.trim() ||
    variant.sku.trim() ||
    variant.price.trim() ||
    variant.compare_at_price.trim() ||
    variant.cost_price.trim() ||
    variant.stock_quantity !== "0"
  );
}

function validateProductVariant(variant, required) {
  if (!required && !hasVariantInput(variant)) {
    return "";
  }

  if (!variant.name.trim()) {
    return "Variant name is required.";
  }

  if (!variant.sku.trim()) {
    return "Variant SKU is required.";
  }

  if (!/^[A-Za-z0-9._-]+$/.test(variant.sku.trim())) {
    return "SKU can contain letters, numbers, hyphens, underscores and periods.";
  }

  const price = Number(variant.price);

  if (!Number.isFinite(price) || price <= 0) {
    return "Enter a selling price greater than zero.";
  }

  const compareAtPrice = variant.compare_at_price.trim()
    ? Number(variant.compare_at_price)
    : null;
  const costPrice = variant.cost_price.trim()
    ? Number(variant.cost_price)
    : null;
  const stockQuantity = Number(variant.stock_quantity);

  if (
    compareAtPrice !== null &&
    (!Number.isFinite(compareAtPrice) || compareAtPrice < price)
  ) {
    return "MRP cannot be less than the selling price.";
  }

  if (
    costPrice !== null &&
    (!Number.isFinite(costPrice) || costPrice < 0)
  ) {
    return "Cost price cannot be negative.";
  }

  if (
    !Number.isSafeInteger(stockQuantity) ||
    stockQuantity < 0
  ) {
    return "Stock quantity must be a non-negative whole number.";
  }

  return "";
}

function buildProductVariant(variant) {
  return {
    name: variant.name.trim(),
    sku: variant.sku.trim().toUpperCase(),
    price: Number(variant.price),
    compare_at_price: variant.compare_at_price.trim()
      ? Number(variant.compare_at_price)
      : null,
    cost_price: variant.cost_price.trim()
      ? Number(variant.cost_price)
      : null,
    size_value: null,
    size_unit: null,
    stock_quantity: Number(variant.stock_quantity),
    low_stock_threshold: 5,
    is_default: true,
    is_active: true,
  };
}

function matchesProductVariant(existing, payload) {
  return (
    String(existing?.sku || "").trim().toUpperCase() === payload.sku &&
    String(existing?.name || "").trim().toLowerCase() ===
      payload.name.toLowerCase() &&
    Number(existing?.price) === payload.price
  );
}


function SectionHeading({
  icon: Icon,
  number,
  title,
  description,
}) {
  return (
    <div className="ap-section-heading">
      <span className="ap-section-icon">
        <Icon size={21} strokeWidth={1.8} />
      </span>

      <div>
        <span className="ap-section-number">
          SECTION {number}
        </span>

        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}


function FormField({
  label,
  required = false,
  fullWidth = false,
  hint,
  children,
}) {
  return (
    <label
      className={`ap-field ${
        fullWidth ? "ap-field--full" : ""
      }`}
    >
      <span className="ap-field-label">
        {label}
        {required && (
          <span className="ap-required"> *</span>
        )}
      </span>

      {children}

      {hint && (
        <small className="ap-field-hint">
          {hint}
        </small>
      )}
    </label>
  );
}


function ChecklistItem({
  done,
  title,
  optional = false,
}) {
  return (
    <div className="ap-checklist-item">
      <span
        className={`ap-checklist-icon ${
          done ? "ap-checklist-icon--done" : ""
        }`}
      >
        {done ? (
          <Check size={13} strokeWidth={2.5} />
        ) : (
          <span className="ap-checklist-empty" />
        )}
      </span>

      <span>{title}</span>

      {optional && (
        <small>Optional</small>
      )}
    </div>
  );
}


export default function AddProductPage() {
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  const imagesRef = useRef([]);
  const uploadingRef = useRef(false);

  const [form, setForm] = useState(INITIAL_FORM);
  const [variant, setVariant] = useState(INITIAL_VARIANT);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [primaryImageId, setPrimaryImageId] =
    useState(null);

  const [loadingMetadata, setLoadingMetadata] =
    useState(true);

  const [metadataError, setMetadataError] =
    useState("");

  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [createdProductId, setCreatedProductId] =
    useState(null);
  const [variantSaved, setVariantSaved] = useState(false);
  const [submittedForApproval, setSubmittedForApproval] =
    useState(false);

  const [uploadedImageIds, setUploadedImageIds] =
    useState([]);

  const [failedPrimaryImage, setFailedPrimaryImage] =
    useState(false);


  useEffect(() => {
    imagesRef.current = images;
  }, [images]);


  useEffect(() => {
    let active = true;

    async function fetchCategories() {
      try {
        setLoadingMetadata(true);
        setMetadataError("");

        const response =
          await vendorApi.getCategories();

        if (active) {
          setCategories(
            normalizeCollection(response, "categories")
          );
        }
      } catch (err) {
        if (active) {
          setMetadataError(
            err?.message ||
            "Unable to load categories."
          );
        }
      } finally {
        if (active) {
          setLoadingMetadata(false);
        }
      }
    }

    fetchCategories();

    return () => {
      active = false;

      imagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);


  const canSubmit =
    form.name.trim().length > 0 &&
    Boolean(form.category_id);

  const created = Boolean(createdProductId);

  const remainingImages = images.filter(
    (image) => !uploadedImageIds.includes(image.id)
  );

  const allImagesUploaded =
    remainingImages.length === 0;
  const variantReady =
    hasVariantInput(variant) &&
    !validateProductVariant(variant, true);


  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  }

  function handleVariantChange(event) {
    const { name, value } = event.target;

    if (submitting || variantSaved || submittedForApproval) {
      return;
    }

    setVariant((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  }


  function handleImageSelect(event) {
    if (created || submitting) {
      event.target.value = "";
      return;
    }

    const selected = Array.from(
      event.target.files || []
    );

    event.target.value = "";

    if (!selected.length) {
      return;
    }

    const slots = MAX_IMAGES - images.length;

    if (slots <= 0) {
      setError(
        `Maximum ${MAX_IMAGES} images allowed.`
      );
      return;
    }

    if (selected.length > slots) {
      setError(
        `You can add only ${slots} more image(s).`
      );
      return;
    }

    const invalid = selected.find(
      (file) => !ALLOWED_IMAGE_TYPES.includes(file.type)
    );

    if (invalid) {
      setError(
        "Only JPG, PNG and WEBP images are supported."
      );
      return;
    }

    const oversized = selected.find(
      (file) => file.size > MAX_IMAGE_SIZE
    );

    if (oversized) {
      setError(
        `"${oversized.name}" is larger than 5 MB.`
      );
      return;
    }

    const newImages = selected.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((current) => [
      ...current,
      ...newImages,
    ]);

    setPrimaryImageId((current) =>
      current || newImages[0]?.id || null
    );

    setError("");
  }


  function removeImage(imageId) {
    if (created || submitting) {
      return;
    }

    const selectedImage = images.find(
      (image) => image.id === imageId
    );

    if (selectedImage) {
      URL.revokeObjectURL(
        selectedImage.previewUrl
      );
    }

    const nextImages = images.filter(
      (image) => image.id !== imageId
    );

    imagesRef.current = nextImages;
    setImages(nextImages);

    setPrimaryImageId((current) =>
      current === imageId
        ? nextImages[0]?.id || null
        : current
    );
  }


  async function uploadRemainingImages(productId) {
    const pending = images.filter(
      (image) =>
        !uploadedImageIds.includes(image.id)
    );

    const completed = [
      ...uploadedImageIds,
    ];

    for (let index = 0; index < pending.length; index++) {
      const image = pending[index];

      setProgress(
        `Uploading image ${index + 1} of ${pending.length}...`
      );

      const formData = new FormData();

      formData.append("file", image.file);

      formData.append(
        "alt_text",
        form.name.trim() || "Product image"
      );

      formData.append(
        "sort_order",
        String(images.findIndex(
          (item) => item.id === image.id
        ))
      );

      formData.append(
        "is_primary",
        String(image.id === primaryImageId)
      );

      try {
        await vendorApi.uploadProductImage(
          productId,
          formData
        );

        completed.push(image.id);
        setUploadedImageIds([...completed]);
      } catch (err) {
        if (image.id === primaryImageId) {
          setFailedPrimaryImage(true);
        }

        throw err;
      }
    }

    return completed;
  }


  async function saveProduct(action) {
    if (uploadingRef.current || submittedForApproval) {
      return;
    }

    if (!form.name.trim() || !form.category_id) {
      setError(
        "Product name and category are required."
      );
      return;
    }

    const variantError = validateProductVariant(
      variant,
      action === "approval"
    );

    if (variantError) {
      setError(variantError);
      return;
    }

    if (action === "approval") {
      if (!form.description.trim()) {
        setError(
          "Add a full product description before submitting for approval."
        );
        return;
      }

      if (images.length === 0) {
        setError(
          "Add at least one product image before submitting for approval."
        );
        return;
      }
    }

    uploadingRef.current = true;
    setSubmitting(true);
    setError("");
    setSuccess("");

    let productId = createdProductId;

    try {
      if (!productId) {
        setProgress("Saving product details...");

        const payload = {
          name: form.name.trim(),
          category_id: form.category_id,
          short_description: cleanOptional(
            form.short_description
          ),
          description: cleanOptional(
            form.description
          ),
          ingredients: cleanOptional(
            form.ingredients
          ),
          benefits: cleanOptional(
            form.benefits
          ),
          directions: cleanOptional(
            form.directions
          ),
          warnings: cleanOptional(
            form.warnings
          ),
        };

        const response =
          await vendorApi.createProduct(payload);

        productId = getCreatedProductId(response);

        if (!productId) {
          throw new Error(
            "The product creation request returned no product ID. Check the catalogue before retrying to avoid duplicates."
          );
        }

        setCreatedProductId(productId);
      }

      if (images.length > 0 && !allImagesUploaded) {
        await uploadRemainingImages(productId);
      }

      const needsVariant =
        action === "approval" || hasVariantInput(variant);

      if (needsVariant && !variantSaved) {
        setProgress("Saving product variant...");

        const payload = buildProductVariant(variant);
        const existingVariants = normalizeCollection(
          await vendorApi.getProductVariants(productId),
          "variants"
        );
        const matchingVariant = existingVariants.find(
          (item) =>
            String(item?.sku || "").trim().toUpperCase() ===
            payload.sku
        );

        if (matchingVariant) {
          if (!matchesProductVariant(matchingVariant, payload)) {
            throw new Error(
              "A variant with this SKU already exists with different details. Review it in Variants before continuing."
            );
          }
        } else {
          if (existingVariants.length > 0) {
            throw new Error(
              "This product already has a variant. Review it in Variants before adding another."
            );
          }

          await vendorApi.createProductVariant(
            productId,
            payload
          );
        }

        setVariantSaved(true);
      }

      if (action === "approval") {
        setProgress("Submitting for Admin approval...");
        await vendorApi.submitProductForApproval(productId);
        setSubmittedForApproval(true);
        setSuccess("Product submitted for Admin approval.");
      } else {
        setSuccess("Product draft saved successfully.");
      }

      setProgress("");
      navigate("/products", { replace: true });
    } catch (err) {
      setProgress("");
      setError(
        err?.message ||
        (action === "approval"
          ? "Unable to submit product for approval."
          : "Unable to save product draft.")
      );
    } finally {
      uploadingRef.current = false;
      setSubmitting(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    saveProduct("draft");
  }


  function continueToVariants() {
    if (!createdProductId) {
      return;
    }

    navigate(
      `/products/${createdProductId}/variants`,
      { replace: true }
    );
  }


  return (
    <div className="ap-page">

      {/* PAGE HEADER */}
      <header className="ap-page-header">
        <div>
          <button
            type="button"
            className="ap-back-link"
            onClick={() => navigate("/products")}
          >
            <ArrowLeft size={17} />
            Back to Products
          </button>

          <span className="ap-eyebrow">
            PRODUCT MANAGEMENT
          </span>

          <h1>Add a new product</h1>

          <p>
            Create a listing, add its first variant,
            then save it as a draft or submit it for
            Admin approval.
          </p>
        </div>

        <span className="ap-header-icon">
          <PackagePlus size={28} strokeWidth={1.6} />
        </span>
      </header>


      {/* MESSAGES */}
      {metadataError && (
        <div className="ap-notice ap-notice--error">
          <AlertCircle size={19} />
          <span>
            Categories could not be loaded:
            {" "}{metadataError}
          </span>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {error && (
        <div
          className="ap-notice ap-notice--error"
          role="alert"
        >
          <AlertCircle size={19} />
          <span>{error}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          >
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div
          className="ap-notice ap-notice--success"
          role="status"
        >
          <CheckCircle2 size={19} />
          <span>{success}</span>
        </div>
      )}


      {/* MAIN FORM */}
      <form
        className="ap-layout"
        onSubmit={handleSubmit}
      >
        <div className="ap-main">

          {/* BASIC INFORMATION */}
          <section className="ap-card">
            <SectionHeading
              number="01"
              icon={FileText}
              title="Basic Information"
              description="The information customers will see when browsing your products."
            />

            <div className="ap-form-grid">
              <FormField label="Product Name" required>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Bhringraj Hair Oil"
                  maxLength={160}
                  required
                  disabled={created || submitting}
                />
              </FormField>

              <FormField label="Category" required>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  disabled={
                    loadingMetadata ||
                    created ||
                    submitting
                  }
                  required
                >
                  <option value="">
                    {loadingMetadata
                      ? "Loading categories..."
                      : "Select a category"}
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
              </FormField>

              <FormField
                label="Short Description"
                fullWidth
                hint="A short introduction to your product."
              >
                <input
                  type="text"
                  name="short_description"
                  value={form.short_description}
                  onChange={handleChange}
                  placeholder="Summarise your product in one sentence"
                  disabled={created || submitting}
                />
              </FormField>

              <FormField
                label="Full Description"
                fullWidth
              >
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Describe your product, traditional uses, and distinguishing features..."
                  disabled={created || submitting}
                />
              </FormField>
            </div>
          </section>


          {/* IMAGES */}
          <section className="ap-card">
            <SectionHeading
              number="02"
              icon={Images}
              title="Product Photography"
              description="Add attractive, clear images that help customers understand your product."
            />

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              disabled={created || submitting}
              onChange={handleImageSelect}
            />

            <button
              type="button"
              className="ap-upload-zone"
              disabled={
                created ||
                submitting ||
                images.length >= MAX_IMAGES
              }
              onClick={() =>
                imageInputRef.current?.click()
              }
            >
              <span className="ap-upload-icon">
                <UploadCloud size={27} />
              </span>

              <strong>
                Choose product images
              </strong>

              <span>
                JPG, PNG or WEBP. Maximum 6 images,
                5 MB each.
              </span>

              <span className="ap-upload-button">
                <Plus size={16} />
                Browse Files
              </span>
            </button>


            {images.length > 0 && (
              <div className="ap-image-section">
                <div className="ap-image-section-heading">
                  <div>
                    <strong>Selected Images</strong>
                    <span>
                      {images.length} / {MAX_IMAGES} selected
                    </span>
                  </div>

                  {!created &&
                    images.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() =>
                          imageInputRef.current?.click()
                        }
                        disabled={submitting}
                      >
                        <Plus size={16} />
                        Add More
                      </button>
                    )}
                </div>

                <div className="ap-image-grid">
                  {images.map((image, index) => {
                    const primary =
                      image.id === primaryImageId;

                    const uploaded =
                      uploadedImageIds.includes(image.id);

                    return (
                      <div
                        key={image.id}
                        className={`ap-image-card ${
                          primary
                            ? "ap-image-card--primary"
                            : ""
                        }`}
                      >
                        <div className="ap-image-preview">
                          <img
                            src={image.previewUrl}
                            alt={`Product preview ${index + 1}`}
                          />

                          {primary && (
                            <span className="ap-primary-badge">
                              <Star
                                size={13}
                                fill="currentColor"
                              />
                              Primary
                            </span>
                          )}

                          {!created && (
                            <button
                              type="button"
                              className="ap-image-remove"
                              title="Remove image"
                              aria-label={`Remove image ${index + 1}`}
                              disabled={submitting}
                              onClick={() =>
                                removeImage(image.id)
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div className="ap-image-footer">
                          <div>
                            <strong>
                              Image {index + 1}
                            </strong>
                            <small>
                              {formatFileSize(
                                image.file.size
                              )}
                              {uploaded
                                ? " · Uploaded"
                                : ""}
                            </small>
                          </div>

                          {!primary && !created && (
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() =>
                                setPrimaryImageId(image.id)
                              }
                            >
                              Set Primary
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="ap-image-tip">
              <Camera size={17} />
              <span>
                Use well-lit photographs with clean
                backgrounds. The primary image will
                represent your product in the catalogue.
              </span>
            </div>
          </section>


          {/* PRODUCT DETAILS */}
          <section className="ap-card">
            <SectionHeading
              number="03"
              icon={Leaf}
              title="Product Details"
              description="Provide transparent ingredients, usage information and relevant precautions."
            />

            <div className="ap-form-grid">
              <FormField
                label="Ingredients"
                fullWidth
              >
                <textarea
                  name="ingredients"
                  value={form.ingredients}
                  onChange={handleChange}
                  rows={4}
                  placeholder="List the ingredients used in this product..."
                  disabled={created || submitting}
                />
              </FormField>

              <FormField
                label="Benefits"
                fullWidth
                hint="Avoid unsupported medical or therapeutic claims."
              >
                <textarea
                  name="benefits"
                  value={form.benefits}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the product benefits..."
                  disabled={created || submitting}
                />
              </FormField>

              <FormField
                label="Directions for Use"
                fullWidth
              >
                <textarea
                  name="directions"
                  value={form.directions}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Explain how customers should use this product..."
                  disabled={created || submitting}
                />
              </FormField>

              <FormField
                label="Warnings and Precautions"
                fullWidth
              >
                <textarea
                  name="warnings"
                  value={form.warnings}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Add any important usage warnings or precautions..."
                  disabled={created || submitting}
                />
              </FormField>
            </div>
          </section>


          {/* FIRST PRODUCT VARIANT */}
          <section className="ap-card">
            <SectionHeading
              number="04"
              icon={PackagePlus}
              title="First Product Variant"
              description="Add the first SKU, selling price and stock. You can add more variants later."
            />

            <div className="ap-form-grid">
              <FormField label="Variant Name" required>
                <input
                  type="text"
                  name="name"
                  value={variant.name}
                  onChange={handleVariantChange}
                  placeholder="e.g. 200 ml"
                  maxLength={120}
                  disabled={
                    submitting ||
                    variantSaved ||
                    submittedForApproval
                  }
                />
              </FormField>

              <FormField label="SKU" required>
                <input
                  type="text"
                  name="sku"
                  value={variant.sku}
                  onChange={handleVariantChange}
                  placeholder="e.g. BHR-OIL-200"
                  maxLength={80}
                  disabled={
                    submitting ||
                    variantSaved ||
                    submittedForApproval
                  }
                />
              </FormField>

              <FormField label="Selling Price (₹)" required>
                <input
                  type="number"
                  name="price"
                  value={variant.price}
                  onChange={handleVariantChange}
                  placeholder="349"
                  min="0.01"
                  step="0.01"
                  disabled={
                    submitting ||
                    variantSaved ||
                    submittedForApproval
                  }
                />
              </FormField>

              <FormField
                label="MRP (₹)"
                hint="Optional. Must be equal to or higher than the selling price."
              >
                <input
                  type="number"
                  name="compare_at_price"
                  value={variant.compare_at_price}
                  onChange={handleVariantChange}
                  placeholder="399"
                  min="0"
                  step="0.01"
                  disabled={
                    submitting ||
                    variantSaved ||
                    submittedForApproval
                  }
                />
              </FormField>

              <FormField label="Cost Price (₹)">
                <input
                  type="number"
                  name="cost_price"
                  value={variant.cost_price}
                  onChange={handleVariantChange}
                  placeholder="Optional"
                  min="0"
                  step="0.01"
                  disabled={
                    submitting ||
                    variantSaved ||
                    submittedForApproval
                  }
                />
              </FormField>

              <FormField label="Stock Quantity" required>
                <input
                  type="number"
                  name="stock_quantity"
                  value={variant.stock_quantity}
                  onChange={handleVariantChange}
                  min="0"
                  step="1"
                  disabled={
                    submitting ||
                    variantSaved ||
                    submittedForApproval
                  }
                />
              </FormField>
            </div>
          </section>
        </div>


        {/* RIGHT PANEL */}
        <aside className="ap-aside">
          <section className="ap-save-card">
            <span className="ap-save-icon">
              <ShieldCheck size={24} />
            </span>

            <span className="ap-eyebrow">
              PRODUCT SETUP
            </span>

            <h2>
              {created
                ? "Draft Created"
                : "Save as Draft"}
            </h2>

            <p>
              {created
                ? submittedForApproval
                  ? "Your product is pending Admin approval."
                  : "Your draft is saved. Add a variant or submit it for review when it's ready."
                : "Save your product and first variant as a draft, or submit the complete listing for Admin approval."}
            </p>

            <div className="ap-checklist">
              <ChecklistItem
                title="Product name"
                done={Boolean(form.name.trim())}
              />

              <ChecklistItem
                title="Category selected"
                done={Boolean(form.category_id)}
              />

              <ChecklistItem
                title={
                  images.length
                    ? `${images.length} product image(s)`
                    : "Product images"
                }
                done={images.length > 0}
                optional
              />

              <ChecklistItem
                title="Draft saved"
                done={created}
              />

              <ChecklistItem
                title="First variant"
                done={variantSaved || variantReady}
              />
            </div>

            {progress && (
              <div
                className="ap-progress"
                role="status"
              >
                <LoaderCircle
                  size={17}
                  className="ap-spin"
                />
                {progress}
              </div>
            )}

            <button
              type="submit"
              className="ap-submit"
              disabled={
                submitting ||
                submittedForApproval ||
                (!created && !canSubmit)
              }
            >
              {submitting ? (
                <LoaderCircle
                  size={18}
                  className="ap-spin"
                />
              ) : (
                <Save size={18} />
              )}

              {submitting
                ? "Saving..."
                : submittedForApproval
                  ? "Submitted for Review"
                  : "Save as Draft"}
            </button>

            <button
              type="button"
              className="ap-continue ap-approval"
              disabled={submitting || submittedForApproval}
              onClick={() => saveProduct("approval")}
            >
              {submitting && progress.includes("Submitting") ? (
                <LoaderCircle
                  size={17}
                  className="ap-spin"
                />
              ) : (
                <Send size={17} />
              )}
              {submitting && progress.includes("Submitting")
                ? "Submitting..."
                : "Submit for Approval"}
            </button>

            {created && (
              <>
                <button
                  type="button"
                  className="ap-continue"
                  onClick={continueToVariants}
                  disabled={submitting}
                >
                  Continue to Variants
                  <ArrowRight size={17} />
                </button>

                <button
                  type="button"
                  className="ap-continue"
                  onClick={() =>
                    navigate(
                      `/products/${createdProductId}/images`
                    )
                  }
                  disabled={submitting}
                >
                  Manage Uploaded Images
                  <Images size={17} />
                </button>
              </>
            )}

            <button
              type="button"
              className="ap-cancel"
              disabled={submitting}
              onClick={() => navigate("/products")}
            >
              Back to Catalogue
            </button>
          </section>

          <section className="ap-help-card">
            <span className="ap-help-icon">
              <Leaf size={20} />
            </span>

            <div>
              <strong>
                A better product listing
              </strong>

              <p>
                Use accurate product names, complete
                ingredient information, clear imagery,
                and practical usage directions.
              </p>
            </div>
          </section>

          <section className="ap-steps-card">
            <strong>Next steps</strong>

            <div>
              <span>01</span>
              Product Details
              <Check size={16} />
            </div>

            <div>
              <span>02</span>
              Variants & Pricing
            </div>

            <div>
              <span>03</span>
              Stock Management
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}
