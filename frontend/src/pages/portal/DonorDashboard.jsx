import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMyDonations, fetchDonorDashboard, money } from '../../api'
import { useI18n } from '../../i18n'
import StatusBadge from '../admin/StatusBadge'
import { SimplePageSkeleton } from '../../components/LoadingSpinner'
import { Bars, Donut, Legend } from '../../components/Charts'
import { PortalHeader, StatCard, EmptyState } from '../../components/PortalUi'

const STATUS_COLORS = {
  confirmed: 'var(--color-success-500)',
  pending: 'var(--color-warning-500)',
  failed: 'var(--color-error-500)',
  cancelled: 'var(--color-error-500)',
  expired: 'var(--color-error-500)',
  other: 'var(--color-ink-500)',
}

export default function DonorDashboard() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const [summary, setSummary] = useState(null)
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([
      fetchDonorDashboard().catch(() => null),
      fetchMyDonations().catch(() => []),
    ])
      .then(([s, d]) => {
        if (!alive) return
        setSummary(s)
        setDonations(d)
      })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const confirmed = donations.filter((d) => d.statusRaw === 'confirmed')
  const total = summary ? Number(summary.confirmed_total || 0) : confirmed.reduce((s, d) => s + d.amount, 0)

  const donutData = (summary?.by_status || []).map((s) => ({
    label: sw ? { confirmed: 'Imethibitishwa', pending: 'Inasubiri', failed: 'Imeshindwa' }[s.status] || s.status : s.status,
    value: Number(s.count || 0),
    color: STATUS_COLORS[s.status] || STATUS_COLORS.other,
  }))

  const trend = summary?.trend_30d || { labels: [], values: [] }
  const hasTrend = (trend.values || []).some((v) => Number(v) > 0)

  return (
    <div className="donor-dashboard min-h-screen bg-paper">
      <PortalHeader
        title={sw ? 'Msaada wangu' : 'My giving'}
        subtitle={sw ? 'Michango yako kwa OWERU' : 'Your OWERU contributions'}
        action={
          <Link to="/requests#causes" className="btn-on-dark btn-sm">
            {sw ? 'Tafuta ombi' : 'Find a request'}
          </Link>
        }
      />

      <main className="container-responsive py-8">
        {loading ? (
          <SimplePageSkeleton message={sw ? 'Inapakia...' : 'Loading...'} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard icon="list" label={sw ? 'Michango yote' : 'All donations'} value={donations.length} tone="oweru" />
              <StatCard icon="check" label={sw ? 'Imethibitishwa' : 'Confirmed'} value={summary ? summary.confirmed_count : confirmed.length} tone="green" />
              <StatCard icon="coins" label={sw ? 'Jumla iliyothibitishwa' : 'Confirmed total'} tone="gold">
                <div className="font-display text-2xl font-semibold leading-tight text-ink-900">{money(total)}</div>
              </StatCard>
              <StatCard icon="heart" label={sw ? 'Maombi uliyofadhili' : 'Requests you funded'} value={summary ? summary.requests_funded : '—'} tone="red" />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="card-base p-5 md:p-6">
                <div>
                  <span className="eyebrow">{sw ? 'Michango yangu' : 'My donations'}</span>
                  <h2 className="mt-3 text-lg text-ink-900">{sw ? 'Michango ya siku 30 zilizopita' : 'Last 30 days'}</h2>
                </div>
                <div className="mt-5">
                  {hasTrend ? (
                    <Bars labels={trend.labels} values={trend.values} height={130} unit={sw ? ' michango' : ' donations'} />
                  ) : (
                    <div className="empty-state py-10 text-center text-sm text-ink-500">
                      {sw ? 'Hakuna michango ya wiki 4 zilizopita bado.' : 'No donations in the last 4 weeks yet.'}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-ink-500">{sw ? 'Wima = idadi ya michango iliyothibitishwa kwa siku.' : 'Each bar is a day; height = confirmed donations that day.'}</p>
              </div>

              <div className="card-base p-5 md:p-6">
                <div>
                  <span className="eyebrow">{sw ? 'Michango kwa hali' : 'Donations by status'}</span>
                  <h2 className="mt-3 text-lg text-ink-900">{sw ? 'Mchango wako unavyotumika' : 'Where your giving stands'}</h2>
                </div>
                {donutData.length ? (
                  <div className="mt-2 flex flex-col items-center gap-2 sm:flex-row sm:gap-6">
                    <Donut data={donutData} center={<span className="text-xl font-bold text-ink-900">{donations.length}</span>} />
                    <Legend items={donutData.filter((d) => d.value > 0)} />
                  </div>
                ) : (
                  <div className="empty-state mt-4 py-10 text-center text-sm text-ink-500">
                    {sw ? 'Bado huna michango.' : 'No donations yet.'}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <section className="card-base mt-8 overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-ink-200 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">{sw ? 'Historia' : 'History'}</span>
              <h2 className="mt-3 text-xl text-ink-900">{sw ? 'Michango yako' : 'Your donations'}</h2>
            </div>
            <p className="text-sm text-ink-500">{sw ? 'Hii ni hiari; bado unaweza kuchangia bila akaunti.' : 'Optional account view; you can still donate as a guest.'}</p>
          </div>
          {loading ? <SimplePageSkeleton message={sw ? 'Inapakia...' : 'Loading...'} /> : donations.length === 0 ? (
            <div className="p-10">
              <EmptyState icon="heart" title={sw ? 'Bado huna michango.' : 'No donations yet.'}
                sub={sw ? 'Chagua ombi unalotaka kusaidia, au acha utaajili wa kipekee.' : 'Pick a request to support, or stay as a guest.'}
                action={<Link to="/requests#causes" className="btn-forest">{sw ? 'Vinjari maombi' : 'Browse requests'}</Link>} />
            </div>
          ) : (
            <div className="divide-y divide-ink-200">
              {donations.map((donation) => (
                <div key={donation.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold text-ink-900">{donation.item || (sw ? 'Mchango wa OWERU' : 'OWERU donation')}</div>
                    {donation.requestTitle && (
                      <div className="mt-1 text-sm text-ink-600">
                        {sw ? 'Ombi' : 'Request'}:{' '}
                        <Link to={`/requests/${donation.requestId}`} className="font-semibold text-oweru-700 underline decoration-dotted underline-offset-2 hover:text-oweru-900">
                          {donation.requestTitle}
                        </Link>
                        <span className="ml-2 text-ink-400">·</span> <StatusBadge status={donation.requestStatus} />
                      </div>
                    )}
                    <div className="mt-1 text-sm text-ink-500">{money(donation.amount)} · {donation.date || '—'} · {donation.ref}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={donation.status} />
                    {donation.receipt && <span className="text-xs font-semibold text-ink-500">{sw ? 'Risiti' : 'Receipt'}: {donation.receipt}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}