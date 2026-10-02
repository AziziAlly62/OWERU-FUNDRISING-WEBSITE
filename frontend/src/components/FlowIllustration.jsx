import { Icon } from './icons'
import { useI18n } from '../i18n'

function Tile({ icon, label, accent, delay = 0 }) {
  return (
    <div className="reveal flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 sm:p-6 transition-transform hover:-translate-y-1 hover:border-gold-400/40" data-delay={delay}>
      <div className="grid h-14 w-14 place-items-center rounded-xl bg-gold-500/15 text-gold-400">
        <Icon name={icon} className="h-7 w-7" />
      </div>
      <span className="text-center text-xs font-semibold leading-snug text-white/85">{label}</span>
      {accent && <span className="rounded-full bg-gold-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-ink-900">{accent}</span>}
    </div>
  )
}

function FlowIllustration({ variant }) {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  const V = variant === 'deliver'
    ? {
        tiles: [
          { icon: 'truck', label: sw ? 'Vifaa vinafikishwa kwa timu ya huduma' : 'Equipment delivered to the outreach team' },
          { icon: 'clipboard', label: sw ? 'Kinasajiliwa kwenye Rejesta ya Umma' : 'Registered in the public equipment register' },
          { icon: 'chart', label: sw ? 'Athari inafuatiliwa kwa ripoti za 30/90 siku' : 'Impact tracked through 30/90-day reports', accent: sw ? 'Imethibitishwa' : 'Verified' },
        ],
      }
    : {
        tiles: [
          { icon: 'package', label: sw ? 'Chagua kifaa mahususi' : 'Pick a specific item', accent: sw ? 'Kifaa' : 'Item' },
          { icon: 'wallet', label: sw ? 'Wewe unatoa moja kwa moja — bila fedha taslimu' : 'You give directly — no cash in between' },
          { icon: 'shield', label: sw ? 'Muuzaji aliyeidhinishwa + risiti ya umma' : 'Verified supplier + public receipt', accent: sw ? 'Risiti' : 'Receipt' },
        ],
      }

  return (
    <div className="relative h-72 lg:h-96 overflow-hidden rounded-2xl bg-ink-900 p-6 sm:p-8 shadow-xl">
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-oweru-700/25 blur-3xl" aria-hidden="true" />
      <div className="relative flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="grid w-full grid-cols-3 gap-3">
            {V.tiles.map((t, i) => (
              <Tile key={i} icon={t.icon} label={t.label} accent={t.accent} delay={i * 90} />
            ))}
          </div>
        </div>
        <div className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-gold-300/70">
          {variant === 'deliver'
            ? sw ? 'Fikisha · Sajili · Thibitisha' : 'Deliver · Register · Verify'
            : sw ? 'Chagua · Changia · Nunua (kwa risiti)' : 'Pick · Give · Buy — with a receipt'}
        </div>
      </div>
    </div>
  )
}

export default FlowIllustration