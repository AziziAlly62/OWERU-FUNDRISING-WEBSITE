import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useAuth } from '../auth'
import { fetchRequestByToken, claimRequest, money } from '../api'
import ProgressBar from '../components/ProgressBar'
import { PageLoader } from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import { Icon } from '../components/icons'
import { usePageMeta } from '../hooks/usePageMeta'
import { Container } from '../components/ui'

const PIPELINE = [
  'submitted',
  'under_review',
  'approved',
  'published',
  'funding_closed',
  'procurement',
  'delivered',
  'active_reporting',
  'closed',
]

const STEP_LABEL = {
  submitted: ['Imepelekwa', 'Submitted'],
  under_review: ['Inakaguliwa na bodi', 'Under review'],
  approved: ['Imeidhinishwa', 'Approved'],
  published: ['Hadharani kwa ufadhili', 'Published for funding'],
  funding_closed: ['Ufadhili umekamilika', 'Funding closed'],
  procurement: ['Ununuzi unaendelea', 'Procurement'],
  delivered: ['Kifaa kimefikishwa', 'Delivered'],
  active_reporting: ['Ripoti za matumizi', 'Impact reporting'],
  closed: ['Imefungwa', 'Closed'],
}

export default function TrackRequest() {
  const { token } = useParams()
  const { lang } = useI18n()
  const { user } = useAuth()
  const sw = lang === 'sw'

  const [req, setReq] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimMsg, setClaimMsg] = useState('')
  const [claimOk, setClaimOk] = useState(false)

  usePageMeta({
    title: sw ? 'Fuatilia Ombi | OWERU Foundation' : 'Track a Request | OWERU Foundation',
    description: sw
      ? 'Fuatilia maendekeo ya ombi lako la vifaa na onyesho la matumizi ya mchango wako.'
      : 'Follow your equipment request progress and see how your contribution is being used.',
  })

  useEffect(() => {
    let alive = true
    if (!token) {
      // The public "/track" page was removed, so this route now only ever
      // arrives with a token. Without one there is nothing to look up, and an
      // empty screen would be worse than saying so.
      setLoading(false)
      setError(sw ? 'Kiungo hiki kina kasoro.' : 'This link is not valid.')
      return () => {
        alive = false
      }
    }
    setLoading(true)
    setError('')
    fetchRequestByToken(token)
      .then((r) => alive && setReq(r))
      .catch((e) => alive && setError(e.message || (sw ? 'Kiungo hakikupatikana.' : 'Link not found.')))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [token, sw])

  const stepIndex = useMemo(() => {
    if (!req) return -1
    const i = PIPELINE.indexOf(req.status)
    return i === -1 ? PIPELINE.length - 1 : i
  }, [req])

  const closeStep = (i) => i <= stepIndex

  const doClaim = async () => {
    setClaiming(true)
    setClaimMsg('')
    try {
      await claimRequest(req.id, token)
      setClaimOk(true)
      setClaimMsg(
        sw
          ? 'Ombi limefungwa kwenye akaunti yako. Angalia dashboard yako.'
          : 'Request linked to your account. Visit your dashboard.'
      )
    } catch (err) {
      setClaimOk(false)
      setClaimMsg(
        err.message || (sw ? 'Imeshindikana. Jaribu tena.' : 'Could not link request. Try again.')
      )
    } finally {
      setClaiming(false)
    }
  }

  const pct = req && req.target ? Math.min(100, Math.round((req.raised / req.target) * 100)) : 0
  const declined = req?.status === 'declined'

  return (
    <section className="bg-cream">
      <div
        className="h-1.5 w-full bg-gradient-to-r from-gold-500 via-oweru-700 to-ink-900"
        aria-hidden="true"
      />

      <Container size="narrow" className="py-12 sm:py-16">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-oweru-700">
          <Icon name="arrow-left" className="h-4 w-4" />
          {sw ? 'Rudi nyumbani' : 'Back to home'}
          </Link>

        {loading && <PageLoader />}

        {!loading && error && (
          <ErrorState
            title={sw ? 'Hatukuipata ombi hili.' : 'We could not find this request.'}
            message={error}
            backTo="/portal"
            backLabel={sw ? 'Tuma ombi jipya' : 'Submit a request'}
          />
        )}

        {!loading && !error && req && (
          <div className="grid gap-4">
            {/* Header */}
            <div className="relative overflow-hidden rounded-[18px] bg-ink-950 p-6 sm:p-8">
              <div className="absolute inset-0 grid-texture opacity-60" aria-hidden="true" />
              <div
                className="absolute -left-20 -bottom-24 h-56 w-56 rounded-full bg-oweru-700/25 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[0.6875rem] font-semibold tracking-wider text-gold-300 uppercase ring-1 ring-white/15">
                    {sw ? 'Ombi la hisani' : 'Charitable request'}
                    <span className="tabular-nums opacity-70">OWR-{String(req.id).padStart(5, '0')}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.6875rem] font-semibold tracking-wider uppercase ${
                      declined
                        ? 'bg-error-500/15 text-error-200 ring-1 ring-error-500/40'
                        : req.status === 'delivered' || req.status === 'closed'
                          ? 'bg-success-500/15 text-success-200 ring-1 ring-success-500/40'
                          : 'bg-gold-500/15 text-gold-200 ring-1 ring-gold-400/40'
                    }`}
                  >
                    {!declined && (
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />
                    )}
                    {declined
                      ? sw ? 'Imekataliwa' : 'Declined'
                      : sw
                        ? STEP_LABEL[req.status]?.[0] || req.status
                        : STEP_LABEL[req.status]?.[1] || req.status}
                  </span>
                </div>

                <h1 className="display-lg mt-5 text-balance text-white capitalize">
                  {sw ? req.swTitle : req.title}
                </h1>
                <p className="mt-3 text-sm text-white/60">
                  {[req.org, req.region, (req.submittedAt || '').slice(0, 10)]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </div>

            {/* Declined */}
            {declined && (
              <div className="rounded-[14px] border border-error-200 bg-error-50 p-6">
                <h2 className="eyebrow text-error-700">
                  {sw ? 'Uamuzi wa ombi lako' : 'Decision on your request'}
                </h2>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-error-800">
                  {req.decisionNote ||
                    (sw
                      ? 'Ombi lako halikuidhinishwa. Wasiliana nasi kwa maelezo zaidi.'
                      : 'Your request was not approved. Contact us for more details.')}
                </p>
              </div>
            )}

            {/* Funding */}
            {!declined && (
              <div className="card-base p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm text-ink-500">{sw ? 'Ufadhili' : 'Funding'}</span>
                  <span className="text-sm font-semibold text-ink-900 tabular-nums">
                    {req.raised > 0 ? money(req.raised) : sw ? 'Bado hakuna mchango' : 'No donations yet'}
                    <span className="text-ink-400"> / {money(req.target)}</span>
                  </span>
                </div>
                <ProgressBar raised={req.raised} target={req.target} className="mt-3" />
                <p className="mt-2 text-right text-xs font-semibold text-ink-500 tabular-nums">{pct}%</p>
              </div>
            )}

            {/* Journey */}
            {!declined && (
              <div className="card-base p-6 sm:p-7">
                <h2 className="eyebrow">{sw ? 'Hatua za ombi lako' : 'Your request journey'}</h2>
                <ol className="mt-6">
                  {PIPELINE.map((s, i) => {
                    const done = closeStep(i)
                    const current = i === stepIndex
                    return (
                      <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
                        {i < PIPELINE.length - 1 && (
                          <span
                            className={`absolute top-6 bottom-0 left-[11px] w-0.5 ${closeStep(i + 1) ? 'bg-success-500' : 'bg-ink-200'}`}
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold ${
                            done ? 'bg-success-500 text-white' : 'bg-ink-100 text-ink-500'
                          }`}
                          aria-hidden="true"
                        >
                          {done ? <Icon name="check" className="h-3 w-3" strokeWidth={3} /> : i + 1}
                        </span>
                        <div className="flex min-w-0 flex-wrap items-center gap-2 pt-0.5">
                          <span
                            className={`text-[0.9375rem] ${current ? 'font-semibold text-ink-900' : 'text-ink-500'}`}
                          >
                            {sw ? STEP_LABEL[s][0] : STEP_LABEL[s][1]}
                          </span>
                          {current && (
                            <span className="rounded-full bg-oweru-950 px-2 py-0.5 text-[0.625rem] font-semibold tracking-wider text-white uppercase">
                              {sw ? 'Sasa' : 'Now'}
                            </span>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>

                {req.endorsements?.length > 0 && (
                  <div className="mt-7 border-t border-ink-200 pt-5">
                    <h3 className="text-xs font-semibold tracking-wider text-ink-400 uppercase">
                      {sw ? 'Uthibitisho wa kanisa' : 'Church confirmation'}
                    </h3>
                    <ul className="mt-3 grid gap-2">
                      {req.endorsements.map((e, i) => (
                        <li key={i} className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate text-ink-600">
                            {e.organization || (sw ? 'Kanisa' : 'Church')}
                          </span>
                          <span
                            className={`shrink-0 font-medium ${
                              e.status === 'complete'
                                ? 'text-success-700'
                                : e.status === 'pending'
                                  ? 'text-gold-700'
                                  : 'text-error-600'
                            }`}
                          >
                            {e.status === 'complete'
                              ? sw ? 'Imethibitishwa' : 'Confirmed'
                              : e.status === 'pending'
                                ? sw ? 'Inasubiri' : 'Pending'
                                : sw ? 'Imekataliwa' : 'Rejected'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Account link */}
            <div className="relative overflow-hidden rounded-[14px] bg-ink-950 p-6 sm:p-7">
              <div
                className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold-500/10 blur-2xl"
                aria-hidden="true"
              />
              <div className="relative">
              {user ? (
                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div className="max-w-md">
                    <h2 className="text-[1.0625rem] text-white">
                      {sw ? 'Unganisha ombi na akaunti yako' : 'Link this request to your account'}
                    </h2>
                    <p className="mt-1.5 text-sm text-white/60">
                      {sw
                        ? 'Unganisha ombi hili ili uone ufadhili, uthibitisho na ripoti zote katika dashboard yako.'
                        : 'Link it to see funding, endorsements and every report in your applicant dashboard.'}
                    </p>
                    {claimMsg && (
                      <p
                        className={`mt-3 rounded-[10px] px-4 py-3 text-sm ${
                          claimOk ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'
                        }`}
                      >
                        {claimMsg}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={doClaim}
                    disabled={claiming}
                    className="btn-primary shrink-0 disabled:opacity-60"
                  >
                    {claiming
                      ? sw ? 'Inaunganisha…' : 'Linking…'
                      : sw ? 'Funga kwenye akaunti yangu' : 'Link to my account'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div className="max-w-md">
                    <h2 className="text-[1.0625rem] text-white">
                      {sw ? 'Fungua akaunti ili ufuate ombi lako' : 'Create an account to keep track'}
                    </h2>
                    <p className="mt-1.5 text-sm text-white/60">
                      {sw
                        ? 'Pokea arifa za uthibitisho, ufadhili na ripoti. Bure kabisa.'
                        : 'Get confirmation, funding and report updates. Completely free.'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-3">
                    <Link to="/login?register=1" className="btn-primary">
                      {sw ? 'Jisajili / Ingia' : 'Register / Sign in'}
                    </Link>
                    <Link to="/requests#causes" className="btn-on-dark">
                      {sw ? 'Maombi mengine' : 'Browse requests'}
                    </Link>
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Next step — no dead ends */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-6">
              <p className="text-sm text-ink-500">
                {sw ? 'Unahitaji kitu kingine?' : 'Looking for something else?'}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/requests#causes" className="btn-secondary btn-sm">
                  {sw ? 'Maombi yenye ufadhili wazi' : 'Open requests'}
                </Link>
                {!user && (
                  <Link to="/portal" className="btn-forest btn-sm">
                    {sw ? 'Tuma ombi lako' : 'Submit your own request'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </section>
  )
}
