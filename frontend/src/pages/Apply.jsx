import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { storeRequest, fetchOrganizations, claimRequest } from '../api'
import { useAuth } from '../auth'
import { validatePhone, validateName, validateAmount } from '../utils/validation'
import { inputCls, Field, Select, TextArea } from '../components/FormField'
import { usePageMeta } from '../hooks/usePageMeta'

const TANZANIA_REGIONS = [
  'Dar es Salaam', 'Dodoma', 'Arusha', 'Kilimanjaro', 'Tanga', 'Mwanza',
  'Geita', 'Simiyu', 'Shinyanga', 'Kagera', 'Mara', 'Tabora', 'Singida',
  'Manyara', 'Morogoro', 'Pwani', 'Kigoma', 'Katavi', 'Rukwa', 'Mbeya',
  'Songwe', 'Iringa', 'Njombe', 'Ruvuma', 'Lindi', 'Mtwara',
  'Zanzibar Mjini', 'Unguja Kaskazini', 'Unguja Kusini', 'Pemba Kaskazini', 'Pemba Kusini',
]

export default function Apply() {
const { lang } = useI18n()
usePageMeta({
  title: lang === 'sw' ? 'Tuma Ombi | OWERU Foundation' : 'Apply | OWERU Foundation',
  description: lang === 'sw'
    ? 'Wasilisha ombi la vifaa vya huduma kwa kanisa lako, kituo au timu yako — uthibitisho unaongozeshwa.'
    : 'Submit an equipment request for your church, centre or outreach team — verification-driven funding.',
})
  const sw = lang === 'sw'
  const navigate = useNavigate()
  const { register } = useAuth()
  const [orgs, setOrgs] = useState([])
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [form, setForm] = useState({
    applicant_name: '',
    applicant_phone: '',
    applicant_email: '',
    title: '',
    sw_title: '',
    region: '',
    category: 'Sound Equipment',
    organization_id: '',
    story: '',
    exposure_level: 'open',
  })
  const [targetAmount, setTargetAmount] = useState('')
  const [letterFile, setLetterFile] = useState(null)
  const [msg, setMsg] = useState(null)
  const [submitted, setSubmitted] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '' })
  const [regError, setRegError] = useState('')
  const [registering, setRegistering] = useState(false)

  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      if (file.size > 8 * 1024 * 1024) {
        reject(new Error(sw ? 'Faili ni kubwa kuliko 8MB. Tumia faili ndogo.' : 'File is larger than 8MB. Please use a smaller file.'))
        return
      }
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error(sw ? 'Imeshindikana kusoma faili.' : 'Could not read the file.'))
      reader.readAsDataURL(file)
    })

  const EXPOSURE_OPTIONS = [
    {
      value: 'open',
      label: sw ? 'Wazi (Open)' : 'Open',
      desc: sw ? 'Jina, eneo na hadithi yako yanaonekana kwa umma.' : 'Your name, region and story are visible to the public.',
    },
    {
      value: 'partial',
      label: sw ? 'Sehemu (Partial)' : 'Partial',
      desc: sw ? 'Maelezo ya kibinafsi yamefichwa kwa umma.' : 'Personal details are hidden from public view.',
    },
    {
      value: 'protected',
      label: sw ? 'Faragha (Protected)' : 'Protected',
      desc: sw ? 'Ombi linafuatiliwa kwa faragha kamili.' : 'Your request is handled with complete privacy.',
    },
  ]

  useEffect(() => {
    fetchOrganizations()
      .then((list) => setOrgs(list.filter((o) => o.type === 'church')))
      .catch((e) => setMsg({ ok: false, text: e?.message || String(e) }))
      .finally(() => setOrgsLoading(false))
  }, [])

  const setF = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (msg) setMsg(null)
    setFieldErrors((errs) => (errs[k] ? { ...errs, [k]: undefined } : errs))
  }

  const validate = () => {
    const errors = {}
    const nameError = validateName(form.applicant_name)
    if (nameError) errors.applicant_name = sw ? 'Jina linatakiwa (angalau herufi 2).' : nameError
    const phoneError = validatePhone(form.applicant_phone)
    if (phoneError) errors.applicant_phone = sw ? 'Weka namba halali ya Tanzania (mf: 0712345678 au +255712345678).' : phoneError
    if (!form.region) errors.region = sw ? 'Chagua mkoa wako.' : 'Please select your region.'
    if (!form.title.trim() || form.title.trim().length < 3) errors.title = sw ? 'Weka kichwa cha ombi (angalau herufi 3).' : 'Please enter a request title.'
    const amountError = validateAmount(targetAmount)
    if (amountError) errors.targetAmount = sw ? 'Weka kiwango halali (TZS 1,000 – 10,000,000).' : amountError
    return errors
  }

  const submit = async (e) => {
    e.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    setMsg(null)
    if (Object.keys(errors).some((k) => errors[k])) return

    let letterDataUrl = null
    if (letterFile) {
      try {
        letterDataUrl = await readFileAsBase64(letterFile)
      } catch (err) {
        setMsg({ ok: false, text: err.message })
        return
      }
    }

    setSubmitting(true)
    try {
      const created = await storeRequest({
        applicant_name: form.applicant_name,
        applicant_phone: form.applicant_phone,
        applicant_email: form.applicant_email || undefined,
        title: form.title,
        sw_title: form.sw_title || undefined,
        region: form.region,
        category: form.category,
        organization_id: form.organization_id || undefined,
        story: form.story,
        exposure_level: form.exposure_level,
        letter: letterDataUrl || undefined,
        items: [{ name: form.title, target_amount: Number(targetAmount) }],
      })
      setSubmitted({ id: created.id, trackToken: created.track_token })
      setMsg({
        ok: true,
        text: sw
          ? 'Ombi lako limewasilishwa kwa mafanikio. Kanisa lako litathibitisha, kisha Bodi ya OWERU itakagua.'
          : 'Your request has been submitted. Your church will confirm it, then the OWERU Board will review it.',
      })
      setRegForm((rg) => ({ ...rg, name: form.applicant_name, email: form.applicant_email || '' }))
      setForm({
        applicant_name: '',
        applicant_phone: '',
        applicant_email: '',
        title: '',
        sw_title: '',
        region: '',
        category: form.category,
        organization_id: '',
        story: '',
        exposure_level: 'open',
      })
      setTargetAmount('')
      setLetterFile(null)
    } catch (err) {
      setMsg({ ok: false, text: err.message || (sw ? 'Kuna tatizo. Jaribu tena.' : 'Something went wrong. Try again.') })
      setSubmitted(null)
    } finally {
      setSubmitting(false)
    }
  }

  const registerAndClaim = async (e) => {
    e.preventDefault()
    setRegError('')
    setRegistering(true)
    try {
      if (!regForm.name.trim()) throw new Error(sw ? 'Jina linatakiwa.' : 'Name is required.')
      if (!regForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email)) throw new Error(sw ? 'Weka email halali.' : 'Enter a valid email.')
      if (regForm.password.length < 8) throw new Error(sw ? 'Nenosiri lazima liwe na angalau herufi 8.' : 'Password must be at least 8 characters.')
      await register({ name: regForm.name, email: regForm.email, password: regForm.password, role: 'applicant' })
      await claimRequest(submitted.id, submitted.trackToken)
      navigate('/portal/applicant')
    } catch (err) {
      setRegError(err.message || (sw ? 'Usajili umeshindikana. Jaribu tena.' : 'Registration failed. Try again.'))
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-ink-50">
      <div className="bg-ink-900 text-white/80 text-xs">
        <div className="container-responsive flex items-center justify-between py-2">
          <div className="flex items-center gap-4"><span>info@oweru.org</span><span className="hidden sm:inline">|</span><span className="hidden sm:inline">Tanzania · East Africa</span></div>
          <span className="text-gold-300">{sw ? 'Msaada wa uwazi. Athari halisi.' : 'Transparent support. Real impact.'}</span>
        </div>
      </div>

      <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
        <div className="relative w-full max-w-4xl">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[85vh]">
            <div className="h-1.5 bg-gradient-to-r from-gold-300 via-gold-500 to-gold-700" />
            <div className="grid md:grid-cols-[2fr_3fr]">
              <div className="relative bg-ink-900 text-white md:flex md:flex-col md:justify-between px-8 py-10 overflow-hidden">
                <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl" aria-hidden="true" />
                <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-center gap-1 text-sm text-gold-300 mb-6">
                    <Link to="/" className="group inline-flex items-center gap-2 font-medium hover:text-gold-200 transition-colors w-fit">
                      <span className="transform group-hover:-translate-x-1 transition-transform">
                        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
                      </span>
                      {sw ? 'Rudi Nyumbani' : 'Back to home'}
                    </Link>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                    {sw ? 'Ombi la Kifaa' : 'Equipment Request'}
                  </span>
                  <h1 className="mt-4 text-3xl font-bold leading-tight">{sw ? 'Tuma Ombi lako' : 'Submit your request'}</h1>
                  <p className="mt-3 text-sm text-white/80 leading-relaxed">
                    {sw
                      ? 'Huhitaji akaunti. Jaza maelezo yako na simu; kanisa lako litathibitisha ombi lako kisha Bodi ya OWERU itakagua.'
                      : 'No account needed. Share your name and phone; your church will confirm the request and the OWERU Board will review it.'}
                  </p>
                </div>
                <div className="relative mt-10 space-y-3">
                  {[
                    sw ? 'Kanisa lako lathibitisha' : 'Your church confirms',
                    sw ? 'Bodi ya OWERU inakagua' : 'OWERU Board reviews',
                    sw ? 'Vifaa vinanunuliwa moja kwa moja kutoka kwa msambazaji' : 'Equipment bought directly from suppliers',
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-white/85">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-500 text-xs font-extrabold text-ink-900">{i + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-8 py-8 sm:px-10 md:max-h-[85vh] md:overflow-y-auto">

            <form onSubmit={submit} className="space-y-5">
              {msg && !submitted && (
                <div className={
                  'text-sm rounded-xl px-4 py-3 ' +
                  (msg.ok ? 'bg-success-50 border border-success-200 text-success-700' : 'bg-error-50 border border-error-200 text-error-600')
                }>
                  {msg.text}
                </div>
              )}

              {submitted && msg?.ok && (
                <div className="rounded-xl border border-success-200 bg-success-50 p-5 text-success-700 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-success-500 text-white text-sm" aria-hidden="true">✓</span>
                    <div>
                      <div className="font-bold">{[sw ? 'Ombi limewasilishwa!' : 'Request submitted!']}</div>
                      <p className="text-sm text-success-700 mt-0.5">{msg.text}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/70 border border-success-200 px-4 py-3 text-sm">
                    <div className="text-xs font-bold uppercase tracking-wider text-success-600 mb-1">{sw ? 'Namba ya ombi' : 'Request ID'}</div>
                    <div className="font-mono font-bold text-base">OWR-{String(submitted.id).padStart(5, '0')}</div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to={`/track/${submitted.trackToken}`} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-ink-900 text-white text-sm font-bold hover:bg-ink-800 transition-colors">
                      {sw ? 'Fuatilia ombi lako' : 'Track your request'} <span aria-hidden="true">→</span>
                    </Link>
                    {!showRegister && (
                      <button type="button" onClick={() => setShowRegister(true)} className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-success-200 bg-white text-success-700 text-sm font-bold hover:bg-success-100 transition-colors">
                        {sw ? 'Unda akaunti ili upokee arifa' : 'Create an account for updates'}
                      </button>
                    )}
                  </div>
                  {showRegister && (
                    <form onSubmit={registerAndClaim} className="rounded-lg border border-success-200 bg-white p-4 space-y-3">
                      <div className="text-sm font-bold text-success-700">{sw ? 'Unganisha ombi hili na akaunti yako' : 'Link this request to your account'}</div>
                      <input value={regForm.name} onChange={(e) => setRegForm((f) => ({ ...f, name: e.target.value }))} placeholder={sw ? 'Jina lako' : 'Your name'} className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-100" />
                      <input type="email" value={regForm.email} onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-100" />
                      <input type="password" minLength={8} value={regForm.password} onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))} placeholder={sw ? 'Nenosiri (herufi 8+ na namba)' : 'Password (8+ chars with a number)'} className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-gold-500 focus:ring-4 focus:ring-gold-100" />
                      {regError && <p className="text-xs text-error-600">{regError}</p>}
                      <button type="submit" disabled={registering} className="w-full rounded-full bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-ink-900 font-bold py-2.5 text-sm transition-colors">
                        {registering ? (sw ? 'Inaunda akaunti...' : 'Creating account...') : (sw ? 'Unda akaunti & funga ombi' : 'Create account & link request')}
                      </button>
                      <p className="text-[11px] text-ink-500 leading-relaxed">{sw ? 'Unaweza pia kuunga ombi lako baadaye kupitia link ya kufuatilia hapo juu.' : 'You can also link this request later using the tracking link above.'}</p>
                    </form>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label={sw ? 'Jina lako' : 'Your name'} required>
                  <input className={inputCls + (fieldErrors.applicant_name ? ' border-error-500 ring-4 ring-error-100' : '')} value={form.applicant_name} onChange={setF('applicant_name')} required placeholder={sw ? 'Asha Mushi' : 'Asha Mushi'} />
                  {fieldErrors.applicant_name && <p className="mt-1 text-xs text-error-600">{fieldErrors.applicant_name}</p>}
                </Field>
                <Field label={sw ? 'Namba ya simu' : 'Phone number'} required hint="+255 712 345 678">
                  <input className={inputCls + (fieldErrors.applicant_phone ? ' border-error-500 ring-4 ring-error-100' : '')} value={form.applicant_phone} onChange={setF('applicant_phone')} required placeholder="+255712345678" type="tel" inputMode="tel" />
                  {fieldErrors.applicant_phone && <p className="mt-1 text-xs text-error-600">{fieldErrors.applicant_phone}</p>}
                </Field>
              </div>

              <Field label="Email">
                <input className={inputCls} value={form.applicant_email} onChange={setF('applicant_email')} type="email" placeholder="you@example.com" />
              </Field>

              <Field label={sw ? 'Kichwa cha ombi' : 'Request title'} required>
                <input className={inputCls + (fieldErrors.title ? ' border-error-500 ring-4 ring-error-100' : '')} value={form.title} onChange={setF('title')} required placeholder={sw ? 'Mashine ya kushona' : 'Sewing machine'} />
                {fieldErrors.title && <p className="mt-1 text-xs text-error-600">{fieldErrors.title}</p>}
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label={sw ? 'Mkoa / Eneo' : 'Region'} required>
                  <Select value={form.region} onChange={setF('region')}>
                    <option value="">{sw ? '— Chagua mkoa —' : '— Select region —'}</option>
                    {TANZANIA_REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </Select>
                  {fieldErrors.region && <p className="mt-1 text-xs text-error-600">{fieldErrors.region}</p>}
                </Field>
                <Field label={sw ? 'Aina ya kifaa' : 'Category'}>
                  <Select value={form.category} onChange={setF('category')}>
                    {['Sound Equipment', 'Power Equipment', 'Printing & Materials', 'Shelter', 'Transport', 'Other'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label={sw ? 'Kanisa lako (hiari)' : 'Your church (optional)'}>
                <Select value={form.organization_id} onChange={setF('organization_id')}>
                  <option value="">{orgsLoading ? (sw ? 'Inapakia makanisa...' : 'Loading churches...') : sw ? '— Chagua kanisa —' : '— Select a church —'}</option>
                  {(orgs || []).map((o) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.region || ''})</option>
                  ))}
                </Select>
              </Field>

              <Field label={sw ? 'Jumla ya fedha unayohitaji (TZS)' : 'Total amount needed (TZS)'} required hint={sw ? 'Mfano: 250,000 TZS' : 'Example: 250,000 TZS'}>
                <div className="relative shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-sm font-bold text-ink-500">TZS</span>
                  </div>
                  <input
                    className={inputCls + ' pl-14' + (fieldErrors.targetAmount ? ' border-error-500 ring-4 ring-error-100' : '')}
                    value={targetAmount}
                    onChange={(e) => { setTargetAmount(e.target.value); setFieldErrors((errs) => ({ ...errs, targetAmount: undefined })) }}
                    required
                    type="number"
                    min="1000"
                    max="10000000"
                    step="1000"
                    placeholder="250,000"
                    inputMode="numeric"
                  />
                </div>
                {fieldErrors.targetAmount && <p className="mt-1 text-xs text-error-600">{fieldErrors.targetAmount}</p>}
              </Field>

              <Field label={sw ? 'Hadithi yako' : 'Your story'}>
                <TextArea rows={4} value={form.story} onChange={setF('story')} />
              </Field>

              <Field label={sw ? 'Kiwango cha uwazi' : 'Privacy / Exposure'} hint={sw ? 'Weka jinsi maelezo yako yatakavyoonekana hadharani.' : 'Choose how much of your details appears publicly.'}>
                <div className="space-y-2">
                  {EXPOSURE_OPTIONS.map((o) => (
                    <label key={o.value} className="flex items-start gap-3 rounded-xl border border-ink-200 px-4 py-3 cursor-pointer transition-colors hover:border-gold-400 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50/60">
                      <input
                        type="radio"
                        name="exposure_level"
                        value={o.value}
                        checked={form.exposure_level === o.value}
                        onChange={() => setForm((f) => ({ ...f, exposure_level: o.value }))}
                        className="mt-0.5 h-4 w-4 accent-gold-600"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink-800">{o.label}</span>
                        <span className="block text-xs text-ink-500 mt-0.5">{o.desc}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label={sw ? 'Barua ya kuhimili (hiari)' : 'Support letter (optional)'} hint={sw ? 'PDF, JPG au PNG — hadi 8MB' : 'PDF, JPG or PNG — up to 8MB'}>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => setLetterFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-ink-600 file:mr-4 file:rounded-lg file:border-0 file:bg-gold-500 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-ink-900 hover:file:bg-gold-600"
                />
                {letterFile && (
                  <p className="mt-1.5 text-xs text-ink-500">
                    {letterFile.name} ({(letterFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gold-500 hover:bg-gold-600 disabled:bg-ink-300 disabled:cursor-not-allowed text-ink-900 font-bold py-3.5 rounded-xl transition-all hover:shadow-xl hover:shadow-gold-500/30 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {submitting && <span className="h-4 w-4 border-2 border-ink-900/30 border-t-ink-900 rounded-full animate-spin"></span>}
                {submitting ? (sw ? 'Inawasilisha...' : 'Submitting...') : (sw ? 'Wasilisha Ombi' : 'Submit Request')}
              </button>

              <p className="text-xs text-ink-500 leading-relaxed text-center">
                {sw
                  ? 'Kwa fahari: OWERU hainunulii mwombaji fedha. Ikiidhinishwa, OWERU hununua kifaa moja kwa moja kutoka kwa mtoa huduma aliyethibitishwa.'
: 'Please note: OWERU never pays the applicant cash. If approved, OWERU purchases the equipment directly from a verified supplier.'}
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}