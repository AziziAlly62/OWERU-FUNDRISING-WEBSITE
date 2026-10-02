import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import { fetchEquipment, createEquipment, fetchAllRequestItems, updateEquipment, deleteEquipment, confirmDelivery, openEquipmentEvidence } from '../../api'
import { onStatsChange } from '../../statsBus'
import { useToast } from '../../components/Toast'
import AdminEditModal from '../../components/AdminEditModal'
import AdminDenseTable from '../../components/AdminDenseTable'
import ConfirmDialog from '../../components/ConfirmDialog'

const PARTY_LABELS = {
  recipient: { en: 'Recipient', sw: 'Mpokeaji' },
  supplier: { en: 'Supplier', sw: 'Muuzaji' },
  church: { en: 'Church', sw: 'Kanisa' },
}

const STATUS_STYLE = {
  delivered: 'bg-ink-100 text-ink-700',
  verified: 'bg-success-100 text-success-700',
  in_use: 'bg-info-100 text-info-700',
  in_repair: 'bg-warning-100 text-warning-700',
  returned: 'bg-warning-100 text-warning-700',
  transferred: 'bg-gold-100 text-gold-800',
  lost: 'bg-error-100 text-error-700',
}

const STATUS_LABELS = {
  delivered: { en: 'Delivered', sw: 'Imewasilishwa' },
  verified: { en: 'Verified', sw: 'Imehakikiwa' },
  in_use: { en: 'In Use', sw: 'Inatumika' },
  in_repair: { en: 'In Repair', sw: 'Inarekebishwa' },
  returned: { en: 'Returned', sw: 'Imerejeshwa' },
  transferred: { en: 'Transferred', sw: 'Imehamishwa' },
  lost: { en: 'Lost', sw: 'Imepotea' },
}

export default function AdminEquipment() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const { toast } = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [busy, setBusy] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({})
  const [createErr, setCreateErr] = useState(null)
  const [itemOptions, setItemOptions] = useState([])

  const load = () => {
    setLoading(true)
    setLoadError(null)
    fetchEquipment()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => { setRows([]); setLoadError(e.message || String(e)) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let alive = true
    const loadLive = () => fetchEquipment()
      .then((r) => alive && setRows(Array.isArray(r) ? r : []))
      .catch((e) => alive && setLoadError(e.message || String(e)))
      .finally(() => alive && setLoading(false))
    loadLive()
    const off = onStatsChange(loadLive)
    return () => { alive = false; off() }
  }, [])

  const doConfirm = async (id, party) => {
    setBusy(`${id}:${party}`)
    try {
      await confirmDelivery(id, party)
      toast(sw ? 'Uthibitisho umehifadhiwa.' : 'Confirmation recorded.')
      setConfirm(null)
      load()
    } catch (err) {
      toast(err.message || String(err), 'error')
    } finally {
      setBusy(null)
    }
  }

  const onConfirmParty = (e, party) => {
    setConfirm({
      title: sw ? 'Thibitisha Uwasilishaji' : 'Confirm Delivery',
      message: sw
        ? `Kumbuka: thibitisha kwamba ${PARTY_LABELS[party].sw} alipokea "${e.item}". Hatua hii haiwezi kutenduliwa.`
        : `Confirm that the ${PARTY_LABELS[party].en} received "${e.item}"? This cannot be undone.`,
      confirmLabel: sw ? 'Thibitisha' : 'Confirm',
      icon: '✓',
      tone: 'primary',
      onConfirm: () => doConfirm(e.id, party),
    })
  }

  const onDelete = async (id, item) => {
    setConfirm({
      title: sw ? 'Futa Kifaa' : 'Delete Equipment',
      message: sw ? `Unafuta "${item}" kutoka kwenye rejesta? Hatua hii haiwezi kutenduliwa.` : `Delete "${item}" from the register? This cannot be undone.`,
      confirmLabel: sw ? 'Futa' : 'Delete',
      icon: '🗑',
      onConfirm: async () => {
        setBusy(id)
        try {
          await deleteEquipment(id)
          toast(sw ? 'Kifaa kimefutwa.' : 'Equipment deleted.')
          setConfirm(null)
          load()
        } catch (e) {
          toast(e.message || String(e), 'error')
        } finally {
          setBusy(null)
        }
      },
    })
  }

  const openEdit = (e) => {
    setEditing(e)
    setEditForm({
      model: e.model || '',
      serial_number: e.serial || '',
      amount: e.amount || '',
      location: e.location || '',
      status: e.statusRaw || 'delivered',
      warranty_until: e.warranty_until || '',
    })
  }

  const openCreate = () => {
    setCreateErr(null)
    setCreateForm({ item_id: '', register_number: '', model: '', serial_number: '', location: '', warranty_until: '' })
    fetchAllRequestItems()
      .then((list) => setItemOptions(list))
      .catch((e) => toast(e.message || String(e), 'error'))
    setCreating(true)
  }

  const saveCreate = async () => {
    if (!createForm.item_id || !createForm.register_number) {
      setCreateErr(sw ? 'Chagua kifaa na ingiza nambari ya usajili.' : 'Select an item and enter a register number.')
      return
    }
    setBusy('create')
    try {
      await createEquipment({
        item_id: Number(createForm.item_id),
        register_number: createForm.register_number.trim(),
        model: createForm.model || undefined,
        serial_number: createForm.serial_number || undefined,
        location: createForm.location || undefined,
        warranty_until: createForm.warranty_until || undefined,
      })
      setCreating(false)
      toast(sw ? 'Kifaa kimesajiliwa.' : 'Equipment registered.')
      load()
    } catch (e) {
      setCreateErr(e.message)
      toast(e.message || String(e), 'error')
    } finally {
      setBusy(null)
    }
  }

  const saveEdit = async () => {
    if (editForm.amount !== '' && !(Number(editForm.amount) >= 0)) {
      toast(sw ? 'Weka kiasi sahihi (namba).' : 'Enter a valid amount (number).', 'error')
      return
    }
    setBusy('edit')
    try {
      await updateEquipment(editing.id, {
        model: editForm.model || undefined,
        serial_number: editForm.serial_number || undefined,
        amount: editForm.amount !== '' ? Number(editForm.amount) : undefined,
        location: editForm.location || undefined,
        status: editForm.status,
        warranty_until: editForm.warranty_until || undefined,
      })
      setEditing(null)
      toast(sw ? 'Kifaa kimesasishwa.' : 'Equipment updated.')
      load()
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusy(null)
    }
  }

  const statusMap = Object.fromEntries(
    Object.keys(STATUS_STYLE).map((s) => [s, { en: STATUS_LABELS[s].en, sw: STATUS_LABELS[s].sw }])
  )

  const openEvidence = async (e) => {
    try {
      await openEquipmentEvidence(e.id)
    } catch (err) {
      toast(err.message || String(err), 'error')
    }
  }

  const columns = [
    { key: 'reg', label: sw ? 'Usajili' : 'Reg', labelSw: 'Usajili', render: (e) => (
      <code className="text-[11px] font-mono font-semibold text-ink-600 bg-ink-50 border border-ink-200/60 rounded px-1.5 py-0.5 whitespace-nowrap">{e.reg}</code>
    ) },
    { key: 'item', label: sw ? 'Kifaa' : 'Item', labelSw: 'Kifaa', render: (e) => (
      <div className="min-w-0">
        <div className="text-[13px] font-bold text-ink-800 capitalize truncate max-w-[200px]">{e.item}</div>
        <div className="text-[11px] text-ink-400 truncate max-w-[200px] capitalize">{e.recipient} · {e.region}</div>
      </div>
    ) },
    { key: 'serial', label: sw ? 'Serial' : 'Serial', render: (e) => (
      <code className="text-[11px] font-mono text-ink-500 whitespace-nowrap">{e.serial || '—'}</code>
    ) },
    { key: 'status', label: sw ? 'Hali' : 'Status', labelSw: 'Hali', pill: (e) => {
      const s = e.statusRaw || e.status || ''
      const cls = STATUS_STYLE[s] || 'bg-ink-100 text-ink-700'
      return { text: (STATUS_LABELS[s]?.[sw ? 'sw' : 'en']) || e.status || '—', cls }
    } },
    { key: 'delivery', label: sw ? 'Uthibitisho wa Uwasilishaji' : 'Delivery Confirmation', render: (e) => (
      <div className="flex flex-wrap gap-1.5">
        {(['recipient', 'supplier', 'church']).map((party) => {
          const p = (e.parties_confirmed || []).find((x) => x.party === party)
          const done = !!p?.confirmed
          return (
            <button
              key={party}
              disabled={busy === `${e.id}:${party}`}
              onClick={() => onConfirmParty(e, party)}
              className={
                'text-[11px] font-semibold px-2 py-1 rounded-lg transition-all whitespace-nowrap ' +
                (done
                  ? 'bg-success-600 text-white cursor-default hover:bg-success-600'
                  : 'bg-white border border-ink-300 text-ink-600 hover:border-success-500 hover:text-success-700 disabled:opacity-50')
              }
              title={done ? sw ? 'Imethibitishwa' : 'Confirmed' : sw ? 'Bonyeza kuthibitisha' : 'Click to confirm'}
            >
              {done ? '✓ ' : ''}{sw ? PARTY_LABELS[party].sw : PARTY_LABELS[party].en}
            </button>
          )
        })}
      </div>
    ) },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">{sw ? 'Rejesta ya Vifaa' : 'Equipment Register'}</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            {sw ? 'Rejesta ya umiliki, nambari ya serial na hali ya kila kifaa.' : 'Ownership register, serial numbers and status of each item.'}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-forest btn-sm"
        >
          <span className="text-lg leading-none">+</span>
          {sw ? 'Sajili Kifaa' : 'Register Equipment'}
        </button>
      </div>

      <AdminDenseTable
        sw={sw}
        rows={rows}
        columns={columns}
        loading={loading}
        loadError={loadError}
        onRetry={load}
        searchKeys={['item', 'recipient', 'reg', 'serial', 'region']}
        statusKey="statusRaw"
        statusMap={statusMap}
        perPage={9}
        emptyText={sw ? 'Hakuna vifaa.' : 'No equipment.'}
        label={sw ? 'Vifaa' : 'Equipment'}
        rowActions={(e) => (
          <>
            {e.evidence && (
              <button
                onClick={() => openEvidence(e)}
                className="px-2.5 py-1.5 text-xs font-semibold text-oweru-700 hover:bg-oweru-50 rounded-lg transition-colors"
              >
                {sw ? 'Uthibitisho' : 'Evidence'}
              </button>
            )}
            <button
              onClick={() => openEdit(e)}
              className="px-2.5 py-1.5 text-xs font-semibold text-ink-600 hover:text-oweru-700 hover:bg-gold-50 rounded-lg transition-colors"
            >
              {sw ? 'Hariri' : 'Edit'}
            </button>
            <button
              onClick={() => onDelete(e.id, e.item)}
              disabled={busy === e.id}
              className="px-2.5 py-1.5 text-xs font-semibold text-error-700 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {busy === e.id ? '...' : sw ? 'Futa' : 'Delete'}
            </button>
          </>
        )}
      />

      {creating && (
        <AdminEditModal
          title={sw ? 'Sajili Kifaa' : 'Register Equipment'}
          icon="truck"
          form={createForm}
          setForm={setCreateForm}
          onSave={saveCreate}
          onClose={() => setCreating(false)}
          busy={busy === 'create'}
          error={createErr}
          cancelLabel={sw ? 'Ghairi' : 'Cancel'}
          saveLabel={sw ? 'Sajili' : 'Register'}
          fields={[
            {
              key: 'item_id',
              label: sw ? 'Kifaa / Ombi' : 'Item / Request',
              type: 'select',
              options: itemOptions.map((it) => ({ value: String(it.id), label: it.name + (it.request ? ' — ' + it.request : '') })),
            },
            { key: 'register_number', label: sw ? 'Nambari ya Usajili' : 'Register Number', placeholder: sw ? 'Mf. OWR-0001-TZ' : 'e.g. OWR-0001-TZ' },
            { key: 'model', label: sw ? 'Model' : 'Model' },
            { key: 'serial_number', label: sw ? 'Nambari ya Serial' : 'Serial Number' },
            { key: 'location', label: sw ? 'Mahali' : 'Location' },
            { key: 'warranty_until', label: sw ? 'Dhamana Hadi' : 'Warranty Until' },
          ]}
        />
      )}

      {editing && (
        <AdminEditModal
          title={sw ? 'Hariri Kifaa' : 'Edit Equipment'}
          icon="truck"
          form={editForm}
          setForm={setEditForm}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          busy={busy === 'edit'}
          cancelLabel={sw ? 'Ghairi' : 'Cancel'}
          saveLabel={sw ? 'Hifadhi' : 'Save'}
          fields={[
            { key: 'model', label: sw ? 'Model' : 'Model' },
            { key: 'serial_number', label: sw ? 'Nambari ya Serial' : 'Serial Number' },
            { key: 'amount', label: sw ? 'Kiasi (TZS)' : 'Amount (TZS)', type: 'number' },
            { key: 'location', label: sw ? 'Mahali' : 'Location' },
            {
              key: 'status',
              label: sw ? 'Hali' : 'Status',
              type: 'select',
              options: Object.keys(STATUS_LABELS).map((s) => ({ value: s, label: sw ? STATUS_LABELS[s].sw : STATUS_LABELS[s].en })),
            },
            { key: 'warranty_until', label: sw ? 'Dhamana Hadi' : 'Warranty Until' },
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
        busy={!!busy}
        onConfirm={confirm?.onConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}