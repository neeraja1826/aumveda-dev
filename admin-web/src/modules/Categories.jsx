
import { useEffect, useMemo, useState } from 'react';
import { FolderTree, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  createCategory,
  getResource,
  updateCategory,
  updateCategorySettings,
  deleteCategory,
} from '../services/adminService.js';

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getItems(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

const emptyForm = {
  name: '',
  slug: '',
  parent_id: '',
  description: '',
  image_url: '',
};

export default function Categories() {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      setLoading(true);
      setError('');

      try {
        const result = await getResource('categories');

        if (active) {
          setItems(getItems(result));
          setSelectedIds([]);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.message || 'Unable to load categories.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, [reload]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) =>
      [item.name, item.slug, item.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [items, search]);

  function toggleCategorySelection(categoryId) {
    setSelectedIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    );
  }

  function toggleVisibleCategorySelection() {
    const visibleIds = visibleItems.map((item) => item.id);
    const allVisibleSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedIds.includes(id));

    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])]
    );
  }

  function handleNameChange(value) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: editingId
        ? current.slug
        : makeSlug(value),
    }));
  }

  function startEdit(category) {
    setEditingId(category.id);

    setForm({
      name: category.name || '',
      slug: category.slug || '',
      parent_id: category.parent_id || '',
      description: category.description || '',
      image_url: category.image_url || '',
    });

    setError('');
    setSuccess('');
    setFormOpen(true);
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setSuccess('');
    setFormOpen(true);
  }

  function cancelEdit() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }
async function toggleCategorySetting(category, field, value) {
  setError('');
  setSuccess('');

  try {
    const updated = await updateCategorySettings(category.id, {
      [field]: value,
    });

    setItems((current) =>
      current.map((item) =>
        item.id === category.id ? { ...item, ...updated } : item
      )
    );

    setSuccess('Category settings updated successfully.');
  } catch (requestError) {
    setError(
      requestError.message || 'Unable to update category settings.'
    );
  }
}

async function handleDeleteCategory(category) {
  const confirmed = window.confirm(
    `Delete "${category.name}" permanently? This cannot be undone.`
  );

  if (!confirmed) return;

  setError('');
  setSuccess('');

  try {
    await deleteCategory(category.id);

    setItems((current) =>
      current.filter((item) => item.id !== category.id)
    );
    setSelectedIds((current) =>
      current.filter((id) => id !== category.id)
    );

    setSuccess('Category deleted successfully.');
  } catch (requestError) {
    setError(
      requestError.message ||
        'Unable to delete category. It may have products or child categories.'
    );
  }
}
  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const slug = makeSlug(form.slug);

    if (!name || !slug) {
      setError('Please enter a category name and slug.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
  name,
  slug,
  parent_id: form.parent_id || null,
  description: form.description.trim() || null,
  image_url: form.image_url.trim() || null,
};
      if (editingId) {
        await updateCategory(editingId, payload);
        setSuccess('Category updated successfully.');
      } else {
        await createCategory(payload);
        setSuccess('Category created successfully.');
      }

      setForm(emptyForm);
      setEditingId(null);
      setFormOpen(false);
      setReload((current) => current + 1);
    } catch (requestError) {
      setError(
        requestError.message || 'Unable to save category.'
      );
    } finally {
      setSaving(false);
    }
  }

  const parentOptions = items.filter(
    (item) => item.id !== editingId
  );

  return (
    <section className="module-page categories-page">
      {/* Hero Banner */}
      <div className="category-hero-card">
        <div className="category-hero-content">
          <span className="category-hero-tag">AUMVEDA BOTANICAL TAXONOMY</span>
          <h2>Categories &amp; Ayurvedic Collections</h2>
        </div>

        <div className="category-hero-badge">
          <span className="category-pulse-dot" />
          <span>{items.length} Collections</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="category-toolbar">
        <div className="category-search-wrap">
          <Search size={18} className="category-search-icon" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories by name, slug, or description..."
            aria-label="Search categories"
          />
        </div>

        <button
          type="button"
          className="category-create-button"
          onClick={startCreate}
        >
          <Plus size={16} />
          <span>Create Category</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="category-table-card">
        {error && !formOpen && (
          <div className="error-state" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="category-success-alert" role="status">
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess('')}
              aria-label="Dismiss alert"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">Loading categories...</div>
        ) : visibleItems.length === 0 ? (
          <div className="empty-state">
            {search
              ? 'No categories match your search.'
              : 'No categories found.'}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table category-data-table">
              <thead>
                <tr>
                  <th className="th-select">
                    <input
                      type="checkbox"
                      checked={
                        visibleItems.length > 0 &&
                        visibleItems.every((item) =>
                          selectedIds.includes(item.id)
                        )
                      }
                      onChange={toggleVisibleCategorySelection}
                      aria-label="Select all visible categories"
                    />
                  </th>
                  <th className="th-category">CATEGORY</th>
                  <th className="th-slug">SLUG</th>
                  <th className="th-parent">PARENT</th>
                  <th className="th-sort">SORT ORDER</th>
                  <th className="th-status">STATUS</th>
                  <th className="th-actions">ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {visibleItems.map((item) => {
                  const parent = items.find(
                    (category) => category.id === item.parent_id
                  );

                  return (
                    <tr
                      key={item.id}
                      className={
                        selectedIds.includes(item.id)
                          ? 'row-selected'
                          : ''
                      }
                    >
                      <td className="td-select">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() =>
                            toggleCategorySelection(item.id)
                          }
                          aria-label={`Select ${item.name || 'category'}`}
                        />
                      </td>
                      <td className="td-category">
                        <div className="category-name-cell">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt=""
                              className="category-thumbnail"
                              loading="lazy"
                            />
                          ) : (
                            <div className="category-thumbnail category-thumbnail-fallback">
                              <FolderTree size={18} />
                            </div>
                          )}

                          <div className="category-text-meta">
                            <strong className="category-title">
                              {item.name || '—'}
                            </strong>
                            {item.description && (
                              <p className="category-description">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="td-slug">
                        <span className="category-slug-badge">
                          {item.slug || '—'}
                        </span>
                      </td>

                      <td className="td-parent">
                        {parent ? (
                          <span className="category-parent-pill">
                            {parent.name}
                          </span>
                        ) : (
                          <span className="category-no-parent">—</span>
                        )}
                      </td>

                      <td className="td-sort">
                        <input
                          className="category-sort-input"
                          type="number"
                          min="0"
                          value={item.sort_order ?? 0}
                          onChange={(event) =>
                            setItems((current) =>
                              current.map((category) =>
                                category.id === item.id
                                  ? {
                                      ...category,
                                      sort_order: event.target.value,
                                    }
                                  : category
                              )
                            )
                          }
                          onBlur={(event) =>
                            toggleCategorySetting(
                              item,
                              'sort_order',
                              Number(event.target.value)
                            )
                          }
                          aria-label={`Sort order for ${item.name}`}
                        />
                      </td>

                      <td className="td-status">
                        <select
                          className={`category-status-select status-${
                            item.is_active ? 'active' : 'inactive'
                          } category-status-${
                            item.is_active ? 'active' : 'inactive'
                          }`}
                          value={item.is_active ? 'active' : 'inactive'}
                          onChange={(event) =>
                            toggleCategorySetting(
                              item,
                              'is_active',
                              event.target.value === 'active'
                            )
                          }
                          aria-label={`Status for ${item.name}`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>

                      <td className="td-actions">
                        <div className="category-row-actions">
                          <button
                            type="button"
                            className="category-action-btn edit-btn"
                            onClick={() => startEdit(item)}
                            title={`Edit ${item.name}`}
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="category-action-btn delete-btn"
                            onClick={() => handleDeleteCategory(item)}
                            title={`Delete ${item.name}`}
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 size={14} />
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
      </div>

      {formOpen && (
        <div
          className="category-modal-overlay"
          onClick={() => !saving && cancelEdit()}
        >
          <section
            className="category-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="category-modal-header">
              <div>
                <span className="category-modal-tag">
                  {editingId ? 'UPDATE COLLECTION' : 'NEW TAXONOMY'}
                </span>
                <h3 id="category-modal-title">
                  {editingId ? 'Edit Category' : 'Create Category'}
                </h3>
                <p>
                  {editingId
                    ? 'Update category information and Ayurvedic classification.'
                    : 'Add a new herbal category to your collections catalog.'}
                </p>
              </div>

              <button
                type="button"
                className="category-modal-close"
                onClick={cancelEdit}
                disabled={saving}
                aria-label="Close category form"
              >
                ×
              </button>
            </header>

            {error && (
              <div className="error-state" role="alert">
                {error}
              </div>
            )}

            <form className="category-form" onSubmit={handleSubmit}>
              <div className="category-form-grid">
                <label>
                  <span>Category Name</span>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={(event) =>
                      handleNameChange(event.target.value)
                    }
                    placeholder="e.g. Personal Care"
                    maxLength={150}
                    required
                  />
                </label>

                <label>
                  <span>Slug</span>
                  <input
                    value={form.slug}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        slug: makeSlug(event.target.value),
                      }))
                    }
                    placeholder="personal-care"
                    maxLength={180}
                    required
                  />
                </label>

                <label>
                  <span>Parent Category</span>
                  <select
                    value={form.parent_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        parent_id: event.target.value,
                      }))
                    }
                  >
                    <option value="">No parent category</option>
                    {parentOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="category-form-full">
                  <span>Description</span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Enter category description and therapeutic focus..."
                    rows={3}
                    maxLength={500}
                  />
                </label>

                <label className="category-form-full">
                  <span>Category Image URL</span>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        image_url: event.target.value,
                      }))
                    }
                    placeholder="https://example.com/category-image.jpg"
                  />
                </label>

                {form.image_url && (
                  <div className="category-image-preview category-form-full">
                    <img
                      src={form.image_url}
                      alt="Category preview"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="category-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelEdit}
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
                      ? 'Save Changes'
                      : 'Create Category'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <style>{`
        .categories-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
        }

        /* Hero Banner */
        .category-hero-card {
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

        .category-hero-content {
          max-width: 600px;
        }

        .category-hero-tag {
          display: inline-block;
          color: #1F5133;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .category-hero-content h2 {
          margin: 0;
          color: #123D2B;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.2px;
          line-height: 1.25;
        }

        .category-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 16px;
          border-radius: 9999px;
          background: #FFFFFF;
          border: 1px solid #D8E7D4;
          color: #123D2B;
          font-size: 12.5px;
          font-weight: 700;
          box-shadow: 0 2px 6px rgba(18, 61, 43, 0.04);
        }

        .category-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #16A34A;
          box-shadow: 0 0 0 2.5px rgba(22, 163, 74, 0.2);
        }

        /* Toolbar */
        .category-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .category-search-wrap {
          position: relative;
          flex: 1 1 340px;
          min-width: 260px;
        }

        .category-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #718475;
          pointer-events: none;
        }

        .category-search-wrap input {
          width: 100%;
          padding: 10px 14px 10px 40px;
          border-radius: 12px;
          border: 1px solid #D5E4D2;
          background: #FFFFFF;
          color: #123D2B;
          font-size: 13px;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }

        .category-search-wrap input:focus {
          border-color: #276345;
          outline: none;
          box-shadow: 0 0 0 3px rgba(39, 99, 69, 0.12);
        }

        .category-create-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 18px;
          border-radius: 11px;
          border: 1px solid #144422;
          background: #173F1D;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(23, 63, 29, 0.2);
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .category-create-button:hover {
          background: #113417;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(23, 63, 29, 0.28);
        }

        /* Table Card */
        .category-table-card {
          border-radius: 16px;
          background: #FFFFFF;
          border: 1px solid #E1EBE0;
          overflow: hidden;
          box-shadow: 0 1px 6px rgba(18, 61, 43, 0.03);
        }

        .category-success-alert {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 18px;
          background: #E8F5E9;
          border-bottom: 1px solid #C8E6C9;
          color: #166534;
          font-size: 12.5px;
          font-weight: 600;
        }

        .category-success-alert button {
          background: none;
          border: none;
          font-size: 18px;
          color: #166534;
          cursor: pointer;
          line-height: 1;
        }

        .category-data-table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          text-align: left;
        }

        .category-data-table thead {
          background: #E8F0E4;
        }

        .category-data-table th {
          padding: 11px 12px;
          color: #22422E;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border-bottom: 1px solid #DCE6D9;
          white-space: nowrap;
        }

        .category-data-table td {
          padding: 11px 12px;
          border-bottom: 1px solid #EEF3ED;
          vertical-align: middle;
          color: #374151;
          font-size: 13px;
          background: #FFFFFF;
        }

        .category-data-table tr:hover td {
          background: #FAFDF9;
        }

        .category-data-table tr.row-selected td {
          background: #F2F8F1;
        }

        .category-data-table input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #173F1D;
          cursor: pointer;
          border-radius: 4px;
        }

        /* Fixed Proportional Column Widths to Eliminate Awkward Spacing */
        .category-data-table .th-select,
        .category-data-table .td-select {
          width: 44px;
          text-align: center;
          padding: 11px 6px !important;
        }

        .category-data-table .th-category,
        .category-data-table .td-category {
          width: 38%;
          min-width: 220px;
        }

        .category-data-table .th-slug,
        .category-data-table .td-slug {
          width: 20%;
          min-width: 130px;
        }

        .category-data-table .th-parent,
        .category-data-table .td-parent {
          width: 18%;
          min-width: 120px;
        }

        .category-data-table .th-sort,
        .category-data-table .td-sort {
          width: 95px;
          text-align: center;
        }

        .category-data-table .th-status,
        .category-data-table .td-status {
          width: 115px;
          text-align: center;
        }

        .category-data-table .th-actions,
        .category-data-table .td-actions {
          width: 85px;
          text-align: center;
        }

        /* Cells */
        .category-name-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .category-thumbnail {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid #E2ECE0;
          flex-shrink: 0;
          background: #F3F7F2;
        }

        .category-thumbnail-fallback {
          display: grid;
          place-items: center;
          background: #DCECD9;
          color: #123D2B;
        }

        .category-text-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .category-title {
          color: #123D2B;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.3;
        }

        .category-description {
          margin: 0;
          color: #718475;
          font-size: 11.5px;
          line-height: 1.35;
          max-width: 480px;
          white-space: normal;
          overflow-wrap: break-word;
        }
          max-width: 260px;
          white-space: normal;
        }

        .category-slug-badge {
          display: inline-block;
          color: #374151;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .category-parent-pill {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 6px;
          background: #F3F4F6;
          color: #4B5563;
          font-size: 11.5px;
          font-weight: 500;
        }

        .category-no-parent {
          color: #9CA3AF;
        }

        .category-sort-input {
          width: 52px;
          height: 30px;
          padding: 0 6px;
          text-align: center;
          margin: 0 auto;
          display: block;
          border: 1px solid #D5E4D2;
          border-radius: 8px;
          background: #FFFFFF;
          color: #123D2B;
          font-weight: 600;
          font-size: 13px;
          transition: border-color 0.15s;
        }

        .category-sort-input:focus {
          border-color: #276345;
          outline: none;
          box-shadow: 0 0 0 2px rgba(39, 99, 69, 0.1);
        }

        /* Single-layer Status Pill Select */
        .categories-page .category-status-select {
          appearance: none !important;
          -webkit-appearance: none !important;
          display: inline-block !important;
          margin: 0 auto !important;
          padding: 4px 22px 4px 12px !important;
          border-radius: 9999px !important;
          font-size: 11.5px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          outline: none !important;
          border-width: 1px !important;
          border-style: solid !important;
          background-repeat: no-repeat !important;
          background-position: right 8px center !important;
          background-size: 9px !important;
          box-shadow: none !important;
          transition: all 0.15s ease !important;
          line-height: 1.2 !important;
        }

        .categories-page .category-status-select.status-active {
          background-color: #DCFCE7 !important;
          color: #15803D !important;
          border-color: #BBF7D0 !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2315803D' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;
        }

        .categories-page .category-status-select.status-inactive {
          background-color: #FEE2E2 !important;
          color: #B91C1C !important;
          border-color: #FECACA !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23B91C1C' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;
        }

        .categories-page .category-status-select:focus {
          box-shadow: 0 0 0 2.5px rgba(39, 99, 69, 0.15) !important;
        }

        /* Row actions */
        .category-row-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          white-space: nowrap;
        }

        .category-action-btn {
          display: inline-grid;
          align-items: center;
          justify-items: center;
          width: 30px;
          height: 30px;
          padding: 0;
          flex: 0 0 30px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .category-action-btn.edit-btn {
          border: 1px solid #D5E4D2;
          background: #FFFFFF;
          color: #123D2B;
        }

        .category-action-btn.edit-btn:hover {
          background: #EAF4EA;
          border-color: #276345;
        }

        .category-action-btn.delete-btn {
          border: 1px solid #FECACA;
          background: #FEF2F2;
          color: #991B1B;
        }

        .category-action-btn.delete-btn:hover {
          background: #FEE2E2;
          border-color: #F87171;
          color: #7F1D1D;
        }

        /* Modal */
        .category-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(18, 61, 43, 0.45);
          backdrop-filter: blur(8px);
        }

        .category-modal {
          width: min(720px, 100%);
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          padding: 28px 32px;
          border: 1px solid #E2ECE0;
          border-radius: 18px;
          background: #FFFFFF;
          box-shadow: 0 24px 70px rgba(18, 61, 43, 0.2);
        }

        .category-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding-bottom: 18px;
          border-bottom: 1px solid #EDF3EC;
          margin-bottom: 20px;
        }

        .category-modal-tag {
          display: inline-block;
          color: #1F5133;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 4px;
        }

        .category-modal-header h3 {
          margin: 0;
          color: #123D2B;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
        }

        .category-modal-header p {
          margin: 4px 0 0;
          color: #716F68;
          font-size: 13px;
        }

        .category-modal-close {
          width: 34px;
          height: 34px;
          border: 1px solid #D5E4D2;
          border-radius: 9px;
          background: #F8FAF7;
          color: #123D2B;
          font-size: 20px;
          line-height: 1;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: background 0.15s;
        }

        .category-modal-close:hover {
          background: #E8F2E7;
        }

        .category-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .category-form-full {
          grid-column: 1 / -1;
        }

        .category-form label span {
          display: block;
          margin-bottom: 6px;
          color: #123D2B;
          font-size: 12px;
          font-weight: 600;
        }

        .category-form input,
        .category-form select,
        .category-form textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 13px;
          border: 1px solid #D5E4D2;
          border-radius: 10px;
          background: #FFFFFF;
          color: #123D2B;
          font: inherit;
          font-size: 13px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .category-form input:focus,
        .category-form select:focus,
        .category-form textarea:focus {
          border-color: #276345;
          box-shadow: 0 0 0 3px rgba(39, 99, 69, 0.12);
          outline: none;
        }

        .category-image-preview img {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid #D5E4D2;
          margin-top: 6px;
        }

        .category-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          margin-top: 20px;
          border-top: 1px solid #EDF3EC;
        }

        .category-form-actions .primary-button {
          padding: 10px 22px;
          border: 1px solid #144422;
          background: #173F1D;
          color: #FFFFFF;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(23, 63, 29, 0.2);
          transition: all 0.18s ease;
        }

        .category-form-actions .primary-button:hover:not(:disabled) {
          background: #113417;
          transform: translateY(-1px);
        }

        .category-form-actions .secondary-button {
          padding: 10px 18px;
          border: 1px solid #D5E4D2;
          background: #FFFFFF;
          color: #123D2B;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .category-form-actions .secondary-button:hover:not(:disabled) {
          background: #F8FAF7;
          border-color: #276345;
        }

        @media (max-width: 640px) {
          .category-form-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .category-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .category-create-button {
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
}
