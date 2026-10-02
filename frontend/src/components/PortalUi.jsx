import { useState, useEffect, useRef } from 'react'

const STROKE = 'var(--color-oweru-800)'

export function CountUp({ value, prefix = '', suffix = '', duration = 1800, decimals = 0 }) {
  const [val, setVal] = useState(0)
  const lastTarget = useRef(null)
  useEffect(() => {
    const target = Number(value) || 0
    if (lastTarget.current === target) return
    lastTarget.current = target
    const start = performance.now()
    let raf
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(target * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setVal(target)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  const formatted = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString('en-US')
  return <>{prefix}{formatted}{suffix}</>
}

/* Small stroke line icons (no emoji) */
export function Icon({ name, className = 'w-5 h-5' }) {
  const common = { className, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' }
  switch (name) {
    case 'donate':
      return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>
    case 'box':
      return <svg {...common}><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="M3 8l9 5 9-5M12 13v8" /></svg>
    case 'list':
      return <svg {...common}><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" /></svg>
    case 'check':
      return <svg {...common}><path d="M20 6 9 17l-5-5" /></svg>
    case 'x':
      return <svg {...common}><path d="M18 6 6 18M6 6l12 12" /></svg>
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
    case 'docs':
      return <svg {...common}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" /><path d="M14 3v6h6" /><path d="M9 13h6M9 17h6" /></svg>
    case 'gear':
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.14-1.4l2-1.5-2-3.4-2.3 1A7 7 0 0 0 14 5.5L13.7 3h-3.4L10 5.5a7 7 0 0 0-2.5 1.6l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .47.05.93.14 1.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.5 1.6l.3 2.5h3.4l.3-2.5a7 7 0 0 0 2.5-1.6l2.3 1 2-3.4-2-1.5c.09-.47.14-.93.14-1.4Z" /></svg>
    case 'truck':
      return <svg {...common}><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></svg>
    case 'user':
      return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
    case 'shield':
      return <svg {...common}><path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" /></svg>
    case 'file':
      return <svg {...common}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" /><path d="M14 3v6h6" /></svg>
    case 'arrow':
      return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    case 'coins':
      return <svg {...common}><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v5c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 11v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" /></svg>
    case 'heart':
      return <svg {...common}><path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z" /></svg>
    case 'map':
      return <svg {...common}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" /></svg>
    case 'bell':
      return <svg {...common}><path d="M18 15V10a6 6 0 1 0-12 0v5l-1.5 2h15L18 15Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
    case 'chart':
      return <svg {...common}><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 20v-6M12.5 20V9M17 20v-9" /></svg>
    case 'search':
      return <svg {...common}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
    case 'logout':
      return <svg {...common}><path d="M14 4h-8v16h8" /><path d="M10 12h11" /><path d="m18 9 3 3-3 3" /></svg>
    case 'plus':
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>
    case 'alert':
      return <svg {...common}><path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4.5" /><path d="M12 17.5h.01" /></svg>
    case 'mail':
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6 8.5-6" /></svg>
    case 'phone':
      return <svg {...common}><path d="M6 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L15 12l5 2v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4 6.2 2 2 0 0 1 6 4Z" /></svg>
    case 'pin':
      return <svg {...common}><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
    case 'calendar':
      return <svg {...common}><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
    case 'photo':
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.5" /><path d="m4 17 5-5 4 4 2.5-2 4.5 4" /></svg>
    case 'download':
      return <svg {...common}><path d="M12 4v10" /><path d="m8 10 4 4 4-4" /><path d="M4 18v2h16v-2" /></svg>
    case 'print':
      return <svg {...common}><path d="M7 9V4h10v5" /><rect x="4" y="9" width="16" height="7" rx="2" /><path d="M7 14h10v6H7z" /></svg>
    case 'eye':
      return <svg {...common}><path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg>
    case 'upload':
      return <svg {...common}><path d="M12 20V10" /><path d="m8 14 4-4 4 4" /><path d="M4 6V4h16v2" /></svg>
    case 'trash':
      return <svg {...common}><path d="M4 7h16" /><path d="M9 7V4.5h6V7" /><path d="M6 7l1 13h10l1-13" /><path d="M10 11v6M14 11v6" /></svg>
    case 'edit':
      return <svg {...common}><path d="M4 20h4L20 8l-4-4L4 16v4Z" /><path d="m14 6 4 4" /></svg>
    case 'lock':
      return <svg {...common}><rect x="4.5" y="10" width="15" height="10" rx="2" /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" /></svg>
    case 'flag':
      return <svg {...common}><path d="M6 21V4" /><path d="M6 5h11l-2 3.5L17 12H6" /></svg>
    case 'message':
      return <svg {...common}><path d="M4 5h16v11H9l-5 4V5Z" /></svg>
    case 'home':
      return <svg {...common}><path d="M4 10.5 12 4l8 6.5V20H4v-9.5Z" /><path d="M10 20v-5h4v5" /></svg>
    case 'book':
      return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5" /></svg>
    case 'star':
      return <svg {...common}><path d="m12 4 2.4 5 5.6.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.6-.8L12 4Z" /></svg>
    case 'send':
      return <svg {...common}><path d="M4 12 20 4l-8 16-2-6-6-2Z" /></svg>
    case 'refresh':
      return <svg {...common}><path d="M20 12a8 8 0 1 1-2.5-5.8" /><path d="M20 4v4h-4" /></svg>
    case 'info':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></svg>
    case 'ban':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="m5.5 5.5 13 13" /></svg>
    case 'building':
      return <svg {...common}><path d="M4 21V6l7-3 7 3v15" /><path d="M4 21h16" /><path d="M9 9h1.5M13.5 9H15M9 13h1.5M13.5 13H15" /></svg>
    case 'users':
      return <svg {...common}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 5.2a3.5 3.5 0 0 1 0 5.6" /><path d="M17.5 14.2A6.5 6.5 0 0 1 21.5 20" /></svg>
    default:
      return null
  }
}

/* Circular progress ring */
export function Ring({ pct, size = 72, stroke = 6, tone = STROKE, children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const [shown, setShown] = useState(0)
  useEffect(() => {
    let raf
    const start = performance.now()
    const dur = 900
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur)
      setShown(pct * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setShown(pct)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pct])
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-oweru-100)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={tone} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * Math.min(1, shown)) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

export function StatCard({ value, label, icon, pct, tone = 'oweru', render, prefix = '', suffix = '', children }) {
  const tones = {
    oweru: { hex: 'var(--color-oweru-800)', text: 'text-oweru-700', bg: 'bg-oweru-50' },
    gold: { hex: 'var(--color-gold-500)', text: 'text-gold-800', bg: 'bg-gold-50' },
    green: { hex: 'var(--color-success-500)', text: 'text-success-700', bg: 'bg-success-50' },
    red: { hex: 'var(--color-error-500)', text: 'text-error-700', bg: 'bg-error-50' },
    ink: { hex: 'var(--color-ink-700)', text: 'text-ink-700', bg: 'bg-ink-50' },
  }
  const t = tones[tone] || tones.oweru
  return (
    <div className="portal-stat-card flex items-center gap-4 p-5">
      {pct !== undefined ? (
        <Ring pct={pct} tone={t.hex} size={64} stroke={6}>
          <Icon name={icon} className={`h-6 w-6 ${t.text}`} />
        </Ring>
      ) : icon ? (
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] ${t.bg}`}>
          <Icon name={icon} className={`h-6 w-6 ${t.text}`} />
        </div>
      ) : null}
      <div className="min-w-0">
        <div className={`text-2xl font-semibold leading-tight tracking-[-0.02em] tabular-nums ${children ? '' : t.text}`}>
          {children || (render ? render() : <CountUp value={value} prefix={prefix} suffix={suffix} />)}
        </div>
        <div className="mt-0.5 truncate text-[0.8125rem] text-ink-500">{label}</div>
      </div>
    </div>
  )
}

export function PortalHero({ icon, eyebrow, title, actions, accent = 'oweru' }) {
  return (
    <section className="portal-hero mb-7 overflow-hidden">
      <div className="relative px-6 py-7 md:px-8 md:py-8">
        <div className="absolute inset-y-0 left-0 w-1 bg-oweru-700" aria-hidden="true" />
        {eyebrow && (
          <div className="eyebrow mb-3">
            {icon && <Icon name={icon} className="h-4 w-4" />}
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="text-2xl leading-tight text-ink-900 md:text-[1.75rem]">{title}</h1>
        {actions && <div className="mt-5 flex flex-wrap gap-3">{actions}</div>}
      </div>
    </section>
  )
}

export function SectionTitle({ title, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 border-b border-ink-200 pb-3">
      <h2 className="text-lg text-ink-900">{title}</h2>
      {action}
    </div>
  )
}

/** Shared dark bar for every portal screen, so they all feel like one product. */
export function PortalHeader({ title, subtitle, name, onLogout, logoutLabel, action }) {
  const initial = ((name || '?').trim().charAt(0) || '?').toUpperCase()
  return (
    <header className="bg-oweru-900">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <img src="/oweru-logo.png" alt="OWERU" className="h-9 w-auto object-contain" />
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold text-white">{title}</p>
            {subtitle && <p className="text-xs text-oweru-100/80">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {name && (
            <span className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/85 md:inline-flex">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-gold-500 text-[0.6875rem] font-bold text-oweru-950">
                {initial}
              </span>
              <span className="font-semibold">{name}</span>
            </span>
          )}
          {action}
          {onLogout && (
            <button type="button" onClick={onLogout} className="btn-on-dark btn-sm">
              {logoutLabel}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export function EmptyState({ icon = 'box', title, sub, action }) {
  return (
    <div className="empty-state px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] bg-ink-50 text-ink-400">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <div className="font-semibold text-ink-800">{title}</div>
      {sub && <div className="mt-1 text-sm text-ink-500">{sub}</div>}
      {action && <div className="mt-5 flex justify-center gap-3">{action}</div>}
    </div>
  )
}