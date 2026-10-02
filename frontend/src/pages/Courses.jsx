import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { fetchRequests, money } from '../api'
import { Icon } from '../components/icons'
import ProgressBar from '../components/ProgressBar'
import { AdminGridSkeleton } from '../components/LoadingSpinner'
import { usePageMeta } from '../hooks/usePageMeta'
import { Container, Section } from '../components/ui'
import { isFullyFunded } from '../utils/funding'
import { requestImage } from '../utils/requestImages'

const PHONE = '+255744528913'
const PHONE_TEXT = '+255 744 528 913'

const CATEGORY_ICON = {
  Medical: 'heart',
  Education: 'book',
  Church: 'building',
  Community: 'users',
  Transport: 'truck',
  Livelihood: 'wallet',
  Other: 'users',
}

const CATEGORY_LABEL_SW = {
  Medical: 'Afya',
  Education: 'Elimu',
  Church: 'Kanisa',
  Community: 'Jamii',
  Transport: 'Usafiri',
  Livelihood: 'Maendeleo ya kujitegemea',
  Other: 'Nyingine',
}

const titleCase = (s = '') => String(s).replace(/\b[a-z]/g, (c) => c.toUpperCase())

const MAX_CARDS = 6

export default function Courses() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  usePageMeta({
    title: sw ? 'Miradi Inayohitaji Msaada | OWERU Foundation' : 'Causes Needing Your Support | OWERU Foundation',
    description: sw
      ? 'Miradi iliyoidhinishwa inayohitaji msaada wako. Chunguza kila ombi na changie kifaa mahususi.'
      : 'Verified requests that need your support. Explore each cause and fund a specific item.',
    url: '/requests',
  })

  useEffect(() => {
    let alive = true
    fetchRequests()
      .then((r) => {
        if (!alive) return
        const list = Array.isArray(r) ? r : []
        // Trending first: most confirmed donors wins, then closest to its target,
        // then most raised. Stable so equal-scoring cards keep API order.
        const trending = [...list].sort((a, b) => {
          const donors = (b.donors || 0) - (a.donors || 0)
          if (donors) return donors
          const pct = (x) => (x.target ? x.raised / x.target : 0)
          const byPct = pct(b) - pct(a)
          if (byPct) return byPct
          return (b.raised || 0) - (a.raised || 0)
        })
        setAll(trending)
      })
      .catch(() => { if (alive) setAll([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const categories = [...new Set(all.map((request) => request.category).filter(Boolean))].sort()
  const filtered = all.filter((request) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || `${request.title} ${request.swTitle} ${request.story} ${request.swStory} ${request.region}`.toLowerCase().includes(term)
    return matchesSearch && (category === 'all' || request.category === category)
  })

  return (
    <>
      <section id="causes" className="relative overflow-hidden bg-oweru-950 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-[center_42%]"
          style={{ backgroundImage: "url('/photos/hero/hero-tanzania-school-festival.jpg')" }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-oweru-950/95 via-oweru-950/78 to-oweru-950/35" />
        <Container className="relative grid min-h-[340px] items-end gap-10 py-12 sm:min-h-[400px] sm:py-16 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="max-w-3xl">
            <nav aria-label={sw ? 'Unapopatikana' : 'Breadcrumb'} className="mb-7 flex items-center gap-2 text-xs text-white/65">
              <Link to="/" className="transition-colors hover:text-white">{sw ? 'Mwanzo' : 'Home'}</Link>
              <span aria-hidden="true">/</span>
              <span className="text-white">{sw ? 'Mahitaji' : 'Causes'}</span>
            </nav>
            <span className="eyebrow eyebrow-on-dark">{sw ? 'MAHITAJI YALIYOKAGULIWA' : 'VERIFIED COMMUNITY NEEDS'}</span>
            <h1 className="display-lg mt-4 max-w-[16ch] text-balance text-white">
              {sw ? 'Gundua hitaji. Changia kifaa.' : 'Find a need. Fund one item.'}
            </h1>
            <p className="mt-4 max-w-2xl text-[1rem] leading-relaxed text-white/80 sm:text-[1.0625rem]">
              {sw
                ? 'Kila ombi linaonyesha lengo lake, michango iliyopokelewa na kifaa kitakachofadhiliwa.'
                : 'See the exact item, its funding goal, and confirmed support before you give.'}
            </p>
            <a href="#request-list" className="btn-primary mt-7">
              {sw ? 'Chunguza mahitaji' : 'Explore open requests'}
              <Icon name="chevron" className="h-4 w-4" />
            </a>
          </div>

          <div className="border-l border-white/30 pl-5 lg:mb-2">
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-gold-300 uppercase">
              {sw ? 'MAHITAJI YALIYO WAZI' : 'OPEN REQUESTS'}
            </p>
            <p className="mt-2 font-display text-4xl text-white tabular-nums">{loading ? '—' : all.length}</p>
            <p className="mt-2 max-w-[25ch] text-sm leading-relaxed text-white/70">
              {sw ? 'Msaada unaelekezwa kwa vifaa vilivyoidhinishwa, si fedha taslimu.' : 'Your support goes to approved items, never cash grants.'}
            </p>
          </div>
        </Container>
      </section>

      {/* ===== Cause cards in one section below the hero ===== */}
      <Section tone="white" size="small">
        <Container>
            {loading ? (
              <AdminGridSkeleton cards={6} message={sw ? 'Inapakia mahitaji…' : 'Loading causes…'} />
            ) : all.length === 0 ? (
              <div className="empty-state px-6 py-16 text-center">
                <Icon name="package" className="mx-auto h-6 w-6 text-ink-300" />
                <p className="mt-4 font-medium text-ink-800">
                  {sw ? 'Hakuna mahitaji yaliyo wazi kwa sasa.' : 'No open causes right now.'}
                </p>
              </div>
            ) : (
              <>
              <div id="request-list" className="mb-7 border-y border-ink-200 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-ink-900">{sw ? 'Chunguza mahitaji' : 'Browse requests'}</h2>
                    <p className="mt-1 text-sm text-ink-500">
                      {sw ? `Inaonyesha mahitaji ${filtered.length} kati ya ${all.length}` : `Showing ${filtered.length} of ${all.length} requests`}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[minmax(14rem,1fr)_12rem] lg:w-[31rem]">
                    <label className="relative">
                      <span className="sr-only">{sw ? 'Tafuta mahitaji' : 'Search requests'}</span>
                      <Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={sw ? 'Tafuta kifaa au jamii' : 'Search items or communities'}
                        className="input-base pl-10"
                      />
                    </label>
                    <label>
                      <span className="sr-only">{sw ? 'Chuja kwa aina ya hitaji' : 'Filter by category'}</span>
                      <select value={category} onChange={(event) => setCategory(event.target.value)} className="input-base">
                        <option value="all">{sw ? 'Aina zote' : 'All categories'}</option>
                        {categories.map((option) => <option key={option} value={option}>{sw ? CATEGORY_LABEL_SW[option] || titleCase(option) : titleCase(option)}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="border-y border-dashed border-ink-300 px-6 py-14 text-center">
                  <Icon name="search" className="mx-auto h-6 w-6 text-ink-300" />
                  <p className="mt-4 font-semibold text-ink-800">{sw ? 'Hakuna hitaji linalolingana na utafutaji wako.' : 'No requests match your search.'}</p>
                  <button type="button" onClick={() => { setSearch(''); setCategory('all') }} className="btn-secondary mt-5">
                    {sw ? 'Ondoa vichujio' : 'Clear filters'}
                  </button>
                </div>
              ) : (
              <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {(showAll ? filtered : filtered.slice(0, MAX_CARDS)).map((req) => {
                  const pct = req.target ? Math.min(100, Math.round((req.raised / req.target) * 100)) : 0
                  const funded = isFullyFunded(req)
                  const blurb = (sw ? req.swStory || req.story : req.story) || ''

                  return (
                    <article
                      key={req.id}
                      className="group flex flex-col overflow-hidden rounded-[12px] border border-ink-100 bg-white text-center shadow-[0_4px_15px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(14,59,46,0.10)]"
                    >
                      <Link
                        to={`/requests/${req.id}`}
                        state={{ request: req }}
                        onMouseEnter={() => import('../pages/FundingDetails')}
                        className="relative block h-[200px] overflow-hidden bg-ink-50"
                      >
                        <img
                          src={requestImage((req.swTitle || req.title || 'equipment') + ' africa', 800, req.id + '-r')}
                          alt={sw ? req.swTitle : req.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <span className="absolute top-3 left-3">
                          <span className={`chip ${funded ? 'chip-accent' : 'bg-white/95'}`}>
                            {funded ? (sw ? 'Lengo limefikiwa' : 'Funded') : `${pct}% ${sw ? 'imefikiwa' : 'funded'}`}
                          </span>
                        </span>
                      </Link>

                      <div className="flex flex-1 flex-col px-5 pt-5 pb-6">
                        <p className="flex items-center justify-center gap-1.5 text-[0.6875rem] font-semibold tracking-[0.1em] text-oweru-700 uppercase">
                          <Icon name={CATEGORY_ICON[req.category] || 'package'} className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {req.category === 'Other'
                              ? (sw ? 'Huduma kwa jamii' : 'Community outreach')
                              : sw ? CATEGORY_LABEL_SW[req.category] || titleCase(req.category) : titleCase(req.category)}
                          </span>
                        </p>

                        <h3 className="mt-2.5 line-clamp-2 text-[1.25rem] leading-snug font-semibold text-ink-900">
                          {sw ? req.swTitle : req.title}
                        </h3>

                        <p className="mt-2 line-clamp-2 min-h-[2.625rem] text-sm leading-relaxed text-ink-500">
                          {blurb}
                        </p>

                        <div className="mt-5">
                          <ProgressBar raised={req.raised} target={req.target} complete={funded} />
                          <div className="mt-2.5 flex items-baseline justify-between gap-3 text-sm">
                            <span className="font-semibold text-ink-900 tabular-nums">{money(req.raised)}</span>
                            <span className="text-ink-500 tabular-nums">{money(req.target)}</span>
                          </div>
                        </div>

                        {req.donors > 0 && (
                          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-500">
                            <Icon name="users" className="h-3.5 w-3.5 shrink-0 text-oweru-600" />
                            <span className="tabular-nums">
                              {req.donors} {sw ? 'wachangiaji' : req.donors === 1 ? 'donor' : 'donors'}
                            </span>
                          </p>
                        )}

                        <div className="mt-auto pt-5">
                          <Link
                            to={`/requests/${req.id}`}
                            state={{ request: req }}
                            onMouseEnter={() => import('../pages/FundingDetails')}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-oweru-700 transition-colors hover:text-oweru-900"
                          >
                            {sw ? 'Changia kifaa hiki' : 'Fund this item'}
                            <span aria-hidden="true">&rarr;</span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {filtered.length > MAX_CARDS && (
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    aria-expanded={showAll}
                    className="btn-secondary"
                  >
                    {showAll
                      ? (sw ? 'Onyesha mahitaji 6 ya kwanza' : 'Show 6 only')
                      : (sw
                        ? `Onyesha mahitaji yote (${filtered.length})`
                        : `View all ${filtered.length} causes`)}
                    <span aria-hidden="true">{showAll ? '↑' : '↓'}</span>
                  </button>
                </div>
              )}
              </>
              )}
              </>
            )}
        </Container>
      </Section>

      <section className="bg-gradient-to-br from-oweru-900 to-oweru-800 text-white">
        <Container className="flex flex-wrap items-center justify-between gap-8 py-14">
          <div className="max-w-[520px]">
            <h2 className="text-2xl font-bold text-balance sm:text-[2rem]">
              {sw ? 'Je, ungependa kusaidia hitaji fulani?' : 'Would you like to help meet a particular need?'}
            </h2>
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-white/85">
              {sw
                ? 'Kila mchango huelekezwa kwenye kifaa mahususi kilichoidhinishwa. Tuko tayari kukusaidia kuchagua namna ya kushiriki.'
                : 'Every gift goes to a specific, approved item. We are here to help you choose how you would like to give.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <a href={`tel:${PHONE}`} className="text-xl font-bold text-white hover:text-gold-400">
              {PHONE_TEXT}
            </a>
            <Link
              to="/requests#request-list"
              className="rounded-[6px] bg-white px-6 py-3 font-semibold text-oweru-800 transition-colors hover:bg-ink-50"
            >
              {sw ? 'Chunguza mahitaji' : 'View requests'}
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}
