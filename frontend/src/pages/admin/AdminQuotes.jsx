import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '../../i18n'
import {
  fetchQuotes, createQuote, updateQuote, approveQuote, rejectQuote, deleteQuote,
  fetchAllRequestItems, fetchSuppliers,
} from '../../api'
import { onStatsChange } from '../../statsBus'
import { useToast } from '../../components/Toast'
import { money } from '../../api'
import ConfirmDialog from '../../components/ConfirmDialog'
import AdminEditModal from '../../components/AdminEditModal'
import { inputCls } from '../../components/FormField'

const STATUS = ['pending', 'approved', 'rejected']
const STATUS_LABEL = {
  pending: { en: 'Pending', sw: 'Inasubiri' },
  approved: { en: 'Approved', sw: 'Imeidhinishwa' },
  rejected: { en: 'Rejected', sw: 'Imekataliwa' },
}

export default function AdminQuotes() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const { toast } = useToast()
  const [params] = useSearchParams()
  const [rows, setRows] = useState([])
  const [items, setItems] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [statusFilter, setStatusFilter] = useState(params.get('status') || '')
  const [itemFilter, setItemFilter] = useState(params.get('item') || '')
  const [busy, setBusy] = useState(null)
  const [creating, setCreating] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [editingQuote, setEditingQuote] = useState(null)
  const [form, setForm] = useState({ request_item_id: '', supplier_id: '', amount: '', valid_until: '', notes: '' })

  const load = (itemId, status) => {
    setLoadError(null)
    setLoading(true)
    fetchQuotes({ itemId: itemId || undefined, status: status || undefined })
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => { setRows([]); setLoadError(e.message || String(e)) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let alive = true
    fetchAllRequestItems().then((r) => alive && setItems(r)).catch((e) => alive && toast(e.message || String(e), 'error'))
    fetchSuppliers().then((r) => alive && setSuppliers(r)).catch((e) => alive && toast(e.message || String(e), 'error'))
    const loadLive = () => fetchQuotes({ itemId: itemFilter || undefined, status: statusFilter || undefined })
      .then((r) => alive && setRows(r))
      .catch((e) => alive && setLoadError(e.message || String(e)))
      .finally(() => alive && setLoading(false))
    loadLive()
    const off = onStatsChange(loadLive)
    return () => { alive = false; off() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSave = async () => {
    if (!form.request_item_id) { toast(sw ? 'Chagua kifaa.' : 'Select an item.', 'error'); return }
    if (form.amount === '' || Number(form.amount) <= 0) { toast(sw ? 'Weka kiasi sahihi.' : 'Enter a valid amount.', 'error'); return }
    setBusy('create')
    try {
      await createQuote({
        request_item_id: form.request_item_id,
        supplier_id: form.supplier_id || undefined,
        amount: Number(form.amount),
        valid_until: form.valid_until || undefined,
        notes: form.notes || undefined,
      })
      toast(sw ? 'Makadirio yameongezwa.' : 'Quote added.')
      setCreating(false)
      load(form.request_item_id, statusFilter)
      setForm({ request_item_id: form.request_item_id, supplier_id: '', amount: '', valid_until: '', notes: '' })
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusy(null)
    }
  }

  const onApprove = (q) => {
    setConfirm({
      title: sw ? 'Idhinisha makadirio' : 'Approve quote',
      message: sw
        ? `Unathibitisha makadirio ya ${money(q.amount)}? Bei hii itatumika kama lengo la kifaa.`
        : `Approve quote of ${money(q.amount)}? This amount becomes the item funding target.`,
      confirmLabel: sw ? 'Idhinisha' : 'Approve',
      icon: '✓',
      tone: 'primary',
      onConfirm: async () => {
        setBusy(`app-${q.id}`)
        try {
          await approveQuote(q.id)
          toast(sw ? 'Makadirio yameidhinishwa na mpango umehifadhiwa.' : 'Quote approved; item target updated.')
          setConfirm(null)
          load(itemFilter, statusFilter)
        } catch (e) {
          toast(e.message || String(e), 'error')
        } finally {
          setBusy(null)
        }
      },
    })
  }

  const onReject = (q) => {
    setConfirm({
      title: sw ? 'Kataa makadirio' : 'Reject quote',
      message: sw ? `Kataa makadirio ya ${money(q.amount)} ya ${q.supplier || ''}?` : `Reject this ${money(q.amount)} quote from ${q.supplier || 'supplier'}?`,
      confirmLabel: sw ? 'Kataa' : 'Reject',
      icon: '✕',
      onConfirm: async () => {
        setBusy(`rej-${q.id}`)
        try {
          await rejectQuote(q.id)
          toast(sw ? 'Makadirio yamekataliwa.' : 'Quote rejected.')
          setConfirm(null)
          load(itemFilter, statusFilter)
        } catch (e) {
          toast(e.message || String(e), 'error')
        } finally {
          setBusy(null)
        }
      },
    })
  }

  const onDelete = (q) => {
    setConfirm({
      title: sw ? 'Futa makadirio' : 'Delete quote',
      message: sw ? `Futa makadirio ya ${money(q.amount)} ya ${q.supplier || ''}? Hatua hii haiwezi kutenduliwa.` : `Delete the ${money(q.amount)} quote from ${q.supplier || 'supplier'}? This cannot be undone.`,
      confirmLabel: sw ? 'Futa' : 'Delete',
      icon: '🗑',
      onConfirm: async () => {
        setBusy(`del-${q.id}`)
        try {
          await deleteQuote(q.id)
          toast(sw ? 'Makadirio yamefutwa.' : 'Quote deleted.')
          setConfirm(null)
          load(itemFilter, statusFilter)
        } catch (e) {
          toast(e.message || String(e), 'error')
        } finally {
          setBusy(null)
        }
      },
    })
  }

  const openEdit = (q) => {
    setEditingQuote(q)
    setForm({
      request_item_id: q.itemId || '',
      supplier_id: q.supplierId ? String(q.supplierId) : '',
      amount: q.amount,
      valid_until: q.validUntil || '',
      notes: q.notes || '',
    })
  }

  const saveEdit = async () => {
    if (!editingQuote) return
    if (form.amount === '' || Number(form.amount) <= 0) { toast(sw ? 'Weka kiasi sahihi.' : 'Enter a valid amount.', 'error'); return }
    setBusy(`edit-${editingQuote.id}`)
    try {
      await updateQuote(editingQuote.id, {
        supplier_id: form.supplier_id ? Number(form.supplier_id) : undefined,
        amount: Number(form.amount),
        valid_until: form.valid_until || undefined,
        notes: form.notes || undefined,
      })
      toast(sw ? 'Makadirio yamesasishwa.' : 'Quote updated.')
      setEditingQuote(null)
      load(itemFilter, statusFilter)
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusy(null)
    }
  }

  const badge = (s) =>
    s === 'approved' ? 'bg-success-100 text-success-700'
      : s === 'rejected' ? 'bg-error-100 text-error-600'
      : 'bg-gold-100 text-gold-700'

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">{sw ? 'Makadirio ya Wa Wauzaji' : 'Supplier Quotes'}</h1>
      <p className="text-sm text-ink-500 mb-6">
        {sw ? 'Nukuu za bei kutoka kwa wauzaji kwa kila kifaa.' : 'Price quotations from suppliers per item.'}
      </p>

      {loadError && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-error-100 text-error-700 text-sm font-bold" aria-hidden="true">!</span>
            <div>
              <p className="text-sm font-semibold text-error-700">{sw ? 'Imeshindikana kupakia data.' : 'Failed to load data.'}</p>
              <p className="text-xs text-error-600/80">{loadError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="shrink-0 rounded-xl border border-error-200 bg-white px-4 py-2 text-sm font-semibold text-error-700 hover:bg-error-100 transition-colors"
          >
            {sw ? 'Jaribu tena' : 'Retry'}
          </button>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select
          value={itemFilter}
          onChange={(e) => { const v = e.target.value; setItemFilter(v); load(v, statusFilter) }}
          className={inputCls}
        >
          <option value="">{sw ? 'Kifaa chochote' : 'All items'}</option>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name} — {i.request}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { const v = e.target.value; setStatusFilter(v); load(itemFilter, v) }}
          className={inputCls}
        >
          <option value="">{sw ? 'Hali yoyote' : 'Any status'}</option>
          {STATUS.map((s) => <option key={s} value={s}>{sw ? STATUS_LABEL[s].sw : STATUS_LABEL[s].en}</option>)}
        </select>
        <button
          onClick={() => { setCreating(true) }}
          className="btn-primary btn-sm ml-auto"
        >
          + {sw ? 'Makadirio Mpya' : 'New Quote'}
        </button>
      </div>

      {loading ? (
        <div className="panel p-8 text-center text-sm text-ink-500">
          {sw ? 'Inapakia makadirio...' : 'Loading quotes...'}
        </div>
      ) : rows.length === 0 ? (
        <div className="empty-state text-center py-12 text-ink-500">
          {sw ? 'Hakuna makadirio.' : 'No quotes yet.'}
        </div>
      ) : (
        <div className="panel table-panel">
          <table className="admin-table w-full text-left">
            <thead>
              <tr>
                <th className="px-4 py-3">{sw ? 'Kifaa' : 'Item'}</th>
                <th className="px-4 py-3">{sw ? 'Muuzaji' : 'Supplier'}</th>
                <th className="px-4 py-3">{sw ? 'Kiasi' : 'Amount'}</th>
                <th className="px-4 py-3">{sw ? 'Mhalali hadi' : 'Valid until'}</th>
                <th className="px-4 py-3">{sw ? 'Hali' : 'Status'}</th>
                <th className="px-4 py-3 text-right">{sw ? 'Vitendo' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => (
                <tr key={q.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-800">{q.item}</div>
                    <div className="text-xs text-ink-500">{q.request}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{q.supplier || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-ink-800">{money(q.amount)}</td>
                  <td className="px-4 py-3 text-ink-500">{q.validUntil || '—'}</td>
                  <td className="px-4 py-3"><span className={'text-xs font-bold px-2.5 py-1 rounded-full ' + badge(q.status)}>{sw ? STATUS_LABEL[q.status]?.sw : STATUS_LABEL[q.status]?.en || q.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {q.status === 'pending' && (
                        <>
                          <button
                            disabled={busy === `app-${q.id}`}
                            onClick={() => onApprove(q)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-success-700 bg-success-50 hover:bg-success-100 rounded-lg border border-success-200/70 disabled:opacity-50"
                          >
                            {busy === `app-${q.id}` ? '...' : sw ? 'Idhinisha' : 'Approve'}
                          </button>
                          <button
                            disabled={busy === `rej-${q.id}`}
                            onClick={() => onReject(q)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-error-700 bg-error-50 hover:bg-error-100 rounded-lg border border-error-200/70 disabled:opacity-50"
                          >
                            {busy === `rej-${q.id}` ? '...' : sw ? 'Kataa' : 'Reject'}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openEdit(q)}
                        disabled={busy === `edit-${q.id}`}
                        aria-label={sw ? `Hariri makadirio ya ${q.item}` : `Edit quote for ${q.item}`}
                        className="px-2 py-1.5 text-xs font-semibold text-ink-500 hover:text-oweru-700 hover:bg-gold-50 rounded-lg disabled:opacity-50"
                      >{busy === `edit-${q.id}` ? '...' : sw ? 'Hariri' : 'Edit'}</button>
                      <button
                        onClick={() => onDelete(q)}
                        disabled={busy === `del-${q.id}`}
                        aria-label={sw ? `Futa makadirio ya ${q.item}` : `Delete quote for ${q.item}`}
                        className="px-2 py-1.5 text-xs font-semibold text-ink-500 hover:text-error-700 rounded-lg disabled:opacity-50"
                      >{busy === `del-${q.id}` ? '...' : '✕'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="panel w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-ink-900">{sw ? 'Makadirio Mpya' : 'New Quote'}</h3>
              <button onClick={() => setCreating(false)} aria-label={sw ? 'Funga' : 'Close'} className="text-ink-500 hover:text-ink-700 text-xl leading-none">✕</button>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="block mb-1.5 text-sm font-semibold text-ink-700">{sw ? 'Kifaa' : 'Item'} *</span>
                <select value={form.request_item_id} onChange={(e) => setForm({ ...form, request_item_id: e.target.value })} className={`${inputCls} px-4`}>
                  <option value="">{sw ? 'Chagua kifaa...' : 'Select item...'}</option>
                  {items.map((i) => <option key={i.id} value={i.id}>{i.name} — {i.request}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block mb-1.5 text-sm font-semibold text-ink-700">{sw ? 'Muuzaji' : 'Supplier'}</span>
                  <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className={`${inputCls} px-4`}>
                    <option value="">{sw ? 'Chagua muuzaji...' : 'Select supplier...'}</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="block mb-1.5 text-sm font-semibold text-ink-700">{sw ? 'Kiasi (TZS)' : 'Amount (TZS)'} *</span>
                  <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={`${inputCls} px-4`} />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block mb-1.5 text-sm font-semibold text-ink-700">{sw ? 'Mhalali hadi' : 'Valid until'}</span>
                  <input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className={`${inputCls} px-4`} />
                </label>
              </div>
              <label className="block">
                <span className="block mb-1.5 text-sm font-semibold text-ink-700">{sw ? 'Vidokezo' : 'Notes'}</span>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputCls} px-4`} />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setCreating(false)} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-ink-600 hover:bg-ink-50">{sw ? 'Ghairi' : 'Cancel'}</button>
              <button onClick={onSave} disabled={busy === 'create'} className="btn-forest btn-sm">
                {busy === 'create' ? '...' : sw ? 'Hifadhi' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {editingQuote && (
        <AdminEditModal
          title={sw ? 'Hariri Makadirio' : 'Edit Quote'}
          icon="file"
          form={form}
          setForm={setForm}
          onSave={saveEdit}
          onClose={() => setEditingQuote(null)}
          busy={busy === `edit-${editingQuote.id}`}
          cancelLabel={sw ? 'Ghairi' : 'Cancel'}
          saveLabel={sw ? 'Hifadhi' : 'Save'}
          fields={[
            {
              key: 'supplier_id',
              label: sw ? 'Muuzaji' : 'Supplier',
              type: 'select',
              options: [
                { value: '', label: sw ? 'Chagua muuzaji...' : 'Select supplier...' },
                ...suppliers.map((s) => ({ value: String(s.id), label: s.name })),
              ],
            },
            { key: 'amount', label: sw ? 'Kiasi (TZS)' : 'Amount (TZS)', type: 'number' },
            { key: 'valid_until', label: sw ? 'Mhalali hadi' : 'Valid Until', type: 'date' },
            { key: 'notes', label: sw ? 'Vidokezo' : 'Notes', type: 'textarea' },
          ]}
        />
      )}
    </div>
  )
}