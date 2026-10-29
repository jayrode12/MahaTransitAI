import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { api } from '../services/api'
import { badgeStyle } from '../data/complaints'

export default function Dashboard({ onNavigate, onViewComplaint, onLogout, currentUser }) {
  const [complaintsList, setComplaintsList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const citizenId = currentUser?.user_id || currentUser?.id
        if (!citizenId) {
          setComplaintsList([])
          setLoading(false)
          return
        }
        const params = { limit: 50, citizen_id: citizenId }
        const res = await api.complaints.list(params)
        setComplaintsList(res?.items || [])
      } catch (err) {
        console.error('Failed to load dashboard complaints', err)
        setComplaintsList([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [currentUser])


  const ongoing = complaintsList.filter(
    (c) => c.status === 'Submitted' || c.status === 'Assigned' || c.status === 'Under Investigation' || c.status === 'In Progress'
  )
  const pending = ongoing.filter((c) => c.status === 'Submitted' || c.status === 'Under Investigation').length
  const assigned = ongoing.filter((c) => c.status === 'Assigned').length
  const inProgress = ongoing.filter((c) => c.status === 'In Progress').length
  const resolved = complaintsList.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length

  const recent = complaintsList.slice(0, 6)

  return (
    <AppLayout currentPage="dashboard" onNavigate={onNavigate} onLogout={onLogout} currentUser={currentUser}>
      {/* Welcome banner */}
      <div style={{
        borderRadius: 18, padding: '28px 32px', marginBottom: 24,
        background: 'linear-gradient(130deg, #EEF2FF 0%, #E0E7FF 100%)',
        border: '1px solid #C7D2FE',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        overflow: 'hidden', minHeight: 130, flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 28, color: '#1E293B', marginBottom: 8 }}>
            Welcome Back, {currentUser?.full_name?.split(' ')[0] || 'Passenger'}!
          </h1>
          <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Manage and track your grievances across Mumbai Metro, BEST Buses, and Suburban Trains.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onNavigate('new-complaint')}
            style={{
              padding: '11px 20px', borderRadius: 10, border: 'none',
              background: '#4F46E5', color: 'white', fontWeight: 700, fontSize: 13.5,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
              boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
            }}
          >
            <span>+</span> File New Complaint
          </button>
        </div>
      </div>

      {/* Ongoing stats */}
      <SectionHeader
        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
        title="Live Grievance Overview"
        action="View All Complaints"
        onAction={() => onNavigate('history')}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { value: ongoing.length, label: 'Active', sub: 'Complaints', color: '#4F46E5', bg: '#EEF2FF',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg> },
          { value: pending + assigned, label: 'Pending / Assigned', sub: 'Under Review', color: '#D97706', bg: '#FFFBEB',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          { value: inProgress, label: 'In Progress', sub: 'Investigation', color: '#2563EB', bg: '#EFF6FF',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg> },
          { value: resolved, label: 'Resolved / Closed', sub: 'Completed', color: '#059669', bg: '#ECFDF5',
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
        ].map((s) => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 14, border: '1px solid #E8EEFF',
            padding: '18px', display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 1px 6px rgba(79,70,229,0.05)',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 26, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3, lineHeight: 1.4 }}>{s.label}<br/>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent history */}
      <SectionHeader
        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        title="Recent Complaints"
        action="View All History"
        onAction={() => onNavigate('history')}
      />

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748B', background: 'white', borderRadius: 14 }}>
          Loading real-time complaints from database…
        </div>
      ) : recent.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748B', background: 'white', borderRadius: 14, border: '1px solid #E8EEFF' }}>
          No complaints registered yet.{' '}
          <button onClick={() => onNavigate('new-complaint')} style={{ color: '#4F46E5', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>
            File your first complaint
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {recent.map((c) => (
            <button
              key={c.id}
              onClick={() => onViewComplaint(c.ticket_number || c.dbId)}
              style={{
                background: 'white', borderRadius: 14, border: '1px solid #E8EEFF',
                padding: '16px', textAlign: 'left', cursor: 'pointer',
                boxShadow: '0 1px 6px rgba(79,70,229,0.05)',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                {c.image ? (
                  <img
                    src={c.image}
                    alt={c.title}
                    style={{ width: 78, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0, background: '#E0E7FF' }}
                  />
                ) : (
                  <div style={{ width: 78, height: 60, borderRadius: 10, background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', border: '1px solid #C7D2FE', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 3 }}>
                    <span style={{ fontSize: 20 }}>{c.transport === 'Bus' ? '🚌' : c.transport === 'Railway' ? '🚆' : '🚇'}</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase' }}>{c.transport}</span>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    marginBottom: 5, ...badgeStyle(c.status),
                  }}>
                    {c.status}
                  </span>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, color: '#1E293B' }}>{c.ticket_number || c.id}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.title}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {c.date} | {c.time}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <span style={{ fontWeight: 600, color: '#4F46E5' }}>{c.transport}</span> · {c.station}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7D2FE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  )
}

function SectionHeader({ icon, title, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 16, color: '#1E293B' }}>{title}</h2>
      </div>
      <button onClick={onAction} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Inter',sans-serif" }}>
        {action}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </button>
    </div>
  )
}
