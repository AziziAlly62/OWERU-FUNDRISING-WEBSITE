// ===== Analytics (env-gated) =====
// Weka VITE_ANALYTICS_ID kwenye frontend/.env ili kuwasha Google Analytics.
// Ikiwa haipo, hakuna code ya analytics inayobeba — hakuna tracking.

const ID = import.meta.env.VITE_ANALYTICS_ID

export function initAnalytics() {
  if (!ID || window.__oweruAnalytics) return
  window.__oweruAnalytics = true
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`
  document.head.appendChild(s)
  window.dataLayer = window.dataLayer || []
  window.gtag = function () { window.dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', ID)
}

export function track(event, params = {}) {
  if (typeof window.gtag !== 'function') return
  window.gtag('event', event, params)
}

/** Report an uncaught error to analytics when enabled (never throws). */
export function trackError(error, context = '') {
  const message = error?.message || String(error) || 'Unknown error'
  if (typeof window.gtag === 'function') {
    try {
      window.gtag('event', 'exception', {
        description: `${context ? context + ': ' : ''}${message}`,
        fatal: false,
      })
    } catch {
      /* swallow */
    }
  }
  if (import.meta.env.DEV) console.error('[analytics] error', context, error)
}