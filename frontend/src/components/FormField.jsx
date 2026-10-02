// ===== OWERU shared form primitives =====
// Compact, consistent controls used across portal + admin forms.

export const inputCls =
  'w-full rounded-[10px] border border-ink-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 ' +
  'placeholder:text-ink-400 outline-none transition-colors duration-150 ' +
  'hover:border-ink-400 focus:border-oweru-600 focus:ring-3 focus:ring-oweru-600/15 ' +
  'disabled:bg-paper disabled:text-ink-400 disabled:cursor-not-allowed'

export function Field({ label, required, hint, error, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[0.8125rem] font-semibold text-ink-800">
          {label}
          {required && <span className="ml-0.5 text-error-600">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="text-[0.8125rem] text-error-700">{error}</p> : hint ? <p className="text-[0.8125rem] text-ink-500">{hint}</p> : null}
    </div>
  )
}

export function Select({ className = '', children, ...rest }) {
  return (
    <div className="relative">
      <select {...rest} className={`${className || inputCls} cursor-pointer appearance-none pr-10`}>
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}

export function TextArea({ className = '', children, ...rest }) {
  return <textarea {...rest} className={`${className || inputCls} min-h-28 resize-y leading-relaxed`}>{children}</textarea>
}
