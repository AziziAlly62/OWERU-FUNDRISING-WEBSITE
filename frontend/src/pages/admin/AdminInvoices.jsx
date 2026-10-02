import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import { fetchInvoices, createInvoice, deleteInvoice, markInvoicePaid, uploadInvoiceReceipt, approveInvoice, updateInvoice, fetchItems, fetchSuppliers, createSupplier } from '../../api'
import { onStatsChange } from '../../statsBus'
import { useToast } from '../../components/Toast'
import AdminEditModal from '../../components/AdminEditModal'
import AdminDenseTable from '../../components/AdminDenseTable'
import ConfirmDialog from '../../components/ConfirmDialog'

const STATUS_COLORS = {
  pending: 'bg-warning-100 text-warning-700',
  awaiting_receipt: 'bg-info-100 text-info-700',
  receipt_uploaded: 'bg-warning-100 text-warning-700',
  approved: 'bg-success-100 text-success-700',
  paid: 'bg-success-100 text-success-700',
}

const STATUS_LABELS = {
  pending: { en: 'Pending', sw: 'Inasubiri' },
  awaiting_receipt: { en: 'Awaiting Receipt', sw: 'Inasubiri Stakabadhi' },
  receipt_uploaded: { en: 'Receipt Uploaded', sw: 'Stakabadhi Imepakiwa' },
  approved: { en: 'Approved', sw: 'Imeidhinishwa' },
  paid: { en: 'Paid', sw: 'Imelipwa' },
}

export default function AdminInvoices() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const { toast } = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({})
  const [items, setItems] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [createErr, setCreateErr] = useState(null)
  const [createBusy, setCreateBusy] = useState(false)
  const [dropdownLoading, setDropdownLoading] = useState(false)
  const [suppQuery, setSuppQuery] = useState('')
  const [suppOpen, setSuppOpen] = useState(false)
  const [suppId, setSuppId] = useState('')
  const [suppName, setSuppName] = useState('')
  const [newMode, setNewMode] = useState(false)
  const [newSupp, setNewSupp] = useState({})
  const [suppErr, setSuppErr] = useState(null)
  const [suppBusy, setSuppBusy] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const load = () => {
    setLoading(true)
    setLoadError(null)
    fetchInvoices()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => { setRows([]); setLoadError(e.message || String(e)) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let alive = true
    const loadLive = () => fetchInvoices()
      .then((r) => alive && setRows(Array.isArray(r) ? r : []))
      .catch((e) => alive && setLoadError(e.message || String(e)))
      .finally(() => alive && setLoading(false))
    loadLive()
    const off = onStatsChange(loadLive)
    return () => { alive = false; off() }
  }, [])

  const onDelete = async (id) => {
    setBusyId(id)
    try {
      await deleteInvoice(id)
      toast(sw ? 'Ankara imefutwa.' : 'Invoice deleted.')
      setConfirm(null)
      load()
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const onMarkPaid = async (id) => {
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

  const onUploadReceipt = async (id, file) => {
    setUploadingId(id)
    try {
      await uploadInvoiceReceipt(id, file)
      toast(sw ? 'Stakabadhi imepakiwa.' : 'Receipt uploaded.')
      load()
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setUploadingId(null)
    }
  }

  const onApprove = async (id) => {
    setBusyId(id)
    try {
      await approveInvoice(id)
      toast(sw ? 'Ankara imethibitishwa.' : 'Invoice approved.')
      setConfirm(null)
      load()
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const askDelete = (i) => {
    setConfirm({
      title: sw ? 'Futa Ankara' : 'Delete Invoice',
      message: sw
        ? `Una uhakika unataka kufuta ankara ya TZS ${i.amount.toLocaleString()} kwa "${i.supplier}"? Hatua hii haiwezi kutenduliwa.`
        : `Delete the invoice for TZS ${i.amount.toLocaleString()} from "${i.supplier}"? This cannot be undone.`,
      confirmLabel: sw ? 'Futa' : 'Delete',
      icon: '🗑',
      onConfirm: () => onDelete(i.id),
    })
  }

  const askMarkPaid = (i) => {
    setConfirm({
      title: sw ? 'Weka Ankara Imelipwa' : 'Mark Invoice as Paid',
      message: sw
        ? `Tuma malipo ya ankara ya TZS ${i.amount.toLocaleString()} kwa "${i.supplier}"? Itarekodiwa kwenye hati ya malipo.`
        : `Send payment for the invoice of TZS ${i.amount.toLocaleString()} to "${i.supplier}"? It will be recorded in the ledger.`,
      confirmLabel: sw ? 'Tuma Malipo' : 'Send Payment',
      icon: '✓',
      tone: 'primary',
      onConfirm: () => onMarkPaid(i.id),
    })
  }

  const askApprove = (i) => {
    setConfirm({
      title: sw ? 'Thibitisha Ankara' : 'Approve Invoice',
      message: sw
        ? `Thibitisha ankara ya TZS ${i.amount.toLocaleString()} kwa "${i.supplier}" baada ya kukagua stakabadhi?`
        : `Approve the invoice for TZS ${i.amount.toLocaleString()} from "${i.supplier}" after reviewing the receipt?`,
      confirmLabel: sw ? 'Thibitisha' : 'Approve',
      icon: '✓',
      tone: 'primary',
      onConfirm: () => onApprove(i.id),
    })
  }

  const openEdit = (i) => {
    setEditing(i)
    setEditForm({ invoice_number: i.invoiceNumber || '', amount: i.amount })
  }

  const openCreate = () => {
    setCreateErr(null)
    setCreateForm({ item_id: '', invoice_number: '', amount: '' })
    setSuppQuery('')
    setSuppOpen(false)
    setSuppId('')
    setSuppName('')
    setNewMode(false)
    setNewSupp({})
    setSuppErr(null)
    setDropdownLoading(true)
    Promise.all([fetchItems(), fetchSuppliers()])
      .then(([it, sup]) => { setItems(it); setSuppliers(sup) })
      .catch((e) => toast(e.message || String(e), 'error'))
      .finally(() => setDropdownLoading(false))
    setCreating(true)
  }

  const saveCreate = async () => {
    if (!createForm.item_id || !suppId || createForm.amount === '') {
      setCreateErr(sw ? 'Chagua kifaa, muuzaji na kiasi.' : 'Choose item, supplier and amount.')
      return
    }
    if (createForm.amount !== '' && !(Number(createForm.amount) >= 0)) {
      setCreateErr(sw ? 'Weka kiasi sahihi (namba).' : 'Enter a valid amount (number).')
      return
    }
    setCreateErr(null)
    setCreateBusy(true)
    try {
      await createInvoice({
        item_id: Number(createForm.item_id),
        supplier_id: Number(suppId),
        invoice_number: createForm.invoice_number || undefined,
        amount: Number(createForm.amount),
      })
      setCreating(false)
      toast(sw ? 'Ankara imeundwa.' : 'Invoice created.')
      load()
    } catch (e) {
      setCreateErr(e.message)
      toast(e.message || String(e), 'error')
    } finally {
      setCreateBusy(false)
    }
  }

  const pickSupplier = (s) => {
    setSuppId(String(s.id))
    setSuppName(s.name)
    setSuppOpen(false)
    setNewMode(false)
  }

  const saveNewSupplier = async () => {
    if (!newSupp.name) { setSuppErr(sw ? 'Jina la muuzaji linahitajika.' : 'Supplier name is required.'); return }
    setSuppBusy(true)
    setSuppErr(null)
    try {
      const s = await createSupplier(newSupp)
      await fetchSuppliers().then((sup) => setSuppliers(sup))
      pickSupplier(s)
    } catch (e) {
      setSuppErr(e.message)
      toast(e.message || String(e), 'error')
    } finally {
      setSuppBusy(false)
    }
  }

  const startNewSupplier = () => {
    setNewMode(true)
    setNewSupp({ name: '', contact_person: '', contact_phone: '', contact_email: '', region: '' })
    setSuppErr(null)
  }

  const filteredSuppliers = suppliers.filter((s) =>
    !suppQuery.trim() || (s.name || '').toLowerCase().includes(suppQuery.toLowerCase()) || (s.contact_phone || '').toLowerCase().includes(suppQuery.toLowerCase())
  )

  const renderSupplierField = () => (
    <div className="space-y-2">
      {!newMode ? (
          <>
          <div className="relative">
            {dropdownLoading ? (
              <div className="w-full px-3 py-2 rounded-lg border border-ink-300 bg-ink-50 text-sm text-ink-500">
                {sw ? 'Inapakia...' : 'Loading...'}
              </div>
            ) : (<>
              <input
                value={suppQuery}
                onChange={(e) => { setSuppQuery(e.target.value); setSuppOpen(true) }}
                onFocus={() => setSuppOpen(true)}
                onBlur={() => setTimeout(() => setSuppOpen(false), 150)}
                placeholder={sw ? 'Tafuta muuzaji (jina au namba ya simu)...' : 'Search supplier (name or phone)...'}
                className="w-full px-3 py-2 rounded-lg border border-ink-300 focus:ring-oweru-500 focus:border-oweru-500 focus:outline-none text-sm"
              />
              {suppOpen && (
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto card-base">
                  {filteredSuppliers.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-ink-500">{sw ? 'Hakuna matokeo.' : 'No results.'}</div>
                  ) : filteredSuppliers.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={() => pickSupplier(s)}
                      className={'w-full text-left px-3 py-2.5 text-sm hover:bg-ink-100/60 ' + (String(s.id) === suppId ? 'bg-oweru-50 text-oweru-700 font-semibold' : '')}
                    >
                      <div className="font-medium truncate">{s.name}</div>
                      <div className="text-xs text-ink-500">{s.contact || s.region || s.contact_phone || '—'}</div>
                    </button>
                  ))}
                </div>
              )}
            </>)}
          </div>
          {suppId ? (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-success-50 border border-success-200 px-3 py-2">
              <span className="text-sm font-medium text-success-700">✓ {suppName}</span>
              <button type="button" onClick={() => { setSuppId(''); setSuppName(''); setSuppQuery('') }} className="text-xs text-error-700 hover:underline">{sw ? 'Ondoa' : 'Remove'}</button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={startNewSupplier}
            className="text-sm font-semibold text-oweru-700 hover:underline inline-flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span>{sw ? 'Ongeza muuzaji mpya' : 'Add new supplier'}
          </button>
        </>
      ) : (
        <div className="space-y-2 rounded-[14px] border border-gold-200 bg-gold-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-700">{sw ? 'Muuzaji mpya' : 'New supplier'}</span>
            <button type="button" onClick={() => setNewMode(false)} className="text-xs text-ink-500 hover:underline">{sw ? 'Rudi' : 'Back'}</button>
          </div>
          {suppErr && <div className="rounded-lg bg-error-50 border border-error-200 text-error-700 px-3 py-2 text-sm">{suppErr}</div>}
          {[
            { k: 'name', label: sw ? 'Jina la kampuni' : 'Company name', ph: sw ? 'Mf. Duka la Vifaa' : 'e.g. Supplies Co.' },
            { k: 'contact_person', label: sw ? 'Mtu wa mawasiliano' : 'Contact person', ph: sw ? 'Mf. James' : 'e.g. James' },
            { k: 'contact_phone', label: sw ? 'Namba ya simu' : 'Phone number', ph: '+255...' },
            { k: 'contact_email', label: 'Email', ph: 'email@example.com' },
            { k: 'region', label: sw ? 'Mkoa' : 'Region', ph: sw ? 'Mf. Dar es Salaam' : 'e.g. Dar es Salaam' },
          ].map((f) => (
            <input
              key={f.k}
              type={f.k === 'contact_email' ? 'email' : 'text'}
              value={newSupp[f.k] || ''}
              onChange={(e) => setNewSupp((s) => ({ ...s, [f.k]: e.target.value }))}
              placeholder={f.ph}
              className="w-full px-3 py-2 rounded-lg border border-ink-300 focus:ring-oweru-500 focus:border-oweru-500 focus:outline-none text-sm"
            />
          ))}
          <button
            type="button"
            onClick={saveNewSupplier}
            disabled={suppBusy}
            className="btn-forest btn-block"
          >
            {suppBusy ? '...' : sw ? 'Hifadhi na uchague' : 'Save & select'}
          </button>
        </div>
      )}
    </div>
  )

  const saveEdit = async () => {
    setBusyId('edit')
    try {
      await updateInvoice(editing.id, {
        invoice_number: editForm.invoice_number || undefined,
        amount: editForm.amount !== '' ? Number(editForm.amount) : undefined,
      })
      setEditing(null)
      toast(sw ? 'Ankara imesasishwa.' : 'Invoice updated.')
      load()
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const statusMap = Object.fromEntries(
    Object.keys(STATUS_COLORS).map((s) => [s, { en: STATUS_LABELS[s].en, sw: STATUS_LABELS[s].sw }])
  )

  const columns = [
    { key: 'id', label: '#', labelSw: '#', align: 'right', render: (i) => <span className="text-xs font-bold text-ink-500">#{i.id}</span> },
    { key: 'item', label: sw ? 'Kifaa' : 'Item', labelSw: 'Kifaa', render: (i) => (
      <div className="min-w-0">
        <div className="text-[13px] font-bold text-ink-800 capitalize truncate max-w-[220px]">{i.item}</div>
        <div className="text-[11px] text-ink-400 truncate max-w-[220px] capitalize">{i.supplier}</div>
      </div>
    ) },
    { key: 'amount', label: sw ? 'Kiasi' : 'Amount', labelSw: 'Kiasi', align: 'right', render: (i) => (
      <span className="text-xs font-bold tabular-nums text-ink-800">{i.amount > 0 ? 'TZS ' + i.amount.toLocaleString() : '—'}</span>
    ) },
    { key: 'status', label: sw ? 'Hali' : 'Status', labelSw: 'Hali', pill: (i) => {
      const s = i.statusRaw || ''
      return { text: (STATUS_LABELS[s]?.[sw ? 'sw' : 'en']) || i.status || '—', cls: STATUS_COLORS[s] || 'bg-ink-100 text-ink-700' }
    } },
    { key: 'date', label: sw ? 'Tarehe' : 'Date', labelSw: 'Tarehe', render: (i) => <span className="text-xs text-ink-500">{i.date || '—'}</span> },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">{sw ? 'Ankara' : 'Invoices'}</h1>
          <p className="text-sm text-ink-500 mt-0.5">{sw ? 'Ankara za malipo kwa wauzaji.' : 'Supplier payment invoices.'}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-forest btn-sm"
        >
          <span className="text-lg leading-none">+</span>
          {sw ? 'Ankara Mpya' : 'New Invoice'}
        </button>
      </div>

      <AdminDenseTable
        sw={sw}
        rows={rows}
        columns={columns}
        loading={loading}
        loadError={loadError}
        onRetry={load}
        searchKeys={['item', 'supplier']}
        statusKey="statusRaw"
        statusMap={statusMap}
        perPage={9}
        emptyText={sw ? 'Hakuna ankara.' : 'No invoices.'}
        label={sw ? 'Ankara' : 'Invoices'}
        rowActions={(i) => (
          <>
            {i.receiptUrl && (
              <a
                href={`/storage/${i.receiptUrl}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 text-xs font-semibold text-oweru-700 hover:bg-oweru-50 rounded-lg transition-colors"
              >
                {sw ? 'Stakabadhi' : 'Receipt'}
              </a>
            )}
            {i.statusRaw === 'pending' && (
              <button
                onClick={() => askMarkPaid(i)}
                disabled={busyId === i.id}
                className="px-2.5 py-1.5 text-xs font-semibold text-success-700 hover:bg-success-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {busyId === i.id ? '...' : sw ? 'Tuma Malipo' : 'Send Payment'}
              </button>
            )}
            {(i.statusRaw === 'awaiting_receipt' || i.statusRaw === 'receipt_uploaded') && (
              <label className="px-2.5 py-1.5 text-xs font-semibold text-oweru-700 hover:bg-oweru-50 rounded-lg transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) onUploadReceipt(i.id, f)
                    e.target.value = ''
                  }}
                />
                {uploadingId === i.id ? (sw ? 'Inapakia...' : 'Uploading...') : (sw ? 'Pakia Stakabadhi' : 'Upload Receipt')}
              </label>
            )}
            {i.statusRaw === 'receipt_uploaded' && (
              <button
                onClick={() => askApprove(i)}
                disabled={busyId === i.id}
                className="px-2.5 py-1.5 text-xs font-semibold text-success-700 hover:bg-success-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {busyId === i.id ? '...' : sw ? 'Thibitisha' : 'Approve'}
              </button>
            )}
            <button
              onClick={() => openEdit(i)}
              className="px-2.5 py-1.5 text-xs font-semibold text-ink-600 hover:text-oweru-700 hover:bg-gold-50 rounded-lg transition-colors"
            >
              {sw ? 'Hariri' : 'Edit'}
            </button>
            <button
              onClick={() => askDelete(i)}
              disabled={busyId === i.id}
              className="px-2.5 py-1.5 text-xs font-semibold text-error-700 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {busyId === i.id ? '...' : sw ? 'Futa' : 'Delete'}
            </button>
          </>
        )}
      />

      {creating && (
        <AdminEditModal
          title={sw ? 'Ankara Mpya' : 'New Invoice'}
          icon="file"
          form={createForm}
          setForm={setCreateForm}
          onSave={saveCreate}
          onClose={() => setCreating(false)}
          busy={createBusy}
          error={createErr}
          cancelLabel={sw ? 'Ghairi' : 'Cancel'}
          saveLabel={sw ? 'Fanya' : 'Create'}
          fields={[
            {
              key: 'item_id',
              label: sw ? 'Kifaa / Ombi' : 'Item / Request',
              type: 'select',
              options: items.map((it) => ({ value: String(it.id), label: it.name + (it.request ? ' — ' + it.request : '') })),
            },
            {
              key: 'supplier_id',
              label: sw ? 'Muuzaji' : 'Supplier',
              full: true,
              render: () => renderSupplierField(),
            },
            { key: 'invoice_number', label: 'Invoice No.' },
            { key: 'amount', label: sw ? 'Kiasi (TZS)' : 'Amount (TZS)', type: 'number' },
          ]}
        />
      )}

      {editing && (
        <AdminEditModal
          title={sw ? 'Hariri Ankara' : 'Edit Invoice'}
          icon="file"
          form={editForm}
          setForm={setEditForm}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          busy={busyId === 'edit'}
          cancelLabel={sw ? 'Ghairi' : 'Cancel'}
          saveLabel={sw ? 'Hifadhi' : 'Save'}
          fields={[
            { key: 'invoice_number', label: 'Invoice No.' },
            { key: 'amount', label: sw ? 'Kiasi (TZS)' : 'Amount (TZS)', type: 'number' },
          ]}
        />
      )}

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