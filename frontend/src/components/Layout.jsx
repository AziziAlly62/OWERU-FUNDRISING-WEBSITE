import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

/**
 * Scroll reveal. Elements opt in with className="reveal is-hidden".
 * One IntersectionObserver per route, no MutationObserver.
 */
function RevealObserver() {
  const { pathname } = useLocation()

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const pending = () => document.querySelectorAll('.reveal.is-hidden:not(.is-visible)')

    if (reduced || typeof IntersectionObserver === 'undefined') {
      pending().forEach((el) => el.classList.add('is-visible'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' },
    )

    const observeAll = () => pending().forEach((el) => io.observe(el))
    observeAll()

    // Late-mounted content (tabs, modals, lazy lists) also gets observed.
    const mo = new MutationObserver(observeAll)
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [pathname])

  return null
}

export default function Layout() {
  return (
    <div className="marketing flex min-h-screen flex-col bg-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[8px] focus:bg-oweru-800 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {typeof document !== 'undefined' && document.documentElement.lang === 'sw'
          ? 'Rukia yaliyomo'
          : 'Skip to content'}
      </a>
      <Header />
      <main id="main" className="flex-1">
        <RevealObserver />
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
