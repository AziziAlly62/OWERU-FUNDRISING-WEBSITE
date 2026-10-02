import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import { fetchSuppliers, createSupplier, verifySupplier, updateSupplier, deleteSupplier } from '../../api'
import { onStatsChange } from '../../statsBus'
import { useToast } from '../../components/Toast'
import AdminEditModal from '../../components/AdminEditModal'
import AdminDenseTable from '../../components/AdminDenseTable'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminSuppliers() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const { toast } = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({})
  const [createErr, setCreateErr] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const load = () => {
    setLoading(true)
    setLoadError(null)
    fetchSuppliers()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => { setRows([]); setLoadError(e.message || String(e)) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let alive = true
    const loadLive = () => fetchSuppliers()
      .then((r) => alive && setRows(Array.isArray(r) ? r : []))
      .catch((e) => alive && setLoadError(e.message || String(e)))
      .finally(() => alive && setLoading(false))
    loadLive()
    const off = onStatsChange(loadLive)
    return () => { alive = false; off() }
  }, [])

  const onVerify = async (id) => {
    setBusyId(id)
    try {
      await verifySupplier(id)
      toast(sw ? 'Muuzaji amethibitishwa.' : 'Supplier verified.')
      load()
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const onDelete = async (id) => {
    setBusyId(id)
    try {
      await deleteSupplier(id)
      toast(sw ? 'Muuzaji amefutwa.' : 'Supplier deleted.')
      setConfirm(null)
      load()
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const askVerify = (s) => {
    setConfirm({
      title: sw ? 'Thibitisha Muuzaji' : 'Verify Supplier',
      message: sw
        ? `Thibitisha "${s.name}" kama muuzaji anayeaminika?`
        : `Verify "${s.name}" as a trusted supplier?`,
      confirmLabel: sw ? 'Thibitisha' : 'Verify',
      icon: '✓',
      tone: 'primary',
      onConfirm: () => onVerify(s.id),
    })
  }

  const askDelete = (s) => {
    setConfirm({
      title: sw ? 'Futa Muuzaji' : 'Delete Supplier',
      message: sw
        ? `Una uhakika unataka kufuta "${s.name}"? Hatua hii haiwezi kutenduliwa.`
        : `Delete "${s.name}"? This cannot be undone.`,
      confirmLabel: sw ? 'Futa' : 'Delete',
      icon: '🗑',
      onConfirm: () => onDelete(s.id),
    })
  }

  const openEdit = (s) => {
    setEditing(s)
    setEditForm({
      name: s.name,
      contact_person: s.contact_person || '',
      contact_phone: s.contact_phone || '',
      contact_email: s.contact_email || '',
      region: s.pageRegion || s.region || '',
    })
  }

  const saveEdit = async () => {
    setBusyId('edit')
    try {
      await updateSupplier(editing.id, editForm)
      toast(sw ? 'Muuzaji amesasishwa.' : 'Supplier updated.')
      setEditing(null)
      load()
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const openCreate = () => {
    setCreateForm({ name: '', contact_person: '', contact_phone: '', contact_email: '', region: '' })
    setCreateErr(null)
    setCreating(true)
  }

  const saveCreate = async () => {
    if (!createForm.name) { setCreateErr(sw ? 'Jina la muuzaji linahitajika.' : 'Supplier name is required.'); return }
    setCreateErr(null)
    setBusyId('create')
    try {
      await createSupplier(createForm)
      setCreating(false)
      toast(sw ? 'Muuzaji ameongezwa.' : 'Supplier added.')
      load()
    } catch (e) {
      setCreateErr(e.message)
      toast(e.message || String(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    { key: 'name', label: sw ? 'Jina' : 'Name', labelSw: 'Jina', bold: true, render: (s) => (
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-oweru-50 text-oweru-700 grid place-items-center text-sm font-bold">{s.name.charAt(0).toUpperCase()}</div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-ink-800 capitalize truncate">{s.name}</div>
          <div className="text-[11px] text-ink-400 truncate">{s.contact || '—'}</div>
        </div>
      </div>
    ) },
    { key: 'region', label: sw ? 'Mkoa' : 'Region', labelSw: 'Mkoa', render: (s) => <span className="text-xs text-ink-600">{s.region || '—'}</span> },
    { key: 'contact_person', label: sw ? 'Mwasiliani' : 'Contact Person', labelSw: 'Mwasiliani', render: (s) => <span className="text-xs text-ink-600">{s.contact_person || '—'}</span> },
    { key: 'contact_phone', label: sw ? 'Simu' : 'Phone', labelSw: 'Simu', render: (s) => <span className="text-xs text-ink-600">{s.contact_phone || '—'}</span> },
    { key: 'contact_email', label: 'Email', render: (s) => <span className="text-xs text-ink-600">{s.contact_email || '—'}</span> },
    { key: 'verified', label: sw ? 'Hali' : 'Status', labelSw: 'Hali', pill: (s) => s.verified
      ? { text: sw ? '✓ Imethibitishwa' : '✓ Verified', cls: 'bg-success-50 text-success-700 border border-success-200', dot: 'bg-success-500' }
      : { text: sw ? 'Inasubiri' : 'Pending', cls: 'bg-warning-50 text-warning-700 border border-warning-100', dot: 'bg-warning-500' } },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">{sw ? 'Wauzaji' : 'Suppliers'}</h1>
          <p className="text-sm text-ink-500 mt-0.5">{sw ? 'Dhibiti wauzaji wanaotolea nukuu.' : 'Manage suppliers who provide quotes.'}</p>
        </div>
        <button onClick={openCreate} className="btn-forest btn-sm">
          + {sw ? 'Ongeza Muuzaji' : 'Add Supplier'}
        </button>
      </div>

      <AdminDenseTable
        sw={sw}
        rows={rows}
        columns={columns}
        loading={loading}
        loadError={loadError}
        onRetry={load}
        searchKeys={['name', 'region', 'contact_person', 'contact_phone', 'contact_email']}
        statusKey="verified"
        statusMap={{
          true: { en: sw ? 'Imethibitishwa' : 'Verified', sw: 'Imethibitishwa' },
          false: { en: 'Pending', sw: 'Inasubiri' },
        }}
        perPage={9}
        emptyText={sw ? 'Hakuna wauzaji.' : 'No suppliers.'}
        label={sw ? 'Wauzaji' : 'Suppliers'}
        rowActions={(s) => (
          <>
            {!s.verified && (
              <button
                onClick={() => askVerify(s)}
                disabled={busyId === s.id}
                className="px-2.5 py-1.5 text-xs font-semibold text-success-700 hover:bg-success-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {busyId === s.id ? '...' : sw ? 'Thibitisha' : 'Verify'}
              </button>
            )}
            <button
              onClick={() => openEdit(s)}
              disabled={busyId === s.id}
              className="px-2.5 py-1.5 text-xs font-semibold text-ink-600 hover:text-oweru-700 hover:bg-gold-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {sw ? 'Hariri' : 'Edit'}
            </button>
            <button
              onClick={() => askDelete(s)}
              disabled={busyId === s.id}
              className="px-2.5 py-1.5 text-xs font-semibold text-error-700 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {busyId === s.id ? '...' : sw ? 'Futa' : 'Delete'}
            </button>
          </>
        )}
      />

      {editing && (
        <AdminEditModal
          title={sw ? 'Hariri Muuzaji' : 'Edit Supplier'}
          icon="user"
          form={editForm}
          setForm={setEditForm}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          busy={busyId === 'edit'}
          cancelLabel={sw ? 'Ghairi' : 'Cancel'}
          saveLabel={sw ? 'Hifadhi' : 'Save'}
          fields={[
            { key: 'name', label: sw ? 'Jina' : 'Name' },
            { key: 'contact_person', label: sw ? 'Mtu wa Mawasiliano' : 'Contact Person' },
            { key: 'contact_phone', label: sw ? 'Simu' : 'Phone' },
            { key: 'contact_email', label: 'Email' },
            { key: 'region', label: sw ? 'Mkoa' : 'Region' },
          ]}
        />
      )}
      {creating && (
        <AdminEditModal
          title={sw ? 'Ongeza Muuzaji Mpya' : 'Add New Supplier'}
          icon="user"
          form={createForm}
          setForm={setCreateForm}
          error={createErr}
          busy={busyId === 'create'}
          onSave={saveCreate}
          onClose={() => setCreating(false)}
          cancelLabel={sw ? 'Ghairi' : 'Cancel'}
          saveLabel={sw ? 'Hifadhi' : 'Save'}
          fields={[
            { key: 'name', label: sw ? 'Jina la Kampuni' : 'Company Name' },
            { key: 'contact_person', label: sw ? 'Mtu wa Mawasiliano' : 'Contact Person' },
            { key: 'contact_phone', label: sw ? 'Simu' : 'Phone' },
            { key: 'contact_email', label: 'Email' },
            { key: 'region', label: sw ? 'Mkoa' : 'Region' },
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