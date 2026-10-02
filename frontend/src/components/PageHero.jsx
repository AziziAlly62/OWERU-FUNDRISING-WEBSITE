import { Container } from './ui'

/**
 * Standard opening band for interior pages.
 * `tone="dark"` inverts it for pages that lead with a statement.
 */
export default function PageHero({ title, subtitle, kicker, children, tone = 'light' }) {
  const dark = tone === 'dark'
  return (
    <section className={dark ? 'page-hero page-hero-dark' : 'page-hero'}>
      {dark && <div className="grid-texture pointer-events-none absolute inset-0" aria-hidden="true" />}
      <Container className={`relative py-14 sm:py-20 ${dark ? '' : 'lg:py-24'}`} size={subtitle ? 'default' : 'default'}>
        <div className="max-w-3xl">
          {kicker && (
            <span className={`eyebrow ${dark ? 'eyebrow-on-dark' : ''}`}>{kicker}</span>
          )}
          {title && <h1 className="display-lg mt-5 text-balance">{title}</h1>}
          {subtitle && <p className="lede mt-5 max-w-2xl text-pretty">{subtitle}</p>}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </Container>
    </section>
  )
}
