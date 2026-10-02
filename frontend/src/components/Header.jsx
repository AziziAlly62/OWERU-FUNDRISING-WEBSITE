import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useAuth, ROLES } from '../auth'
import NotificationBell from './NotificationBell'
import { Icon } from './icons'

/* Primary navigation. Every target is a real route. */
const NAV = (sw) => [
  { to: '/', label: sw ? 'Mwanzo' : 'Home' },
  { to: '/about', label: sw ? 'Kuhusu' : 'About' },
  { to: '/requests', label: sw ? 'Maombi' : 'Causes' },
  { to: '/ledger', label: sw ? 'Leja ya umma' : 'Public ledger' },
  { to: '/reports', label: sw ? 'Ripoti za athari' : 'Impact reports' },
  { to: '/contact', label: sw ? 'Wasiliana' : 'Contact' },
]

const SOCIAL = [
  { name: 'facebook', href: 'https://facebook.com/oweru.org', label: 'Facebook' },
  { name: 'x', href: 'https://x.com/oweruorg', label: 'X' },
  { name: 'instagram', href: 'https://instagram.com/oweru.org', label: 'Instagram' },
  { name: 'whatsapp', href: 'https://wa.me/255744528913', label: 'WhatsApp' },
]

export default function Header() {
  const { lang, setLang } = useI18n()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname, hash } = useLocation()
  const sw = lang === 'sw'

  useEffect(() => { setOpen(false) }, [pathname, hash])

  // Shrink the bar and lift a soft shadow once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Same-page anchors need the page to scroll after the route settles.
  useEffect(() => {
    if (!hash) return
    const el = document.querySelector(hash)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [pathname, hash])

  const items = NAV(sw)
  // Donate goods, volunteer and track-a-request were removed from the menu.
  // Partner, goods and volunteering all start on the contact form, which is
  // already in the main nav, so they are not repeated here.

  const navCls = ({ isActive }) =>
    `group relative px-1 py-2 text-[0.9375rem] font-semibold transition-colors ${
      isActive ? 'text-ink-900' : 'text-ink-600 hover:text-ink-900'
    }`

  return (
    <header
      className={`sticky top-0 z-50 border-b border-ink-200 bg-white transition-[box-shadow,background-color] duration-300 ${
        scrolled ? 'shadow-[0_8px_24px_rgba(7,38,43,0.09)]' : ''
      }`}
    >
      {/* ---------- Top bar: contact, social, language ---------- */}
      <div className="hidden border-b border-ink-200 bg-ink-950 text-white lg:block">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-6 px-5 py-2 sm:px-6">
          <div className="flex items-center gap-5 text-[0.8125rem] text-white/70">
            <a href="mailto:info@oweru.org" className="flex items-center gap-1.5 transition-colors hover:text-white">
              <Icon name="mail" className="h-3.5 w-3.5 text-gold-400" />
              info@oweru.org
            </a>
            <a href="tel:+255744528913" className="flex items-center gap-1.5 transition-colors hover:text-white">
              <Icon name="phone" className="h-3.5 w-3.5 text-gold-400" />
              +255 744 528 913
            </a>
            <span className="flex items-center gap-1.5">
              <Icon name="pin" className="h-3.5 w-3.5 text-gold-400" />
              Dar es Salaam, Tanzania
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ul className="flex items-center gap-1">
              {SOCIAL.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={s.label}
                    className="grid h-7 w-7 place-items-center rounded-[6px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Icon name={s.name} className="h-3.5 w-3.5" />
                  </a>
                </li>
              ))}
            </ul>
            <span className="h-4 w-px bg-white/15" aria-hidden="true" />
            <div className="flex items-center gap-1 text-[0.8125rem] font-semibold">
              <button
                onClick={() => setLang('en')}
                aria-current={!sw ? 'true' : undefined}
                className={`rounded-[6px] px-2 py-1 transition-colors ${
                  !sw ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                EN
              </button>
              <span className="text-white/25" aria-hidden="true">/</span>
              <button
                onClick={() => setLang('sw')}
                aria-current={sw ? 'true' : undefined}
                className={`rounded-[6px] px-2 py-1 transition-colors ${
                  sw ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                SW
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Main bar ---------- */}
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6">
        <div
          className={`flex items-center justify-between gap-6 transition-[height] duration-300 ${
            scrolled ? 'h-14' : 'h-[72px]'
          }`}
        >
          <Link to="/" className="flex items-center gap-2.5" aria-label="OWERU Foundation — home">
            <img
              src="/oweru-logo-sm.png"
              alt=""
              className={`w-auto object-contain transition-[height] duration-300 ${
                scrolled ? 'h-7' : 'h-9'
              }`}
              aria-hidden="true"
            />
            <span className="flex flex-col leading-none">
              <span className="text-[1.0625rem] font-extrabold tracking-[-0.02em] text-ink-900">
                OWERU
              </span>
              <span className="mt-[3px] text-[9px] font-semibold uppercase tracking-[0.2em] text-ink-500">
                Foundation
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
            {items.map((it) => (
              <NavLink key={it.to} to={it.to} className={navCls} end={it.to === '/'}>
                {({ isActive }) => (
                  <>
                    {it.label}
                    <span
                      className={`absolute -bottom-px left-0 h-[2px] rounded-full bg-gold-500 transition-all duration-200 ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                      aria-hidden="true"
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Language stays reachable on small screens via the mobile panel. */}
            <button
              onClick={() => setLang(sw ? 'en' : 'sw')}
              className="rounded-[8px] border border-ink-200 px-2.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-600 transition-colors hover:border-ink-400 hover:text-ink-900 lg:hidden"
              aria-label={sw ? 'Switch to English' : 'Badilisha kwa Kiswahili'}
            >
              {sw ? 'EN' : 'SW'}
            </button>

            {user && <NotificationBell hero={false} />}

            {user ? (
              <Link to={ROLES[user.role]?.path || '/portal'} className="btn-secondary btn-sm hidden sm:inline-flex">
                {user.role === 'applicant' ? (sw ? 'Maombi Yangu' : 'My Requests') : (sw ? 'Dashboard' : 'Dashboard')}
              </Link>
            ) : (
              <Link to="/login" className="btn-ghost btn-sm hidden sm:inline-flex">
                {sw ? 'Ingia' : 'Log in'}
              </Link>
            )}

            <Link to="/requests#causes" className="btn-primary">
              {sw ? 'Changia Sasa' : 'Donate Now'}
            </Link>

            <button
              className="-mr-1 flex h-10 w-10 items-center justify-center rounded-[8px] text-ink-700 transition-colors hover:bg-ink-50 lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              <Icon name={open ? 'close' : 'menu'} className="h-5 w-5" strokeWidth={1.9} />
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Mobile panel ---------- */}
      {open && (
        <div
          className={`animate-slide-up overflow-y-auto border-t border-ink-200 bg-white lg:hidden ${
            scrolled ? 'max-h-[calc(100dvh-56px)]' : 'max-h-[calc(100dvh-72px)]'
          }`}
        >
          <div className="mx-auto w-full max-w-[1280px] px-5 py-5 sm:px-6">
            <nav className="grid gap-0.5" aria-label="Mobile">
              {items.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className="rounded-[8px] px-3 py-2.5 text-[0.9375rem] font-semibold text-ink-700 transition-colors hover:bg-ink-50"
                >
                  {it.label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 flex items-center gap-2 border-t border-ink-200 pt-4">
              <button
                onClick={() => setLang(sw ? 'en' : 'sw')}
                className="rounded-[8px] border border-ink-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink-600"
              >
                {sw ? 'English' : 'Kiswahili'}
              </button>
              {user ? (
                <Link to={ROLES[user.role]?.path || '/portal'} className="btn-secondary btn-sm flex-1">
                  {sw ? 'Dashboard' : 'Dashboard'}
                </Link>
              ) : (
                <Link to="/login" className="btn-secondary btn-sm flex-1">
                  {sw ? 'Ingia' : 'Log in'}
                </Link>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-ink-200 pt-4 text-sm">
              <a href="tel:+255744528913" className="flex items-center gap-2 text-ink-600">
                <Icon name="phone" className="h-4 w-4 text-gold-600" />
                +255 744 528 913
              </a>
              <a href="mailto:info@oweru.org" className="ml-auto flex items-center gap-2 text-ink-600">
                <Icon name="mail" className="h-4 w-4 text-gold-600" />
                info@oweru.org
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
