import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import { fetchAuditLogs } from '../../api'
import { onStatsChange } from '../../statsBus'
import AdminDenseTable from '../../components/AdminDenseTable'

export default function AdminAudit() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    let alive = true
    const load = () => {
      setLoadError(null)
      fetchAuditLogs()
        .then((r) => alive && setRows(Array.isArray(r) ? r : []))
        .catch((e) => alive && setLoadError(e.message || String(e)))
        .finally(() => alive && setLoading(false))
    }
    load()
    const off = onStatsChange(load)
    return () => { alive = false; off() }
  }, [])

  const retry = () => {
    setLoading(true)
    setLoadError(null)
    fetchAuditLogs()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => setLoadError(e.message || String(e)))
      .finally(() => setLoading(false))
  }

  const columns = [
    { key: 'action', label: sw ? 'Kitendo' : 'Action', labelSw: 'Kitendo', render: (a) => (
      <span className="text-[13px] font-mono font-bold text-oweru-700">{a.action}</span>
    ) },
    { key: 'entity', label: sw ? 'Kitu' : 'Entity', labelSw: 'Kitu', render: (a) => <span className="text-xs text-ink-600">{a.entity || '—'}</span> },
    { key: 'user', label: sw ? 'Mtumiaji' : 'User', labelSw: 'Mtumiaji', render: (a) => (
      <span className="inline-flex items-center gap-2">
        <span className="h-6 w-6 rounded-full bg-oweru-50 text-oweru-700 grid place-items-center text-[11px] font-bold">{(a.user || '?').charAt(0).toUpperCase()}</span>
        <span className="text-xs font-semibold text-ink-700">{a.user || '—'}</span>
      </span>
    ) },
    { key: 'date', label: sw ? 'Tarehe' : 'Date', labelSw: 'Tarehe', render: (a) => <span className="text-xs font-mono text-ink-500">{a.date || '—'}</span> },
  ]

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">{sw ? 'Rekodi ya Shughuli (Audit Logs)' : 'Audit Logs'}</h1>
      <p className="text-sm text-ink-500 mb-6">
        {sw ? 'Rekodi isiyobadilika ya vitendo nyeti vya mfumo.' : 'Immutable record of sensitive system actions.'}
      </p>

      <AdminDenseTable
        sw={sw}
        rows={rows}
        columns={columns}
        loading={loading}
        loadError={loadError}
        onRetry={retry}
        searchKeys={['action', 'entity', 'user']}
        perPage={12}
        emptyText={sw ? 'Hakuna rekodi.' : 'No records.'}
        label={sw ? 'Rekodi' : 'Records'}
      />
    </div>
  )
}