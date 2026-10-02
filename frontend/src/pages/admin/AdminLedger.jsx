import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import { fetchPublicLedger } from '../../api'
import { onStatsChange } from '../../statsBus'
import AdminDenseTable from '../../components/AdminDenseTable'

export default function AdminLedger() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    let alive = true
    const load = () => {
      setLoadError(null)
      fetchPublicLedger()
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
    fetchPublicLedger()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => setLoadError(e.message || String(e)))
      .finally(() => setLoading(false))
  }

  const columns = [
    { key: 'item', label: sw ? 'Kifaa' : 'Item', labelSw: 'Kifaa', render: (l) => (
      <div className="min-w-0">
        <div className="text-[13px] font-bold text-ink-800 capitalize truncate max-w-[240px]">{l.item}</div>
        <div className="text-[11px] text-ink-400 truncate max-w-[240px] capitalize">{l.supplier}</div>
      </div>
    ) },
    { key: 'status', label: sw ? 'Hali' : 'Status', labelSw: 'Hali', pill: (l) => l.paid
      ? { text: sw ? '✓ Imelipwa' : '✓ Paid', cls: 'bg-success-50 text-success-700 border border-success-200', dot: 'bg-success-500' }
      : { text: sw ? 'Inasubiri' : 'Pending', cls: 'bg-warning-50 text-warning-700 border border-warning-100', dot: 'bg-warning-500' } },
    { key: 'amount', label: sw ? 'Kiasi' : 'Amount', labelSw: 'Kiasi', align: 'right', render: (l) => (
      <span className="text-xs font-bold tabular-nums text-ink-800">{l.amount > 0 ? 'TZS ' + l.amount.toLocaleString() : '—'}</span>
    ) },
    { key: 'date', label: sw ? 'Tarehe' : 'Date', labelSw: 'Tarehe', render: (l) => <span className="text-xs text-ink-500">{l.date || '—'}</span> },
  ]

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">{sw ? 'Rejesta ya Umma' : 'Public Ledger'}</h1>
      <p className="text-sm text-ink-500 mb-6">
        {sw ? 'Daftari sawa linalochapishwa kwenye tovuti ya umma — linatokana na malipo ya wauzaji yaliyothibitishwa. Taarifa nyeti hazionyeshwi.' : 'The same ledger shown on the public site — sourced from verified supplier payments. Sensitive data stays hidden.'}
      </p>

      <AdminDenseTable
        sw={sw}
        rows={rows}
        columns={columns}
        loading={loading}
        loadError={loadError}
        onRetry={retry}
        searchKeys={['item', 'supplier']}
        statusKey="paid"
        statusMap={{
          true: { en: 'Paid', sw: 'Imelipwa' },
          false: { en: 'Pending', sw: 'Inasubiri' },
        }}
        perPage={12}
        emptyText={sw ? 'Hakuna rekodi.' : 'No records.'}
        label={sw ? 'Rekodi' : 'Records'}
      />
    </div>
  )
}