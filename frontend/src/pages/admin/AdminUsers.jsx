import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import { fetchUsers, createUser, updateUser, deleteUser, resetUserPassword, fetchOrganizationsAdmin } from '../../api'
import { useToast } from '../../components/Toast'
import AdminEditModal from '../../components/AdminEditModal'
import AdminDenseTable from '../../components/AdminDenseTable'
import ConfirmDialog from '../../components/ConfirmDialog'
import { inputCls } from '../../components/FormField'

const ROLE_LABELS = {
  admin: { en: 'Main Admin', sw: 'Msimamizi Mkuu' },
  manager: { en: 'Manager', sw: 'Meneja' },
  reviewer: { en: 'Board Member', sw: 'Bodi' },
  endorser: { en: 'Church', sw: 'Kanisa' },
}
const CHURCH_STATUS = { verified: 'Approved', pending: 'Pending', rejected: 'Rejected' }

const ROLE_STYLE = {
  admin: 'bg-gold-100 text-gold-800',
  endorser: 'bg-success-100 text-success-700',
}

export default function AdminUsers() {
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
  const [createErr, setCreateErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [churches, setChurches] = useState([])
  const [confirmState, setConfirmState] = useState(null)
  const [resetUser, setResetUser] = useState(null)
  const [newPw, setNewPw] = useState('')
  const [pwErr, setPwErr] = useState(null)

  useEffect(() => {
    fetchOrganizationsAdmin()
      .then((list) => setChurches(list.filter((o) => o.type === 'church')))
      .catch((e) => toast(e.message || String(e), 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = () => {
    setLoading(true)
    setLoadError(null)
    fetchUsers()
      .then((r) => setRows(Array.isArray(r) ? r : []))
      .catch((e) => { setRows([]); setLoadError(e.message || String(e)) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let alive = true
    fetchUsers()
      .then((r) => alive && setRows(Array.isArray(r) ? r : []))
      .catch((e) => alive && setLoadError(e.message || String(e)))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const onToggleStatus = async (u) => {
    const next = u.status === 'active' ? 'inactive' : 'active'
    setConfirmState({
      title: sw ? (next === 'active' ? 'Washa akaunti' : 'Lemaza akaunti') : (next === 'active' ? 'Enable account' : 'Disable account'),
      message: sw
        ? `${next === 'active' ? 'Washa' : 'Lemaza'} akaunti ya ${u.name}?`
        : `${next === 'active' ? 'Enable' : 'Disable'} account for ${u.name}?`,
      confirmLabel: sw ? (next === 'active' ? 'Washa' : 'Lemaza') : (next === 'active' ? 'Enable' : 'Disable'),
      icon: '⚙',
      tone: 'warning',
      onConfirm: async () => {
        setBusyId(u.id)
        try {
          await updateUser(u.id, { status: next })
          toast(sw ? 'Imehifadhiwa.' : 'Saved.')
          load()
        } catch (e) {
          toast(e.message || String(e), 'error')
        } finally {
          setBusyId(null)
          setConfirmState(null)
        }
      },
    })
  }

  const onDelete = async (u) => {
    setConfirmState({
      title: sw ? 'Futa akaunti' : 'Delete account',
      message: sw
        ? `Unaufuta akaunti ya ${u.name}. Hatua hii haiwezi kutenduliwa.`
        : `Delete account for ${u.name}? This cannot be undone.`,
      confirmLabel: sw ? 'Futa' : 'Delete',
      icon: '🗑',
      onConfirm: async () => {
        setBusyId(u.id)
        try {
          await deleteUser(u.id)
          toast(sw ? 'Akaunti imefutwa.' : 'Account deleted.')
          load()
        } catch (e) {
          toast(e.message || String(e), 'error')
        } finally {
          setBusyId(null)
          setConfirmState(null)
        }
      },
    })
  }

  const onResetPassword = async (u) => {
    setResetUser(u)
    setNewPw('')
    setPwErr(null)
  }

  const confirmReset = async () => {
    if (!newPw) { setPwErr(sw ? 'Nenosiri linahitajika.' : 'Password is required.'); return }
    if (newPw.length < 8) { setPwErr(sw ? 'Nenosiri liwe na angalau herufi 8.' : 'Password must be at least 8 characters.'); return }
    setBusyId(resetUser.id)
    try {
      await resetUserPassword(resetUser.id, newPw)
      toast(sw ? 'Nenosiri limebadilishwa.' : 'Password reset.')
      setResetUser(null)
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const openEdit = (u) => {
    setEditing(u)
    setEditForm({ name: u.name, email: u.email, role: u.role, status: u.status, password: '', organization_id: u.organization_id || '' })
  }

  const saveEdit = async () => {
    if (!editForm.name) { toast(sw ? 'Jina linahitajika.' : 'Name is required.', 'error'); return }
    if (!editForm.email || !/^\S+@\S+\.\S+$/.test(editForm.email)) {
      toast(sw ? 'Anwani halali ya barua pepe inahitajika.' : 'A valid email address is required.', 'error')
      return
    }
    if (editForm.password && editForm.password.length < 8) {
      toast(sw ? 'Nenosiri liwe na angalau herufi 8.' : 'Password must be at least 8 characters.', 'error')
      return
    }
    setBusy(true)
    try {
      const payload = { name: editForm.name, email: editForm.email, role: editForm.role, status: editForm.status }
      if (editForm.role === 'endorser' && !editForm.organization_id && !editing.organization_id) {
        setBusy(false)
        toast(sw ? 'Chagua kanisa kwa akaunti ya Kanisa.' : 'Select a church for the Church account.', 'error')
        return
      }
      payload.organization_id = editForm.organization_id || editing.organization_id || undefined
      if (editForm.password) payload.password = editForm.password
      await updateUser(editing.id, payload)
      setEditing(null)
      toast(sw ? 'Akaunti imesasishwa.' : 'Account updated.')
      load()
    } catch (e) {
      toast(e.message || String(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  const openCreate = () => {
    setCreateForm({ name: '', email: '', password: '', role: 'manager', status: 'active', organization_id: '' })
    setCreateErr(null)
    setCreating(true)
  }

  const saveCreate = async () => {
    if (!createForm.name) { setCreateErr(sw ? 'Jina linahitajika.' : 'Name is required.'); return }
    if (!createForm.email || !/^\S+@\S+\.\S+$/.test(createForm.email)) { setCreateErr(sw ? 'Anwani halali ya barua pepe inahitajika.' : 'A valid email address is required.'); return }
    if (!createForm.password || createForm.password.length < 8) { setCreateErr(sw ? 'Nenosiri liwe na angalau herufi 8.' : 'Password must be at least 8 characters.'); return }
    if (createForm.role === 'endorser' && !createForm.organization_id) { setCreateErr(sw ? 'Chagua kanisa kwa akaunti ya Kanisa.' : 'Select a church for the Church account.'); return }
    setCreateErr(null)
    setBusy(true)
    try {
      await createUser(createForm)
      setCreating(false)
      toast(sw ? 'Akaunti imeundwa.' : 'Account created.')
      load()
    } catch (e) {
      setCreateErr(e.message)
      toast(e.message || String(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    { key: 'name', label: sw ? 'Jina' : 'Name', labelSw: 'Jina', bold: true, render: (u) => (
      <span className="text-[13px] font-bold text-ink-800">{u.name}</span>
    ) },
    { key: 'email', label: 'Email', render: (u) => <span className="text-xs text-ink-600">{u.email}</span> },
    { key: 'role', label: sw ? 'Jukumu' : 'Role', labelSw: 'Jukumu', pill: (u) => ({
      text: sw ? (ROLE_LABELS[u.role]?.sw || u.role) : (ROLE_LABELS[u.role]?.en || u.role),
      cls: ROLE_STYLE[u.role] || 'bg-oweru-100 text-oweru-800',
    }) },
    { key: 'status', label: sw ? 'Hali' : 'Status', labelSw: 'Hali', pill: (u) => u.status === 'active'
      ? { text: sw ? 'Ameanza' : 'Active', cls: 'bg-success-50 text-success-700 border border-success-200', dot: 'bg-success-500' }
      : { text: sw ? 'Imelemazwa' : 'Inactive', cls: 'bg-ink-50 text-ink-500 border border-ink-200', dot: 'bg-ink-400' } },
    { key: 'date', label: sw ? 'Imeundwa' : 'Created', labelSw: 'Imeundwa', render: (u) => <span className="text-xs text-ink-500">{u.date || '—'}</span> },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">{sw ? 'Wafanyakazi' : 'Staff Accounts'}</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            {sw ? 'Simamia akaunti za wafanyakazi (Msimamizi Mkuu & Meneja).' : 'Manage staff accounts (Main Admin & Manager).'}
          </p>
        </div>
        <button onClick={openCreate} className="btn-forest btn-sm">
          + {sw ? 'Ongeza Mfanyakazi' : 'Add Staff'}
        </button>
      </div>

      <AdminDenseTable
        sw={sw}
        rows={rows}
        columns={columns}
        loading={loading}
        loadError={loadError}
        onRetry={load}
        searchKeys={['name', 'email', 'role']}
        statusKey="status"
        perPage={9}
        emptyText={sw ? 'Hakuna wafanyakazi isipokuwa msimamizi.' : 'No staff accounts yet.'}
        label={sw ? 'Wafanyakazi' : 'Staff'}
        rowActions={(u) => (
          <>
            <button
              onClick={() => onToggleStatus(u)}
              disabled={busyId === u.id}
              className="px-2.5 py-1.5 text-xs font-semibold text-oweru-700 hover:bg-oweru-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {busyId === u.id ? '...' : u.status === 'active' ? (sw ? 'Lemaza' : 'Disable') : (sw ? 'Washa' : 'Enable')}
            </button>
            <button onClick={() => openEdit(u)} className="px-2.5 py-1.5 text-xs font-semibold text-ink-600 hover:text-oweru-700 hover:bg-gold-50 rounded-lg transition-colors">{sw ? 'Hariri' : 'Edit'}</button>
            <button onClick={() => onResetPassword(u)} disabled={busyId === u.id} className="px-2.5 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50 rounded-lg transition-colors disabled:opacity-50">{sw ? 'Nenosiri' : 'Password'}</button>
            <button onClick={() => onDelete(u)} disabled={busyId === u.id} className="px-2.5 py-1.5 text-xs font-semibold text-error-700 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50">{busyId === u.id ? '...' : sw ? 'Futa' : 'Delete'}</button>
          </>
        )}
      />

      {editing && (
        <AdminEditModal
          title={sw ? 'Hariri Mfanyakazi' : 'Edit Staff Account'}
          desc={editing.email}
          icon="user"
          form={editForm}
          setForm={setEditForm}
          busy={busy}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          cancelLabel={sw ? 'Ghairi' : 'Cancel'}
          saveLabel={sw ? 'Hifadhi' : 'Save'}
          fields={[
            { key: 'name', label: sw ? 'Jina' : 'Name', required: true },
            { key: 'email', label: 'Email', full: true },
            { key: 'role', label: sw ? 'Jukumu' : 'Role', type: 'select', options: [
              { value: 'admin', label: sw ? 'Msimamizi Mkuu' : 'Main Admin' },
              { value: 'manager', label: sw ? 'Meneja' : 'Manager' },
              { value: 'reviewer', label: sw ? 'Bodi' : 'Board Member' },
              { value: 'endorser', label: sw ? 'Kanisa' : 'Church' },
            ]},
            { key: 'password', label: sw ? 'Nenosiri mpya (hiari)' : 'New password (optional)', type: 'password', hint: sw ? 'Acha tupu usibadilishe.' : 'Leave empty to keep current.' },
            ...(editForm.role === 'endorser' ? [{
              key: 'organization_id', label: sw ? 'Kanisa' : 'Church', type: 'select', full: true, required: true,
              options: [
                { value: '', label: sw ? '— Chagua kanisa —' : '— Select church —' },
                ...churches.map((c) => ({ value: String(c.id), label: c.name + (c.verification_status !== 'verified' ? ` (${CHURCH_STATUS[c.verification_status] || c.verification_status})` : '') })),
              ],
            }] : []),
          ]}
        />
      )}

      {creating && (
        <AdminEditModal
          title={sw ? 'Ongeza Mfanyakazi' : 'Add Staff Account'}
          icon="user"
          form={createForm}
          setForm={setCreateForm}
          busy={busy}
          error={createErr}
          onSave={saveCreate}
          onClose={() => setCreating(false)}
          cancelLabel={sw ? 'Ghairi' : 'Cancel'}
          saveLabel={sw ? 'Unda Akaunti' : 'Create Account'}
          fields={[
            { key: 'name', label: sw ? 'Jina' : 'Name', required: true },
            { key: 'email', label: 'Email', full: true, required: true },
            { key: 'role', label: sw ? 'Jukumu' : 'Role', type: 'select', options: [
              { value: 'manager', label: sw ? 'Meneja' : 'Manager' },
              { value: 'admin', label: sw ? 'Msimamizi Mkuu' : 'Main Admin' },
              { value: 'reviewer', label: sw ? 'Bodi' : 'Board Member' },
              { value: 'endorser', label: sw ? 'Kanisa' : 'Church' },
            ]},
            { key: 'password', label: sw ? 'Nenosiri' : 'Password', type: 'password', required: true, hint: sw ? 'Angalau herufi 8.' : 'At least 8 characters.' },
            ...(createForm.role === 'endorser' ? [{
              key: 'organization_id', label: sw ? 'Kanisa' : 'Church', type: 'select', full: true, required: true,
              options: [
                { value: '', label: sw ? '— Chagua kanisa —' : '— Select church —' },
                ...churches.map((c) => ({ value: String(c.id), label: c.name + (c.verification_status !== 'verified' ? ` (${CHURCH_STATUS[c.verification_status] || c.verification_status})` : '') })),
              ],
            }] : []),
          ]}
        />
      )}
    <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        icon={confirmState?.icon}
        tone={confirmState?.tone || 'danger'}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={sw ? 'Ghairi' : 'Cancel'}
        busy={busyId !== null}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirmState(null)}
      />

      {resetUser && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="reset-pw-title">
          <button type="button" aria-label="Close dialog" tabIndex={-1} onClick={() => setResetUser(null)} className="absolute inset-0 bg-ink-900/40" />
          <div className="panel relative w-full max-w-md p-6 animate-toast-in">
            <h2 id="reset-pw-title" className="text-base font-bold text-ink-900">{sw ? 'Badilisha nenosiri' : 'Reset password'}</h2>
            <p className="mt-1 text-sm text-ink-600">
              {sw
                ? `Weka nenosiri jipya kwa ${resetUser.name}. Vikao vyake vyote vitafutwa.`
                : `Set a new password for ${resetUser.name}. All their sessions will be revoked.`}
            </p>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold text-ink-700" htmlFor="reset-pw-input">
                {sw ? 'Nenosiri mpya (angalau herufi 8)' : 'New password (at least 8 characters)'}
              </label>
              <input
                id="reset-pw-input"
                type="password"
                value={newPw}
                onChange={(e) => { setNewPw(e.target.value); setPwErr(null) }}
                autoFocus
                className={inputCls}
              />
              {pwErr && <p className="mt-1 text-xs font-semibold text-error-700">{pwErr}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setResetUser(null)} disabled={busyId === resetUser.id} className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50">
                {sw ? 'Ghairi' : 'Cancel'}
              </button>
              <button onClick={confirmReset} disabled={busyId === resetUser.id} className="btn-forest btn-sm">
                {busyId === resetUser.id && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />}
                {sw ? 'Hifadhi nenosiri' : 'Save password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}