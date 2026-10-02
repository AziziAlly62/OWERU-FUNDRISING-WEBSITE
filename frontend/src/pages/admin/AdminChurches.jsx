import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import { fetchOrganizationsAdmin, updateOrganizationVerification } from '../../api'
import { onStatsChange } from '../../statsBus'
import { useToast } from '../../components/Toast'
import AdminDenseTable from '../../components/AdminDenseTable'
import ConfirmDialog from '../../components/ConfirmDialog'

const STATUS_LABEL = {
  verified: { en: 'Approved', sw: 'Imeidhinishwa' },
  pending: { en: 'Pending', sw: 'Inasubiri' },
  rejected: { en: 'Rejected', sw: 'Imekataliwa' },
}

const STATUS_STYLE = {
  verified: 'bg-success-100 text-success-700',
  pending: 'bg-gold-100 text-gold-800',
  rejected: 'bg-error-100 text-error-700',
}

const TYPE_LABEL = {
  church: { en: 'Church', sw: 'Kanisa' },
  supplier: { en: 'Supplier', sw: 'Muuzaji' },
  partner: { en: 'Partner', sw: 'Mshirika' },
}

export default function AdminChurches() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const { toast } = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [busy, setBusy] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const load = () => {
    setLoading(true)
    setLoadError(null)
    fetchOrganizationsAdmin()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => { setRows([]); setLoadError(e.message || String(e)) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let alive = true
    const loadLive = () => fetchOrganizationsAdmin()
      .then((r) => alive && setRows(Array.isArray(r) ? r : []))
      .catch((e) => alive && setLoadError(e.message || String(e)))
      .finally(() => alive && setLoading(false))
    loadLive()
    const off = onStatsChange(loadLive)
    return () => { alive = false; off() }
  }, [])

  const setStatus = async (o, status) => {
    setBusy(o.id)
    try {
      await updateOrganizationVerification(o.id, status)
      toast(status === 'verified' ? (sw ? 'Imesasishwa: imeidhinishwa.' : 'Saved: approved.') : status === 'rejected' ? (sw ? 'Imesasishwa: imekataliwa.' : 'Saved: rejected.') : (sw ? 'Imesasishwa: imewekwa pending.' : 'Saved: set to pending.'))
      setConfirm(null)
      load()
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusy(null)
    }
  }

  const askStatus = (o, status) => {
    const label = sw ? STATUS_LABEL[status].sw : STATUS_LABEL[status].en
    setConfirm({
      title: sw ? `Badilisha hali: ${label}` : `Change status: ${label}`,
      message: sw
        ? `Uhakika kilikubadilisha hali ya "${o.name}" kuwa "${label}"?`
        : `Are you sure you want to set "${o.name}" to "${label}"?`,
      confirmLabel: label,
      icon: '✓',
      tone: status === 'rejected' ? 'danger' : status === 'verified' ? 'primary' : 'warning',
      onConfirm: () => setStatus(o, status),
    })
  }

  const columns = [
    { key: 'name', label: sw ? 'Jina' : 'Name', labelSw: 'Jina', bold: true, render: (o) => (
      <span className="text-[13px] font-bold text-ink-800 capitalize">{o.name}</span>
    ) },
    { key: 'type', label: sw ? 'Aina' : 'Type', labelSw: 'Aina', render: (o) => (
      <span className="text-xs text-ink-600">{TYPE_LABEL[o.type]?.[sw ? 'sw' : 'en'] || o.type || '—'}</span>
    ) },
    { key: 'region', label: sw ? 'Mkoa' : 'Region', labelSw: 'Mkoa', render: (o) => <span className="text-xs text-ink-500">{o.region || '—'}</span> },
    { key: 'contact_email', label: 'Email', render: (o) => <span className="text-xs text-ink-600">{o.contact_email || '—'}</span> },
    { key: 'contact_phone', label: sw ? 'Simu' : 'Phone', labelSw: 'Simu', render: (o) => <span className="text-xs text-ink-600">{o.contact_phone || '—'}</span> },
    { key: 'status', label: sw ? 'Hali' : 'Status', labelSw: 'Hali', pill: (o) => ({
      text: (STATUS_LABEL[o.verification_status]?.[sw ? 'sw' : 'en']) || o.verification_status,
      cls: STATUS_STYLE[o.verification_status] || 'bg-ink-100 text-ink-600',
    }) },
  ]

  const pendingCount = rows.filter((r) => r.verification_status === 'pending').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">{sw ? 'Makanisa' : 'Churches'}</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            {sw ? 'Idhinisha au ukatae makanisa yaliyojisajili.' : 'Approve or reject self-registered churches.'}
          </p>
        </div>
        <span className={'rounded-full px-4 py-2 text-xs font-bold ' + (pendingCount > 0 ? 'bg-gold-100 text-gold-800' : 'bg-ink-100 text-ink-600')}>
          {pendingCount} {sw ? 'yanasubiri' : 'awaiting'}
        </span>
      </div>

      <AdminDenseTable
        sw={sw}
        rows={rows}
        columns={columns}
        loading={loading}
        loadError={loadError}
        onRetry={load}
        searchKeys={['name', 'region', 'contact_email', 'contact_phone']}
        statusKey="verification_status"
        statusMap={STATUS_LABEL}
        perPage={9}
        emptyText={sw ? 'Hakuna makanisa bado.' : 'No churches yet.'}
        label={sw ? 'Makanisa' : 'Churches'}
        rowActions={(o) => (
          <>
            {o.verification_status !== 'verified' && (
              <button
                disabled={busy === o.id}
                onClick={() => askStatus(o, 'verified')}
                className="px-2.5 py-1.5 text-xs font-semibold text-success-700 hover:bg-success-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {busy === o.id ? '...' : `✓ ${sw ? 'Idhinisha' : 'Approve'}`}
              </button>
            )}
            {o.verification_status !== 'rejected' && (
              <button
                disabled={busy === o.id}
                onClick={() => askStatus(o, 'rejected')}
                className="px-2.5 py-1.5 text-xs font-semibold text-error-600 hover:bg-error-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {busy === o.id ? '...' : `✕ ${sw ? 'Kataa' : 'Reject'}`}
              </button>
            )}
            {o.verification_status !== 'pending' && (
              <button
                disabled={busy === o.id}
                onClick={() => askStatus(o, 'pending')}
                className="px-2.5 py-1.5 text-xs font-semibold text-gold-700 hover:bg-gold-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {busy === o.id ? '...' : `↺ ${sw ? 'Pending' : 'Pending'}`}
              </button>
            )}
          </>
        )}
      />

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        icon={confirm?.icon}
        tone={confirm?.tone || 'danger'}
        confirmLabel={confirm?.confirmLabel}
        cancelLabel={sw ? 'Ghairi' : 'Cancel'}
        busy={!!busy}
        onConfirm={confirm?.onConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}