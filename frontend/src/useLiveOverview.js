import { useEffect, useState, useCallback, useRef } from 'react'
import { fetchOverview } from './api'
import { onStatsChange } from './statsBus'

const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

const STORAGE_KEY = 'oweru_overview_cache'
const STORAGE_TS_KEY = 'oweru_overview_timestamp'

function isValidOverview(obj) {
  if (!obj || typeof obj !== 'object') return false
  // Must have at least one of these keys with a number value ≥ 0
  return (
    (typeof obj.donations?.total === 'number') ||
    (typeof obj.requests?.published === 'number') ||
    (typeof obj.items?.fully_funded === 'number') ||
    (typeof obj.suppliers?.verified === 'number')
  )
}

export default function useLiveOverview() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const hasDataRef = useRef(false)
  const forceRefreshRef = useRef(false)

  const refresh = useCallback(() => {
    if (!hasDataRef.current) setLoading(true)
    fetchOverview()
      .then((data) => {
        if (!isValidOverview(data)) return // don't store or render bogus data
        hasDataRef.current = true
        setOverview(data)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
          localStorage.setItem(STORAGE_TS_KEY, Date.now().toString())
        } catch { /* quota */ }
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    // Load from cache only if valid
    if (!forceRefreshRef.current) {
      try {
        const cached = localStorage.getItem(STORAGE_KEY)
        const timestamp = localStorage.getItem(STORAGE_TS_KEY)
        const now = Date.now()

        if (cached && timestamp && (now - Number(timestamp)) < CACHE_DURATION) {
          const parsed = JSON.parse(cached)
          if (isValidOverview(parsed)) {
            hasDataRef.current = true
            setOverview(parsed)
            setLoading(false)
            return // cache hit with valid data — still fetch in background
          }
        }
      } catch { /* corrupt cache */ }

      // Migrate or purge invalid/stale cache entries so they don't
      // keep showing zeros across revisits.
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_TS_KEY)
    }

    forceRefreshRef.current = false
    refresh()
  }, [refresh])

  useEffect(() => {
    const off = onStatsChange(() => {
      forceRefreshRef.current = true
      refresh()
    })
    return off
  }, [refresh])

  return { overview, refresh, loading }
}
