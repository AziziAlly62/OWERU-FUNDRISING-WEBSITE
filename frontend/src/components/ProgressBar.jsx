export default function ProgressBar({ raised, target, complete, size = 'default', showLabel = false, className = '' }) {
  const percentage = Math.min(100, Math.max(0, target > 0 ? (raised / target) * 100 : 0))
  const pct = Math.round(percentage)

  return (
    <div className={className}>
      <div
        className={`progress-track ${size === 'lg' ? 'progress-lg' : ''}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% funded`}
      >
        <div
          className={`progress-fill ${complete ? 'progress-fill-complete' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1.5 flex items-center justify-between text-xs text-ink-500">
          <span>{pct}% funded</span>
        </div>
      )}
    </div>
  )
}
