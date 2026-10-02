// ===== Lightweight SVG charts (no dependencies) =====

const NEUTRAL = 'var(--color-ink-100)'

/** Vertical bar chart from {labels[], values[]}. Real data only: bars with a
 *  value of zero render as a neutral track so an empty period reads as "no
 *  donations" rather than a fabricated series. */
export function Bars({ labels, values, height = 110, tone = 'var(--color-success-500)', unit = '' }) {
  const max = Math.max(...(values || []).map(Number), 1)
  const n = Array.isArray(values) ? values.length : 0
  if (n === 0) return null
  const bw = 100 / n
  const base = height - 14
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" role="img" aria-hidden="true">
      {values.map((v, i) => {
        const val = Number(v) || 0
        const h = Math.max(2, (val / max) * base)
        const x = i * bw + bw * 0.16
        const w = bw * 0.68
        return (
          <g key={i}>
            <rect x={x} y={base - h} width={w} height={h} rx="1.5" fill={val > 0 ? tone : NEUTRAL} />
            <title>{`${labels[i]}${unit}: ${val.toLocaleString()}`}</title>
          </g>
        )
      })}
      <line x1="0" y1={base} x2="100" y2={base} stroke="var(--color-ink-100)" strokeWidth="0.8" />
      <line x1="0" y1={base - (base * 50) / max} x2="100" y2={base - (base * 50) / max} stroke="var(--color-ink-50)" strokeWidth="0.6" strokeDasharray="1 2" />
    </svg>
  )
}

/** Value-summed donut. `data` = [{label, value, color}]. Renders a neutral
 *  ring when there is nothing to visualise. */
export function Donut({ data = [], size = 148, thickness = 20, center }) {
  const total = data.reduce((s, d) => s + Math.max(0, Number(d.value) || 0), 0)
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let consumed = 0
  return (
    <div className="inline-block">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label="Donut chart">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={NEUTRAL} strokeWidth={thickness} />
          {total > 0 && data.map((d, i) => {
            const len = c * (Math.max(0, Number(d.value) || 0) / total)
            const seg = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color || 'var(--color-success-500)'}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-consumed}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              >
                <title>{`${d.label}: ${Math.round((len / c) * 100)}%`}</title>
              </circle>
            )
            consumed += len
            return seg
          })}
        </svg>
        {center && <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>}
      </div>
    </div>
  )
}

/** Horizontal progress bar. pct clamped 0-100. */
export function Progress({ pct = 0, tone = 'var(--color-success-500)' }) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-ink-100)]" role="img" aria-label={`${Math.round(p)}%`}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, backgroundColor: tone }} />
    </div>
  )
}

/** Small labelled legend row for donuts/bars. */
export function Legend({ items = [] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5 text-xs text-ink-600">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  )
}