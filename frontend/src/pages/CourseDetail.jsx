import { Link, Navigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { Icon } from '../components/icons'
import { usePageMeta } from '../hooks/usePageMeta'
import { Container, Section } from '../components/ui'
import { COURSES, courseBySlug } from '../data/courses'

const PHONE = '+255744528913'
const PHONE_TEXT = '+255 744 528 913'

export default function CourseDetail() {
  const { slug } = useParams()
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const course = courseBySlug(slug)

  usePageMeta({
    title: course
      ? `${sw ? course.title.sw : course.title.en} | OWERU Foundation`
      : sw ? 'Kozi | OWERU Foundation' : 'Courses | OWERU Foundation',
    description: course ? (sw ? course.blurb.sw : course.blurb.en) : '',
    url: `/courses/${slug}`,
  })

  if (!course) return <Navigate to="/courses" replace />

  const title = sw ? course.title.sw : course.title.en
  const modules = sw ? course.modules.sw : course.modules.en
  const others = COURSES.filter((c) => c.slug !== course.slug).slice(0, 3)

  return (
    <>
      <section className="border-b border-ink-200 bg-white">
        <Container className="py-12 sm:py-16">
          <nav aria-label={sw ? 'Njia' : 'Breadcrumb'} className="text-sm text-ink-500">
            <Link to="/" className="hover:text-oweru-700">
              {sw ? 'Mwanzo' : 'Home'}
            </Link>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <Link to="/courses" className="hover:text-oweru-700">
              {sw ? 'Kozi' : 'Courses'}
            </Link>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <span className="text-ink-800">{title}</span>
          </nav>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
            <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[12px] bg-ink-50">
              <Icon name={course.icon} className="h-9 w-9 text-oweru-600" />
            </span>

            <div className="max-w-2xl">
              <h1 className="text-balance text-[1.875rem] leading-tight font-bold text-ink-900 sm:text-[2.25rem]">
                {title}
              </h1>
              <p className="mt-4 text-pretty text-[0.9375rem] leading-relaxed text-ink-600">
                {sw ? course.blurb.sw : course.blurb.en}
              </p>

              <dl className="mt-6 flex flex-wrap gap-6 text-sm">
                <div>
                  <dt className="text-xs tracking-[0.1em] text-ink-400 uppercase">
                    {sw ? 'Muda' : 'Duration'}
                  </dt>
                  <dd className="mt-1 font-semibold text-ink-900">
                    {course.weeks} {sw ? 'wiki' : course.weeks === 1 ? 'week' : 'weeks'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs tracking-[0.1em] text-ink-400 uppercase">
                    {sw ? 'Kiwango' : 'Level'}
                  </dt>
                  <dd className="mt-1 font-semibold text-ink-900">
                    {sw ? course.level.sw : course.level.en}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs tracking-[0.1em] text-ink-400 uppercase">
                    {sw ? 'Mahusika' : 'Group size'}
                  </dt>
                  <dd className="mt-1 font-semibold text-ink-900">15&ndash;20</dd>
                </div>
              </dl>
            </div>
          </div>
        </Container>
      </section>

      <Section tone="white">
        <Container>
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-ink-900">
                {sw ? 'Unachofanya kozi hii' : 'What this course covers'}
              </h2>
              <ol className="mt-5 space-y-3">
                {modules.map((m, i) => (
                  <li key={m} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink-700">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-oweru-50 text-xs font-semibold text-oweru-700">
                      {i + 1}
                    </span>
                    {m}
                  </li>
                ))}
              </ol>

              <div className="mt-8 rounded-[12px] border border-ink-100 bg-ink-50 p-6">
                <h3 className="flex items-center gap-2 font-semibold text-ink-900">
                  <Icon name="target" className="h-4 w-4 text-oweru-600" />
                  {sw ? 'Matokeo' : 'What you will be able to do'}
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-600">
                  {sw ? course.outcome.sw : course.outcome.en}
                </p>
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-[12px] border border-ink-100 bg-white p-6 shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
                <h2 className="font-semibold text-ink-900">
                  {sw ? 'Jiunge kozi hii' : 'Join this course'}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {sw
                    ? 'Wapaarisha mahali wako na tutakuandikia tarehe ya kuanza na mahitaji yote.'
                    : 'Tell us where you are and we will write to you with the start date and everything you need to bring.'}
                </p>
                <Link to="/contact" className="btn-primary mt-5 w-full justify-center">
                  {sw ? 'Andika kujitolea' : 'Register interest'}
                </Link>
                <a
                  href={`tel:${PHONE}`}
                  className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-oweru-700 hover:text-oweru-900"
                >
                  <Icon name="phone" className="h-4 w-4" />
                  {PHONE_TEXT}
                </a>
                <p className="mt-4 border-t border-ink-100 pt-4 text-xs leading-relaxed text-ink-500">
                  {sw
                    ? 'Mahusika ya kila kozi yanafunguliwa baada ya kukamilika kwa wanagenzi 15 hadi 20. Tuma ujumbe wako ili kujua wakati unaotarajia.'
                    : 'Each cohort opens once 15 to 20 learners have confirmed. Send us a message to find out the next intake.'}
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <section className="border-t border-ink-200 bg-ink-50">
        <Container className="py-12">
          <h2 className="text-lg font-bold text-ink-900">
            {sw ? 'Kozi nyingine' : 'Other courses'}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {others.map((c) => (
              <Link
                key={c.slug}
                to={`/courses/${c.slug}`}
                className="group flex items-center gap-3 rounded-[12px] border border-ink-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-oweru-600"
              >
                <Icon name={c.icon} className="h-6 w-6 shrink-0 text-oweru-600" />
                <span className="text-sm font-semibold text-ink-900 group-hover:text-oweru-700">
                  {sw ? c.title.sw : c.title.en}
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
