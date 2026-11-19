
import "./ProductImagesPage.css";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Images,
  Info,
  LoaderCircle,
  Package,
  RefreshCw,
  Save,
  Send,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { vendorApi } from "../services/api";


const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// Consistent with the Add Product page.
const MAX_FILE_SIZE = 5 * 1024 * 1024;


function normalizeProduct(response) {
  const value =
    response?.data?.product ||
    response?.data ||
    response?.product ||
    response;

  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value
    : null;
}


function normalizeImages(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data?.images)) {
    return response.data.images;
  }

  if (Array.isArray(response?.images)) {
    return response.images;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}


function formatFileSize(bytes) {
  const value = Number(bytes) || 0;

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${Math.max(1, Math.round(value / 1024))} KB`;
}


function getImageUrl(image) {
  return (
    image?.image_url ||
    image?.public_url ||
    image?.url ||
    ""
  );
}


function GalleryCard({
  image,
  index,
  productName,
  selected,
  busy,
  onPreview,
  onPrimary,
  onDelete,
}) {
  const imageUrl = getImageUrl(image);

  return (
    <article
      className={`api-gallery-card ${
        image.is_primary ? "api-gallery-card--primary" : ""
      } ${
        selected ? "api-gallery-card--selected" : ""
      }`}
    >
      <button
        type="button"
        className="api-gallery-image"
        onClick={() => onPreview(image)}
        aria-label={`Preview image ${index + 1}`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={
              image.alt_text ||
              productName ||
              `Product image ${index + 1}`
            }
            loading="lazy"
          />
        ) : (
          <ImageIcon size={34} />
        )}

        <span className="api-gallery-index">
          {String(index + 1).padStart(2, "0")}
        </span>

        {image.is_primary && (
          <span className="api-primary-badge">
            <Star size={13} fill="currentColor" />
            Primary
          </span>
        )}
      </button>

      <div className="api-gallery-footer">
        <div className="api-gallery-details">
          <strong
            title={
              image.alt_text ||
              productName ||
              "Product Image"
            }
          >
            {image.alt_text ||
              productName ||
              "Product Image"}
          </strong>

          <span>
            Image {index + 1}
          </span>
        </div>

        <div className="api-gallery-actions">
          {!image.is_primary && (
            <button
              type="button"
              className="api-gallery-action"
              disabled={busy}
              onClick={() => onPrimary(image)}
              title="Set as primary image"
              aria-label={`Set image ${index + 1} as primary`}
            >
              {busy ? (
                <LoaderCircle
                  size={17}
                  className="api-spin"
                />
              ) : (
                <Star size={17} />
              )}
            </button>
          )}

          <button
            type="button"
            className="api-gallery-action api-gallery-action--danger"
            disabled={busy}
            onClick={() => onDelete(image)}
            title="Delete image"
            aria-label={`Delete image ${index + 1}`}
          >
            {busy ? (
              <LoaderCircle
                size={17}
                className="api-spin"
              />
            ) : (
              <Trash2 size={17} />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}


export default function ProductImagesPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const uploadingRef = useRef(false);

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [revision, setRevision] = useState(null);
  const [galleryReady, setGalleryReady] = useState(false);

  const productStatus = String(product?.status || "").toLowerCase();

  const revisionMode = productStatus === "active" &&
    ["draft", "pending"].includes(revision?.status);

  const canEdit = galleryReady && (
    productStatus === "draft" ||
    productStatus === "rejected" ||
    (revisionMode && revision?.status === "draft")
  );

  const canSubmitForApproval =
    galleryReady &&
    ["draft", "rejected"].includes(productStatus);

  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [submittingForApproval, setSubmittingForApproval] =
    useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [makePrimary, setMakePrimary] = useState(false);

  const [selectedPreviewId, setSelectedPreviewId] =
    useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const loadPage = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        setGalleryReady(false);

        const productResponse =
          await vendorApi.getProduct(productId);

        const productData =
          normalizeProduct(productResponse);

        let currentRevision = null;

        if (String(productData?.status).toLowerCase() === "active") {
          try {
            const response = await vendorApi.getRevision(productId);

            const candidate =
              response?.data?.revision ??
              response?.revision ??
              response?.data ??
              response;

            currentRevision = candidate?.id ? candidate : null;
          } catch (err) {
            if (err?.status !== 404) throw err;
          }
        }

        const useRevision =
          ["draft", "pending"].includes(currentRevision?.status);

        const imageResponse = useRevision
          ? await vendorApi.getRevisionImages(productId)
          : await vendorApi.getProductImages(productId);

        const imageData = normalizeImages(imageResponse);

        setRevision(currentRevision);
        setGalleryReady(true);

        setProduct(productData);
        setImages(imageData);

        setSelectedPreviewId((current) => {
          if (
            current &&
            imageData.some((image) => image.id === current)
          ) {
            return current;
          }

          return (
            imageData.find((image) => image.is_primary)?.id ||
            imageData[0]?.id ||
            null
          );
        });

        setLoaded(true);
        return true;
      } catch (err) {
        setError(
          err?.message ||
          "Unable to load product images."
        );

        return false;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [productId]
  );


  useEffect(() => {
    setProduct(null);
    setImages([]);
    setLoaded(false);
    setSelectedPreviewId(null);
    setSuccess("");
    setError("");

    loadPage();
  }, [loadPage]);


  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);


  const primaryImage =
    images.find((image) => image.is_primary) ||
    null;

  const selectedPreview =
    images.find(
      (image) => image.id === selectedPreviewId
    ) ||
    primaryImage ||
    images[0] ||
    null;

  const productName =
    product?.name ||
    "Product Images";

  const isBusy =
    uploading ||
    actionId !== null ||
    submittingForApproval ||
    refreshing;

  async function handleSubmitForApproval() {
    if (
      !canSubmitForApproval ||
      images.length === 0 ||
      isBusy
    ) {
      return;
    }

    setSubmittingForApproval(true);
    setError("");
    setSuccess("");

    try {
      await vendorApi.submitProductForApproval(productId);
      setProduct((current) =>
        current ? { ...current, status: "pending" } : current
      );
      setSuccess("Product submitted for Admin review.");
    } catch (err) {
      setError(
        err?.message ||
        "Unable to submit product for Admin review."
      );
    } finally {
      setSubmittingForApproval(false);
    }
  }


  function openFilePicker() {
    if (canEdit && !uploading) {
      fileInputRef.current?.click();
    }
  }


  function handleFileChange(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(
        "Only JPG, PNG and WEBP images are supported."
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        "Each image must be 5 MB or smaller."
      );
      return;
    }

    const newUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(newUrl);

    setAltText(product?.name || "");
    setMakePrimary(images.length === 0);
  }


  function clearSelection() {
    if (uploading) {
      return;
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setAltText("");
    setMakePrimary(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }


  async function handleUpload(event) {
    event.preventDefault();

    if (!canEdit || uploadingRef.current) {
      return;
    }

    if (!selectedFile) {
      setError("Please choose an image first.");
      return;
    }

    uploadingRef.current = true;
    setUploading(true);

    setError("");
    setSuccess("");

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);
      formData.append(
        "alt_text",
        altText.trim() || productName
      );
      formData.append(
        "sort_order",
        String(images.length)
      );
      formData.append(
        "is_primary",
        String(makePrimary || images.length === 0)
      );

      await vendorApi.uploadProductImage(
        productId,
        formData,
        revisionMode
      );

      setSelectedFile(null);
      setPreviewUrl("");
      setAltText("");
      setMakePrimary(false);

      setSuccess(
        "Product image uploaded successfully."
      );

      await loadPage(true);
    } catch (err) {
      setError(
        err?.message ||
        "Unable to upload product image."
      );
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  }


  async function handleSetPrimary(image) {
    if (!canEdit || image.is_primary || isBusy) {
      return;
    }

    setActionId(image.id);
    setError("");
    setSuccess("");

    try {
      const setPrimaryApi = revisionMode
        ? vendorApi.setRevisionPrimaryImage
        : vendorApi.setPrimaryProductImage;

      await setPrimaryApi(productId, image.id);

      setSuccess(
        "Primary product image updated successfully."
      );

      setSelectedPreviewId(image.id);
      await loadPage(true);
    } catch (err) {
      setError(
        err?.message ||
        "Unable to update primary image."
      );
    } finally {
      setActionId(null);
    }
  }


  async function handleDelete() {
    const image = deleteTarget;

    if (!canEdit || !image || isBusy) {
      return;
    }

    setActionId(image.id);
    setDeleteTarget(null);
    setError("");
    setSuccess("");

    try {
      const deleteImageApi = revisionMode
        ? vendorApi.deleteRevisionImage
        : vendorApi.deleteProductImage;

      await deleteImageApi(productId, image.id);

      setSuccess(
        "Product image deleted successfully."
      );

      await loadPage(true);
    } catch (err) {
      setError(
        err?.message ||
        "Unable to delete product image."
      );
    } finally {
      setActionId(null);
    }
  }


  if (loading && !loaded) {
    return (
      <div className="api-page">
        <div className="api-loading">
          <LoaderCircle
            size={32}
            className="api-spin"
          />

          <strong>Loading product images</strong>
          <p>Retrieving your product gallery.</p>
        </div>
      </div>
    );
  }


  if (error && !loaded) {
    return (
      <div className="api-page">
        <div className="api-loading">
          <AlertCircle size={32} />

          <h2>Unable to load images</h2>
          <p>{error}</p>

          <button
            type="button"
            className="api-button api-button--primary"
            onClick={() => loadPage()}
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="api-page">

      {/* PAGE HEADER */}
      <header className="api-header">
        <div className="api-header-copy">
          <button
            type="button"
            className="api-back"
            onClick={() =>
              navigate(
                `/products/${productId}/variants`
              )
            }
          >
            <ArrowLeft size={17} />
            Back to Variants
          </button>

          <span className="api-eyebrow">
            PRODUCT MANAGEMENT
          </span>

          <h1>{productName}</h1>

          <p>
            Upload, preview and organise your product
            photographs for the AUMVEDA catalogue.
          </p>
        </div>

        <div className="api-header-actions">
          <button
            type="button"
            className="api-button api-button--light"
            disabled={refreshing || uploading}
            onClick={() => loadPage(true)}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "api-spin" : ""}
            />
            Refresh
          </button>

          <span className="api-count">
            <Images size={17} />
            {images.length} Images
          </span>
        </div>
      </header>


      {/* MESSAGES */}
      {error && (
        <div
          className="api-alert api-alert--error"
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
          className="api-alert api-alert--success"
          role="status"
        >
          <CheckCircle2 size={19} />
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      )}


      {revisionMode && (
        <div className="api-alert">
          Revision status: {revision.status}.
          Image changes become public only after Admin approval.
        </div>
      )}

      {!canEdit && (
        <div className="api-alert">
          {productStatus === "pending"
            ? "Product is awaiting Admin approval. Editing is locked."
            : revision?.status === "pending"
              ? "Revision is awaiting Admin approval. Editing is locked."
              : "Gallery is read-only. Create a product revision from Products to edit an approved product."}
        </div>
      )}

      {/* MAIN PREVIEW */}
      <section className="api-showcase">
        <div className="api-preview-stage">
          {selectedPreview && getImageUrl(selectedPreview) ? (
            <img
              src={getImageUrl(selectedPreview)}
              alt={
                selectedPreview.alt_text ||
                productName
              }
            />
          ) : (
            <div className="api-preview-empty">
              <span>
                <ImageIcon size={37} />
              </span>

              <h2>No product images yet</h2>

              <p>
                Add a product photograph below
                to start building your gallery.
              </p>
            </div>
          )}

          {selectedPreview?.is_primary && (
            <span className="api-preview-primary">
              <Star size={15} fill="currentColor" />
              Primary Image
            </span>
          )}
        </div>

        <aside className="api-preview-info">
          <span className="api-info-icon">
            <Camera size={23} />
          </span>

          <span className="api-eyebrow">
            IMAGE OVERVIEW
          </span>

          <h2>Product Photography</h2>

          <p>
            Keep your catalogue images clear,
            consistent and easy for customers to view.
          </p>

          <div className="api-info-stat">
            <span>Total Images</span>
            <strong>{images.length}</strong>
          </div>

          <div className="api-info-stat">
            <span>Primary Image</span>
            <strong>
              {primaryImage ? "Selected" : "Not selected"}
            </strong>
          </div>

          <div className="api-info-note">
            <Info size={18} />
            <span>
              Your primary image is used as the main
              product photograph wherever the
              catalogue supports it.
            </span>
          </div>
        </aside>
      </section>


      {/* UPLOAD + GALLERY */}
      <section className="api-workspace">

        {/* UPLOAD PANEL */}
        <aside className="api-upload-card">
          <div className="api-section-heading">
            <span className="api-eyebrow">
              ADD MEDIA
            </span>

            <h2>Upload Image</h2>

            <p>
              Add another product photograph to
              your gallery.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            disabled={!canEdit || uploading}
            onChange={handleFileChange}
          />

          {!selectedFile ? (
            <button
              type="button"
              className="api-upload-zone"
              onClick={openFilePicker}
              disabled={!canEdit || uploading}
            >
              <span className="api-upload-icon">
                <UploadCloud size={28} />
              </span>

              <strong>Choose an image</strong>

              <span>
                JPG, PNG or WEBP
              </span>

              <small>
                Maximum file size: 5 MB
              </small>
            </button>
          ) : (
            <div className="api-upload-preview">
              <div className="api-upload-preview-media">
                <img
                  src={previewUrl}
                  alt="Selected image preview"
                />

                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={!canEdit || uploading}
                  title="Remove selected file"
                  aria-label="Remove selected file"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="api-upload-filename">
                <strong title={selectedFile.name}>
                  {selectedFile.name}
                </strong>

                <span>
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>
            </div>
          )}

          <form
            className="api-upload-form"
            onSubmit={handleUpload}
          >
            <label className="api-field">
              <span>Alternative Text</span>

              <input
                type="text"
                value={altText}
                onChange={(event) =>
                  setAltText(event.target.value)
                }
                placeholder="Describe the image"
                maxLength={255}
                disabled={!canEdit || uploading}
              />
            </label>

            <label className="api-primary-option">
              <input
                type="checkbox"
                checked={makePrimary || images.length === 0}
                disabled={uploading || images.length === 0}
                onChange={(event) =>
                  setMakePrimary(event.target.checked)
                }
              />

              <span>
                <strong>Set as Primary</strong>
                <small>
                  Use this as the main product image.
                </small>
              </span>
            </label>

            <button
              type="submit"
              className="api-button api-button--primary api-upload-submit"
              disabled={!canEdit || !selectedFile || uploading}
            >
              {uploading ? (
                <LoaderCircle
                  size={18}
                  className="api-spin"
                />
              ) : (
                <UploadCloud size={18} />
              )}

              {uploading
                ? "Uploading Image..."
                : "Upload to Gallery"}
            </button>
          </form>
        </aside>


        {/* GALLERY */}
        <div className="api-gallery-panel">
          <div className="api-gallery-heading">
            <div>
              <span className="api-eyebrow">
                MEDIA LIBRARY
              </span>

              <h2>
              {revisionMode ? "Revision Gallery" : "Product Gallery"}
            </h2>

              <p>
                Select an image to preview,
                change its primary status,
                or delete it.
              </p>
            </div>

            <span className="api-gallery-total">
              {images.length} assets
            </span>
          </div>

          {images.length === 0 ? (
            <div className="api-gallery-empty">
              <span>
                <Images size={32} />
              </span>

              <h3>Your gallery is empty</h3>

              <p>
                Upload your first image to make
                your product listing more informative.
              </p>

              <button
                type="button"
                className="api-button api-button--light"
                onClick={openFilePicker}
              >
                <UploadCloud size={17} />
                Choose Image
              </button>
            </div>
          ) : (
            <div className="api-gallery-grid">
              {images.map((image, index) => (
                <GalleryCard
                  key={image.id}
                  image={image}
                  index={index}
                  productName={productName}
                  selected={
                    selectedPreview?.id === image.id
                  }
                  busy={isBusy}
                  onPreview={setSelectedPreviewId
                    ? (selected) =>
                        setSelectedPreviewId(selected.id)
                    : () => {}}
                  onPrimary={handleSetPrimary}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </div>
      </section>


      {/* COMPLETION */}
      <section className="api-completion">
        <div className="api-completion-copy">
          <span className="api-completion-icon">
            <Package size={21} />
          </span>

          <div>
            <strong>Product image setup</strong>

            <p>
              {images.length === 0
                ? "Add at least one product image before submitting for review."
                : canSubmitForApproval
                  ? "Before submission, add a description and at least one active variant with a SKU and price."
                  : "Your product has images. Continue to inventory management when you're ready."}
            </p>
          </div>
        </div>

        <div className="api-completion-actions">
          {canSubmitForApproval ? (
            <>
              <button
                type="button"
                className="api-button api-button--light"
                disabled={isBusy}
                onClick={() => navigate("/products")}
              >
                <Save size={17} />
                {productStatus === "draft"
                  ? "Save as Draft"
                  : "Back to Products"}
              </button>

              <button
                type="button"
                className="api-button api-button--primary"
                disabled={images.length === 0 || isBusy}
                onClick={handleSubmitForApproval}
              >
                {submittingForApproval ? (
                  <LoaderCircle
                    size={17}
                    className="api-spin"
                  />
                ) : (
                  <Send size={17} />
                )}
                {submittingForApproval
                  ? "Submitting..."
                  : "Submit for Review"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="api-button api-button--light"
                onClick={() =>
                  navigate(
                    `/products/${productId}/variants`
                  )
                }
              >
                <ArrowLeft size={17} />
                Variants
              </button>

              <button
                type="button"
                className="api-button api-button--primary"
                disabled={images.length === 0}
                onClick={() => navigate("/inventory")}
              >
                Continue to Inventory
                <ArrowRight size={17} />
              </button>
            </>
          )}
        </div>
      </section>


      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div
          className="api-dialog-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeleteTarget(null);
            }
          }}
        >
          <section
            className="api-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="api-delete-title"
          >
            <span className="api-dialog-icon">
              <Trash2 size={25} />
            </span>

            <h2 id="api-delete-title">
              Delete this image?
            </h2>

            <p>
              This image will be removed from your
              product gallery. This action may not
              be reversible.
            </p>

            {deleteTarget.is_primary && (
              <div className="api-dialog-warning">
                <AlertCircle size={17} />
                This is your current primary image.
              </div>
            )}

            <div className="api-dialog-actions">
              <button
                type="button"
                className="api-button api-button--light"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="api-button api-button--danger"
                onClick={handleDelete}
              >
                <Trash2 size={17} />
                Delete Image
              </button>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
