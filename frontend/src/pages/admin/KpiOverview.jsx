import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import { fetchKpi } from '../../api'
import { money } from '../../api'
import Button from '../../components/Button'
import { Icon } from '../../components/icons'

export default function KpiOverview() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const [kpi, setKpi] = useState(null)
  const [ac, setAc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const d = await fetchKpi()
        if (!alive) return
        setKpi(d)
        setAc(d.needs_attention ?? [])
      } catch (e) {
        if (alive) setErr(e.message ?? String(e))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const onCsv = async (label) => {
    setExporting(true)
    try {
      const m = await import('../../api')
      await m.exportCsv(label)
    } catch (e) {
      setErr(e.message ?? String(e))
    } finally {
      setExporting(false)
    }
  }

  const k = {
    total: kpi?.total_requests ?? 0,
    approved: kpi?.approved ?? 0,
    pending: kpi?.pending ?? 0,
    students: kpi?.students ?? 0,
    funded: kpi?.funded ?? 0,
    raised: kpi?.raised ?? 0,
  }

  const cards = [
    { label: sw ? 'Maombi yote' : 'Total requests', value: String(k.total), icon: 'file', tone: 'ink', sub: sw ? 'jumla' : 'all' },
    { label: sw ? 'Yaliyoidhinishwa' : 'Approved', value: String(k.approved), icon: 'check', tone: 'green', sub: sw ? 'tayari' : 'done' },
    { label: sw ? 'Yanasubiri' : 'Pending', value: String(k.pending), icon: 'clock', tone: 'gold', sub: sw ? 'hadharani' : 'live' },
    { label: sw ? 'Wanafunzi' : 'Students', value: String(k.students), icon: 'users', tone: 'blue', sub: sw ? 'wenye wasifu' : 'profiled' },
    { label: sw ? 'Yaliyofadhiliwa' : 'Funded', value: String(k.funded), icon: 'hand', tone: 'gold', sub: sw ? 'wakati wote' : 'all-time' },
    { label: sw ? 'Zilizochangwa' : 'Raised', value: money(k.raised), icon: 'coins', tone: 'green', sub: sw ? 'kwa jumla' : 'total' },
  ]

  const attention = [
    { n: kpi?.needs_attention?.pending_endorsements ?? 0, label: sw ? 'Idhini za kanisa' : 'Church endorsements', to: '/portal/requests' },
    { n: kpi?.needs_attention?.pending_quotes ?? 0, label: sw ? 'Makadirio ya wauzaji' : 'Supplier quotes', to: '/portal/quotes' },
    { n: kpi?.needs_attention?.overdue_reports ?? 0, label: sw ? 'Ripoti zilizochelewa' : 'Overdue reports', to: '/portal/reports' },
  ]
  const real = attention.filter((a) => a.n > 0)

  return (
    <section className="card-base p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="eyebrow">{sw ? 'Muhtasari' : 'Overview'}</span>
          <h2 className="mt-3 text-lg text-ink-900">
            {sw ? 'Viashara vya Utendaji' : 'Key performance indicators'}
          </h2>
          <p className="mt-0.5 text-[0.8125rem] text-ink-500">{sw ? 'Tazama kasi ya ufadhili' : 'Live funding and fulfilment'}</p>
        </div>
        <Button size="sm" variant="outline" disabled={exporting} onClick={() => onCsv('requests')}>
          <Icon name="download" className="h-3.5 w-3.5" />
          CSV
        </Button>
      </div>

      {loading ? (
        <div className="py-6 text-sm text-ink-500">{sw ? 'Inapakia…' : 'Loading…'}</div>
      ) : err ? (
        <div className="rounded-[14px] border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">{err}</div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {cards.map((c) => (
              <div key={c.label} className="rounded-[10px] border border-ink-200 bg-paper p-3.5">
                <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-[8px] bg-oweru-50 text-oweru-700">
                  <Icon name={c.icon} className="h-3.5 w-3.5" />
                </div>
                <div className="text-lg font-semibold tracking-tight text-ink-900">{c.value}</div>
                <div className="mt-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-500">{c.label}</div>
                {c.sub && <div className="mt-0.5 text-[0.6875rem] text-ink-400">{c.sub}</div>}
              </div>
            ))}
          </div>

          {real.length > 0 && (
            <div className="mt-4 rounded-[14px] border border-gold-200 bg-gold-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-gold-800">
                <Icon name="alert" className="h-3.5 w-3.5" />
                {sw ? 'Inahitaji uangalizi' : 'Needs attention'}
              </div>
              <div className="flex flex-col gap-2">
                {real.map((a) => (
                  <a key={a.label} href={a.to} className="flex items-center gap-2 text-sm text-oweru-700 hover:underline">
                    <span className="font-semibold tabular-nums">{a.n}</span>
                    {a.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
