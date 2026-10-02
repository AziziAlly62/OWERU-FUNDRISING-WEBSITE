import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import { fetchReports, updateReport, deleteReport, fetchAllRequestItems, createReport, openReportEvidence } from '../../api'
import { onStatsChange } from '../../statsBus'
import { useToast } from '../../components/Toast'
import AdminEditModal from '../../components/AdminEditModal'
import AdminDenseTable from '../../components/AdminDenseTable'
import ConfirmDialog from '../../components/ConfirmDialog'
import { formatDate } from '../../utils/validation'
import { inputCls } from '../../components/FormField'

const STATUS_COLORS = {
  submitted: 'bg-warning-100 text-warning-700',
  acknowledged: 'bg-info-100 text-info-700',
  in_review: 'bg-warning-100 text-warning-700',
  completed: 'bg-success-100 text-success-700',
  overdue: 'bg-error-100 text-error-700',
}

const STATUS_LABELS = {
  submitted: { en: 'Submitted', sw: 'Imewasilishwa' },
  acknowledged: { en: 'Acknowledged', sw: 'Imetambuliwa' },
  in_review: { en: 'In Review', sw: 'Inakaguliwa' },
  completed: { en: 'Completed', sw: 'Imekamilika' },
  overdue: { en: 'Overdue', sw: 'Imechelewa' },
}

export default function AdminReports() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const { toast } = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [items, setItems] = useState([])
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ type: 'delivery', content: '' })
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const load = () => {
    setLoading(true)
    setLoadError(null)
    fetchReports()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => { setRows([]); setLoadError(e.message || String(e)) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAllRequestItems().then(setItems).catch(() => setItems([]))
    let alive = true
    const loadLive = () => fetchReports()
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
      await deleteReport(id)
      toast(sw ? 'Ripoti imefutwa.' : 'Report deleted.')
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
      title: sw ? 'Futa Ripoti' : 'Delete Report',
      message: sw
        ? `Una uhakika unataka kufuta ripoti ya "${r.item}" (${r.type})? Hatua hii haiwezi kutenduliwa.`
        : `Delete the "${r.item}" (${r.type}) report? This cannot be undone.`,
      confirmLabel: sw ? 'Futa' : 'Delete',
      icon: '🗑',
      onConfirm: () => onDelete(r.id),
    })
  }

  const openEvidence = async (r) => {
    try {
      await openReportEvidence(r.id)
    } catch (e) {
      toast(e.message || String(e), 'error')
    }
  }

  const openEdit = (r) => {
    setEditing(r)
    setEditForm({
      type: r.type,
      due_date: r.due || '',
      status: r.status,
      content: r.content || '',
      public_evidence: !!r.publicEvidence,
    })
  }

  const saveEdit = async () => {
    setBusyId('edit')
    try {
      await updateReport(editing.id, {
        type: editForm.type,
        due_date: editForm.due_date || undefined,
        status: editForm.status,
        content: editForm.content || undefined,
        public_evidence: editForm.public_evidence,
      })
      setEditing(null)
      toast(sw ? 'Ripoti imesasishwa.' : 'Report updated.')
      load()
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const startCreate = () => {
    setCreateForm({ type: 'delivery', content: '' })
    setCreating(true)
  }

  const saveCreate = async () => {
    if (!createForm.item_id) { toast(sw ? 'Chagua kifaa.' : 'Select an item.', 'error'); return }
    setSaving(true)
    try {
      const r = await createReport({
        item_id: createForm.item_id,
        type: createForm.type,
        content: createForm.content || undefined,
      })
      setCreating(false)
      toast(sw ? 'Ripoti imewasilishwa.' : 'Report submitted.')
      load()
      return r
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  const statusMap = Object.fromEntries(
    Object.keys(STATUS_COLORS).map((s) => [s, { en: STATUS_LABELS[s].en, sw: STATUS_LABELS[s].sw }])
  )

  const columns = [
    { key: 'item', label: sw ? 'Kifaa' : 'Item', labelSw: 'Kifaa', render: (r) => (
      <div className="min-w-0">
        <div className="text-[13px] font-bold text-ink-800 capitalize truncate max-w-[220px]">{r.item}</div>
        <div className="text-[11px] text-ink-400 truncate max-w-[220px] capitalize">{r.recipient || r.request || ''}</div>
      </div>
    ) },
    { key: 'type', label: sw ? 'Aina' : 'Type', labelSw: 'Aina', render: (r) => (
      <span className="text-xs font-semibold text-ink-600">{r.type || '—'}</span>
    ) },
    { key: 'status', label: sw ? 'Hali' : 'Status', labelSw: 'Hali', pill: (r) => {
      const s = r.status || ''
      return { text: (STATUS_LABELS[s]?.[sw ? 'sw' : 'en']) || r.status || '—', cls: STATUS_COLORS[s] || 'bg-ink-100 text-ink-700' }
    } },
    { key: 'due', label: sw ? 'Tarehe ya Mwisho' : 'Due', labelSw: 'Mwisho', render: (r) => (
      <span className="text-xs text-ink-500">{formatDate(r.due) || '—'}</span>
    ) },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">{sw ? 'Ripoti na Ufuatiliaji' : 'Reports & Monitoring'}</h1>
          <p className="text-sm text-ink-500 mt-0.5">{sw ? 'Ripoti za ufuatiliaji wa vifaa.' : 'Equipment monitoring reports.'}</p>
        </div>
        <button
          onClick={startCreate}
          className="btn-primary btn-sm"
        >
          {sw ? '+ Ripoti Mpya' : '+ New Report'}
        </button>
      </div>

      {creating && (
        <div className="mb-6 panel p-5 space-y-4">
          <h2 className="font-bold text-ink-900">{sw ? 'Ripoti kwa niaba ya mfadhiliwa' : 'Submit a report on behalf of a recipient'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block mb-1.5 text-sm font-semibold text-ink-700">{sw ? 'Kifaa' : 'Item'} *</span>
              <select
                value={createForm.item_id || ''}
                onChange={(e) => setCreateForm({ ...createForm, item_id: e.target.value })}
                className={`${inputCls} px-4`}
              >
                <option value="">{sw ? 'Chagua kifaa...' : 'Select item...'}</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} — {i.request}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block mb-1.5 text-sm font-semibold text-ink-700">{sw ? 'Aina' : 'Type'} *</span>
              <select
                value={createForm.type}
                onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                className={`${inputCls} px-4`}
              >
                <option value="delivery">Delivery</option>
                <option value="30_day">30 Day</option>
                <option value="90_day">90 Day</option>
                <option value="incident">Incident</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="block mb-1.5 text-sm font-semibold text-ink-700">{sw ? 'Maudhui' : 'Content'}</span>
            <textarea
              value={createForm.content}
              onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
              rows={3}
              className={`${inputCls} px-4`}
              placeholder={sw ? 'Maelezo ya ripoti...' : 'Report details...'}
            />
          </label>
          <div className="flex justify-end gap-3">
            <button onClick={() => setCreating(false)} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-ink-600 hover:bg-ink-50">{sw ? 'Ghairi' : 'Cancel'}</button>
            <button onClick={saveCreate} disabled={saving} className="btn-forest btn-sm">
              {saving ? (sw ? 'Inahifadhi...' : 'Saving...') : (sw ? 'Hifadhi' : 'Submit')}
            </button>
          </div>
        </div>
      )}

      <AdminDenseTable
        sw={sw}
        rows={rows}
        columns={columns}
        loading={loading}
        loadError={loadError}
        onRetry={load}
        searchKeys={['item', 'request', 'type', 'recipient']}
        statusKey="status"
        statusMap={statusMap}
        perPage={9}
        emptyText={sw ? 'Hakuna ripoti.' : 'No reports.'}
        label={sw ? 'Ripoti' : 'Reports'}
        rowActions={(r) => (
          <>
            {r.evidence && (
              <button
                onClick={() => openEvidence(r)}
                className="px-2.5 py-1.5 text-xs font-semibold text-oweru-700 hover:bg-oweru-50 rounded-lg transition-colors"
              >
                {sw ? 'Uthibitisho' : 'Evidence'}
              </button>
            )}
            <button
              onClick={() => openEdit(r)}
              className="px-2.5 py-1.5 text-xs font-semibold text-ink-600 hover:text-oweru-700 hover:bg-gold-50 rounded-lg transition-colors"
            >
              {sw ? 'Hariri' : 'Edit'}
            </button>
            <button
              onClick={() => askDelete(r)}
              disabled={busyId === r.id}
              className="px-2.5 py-1.5 text-xs font-semibold text-error-700 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {busyId === r.id ? '...' : sw ? 'Futa' : 'Delete'}
            </button>
          </>
        )}
      />

      {editing && (
        <AdminEditModal
          title={sw ? 'Hariri Ripoti' : 'Edit Report'}
          icon="docs"
          form={editForm}
          setForm={setEditForm}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          busy={busyId === 'edit'}
          cancelLabel={sw ? 'Ghairi' : 'Cancel'}
          saveLabel={sw ? 'Hifadhi' : 'Save'}
          fields={[
            {
              key: 'type',
              label: sw ? 'Aina' : 'Type',
              type: 'select',
              options: [
                { value: 'delivery', label: 'Delivery' },
                { value: '30_day', label: '30 Day' },
                { value: '90_day', label: '90 Day' },
                { value: 'incident', label: 'Incident' },
              ],
            },
            { key: 'due_date', label: sw ? 'Tarehe ya Mwisho' : 'Due Date', type: 'date' },
            {
              key: 'status',
              label: sw ? 'Hali' : 'Status',
              type: 'select',
              options: [
                { value: 'submitted', label: 'Submitted' },
                { value: 'acknowledged', label: 'Acknowledged' },
                { value: 'in_review', label: 'In Review' },
                { value: 'completed', label: 'Completed' },
              ],
            },
            { key: 'content', label: sw ? 'Maudhui' : 'Content', type: 'textarea' },
            {
              key: 'public_evidence',
              label: sw ? 'Uthibitisho wa Umma' : 'Public proof image',
              full: true,
              render: (form, setForm) => (
                <div>
                  <label className="flex items-start gap-3 text-sm font-medium text-ink-800">
                    <input
                      type="checkbox"
                      checked={!!form.public_evidence}
                      disabled={!editing.evidenceIsImage && !editing.publicEvidence}
                      onChange={(event) => setForm({ ...form, public_evidence: event.target.checked })}
                      className="mt-0.5"
                    />
                    <span>{sw ? 'Onyesha picha hii kwenye ripoti ya umma' : 'Show this image on the public report'}</span>
                  </label>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
                    {editing.evidenceIsImage
                      ? sw
                        ? 'Picha itaonekana kwa umma baada ya idhini hii. Ushahidi mwingine unabaki wa faragha.'
                        : 'This image becomes public after approval. Other evidence remains private.'
                      : sw
                        ? 'Ripoti hii haina picha inayoweza kuonyeshwa hadharani. PDF hubaki ya faragha.'
                        : 'This report has no image eligible for public display. PDFs remain private.'}
                  </p>
                </div>
              ),
            },
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