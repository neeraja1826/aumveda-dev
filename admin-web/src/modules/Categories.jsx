
import { useEffect, useMemo, useState } from 'react';
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
};

export default function Categories() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
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
    });
    setError('');
    setSuccess('');
  }

  function cancelEdit() {
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
      <div className="module-intro">
        <div>
          <h2>Categories</h2>
          <p>
            Organize the store catalog and browse structure.
          </p>
        </div>

        <span className="categories-count">
          {visibleItems.length} categories
        </span>
      </div>

      {error && (
        <div className="error-state" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="category-success" role="status">
          {success}
        </div>
      )}

      <div className="module-card category-form-card">
        <h3>{editingId ? 'Edit category' : 'Add category'}</h3>

        <form className="category-form" onSubmit={handleSubmit}>
          <label>
            Category name
            <input
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
            Slug
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
            Parent category
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

          <div className="category-form-actions">
            {editingId && (
              <button
                type="button"
                className="secondary-button"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Save changes'
                  : 'Add category'}
            </button>
          </div>
        </form>
      </div>

      <div className="module-card category-list-card">
        <div className="category-list-toolbar">
          <h3>All categories</h3>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories..."
            aria-label="Search categories"
          />
        </div>

        {loading ? (
          <div className="loading-state">
            Loading categories...
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="empty-state">
            {search
              ? 'No categories match your search.'
              : 'No categories found.'}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Parent</th>
                  <th>Homepage</th>
                  <th>Sort order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleItems.map((item) => {
                  const parent = items.find(
                    (category) => category.id === item.parent_id
                  );

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="category-name-cell">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt=""
                              className="category-thumbnail"
                              loading="lazy"
                            />
                          )}

                          <div>
                            <strong>{item.name || '—'}</strong>

                            {item.description && (
                              <p className="category-description">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>{item.slug || '—'}</td>
                      <td>{parent?.name || '—'}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={Boolean(item.show_on_home)}
                          onChange={(event) =>
                            toggleCategorySetting(
                              item,
                              'show_on_home',
                              event.target.checked
                            )
                          }
                          aria-label={`Show ${item.name} on homepage`}
                        />
                      </td>
                      <td>
                        <input
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

                      <td>
                        <select
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

                      <td>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-danger-button"
                          onClick={() => handleDeleteCategory(item)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .categories-page .module-intro {
          align-items: center;
        }

        .categories-count {
          color: #77747a;
          font-size: 13px;
        }

        .category-form-card,
        .category-list-card {
          padding: 20px;
        }

        .category-form-card h3,
        .category-list-toolbar h3 {
          margin: 0;
          color: #343522;
          font-size: 16px;
        }

        .category-form {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: end;
          gap: 14px;
          margin-top: 16px;
        }

        .category-form label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          color: #45443d;
          font-size: 12px;
          font-weight: 600;
        }

        .category-form input,
        .category-form select,
        .category-list-toolbar input {
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          padding: 10px 12px;
          border: 1px solid #ded9d0;
          border-radius: 8px;
          background: #fff;
          color: #343522;
          font: inherit;
          font-weight: 400;
        }

        .category-form-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          grid-column: 1 / -1;
          justify-content: flex-end;
        }

        .category-form-actions button,
        .category-list-card .secondary-button {
          padding: 9px 13px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .category-form-actions .primary-button {
          border: 1px solid #285447;
          background: #285447;
          color: #fff;
        }

        .category-form-actions .secondary-button,
        .category-list-card .secondary-button {
          border: 1px solid #d9d3c9;
          background: #fff;
          color: #343522;
        }

        .category-list-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }

        .category-list-toolbar input {
          max-width: 280px;
        }

        .categories-page .category-name-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 190px;
        }

        .categories-page .category-thumbnail {
          width: 42px;
          height: 42px;
          object-fit: cover;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .categories-page .category-description {
          margin: 4px 0 0;
          font-size: 12px;
          opacity: .7;
          max-width: 260px;
          white-space: normal;
        }

        .category-status {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 11px;
        }

        .category-status-active {
          background: #e7eee5;
          color: #285447;
        }

        .category-status-inactive {
          background: #f2f0eb;
          color: #77747a;
        }

        .category-success {
          padding: 12px 14px;
          border-radius: 8px;
          background: #e7eee5;
          color: #285447;
          font-size: 13px;
        }

        @media (max-width: 800px) {
          .category-form {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 620px) {
          .category-form {
            grid-template-columns: minmax(0, 1fr);
          }

          .category-form-actions {
            grid-column: auto;
          }

          .category-form-actions button {
            flex: 1;
          }

          .category-list-toolbar input {
            max-width: none;
          }
        }
      `}</style>
    </section>
  );
}
