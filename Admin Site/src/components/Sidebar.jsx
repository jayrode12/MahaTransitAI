import MumbaiCityscape from './MumbaiCityscape.jsx'

const DashboardIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#5b50e8' : '#94a3b8'} strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.2"/>
    <rect x="14" y="3" width="7" height="7" rx="1.2"/>
    <rect x="3" y="14" width="7" height="7" rx="1.2"/>
    <rect x="14" y="14" width="7" height="7" rx="1.2"/>
  </svg>
)

const ComplaintsIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#5b50e8' : '#94a3b8'} strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const HistoryIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#5b50e8' : '#94a3b8'} strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <polyline points="12 7 12 12 15 15"/>
  </svg>
)

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="#ef4444" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const AppLogo = () => (
  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="8" rx="2" stroke="white" strokeWidth="1.8" fill="none"/>
      <circle cx="7" cy="11" r="1.2" fill="white"/>
      <circle cx="17" cy="11" r="1.2" fill="white"/>
      <path d="M3 17l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  </div>
)

export default function Sidebar({ currentPage, navigate, onLogout, adminUser }) {
  const navItems = [
    { id: 'dashboard',   label: 'Dashboard',  Icon: DashboardIcon },
    { id: 'complaints',  label: 'Complaints Queue', Icon: ComplaintsIcon },
    { id: 'history',     label: 'Archives',    Icon: HistoryIcon },
  ]

  const mode = (adminUser?.transit_mode || 'metro').toLowerCase()
  const modeIcon = mode === 'bus' ? '🚌' : mode === 'train' ? '🚆' : mode === 'all' ? '🏛️' : '🚇'

  return (
    <aside style={{
      width: 250,
      minWidth: 250,
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflow: 'hidden',
      flexShrink: 0,
      borderRight: '1px solid #e8eef6',
    }}>
      {/* Brand header */}
      <div style={{ padding: '22px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AppLogo />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#1a1a2e', lineHeight: 1.25 }}>
              MahaTransit AI
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>
              Command & Control
            </div>
          </div>
        </div>
      </div>

      {/* Active Authority Badge */}
      <div style={{ margin: '0 16px 14px', padding: '10px 12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Active Agency
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <span>{modeIcon}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {adminUser?.department_name || 'Mumbai Metro One'}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#4F46E5', fontWeight: 600, marginTop: 2 }}>
          Handle: @{adminUser?.email?.split('@')[0] || 'metro'}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#f1f5f9', margin: '0 16px 12px' }} />

      {/* Nav */}
      <nav style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ id, label, Icon }) => {
          const active = currentPage === id || (currentPage === 'details' && id === 'complaints')
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 10,
                border: 'none', cursor: 'pointer', width: '100%',
                background: active ? '#eef2ff' : 'transparent',
                color: active ? '#5b50e8' : '#64748b',
                fontWeight: active ? 700 : 500,
                fontSize: 13.5, textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = '#f8f9ff'
                  e.currentTarget.style.color = '#1a1a2e'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#64748b'
                }
              }}
            >
              <Icon active={active} />
              {label}
            </button>
          )
        })}

        {/* Logout */}
        <button
          onClick={() => onLogout ? onLogout() : navigate('landing')}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', borderRadius: 10,
            border: 'none', cursor: 'pointer', width: '100%',
            background: 'transparent', color: '#ef4444',
            fontWeight: 500, fontSize: 13.5, textAlign: 'left',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogoutIcon />
          Logout Officer
        </button>
      </nav>

      {/* Push illustration to bottom */}
      <div style={{ flex: 1 }} />

      {/* Cityscape */}
      <div style={{ width: '100%', pointerEvents: 'none' }}>
        <MumbaiCityscape />
      </div>
    </aside>
  )
}
