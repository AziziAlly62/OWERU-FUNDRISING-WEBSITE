import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import { fetchKpi, exportCsv, money } from '../../api'
import { onStatsChange } from '../../statsBus'
import { useToast } from '../../components/Toast'
import { Icon } from '../../components/icons'
import { AdminGridSkeleton } from '../../components/LoadingSpinner'

/* Payment outcomes, mapped to the same semantic tokens the rest of the admin
   UI uses. These were Tailwind's stock green-600/amber-500/red-500/slate-500
   written as hex, so the KPI strip and the donor dashboard showed different
   colours for the same payment state. */
const STATUS_COLORS = {
  confirmed: 'var(--color-success-500)',
  pending: 'var(--color-warning-500)',
  pending_mpesa: 'var(--color-warning-500)',
  failed: 'var(--color-error-500)',
  refused: 'var(--color-error-500)',
  expired: 'var(--color-ink-400)',
  refunded: 'var(--color-ink-500)',
  cancelled: 'var(--color-ink-500)',
}

/* Chart line, area wash and gridline. The line uses success-500 so the trend
   reads as the same "good" green the status chips use. */
const CHART_LINE = 'var(--color-success-500)'

const STATUS_LABEL = (sw) => ({
  confirmed: sw ? 'Imethibitishwa' : 'Confirmed',
  pending: sw ? 'Inasubiri' : 'Pending',
  pending_mpesa: sw ? 'M-Pesa Inasubiri' : 'Pending M-Pesa',
  failed: sw ? 'Imeshindikana' : 'Failed',
  refused: sw ? 'Imekataliwa' : 'Refused',
  expired: sw ? 'Imeisha' : 'Expired',
  refunded: sw ? 'Imerejeshwa' : 'Refunded',
  cancelled: sw ? 'Imeghairiwa' : 'Cancelled',
})

const EN_STEPS = [
  ['doc', 'Application', 'A church-endorsed request arrives. Verify the church endorsement and applicant identity, then review for the Board.'],
  ['chart', 'Board approval', 'Approve the request and publish it. Public visitors can then fund specific items.'],
  ['wallet', 'Funding window', 'Each item fundraises for 60 days or until fully funded — all-or-nothing. Track progress in Items & Funding.'],
  ['card', 'Purchase', 'Once funded, raise a purchase invoice from a verified supplier and pay the supplier directly. Never send cash to the applicant.'],
  ['truck', 'Delivery & register', 'Record the delivered equipment in the Equipment register, then monitor its use.'],
  ['clipboard', 'Impact reports', 'Collect delivery, 30-day and 90-day reports — submit them on behalf of a recipient if needed. Publish verified stories on the Reports page.'],
]

const SW_STEPS = [
  ['doc', 'Ombi', 'Ombi linaloidhinishwa na kanisa linafika. Thibitisha idhini ya kanisa na utambulisho wa mwombaji, kisha likaguliwa na Bodi.'],
  ['chart', 'Idhini ya Bodi', 'Idhinisha ombi na ulichapishe. Wageni wa umma wanaweza kisha kufadhili vifaa mbalimbali.'],
  ['wallet', 'Dirisha la Ufadhili', 'Kila kifaa hukusanya fedha kwa siku 60 au hadi kufadhiliwa kabisa. Fuatilia maendeleo kwenye Vifaa na Ufadhili.'],
  ['card', 'Ununuzi', 'Baada ya kufadhiliwa, tengeneza ankara kutoka kwa muuzaji aliyeidhinishwa, na ulipe muuzaji moja kwa moja. Usitume fedha kwa mwombaji.'],
  ['truck', 'Uwasilishaji na Rejesta', 'Andika kifaa kilichotolewa kwenye rejesta ya vifaa, kisha ufuatilie matumizi yake.'],
  ['clipboard', 'Ripoti za Athari', 'Kusanya ripoti za uwasilishaji, siku 30 na siku 90 — ziwasilishe kwa niaba ya mpokeaji ikibidi. Chapisha hadithi zilizothibitishwa kwenye ukurasa wa Ripoti.'],
]

export default function AdminDashboard() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const { toast } = useToast()
  const [kpi, setKpi] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [guideOpen, setGuideOpen] = useState(true)

  const load = () => {
    setLoading(true)
    setErr(null)
    fetchKpi()
      .then((d) => setKpi(d))
      .catch((e) => setErr(e.message ?? String(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let alive = true
    fetchKpi()
      .then((d) => alive && setKpi(d))
      .catch((e) => alive && setErr(e.message ?? String(e)))
      .finally(() => alive && setLoading(false))
    const off = onStatsChange(() => {
      fetchKpi()
        .then((d) => alive && setKpi(d))
        .catch((e) => alive && setErr(e.message ?? String(e)))
    })
    return () => { alive = false; off() }
  }, [])

  const onCsv = async (type, label) => {
    setExporting(true)
    try {
      await exportCsv(type, `oweru-${type}.csv`)
      toast(`${label} ${sw ? 'imepakuliwa' : 'exported'}`, 'success')
    } catch (e) {
      const msg = e.message ?? String(e)
      setErr(msg)
      toast(msg, 'error')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <AdminGridSkeleton cards={6} message={sw ? 'Inapakia dashboard...' : 'Loading dashboard...'} />
  }

  const donors = kpi?.donors || {}
  const donations = kpi?.donations || {}
  const fulfilment = kpi?.fulfilment || {}
  const attention = kpi?.attention || {}
  const trend = kpi?.charts?.trend_30d || { labels: [], values: [] }
  const byStatus = kpi?.charts?.by_status || []
  const topRequests = kpi?.charts?.top_requests || []

  const statCards = [
    { key: 'raised', icon: 'wallet', tone: 'green', label: sw ? 'Zilizochangwa' : 'Total Raised', value: money(donations.total), sub: `${donations.count} ${sw ? 'michango' : 'donations'}`, to: '/portal/donations' },
    { key: 'donors', icon: 'users', tone: 'blue', label: sw ? 'Wafadhili' : 'Donors', value: String(donors.total ?? 0), sub: `${donors.repeat ?? 0} ${sw ? 'wanarudia' : 'repeat'} (${donors.retention_rate ?? 0}%)`, to: '/portal/donations' },
    { key: 'fulfilment', icon: 'truck', tone: 'gold', label: sw ? 'Kiwango cha Utekelezaji' : 'Fulfilment Rate', value: `${fulfilment.fulfilment_rate ?? 0}%`, sub: `${fulfilment.items_fulfilled ?? 0}/${fulfilment.items_total ?? 0} ${sw ? 'vifaa vimetolewa' : 'items delivered'}`, to: '/portal/equipment' },
    { key: 'last30', icon: 'newcampaign', tone: 'oweru', label: sw ? 'Siku 30 zilizopita' : 'Last 30 Days', value: `${donations.last_30d_count ?? 0}`, sub: money(donations.last_30d_total), to: '/portal/donations' },
    { key: 'avg', icon: 'zap', tone: 'gold', label: sw ? 'Mchango wa wastani' : 'Avg Donation', value: money(donations.avg), to: '/portal/donations' },
    { key: 'funding', icon: 'clock', tone: 'ink', label: sw ? 'Siku za ufadhili' : 'Avg Days to Close', value: kpi?.funding?.avg_days_to_close != null ? String(kpi.funding.avg_days_to_close) : '—', sub: sw ? 'siku kwa ombi' : 'days per request', to: '/portal/requests?status=published' },
  ]

  const toneMap = {
    green: 'bg-success-50 text-success-700',
    blue: 'bg-info-50 text-info-700',
    gold: 'bg-gold-50 text-gold-700',
    oweru: 'bg-oweru-50 text-oweru-700',
    ink: 'bg-ink-100 text-ink-700',
  }

  const max = Math.max(4, ...trend.values)
  const W = 620
  const H = 210
  const pad = { l: 34, r: 10, t: 16, b: 24 }
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b
  const n = trend.values.length
  const step = n > 1 ? iw / (n - 1) : iw
  const pts = trend.values.map((v, i) => [pad.l + i * step, pad.t + ih - (v / max) * ih])
  const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = line + ` L${(pad.l + iw).toFixed(1)} ${(pad.t + ih).toFixed(1)} L${pad.l} ${(pad.t + ih).toFixed(1)} Z`
  const xTickIdx = []
  for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 6))) xTickIdx.push(i)
  if (xTickIdx[xTickIdx.length - 1] !== n - 1) xTickIdx.push(n - 1)

  const statusTotal = byStatus.reduce((s, d) => s + d.count, 0)
  const CIRC = 2 * Math.PI * 44

  const needs = [
    { n: attention.pending_endorsements ?? 0, label: sw ? 'Idhini za kanisa' : 'Church endorsements', to: '/portal/requests', icon: 'verify' },
    { n: attention.pending_quotes ?? 0, label: sw ? 'Makadirio ya wauzaji' : 'Supplier quotes', to: '/portal/quotes', icon: 'doc' },
    { n: attention.overdue_reports ?? 0, label: sw ? 'Ripoti zilizochelewa' : 'Overdue reports', to: '/portal/reports', icon: 'chart' },
    { n: attention.open_followups ?? 0, label: sw ? 'Kazi za kufuatilia' : 'Open follow-ups', to: '/portal/reports', icon: 'clock' },
    { n: attention.drafts ?? 0, label: sw ? 'Rasimu za maombi' : 'Draft requests', to: '/portal/requests', icon: 'doc' },
  ].filter((a) => a.n > 0)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{sw ? 'Dashboard' : 'Dashboard'}</h1>
          <p className="text-sm text-ink-500">{sw ? 'Muhtasari wa ufadhili na utekelezaji.' : 'Funding and fulfilment at a glance.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCsv('donations', sw ? 'Michango' : 'Donations')}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
          >
            <Icon name="download" className="h-3.5 w-3.5" /> {sw ? 'Michango CSV' : 'Donations CSV'}
          </button>
          <button
            onClick={() => onCsv('requests', sw ? 'Maombi' : 'Requests')}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
          >
            <Icon name="download" className="h-3.5 w-3.5" /> {sw ? 'Maombi CSV' : 'Requests CSV'}
          </button>
        </div>
      </div>

      {err && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700">
          <span>{err}</span>
          <button
            onClick={load}
            className="rounded border border-error-200 bg-white px-2 py-1 text-xs font-semibold text-error-700 hover:bg-error-100"
          >
            {sw ? 'Jaribu tena' : 'Retry'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((c) => (
          <a
            key={c.key}
            href={c.to}
            className="group relative card-base p-4 transition hover:border-oweru-200"
          >
            <div className={'mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ' + (toneMap[c.tone] || toneMap.ink)}>
              <Icon name={c.icon} className="h-4 w-4" />
            </div>
            <div className="text-lg font-bold tabular-nums tracking-tight text-ink-900 truncate">{c.value}</div>
            <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">{c.label}</div>
            {c.sub && <div className="mt-0.5 text-[11px] text-ink-400">{c.sub}</div>}
            <span className="absolute right-3 top-3 text-ink-300 opacity-0 transition group-hover:opacity-100">→</span>
          </a>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <section className="card-base p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-ink-900">{sw ? 'Michango — siku 30 zilizopita' : 'Donations — last 30 days'}</h2>
                <p className="text-xs text-ink-500">{sw ? 'Idadi ya michango iliyothibitishwa kwa siku.' : 'Confirmed donation count per day.'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-success-50 px-3 py-1 text-xs font-bold text-success-700">{donations.last_30d_count ?? 0}</span>
                <a href="/portal/donations" className="text-xs font-semibold text-oweru-700 hover:underline">{sw ? 'Tazama yote' : 'View all'} →</a>
              </div>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="30 day donation trend">
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_LINE} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={CHART_LINE} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[0, 0.5, 1].map((f) => (
                <line key={f} x1={pad.l} x2={pad.l + iw} y1={pad.t + ih * f} y2={pad.t + ih * f} stroke="var(--color-ink-100)" strokeWidth="1" />
              ))}
              {[0, 0.5, 1].map((f, i) => (
                <text key={i} x={pad.l - 6} y={pad.t + ih * f + 4} textAnchor="end" fontSize="10" fill="var(--color-ink-400)">
                  {Math.round(max * (1 - f))}
                </text>
              ))}
              <path d={area} fill="url(#trendFill)" />
              <path d={line} fill="none" stroke={CHART_LINE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r={trend.values[i] > 0 ? 2.4 : 1.1} fill={CHART_LINE}>
                  <title>{`${trend.labels[i]}: ${trend.values[i]}`}</title>
                </circle>
              ))}
              {xTickIdx.map((i) => (
                <text key={i} x={pts[i][0]} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--color-ink-400)">
                  {String(trend.labels[i] || '').slice(5)}
                </text>
              ))}
            </svg>
          </section>

          <section className="card-base p-5">
            <h2 className="mb-1 text-base font-semibold tracking-tight text-ink-900">{sw ? 'Maombi yanayoendelea kwa ufadhili' : 'Top fundable items'}</h2>
            <p className="mb-4 text-xs text-ink-500">{sw ? 'Vifaa vilivyochangishwa zaidi dhidi ya lengo.' : 'Most-funded items against target.'}</p>
            <div className="space-y-4">
              {topRequests.map((t) => {
                const pct = t.target > 0 ? Math.min(100, Math.round((t.raised / t.target) * 100)) : 0
                const full = t.target > 0 && t.raised >= t.target
                return (
                  <a
                    key={t.request_id + '-' + t.item_name}
                    href={'/requests/' + t.request_id}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg p-1 hover:bg-ink-50"
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold text-oweru-700 hover:underline">{t.title || t.item_name}</div>
                        <div className="truncate text-[11px] text-ink-400">{t.item_name}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={'text-xs font-bold tabular-nums ' + (full ? 'text-success-700' : 'text-ink-700')}>
                          {money(t.raised)}
                        </span>
                        <span className="text-[11px] text-ink-400"> / {money(t.target)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                        <div
                          className={'h-full rounded-full ' + (full ? 'bg-success-500' : pct >= 50 ? 'bg-gold-500' : 'bg-info-500')}
                          style={{ width: pct + '%' }}
                        />
                      </div>
                      <span className="w-10 text-right text-[11px] font-bold tabular-nums text-ink-500">{pct}%</span>
                    </div>
                  </a>
                )
              })}
              {topRequests.length === 0 && (
                <div className="py-8 text-center text-sm text-ink-500">{sw ? 'Hakuna ufadhili bado.' : 'No funding yet.'}</div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card-base p-5">
            <h2 className="mb-1 text-base font-semibold tracking-tight text-ink-900">{sw ? 'Michango kwa hali' : 'Donations by status'}</h2>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs text-ink-500">{sw ? 'Mgawanyo wa jumla ya michango.' : 'Share of total donations.'}</p>
              <a href="/portal/donations" className="shrink-0 text-xs font-semibold text-oweru-700 hover:underline">{sw ? 'Tazama yote' : 'View all'} →</a>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative h-32 w-32 shrink-0">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="44" fill="none" stroke="var(--color-ink-100)" strokeWidth="14" />
                  {(() => {
                    let acc = 0
                    return byStatus.map((s, i) => {
                      const frac = statusTotal > 0 ? s.count / statusTotal : 0
                      const off = acc * CIRC
                      acc += frac
                      const len = frac * CIRC
                      return (
                        <circle
                          key={i}
                          cx="60"
                          cy="60"
                          r="44"
                          fill="none"
                          stroke={STATUS_COLORS[s.status] || 'var(--color-ink-500)'}
                          strokeWidth="14"
                          strokeDasharray={`${Math.max(0.5, len)} ${Math.max(0.5, CIRC - len)}`}
                          strokeDashoffset={-off}
                          strokeLinecap="butt"
                        >
                          <title>{`${STATUS_LABEL(sw)[s.status] || s.status}: ${s.count}`}</title>
                        </circle>
                      )
                    })
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-bold tabular-nums text-ink-900">{statusTotal}</div>
                    <div className="text-[10px] uppercase tracking-wide text-ink-400">{sw ? 'jumla' : 'total'}</div>
                  </div>
                </div>
              </div>
              <ul className="min-w-0 flex-1 space-y-2">
                {byStatus.map((s) => (
                  <li key={s.status} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-ink-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[s.status] || 'var(--color-ink-500)' }} />
                      {STATUS_LABEL(sw)[s.status] || s.status}
                    </span>
                    <span className="font-bold tabular-nums text-ink-800">{s.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {needs.length > 0 && (
            <section className="rounded-[14px] border border-gold-200 bg-gold-50 p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-800">
                <Icon name="alert" className="h-4 w-4" /> {sw ? 'Inahitaji uangalizi' : 'Needs attention'}
              </div>
              <div className="space-y-2">
                {needs.map((a) => (
                  <a key={a.label} href={a.to} className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-ink-700 hover:bg-white hover:underline">
                    <Icon name={a.icon} className="h-4 w-4 text-gold-600" />
                    <span className="font-semibold text-ink-900">{a.n}</span>
                    {a.label}
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="card-base p-5">
            <button
              onClick={() => setGuideOpen(!guideOpen)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <h2 className="text-base font-semibold tracking-tight text-ink-900">{sw ? 'Jinsi OWERU inavyofanya kazi' : 'How OWERU works'}</h2>
              <span className="text-ink-400">{guideOpen ? '−' : '+'}</span>
            </button>
            {guideOpen && (
              <div className="mt-3 space-y-3">
                {(sw ? SW_STEPS : EN_STEPS).map(([icon, title, body], i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-oweru-50 text-oweru-700 flex items-center justify-center">
                      <Icon name={icon} className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-ink-800">{title}</div>
                      <p className="text-[11px] leading-relaxed text-ink-500">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}