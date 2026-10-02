import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fetchPublicLedger, money } from '../api'

/*
 * The public ledger is the page that promises to account for donated money.
 * An invoice carries two different numbers:
 *   - `amount`      what was invoiced / approved
 *   - `paid_amount` what actually left the account
 * These are not interchangeable. Reporting the first as "paid" overstated
 * what had been disbursed by 23,500,000 TZS, so the mapping is pinned here.
 */
const INVOICES = [
  {
    id: 1,
    invoice_number: 'INV-00125',
    amount: 6000000,
    paid_amount: 6000000,
    status: 'paid',
    receipt_url: 'receipts/inv-00125.jpg',
    supplier: { name: 'SolarWorks' },
    item: { name: 'Rim and other printing material', request_id: 4 },
  },
  {
    id: 2,
    invoice_number: 'INV-346',
    amount: 23500000,
    paid_amount: 0,
    status: 'paid',
    supplier: { name: 'MediLine' },
    item: { name: 'Adjustable Delivery Beds (x3)', request_id: 7 },
  },
]

describe('fetchPublicLedger', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ data: INVOICES })),
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps `amount` and `paid_amount` as separate fields', async () => {
    const rows = await fetchPublicLedger()

    expect(rows[0].amount).toBe(6000000)
    expect(rows[0].paidAmount).toBe(6000000)

    /* The approved-but-unpaid invoice. Conflating these two is the bug this
       test exists to prevent. */
    expect(rows[1].amount).toBe(23500000)
    expect(rows[1].paidAmount).toBe(0)
  })

  it('totals only real payments as disbursed', async () => {
    const rows = await fetchPublicLedger()

    const paid = rows.reduce((s, r) => s + r.paidAmount, 0)
    const approved = rows.reduce((s, r) => s + r.amount, 0)

    expect(paid).toBe(6000000)
    expect(approved).toBe(29500000)
    /* What a page reporting money spent may show. */
    expect(approved - paid).toBe(23500000)
  })

  it('does not report approved value as paid for an unpaid invoice', async () => {
    const rows = await fetchPublicLedger()
    const beds = rows.find((r) => r.reference === 'INV-346')

    expect(beds.paid).toBe(true)
    expect(money(beds.paidAmount)).toBe('TZS 0')
    /* Guard against a future refactor reading the wrong field again. */
    expect(beds.paidAmount).not.toBe(beds.amount)
  })

  it('carries the reference and supplier needed for the receipt link', async () => {
    const rows = await fetchPublicLedger()

    expect(rows[0].reference).toBe('INV-00125')
    expect(rows[0].supplier).toBe('SolarWorks')
    expect(rows[1].requestId).toBe(7)
  })

  it('keeps the public receipt path for paid invoices', async () => {
    const rows = await fetchPublicLedger()

    expect(rows[0].receiptUrl).toBe('receipts/inv-00125.jpg')
    /* Invoices that never moved money have nothing to attach a receipt to. */
    expect(rows[1].receiptUrl).toBe('')
  })
})
