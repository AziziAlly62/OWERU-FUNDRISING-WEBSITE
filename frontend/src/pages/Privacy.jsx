import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { Icon } from '../components/icons'
import { usePageMeta } from '../hooks/usePageMeta'
import { Container } from '../components/ui'

const FACTS = [
  { icon: 'chart', en: 'Minimal', sw: 'Taarifa chache', descEn: 'We collect only what is needed to serve your request.', descSw: 'Tunakusanya taarifa zinazohitajika tu kushughulikia ombi lako.' },
  { icon: 'lock', en: 'Encrypted', sw: 'Zimelindwa kwa usimbaji fiche', descEn: 'Sensitive data is encrypted and access-controlled.', descSw: 'Taarifa nyeti husimbwa kwa njia fiche na hulindwa kwa udhibiti wa ufikiaji.' },
  { icon: 'download', en: 'Recoverable', sw: 'Nakala rudufu', descEn: 'Daily backups, and we can export your data on request.', descSw: 'Tunahifadhi nakala rudufu kila siku na tunaweza kukupatia nakala ya taarifa zako ukiomba.' },
]

const SECTIONS = [
  {
    icon: 'clipboard',
    en: 'What we collect',
    sw: 'Taarifa tunazokusanya',
    bodyEn: 'We collect the information needed to run a request: who is asking, what item is needed, the real price, and — where the rules require it — identity documents. We do not collect anything we will not use.',
    bodySw: 'Tunakusanya taarifa zinazohitajika kushughulikia ombi: mwombaji ni nani, kifaa gani kinahitajika na gharama yake. Pale sheria inapohitaji, tunaweza pia kuomba hati za utambulisho. Hatukusanyi taarifa zisizohitajika.',
    noteEn: 'You can give without an account. A phone number and a name are enough to start.',
    noteSw: 'Unaweza kuchangia bila kufungua akaunti.',
  },
  {
    icon: 'eye',
    en: 'What is public and what is not',
    sw: 'Kinachoonekana hadharani na kinacholindwa',
    bodyEn: 'Every request carries an exposure level that decides what the public sees. Open requests show the item, the target and the progress. Partial hides the organisation and the region. Protected stays entirely internal.',
    bodySw: 'Kila ombi lina kiwango cha faragha kinachoamua taarifa zitakazoonekana kwa umma. Maombi ya wazi huonyesha kifaa, lengo na maendeleo. Maombi yenye faragha ya sehemu huficha taasisi na eneo; maombi yaliyolindwa huonekana na wafanyakazi walioidhinishwa pekee.',
    noteEn: 'Your identity is never published on a request, and a tracking link reveals the request — never the person.',
    noteSw: 'Utambulisho wako hauchapishwi kwenye ombi. Kiungo cha ufuatiliaji huonyesha ombi, si taarifa zako binafsi.',
  },
  {
    icon: 'users',
    en: 'Who we share it with',
    sw: 'Tunashiriki na nani',
    bodyEn: 'Payment providers see what they need to process a transaction. Suppliers see only what is required to fulfil an order. We do not sell data, and we do not share it with unrelated parties.',
    bodySw: 'Watoa huduma za malipo hupokea taarifa zinazohitajika kuchakata muamala. Wauzaji hupokea taarifa zinazohitajika kutekeleza agizo. Hatuuzi taarifa zako wala kuzishiriki na watu wasiohusika.',
    noteEn: 'Where law requires disclosure, we will tell you unless doing so would cause harm.',
    noteSw: 'Sheria ikitulazimu kutoa taarifa zako, tutakujulisha isipokuwa kufanya hivyo kunaweza kusababisha madhara.',
  },
  {
    icon: 'clock',
    en: 'How long we keep it',
    sw: 'Muda tunaohifadhi taarifa',
    bodyEn: 'Donation and invoice records are retained as long as they serve accountability. Working reports are tracked at 30 and 90 days. Anything that no longer has a purpose is removed from public view.',
    bodySw: 'Tunahifadhi rekodi za michango na ankara kwa muda unaohitajika kwa uwajibikaji. Ripoti za ufuatiliaji hurekodiwa baada ya siku 30 na 90. Taarifa zisizohitajika tena huondolewa kwenye kurasa za umma.',
    noteEn: 'Ask us and we will tell you exactly what we hold about you.',
    noteSw: 'Wasiliana nasi tukuambie taarifa gani tunazohifadhi kukuhusu.',
  },
]

export default function Privacy() {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  usePageMeta({
    title: sw ? 'Faragha | OWERU Foundation' : 'Privacy | OWERU Foundation',
    description: sw
      ? 'Maelezo kuhusu jinsi OWERU Foundation inavyokusanya, kutumia na kulinda taarifa zako za binafsi.'
      : 'How OWERU Foundation collects, uses and protects your personal information.',
  })

  return (
    <>
      {/* ---- Statement ---- */}
      <section className="border-b border-ink-200 bg-cream">
        <Container className="py-14 sm:py-20">
          <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-oweru-800 text-white">
            <Icon name="lock" className="h-5 w-5" />
          </div>
          <h1 className="display-lg mt-7 text-balance">
            {sw ? 'Faragha yako, kwa ukweli' : 'Your privacy, plainly stated'}
          </h1>
          <p className="lede mt-5 max-w-2xl text-pretty">
            {sw
              ? 'Hapa tunaeleza taarifa tunazokusanya, wanaoweza kuziona na muda tunaozihifadhi.'
              : 'We are explicit about how your information is handled — what we collect, who can see it, and how long we hold it. No vague promises.'}
          </p>
        </Container>
      </section>

      {/* ---- Three facts ---- */}
      <section className="border-b border-ink-200 bg-white">
        <Container className="py-10">
          <div className="grid gap-4 sm:grid-cols-3">
            {FACTS.map((f) => (
              <div key={f.en} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-oweru-50 text-oweru-700">
                  <Icon name={f.icon} className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[0.9375rem] font-semibold text-ink-900">{sw ? f.sw : f.en}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-500">{sw ? f.descSw : f.descEn}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ---- Detail ---- */}
      <section className="bg-white">
        <Container className="py-16 sm:py-20">
          <div className="max-w-3xl">
            {SECTIONS.map((s, i) => (
              <article key={s.en} className="border-b border-ink-200 pb-10 last:border-0 last:pb-0 [&:not(:first-child)]:pt-10">
                <div className="flex items-center gap-3">
                  <span className="font-display text-[0.8125rem] font-semibold tabular-nums text-ink-300">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-oweru-50 text-oweru-700">
                    <Icon name={s.icon} className="h-4.5 w-4.5" />
                  </div>
                  <h2 className="text-[1.1875rem] text-ink-900">{sw ? s.sw : s.en}</h2>
                </div>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-600">{sw ? s.bodySw : s.bodyEn}</p>
                <p className="mt-4 border-l-2 border-oweru-200 pl-4 text-sm leading-relaxed text-ink-500">
                  {sw ? s.noteSw : s.noteEn}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* ---- Contact ---- */}
      <section className="border-t border-ink-200 bg-cream">
        <Container className="py-14">
          <div className="flex flex-col items-start gap-6 rounded-[14px] border border-ink-200 bg-white p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl text-ink-900">
                {sw ? 'Una swali kuhusu taarifa zako?' : 'Questions about your data?'}
              </h2>
              <p className="mt-2 max-w-md text-[0.9375rem] text-ink-600">
                {sw
                  ? 'Tutaambia hasa tunachohifadhi, au tutakusaidia kuondoa taarifa yoyote isiyo ya lazima.'
                  : 'We will tell you exactly what we hold, or help you remove anything that is no longer needed.'}
              </p>
            </div>
            <a href="mailto:info@oweru.org" className="btn-secondary shrink-0">
                {sw ? 'Tuandikie barua pepe' : 'Email us'}
            </a>
          </div>

          <p className="mt-8 flex items-center gap-2 text-xs text-ink-400">
            <Icon name="doc" className="h-3.5 w-3.5" />
            {sw ? 'Toleo la mwisho: 28 Agosti 2026' : 'Last updated: 28 August 2026'}
          </p>
        </Container>
      </section>
    </>
  )
}
