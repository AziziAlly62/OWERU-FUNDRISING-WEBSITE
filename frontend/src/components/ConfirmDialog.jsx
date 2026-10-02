import { useEffect, useRef } from 'react'

/** ===== Reusable confirmation dialog =====
 * Replaces window.confirm/prompt across the admin portal. Accessible
 * (role="alertdialog", Escape closes, autofocus on cancel), busy-aware.
 * Callers pass translated labels.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  icon,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  onConfirm,
  onClose,
}) {
  const cancelRef = useRef(null)
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy, onClose])

  if (!open) return null

  const toneBtn =
    tone === 'warning' ? 'bg-gold-500 hover:bg-gold-600'
    : tone === 'primary' ? 'bg-oweru-600 hover:bg-oweru-700'
    : 'bg-error-600 hover:bg-error-700'

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cf-dialog-title"
      aria-describedby="cf-dialog-message"
    >
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={!busy ? onClose : undefined}
        className="absolute inset-0 bg-ink-900/40"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-toast-in">
        <div className="flex items-start gap-4">
          {icon && (
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg ${
              tone === 'warning' ? 'bg-gold-100 text-gold-700' : tone === 'primary' ? 'bg-oweru-100 text-oweru-700' : 'bg-error-100 text-error-600'
            }`} aria-hidden="true">{icon}</span>
          )}
          <div className="min-w-0">
            <h2 id="cf-dialog-title" className="text-base font-bold text-ink-900">{title}</h2>
            <div id="cf-dialog-message" className="mt-1 text-sm leading-relaxed text-ink-600">{message}</div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            ref={cancelRef}
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60 ${toneBtn}`}
          >
            {busy && (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}