import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { SITE } from '../siteConfig'
import { Icon } from './icons'

/* Old footer had 16 links of which several were duplicates: Donate and
   Support a cause both pointed at /requests#causes, Stories and Impact
   reports were both /reports, and Privacy/Safeguarding/Complaints appeared
   in the column and again in the legal bar. Every link below is unique, and
   each label is a real page. */

const COLUMNS = (sw) => [
  {
    title: sw ? 'Chunguza' : 'Explore',
    links: [
      { to: '/', label: sw ? 'Mwanzo' : 'Home' },
      { to: '/about', label: sw ? 'Kuhusu Sisi' : 'About us' },
      { to: '/requests#causes', label: sw ? 'Miradi' : 'Causes' },
      { to: '/reports', label: sw ? 'Ripoti za matumizi' : 'Impact reports' },
    ],
  },
  {
    title: sw ? 'Shiriki' : 'Take part',
    /* "Fund a cause" used to sit here alongside "Causes" in Explore, but both
       resolve to /requests#causes. Browse once, under a single name.
       Volunteer, donate-goods and partner now all start on /contact, so one
       link covers the three. */
    links: [
      { to: '/apply', label: sw ? 'Wasilisha ombi' : 'Submit a request' },
      { to: '/contact', label: sw ? 'Shirikiana, leta vifaa au jitoa' : 'Partner, donate goods, volunteer' },
    ],
  },
  {
    title: sw ? 'Uaminifu' : 'Trust',
    links: [
      { to: '/ledger', label: sw ? 'Leja ya umma' : 'Public ledger' },
      { to: '/safeguarding', label: sw ? 'Usalama' : 'Safeguarding' },
      { to: '/complaints', label: sw ? 'Malalamiko' : 'Complaints' },
    ],
  },
]

const SOCIAL = [
  { name: 'facebook', href: 'https://facebook.com/oweru.org', label: 'Facebook' },
  { name: 'x', href: 'https://x.com/oweruorg', label: 'X' },
  { name: 'instagram', href: 'https://instagram.com/oweru.org', label: 'Instagram' },
  { name: 'whatsapp', href: 'https://wa.me/255744528913', label: 'WhatsApp' },
]

const CONTACT = [
  { icon: 'mail', href: 'mailto:info@oweru.org', label: 'info@oweru.org' },
  { icon: 'phone', href: 'tel:+255744528913', label: '+255 744 528 913' },
  { icon: 'pin', href: null, label: 'Dar es Salaam, Tanzania' },
]

export default function Footer() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const year = new Date().getFullYear()
  const columns = COLUMNS(sw)

  return (
    <footer id="contact" className="mt-auto bg-ink-950 text-white">
      <div className="h-1 w-full bg-gradient-to-r from-gold-500 via-oweru-700 to-ink-950" aria-hidden="true" />

      <div className="mx-auto w-full max-w-[1280px] px-5 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-10">
          {/* ---------- Brand ---------- */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img src="/oweru-logo-sm.png" alt="" className="h-10 w-auto brightness-0 invert" aria-hidden="true" />
              <span className="flex flex-col leading-none">
                <span className="font-display text-[1.125rem] font-extrabold tracking-tight text-white">OWERU</span>
                <span className="mt-[3px] text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-400">
                  Foundation
                </span>
              </span>
            </Link>

            <p className="mt-6 max-w-xs text-[0.9375rem] leading-relaxed text-white/65">
              {sw
                ? 'Kwa msingi wa huduma ya Kikristo, tunasaidia shule, kliniki, makanisa na jamii kwa vifaa vilivyoidhinishwa. Michango hulipia kifaa mahususi.'
                : 'Rooted in Christian service, we support schools, clinics, churches and communities with approved equipment. Each gift is tied to a specific item.'}
            </p>

            {/* This rule is the foundation's whole promise, so it reads as
                a badge rather than disappearing into the copyright line. */}
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3.5 py-1.5 text-xs font-semibold text-gold-300">
              <Icon name="shield" className="h-3.5 w-3.5" />
              {sw ? 'Hakuna mgao wa fedha taslimu — vifaa vilivyoidhinishwa pekee' : 'No cash grants — approved equipment only'}
            </p>

            {SITE.ngoRegistration && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-medium text-white/70">
                <Icon name="verify" className="h-3.5 w-3.5" />
                Reg. No. {SITE.ngoRegistration}
              </p>
            )}

            <ul className="mt-6 flex items-center gap-2">
              {SOCIAL.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={s.label}
                    className="grid h-10 w-10 place-items-center rounded-[10px] border border-white/20 text-white/75 transition-colors hover:border-gold-500/60 hover:bg-gold-500/10 hover:text-gold-300"
                  >
                    <Icon name={s.name} className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ---------- Link columns ---------- */}
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-gold-400">
                {col.title}
              </h3>
              <ul className="mt-5 grid gap-3">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-[0.9375rem] text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* ---------- Contact ---------- */}
        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-8">
          {CONTACT.map((c) => {
            const inner = (
              <>
                <Icon name={c.icon} className="h-4 w-4 shrink-0 text-gold-400" />
                <span className="text-[0.9375rem] text-white/75">{c.label}</span>
              </>
            )
            return c.href ? (
              <a
                key={c.label}
                href={c.href}
                className="flex items-center gap-2.5 transition-colors hover:text-white"
              >
                {inner}
              </a>
            ) : (
              <span key={c.label} className="flex items-center gap-2.5">
                {inner}
              </span>
            )
          })}
        </div>
      </div>

      {/* ---------- Legal ---------- */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-5 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            &copy; {year} Oweru Foundation Tanzania
          </span>
          <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>{sw ? 'Imesajiliwa Tanzania' : 'Registered in Tanzania'}</span>
            <span className="text-white/25" aria-hidden="true">
              /
            </span>
            <Link to="/privacy" className="transition-colors hover:text-white/80">
              {sw ? 'Siri' : 'Privacy'}
            </Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
