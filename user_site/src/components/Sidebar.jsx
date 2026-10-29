import cityscapeImg from '@/imports/image-6.png'

const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'new-complaint',
    label: 'New Complaint',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'History',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
]

export default function Sidebar({ currentPage, onNavigate, onLogout }) {
  const isActive = (id) =>
    currentPage === id || (currentPage === 'complaint-details' && id === 'history')

  return (
    <aside
      style={{
        position: 'fixed', left: 0, top: 0, width: 260, height: '100%',
        background: 'white',
        borderRight: '1px solid #E8EEFF',
        display: 'flex', flexDirection: 'column',
        zIndex: 20,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #EEF2FF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: '#4F46E5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 17l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="2" y="7" width="20" height="8" rx="2" stroke="white" strokeWidth="1.8" fill="none"/>
              <circle cx="7" cy="11" r="1.2" fill="white"/>
              <circle cx="17" cy="11" r="1.2" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: '#1E293B', lineHeight: 1.2 }}>
              MahaTransit
            </div>
            <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>Smart Complaint System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px 0' }}>
        {navItems.map((item) => {
          const active = isActive(item.id)
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 12px', borderRadius: 10,
                background: active ? '#EEF2FF' : 'transparent',
                color: active ? '#4F46E5' : '#64748B',
                fontWeight: active ? 600 : 500,
                fontSize: 13.5,
                fontFamily: "'Inter', sans-serif",
                border: 'none', cursor: 'pointer',
                textAlign: 'left', marginBottom: 2,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ color: active ? '#4F46E5' : '#94A3B8', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}

        <button
          onClick={() => onLogout ? onLogout() : onNavigate('landing')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '10px 12px', borderRadius: 10,
            background: 'transparent', color: '#EF4444',
            fontWeight: 500, fontSize: 13.5,
            fontFamily: "'Inter', sans-serif",
            border: 'none', cursor: 'pointer',
            textAlign: 'left', marginTop: 4,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </nav>

      {/* Cityscape illustration */}
      <div style={{ position: 'relative', overflow: 'hidden', height: 210, marginTop: 'auto' }}>
        <img
          src={cityscapeImg}
          alt="Mumbai metro cityscape"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'bottom' }}
        />
      </div>
    </aside>
  )
}
