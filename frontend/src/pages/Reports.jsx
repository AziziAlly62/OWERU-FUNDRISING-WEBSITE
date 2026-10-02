import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { fetchPublicReports } from '../api'
import { Icon } from '../components/icons'
import { usePageMeta } from '../hooks/usePageMeta'
import { Container } from '../components/ui'

/**
 * Reports & Stories.
 *
 * The page is written around a single story rather than a grid of many. There
 * is one report on record, and a grid built for a dozen would leave the page
 * looking empty Ã¢â‚¬â€ so the one story carries the page, and anything that arrives
 * later is appended underneath as a quiet list.
 *
 * The three verification checkpoints are the spine of the story, not a separate
 * explainer block: each step is marked done or pending from the reports that
 * actually exist, which keeps the page honest about how far along the work is.
 */

const titleCase = (s = '') => String(s || '').replace(/\b[a-z]/g, (c) => c.toUpperCase())
const categoryLabel = (category, sw) => {
  const labels = {
    medical: 'Afya',
    education: 'Elimu',
    church: 'Kanisa',
    community: 'Jamii',
    transport: 'Usafiri',
    livelihood: 'Maendeleo ya kujitegemea',
    other: 'Nyingine',
  }
  const value = String(category || '').toLowerCase()
  return sw ? labels[value] || titleCase(category) : titleCase(category)
}

const fmtDate = (dateString, sw) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return String(dateString).slice(0, 10)
  return d
    .toLocaleDateString(sw ? 'sw-TZ' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const TYPE = {
  delivery: { en: 'Delivery', sw: 'Uwasilishaji', tone: 'gold', icon: 'truck' },
  '30_day': { en: '30-day', sw: 'Siku 30', tone: 'forest', icon: 'calendar' },
  '90_day': { en: '90-day', sw: 'Siku 90', tone: 'success', icon: 'verify' },
  incident: { en: 'Incident', sw: 'Tukio', tone: 'ink', icon: 'alert' },
}

const TYPE_STYLE = {
  gold: 'border-gold-200 bg-gold-50 text-gold-800',
  forest: 'border-oweru-200 bg-oweru-50 text-oweru-800',
  success: 'border-success-200 bg-success-50 text-success-700',
  ink: 'border-ink-200 bg-ink-50 text-ink-700',
}

/* `reportType` is matched against a story's own reports to decide whether the
   step is already filed or still ahead. */
const STEPS = [
  {
    reportType: 'delivery',
    icon: 'truck',
    en: 'Delivery report',
    sw: 'Ripoti ya uwasilishaji',
  },
  {
    reportType: '30_day',
    icon: 'calendar',
    en: '30-day report',
    sw: 'Ripoti ya siku 30',
  },
  {
    reportType: '90_day',
    icon: 'clipboard',
    en: '90-day report',
    sw: 'Ripoti ya siku 90',
  },
]

export default function Reports() {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  usePageMeta({
    title: sw ? 'Ripoti za Athari | OWERU Foundation' : 'Impact Reports | OWERU Foundation',
    description: sw
      ? 'Taarifa za uwasilishaji na ufuatiliaji wa siku 30 na 90 baada ya kifaa kufika.'
      : 'Delivery updates and 30- and 90-day follow-ups after equipment arrives.',
  })

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [retry, setRetry] = useState(0)

  const retryLoad = () => {
    setLoading(true)
    setLoadError(false)
    setRetry((n) => n + 1)
  }

  useEffect(() => {
    let alive = true
    fetchPublicReports()
      .then((r) => {
        if (!alive) return
        setReports(Array.isArray(r) ? r : [])
        setLoadError(false)
      })
      .catch(() => {
        if (!alive) return
        setReports([])
        setLoadError(true)
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [retry])

  const featured = reports[0] || null
  const rest = reports.slice(1)

  /* A step is done when a report of that type exists for the same item. */
  const stepState = (item, reportType) =>
    reports.find((r) => r.type === reportType && (r.item || '') === (item || '')) || null

  return (
    <>
      <section className="border-b border-ink-200 bg-cream">
        <Container className="py-12 sm:py-16">
          <span className="eyebrow">{sw ? 'RIPOTI ZA UMMA' : 'PUBLIC IMPACT REPORTS'}</span>
          <h1 className="display-lg mt-4 max-w-3xl text-balance text-ink-900">
            {sw ? 'Msaada unapofika. Athari inapoonekana.' : 'When support arrives, the impact is recorded.'}
          </h1>
          <p className="lede mt-4 max-w-2xl text-pretty">
            {sw
              ? 'Soma taarifa za vifaa vilivyowasilishwa na ufuatiliaji wake. Kila hatua inaonekana baada ya kuripotiwa.'
              : 'Read updates on delivered equipment and follow-up. Each checkpoint appears when it has been reported.'}
          </p>
        </Container>
      </section>

      <section id="reports" className="bg-paper">
        <Container className="py-10 sm:py-14">
          {loading ? (
            <div className="grid animate-pulse gap-8 border-y border-ink-200 bg-white p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="min-h-52 bg-ink-100" />
              <div className="space-y-4 py-2">
                <div className="h-3 w-1/3 bg-ink-100" />
                <div className="h-8 w-3/4 bg-ink-100" />
                <div className="h-4 w-full bg-ink-100" />
                <div className="h-4 w-5/6 bg-ink-100" />
              </div>
            </div>
          ) : loadError ? (
            <div role="alert" className="border-y border-error-200 bg-white px-6 py-12 text-center sm:px-10">
              <Icon name="alert" className="mx-auto h-7 w-7 text-error-600" />
              <h2 className="mt-4 text-xl text-ink-900">
                {sw ? 'Ripoti hazikuweza kupakiwa.' : 'Reports could not be loaded.'}
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-600">
                {sw ? 'Tafadhali jaribu tena baada ya muda mfupi.' : 'Please try again in a moment.'}
              </p>
              <button type="button" onClick={retryLoad} className="btn-secondary mt-5">
                {sw ? 'Jaribu tena' : 'Try again'}
              </button>
            </div>
          ) : featured ? (
            <>
              <article className="grid overflow-hidden border-y border-ink-200 bg-white lg:grid-cols-[0.8fr_1.2fr]">
                <header className="flex flex-col justify-between bg-oweru-900 p-6 text-white sm:p-9">
                  <div>
                    <span className="eyebrow eyebrow-on-dark">{sw ? 'HADITHI YA HIVI KARIBUNI' : 'LATEST FIELD REPORT'}</span>
                    <span className={`mt-5 inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-semibold ${TYPE_STYLE[TYPE[featured.type]?.tone] || TYPE_STYLE.forest}`}>
                      <Icon name={TYPE[featured.type]?.icon || 'doc'} className="h-4 w-4" />
                      {sw ? TYPE[featured.type]?.sw : TYPE[featured.type]?.en}
                    </span>
                    <h2 className="mt-5 font-display text-3xl leading-tight text-white text-balance sm:text-4xl">
                      {(sw ? featured.swItem || featured.item : featured.item) || (sw ? 'Kifaa kilichowasilishwa' : 'Equipment delivered')}
                    </h2>
                  </div>
                  <dl className="mt-8 grid gap-4 border-t border-white/20 pt-5 text-sm sm:grid-cols-2">
                    {[
                          [sw ? 'Taasisi' : 'Facility', featured.church],
                      [sw ? 'Eneo' : 'Region', featured.region],
                      [sw ? 'Kategoria' : 'Category', categoryLabel(featured.category, sw)],
                      [sw ? 'Tarehe ya ripoti' : 'Report date', fmtDate(featured.submitted_at, sw)],
                    ].filter(([, value]) => value).map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-white/60">{label}</dt>
                        <dd className="mt-1 font-medium text-white">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </header>

                <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
                  <p className="eyebrow">{sw ? 'TAARIFA ILIYOTHIBITISHWA' : 'VERIFIED UPDATE'}</p>
                  <p className="mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-ink-700 sm:text-lg">
                    {featured.content}
                  </p>
                  {featured.publicEvidenceUrl && (
                    <figure className="mt-7 border border-ink-200 bg-paper p-2 sm:p-3">
                      <img
                        src={featured.publicEvidenceUrl}
                        alt={sw ? `Picha ya uthibitisho wa ${featured.item || 'kifaa kilichowasilishwa'}` : `Proof of delivery for ${featured.item || 'the delivered item'}`}
                        loading="lazy"
                        decoding="async"
                        className="max-h-[32rem] w-full bg-white object-contain"
                      />
                      <figcaption className="flex items-center gap-2 px-2 pt-3 text-xs leading-relaxed text-ink-500">
                        <Icon name="verify" className="h-4 w-4 shrink-0 text-success-700" />
                        {sw ? 'Picha hii imeidhinishwa kuonyeshwa hadharani.' : 'This image has been approved for public display.'}
                      </figcaption>
                    </figure>
                  )}
                  <p className="mt-8 flex items-start gap-2 border-t border-ink-200 pt-5 text-xs leading-relaxed text-ink-500">
                    <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-oweru-700" />
                    {sw
                      ? 'Taarifa binafsi za wafadhili na wanufaika hazionyeshwi hadharani.'
                      : 'Donor and recipient personal details are not published.'}
                  </p>
                </div>
              </article>

              <section className="mt-10 sm:mt-14" aria-labelledby="follow-up-title">
                <div className="flex flex-col gap-2 border-b border-ink-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <span className="eyebrow">{sw ? 'UFUATILIAJI' : 'FOLLOW-UP'}</span>
                    <h2 id="follow-up-title" className="mt-2 text-xl text-ink-900">
                      {sw ? 'Maendeleo ya kifaa hiki' : 'Follow-up for this item'}
                    </h2>
                  </div>
                  <p className="max-w-lg text-sm leading-relaxed text-ink-500">
                    {sw ? 'Hatua zilizokamilika huonyeshwa baada ya ripoti kuwasilishwa.' : 'A checkpoint is marked complete when its report is submitted.'}
                  </p>
                </div>
                <ol className="grid gap-0 sm:grid-cols-3">
                  {STEPS.map((step) => {
                    const report = stepState(featured.item, step.reportType)
                    return (
                      <li key={step.reportType} className="flex gap-4 border-b border-ink-200 py-5 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0">
                        <span className={`grid h-9 w-9 shrink-0 place-items-center ${report ? 'bg-success-50 text-success-700' : 'bg-ink-50 text-ink-400'}`}>
                          <Icon name={report ? 'check' : step.icon} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink-900">{sw ? step.sw : step.en}</p>
                          <p className={`mt-1 text-xs ${report ? 'text-success-700' : 'text-ink-500'}`}>
                            {report
                              ? fmtDate(report.submitted_at, sw)
                              : sw ? 'Inasubiri ripoti' : 'Awaiting report'}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </section>

              {rest.length > 0 && (
                <section className="mt-10 border-t border-ink-200 pt-8" aria-labelledby="more-reports-title">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <span className="eyebrow">{sw ? 'ARCHIVE' : 'ARCHIVE'}</span>
                      <h2 id="more-reports-title" className="mt-2 text-xl text-ink-900">
                        {sw ? 'Ripoti zilizotangulia' : 'Earlier reports'}
                      </h2>
                    </div>
                    <span className="text-sm tabular-nums text-ink-500">{rest.length}</span>
                  </div>
                  <ul className="mt-4 divide-y divide-ink-200 border-y border-ink-200">
                    {rest.map((report) => (
                      <li key={report.id}>
                        <button type="button" onClick={() => setOpen(report)} className="flex w-full flex-wrap items-center gap-3 py-4 text-left hover:bg-white">
                          <span className={`inline-flex shrink-0 items-center gap-2 border px-2.5 py-1 text-xs font-semibold ${TYPE_STYLE[TYPE[report.type]?.tone] || TYPE_STYLE.forest}`}>
                            <Icon name={TYPE[report.type]?.icon || 'doc'} className="h-3.5 w-3.5" />
                            {sw ? TYPE[report.type]?.sw : TYPE[report.type]?.en}
                          </span>
                          <span className="min-w-0 flex-1 font-medium text-ink-800">{(sw ? report.swItem || report.item : report.item) || (sw ? 'Kifaa kilichowasilishwa' : 'Equipment delivered')}</span>
                          <span className="text-xs tabular-nums text-ink-500">{fmtDate(report.submitted_at, sw)}</span>
                          <Icon name="arrow-right" className="h-4 w-4 text-oweru-700" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          ) : (
            <div className="border-y border-ink-200 bg-white px-6 py-12 sm:px-10">
              <span className="eyebrow">{sw ? 'RIPOTI ZA UMMA' : 'PUBLIC REPORTS'}</span>
              <h2 className="mt-3 text-2xl text-ink-900">
                {sw ? 'Ripoti ya kwanza bado haijachapishwa.' : 'The first public report is not published yet.'}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">
                {sw
                  ? 'Ripoti itaonekana baada ya kifaa kuwasilishwa na taarifa zake kuthibitishwa. Unaweza kuona maombi yanayoendelea au rekodi za fedha kwa sasa.'
                  : 'Reports appear after an item is delivered and its update is reviewed. In the meantime, browse open requests or check the public financial record.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/requests#causes" className="btn-primary">{sw ? 'Chunguza maombi' : 'Browse requests'}</Link>
                <Link to="/ledger" className="btn-secondary">{sw ? 'Fungua rejesta' : 'Open the ledger'}</Link>
              </div>
            </div>
          )}

          {!loading && !loadError && featured && (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-ink-200 pt-6">
              <p className="text-sm text-ink-500">
                {sw ? 'Angalia maombi yaliyoidhinishwa au rekodi ya matumizi ya fedha.' : 'Explore approved requests or review how funds moved.'}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/requests#causes" className="btn-forest btn-sm">{sw ? 'Maombi' : 'Requests'}</Link>
                <Link to="/ledger" className="btn-secondary btn-sm">{sw ? 'Rejesta ya Umma' : 'Public ledger'}</Link>
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* ---- Report detail ---- */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={sw ? 'Maelezo ya ripoti' : 'Report details'}
        >
          <div
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
            onClick={() => setOpen(null)}
            aria-hidden="true"
          />
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[14px] bg-white shadow-2xl animate-scale-in">
            <div className="flex items-start justify-between gap-4 border-b border-ink-200 p-6">
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.6875rem] font-bold ${
                    TYPE_STYLE[TYPE[open.type]?.tone] || TYPE_STYLE.forest
                  }`}
                >
                  <Icon name={TYPE[open.type]?.icon || 'doc'} className="h-3.5 w-3.5" />
                  {sw ? TYPE[open.type]?.sw : TYPE[open.type]?.en}
                </span>
                <h3 className="mt-3 text-lg text-ink-900 text-balance capitalize">
                  {(sw ? open.swItem || open.item : open.item) || (sw ? 'Kifaa kimewasilishwa' : 'Equipment delivered')}
                </h3>
                <p className="mt-1 text-xs text-ink-400 tabular-nums">{fmtDate(open.submitted_at, sw)}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-ink-200 text-ink-500 transition-colors hover:bg-ink-50"
                aria-label={sw ? 'Funga' : 'Close'}
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
                {[
                  [sw ? 'Kanda' : 'Region', titleCase(open.region)],
                  [sw ? 'Taasisi / Kanisa' : 'Facility / Church', titleCase(open.church)],
                  [sw ? 'Kategoria' : 'Category', categoryLabel(open.category, sw)],
                  [sw ? 'Tarehe' : 'Date', fmtDate(open.submitted_at, sw)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-ink-400">{label}</dt>
                    <dd className="mt-0.5 font-medium text-ink-800 capitalize">{value || '—'}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-6 border-t border-ink-200 pt-6 text-[0.9375rem] leading-relaxed text-ink-700">
                {open.content}
              </p>

              {open.publicEvidenceUrl && (
                <figure className="mt-6 border border-ink-200 bg-paper p-2">
                  <img
                    src={open.publicEvidenceUrl}
                    alt={sw ? `Picha ya uthibitisho wa ${open.item || 'kifaa kilichowasilishwa'}` : `Approved proof for ${open.item || 'the reported item'}`}
                    loading="lazy"
                    decoding="async"
                    className="max-h-[24rem] w-full bg-white object-contain"
                  />
                  <figcaption className="px-2 pt-2 text-xs text-ink-500">
                    {sw ? 'Picha ya uthibitisho iliyoidhinishwa.' : 'Approved proof image.'}
                  </figcaption>
                </figure>
              )}

              <p className="mt-6 rounded-[10px] bg-oweru-50 p-4 text-[0.8125rem] leading-relaxed text-ink-600">
                {sw
                  ? 'Ripoti hii imeunganishwa na ombi lililofadhiliwa kwenye Rejesta ya Umma. Taarifa za kibinafsi hazionyeshwi.'
                  : 'This report is linked to a funded request in the Public Ledger. Personal details are never shown.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 p-5">
              <Link to="/ledger" onClick={() => setOpen(null)} className="btn-secondary">
                {sw ? 'Rejesta ya Umma' : 'Public Ledger'}
              </Link>
              <button type="button" onClick={() => setOpen(null)} className="btn-ghost">
                {sw ? 'Funga' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
