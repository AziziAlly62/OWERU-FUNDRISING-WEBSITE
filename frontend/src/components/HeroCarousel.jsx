import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './icons'

const AUTOPLAY_MS = 7000

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Full-bleed hero carousel.
 *
 * Slides crossfade and advance on a timer. The timer is deliberately NOT
 * suspended on hover: the hero fills the middle of the first viewport, which
 * is where the cursor rests by default, so pausing on hover left the carousel
 * looking completely static to most visitors. It still stops advancing while
 * a keyboard user is focused inside it (tabbing to the arrows is enough to
 * hold the slide), while the tab is hidden, and when the visitor has asked
 * for reduced motion. Controls are real buttons so the carousel is keyboard
 * operable, and inactive slides are hidden from assistive tech.
 */
export default function HeroCarousel({ slides, label }) {
  const [index, setIndex] = useState(0)
  const [focusPaused, setFocusPaused] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [navTick, setNavTick] = useState(0)
  const sectionRef = useRef(null)
  const count = slides.length
  const paused = focusPaused || hidden

  const go = useCallback(
    (next) => {
      setIndex(((next % count) + count) % count)
      // Restarting the window means a manual tap never gets cut off by a
      // tick that was already queued.
      setNavTick((t) => t + 1)
    },
    [count],
  )

  useEffect(() => {
    if (count < 2 || paused || prefersReducedMotion()) return undefined
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [count, paused, navTick])

  // Don't burn the timer on a background tab, and don't silently skip past
  // slides while the visitor is away.
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    onVisibility()
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1) }
  }

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label={label}
      data-slide={index}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onFocusCapture={() => setFocusPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocusPaused(false)
      }}
      className="photo-scrim relative isolate mx-auto flex min-h-[430px] w-[calc(100%-1rem)] flex-col items-center overflow-hidden rounded-t-[28px] bg-ink-950 sm:w-[calc(100%-2rem)] sm:rounded-t-[42px]"
    >
      {/* ---------- Slide photography ---------- */}
      <div className="absolute inset-0 -z-10">
        {slides.map((s, i) => (
          <img
            key={s.src}
            src={s.src}
            alt=""
            aria-hidden="true"
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>

      {/* ---------- Slide copy (left-aligned like the About hero) ---------- */}
      <div className="photo-copy relative mx-auto flex min-h-0 w-full max-w-[1180px] flex-1 flex-col items-start justify-center px-5 py-14 text-left sm:px-6">
        {slides.map((s, i) => (
          <div
            key={s.src + s.headline}
            aria-hidden={i !== index}
            className={`max-w-[44rem] transition-opacity duration-700 ${
              i === index ? 'opacity-100' : 'pointer-events-none absolute opacity-0'
            }`}
          >
            <p className="hero-copy text-[13px] font-semibold tracking-[3px] text-white/90">
              {s.eyebrow}
            </p>
            <h1 className="hero-copy mt-4 mb-6 max-w-[34rem] font-display text-[clamp(34px,5vw,60px)] font-bold leading-[1.05] tracking-[-0.02em] text-white">
              {s.headline}
            </h1>
            <p className="hero-copy max-w-[34rem] text-[17px] leading-[1.7] text-white/90">
              {s.body}
            </p>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
              <Link
                to={s.ctaTo}
                className="inline-flex rounded-[4px] bg-white px-7 py-3.5 text-[14px] font-semibold text-oweru-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-oweru-50"
                tabIndex={i === index ? 0 : -1}
              >
                {s.cta}
                <Icon name="arrow-right" className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to={s.ctaAltTo}
                className="inline-flex items-center rounded-[4px] border border-white/30 px-6 py-3.5 text-[14px] font-semibold text-white transition-all duration-300 hover:border-white/60 hover:bg-white/10"
                tabIndex={i === index ? 0 : -1}
              >
                {s.ctaAlt}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- Controls ---------- */}
      {count > 1 && (
        <div className="photo-copy mx-auto flex w-full max-w-[1280px] shrink-0 items-center justify-end gap-2 px-5 pb-4 sm:px-6 sm:pb-5">
          <button
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white/85 transition-colors hover:border-white/60 hover:bg-white/10 hover:text-white"
          >
            <Icon name="arrow-left" className="h-4 w-4" />
          </button>
          <span
            className="hero-copy min-w-[3.25rem] text-center text-[0.75rem] font-semibold tabular-nums text-white/75"
            aria-live="polite"
          >
            {index + 1} / {count}
          </span>
          <button
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white/85 transition-colors hover:border-white/60 hover:bg-white/10 hover:text-white"
          >
            <Icon name="arrow-right" className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ---------- Photo credit (CC BY / CC BY-SA attribution) ---------- */}
      {slides[index]?.credit && (
        <p className="hero-copy photo-copy absolute bottom-2 right-4 max-w-[16rem] text-right text-[0.625rem] leading-tight text-white/55 sm:right-6">
          {slides[index].credit}
        </p>
      )}
    </section>
  )
}
