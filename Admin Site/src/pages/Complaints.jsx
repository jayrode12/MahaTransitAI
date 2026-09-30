import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import api from '../services/api.js'

const THUMBS = [
  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=56&h=56&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1570129477492-45c003dc62c5?w=56&h=56&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=56&h=56&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=56&h=56&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1581362072978-14998d01fdaa?w=56&h=56&fit=crop&auto=format',
]

const PRI = {
  Critical: { text: '#dc2626', bg: '#fef2f2', dot: '#dc2626', bar: '#dc2626' },
  High:     { text: '#ea580c', bg: '#fff7ed', dot: '#ea580c', bar: '#ea580c' },
  Medium:   { text: '#d97706', bg: '#fffbeb', dot: '#f59e0b', bar: '#f59e0b' },
  Low:      { text: '#16a34a', bg: '#f0fdf4', dot: '#22c55e', bar: '#22c55e' },
}

const STA = {
  'Under Investigation': { text: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' },
  'Assigned':            { text: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  'In Progress':         { text: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  'Resolved':            { text: '#15803d', bg: '#dcfce7', border: '#86efac' },
}

const SEL = {
  border: '1.5px solid #e8eef6', borderRadius: 7, padding: '7px 24px 7px 10px',
  fontSize: 13, color: '#374151', background: 'white', cursor: 'pointer', outline: 'none',
}

function PriorityBar({ pct, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
      <div style={{ width: 72, height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af' }}>{pct}%</span>
    </div>
  )
}

export default function Complaints({ navigate, onLogout, adminUser }) {
  const modeKey = (adminUser?.transit_mode || 'metro').toLowerCase()
  const [complaintList, setComplaintList] = useState([])
  const [loading, setLoading] = useState(true)

  const [tab, setTab] = useState('all')
  const [lineFilter, setLineFilter] = useState('All')
  const [priFilter, setPriFilter] = useState('All Priorities')
  const [staFilter, setStaFilter] = useState('All Statuses')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState('priority_date')
  const [page, setPage] = useState(1)

  const lineOptions = modeKey === 'bus'
    ? ['All', 'BEST 604', 'BEST 221', 'BEST 310', 'BEST 125']
    : modeKey === 'train'
    ? ['All', 'Western Line', 'Central Line', 'Harbour Line']
    : ['All', 'Line 1', 'Line 2A', 'Line 2B', 'Line 3', 'Line 7']

  async function loadComplaints() {
    setLoading(true)
    try {
      const transitModeParam = modeKey === 'all' ? undefined : modeKey
      const res = await api.complaints.list({
        transit_mode: transitModeParam,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        sort_by: sortBy,
        limit: 100,
      })
      if (res && res.items) {
        setComplaintList(res.items)
      }
    } catch (e) {
      console.error('Failed to load complaints from backend:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComplaints()
  }, [modeKey, fromDate, toDate, sortBy])

  // Filter and sort rows
  const priorityOrder = { Critical: 1, High: 2, Medium: 3, Low: 4 }

  let rows = complaintList.filter(c => {
    if (tab === 'critical' && c.priority !== 'Critical') return false
    if (tab === 'high' && c.priority !== 'High') return false
    if (tab === 'medium' && c.priority !== 'Medium') return false
    if (tab === 'low' && c.priority !== 'Low') return false

    if (priFilter !== 'All Priorities' && c.priority !== priFilter) return false
    if (staFilter !== 'All Statuses' && c.status !== staFilter) return false
    if (lineFilter !== 'All' && !c.line.toLowerCase().includes(lineFilter.toLowerCase())) return false

    if (fromDate && c.created_at) {
      if (new Date(c.created_at) < new Date(fromDate)) return false
    }
    if (toDate && c.created_at) {
      const endD = new Date(toDate)
      endD.setHours(23, 59, 59, 999)
      if (new Date(c.created_at) > endD) return false
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      const match =
        (c.id || '').toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q) ||
        (c.desc || '').toLowerCase().includes(q) ||
        (c.line || '').toLowerCase().includes(q) ||
        (c.passenger_name || '').toLowerCase().includes(q)
      if (!match) return false
    }

    return true
  })

  // Sort by Priority (Critical first) and Date (Newest first)
  rows.sort((a, b) => {
    if (sortBy === 'priority_date') {
      const pa = priorityOrder[a.priority] || 5
      const pb = priorityOrder[b.priority] || 5
      if (pa !== pb) return pa - pb
    }
    const da = a.created_at ? new Date(a.created_at).getTime() : 0
    const db = b.created_at ? new Date(b.created_at).getTime() : 0
    return db - da
  })

  const PAGE_SIZE = 8
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const tabsConfig = [
    { id: 'all',      label: 'All Active', count: complaintList.length },
    { id: 'critical', label: 'Critical Priority', count: complaintList.filter(c => c.priority === 'Critical').length },
    { id: 'high',     label: 'High Priority', count: complaintList.filter(c => c.priority === 'High').length },
    { id: 'medium',   label: 'Medium Priority', count: complaintList.filter(c => c.priority === 'Medium').length },
    { id: 'low',      label: 'Low Priority', count: complaintList.filter(c => c.priority === 'Low').length },
  ]

  const tabColors = {
    all:      { bg: '#e0e7ff', text: '#4f46e5' },
    critical: { bg: '#fee2e2', text: '#dc2626' },
    high:     { bg: '#ffedd5', text: '#ea580c' },
    medium:   { bg: '#fffbeb', text: '#d97706' },
    low:      { bg: '#f0fdf4', text: '#16a34a' },
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fb', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar currentPage="complaints" navigate={navigate} onLogout={onLogout} adminUser={adminUser} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar currentPage="complaints" navigate={navigate} onLogout={onLogout} adminUser={adminUser} />

        <div style={{ padding: '28px 32px', flex: 1 }}>

          {/* Header */}
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>
                  Active Complaints Queue
                </h1>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', padding: '3px 10px', borderRadius: 20 }}>
                  {adminUser?.department_name || modeKey.toUpperCase()}
                </span>
              </div>
              <p style={{ color: '#6b7280', margin: '3px 0 0', fontSize: 13 }}>
                Ordered by AI Priority (Critical & High first) and latest submission date.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={loadComplaints}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, border: '1.5px solid #CBD5E1',
                  background: 'white', color: '#374151', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                Sync Database
              </button>
            </div>
          </div>

          {/* Filters Row with Working Date Range & Sort */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 20, background: 'white', padding: '16px 20px', borderRadius: 12, border: '1px solid #e8eef6' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Search</span>
              <input
                type="text"
                placeholder="Ticket / Keyword / Passenger..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                style={{ border: '1.5px solid #e8eef6', borderRadius: 7, padding: '7px 12px', fontSize: 13, outline: 'none', color: '#1f2937', minWidth: 200 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>From Date</span>
              <input
                type="date"
                value={fromDate}
                onChange={e => { setFromDate(e.target.value); setPage(1) }}
                style={{ border: '1.5px solid #e8eef6', borderRadius: 7, padding: '6px 10px', fontSize: 13, outline: 'none', color: '#374151' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>To Date</span>
              <input
                type="date"
                value={toDate}
                onChange={e => { setToDate(e.target.value); setPage(1) }}
                style={{ border: '1.5px solid #e8eef6', borderRadius: 7, padding: '6px 10px', fontSize: 13, outline: 'none', color: '#374151' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {modeKey === 'bus' ? 'Bus Route' : 'Corridor / Line'}
              </span>
              <select style={SEL} value={lineFilter} onChange={e => { setLineFilter(e.target.value); setPage(1) }}>
                {lineOptions.map(o => <option key={o} value={o}>{o === 'All' ? 'All Lines / Routes' : o}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Order By</span>
              <select style={SEL} value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1) }}>
                <option value="priority_date">Priority First, then Date</option>
                <option value="date">Latest Date First</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</span>
              <select style={SEL} value={staFilter} onChange={e => { setStaFilter(e.target.value); setPage(1) }}>
                {['All Statuses', 'Under Investigation', 'Assigned', 'In Progress', 'Resolved'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <button
              onClick={() => { setPriFilter('All Priorities'); setStaFilter('All Statuses'); setLineFilter('All'); setSearch(''); setFromDate(''); setToDate(''); setSortBy('priority_date'); setTab('all'); setPage(1) }}
              style={{ padding: '7px 14px', borderRadius: 7, border: '1.5px solid #e8eef6', background: 'white', color: '#4f46e5', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              Reset Filters
            </button>
          </div>

          {/* Priority Tabs */}
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
                <span style={{ background: tabColors[id].bg, color: tabColors[id].text, fontWeight: 700, fontSize: 11, padding: '1px 7px', borderRadius: 10 }}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Table card */}
          <div style={{ background: 'white', border: '1px solid #e8eef6', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 130px 140px 120px 52px', padding: '10px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfd' }}>
              {['COMPLAINT TICKET', 'DESCRIPTION & DETAILS', 'DATE & TIME', 'AI PRIORITY', 'STATUS', 'ACTION'].map((h, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: 0.7 }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Loading complaints from database...</div>
            ) : pagedRows.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No complaints match the selected filters or date range.</div>
            ) : pagedRows.map((c) => {
              const p = PRI[c.priority] || PRI.Medium
              const s = STA[c.status] ?? { text: '#475569', bg: '#f1f5f9', border: '#e2e8f0' }
              return (
                <div
                  key={c.id || c.ticket_number}
                  onClick={() => navigate('details', { id: c.ticket_number || c.id })}
                  style={{ display: 'grid', gridTemplateColumns: '260px 1fr 130px 140px 120px 52px', padding: '14px 20px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', alignItems: 'center', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Complaint ID */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <img src={THUMBS[c.t || 0]} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1f2937', fontFamily: 'monospace' }}>
                        {c.ticket_number || c.id}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.dot }} />
                        <span style={{ fontSize: 11, color: '#64748b' }}>{c.transport} · {c.line}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ paddingRight: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                      {c.desc}
                    </div>
                    {c.passenger_name && (
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>
                        Passenger: {c.passenger_name}
                      </div>
                    )}
                  </div>

                  {/* Date & time */}
                  <div>
                    <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{c.date}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{c.time}</div>
                  </div>

                  {/* Priority + bar */}
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 5, background: p.bg, color: p.text }}>
                      {c.priority}
                    </span>
                    <PriorityBar pct={c.pct} color={p.bar} />
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 20, background: s.bg, color: s.text, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
                      {c.status}
                    </span>
                  </div>

                  {/* Action */}
                  <div>
                    <button
                      onClick={e => { e.stopPropagation(); navigate('details', { id: c.ticket_number || c.id }) }}
                      style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e8eef6', background: 'white', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      title="Inspect & Take Action"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Pagination */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, rows.length)}–{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length} agency complaints
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} style={{
                    width: 30, height: 30, borderRadius: 7, border: '1px solid #e8eef6',
                    background: page === i + 1 ? '#4f46e5' : 'white',
                    color: page === i + 1 ? 'white' : '#6b7280',
                    fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
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
