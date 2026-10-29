export default function Header({ currentPage, onNavigate, onLogout }) {
  return (
    <header style={{
      position: 'fixed', top: 0, right: 0, left: 260, height: 62,
      background: 'white', borderBottom: '1px solid #E8EEFF',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', zIndex: 10,
    }}>
      <div />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <NavBtn
          active={currentPage === 'new-complaint'}
          onClick={() => onNavigate('new-complaint')}
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          }
          label="New Complaint"
        />
        <NavBtn
          active={currentPage === 'history' || currentPage === 'complaint-details'}
          onClick={() => onNavigate('history')}
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          }
          label="History"
        />
        <div style={{ width: 1, height: 22, background: '#E2E8F0', margin: '0 6px' }} />
        <button
          onClick={() => (onLogout ? onLogout() : onNavigate('landing'))}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            color: '#EF4444', fontWeight: 500, fontSize: 13.5,
            fontFamily: "'Inter', sans-serif",
            background: 'transparent', border: 'none', cursor: 'pointer',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </header>
  )
}

function NavBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 8,
        color: active ? '#4F46E5' : '#475569',
        fontWeight: active ? 600 : 500,
        fontSize: 13.5, fontFamily: "'Inter', sans-serif",
        background: 'transparent', border: 'none', cursor: 'pointer',
        position: 'relative',
      }}
    >
      {icon}
      {label}
      {active && (
        <span style={{
          position: 'absolute', bottom: -17, left: 0, right: 0,
          height: 2, background: '#4F46E5', borderRadius: '2px 2px 0 0',
        }} />
      )}
    </button>
  )
}
