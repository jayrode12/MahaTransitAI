import { useState } from 'react'

export default function Landing({ onNavigate, isLoggedIn, currentUser }) {
  const [trackQuery, setTrackQuery] = useState('')
  const [showTrackModal, setShowTrackModal] = useState(false)

  function handleTrackSubmit(e) {
    e.preventDefault()
    if (trackQuery.trim()) {
      onNavigate('complaint-details', { id: trackQuery.trim() })
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: "'Inter', sans-serif" }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        borderBottom: '1px solid #E8EEFF', background: 'white',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="7" width="20" height="8" rx="2" stroke="white" strokeWidth="1.8" fill="none"/>
              <circle cx="7" cy="11" r="1.2" fill="white"/>
              <circle cx="17" cy="11" r="1.2" fill="white"/>
              <path d="M3 17l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 16, color: '#1E293B' }}>MahaTransit AI</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>Complaint Management System</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isLoggedIn ? (
            <>
              <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                Hi, <strong style={{ color: '#1E293B' }}>{currentUser?.full_name?.split(' ')[0] || 'User'}</strong>
              </span>
              <button onClick={() => onNavigate('dashboard')} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#4F46E5', color: 'white', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Dashboard
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onNavigate('login')} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 500, fontSize: 13.5, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Login
              </button>
              <button onClick={() => onNavigate('register')} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#4F46E5', color: 'white', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Register
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(160deg, #EEF2FF 0%, #F0F4FF 40%, #E8EEFF 100%)', padding: '80px 40px 72px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 20, background: 'white', border: '1px solid #C7D2FE', color: '#4F46E5', fontSize: 12, fontWeight: 600, marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F46E5', display: 'inline-block' }} />
          AI-Powered · Mumbai Public Transport
        </div>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 52, fontWeight: 800, color: '#1E293B', lineHeight: 1.15, margin: '0 auto 20px', maxWidth: 680 }}>
          Mumbai's Smartest<br />
          <span style={{ color: '#4F46E5' }}>Complaint Platform</span>
        </h1>
        <p style={{ fontSize: 17, color: '#64748B', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.65 }}>
          Report Metro, BEST Bus, and Mumbai Local train issues in seconds.
          AI automatically categorizes, prioritizes and routes your complaint to the right authority.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('new-complaint')} style={{ padding: '13px 28px', borderRadius: 10, border: 'none', background: '#4F46E5', color: 'white', fontWeight: 700, fontSize: 14.5, cursor: 'pointer', fontFamily: "'Inter', sans-serif", boxShadow: '0 8px 28px rgba(79,70,229,0.35)', display: 'flex', alignItems: 'center', gap: 8 }}>
            File a Complaint
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
          <button onClick={() => setShowTrackModal(true)} style={{ padding: '13px 28px', borderRadius: 10, border: '1.5px solid #C7D2FE', background: 'white', color: '#4F46E5', fontWeight: 600, fontSize: 14.5, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            Track My Complaint
          </button>
        </div>

        {/* Quick Tracking Input */}
        {showTrackModal && (
          <form onSubmit={handleTrackSubmit} style={{ maxWidth: 440, margin: '24px auto 0', display: 'flex', gap: 8, background: 'white', padding: '6px', borderRadius: 12, border: '1.5px solid #4F46E5', boxShadow: '0 4px 20px rgba(79,70,229,0.15)' }}>
            <input
              type="text"
              value={trackQuery}
              onChange={e => setTrackQuery(e.target.value)}
              placeholder="Enter Ticket Number (e.g. MT-MET-202609-XXXX)"
              required
              style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 14px', fontSize: 14, fontFamily: "'Inter', sans-serif" }}
            />
            <button type="submit" style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#4F46E5', color: 'white', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
              Track
            </button>
            <button type="button" onClick={() => setShowTrackModal(false)} style={{ padding: '10px', borderRadius: 8, border: 'none', background: '#F1F5F9', color: '#64748B', cursor: 'pointer' }}>
              ✕
            </button>
          </form>
        )}
      </section>

      {/* Transport cards */}
      <section style={{ padding: '64px 40px', background: 'white' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 800, color: '#1E293B', textAlign: 'center', marginBottom: 8 }}>Three Networks. One Platform.</h2>
          <p style={{ color: '#64748B', fontSize: 14.5, textAlign: 'center', marginBottom: 36 }}>Click any transport mode to file a targeted complaint.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
            {[
              { id: 'Metro', emoji: '🚇', label: 'Mumbai Metro', desc: 'All operational lines — Line 1, 2A, 7, 9 and upcoming corridors across the city.', color: '#4F46E5', bg: '#EEF2FF' },
              { id: 'Bus', emoji: '🚌', label: 'BEST Buses', desc: 'All BEST bus routes across Mumbai, Navi Mumbai, and extended suburban zones.', color: '#0891B2', bg: '#E0F2FE' },
              { id: 'Railway', emoji: '🚆', label: 'Mumbai Local', desc: 'Western, Central, Harbour, and Trans-Harbour railway lines serving millions daily.', color: '#059669', bg: '#D1FAE5' },
            ].map((t) => (
              <div key={t.label} onClick={() => onNavigate('new-complaint', { transport: t.id })} style={{ background: 'white', borderRadius: 16, border: '1px solid #E8EEFF', padding: '24px', cursor: 'pointer', boxShadow: '0 2px 10px rgba(79,70,229,0.05)', transition: 'transform 0.15s', ':hover': { transform: 'translateY(-2px)' } }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14 }}>
                  {t.emoji}
                </div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 15.5, color: '#1E293B', marginBottom: 8 }}>{t.label}</div>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: '0 0 12px' }}>{t.desc}</p>
                <span style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600 }}>File {t.label} Complaint →</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI features */}
      <section style={{ padding: '64px 40px', background: '#F8FAFF', borderTop: '1px solid #EEF2FF' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 800, color: '#1E293B', textAlign: 'center', marginBottom: 8 }}>Intelligent by Design</h2>
          <p style={{ color: '#64748B', fontSize: 14.5, textAlign: 'center', marginBottom: 36 }}>Every complaint is processed by AI before it reaches the management team.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[
              { icon: '🔍', label: 'Auto Classification', desc: 'Complaint type automatically detected from your text description.' },
              { icon: '📸', label: 'Image Analysis', desc: 'Vision model detects visible transport issues from uploaded photos.' },
              { icon: '⚡', label: 'Priority Scoring', desc: 'Urgency level predicted and assigned automatically based on severity.' },
              { icon: '🔁', label: 'Duplicate Detection', desc: 'Similar complaints are merged so management sees real impact count.' },
            ].map((f) => (
              <div key={f.label} style={{ background: 'white', borderRadius: 14, border: '1px solid #E8EEFF', padding: '20px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13.5, color: '#1E293B', marginBottom: 8 }}>{f.label}</div>
                <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 40px', background: '#1E1B4B', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>
          © 2026 MahaTransit AI · Unified Complaint Management Platform · Mumbai, Maharashtra
        </p>
      </footer>

    </div>
  )
}
