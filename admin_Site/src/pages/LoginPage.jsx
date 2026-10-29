import { useState } from 'react'
import MumbaiCityscape from '../components/MumbaiCityscape.jsx'
import api from '../services/api.js'

export default function LoginPage({ navigate, onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLoginSubmit = async (customUsername, customPassword) => {
    const userToLogin = customUsername || username
    const pwToLogin = customPassword || password

    if (!userToLogin.trim()) {
      const msg = 'Please enter username or email.'
      setError(msg)
      alert(`⚠️ Authentication Notice: ${msg}`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await api.auth.login({
        email: userToLogin.trim(),
        password: pwToLogin,
      })
      if (onLogin) onLogin(data)
    } catch (err) {
      console.error('Login error:', err)
      const msg = err.message || 'Login failed. Please verify credentials.'
      setError(msg)
      alert(`⚠️ Official Login Failed: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleLoginSubmit()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Left panel */}
      <div style={{
        width: '45%', minWidth: 360,
        background: 'linear-gradient(145deg, #3730a3 0%, #4f46e5 55%, #6366f1 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -100, left: -100,
          width: 340, height: 340, borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, right: -80,
          width: 260, height: 260, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        }} />

        {/* Brand mark */}
        <div style={{
          width: 60, height: 60, background: 'rgba(255,255,255,0.18)',
          borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.25)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="7" width="20" height="8" rx="2" stroke="white" strokeWidth="1.8" fill="none"/>
            <circle cx="7" cy="11" r="1.2" fill="white"/>
            <circle cx="17" cy="11" r="1.2" fill="white"/>
            <path d="M3 17l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 style={{ color: 'white', fontWeight: 800, fontSize: 26, margin: '0 0 8px', textAlign: 'center', lineHeight: 1.3 }}>
          MahaTransit
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500, margin: '0 0 36px', textAlign: 'center' }}>
          Smart Complaint Management System
        </p>

        {/* Illustration card */}
        <div style={{
          background: 'rgba(219,232,247,0.18)',
          borderRadius: 20, overflow: 'hidden',
          width: '100%', maxWidth: 360,
          border: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(4px)',
        }}>
          <MumbaiCityscape />
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        flex: 1,
        background: '#f8faff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px',
      }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>
            Officer Sign In
          </h2>
          <p style={{ color: '#64748b', fontSize: 14.5, margin: '0 0 24px' }}>
            Sign in with your transit department credentials (handle or email).
          </p>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', padding: '12px 16px', borderRadius: 8,
              fontSize: 13.5, marginBottom: 20,
            }}>
              {error}
            </div>
          )}


          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Username / Email */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13.5, color: '#1e293b', marginBottom: 7 }}>
                Username / Handle / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. metro, best, locals, or admin"
                required
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1.5px solid #e2e8f0', borderRadius: 10,
                  fontSize: 14.5, color: '#1e293b', background: 'white',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: 11.5, color: '#64748B', marginTop: 4, display: 'block' }}>
                Use <strong>metro</strong>, <strong>best</strong>, <strong>locals</strong>, or <strong>admin</strong>
              </span>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13.5, color: '#1e293b', marginBottom: 7 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%', padding: '12px 46px 12px 14px',
                    border: '1.5px solid #e2e8f0', borderRadius: 10,
                    fontSize: 14.5, color: '#1e293b', background: 'white',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 0,
                  }}
                >
                  {showPw ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? '#94A3B8' : '#4f46e5', color: 'white',
                border: 'none', borderRadius: 10,
                fontWeight: 700, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer', marginTop: 6,
                boxShadow: '0 4px 16px rgba(79,70,229,0.35)',
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In as Officer'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              onClick={() => navigate('landing')}
              style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 13, cursor: 'pointer' }}
            >
              ← Back to Portal Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
