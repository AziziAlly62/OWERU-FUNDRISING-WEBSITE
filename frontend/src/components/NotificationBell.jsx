import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { useI18n } from '../i18n'
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../api'
import { Icon } from './icons'

/** ===== NotificationBell =====
 * In-app notification centre for any signed-in role. Polls lazily on open,
 * shows an unread badge, one-click mark-read + navigate to the deep-link
 * stored on each notification (e.g. /track/..., /portal/church).
 */
export default function NotificationBell({ hero }) {
  const { user } = useAuth()
  const { t, lang } = useI18n()
  const sw = lang === 'sw'
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchNotifications()
      setItems(data)
      setLoaded(true)
    } catch {
      /* silently ignore */
    } finally {
      setLoading(false)
    }
  }

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && !loaded) load()
  }

  const unread = items.filter((n) => !n.read).length

  const openNotification = async (n) => {
    if (!n.read) {
      try {
        await markNotificationRead(n.id)
        setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      } catch {
        load()
      }
    }
    setOpen(false)
    if (n.url) navigate(n.url)
  }

  const markAll = async () => {
    try {
      await markAllNotificationsRead()
      setItems((list) => list.map((x) => ({ ...x, read: true })))
    } catch {
      load()
    }
  }

  if (!user) return null

  const label = sw ? 'Arifa' : 'Notifications'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={label}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
          hero
            ? 'border-white/30 text-white/85 hover:bg-white/10'
            : 'border-ink-200 text-ink-600 hover:bg-ink-100'
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[60] w-80 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl">
          <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
            <span className="text-sm font-bold text-ink-900">{label}</span>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-xs font-semibold text-oweru-700 hover:underline">
                {sw ? 'Soma zote' : 'Mark all read'}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && !loaded && (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-ink-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-oweru-600" aria-hidden="true" />
                {sw ? 'Inapakia...' : 'Loading...'}
              </div>
            )}

            {loaded && items.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-ink-500">
                <Icon name="bell" className="mx-auto mb-2 h-6 w-6" />
                {sw ? 'Hakuna arifa.' : 'No notifications yet.'}
              </div>
            )}

            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => openNotification(n)}
                className={`block w-full border-b border-ink-50 px-4 py-3 text-left transition-colors hover:bg-ink-50 ${n.read ? '' : 'bg-oweru-50/60'}`}
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-ink-200' : 'bg-oweru-500'}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink-900 leading-snug">{n.title}</div>
                    {n.body && <div className="mt-0.5 text-xs text-ink-500 leading-snug line-clamp-2">{n.body}</div>}
                    <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-ink-500">{n.date}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}