import { describe, it, expect, afterEach, vi } from 'vitest'
import { API_URL, fetchPublicReports, money } from '../api'

describe('API utilities', () => {
  describe('money formatter', () => {
    it('formats numbers as TZS currency', () => {
      expect(money(1000)).toBe('TZS 1,000')
      expect(money(10000)).toBe('TZS 10,000')
      expect(money(1000000)).toBe('TZS 1,000,000')
    })

    it('handles zero', () => {
      expect(money(0)).toBe('TZS 0')
    })

    it('handles null/undefined', () => {
      expect(money(null)).toBe('TZS 0')
      expect(money(undefined)).toBe('TZS 0')
    })

    it('preserves decimal values', () => {
      expect(money(1234.56)).toBe('TZS 1,234.56')
      expect(money(1234)).toBe('TZS 1,234')
    })
  })

  describe('public report evidence', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('builds an image URL only for explicitly approved evidence', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify([
          { id: 41, public_evidence: true, public_evidence_url: '/reports/41/public-evidence' },
          { id: 42, public_evidence: false, public_evidence_url: null },
        ])),
      }))

      const reports = await fetchPublicReports()
      const apiBase = API_URL.replace(/\/$/, '')

      expect(reports[0].publicEvidenceUrl).toBe(`${apiBase}/reports/41/public-evidence`)
      expect(reports[1].publicEvidenceUrl).toBe('')
    })
  })
})
