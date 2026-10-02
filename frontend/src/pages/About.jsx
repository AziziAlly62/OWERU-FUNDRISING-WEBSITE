import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { requestImage } from '../utils/requestImages'
import { usePageMeta } from '../hooks/usePageMeta'
import { Icon } from '../components/icons'

/* Layout follows the supplied design: full-bleed hero, four quick-link cards
   overlapping it, a two-column "why" block with an offset square behind the
   photo, a grey work band with two photo cards, a navy values band, then a
   two-column CTA.

   Two changes from the source CSS, both deliberate:
   - The four quick cards were plain <div>s, so "OUR MISSION" did nothing when
     clicked. They are anchors now, and each one lands on a real section.
   - /requests is only a redirect to /requests#causes (App.jsx), so the links
     point straight at the target and skip the extra hop. */

const CONTENT = {
  en: {
    hero: {
      eyebrow: 'OUR MISSION',
      title: ['Verified needs.', 'Practical support.'],
      body: 'We connect donors with specific, approved equipment needs. Payments go to vetted suppliers, and delivery updates are shared publicly.',
      cta: 'Discover Our Work',
      credit: 'Photo: Rasheedhrasheed / Wikimedia Commons · CC BY-SA 4.0',
    },
    quick: [
      { icon: 'verify', label: 'VERIFIED NEEDS', sub: 'Reviewed before publication' },
      { icon: 'package', label: 'SPECIFIC ITEMS', sub: 'Gifts fund approved equipment' },
      { icon: 'wallet', label: 'NO CASH GRANTS', sub: 'Payments go to vetted suppliers' },
      { icon: 'eyeCheck', label: 'PUBLIC FOLLOW-UP', sub: 'Delivery and use are reported' },
    ],
    why: {
      label: 'OUR APPROACH',
      title: 'Support should be useful, accountable, and shaped by real needs.',
      body: 'We make each request clear before it is published, so supporters can see what an item costs and how progress is reported.',
      h3: 'From an approved need to an item in use',
      p1: 'Requests are reviewed with the community or organization asking for support. Funding is tied to named equipment rather than unrestricted cash grants.',
      p2: 'OWERU pays vetted suppliers. Delivery and follow-up reports make it possible to see what arrived and whether it remains in use.',
    },
    work: {
      label: 'OUR FOCUS',
      title: ['Equipment that keeps', 'essential work moving.'],
      body: 'We focus on practical equipment for clinics, schools, churches, and community services across Tanzania.',
      cards: [
        {
          title: 'Equipment for essential services',
          body: 'Published requests identify the item, the community it serves, and the amount needed to fund it.',
          link: 'Browse requests',
          href: '/requests#causes',
          image: ['clinic school community equipment tanzania', 'work-support'],
        },
        {
          title: 'Delivery and follow-up',
          body: 'Public reports record delivery and scheduled checks, so progress is visible after funding.',
          link: 'Read impact reports',
          href: '/reports',
          image: ['equipment delivery clinic community tanzania', 'work-partnership'],
        },
      ],
    },
    values: {
      label: 'OUR VALUES',
      title: ['Purposeful Giving.', 'Real Impact.'],
      items: [
        {
          h: 'Transparency',
          p: 'We believe supporters should clearly understand where their contributions go and what they help accomplish.',
        },
        {
          h: 'Accountability',
          p: 'We encourage responsible handling of every request, contribution and partnership.',
        },
        {
          h: 'Community',
          p: 'We believe stronger communities are built when people work together and support one another.',
        },
        {
          h: 'Impact',
          p: 'Every action should have a clear purpose and contribute to meaningful change.',
        },
      ],
    },
    cta: {
      label: 'GET IN TOUCH',
      title: ['Questions about', 'working with OWERU?'],
      body: 'Contact our team about a request, partnership, donated goods, or volunteering.',
      btn: 'Contact the foundation',
      href: '/contact',
    },
  },
  sw: {
    hero: {
      eyebrow: 'LENGO LETU',
      title: ['Mahitaji halisi.', 'Msaada wa vitendo.'],
      body: 'Tunawaunganisha wafadhili na mahitaji mahususi ya vifaa yaliyoidhinishwa. Malipo huenda kwa wauzaji waliothibitishwa, na taarifa za uwasilishaji huchapishwa.',
      cta: 'Ona Kazi Yetu',
      credit: 'Picha: Rasheedhrasheed / Wikimedia Commons · CC BY-SA 4.0',
    },
    quick: [
      { icon: 'verify', label: 'MAHITAJI HALISI', sub: 'Hupitiwa kabla ya kuchapishwa' },
      { icon: 'package', label: 'VIFAA MAHUSUSI', sub: 'Michango hulipia vifaa vilivyoidhinishwa' },
      { icon: 'wallet', label: 'HAKUNA FEDHA TASLIMU', sub: 'Malipo kwa wauzaji waliothibitishwa' },
      { icon: 'eyeCheck', label: 'UFUATILIAJI WA UMMA', sub: 'Uwasilishaji na matumizi huripotiwa' },
    ],
    why: {
      label: 'MFUMO WETU',
      title: 'Msaada uwe na manufaa, uwajibikaji, na uanze na hitaji halisi.',
      body: 'Tunaweka ombi wazi kabla ya kulichapisha ili wafadhili waone gharama ya kifaa na namna maendeleo yatakavyoripotiwa.',
      h3: 'Kutoka hitaji lililoidhinishwa hadi kifaa kutumika',
      p1: 'Maombi hupitiwa pamoja na jamii au taasisi inayoomba msaada. Ufadhili huelekezwa kwenye kifaa kilichotajwa badala ya fedha taslimu zisizo na matumizi maalum.',
      p2: 'OWERU hulipa wauzaji waliothibitishwa. Ripoti za uwasilishaji na ufuatiliaji huonyesha kilichofika na kama bado kinatumika.',
    },
    work: {
      label: 'TUNALENGA NINI',
      title: ['Vifaa vinavyowezesha', 'huduma muhimu.'],
      body: 'Tunafadhili vifaa vya vitendo kwa kliniki, shule, makanisa na huduma za jamii kote Tanzania.',
      cards: [
        {
          title: 'Vifaa kwa huduma muhimu',
          body: 'Maombi yaliyochapishwa hutaja kifaa, jamii kitakachohudumia na kiasi kinachohitajika.',
          link: 'Chunguza maombi',
          href: '/requests#causes',
          image: ['clinic school community equipment tanzania', 'work-support'],
        },
        {
          title: 'Uwasilishaji na ufuatiliaji',
          body: 'Ripoti za umma huandika uwasilishaji na ukaguzi unaofuata, ili maendeleo yaonekane baada ya ufadhili.',
          link: 'Soma ripoti za athari',
          href: '/reports',
          image: ['equipment delivery clinic community tanzania', 'work-partnership'],
        },
      ],
    },
    values: {
      label: 'MAADILI YETU',
      title: ['Imani inayoonekana', 'kwa huduma ya vitendo.'],
      items: [
        {
          h: 'Uwazi',
          p: 'Kila mfadhili anastahili kujua mchango wake unaelekezwa kwenye hitaji gani na maendeleo yanaripotiwaje.',
        },
        {
          h: 'Uwajibikaji',
          p: 'Tunakagua maombi kwa makini na kutoa hesabu ya fedha na vifaa tulivyokabidhiwa.',
        },
        {
          h: 'Jamii',
          p: 'Imani yetu ya Kikristo inatuita kuhudumiana na kuimarisha jamii tunazoishi pamoja.',
        },
        {
          h: 'Athari',
          p: 'Msaada wa vitendo huziwezesha timu za ndani kuendeleza huduma ambazo jamii zinategemea.',
        },
      ],
    },
    cta: {
      label: 'WASILIANA NASI',
      title: ['Una swali kuhusu', 'kushirikiana na OWERU?'],
      body: 'Ukiwakilisha kanisa, shirika au kikundi cha jamii, tutafurahi kusikia namna unavyotaka kuhudumia wengine.',
      btn: 'Wasiliana na OWERU',
      href: '/contact',
    },
  },
}

/* Offset square behind the photo in the "why" block. */
const DECO = 'pointer-events-none absolute left-[-25px] bottom-[-25px] hidden h-3/4 w-3/4 bg-oweru-100 lg:block'

export default function About() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const t = CONTENT[sw ? 'sw' : 'en']

  usePageMeta({
    title: sw ? 'Kuhusu Sisi | Oweru Foundation' : 'About us | Oweru Foundation',
    description: t.hero.body,
  })

  return (
    <div className="w-full overflow-hidden bg-white text-ink-900">

      {/* ================= HERO ================= */}
      {/* Height cut from 570px to 430px so the mission cards and the top of the
          "why" section show without scrolling. */}
      <section
        className="relative flex min-h-[430px] items-center bg-cover bg-center"
        style={{
          backgroundImage: 'url(' + requestImage('about hero', 1920, 'about-hero') + ')',
          filter: 'brightness(1.14) saturate(1.06)',
        }}
      >
        {/* Dark under the text on the left, clear over the people on the right.
            The old 0.60 stop at 45% was muting the subjects down to a mean
            luminance of ~56/255, which is why the photo read as "not showing". */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(7,38,43,0.80) 0%, rgba(7,38,43,0.62) 38%, rgba(7,38,43,0.22) 66%, rgba(7,38,43,0.06) 100%)',
          }}
        />

        <div className="relative z-[2] mx-auto w-full max-w-[1180px] max-w-[90%] px-5">
          <p className="mb-5 text-[13px] font-semibold tracking-[3px] text-white/90">
            {t.hero.eyebrow}
          </p>
          <h1 className="mb-6 max-w-[720px] font-display text-[clamp(40px,5vw,72px)] font-bold leading-[1.05] tracking-[-0.02em] text-white">
            {t.hero.title[0]}
            <br />
            {t.hero.title[1]}
          </h1>
          <p className="mb-8 max-w-[540px] text-[17px] leading-[1.7] text-white/90">
            {t.hero.body}
          </p>
          <a
            href="#our-work"
            className="inline-flex rounded-[4px] bg-white px-7 py-3.5 text-[14px] font-semibold text-oweru-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-oweru-50"
          >
            {t.hero.cta}
          </a>

          {/* CC BY-SA attribution. Required by the licence and shown to
              visitors, not just recorded in public/photos/CREDITS.md. */}
          <p className="mt-8 text-[10px] tracking-[0.4px] text-white/45">
            {t.hero.credit}
          </p>
        </div>
      </section>

      {/* ================= QUICK LINKS ================= */}
      {/* Four operating promises, not another navigation row. */}
      <div className="relative z-[5] mx-auto -mt-[55px] grid w-full max-w-[1050px] max-w-[90%] grid-cols-2 bg-white shadow-[0_15px_45px_rgba(0,0,0,0.12)] lg:grid-cols-4">
        {t.quick.map((q, i) => (
          <div
            key={q.label}
            className={`flex min-h-[115px] flex-col items-center justify-center border-b border-ink-100 px-5 py-5 text-center lg:border-b-0 ${
              i % 2 === 1 ? 'lg:border-r-0' : 'lg:border-r'
            } ${i >= 2 ? 'lg:border-b-0' : ''} ${i === 0 ? 'bg-oweru-700 text-white' : 'text-ink-900'}`}
          >
            <Icon name={q.icon} className="mb-2 h-[26px] w-[26px]" />
            <span className="text-[12px] font-bold tracking-[0.8px]">{q.label}</span>
            <small className={`mt-1.5 text-[11px] ${i === 0 ? 'text-white/65' : 'text-ink-500'}`}>
              {q.sub}
            </small>
          </div>
        ))}
      </div>

      {/* ================= WHY ================= */}
      <section id="mission" className="px-5 py-[75px] sm:py-[105px]">
        <div className="mx-auto mb-[45px] max-w-[650px] text-center sm:mb-[65px]">
          <p className="mb-3 text-[11px] font-bold tracking-[2px] text-oweru-600">{t.why.label}</p>
          <h2 className="mb-5 font-display text-[clamp(32px,4vw,50px)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink-900">
            {t.why.title}
          </h2>
          <p className="text-[15px] leading-[1.7] text-ink-500">{t.why.body}</p>
        </div>

        <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-10 sm:gap-[80px] lg:grid-cols-2">
          <div className="relative">
            <div className={DECO} aria-hidden="true" />
            <img
              src={requestImage(['volunteers sorting supplies charity donation', 'why'], 1200, 'why')}
              alt=""
              loading="lazy"
              className="relative z-[1] block h-[280px] w-full object-cover sm:h-[380px]"
            />
          </div>

          <div>
            <h3 className="mb-5 font-display text-[clamp(24px,2.6vw,29px)] font-semibold leading-[1.2] text-ink-900">
              {t.why.h3}
            </h3>
            <p className="mb-[18px] text-[15px] leading-[1.8] text-ink-500">{t.why.p1}</p>
            <p className="mb-[18px] text-[15px] leading-[1.8] text-ink-500">{t.why.p2}</p>
            <Link
              to="/ledger"
              className="mt-3 inline-block text-[14px] font-bold text-oweru-700 underline-offset-4 hover:underline"
            >
              {sw ? 'Angalia rejesta ya umma' : 'View the public ledger'} →
            </Link>
          </div>
        </div>
      </section>

      {/* ================= OUR WORK ================= */}
      <section
        id="our-work"
        className="grid grid-cols-1 items-center gap-[45px] bg-ink-50 px-5 py-[70px] sm:gap-[70px] sm:py-[90px] lg:grid-cols-[0.8fr_1.2fr] lg:px-[max(20px,calc((100%-1100px)/2))]"
      >
        <div>
          <p className="mb-3 text-[11px] font-bold tracking-[2px] text-oweru-600">{t.work.label}</p>
          <h2 className="mb-5 font-display text-[clamp(32px,4vw,50px)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink-900">
            {t.work.title[0]}
            <br />
            {t.work.title[1]}
          </h2>
          <p className="mb-0 max-w-[440px] text-[15px] leading-[1.8] text-ink-500">{t.work.body}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-[25px]">
          {t.work.cards.map((c) => (
            <article
              key={c.title}
              className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.10)]"
            >
              <img
                src={requestImage(c.image, 800, c.image[1])}
                alt=""
                loading="lazy"
                className="block h-[210px] w-full object-cover"
              />
              <div className="p-6">
                <h3 className="mb-3 font-display text-[20px] font-semibold text-ink-900">{c.title}</h3>
                <p className="mb-5 text-[13px] leading-[1.7] text-ink-500">{c.body}</p>
                <Link
                  to={c.href}
                  className="text-[13px] font-bold text-oweru-700 underline-offset-4 hover:underline"
                >
                  {c.link} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ================= VALUES ================= */}
      <section
        id="values"
        className="grid grid-cols-1 items-center gap-[45px] bg-navy-900 px-5 py-[70px] text-white sm:gap-[70px] sm:py-[90px] lg:grid-cols-[0.8fr_1.2fr] lg:px-[max(20px,calc((100%-1100px)/2))]"
      >
        <div>
          <p className="mb-3 text-[11px] font-bold tracking-[2px] text-oweru-300">{t.values.label}</p>
          <h2 className="mb-0 font-display text-[clamp(32px,4vw,50px)] font-semibold leading-[1.1] tracking-[-0.02em] text-white">
            {t.values.title[0]}
            <br />
            {t.values.title[1]}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-5">
          {t.values.items.map((v, i) => (
            <div
              key={v.h}
              className="min-h-[190px] border border-white/20 p-7 transition-colors duration-300 hover:bg-white/5"
            >
              <div className="mb-5 text-[12px] font-bold text-oweru-300">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="mb-2.5 font-display text-[19px] font-semibold text-white">{v.h}</h3>
              <p className="text-[13px] leading-[1.7] text-white/70">{v.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section
        id="community"
        className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-8 px-5 py-[70px] sm:gap-20 sm:py-[100px] lg:grid-cols-2"
      >
        <div>
          <p className="mb-3 text-[11px] font-bold tracking-[2px] text-oweru-600">{t.cta.label}</p>
          <h2 className="mb-0 font-display text-[clamp(32px,4vw,50px)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink-900">
            {t.cta.title[0]}
            <br />
            {t.cta.title[1]}
          </h2>
        </div>

        <div>
          <p className="mb-6 text-[15px] leading-[1.8] text-ink-500">{t.cta.body}</p>
          <Link
            to={t.cta.href}
            className="inline-flex rounded-[3px] bg-oweru-700 px-6 py-3.5 text-[14px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-oweru-800"
          >
            {t.cta.btn} →
          </Link>
        </div>
      </section>
    </div>
  )
}
