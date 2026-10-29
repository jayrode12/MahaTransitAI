import { useState } from 'react'
import cityscapeImg from '@/imports/image-6.png'
import { api } from '../services/api'

export default function Register({ onNavigate, onLogin }) {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      const msg = 'Passwords do not match.'
      setError(msg)
      alert(`⚠️ Validation: ${msg}`)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const user = await api.auth.register({
        full_name: form.name,
        email: form.email,
        phone: form.mobile,
        password: form.password,
        preferred_language: 'en',
      })
      if (onLogin) onLogin(user)
      else onNavigate('dashboard')
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.'
      setError(msg)
      alert(`⚠️ Registration Failed: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter',sans-serif" }}>
      {/* Left panel */}
      <div style={{
        width: '42%', minHeight: '100vh',
        background: 'linear-gradient(160deg, #3730A3 0%, #4F46E5 50%, #6366F1 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 40px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: 40, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ textAlign: 'center', marginBottom: 32, zIndex: 1 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', border: '1.5px solid rgba(255,255,255,0.3)',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="7" width="20" height="8" rx="2" stroke="white" strokeWidth="1.8" fill="none"/>
              <circle cx="7" cy="11" r="1.2" fill="white"/>
              <circle cx="17" cy="11" r="1.2" fill="white"/>
              <path d="M3 17l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 24, color: 'white', marginBottom: 6 }}>MahaTransit</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }}>Smart Complaint Management System</p>
        </div>

        <div style={{ width: '100%', maxWidth: 300, borderRadius: 14, overflow: 'hidden', zIndex: 1 }}>
          <img src={cityscapeImg} alt="Mumbai metro cityscape" style={{ width: '100%', display: 'block' }} />
        </div>

        <div style={{ marginTop: 28, zIndex: 1 }}>
          {[
            ['✓', 'Smart automated complaint categorization'],
            ['✓', 'Real-time status tracking across Metro, BEST & Locals'],
            ['✓', 'Direct forwarding to transport authorities'],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: 'white', fontSize: 11, fontWeight: 700,
              }}>{icon}</div>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13.5 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel – form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '36px 48px', background: '#F8FAFF', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 26, color: '#1E293B', marginBottom: 6 }}>
              Create an account
            </h2>
            <p style={{ color: '#64748B', fontSize: 13.5 }}>Join MahaTransit to file and track your complaints</p>
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
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Full Name*</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Rahul Sharma" required style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email Address*</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Mobile Number (Optional)</label>
              <input type="tel" value={form.mobile} onChange={set('mobile')} placeholder="+91 9876543210" style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Password*</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min 6 chars" required style={{ ...inputStyle, paddingRight: 36 }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                    {showPass ? '👁️' : '🔒'}
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Confirm Password*</label>
                <input type={showPass ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} placeholder="Confirm" required style={inputStyle} />
              </div>
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
              {loading ? 'Creating Account…' : 'Register Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13.5, color: '#64748B' }}>
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 600, cursor: 'pointer', fontSize: 13.5, fontFamily: "'Inter',sans-serif" }}
            >
              Sign in
            </button>
          </p>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
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

const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5 }
const inputStyle = {
  width: '100%', padding: '10px 13px', borderRadius: 10,
  border: '1.5px solid #E2E8F0', background: 'white',
  fontSize: 13.5, color: '#1E293B', outline: 'none',
  boxSizing: 'border-box', fontFamily: "'Inter',sans-serif",
}
