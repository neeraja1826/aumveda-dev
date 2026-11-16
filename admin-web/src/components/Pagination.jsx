import { ChevronLeft, ChevronRight } from 'lucide-react';

export const ADMIN_LIST_PAGE_SIZE = 10;

export default function Pagination({
  totalItems,
  currentPage,
  pageSize = ADMIN_LIST_PAGE_SIZE,
  onPageChange,
  loading = false,
  itemLabel = 'items',
}) {
  const pageCount = Math.ceil(totalItems / pageSize);
  if (pageCount <= 1) return null;

  const page = Math.min(Math.max(currentPage, 0), pageCount - 1);
  const firstItem = page * pageSize + 1;
  const lastItem = Math.min((page + 1) * pageSize, totalItems);

  return (
    <nav
      className="listing-pagination"
      aria-label={`${itemLabel} pagination`}
    >
      <span>
        Showing <strong>{firstItem}–{lastItem}</strong> of{' '}
        <strong>{totalItems}</strong> {itemLabel}
      </span>

      <div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onPageChange(page - 1)}
          disabled={loading || page === 0}
        >
          <ChevronLeft size={15} />
          Previous
        </button>
        <span className="listing-pagination-page" aria-live="polite">
          Page {page + 1} of {pageCount}
        </span>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onPageChange(page + 1)}
          disabled={loading || page >= pageCount - 1}
        >
          Next
          <ChevronRight size={15} />
        </button>
      </div>
    </nav>
  );
}
