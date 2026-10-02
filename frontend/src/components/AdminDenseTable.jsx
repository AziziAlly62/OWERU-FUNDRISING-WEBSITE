import { useMemo, useState } from 'react'
import Pagination from './Pagination'
import { AdminGridSkeleton } from './LoadingSpinner'

/**
 * AdminDenseTable — shared dense-table presenter for every admin data page.
 * Mirrors the AdminRequests dense pattern exactly: compact rows, status pills,
 * hover micro-interactions, right-aligned currency, combined search + status
 * filter, local pagination. One component = one consistent admin UX.
 *
 * Props:
 *   rows        Array of records
 *   columns     [{ key, label (en), labelSw, align ('left'|'right'|'center'), pill(row) -> cls/text, render(row)}]
 *   loading     bool
 *   emptyText   sw-aware empty state string
 *   perPage     number (default 9)
 *   label       Pagination label (e.g. 'Requests')
 *   rowActions  fn(row) -> ReactNode  (right-aligned action buttons)
 *   searchKeys  array of keys used for the global search box
 *   statusKey   row field used by the status filter select (default 'status')
 *   statusMap   { value: { en, sw } } for the filter + pills
 */
export default function AdminDenseTable({
  rows = [],
  columns = [],
  loading = false,
  emptyText = 'No records.',
  perPage = 9,
  label = 'Records',
  rowActions = null,
  searchKeys = [],
  statusKey = 'status',
  statusMap = {},
  sw = false,
  additionalToolbar = null,
  loadError = null,
  onRetry = null,
}) {
  const [q, setQ] = useState('')
  const [ft, setFt] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(perPage)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      const okStatus = ft === 'all' || String(r[statusKey] || '') === ft
      const okQ = !needle
        || searchKeys.some((k) => {
          const v = r[k]
          return v != null && String(v).toLowerCase().includes(needle)
        })
      return okStatus && okQ
    })
  }, [rows, q, ft, statusKey, searchKeys])

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * limit, safePage * limit)

  const statusValues = useMemo(() => {
    const seen = new Set()
    rows.forEach((r) => { const v = r[statusKey]; if (v != null && v !== '') seen.add(String(v)) })
    return Array.from(seen)
  }, [rows, statusKey])

  const hasStatusFilter = statusValues.length > 0
  const filterActive = q.trim() !== '' || (hasStatusFilter && ft !== 'all')

  if (loading) {
    return <AdminGridSkeleton cards={6} message="" />
  }

  return (
    <div>
      {loadError && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-error-100 text-error-700 text-sm font-bold" aria-hidden="true">!</span>
            <div>
              <p className="text-sm font-semibold text-error-700">{sw ? 'Imeshindikana kupakia data.' : 'Failed to load data.'}</p>
              <p className="text-xs text-error-700/80">{loadError}</p>
            </div>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="shrink-0 btn-secondary btn-sm border-error-200 text-error-700 hover:bg-error-50"
            >
              {sw ? 'Jaribu tena' : 'Retry'}
            </button>
          )}
        </div>
      )}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          placeholder={sw ? 'Tafuta...' : 'Search...'}
          className="w-full sm:max-w-sm rounded-[10px] border border-ink-200 bg-surface px-4 py-2.5 text-sm font-medium text-ink-800 transition-colors placeholder:text-ink-400 focus:border-oweru-500 focus:outline-none"
        />
        {hasStatusFilter && (
          <select
            value={ft}
            onChange={(e) => { setFt(e.target.value); setPage(1) }}
            className="w-full sm:w-48 rounded-[10px] border border-ink-200 bg-surface px-3 py-2.5 text-sm font-medium text-ink-800 focus:border-oweru-500 focus:outline-none"
            aria-label={sw ? 'Chuja kwa hali' : 'Filter by status'}
          >
            <option value="all">{sw ? 'Hali zote' : 'All statuses'}</option>
            {statusValues.map((v) => (
              <option key={v} value={v}>{statusMap[v] ? (sw ? statusMap[v].sw : statusMap[v].en) : v}</option>
            ))}
          </select>
        )}
        <span className="text-xs text-ink-500 sm:ml-auto">{filtered.length} / {rows.length}</span>
        <select
          value={limit}
          onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
          className="w-full sm:w-32 rounded-[10px] border border-ink-200 bg-surface px-3 py-2.5 text-sm font-medium text-ink-800 focus:border-oweru-500 focus:outline-none"
          aria-label={sw ? 'Idadi kwa ukurasa' : 'Rows per page'}
        >
          {[9, 25, 50, 100].map((n) => (
            <option key={n} value={n}>{sw ? `${n} kwa ukurasa` : `${n} per page`}</option>
          ))}
        </select>
        {additionalToolbar}
      </div>

      <div className="panel table-panel">
        <table className="admin-table w-full text-left">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th
                  key={c.key || i}
                  className={'px-3 py-2.5 font-semibold ' + (c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left')}
                >
                  {sw && c.labelSw ? c.labelSw : c.label}
                </th>
              ))}
              {rowActions && <th className="px-3 py-2.5 font-semibold text-right"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)} className="px-3 py-10 text-center text-sm text-ink-500">
                  <div>{emptyText}</div>
                  {filterActive && (
                    <button
                      type="button"
                      onClick={() => { setQ(''); setFt('all'); setPage(1) }}
                      className="mt-3 rounded-[10px] border border-ink-200 bg-surface px-3 py-1.5 text-xs font-semibold text-oweru-700 hover:bg-oweru-50"
                    >
                      {sw ? 'Ondocha misimbo' : 'Clear filters'}
                    </button>
                  )}
                </td>
              </tr>
            ) : paginated.map((r, ri) => (
              <tr key={r.id || ri} className="group">
                {columns.map((c, i) => (
                  <td
                    key={c.key || i}
                    className={'px-3 py-2.5 ' + (c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left')}
                  >
                    {c.pill ? (
                      <span className={'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ' + c.pill(r).cls}>
                        {c.pill(r).dot && <span className={'h-1.5 w-1.5 rounded-full ' + c.pill(r).dot} />}
                        {c.pill(r).text}
                      </span>
                    ) : c.render ? c.render(r) : (
                      <span className={c.bold === false ? 'text-xs text-ink-600' : 'text-[13px] font-semibold text-ink-800'}>
                        {r[c.key] ?? '—'}
                      </span>
                    )}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">{rowActions(r)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        total={filtered.length}
        label={label}
        onChange={setPage}
      />
    </div>
  )
}
