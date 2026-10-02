/** ===== ErrorState =====
 *  Consistent empty/error placeholder with optional retry + back actions.
 */

import Button from './Button'

export default function ErrorState({
  title = 'Something went wrong',
  message = '',
  onRetry,
  backTo = '/',
  backLabel = 'Go home',
  icon = 'alert',
}) {
  return (
    <div className="card-base p-8 sm:p-10 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-error-50 text-error-500" aria-hidden="true">
        {icon === 'alert' ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" /></svg>
        )}
      </div>
      <h2 className="text-xl font-bold text-ink-900">{title}</h2>
      {message && <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">{message}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
        <Button to={backTo} variant={onRetry ? 'ghost' : 'primary'}>{backLabel}</Button>
      </div>
    </div>
  )
}