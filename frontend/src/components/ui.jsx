import { Link } from 'react-router-dom'
import { Icon } from './icons'

/* ============================================================
   OWERU — shared layout & content primitives
   One place to build a page from, so every screen inherits the
   same rhythm, spacing and type scale.
   ============================================================ */

export function Container({ as: As = 'div', size = 'default', className = '', children, ...rest }) {
  const width = size === 'narrow' ? 'max-w-3xl' : size === 'wide' ? 'max-w-[1360px]' : 'max-w-[1200px]'
  return (
    <As className={`mx-auto w-full ${width} px-5 sm:px-6 ${className}`} {...rest}>
      {children}
    </As>
  )
}

export function Section({
  as: As = 'section',
  tone = 'white',      // white | sand | forest | none
  size = 'default',    // default | small
  className = '',
  children,
  ...rest
}) {
  const tones = {
    white: 'bg-surface',
    sand: 'bg-cream',
    paper: 'bg-paper',
    forest: 'bg-oweru-900 text-white',
  }
  const pad = size === 'small' ? 'py-12 sm:py-16' : 'py-16 sm:py-20 lg:py-24'
  return (
    <As className={`${tones[tone] || tones.white} ${pad} ${className}`} {...rest}>
      {children}
    </As>
  )
}

/** Section heading. `align="left"` reads better for most pages than centred. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
  tone = 'light',
  action,
  className = '',
  children,
}) {
  const onDark = tone === 'dark'
  const centered = align === 'center'
  return (
    <div
      className={`flex flex-col gap-4 ${
        centered ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between md:gap-10'
      } ${className}`}
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <span className={`eyebrow ${onDark ? 'eyebrow-on-dark' : ''}`}>{eyebrow}</span>
        )}
        {title && <h2 className={`display-md mt-4 text-balance ${onDark ? 'text-white' : ''}`}>{title}</h2>}
        {lede && <p className="lede mt-4 text-pretty">{lede}</p>}
        {children}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-3">{action}</div>}
    </div>
  )
}

export function Card({ as: As = 'div', interactive = false, className = '', children, ...rest }) {
  const hover = interactive
    ? 'transition duration-200 hover:-translate-y-0.5 hover:border-oweru-300 hover:shadow-[var(--shadow-lift)]'
    : ''
  return (
    <As className={`card-base ${hover} ${className}`} {...rest}>
      {children}
    </As>
  )
}

export function Panel({ tone = 'white', className = '', children, ...rest }) {
  const tones = { white: 'bg-surface', sand: 'bg-cream', quiet: 'bg-paper', brand: 'bg-oweru-50' }
  return (
    <div className={`rounded-[14px] border border-ink-200 ${tones[tone]} ${className}`} {...rest}>
      {children}
    </div>
  )
}

/** Small uppercase label used above headings. */
export function Eyebrow({ children, onDark = false, className = '' }) {
  return <span className={`eyebrow ${onDark ? 'eyebrow-on-dark' : ''} ${className}`}>{children}</span>
}

export function Chip({ tone = 'default', icon, className = '', children }) {
  const tones = { default: 'chip', accent: 'chip chip-accent', brand: 'chip chip-brand' }
  return (
    <span className={`${tones[tone] || tones.default} ${className}`}>
      {icon && <Icon name={icon} className="h-3.5 w-3.5" />}
      {children}
    </span>
  )
}

/** Headline figure + caption. */
export function Stat({ value, prefix, suffix, label, caption, onDark = false, className = '' }) {
  return (
    <div className={className}>
      <div className={`stat-num text-4xl sm:text-[2.75rem] ${onDark ? 'text-white' : 'text-oweru-800'}`}>
        {prefix && <span className="text-[0.5em] tracking-normal opacity-70">{prefix}</span>}
        {value}
        {suffix && <span className="text-[0.5em] tracking-normal opacity-70">{suffix}</span>}
      </div>
      <div className={`mt-2 text-sm font-semibold ${onDark ? 'text-white/85' : 'text-ink-800'}`}>{label}</div>
      {caption && <div className="mt-1 text-sm text-ink-500">{caption}</div>}
    </div>
  )
}

/** Underlined "read more" link. */
export function LinkArrow({ to, href, children, className = '' }) {
  const inner = (
    <>
      {children}
      <Icon name="arrow-right" className="icon h-4 w-4" />
    </>
  )
  const cls = `link-arrow ${className}`
  if (to) return <Link to={to} className={cls}>{inner}</Link>
  return <a href={href} className={cls}>{inner}</a>
}

/** Framed photograph with a consistent 4:3 crop. */
export function Frame({ src, alt, ratio = 'aspect-[4/3]', className = '', imgClassName = '' }) {
  return (
    <div className={`overflow-hidden rounded-[14px] bg-ink-50 ${ratio} ${className}`}>
      <img src={src} alt={alt} loading="lazy" className={`h-full w-full object-cover ${imgClassName}`} />
    </div>
  )
}

/** Numbered process step. */
export function Step({ index, title, children, onDark = false }) {
  return (
    <div>
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full text-[0.8125rem] font-semibold tabular-nums ${
          onDark ? 'bg-white/10 text-gold-300' : 'bg-oweru-50 text-oweru-800'
        }`}
      >
        {index}
      </div>
      <h3 className={`mt-4 text-[1.0625rem] ${onDark ? 'text-white' : 'text-ink-900'}`}>{title}</h3>
      <p className="mt-2 text-[0.9375rem] leading-relaxed">{children}</p>
    </div>
  )
}

/** Vertical list of trust points — icon, title, one line of proof. */
export function Point({ icon, title, children, onDark = false }) {
  return (
    <div className="flex gap-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
          onDark ? 'bg-white/10 text-gold-300' : 'bg-oweru-50 text-oweru-700'
        }`}
      >
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <div>
        <h3 className={`text-[0.9375rem] font-semibold ${onDark ? 'text-white' : 'text-ink-900'}`}>{title}</h3>
        <p className="mt-1 text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  )
}

/** Long-form copy block for policy / about pages. */
export function Prose({ as: As = 'div', className = '', children, ...rest }) {
  return <As className={`prose-oweru ${className}`} {...rest}>{children}</As>
}
