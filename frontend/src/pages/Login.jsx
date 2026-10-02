import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth, ROLES } from '../auth'
import { useI18n } from '../i18n'
import { validateLoginForm, validateRegisterForm } from '../utils/validation'
import { Icon } from '../components/icons'
import { usePageMeta } from '../hooks/usePageMeta'

const REGIONS = [
  'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi', 'Kigoma',
  'Kilimanjaro', 'Lindi', 'Manyara', 'Mara', 'Mbeya', 'Morogoro', 'Mtwara', 'Mwanza',
  'Njombe', 'Pemba Kaskazini', 'Pemba Kusini', 'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga',
  'Simiyu', 'Singida', 'Songwe', 'Tabora', 'Tanga', 'Unguja Kaskazini', 'Unguja Kusini',
  'Unguja Mjini Magharibi',
]

const PILLARS = [
  { icon: 'users', en: 'For churches, child-care centres, and outreach teams', sw: 'Kwa makanisa, vituo vya malezi ya watoto na timu za huduma' },
  { icon: 'eyeCheck', en: 'Every contribution is recorded publicly', sw: 'Kila mchango hurekodiwa kwenye rejesta ya umma' },
  { icon: 'package', en: 'Follow an item from purchase to delivery', sw: 'Fuatilia kifaa tangu kinaponunuliwa hadi kinapowasilishwa' },
]

export default function Login() {
  const { login, register, loading } = useAuth()
  const { lang } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sw = lang === 'sw'

  usePageMeta({
    title: sw ? 'Ingia | OWERU Foundation' : 'Sign In | OWERU Foundation',
    description: sw
      ? 'Ingia kwenye akaunti yako ya OWERU Foundation kufuatilia maombi na michango yako.'
      : 'Sign in to your OWERU Foundation account to follow requests and contributions.',
  })

  const [mode, setMode] = useState(searchParams.get('register') === '1' ? 'register' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('donor')
  const [churchName, setChurchName] = useState('')
  const [churchRegion, setChurchRegion] = useState('')
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const errors = mode === 'login'
      ? validateLoginForm({ email, password, name })
      : validateRegisterForm({ email, password, name })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      const u = mode === 'login'
        ? await login(email, password)
        : await register({
            name,
            email,
            password,
            role,
            church_name: role === 'endorser' ? churchName.trim() : undefined,
            church_region: role === 'endorser' ? churchRegion || undefined : undefined,
          })
      navigate(ROLES[u.role]?.path || '/portal')
    } catch (err) {
      setError(err.message || (sw ? 'Hitilafu imetokea. Tafadhali jaribu tena.' : 'Something went wrong. Please try again.'))
    }
  }

  const inputBase =
    'w-full rounded-[10px] border bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors ' +
    'placeholder:text-ink-400 hover:border-ink-400 focus:border-oweru-600'
  const inputOk = `${inputBase} border-ink-300`
  const inputBad = `${inputBase} border-error-500 bg-error-50/50`

  return (
    <div className="login-backdrop relative min-h-screen">
      <div className="grid-texture pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-5 py-6 sm:px-6 sm:py-8">
        {/* ---------- Top bar ---------- */}
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2.5 text-white">
            <img src="/oweru-logo-sm.png" alt="" className="h-9 w-auto brightness-0 invert" aria-hidden="true" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[1.0625rem] font-semibold">OWERU</span>
              <span className="mt-[3px] text-[9px] font-semibold uppercase tracking-[0.2em] text-white/50">
                Foundation
              </span>
            </span>
          </Link>
          <Link to="/" className="btn-on-dark btn-sm">
            <Icon name="arrow-left" className="h-4 w-4" />
            {sw ? 'Nyumbani' : 'Back to site'}
          </Link>
        </div>

        {/* ---------- Card ---------- */}
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="grid w-full max-w-5xl overflow-hidden rounded-[18px] bg-white shadow-[var(--shadow-pop)] md:grid-cols-[0.9fr_1.1fr]">
            {/* Story panel — desktop only */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-oweru-950 p-10 text-white md:flex lg:p-12">
              <img
                className="absolute inset-0 h-full w-full object-cover opacity-40"
                src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?ixlib=rb-4.1.0&q=85&fm=jpg&crop=faces&cs=srgb&w=1200"
                alt=""
                aria-hidden="true"
              />
              <div className="login-brand-overlay absolute inset-0" aria-hidden="true" />

              <div className="relative z-10">
                <span className="eyebrow eyebrow-on-dark">
                  {sw ? 'Karibu OWERU' : 'Welcome to OWERU'}
                </span>
                <h2 className="display-lg mt-5 text-white text-balance">
                  {sw ? 'Imani yetu ionekane kwa huduma ya upendo.' : 'Let faith move us to care for one another.'}
                </h2>
                <p className="mt-5 text-[0.9375rem] leading-relaxed text-white/75">
                  {sw
                    ? 'Ingia kufuatilia maombi yako, kuthibitisha mahitaji ya jamii yako, au kuona vifaa ulivyosaidia kufadhili.'
                    : 'Sign in to follow your requests, confirm community needs, or see the items you helped fund.'}
                </p>
              </div>

              <ul className="relative z-10 grid gap-4">
                {PILLARS.map((p) => (
                  <li key={p.en} className="flex items-start gap-3 text-sm text-white/80">
                    <Icon name={p.icon} className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
                    {sw ? p.sw : p.en}
                  </li>
                ))}
              </ul>
            </div>

            {/* Form panel */}
            <div className="flex flex-col p-6 sm:p-9 lg:p-11">
              <h1 className="text-2xl text-ink-900">
                {mode === 'login'
                  ? (sw ? 'Karibu tena' : 'Welcome back')
                  : (sw ? 'Fungua akaunti' : 'Create your account')}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {mode === 'login'
                  ? (sw ? 'Ingia ili kuendelea kwenye dashibodi yako.' : 'Sign in to continue to your dashboard.')
                  : (sw
                      ? 'Fungua akaunti kama mfadhili, mwombaji au mwakilishi wa kanisa. Unaweza pia kuchangia bila akaunti.'
                      : 'Create an account as a donor, applicant, or church representative. You can also give without an account.')}
              </p>

              {/* Segmented control */}
              <div className="mt-7 grid grid-cols-2 gap-1 rounded-[10px] border border-ink-200 bg-paper p-1">
                {['login', 'register'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); setError(''); setFieldErrors({}) }}
                    className={`h-9 rounded-[7px] text-sm font-semibold transition-colors ${
                      mode === m ? 'bg-white text-ink-900 shadow-[var(--shadow-card)]' : 'text-ink-500 hover:text-ink-800'
                    }`}
                  >
                    {m === 'login' ? (sw ? 'Ingia' : 'Sign in') : (sw ? 'Jisajili' : 'Register')}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="mt-6 grid gap-4">
                {mode === 'register' && (
                  <div className="field">
                    <label htmlFor="reg-name">{sw ? 'Jina' : 'Name'}</label>
                    <input
                      id="reg-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className={fieldErrors.name ? inputBad : inputOk}
                      placeholder={sw ? 'Jina lako kamili' : 'Your full name'}
                      autoComplete="name"
                    />
                    {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
                  </div>
                )}

                <div className="field">
                  <label htmlFor="auth-email">Email</label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={fieldErrors.email ? inputBad : inputOk}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
                </div>

                <div className="field">
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="auth-password">{sw ? 'Nenosiri' : 'Password'}</label>
                    {mode === 'login' && (
                      <Link to="/forgot-password" className="text-xs font-medium text-oweru-700 hover:text-oweru-900">
                        {sw ? 'Umesahau?' : 'Forgot?'}
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={mode === 'register' ? 8 : undefined}
                      className={`${fieldErrors.password ? inputBad : inputOk} pr-11`}
                      placeholder={sw ? 'Nenosiri' : 'Password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-ink-700"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      <Icon name={showPw ? 'eyeoff' : 'eye'} className="h-4.5 w-4.5" />
                    </button>
                  </div>
                  {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
                </div>

                {mode === 'register' && (
                  <div className="field">
                    <label htmlFor="register-role">{sw ? 'Aina ya akaunti' : 'Account type'}</label>
                    <select
                      id="register-role"
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value)
                        if (e.target.value !== 'endorser') { setChurchName(''); setChurchRegion('') }
                      }}
                      className={inputOk}
                    >
                      <option value="donor">
                        {sw ? 'Mfadhili — kuchangia vifaa' : 'Donor — fund items'}
                      </option>
                      <option value="applicant">
                        {sw ? 'Mwombaji — omba vifaa na wasilisha taarifa' : 'Applicant — request equipment and submit updates'}
                      </option>
                      <option value="endorser">
                        {sw ? 'Mwakilishi wa kanisa — thibitisha mahitaji' : 'Church representative — confirm community needs'}
                      </option>
                    </select>
                  </div>
                )}

                {mode === 'register' && role === 'endorser' && (
                  <div className="grid gap-4 rounded-[10px] border border-oweru-200 bg-oweru-50/60 p-4">
                    <p className="flex gap-2 text-xs leading-relaxed text-ink-600">
                      <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-oweru-600" />
                      {sw
                        ? 'Weka jina la kanisa lako. Litaonekana kwenye orodha ya makanisa katika fomu ya ombi.'
                        : 'Type your church name. It appears in the church dropdown on the applicant request form.'}
                    </p>
                    <div className="field">
                      <label htmlFor="register-church-name">{sw ? 'Jina la kanisa' : 'Church name'}</label>
                      <input
                        id="register-church-name"
                        value={churchName}
                        onChange={(e) => setChurchName(e.target.value)}
                        required
                        className={inputOk}
                        placeholder={sw ? 'Mfano: Kanisa la Matumaini, Morogoro' : 'e.g. Matumaini Church, Morogoro'}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="register-church-region">{sw ? 'Mkoa (si lazima)' : 'Region (optional)'}</label>
                      <select
                        id="register-church-region"
                        value={churchRegion}
                        onChange={(e) => setChurchRegion(e.target.value)}
                        className={inputOk}
                      >
                        <option value="">{sw ? '— Chagua mkoa —' : '— Select region —'}</option>
                        {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex gap-2 rounded-[10px] border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
                    <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-forest btn-lg mt-1 w-full">
                  {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
                  {loading
                    ? (sw ? 'Inasubiri…' : 'Please wait…')
                    : mode === 'login'
                      ? (sw ? 'Ingia' : 'Sign in')
                      : (sw ? 'Fungua akaunti' : 'Create account')}
                </button>
              </form>

              {mode === 'register' && (
                <p className="mt-6 border-t border-ink-200 pt-5 text-sm text-ink-500">
                  {sw ? 'Unaweza kuchangia bila kufungua akaunti.' : 'Want to give without an account?'}{' '}
                  <Link to="/requests#causes" className="font-semibold text-oweru-700 hover:text-oweru-900">
                    {sw ? 'Chagua kifaa moja kwa moja' : 'Pick an item to fund'}
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>

        <p className="pb-2 text-center text-xs text-white/45">
          {sw ? 'Hakuna fedha taslimu kwa mtu yeyote. Vifaa pekee.' : 'No cash is ever handed to an individual. Equipment only.'}
        </p>
      </div>
    </div>
  )
}
