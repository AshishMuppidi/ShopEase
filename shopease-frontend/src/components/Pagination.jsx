/**
 * Zero-based pagination control. `page` is the current 0-based index,
 * `totalPages` the count. Calls onChange(newZeroBasedPage). Renders nothing
 * when there's a single page or less.
 */
export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null

  const canPrev = page > 0
  const canNext = page < totalPages - 1

  // Build a compact window of page numbers around the current page.
  const windowSize = 5
  let start = Math.max(0, page - Math.floor(windowSize / 2))
  let end = Math.min(totalPages, start + windowSize)
  start = Math.max(0, end - windowSize)
  const pages = []
  for (let i = start; i < end; i += 1) pages.push(i)

  const btn =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <nav
      className="flex items-center justify-center gap-1.5"
      aria-label="Pagination"
    >
      <button
        type="button"
        className={`${btn} border-slate-300 bg-white text-slate-600 hover:bg-slate-50`}
        onClick={() => canPrev && onChange(page - 1)}
        disabled={!canPrev}
      >
        Prev
      </button>

      {start > 0 && <span className="px-1 text-slate-400">…</span>}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`${btn} ${
            p === page
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {p + 1}
        </button>
      ))}

      {end < totalPages && <span className="px-1 text-slate-400">…</span>}

      <button
        type="button"
        className={`${btn} border-slate-300 bg-white text-slate-600 hover:bg-slate-50`}
        onClick={() => canNext && onChange(page + 1)}
        disabled={!canNext}
      >
        Next
      </button>
    </nav>
  )
}
