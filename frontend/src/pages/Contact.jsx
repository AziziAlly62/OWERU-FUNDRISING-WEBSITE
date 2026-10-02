import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { sendContactMessage } from '../api'
import { requestImage } from '../utils/requestImages'
import { usePageMeta } from '../hooks/usePageMeta'
import { Container, Section, Eyebrow } from '../components/ui'
import { Icon } from '../components/icons'

const PHONE = '+255 744 528 913'
const PHONE_HREF = 'tel:+255744528913'
const WHATSAPP = 'https://wa.me/255744528913'
const EMAIL = 'info@oweru.org'
const DOMAIN = 'oweru.org'
const CITY = 'Dar es Salaam'

const SOCIAL = [
  { name: 'facebook', href: `https://facebook.com/${DOMAIN}` },
  { name: 'instagram', href: `https://instagram.com/${DOMAIN}` },
  { name: 'whatsapp', href: WHATSAPP },
]

/* The partner, donate-goods and volunteer pages were removed, so this form is
   the one place all three kinds of enquiry arrive. The visitor picks an intent
   and only answers the questions that apply to it, so nobody is made to fill
   in fields that mean nothing to them. */
const INTENTS = [
  {
    value: 'partner',
    icon: 'building',
    label: { en: 'Partner with us', sw: 'Shirikiana nasi' },
    hint: {
      en: 'Churches, companies, groups and other organisations.',
      sw: 'Makanisa, kampuni, vikundi na mashirika mengine.',
    },
    fields: ['organisation'],
    detailsLabel: {
      en: 'What would you like to partner on?',
      sw: 'Ungependa kushirikiana kwenye nini?',
    },
    detailsHint: {
      en: 'For example: a church contributing equipment, a company funding a project, or a group visiting.',
      sw: 'Mfano: kanisa kuchangia vifaa, kampuni kusaidia mradi, au kikundi kupanga ziara.',
    },
  },
  {
    value: 'goods',
    icon: 'package',
    label: { en: 'Donate goods', sw: 'Leta vifaa' },
    hint: {
      en: 'Equipment, materials or supplies you already have.',
      sw: 'Vifaa, nyenzo au bidhaa ulizonazo tayari.',
    },
    fields: [],
    detailsLabel: {
      en: 'What are you donating, and roughly how much?',
      sw: 'Ungependa kuchangia vifaa gani, na takribani vingapi?',
    },
    detailsHint: {
      en: 'For example: chairs, a sound system, teaching materials. An estimate is fine.',
      sw: 'Mfano: viti, mfumo wa sauti au vifaa vya kufundishia. Makadirio yanatosha.',
    },
  },
  {
    value: 'volunteer',
    icon: 'users',
    label: { en: 'Volunteer', sw: 'Jitoa' },
    hint: {
      en: 'Give your time, skills or labour.',
      sw: 'Changia muda, ujuzi au nguvu zako.',
    },
    fields: [],
    detailsLabel: {
      en: 'What kind of help can you offer, and when?',
      sw: 'Unaweza kusaidia vipi, na lini?',
    },
    detailsHint: {
      en: 'For example: teaching, construction, transport, admin, or a specific date you can travel.',
      sw: 'Mfano: kufundisha, ujenzi, usafiri au kazi za ofisini. Tueleze pia lini unaweza kusaidia.',
    },
  },
]

/* The address is known to the city only, so the map is a city view rather
   than a pin for a specific office we have not verified. */
const MAP_SRC =
  'https://www.google.com/maps?q=Dar+es+Salaam,+Tanzania&z=11&output=embed'

const EMPTY = { name: '', email: '', phone: '', organisation: '', intent: '', subject: '', message: '', details: '' }

export default function Contact() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const [searchParams] = useSearchParams()

  usePageMeta({
    title: sw ? 'Wasiliana Nasi | OWERU Foundation' : 'Contact | OWERU Foundation',
    description: sw
      ? `Wasiliana na OWERU Foundation kwa simu, barua pepe au ujumbe. Tupo ${CITY}, Tanzania.`
      : `Reach OWERU Foundation by phone, email or message. We are in ${CITY}, Tanzania.`,
  })

  const [form, setForm] = useState(EMPTY)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const activeIntent = INTENTS.find((i) => i.value === form.intent) || null

  /* Links from the home page, footer and the removed pages arrive as
     /contact?intent=partner|goods|volunteer, so the matching question is
     already chosen instead of the visitor picking again. An unknown value is
     ignored, and any intent the visitor has set by clicking a card is left
     alone. */
  useEffect(() => {
    const wanted = searchParams.get('intent')
    if (!wanted || !INTENTS.some((i) => i.value === wanted)) return
    setForm((f) => (f.intent === wanted ? f : { ...f, intent: wanted }))
  }, [searchParams])

  const set = (k) => (e) => {
    const v = e.target.value
    setForm((f) => {
      const next = { ...f, [k]: v }
      // organisation only makes sense for a partner enquiry
      if (k === 'intent' && v !== 'partner') next.organisation = ''
      return next
    })
    if (error) setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      await sendContactMessage(form)
      setDone(true)
      setForm(EMPTY)
    } catch (err) {
      setError(
        err?.message ||
          (sw
            ? 'Ujumbe haukuweza kutumwa. Tafadhali jaribu tena.'
            : 'Your message could not be sent. Please try again.')
      )
    } finally {
      setSending(false)
    }
  }

  const details = [
    {
      icon: 'phone',
      label: sw ? 'Tupige simu' : 'Call us',
      value: PHONE,
      href: PHONE_HREF,
    },
    { icon: 'mail', label: sw ? 'Barua pepe' : 'Email us', value: EMAIL, href: `mailto:${EMAIL}` },
    { icon: 'globe', label: sw ? 'Tovuti' : 'Website', value: DOMAIN, href: `https://${DOMAIN}` },
    { icon: 'pin', label: sw ? 'Mahali' : 'Where we are', value: `${CITY}, ${sw ? 'Tanzania' : 'Tanzania'}` },
  ]

  return (
    <>
      {/* ---- 1. Hero ---- */}
      <section className="relative h-[220px] overflow-hidden bg-oweru-950 sm:h-[260px]">
        <img
          src={requestImage('african community people talking together outdoors', 1920)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-oweru-950/90 to-oweru-900/60" />
        <Container className="relative flex h-full flex-col items-center justify-center text-center">
          <h1 className="display-md text-white">{sw ? 'Wasiliana Nasi' : 'Contact Us'}</h1>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
            {sw ? (
              <>
                Nyumbani <span className="text-white/40">/</span> Wasiliana nasi
              </>
            ) : (
              <>
                Home <span className="text-white/40">/</span> Contact us
              </>
            )}
          </p>
        </Container>
      </section>

      {/* ---- 2. Form + details ---- */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
            {/* Left: the form */}
            <div className="lg:col-span-6">
              {done ? (
                <div className="card-base p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100 text-gold-700">
                    <Icon name="check" className="h-7 w-7" />
                  </div>
                  <h2 className="mt-5 font-display text-xl font-semibold text-ink-900">
                    {sw ? 'Ujumbe wako umefika' : 'Your message has reached us'}
                  </h2>
                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-500">
                      {sw
                        ? 'Asante. Tutakujibu kwa barua pepe mara tuwezekanapo.'
                        : 'Thank you. We will reply by email as soon as we can.'}
                    </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <a href={WHATSAPP} target="_blank" rel="noreferrer" className="btn-forest">
                      <Icon name="whatsapp" className="h-4 w-4" />
                      WhatsApp
                    </a>
                    <button type="button" onClick={() => setDone(false)} className="btn-secondary">
                      {sw ? 'Tuma ujumbe mwingine' : 'Send another message'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="card-base space-y-5 p-7 sm:p-8">
                  <h2 className="font-display text-xl font-semibold text-ink-900">
                    {sw ? 'Tuma ujumbe' : 'Send us a message'}
                  </h2>

                  {error && (
                    <div className="rounded-xl border border-error-200 bg-error-50 p-3 text-sm text-error-700" role="alert">
                      {error}
                    </div>
                  )}

                  {/* Intent first: the partner, goods and volunteer pages were
                      removed, so this is the only door into those three. */}
                  <fieldset>
                    <legend className="mb-2 block text-xs font-bold uppercase tracking-wider text-ink-700">
                      {sw ? 'Ungependa kusaidia vipi?' : 'How would you like to help?'}
                    </legend>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      {INTENTS.map((opt) => {
                        const on = form.intent === opt.value
                        return (
                          <label
                            key={opt.value}
                            className={`relative flex cursor-pointer flex-col gap-1 rounded-xl border p-3.5 transition-colors ${
                              on
                                ? 'border-oweru-600 bg-oweru-50 ring-1 ring-oweru-600'
                                : 'border-ink-200 bg-white hover:border-oweru-300 hover:bg-ink-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="ct-intent"
                              value={opt.value}
                              checked={on}
                              onChange={set('intent')}
                              className="sr-only"
                            />
                            <span className="flex items-center gap-2">
                              <Icon
                                name={opt.icon}
                                className={`h-4 w-4 flex-shrink-0 ${on ? 'text-oweru-700' : 'text-ink-500'}`}
                              />
                              <span
                                className={`text-[13px] font-bold ${on ? 'text-oweru-800' : 'text-ink-900'}`}
                              >
                                {sw ? opt.label.sw : opt.label.en}
                              </span>
                            </span>
                            <span className="text-[11px] leading-snug text-ink-500">
                              {sw ? opt.hint.sw : opt.hint.en}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </fieldset>

                  <div>
                    <label htmlFor="ct-name" className="mb-2 block text-xs font-bold uppercase tracking-wider text-ink-700">
                      {sw ? 'Jina lako' : 'Your name'}
                    </label>
                    <input
                      id="ct-name"
                      type="text"
                      value={form.name}
                      onChange={set('name')}
                      placeholder={sw ? 'Jina kamili' : 'Full name'}
                      className="input-base"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="ct-email" className="mb-2 block text-xs font-bold uppercase tracking-wider text-ink-700">
                        {sw ? 'Barua pepe' : 'Email address'}
                      </label>
                      <input
                        id="ct-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={set('email')}
                        placeholder={sw ? 'barua pepe yako' : 'you@example.com'}
                        className="input-base"
                      />
                      <p className="mt-1.5 text-xs text-ink-500">
                        {sw
                          ? 'Tunaihitaji ili tuweze kukujibu. Hatuitumii kwa madhumuni mengine.'
                          : 'We need this in order to reply. We do not share it with anyone.'}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="ct-phone" className="mb-2 block text-xs font-bold uppercase tracking-wider text-ink-700">
                        {sw ? 'Simu (si lazima)' : 'Phone (optional)'}
                      </label>
                      <input
                        id="ct-phone"
                        type="tel"
                        value={form.phone}
                        onChange={set('phone')}
                        placeholder="+255 7xx xxx xxx"
                        className="input-base"
                      />
                      <p className="mt-1.5 text-xs text-ink-500">
                        {sw
                          ? 'Tumia kama unapenda mazungumzo ya haraka.'
                          : 'Useful if you would rather talk than write.'}
                      </p>
                    </div>
                  </div>

                  {/* Only a partner has an organisation to name. */}
                  {activeIntent?.fields.includes('organisation') && (
                    <div>
                      <label htmlFor="ct-org" className="mb-2 block text-xs font-bold uppercase tracking-wider text-ink-700">
                        {sw ? 'Jina la shirika' : 'Organisation name'}
                      </label>
                      <input
                        id="ct-org"
                        type="text"
                        value={form.organisation}
                        onChange={set('organisation')}
                        placeholder={
                          sw
                            ? 'Mfano: Kanisa Umoja, Kampuni XYZ, Shule yetu...'
                            : 'e.g. United Church, XYZ Ltd, our school...'
                        }
                        className="input-base"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="ct-subject" className="mb-2 block text-xs font-bold uppercase tracking-wider text-ink-700">
                      {sw ? 'Mada' : 'Subject'}
                    </label>
                    <input
                      id="ct-subject"
                      type="text"
                      value={form.subject}
                      onChange={set('subject')}
                      placeholder={
                        sw
                          ? 'Mfano: Ushahidi wa matumizi, mchango wa kampuni...'
                          : 'e.g. Proof of use, a corporate contribution...'
                      }
                      className="input-base"
                    />
                  </div>

                  {/* The intent-specific question. Required once an intent is
                      chosen, because that answer is the whole point of it. */}
                  {activeIntent && (
                    <div>
                      <label htmlFor="ct-details" className="mb-2 block text-xs font-bold uppercase tracking-wider text-ink-700">
                        {sw ? activeIntent.detailsLabel.sw : activeIntent.detailsLabel.en}
                      </label>
                      <textarea
                        id="ct-details"
                        rows={4}
                        required
                        maxLength={5000}
                        value={form.details}
                        onChange={set('details')}
                        placeholder={sw ? activeIntent.detailsHint.sw : activeIntent.detailsHint.en}
                        className="input-base resize-none"
                      />
                      <p className="mt-1.5 text-xs text-ink-500">
                        {sw ? activeIntent.detailsHint.sw : activeIntent.detailsHint.en}
                      </p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="ct-message" className="mb-2 block text-xs font-bold uppercase tracking-wider text-ink-700">
                      {sw ? 'Ujumbe wako' : 'Your message'}
                    </label>
                    <textarea
                      id="ct-message"
                      rows={activeIntent ? 4 : 5}
                      required={!activeIntent}
                      maxLength={5000}
                      value={form.message}
                      onChange={set('message')}
                      placeholder={
                        sw
                          ? 'Andika ujumbe wako hapa...'
                          : 'Write your message here...'
                      }
                      className="input-base resize-none"
                    />
                    {activeIntent && (
                      <p className="mt-1.5 text-xs text-ink-500">
                        {sw
                          ? 'Si lazima kuongeza kama umeeleza hapa juu. Ongeza tu kama kuna jambo lingine.'
                          : 'Not needed if you have covered it above. Add it only if there is more to say.'}
                      </p>
                    )}
                  </div>

                  <button type="submit" disabled={sending} className="btn-forest btn-lg btn-block">
                    {sending
                      ? sw
                        ? 'Inatuma...'
                        : 'Sending...'
                      : sw
                        ? 'Tuma ujumbe'
                        : 'Send message'}
                  </button>
                </form>
              )}
            </div>

            {/* Right: how to reach us */}
            <div className="space-y-8 lg:col-span-6 lg:pl-6">
              <div>
                <Eyebrow>{sw ? 'Wasiliana nasi' : 'Contact us'}</Eyebrow>
                <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900">
                  {sw ? 'Wasiliana nasi' : 'Get in touch'}
                </h2>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-500">
                  {sw
                    ? 'Chagua namna unavyopenda kushiriki, kisha tupe maelezo yanayotuhusu. Kwa swali la jumla, tupigie simu au tuandikie barua pepe.'
                    : 'Choose how you would like to take part and share the details that apply. For a general question, call or email our team.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {details.map((d) => {
                  const inner = (
                    <>
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
                        <Icon name={d.icon} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                          {d.label}
                        </h3>
                        <p className="mt-0.5 break-words text-sm font-semibold text-ink-900">{d.value}</p>
                      </div>
                    </>
                  )
                  return d.href ? (
                    <a
                      key={d.label}
                      href={d.href}
                      className="flex gap-4 transition-colors hover:text-gold-700"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={d.label} className="flex gap-4">
                      {inner}
                    </div>
                  )
                })}
              </div>

              {/* Faster than email for most people here */}
              <div className="rounded-2xl border border-gold-200 bg-gold-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-oweru-900 text-gold-300">
                    <Icon name="whatsapp" className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink-900">
                      {sw ? 'Unahitaji jibu la haraka?' : 'Need a faster answer?'}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">
                      {sw
                        ? 'Tuma ujumbe WhatsApp ili kuwasiliana na timu yetu moja kwa moja.'
                        : 'Message us on WhatsApp to contact our team directly.'}
                    </p>
                    <a
                      href={WHATSAPP}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-oweru-800 underline underline-offset-4 hover:text-gold-700"
                    >
                      {PHONE}
                      <Icon name="chevron" className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="border-t border-ink-100 pt-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-500">
                  {sw ? 'Tufuate' : 'Follow us'}
                </h3>
                <div className="flex gap-2">
                  {SOCIAL.map((s) => (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.name}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-oweru-800 text-gold-300 transition-colors hover:bg-gold-500 hover:text-white"
                    >
                      <Icon name={s.name} className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---- 3. Map ---- */}
      <section className="relative h-[320px] w-full overflow-hidden border-y border-ink-100 bg-ink-50">
        <iframe
          title={sw ? `Ramani ya ${CITY}` : `Map of ${CITY}`}
          src={MAP_SRC}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full"
        />
      </section>
    </>
  )
}
