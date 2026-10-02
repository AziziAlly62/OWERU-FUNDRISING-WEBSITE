import { useState, useEffect } from 'react'
import { useAuth } from '../../auth'
import { useI18n } from '../../i18n'
import { fetchEndorsements, respondEndorsement, fetchMyOrganization } from '../../api'
import { PortalHeader, StatCard, SectionTitle, EmptyState, Icon } from '../../components/PortalUi'
import { Bars } from '../../components/Charts'
import { TextArea } from '../../components/FormField'
import { SimplePageSkeleton } from '../../components/LoadingSpinner'

const STATUS_LABEL = {
  pending: 'Pending',
  complete: 'Confirmed',
  declined: 'Declined',
}

const monthShort = (ym) => {
  const [y, m] = String(ym).split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short' })
}

export default function ChurchPortal() {
  const { user, logout } = useAuth()
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [msg, setMsg] = useState(null)
  const [orgStatus, setOrgStatus] = useState('')

  const load = () => {
    fetchEndorsements()
      .then(setRows)
      .catch((e) => setMsg({ ok: false, text: e?.message || String(e) }))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  useEffect(() => {
    fetchMyOrganization()
      .then((o) => setOrgStatus(o.verification_status || ''))
      .catch((e) => setMsg({ ok: false, text: e?.message || String(e) }))
  }, [])

  const verified = orgStatus === 'verified'

  const pending = rows.filter((r) => r.status === 'pending')
  const history = rows.filter((r) => r.status !== 'pending')
  const confirmed = history.filter((r) => r.status === 'complete').length
  const declined = history.length - confirmed
  const rate = history.length > 0 ? Math.round((confirmed / history.length) * 100) : 0

  const ym = (offset) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - offset)
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
  }

  const monthly = (() => {
    const labels = []
    const buckets = []
    for (let i = 5; i >= 0; i--) {
      labels.push(ym(i))
      buckets.push(0)
    }
    history.filter((r) => r.status === 'complete' && r.endorsedDate).forEach((r) => {
      const key = (r.endorsedDate || '').slice(0, 7)
      const idx = labels.findIndex((m) => m === key)
      if (idx >= 0) buckets[idx] = (buckets[idx] || 0) + 1
    })
    return { labels, values: buckets }
  })()
  const hasMonthly = monthly.values.some((v) => Number(v) > 0)

  const respond = async (row, status) => {
    if (!verified) {
      setMsg({ ok: false, text: sw ? 'Kanisa lako bado halijaidhinishwa na OWERU. Subiri idhini kabla ya kujibu maombi.' : 'Your church has not been approved by OWERU yet. Wait for approval before answering confirmations.' })
      return
    }
    setBusyId(row.id)
    setMsg(null)
    try {
      await respondEndorsement(row.id, { status, notes: notes[row.id] || '' })
      load()
      setMsg({ ok: true, text: sw ? 'Imehifadhiwa.' : 'Saved.' })
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  const initial = (name) => ((name || '?').trim().charAt(0) || '?').toUpperCase()

  return (
    <div className="min-h-screen bg-paper">
      <PortalHeader
        title={sw ? 'Portali ya Kanisa' : 'Church Portal'}
        subtitle={sw ? 'Uthibitisho wa maombi' : 'Request confirmation'}
        name={user?.name}
        onLogout={logout}
        logoutLabel={sw ? 'Toka' : 'Log out'}
      />

      {/* ===== Hero band ===== */}
      <section className="relative overflow-hidden bg-oweru-950 text-white">
        <div className="container-responsive relative py-10 md:py-14">
          <span className="eyebrow eyebrow-on-dark">{sw ? 'Uthibitisho wa Kanisa' : 'Church Confirmation'}</span>
          <h1 className="display-lg mt-4 max-w-3xl text-balance">
            {sw ? 'Thibitisha maombi kutoka kwa jamii yako' : 'Confirm requests from your community'}
          </h1>
          <p className="lede mt-4 max-w-2xl">
            {sw
              ? 'Uthibitisho wako ni ishara ya kwanza ya imani. Kanisa linakubali ombi, na OWERU inaendelea na ukaguzi.'
              : 'Your sign-off is the first signal of trust. The church vouches for the request, and OWERU takes it from there.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-oweru-600/40 bg-oweru-800 px-3.5 py-1.5 text-xs font-semibold text-oweru-100">
              <Icon name="shield" className="h-4 w-4" />
              {user?.name}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs text-white/70">
              <Icon name="clock" className="h-4 w-4 text-gold-300" />
              {pending.length} {sw ? 'yanasubiri' : 'awaiting'}
            </span>
          </div>
        </div>
      </section>

      <main className="container-responsive py-8">
        {/* ===== Pending verification banner ===== */}
        {orgStatus === 'pending' && (
          <div className="mb-6 flex items-start gap-3 rounded-[14px] border border-gold-300 bg-gold-50 px-4 py-3 text-sm text-gold-900">
            <Icon name="shield" className="mt-0.5 h-5 w-5 text-gold-700" />
            <div>
              <b>{sw ? 'Kanisa lako linangoja idhini ya OWERU.' : 'Your church is awaiting OWERU approval.'}</b>{' '}
              {sw
                ? 'OWERU itakapolidhinisha, utaweza kuthibitisha maombi ya jamii yako.'
                : 'Once OWERU approves it, you will be able to confirm requests from your community.'}
            </div>
          </div>
        )}

        {msg && (
          <div className={'mb-6 flex items-center gap-2 rounded-[14px] border px-4 py-3 text-sm ' + (msg.ok ? 'border-success-200 bg-success-50 text-success-700' : 'border-error-200 bg-error-50 text-error-700')}>
            <Icon name={msg.ok ? 'check' : 'x'} className="h-4 w-4" />
            {msg.text}
          </div>
        )}

        {/* ===== Stat cards ===== */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon="clock" label={sw ? 'Inasubiri uthibitisho' : 'Pending confirmations'} value={pending.length} tone="gold" />
          <StatCard icon="check" label={sw ? 'Zimethibitishwa' : 'Confirmed'} value={confirmed} tone="green" />
          <StatCard icon="x" label={sw ? 'Zimekataliwa' : 'Declined'} value={declined} tone="red" />
          <StatCard icon="shield" label={sw ? 'Kiwango cha Uthibitisho' : 'Confirmation rate'} pct={rate} tone="oweru">
            <div className={`text-2xl font-semibold leading-tight ${rate > 0 ? 'text-oweru-700' : 'text-ink-500'}`}>{rate}%</div>
          </StatCard>
        </div>

        {/* ===== Monthly rhythm ===== */}
        <div className="card-base mt-8 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="eyebrow">{sw ? 'Mwelekeo' : 'Trend'}</span>
              <h2 className="mt-3 text-lg text-ink-900">{sw ? 'Uthibitisho kwa mwezi · miezi 6' : 'Confirmations per month · last 6 months'}</h2>
            </div>
            <span className="text-xs text-ink-500">{sw ? 'Wima = maombi yaliyothibitishwa' : 'Each bar is a month; height = requests confirmed'}</span>
          </div>

          <div className="mt-5">
            {hasMonthly ? (
              <div className="pt-2">
                <Bars labels={monthly.labels} values={monthly.values} height={132} unit=" confirmations" tone="var(--color-success-500)" />
                <div className="mt-1.5 flex">
                  {monthly.labels.map((m) => (
                    <div key={m} className="flex-1 text-center text-[10px] font-semibold text-ink-500 md:text-xs">{monthShort(m)}</div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state py-10 text-center text-sm text-ink-500">
                <Icon name="docs" className="mx-auto mb-2 h-7 w-7 text-ink-400" />
                {sw ? 'Hakuna uthibitisho wa miezi 6 zilizopita bado.' : 'No confirmations in the last 6 months yet.'}
              </div>
            )}
          </div>
        </div>

        {/* ===== Pending requests ===== */}
        <div className="mt-10">
          <SectionTitle title={sw ? 'Maombi Yanayosubiri Uthibitisho' : 'Requests awaiting your confirmation'}
            action={<span className="chip chip-accent">{pending.length}</span>} />

          {loading ? (
            <SimplePageSkeleton message={sw ? 'Inapakia...' : 'Loading...'} />
          ) : pending.length === 0 ? (
            <EmptyState icon="clock" title={sw ? 'Hakuna maombi yanayosubiri' : 'No pending confirmations'}
              sub={sw ? 'Maombi mapya yatakapoletwa yataonekana hapa.' : 'New requests will appear here when submitted.'} />
          ) : (
            <div className="grid gap-4">
              {pending.map((row) => (
                <div key={row.id} className="card-base overflow-hidden">
                  <div className="p-5 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-xl text-ink-900">{row.title}</h3>
                          <span className="status-badge status-badge-warning">{sw ? 'Inasubiri' : STATUS_LABEL[row.status]}</span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                          <span className="inline-flex items-center gap-2 text-sm text-ink-700">
                            <span className="grid h-8 w-8 place-items-center rounded-full bg-oweru-50 text-xs font-semibold text-oweru-800">
                              {initial(row.applicantName)}
                            </span>
                            <b className="font-semibold">{row.applicantName}</b>
                          </span>
                          {row.applicantPhone && <span className="text-sm text-ink-500">{row.applicantPhone}</span>}
                          {row.region && <span className="text-sm text-ink-500">· {row.region}</span>}
                        </div>

                        {row.notes && (
                          <p className="mt-3 border-l-2 border-gold-400 bg-paper px-3 py-2 text-sm text-ink-600 italic">
                            &ldquo;{row.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-ink-200 bg-paper px-5 py-4 md:px-6">
                    <TextArea rows={2} value={notes[row.id] || ''} onChange={(e) => setNotes((n) => ({ ...n, [row.id]: e.target.value }))}
                      placeholder={sw ? 'Vidokezo (hiari) — linalothibitishwa, na wakati wa matumizi' : 'Notes (optional) — what is being confirmed, and for what use'} />
                    <div className="mt-3 flex gap-3">
                      <button
                        type="button"
                        disabled={busyId === row.id || !verified}
                        onClick={() => respond(row, 'complete')}
                        className="btn-forest flex-1"
                      >
                        <Icon name="check" className="h-4 w-4" />
                        {busyId === row.id ? (sw ? 'Inahifadhi...' : 'Saving...') : (sw ? 'Thibitisha' : 'Confirm')}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id || !verified}
                        onClick={() => respond(row, 'declined')}
                        className="btn-ghost flex-1 text-error-700"
                      >
                        <Icon name="x" className="h-4 w-4" />
                        {sw ? 'Kataa' : 'Decline'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== History ===== */}
        <div className="mt-10">
          <SectionTitle title={sw ? 'Historia' : 'History'}
            action={<span className="chip">{history.length}</span>} />
          {history.length === 0 ? (
            <EmptyState icon="list" title={sw ? 'Hakuna historia bado' : 'No history yet'}
              sub={sw ? 'Maombi unayojibu yataonekana hapa.' : 'Requests you respond to will appear here.'} />
          ) : (
            <div className="card-base overflow-hidden">
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{sw ? 'Ombi' : 'Request'}</th>
                      <th>{sw ? 'Muombaji' : 'Applicant'}</th>
                      <th>{sw ? 'Hali' : 'Status'}</th>
                      <th>{sw ? 'Tarehe' : 'Date'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row) => (
                      <tr key={row.id}>
                        <td className="font-semibold text-ink-900">{row.title}</td>
                        <td className="text-ink-600">{row.applicantName}</td>
                        <td>
                          <span className={'status-badge ' + (row.status === 'complete' ? 'status-badge-success' : 'status-badge-error')}>
                            {sw ? (row.status === 'complete' ? 'Imethibitishwa' : 'Imekataliwa') : STATUS_LABEL[row.status]}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-ink-500">{row.endorsedDate || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}