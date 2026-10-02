import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useAuth } from '../../auth'
import {
  fetchAdminRequests,
  updateRequestStatus,
  updateRequest,
  deleteRequest,
  openLetter,
  reviewVerification,
} from '../../api'
import useLiveOverview from '../../useLiveOverview'
import { onStatsChange } from '../../statsBus'
import { useToast } from '../../components/Toast'
import { PortalHero, StatCard } from '../../components/PortalUi'
import { AdminGridSkeleton } from '../../components/LoadingSpinner'
import Pagination from '../../components/Pagination'
import AdminEditModal from '../../components/AdminEditModal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { Icon } from '../../components/icons'
import { inputCls } from '../../components/FormField'

const PER_PAGE = 8

const PIPELINE = {
  draft: ['submitted'],
  endorsement_pending: ['under_review', 'submitted', 'more_info_needed', 'declined'],
  submitted: ['under_review', 'more_info_needed', 'declined'],
  under_review: ['approved', 'more_info_needed', 'declined'],
  more_info_needed: ['under_review', 'approved', 'declined'],
  approved: ['published'],
  declined: [],
  published: ['funding_closed'],
  funding_closed: ['procurement'],
  procurement: ['delivered'],
  delivered: ['active_reporting'],
  active_reporting: ['closed'],
  closed: [],
}

const PRIMARY_NEXT = {
  draft: 'submitted',
  endorsement_pending: 'under_review',
  submitted: 'under_review',
  under_review: 'approved',
  more_info_needed: 'under_review',
  approved: 'published',
  published: 'funding_closed',
  funding_closed: 'procurement',
  procurement: 'delivered',
  delivered: 'active_reporting',
  active_reporting: 'closed',
}

const statusLabel = {
  draft: { en: 'Draft', sw: 'Rasimu' },
  endorsement_pending: { en: 'Endorsement Pending', sw: 'Inasubiri Idhini' },
  submitted: { en: 'Submitted', sw: 'Imetumwa' },
  under_review: { en: 'Under Review', sw: 'Inakaguliwa' },
  more_info_needed: { en: 'More Info Needed', sw: 'Inahitaji Taarifa' },
  approved: { en: 'Approved', sw: 'Imeidhinishwa' },
  declined: { en: 'Declined', sw: 'Imekataliwa' },
  published: { en: 'Published', sw: 'Imechapishwa' },
  funding_closed: { en: 'Funding Closed', sw: 'Ufadhili Umefungwa' },
  procurement: { en: 'Procurement', sw: 'Ununuzi' },
  delivered: { en: 'Delivered', sw: 'Imewasilishwa' },
  active_reporting: { en: 'Active Reporting', sw: 'Ripoti Inayoendelea' },
  closed: { en: 'Closed', sw: 'Imefungwa' },
}

const NEXT_LABEL = {
  submitted: { en: 'Submit for Review', sw: 'Tuma Kukaguliwa' },
  under_review: { en: 'Start Review', sw: 'Anza Ukaguzi' },
  approved: { en: 'Approve', sw: 'Idhinisha' },
  more_info_needed: { en: 'Request More Info', sw: 'Omewa Taarifa' },
  published: { en: 'Publish', sw: 'Chapisha' },
  funding_closed: { en: 'Close Funding', sw: 'Funga Ufadhili' },
  procurement: { en: 'Start Procurement', sw: 'Anza Ununuzi' },
  delivered: { en: 'Mark Delivered', sw: 'Weka Imewasilishwa' },
  active_reporting: { en: 'Start Reporting', sw: 'Anza Ripoti' },
  closed: { en: 'Close Request', sw: 'Funga Ombi' },
}

const DD_STEPS = [
  { key: 'identity_verified', en: 'National ID', sw: 'Kitambulisho' },
  { key: 'phone_verified', en: 'Phone', sw: 'Simu' },
  { key: 'residence_verified', en: 'Residence', sw: 'Makazi' },
  { key: 'reference_verified', en: 'Church ref', sw: 'Rejea ya kanisa' },
  { key: 'documents_verified', en: 'Docs/letter', sw: 'Nyaraka/barua' },
]

const statusPill = (s) => {
  switch (s) {
    case 'approved': return 'bg-success-100 text-success-700'
    case 'declined': return 'bg-error-100 text-error-600'
    case 'draft': return 'bg-ink-100 text-ink-600'
    case 'published': return 'bg-info-100 text-info-700'
    case 'closed': return 'bg-ink-100 text-ink-500'
    case 'more_info_needed': return 'bg-warning-100 text-warning-700'
    case 'under_review': return 'bg-warning-100 text-warning-700'
    default: return 'bg-gold-100 text-gold-700'
  }
}

const statusDot = (s) => {
  switch (s) {
    case 'approved': return 'bg-success-500'
    case 'declined': return 'bg-error-500'
    case 'draft': return 'bg-ink-300'
    case 'published': return 'bg-info-500'
    default: return 'bg-gold-500'
  }
}

const pct = (r) => {
  if (!r.target) return 0
  return Math.min(100, Math.round(((r.raised || 0) / r.target) * 100))
}

export default function AdminRequests() {
  const { lang } = useI18n()
  const { user } = useAuth()
  const sw = lang === 'sw'
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const hasRowsRef = useRef(false)
  const [loadError, setLoadError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [ddTarget, setDdTarget] = useState(null)
  const [ddSteps, setDdSteps] = useState({})
  const [ddReason, setDdReason] = useState('')
  const [ddBusy, setDdBusy] = useState(false)
  const [declineTarget, setDeclineTarget] = useState(null)
  const [declineNote, setDeclineNote] = useState('')
  const [declineBusy, setDeclineBusy] = useState(false)
  const [letterTarget, setLetterTarget] = useState(null)
  const [letterReason, setLetterReason] = useState('')
  const [letterBusy, setLetterBusy] = useState(false)
  const [page, setPage] = useState(1)
  const [ftQ, setFtQ] = useState(params.get('q') || '')
  const [ftStatus, setFtStatus] = useState(params.get('status') || 'all')
  const [ftRegion, setFtRegion] = useState(params.get('region') || '')
  const [ftCategory, setFtCategory] = useState(params.get('category') || '')
  const [confirm, setConfirm] = useState(null)
  const [confirmBusy, setConfirmBusy] = useState(false)

  const load = (forceSpinner = false) => {
    if (forceSpinner || !hasRowsRef.current) setLoading(true)
    setLoadError(null)
    fetchAdminRequests()
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
    const off = onStatsChange(() => load())
    return off
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const syncParams = (patch) => {
    const next = { ...Object.fromEntries(params), ...patch }
    Object.keys(next).forEach((k) => { if (!next[k] || next[k] === 'all') delete next[k] })
    setParams(next, { replace: true })
  }

  const regions = [...new Set(rows.map((r) => r.region).filter(Boolean))].sort()
  const categories = [...new Set(rows.map((r) => r.category).filter(Boolean))].sort()

  const rowsFiltered = rows.filter((r) => {
    const okStatus = ftStatus === 'all' || r.statusRaw === ftStatus
    const okRegion = !ftRegion || r.region === ftRegion
    const okCategory = !ftCategory || r.category === ftCategory
    const q = ftQ.trim().toLowerCase()
    const okQ = !q
      || (r.title || '').toLowerCase().includes(q)
      || (r.churchName || r.org || '').toLowerCase().includes(q)
      || (r.region || '').toLowerCase().includes(q)
      || (r.category || '').toLowerCase().includes(q)
      || String(r.id || '').includes(q)
    return okStatus && okRegion && okCategory && okQ
  })

  const totalPages = Math.max(1, Math.ceil(rowsFiltered.length / PER_PAGE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const paginated = rowsFiltered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const changeStatus = async (id, status) => {
    if (!status || status === 'all') return
    const r = rows.find((x) => x.id === id)
    const target = statusLabel[status]?.[sw ? 'sw' : 'en'] || status
    setConfirmBusy(true)
    try {
      await updateRequestStatus(id, status)
      toast(sw ? 'Hali imesasishwa.' : 'Status updated.')
      setConfirm(null)
      load()
    } catch (err) {
      toast(err.message || String(err), 'error')
    } finally {
      setConfirmBusy(false)
    }
  }

  const askChangeStatus = (id, status) => {
    const r = rows.find((x) => x.id === id)
    const target = statusLabel[status]?.[sw ? 'sw' : 'en'] || status
    setConfirm({
      title: sw ? 'Badilisha Hali' : 'Change Status',
      message: sw
        ? `Sogeza "${r?.title || id}" hadi "${target}"?`
        : `Move "${r?.title || id}" to "${target}"?`,
      confirmLabel: target,
      icon: '→',
      tone: 'primary',
      onConfirm: () => changeStatus(id, status),
    })
  }

  const openEdit = (r) => {
    setEditing(r)
    setEditForm({
      title: r.title,
      sw_title: r.swTitle || '',
      region: r.region || '',
      category: r.category || '',
      program_type: r.programType || 'general',
      exposure_level: r.exposure?.toLowerCase?.() === 'open' ? 'open' : r.exposure?.toLowerCase?.() === 'protected' ? 'protected' : 'partial',
      story: r.story || '',
    })
  }

  const saveEdit = async () => {
    if (!editing) return
    setBusyId('edit')
    try {
      await updateRequest(editing.id, editForm)
      toast(sw ? 'Ombi limehaririwa.' : 'Request updated.')
      setEditing(null)
      load()
    } catch (err) {
      toast(err.message || String(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (r) => {
    setBusyId(`del-${r.id}`)
    try {
      await deleteRequest(r.id)
      toast(sw ? 'Ombi limefutwa.' : 'Request deleted.')
      setConfirm(null)
      load()
    } catch (err) {
      toast(err.message || String(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const askDelete = (r) => {
    setConfirm({
      title: sw ? 'Futa Ombi' : 'Delete Request',
      message: sw
        ? `Una uhakika unataka kufuta "${r.title}"? Ripoti, nukuu na malipo yanayohusiana yataondolewa. Hatua hii haiwezi kutenduliwa.`
        : `Delete request "${r.title}"? Related reports, quotes and payments will be removed. This cannot be undone.`,
      confirmLabel: sw ? 'Futa' : 'Delete',
      icon: '🗑',
      onConfirm: () => handleDelete(r),
    })
  }

  const toggleDD = (key) => setDdSteps((s) => ({ ...s, [key]: !s[key] }))

  const submitDD = async (status) => {
    if (!ddTarget) return
    if (status === 'verified' && !DD_STEPS.every((s) => ddSteps[s.key])) {
      toast(sw ? 'Angalia hatua zote 5 kabla ya kuthibitisha.' : 'Check all 5 steps before verifying.', 'error')
      return
    }
    if (status === 'rejected' && !ddReason.trim()) {
      toast(sw ? 'Tafadhali weka sababu ya kukataa.' : 'Please provide a reason for rejection.', 'error')
      return
    }
    setDdBusy(true)
    try {
      await reviewVerification(ddTarget.applicantVerification.id, {
        ...ddSteps,
        status,
        notes: ddReason.trim() || null,
      })
      toast(status === 'verified'
        ? (sw ? 'Muombaji amethibitishwa.' : 'Applicant verified.')
        : (sw ? 'Muombaji amekataliwa.' : 'Applicant rejected.'))
      setDdTarget(null)
      setDdSteps({})
      setDdReason('')
      load()
    } catch (err) {
      toast(err.message || String(err), 'error')
    } finally {
      setDdBusy(false)
    }
  }

  const openDD = (r) => {
    const v = r.applicantVerification
    setDdTarget(r)
    setDdSteps({
      identity_verified: !!v?.identity_verified,
      phone_verified: !!v?.phone_verified,
      residence_verified: !!v?.residence_verified,
      reference_verified: !!v?.reference_verified,
      documents_verified: !!v?.documents_verified,
    })
    setDdReason('')
  }

  const ddDone = (r) => {
    const v = r.applicantVerification
    if (!v) return { text: sw ? 'Hakuna' : 'None', cls: 'bg-ink-100 text-ink-500' }
    if (v.status === 'verified') return { text: sw ? '✓ Thabiti' : '✓ Verified', cls: 'bg-success-100 text-success-700' }
    if (v.status === 'rejected') return { text: sw ? '✕ Imekataliwa' : '✕ Rejected', cls: 'bg-error-100 text-error-600' }
    return { text: sw ? 'Inakaguliwa' : 'In review', cls: 'bg-gold-100 text-gold-700' }
  }

  const letterDone = (r) => {
    const s = r.letterStatus
    if (s === 'approved') return { text: sw ? '✓ Imeidhinishwa' : '✓ Approved', cls: 'bg-success-100 text-success-700' }
    if (s === 'rejected') return { text: sw ? '✕ Imekataliwa' : '✕ Rejected', cls: 'bg-error-100 text-error-600' }
    if (s === 'pending') return { text: sw ? 'Inasubiri' : 'Pending', cls: 'bg-gold-100 text-gold-700' }
    return { text: '—', cls: 'bg-ink-100 text-ink-400' }
  }

  const submitLetter = async (status) => {
    if (!letterTarget) return
    if (status === 'rejected' && !letterReason.trim()) {
      toast(sw ? 'Weka sababu ya kukataa barua.' : 'Provide a reason to reject the letter.', 'error')
      return
    }
    setLetterBusy(true)
    try {
      await updateRequest(letterTarget.id, {
        letter_status: status,
        letter_notes: letterReason.trim() || null,
      })
      toast(status === 'approved'
        ? (sw ? 'Barua imeidhinishwa.' : 'Letter approved.')
        : (sw ? 'Barua imekataliwa.' : 'Letter rejected.'))
      setLetterTarget(null)
      setLetterReason('')
      load()
    } catch (err) {
      toast(err.message || String(err), 'error')
    } finally {
      setLetterBusy(false)
    }
  }

  const submitDecline = async () => {
    if (!declineTarget) return
    if (!declineNote.trim()) {
      toast(sw ? 'Weka sababu ya kukataa.' : 'Provide a reason to decline.', 'error')
      return
    }
    setDeclineBusy(true)
    try {
      await updateRequestStatus(declineTarget.id, 'declined', declineNote.trim())
      toast(sw ? 'Ombi limekataliwa.' : 'Request declined.')
      setDeclineTarget(null)
      setDeclineNote('')
      load()
    } catch (err) {
      toast(err.message || String(err), 'error')
    } finally {
      setDeclineBusy(false)
    }
  }

  const nextActions = (r) => {
    const pipe = PIPELINE[r.statusRaw] || []
    const primary = PRIMARY_NEXT[r.statusRaw]
    const rest = pipe.filter((s) => s !== primary && s !== 'declined')
    return { primary, rest, canDecline: pipe.includes('declined') }
  }

  const ddBadge = ddDone

  const totalRows = rows.length
  const approvedRows = rows.filter((r) => r.statusRaw === 'approved').length
  const pendingRows = rows.filter((r) => ['draft', 'endorsement_pending', 'submitted', 'under_review', 'more_info_needed'].includes(r.statusRaw)).length
  const raisedRows = rows.reduce((a, r) => a + (r.raised || 0), 0)

  return (
    <div>
      <PortalHero
        icon="list"
        eyebrow={sw ? 'Usimamizi' : 'Admin'}
        title={sw ? 'Halo, ' + (user?.name || '') : 'Hello, ' + (user?.name || '')}
        accent="oweru"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="list" label={sw ? 'Maombi yote' : 'Total requests'} value={totalRows} tone="oweru" />
        <StatCard icon="check" label={sw ? 'Yaliyoidhinishwa' : 'Approved'} value={approvedRows} tone="green" />
        <StatCard icon="clock" label={sw ? 'Yanasubiri' : 'Pending'} value={pendingRows} tone="gold" />
        <StatCard icon="donate" label={sw ? 'Zilizochangwa (TZS)' : 'Raised (TZS)'} value={raisedRows} prefix="TZS " tone="ink" />
      </div>

      {loadError && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-error-100 text-error-700 text-sm font-bold" aria-hidden="true">!</span>
            <div>
              <p className="text-sm font-semibold text-error-700">{sw ? 'Imeshindikana kupakia maombi.' : 'Failed to load requests.'}</p>
              <p className="text-xs text-error-600/80">{loadError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={load}
            className="shrink-0 rounded-xl border border-error-200 bg-white px-4 py-2 text-sm font-semibold text-error-700 hover:bg-error-100 transition-colors"
          >
            {sw ? 'Jaribu tena' : 'Retry'}
          </button>
        </div>
      )}

      {loading ? (
        <AdminGridSkeleton cards={6} message={sw ? 'Inapakia maombi...' : 'Loading requests...'} />
      ) : (
        <>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            type="search"
            value={ftQ}
            onChange={(e) => { setFtQ(e.target.value); setPage(1); syncParams({ q: e.target.value }) }}
            placeholder={sw ? 'Tafuta kichwa, kanisa, mkoa, #...' : 'Search title, church, region, #...'}
            className="{`${inputCls} px-4 sm:max-w-xs`}"
          />
          <select
            value={ftStatus}
            onChange={(e) => { setFtStatus(e.target.value); setPage(1); syncParams({ status: e.target.value }) }}
            className="{`${inputCls} sm:w-44`}"
          >
            <option value="all">{sw ? 'Hali zote' : 'All statuses'}</option>
            {STATUS_ORDER.filter((s) => rows.some((r) => r.statusRaw === s)).map((s) => (
              <option key={s} value={s}>{statusLabel[s]?.[sw ? 'sw' : 'en'] || s}</option>
            ))}
          </select>
          <select
            value={ftRegion}
            onChange={(e) => { setFtRegion(e.target.value); setPage(1); syncParams({ region: e.target.value }) }}
            className="{`${inputCls} sm:w-44`}"
          >
            <option value="">{sw ? 'Mila zote' : 'All regions'}</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={ftCategory}
            onChange={(e) => { setFtCategory(e.target.value); setPage(1); syncParams({ category: e.target.value }) }}
            className="{`${inputCls} sm:w-44`}"
          >
            <option value="">{sw ? 'Kila kategoria' : 'All categories'}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {ftQ || ftStatus !== 'all' || ftRegion || ftCategory ? (
            <button
              onClick={() => { setFtQ(''); setFtStatus('all'); setFtRegion(''); setFtCategory(''); setPage(1); syncParams({ q: '', status: 'all', region: '', category: '' }) }}
              className="text-sm font-semibold text-oweru-700 hover:underline"
            >
              {sw ? 'Ondoa vichujio' : 'Clear filters'}
            </button>
          ) : null}
          <span className="text-xs text-ink-500 sm:ml-auto">
            {rowsFiltered.length} {sw ? 'ya' : 'of'} {rows.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginated.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 empty-state text-center py-16 text-ink-500 card-base">
              {sw ? 'Hakuna maombi yanayolingana na vichujio.' : 'No requests match the current filters.'}
            </div>
          ) : paginated.map((r) => {
            const dd = ddBadge(r)
            const lt = letterDone(r)
            const p = pct(r)
            const { primary, rest, canDecline } = nextActions(r)
            return (
              <div key={r.id} className="card-base overflow-hidden flex flex-col group">
                <div className="border-b border-ink-100 px-5 py-4 flex items-center justify-between gap-2 bg-oweru-50/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 shrink-0 rounded-lg bg-white border border-ink-200 text-oweru-700 flex items-center justify-center">
                      <Icon name={r.category === 'Other' ? 'users' : 'package'} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-oweru-700 truncate capitalize">
                        {r.category || (sw ? 'Jumla' : 'General')}
                      </div>
                      <div className="text-xs text-ink-500 truncate uppercase tracking-wide">{r.region || '—'}</div>
                    </div>
                  </div>
                  <span className={'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0 ' + statusPill(r.statusRaw)}>
                    <span className={'h-1.5 w-1.5 rounded-full ' + statusDot(r.statusRaw)} />
                    {statusLabel[r.statusRaw]?.[sw ? 'sw' : 'en'] || r.status}
                  </span>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <a
                    href={'/requests/' + r.id}
                    target="_blank"
                    rel="noreferrer"
                    className="font-display font-semibold text-lg mb-1 text-ink-900 group-hover:text-oweru-700 transition-colors line-clamp-2 capitalize"
                    title={r.title + ' — ' + (sw ? 'fungua ukurasa wa umma' : 'open public page')}
                  >
                    {r.title}
                  </a>
                  {(r.churchName || r.org) && <div className="text-xs text-ink-500 mb-3 truncate">{r.churchName || r.org}</div>}

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-ink-500 mb-1.5">
                      <span>{sw ? 'Iliyochangwa' : 'Raised'}</span>
                      <span className="font-semibold text-oweru-700">{p}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-ink-100 overflow-hidden">
                      <div className={'h-full rounded-full ' + (p >= 100 ? 'bg-success-500' : p >= 50 ? 'bg-gold-500' : 'bg-oweru-500')} style={{ width: p + '%' }} />
                    </div>
                    <div className="flex justify-between mt-2 text-sm font-semibold text-ink-700">
                      <span className="text-oweru-700">{(r.raised || 0).toLocaleString()}</span>
                      <span className="text-ink-500">{r.target ? r.target.toLocaleString() : '—'}</span>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2">
                    <button
                      onClick={() => openDD(r)}
                      className={'text-[11px] font-semibold rounded-full px-2.5 py-1 ' + dd.cls}
                      title={sw ? 'Uthibitisho wa Muombaji' : 'Applicant due-diligence'}
                    >
                      {sw ? 'Uhalali: ' : 'DD: '}{dd.text}
                    </button>
                    {r.letterPath ? (
                      <button
                        onClick={() => setLetterTarget(r)}
                        className={'text-[11px] font-semibold rounded-full px-2.5 py-1 ' + lt.cls}
                        title={sw ? 'Fungua barua / badilisha hali' : 'Open letter / change status'}
                      >
                        {sw ? 'Barua: ' : 'Letter: '}{lt.text}
                      </button>
                    ) : (
                      <span className="text-[11px] text-ink-400 px-2">—</span>
                    )}
                  </div>

                  <div className="mt-auto flex items-center gap-2">
                    {primary ? (
                      <button
                        onClick={() => askChangeStatus(r.id, primary)}
                        disabled={busyId === r.id}
                        className="btn-forest btn-sm flex-1"
                        title={sw ? 'Hatua inayofuata sahihi kwa hali hii' : 'The correct next step for this status'}
                      >
                        {busyId === r.id ? '...' : (NEXT_LABEL[primary]?.[sw ? 'sw' : 'en'] || primary)}
                      </button>
                    ) : (
                      <span className="flex-1 text-center text-[11px] text-ink-400 font-medium">{sw ? 'Imekamilika' : 'Completed'}</span>
                    )}
                    {(rest.length > 0 || canDecline) && (
                      <select
                        value=""
                        disabled={busyId === r.id}
                        onChange={(e) => { if (e.target.value === 'declined') setDeclineTarget(r); else askChangeStatus(r.id, e.target.value) }}
                        className={`${inputCls} px-2 text-xs`}
                        aria-label={sw ? 'Chagua hatua nyingine' : 'Choose another step'}
                      >
                        <option value="">{sw ? '⋯ Nyingine' : '⋯ More'}</option>
                        {rest.map((s) => (
                          <option key={s} value={s}>{statusLabel[s]?.[sw ? 'sw' : 'en'] || s}</option>
                        ))}
                        {canDecline && <option value="declined">{statusLabel.declined[sw ? 'sw' : 'en']}</option>}
                      </select>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
                    <span className="text-[11px] text-ink-400">
                      {r.org ? r.org : (r.applicantName || '')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        title={sw ? 'Hariri' : 'Edit'}
                        className="text-[11px] px-2 py-1 rounded-md text-oweru-700 hover:bg-gold-50 font-semibold"
                      >
                        {sw ? 'Hariri' : 'Edit'}
                      </button>
                      {canDecline && !['declined', 'closed'].includes(r.statusRaw) && (
                        <button
                          onClick={() => setDeclineTarget(r)}
                          title={sw ? 'Kataa (inahitaji sababu)' : 'Decline (requires reason)'}
                          className="text-[11px] px-2 py-1 rounded-md text-error-500 hover:bg-error-50 font-semibold"
                        >
                          {sw ? 'Kataa' : 'Reject'}
                        </button>
                      )}
                      <button
                        onClick={() => askDelete(r)}
                        disabled={busyId === `del-${r.id}`}
                        title={sw ? 'Futa' : 'Delete'}
                        className="text-[11px] px-2 py-1 rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-600 font-semibold disabled:opacity-40"
                      >
                        {busyId === `del-${r.id}` ? '...' : sw ? 'Futa' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <Pagination
          page={safePage}
          totalPages={totalPages}
          onChange={setPage}
          total={rowsFiltered.length}
          label={sw ? 'Maombi' : 'Requests'}
        />
        </>
      )}

      {editing && (
        <AdminEditModal
          title={sw ? 'Hariri Ombi' : 'Edit Request'}
          icon="file"
          form={editForm}
          setForm={setEditForm}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          busy={busyId === 'edit'}
          cancelLabel={sw ? 'Ghairi' : 'Cancel'}
          saveLabel={sw ? 'Hifadhi' : 'Save'}
          fields={[
            { key: 'title', label: sw ? 'Jina' : 'Title' },
            { key: 'sw_title', label: sw ? 'Jina (Kiswahili)' : 'Title (Swahili)' },
            { key: 'region', label: sw ? 'Mkoa' : 'Region' },
            { key: 'category', label: sw ? 'Kategoria' : 'Category' },
            { key: 'program_type', label: sw ? 'Aina ya Mpango' : 'Program Type' },
            { key: 'exposure_level', label: sw ? 'Uwazi' : 'Exposure' },
            { key: 'story', label: sw ? 'Hadithi' : 'Story', type: 'textarea' },
          ]}
        />
      )}

      {ddTarget && (
        <div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="panel w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-1">
              <div>
                <h3 className="text-lg font-bold text-ink-900">{sw ? 'Uthibitisho wa Muombaji' : 'Applicant Due-Diligence'}</h3>
                <p className="text-sm text-ink-500 mt-0.5">{ddTarget.applicantName || '—'} · {ddTarget.applicantVerification?.national_id_number || '—'}</p>
              </div>
              <button onClick={() => setDdTarget(null)} className="text-ink-500 hover:text-ink-700 text-xl leading-none">✕</button>
            </div>

            <div className="mt-4 space-y-2">
              {DD_STEPS.map((s, i) => (
                <label key={s.key} className="flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5 cursor-pointer hover:bg-ink-50">
                  <input
                    type="checkbox"
                    checked={!!ddSteps[s.key]}
                    onChange={() => toggleDD(s.key)}
                    className="w-4 h-4 accent-gold-600"
                  />
                  <span className="text-sm text-ink-700 font-medium">
                    {i + 1}. {sw ? s.sw : s.en}
                  </span>
                </label>
              ))}
            </div>

            <p className="mt-3 text-xs text-ink-500">
              {sw ? 'Muombaji lazima aonekane kuwa amesajiliwa (KYC) kabla ombi lake la kuidhinishwa na kuchapishwa.' : 'All 5 steps must be checked to Verify. Verified status is required before approval.'}
            </p>

            <div className="mt-4">
              <label className="block text-sm font-medium text-ink-700 mb-1.5">
                {sw ? 'Sababu (hiari)' : 'Reason (optional)'}
              </label>
              <textarea
                value={ddReason}
                onChange={(e) => setDdReason(e.target.value)}
                placeholder={sw ? 'Eleza...' : 'Explain...'}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                onClick={() => submitDD('verified')}
                disabled={ddBusy}
                className="btn-forest btn-sm"
              >
                {ddBusy ? '...' : sw ? 'Thibitisha' : 'Verify'}
              </button>
              <button
                onClick={() => submitDD('rejected')}
                disabled={ddBusy}
                className="btn-danger btn-sm"
              >
                {ddBusy ? '...' : sw ? 'Kataa' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {letterTarget && (
        <div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="panel w-full max-w-lg p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-ink-900">{sw ? 'Hali ya Barua' : 'Letter Status'}</h3>
                <p className="text-sm text-ink-500 mt-0.5">{letterTarget.title}</p>
              </div>
              <button onClick={() => setLetterTarget(null)} className="text-ink-500 hover:text-ink-700 text-xl leading-none">✕</button>
            </div>

            {letterTarget.letterPath && (
              <button
                onClick={() => openLetter(letterTarget.id).catch((e) => toast(e?.message || String(e), 'error'))}
                className="mt-4 w-full text-sm font-semibold text-oweru-700 bg-gold-50 border border-gold-200 rounded-lg px-4 py-2.5 hover:bg-gold-100"
              >
                {sw ? 'Fungua Barua' : 'Open Letter'}
              </button>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-ink-700 mb-1.5">
                {sw ? 'Sababu (kwa kukataa)' : 'Reason (for rejection)'}
              </label>
              <textarea
                value={letterReason}
                onChange={(e) => setLetterReason(e.target.value)}
                placeholder={sw ? 'Eleza sababu ya kukataa barua...' : 'Explain reason to reject letter...'}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button onClick={() => setLetterTarget(null)} className="px-4 py-2 rounded-lg border border-ink-300 text-ink-700 text-sm font-semibold hover:bg-ink-50">
                {sw ? 'Ghairi' : 'Cancel'}
              </button>
              <button
                onClick={() => submitLetter('approved')}
                disabled={letterBusy}
                className="btn-forest btn-sm"
              >
                {letterBusy ? '...' : sw ? 'Idhinisha' : 'Approve'}
              </button>
              <button
                onClick={() => submitLetter('rejected')}
                disabled={letterBusy}
                className="btn-danger btn-sm"
              >
                {letterBusy ? '...' : sw ? 'Kataa' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {declineTarget && (
        <div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="panel w-full max-w-lg p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-ink-900">{sw ? 'Kataa Ombi' : 'Decline Request'}</h3>
                <p className="text-sm text-ink-500 mt-0.5">{declineTarget.title}</p>
              </div>
              <button onClick={() => setDeclineTarget(null)} className="text-ink-500 hover:text-ink-700 text-xl leading-none">✕</button>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-ink-700 mb-1.5">
                {sw ? 'Sababu ya Kukataa (lazima)' : 'Reason for Decline (required)'}
              </label>
              <textarea
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
                placeholder={sw ? 'Eleza kwa nini ombi limekataliwa...' : 'Explain why this request is declined...'}
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button onClick={() => setDeclineTarget(null)} className="px-4 py-2 rounded-lg border border-ink-300 text-ink-700 text-sm font-semibold hover:bg-ink-50">
                {sw ? 'Ghairi' : 'Cancel'}
              </button>
              <button
                onClick={submitDecline}
                disabled={declineBusy}
                className="btn-danger btn-sm"
              >
                {declineBusy ? '...' : sw ? 'Kataa Ombi' : 'Decline Request'}
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
        busy={confirmBusy}
        onConfirm={confirm?.onConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}

const STATUS_ORDER = [
  'draft',
  'endorsement_pending',
  'submitted',
  'under_review',
  'more_info_needed',
  'approved',
  'declined',
  'published',
  'funding_closed',
  'procurement',
  'delivered',
  'active_reporting',
  'closed',
]