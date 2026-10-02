import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { money } from '../api'
import { requestImage } from '../utils/requestImages'

const beautiful = (title = '') => requestImage(title, 1200)

export default function Carousel({ items }) {
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const [index, setIndex] = useState(0)
  const timer = useRef(null)

  useEffect(() => {
    if (!items || items.length < 2) return
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % items.length)
    }, 5000)
    return () => clearInterval(timer.current)
  }, [items])

  if (!items || items.length === 0) return null

  const current = items[index % items.length]
  const title = sw ? current.swTitle || current.title : current.title

  const go = (dir) => {
    setIndex((i) => (i + dir + items.length) % items.length)
  }

  return (
    <section className="bg-gradient-to-b from-ink-100 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">
            {sw ? 'Vifaa Vinavyozungumziwa' : 'Equipment in the Spotlight'}
          </h2>
          <Link to="/requests#causes" className="text-oweru-700 font-semibold hover:underline flex items-center gap-1 group">
            {sw ? 'Maombi Yote' : 'All Requests'} <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-ink-900 group">
          <Link to={`/requests/${current.id}`} className="block">
            <div className="relative h-72 md:h-96 overflow-hidden">
              <img
                src={beautiful(current.title)}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-gradient-to-r from-gold-400 to-gold-500 text-ink-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    {current.category}
                  </span>
                  <span className="text-xs text-oweru-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse"></span>
                    {current.region}
                  </span>
                </div>
                <h3 className="text-2xl md:text-4xl font-bold leading-tight mb-3">{title}</h3>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-gold-400 text-lg">{money(current.raised)}</span>
                  <span className="text-white/80">{sw ? 'kilichokusanywa' : 'raised'}</span>
                  <span className="text-white/40">·</span>
                  <span className="font-semibold text-white/80 text-lg">{money(current.target)}</span>
                  <span className="text-white/80">{sw ? 'lengo' : 'target'}</span>
                </div>
              </div>
            </div>
          </Link>

          {items.length > 1 && (
            <>
              <button
                aria-label={sw ? 'Awali' : 'Previous'}
                onClick={(e) => { e.preventDefault(); go(-1) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white w-12 h-12 rounded-full flex items-center justify-center backdrop-blur transition-all hover:scale-110 shadow-lg"
              >
                ‹
              </button>
              <button
                aria-label={sw ? 'Fuata' : 'Next'}
                onClick={(e) => { e.preventDefault(); go(1) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white w-12 h-12 rounded-full flex items-center justify-center backdrop-blur transition-all hover:scale-110 shadow-lg"
              >
                ›
              </button>
              <div className="absolute bottom-4 right-4 flex gap-2">
                {items.map((it, i) => (
                  <button
                    key={i}
                    aria-label={`slide ${i + 1}`}
                    onClick={(e) => { e.preventDefault(); setIndex(i) }}
                    className={'h-2 rounded-full transition-all ' + (i === index ? 'w-8 bg-gold-500 shadow-lg' : 'w-2 bg-white/50 hover:bg-white/70')}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
