import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import {
  fetchAdminDonations,
  fetchInvoices,
  confirmDonation,
  deleteDonation,
  markInvoicePaid,
} from '../../api'
import { onStatsChange } from '../../statsBus'
import { useToast } from '../../components/Toast'
import AdminDenseTable from '../../components/AdminDenseTable'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminPayments() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const { toast } = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const buildCombos = (donations, invoices) => [
    ...donations.map((x) => ({
      id: 'd-' + x.id,
      apiId: x.id,
      kind: 'donation',
      party: x.donor,
      item: x.item,
      payRef: x.ref,
      amount: x.amount,
      status: x.status,
      statusRaw: x.statusRaw,
      date: x.date,
    })),
    ...invoices.map((x) => ({
      id: 'i-' + x.id,
      apiId: x.id,
      kind: 'invoice',
      party: x.supplier,
      item: x.item,
      payRef: 'INV-' + x.id,
      amount: x.amount,
      status: x.status,
      statusRaw: x.statusRaw,
      date: x.date,
    })),
  ]

  const load = () => {
    setLoading(true)
    setLoadError(null)
    const errs = []
    Promise.all([
      fetchAdminDonations().catch((e) => { errs.push('donations: ' + (e.message || e)); return [] }),
      fetchInvoices().catch((e) => { errs.push('invoices: ' + (e.message || e)); return [] }),
    ])
      .then(([d, i]) => setRows(buildCombos(d, i)))
      .finally(() => { if (errs.length) setLoadError(errs.join('; ')); setLoading(false) })
  }

  useEffect(() => {
    let alive = true
    const loadLive = () => {
      const errs = []
      Promise.all([
        fetchAdminDonations().catch((e) => { errs.push('donations: ' + (e.message || e)); return [] }),
        fetchInvoices().catch((e) => { errs.push('invoices: ' + (e.message || e)); return [] }),
      ])
        .then(([d, i]) => alive && setRows(buildCombos(d, i)))
        .finally(() => { if (alive) { if (errs.length) setLoadError(errs.join('; ')); setLoading(false) } })
    }
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

  const handleMarkPaid = async (id) => {
    setBusyId(id)
    try {
      await markInvoicePaid(id)
      toast(sw ? 'Ankara imewekwa imelipwa.' : 'Invoice marked as paid.')
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

  const askConfirm = (r) => {
    setConfirm({
      title: sw ? 'Thibitisha Mchango' : 'Confirm Donation',
      message: sw
        ? `Thibitisha mchango wa TZS ${r.amount.toLocaleString()} kutoka "${r.party}"? Fedha zitahesabiwa kwenye kifaa husika.`
        : `Confirm the donation of TZS ${r.amount.toLocaleString()} from "${r.party}"? Funds will be counted toward the item.`,
      confirmLabel: sw ? 'Thibitisha' : 'Confirm',
      icon: '✓',
      tone: 'primary',
      onConfirm: () => handleConfirm(r.apiId),
    })
  }

  const askMarkPaid = (r) => {
    setConfirm({
      title: sw ? 'Weka Ankara Imelipwa' : 'Mark Invoice as Paid',
      message: sw
        ? `Weka ankara ya TZS ${r.amount.toLocaleString()} kwa "${r.party}" imelipwa? Itarekodiwa kwenye hati ya malipo.`
        : `Mark the invoice for TZS ${r.amount.toLocaleString()} from "${r.party}" as paid? It will be recorded in the ledger.`,
      confirmLabel: sw ? 'Weka Imelipwa' : 'Mark Paid',
      icon: '✓',
      tone: 'primary',
      onConfirm: () => handleMarkPaid(r.apiId),
    })
  }

  const askDelete = (r) => {
    setConfirm({
      title: sw ? 'Futa Mchango' : 'Delete Donation',
      message: sw
        ? `Una uhakika unataka kufuta mchango wa TZS ${r.amount.toLocaleString()} kutoka "${r.party}"? Hatua hii haiwezi kutenduliwa.`
        : `Delete the donation of TZS ${r.amount.toLocaleString()} from "${r.party}"? This cannot be undone.`,
      confirmLabel: sw ? 'Futa' : 'Delete',
      icon: '🗑',
      onConfirm: () => handleDelete(r.apiId),
    })
  }

  const statusMap = {
    'confirmed': { en: '✓ Confirmed', sw: '✓ Imethibitishwa' },
    'pending': { en: 'Pending', sw: 'Inasubiri' },
    'paid': { en: 'Paid', sw: 'Imelipwa' },
    'awaiting_receipt': { en: 'Awaiting Receipt', sw: 'Inasubiri Stakabadhi' },
    'receipt_uploaded': { en: 'Receipt Uploaded', sw: 'Stakabadhi Imepakiwa' },
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">{sw ? 'Malipo' : 'Payments'}</h1>
      <p className="text-sm text-ink-500 mb-6">
        {sw ? 'Michango ya wafadhili na malipo ya wauzaji.' : 'Donor donations and supplier payments.'}
      </p>

      <AdminDenseTable
        sw={sw}
        rows={rows}
        loading={loading}
        loadError={loadError}
        onRetry={load}
        searchKeys={['party', 'item', 'payRef', 'kind']}
        statusKey="statusRaw"
        statusMap={statusMap}
        columns={[
          { key: 'party', label: sw ? 'Mfadhili / Muuzaji' : 'Donor / Supplier', render: (r) => (
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-ink-800 uppercase tracking-tight truncate max-w-[220px] capitalize">{r.party || '—'}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ' + (r.kind === 'donation' ? 'bg-gold-500' : 'bg-oweru-600')}>
                  {r.kind === 'donation' ? 'D' : 'I'}
                </span>
                <span className="truncate max-w-[180px] text-[11px] text-ink-400 capitalize">{r.kind === 'donation' ? (sw ? 'Mchango' : 'Donation') : (sw ? 'Ankara' : 'Invoice')}</span>
              </div>
            </div>
          ) },
          { key: 'item', label: sw ? 'Kifaa' : 'Item', render: (r) => (
            <span className="text-xs text-ink-600 truncate max-w-[220px] inline-block">{r.item || '—'}</span>
          ) },
          { key: 'payRef', label: sw ? 'Rejea' : 'Ref', render: (r) => (
            <code className="font-mono text-[11px] text-ink-500 bg-ink-50 border border-ink-200/60 rounded px-1.5 py-0.5 whitespace-nowrap">{r.payRef || '—'}</code>
          ) },
          { key: 'amount', label: sw ? 'Kiasi' : 'Amount', align: 'right', render: (r) => (
            <span className="text-xs font-bold tabular-nums text-ink-800">
              {r.amount > 0 ? 'TZS ' + r.amount.toLocaleString() : '—'}
            </span>
          ) },
          { key: 'status', label: sw ? 'Hali' : 'Status', pill: (r) => {
            if (r.kind === 'donation') {
              return r.statusRaw === 'confirmed'
                ? { text: sw ? '✓ Imethibitishwa' : '✓ Confirmed', cls: 'bg-success-50 text-success-700 border border-success-200', dot: 'bg-success-500' }
                : { text: sw ? 'Inasubiri' : 'Pending', cls: 'bg-warning-50 text-warning-700 border border-warning-100', dot: 'bg-warning-500' }
            }
            if (r.statusRaw === 'paid') {
              return { text: sw ? '✓ Imelipwa' : '✓ Paid', cls: 'bg-success-50 text-success-700 border border-success-200', dot: 'bg-success-500' }
            }
            if (r.statusRaw === 'receipt_uploaded') {
              return { text: sw ? 'Stakabadhi Imepakiwa' : 'Receipt Uploaded', cls: 'bg-info-50 text-info-700 border border-info-200', dot: 'bg-info-500' }
            }
            return { text: sw ? 'Inasubiri' : 'Pending', cls: 'bg-warning-50 text-warning-700 border border-warning-100', dot: 'bg-warning-500' }
          } },
          { key: 'date', label: sw ? 'Tarehe' : 'Date', render: (r) => (
            <span className="text-xs text-ink-500">{r.date || '—'}</span>
          ) },
        ]}
        rowActions={(r) => (
          <>
            {r.kind === 'donation' && r.statusRaw !== 'confirmed' && (
              <button
                onClick={() => askConfirm(r)}
                disabled={busyId === r.apiId}
                className="px-2.5 py-1.5 text-xs font-semibold text-success-700 bg-success-50 hover:bg-success-100 rounded-lg border border-success-200/70 transition-colors disabled:opacity-50"
              >
                {busyId === r.apiId ? '...' : sw ? 'Thibitisha' : 'Confirm'}
              </button>
            )}
            {r.kind === 'invoice' && r.statusRaw !== 'paid' && (r.statusRaw === 'awaiting_receipt' || r.statusRaw === 'receipt_uploaded') && (
              <button
                onClick={() => askMarkPaid(r)}
                disabled={busyId === r.apiId}
                className="px-2.5 py-1.5 text-xs font-semibold text-success-700 bg-success-50 hover:bg-success-100 rounded-lg border border-success-200/70 transition-colors disabled:opacity-50"
              >
                {busyId === r.apiId ? '...' : sw ? 'Weka Imelipwa' : 'Mark Paid'}
              </button>
            )}
            {r.kind === 'donation' && (
              <button
                onClick={() => askDelete(r)}
                disabled={busyId === `del-${r.apiId}`}
                className="px-2.5 py-1.5 text-xs font-semibold text-error-700 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {busyId === `del-${r.apiId}` ? '...' : sw ? 'Futa' : 'Delete'}
              </button>
            )}
          </>
        )}
        perPage={10}
        emptyText={sw ? 'Hakuna malipo.' : 'No payments.'}
        label={sw ? 'Malipo' : 'Payments'}
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