import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { forgotPassword, resetPassword } from '../api'
import { usePageMeta } from '../hooks/usePageMeta'
import { Icon } from '../components/icons'

export default function ResetPassword() {
  const { lang } = useI18n()
  const [searchParams] = useSearchParams()
  const sw = lang === 'sw'

  usePageMeta({
    title: sw ? 'Badilisha Nenosiri | OWERU Foundation' : 'Reset Password | OWERU Foundation',
    description: sw
      ? 'Tengeneza nenosiri jipya la akaunti yako ya OWERU Foundation.'
      : 'Set a new password for your OWERU Foundation account.',
  })

  const resetMode = searchParams.get('token')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setResult('')
    try {
      if (resetMode) {
        const r = await resetPassword({ email, token, password })
        setResult(r.message || (sw ? 'Nenosiri limebadilishwa.' : 'Password updated.'))
      } else {
        const r = await forgotPassword(email)
        const hint = r.reset_token
          ? `${
              sw
                ? 'Kiungo kilijaribu: angalia log ya mfumo kwa token, au tumia token hapa chini.'
                : 'The reset link was written to the mail log (log mailer). Token:'
            } ${r.reset_token}`
          : ''
        setResult(
          `${r.message || (sw ? 'Dokezo la kuweka upya limepelekwa.' : 'A reset link has been sent.')}${
            hint ? ' ' + hint : ''
          }`
        )
      }
    } catch (err) {
      setError(err.message || (sw ? 'Hitilafu imetokea.' : 'Something went wrong.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-oweru-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-5 sm:px-6">
        {/* ---------- Top bar ---------- */}
        <div className="flex items-center justify-between py-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-white/10">
              <span className="font-display text-[0.9375rem] font-semibold text-gold-300">O</span>
            </span>
            <span className="font-display text-[1.0625rem] font-semibold">OWERU</span>
            <span className="mt-[3px] text-[9px] font-semibold tracking-[0.2em] text-white/50 uppercase">
              Foundation
            </span>
          </Link>
          <Link to="/login" className="btn-on-dark btn-sm">
            {sw ? 'Ingia' : 'Sign in'}
          </Link>
        </div>

        {/* ---------- Card ---------- */}
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md rounded-[16px] bg-white p-7 shadow-[var(--shadow-pop)] sm:p-9">
            <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-oweru-50 text-oweru-700">
              <Icon name={resetMode ? 'lock' : 'mail'} className="h-5 w-5" />
            </div>

            <h1 className="mt-6 text-2xl text-ink-900">
              {resetMode
                ? sw
                  ? 'Weka nenosiri jipya'
                  : 'Set a new password'
                : sw
                  ? 'Weka upya nenosiri'
                  : 'Reset your password'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              {resetMode
                ? sw
                  ? 'Chagua nenosiri jipya la akaunti yako.'
                  : 'Choose a new password for your account.'
                : sw
                  ? 'Weka barua pepe yako na tutatuma kiungo cha kuweka upya.'
                  : 'Enter your email and we will send you a reset link.'}
            </p>

            <form onSubmit={submit} className="mt-7 grid gap-4">
              <div className="field">
                <label htmlFor="rp-email">Email</label>
                <input
                  id="rp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>

              {resetMode && (
                <>
                  <div className="field">
                    <label htmlFor="rp-token">Token</label>
                    <input
                      id="rp-token"
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                      placeholder="reset-token"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="rp-password">
                      {sw ? 'Nenosiri jipya' : 'New password'}
                    </label>
                    <input
                      id="rp-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder={sw ? 'Kidogo herufi 8' : 'At least 8 characters'}
                    />
                  </div>
                </>
              )}

              {error && (
                <p className="flex gap-2 rounded-[10px] border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 animate-fade-in">
                  <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              {result && (
                <p className="flex gap-2 rounded-[10px] border border-success-200 bg-success-50 px-4 py-3 text-sm break-words text-success-700 animate-fade-in">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" />
                  {result}
                </p>
              )}

              <button type="submit" disabled={busy} className="btn-forest btn-lg w-full">
                {busy && (
                  <span
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    aria-hidden="true"
                  />
                )}
                {busy
                  ? sw
                    ? 'Inasubiri…'
                    : 'Please wait…'
                  : resetMode
                    ? sw
                      ? 'Badilisha nenosiri'
                      : 'Change password'
                    : sw
                      ? 'Tuma kiungo'
                      : 'Send reset link'}
              </button>
            </form>

            <p className="mt-6 border-t border-ink-200 pt-5 text-center text-sm text-ink-500">
              {sw ? 'Ukatumbuka nenosiri lako?' : 'Remembered your password?'}{' '}
              <Link to="/login" className="font-semibold text-oweru-700 hover:underline">
                {sw ? 'Ingia' : 'Sign in'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
