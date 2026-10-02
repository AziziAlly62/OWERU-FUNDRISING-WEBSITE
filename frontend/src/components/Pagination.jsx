export default function Pagination({ page, totalPages, onChange, total, label }) {
  if (totalPages <= 1 && total === undefined) return null

  const from = total !== undefined && total > 0 ? (page - 1) * (totalPages > 0 ? Math.ceil(total / totalPages) : 0) + 1 : null
  const to = total !== undefined ? Math.min(page * (totalPages > 0 ? Math.ceil(total / totalPages) : 0), total) : null

  const go = (p) => {
    if (p >= 1 && p <= totalPages && p !== page) onChange(p)
  }

  let pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6">
      {total !== undefined && (
        <div className="text-sm text-ink-500">
          {label}
          {from && to ? `${from}–${to} / ${total}` : ''}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          className="px-3 py-2 rounded-lg border border-ink-300 bg-white text-sm font-semibold text-ink-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-50"
          aria-label="Previous page"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-2 py-2 text-sm text-ink-500">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                p === page
                  ? 'bg-oweru-500 text-white border-oweru-400 shadow-sm'
                  : 'bg-white border-ink-300 text-ink-700 hover:bg-ink-50'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => go(page + 1)}
          className="px-3 py-2 rounded-lg border border-ink-300 bg-white text-sm font-semibold text-ink-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-50"
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  )
}
