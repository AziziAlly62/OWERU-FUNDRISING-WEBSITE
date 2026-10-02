import { useState } from 'react'
import { useI18n } from '../i18n'
import { Icon } from '../components/icons'
import { submitComplaint } from '../api'
import { usePageMeta } from '../hooks/usePageMeta'
import { Container } from '../components/ui'

const ASSURANCES = [
  { icon: 'lock', en: 'Handled in confidence', sw: 'Tunatunza usiri wako', descEn: 'Your report is not published and is shared only with people handling it.', descSw: 'Taarifa yako haitachapishwa; itashughulikiwa na wahusika pekee.' },
  { icon: 'clock', en: 'Reviewed by our team', sw: 'Hupitiwa na timu yetu', descEn: 'We review every report and follow up using the contact details you provide, if available.', descSw: 'Tunakagua kila taarifa na tutawasiliana nawe kupitia mawasiliano uliyotoa, ikiwezekana.' },
  { icon: 'scale', en: 'A fair hearing', sw: 'Ushughulikiaji wa haki', descEn: 'We consider each concern carefully and without bias.', descSw: 'Tunalichunguza kila suala kwa makini na bila upendeleo.' },
]

export default function Complaints() {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  usePageMeta({
    title: sw ? 'Malalamiko | OWERU Foundation' : 'Complaints | OWERU Foundation',
    description: sw
      ? 'Wasilisha malalamiko au eleza wasiwasi kuhusu huduma za OWERU Foundation.'
      : 'Raise a complaint or concern about how OWERU Foundation serves people.',
  })

  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ name: '', contact: '', message: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await submitComplaint(formData)
      setSent(true)
      setFormData({ name: '', contact: '', message: '' })
    } catch (err) {
      setError(err.message || (sw ? 'Hitilafu imetokea. Tafadhali jaribu tena.' : 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => setFormData((f) => ({ ...f, [e.target.name]: e.target.value }))

  return (
    <>
      {/* ---- Statement ---- */}
      <section className="border-b border-ink-200 bg-cream">
        <Container className="py-14 sm:py-20">
          <span className="eyebrow">{sw ? 'Malalamiko na wasiwasi' : 'Complaints and concerns'}</span>
          <h1 className="display-lg mt-5 text-balance">
            {sw ? 'Tuambie kilichotokea. Tutakusikiliza.' : 'Tell us what happened. We will listen.'}
          </h1>
          <p className="lede mt-5 max-w-2xl text-pretty">
            {sw
              ? 'Tuambie kuhusu malalamiko, suala la usalama au jambo linalokutia wasiwasi kuhusu huduma zetu. Tutalishughulikia kwa usiri na kwa haki.'
              : 'Report a complaint, a safeguarding concern, or anything that is not right about how we serve people. It is handled in confidence, and every report is reviewed.'}
          </p>
        </Container>
      </section>

      {/* ---- Form + assurances ---- */}
      <section className="bg-white">
        <Container className="py-16 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            {/* Assurances */}
            <div>
              <h2 className="display-md text-balance">
                {sw ? 'Jinsi unavyolindwa' : 'How you are protected'}
              </h2>
              <ul className="mt-8 grid gap-4">
                {ASSURANCES.map((a) => (
                  <li key={a.en} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-oweru-50 text-oweru-700">
                      <Icon name={a.icon} className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[0.9375rem] font-semibold text-ink-900">{sw ? a.sw : a.en}</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-500">{sw ? a.descSw : a.descEn}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-8 flex gap-3 rounded-[10px] bg-oweru-950 p-5 text-sm leading-relaxed text-white/80">
                <Icon name="shield" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-gold-300" />
                {sw
                  ? 'Huna haja ya kujitambulisha. Unaweza kuripoti kwa utambulisho wako kamili au bila jina lolote — chaguo lako.'
                  : 'You do not have to identify yourself. Report with your full name or stay entirely anonymous — your choice either way.'}
              </p>
            </div>

            {/* Form */}
            <div>
              {sent ? (
                <div className="rounded-[14px] border border-success-200 bg-success-50 p-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-100 text-success-600">
                    <Icon name="check" className="h-7 w-7" strokeWidth={2.2} />
                  </div>
                  <h2 className="mt-5 text-xl text-ink-900">
                    {sw ? 'Asante kwa kutuamini. Tumepokea taarifa yako.' : 'Thank you for trusting us. We have received your report.'}
                  </h2>
                  <p className="mt-2 text-[0.9375rem] text-ink-600">
                    {sw
                      ? 'Timu yetu itakagua taarifa yako na itawasiliana nawe kupitia mawasiliano uliyotoa, ikiwa yapo.'
                      : 'Our team will review your report and follow up using the contact details you provided, if available.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="btn-secondary mt-7"
                  >
                    {sw ? 'Tuma ripoti nyingine' : 'Report something else'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="card-base grid gap-5 p-7">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="field">
                      <label htmlFor="c-name">{sw ? 'Jina (si lazima)' : 'Name (optional)'}</label>
                      <input
                        id="c-name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={sw ? 'Jina lako' : 'Your name'}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="c-contact">{sw ? 'Barua pepe au simu' : 'Email or phone'}</label>
                      <input
                        id="c-contact"
                        name="contact"
                        value={formData.contact}
                        onChange={handleChange}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="c-message">{sw ? 'Ripoti yako' : 'Your report'}</label>
                    <textarea
                      id="c-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder={sw
                        ? 'Eleza kinachotokea, lini, na kuhusu nini…'
                        : 'Describe what happened, when, and what it concerns…'}
                    />
                  </div>

                  {error && (
                    <div className="flex gap-2 rounded-[10px] border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
                      <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="btn-forest btn-lg w-full">
                    {loading && (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                    )}
                    {loading
                      ? (sw ? 'Inatuma…' : 'Sending…')
                      : (sw ? 'Tuma ripoti' : 'Send report')}
                  </button>

                  <p className="flex gap-2 text-xs leading-relaxed text-ink-500">
                    <Icon name="lock" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-oweru-600" />
                    {sw
                      ? 'Taarifa hizi hutumika tu kushughulikia ripoti yako. Hazishirikishwi hadharini.'
                      : 'This information is used only to address your report. It is never published or shared.'}
                  </p>
                </form>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
