import { useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth'
import { useI18n } from '../../i18n'
import { Icon } from '../../components/icons'

const ROLE_LABEL = {
  admin: { en: 'Administrator', sw: 'Msimamizi' },
  manager: { en: 'Manager', sw: 'Meneja' },
  staff: { en: 'Staff', sw: 'Mfanyakazi' },
  applicant: { en: 'Applicant', sw: 'Muombaji' },
  church: { en: 'Church', sw: 'Kanisa' },
  donor: { en: 'Donor', sw: 'Mfadhili' },
}

const navItems = [
  { to: '/portal/dashboard', icon: 'chart', label: { en: 'Dashboard', sw: 'Dashboard' }, roles: ['admin', 'manager'] },
  { to: '/portal/requests', icon: 'clipboard', label: { en: 'Requests', sw: 'Maombi' }, roles: ['admin', 'manager'] },
  { to: '/portal/items', icon: 'newcampaign', label: { en: 'Items & Funding', sw: 'Vifaa na Ufadhili' }, roles: ['admin', 'manager'] },
  { to: '/portal/quotes', icon: 'doc', label: { en: 'Supplier Quotes', sw: 'Makadirio' }, roles: ['admin', 'manager'] },
  { to: '/portal/donations', icon: 'wallet', label: { en: 'Donations', sw: 'Michango' }, roles: ['admin'] },
  { to: '/portal/payments', icon: 'card', label: { en: 'Payments', sw: 'Malipo' }, roles: ['admin'] },
  { to: '/portal/suppliers', icon: 'truck', label: { en: 'Suppliers', sw: 'Wauzaji' }, roles: ['admin', 'manager'] },
  { to: '/portal/invoices', icon: 'doc', label: { en: 'Invoices', sw: 'Ankara' }, roles: ['admin'] },
  { to: '/portal/equipment', icon: 'wrench', label: { en: 'Equipment', sw: 'Vifaa' }, roles: ['admin', 'manager'] },
  { to: '/portal/reports', icon: 'chart', label: { en: 'Reports', sw: 'Ripoti' }, roles: ['admin', 'manager'] },
  { to: '/portal/ledger', icon: 'globe', label: { en: 'Public Ledger', sw: 'Ledger' }, roles: ['admin'] },
  { to: '/portal/audit-logs', icon: 'shield', label: { en: 'Audit Logs', sw: 'Kumbukumbu' }, roles: ['admin'] },
  { to: '/portal/users', icon: 'users', label: { en: 'Staff Users', sw: 'Watumiaji' }, roles: ['admin'] },
  { to: '/portal/churches', icon: 'globe', label: { en: 'Churches', sw: 'Makanisa' }, roles: ['admin', 'manager'] },
]

export default function AdminLayout() {
const { user, logout } = useAuth()
  const { lang } = useI18n()
  const sw = lang === 'sw'
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const adminNav = navItems.filter((n) => !user?.role || n.roles.includes(user.role))

  const onSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? '/portal/requests?q=' + encodeURIComponent(q) : '/portal/requests')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      {/* Sidebar */}
      <aside className="hidden h-full w-64 shrink-0 flex-col bg-oweru-950 md:flex">
        <div className="border-b border-white/10 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/oweru-logo.png" alt="OWERU" className="h-9 w-auto object-contain" />
            <div className="leading-tight">
              <div className="font-display text-[0.9375rem] font-semibold text-white">OWERU Admin</div>
              <div className="text-[0.6875rem] text-oweru-100/70">{sw ? 'Jopo la Usimamizi' : 'Administration'}</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {adminNav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                'group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors ' +
                (isActive
                  ? 'bg-oweru-800 text-white'
                  : 'text-oweru-100/70 hover:bg-white/5 hover:text-white')
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-gold-500" aria-hidden="true" />}
                  <Icon
                    name={n.icon}
                    className={'h-4 w-4 shrink-0 ' + (isActive ? 'text-gold-300' : 'text-oweru-100/50 group-hover:text-oweru-100')}
                  />
                  <span className="truncate">{sw ? (n.label.sw || n.label.en) : n.label.en}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-500 text-sm font-bold text-oweru-950">
              {((user?.name || '?').trim().charAt(0) || '?').toUpperCase()}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[0.8125rem] font-semibold text-white">{user?.name}</p>
              <p className="truncate text-[0.6875rem] text-oweru-100/70">
                {ROLE_LABEL[user?.role]?.[sw ? 'sw' : 'en'] || user?.role}
              </p>
            </div>
          </div>
          <button type="button" onClick={logout} className="btn-on-dark btn-sm mt-3 w-full">
            <Icon name="logout" className="h-4 w-4" />
            {sw ? 'Toka' : 'Log out'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between gap-3 border-b border-ink-200 bg-surface px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-ink-200 text-ink-700 transition-colors hover:bg-ink-50 md:hidden"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2.5 md:hidden">
              <img src="/oweru-logo.png" alt="OWERU" className="h-7 w-auto object-contain" />
              <span className="font-display text-sm font-semibold text-ink-900">OWERU Admin</span>
            </div>
            <span className="eyebrow hidden md:inline-flex">{sw ? 'Jopo la Usimamizi' : 'Administration Panel'}</span>
          </div>

          <form onSubmit={onSearch} className="hidden max-w-xs flex-1 items-center md:flex">
            <div className="relative flex-1">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={sw ? 'Tafuta maombi...' : 'Search requests...'}
                aria-label={sw ? 'Tafuta maombi' : 'Search requests'}
                className="w-full rounded-[10px] border border-ink-200 bg-paper py-2 pl-9 pr-3 text-sm text-ink-800 transition-colors placeholder:text-ink-400 focus:border-oweru-400 focus:bg-surface focus:outline-none"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <Link to="/" className="btn-secondary btn-sm">{sw ? 'Nyumbani' : 'Public site'}</Link>
            <button type="button" onClick={logout} className="btn-ghost btn-sm md:hidden">{sw ? 'Toka' : 'Log out'}</button>
          </div>
        </header>

        {menuOpen && (
          <nav className="border-b border-ink-200 bg-surface p-3 md:hidden">
            <div className="grid grid-cols-2 gap-2">
              {adminNav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    'rounded-[10px] px-3 py-2.5 text-xs font-semibold transition-colors ' +
                    (isActive ? 'bg-oweru-700 text-white' : 'border border-ink-200 bg-paper text-ink-700')
                  }
                >
                  <Icon name={n.icon} className="mr-1.5 inline h-4 w-4" />
                  {sw ? (n.label.sw || n.label.en) : n.label.en}
                </NavLink>
              ))}
            </div>
          </nav>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

