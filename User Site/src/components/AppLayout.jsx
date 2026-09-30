import Sidebar from './Sidebar'
import Header from './Header'

export default function AppLayout({ currentPage, onNavigate, onLogout, children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />
      <Header currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />
      <main style={{
        marginLeft: 260,
        marginTop: 62,
        minHeight: 'calc(100vh - 62px)',
        padding: '30px 32px',
      }}>
        {children}
      </main>
    </div>
  )
}
