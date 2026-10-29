import { useState } from 'react'
import cityscapeImg from '@/imports/image-6.png'
import { api } from '../services/api'

export default function Login({ onNavigate, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const user = await api.auth.login({ email, password })
      if (onLogin) onLogin(user)
      else onNavigate('dashboard')
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.'
      setError(msg)
      alert(`⚠️ Login Failed: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

      {/* Left panel */}
      <div style={{
        width: '45%', minHeight: '100vh',
        background: 'linear-gradient(160deg, #3730A3 0%, #4F46E5 50%, #6366F1 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 48px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40, zIndex: 1 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', border: '1.5px solid rgba(255,255,255,0.3)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="7" width="20" height="8" rx="2" stroke="white" strokeWidth="1.8" fill="none"/>
              <circle cx="7" cy="11" r="1.2" fill="white"/>
              <circle cx="17" cy="11" r="1.2" fill="white"/>
              <path d="M3 17l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 24, color: 'white', marginBottom: 8, textAlign: 'center', lineHeight: 1.3 }}>
            MahaTransit
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }}>Smart Complaint Management System</p>
        </div>

        {/* Cityscape illustration */}
        <div style={{ width: '100%', maxWidth: 340, borderRadius: 16, overflow: 'hidden', zIndex: 1 }}>
          <img src={cityscapeImg} alt="Mumbai metro cityscape" style={{ width: '100%', display: 'block' }} />
        </div>

        <div style={{ marginTop: 32, textAlign: 'center', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: 500, lineHeight: 1.6 }}>
            Mumbai's unified platform for<br />reporting public transport complaints.
          </p>
        </div>

        {/* Floating stats */}
        <div style={{ display: 'flex', gap: 16, marginTop: 32, zIndex: 1 }}>
          {[['60+', 'Active Grievances'], ['3', 'Transport Networks'], ['24/7', 'Smart Processing']].map(([n, l]) => (
            <div key={l} style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12, padding: '12px 16px', textAlign: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 20, color: 'white' }}>{n}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel – form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 48px', background: '#F8FAFF',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 28, color: '#1E293B', marginBottom: 8 }}>
              Citizen Sign In
            </h2>
            <p style={{ color: '#64748B', fontSize: 14 }}>Access your complaint dashboard and history</p>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, background: '#FEF2F2',
              border: '1px solid #FECACA', color: '#B91C1C', fontSize: 13.5,
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  border: '1.5px solid #E2E8F0', background: 'white',
                  fontSize: 14, color: '#1E293B', outline: 'none',
                  boxSizing: 'border-box', fontFamily: "'Inter',sans-serif",
                }}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%', padding: '11px 42px 11px 14px', borderRadius: 10,
                    border: '1.5px solid #E2E8F0', background: 'white',
                    fontSize: 14, color: '#1E293B', outline: 'none',
                    boxSizing: 'border-box', fontFamily: "'Inter',sans-serif",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                >
                  {showPass ? '👁️' : '🔒'}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 20, marginTop: 6 }}>
              <button type="button" onClick={() => alert('Password reset link sent to registered email.')} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                background: loading ? '#93C5FD' : '#4F46E5', color: 'white',
                fontWeight: 700, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Inter',sans-serif",
                boxShadow: '0 6px 20px rgba(79,70,229,0.3)',
              }}
            >
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5, color: '#64748B' }}>
            Don't have an account?{' '}
            <button
              onClick={() => onNavigate('register')}
              style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 600, cursor: 'pointer', fontSize: 13.5, fontFamily: "'Inter',sans-serif" }}
            >
              Register here
            </button>
          </p>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={() => onNavigate('landing')}
              style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 12.5, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
