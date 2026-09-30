import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import api from '../services/api.js'

function PriorityGauge({ pct = 72, priority = 'High' }) {
  const r = 68
  const cx = 110, cy = 88
  const toRad = d => (d * Math.PI) / 180

  const arc = (a, rr) => {
    const rad = toRad(a)
    return { x: cx + rr * Math.cos(rad), y: cy + rr * Math.sin(rad) }
  }

  const segs = [
    { color: '#22c55e', from: 180, to: 240 },
    { color: '#f59e0b', from: 240, to: 300 },
    { color: '#ef4444', from: 300, to: 360 },
  ]

  const needleAngle = 180 + Math.min(100, Math.max(0, pct)) * 1.8
  const needleEnd = arc(needleAngle, 52)

  const describeArc = (a1, a2, rr) => {
    const s = arc(a1, rr), e = arc(a2, rr)
    const large = a2 - a1 > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${rr} ${rr} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const priorityColor = priority === 'Critical' ? '#dc2626' : priority === 'High' ? '#ea580c' : priority === 'Medium' ? '#d97706' : '#16a34a'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 220 155" style={{ width: 220, height: 155, display: 'block', overflow: 'visible' }}>
        {/* Background Arc */}
        <path d={describeArc(180, 360, r)} fill="none" stroke="#f1f5f9" strokeWidth={16} />
        {/* Color segments */}
        {segs.map(({ color, from, to }) => (
          <path key={color} d={describeArc(from, to, r)} fill="none" stroke={color} strokeWidth={16} strokeLinecap="round" />
        ))}
        {segs.map(({ color, from, to }) => (
          <path key={color + 'b'} d={describeArc(from, to, r)} fill="none" stroke={color} strokeWidth={16} strokeLinecap="butt" />
        ))}
        {/* Indicator Needle */}
        <line x1={cx} y1={cy} x2={needleEnd.x} y2={needleEnd.y} stroke="#1e1b4b" strokeWidth={3.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={7} fill="#1e1b4b" stroke="#ffffff" strokeWidth={2} />

        {/* Clear Centered Percentage Meter */}
        <text x={cx} y={cy + 34} textAnchor="middle" fontSize={26} fontWeight="800" fill="#1e1b4b">
          {pct}%
        </text>
        {/* Clear Priority Label with matching color */}
        <text x={cx} y={cy + 52} textAnchor="middle" fontSize={13} fontWeight="700" fill={priorityColor}>
          {priority} Priority
        </text>
      </svg>
    </div>
  )
}

export default function ComplaintDetails({ navigate, params = {}, onLogout, adminUser }) {
  const [complaint, setComplaint] = useState(null)
  const [similarComplaints, setSimilarComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionType, setActionType] = useState('Maintenance')
  const [targetStatus, setTargetStatus] = useState('In Progress')
  const [comment, setComment] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)
  const [actionSuccessMsg, setActionSuccessMsg] = useState('')
  const [modalImage, setModalImage] = useState(null)
  const [applyingSimilarId, setApplyingSimilarId] = useState(null)

  const complaintId = params.id || 'CMP-2024-0051'

  useEffect(() => {
    async function loadComplaint() {
      setLoading(true)
      try {
        let res = null
        try {
          res = await api.complaints.getById(complaintId)
        } catch {
          const list = await api.complaints.list({ search: complaintId, limit: 1 })
          if (list && list.items && list.items.length > 0) {
            res = list.items[0]
          }
        }
        if (res) {
          setComplaint(res)
          setTargetStatus(res.status === 'Resolved' ? 'Resolved' : 'In Progress')

          // Fetch similar complaints in the same transit corridor
          try {
            const similarRes = await api.complaints.list({
              transit_mode: res.rawTransitMode || undefined,
              limit: 8,
            })
            if (similarRes?.items) {
              const currentId = res.dbId || res.id
              const filtered = similarRes.items.filter(item => (item.dbId || item.id) !== currentId).slice(0, 4)
              setSimilarComplaints(filtered)
            }
          } catch (simErr) {
            console.warn('Could not fetch similar complaints:', simErr)
          }
        }
      } catch (err) {
        console.error('Failed to load complaint details:', err)
      } finally {
        setLoading(false)
      }
    }
    loadComplaint()
  }, [complaintId])

  const actionTypes = [
    { id: 'Maintenance', icon: '🔧', desc: 'Infrastructure, equipment or mechanical repairs' },
    { id: 'Security',    icon: '🛡️', desc: 'Safety, crowd control or security enforcement' },
    { id: 'Sanitation',  icon: '🧹', desc: 'Cleanliness, garbage removal or deep sanitization' },
  ]

  async function handleActionSubmit(e) {
    if (e) e.preventDefault()
    if (!complaint) return

    setSubmittingAction(true)
    setActionSuccessMsg('')

    try {
      const backendStatusMap = {
        'Under Investigation': 'assigned',
        'Assigned': 'assigned',
        'In Progress': 'in_progress',
        'Resolved': 'resolved',
      }
      const newBackendStatus = backendStatusMap[targetStatus] || 'in_progress'

      // Update complaint status in database
      await api.complaints.update(complaint.dbId || complaint.id, {
        status: newBackendStatus,
        assigned_to_id: adminUser?.user_id,
      })

      // Add department action remark
      const remarkText = comment.trim() || `Department action taken: [${actionType}]. Ticket status updated to ${targetStatus}.`
      await api.complaints.addRemark(complaint.dbId || complaint.id, {
        action: actionType,
        remarks: remarkText,
        performed_by_name: `${adminUser?.department_name || 'Official'} Authority`,
      })

      setComplaint(prev => ({
        ...prev,
        status: targetStatus,
        remarks: [
          ...(prev.remarks || []),
          {
            action: actionType,
            remarks: remarkText,
            performed_by_name: `${adminUser?.department_name || 'Official'} Authority`,
            created_at: new Date().toISOString(),
          },
        ],
      }))

      setComment('')
      setActionSuccessMsg(`Action recorded successfully! Status updated to "${targetStatus}".`)
      setTimeout(() => setActionSuccessMsg(''), 4500)
    } catch (err) {
      console.error('Failed to submit action:', err)
      alert(`Could not submit action: ${err.message}`)
    } finally {
      setSubmittingAction(false)
    }
  }

  // Apply action to a single similar complaint
  async function handleApplyActionToSingle(targetItem) {
    const targetId = targetItem.dbId || targetItem.id
    setApplyingSimilarId(targetId)
    try {
      const backendStatusMap = {
        'Under Investigation': 'assigned',
        'Assigned': 'assigned',
        'In Progress': 'in_progress',
        'Resolved': 'resolved',
      }
      const newBackendStatus = backendStatusMap[targetStatus] || 'in_progress'
      const remarkText = `Linked Resolution with ticket ${c.ticket_number || c.id}: Department action taken [${actionType}]. Status updated to ${targetStatus}.`

      await api.complaints.update(targetId, {
        status: newBackendStatus,
      })
      await api.complaints.addRemark(targetId, {
        action: actionType,
        remarks: remarkText,
        performed_by_name: `${adminUser?.department_name || 'Official'} Authority`,
      })

      setSimilarComplaints(prev =>
        prev.map(item =>
          (item.dbId || item.id) === targetId ? { ...item, status: targetStatus } : item
        )
      )
      setActionSuccessMsg(`Action successfully applied to similar complaint ${targetItem.ticket_number || targetItem.id}!`)
      setTimeout(() => setActionSuccessMsg(''), 4500)
    } catch (err) {
      console.error('Failed to apply action to similar complaint:', err)
      alert(`Failed to update complaint: ${err.message}`)
    } finally {
      setApplyingSimilarId(null)
    }
  }

  // Batch action: Apply action to all similar complaints
  async function handleApplyActionToAllSimilar() {
    if (!similarComplaints.length) return
    const confirmAction = window.confirm(
      `Apply action "${actionType}" (${targetStatus}) to all ${similarComplaints.length} similar complaints in this corridor?`
    )
    if (!confirmAction) return

    setSubmittingAction(true)
    try {
      const backendStatusMap = {
        'Under Investigation': 'assigned',
        'Assigned': 'assigned',
        'In Progress': 'in_progress',
        'Resolved': 'resolved',
      }
      const newBackendStatus = backendStatusMap[targetStatus] || 'in_progress'

      for (const item of similarComplaints) {
        const targetId = item.dbId || item.id
        await api.complaints.update(targetId, {
          status: newBackendStatus,
        })
        await api.complaints.addRemark(targetId, {
          action: actionType,
          remarks: `Batch action synchronized with ${c.ticket_number || c.id}: [${actionType}] -> ${targetStatus}.`,
          performed_by_name: `${adminUser?.department_name || 'Official'} Authority`,
        })
      }

      setSimilarComplaints(prev => prev.map(item => ({ ...item, status: targetStatus })))
      setActionSuccessMsg(`Batch action successfully applied to all ${similarComplaints.length} similar complaints!`)
      setTimeout(() => setActionSuccessMsg(''), 4500)
    } catch (err) {
      console.error('Failed batch action:', err)
      alert(`Error applying batch actions: ${err.message}`)
    } finally {
      setSubmittingAction(false)
    }
  }

  const c = complaint || {
    id: complaintId,
    ticket_number: complaintId,
    title: 'AC unit failure in coach',
    desc: 'Passengers reported AC malfunction during evening hours.',
    transport: 'Metro',
    line: 'Line 1 (Versova–Ghatkopar)',
    station: 'Andheri',
    direction: 'Versova → Ghatkopar',
    train_type: '—',
    bus_type: '—',
    journey_date: '21 May 2024',
    journey_time: '10:24 AM',
    passenger_name: 'Passenger',
    passenger_email: 'passenger@example.com',
    priority: 'High',
    pct: 75,
    status: 'In Progress',
    date: '21 May 2024',
    time: '10:24 AM',
    duplicate_count: 3,
    remarks: [],
  }

  // Representative evidence photos
  const fallbackPhotos = [
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1551382854-fe5497288c4c?w=600&h=400&fit=crop&auto=format',
  ]
  const imageAttachments = (c.attachments || []).filter(a => a.attachment_type === 'image' || a.file_url?.match(/\.(jpeg|jpg|png|webp)/i))
  const displayPhotos = imageAttachments.length > 0
    ? imageAttachments.map(a => a.file_url)
    : (c.evidence_images && c.evidence_images.length > 0 ? c.evidence_images : fallbackPhotos)

  // Voice note audio
  const audioAttachment = (c.attachments || []).find(a => a.attachment_type === 'audio' || a.file_url?.match(/\.(mp3|wav|ogg|webm|m4a)/i))
  const audioUrl = audioAttachment?.file_url || 'https://actions.google.com/sounds/v1/transportation/subway_door_chime.ogg'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4ff', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar currentPage="details" navigate={navigate} onLogout={onLogout} adminUser={adminUser} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <Topbar currentPage="details" navigate={navigate} onLogout={onLogout} adminUser={adminUser} />

        <div style={{ padding: '28px 36px', flex: 1 }}>
          {/* Breadcrumb + header */}
          <button
            onClick={() => navigate('complaints')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4f46e5', fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            Back to Active Complaints Queue
          </button>

          {actionSuccessMsg && (
            <div style={{
              background: '#ECFDF5', border: '1px solid #A7F3D0',
              color: '#065F46', padding: '12px 18px', borderRadius: 10,
              fontSize: 14, fontWeight: 600, marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              {actionSuccessMsg}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1e1b4b', margin: 0 }}>
                  Complaint Review & Official Action
                </h1>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, background: '#EEF2FF', color: '#4F46E5', padding: '3px 10px', borderRadius: 6 }}>
                  {c.ticket_number || c.id}
                </span>
              </div>
              <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 13.5 }}>
                Passenger submission matching {c.transport} ({c.line}) records
              </p>
            </div>
          </div>

          {/* Grid Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginBottom: 24 }}>
            {/* Left Column: Comprehensive Passenger Submission Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Passenger & Journey Details */}
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e0e7ff', padding: '22px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e1b4b', marginBottom: 14 }}>
                  1. Passenger & Journey Details
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Passenger Name</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1E293B' }}>{c.passenger_name || c.submittedBy || 'Passenger'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Contact Email</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{c.passenger_email || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Transport Mode</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#4F46E5' }}>{c.transport}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Line / Route</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{c.line}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Station / Stop</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{c.station || c.from}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Direction</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{c.direction || '—'}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>
                      {c.transport === 'Bus' ? 'Bus Type' : 'Train Type'}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>
                      {c.transport === 'Bus' ? (c.bus_type || 'AC Electric') : (c.train_type || 'Slow Local')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Journey Date</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{c.journey_date || c.date}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Journey Time</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{c.journey_time || c.time}</div>
                  </div>
                </div>
              </div>

              {/* Grievance Description & Evidence (Photos & Audio) */}
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e0e7ff', padding: '22px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e1b4b', marginBottom: 12 }}>
                  2. Grievance Description & Evidence
                </h3>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
                  {c.title}
                </div>
                <div style={{ background: '#f8faff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px', fontSize: 13.5, color: '#334155', lineHeight: 1.6 }}>
                  {c.desc}
                </div>

                {c.description_english && c.description_english !== c.desc && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#4F46E5', marginBottom: 4 }}>
                      AI Multilingual Translation (English):
                    </div>
                    <div style={{ background: '#EEF2FF', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#475569', fontStyle: 'italic' }}>
                      {c.description_english}
                    </div>
                  </div>
                )}

                {/* Photo Evidence with Preview Modal */}
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                      📸 Photo Evidence Attached ({displayPhotos.length})
                    </span>
                    <span style={{ fontSize: 11, color: '#64748B' }}>Click to view full image</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {displayPhotos.map((photoUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setModalImage(photoUrl)}
                        style={{
                          position: 'relative', width: 110, height: 80, borderRadius: 8,
                          overflow: 'hidden', cursor: 'pointer', border: '1.5px solid #CBD5E1',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.08)', transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
                        title="Click to view full photo"
                      >
                        <img
                          src={photoUrl}
                          alt={`Evidence ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => {
                            e.target.src = 'https://images.unsplash.com/photo-1551382854-fe5497288c4c?w=400&h=300&fit=crop&auto=format'
                          }}
                        />
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          background: 'rgba(15, 23, 42, 0.75)', color: 'white',
                          fontSize: 10, textAlign: 'center', padding: '2px 0', fontWeight: 600,
                        }}>
                          🔍 View Photo
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audio Voice Note Evidence with Built-in Player */}
                <div style={{ marginTop: 18, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#1E293B' }}>
                      <span style={{ fontSize: 16 }}>🎙️</span> Passenger Audio Grievance / Voice Note
                    </div>
                    <span style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                      Audio Stream Ready
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 10px 0' }}>
                    Listen to original voice submission recorded by passenger. Analyzed by AI speech-to-text pipeline.
                  </p>
                  <audio
                    controls
                    src={audioUrl}
                    style={{ width: '100%', height: 38, borderRadius: 6, outline: 'none' }}
                  >
                    Your browser does not support audio playback.
                  </audio>
                </div>
              </div>

              {/* Official Action History Remarks */}
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e0e7ff', padding: '22px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e1b4b', marginBottom: 12 }}>
                  3. Official Remarks & Timeline
                </h3>
                {c.remarks && c.remarks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {c.remarks.map((r, i) => (
                      <div key={i} style={{ background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{r.action || 'Officer Action'}</span>
                          <span style={{ fontSize: 11.5, color: '#94A3B8' }}>{r.performed_by_name}</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>{r.remarks || r.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>
                    No department actions taken yet. Use the action form to update status.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: AI Model Metrics & Action Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* AI Priority Gauge */}
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e0e7ff', padding: '22px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', textAlign: 'center' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e1b4b', marginBottom: 10, textAlign: 'left' }}>
                  AI Model Priority Evaluation
                </h3>
                <PriorityGauge pct={c.pct} priority={c.priority} />
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Duplicate Cluster</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: c.duplicate_count > 0 ? '#ea580c' : '#16a34a' }}>
                      {c.duplicate_count || 1} complaints
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Confidence</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#4f46e5' }}>
                      {c.pct}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Take Action Card */}
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e0e7ff', padding: '22px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e1b4b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🔨</span> Take Official Action
                </h3>

                <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Action Department</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {actionTypes.map(({ id, icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setActionType(id)}
                          style={{
                            flex: 1, padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
                            border: actionType === id ? '2px solid #4f46e5' : '1px solid #e0e7ff',
                            background: actionType === id ? '#eef2ff' : 'white',
                            color: actionType === id ? '#4f46e5' : '#475569',
                            fontWeight: 600, fontSize: 12.5,
                          }}
                        >
                          {icon} {id}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Update Ticket Status</label>
                    <select
                      value={targetStatus}
                      onChange={e => setTargetStatus(e.target.value)}
                      style={{ width: '100%', border: '1.5px solid #e0e7ff', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#1e293b', background: 'white' }}
                    >
                      <option value="Under Investigation">Under Investigation</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Remarks / Action Taken Note</label>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Enter official action details, maintenance status or resolution summary..."
                      rows={3}
                      style={{ width: '100%', border: '1.5px solid #e0e7ff', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#1e293b', resize: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingAction}
                    style={{
                      padding: '12px', borderRadius: 8, border: 'none',
                      background: submittingAction ? '#94a3b8' : '#4f46e5', color: 'white',
                      fontWeight: 700, fontSize: 14, cursor: submittingAction ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 10px rgba(79,70,229,0.3)',
                    }}
                  >
                    {submittingAction ? 'Updating Database...' : 'Submit Action & Update Status'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Section 4: Similar / Related Complaints in Same Route Corridor */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e0e7ff', padding: '22px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e1b4b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📑</span> Similar & Related Complaints in This Corridor
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
                  Review overlapping grievances on {c.transport} ({c.line}) and take immediate single or batch action
                </p>
              </div>

              {similarComplaints.length > 0 && (
                <button
                  type="button"
                  onClick={handleApplyActionToAllSimilar}
                  disabled={submittingAction}
                  style={{
                    background: '#EEF2FF', border: '1.5px solid #4F46E5', color: '#4F46E5',
                    padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13,
                    cursor: submittingAction ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  ⚡ Apply Action [{actionType} &rarr; {targetStatus}] to All ({similarComplaints.length})
                </button>
              )}
            </div>

            {similarComplaints.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: 13.5, background: '#F8FAFC', borderRadius: 8 }}>
                No active duplicate or similar complaints detected for this specific route.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: 12 }}>
                      <th style={{ padding: '10px 14px' }}>Ticket #</th>
                      <th style={{ padding: '10px 14px' }}>Date & Time</th>
                      <th style={{ padding: '10px 14px' }}>Station / Corridor</th>
                      <th style={{ padding: '10px 14px' }}>Grievance Summary</th>
                      <th style={{ padding: '10px 14px' }}>Priority</th>
                      <th style={{ padding: '10px 14px' }}>Current Status</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {similarComplaints.map(item => {
                      const isTargetUpdated = item.status === targetStatus
                      const isUpdatingThis = applyingSimilarId === (item.dbId || item.id)

                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#4F46E5' }}>
                            {item.ticket_number || item.id}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#475569' }}>
                            {item.date} {item.time}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#1E293B', fontWeight: 600 }}>
                            {item.station} ({item.line})
                          </td>
                          <td style={{ padding: '12px 14px', color: '#334155', maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                              background: item.priority === 'Critical' ? '#FEF2F2' : item.priority === 'High' ? '#FFFBEB' : '#F0FDF4',
                              color: item.priority === 'Critical' ? '#DC2626' : item.priority === 'High' ? '#D97706' : '#16A34A',
                            }}>
                              {item.priority}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              padding: '3px 8px', borderRadius: 8, fontSize: 11.5, fontWeight: 600,
                              background: item.status === 'Resolved' ? '#DCFCE7' : item.status === 'In Progress' ? '#FEF3C7' : '#EFF6FF',
                              color: item.status === 'Resolved' ? '#166534' : item.status === 'In Progress' ? '#92400E' : '#1E40AF',
                            }}>
                              {item.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => navigate('details', { id: item.ticket_number || item.id })}
                                style={{
                                  background: 'white', border: '1px solid #CBD5E1', padding: '5px 10px',
                                  borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer',
                                }}
                              >
                                View Ticket
                              </button>
                              <button
                                type="button"
                                disabled={isTargetUpdated || isUpdatingThis}
                                onClick={() => handleApplyActionToSingle(item)}
                                style={{
                                  background: isTargetUpdated ? '#F1F5F9' : '#4F46E5',
                                  border: 'none', padding: '5px 10px', borderRadius: 6,
                                  fontSize: 12, fontWeight: 600,
                                  color: isTargetUpdated ? '#94A3B8' : 'white',
                                  cursor: isTargetUpdated || isUpdatingThis ? 'default' : 'pointer',
                                }}
                              >
                                {isUpdatingThis ? 'Updating...' : isTargetUpdated ? '✓ Action Synced' : `Apply [${actionType}]`}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Image Viewer Lightbox */}
      {modalImage && (
        <div
          onClick={() => setModalImage(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, backdropFilter: 'blur(3px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 14, overflow: 'hidden',
              maxWidth: '85vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1E293B' }}>Grievance Photographic Evidence</span>
              <button
                onClick={() => setModalImage(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748B', fontWeight: 'bold' }}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0F172A' }}>
              <img
                src={modalImage}
                alt="Full Evidence"
                style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 6 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
