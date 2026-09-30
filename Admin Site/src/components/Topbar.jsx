const NAV_ITEMS = [
  {
    id: 'complaints',
    label: 'Complaints Queue',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'Archives',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
      </svg>
    ),
  },
]

export default function Topbar({ currentPage, navigate, onLogout, adminUser }) {
  const activePage = currentPage === 'details' ? 'complaints' : currentPage

  return (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #e8eef6',
      padding: '0 28px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>

      {NAV_ITEMS.map(({ id, label, icon }) => {
        const active = activePage === id
        return (
          <button
            key={id}
            onClick={() => navigate(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 7, border: 'none',
              cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 500,
              background: active ? '#eef2ff' : 'transparent',
              color: active ? '#4f46e5' : '#64748b',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f8f9ff'; e.currentTarget.style.color = '#1e1b4b' } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' } }}
          >
            {icon}
            {label}
          </button>
        )
      })}

      <div style={{ width: 1, height: 20, background: '#e8eef6', margin: '0 6px' }} />

      <button
        onClick={() => onLogout ? onLogout() : navigate('landing')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: '#ef4444', fontWeight: 500, fontSize: 13,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '6px 12px', borderRadius: 7, transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Logout
      </button>
    </div>
  )
}
