export default function LandingPage({ navigate }) {
  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'Inter, sans-serif', color: '#1a1a2e' }}>

      {/* ── Navbar ── */}
      <nav style={{
        background: 'white', borderBottom: '1px solid #f0f0f5',
        padding: '0 56px', height: 66,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 6px rgba(79,70,229,0.05)',
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
            <span style={{ fontWeight: 800, color: '#1a1a2e', fontSize: 16 }}>MahaTransit</span>
            <span style={{ fontWeight: 800, color: '#4F46E5', fontSize: 16 }}> AI</span>
          </div>
        </div>
        <button
          onClick={() => navigate('login')}
          style={{
            padding: '9px 26px', borderRadius: 9, border: 'none',
            background: '#4F46E5', color: 'white', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', boxShadow: '0 2px 10px rgba(79,70,229,0.22)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
          onMouseLeave={e => e.currentTarget.style.background = '#4F46E5'}
        >
          Admin Login
        </button>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        padding: '88px 56px 96px',
        background: 'white',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle background blobs */}
        <div style={{ position: 'absolute', top: -80, right: -60, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, #eef2ff 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, #f0f9ff 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 640, position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: '#eef2ff', border: '1px solid #c7d2fe',
            borderRadius: 20, padding: '5px 14px', marginBottom: 28,
          }}>
            <span style={{ width: 7, height: 7, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
            <span style={{ color: '#4338ca', fontSize: 13, fontWeight: 600 }}>AI-Powered · Mumbai Transit</span>
          </div>

          <h1 style={{ color: '#0f0c29', fontSize: 50, fontWeight: 800, lineHeight: 1.12, margin: '0 0 22px', letterSpacing: -1 }}>
            Smarter Complaint<br />
            <span style={{ color: '#4F46E5' }}>Management</span> for<br />
            Mumbai Transit
          </h1>
          <p style={{ color: '#64748b', fontSize: 17, lineHeight: 1.75, maxWidth: 500, margin: '0 0 38px' }}>
            One unified platform for Metro, BEST Buses, and Local Trains. AI automatically classifies, prioritizes, and routes every complaint to the right authority.
          </p>
          <button
            onClick={() => navigate('login')}
            style={{
              padding: '14px 36px', borderRadius: 10, border: 'none',
              background: '#4F46E5', color: 'white', fontWeight: 700, fontSize: 16,
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(79,70,229,0.3)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#4338ca'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.transform = 'none' }}
          >
            Go to Admin Portal →
          </button>
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: '#f1f5f9', margin: '0 56px' }} />

      {/* ── Transport systems ── */}
      <section style={{ padding: '72px 56px', background: 'white' }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ color: '#4F46E5', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.4, margin: '0 0 10px' }}>Coverage</p>
          <h2 style={{ color: '#0f0c29', fontSize: 30, fontWeight: 800, margin: '0 0 10px' }}>All Mumbai Transit Systems</h2>
          <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>One platform across Metro, BEST Buses, and Local Railways</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, maxWidth: 960 }}>
          {[
            { icon: '🚇', name: 'Mumbai Metro',  color: '#4F46E5', bg: '#eef2ff', border: '#e0e7ff',
              lines: ['Line 1 (Versova – Ghatkopar)', 'Line 2A (Dahisar – DN Nagar)', 'Line 7 (Dahisar E – Andheri E)', 'Line 3 (Colaba – SEEPZ)'] },
            { icon: '🚌', name: 'BEST Buses',     color: '#0891b2', bg: '#ecfeff', border: '#cffafe',
              lines: ['All BEST bus routes', 'AC & Non-AC services', 'Express routes', 'Last-mile connectivity'] },
            { icon: '🚂', name: 'Mumbai Local',   color: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe',
              lines: ['Western Railway', 'Central Railway', 'Harbour Line', 'Trans-Harbour Line'] },
          ].map(({ icon, name, color, bg, border, lines }) => (
            <div key={name} style={{
              background: 'white', border: `1.5px solid ${border}`,
              borderRadius: 16, padding: '28px 24px',
              boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
              transition: 'box-shadow 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ width: 52, height: 52, background: bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 18 }}>
                {icon}
              </div>
              <h3 style={{ color: '#0f0c29', fontWeight: 700, fontSize: 17, margin: '0 0 14px' }}>{name}</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {lines.map(l => (
                  <li key={l} style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#475569', fontSize: 13 }}>
                    <span style={{ width: 6, height: 6, background: color, borderRadius: '50%', flexShrink: 0 }} />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI Features ── */}
      <section style={{ padding: '72px 56px', background: '#fafbff' }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ color: '#4F46E5', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.4, margin: '0 0 10px' }}>AI-Powered</p>
          <h2 style={{ color: '#0f0c29', fontSize: 30, fontWeight: 800, margin: '0 0 10px' }}>Intelligent Complaint Processing</h2>
          <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>Classified, prioritized, and routed before a human reads it</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 18, maxWidth: 900 }}>
          {[
            { icon: '🧠', title: 'Auto Classification',  color: '#4F46E5',
              desc: 'DistilBERT reads complaint text and assigns a category — Electrical, Cleanliness, Infrastructure, Safety — instantly.' },
            { icon: '📸', title: 'Image Detection',       color: '#0891b2',
              desc: 'YOLOv8 detects broken seats, garbage, water leakage, or damaged infrastructure from uploaded photos.' },
            { icon: '⚡', title: 'Priority Prediction',   color: '#d97706',
              desc: 'ML model rates every complaint High / Medium / Low based on safety risk, duplicate count, and category weight.' },
            { icon: '🔍', title: 'Duplicate Detection',   color: '#7c3aed',
              desc: 'Sentence Transformers merge 100 "Dadar Platform Dirty" reports into one high-impact issue automatically.' },
          ].map(({ icon, title, color, desc }) => (
            <div key={title} style={{
              background: 'white', borderRadius: 14, padding: '22px 24px',
              display: 'flex', gap: 16, border: '1px solid #f0f0f8',
              boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
            }}>
              <div style={{ width: 46, height: 46, background: `${color}12`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <h4 style={{ color: '#0f0c29', fontWeight: 700, fontSize: 14, margin: '0 0 6px' }}>{title}</h4>
                <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '72px 56px',
        background: 'white',
        borderTop: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40,
      }}>
        <div>
          <h2 style={{ color: '#0f0c29', fontSize: 28, fontWeight: 800, margin: '0 0 12px' }}>
            Ready to manage transit complaints?
          </h2>
          <p style={{ color: '#64748b', fontSize: 15, margin: 0, maxWidth: 480 }}>
            Sign in to the admin portal to view, prioritize, assign, and resolve complaints across Mumbai's transport network.
          </p>
        </div>
        <button
          onClick={() => navigate('login')}
          style={{
            padding: '14px 36px', borderRadius: 10, border: 'none', whiteSpace: 'nowrap',
            background: '#4F46E5', color: 'white', fontWeight: 700, fontSize: 15,
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(79,70,229,0.28)',
            transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#4338ca'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.transform = 'none' }}
        >
          Admin Login →
        </button>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#f8f9ff', borderTop: '1px solid #ebebf5', padding: '24px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="7" width="20" height="8" rx="2" stroke="white" strokeWidth="1.8" fill="none"/>
              <circle cx="7" cy="11" r="1.2" fill="white"/>
              <circle cx="17" cy="11" r="1.2" fill="white"/>
              <path d="M3 17l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>© 2024 MahaTransit AI. All rights reserved.</span>
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <span key={l} style={{ color: '#94a3b8', fontSize: 13, cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#4F46E5'}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            >{l}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}
