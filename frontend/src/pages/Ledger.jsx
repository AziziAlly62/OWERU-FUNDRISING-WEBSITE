import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { fetchOverview, fetchRequests, fetchPublicLedger, fetchPublicReports, money } from '../api'
import { onStatsChange } from '../statsBus'
import { Icon } from '../components/icons'
import { usePageMeta } from '../hooks/usePageMeta'
import { Container, Section, SectionHeading } from '../components/ui'

const titleCase = (s = '') => String(s || '').replace(/\b[a-z]/g, (c) => c.toUpperCase())

/* Item names are typed in the admin form and one was saved in full capitals.
   titleCase leaves shouted text alone because there is no lowercase letter to
   match, so bring it down first and then title it. */
const nameCase = (s = '') => {
  const v = String(s || '')
  const letters = v.replace(/[^a-z]/gi, '')
  if (letters && letters === letters.toUpperCase()) {
    return v.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())
  }
  return titleCase(v)
}

const normalize = (s) => String(s || '').trim().toLowerCase()
const pad = (n, l = 4) => String(n || 0).padStart(l, '0')

const fmtDate = (dateString) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return String(dateString).slice(0, 10)
  return d
    .toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
}

/* Request states that mean the board has already said yes. */
const APPROVED_STATES = ['approved', 'funding_closed', 'procurement', 'delivered', 'active_reporting', 'completed']

const EN = {
  pageTitle: 'Public Ledger | OWERU Foundation',
  pageDesc:
    'Follow public support from request to delivered equipment — full transparency at every step.',
  metaTitle: 'Public Ledger | OWERU Foundation',
  metaDesc: 'Transparency you can verify.',

  /* Hero */
  heroEyebrow: 'PUBLIC LEDGER',
  heroTitle: 'Transparency you can verify.',
  heroLede:
    'See how Oweru funds are received, allocated, and used to support approved community needs.',
  heroAction: 'Browse transactions',
  howItWorks: 'How It Works',
  latestLabel: 'LATEST PUBLIC ENTRY',
  latestLoading: 'Loading the latest public record…',
  latestEmpty: 'No confirmed activity is on record yet.',
  latestOpen: 'Open transaction details',
  dataCurrent: 'CURRENT',
  dataUpdating: 'UPDATING',
  dataRetry: 'RETRYING',
  dataUnavailable: 'Live totals are temporarily unavailable. The page will retry automatically.',

  /* Overview */
  overviewEyebrow: 'Financial overview',
  overviewTitle: 'Where the money stands',
  overviewLede:
    'Live totals from confirmed donations and actual supplier payments. Approved invoices are not counted as money spent.',
  raised: 'Total Raised',
  raisedNote: 'Confirmed support received',
  disbursed: 'Total Disbursed',
  disbursedNote: 'Paid to verified suppliers',
  activeRequests: 'Active Requests',
  activeRequestsNote: 'Published and progressing',
  completedSupport: 'Completed Support',
  completedSupportNote: 'Items fully funded',

  /* Fund flow */
  flowEyebrow: 'Fund flow',
  flowTitle: 'How Funds Move',
  flowLede:
    'Support travels through six steps. Each one is recorded, so the page can show where any single contribution currently stands.',
  steps: [
    { icon: 'heart', title: 'Donation', body: 'Funds are received through approved payment channels.' },
    { icon: 'verify', title: 'Verification', body: 'The request and supporting information are reviewed.' },
    { icon: 'layers', title: 'Allocation', body: 'Funds are linked to an approved support request.' },
    { icon: 'wallet', title: 'Payment', body: 'Payment is processed through the approved process.' },
    { icon: 'truck', title: 'Delivery', body: 'The supported item or service is delivered.' },
    { icon: 'check', title: 'Completion', body: 'Evidence and completion information is recorded.' },
  ],

  /* Transactions */
  txEyebrow: 'Public transactions',
  txTitle: 'Public Transactions',
  txLede: 'Every recorded transaction is linked to a public support activity.',
  searchPlaceholder: 'Search by reference or purpose...',
  searchLabel: 'Search transactions',
  dateLabel: 'Date',
  statusLabel: 'Status',
  dateAll: 'All dates',
  date30: 'Last 30 days',
  date90: 'Last 90 days',
  dateYear: 'This year',
  tabs: [
    { key: 'all', label: 'All' },
    { key: 'donation', label: 'Donations' },
    { key: 'disbursement', label: 'Disbursements' },
    { key: 'completed', label: 'Completed' },
    { key: 'progress', label: 'In Progress' },
  ],
  typeDonation: 'Donation',
  typeDisbursement: 'Disbursement',
  statusCompletedBadge: 'Completed',
  statusProgressBadge: 'In progress',
  view: 'View',
  colDate: 'Date',
  colRef: 'Reference',
  colPurpose: 'Purpose',
  colAmount: 'Amount',
  colType: 'Type',
  colStatus: 'Status',
  colAction: 'Action',
  emptyTitle: 'No transactions match these filters',
  emptyBody: 'Try a different search term, or clear the date and status filters.',
  clearFilters: 'Clear filters',
  showing: 'Showing',
  of: 'of',
  records: 'ledger entries',
  showMore: 'Show more',
  recipient: 'Recipient',

  /* Drawer */
  drawerLabel: 'Transaction details',
  close: 'Close',
  amount: 'Amount',
  date: 'Date',
  type: 'Type',
  relatedRequest: 'Related Request',
  category: 'Category',
  supplier: 'Supplier',
  journeyTitle: 'Fund Journey',
  evidenceTitle: 'Supporting Evidence',
  evidenceIntro: 'Only documents cleared for public viewing are listed here.',
  viewRequest: 'View request',
  privacyNote: 'Donor identities and private details are never shown.',
  awaitingNote:
    'This amount has been approved for a verified supplier but no payment has been recorded yet.',
  paidNote:
    'These funds were disbursed to a verified supplier to purchase and deliver the approved equipment. No cash is ever paid to a recipient.',
  donationNote:
    'This is a confirmed contribution to a published support request. Donor details are never published.',

  journeyStages: [
    { key: 'approved', title: 'Request Approved', body: 'The request passed review and was approved.' },
    { key: 'funding', title: 'Funding Received', body: 'Confirmed contributions were recorded against the request.' },
    { key: 'payment', title: 'Payment Processed', body: 'Payment was released to a verified supplier.' },
    { key: 'delivery', title: 'Items Delivered', body: 'The supported item was delivered to the church.' },
    { key: 'completion', title: 'Completion Confirmed', body: 'A completion report was submitted and reviewed.' },
  ],
  stageDone: 'Confirmed',
  stageProgress: 'In progress',
  stagePending: 'Not recorded',
  stageDate: 'Recorded',

  evFunding: 'Public funding record',
  evInvoice: 'Supplier invoice',
  evPayment: 'Payment confirmation',
  evDelivery: 'Delivery confirmation',
  evCompletion: 'Completion report',
  evVerified: 'Verified',
  evNotFiled: 'Not filed yet',
  evNotRecorded: 'Not recorded yet',
  evSubmitted: 'Submitted',
  evOpen: 'Open report',
  evOnRecord: 'On record',

  /* Privacy */
  privacyEyebrow: 'Transparency & Privacy',
  privacyTitle: 'Transparency & Privacy',
  privacyLede:
    'The ledger is public, the people behind it are not. We publish what proves the money moved, and keep personal data private.',
  showTitle: 'What We Show',
  protectTitle: 'What We Protect',
  showItems: [
    'Transaction reference',
    'Date',
    'Purpose',
    'Amount',
    'Status',
    'Fund journey',
    'Available verification evidence',
  ],
  protectItems: [
    'Donor personal information',
    'Phone numbers',
    'National IDs',
    'Bank and account information',
    'Sensitive recipient information',
  ],

  /* CTA */
  ctaEyebrow: 'Your next step',
  ctaTitle: 'Put the record to work.',
  ctaLede: 'Explore approved requests and choose the specific item you want to support.',
  ctaPrimary: 'Browse requests',
  ctaSecondary: 'Impact reports',
}

const SW = {
  pageTitle: 'Rejesta ya Umma | OWERU Foundation',
  pageDesc: 'Fuatilia michango iliyothibitishwa, malipo kwa wauzaji na vifaa vilivyowasilishwa kwa taasisi zilizoomba msaada.',
  metaTitle: 'Rejesta ya Umma',
  metaDesc: 'Uwazi unaweza kuthibitisha.',

  heroEyebrow: 'REJESTA YA UMMA',
  heroTitle: 'Uwazi unaweza kuthibitisha.',
  heroLede: 'Tazama michango iliyopokelewa, malipo yaliyofanywa kwa wauzaji na vifaa vilivyowasilishwa kwa taasisi zilizoomba msaada.',
  heroAction: 'Angalia miamala',
  howItWorks: 'Jinsi mchango unavyotumika',
  latestLabel: 'REKODI YA HIVI KARIBUNI',
  latestLoading: 'Inapakia taarifa ya hivi karibuni…',
  latestEmpty: 'Bado hakuna shughuli iliyothibitishwa.',
  latestOpen: 'Tazama maelezo ya muamala',
  dataCurrent: 'IMESASISHWA',
  dataUpdating: 'INAPAKIA',
  dataRetry: 'INAPAKIA TENA',
  dataUnavailable: 'Jumla za sasa hazipatikani. Ukurasa utajaribu tena hivi karibuni.',

  overviewEyebrow: 'Muhtasari wa kifedha',
  overviewTitle: 'Muhtasari wa fedha',
  overviewLede: 'Jumla hizi zinatokana na michango iliyothibitishwa na malipo halisi kwa wauzaji. Ankara zilizoidhinishwa pekee hazihesabiwi kama fedha zilizolipwa.',
  raised: 'Jumla Iliyopokelewa',
  raisedNote: 'Msaada uliothibitishwa',
  disbursed: 'Jumla Iliyolipwa',
  disbursedNote: 'Imelipwa kwa wauzaji waliothibitishwa',
  activeRequests: 'Maombi Yanayoendelea',
  activeRequestsNote: 'Yaliyochapishwa na bado yanapokea michango',
  completedSupport: 'Msaada Uliokamilika',
  completedSupportNote: 'Vifaa vilivyofadhiliwa kikamili',

  flowEyebrow: 'Safari ya mchango',
  flowTitle: 'Kutoka ombi hadi kifaa kutumika',
  flowLede: 'Mchango hufuata hatua sita, kuanzia ombi linapokaguliwa hadi kifaa kinapotumika. Tunarekodi hatua iliyofikiwa.',
  steps: [
    { icon: 'heart', title: 'Mchango', body: 'Mchango hulipwa kupitia njia zilizoidhinishwa.' },
    { icon: 'verify', title: 'Ukaguzi', body: 'Tunahakikisha ombi na taarifa zake kabla ya kulichapisha.' },
    { icon: 'layers', title: 'Kuelekeza fedha', body: 'Mchango unaunganishwa na kifaa kilichoidhinishwa.' },
    { icon: 'wallet', title: 'Malipo kwa muuzaji', body: 'OWERU humlipa muuzaji aliyethibitishwa.' },
    { icon: 'truck', title: 'Uwasilishaji', body: 'Kifaa huwasilishwa kwa taasisi iliyoomba msaada.' },
    { icon: 'check', title: 'Ufuatiliaji', body: 'Taarifa za matumizi ya kifaa huwasilishwa na kurekodiwa.' },
  ],

  txEyebrow: 'Miamala ya umma',
  txTitle: 'Miamala iliyorekodiwa',
  txLede: 'Fungua muamala kuona kifaa, ombi na hatua iliyofikiwa.',
  searchPlaceholder: 'Tafuta kwa namba ya kumbukumbu au kifaa...',
  searchLabel: 'Tafuta miamala',
  dateLabel: 'Tarehe',
  statusLabel: 'Hali',
  dateAll: 'Tarehe zote',
  date30: 'Siku 30 zilizopita',
  date90: 'Siku 90 zilizopita',
  dateYear: 'Mwaka huu',
  tabs: [
    { key: 'all', label: 'Zote' },
    { key: 'donation', label: 'Michango' },
    { key: 'disbursement', label: 'Malipo' },
    { key: 'completed', label: 'Imekamilika' },
    { key: 'progress', label: 'Inaendelea' },
  ],
  typeDonation: 'Mchango',
  typeDisbursement: 'Malipo',
  statusCompletedBadge: 'Imekamilika',
  statusProgressBadge: 'Inaendelea',
  view: 'Angalia',
  colDate: 'Tarehe',
  colRef: 'Rejea',
  colPurpose: 'Kifaa au huduma',
  colAmount: 'Kiasi',
  colType: 'Aina',
  colStatus: 'Hali',
  colAction: 'Hatua',
  emptyTitle: 'Hakuna miamala inayolingana na vichujio hivi',
  emptyBody: 'Badili neno la utafutaji au ondoa baadhi ya vichujio.',
  clearFilters: 'Futa vichujio',
  showing: 'Inaonyesha',
  of: 'kati ya',
  records: 'rekodi',
  showMore: 'Onyesha zaidi',
  recipient: 'Mpokeaji',

  drawerLabel: 'Maelezo ya muamala',
  close: 'Funga',
  amount: 'Kiasi',
  date: 'Tarehe',
  type: 'Aina',
  relatedRequest: 'Ombi linalohusiana',
  category: 'Kategoria',
  supplier: 'Muuzaji',
  journeyTitle: 'Safari ya mchango',
  evidenceTitle: 'Ushahidi',
  evidenceIntro: 'Hapa kuna nyaraka zilizoidhinishwa kuonekana hadharani pekee.',
  viewRequest: 'Angalia ombi',
  privacyNote: 'Taarifa binafsi za wafadhili na wanufaika hazichapishwi.',
  awaitingNote: 'Kiasi hiki kimeidhinishwa kwa muuzaji, lakini malipo bado hayajarekodiwa.',
  paidNote:
    'Fedha hizi zililipwa kwa muuzaji aliyethibitishwa ili kununua na kuwasilisha kifaa kilichoidhinishwa. Mpokeaji hapewi fedha taslimu.',
  donationNote: 'Huu ni mchango uliothibitishwa kwa ombi lililochapishwa. Taarifa za mfadhili hubaki siri.',

  journeyStages: [
    { key: 'approved', title: 'Ombi limeidhinishwa', body: 'Ombi limekaguliwa na kuidhinishwa.' },
    { key: 'funding', title: 'Mchango umepokelewa', body: 'Michango iliyothibitishwa imewekwa kwenye rekodi.' },
    { key: 'payment', title: 'Muuzaji amelipwa', body: 'Malipo yamefanywa kwa muuzaji aliyethibitishwa.' },
    { key: 'delivery', title: 'Kifaa kimewasilishwa', body: 'Kifaa kimefikishwa kwa taasisi iliyoomba msaada.' },
    { key: 'completion', title: 'Ufuatiliaji umekamilika', body: 'Ripoti ya matumizi imewasilishwa na kukaguliwa.' },
  ],
  stageDone: 'Imethibitishwa',
  stageProgress: 'Inaendelea',
  stagePending: 'Haijarekodiwa',
  stageDate: 'Ilirekodiwa',

  evFunding: 'Rekodi ya mchango wa umma',
  evInvoice: 'Ankara ya muuzaji',
  evPayment: 'Uthibitisho wa malipo',
  evDelivery: 'Uthibitisho wa uwasilishaji',
  evCompletion: 'Ripoti ya ukamilishaji',
  evVerified: 'Imethibitishwa',
  evNotFiled: 'Bado haijafungwa',
  evNotRecorded: 'Bado haijarekodiwa',
  evSubmitted: 'Imetumwa',
  evOpen: 'Fungua ripoti',
  evOnRecord: 'Kwenye kumbukumbu',

  privacyEyebrow: 'Uwazi na Faragha',
  privacyTitle: 'Uwazi na Faragha',
  privacyLede: 'Rejesta iko wazi kwa umma, lakini taarifa binafsi za watu zinalindwa. Tunachapisha rekodi za fedha bila kufichua utambulisho wa wafadhili au wanufaika.',
  showTitle: 'Tunachochapisha',
  protectTitle: 'Tunachoficha',
  showItems: [
    'Rejea ya muamala',
    'Tarehe',
    'Kifaa au huduma',
    'Kiasi',
    'Hali',
    'Safari ya fedha',
    'Ushahidi unaopatikana',
  ],
  protectItems: [
    'Taarifa za wafadhili',
    'Namba za simu',
    'Namba za KITAKITA',
    'Taarifa za benki na akaunti',
    'Taarifa nyeti za mpokeaji',
  ],

  ctaEyebrow: 'Hatua inayofuata',
  ctaTitle: 'Geuza rekodi kuwa hatua.',
  ctaLede: 'Chunguza maombi yaliyoidhinishwa na uchague kifaa mahususi unachotaka kusaidia.',
  ctaPrimary: 'Chunguza maombi',
  ctaSecondary: 'Ripoti za athari',
}

export default function Ledger() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const T = sw ? SW : EN

  usePageMeta({
    title: T.pageTitle,
    description: T.pageDesc,
  })

  const [overview, setOverview] = useState(null)
  const [requests, setRequests] = useState([])
  const [ledger, setLedger] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [range, setRange] = useState('all')
  const [selected, setSelected] = useState(null)
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    let alive = true
    const load = () => {
      Promise.all([fetchOverview(), fetchRequests(), fetchPublicLedger(), fetchPublicReports()])
        .then(([ov, reqs, ldg, rpts]) => {
          if (!alive) return
          setOverview(ov || null)
          setRequests(reqs || [])
          setLedger(ldg || [])
          setReports(rpts || [])
          setLoadError(false)
        })
        .catch(() => {
          if (!alive) return
          setOverview(null)
          setRequests([])
          setLedger([])
          setReports([])
          setLoadError(true)
        })
        .finally(() => alive && setLoading(false))
    }
    load()
    const off = onStatsChange(load)
    const poll = setInterval(() => {
      if (document.visibilityState !== 'hidden') load()
    }, 30000)
    return () => {
      alive = false
      clearInterval(poll)
      off()
    }
  }, [])

  // ----- Money -----
  /* `paid_amount` is what actually left the account. An approved invoice is a
     commitment, not a payment, so the two are kept apart. */
  const raised = Number(overview?.donations?.total || 0)
  const disbursed = ledger.reduce((s, l) => s + (Number(l.paidAmount || 0) || 0), 0)

  const summaryCards = [
    { label: T.raised, note: T.raisedNote, value: raised, prefix: 'TZS ', icon: 'heart' },
    { label: T.disbursed, note: T.disbursedNote, value: disbursed, prefix: 'TZS ', icon: 'truck' },
    { label: T.activeRequests, note: T.activeRequestsNote, value: Number(overview?.requests?.active || 0), prefix: '', icon: 'clock' },
    { label: T.completedSupport, note: T.completedSupportNote, value: Number(overview?.items?.fully_funded || 0), prefix: '', icon: 'verify' },
  ]

  // ----- Public activity feed -----
  const feed = useMemo(() => {
    const rows = []
    for (const r of requests) {
      for (const it of r.items || []) {
        for (const d of it.donations || []) {
          if (!d.confirmed) continue
          const year = (d.date || '').slice(0, 4) || new Date().getFullYear()
          rows.push({
            key: `d-${d.id}`,
            kind: 'received',
            type: 'donation',
            status: 'completed',
            date: d.date || r.createdAt || '',
            purpose: nameCase(sw ? it.swName || it.name : it.name),
            itemName: nameCase(sw ? it.swName || it.name : it.name),
            relatedRequest: sw ? r.swTitle : r.title,
            category: r.category || '',
            requestId: r.id,
            amount: Number(d.amount || 0),
            ref: `OWR-${year}-${pad(d.id)}`,
            supplier: '',
            receiptUrl: '',
          })
        }
      }
    }
    for (const l of ledger) {
      const paidAmount = Number(l.paidAmount || 0)
      const gap = Math.max(Number(l.amount || 0) - paidAmount, 0)
      const item = nameCase(sw ? l.swItem || l.item : l.item)
      if (paidAmount > 0) {
        rows.push({
          key: `l-${l.id}`,
          kind: 'disbursed',
          type: 'disbursement',
          status: 'completed',
          date: l.date || '',
          purpose: item,
          itemName: item,
          relatedRequest: '',
          category: '',
          requestId: l.requestId || null,
          amount: paidAmount,
          ref: l.reference || `LDG-${pad(l.id, 5)}`,
          supplier: l.supplier || '',
          receiptUrl: l.receiptUrl || '',
        })
      }
      /* An approved invoice with no payment is not a disbursement. It is still
         part of the public record, listed as its own state. */
      if (gap > 0) {
        rows.push({
          key: `a-${l.id}`,
          kind: 'approved',
          type: 'disbursement',
          status: 'progress',
          date: l.date || '',
          purpose: item,
          itemName: item,
          relatedRequest: '',
          category: '',
          requestId: l.requestId || null,
          amount: gap,
          ref: l.reference || `LDG-${pad(l.id, 5)}`,
          supplier: l.supplier || '',
          receiptUrl: '',
        })
      }
    }
    rows.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    return rows
  }, [requests, ledger, sw])
  const latestRecord = feed[0] || null

  /* Look-ups used by the drawer: which request an entry belongs to, which
     invoices exist for an item, and which reports were submitted for it. */
  const requestById = useMemo(
    () => new Map(requests.map((r) => [String(r.id), r])),
    [requests]
  )
  const ledgerByItem = useMemo(() => {
    const m = new Map()
    for (const l of ledger) {
      const k = normalize(nameCase(l.item))
      if (!k) continue
      m.set(k, [...(m.get(k) || []), l])
    }
    return m
  }, [ledger])
  const reportsByItem = useMemo(() => {
    const m = new Map()
    for (const r of reports) {
      const k = normalize(r.item)
      if (!k) continue
      m.set(k, [...(m.get(k) || []), r])
    }
    return m
  }, [reports])

  /* Fill in the related request title for supplier entries. */
  const relatedTitle = (row) => {
    if (row.relatedRequest) return row.relatedRequest
    const req = row.requestId ? requestById.get(String(row.requestId)) : null
    if (!req) return ''
    return sw ? req.swTitle : req.title
  }

  const detailLink = (row) =>
    row.requestId ? `/requests/${row.requestId}` : '/requests'

  /* ----- Fund journey: only what the backend actually confirms ----- */
  const journeyFor = (row) => {
    const key = normalize(row.itemName || row.purpose)
    const req = row.requestId ? requestById.get(String(row.requestId)) : null
    const reqItem = req ? (req.items || []).find((i) => normalize(i.name) === key) : null
    const itemLedger = ledgerByItem.get(key) || []
    const itemReports = reportsByItem.get(key) || []
    const paid = itemLedger.some((l) => Number(l.paidAmount || 0) > 0)
    const committed = itemLedger.some((l) => Number(l.amount || 0) > 0)
    const funded = row.kind === 'received' || (reqItem && reqItem.target > 0 && reqItem.raised >= reqItem.target) || paid
    const delivered = itemReports.some((r) => r.type === 'delivery')
    const completed = itemReports.some((r) => r.type === '30_day' || r.type === '90_day')
    const approved = Boolean(req && (req.boardApproved || APPROVED_STATES.includes(req.status)))

    return [
      {
        ...T.journeyStages[0],
        state: approved ? 'done' : 'progress',
        date: approved ? req.boardReviewedAt || req.createdAt || '' : '',
      },
      { ...T.journeyStages[1], state: funded ? 'done' : 'progress', date: funded ? row.date : '' },
      {
        ...T.journeyStages[2],
        state: row.kind === 'disbursed' || paid ? 'done' : committed || row.kind === 'approved' ? 'progress' : 'pending',
        date: row.kind === 'disbursed' ? row.date : '',
      },
      {
        ...T.journeyStages[3],
        state: delivered ? 'done' : row.kind === 'disbursed' || paid ? 'progress' : 'pending',
        date: delivered ? (itemReports.find((r) => r.type === 'delivery') || {}).submitted_at || '' : '',
      },
      {
        ...T.journeyStages[4],
        state: completed ? 'done' : delivered ? 'progress' : 'pending',
        date: completed
          ? (itemReports.find((r) => r.type === '30_day' || r.type === '90_day') || {}).submitted_at || ''
          : '',
      },
    ]
  }

  /* ----- Supporting evidence: only public-safe documents ----- */
  const evidenceFor = (row) => {
    const key = normalize(row.itemName || row.purpose)
    const itemReports = reportsByItem.get(key) || []
    const delivery = itemReports.find((r) => r.type === 'delivery')
    const completion = itemReports.find((r) => r.type === '30_day' || r.type === '90_day')
    const list = []

    if (row.kind === 'received') {
      list.push({
        key: 'funding',
        icon: 'receipt',
        name: T.evFunding,
        ref: row.ref,
        state: 'done',
        date: row.date,
        href: null,
      })
    } else {
      list.push({
        key: 'invoice',
        icon: 'doc',
        name: T.evInvoice,
        ref: row.ref,
        state: 'done',
        date: row.date,
        href: null,
      })
      list.push({
        key: 'payment',
        icon: 'receipt',
        name: T.evPayment,
        ref: '',
        state: row.receiptUrl ? 'done' : 'pending',
        date: row.date,
        href: row.receiptUrl ? `/storage/${row.receiptUrl}` : null,
      })
    }

    list.push({
      key: 'delivery',
      icon: 'truck',
      name: T.evDelivery,
      ref: '',
      state: delivery ? 'done' : 'pending',
      date: delivery ? delivery.submitted_at || '' : '',
      href: delivery ? '/reports' : null,
    })
    list.push({
      key: 'completion',
      icon: 'news',
      name: T.evCompletion,
      ref: '',
      state: completion ? 'done' : 'pending',
      date: completion ? completion.submitted_at || '' : '',
      href: completion ? '/reports' : null,
    })

    return list
  }

  // ----- Filters -----
  useEffect(() => setLimit(10), [q, type, status, range])

  const inRange = (dateString) => {
    if (range === 'all') return true
    if (!dateString) return false
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return false
    const now = new Date()
    if (range === 'year') return d.getFullYear() === now.getFullYear()
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - Number(range))
    return d >= cutoff
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return feed.filter((e) => {
      if (type !== 'all' && e.type !== type) return false
      if (status !== 'all' && e.status !== status) return false
      if (!inRange(e.date)) return false
      if (!term) return true
      return `${e.ref} ${e.purpose} ${e.relatedRequest} ${e.supplier}`.toLowerCase().includes(term)
    })
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [feed, q, type, status, range])

  const visible = filtered.slice(0, limit)
  const filtersActive = q || type !== 'all' || status !== 'all' || range !== 'all'

  const clearFilters = () => {
    setQ('')
    setType('all')
    setStatus('all')
    setRange('all')
  }

  // ----- Drawer handling -----
  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [selected])

  useEffect(() => {
    if (!selected) return
    const onKey = (e) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  const statusBadge = (state) =>
    state === 'completed' ? 'status-badge-success' : 'status-badge-warning'

  return (
    <div className="w-full bg-white text-ink-900">
      {/* ================= 1. HERO ================= */}
      {/* Deliberately carries no numbers. The four figures live once, in the
          financial overview below, so nothing on this page is repeated. */}
      <section className="relative overflow-hidden border-b border-ink-200 bg-cream">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gold-500" aria-hidden="true" />
        <Container className="grid gap-10 py-12 sm:py-16 lg:min-h-[430px] lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.78fr)] lg:items-center lg:gap-16">
          <div className="max-w-2xl">
            <span className="eyebrow">{T.heroEyebrow}</span>
            <h1 className="display-xl mt-5 max-w-[14ch] text-balance text-ink-900">{T.heroTitle}</h1>
            <p className="lede mt-5 max-w-xl text-pretty">{T.heroLede}</p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#transactions" className="btn-forest">
                {T.heroAction}
                <Icon name="arrow-right" className="h-4 w-4" />
              </a>
              <a href="#how-funds-move" className="text-sm font-semibold text-oweru-800 underline decoration-oweru-300 underline-offset-4 hover:text-oweru-950">
                {T.howItWorks}
              </a>
            </div>
            <p className="mt-7 flex max-w-xl items-start gap-2 text-[0.8125rem] leading-relaxed text-ink-500">
              <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-oweru-700" />
              {T.privacyNote}
            </p>
          </div>

          <aside aria-label={T.latestLabel} className="relative overflow-hidden bg-oweru-900 p-6 text-white sm:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-white/20 pb-4">
              <span className="eyebrow eyebrow-on-dark">{T.latestLabel}</span>
              <span className="flex items-center gap-2 text-[0.6875rem] font-semibold text-white/65">
                <span className={`h-2 w-2 rounded-full ${loading ? 'bg-gold-300' : loadError ? 'bg-error-500' : 'bg-success-500'}`} />
                {loading ? T.dataUpdating : loadError ? T.dataRetry : T.dataCurrent}
              </span>
            </div>

            {loading ? (
              <div className="mt-7 space-y-4" aria-hidden="true">
                <div className="h-3 w-2/5 animate-pulse bg-white/15" />
                <div className="h-8 w-3/4 animate-pulse bg-white/15" />
                <div className="h-4 w-1/2 animate-pulse bg-white/15" />
              </div>
            ) : latestRecord ? (
              <button type="button" onClick={() => setSelected(latestRecord)} className="group mt-6 block w-full text-left">
                <div className="flex items-center justify-between gap-4 text-xs text-white/60">
                  <span className="font-mono">{latestRecord.ref}</span>
                  <span className="tabular-nums">{fmtDate(latestRecord.date) || '—'}</span>
                </div>
                <p className="mt-5 line-clamp-2 text-lg leading-snug font-semibold text-white sm:text-xl">
                  {latestRecord.purpose || '—'}
                </p>
                <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/20 pt-5">
                  <div>
                    <span className="block text-[0.6875rem] text-white/60">{T.colAmount}</span>
                    <span className="stat-num mt-1 block text-2xl text-white tabular-nums">{money(latestRecord.amount)}</span>
                  </div>
                  <span className={`status-badge ${statusBadge(latestRecord.status)} whitespace-nowrap`}>
                    {latestRecord.status === 'completed' ? T.statusCompletedBadge : T.statusProgressBadge}
                  </span>
                </div>
                <span className="mt-5 flex items-center gap-2 text-sm font-semibold text-gold-300 group-hover:text-gold-200">
                  {T.latestOpen}<Icon name="arrow-right" className="h-4 w-4" />
                </span>
              </button>
            ) : (
              <p className="mt-7 text-sm leading-relaxed text-white/75">
                {loadError ? T.dataUnavailable : T.latestEmpty}
              </p>
            )}
          </aside>
        </Container>
      </section>

      {/* ================= 2. FINANCIAL OVERVIEW ================= */}
      <Section tone="white" size="small">
        <Container>
          <SectionHeading eyebrow={T.overviewEyebrow} title={T.overviewTitle} lede={T.overviewLede} />

          <div className="mt-9 grid overflow-hidden rounded-[10px] border border-ink-200 bg-paper sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((c) => (
              <div key={c.label} className="border-b border-ink-200 p-5 last:border-b-0 sm:p-6 lg:border-r lg:border-b-0 lg:last:border-r-0">
                <div className="flex items-center gap-2 text-ink-500">
                  <Icon name={c.icon} className="h-4 w-4 text-oweru-700" />
                  <p className="text-[0.75rem] font-semibold">{c.label}</p>
                </div>
                <p className="stat-num mt-5 break-words text-xl text-ink-900 tabular-nums sm:text-2xl">
                  {c.prefix && <span className="mr-1 text-[0.55em] tracking-normal opacity-60">{c.prefix}</span>}
                  {loading || loadError ? '—' : c.prefix ? Number(c.value).toLocaleString('en-US') : c.value}
                </p>
                <p className="mt-2 text-[0.75rem] leading-snug text-ink-500">{c.note}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ================= 3. FUND FLOW ================= */}
      <section id="how-funds-move" className="bg-ink-50 py-14 sm:py-18">
        <Container>
          <SectionHeading eyebrow={T.flowEyebrow} title={T.flowTitle} lede={T.flowLede} />

          <ol className="mt-8 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 xl:grid-cols-6">
            {T.steps.map((s, i) => (
              <li key={s.title} className="reveal is-hidden border-t border-ink-200 pt-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center bg-oweru-50 text-oweru-700">
                    <Icon name={s.icon} className="h-4 w-4" />
                  </span>
                  <span className="text-[0.6875rem] font-bold tracking-[0.12em] text-gold-700 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-3 text-[0.9375rem] font-semibold text-ink-900">{s.title}</h3>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-500">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ================= 4-6. PUBLIC TRANSACTIONS ================= */}
      <Section tone="sand" id="transactions">
        <Container>
          <SectionHeading eyebrow={T.txEyebrow} title={T.txTitle} lede={T.txLede} />

          {/* Toolbar */}
          <div className="mt-8 border-y border-ink-200 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-fit max-w-full flex-wrap items-center gap-1 rounded-[8px] border border-ink-200 bg-white p-1">
              {T.tabs.map((tab) => {
                const active =
                  tab.key === 'all'
                    ? type === 'all' && status === 'all'
                    : tab.key === 'donation'
                      ? type === 'donation' && status === 'all'
                      : tab.key === 'disbursement'
                        ? type === 'disbursement' && status === 'all'
                        : tab.key === 'completed'
                          ? status === 'completed' && type === 'all'
                          : status === 'progress' && type === 'all'
                return (
                  <button
                    key={tab.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      if (tab.key === 'all') {
                        setType('all')
                        setStatus('all')
                      } else if (tab.key === 'donation') {
                        setType('donation')
                        setStatus('all')
                      } else if (tab.key === 'disbursement') {
                        setType('disbursement')
                        setStatus('all')
                      } else if (tab.key === 'completed') {
                        setType('all')
                        setStatus('completed')
                      } else {
                        setType('all')
                        setStatus('progress')
                      }
                    }}
                    className={`rounded-[7px] px-3.5 py-2 text-[0.8125rem] font-semibold transition-colors ${
                      active ? 'bg-oweru-800 text-white' : 'text-ink-500 hover:text-ink-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative sm:w-64">
                <Icon
                  name="search"
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={T.searchPlaceholder}
                  aria-label={T.searchLabel}
                  className="w-full rounded-[10px] border border-ink-200 bg-white py-2.5 pr-4 pl-10 text-sm outline-none transition-colors placeholder:text-ink-400 focus:border-oweru-500"
                />
              </div>

              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                aria-label={T.dateLabel}
                className="rounded-[10px] border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-700 outline-none transition-colors focus:border-oweru-500"
              >
                <option value="all">{T.dateAll}</option>
                <option value="30">{T.date30}</option>
                <option value="90">{T.date90}</option>
                <option value="year">{T.dateYear}</option>
              </select>

            </div>
          </div>
          </div>

          {loading ? (
            <div className="mt-6 space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-[12px] bg-ink-50" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="mt-6 rounded-[14px] border border-dashed border-ink-300 bg-ink-50 px-6 py-16 text-center">
              <Icon name="inbox" className="mx-auto h-7 w-7 text-ink-300" />
              <p className="mt-4 font-semibold text-ink-800">{T.emptyTitle}</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">{T.emptyBody}</p>
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="btn-secondary mt-6">
                  {T.clearFilters}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="mt-6 hidden overflow-hidden border-y border-ink-200 bg-white lg:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-ink-200 bg-ink-50 text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-500 uppercase">
                      <th scope="col" className="px-5 py-3.5">{T.colDate}</th>
                      <th scope="col" className="px-5 py-3.5">{T.colRef}</th>
                      <th scope="col" className="px-5 py-3.5">{T.colPurpose}</th>
                      <th scope="col" className="px-5 py-3.5 text-right">{T.colAmount}</th>
                      <th scope="col" className="px-5 py-3.5">{T.colType}</th>
                      <th scope="col" className="px-5 py-3.5">{T.colStatus}</th>
                      <th scope="col" className="px-5 py-3.5 text-right">{T.colAction}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((e) => (
                      <tr
                        key={e.key}
                        onClick={() => setSelected(e)}
                        className="cursor-pointer border-b border-ink-100 transition-colors last:border-0 hover:bg-oweru-50 focus-within:bg-oweru-50"
                      >
                        <td className="px-5 py-4 text-[0.8125rem] font-medium text-ink-500 tabular-nums whitespace-nowrap">
                          {fmtDate(e.date) || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setSelected(e)}
                            className="font-mono text-[0.8125rem] font-medium text-oweru-700 underline decoration-dotted underline-offset-4 transition-colors hover:text-oweru-900"
                          >
                            {e.ref}
                          </button>
                        </td>
                        <td className="max-w-[22rem] px-5 py-4">
                          <span className="block truncate font-medium text-ink-900">
                            {e.purpose || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-ink-900 tabular-nums whitespace-nowrap">
                          {money(e.amount)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="chip whitespace-nowrap">
                            {e.type === 'donation' ? T.typeDonation : T.typeDisbursement}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`status-badge ${statusBadge(e.status)} whitespace-nowrap`}>
                            {e.status === 'completed' ? T.statusCompletedBadge : T.statusProgressBadge}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelected(e)}
                            className="text-[0.8125rem] font-semibold text-oweru-700 transition-colors hover:text-oweru-900"
                          >
                            {T.view}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile / tablet cards */}
              <ul className="mt-6 divide-y divide-ink-200 border-y border-ink-200 bg-white lg:hidden">
                {visible.map((e) => (
                  <li
                    key={e.key}
                    onClick={() => setSelected(e)}
                    className="cursor-pointer px-4 py-5 first:pt-5 last:pb-5 sm:px-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelected(e)}
                        className="font-mono text-[0.8125rem] font-medium text-oweru-700 underline decoration-dotted underline-offset-4"
                      >
                        {e.ref}
                      </button>
                      <span className={`status-badge ${statusBadge(e.status)}`}>
                        {e.status === 'completed' ? T.statusCompletedBadge : T.statusProgressBadge}
                      </span>
                    </div>

                    <p className="mt-3 font-medium text-ink-900">{e.purpose || '—'}</p>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-400 uppercase">
                          {T.colAmount}
                        </p>
                        <p className="mt-1 text-[1.0625rem] font-semibold text-ink-900 tabular-nums">
                          {money(e.amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="chip">{e.type === 'donation' ? T.typeDonation : T.typeDisbursement}</span>
                        <p className="mt-2 text-[0.75rem] text-ink-400 tabular-nums">
                          {fmtDate(e.date) || '—'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelected(e)}
                      className="btn-secondary btn-sm btn-block mt-4"
                    >
                      {T.view}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col items-center gap-3">
                <p className="text-[0.8125rem] text-ink-400 tabular-nums">
                  {T.showing} {visible.length} {T.of} {filtered.length} {T.records}
                </p>
                {filtered.length > visible.length && (
                  <button
                    type="button"
                    onClick={() => setLimit((n) => n + 10)}
                    className="btn-secondary"
                  >
                    {T.showMore}
                  </button>
                )}
              </div>
            </>
          )}
        </Container>
      </Section>

      {/* ================= 7-8. FUND JOURNEY + EVIDENCE (inside drawer) ================= */}

      {/* ================= 9. TRANSPARENCY & PRIVACY ================= */}
      <Section tone="sand">
        <Container>
          <SectionHeading eyebrow={T.privacyEyebrow} title={T.privacyTitle} lede={T.privacyLede} />

          {/* One panel with a hairline split rather than two floating cards. */}
          <div className="panel reveal is-hidden mt-10 grid gap-8 p-7 sm:p-9 lg:grid-cols-2 lg:gap-12">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-success-50 text-success-700">
                  <Icon name="eye" className="h-[1.125rem] w-[1.125rem]" />
                </span>
                <h3 className="text-[1.0625rem] font-semibold text-ink-900">{T.showTitle}</h3>
              </div>
              <ul className="mt-6 space-y-3">
                {T.showItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[0.9375rem] text-ink-700">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-success-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:border-l lg:border-ink-200 lg:pl-12">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-ink-50 text-ink-700">
                  <Icon name="lock" className="h-[1.125rem] w-[1.125rem]" />
                </span>
                <h3 className="text-[1.0625rem] font-semibold text-ink-900">{T.protectTitle}</h3>
              </div>
              <ul className="mt-6 space-y-3">
                {T.protectItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[0.9375rem] text-ink-700">
                    <Icon name="eyeoff" className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </Container>
      </Section>

      {/* ================= CTA ================= */}
      {/* Quiet on purpose: this is an exit from the record, not a second
          headline competing with the ledger itself. */}
      <Section tone="white" size="small">
        <Container>
          <div className="panel flex flex-col items-start justify-between gap-6 p-7 sm:p-8 lg:flex-row lg:items-center lg:p-9">
            <div className="max-w-xl">
              <span className="eyebrow">{T.ctaEyebrow}</span>
              <h2 className="mt-3 text-[1.375rem] leading-snug font-semibold text-balance text-ink-900 sm:text-[1.5rem]">
                {T.ctaTitle}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-500">{T.ctaLede}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link to="/requests" className="btn-primary">
                {T.ctaPrimary}
                <Icon name="arrow-right" className="h-4 w-4" />
              </Link>
              <Link to="/reports" className="btn-secondary">
                {T.ctaSecondary}
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---- Transaction detail drawer ---- */}
      {selected && (
        <div className="fixed inset-0 z-50 animate-fade-in" role="dialog" aria-modal="true" aria-label={T.drawerLabel}>
          <div
            className="absolute inset-0 bg-ink-950/60"
            onClick={() => setSelected(null)}
            aria-hidden="true"
          />
          <div className="animate-slide-in-right absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-ink-200 px-6 py-5">
              <div>
                <p className="font-mono text-[0.9375rem] font-semibold text-oweru-800">{selected.ref}</p>
                <p className="mt-1.5 text-[0.75rem] text-ink-400 tabular-nums">
                  {fmtDate(selected.date) || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
                aria-label={T.close}
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Summary */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip">
                  {selected.type === 'donation' ? T.typeDonation : T.typeDisbursement}
                </span>
                <span className={`status-badge ${statusBadge(selected.status)}`}>
                  {selected.status === 'completed' ? T.statusCompletedBadge : T.statusProgressBadge}
                </span>
              </div>

              <h2 className="mt-3 text-[1.375rem] leading-snug font-bold text-balance text-ink-900">
                {selected.purpose || '—'}
              </h2>
              {selected.supplier && (
                <p className="mt-1.5 text-sm text-ink-500">
                  {T.supplier}: <span className="capitalize">{selected.supplier}</span>
                </p>
              )}

              <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5 border-y border-ink-200 py-6 text-sm">
                <div>
                  <dt className="text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-400 uppercase">
                    {T.amount}
                  </dt>
                  <dd className="mt-1 text-[1.0625rem] font-semibold text-ink-900 tabular-nums">
                    {money(selected.amount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-400 uppercase">
                    {T.type}
                  </dt>
                  <dd className="mt-1 font-medium text-ink-800">
                    {selected.type === 'donation' ? T.typeDonation : T.typeDisbursement}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-400 uppercase">
                    {T.relatedRequest}
                  </dt>
                  <dd className="mt-1 font-medium text-ink-800">{relatedTitle(selected) || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-400 uppercase">
                    {selected.kind === 'received' ? T.category : T.supplier}
                  </dt>
                  <dd className="mt-1 font-medium text-ink-800 capitalize">
                    {selected.kind === 'received'
                      ? titleCase(selected.category) || '—'
                      : selected.supplier || '—'}
                  </dd>
                </div>
              </dl>

              {selected.kind === 'received' && (
                <p className="mt-5 rounded-[10px] bg-success-50 p-4 text-[0.8125rem] leading-relaxed text-success-700">
                  {T.donationNote}
                </p>
              )}
              {selected.kind === 'disbursed' && (
                <p className="mt-5 rounded-[10px] bg-oweru-50 p-4 text-[0.8125rem] leading-relaxed text-ink-600">
                  {T.paidNote}
                </p>
              )}
              {selected.kind === 'approved' && (
                <p className="mt-5 rounded-[10px] bg-warning-50 p-4 text-[0.8125rem] leading-relaxed text-warning-700">
                  {T.awaitingNote}
                </p>
              )}

              {/* Fund journey */}
              <section className="mt-8">
                <h3 className="text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-400 uppercase">
                  {T.journeyTitle}
                </h3>
                <ol className="mt-4">
                  {journeyFor(selected).map((s, i) => (
                    <li key={s.key} className="relative flex gap-4 pb-5 last:pb-0">
                      {i < 4 && (
                        <span
                          aria-hidden="true"
                          className="absolute top-7 bottom-0 left-[13px] w-px bg-ink-200"
                        />
                      )}
                      <span
                        className={`relative z-[1] flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full ${
                          s.state === 'done'
                            ? 'bg-success-500 text-white'
                            : s.state === 'progress'
                              ? 'bg-warning-50 text-warning-600'
                              : 'bg-ink-50 text-ink-300'
                        }`}
                      >
                        <Icon
                          name={s.state === 'done' ? 'check' : s.state === 'progress' ? 'clock' : 'chevron-right'}
                          className="h-3.5 w-3.5"
                          strokeWidth={2.4}
                        />
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-[0.9375rem] font-semibold text-ink-900">{s.title}</p>
                        <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-500">{s.body}</p>
                        <p className="mt-1 flex items-center gap-2 text-[0.75rem]">
                          <span
                            className={
                              s.state === 'done'
                                ? 'font-semibold text-success-700'
                                : s.state === 'progress'
                                  ? 'font-semibold text-warning-700'
                                  : 'text-ink-400'
                            }
                          >
                            {s.state === 'done' ? T.stageDone : s.state === 'progress' ? T.stageProgress : T.stagePending}
                          </span>
                          {s.date && (
                            <span className="text-ink-400 tabular-nums">
                              · {T.stageDate} {fmtDate(s.date)}
                            </span>
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Supporting evidence */}
              <section className="mt-8">
                <h3 className="text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-400 uppercase">
                  {T.evidenceTitle}
                </h3>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-500">{T.evidenceIntro}</p>

                <ul className="mt-4 space-y-2.5">
                  {evidenceFor(selected).map((ev) => (
                    <li
                      key={ev.key}
                      className="flex items-center gap-3 rounded-[12px] border border-ink-200 p-3.5"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] ${
                          ev.state === 'done' ? 'bg-success-50 text-success-700' : 'bg-ink-50 text-ink-400'
                        }`}
                      >
                        <Icon name={ev.icon} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.875rem] font-semibold text-ink-900">{ev.name}</p>
                        <p className="mt-0.5 truncate text-[0.75rem] text-ink-400">
                          {ev.ref || fmtDate(ev.date) || '—'}
                        </p>
                      </div>
                      {ev.href ? (
                        <a
                          href={ev.href}
                          target={ev.href.startsWith('http') ? '_blank' : undefined}
                          rel="noreferrer"
                          className="shrink-0 text-[0.8125rem] font-semibold text-oweru-700 hover:underline"
                        >
                          {ev.href.startsWith('/storage') ? T.view : T.evOpen}
                        </a>
                      ) : (
                        <span
                          className={`shrink-0 text-[0.75rem] font-semibold ${
                            ev.state === 'done' ? 'text-success-700' : 'text-ink-400'
                          }`}
                        >
                          {ev.state === 'done' ? T.evVerified : T.evNotRecorded}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Footer */}
            <div className="border-t border-ink-200 px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="flex items-center gap-2 text-[0.75rem] text-ink-400">
                  <Icon name="lock" className="h-3.5 w-3.5" />
                  {T.privacyNote}
                </p>
                {selected.requestId && (
                  <Link to={detailLink(selected)} className="btn-secondary btn-sm shrink-0">
                    {T.viewRequest}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}