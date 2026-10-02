import { describe, it, expect } from 'vitest'
import { isFullyFunded, daysLeft, campaignEndTime } from '../utils/funding'

describe('funding utilities', () => {
  describe('isFullyFunded', () => {
    it('treats explicit closed statuses as fully funded', () => {
      for (const status of [
        'fully_funded',
        'fully-funded',
        'ordered',
        'delivered',
        'in_use',
        'verified',
      ]) {
        expect(isFullyFunded({ status })).toBe(true)
      }
    })

    it('does NOT treat a request with no funding data as fully funded', () => {
      // /requests/published returns no raised/target and an empty items array,
      // so these reach the client as undefined. Comparing naively made
      // 0 >= 0 true and emptied the homepage cause grid.
      expect(isFullyFunded({ status: 'published' })).toBe(false)
      expect(isFullyFunded({ status: 'published', raised: 0, target: 0 })).toBe(false)
      expect(isFullyFunded({ status: 'published', raised: null, target: null })).toBe(false)
      expect(isFullyFunded({ status: 'published', raised: '', target: '' })).toBe(false)
      expect(isFullyFunded({ status: 'published', raised: 0, items: [] })).toBe(false)
      expect(isFullyFunded(undefined)).toBe(false)
      expect(isFullyFunded({})).toBe(false)
    })

    it('treats a reached target as fully funded', () => {
      expect(isFullyFunded({ status: 'published', raised: 500000, target: 500000 })).toBe(true)
      expect(isFullyFunded({ status: 'published', raised: 600000, target: 500000 })).toBe(true)
    })

    it('leaves a partially funded request open', () => {
      expect(isFullyFunded({ status: 'published', raised: 250000, target: 500000 })).toBe(false)
      expect(isFullyFunded({ status: 'published', raised: 0, target: 500000 })).toBe(false)
    })
  })

  describe('campaign window', () => {
    it('falls back to a 60 day window from createdAt', () => {
      const created = '2026-01-01T00:00:00.000Z'
      const end = campaignEndTime({ createdAt: created, items: [] })
      expect(new Date(end).toISOString()).toBe('2026-03-02T00:00:00.000Z')
    })

    it('prefers the earliest item deadline', () => {
      const end = campaignEndTime({
        createdAt: '2026-01-01T00:00:00.000Z',
        items: [{ deadline: '2026-02-01T00:00:00.000Z' }, { deadline: '2026-01-20T00:00:00.000Z' }],
      })
      expect(new Date(end).toISOString()).toBe('2026-01-20T00:00:00.000Z')
    })

    it('never reports negative days remaining', () => {
      expect(daysLeft({ createdAt: '2020-01-01T00:00:00.000Z', items: [] })).toBe(0)
    })
  })
})
