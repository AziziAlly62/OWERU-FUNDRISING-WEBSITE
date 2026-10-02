// ===== In-app event bus for "data changed, refresh" =====
// In addition to firing on explicit mutations (POST/PATCH/DELETE),
// it emits a periodic "poll" tick so every subscribed list refreshes
// itself even when data changes externally (webhooks, other browsers).
//
// Poll cadence: only tick when the tab/page is actually visible, and
// wait longer than the old 15s. The backend runs on PHP's built-in
// single-threaded dev server, so parallel polls from hidden tabs saturate
// it and make every page (e.g. Approved Requests) appear frozen.
const listeners = new Set()
const POLL_MS = 45000

export function onStatsChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function notifyStatsChange() {
  listeners.forEach((fn) => fn())
}

function tick() {
  const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden'
  if (hidden) return
  listeners.forEach((fn) => fn())
}

if (typeof setInterval !== 'undefined') {
  setInterval(tick, POLL_MS)
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('visibilitychange', () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') tick()
    })
  }
}