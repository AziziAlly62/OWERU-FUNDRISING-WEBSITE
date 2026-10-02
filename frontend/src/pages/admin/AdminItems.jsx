import { useEffect, useState, useRef } from 'react'
import { useI18n } from '../../i18n'
import { useAuth } from '../../auth'
import { fetchItems, updateItem, deleteItem } from '../../api'
import { onStatsChange } from '../../statsBus'
import { useToast } from '../../components/Toast'
import AdminEditModal from '../../components/AdminEditModal'
import AdminDenseTable from '../../components/AdminDenseTable'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminItems() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const { user } = useAuth()
  const { toast } = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const hasRowsRef = useRef(false)
  const [loadError, setLoadError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [confirm, setConfirm] = useState(null)
  const perPage = 8

  const load = (forceSpinner = false) => {
    if (forceSpinner || !hasRowsRef.current) setLoading(true)
    setLoadError(null)
    fetchItems()
      .then((r) => {
        const next = Array.isArray(r) ? r : []
        setRows(next)
        hasRowsRef.current = next.length > 0
      })
      .catch((e) => { setRows([]); setLoadError(e.message || String(e)) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const off = onStatsChange(load)
    return off
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pct = (r) => {
    const target = r.target || 0
    const raised = r.amount_raised || r.raised || 0
    return target > 0 ? Math.round((raised / target) * 100) : 0
  }

  const funded = (r) =>
    r.status === 'fully-funded' ||
    (r.target > 0 && (r.amount_raised || r.raised || 0) >= r.target)

  const columns = [
    { key: 'id', label: '#', align: 'right', labelSw: '#', render: (r) => '#' + (r.id || r.ref || '') },
    { key: 'name', label: 'Name', labelSw: 'Jina', bold: true },
    { key: 'category', label: 'Category', labelSw: 'Kategoria', bold: false },
    {
      key: 'status',
      label: 'Status',
      labelSw: 'Hali',
      pill: (r) =>
        funded(r)
          ? { text: sw ? 'Imefadhiliwa Kamili' : 'Fully Funded', cls: 'bg-success-100 text-success-700', dot: 'bg-success-500' }
          : { text: sw ? 'Inasubiri Ufadhili' : 'Pending Funding', cls: 'bg-warning-100 text-warning-700', dot: 'bg-warning-500' },
    },
    {
      key: 'progress',
      label: '%',
      labelSw: '%',
      render: (r) => {
        const p = pct(r)
        return (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
              <span
                className={'block h-full rounded-full ' + (p >= 100 ? 'bg-success-500' : p >= 50 ? 'bg-gold-500' : 'bg-info-500')}
                style={{ width: Math.min(100, p) + '%' }}
              />
            </span>
            <span className="text-[11px] font-semibold text-ink-600">{p}%</span>
          </span>
        )
      },
    },
    { key: 'deadline', label: 'Deadline', labelSw: 'Mwisho', render: (r) => <span className="text-xs text-ink-500">{r.deadline || '-'}</span> },
    {
      key: 'raised',
      label: 'Raised',
      labelSw: 'Kilichochangwa',
      align: 'right',
      render: (r) => <span className="text-xs font-bold text-ink-800">TZS {(r.amount_raised || r.raised || 0).toLocaleString()}</span>,
    },
    {
      key: 'target',
      label: 'Target',
      labelSw: 'Lengo',
      align: 'right',
      render: (r) => <span className="text-xs text-ink-500">{r.target ? 'TZS ' + r.target.toLocaleString() : '-'}</span>,
    },
  ]

  const searchKeys = ['name', 'category', 'request']

  const statusMap = {
    'fully-funded': { en: 'Fully Funded', sw: 'Imefadhiliwa Kamili' },
    'pending-funding': { en: 'Pending Funding', sw: 'Inasubiri Ufadhili' },
  }

  const reset = () => {
    setEditing(null)
    setEditForm({})
  }

  const openEdit = (r) => {
    setEditing(r)
    setEditForm({
      name: r.name || '',
      category: r.category || '',
      request: r.request || r.churchName || '',
      target: r.target || '',
    })
  }

  const saveEdit = async () => {
    setBusyId('edit')
    try {
      await updateItem(editing.id, editForm)
      toast(sw ? 'Vifaa vimesasishwa.' : 'Item updated.')
      reset()
      load()
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (r) => {
    setBusyId(r.id)
    try {
      await deleteItem(r.id)
      toast(sw ? 'Kifaa kimefutwa.' : 'Item deleted.')
      setConfirm(null)
      load()
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const askDelete = (r) => {
    setConfirm({
      title: sw ? 'Futa Kifaa' : 'Delete Item',
      message: sw
        ? `Una uhakika unataka kufuta "${r.name}"? Hatua hii haiwezi kutenduliwa.`
        : `Delete "${r.name}"? This cannot be undone.`,
      confirmLabel: sw ? 'Futa' : 'Delete',
      icon: '🗑',
      onConfirm: () => handleDelete(r),
    })
  }

  const rowActions = (r) => (
    <>
      <button
        onClick={() => openEdit(r)}
        disabled={busyId === r.id}
        className="px-2 py-1 text-xs font-semibold text-gold-700 hover:bg-gold-50 rounded-lg"
      >
        {sw ? 'Hariri' : 'Edit'}
      </button>
      <button
        onClick={() => askDelete(r)}
        disabled={busyId === r.id}
        className="px-2 py-1 text-xs font-semibold text-error-700 hover:bg-error-50 rounded-lg"
      >
        {busyId === r.id && r.id !== 'edit' ? '...' : sw ? 'Futa' : 'Delete'}
      </button>
    </>
  )

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">{sw ? 'Vifaa na Ufadhili' : 'Items & Funding'}</h1>
      <p className="text-sm text-ink-500 mb-6">{sw ? 'Vifaa vya kila ombi, maendeleo na hali ya ufadhili.' : 'Items per request, progress and funding status.'}</p>

      <AdminDenseTable
        rows={rows}
        columns={columns}
        loading={loading}
        loadError={loadError}
        onRetry={load}
        searchKeys={searchKeys}
        statusKey="status"
        statusMap={statusMap}
        perPage={perPage}
        label={sw ? 'Vifaa' : 'Items'}
        rowActions={rowActions}
        emptyText={sw ? 'Hakuna vifaa.' : 'No items.'}
        sw={sw}
      />

      {editing && (
        <AdminEditModal
          title={sw ? 'Hariri Kifaa' : 'Edit Item'}
          icon="box"
          form={editForm}
          setForm={setEditForm}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          busy={busyId === 'edit'}
          cancelLabel={sw ? 'Ghairi' : 'Cancel'}
          saveLabel={sw ? 'Hifadhi' : 'Save'}
          fields={[
            { key: 'name', label: sw ? 'Jina' : 'Name' },
            { key: 'category', label: sw ? 'Kategoria' : 'Category' },
            { key: 'request', label: sw ? 'Ombi / Kanisa' : 'Request / Church' },
            { key: 'target', label: sw ? 'Lengo (TZS)' : 'Target (TZS)', type: 'number' },
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
