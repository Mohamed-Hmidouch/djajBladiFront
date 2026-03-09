'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function Pagination({
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
  loading = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    const pages: (number | 'ellipsis')[] = [];
    if (page <= 3) {
      pages.push(0, 1, 2, 3, 4, 'ellipsis', totalPages - 1);
    } else if (page >= totalPages - 4) {
      pages.push(0, 'ellipsis', totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
    } else {
      pages.push(0, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages - 1);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--color-border)] mt-4">
      <p className="text-sm text-[var(--color-text-muted)]">
        <span className="font-semibold text-[var(--color-text-body)]">{from}-{to}</span>
        {' '}sur{' '}
        <span className="font-semibold text-[var(--color-text-body)]">{totalElements}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0 || loading}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-body)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
          aria-label="Page precedente"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {getPageNumbers().map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
              &hellip;
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              disabled={loading}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed ${
                p === page
                  ? 'bg-[var(--color-brand)] text-white shadow-md shadow-[var(--color-brand)]/30'
                  : 'border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-brand)]/40'
              }`}
            >
              {(p as number) + 1}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1 || loading}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-body)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
          aria-label="Page suivante"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
