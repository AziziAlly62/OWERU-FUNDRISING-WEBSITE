import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { usePageMeta } from '../hooks/usePageMeta'
import { Container } from '../components/ui'

export default function NotFound() {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  usePageMeta({
    title: '404 | OWERU Foundation',
    description: sw ? 'Ukurasa haukupatikana.' : 'Page not found.',
  })

  return (
    <section className="flex items-center bg-cream">
      <Container className="py-24 text-center sm:py-32">
        <p className="font-display text-[5rem] font-semibold leading-none tracking-tight text-oweru-200 sm:text-[7rem]">
          404
        </p>
        <h1 className="display-md mt-6 text-balance">
          {sw ? 'Ukurasa huu haupo.' : 'This page does not exist.'}
        </h1>
        <p className="lede mx-auto mt-4 max-w-md text-pretty">
          {sw
            ? 'Kiungo hiki huenda kimebadilika au kuondolewa. Rudi mwanzo au endelea kuchunguza maombi unayoweza kusaidia.'
            : 'This link may have changed or been removed. Return home or continue exploring requests you can support.'}
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-primary btn-lg">
            {sw ? 'Rudi nyumbani' : 'Back to home'}
          </Link>
          <Link to="/requests#causes" className="btn-secondary btn-lg">
            {sw ? 'Chunguza maombi' : 'Browse requests'}
          </Link>
        </div>
      </Container>
    </section>
  )
}
