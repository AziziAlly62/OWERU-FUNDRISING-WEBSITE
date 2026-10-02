import { useEffect, useState } from 'react'
import { SITE } from '../siteConfig'

export default function ContactModal({ open, onClose, subject = '' }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const mailto = `mailto:${SITE.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SITE.email)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = SITE.email
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md rounded-lg bg-white shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 h-9 w-9 rounded-full flex items-center justify-center text-ink-500 hover:bg-ink-50 hover:text-ink-900 transition-colors"
        >
          ✕
        </button>
        <span className="kicker mb-4">OWERU</span>
        <h2 className="text-2xl font-bold text-ink-900 mb-2">Tuwasiliane · Contact OWERU</h2>
        <p className="text-sm text-ink-600 mb-6">
          Andika barua pepe kwetu — tutakujibu haraka. Copy anwani au fungua app yako ya email moja kwa moja.
        </p>
        <div className="rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 flex items-center justify-between gap-3 mb-6">
          <span className="text-sm font-semibold text-ink-900">{SITE.email}</span>
          <button
            type="button"
            onClick={copy}
            className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${copied ? 'bg-success-500 text-white' : 'bg-oweru-600 text-white hover:bg-oweru-700'}`}
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
        <a
          href={mailto}
          target="_blank"
          rel="noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-oweru-600 hover:bg-oweru-700 text-white font-bold px-6 py-3.5 transition-colors"
        >
          Open email app
        </a>
        <button type="button" onClick={onClose} className="mt-3 w-full inline-flex items-center justify-center px-6 py-3 rounded-full border border-ink-300 text-ink-600 hover:bg-ink-50 font-semibold transition-colors">
          Close
        </button>
      </div>
    </div>
  )
}