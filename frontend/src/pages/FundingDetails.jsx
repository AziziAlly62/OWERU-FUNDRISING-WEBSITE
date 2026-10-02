import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import ProgressBar from '../components/ProgressBar'
import { useI18n } from '../i18n'
import { useAuth } from '../auth'
import { fetchRequestById, fetchFeaturedRequests, fundItem, checkMpesaStatus, money } from '../api'
import { onStatsChange } from '../statsBus'
import { validateDonationForm, sanitizeInput } from '../utils/validation'
import Icon from '../components/icons'
import { requestImage } from '../utils/requestImages'
import { SimplePageSkeleton } from '../components/LoadingSpinner'
import { setMeta } from '../hooks/usePageMeta'
import { track } from '../analytics'
import { useToast } from '../components/Toast'
import { SITE } from '../siteConfig'
import { Container, Section, SectionHeading, Card } from '../components/ui'

const SUGGESTED_AMOUNTS = [10000, 25000, 50000, 100000, 250000]
const FX_RATES = { TZS: 1, USD: 2600, EUR: 2800, GBP: 3200 } // sandbox demo rates only
const HERO_FALLBACK_IMAGE = '/photos/requests-hero.jpg'

const titleCase = (s = '') => String(s).replace(/\b[a-z]/g, (c) => c.toUpperCase())

function categoryLabel(cat, sw) {
  if (cat === 'Other') return sw ? 'Huduma kwa Jamii' : 'Community Outreach'
  return titleCase(cat || (sw ? 'Huduma ya Kijamii' : 'Community Outreach'))
}

const displayItemName = (item, sw) => sw ? item?.swName || item?.name || '' : item?.name || ''
const displayItemDescription = (item, sw) => sw ? item?.swDescription || item?.description || '' : item?.description || ''

function detectNetwork(phone) {
  const p = String(phone || '').replace(/\D/g, '').replace(/^255/, '').replace(/^0/, '')
  if (p.startsWith('71') || p.startsWith('74')) return 'mpesa'
  if (p.startsWith('65') || p.startsWith('67') || p.startsWith('68') || p.startsWith('69')) return 'tigo'
  if (p.startsWith('75') || p.startsWith('76') || p.startsWith('78') || p.startsWith('79')) return 'airtel'
  return 'mpesa'
}

function networkLabel(net, sw) {
  const labels = {
    mpesa: sw ? 'M-Pesa (Vodacom)' : 'M-Pesa (Vodacom)',
    tigo: 'Tigo Pesa',
    airtel: 'Airtel Money',
    other: sw ? 'Nyingine' : 'Other',
  }
  return labels[net] || labels.other
}

function detectCardBrand(number) {
  const d = String(number || '').replace(/\D/g, '')
  if (d.startsWith('4')) return 'visa'
  if (/^5[1-5]/.test(d)) return 'mastercard'
  if (d.startsWith('34') || d.startsWith('37')) return 'amex'
  return 'card'
}

/** Reassuring countdown while the M-Pesa / card status is verified (~4s demo, up to 120s). */
function PayingCountdown({ sw }) {
  const [sec, setSec] = useState(120)
  useEffect(() => {
    const id = setInterval(() => setSec((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])
  const mm = String(Math.floor(sec / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-800" role="status">
      <svg className="h-5 w-5 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" strokeOpacity="0.3" />
        <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
      </svg>
      <span className="flex-1">
        {sw ? 'Tunasubiri uthibitisho wa malipo kutoka kwa mtandao...' : 'Waiting for the payment provider confirmation...'}
      </span>
      <b className="font-mono tabular-nums" aria-label={sw ? 'Sekunde zilizobaki' : 'seconds left'}>{mm}:{ss}</b>
    </div>
  )
}

function shareMessage(req, item, sw, url) {
  const pct = Math.round((item.raised / (item.target || 1)) * 100)
  const remaining = Math.max(0, item.target - item.raised)
  const itemName = displayItemName(item, sw)
  const requestTitle = sw ? req.swTitle || req.title : req.title
  const base = sw
    ? `Saidia kufadhili ${itemName} kwa ajili ya ${requestTitle}. Tumefikia ${pct}% ya lengo la TZS ${item.target.toLocaleString()}; kinachohitajika bado ni TZS ${remaining.toLocaleString()}.`
    : `Help fund ${itemName} for ${requestTitle}. ${pct}% of its TZS ${item.target.toLocaleString()} target is raised; TZS ${remaining.toLocaleString()} is still needed.`
  return `${base} ${url}`
}

function shareWhatsApp(req, item, sw) {
  const url = window.location.href
  window.open(
    `https://wa.me/?text=${encodeURIComponent(shareMessage(req, item, sw, url))}`,
    '_blank',
    'noopener,noreferrer'
  )
}

function shareFacebook(url) {
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    '_blank',
    'noopener,noreferrer'
  )
}

function shareX(url) {
  window.open(
    `https://x.com/intent/post?url=${encodeURIComponent(url)}`,
    '_blank',
    'noopener,noreferrer'
  )
}

function shareTelegram(req, item, sw, url) {
  window.open(
    `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareMessage(req, item, sw, url))}`,
    '_blank',
    'noopener,noreferrer'
  )
}

async function copyShareLink(req, item, sw) {
  const msg = shareMessage(req, item, sw, window.location.href)
  try {
    await navigator.clipboard.writeText(msg)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = msg
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

export function fundingSupporterCount(items) {
  const names = new Set()
  for (const item of items || []) {
    for (const d of item.donations || []) {
      if (d.status === 'confirmed') names.add((d.donor_name || d.donor?.name || '').trim())
    }
  }
  return names.size
}

function snippet(r, sw) {
  const raw = String(sw ? r.swTitle || r.story || r.storySw : r.story || r.swTitle || r.storySw || '')
  const out = raw.trim().replace(/\s+/g, ' ')
  return out.length > 110 ? out.slice(0, 110).trim() + '…' : out
}

export default function FundingDetails() {
  const { id } = useParams()
  const { state } = useLocation()
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const { toast } = useToast()
  const sw = lang === 'sw'
  const isRealUser = !!(user && !user.demo)

  const [req, setReq] = useState(state?.request || null)
  const [loading, setLoading] = useState(!state?.request)
  const [related, setRelated] = useState([])
  const hasDataRef = useRef(Boolean(state?.request))

  const [fundingItem, setFundingItem] = useState(null)
  const [amount, setAmount] = useState('')
  const [donorName, setDonorName] = useState('')
  const [asGuest, setAsGuest] = useState(true)
  const [paymentRef, setPaymentRef] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [methodGroup, setMethodGroup] = useState('mpesa')
  const [network, setNetwork] = useState('mpesa')
  const [cardNumber, setCardNumber] = useState('')
  const [cardCurrency, setCardCurrency] = useState('EUR')
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [mpesaState, setMpesaState] = useState(null) // { donationId, pending:true, error }
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [donateItemId, setDonateItemId] = useState(null)
  const [anonymous] = useState(false)

  useEffect(() => {
    if (!req) return
    setMeta({
      title: `${req.title} | OWERU Foundation`,
      description: String(req.story || req.storySw || 'An approved request for OWERU Foundation outreach.').slice(0, 160),
      image: window.location.origin + '/og-image.png',
      url: window.location.href,
    })
  }, [req])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  useEffect(() => {
    let alive = true
    const load = () => {
      if (!hasDataRef.current) setLoading(true)
      const guard = setTimeout(() => {
        // walinzi: iwapo HTTP itakwama chochote, ondoa "Loading..." ili
        // user asikae na skrini tupu ya milele.
        if (alive) setLoading(false)
      }, 12000)
      fetchRequestById(id)
        .then((r) => { clearTimeout(guard); if (alive && r) { hasDataRef.current = true; setReq(r) } })
        .catch(() => { clearTimeout(guard) }) // keep stale data rather than wiping preloaded state
        .finally(() => { clearTimeout(guard); if (alive) setLoading(false) })
    }
    load()
    const off = onStatsChange(load)
    return () => { alive = false; off() }
  }, [id])

  useEffect(() => {
    if (!req) return
    const first = (req.items || []).find((i) => i.status !== 'fully-funded') || (req.items || [])[0]
    setDonateItemId((cur) => cur || (first ? first.id : null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req?.id])

  useEffect(() => {
    if (!req) return
    let alive = true
    fetchFeaturedRequests()
      .then((list) => {
        if (!alive) return
        const picks = (list || [])
          .filter((x) => String(x.id) !== String(req.id))
          .map((x) => {
            const raised = (x.items || []).reduce((s, i) => s + Number(i.raised || 0), 0)
            const target = (x.items || []).reduce((s, i) => s + Number(i.target || 0), 0)
            return {
              ...x,
              raised,
              target,
              pct: target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0,
              catMatch: String(x.category || '').toLowerCase() === String(req.category || '').toLowerCase() ? 0 : 1,
            }
          })
          .sort((a, b) => a.catMatch - b.catMatch)
          .slice(0, 3)
        setRelated(picks)
      })
      .catch(() => {})
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req?.id])

  const openFund = (item, presetAmount = '') => {
    track('begin_donation', { item: item.name, request: req?.title })
    setFundingItem(item)
    setAmount(presetAmount ? String(presetAmount) : '')
    setDonorName(user?.name || '')
    setAsGuest(!isRealUser || anonymous)
    setPaymentRef('')
    setMethodGroup('mpesa')
    setPaymentMethod('mpesa')
    setNetwork('mpesa')
    setCardNumber('')
    setCardCurrency('EUR')
    setMpesaPhone(user?.phone || '')
    setMpesaState(null)
    setMessage(null)
    setReceipt(null)
  }

  const selectGroup = (g) => {
    setMethodGroup(g)
    if (g === 'mpesa' && !['mpesa', 'mobile', 'bank'].includes(paymentMethod)) setPaymentMethod('mpesa')
    if (g === 'card') setPaymentMethod('card')
    if (g === 'paypal') setPaymentMethod('paypal')
  }

  const pollMpesa = async (donationId) => {
    try {
      const res = await checkMpesaStatus(donationId)
      if (res.mpesa_status === 'paid' || res.donation_confirm === 'confirmed') {
        setMpesaState(null)
        const ref = res.receipt || res.payment_reference || ''
        const isCard = paymentMethod === 'card'
        const tzsAmount = isCard ? Number(amount) * (FX_RATES[cardCurrency] || 1) : Number(amount)
        setMessage({ ok: true, text: sw
          ? `Malipo yamethibitishwa! Asante kwa mchango wako.${ref ? ' Rejea: ' + ref : ''}`
          : `Payment confirmed! Thank you for your donation.${ref ? ' Ref: ' + ref : ''}` })
        toast(sw ? 'Malipo yamethibitishwa. Asante kwa mchango wako!' : 'Payment confirmed. Thank you for your donation!', 'success')
        setReceipt({
          itemName: displayItemName(fundingItem, sw),
          amount: Math.round(tzsAmount),
          donorName: (isRealUser ? user?.name : asGuest ? donorName : user?.name || donorName) || (sw ? 'Mgeni' : 'Anonymous'),
          reference: ref,
          method: isCard ? `Card (${cardCurrency})` : `${networkLabel(network, sw)} · STK`,
          date: new Date().toLocaleString(sw ? 'sw-TZ' : 'en-GB'),
          org: req.org,
          region: req.region,
          title: sw ? req.swTitle : req.title,
        })
        const updated = req.items.map((i) =>
          i.id === fundingItem.id
            ? { ...i, raised: i.raised + Math.round(tzsAmount),
                status: i.raised + Math.round(tzsAmount) >= i.target ? 'fully-funded' : i.status }
            : i
        )
        setReq({ ...req, items: updated })
        setFundingItem(null)
        return true
      }
      if (res.mpesa_status === 'failed') {
        setMpesaState(null)
        setMessage({ ok: false, text: sw ? 'Malipo yamekataliwa. Jaribu tena.' : 'Payment failed. Please try again.' })
        setFundingItem(null)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const submitFund = async (e) => {
    e.preventDefault()
    if (!fundingItem) return

    const formData = {
      amount,
      donorName: isRealUser ? user?.name : asGuest ? donorName : user?.name || donorName,
      asGuest: isRealUser ? false : asGuest,
      paymentMethod,
      paymentRef,
      mpesaPhone
    }

    const errors = validateDonationForm(formData)
    if (Object.keys(errors).length > 0) {
      setMessage({ ok: false, text: Object.values(errors).join(', ') })
      return
    }

    setBusy(true)
    setMessage(null)
    setMpesaState(null)
    try {
      const isCard = paymentMethod === 'card'
      const res = await fundItem({
        item_id: fundingItem.id,
        amount: Number(sanitizeInput(amount)),
        donor_name: sanitizeInput(isRealUser ? user?.name : asGuest ? donorName : user?.name || donorName),
        is_guest: isRealUser ? false : asGuest,
        payment_reference: (paymentMethod === 'mpesa' || isCard) ? undefined : sanitizeInput(paymentRef),
        payment_method: paymentMethod,
        network: paymentMethod === 'mpesa' || paymentMethod === 'mobile' ? network : undefined,
        currency: isCard ? cardCurrency : 'TZS',
        fx_rate: isCard ? (FX_RATES[cardCurrency] || 1) : undefined,
        card_last4: isCard ? cardNumber.replace(/\D/g, '').slice(-4) : undefined,
        card_brand: isCard ? detectCardBrand(cardNumber) : undefined,
        mpesa_phone: paymentMethod === 'mpesa' ? sanitizeInput(mpesaPhone) : undefined,
      })

      if (paymentMethod === 'mpesa') {
        const donationId = res.id
        setMessage({ ok: true, text: sw
          ? 'Pokea STK push kwenye simu yako na weka siri yako (PIN) ili kuthibitisha malipo...'
          : 'STK push sent to your phone. Enter your PIN on your phone to authorise the payment...' })
        setMpesaState({ donationId, pending: true })

        let resolved = false
        for (let i = 0; i < 40 && !resolved; i++) {
          await new Promise((r) => setTimeout(r, 3000))
          resolved = await pollMpesa(donationId)
        }
        if (!resolved) {
          setMpesaState(null)
          setMessage({ ok: false, text: sw
            ? 'Hatuwezi kuthibitisha malipo. Angalia simu yako au usubiri uthibitisho.'
            : 'Could not verify payment. Check your phone or wait for confirmation.' })
        }
      } else if (isCard) {
        const donationId = res.id
        const tzsShown = Number(amount) * (FX_RATES[cardCurrency] || 1)
        setMessage({ ok: true, text: sw
          ? `Unathibitisha malipo ya kadi ya ${cardCurrency} kwenye simu (sandbox)... takriban TZS ${Math.round(tzsShown).toLocaleString()}.`
          : `Authorising ${cardCurrency} card payment (sandbox)... approx TZS ${Math.round(tzsShown).toLocaleString()}.` })
        setMpesaState({ donationId, pending: true })

        let resolved = false
        for (let i = 0; i < 40 && !resolved; i++) {
          await new Promise((r) => setTimeout(r, 3000))
          resolved = await pollMpesa(donationId)
        }
        if (!resolved) {
          setMpesaState(null)
          setMessage({ ok: false, text: sw
            ? 'Hatuwezi kuthibitisha malipo ya kadi. Jaribu tena.'
            : 'Could not verify the card payment. Please try again.' })
        }
      } else {
        setMessage({ ok: true, text: sw
          ? `Asante! Mchango wako umepokelewa na utathibitishwa baada ya uthibitisho wa malipo. Rejea: ${res.payment_reference}`
          : `Thank you! Your donation was received and will be confirmed after payment verification. Ref: ${res.payment_reference}` })
        setReceipt({
          itemName: displayItemName(fundingItem, sw),
          amount: Number(amount),
          donorName: (isRealUser ? user?.name : asGuest ? donorName : user?.name || donorName) || (sw ? 'Mgeni' : 'Anonymous'),
          reference: res.payment_reference || '',
          method: paymentMethod === 'bank' ? 'Benki/Bank' : 'Fedha za Simu/Mobile',
          date: new Date().toLocaleString(sw ? 'sw-TZ' : 'en-GB'),
          org: req.org,
          region: req.region,
          title: sw ? req.swTitle : req.title,
        })
        setAmount('')
        const updated = req.items.map((i) =>
          i.id === fundingItem.id
            ? { ...i, raised: i.raised + Number(amount),
                status: i.raised + Number(amount) >= i.target ? 'fully-funded' : i.status }
            : i
        )
        setReq({ ...req, items: updated })
        setFundingItem(null)
      }
    } catch (err) {
      setMessage({ ok: false, text: err.message })
      setMpesaState(null)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <SimplePageSkeleton message={sw ? 'Inapakia...' : 'Loading...'} />
  }

  if (!req) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ink-100 text-ink-500 mb-5">
            <Icon name="alert" className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-ink-900">{sw ? 'Ombi halikupatikana' : 'Request not found'}</h1>
          <p className="mt-3 text-sm text-ink-500 leading-relaxed">
            {sw
              ? 'Ombi hili halipatikani hadharani — linaweza kuwa halijaidhinishwa bado, limefungwa, au kisanduku cha maelezo hakijafunguka. Chunguza maombi mengine yaliyo wazi.'
              : 'This request is not available publicly — it may not be approved yet, may be closed, or the detail view failed to open. Browse the other open requests instead.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/requests#causes" className="btn-primary !px-6 !py-3 text-sm">{sw ? 'Vinjari Maombi Wazi' : 'Browse Open Requests'}</Link>
            <Link to="/portal" className="btn-secondary !px-6 !py-3 text-sm">{sw ? 'Tuma Ombi Jipya' : 'Submit a Request'}</Link>
          </div>
        </div>
      </div>
    )
  }

  const totalRaised = (req.items || []).reduce((s, i) => s + Number(i.raised || 0), 0)
  const totalTarget = (req.items || []).reduce((s, i) => s + Number(i.target || 0), 0)
  const totalPct = totalTarget > 0
    ? (() => { const p = (totalRaised / totalTarget) * 100; return p >= 1 ? Math.round(p) : +p.toFixed(1) })()
    : 0
  const remaining = Math.max(0, totalTarget - totalRaised)
  const fullyFunded = totalTarget > 0 && totalRaised >= totalTarget
  const anyFutureDeadline = (req.items || []).some((i) => i.deadline && new Date(i.deadline).getTime() >= Date.now())
  const hasAnyDeadline = (req.items || []).some((i) => i.deadline)
  const fundingExpired = hasAnyDeadline && !anyFutureDeadline
  const closedStatus = ['funding_closed', 'closed', 'procurement', 'delivered', 'active_reporting'].includes(req.status)
  const donateDisabled = fullyFunded || fundingExpired || closedStatus
  const earliest = (req.items || [])
    .map((i) => i.deadline)
    .filter(Boolean)
    .sort()
    .slice(0, 1)[0]
  const WINDOW_MS = 60 * 86400000
  const windowEnd = earliest
    ? new Date(earliest).getTime()
    : (req.createdAt ? new Date(req.createdAt).getTime() + WINDOW_MS : Date.now() + WINDOW_MS)
  const totalDaysLeft = Math.max(0, Math.ceil((windowEnd - Date.now()) / 86400000))

  const donateItem = req.items.find((i) => i.id === donateItemId)
    || req.items.find((i) => i.status !== 'fully-funded')
    || req.items[0]

  const donateWith = (item, opts = {}) => {
    if (!item || item.status === 'fully-funded') return
    if (donateDisabled) {
      setMessage({ ok: false, text: sw ? 'Ufadhili wa ombi hili umefungwa. Asante kwa msaada wako!' : 'Funding for this request has closed. Thank you for your support!' })
      return
    }
    openFund(item, opts.amount ?? amount)
    if (opts.payment === 'mpesa') { setPaymentMethod('mpesa'); setNetwork(opts.network || 'mpesa') }
    else if (opts.payment === 'card') { setPaymentMethod('card') }
    else if (opts.payment === 'mobile') { setPaymentMethod('mobile') }
    else { setPaymentMethod('mobile') }
  }

  const shareTo = (kind) => {
    const url = window.location.href
    if (kind === 'facebook') shareFacebook(url)
    else if (kind === 'x') shareX(url)
    else if (kind === 'telegram') shareTelegram(req, donateItem || req.items[0], sw, url)
    else shareWhatsApp(req, donateItem || req.items[0], sw)
  }

  const downloadShareCard = async () => {
    const raised = req.items.reduce((s, i) => s + (i.raised || 0), 0)
    const target = req.items.reduce((s, i) => s + (i.target || 0), 0)
    const pct = target ? (raised / target) * 100 : 0
    try {
      const { drawShareCard, downloadBlob } = await import('../utils/shareCard')
      const { blob } = await drawShareCard({
        title: sw ? req.swTitle || req.title : req.title,
        progressPct: pct,
        raised,
        target,
        imageSrc: requestImage(req.category + ' ' + (req.title || ''), 1200, req.id),
        url: window.location.href,
      })
      downloadBlob(blob, `oweru-${(req.title || 'campaign').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.png`)
    } catch {
      setMessage({ ok: false, text: sw ? 'Imeshindikana kutengeneza picha. Jaribu tena.' : 'Failed to generate image. Please retry.' })
    }
  }

  const copyPrimary = () => {
    copyShareLink(req, donateItem || req.items[0], sw).then(() => {
      setCopiedId('primary')
      setTimeout(() => setCopiedId(''), 2000)
    })
  }

  const helpInquiry = () => {
    const url = window.location.href
    window.open(
      `https://wa.me/?text=${encodeURIComponent(sw
        ? `Habari OWERU, nina swali kuhusu ombi hili: ${url}`
        : `Hi OWERU, I have a question about this request: ${url}`)}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const itemNeeded = fundingItem ? Math.max(0, Math.round(fundingItem.target - fundingItem.raised)) : 0

  return (
    <div className="pb-24 lg:pb-0">
      {/* ============================== BREADCRUMB ============================== */}
      <div className="border-b border-ink-200 bg-white">
        <Container className="py-4">
          <nav aria-label={sw ? 'Njia' : 'Breadcrumb'} className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
            <Link to="/" className="transition-colors hover:text-oweru-700">{sw ? 'Mwanzo' : 'Home'}</Link>
            <span aria-hidden="true" className="text-ink-300">/</span>
            <Link to="/requests#causes" className="transition-colors hover:text-oweru-700">
              {sw ? 'Mahitaji ya kusaidia' : 'Causes'}
            </Link>
            <span aria-hidden="true" className="text-ink-300">/</span>
            <span className="truncate font-medium text-ink-900">{sw ? req.swTitle : req.title}</span>
          </nav>
        </Container>
      </div>

      {/* ============================== PRODUCT DETAIL ============================== */}
      <section className="border-b border-ink-200 bg-white">
        <Container className="py-8 sm:py-10 lg:py-12">
          <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
            {/* LEFT: request photo */}
            <div className="lg:col-span-7">
              <button
                type="button"
                onClick={() => setLightbox({
                  src: requestImage(req.category + ' ' + (req.title || ''), 1600, req.id),
                  alt: sw ? `${req.swTitle || req.title} — ${req.category}` : `${req.title} — ${req.category}`,
                })}
                aria-label={sw ? 'Ongeza picha' : 'Enlarge photo'}
                className="relative block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-ink-100 bg-white p-2 shadow-sm"
              >
                <img
                  src={requestImage(req.category + ' ' + (req.title || ''), 1600, req.id)}
                  alt={sw ? `${req.swTitle || req.title} — ${req.category}` : `${req.title} — ${req.category}`}
                  className="h-[260px] w-full rounded-xl object-cover sm:h-[380px] lg:h-[500px]"
                  loading="eager"
                  decoding="async"
                  onError={(e) => { if (e.currentTarget.src !== HERO_FALLBACK_IMAGE) e.currentTarget.src = HERO_FALLBACK_IMAGE }}
                />
                {fullyFunded && (
                  <span className="absolute top-5 left-5 status-badge status-badge-success">
                    {sw ? 'Imefadhiliwa Kikamilifu' : 'Fully Funded'}
                  </span>
                )}
              </button>

            </div>

            {/* RIGHT: information + fund action (5/12) */}
            <div className="space-y-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm lg:col-span-5 lg:p-8">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-block rounded-full bg-ink-100 px-2.5 py-1 text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-800 uppercase">
                    {categoryLabel(req.category, sw)}
                  </span>
                  <span className="chip chip-accent">
                    <Icon name="verify" className="h-3.5 w-3.5" />{sw ? 'Imethibitishwa' : 'Approved'}
                  </span>
                </div>

                <h1 className="mt-3 text-balance text-[1.75rem] leading-tight font-bold text-ink-900 lg:text-[2rem]">
                  {sw ? req.swTitle : req.title}
                </h1>

                <p className="mt-1 text-sm text-ink-500">
                  {sw ? 'Inaendeshwa na' : 'Organized by'}{' '}
                  <b className="font-semibold text-ink-800">{req.org || SITE.name}</b>
                  {req.churchName ? ` · ${req.churchName}` : ''}
                  {req.region ? ` · ${req.region}` : ''}
                </p>
              </div>

              {totalTarget > 0 && (
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="text-[1.75rem] font-extrabold text-gold-600 tabular-nums">
                      {money(totalRaised)}
                    </span>
                    <span className="text-sm font-medium text-ink-500">
                      {sw ? 'Lengo' : 'Goal'}: {money(totalTarget)}
                    </span>
                  </div>
                  <ProgressBar raised={totalRaised} target={totalTarget} complete={fullyFunded} className="mt-3" />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 text-xs font-medium text-ink-500">
                    <span>
                      {sw ? 'Zimepatikana' : 'Raised'}: {totalPct}%
                    </span>
                    <span>
                      {fullyFunded
                        ? (sw ? 'Imekamilika' : 'Completed')
                        : fundingExpired
                          ? (sw ? 'Muda umeisha' : 'Closed')
                          : `${totalDaysLeft} ${sw ? 'siku zimebaki' : 'days left'}`}
                    </span>
                  </div>
                  {!fullyFunded && (
                    <p className="mt-3 border-t border-ink-100 pt-3 text-sm font-semibold text-oweru-800">
                      {sw ? 'Kinachohitajika bado' : 'Still needed'}: {money(remaining)}
                    </p>
                  )}
                </div>
              )}

              {(sw ? req.storySw || req.story : req.story || req.storySw) && (
                <p className="text-pretty text-sm leading-relaxed text-ink-600">
                  {sw ? req.storySw || req.story : req.story || req.storySw}
                </p>
              )}

              {/* Choose a specific item before opening the donation form. */}
              <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                <a href="#items-to-fund" className="btn-primary btn-lg flex-1 justify-center">
                  <Icon name="chevron" className="h-4 w-4" />
                  {sw ? 'Chagua kifaa cha kufadhili' : 'Choose an item to fund'}
                </a>
                <button
                  type="button"
                  onClick={() => setShareOpen((v) => !v)}
                  aria-expanded={shareOpen}
                  className="btn-secondary btn-lg"
                >
                  <Icon name="link" className="h-4 w-4" />{sw ? 'Sambaza' : 'Share'}
                </button>
              </div>

              {donateDisabled && (
                <p role="status" className="rounded-[10px] border border-warning-200 bg-warning-50 px-4 py-3 text-sm leading-relaxed text-warning-700">
                  {fullyFunded
                    ? (sw ? 'Ombi hili limefadhiliwa kikamilifu. Asante kwa kujali.' : 'This request is fully funded. Thank you for caring.')
                    : fundingExpired
                      ? (sw ? 'Kipindi cha ufadhili kimeisha. Angalia Rejesta ya Umma kwa matumizi ya fedha.' : 'The funding period has ended. Check the Public Ledger for how funds were used.')
                      : (sw ? 'Ufadhili wa ombi hili umefungwa.' : 'Funding for this request is closed.')}
                </p>
              )}

              <div className="flex flex-wrap gap-2 border-t border-ink-200 pt-4">
                <Link to="/ledger" className="btn-secondary btn-sm">
                  <Icon name="doc" className="h-4 w-4" />{sw ? 'Rejesta ya Umma' : 'Public Ledger'}
                </Link>
                <button type="button" onClick={helpInquiry} className="btn-secondary btn-sm">
                  <Icon name="whatsapp" className="h-4 w-4" />{sw ? 'Uliza Swali' : 'Ask a question'}
                </button>
              </div>

              {shareOpen && (
                <div role="menu" className="mt-3 grid w-full grid-cols-2 gap-1 rounded-[12px] border border-ink-100 bg-white p-2 shadow-[0_10px_25px_rgba(14,59,46,0.10)] sm:w-72">
                  {[
                    ['facebook', t('shareFacebook')],
                    ['x', t('shareX')],
                    ['telegram', t('shareTelegram')],
                    ['whatsapp', t('shareWhatsApp')],
                  ].map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => shareTo(k)}
                      className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-left text-sm transition-colors hover:bg-ink-50"
                    >
                      <Icon name={k} className="h-4 w-4" />{label}
                    </button>
                  ))}
                  <button
                    onClick={downloadShareCard}
                    className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-left text-sm transition-colors hover:bg-ink-50"
                  >
                    <Icon name="image" className="h-4 w-4" />{t('shareImage')}
                  </button>
                  <button
                    onClick={copyPrimary}
                    className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-left text-sm transition-colors hover:bg-ink-50"
                  >
                    {copiedId === 'primary'
                      ? <><Icon name="verify" className="h-4 w-4 text-success-600" />{t('linkCopied')}</>
                      : <><Icon name="link" className="h-4 w-4" />{t('copyLink')}</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ============================== ITEMS TO FUND ============================== */}
      <Section tone="sand" id="items-to-fund">
        <Container>
          <SectionHeading
            eyebrow={sw ? 'Athari' : 'Impact'}
            title={sw ? 'Msaada Wako Utafanya Nini' : 'What Your Support Will Do'}
            lede={sw
              ? 'Chagua kifaa mahususi kilichoidhinishwa. Malipo huenda kwa muuzaji aliyethibitishwa; mpokeaji hapewi fedha taslimu.'
              : 'Choose a specific, approved item. Payments go to vetted suppliers; recipients never receive cash.'}
          />

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {req.items.map((item, i) => {
              const itemFunded = item.status === 'fully-funded' || (item.target > 0 && item.raised >= item.target)
              const itemPct = item.target > 0 ? Math.min(100, Math.round((item.raised / item.target) * 100)) : 0
              const donors = (item.donations || []).filter((d) => d.confirmed).length
              return (
                <Card key={item.id} className="flex flex-col p-6">
                  <div className="flex items-start gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-100 text-xs font-bold text-ink-700 tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-[1.0625rem] leading-snug font-bold text-ink-900">{displayItemName(item, sw)}</h3>
                  </div>

                  {!itemFunded && (
                    <span className="mt-3 inline-block w-fit rounded-md bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700">
                      {sw ? 'Imethibitishwa kwa muuzaji mzuri' : 'Guaranteed from a vetted supplier'}
                    </span>
                  )}
                  {itemFunded && (
                    <span className="status-badge status-badge-success mt-3 w-fit">{sw ? 'Imekamilika' : 'Done'}</span>
                  )}

                  {displayItemDescription(item, sw) && (
                    <p className="mt-3 text-sm leading-relaxed">{displayItemDescription(item, sw)}</p>
                  )}

                  <div className="mt-auto pt-5">
                    <p className="text-2xl font-extrabold text-ink-900 tabular-nums">
                      {money(item.raised || 0)}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-ink-500">
                      <span className="tabular-nums">
                        {item.target > 0 ? `${itemPct}% · ${sw ? 'Lengo' : 'Goal'} ${money(item.target || 0)}` : (sw ? 'Kifaa binafsi' : 'Direct item')}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="users" className="h-3.5 w-3.5 text-oweru-600" />
                        {donors} {sw ? 'wachangiaji' : donors === 1 ? 'donor' : 'donors'}
                      </span>
                    </div>
                    <ProgressBar raised={item.raised} target={item.target} complete={itemFunded} className="mt-2" />
                    <button
                      type="button"
                      onClick={() => donateWith(item)}
                      disabled={itemFunded || donateDisabled}
                      className={`btn-block mt-4 ${itemFunded || donateDisabled ? 'btn-secondary' : 'btn-primary'}`}
                    >
                      {itemFunded
                        ? (sw ? 'Imekamilika' : 'Completed')
                        : donateDisabled
                          ? (sw ? 'Ufadhili umefungwa' : 'Funding closed')
                          : (sw ? 'Changia hiki' : 'Fund this item')}
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        </Container>
      </Section>

      {/* ============================== RELATED REQUESTS ============================== */}
      {related.length > 0 && (
        <Section tone="sand">
          <Container>
            <SectionHeading
              eyebrow={sw ? 'Nyingine' : 'Others'}
              title={sw ? 'Njia Nyingine za Kusaidia' : 'Other Ways to Help'}
              lede={sw
                ? 'Maombi mengine yaliyoidhinishwa ambayo yanaendelea hadharani.'
                : 'More approved requests that are currently open to the public.'}
              action={<Link to="/requests#causes" className="btn-secondary btn-sm">{sw ? 'Angalia yote' : 'View all'}</Link>}
            />

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((x) => {
                const rxFunded = x.target > 0 && x.raised >= x.target
                return (
                  <Card key={x.id} className="flex flex-col overflow-hidden">
                    <div className="relative">
                      <img
                        src={requestImage((x.swTitle || x.title || 'outreach') + ' africa', 800, x.id)}
                        alt={sw ? x.swTitle : x.title}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[16/10] w-full object-cover"
                      />
                      <span className="chip absolute top-3 left-3 border-ink-900 bg-ink-950/85 text-white backdrop-blur">
                        {categoryLabel(x.category, sw)}
                      </span>
                      {rxFunded ? (
                        <span className="status-badge status-badge-success absolute top-3 right-3">
                          {sw ? 'Imefadhiliwa' : 'Funded'}
                        </span>
                      ) : (
                        <span className="chip chip-accent absolute top-3 right-3">
                          <Icon name="verify" className="h-3 w-3" />{sw ? 'Imethibitishwa' : 'Approved'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-[1.0625rem] leading-snug text-ink-900">{sw ? x.swTitle : x.title}</h3>
                      <p className="mt-1 text-xs text-ink-500">{x.org} · {x.region || 'Tanzania'}</p>
                      <p className="mt-3 flex-1 text-sm leading-relaxed">{snippet(x, sw)}</p>

                      <div className="mt-5">
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="font-semibold text-ink-900 tabular-nums">{money(x.raised || 0)}</span>
                          <span className="text-ink-500 tabular-nums">{x.pct}% · {money(x.target)}</span>
                        </div>
                        <ProgressBar raised={x.raised} target={x.target} complete={rxFunded} className="mt-2" />
                      </div>

                      <Link to={`/requests/${x.id}`} state={{ request: x }} className="btn-primary btn-block mt-5">
                        {sw ? 'Kusaidia Ombi Hili' : 'Support This Request'}
                      </Link>
                    </div>
                  </Card>
                )
              })}
            </div>
          </Container>
        </Section>
      )}

      {/* ============================== PAYMENT MODAL ============================== */}
      {fundingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[14px] bg-cream shadow-[var(--shadow-pop)]">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-ink-200 bg-surface px-5 py-4">
              <h3 className="text-lg font-semibold text-ink-900">
                {sw ? 'Chagua njia ya malipo' : 'Select donation method'}
              </h3>
              <button
                type="button"
                onClick={() => setFundingItem(null)}
                aria-label={sw ? 'Funga' : 'Close'}
                className="btn-ghost px-2"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5">
              <div className="rounded-[14px] bg-surface p-4">
                <p className="text-sm font-semibold text-ink-900">{displayItemName(fundingItem, sw)}</p>
                <p className="text-xs text-ink-500">
                  {sw
                    ? `Kinachohitajika: TZS ${itemNeeded.toLocaleString()} (imekusanywa ${money(fundingItem.raised)} / ${money(fundingItem.target)})`
                    : `Needed: TZS ${itemNeeded.toLocaleString()} (raised ${money(fundingItem.raised)} / ${money(fundingItem.target)})`}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  { id: 'mpesa', label: 'M-Pesa', icon: 'phone' },
                  { id: 'card', label: 'Visa / Mastercard', icon: 'card' },
                  { id: 'paypal', label: 'PayPal', icon: 'globe' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selectGroup(m.id)}
                    className={`flex items-center justify-center gap-2 rounded-[10px] border px-3 py-2.5 text-sm font-semibold transition-colors ${
                      methodGroup === m.id
                        ? 'border-oweru-800 bg-oweru-800 text-white'
                        : 'border-ink-200 bg-surface text-ink-700 hover:border-ink-300'
                    }`}
                  >
                    <Icon name={m.icon} className="h-4 w-4" />
                    <span className="truncate">{m.label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={submitFund} className="mt-5 space-y-4">
                {message && (
                  <div className={`rounded-[14px] border px-4 py-3 text-sm font-medium ${
                    message.ok ? 'border-success-200 bg-success-50 text-success-700' : 'border-error-200 bg-error-50 text-error-700'
                  }`}>
                    {message.text}
                  </div>
                )}

                <div>
                  <label htmlFor="fund-amount">{sw ? 'Kiasi (TZS)' : 'Amount (TZS)'} *</label>
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {SUGGESTED_AMOUNTS.map((v) => {
                      const active = String(amount) === String(v)
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAmount(String(v))}
                          className={`rounded-[10px] border px-2 py-2 text-xs font-semibold tabular-nums transition-colors ${
                            active
                              ? 'border-gold-500 bg-gold-500 text-ink-950'
                              : 'border-ink-200 bg-surface text-ink-700 hover:border-ink-300'
                          }`}
                        >
                          {v.toLocaleString()}
                        </button>
                      )
                    })}
                  </div>
                  <input
                    id="fund-amount"
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-2"
                    placeholder={sw ? 'Kiasi kingine chochote tangu TZS 1,000' : 'Or any custom amount from TZS 1,000'}
                  />
                  <p className="field-hint mt-1.5">
                    {sw
                      ? `Kifaa hiki kinahitaji TZS ${itemNeeded.toLocaleString()} pekee. Usichangie zaidi ya kinachohitajika.`
                      : `This item only needs TZS ${itemNeeded.toLocaleString()} more — please don't give more than needed.`}
                  </p>
                  {fundingItem.share_price > 0 && Number(amount) > 0 && (
                    <p className="mt-1 text-xs font-medium text-oweru-700">
                      {sw
                        ? `≈ hisa ${Math.max(1, Math.floor(Number(amount) / fundingItem.share_price))} (hisa moja = ${money(fundingItem.share_price)})`
                        : `≈ ${Math.max(1, Math.floor(Number(amount) / fundingItem.share_price))} shares (1 share = ${money(fundingItem.share_price)})`}
                    </p>
                  )}
                </div>

                {isRealUser ? (
                  <p className="rounded-[10px] border border-ink-200 bg-surface px-3 py-2 text-xs text-ink-600">
                    {sw
                      ? `Umeingia kama ${user.name}. Mchango utaunganishwa na akaunti yako na kuonekana kwenye historia yako.`
                      : `Signed in as ${user.name}. Your donation will be linked to your account and appear in your history.`}
                  </p>
                ) : (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={asGuest} onChange={(e) => setAsGuest(e.target.checked)} />
                    {sw ? 'Changia kama mgeni (bila kuingia)' : 'Donate as guest (no login)'}
                  </label>
                )}

                {asGuest && (
                  <div>
                    <label htmlFor="fund-name">{sw ? 'Jina (hiari)' : 'Name (optional)'}</label>
                    <input
                      id="fund-name"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="Anonymous"
                    />
                  </div>
                )}

                {methodGroup === 'mpesa' && (
                  <div className="space-y-4 rounded-[14px] border border-ink-200 bg-surface p-4">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'mpesa', label: 'M-Pesa STK' },
                        { id: 'mobile', label: sw ? 'Fedha za Simu' : 'Mobile Money' },
                        { id: 'bank', label: sw ? 'Benki' : 'Bank' },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setPaymentMethod(c.id)}
                          className={`rounded-[10px] border px-2 py-2 text-xs font-semibold transition-colors ${
                            paymentMethod === c.id
                              ? 'border-oweru-800 bg-oweru-800 text-white'
                              : 'border-ink-200 bg-surface text-ink-700 hover:border-ink-300'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>

                    {paymentMethod === 'mpesa' ? (
                      <>
                        <div>
                          <label htmlFor="fund-network">{sw ? 'Mitandao' : 'Network'}</label>
                          <select id="fund-network" value={network} onChange={(e) => setNetwork(e.target.value)}>
                            <option value="mpesa">{networkLabel('mpesa', sw)}</option>
                            <option value="tigo">{networkLabel('tigo', sw)}</option>
                            <option value="airtel">{networkLabel('airtel', sw)}</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="fund-phone">{sw ? 'Nambari ya simu (STK) *' : 'Phone number (STK) *'}</label>
                          <input
                            id="fund-phone"
                            value={mpesaPhone}
                            onChange={(e) => {
                              setMpesaPhone(e.target.value)
                              setNetwork(detectNetwork(e.target.value))
                            }}
                            required
                            placeholder="0712345678"
                          />
                          <p className="field-hint mt-1.5">
                            {sw
                              ? `Utapokea ombi la kuingiza PIN (STK push) kwenye ${networkLabel(network, sw)} (imechaguliwa kiotomatiki kutoka nambari yako).`
                              : `You will receive an STK push on ${networkLabel(network, sw)} (auto-selected from your number).`}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <label htmlFor="fund-ref">{sw ? 'Rejea ya malipo (payment reference) *' : 'Payment reference *'}</label>
                        <input
                          id="fund-ref"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          required
                          placeholder={sw ? 'e.g. nambari ya muamala (transaction id)' : 'e.g. transaction id'}
                        />
                      </div>
                    )}
                  </div>
                )}

                {methodGroup === 'card' && (
                  <div className="space-y-4 rounded-[14px] border border-ink-200 bg-surface p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="fund-currency">{sw ? 'Sarafu' : 'Currency'}</label>
                        <select id="fund-currency" value={cardCurrency} onChange={(e) => setCardCurrency(e.target.value)}>
                          <option value="EUR">EUR (€)</option>
                          <option value="USD">USD ($)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                      <p className="self-end pb-2 text-xs text-ink-600 sm:text-right">
                        ≈ TZS {Math.round(Number(amount || 0) * (FX_RATES[cardCurrency] || 1)).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label htmlFor="fund-card">{sw ? 'Namba ya kadi (sandbox) *' : 'Card number (sandbox) *'}</label>
                      <input
                        id="fund-card"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="4242 4242 4242 4242"
                      />
                      <p className="field-hint mt-1.5">
                        {sw
                          ? 'Huu ni mfano (sandbox): tumia nambari yoyote yenye tarakimu 12–16. Kadi halisi zitaanza kupokelewa wakati wa kuzinduliwa.'
                          : 'Sandbox simulation: use any 12–16 digit number. Real cards arrive at launch.'}
                      </p>
                    </div>
                  </div>
                )}

                {methodGroup === 'paypal' && (
                  <div className="rounded-[14px] border border-ink-200 bg-surface p-5 text-center">
                    <p className="text-sm font-semibold text-ink-700">{sw ? 'PayPal inakuja hivi karibuni' : 'PayPal coming soon'}</p>
                    <p className="mt-1 text-xs text-ink-500">
                      {sw
                        ? 'Malipo ya PayPal yataanza kukubaliwa wakati wa kuzinduliwa rasmi.'
                        : 'PayPal payments will be accepted at the official launch.'}
                    </p>
                  </div>
                )}

                <p className="rounded-[14px] border border-ink-200 bg-surface px-4 py-3 text-xs text-ink-600">
                  {sw
                    ? 'Hakuna ada za jukwaa. Ada ya mtandao imefichuliwa hapa kabla ya kulipa — unachoona ndicho unacholipa.'
                    : "No hidden fees. OWERU's platform fee is 0%. Any network/processing fee is disclosed here before you pay — what you see is what you pay."}
                </p>

                {mpesaState?.pending && <PayingCountdown sw={sw} />}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setFundingItem(null)} className="btn-secondary flex-1">
                    {sw ? 'Funga' : 'Close'}
                  </button>
                  <button disabled={busy || !amount || methodGroup === 'paypal'} className="btn-primary flex-1">
                    {busy ? (sw ? 'Tunachakata...' : 'Processing...') : sw ? 'Changia' : 'Donate'}
                  </button>
                </div>

                <p className="text-center text-xs text-ink-500">
                  {sw ? 'Malipo yanasimamiwa na OWERU Foundation.' : 'Payments are processed securely by OWERU Foundation.'}
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================== RECEIPT ============================== */}
      {receipt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/70 p-4">
          <div className="receipt-sheet w-full max-w-md overflow-hidden rounded-[14px] bg-surface shadow-[var(--shadow-pop)]">
            <div className="no-print flex items-center justify-between gap-4 bg-oweru-800 px-6 py-4 text-white">
              <h2 className="text-lg font-semibold">{sw ? 'Stakabadhi ya Mchango' : 'Donation Receipt'}</h2>
              <button
                type="button"
                onClick={() => setReceipt(null)}
                aria-label={sw ? 'Funga' : 'Close'}
                className="btn-ghost px-2 text-white hover:bg-white/10"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-4 border-b border-ink-200 pb-4">
                <div>
                  <p className="font-display text-xl text-oweru-800">OWERU Foundation</p>
                  <p className="text-xs text-ink-500">{sw ? 'Stakabadhi ya Ufadhili wa Vifaa' : 'Equipment Funding Receipt'}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[0.6875rem] tracking-wider text-ink-500 uppercase">{sw ? 'Namba' : 'No.'}</p>
                  <p className="font-mono text-sm text-ink-900">{receipt.reference || '—'}</p>
                </div>
              </div>

              <dl className="mt-4 space-y-2.5 text-sm">
                {[
                  [sw ? 'Tarehe' : 'Date', receipt.date],
                  [sw ? 'Mfadhili' : 'Donor', receipt.donorName],
                  [sw ? 'Kifaa' : 'Item', receipt.itemName],
                  [sw ? 'Ombi' : 'Request', receipt.title],
                  [sw ? 'Njia ya malipo' : 'Method', receipt.method],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-ink-500">{k}</dt>
                    <dd className="text-right font-semibold text-ink-900">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex items-center justify-between gap-4 rounded-[14px] bg-oweru-50 px-4 py-3">
                <span className="text-sm font-semibold text-ink-800">{sw ? 'Kiasi cha Mchango' : 'Donation Amount'}</span>
                <span className="stat-num text-2xl text-oweru-800">
                  {money(receipt.amount)} <span className="text-base">TZS</span>
                </span>
              </div>

              <p className="mt-4 flex items-center justify-between gap-3 border-t border-ink-200 pt-3 text-[0.6875rem] text-ink-500">
                <span>OWERU Foundation · {receipt.org}</span>
                <span className="font-semibold text-oweru-700">{sw ? 'Uwazi' : 'Transparent'}</span>
              </p>
            </div>

            <div className="no-print space-y-2 px-6 pb-6">
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => shareTo('whatsapp')} className="btn-secondary btn-sm">
                  <Icon name="whatsapp" className="h-4 w-4" />{sw ? 'Sambaza' : 'Share'}
                </button>
                <button onClick={() => shareTo('facebook')} className="btn-secondary btn-sm">
                  <Icon name="facebook" className="h-4 w-4" />Facebook
                </button>
                <button onClick={() => shareTo('x')} className="btn-secondary btn-sm">
                  <Icon name="x" className="h-4 w-4" />X
                </button>
              </div>
              <button onClick={() => window.print()} className="btn-primary btn-block">
                <Icon name="print" className="h-4 w-4" />{sw ? 'Chapisha Stakabadhi' : 'Print receipt'}
              </button>
              <button onClick={() => setReceipt(null)} className="btn-secondary btn-block">
                {sw ? 'Funga' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================== LIGHTBOX ============================== */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/90 p-4" onClick={() => setLightbox(null)}>
          <button
            type="button"
            aria-label={sw ? 'Funga' : 'Close'}
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
          <img
            src={lightbox.src}
            alt={lightbox.alt}
            loading="lazy"
            decoding="async"
            className="max-h-[85vh] max-w-full rounded-[14px] shadow-[var(--shadow-pop)]"
          />
        </div>
      )}

      {/* ============================== MOBILE SUPPORT BAR ============================== */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[0.6875rem] text-ink-500">
              {fullyFunded ? (sw ? 'Imefadhiliwa' : 'Funded') : `${totalPct}% ${sw ? 'imekamilika' : 'funded'}`}
            </p>
            <p className="truncate text-sm font-semibold text-ink-900">
              {fullyFunded
                ? (sw ? 'Asante kwa msaada wako!' : 'Thank you for your support!')
                : `${money(remaining)} ${sw ? 'kinachohitajika' : 'needed'}`}
            </p>
          </div>
          <a href="#items-to-fund" className="btn-primary">
            <Icon name="chevron" className="h-4 w-4" />{sw ? 'Chagua kifaa' : 'Choose item'}
          </a>
        </div>
      </div>
    </div>
  )
}
