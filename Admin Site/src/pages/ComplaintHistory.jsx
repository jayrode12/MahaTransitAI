import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import api from '../services/api.js'

const THUMBS = [
  'https://images.unsplash.com/photo-1581362072978-14998d01fdaa?w=56&h=56&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1570129477492-45c003dc62c5?w=56&h=56&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=56&h=56&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=56&h=56&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=56&h=56&fit=crop&auto=format',
]

const PRI = {
  Critical: { text: '#dc2626', bg: '#fef2f2', dot: '#dc2626' },
  High:     { text: '#ea580c', bg: '#fff7ed', dot: '#ea580c' },
  Medium:   { text: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
  Low:      { text: '#16a34a', bg: '#f0fdf4', dot: '#22c55e' },
}

const SEL = {
  border: '1.5px solid #e8eef6', borderRadius: 7, padding: '7px 28px 7px 10px',
  fontSize: 13, color: '#374151', background: 'white', cursor: 'pointer', outline: 'none',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 9px center',
}

export default function ComplaintHistory({ navigate, onLogout, adminUser }) {
  const modeKey = (adminUser?.transit_mode || 'metro').toLowerCase()
  const [complaintList, setComplaintList] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [priFilter, setPriFilter] = useState('All Priorities')
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function loadHistory() {
      setLoading(true)
      try {
        const transitModeParam = modeKey === 'all' ? undefined : modeKey
        const res = await api.complaints.list({
          transit_mode: transitModeParam,
          limit: 100,
        })
        if (res && res.items) {
          setComplaintList(res.items)
        }
      } catch (err) {
        console.error('Failed to load history:', err)
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [modeKey])

  const filtered = complaintList.filter(c => {
    if (tab === 'critical' && c.priority !== 'Critical') return false
    if (tab === 'high' && c.priority !== 'High') return false
    if (tab === 'medium' && c.priority !== 'Medium') return false
    if (tab === 'low' && c.priority !== 'Low') return false

    if (priFilter !== 'All Priorities' && c.priority !== priFilter) return false

    if (search.trim()) {
      const q = search.toLowerCase()
      const match =
        (c.id || '').toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q) ||
        (c.desc || '').toLowerCase().includes(q) ||
        (c.line || '').toLowerCase().includes(q)
      if (!match) return false
    }

    return true
  })

  const PAGE_SIZE = 8
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pagedRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const tabsConfig = [
    { id: 'all',      label: 'All Historical', count: complaintList.length },
    { id: 'critical', label: 'Critical', count: complaintList.filter(c => c.priority === 'Critical').length },
    { id: 'high',     label: 'High', count: complaintList.filter(c => c.priority === 'High').length },
    { id: 'medium',   label: 'Medium', count: complaintList.filter(c => c.priority === 'Medium').length },
    { id: 'low',      label: 'Low', count: complaintList.filter(c => c.priority === 'Low').length },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fb', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar currentPage="history" navigate={navigate} onLogout={onLogout} adminUser={adminUser} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar currentPage="history" navigate={navigate} onLogout={onLogout} adminUser={adminUser} />

        <div style={{ padding: '28px 32px', flex: 1 }}>

          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Complaint Archives & History</h1>
            <p style={{ color: '#6b7280', margin: '3px 0 0', fontSize: 13 }}>
              Comprehensive historical repository of citizen grievances filed for {adminUser?.department_name || modeKey.toUpperCase()}.
            </p>
          </div>

          {/* Filters row */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: '14px 18px', borderRadius: 12, border: '1px solid #e8eef6' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Search Archive</span>
              <input
                type="text"
                placeholder="Search ticket or keyword..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                style={{ border: '1.5px solid #e8eef6', borderRadius: 7, padding: '6px 12px', fontSize: 13, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>AI Priority</span>
              <select style={SEL} value={priFilter} onChange={e => { setPriFilter(e.target.value); setPage(1) }}>
                {['All Priorities', 'Critical', 'High', 'Medium', 'Low'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <button
              onClick={() => { setPriFilter('All Priorities'); setSearch(''); setTab('all'); setPage(1) }}
              style={{ marginTop: 18, padding: '7px 14px', borderRadius: 7, border: '1.5px solid #e8eef6', background: 'white', color: '#4f46e5', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              Reset
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #e8eef6', marginBottom: 0 }}>
            {tabsConfig.map(({ id, label, count }) => (
              <button key={id} onClick={() => { setTab(id); setPage(1) }} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', border: 'none', borderBottom: tab === id ? '2px solid #4f46e5' : '2px solid transparent',
                cursor: 'pointer', fontWeight: tab === id ? 600 : 400, fontSize: 13,
                background: 'transparent', color: tab === id ? '#4f46e5' : '#6b7280',
                transition: 'all 0.15s', marginBottom: -1,
              }}>
                {label}
                <span style={{ background: '#e0e7ff', color: '#4f46e5', fontWeight: 700, fontSize: 11, padding: '1px 7px', borderRadius: 10 }}>{count}</span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: 'white', border: '1px solid #e8eef6', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 130px 140px 110px 52px', padding: '10px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfd' }}>
              {['COMPLAINT TICKET', 'DESCRIPTION', 'DATE & TIME', 'AI PRIORITY', 'STATUS', 'ACTION'].map((h, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: 0.7 }}>{h}</div>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Loading archives from database...</div>
            ) : pagedRows.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No historical records found.</div>
            ) : pagedRows.map((c) => {
              const p = PRI[c.priority] || PRI.Medium
              return (
                <div
                  key={c.id || c.ticket_number}
                  onClick={() => navigate('details', { id: c.ticket_number || c.id })}
                  style={{ display: 'grid', gridTemplateColumns: '260px 1fr 130px 140px 110px 52px', padding: '14px 20px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <img src={THUMBS[c.t || 0]} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1f2937', fontFamily: 'monospace' }}>{c.ticket_number || c.id}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{c.transport} · {c.line}</div>
                    </div>
                  </div>

                  <div style={{ paddingRight: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{c.desc}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{c.date}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{c.time}</div>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 5, background: p.bg, color: p.text }}>{c.priority}</span>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#f1f5f9', color: '#475569' }}>{c.status}</span>
                  </div>

                  <div>
                    <button
                      onClick={e => { e.stopPropagation(); navigate('details', { id: c.ticket_number || c.id }) }}
                      style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e8eef6', background: 'white', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Pagination */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>Showing {pagedRows.length} of {filtered.length} archived records</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} style={{
                    width: 30, height: 30, borderRadius: 7, border: '1px solid #e8eef6',
                    background: page === i + 1 ? '#4f46e5' : 'white',
                    color: page === i + 1 ? 'white' : '#6b7280',
                    fontSize: 12, cursor: 'pointer',
                  }}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
