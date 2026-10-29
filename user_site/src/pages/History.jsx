import { useState, useEffect } from 'react'
import { badgeStyle } from '../data/complaints'
import AppLayout from '../components/AppLayout'
import api from '../services/api'

const transportIcons = {
  Metro: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Bus: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6M3 6l9-4 9 4v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/></svg>,
  Railway: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="14" rx="2"/><path d="M4 12h16"/></svg>,
}

const statusTabs = [
  { label: 'All Complaints', value: 'All' },
  { label: 'Pending', value: 'Pending' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Resolved', value: 'Resolved' },
  { label: 'Closed', value: 'Closed' },
]

const PAGE_SIZE = 6

export default function History({ onNavigate, onViewComplaint, onLogout, currentUser }) {
  const [transportFilter, setTransportFilter] = useState('All')
  const [activeTab, setActiveTab] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState('date_priority')
  const [page, setPage] = useState(1)
  const [complaintList, setComplaintList] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadComplaints() {
    setLoading(true)
    try {
      const citizenId = currentUser?.user_id || currentUser?.id
      if (!citizenId) {
        setComplaintList([])
        setLoading(false)
        return
      }
      const params = {
        citizen_id: citizenId,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        sort_by: sortBy,
        limit: 100,
      }
      const res = await api.complaints.list(params)
      setComplaintList(res?.items || [])
    } catch (e) {
      console.warn('Could not load complaints from API:', e)
      setComplaintList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComplaints()
  }, [fromDate, toDate, sortBy, currentUser])


  const priorityOrder = { Critical: 1, High: 2, Medium: 3, Low: 4 }

  const filtered = complaintList.filter((c) => {
    const matchTransport =
      transportFilter === 'All' ||
      (c.transport || '').toLowerCase() === transportFilter.toLowerCase() ||
      (transportFilter === 'Railway' && (c.transport === 'Railway' || c.rawTransitMode === 'train'))

    let matchStatus = true
    if (activeTab === 'Pending') {
      matchStatus = ['submitted', 'assigned', 'pending', 'accepted'].includes((c.status || '').toLowerCase())
    } else if (activeTab === 'In Progress') {
      matchStatus = (c.status || '').toLowerCase().includes('progress')
    } else if (activeTab === 'Resolved') {
      matchStatus = (c.status || '').toLowerCase() === 'resolved'
    } else if (activeTab === 'Closed') {
      matchStatus = ['closed', 'rejected'].includes((c.status || '').toLowerCase())
    }

    if (fromDate && c.created_at) {
      if (new Date(c.created_at) < new Date(fromDate)) return false
    }
    if (toDate && c.created_at) {
      const endD = new Date(toDate)
      endD.setHours(23, 59, 59, 999)
      if (new Date(c.created_at) > endD) return false
    }

    let matchSearch = true
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      matchSearch =
        (c.id || '').toLowerCase().includes(q) ||
        (c.ticket_number || '').toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.station || '').toLowerCase().includes(q)
    }

    return matchTransport && matchStatus && matchSearch
  })

  // Sort: Date wise first (Newest), then Assigned Priority (Critical -> High -> Medium -> Low)
  filtered.sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0
    const db = b.created_at ? new Date(b.created_at).getTime() : 0
    const pa = priorityOrder[a.priority] || 5
    const pb = priorityOrder[b.priority] || 5

    if (sortBy === 'date_priority' || sortBy === 'date' || !sortBy) {
      if (db !== da) return db - da
      return pa - pb
    } else if (sortBy === 'priority_date') {
      if (pa !== pb) return pa - pb
      return db - da
    } else if (sortBy === 'date_asc') {
      if (da !== db) return da - db
      return pa - pb
    }
    return db - da
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const countFor = (s) => {
    if (s === 'All') return complaintList.length
    if (s === 'Pending') {
      return complaintList.filter((c) => ['submitted', 'assigned', 'pending', 'accepted'].includes((c.status || '').toLowerCase())).length
    }
    if (s === 'In Progress') {
      return complaintList.filter((c) => (c.status || '').toLowerCase().includes('progress')).length
    }
    if (s === 'Resolved') {
      return complaintList.filter((c) => (c.status || '').toLowerCase() === 'resolved').length
    }
    if (s === 'Closed') {
      return complaintList.filter((c) => ['closed', 'rejected'].includes((c.status || '').toLowerCase())).length
    }
    return 0
  }

  return (
    <AppLayout currentPage="history" onNavigate={onNavigate} onLogout={onLogout}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 24, color: '#1E293B', marginBottom: 4 }}>
            Complaint History
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748B' }}>
            View, search, and track all complaints across Mumbai Metro, BEST & Local Trains by date and priority.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={loadComplaints}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10, border: '1px solid #CBD5E1',
              background: 'white', color: '#475569', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refresh
          </button>
          <button
            onClick={() => onNavigate('new-complaint')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10, border: 'none',
              background: '#4F46E5', color: 'white', fontSize: 13, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + New Complaint
          </button>
        </div>
      </div>

      {/* Filters with Working Date Range & Sort */}
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #E8EEFF',
        padding: '18px 20px', marginBottom: 16,
        boxShadow: '0 1px 6px rgba(79,70,229,0.05)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5', marginBottom: 14 }}>Search, Date Filter & Sorting</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
          {/* Search box */}
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Search Grievances</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8, border: '1px solid #CBD5E1', background: 'white' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Search ticket, station, keyword..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, color: '#1E293B', fontFamily: "'Inter',sans-serif" }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 14 }}>×</button>
              )}
            </div>
          </div>

          {/* From Date */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>From Date</div>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
              style={{ border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, outline: 'none', color: '#374151' }}
            />
          </div>

          {/* To Date */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>To Date</div>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1) }}
              style={{ border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, outline: 'none', color: '#374151' }}
            />
          </div>

          {/* Sort By */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Sort Order</div>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1) }}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', background: 'white', fontSize: 12.5, color: '#475569', outline: 'none' }}
            >
              <option value="date_priority">Date Wise, then Assigned Priority</option>
              <option value="priority_date">Priority First, then Date</option>
              <option value="date_asc">Oldest Date First</option>
            </select>
          </div>

          {/* Transport toggle */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Transit Mode</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'Metro', 'Bus', 'Railway'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setTransportFilter(t); setPage(1) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    border: transportFilter === t ? '1.5px solid #4F46E5' : '1px solid #E2E8F0',
                    background: transportFilter === t ? '#EEF2FF' : 'white',
                    color: transportFilter === t ? '#4F46E5' : '#475569',
                    fontFamily: "'Inter',sans-serif",
                  }}
                >
                  {t !== 'All' && <span>{transportIcons[t]}</span>}
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Status</div>
            <select
              onChange={(e) => { setActiveTab(e.target.value); setPage(1) }}
              value={activeTab}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', background: 'white', fontSize: 12.5, color: '#475569', outline: 'none' }}
            >
              <option value="All">All Status</option>
              {['Pending','In Progress','Resolved','Closed'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <button
            onClick={() => { setTransportFilter('All'); setActiveTab('All'); setSearchQuery(''); setFromDate(''); setToDate(''); setSortBy('priority_date'); setPage(1) }}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Tab pills */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E8EEFF', marginBottom: 0 }}>
        {statusTabs.map((tab) => {
          const active = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setPage(1) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? '#4F46E5' : '#64748B',
                background: 'transparent', border: 'none', cursor: 'pointer',
                position: 'relative', fontFamily: "'Inter',sans-serif",
              }}
            >
              {tab.label}
              <span style={{
                padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                background: active ? '#EEF2FF' : '#F1F5F9',
                color: active ? '#4F46E5' : '#94A3B8',
              }}>
                {countFor(tab.value)}
              </span>
              {active && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#4F46E5', borderRadius: '2px 2px 0 0' }} />}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '0 0 16px 16px', border: '1px solid #E8EEFF', borderTop: 'none', boxShadow: '0 1px 6px rgba(79,70,229,0.05)' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '44px 1.4fr 2.2fr 1.4fr 1.2fr 44px', padding: '12px 20px', borderBottom: '1px solid #F0F4FF', gap: 12 }}>
          {['', 'Complaint Ticket', 'Grievance / Subject', 'Date & Time', 'Status / Priority', 'Action'].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748B', fontSize: 14 }}>
            Loading complaints from MahaTransit database...
          </div>
        ) : paged.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13.5 }}>
            No complaints found matching current filters or date range.
          </div>
        ) : (
          paged.map((c, i) => (
            <div
              key={c.id || c.ticket_number || i}
              style={{
                display: 'grid', gridTemplateColumns: '44px 1.4fr 2.2fr 1.4fr 1.2fr 44px',
                padding: '14px 20px', gap: 12, alignItems: 'center',
                borderBottom: i < paged.length - 1 ? '1px solid #F8FAFF' : 'none',
              }}
            >
              {c.image ? (
                <img
                  src={c.image}
                  alt="Complaint"
                  style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', background: '#E0E7FF' }}
                />
              ) : (
                <div style={{ width: 38, height: 38, borderRadius: 8, background: '#EEF2FF', border: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                  {transportIcons[c.transport] || transportIcons['Metro']}
                </div>
              )}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', fontFamily: 'monospace' }}>
                  {c.ticket_number || c.id}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#64748B', marginTop: 3 }}>
                  {transportIcons[c.transport] || transportIcons['Metro']}
                  <span>{c.transport} • {c.line || 'Main'}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1E293B' }}>{c.title}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                  {(c.description || '').substring(0, 70)}…
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#475569' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {c.date}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94A3B8', marginTop: 3 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {c.time}
                </div>
              </div>
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, ...badgeStyle(c.status) }}>
                  {c.status}
                </span>
                {c.priority && (
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: c.priority === 'Critical' ? '#DC2626' : c.priority === 'High' ? '#D97706' : '#64748B', marginTop: 3 }}>
                    {c.priority}
                  </div>
                )}
              </div>
              <button
                onClick={() => onViewComplaint(c.ticket_number || c.id)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: '1.5px solid #C7D2FE',
                  background: '#EEF2FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="View Complaint Details"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          ))
        )}

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid #F0F4FF' }}>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} complaints
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #E2E8F0', background: 'white', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                style={{
                  width: 30, height: 30, borderRadius: 7,
                  border: '1px solid #E2E8F0',
                  background: page === i + 1 ? '#4F46E5' : 'white',
                  color: page === i + 1 ? 'white' : '#475569',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #E2E8F0', background: 'white', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
