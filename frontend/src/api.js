// ===== OWERU API client =====

import { notifyStatsChange } from './statsBus'
import { trackError } from './analytics'

export const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

const TOKEN_KEY = 'oweru_token'

/**
 * Get the authentication token from localStorage
 * @returns {string|null} The stored token or null if not found
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Set or remove the authentication token in localStorage
 * @param {string|null} token - The token to store, or null to remove
 */
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

/**
 * Format a number as Tanzanian Shillings currency
 * @param {number} n - The number to format
 * @returns {string} Formatted currency string (e.g., "TZS 10,000")
 */
export const money = (n) =>
  'TZS ' + Number(n || 0).toLocaleString('en-US')

async function handleResponse(res, token) {
  if (res.status === 204) return null
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: text || 'The server returned an unexpected response.' }
  }
  if (!res.ok) {
    if (res.status === 401 && token) {
      window.dispatchEvent(new CustomEvent('oweru:unauthorized'))
    }
    const msg =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') :
       res.status === 401 ? 'Authentication required. Please log in again.' :
       res.status === 403 ? 'You do not have permission to perform this action.' :
       res.status === 404 ? 'The requested resource was not found.' :
       res.status === 422 ? 'Invalid data provided. Please check your inputs.' :
       res.status === 429 ? 'Too many requests. Please wait a moment.' :
       res.status === 500 ? 'Server error. Please try again later.' :
       'Request failed. Please check your connection and try again.')
    const err = new Error(msg)
    err.status = res.status
    err.data = data
    err.retryable = res.status === 429 || res.status === 500 || res.status === 502 || res.status === 503 || res.status === 504
    throw err
  }
  return data
}

/**
 * Make an API request with retry logic for transient failures
 * @param {string} path - The API endpoint path
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method (default: 'GET')
 * @param {Object} options.body - Request body for POST/PUT/PATCH
 * @param {string} options.token - Authentication token (default: from localStorage)
 * @param {boolean} options.isFormData - Whether body is FormData (default: false)
 * @param {number} options.retries - Number of retry attempts for transient errors (default: 2)
 * @returns {Promise<any>} Response data
 * @throws {Error} With status, data, and retryable properties
 */
export async function api(path, { method = 'GET', body, token = getToken(), isFormData = false, retries = 2 } = {}) {
  const headers = { Accept: 'application/json' }
  if (body && !isFormData) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)
    let res
    try {
      res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
        signal: controller.signal,
      })
    } catch (err) {
      clearTimeout(timer)
      if (err?.name === 'AbortError') {
        const e = new Error('Request timed out. Please check your connection and try again.')
        e.status = 0
        e.retryable = true
        lastError = e
        if (attempt < retries) continue
        throw e
      }
      lastError = err
      if (attempt < retries) continue
      throw err
    }
    clearTimeout(timer)

    try {
      const data = await handleResponse(res, token)
      if (method !== 'GET') notifyStatsChange()
      return data
    } catch (err) {
      lastError = err
      if (err.retryable && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }
      throw err
    }
  }

  if (lastError) trackError(lastError, `api ${method} ${path}`)
  throw lastError
}

// ===== Mappers: hubadilisha data ya API kuwa fomu inayotumika kwenye kurasa =====

function mapRequest(req, includeItems = true) {
  const mappedItems = includeItems ? (req.items || []).map(mapItem) : []
  const raisedAll = mappedItems.reduce((s, i) => s + Number(i.raised || 0), 0)
  const targetAll = mappedItems.reduce((s, i) => s + Number(i.target_amount || 0), 0)
  return {
    id: req.id,
    title: req.title,
    swTitle: req.sw_title || req.title,
    region: req.region || '',
    churchName: req.church_name || '',
    category: req.category || '',
    org: req.organization?.name || req.organization_id || '',
    exposure: req.exposure_level || 'open',
    story: req.story || '',
    storySw: req.sw_story || req.story || '',
    status: req.status || '',
    decisionNote: req.decision_note || '',
    letterPath: req.letter_path || '',
    letterStatus: req.letter_status || 'missing',
    boardApproved: Boolean(req.board_approved),
    submittedAt: req.submitted_at || '',
    boardReviewedAt: req.board_reviewed_at || '',
    createdAt: req.created_at || '',
    raised: raisedAll,
    target: targetAll,
    donors: mappedItems.reduce((s, i) => s + Number(i.donor_count || 0), 0),
    items: mappedItems,
    comments: (req.comments || []).map((c) => ({
      id: c.id,
      author: c.author_name || c.author?.name || 'Anonymous',
      body: c.body,
      date: c.created_at ? new Date(c.created_at).toLocaleDateString() : '',
    })),
  }
}

function mapItem(item) {
  const confirmedDonations = (item.donations || []).filter((d) => d.status === 'confirmed')
  const donated = confirmedDonations.length
    ? confirmedDonations.reduce((s, d) => s + Number(d.amount_tzs || d.amount || 0), 0)
    : null
  const raised = Number(donated ?? item.amount_raised ?? item.raised ?? 0)
  const target = Number(item.target_amount || item.target || 0)
  const funded = ['fully_funded', 'ordered', 'delivered', 'in_use', 'verified'].includes(item.status) || raised >= target || item.status === 'fully-funded'
  return {
    id: item.id,
    name: item.name,
    swName: item.sw_name || '',
    description: item.description || '',
    swDescription: item.sw_description || '',
    category: item.category || '',
    target,
    raised,
    deadline: item.funding_deadline || item.deadline || '',
    status: funded ? 'fully-funded' : 'in-progress',
    amount_raised: raised,
    target_amount: target,
    donor_count: confirmedDonations.length,
    share_price: Number(item.share_price || 0),
    shares_total: Number(item.shares_total || 0),
    shares_funded: Number(item.shares_funded || 0),
    donations: (item.donations || []).map((d) => ({
      id: d.id,
      donor_name: d.donor_name || d.donor?.name || '',
      amount: Number(d.amount_tzs || d.amount || 0),
      amount_tzs: Number(d.amount_tzs || d.amount || 0),
      method: d.payment_method || '',
      date: d.created_at || d.confirmed_at || '',
      status: d.status,
      confirmed: d.status === 'confirmed',
    })),
  }
}

function mapDonation(d) {
  return {
    id: d.id,
    donor: d.donor_name || d.donor?.name || 'Anonymous',
    item: d.item?.name || '',
    requestId: d.item?.request?.id || null,
    requestTitle: d.item?.request?.title || '',
    requestStatus: d.item?.request?.status || '',
    amount: Number(d.amount_tzs || d.amount || 0),
    currency: d.currency || 'TZS',
    network: d.network || '',
    ref: d.payment_reference || `PAY-${d.id}`,
    status: d.status === 'confirmed' ? 'Confirmed' : 'Pending',
    statusRaw: d.status,
    receipt: d.mpesa_receipt || d.receipt || '',
    date: (d.donated_at || d.created_at || '').slice(0, 10),
  }
}

function mapSupplier(s) {
  return {
    id: s.id,
    name: s.name,
    contact: s.region || s.contact_phone || '',
    pageRegion: s.region,
    contact_person: s.contact_person,
    contact_phone: s.contact_phone,
    contact_email: s.contact_email,
    verified: s.verification_status === 'verified',
    verification_status: s.verification_status,
  }
}

function mapInvoice(i) {
  const raw = i.status
  const label = raw === 'paid' ? 'Paid'
    : raw === 'pending' ? 'Pending'
    : raw === 'awaiting_receipt' ? 'Awaiting Receipt'
    : raw === 'receipt_uploaded' ? 'Receipt Uploaded'
    : raw
  return {
    id: i.id,
    supplier: i.supplier?.name || '',
    item: i.item?.name || '',
    swItem: i.item?.sw_name || '',
    amount: Number(i.amount || 0),
    status: label,
    statusRaw: raw,
    invoiceNumber: i.invoice_number || '',
    receiptUrl: i.receipt_url || '',
    approvedBy: i.approver?.name || '',
    date: (i.created_at || '').slice(0, 10),
  }
}

function mapEquipment(e) {
  return {
    id: e.id,
    itemId: e.item_id || '',
    reg: e.register_number,
    item: e.item?.name || '',
    serial: e.serial_number || '',
    status: e.status || '',
    recipient: e.recipient?.name || e.item?.request?.organization?.name || '',
    region: e.item?.request?.organization?.region || e.location || '',
    date: (e.delivery_date || e.created_at || '').slice(0, 10),
    register_number: e.register_number,
    model: e.model,
    location: e.location,
    amount: e.amount ? Number(e.amount) : 0,
    statusRaw: e.status,
    parties_confirmed: e.parties_confirmed || [],
    delivery_complete: !!e.delivery_complete,
    evidence: !!e.evidence_path,
  }
}

function mapReport(r) {
  return {
    id: r.id,
    item: r.item?.name || '',
    type: r.type || '',
    due: r.due_date || '',
    status: r.status || '',
    recipient: r.recipient?.name || '',
    content: r.content || '',
    evidence: !!r.evidence_path,
    evidenceIsImage: !!r.evidence_is_image,
    publicEvidence: !!r.public_evidence,
  }
}

function mapAudit(a) {
  return {
    id: a.id,
    user: a.user?.name || a.user?.email || 'system',
    action: a.action,
    entity: `${a.entity || ''} #${a.entity_id || ''}`.trim(),
    date: (a.created_at || '').replace('T', ' ').slice(0, 16),
  }
}

// ===== Public API =====

/**
 * Fetch featured requests for the homepage
 * @returns {Promise<Array>} Array of mapped request objects
 */
export async function fetchFeaturedRequests() {
  const data = await api('/requests/featured?per_page=6')
  return (data.data || []).map((r) => mapRequest(r))
}

/**
 * Fetch published requests with optional filters
 * @param {Object} filters - Filter options
 * @param {string} filters.category - Filter by category
 * @param {string} filters.region - Filter by region
 * @param {string} filters.search - Search query
 * @returns {Promise<Array>} Array of mapped request objects
 */
export async function fetchRequests({ category, region, search } = {}) {
  const params = new URLSearchParams({ per_page: 50 })
  if (category) params.set('category', category)
  if (region) params.set('region', region)
  if (search) params.set('search', search)
  const data = await api(`/requests/published?${params}`)
  return (data.data || []).map((r) => mapRequest(r))
}

/**
 * Fetch a single request by ID
 * @param {number} id - Request ID
 * @returns {Promise<Object>} Mapped request object
 */
export async function fetchRequestById(id) {
  const req = await api(`/requests/${id}`)
  return mapRequest(req)
}

/**
 * Fetch public reports
 * @returns {Promise<Array>} Array of report objects
 */
export async function fetchPublicReports() {
  const data = await api('/reports/public')
  const apiBase = API_URL.replace(/\/$/, '')
  return (Array.isArray(data) ? data : []).map((report) => ({
    ...report,
    swItem: report.sw_item || '',
    publicEvidenceUrl: report.public_evidence && report.public_evidence_url
      ? `${apiBase}${report.public_evidence_url}`
      : '',
  }))
}

/**
 * Fund an item with a donation
 * @param {Object} donation - Donation details
 * @param {number} donation.item_id - Item to fund
 * @param {number} donation.amount - Donation amount
 * @param {string} donation.donor_name - Donor name
 * @param {boolean} donation.is_guest - Whether donor is guest
 * @param {string} donation.payment_reference - Payment reference
 * @param {string} donation.payment_method - Payment method (mpesa, card, etc.)
 * @param {string} donation.network - Mobile money network
 * @param {string} donation.currency - Currency for card payments
 * @param {number} donation.fx_rate - Exchange rate
 * @param {string} donation.card_last4 - Last 4 digits of card
 * @param {string} donation.card_brand - Card brand
 * @param {string} donation.mpesa_phone - M-Pesa phone number
 * @returns {Promise<Object>} Donation response
 */
export async function fundItem({ item_id, amount, donor_name, is_guest = true, payment_reference, payment_method, network, currency, fx_rate, card_last4, card_brand, mpesa_phone }) {
  return api('/donations/fund', {
    method: 'POST',
    body: {
      item_id, amount, donor_name, is_guest, payment_reference, payment_method, network,
      currency, fx_rate, card_last4, card_brand, mpesa_phone,
    },
  })
}

export async function checkMpesaStatus(id) {
  return api(`/donations/${id}/mpesa-status`)
}

export async function postComment(requestId, { name, body }) {
  return api(`/requests/${requestId}/comments`, {
    method: 'POST',
    body: { name, body },
  })
}

export async function fetchDonationsTotal() {
  const data = await api('/donations/total')
  return Number(data.total || 0)
}

export async function fetchOverview() {
  return api('/requests/overview')
}

export async function fetchOrganizations(search = '') {
  const params = search ? `?search=${encodeURIComponent(search)}&per_page=100` : '?per_page=100'
  const data = await api(`/organizations${params}`)
  return (data.data || []).map((o) => ({ id: o.id, name: o.name, type: o.type, region: o.region, verification_status: o.verification_status }))
}

export async function fetchMyOrganization() {
  const data = await api('/organizations/mine', { token: getToken() })
  return { id: data.id, name: data.name, type: data.type, region: data.region, verification_status: data.verification_status || '' }
}

export async function fetchOrganizationsAdmin() {
  const data = await api('/organizations?per_page=100', { token: getToken() })
  return (data.data || []).map((o) => ({
    id: o.id,
    name: o.name,
    type: o.type,
    region: o.region || '',
    verification_status: o.verification_status || '',
    contact_email: o.contact_email || '',
    contact_phone: o.contact_phone || '',
  }))
}

export async function updateOrganizationVerification(id, verification_status) {
  return api(`/organizations/${id}`, { method: 'PATCH', body: { verification_status }, token: getToken() })
}

export async function fetchPublicLedger() {
  const data = await api('/invoices/ledger?per_page=100')
  return (data.data || []).map((i) => ({
    id: i.id,
    supplier: i.supplier?.name || '',
    item: i.item?.name || '',
    /* `amount` is what was invoiced. `paid_amount` is what actually left the
       account. These are not the same number: an invoice can be approved for
       a sum and still be unpaid, so anything that reports money as spent has
       to read the second one. */
    amount: Number(i.amount || 0),
    paidAmount: Number(i.paid_amount || 0),
    paid: i.status === 'paid',
    statusRaw: i.status,
    receiptUrl: i.receipt_url || '',
    reference: i.invoice_number || '',
    requestId: i.item?.request_id || null,
    date: (i.paid_at || i.created_at || '').slice(0, 10),
  }))
}

  export async function submitComplaint({ name, contact, message }) {
    return api('/complaints', {
      method: 'POST',
      body: { name, contact, message },
    })
  }
  
  /**
   * Send a message from the public contact form.
   *
   * This is now the single intake point for partner enquiries, goods donations
   * and volunteering, since those three pages were removed. `intent` says which
   * of them the message is about, and `details` carries the answers that only
   * apply to that intent. Both are optional so a plain enquiry still works.
   * @param {{name?: string, email: string, phone?: string, organisation?: string,
   *          intent?: 'partner'|'goods'|'volunteer', subject?: string,
   *          message: string, details?: string}} payload
   * @returns {Promise<{message: string, id: number}>}
   */
export async function sendContactMessage({ name, email, phone, organisation, intent, subject, message, details }) {
  return api('/contact', {
    method: 'POST',
    body: { name, email, phone, organisation, intent, subject, message, details },
    token: null,
  })
}

export async function subscribeNewsletter({ email, name }) {
  return api('/newsletter', {
    method: 'POST',
    body: { email, name },
    token: null,
  })
}

// ===== Auth API =====

export async function loginRequest(email, password) {
  const data = await api('/auth/login', { method: 'POST', body: { email, password } })
  setToken(data.token)
  return data.user
}

export async function registerRequest({ name, email, password, role, organization_id, church_name, church_region }) {
  const data = await api('/auth/register', {
    method: 'POST',
    body: {
      name,
      email,
      password,
      role,
      organization_id: organization_id || undefined,
      church_name: church_name || undefined,
      church_region: church_region || undefined,
    },
    token: null,
  })
  setToken(data.token)
  return data.user
}

export async function logoutRequest() {
  try {
    await api('/auth/logout', { method: 'POST', token: getToken() })
  } catch {
    /* ignore */
  }
  setToken(null)
}

export async function forgotPassword(email) {
  return api('/auth/forgot-password', {
    method: 'POST',
    body: { email },
    token: null,
  })
}

export async function resetPassword({ email, token, password }) {
  return api('/auth/reset-password', {
    method: 'POST',
    body: { email, token, password, password_confirmation: password },
    token: null,
  })
}

export async function resetUserPassword(id, password) {
  return api(`/users/${id}/reset-password`, {
    method: 'PATCH',
    body: { password, password_confirmation: password },
  })
}

export async function fetchMe() {
  return api('/auth/me', { token: getToken() })
}

// ===== In-app notifications (any signed-in role) =====

export async function fetchNotifications() {
  const data = await api('/notifications?per_page=50', { token: getToken() })
  return (data.data || []).map((n) => ({
    id: n.id,
    type: n.type || '',
    title: n.title,
    body: n.body || '',
    url: n.url || null,
    read: !!n.is_read,
    date: (n.created_at || '').slice(0, 10),
  }))
}

export async function markNotificationRead(id) {
  return api(`/notifications/${id}`, { method: 'PATCH', token: getToken() })
}

export async function markAllNotificationsRead() {
  return api('/notifications/mark-all-read', { method: 'PATCH', token: getToken() })
}

// ===== Admin KPIs + CSV export =====

export async function fetchKpi() {
  return api('/stats/kpi', { token: getToken() })
}

/** Donor dashboard aggregates (server-computed, confirmed-only). */
export async function fetchDonorDashboard() {
  return api('/dashboard/donor', { token: getToken() })
}

export function exportCsvUrl(type) {
  return `${API_URL}/export/${encodeURIComponent(type)}`
}

/** Download a CSV export with auth, triggering a browser save. */
export async function exportCsv(type, filename) {
  const res = await fetch(exportCsvUrl(type), {
    headers: { Accept: 'text/csv', Authorization: `Bearer ${getToken()}` },
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    const err = new Error(msg || `Export failed (${res.status})`)
    err.status = res.status
    throw err
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `oweru-${type}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ===== Protected admin / portal API =====

export async function fetchAdminRequests() {
  const data = await api('/requests?per_page=100', { token: getToken() })
  const statusLabel = {
    draft: 'Draft',
    endorsement_pending: 'Endorsement Pending',
    submitted: 'Submitted',
    under_review: 'Under Review',
    more_info_needed: 'More Information Needed',
    approved: 'Approved',
    published: 'Published',
    funding_closed: 'Funding Closed',
    procurement: 'Procurement',
    delivered: 'Delivered',
    active_reporting: 'Active Reporting',
    closed: 'Closed',
  }
  return (data.data || []).map((r) => ({
    id: r.id,
    title: r.title,
    swTitle: r.sw_title || '',
    region: r.region,
    churchName: r.church_name || '',
    org: r.organization?.name || '',
    status: statusLabel[r.status] || r.status,
    date: (r.created_at || '').slice(0, 10),
    exposure: r.exposure_level || 'Open',
    category: r.category || '',
    programType: r.program_type || '',
    story: r.story || '',
    items: (r.items || []).length,
    target: (r.items || []).reduce((s, i) => s + Number(i.target_amount || 0), 0),
    raised: (r.items || []).reduce((s, i) => s + Number(i.amount_raised || 0), 0),
    statusRaw: r.status,
    letterPath: r.letter_path || '',
    letterStatus: r.letter_status || 'missing',
    applicantId: r.applicant?.id || null,
    applicantName: r.applicant?.name || r.applicant_name || '',
    applicantPhone: r.applicant_phone || '',
    applicantEmail: r.applicant_email || '',
    applicantVerification: r.applicant?.verification || null,
    boardApproved: !!r.board_approved,
    boardReviewedAt: r.board_reviewed_at || null,
    boardReviewer: r.board_reviewer?.name || r.board_reviewed_by_name || '',
    approvalReady: !!r.approval_ready,
    endorsements: (r.endorsements || []).map((e) => ({
      id: e.id,
      status: e.status,
      organization: e.organization?.name || '',
      endorsedDate: e.endorsed_date || '',
      notes: e.notes || '',
    })),
  }))
}

export async function updateRequestStatus(id, status, decisionNote) {
  return api(`/requests/${id}/status`, { method: 'PATCH', body: { status, decision_note: decisionNote || null }, token: getToken() })
}

export async function updateRequest(id, payload) {
  return api(`/requests/${id}`, { method: 'PATCH', body: payload, token: getToken() })
}

export async function fetchReviewQueue() {
  const data = await api('/requests/review?per_page=100', { token: getToken() })
  return (data.data || []).map((r) => ({
    id: r.id,
    title: r.title,
    swTitle: r.sw_title || '',
    region: r.region,
    org: r.organization?.name || '',
    statusRaw: r.status,
    date: (r.created_at || '').slice(0, 10),
    updatedAt: (r.updated_at || '').slice(0, 10),
    applicantName: r.applicant?.name || r.applicant_name || '',
    applicantVerification: r.applicant?.verification?.status || '',
    churchConfirmed: !!r.church_confirmed,
    verifiedApplicant: !!r.verified_applicant,
    trustAnchors: r.trust_anchors || [],
    decisionNote: r.decision_note || '',
    boardApproved: !!r.board_approved,
    boardReviewer: r.board_reviewer?.name || '',
    itemCount: (r.items || []).length,
    target: (r.items || []).reduce((s, i) => s + Number(i.target_amount || 0), 0),
  }))
}

export async function submitBoardDecision(id, status, decisionNote) {
  return api(`/requests/${id}/board-status`, { method: 'PATCH', body: { status, decision_note: decisionNote || null }, token: getToken() })
}

export async function deleteRequest(id) {
  return api(`/requests/${id}`, { method: 'DELETE', token: getToken() })
}

export async function updateItem(id, payload) {
  return api(`/items/${id}`, { method: 'PATCH', body: payload, token: getToken() })
}

export async function fetchItems() {
  const data = await api('/items?per_page=100', { token: getToken() })
  return (data.data || []).map((it) => ({
    id: it.id,
    requestId: it.request_id || '',
    name: it.name || '',
    description: it.description || '',
    category: it.request?.category || it.category || '',
    target: Number(it.target_amount || 0),
    deadline: it.funding_deadline || '',
    status: it.status === 'fully_funded' ? 'fully-funded' : 'in-progress',
    request: it.request?.title || '',
    region: it.request?.region || it.request?.organization?.region || '',
    churchName: it.request?.church_name || it.request?.organization?.name || '',
    org: it.request?.organization?.name || '',
    story: it.request?.story || '',
    applicant: it.request?.applicant?.name || '',
    amount_raised: Number(it.amount_raised || 0),
  }))
}

export async function deleteItem(id) {
  return api(`/items/${id}`, { method: 'DELETE', token: getToken() })
}

// ===== Supplier quotes against fundable items =====

function mapQuote(q) {
  return {
    id: q.id,
    itemId: q.request_item_id || '',
    item: q.item?.name || '',
    request: q.item?.request?.title || '',
    supplier: q.supplier?.name || '',
    supplierId: q.supplier_id || null,
    amount: Number(q.amount || 0),
    currency: q.currency || 'TZS',
    validUntil: q.valid_until || '',
    status: q.status || 'pending',
    notes: q.notes || '',
    createdBy: q.creator?.name || '',
    date: (q.created_at || '').slice(0, 10),
  }
}

export async function fetchQuotes({ itemId, status } = {}) {
  const params = new URLSearchParams({ per_page: 100 })
  if (itemId) params.set('request_item_id', itemId)
  if (status) params.set('status', status)
  const data = await api(`/quotes?${params}`, { token: getToken() })
  return (data.data || []).map(mapQuote)
}

export async function createQuote(payload) {
  return api('/quotes', { method: 'POST', body: payload, token: getToken() })
}

export async function updateQuote(id, payload) {
  return api(`/quotes/${id}`, { method: 'PATCH', body: payload, token: getToken() })
}

export async function approveQuote(id) {
  return api(`/quotes/${id}/approve`, { method: 'POST', token: getToken() })
}

export async function rejectQuote(id) {
  return api(`/quotes/${id}/reject`, { method: 'POST', token: getToken() })
}

export async function deleteQuote(id) {
  return api(`/quotes/${id}`, { method: 'DELETE', token: getToken() })
}

export async function fetchAdminDonations() {
  const data = await api('/donations?per_page=100', { token: getToken() })
  return (data.data || []).map(mapDonation)
}

export async function fetchMyDonations() {
  const data = await api('/donations?per_page=100', { token: getToken() })
  return (data.data || []).map(mapDonation)
}

export async function confirmDonation(id) {
  return api(`/donations/${id}/confirm`, { method: 'PATCH', token: getToken() })
}

export async function updateDonation(id, payload) {
  return api(`/donations/${id}`, { method: 'PATCH', body: payload, token: getToken() })
}

export async function deleteDonation(id) {
  return api(`/donations/${id}`, { method: 'DELETE', token: getToken() })
}

export async function fetchSuppliers() {
  const data = await api('/suppliers?per_page=100', { token: getToken() })
  return (data.data || []).map(mapSupplier)
}

export async function createSupplier(payload) {
  return api('/suppliers', { method: 'POST', body: payload, token: getToken() })
}

export async function updateSupplier(id, payload) {
  return api(`/suppliers/${id}`, { method: 'PATCH', body: payload, token: getToken() })
}

export async function verifySupplier(id) {
  return api(`/suppliers/${id}/verify`, { method: 'PATCH', token: getToken() })
}

export async function deleteSupplier(id) {
  return api(`/suppliers/${id}`, { method: 'DELETE', token: getToken() })
}

export async function fetchInvoices() {
  const data = await api('/invoices?per_page=100', { token: getToken() })
  return (data.data || []).map(mapInvoice)
}

export async function deleteInvoice(id) {
  return api(`/invoices/${id}`, { method: 'DELETE', token: getToken() })
}

export async function markInvoicePaid(id) {
  return api(`/invoices/${id}/paid`, { method: 'PATCH', token: getToken() })
}

export async function uploadInvoiceReceipt(id, file) {
  const formData = new FormData()
  formData.append('receipt', file)
  return api(`/invoices/${id}/receipt`, {
    method: 'POST',
    body: formData,
    token: getToken(),
    isFormData: true,
  })
}

export async function approveInvoice(id) {
  return api(`/invoices/${id}/approve`, { method: 'POST', token: getToken() })
}

export async function updateInvoice(id, payload) {
  return api(`/invoices/${id}`, { method: 'PATCH', body: payload, token: getToken() })
}

export async function fetchEquipment() {
  const data = await api('/equipment?per_page=100', { token: getToken() })
  return (data.data || []).map(mapEquipment)
}

export async function createEquipment(payload) {
  return api('/equipment', { method: 'POST', body: payload, token: getToken() })
}

export async function updateEquipment(id, payload) {
  return api(`/equipment/${id}`, { method: 'PATCH', body: payload, token: getToken() })
}

export async function deleteEquipment(id) {
  return api(`/equipment/${id}`, { method: 'DELETE', token: getToken() })
}

export async function fetchReports() {
  const data = await api('/reports?per_page=100', { token: getToken() })
  return (data.data || []).map(mapReport)
}

export async function fetchAllRequestItems() {
  const data = await api('/items?per_page=200', { token: getToken() })
  return (data.data || []).map((i) => ({
    id: i.id,
    name: i.name,
    request: i.request?.title || i.request?.id || '',
    status: i.status || '',
  }))
}

export async function fetchAuditLogs() {
  const data = await api('/audit-logs?per_page=100', { token: getToken() })
  return (data.data || []).map(mapAudit)
}

/**
 * Fetch a single request by token (private tracking link for guest applicants)
 */
export async function fetchRequestByToken(trackToken) {
  const req = await api(`/requests/track/${encodeURIComponent(trackToken)}`)
  return mapRequest(req)
}

/**
 * Link (claim) a guest request to the signed-in account
 */
export async function claimRequest(id, trackToken) {
  return api(`/requests/${id}/claim`, {
    method: 'POST',
    body: { track_token: trackToken },
    token: getToken(),
  })
}

/**
 * Applicant portal: the signed-in applicant's own requests with history
 */
export async function fetchMyRequests() {
  const data = await api('/requests/mine?per_page=100', { token: getToken() })
  return (data.data || []).map((r) => ({
    id: r.id,
    ref: `OWR-${String(r.id).padStart(5, '0')}`,
    title: r.title,
    swTitle: r.sw_title || r.title,
    region: r.region || '',
    churchName: r.church_name || '',
    category: r.category || '',
    org: r.organization?.name || '',
    status: r.status,
    statusRaw: r.status,
    statusLabel: statusLabel(r.status),
    date: (r.submitted_at || r.created_at || '').slice(0, 10),
    submittedAt: r.submitted_at || '',
    target: (r.items || []).reduce((s, i) => s + Number(i.target_amount || 0), 0),
    items: (r.items || []).map(mapItem),
    letterPath: r.letter_path || '',
    letterStatus: r.letter_status || 'missing',
    applicantVerification: r.applicant?.verification || null,
    endorsements: (r.endorsements || []).map((e) => ({
      status: e.status,
      organization: e.organization?.name || '',
      notes: e.notes || '',
      endorsedDate: e.endorsed_date || '',
    })),
  }))
}

const statusLabel = (s) => {
  const map = {
    draft: 'Draft',
    submitted: 'Submitted',
    endorsement_pending: 'Endorsement Pending',
    under_review: 'Under Review',
    more_info_needed: 'More Info Needed',
    approved: 'Approved',
    published: 'Published',
    funding_closed: 'Funding Closed',
    procurement: 'Procurement',
    delivered: 'Delivered',
    active_reporting: 'Active Reporting',
    closed: 'Closed',
  }
  return map[s] || s
}

export async function storeRequest(payload, token) {
  return api('/requests', { method: 'POST', body: payload, token: token || getToken() })
}

export async function uploadLetter(data, token) {
  return api('/letters', { method: 'POST', body: { data }, token: token || getToken() })
}

export function letterUrl(requestId) {
  return `${API_URL}/letters/${requestId}`
}

/**
 * Fetch an evidence file (report / delivery confirmation) with the auth
 * token and open it in a new tab. Returns the object URL.
 */
async function withAuthBlob(path) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: 'application/pdf,image/jpeg,image/png,image/webp,*/*',
      Authorization: `Bearer ${getToken()}`,
    },
  })
  if (!res.ok) {
    const e = new Error('Uthibitisho haukupatikana au huna ruhusa (Evidence not found or access denied).')
    e.status = res.status
    throw e
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  return url
}

export async function openReportEvidence(id) {
  return withAuthBlob(`/reports/${id}/evidence`)
}

/** Open a support letter with the caller's auth token (letters are access-controlled). */
export async function openLetter(requestId) {
  return withAuthBlob(`/letters/${requestId}`)
}

export async function openEquipmentEvidence(id) {
  return withAuthBlob(`/equipment/${id}/evidence`)
}

export async function createInvoice(payload) {
  return api('/invoices', { method: 'POST', body: payload, token: getToken() })
}

export async function createReport(payload) {
  return api('/reports', { method: 'POST', body: payload, token: getToken() })
}

export async function deleteReport(id) {
  return api(`/reports/${id}`, { method: 'DELETE', token: getToken() })
}

export async function updateReport(id, payload) {
  return api(`/reports/${id}`, { method: 'PATCH', body: payload, token: getToken() })
}

export { mapReport }

// ===== Staff / user management (main admin only) =====

export async function fetchUsers(search = '') {
  const params = search ? `?search=${encodeURIComponent(search)}&per_page=100` : '?per_page=100'
  const data = await api(`/users${params}`, { token: getToken() })
  return (data.data || []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    organization_id: u.organization_id,
    org: u.organization?.name || u.organization_id || '',
    date: (u.created_at || '').slice(0, 10),
  }))
}

export async function createUser({ name, email, password, role, status, organization_id }) {
  return api('/users', {
    method: 'POST',
    body: { name, email, password, role, status, organization_id: organization_id || undefined },
    token: getToken(),
  })
}

export async function updateUser(id, payload) {
  return api(`/users/${id}`, { method: 'PATCH', body: payload, token: getToken() })
}

export async function deleteUser(id) {
  return api(`/users/${id}`, { method: 'DELETE', token: getToken() })
}

// ----- Applicant verification / KYC -----

export async function fetchVerificationMine() {
  return api('/applicant-verification/mine', { token: getToken() })
}

export async function submitVerification(payload) {
  return api('/applicant-verification', { method: 'POST', body: payload, token: getToken() })
}

export async function fetchVerificationsAdmin() {
  const data = await api('/applicant-verifications?per_page=100', { token: getToken() })
  return data.data || []
}

export async function reviewVerification(id, payload) {
  return api(`/applicant-verifications/${id}/review`, { method: 'POST', body: payload, token: getToken() })
}

// ===== Church confirmation (endorsement) flow =====

function mapEndorsement(e) {
  return {
    id: e.id,
    requestId: e.request_id,
    title: e.request?.title || '',
    region: e.request?.region || '',
    churchName: e.organization?.name || '',
    status: e.status || 'pending',
    notes: e.notes || '',
    endorsedDate: e.endorsed_date || '',
    applicantName: e.request?.applicant?.name || e.request?.applicant_name || 'Guest applicant',
    applicantPhone: e.request?.applicant?.phone || e.request?.applicant_phone || '',
    requestStatus: e.request?.status || '',
  }
}

export async function fetchEndorsements() {
  const data = await api('/endorsements?per_page=100', { token: getToken() })
  return (data.data || []).map(mapEndorsement)
}

export async function createEndorsement(payload) {
  return api('/endorsements', { method: 'POST', body: payload, token: getToken() })
}

export async function respondEndorsement(id, payload) {
  return api(`/endorsements/${id}`, { method: 'PATCH', body: payload, token: getToken() })
}

// ===== Three-party delivery confirmation =====

export async function fetchEquipmentDetail(id) {
  return api(`/equipment/${id}`, { token: getToken() })
}

export async function confirmDelivery(id, party, notes) {
  return api(`/equipment/${id}/delivery-confirm`, {
    method: 'POST',
    body: { party, notes: notes || undefined },
    token: getToken(),
  })
}
