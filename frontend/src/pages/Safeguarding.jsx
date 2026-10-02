import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { Icon } from '../components/icons'
import { usePageMeta } from '../hooks/usePageMeta'
import { Container } from '../components/ui'

const PRINCIPLES = [
  {
    icon: 'shield',
    en: 'Safety first',
    sw: 'Usalama wa kwanza',
    descEn: 'The safety of applicants and ministry workers sits at the centre of every decision we make.',
    descSw: 'Usalama wa waombaji na wahudumu ni msingi wa kila uamuzi tunaofanya.',
  },
  {
    icon: 'lock',
    en: 'Protected privacy',
    sw: 'Faragha ilindwe',
    descEn: 'Sensitive information is stored securely and visible only to the staff who need it.',
    descSw: 'Taarifa nyeti huhifadhiwa kwa usalama na huonekana tu kwa wafanyakazi walioidhinishwa.',
  },
  {
    icon: 'verify',
    en: 'Transparency with care',
    sw: 'Uwazi kwa uangalifu',
    descEn: 'We publish everything that can be published safely, without putting anyone at risk.',
    descSw: 'Tunachapisha taarifa zinazoweza kuwekwa wazi kwa usalama, bila kumweka mtu yeyote hatarini.',
  },
  {
    icon: 'heart',
    en: 'Dignity first',
    sw: 'Kulinda utu wa kila mtu',
    descEn: 'We protect the vulnerable and never trade a person’s dignity for a faster process.',
    descSw: 'Tunawalinda walio katika mazingira magumu na kuheshimu utu wa kila mtu.',
  },
]

const PRACTICES = [
  { en: 'Phone numbers never appear on public pages.', sw: 'Nambari za simu hazionyeshwi kwenye kurasa za umma.' },
  { en: 'National ID numbers never appear publicly.', sw: 'Nambari za kitambulisho hazionyeshwi hadharini.' },
  { en: 'Exact household and village locations are never published.', sw: 'Anwani au eneo halisi la makazi halichapishwi.' },
  { en: 'Uploaded documents are access-controlled, not public by default.', sw: 'Nyaraka zilizopakiwa hulindwa na hazionekani kwa umma moja kwa moja.' },
  { en: 'Tracking links reveal only the request, never the applicant’s identity.', sw: 'Viungo vya kufuatilia huonyesha ombi pekee, si utambulisho wa mwombaji.' },
  { en: 'Every account is tied to a verified email and a named person.', sw: 'Kila akaunti inahusishwa na barua pepe iliyothibitishwa na mtu mwenye jina.' },
]

export default function Safeguarding() {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  usePageMeta({
    title: sw ? 'Ulinzi | OWERU Foundation' : 'Safeguarding | OWERU Foundation',
    description: sw
      ? 'Hatua za kulinda watoto na watu wote wanaotumia OWERU Foundation.'
      : 'The measures OWERU Foundation takes to protect children and everyone we serve.',
  })

  return (
    <>
      {/* ---- Statement ---- */}
      <section className="border-b border-ink-200 bg-cream">
        <Container className="py-14 sm:py-20">
          <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-oweru-800 text-white">
            <Icon name="shield" className="h-5 w-5" />
          </div>
          <h1 className="display-lg mt-7 text-balance">
            {sw ? 'Ulinzi na usalama' : 'Safeguarding and safety'}
          </h1>
          <p className="lede mt-5 max-w-2xl text-pretty">
            {sw
              ? 'Tumejizatiti kulinda usalama, faragha na utu wa waombaji, watoto na wote wanaohudumiwa kupitia OWERU.'
              : 'Our commitment to protecting the safety, privacy and dignity of applicants, children and everyone served through this platform.'}
          </p>
        </Container>
      </section>

      {/* ---- Principles ---- */}
      <section className="bg-white">
        <Container className="py-16 sm:py-20">
          <h2 className="display-md max-w-2xl text-balance">
            {sw ? 'Kanuni zinazotuongoza' : 'What guides us'}
          </h2>
          <p className="lede mt-4 max-w-2xl text-pretty">
            {sw
              ? 'Tunafuata taratibu za kulinda usalama na faragha. Kanuni hizi hutuongoza tunapofanya maamuzi na kushughulikia taarifa.'
              : 'OWERU Foundation applies strict safeguarding and privacy standards. These are the lines that hold when someone tests them.'}
          </p>

          <div className="mt-12 grid gap-px overflow-hidden rounded-[14px] border border-ink-200 bg-ink-200 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <article key={p.en} className="bg-white p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-oweru-50 text-oweru-700">
                  <Icon name={p.icon} className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-[1.0625rem] text-ink-900">{sw ? p.sw : p.en}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-600">
                  {sw ? p.descSw : p.descEn}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* ---- Practices ---- */}
      <section className="border-y border-ink-200 bg-cream">
        <Container className="py-16 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <span className="eyebrow">{sw ? 'Ulinzi wa taarifa' : 'Data protection'}</span>
              <h2 className="display-md mt-4 text-balance">
                {sw ? 'Jinsi tunavyolinda taarifa' : 'What we never publish'}
              </h2>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-600">
                {sw
                  ? 'Uwazi haupaswi kuhatarisha usalama wa mtu. Hii ndiyo mipaka yetu kuhusu taarifa tunazoweka wazi.'
                  : 'Transparency is worthless if it costs someone their safety. These are the hard limits we hold on data.'}
              </p>
            </div>

            <ul className="grid gap-3">
              {PRACTICES.map((p) => (
                <li key={p.en} className="flex items-start gap-3 rounded-[10px] border border-ink-200 bg-white p-4">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600">
                    <Icon name="check" className="h-3 w-3" strokeWidth={2.6} />
                  </span>
                  <p className="text-[0.9375rem] text-ink-700">{sw ? p.sw : p.en}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* ---- Report ---- */}
      <section className="relative overflow-hidden bg-oweru-950 py-16 text-white sm:py-20">
        <div className="grid-texture pointer-events-none absolute inset-0" aria-hidden="true" />
        <Container className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow eyebrow-on-dark">{sw ? 'Kuripoti wasiwasi' : 'Reporting a concern'}</span>
            <h2 className="display-md mt-4 text-white text-balance">
              {sw ? 'Taarifa yako ni muhimu. Wasiliana nasi kwa usalama.' : 'Your concern matters. Report it safely.'}
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-white/75">
              {sw
                ? 'Ukiwa na wasiwasi kuhusu usalama wa mtoto au mtu yeyote anayetumia huduma zetu, wasilisha taarifa kupitia njia salama ya malalamiko. Tutalishughulikia kwa usiri.'
                : 'If you have any concern about the safety of a child, a beneficiary or anyone using this platform, contact us through the secure complaints channel. Every report is handled discreetly.'}
            </p>
          </div>
          <Link to="/complaints" className="btn-primary btn-lg shrink-0">
            {sw ? 'Wasilisha taarifa' : 'Report a concern'}
          </Link>
        </Container>
      </section>
    </>
  )
}
