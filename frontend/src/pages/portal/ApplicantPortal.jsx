import { useState, useEffect } from 'react'
import { useAuth } from '../../auth'
import { useI18n } from '../../i18n'
import { fetchMyRequests, storeRequest, getToken, openLetter, fetchEquipment, fetchReports, createReport, fetchVerificationMine, submitVerification, openReportEvidence, fetchOrganizations } from '../../api'
import { onStatsChange } from '../../statsBus'
import StatusBadge from '../admin/StatusBadge'
import { PortalHero, StatCard, SectionTitle, EmptyState, Icon, CountUp } from '../../components/PortalUi'
import { Donut, Legend } from '../../components/Charts'
import { inputCls, Field, Select, TextArea } from '../../components/FormField'
import { SimplePageSkeleton } from '../../components/LoadingSpinner'

const inputSm =
  'w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-[13px] text-ink-900 outline-none transition-all duration-200 placeholder:text-ink-500 hover:border-oweru-500 focus:border-oweru-600 focus:ring-2 focus:ring-oweru-100 disabled:bg-ink-100 disabled:text-ink-500 disabled:cursor-not-allowed'

const TZ_REGIONS = [
  'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi', 'Kigoma',
  'Kilimanjaro', 'Lindi', 'Manyara', 'Mara', 'Mbeya', 'Morogoro', 'Mtwara', 'Mwanza',
  'Njombe', 'Pemba Kaskazini', 'Pemba Kusini', 'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga',
  'Simiyu', 'Singida', 'Songwe', 'Tabora', 'Tanga', 'Unguja Kaskazini', 'Unguja Kusini',
  'Unguja Mjini Magharibi',
]

const PROGRAM_TYPES = [
  { v: 'general', en: 'General', sw: 'Wa jumla' },
  { v: 'church_equipment', en: 'Church equipment', sw: 'Vifaa vya kanisa' },
  { v: 'orphan_support', en: 'Orphan support', sw: 'Msaada wa yatima' },
  { v: 'charity', en: 'Charity / outreach', sw: 'Hisani / uinjilisti' },
  { v: 'transport', en: 'Transport', sw: 'Usafiri' },
]

const CATEGORIES = ['Sound Equipment', 'Power / Energy', 'Printing & Materials', 'Shelter', 'Transport', 'Medical Equipment', 'Other']

export default function ApplicantPortal() {
  const { user, logout } = useAuth()
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const [tab, setTab] = useState('dashboard')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [orgs, setOrgs] = useState([])
  const [form, setForm] = useState({
    title: '',
    region: '',
    district: '',
    church: '',
    churchName: '',
    phone: '',
    email: '',
    story: '',
    category: CATEGORIES[0],
    programType: 'general',
    exposure: 'open',
    itemName: '',
    targetAmount: '',
  })
  const [letter, setLetter] = useState(null)
  const [letterName, setLetterName] = useState('')
  const [formMsg, setFormMsg] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [privacy, setPrivacy] = useState({ shareReports: true, shareIdentity: false, emailAlerts: true })
  const [privacyMsg, setPrivacyMsg] = useState(null)
  const [equipment, setEquipment] = useState([])
  const [myReports, setMyReports] = useState([])
  const [repItem, setRepItem] = useState('')
  const [repText, setRepText] = useState('')
  const [repSerial, setRepSerial] = useState('')
  const [repType, setRepType] = useState('30_day')
  const [repMsg, setRepMsg] = useState(null)
  const [repBusy, setRepBusy] = useState(false)
  const [repEvidence, setRepEvidence] = useState(null)
  const [repEvidenceName, setRepEvidenceName] = useState('')
  const [myVer, setMyVer] = useState(null)
  const [verForm, setVerForm] = useState({ nationalId: '', phone: '', region: '', location: '' })
  const [verFile, setVerFile] = useState(null)
  const [verName, setVerName] = useState('')
  const [verMsg, setVerMsg] = useState(null)
  const [verBusy, setVerBusy] = useState(false)
  const [flashMsg, setFlashMsg] = useState(null)

  const openDoc = (fn, label) => {
    fn().catch((e) => setFlashMsg(sw ? `${label} haikufunguka: ${e?.message || 'kosa'}` : `${label} could not open: ${e?.message || 'error'}`))
  }

  useEffect(() => {
    if (!getToken()) return
    fetchVerificationMine()
      .then((v) => {
        if (!v) return
        setMyVer(v)
        setVerForm({
          nationalId: v.national_id_number || '',
          phone: v.phone || '',
          region: v.region || '',
          location: v.location || '',
        })
      })
      .catch(() => {})
    fetchOrganizations()
      .then((list) => setOrgs(list))
      .catch(() => setOrgs([]))
  }, [])

  const setVF = (k) => (e) => {
    setVerForm((f) => ({ ...f, [k]: e.target.value }))
    if (verMsg) setVerMsg(null)
  }

  const handleVerFile = (file) => {
    if (!file) { setVerFile(null); setVerName(''); return }
    if (file.size > 8 * 1024 * 1024) {
      setVerMsg({ ok: false, text: sw ? 'Faili ni kubwa sana (max 8MB).' : 'File too large (max 8MB).' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setVerFile(reader.result)
      setVerName(file.name)
      if (verMsg) setVerMsg(null)
    }
    reader.readAsDataURL(file)
  }

  const handleRepEvidence = (file) => {
    if (!file) { setRepEvidence(null); setRepEvidenceName(''); return }
    if (file.size > 8 * 1024 * 1024) {
      setRepMsg({ ok: false, text: sw ? 'Faili ni kubwa sana (max 8MB).' : 'File too large (max 8MB).' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setRepEvidence(reader.result)
      setRepEvidenceName(file.name)
      if (repMsg) setRepMsg(null)
    }
    reader.readAsDataURL(file)
  }

  const submitVerificationForm = async (e) => {
    e.preventDefault()
    if (!getToken()) {
      setVerMsg({ ok: false, text: sw ? 'Ingia kwanza.' : 'Please sign in first.' })
      return
    }
    setVerBusy(true)
    setVerMsg(null)
    try {
      const payload = {
        national_id_number: verForm.nationalId,
        phone: verForm.phone,
        region: verForm.region,
        location: verForm.location,
      }
      if (verFile) payload.document = { data: verFile, name: verName || 'national_id.pdf' }
      const fresh = await submitVerification(payload)
      setMyVer(fresh)
      setVerMsg({ ok: true, text: sw ? 'Taarifa za uthibitisho zimewasilishwa. Msimamizi atazikagua.' : 'Verification submitted. The admin will review it.' })
    } catch (err) {
      setVerMsg({ ok: false, text: err.message })
    } finally {
      setVerBusy(false)
    }
  }

  useEffect(() => {
    let alive = true
    Promise.all([
      fetchMyRequests().catch(() => []),
    ])
      .then(([r]) => {
        if (!alive) return
        setRows(r)
      })
      .finally(() => alive && setLoading(false))
    const off = onStatsChange(() => {
      fetchMyRequests().then(setRows).catch(() => [])
    })
    return () => { alive = false; off() }
  }, [])

  useEffect(() => {
    if (!getToken()) return
    const load = () => {
      fetchEquipment().then(setEquipment).catch(() => setEquipment([]))
      fetchReports().then(setMyReports).catch(() => setMyReports([]))
    }
    load()
    const off = onStatsChange(load)
    return off
  }, [])

  const setF = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (formMsg) setFormMsg(null)
  }

  const handleLetterFile = (file) => {
    if (!file) { setLetter(null); setLetterName(''); return }
    if (file.size > 8 * 1024 * 1024) {
      setFormMsg({ ok: false, text: sw ? 'Barua ni kubwa sana (max 8MB).' : 'Letter file too large (max 8MB).' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setLetter(reader.result)
      setLetterName(file.name)
      if (formMsg) setFormMsg(null)
    }
    reader.readAsDataURL(file)
  }

  const submitNewRequest = async (e) => {
    e.preventDefault()
    if (!getToken()) {
      setFormMsg({
        ok: false,
        text: sw
          ? 'Kutuma ombi, ingia kwa akaunti halisi ya muombaji (neema@matumaini.org) au jisajili. Kidemo hakijikubali kutuma.'
          : 'To submit, sign in with the real applicant account (neema@matumaini.org) or register. The demo shortcut cannot submit.',
      })
      return
    }
    setSubmitting(true)
    setFormMsg(null)
    try {
      const org = orgs.find((o) => String(o.id) === String(form.church))
      const resolvedChurch = form.church === '__other__' ? form.churchName.trim() : (org?.name || '')

      await storeRequest({
        title: form.title,
        sw_title: '',
        region: form.region,
        church_name: resolvedChurch || undefined,
        category: form.category,
        program_type: form.programType,
        exposure_level: form.exposure,
        story: form.story,
        organization_id: org ? String(org.id) : undefined,
        applicant_phone: form.phone || undefined,
        applicant_email: form.email || undefined,
        letter: letter || undefined,
        items: [
          {
            name: form.title,
            description: form.story,
            category: form.category,
            item_kind: 'item',
            target_amount: Number(form.targetAmount),
          },
        ],
      })
      setFormMsg({ ok: true, text: sw ? 'Ombi lako limetumwa kwa mafanikio.' : 'Your request was submitted successfully.' })
      setForm({ title: '', region: '', district: '', church: '', churchName: '', phone: '', email: '', story: '', category: CATEGORIES[0], programType: 'general', exposure: form.exposure, itemName: '', targetAmount: '' })
      setLetter(null)
      setLetterName('')
      const fresh = await fetchMyRequests()
      setRows(fresh)
    } catch (err) {
      setFormMsg({ ok: false, text: err.message || 'Imeshindikana. Jaribu tena.' })
    } finally {
      setSubmitting(false)
    }
  }

  const nav = [
    ['dashboard', sw ? 'Jopo' : 'Dashboard', 'home'],
    ['new-request', sw ? 'Ombi Jipya' : 'New Request', 'plus'],
    ['my-requests', sw ? 'Maombi Yangu' : 'My Requests', 'list'],
    ['documents', sw ? 'Barua ya Muhuri' : 'Stamped Letter', 'file'],
    ['verification', sw ? 'Utambulisho' : 'Identity', 'shield'],
    ['reports', sw ? 'Ripoti' : 'Reports', 'docs'],
    ['privacy', sw ? 'Mipangilio ya Faragha' : 'Privacy Settings', 'lock'],
    ['notifications', sw ? 'Arifa' : 'Notifications', 'bell'],
  ]

  const myAll = rows
  const my = rows.slice(0, 2)

  const statusGroups = [
    { keys: ['draft', 'submitted', 'endorsement_pending', 'under_review', 'more_info_needed'], label: sw ? 'Yanasubiri' : 'In review', color: 'var(--color-warning-500)' },
    { keys: ['approved', 'published'], label: sw ? 'Yameidhinishwa' : 'Approved', color: 'var(--color-success-500)' },
    { keys: ['funding_closed', 'procurement'], label: sw ? 'Yamefadhiliwa' : 'Funded', color: 'var(--color-success-600)' },
    { keys: ['delivered', 'active_reporting', 'closed'], label: sw ? 'Yamekamilika' : 'Delivered', color: 'var(--color-ink-700)' },
    { keys: ['declined'], label: sw ? 'Yamekataliwa' : 'Declined', color: 'var(--color-error-500)' },
  ]
  const requestDonut = statusGroups.map((g) => ({
    label: g.label,
    color: g.color,
    value: myAll.filter((r) => g.keys.includes(r.statusRaw)).length,
  }))

  const submitReport = async (e, type) => {
    e.preventDefault()
    setRepMsg(null)
    if (!repItem) {
      setRepMsg({ ok: false, text: sw ? 'Chagua kifaa kwanza.' : 'Select an item first.' })
      return
    }
    setRepBusy(true)
    try {
      await createReport({ item_id: Number(repItem), type, content: repText || repSerial, evidence: repEvidence || undefined })
      setRepMsg({ ok: true, text: sw ? 'Ripoti imetumwa kwa mafanikio.' : 'Report submitted successfully.' })
      setRepText(''); setRepSerial(''); setRepItem(''); setRepEvidence(null); setRepEvidenceName('')
    } catch (err) {
      setRepMsg({ ok: false, text: err.message })
    } finally {
      setRepBusy(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <aside className="hidden h-full w-64 shrink-0 flex-col bg-oweru-950 md:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <img src="/oweru-logo.png" alt="OWERU" className="h-9 w-auto object-contain" />
          <div className="leading-tight">
            <p className="font-display text-[0.9375rem] font-semibold text-white">{sw ? 'Portali ya Muombaji' : 'Applicant Portal'}</p>
            <p className="text-[0.6875rem] text-oweru-100/70">{sw ? 'Maombi na ufuatiliaji' : 'Requests & tracking'}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {nav.map(([k, label, ico]) => {
            const active = tab === k
            return (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                aria-current={active ? 'page' : undefined}
                className={'group relative flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm font-medium transition-colors ' + (active ? 'bg-oweru-800 text-white' : 'text-oweru-100/70 hover:bg-white/5 hover:text-white')}
              >
                {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-gold-500" aria-hidden="true" />}
                <Icon name={ico} className={'h-4 w-4 shrink-0 ' + (active ? 'text-gold-300' : 'text-oweru-100/50 group-hover:text-oweru-100')} />
                <span className="truncate">{label}</span>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-500 text-sm font-bold text-oweru-950">
              {((user?.name || '?').trim().charAt(0) || '?').toUpperCase()}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[0.8125rem] font-semibold text-white">{user?.name}</p>
              <p className="truncate text-[0.6875rem] text-oweru-100/70">
                {user?.role === 'applicant' ? (sw ? 'Muombaji' : 'Applicant') : user?.role}
              </p>
            </div>
          </div>
          <button type="button" onClick={logout} className="btn-on-dark btn-sm mt-3 w-full">
            <Icon name="logout" className="h-4 w-4" />
            {sw ? 'Ondoka' : 'Log out'}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-20 border-b border-ink-200 bg-surface/95 backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <img src="/oweru-logo.png" alt="OWERU" className="h-8 w-auto object-contain" />
              <p className="font-display text-[0.9375rem] font-semibold text-ink-900">{sw ? 'Muombaji' : 'Applicant'}</p>
            </div>
            <button type="button" onClick={logout} className="btn-secondary btn-sm">
              <Icon name="logout" className="h-4 w-4" />
              {sw ? 'Ondoka' : 'Log out'}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 pb-3">
            {nav.map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={'shrink-0 rounded-full px-3.5 py-1.5 text-[0.8125rem] font-semibold transition-colors ' + (tab === k ? 'bg-oweru-700 text-white' : 'border border-ink-200 bg-white text-ink-600')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
          {flashMsg && (
            <div className="mb-5 flex items-start justify-between gap-3 rounded-[14px] border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
              <span className="flex items-start gap-2">
                <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                {flashMsg}
              </span>
              <button type="button" onClick={() => setFlashMsg(null)} aria-label={sw ? 'Funga' : 'Dismiss'} className="shrink-0">
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
          )}

        {tab === 'dashboard' && (
          <div>
            <PortalHero
              icon="home"
              eyebrow={sw ? 'Muombaji' : 'Applicant'}
              title={sw ? 'Karibu, ' + (user?.name || '') : 'Welcome back, ' + (user?.name || '')}
              actions={
                <>
                  <button type="button" onClick={() => setTab('new-request')} className="btn-primary">
                    <Icon name="plus" className="h-4 w-4" />
                    {sw ? 'Ombi Jipya' : 'New Request'}
                  </button>
                  <button type="button" onClick={() => setTab('documents')} className="btn-secondary">
                    <Icon name="file" className="h-4 w-4" />
                    {sw ? 'Barua ya Muhuri' : 'Stamped Letter'}
                  </button>
                </>
              }
            />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard icon="list" label={sw ? 'Maombi yangu' : 'My requests'} value={myAll.length} tone="oweru" />
              <StatCard
                icon="clock"
                label={sw ? 'Yanayoendelea' : 'In progress'}
                value={myAll.filter((r) => r.statusRaw && (r.statusRaw === 'submitted' || r.statusRaw === 'under_review' || r.statusRaw === 'more_info_needed' || r.statusRaw === 'draft')).length}
                tone="gold"
              />
              <StatCard
                icon="check"
                label={sw ? 'Yameidhinishwa' : 'Approved'}
                value={myAll.filter((r) => r.statusRaw && r.statusRaw === 'approved').length}
                tone="green"
              />
              <StatCard icon="shield" label={sw ? 'Vifaa vyangu vimefadhiliwa' : 'My items funded'} value={(myAll || []).flatMap((r) => r.items || []).filter((i) => i.status === 'fully-funded').length} tone="ink" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="card-base p-5 md:p-6">
                <div>
                  <span className="eyebrow">{sw ? 'Muhtasari' : 'Overview'}</span>
                  <h2 className="mt-3 text-lg text-ink-900">{sw ? 'Maombi kwa hali' : 'Requests by status'}</h2>
                </div>
                {requestDonut.some((d) => d.value > 0) ? (
                  <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:gap-6">
                    <Donut data={requestDonut} center={<span className="text-xl font-semibold text-ink-900">{myAll.length}</span>} />
                    <Legend items={requestDonut.filter((d) => d.value > 0)} />
                  </div>
                ) : (
                  <div className="empty-state mt-4 py-10 text-center text-sm text-ink-500">
                    {sw ? 'Hakuna maombi bado.' : 'No requests yet.'}
                  </div>
                )}
              </div>

              <div className="card-base p-5 md:p-6">
                <div>
                  <span className="eyebrow">{sw ? 'Ufuatiliaji' : 'Delivery'}</span>
                  <h2 className="mt-3 text-lg text-ink-900">{sw ? 'Vifaa na Ripoti' : 'Items & Reports'}</h2>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { v: (myAll || []).flatMap((r) => r.items || []).length, l: sw ? 'Vifaa vyote' : 'All items', cls: 'text-oweru-700' },
                    { v: (myAll || []).flatMap((r) => r.items || []).filter((i) => i.status === 'fully-funded').length, l: sw ? 'Vimefadhiliwa' : 'Funded', cls: 'text-success-700' },
                    { v: myReports.filter((r) => r.status === 'upcoming').length, l: sw ? 'Ripoti zinazosubiri' : 'Reports upcoming', cls: 'text-gold-800' },
                    { v: myReports.filter((r) => r.status === 'overdue').length, l: sw ? 'Zimechelewa' : 'Overdue', cls: 'text-error-700' },
                  ].map((s) => (
                    <div key={s.l} className="rounded-[10px] border border-ink-200 bg-paper p-4 text-center">
                      <div className={'text-2xl font-semibold tabular-nums ' + s.cls}>{s.v}</div>
                      <div className="mt-0.5 text-xs text-ink-500">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {myAll.length > 0 ? (
              <div className="card-base mt-6 overflow-hidden">
                <div className="px-5 pt-5 md:px-6">
                  <SectionTitle
                    title={sw ? 'Maombi ya Hivi Karibuni' : 'Recent requests'}
                    action={
                      <button type="button" onClick={() => setTab('my-requests')} className="text-sm font-semibold text-oweru-700 hover:text-oweru-900">
                        {sw ? 'Yote' : 'View all'}
                      </button>
                    }
                  />
                </div>
                <div className="divide-y divide-ink-200">
                  {myAll.slice(0, 4).map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-paper md:px-6">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-ink-900">{r.title}</div>
                        <div className="text-sm text-ink-500">{r.region} · <b className="font-semibold text-gold-800"><CountUp value={r.target} prefix="TZS " /></b></div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  icon="box"
                  title={sw ? 'Bado hujatuma ombi' : 'No requests yet'}
                  sub={sw ? 'Anza ombi lako la kwanza sasa.' : 'Start your first request now.'}
                  action={
                    <button type="button" onClick={() => setTab('new-request')} className="btn-primary">
                      <Icon name="plus" className="h-4 w-4" />
                      {sw ? 'Tuma Ombi' : 'New Request'}
                    </button>
                  }
                />
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { k: 'new-request', ico: 'file', t: sw ? 'Ombi Jipya' : 'New Request', s: sw ? 'Wasilisha ombi mpya' : 'Submit a new request' },
                { k: 'documents', ico: 'shield', t: sw ? 'Barua ya Muhuri' : 'Stamped Letter', s: sw ? 'Barua na muhuri wa kanisa' : 'Upload your church letter' },
                { k: 'reports', ico: 'docs', t: sw ? 'Ripoti' : 'Reports', s: sw ? 'Thibitisha kupokea vifaa' : 'Confirm delivery of items' },
              ].map((c) => (
                <button
                  key={c.k}
                  type="button"
                  onClick={() => setTab(c.k)}
                  className="card-base group p-5 text-left transition-colors hover:border-oweru-300"
                >
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-[10px] bg-oweru-50 text-oweru-700 transition-colors group-hover:bg-oweru-100">
                    <Icon name={c.ico} className="h-5 w-5" />
                  </span>
                  <div className="font-semibold text-ink-900 group-hover:text-oweru-800">{c.t}</div>
                  <div className="mt-0.5 text-sm text-ink-500">{c.s}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'new-request' && (
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-5">
              <span className="eyebrow">{sw ? 'Ombi mpya' : 'New request'}</span>
              <h1 className="display-md mt-3">{sw ? 'Ombi Jipya' : 'New Request'}</h1>
              <p className="mt-2 text-sm text-ink-600">
                {sw
                  ? 'Jaza taarifa zilizo hapa chini. Kila kifaa kina lengo lake, na huhitajiki kulipa pesa mkononi.'
                  : 'Fill in the details below. Every item has its own target, and nothing is paid out in cash.'}
              </p>
            </div>

            <div className="card-base p-5 md:p-6">
              <form onSubmit={submitNewRequest} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Field label={sw ? 'Aina ya kifaa' : 'Equipment'} required>
                  <Select value={form.category} onChange={setF('category')} className={inputSm}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </Select>
                </Field>
                <Field label={sw ? 'Aina ya mpango' : 'Program'} required>
                  <Select value={form.programType} onChange={setF('programType')} className={inputSm}>
                    {PROGRAM_TYPES.map((p) => (
                      <option key={p.v} value={p.v}>{sw ? p.sw : p.en}</option>
                    ))}
                  </Select>
                </Field>
                <Field label={sw ? 'Kanisa / Shirika' : 'Church / Organization'} required>
                  <Select value={form.church} onChange={setF('church')} required className={inputSm}>
                    <option value="" disabled>{sw ? '— Chagua kanisa —' : '— Select church —'}</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={String(o.id)}>
                        {o.name}{o.region ? ` · ${o.region}` : ''}{o.verification_status === 'pending' ? (sw ? ' (inangoja idhini ya OWERU)' : ' (awaiting OWERU approval)') : ''}
                      </option>
                    ))}
                    <option value="__other__">{sw ? 'Kanisa nyingine' : 'Other church'}</option>
                  </Select>
                </Field>

                <Field label={sw ? 'Jina la ombi' : 'Request title'} required>
                  <input value={form.title} onChange={setF('title')} required className={inputSm} placeholder={sw ? 'Kifaa cha sauti' : 'Ultrasound Scanner'} />
                </Field>
                <Field label={sw ? 'Wilaya / Manispaa' : 'District'} required>
                  <input value={form.district} onChange={setF('district')} required className={inputSm} placeholder="Morogoro Mjini" />
                </Field>
                <Field label={sw ? 'Namba ya simu' : 'Phone'} required>
                  <input type="tel" value={form.phone} onChange={setF('phone')} required className={inputSm} placeholder="+255 712 345 678" />
                </Field>

                <Field label={sw ? 'Lengo (TZS)' : 'Amount (TZS)'} required>
                  <input type="number" min="1" step="any" value={form.targetAmount} onChange={setF('targetAmount')} required className={inputSm} placeholder="5000000" />
                </Field>
                <Field label={sw ? 'Mkoa' : 'Region'} required>
                  <Select value={form.region} onChange={setF('region')} required className={inputSm}>
                    <option value="" disabled>{sw ? '— Chagua mkoa —' : '— Select region —'}</option>
                    {TZ_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </Select>
                </Field>
                <Field label={sw ? 'Barua pepe' : 'Church email'} required>
                  <input type="email" value={form.email} onChange={setF('email')} required className={inputSm} placeholder={user?.email || 'kanisa@mfano.co.tz'} />
                </Field>

                {form.church === '__other__' && (
                  <Field label={sw ? 'Jina la kanisa' : 'Church name'} required className="sm:col-span-2 xl:col-span-3">
                    <input value={form.churchName} onChange={setF('churchName')} required className={inputSm} placeholder={sw ? 'Kanisa la Upendo Mwanza' : 'Imani Community Church, Dodoma'} />
                  </Field>
                )}

                <div className="grid grid-cols-1 gap-3 sm:col-span-2 md:grid-cols-2 xl:col-span-3">
                  <Field label={sw ? 'Maelezo ya ombi' : 'Story / description'} required>
                    <TextArea rows={2} value={form.story} onChange={setF('story')} required className={inputSm} placeholder={sw ? 'Eleza kwa kifupi umuhimu wa ombi hili...' : 'Briefly explain why this request matters...'} />
                  </Field>
                  <Field label={sw ? 'Barua ya muhuri wa kanisa' : 'Church letter (official stamp)'} required>
                    <label className="group flex w-full cursor-pointer items-center gap-3 rounded-[10px] border border-dashed border-ink-300 bg-paper px-3.5 py-2.5 text-center transition hover:border-oweru-400 hover:bg-oweru-50">
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        onChange={(e) => handleLetterFile(e.target.files[0])}
                        className="hidden"
                      />
                      {letterName ? (
                        <>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-700"><Icon name="check" className="h-4 w-4" /></span>
                          <span className="truncate text-[13px] font-semibold text-success-700">{letterName}</span>
                        </>
                      ) : (
                        <>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-oweru-700 ring-1 ring-ink-200"><Icon name="upload" className="h-4 w-4" /></span>
                          <span className="text-[13px] font-semibold text-ink-700">{sw ? 'Chagua barua...' : 'Choose letter...'}</span>
                        </>
                      )}
                      <span className="ml-auto shrink-0 text-[11px] text-ink-500">PDF/JPG · 8MB</span>
                    </label>
                  </Field>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-ink-200 bg-paper px-4 py-3 sm:col-span-2 xl:col-span-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-ink-700">{sw ? 'Uwazi:' : 'Privacy:'}</span>
                    <div className="inline-flex rounded-lg border border-ink-200 bg-white p-0.5">
                      {[
                        { v: 'open', l: sw ? 'Wazi' : 'Open' },
                        { v: 'partial', l: sw ? 'Sehemu' : 'Partial' },
                        { v: 'protected', l: sw ? 'Faragha' : 'Protected' },
                      ].map((o) => (
                        <label
                          key={o.v}
                          className="cursor-pointer rounded-md px-3 py-1 text-[13px] font-semibold transition-colors has-[:checked]:bg-oweru-700 has-[:checked]:text-white"
                        >
                          <input
                            type="radio"
                            name="portal-exposure"
                            value={o.v}
                            checked={form.exposure === o.v}
                            onChange={() => setForm((f) => ({ ...f, exposure: o.v }))}
                            className="sr-only"
                          />
                          <span className="grid place-items-center text-ink-700 transition-colors has-[:checked]:text-white">{o.l}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="9" opacity="0.25" />
                          <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
                        </svg>
                        {sw ? 'Inatuma...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        {sw ? 'Tuma Ombi' : 'Submit Request'}
                        <Icon name="arrow" className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                {formMsg && (
                  <div className={'flex items-center gap-2 rounded-[10px] px-4 py-3 text-[13px] sm:col-span-2 xl:col-span-3 ' + (formMsg.ok ? 'border border-success-200 bg-success-50 text-success-700' : 'border border-error-200 bg-error-50 text-error-700')}>
                    <Icon name={formMsg.ok ? 'check' : 'alert'} className="h-4 w-4 shrink-0" />
                    {formMsg.text}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {tab === 'my-requests' && (
          <div>
            <div className="mb-5">
              <span className="eyebrow">{sw ? 'Maombi' : 'Requests'}</span>
              <h1 className="display-md mt-3">{sw ? 'Maombi Yangu' : 'My Requests'}</h1>
            </div>
            <div className="card-base overflow-hidden">
              {loading ? (
                <SimplePageSkeleton message={sw ? 'Inapakia...' : 'Loading...'} />
              ) : my.length === 0 ? (
                <EmptyState icon="list" title={sw ? 'Hakuna maombi.' : 'No requests.'}
                  sub={sw ? 'Maombi yaliyowasilishwa yataonekana hapa.' : 'Requests you submit will appear here.'}
                  action={<button type="button" onClick={() => setTab('new-request')} className="btn-primary">{sw ? 'Ombi Jipya' : 'New Request'}</button>} />
              ) : (
                <div className="divide-y divide-ink-200">
                  {my.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-ink-900">{r.title}</div>
                        <div className="text-sm text-ink-500">{r.region} · <b className="font-semibold text-gold-800"><CountUp value={r.target} prefix="TZS " /></b></div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'documents' && (
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-5">
              <span className="eyebrow">{sw ? 'Nyaraka' : 'Documents'}</span>
              <h1 className="display-md mt-3">{sw ? 'Barua ya Muhuri wa Kanisa' : 'Church Stamped Letter'}</h1>
              <p className="mt-2 text-sm text-ink-600">
                {sw
                  ? 'Barua yenye muhuri rasmi wa kanisa ndiyo uthibitisho wa uhalali wa ombi lako. Msimamizi ataiangalia na kuidhinisha.'
                  : 'A letter bearing the official church stamp verifies your request. The admin will review and approve it.'}
              </p>
            </div>

            {myAll.length === 0 ? (
              <EmptyState icon="file" title={sw ? 'Bado hujaweka barua.' : 'No stamped letter yet.'}
                sub={sw ? 'Barua inayoandikwa wakati wa kuwasilisha ombi.' : 'You upload your letter when you submit a request.'} />
            ) : (
              <div className="card-base overflow-hidden">
                <div className="divide-y divide-ink-200">
                  {myAll.map((r) => {
                    const st = r.letterStatus || 'missing'
                    const badge = st === 'approved' ? 'status-badge-success'
                      : st === 'pending' || st === 'submitted' ? 'status-badge-warning'
                      : st === 'rejected' ? 'status-badge-error'
                      : 'status-badge-neutral'
                    const label = st === 'approved' ? (sw ? 'Imeidhinishwa' : 'Approved')
                      : st === 'pending' || st === 'submitted' ? (sw ? 'Inasubiri kukaguliwa' : 'Pending review')
                      : st === 'rejected' ? (sw ? 'Imekataliwa' : 'Rejected')
                      : (sw ? 'Haijapakiwa' : 'Not uploaded')
                    return (
                      <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-4">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-ink-900">{r.title}</div>
                          <div className="text-sm text-ink-500">{r.churchName ? r.churchName + ' · ' : ''}{r.region || '—'}</div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          {r.letterPath && (
                            <button type="button" onClick={() => openDoc(() => openLetter(r.id), sw ? 'Barua' : 'Letter')} className="btn-secondary btn-sm">
                              <Icon name="eye" className="h-4 w-4" />
                              {sw ? 'Fungua' : 'View'}
                            </button>
                          )}
                          <span className={'status-badge ' + badge}>{label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-start gap-2.5 rounded-[14px] border border-ink-200 bg-surface px-4 py-3.5 text-sm text-ink-600">
              <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
              <span>
                {sw
                  ? 'Barua lazima iwe na muhuri rasmi wa kanisa na sahihi. PDF au picha (JPG/PNG/WebP), ukubwa hadi 8MB.'
                  : 'The letter must bear the church official stamp and signature. PDF or image (JPG/PNG/WebP), up to 8MB.'}
              </span>
            </div>
          </div>
        )}

        {tab === 'verification' && (
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-5">
              <span className="eyebrow">{sw ? 'Uthibitisho' : 'Due diligence'}</span>
              <h1 className="display-md mt-3">{sw ? 'Uthibitisho wa Utambulisho' : 'Identity Verification'}</h1>
              <p className="mt-2 text-sm text-ink-600">
                {sw
                  ? 'Kamilisha hatua hizi ili ombi lako liweze kuidhinishwa na kuchapishwa.'
                  : 'Complete these steps so your request can be approved and published.'}
              </p>
            </div>

            {myVer?.status === 'verified' && (
              <div className="mb-4 flex items-center gap-2 rounded-[14px] border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700">
                <Icon name="check" className="h-4 w-4 shrink-0" />
                {sw ? 'Akaunti yako imehakikiwa. Unaweza kuendelea.' : 'Your account is verified. You are all set.'}
              </div>
            )}
            {myVer?.status === 'rejected' && (
              <div className="mb-4 flex items-start gap-2 rounded-[14px] border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
                <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                {sw ? 'Uthibitisho wako ulikataliwa. Sahihisha taarifa na utume tena.' : 'Your verification was rejected. Correct the details and resubmit.'}
              </div>
            )}

            {verMsg && (
              <div className={'mb-4 flex items-center gap-2 rounded-[14px] border px-4 py-3 text-sm ' + (verMsg.ok ? 'border-success-200 bg-success-50 text-success-700' : 'border-error-200 bg-error-50 text-error-700')}>
                <Icon name={verMsg.ok ? 'check' : 'alert'} className="h-4 w-4 shrink-0" />
                {verMsg.text}
              </div>
            )}

            <div className="card-base p-5 md:p-6">
              <form onSubmit={submitVerificationForm} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={sw ? 'Nambari ya Kitambulisho' : 'National ID number'} required>
                    <input value={verForm.nationalId} onChange={setVF('nationalId')} required className={inputCls} placeholder="TZ-00000000" />
                  </Field>
                  <Field label={sw ? 'Namba ya simu' : 'Phone number'} required>
                    <input value={verForm.phone} onChange={setVF('phone')} required className={inputCls} placeholder="07XX XXX XXX" />
                  </Field>
                  <Field label={sw ? 'Mkoa' : 'Region'} required>
                    <input value={verForm.region} onChange={setVF('region')} required className={inputCls} placeholder="Arusha" />
                  </Field>
                  <Field label={sw ? 'Eneo / Mtaa' : 'Location'} required>
                    <input value={verForm.location} onChange={setVF('location')} required className={inputCls} placeholder="Sekei" />
                  </Field>
                </div>

                <Field label={sw ? 'Rasimu / Picha ya Kitambulisho' : 'ID photocopy / image'} required>
                  <label className="group flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-ink-300 bg-paper px-4 py-6 text-center transition hover:border-gold-400 hover:bg-gold-50">
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => handleVerFile(e.target.files[0])}
                      className="hidden"
                    />
                    {verName ? (
                      <>
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success-50 text-success-700">
                          <Icon name="check" className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-semibold text-success-700">{verName}</span>
                        <span className="text-xs text-ink-500">{sw ? 'Bofya kubadilisha faili' : 'Click to change file'}</span>
                      </>
                    ) : (
                      <>
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gold-700 ring-1 ring-ink-200">
                          <Icon name="upload" className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-semibold text-ink-700">{sw ? 'Chagua picha ya ID...' : 'Choose ID image...'}</span>
                        <span className="text-xs text-ink-500">PDF, JPG, PNG, WebP · max 8MB</span>
                      </>
                    )}
                  </label>
                </Field>

                <button type="submit" disabled={verBusy} className="btn-primary w-full">
                  {verBusy ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="9" opacity="0.25" />
                        <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
                      </svg>
                      {sw ? 'Inatuma...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <Icon name="shield" className="h-4 w-4" />
                      {sw ? 'Tuma Uthibitisho' : 'Submit Verification'}
                    </>
                  )}
                </button>
              </form>
            </div>

            <p className="mt-4 flex items-start justify-center gap-2 text-center text-xs text-ink-500">
              <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {sw
                  ? 'Hatua 5 za uhalali: Kitambulisho, Simu, Makazi, Kanisa/Shirika, na Nyaraka (barua + bei).'
                  : '5 due-diligence steps: ID, phone, residence, church/org reference, and documents (letter + quotes).'}
              </span>
            </p>
          </div>
        )}

        {tab === 'reports' && (
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-5">
              <span className="eyebrow">{sw ? 'Ufuatiliaji' : 'Monitoring'}</span>
              <h1 className="display-md mt-3">{sw ? 'Ripoti na Vifaa' : 'Reports & Equipment'}</h1>
              <p className="mt-2 text-sm text-ink-600">
                {sw
                  ? 'Thibitisha kupokea vifaa na tuma ripoti za matumizi.'
                  : 'Confirm receipt of equipment and submit usage reports.'}
              </p>
            </div>

            {repMsg && (
              <div className={'mb-4 flex items-center gap-2 rounded-[14px] border px-4 py-3 text-sm ' + (repMsg.ok ? 'border-success-200 bg-success-50 text-success-700' : 'border-error-200 bg-error-50 text-error-700')}>
                <Icon name={repMsg.ok ? 'check' : 'alert'} className="h-4 w-4 shrink-0" />
                {repMsg.text}
              </div>
            )}

            <div className="card-base overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-ink-200 bg-paper px-5 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-oweru-50 text-oweru-700">
                  <Icon name="box" className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-semibold text-ink-900">{sw ? 'Vifaa Vilivyopokelewa' : 'Received Equipment'}</h2>
              </div>
              {equipment.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-ink-500">{sw ? 'Hakuna vifaa vilivyopokelewa bado.' : 'No equipment received yet.'}</div>
              ) : (
                <div className="divide-y divide-ink-200">
                  {equipment.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-ink-900">{e.item}</div>
                        <div className="text-xs text-ink-500">{e.reg} · {e.serial}</div>
                      </div>
                      <StatusBadge status={e.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card-base mt-4 overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-ink-200 bg-paper px-5 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-oweru-50 text-oweru-700">
                  <Icon name="docs" className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-semibold text-ink-900">{sw ? 'Ripoti Zangu' : 'My Reports'}</h2>
              </div>
              {myReports.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-ink-500">{sw ? 'Hakuna ripoti bado.' : 'No reports yet.'}</div>
              ) : (
                <div className="divide-y divide-ink-200">
                  {myReports.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-ink-900">{r.item}</div>
                        <div className="text-xs text-ink-500 uppercase">{r.type} {r.due ? ('· due ' + r.due) : ''}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <StatusBadge status={r.status} />
                        {r.evidence && (
                          <button
                            type="button"
                            onClick={() => openDoc(() => openReportEvidence(r.id), sw ? 'Uthibitisho' : 'Evidence')}
                            className="btn-secondary btn-sm"
                          >
                            <Icon name="eye" className="h-4 w-4" />
                            {sw ? 'Uthibitisho' : 'Evidence'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card-base mt-4 overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-ink-200 bg-paper px-5 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-success-50 text-success-700">
                  <Icon name="truck" className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-semibold text-ink-900">{sw ? 'Thibitisha Uwasilishaji' : 'Confirm Delivery'}</h2>
              </div>
              <form className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2" onSubmit={(e) => submitReport(e, 'delivery')}>
                <Field label={sw ? 'Kifaa' : 'Item'} required>
                  <Select value={repItem} onChange={(e) => setRepItem(e.target.value)}>
                    <option value="">{sw ? '— Chagua —' : '— Select —'}</option>
                    {equipment.map((e) => <option key={e.id} value={e.id}>{e.item}</option>)}
                  </Select>
                </Field>
                <Field label="Serial number">
                  <input value={repSerial} onChange={(e) => setRepSerial(e.target.value)} className={inputCls} placeholder="SP-0000" />
                </Field>
                <Field label={sw ? 'Maelezo ya uthibitisho' : 'Confirmation notes'} className="sm:col-span-2">
                  <TextArea rows={2} value={repText} onChange={(e) => setRepText(e.target.value)} placeholder={sw ? 'Eleza hali ya uwasilishaji...' : 'Describe delivery condition...'} />
                </Field>
                <Field label={sw ? 'Picha / uthibitisho (hiari)' : 'Photo / evidence (optional)'} className="sm:col-span-2" hint={sw ? 'JPG, PNG, PDF · hadi 8MB' : 'JPG, PNG, PDF · up to 8MB'}>
                  <label className="flex w-full cursor-pointer items-center gap-3 rounded-[10px] border border-dashed border-ink-300 bg-paper px-4 py-3 transition hover:border-oweru-400 hover:bg-oweru-50">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(e) => handleRepEvidence(e.target.files[0])}
                      className="hidden"
                    />
                    <Icon name={repEvidence ? 'check' : 'photo'} className={'h-5 w-5 shrink-0 ' + (repEvidence ? 'text-success-700' : 'text-oweru-700')} />
                    <span className="min-w-0 text-sm text-ink-600">{repEvidenceName || (sw ? 'Chagua picha ya uwasilishaji...' : 'Choose delivery photo...')}</span>
                  </label>
                </Field>
                <div className="flex justify-end sm:col-span-2">
                  <button type="submit" disabled={repBusy} className="btn-primary">
                    {repBusy ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="9" opacity="0.25" />
                          <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
                        </svg>
                        {sw ? 'Inatuma...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <Icon name="check" className="h-4 w-4" />
                        {sw ? 'Thibitisha Uwasilishaji' : 'Confirm Delivery'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="card-base mt-4 overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-ink-200 bg-paper px-5 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-gold-50 text-gold-800">
                  <Icon name="chart" className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-semibold text-ink-900">{sw ? 'Ripoti za Ufuatiliaji' : 'Monitoring Reports'}</h2>
              </div>
              <form className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2" onSubmit={(e) => submitReport(e, repType)}>
                <Field label="Type" required>
                  <Select value={repType} onChange={(e) => setRepType(e.target.value)}>
                    <option value="30_day">30-Day</option>
                    <option value="90_day">90-Day</option>
                    <option value="incident">Incident</option>
                  </Select>
                </Field>
                <Field label={sw ? 'Kifaa' : 'Item'} required>
                  <Select value={repItem} onChange={(e) => setRepItem(e.target.value)}>
                    <option value="">{sw ? '— Chagua —' : '— Select —'}</option>
                    {equipment.map((e) => <option key={e.id} value={e.id}>{e.item}</option>)}
                  </Select>
                </Field>
                <Field label={sw ? 'Maelezo' : 'Description'} required className="sm:col-span-2">
                  <TextArea rows={3} value={repText} onChange={(e) => setRepText(e.target.value)} placeholder={sw ? 'Eleza maendeleo/matumizi...' : 'Describe progress/usage...'} />
                </Field>
                <Field label={sw ? 'Picha / uthibitisho (hiari)' : 'Photo / evidence (optional)'} className="sm:col-span-2" hint={sw ? 'JPG, PNG, PDF · hadi 8MB' : 'JPG, PNG, PDF · up to 8MB'}>
                  <label className="flex w-full cursor-pointer items-center gap-3 rounded-[10px] border border-dashed border-ink-300 bg-paper px-4 py-3 transition hover:border-oweru-400 hover:bg-oweru-50">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(e) => handleRepEvidence(e.target.files[0])}
                      className="hidden"
                    />
                    <Icon name={repEvidence ? 'check' : 'photo'} className={'h-5 w-5 shrink-0 ' + (repEvidence ? 'text-success-700' : 'text-oweru-700')} />
                    <span className="min-w-0 text-sm text-ink-600">{repEvidenceName || (sw ? 'Chagua picha ya uthibitisho...' : 'Choose supporting photo...')}</span>
                  </label>
                </Field>
                <div className="flex justify-end sm:col-span-2">
                  <button type="submit" disabled={repBusy} className="btn-primary">
                    {repBusy ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="9" opacity="0.25" />
                          <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
                        </svg>
                        {sw ? 'Inatuma...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <Icon name="docs" className="h-4 w-4" />
                        {sw ? 'Tuma Ripoti' : 'Submit Report'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {tab === 'privacy' && (
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-5">
              <span className="eyebrow">{sw ? 'Faragha' : 'Privacy'}</span>
              <h1 className="display-md mt-3">{sw ? 'Mipangilio ya Faragha' : 'Privacy Settings'}</h1>
              <p className="mt-2 text-sm text-ink-600">
                {sw
                  ? 'Chagua unachotaka kushiriki na hadhara, na jinsi unapopokea arifa.'
                  : 'Choose what you share publicly, and how you hear from us.'}
              </p>
            </div>
            {privacyMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-[14px] border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700">
                <Icon name="check" className="h-4 w-4 shrink-0" />
                {privacyMsg}
              </div>
            )}
            <div className="card-base overflow-hidden">
              <div className="divide-y divide-ink-200">
                {[
                  ['shareReports', sw ? 'Shiriki ripoti za utoaji (30/90 siku)' : 'Share delivery reports (30/90 day)'],
                  ['shareIdentity', sw ? 'Fichua utambulisho wa shirika kwa hadhara' : 'Disclose organization identity publicly'],
                  ['emailAlerts', sw ? 'Arifa za barua pepe' : 'Email notifications'],
                ].map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
                    <span className="text-sm text-ink-700">{label}</span>
                    <input
                      type="checkbox"
                      checked={privacy[key]}
                      onChange={() => {
                        setPrivacy((s) => ({ ...s, [key]: !s[key] }))
                        setPrivacyMsg(sw ? 'Mipangilio imesasishwa.' : 'Settings updated.')
                      }}
                      className="h-5 w-5 shrink-0 accent-oweru-600"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-5">
              <span className="eyebrow">{sw ? 'Arifa' : 'Updates'}</span>
              <h1 className="display-md mt-3">{sw ? 'Arifa' : 'Notifications'}</h1>
            </div>
            <div className="card-base overflow-hidden">
              {my.length === 0 ? (
                <EmptyState icon="bell" title={sw ? 'Hakuna arifa.' : 'No notifications.'}
                  sub={sw ? 'Mabadiliko ya maombi yako yataonekana hapa.' : 'Changes to your requests will show up here.'} />
              ) : (
                <div className="divide-y divide-ink-200">
                  {my.map((r) => (
                    <div key={r.id} className="flex gap-3 px-5 py-4">
                      <span className={'mt-1.5 h-2 w-2 shrink-0 rounded-full ' + (r.status === 'approved' || r.status === 'submitted' ? 'bg-success-500' : 'bg-gold-500')} />
                      <div className="min-w-0 text-sm">
                        <div className="font-semibold text-ink-900">{r.title}</div>
                        <div className="text-ink-500">
                          {sw
                            ? 'Ombi lako limefikia hali ya: '
                            : 'Your request reached status: '}
                          <b className="font-semibold text-ink-700">{r.status}</b> · {r.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab !== 'dashboard' && tab !== 'new-request' && tab !== 'my-requests' && tab !== 'documents' && tab !== 'verification' && tab !== 'reports' && tab !== 'privacy' && tab !== 'notifications' && (
          <div className="card-base p-8 text-center text-ink-500">
            <div className="mb-2 text-lg font-semibold text-ink-800">
              {nav.find(([k]) => k === tab)?.[1]}
            </div>
            {sw ? 'Sehemu hii inaweza kukamilishwa zaidi wakati wa backend.' : 'This section can be expanded further with the backend.'}
          </div>
        )}
        </div>
      </main>
    </div>
  )
}
