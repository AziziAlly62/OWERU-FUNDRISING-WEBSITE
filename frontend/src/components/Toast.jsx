import { createContext, useCallback, useContext, useRef, useState } from 'react'

/** ===== Global toast notifications =====
 * Provide { toast } via useToast(). Auto-dismissing, stacked bottom-right,
 * accessible (role="status"), pause-free. Types: 'success' | 'error' | 'info'.
 */

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((ts) => ts.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback((message, type = 'success', duration = 5000) => {
    const id = nextId++
    setToasts((ts) => [...ts.slice(-4), { id, message, type }])
    timers.current.set(
      id,
      setTimeout(() => dismiss(id), duration)
    )
    return id
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

const STYLES = {
  success: { ring: 'border-success-200', icon: 'bg-success-100 text-success-600', glyph: '✓', text: 'text-success-700' },
  error: { ring: 'border-error-200', icon: 'bg-error-100 text-error-600', glyph: '!', text: 'text-error-800' },
  info: { ring: 'border-ink-200', icon: 'bg-oweru-100 text-oweru-700', glyph: 'i', text: 'text-ink-800' },
}

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      className="fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((t) => {
        const s = STYLES[t.type] || STYLES.info
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border ${s.ring} bg-white p-4 shadow-lg shadow-ink-900/10 animate-toast-in`}
          >
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-bold ${s.icon}`} aria-hidden="true">
              {s.glyph}
            </span>
            <p className={`flex-1 text-sm font-medium leading-snug ${s.text}`}>{t.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="shrink-0 rounded-md p-1 text-ink-500 hover:bg-ink-100 hover:text-ink-700"
              aria-label="Dismiss notification"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}