import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { usePageMeta } from '../hooks/usePageMeta'
import useLiveOverview from '../useLiveOverview'
import { fetchRequests, money } from '../api'
import { requestImage } from '../utils/requestImages'
import { isFullyFunded } from '../utils/funding'
import { Container } from '../components/ui'
import { Icon } from '../components/icons'
import { CountUp } from '../components/PortalUi'
import HeroCarousel from '../components/HeroCarousel'

/* The homepage is a landing page only. Process explanation lives on
   /about, stories and impact reports on /reports, receipts and payment
   evidence on /ledger, and every request on /requests. Nothing from
   those pages is duplicated here.

   Hero photography is local to public/photos/hero so the foundation
   controls the assets. Swapping in OWERU's own photography means
   dropping files in that folder and editing the paths below.
   Licences: CC BY 2.0, CC BY-SA 4.0, US public domain (USAID). */
const HERO_SLIDES = [
  {
    src: '/photos/hero/hero-tanzania-school-festival.jpg',
    credit: 'Photo: Rasheedhrasheed, CC BY-SA 4.0',
    en: {
      eyebrow: 'Education and care for children',
      headline: 'The right school supplies can keep a child learning.',
      body: 'Books, desks, uniforms and learning materials, funded one verified item at a time.',
      cta: 'Fund school supplies',
      ctaTo: '/requests#causes',
      ctaAlt: 'Explore current needs',
      ctaAltTo: '/requests#causes',
    },
    sw: {
      eyebrow: 'Elimu na huduma kwa watoto',
      headline: 'Vifaa sahihi huwasaidia watoto kuendelea na masomo.',
      body: 'Vitabu, madawati, sare na vifaa vya kujifunzia hufadhiliwa kifaa kimoja kilichothibitishwa kwa wakati.',
      cta: 'Changia vifaa vya shule',
      ctaTo: '/requests#causes',
      ctaAlt: 'Chunguza mahitaji yaliyopo',
      ctaAltTo: '/requests#causes',
    },
  },
  {
    src: '/photos/hero/hero-tanzania-children.jpg',
    credit: 'Photo: USAID Africa Bureau, public domain',
    en: {
      eyebrow: 'Church and community life',
      headline: 'A new congregation needs a place to gather.',
      body: 'We help communities build village church halls: safe places to worship, learn and serve one another.',
      cta: 'Support a church hall',
      ctaTo: '/requests#causes',
      ctaAlt: 'Read impact reports',
      ctaAltTo: '/reports',
    },
    sw: {
      eyebrow: 'Kanisa na maisha ya jamii',
      headline: 'Kanisa jipya linahitaji mahali pa kukutanika.',
      body: 'Tunasaidia jamii kujenga kumbi za makanisa vijijini, mahali salama pa kuabudu, kujifunza na kuhudumiana.',
      cta: 'Saidia ujenzi wa ukumbi',
      ctaTo: '/requests#causes',
      ctaAlt: 'Soma taarifa za matokeo',
      ctaAltTo: '/reports',
    },
  },
]

function SectionHeading({ title, accent, lead }) {
  return (
    <div className="mx-auto max-w-[42rem] text-center">
      <h2 className="text-[1.5rem] font-extrabold leading-tight tracking-[-0.035em] text-ink-900 sm:text-[1.875rem]">
        {title}
        <span className="text-oweru-700">{accent}</span>
      </h2>
      {lead && <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-600">{lead}</p>}
    </div>
  )
}

/* All three land on the contact form, with the intent already chosen, so the
   card still says which kind of help it is about. */
const waysToHelp = (sw) => [
  {
    icon: 'users',
    key: 'volunteer',
    to: '/contact?intent=volunteer',
    title: sw ? 'Jitolee' : 'Volunteer',
    text: sw
      ? 'Tumia muda na ujuzi wako kusaidia elimu, ujenzi au huduma kwa jamii.'
      : 'Give your time and skills to education, construction, or community outreach.',
  },
  {
    icon: 'hand',
    key: 'partner',
    to: '/contact?intent=partner',
    title: sw ? 'Shirikiana nasi' : 'Partner with us',
    text: sw
      ? 'Kanisa, kampuni au kikundi chenu kinaweza kuunganisha nguvu kusaidia hitaji lililothibitishwa.'
      : 'Churches, companies and groups can join together to meet a verified need.',
  },
  {
    icon: 'package',
    key: 'goods',
    to: '/contact?intent=goods',
    title: sw ? 'Leta vifaa' : 'Donate goods',
    text: sw
      ? 'Vifaa ambavyo havitumiki tena vinaweza kusaidia huduma nyingine. Tuambie unachoweza kuchangia.'
      : 'Equipment you no longer use may serve another community. Tell us what you can contribute.',
  },
]

function CauseCard({ request, sw }) {
  const title = sw ? request.swTitle : request.title
  const raised = Number(request.raised || 0)
  const target = Number(request.target || 0)
  const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0
  const done = isFullyFunded(request)

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[14px] border border-ink-200 bg-white transition-[border-color,box-shadow] duration-200 hover:border-ink-300 hover:shadow-[var(--shadow-lift)]">
      <div className="ratio-16-10 relative overflow-hidden bg-ink-50">
        <img
          src={requestImage(request.category, 900, request.id)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute right-3 top-3 grid h-12 w-12 place-items-center rounded-full bg-oweru-700 text-center text-[0.625rem] font-bold leading-tight text-white shadow-[0_6px_18px_rgba(24,81,65,0.28)]">
          {done ? (
            <>{sw ? 'Kamili' : 'Done'}<br />100%</>
          ) : (
            <>{pct}%<br />{sw ? 'Imejaa' : 'Funded'}</>
          )}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          {request.category && (
            <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-600">
              {request.category}
            </span>
          )}
          {request.region && (
            <span className="truncate text-[0.75rem] text-ink-500">{request.region}</span>
          )}
        </div>

        <h3 className="mt-2 text-[1.0625rem] font-bold leading-snug tracking-[-0.02em] text-ink-900">
          {title}
        </h3>

        <p className="mt-2 line-clamp-2 text-[0.875rem] leading-relaxed text-ink-600">
          {sw ? request.swStory || request.story : request.story}
        </p>

        <div className="mt-auto pt-4">
          <div className="flex items-baseline justify-between gap-2 text-[0.8125rem]">
            <span className="font-semibold text-ink-900">{money(raised)}</span>
            <span className="text-ink-500">{`${pct}% · ${money(target)}`}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full bg-oweru-700" style={{ width: `${pct}%` }} />
          </div>
          <Link to={`/requests/${request.id}`} className="btn-primary mt-4 w-full">
            {sw ? 'Changia kifaa hiki' : 'Fund this item'}
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function Home() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const { overview } = useLiveOverview()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  usePageMeta({
    title: sw
      ? 'OWERU Foundation — Uwazi, Uwajibikaji na Matokeo Yanayoonekana'
      : 'OWERU Foundation — Transparency, Dignity, Measurable Impact',
    description: sw
      ? 'OWERU Foundation husaidia kliniki, shule, makanisa na jamii nchini Tanzania kwa kufadhili vifaa mahususi vilivyokaguliwa.'
      : 'OWERU Foundation funds community outreach, orphan care and church building in Tanzania — openly funded, item by item, and accountable to the public.',
    path: '/',
  })

  useEffect(() => {
    let alive = true
    fetchRequests({ per_page: 6 })
      .then((data) => { if (alive) setRequests(data || []) })
      .catch(() => { if (alive) setRequests([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const causes = useMemo(
    () => requests.filter((r) => !isFullyFunded(r)).slice(0, 3),
    [requests],
  )

  const regions = useMemo(
    () => new Set(requests.map((r) => r.region).filter(Boolean)).size,
    [requests],
  )

  const stats = [
    { icon: 'newcampaign', value: overview?.requests?.published ?? requests.length, label: sw ? 'Miradi iliyochapishwa' : 'Published causes' },
    { icon: 'globe', value: regions, label: sw ? 'Mikoa yenye maombi' : 'Regions with requests' },
    { icon: 'check', value: overview?.items?.fully_funded ?? 0, label: sw ? 'Vifaa vilivyokamilika' : 'Items fully funded' },
    { icon: 'coins', value: overview?.donations?.total ?? 0, prefix: 'TZS ', label: sw ? 'Misaada iliyopokelewa' : 'Contributions received' },
  ]

  return (
    <main id="main" className="flex-1">
      {/* ================= 1. HERO CAROUSEL ================= */}
      <HeroCarousel
        slides={HERO_SLIDES.map((s) => ({ src: s.src, credit: s.credit, ...(sw ? s.sw : s.en) }))}
        label={sw ? 'Was introductions' : 'Featured highlights'}
      />

      <section className="border-b border-ink-200 bg-cream" aria-label={sw ? 'Lengo la OWERU' : 'OWERU mission'}>
        <Container className="grid gap-3 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-7">
          <span className="eyebrow">{sw ? 'LENGO LETU' : 'OUR MISSION'}</span>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-700">
            {sw
              ? 'Tunawaunganisha wafadhili na mahitaji yaliyothibitishwa nchini Tanzania ili kufadhili vifaa mahususi kwa shule, kliniki na jamii.'
              : 'We connect donors with verified needs across Tanzania to fund specific equipment for schools, clinics, and communities.'}
          </p>
          <Link to="/ledger#how-funds-move" className="link-arrow text-sm">
            {sw ? 'Jinsi fedha zinavyofika' : 'How support reaches people'}
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
        </Container>
      </section>

      {/* ================= 2. WAYS TO HELP =================
          Three concrete routes, not a generic process diagram. Each one opens
          the contact form with that question already chosen. */}
      <section className="bg-white py-14 sm:py-18">
        <Container className="wide">
          <SectionHeading
            title={sw ? 'Jinsi unaweza ' : 'How you can '}
            accent={sw ? 'Kusaidia' : 'help'}
            lead={
              sw
                ? 'Chagua njia inayokufaa. Kila njia ina hatua halisi inayoanza na fomu.'
                : 'Pick the route that fits you. Each one starts with a real form, not a promise.'
            }
          />

          <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3 sm:gap-5">
            {waysToHelp(sw).map((w, wi) => (
              <Link
                key={w.key}
                to={w.to}
                className="group flex h-full flex-col items-center rounded-[16px] border border-ink-200 bg-white px-5 py-8 text-center shadow-[var(--shadow-soft)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-[var(--shadow-lift)]"
              >
                <span className="relative grid h-14 w-14 place-items-center rounded-full bg-oweru-700 text-white shadow-[0_6px_18px_rgba(24,81,65,0.18)] transition-transform duration-200 group-hover:scale-105">
                  <Icon name={w.icon} className="h-6 w-6" />
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold-500 px-1 text-[0.625rem] font-bold text-ink-900">
                    {String(wi + 1).padStart(2, '0')}
                  </span>
                </span>
                <h3 className="mt-5 text-[1.0625rem] font-bold tracking-[-0.02em] text-ink-900">
                  {w.title}
                </h3>
                <p className="mt-2 max-w-[15rem] text-[0.875rem] leading-relaxed text-ink-600">
                  {w.text}
                </p>
                <span className="link-arrow mt-auto pt-5">
                  {sw ? 'Anza' : 'Start'}
                  <Icon name="arrow-right" className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ================= 3. ABOUT + STATS =================
          Every number here is live from /requests/overview. Nothing is a
          placeholder, and the image is a local licensed asset. */}
      <section className="band-haze py-14 sm:py-18">
        <Container className="wide">
          <div className="split-feature items-center gap-10 lg:gap-14">
            <div>
              <h2 className="max-w-[26rem] text-[1.5rem] font-extrabold leading-[1.3] tracking-[-0.035em] text-ink-900 sm:text-[1.875rem]">
                {sw ? 'Kila mchango' : 'Every gift'}
                <span className="text-oweru-700">{sw ? 'unaelekezwa' : 'has a clear purpose'}</span>
                {sw
                  ? ' kwenye kifaa au huduma iliyoidhinishwa kwa jamii ya Tanzania.'
                  : ' — it supports approved equipment or services for communities in Tanzania.'}
              </h2>

              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6">
                {stats.map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-oweru-700 text-white">
                      <Icon name={s.icon} className="h-4 w-4" />
                    </span>
                    <div>
                      <dd className="text-[1.125rem] font-extrabold leading-none tracking-[-0.03em] text-ink-900">
                        {s.prefix}
                        <CountUp value={s.value} />
                        {!s.prefix && <span>+</span>}
                      </dd>
                      <dt className="mt-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-500">
                        {s.label}
                      </dt>
                    </div>
                  </div>
                ))}
              </dl>

              <Link to="/about" className="btn-secondary mt-8">
                {sw ? 'Jifahamu zaidi' : 'Learn about us'}
                <Icon name="arrow-right" className="h-4 w-4" />
              </Link>
            </div>

            <div className="overflow-hidden rounded-[14px]">
              <img
                src="/photos/hero/hero-boma-women.jpg"
                alt=""
                loading="lazy"
                className="aspect-[4/3] w-full object-cover sm:aspect-[16/11]"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* ================= 4. PROJECTS ================= */}
      <section className="bg-white py-14 sm:py-18">
        <Container className="wide">
          <SectionHeading
            title={sw ? 'Miradi ' : 'Our '}
            accent={sw ? 'inayochapishwa' : 'projects'}
            lead={
              sw
                ? 'Chagua kifaa kimoja au mpango kamili, kisha fuata matumizi yake hadi mwisho.'
                : 'Fund one specific item or a whole project, then follow exactly where it went.'
            }
          />

          {loading ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="overflow-hidden rounded-[14px] border border-ink-200">
                  <div className="ratio-16-10 w-full animate-pulse bg-ink-100" />
                  <div className="space-y-3 p-5">
                    <div className="h-3 w-20 animate-pulse rounded-full bg-ink-100" />
                    <div className="h-4 w-full animate-pulse rounded-full bg-ink-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : causes.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {causes.map((r) => (
                <CauseCard key={r.id} request={r} sw={sw} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[14px] border border-dashed border-ink-300 bg-ink-50 px-6 py-10 text-center">
              <Icon name="newcampaign" className="mx-auto h-6 w-6 text-ink-400" />
              <p className="mt-3 text-[1rem] font-semibold text-ink-900">
                {sw ? 'Hakuna miradi inayochapishwa kwa sasa' : 'No published causes right now'}
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-[0.9375rem] text-ink-600">
                {sw
                  ? 'Rudi baadaye kuona mahitaji mapya. Unaweza pia kuwasilisha ombi la msaada au kujitolea.'
                  : 'Please check back shortly. You can still submit a request or volunteer.'}
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/apply" className="btn-primary">{sw ? 'Wasilisha ombi' : 'Submit a request'}</Link>
                <Link to="/contact?intent=volunteer" className="btn-secondary">{sw ? 'Jitoa' : 'Volunteer'}</Link>
              </div>
            </div>
          )}

          {causes.length > 0 && (
            <div className="mt-9 flex justify-center">
              <Link to="/requests#causes" className="btn-secondary">
                {sw ? 'Ona Miradi Yote' : 'View all projects'}
                <Icon name="arrow-right" className="h-4 w-4" />
              </Link>
            </div>
          )}
        </Container>
      </section>

      {/* ================= 5. FINAL CTA ================= */}
      <section className="bg-gradient-to-b from-oweru-900 to-oweru-800 py-14 sm:py-18">
        <Container className="wide">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-[1.625rem] font-extrabold leading-tight tracking-[-0.035em] text-white sm:text-[2rem]">
              {sw
                ? 'Changa leo. Mtu mmoja atakumbukwa kwa miaka.'
                : 'Give today. One person will remember it for years.'}
            </h2>
            <p className="mt-3 text-[1rem] leading-relaxed text-white/70">
              {sw
                ? 'Kwa imani na upendo, tunasaidiana kwa vitendo. Chagua kifaa mahususi na ufuatilie taarifa zake.'
                : 'Faith moves us to care in practical ways. Choose a specific item and follow its public updates.'}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/requests#causes" className="btn-primary btn-lg">
                {sw ? 'Changia Sasa' : 'Donate Now'}
                <Icon name="arrow-right" className="h-4 w-4" />
              </Link>
              <Link to="/contact?intent=partner" className="btn-on-dark btn-lg">
                {sw ? 'Shirikiana Nasi' : 'Partner With Us'}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  )
}
