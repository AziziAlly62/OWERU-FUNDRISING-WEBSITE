import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { fetchPublicReports } from '../api'
import { requestImage } from '../utils/requestImages'
import { Icon } from '../components/icons'

const SAMPLE = [
  {
    id: 'sample-1',
    type: '30_day',
    item: 'Delivery beds',
    region: 'Morogoro',
    church: 'Rural clinic',
    content:
      'The delivery beds arrived and are now in daily use at the maternity ward. Midwives report safer deliveries and higher confidence among expectant mothers.',
    contentSw:
      'Vitanda vya uzazi vimefika na sasa vinatumika kila siku kwenye wodi ya uzazi. Wakunga wanaripoti uzazi salama na imani kubwa miongoni mwa akina mama.',
  },
  {
    id: 'sample-2',
    type: '90_day',
    item: 'Portable ultrasound scanner',
    region: 'Iringa',
    church: 'Community clinic',
    content:
      'Ninety days after delivery the scanner is fully operational. Patients who previously travelled 120km for scans now receive them locally.',
    contentSw:
      'Siku 90 baada ya uwasilishaji scanner inafanya kazi kikamilifu. Wagonjwa ambao awali walisafiri km 120 kupima sasa wanapima karibu nao.',
  },
  {
    id: 'sample-3',
    type: '30_day',
    item: 'Solar power kit',
    region: 'Manyara',
    church: 'Outreach centre',
    content:
      'The solar kit keeps the centre lit for evening services and charging essential devices. Attendance at community meetings has doubled.',
    contentSw:
      'Kifaa cha sola kinaweka kituo kikiwa na mwanga kwa huduma za jioni na kuchaji vifaa muhimu. Wajumbe wa mikutano ya jamii wameongezeka maradufu.',
  },
]

export default function SuccessStories() {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetchPublicReports()
      .then((r) => alive && setStories(r || []))
      .catch(() => alive && setStories([]))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const cards = (stories.length ? stories : SAMPLE).slice(0, 3)

  return (
    <section className="section-padding bg-[var(--color-paper)]">
      <div className="container-responsive">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <span className="kicker mb-4">
              <Icon name="heart" className="h-3.5 w-3.5" />
              {sw ? 'Hadithi za Athari' : 'Success Stories'}
            </span>
            <h2 className="text-3xl sm:text-4xl text-ink-900 mb-2 mt-3">
              {sw ? 'Msaada kwa vitendo, sio maneno tu.' : 'Support in action — not just words.'}
            </h2>
            <p className="text-ink-500 text-sm">
              {sw
                ? 'Hadithi halisi za vifaa vilivyofadhiliwa na kupelekwa kwa timu za huduma.'
                : 'Real stories of equipment funded and delivered to serving outreach teams.'}
            </p>
          </div>
          <Link to="/reports" className="btn-secondary shrink-0">
            {sw ? 'Ripoti Zote' : 'All Reports'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card-base overflow-hidden animate-pulse-slow">
                <div className="h-52 bg-ink-100" />
                <div className="p-6 space-y-3">
                  <div className="h-4 w-24 rounded bg-ink-100" />
                  <div className="h-5 w-3/4 rounded bg-ink-100" />
                  <div className="h-3 w-full rounded bg-ink-100" />
                  <div className="h-3 w-5/6 rounded bg-ink-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((s) => {
              const title = s.item || (sw ? 'Kifaa kilichofadhiliwa' : 'Funded equipment')
              const church = s.church || ''
              const story = s.contentSw || s.content || ''
              const region = s.region || 'Tanzania'
              return (
                <Link key={s.id} to="/reports" className="card-base overflow-hidden group flex flex-col hover:border-oweru-500">
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={requestImage((title || '') + ' ' + (region || 'community'), 900)}
                      alt={title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 bg-ink-900/80 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded inline-flex items-center gap-1.5">
                      <Icon name="check" className="h-3 w-3" />
                      {s.type === '90_day' ? 'Siku 90' : 'Siku 30'}
                    </span>
                    <span className="absolute bottom-3 right-3 bg-ink-900/80 text-white text-xs px-3 py-1.5 rounded">
                      {region}
                    </span>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    {church && (
                      <div className="text-xs text-ink-500 mb-2 flex items-center gap-1.5">
                        <Icon name="pin" className="h-3.5 w-3.5" />
                        {church}
                      </div>
                    )}
                    <h3 className="font-display font-semibold text-lg mb-2 text-ink-900 group-hover:text-oweru-700 transition-colors line-clamp-2 capitalize">{title}</h3>
                    <p className="text-sm text-ink-600 leading-relaxed line-clamp-4 mb-4">{story}</p>
                    <div className="mt-auto">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-oweru-700 group-hover:gap-3 transition-all">
                        {sw ? 'Soma hadithi kamili' : 'Read the full story'}
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}