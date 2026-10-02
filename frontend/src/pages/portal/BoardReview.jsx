import { useState, useEffect } from 'react'
import { useAuth } from '../../auth'
import { useI18n } from '../../i18n'
import { fetchReviewQueue, submitBoardDecision } from '../../api'
import { Icon, PortalHeader, EmptyState } from '../../components/PortalUi'
import { TextArea } from '../../components/FormField'
import { SimplePageSkeleton } from '../../components/LoadingSpinner'

const STATUS_LABEL = {
  submitted: { en: 'Submitted', sw: 'Imepelekwa' },
  under_review: { en: 'Under Review', sw: 'Inakaguliwa' },
  more_info_needed: { en: 'More Info Needed', sw: 'Inahitaji Maelezo' },
  approved: { en: 'Board Approved', sw: 'Bodi Imeidhinisha' },
  declined: { en: 'Declined', sw: 'Imekataliwa' },
}

const STATUS_TONE = {
  submitted: 'status-badge-info',
  under_review: 'status-badge-warning',
  more_info_needed: 'status-badge-warning',
}

const ANCHORS = {
  board: { en: 'Board decision recorded', sw: 'Uamuzi wa Bodi umerekodiwa' },
  verified_applicant: { en: 'Verified applicant', sw: 'Mwombaji aliyedhaminiwa' },
  church_confirmed: { en: 'Church confirmed', sw: 'Kanisa limethibitisha' },
}

export default function BoardReview() {
  const { user, logout } = useAuth()
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [msg, setMsg] = useState(null)

  const load = () => {
    fetchReviewQueue()
      .then(setRows)
      .catch((e) => setMsg({ ok: false, text: e?.message || String(e) }))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const decide = async (row, status) => {
    setBusyId(row.id)
    setMsg(null)
    try {
      await submitBoardDecision(row.id, status, notes[row.id] || '')
      load()
      setMsg({ ok: true, text: sw ? 'Uamuzi umehifadhiwa.' : 'Decision saved.' })
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <PortalHeader
        title={sw ? 'Bodi ya OWERU' : 'OWERU Board'}
        subtitle={sw ? 'Ukaguzi wa maombi' : 'Request review'}
        name={user?.name}
        onLogout={logout}
        logoutLabel={sw ? 'Toka' : 'Log out'}
      />

      <main className="container-responsive py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <span className="eyebrow">{sw ? 'Fungu la Bodi' : 'Board queue'}</span>
            <h1 className="display-md mt-3">{sw ? 'Maombi yanayosubiri uamuzi' : 'Requests awaiting a decision'}</h1>
          </div>
          <span className="chip">{rows.length} {sw ? 'maombi' : 'requests'}</span>
        </div>

        {msg && (
          <div className={'mb-6 flex items-center gap-2 rounded-[14px] border px-4 py-3 text-sm ' + (msg.ok ? 'border-success-200 bg-success-50 text-success-700' : 'border-error-200 bg-error-50 text-error-700')}>
            <Icon name={msg.ok ? 'check' : 'x'} className="h-4 w-4" />
            {msg.text}
          </div>
        )}

        {loading ? (
          <SimplePageSkeleton message={sw ? 'Inapakia...' : 'Loading...'} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="check"
            title={sw ? 'Hakuna maombi yanayosubiri uamuzi wa Bodi.' : 'No requests awaiting a Board decision.'}
            sub={sw ? 'Maombi mapya yatakapoletwa yataonekana hapa.' : 'New submissions appear here as they arrive.'}
          />
        ) : (
          <div className="grid gap-4">
            {rows.map((row) => (
              <div key={row.id} className="card-base overflow-hidden">
                <div className="p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-xl text-ink-900">{row.title}</h3>
                        <span className={'status-badge ' + (STATUS_TONE[row.statusRaw] || 'status-badge-neutral')}>
                          {(STATUS_LABEL[row.statusRaw]?.[sw ? 'sw' : 'en']) || row.statusRaw}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-600">
                        <span>
                          <b className="font-semibold text-ink-900">{row.applicantName}</b>{' '}
                          {row.applicantVerification === 'verified' ? (
                            <span className="font-semibold text-success-700">{sw ? '✓ utambulisho uliothibitishwa' : '✓ verified identity'}</span>
                          ) : row.applicantVerification ? (
                            <span className="text-gold-700">{sw ? 'utambulisho unasubiri' : 'identity pending'}</span>
                          ) : null}
                        </span>
                        {row.org && <span>· {row.org}</span>}
                        {row.region && <span>· {row.region}</span>}
                        <span className="text-ink-400">
                          · {row.itemCount} {sw ? 'vifaa' : 'items'} · TZS {(row.target || 0).toLocaleString()}
                        </span>
                      </div>

                      {(row.trustAnchors || []).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {row.trustAnchors.map((a) => (
                            <span key={a} className="chip chip-brand">
                              <Icon name="check" className="h-3 w-3" />
                              {ANCHORS[a]?.[sw ? 'sw' : 'en'] || a}
                            </span>
                          ))}
                        </div>
                      )}

                      {row.decisionNote && (
                        <p className="mt-3 border-l-2 border-gold-400 bg-paper px-3 py-2 text-sm text-ink-600 italic">
                          {row.decisionNote}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-ink-200 bg-paper px-5 py-4 md:px-6">
                  <TextArea rows={2} value={notes[row.id] || ''} onChange={(e) => setNotes((n) => ({ ...n, [row.id]: e.target.value }))}
                    placeholder={sw ? 'Sababu ya uamuzi (hiari)' : 'Decision reason (optional)'} />
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => decide(row, 'approved')}
                      className="btn-forest flex-1"
                    >
                      <Icon name="check" className="h-4 w-4" />
                      {sw ? 'Idhinisha' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => decide(row, 'more_info_needed')}
                      className="btn-secondary flex-1"
                    >
                      <Icon name="clock" className="h-4 w-4" />
                      {sw ? 'Omba Maelezo' : 'Request changes'}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => decide(row, 'declined')}
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
      </main>
    </div>
  )
}