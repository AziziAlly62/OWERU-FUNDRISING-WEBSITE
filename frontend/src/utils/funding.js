export const FUNDING_WINDOW_MS = 60 * 86400000

export function campaignEndTime(req) {
  const deadlines = (req?.items || [])
    .map((i) => i?.deadline)
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .filter((n) => !Number.isNaN(n))
  if (deadlines.length) return Math.min(...deadlines)
  if (req?.createdAt) return new Date(req.createdAt).getTime() + FUNDING_WINDOW_MS
  return Date.now() + FUNDING_WINDOW_MS
}

export function daysLeft(req) {
  const end = campaignEndTime(req)
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000))
}

const FUNDED_STATUSES = [
  'fully_funded',
  'fully-funded',
  'ordered',
  'delivered',
  'in_use',
  'verified',
]

export function isFullyFunded(req) {
  if (FUNDED_STATUSES.includes(req?.status)) return true
  // A request with no funding data (target/raised missing or zero) is NOT
  // fully funded. Comparing the two naively made 0 >= 0 true, which silently
  // classified every funding-less request as finished and emptied the
  // homepage cause grid.
  const target = Number(req?.target || 0)
  const raised = Number(req?.raised || 0)
  return target > 0 && raised >= target
}