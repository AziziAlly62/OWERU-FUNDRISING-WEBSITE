import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import {
  fetchAdminDonations,
  confirmDonation,
  deleteDonation,
} from '../../api'
import { onStatsChange } from '../../statsBus'
import { useToast } from '../../components/Toast'
import AdminDenseTable from '../../components/AdminDenseTable'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminDonations() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const { toast } = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const perPage = 10

  const load = () => {
    setLoading(true)
    setLoadError(null)
    fetchAdminDonations()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => { setRows([]); setLoadError(e.message || String(e)) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let alive = true
    const loadLive = () => fetchAdminDonations()
      .then((r) => alive && setRows(Array.isArray(r) ? r : []))
      .catch((e) => alive && setLoadError(e.message || String(e)))
      .finally(() => alive && setLoading(false))
    loadLive()
    const off = onStatsChange(loadLive)
    return () => { alive = false; off() }
  }, [])

  const handleConfirm = async (id) => {
    setBusyId(id)
    try {
      await confirmDonation(id)
      toast(sw ? 'Mchango umethibitishwa.' : 'Donation confirmed.')
      setConfirm(null)
      load()
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id) => {
    setBusyId(`del-${id}`)
    try {
      await deleteDonation(id)
      toast(sw ? 'Mchango umefutwa.' : 'Donation deleted.')
      setConfirm(null)
      load()
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const askConfirm = (d) => {
    setConfirm({
      title: sw ? 'Thibitisha Mchango' : 'Confirm Donation',
      message: sw
        ? `Thibitisha mchango wa TZS ${d.amount.toLocaleString()} kutoka "${d.donor}"? Fedha zitahesabiwa kwenye kifaa husika.`
        : `Confirm the donation of TZS ${d.amount.toLocaleString()} from "${d.donor}"? Funds will be counted toward the item.`,
      confirmLabel: sw ? 'Thibitisha' : 'Confirm',
      icon: '✓',
      tone: 'primary',
      onConfirm: () => handleConfirm(d.id),
    })
  }

  const askDelete = (d) => {
    const label = sw
      ? `una uhakika unataka kufuta mchango huu wa TZS ${d.amount.toLocaleString()} kutoka "${d.donor}"? Hatua hii haiwezi kutenduliwa.`
      : `Delete this donation of TZS ${d.amount.toLocaleString()} from "${d.donor}"? This cannot be undone.`
    setConfirm({
      title: sw ? 'Futa Mchango' : 'Delete Donation',
      message: label,
      confirmLabel: sw ? 'Futa' : 'Delete',
      icon: '🗑',
      onConfirm: () => handleDelete(d.id),
    })
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">{sw ? 'Michango' : 'Donations'}</h1>
      <p className="text-sm text-ink-500 mb-6">
        {sw ? 'Michango yote, uthibitisho na maendeleo.' : 'All donations, confirmation and progress.'}
      </p>

      <AdminDenseTable
        sw={sw}
        rows={rows}
        loading={loading}
        loadError={loadError}
        onRetry={load}
        searchKeys={['donor', 'item', 'ref']}
        columns={[
          { key: 'donor', label: sw ? 'Mfadhili' : 'Donor', render: (d) => (
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-ink-800 uppercase tracking-tight truncate max-w-[220px] capitalize">{d.donor}</div>
              {d.item && <div className="truncate max-w-[220px] text-[11px] text-ink-400 capitalize">{d.item}</div>}
            </div>
          ) },
          { key: 'ref', label: sw ? 'Rejea' : 'Ref', render: (d) => (
            <code className="font-mono text-[11px] text-ink-500 bg-ink-50 border border-ink-200/60 rounded px-1.5 py-0.5 whitespace-nowrap">{d.ref || '—'}</code>
          ) },
          { key: 'amount', label: sw ? 'Kiasi' : 'Amount', align: 'right', render: (d) => (
            <span className="text-xs font-bold tabular-nums text-ink-800">
              {d.amount > 0 ? 'TZS ' + d.amount.toLocaleString() : '—'}
            </span>
          ) },
          { key: 'status', label: sw ? 'Hali' : 'Status', pill: (d) => d.statusRaw === 'confirmed'
            ? { text: sw ? '✓ Imethibitishwa' : '✓ Confirmed', cls: 'bg-success-50 text-success-700 border-success-200', dot: 'bg-success-500' }
            : { text: sw ? 'Inasubiri' : 'Pending', cls: 'bg-warning-50 text-warning-700 border-warning-100', dot: 'bg-warning-500' } },
          { key: 'date', label: sw ? 'Tarehe' : 'Date', render: (d) => (
            <span className="text-xs text-ink-500">{d.date || '—'}</span>
          ) },
        ]}
        rowActions={(d) => (
          <>
            {d.statusRaw !== 'confirmed' && (
              <button
                onClick={() => askConfirm(d)}
                disabled={busyId === d.id}
                className="px-2.5 py-1.5 text-xs font-semibold text-success-700 bg-success-50 hover:bg-success-100 rounded-lg border border-success-200/70 transition-colors disabled:opacity-50"
              >
                {busyId === d.id ? '...' : sw ? 'Thibitisha' : 'Confirm'}
              </button>
            )}
            <button
              onClick={() => askDelete(d)}
              disabled={busyId === `del-${d.id}`}
              className="px-2.5 py-1.5 text-xs font-semibold text-error-700 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {busyId === `del-${d.id}` ? '...' : sw ? 'Futa' : 'Delete'}
            </button>
          </>
        )}
        perPage={10}
        emptyText={sw ? 'Hakuna michango.' : 'No donations.'}
        label={sw ? 'Michango' : 'Donations'}
      />

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        icon={confirm?.icon}
        tone={confirm?.tone || 'danger'}
        confirmLabel={confirm?.confirmLabel}
        cancelLabel={sw ? 'Ghairi' : 'Cancel'}
        busy={!!busyId}
        onConfirm={confirm?.onConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}
