import { useState, useEffect } from 'react'
import { complaints as fallbackComplaints, badgeStyle } from '../data/complaints'
import AppLayout from '../components/AppLayout'
import ActionStatusStepper from '../components/ActionStatusStepper'
import api from '../services/api'

export default function ComplaintDetails({ complaintId, onNavigate, onLogout, currentUser }) {
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newRemark, setNewRemark] = useState('')
  const [submittingRemark, setSubmittingRemark] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  // Modal Image viewer state
  const [modalImage, setModalImage] = useState(null)

  // Edit Complaint Modal state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStation, setEditStation] = useState('')
  const [editLine, setEditLine] = useState('')
  const [editDirection, setEditDirection] = useState('')
  const [submittingEdit, setSubmittingEdit] = useState(false)

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true)
      try {
        let res = null
        if (complaintId) {
          try {
            res = await api.complaints.track(complaintId)
          } catch {
            res = await api.complaints.getById(complaintId)
          }
        }
        if (res) {
          setComplaint(res)
        } else {
          const match = fallbackComplaints.find((x) => x.id === complaintId) || fallbackComplaints[0]
          setComplaint(match)
        }
      } catch (err) {
        console.warn('Failed to load complaint by ID, fallback used:', err)
        const match = fallbackComplaints.find((x) => x.id === complaintId) || fallbackComplaints[0]
        setComplaint(match)
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [complaintId])

  const c = complaint || fallbackComplaints[0]

  // Actual received photo/video evidence
  const imageAttachments = (c.attachments || []).filter(a => a.attachment_type === 'image' || a.attachment_type === 'video' || a.mime_type?.startsWith('image') || a.mime_type?.startsWith('video') || (a.file_url && (a.file_url.startsWith('data:image') || a.file_url.startsWith('data:video') || a.file_url.match(/\.(jpeg|jpg|png|webp|mp4|mov)/i))))
  const displayPhotos = imageAttachments.map(a => a.file_url || a)

  // Actual received voice note audio
  const audioAttachment = (c.attachments || []).find(a => a.attachment_type === 'audio' || a.mime_type?.startsWith('audio') || (a.file_url && (a.file_url.startsWith('data:audio') || a.file_url.match(/\.(mp3|wav|ogg|webm|m4a)/i))))
  const audioUrl = audioAttachment?.file_url || null

  // Open Edit Modal
  function handleOpenEdit() {
    setEditTitle(c.title || '')
    setEditDescription(c.description || '')
    setEditStation(c.station || c.location || '')
    setEditLine(c.line || '')
    setEditDirection(c.direction || '')
    setIsEditing(true)
  }

  // Handle Edit Submission
  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!editTitle.trim() || !editDescription.trim()) {
      alert('Please provide both a title and description.')
      return
    }

    setSubmittingEdit(true)
    try {
      const updatedFormData = {
        ...(c.form_data || {}),
        station: editStation.trim(),
        station_or_stop_name: editStation.trim(),
        line: editLine.trim(),
        line_or_route_number: editLine.trim(),
        direction: editDirection.trim(),
      }

      const payload = {
        title: editTitle.trim(),
        description_original: editDescription.trim(),
        form_data: updatedFormData,
      }

      const res = await api.complaints.update(c.dbId || c.id, payload)
      if (res) {
        setComplaint(res)
      } else {
        const now = new Date()
        setComplaint(prev => ({
          ...prev,
          title: editTitle.trim(),
          description: editDescription.trim(),
          station: editStation.trim(),
          line: editLine.trim(),
          direction: editDirection.trim(),
          date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        }))
      }

      setIsEditing(false)
      setToastMsg('Complaint updated successfully! Submission date & time has been refreshed to current time.')
      setTimeout(() => setToastMsg(''), 5000)
    } catch (err) {
      console.error('Failed to update complaint:', err)
      alert(`Could not save changes: ${err.message}`)
    } finally {
      setSubmittingEdit(false)
    }
  }

  async function handleAddRemark(e) {
    e.preventDefault()
    if (!newRemark.trim()) return

    setSubmittingRemark(true)
    try {
      const remarkObj = {
        action: 'Citizen Inquiry / Remark',
        remarks: newRemark.trim(),
        performed_by_name: currentUser?.full_name || 'Passenger',
        created_at: new Date().toISOString(),
      }

      try {
        await api.complaints.addRemark(c.dbId || c.id, {
          action: 'Citizen Inquiry',
          remarks: newRemark.trim(),
        })
      } catch (backendErr) {
        console.warn('Backend remark error (logged locally):', backendErr)
      }

      setComplaint((prev) => ({
        ...prev,
        remarks: [...(prev.remarks || []), remarkObj],
      }))
      setNewRemark('')
      setToastMsg('Remark posted successfully to ticket timeline.')
      setTimeout(() => setToastMsg(''), 3500)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingRemark(false)
    }
  }

  if (loading) {
    return (
      <AppLayout currentPage="complaint-details" onNavigate={onNavigate} onLogout={onLogout}>
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
          Loading complaint details...
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout currentPage="complaint-details" onNavigate={onNavigate} onLogout={onLogout}>
      {/* Back button */}
      <button
        onClick={() => onNavigate('history')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, color: '#4F46E5',
          fontSize: 13, fontWeight: 600, background: 'none', border: 'none',
          cursor: 'pointer', marginBottom: 16, fontFamily: "'Inter',sans-serif",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to History
      </button>

      {toastMsg && (
        <div style={{
          padding: '12px 18px', borderRadius: 8, background: '#ECFDF5',
          border: '1px solid #A7F3D0', color: '#065F46', fontSize: 13.5, fontWeight: 600,
          marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {toastMsg}
        </div>
      )}

      {/* Header with Title & Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 24, color: '#1E293B', marginBottom: 4 }}>
            Complaint Details
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748B', margin: 0 }}>
            Live tracking and grievance timeline for ticket {c.ticket_number || c.id}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Edit Complaint Button */}
          <button
            onClick={handleOpenEdit}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 10, border: '1.5px solid #CBD5E1', background: 'white',
              color: '#1E293B', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            ✏️ Edit Complaint
          </button>

          <button
            onClick={() => onNavigate('new-complaint')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
              borderRadius: 10, border: 'none', background: '#4F46E5',
              color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
            }}
          >
            + File Another Grievance
          </button>
        </div>
      </div>

      {/* ID strip */}
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #E8EEFF',
        padding: '18px 24px', marginBottom: 16,
        display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: 24, alignItems: 'center',
        boxShadow: '0 1px 6px rgba(79,70,229,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.8">
              <rect x="4" y="4" width="16" height="14" rx="2"/><path d="M4 12h16"/><path d="M12 4v8"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>Complaint ID</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15, color: '#1E293B' }}>{c.ticket_number || c.id}</div>
          </div>
        </div>

        <Divider>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>Current Status</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, ...badgeStyle(c.status) }}>
            {c.status}
          </span>
        </Divider>

        <Divider>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Submission Date & Time</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: '#1E293B' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {c.date}, {c.time}
          </div>
        </Divider>

        <Divider>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Priority Level</div>
          <div style={{
            display: 'inline-block', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: c.priority === 'Critical' ? '#FEF2F2' : c.priority === 'High' ? '#FFFBEB' : '#F0FDF4',
            color: c.priority === 'Critical' ? '#DC2626' : c.priority === 'High' ? '#D97706' : '#16A34A',
            border: `1px solid ${c.priority === 'Critical' ? '#FECACA' : '#FDE68A'}`,
          }}>
            {c.priority} Priority
          </div>
        </Divider>
      </div>

      {/* Transport details */}
      <SectionCard title="1. Transport & Journey Details">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[
            { label: 'Transport Mode', value: c.transport === 'Railway' ? 'Mumbai Local Railway' : c.transport },
            { label: 'Line / Route', value: c.line ?? 'Main Corridor' },
            { label: 'Boarding / Station', value: c.station ?? c.location },
            { label: 'Direction', value: c.direction ?? '—' },
            { label: c.transport === 'Bus' ? 'Bus Type' : 'Train Type', value: c.transport === 'Bus' ? (c.bus_type || 'AC Electric') : (c.train_type || 'Slow Local') },
            { label: 'Date of Journey', value: c.journey_date || c.date },
            { label: 'Time of Journey', value: c.journey_time || c.time },
            { label: 'Passenger Name', value: c.submittedBy || 'Passenger' },
          ].map((f, i) => (
            <div key={f.label} style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>{f.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{f.value}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Complaint details */}
      <SectionCard title="2. Grievance Content & Evidence">
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>{c.title}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 8 }}>Original Passenger Statement</div>
            <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.65, background: '#F8FAFC', padding: '14px', borderRadius: 10, border: '1px solid #E2E8F0', margin: 0 }}>
              {c.description}
            </p>

            {c.description_english && c.description_english !== c.description && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#4F46E5', marginBottom: 4 }}>Automated Translation (English)</div>
                <p style={{ fontSize: 13, color: '#475569', fontStyle: 'italic', background: '#EEF2FF', padding: '10px 14px', borderRadius: 8, margin: 0 }}>
                  {c.description_english}
                </p>
              </div>
            )}

            {/* Audio Voice Note Evidence Player */}
            <div style={{ marginTop: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#1E293B' }}>
                  <span style={{ fontSize: 16 }}>🎙️</span> Passenger Voice Note Recording
                </div>
                {audioUrl ? (
                  <span style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                    Available to Listen
                  </span>
                ) : (
                  <span style={{ fontSize: 11, background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: 12, fontWeight: 500 }}>
                    Not Recorded
                  </span>
                )}
              </div>
              {audioUrl ? (
                <>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 10px 0' }}>
                    Audio grievance captured during submission.
                  </p>
                  <audio
                    controls
                    src={audioUrl}
                    style={{ width: '100%', height: 38, borderRadius: 6, outline: 'none' }}
                  >
                    Your browser does not support audio playback.
                  </audio>
                </>
              ) : (
                <p style={{ fontSize: 12.5, color: '#94A3B8', margin: 0, fontStyle: 'italic' }}>
                  No voice note was recorded with this complaint.
                </p>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 8 }}>Automated System Insights</div>
            <div style={{ padding: '14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: '#64748B' }}>Category:</span>
                <span style={{ fontWeight: 600, color: '#1E293B' }}>{c.category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: '#64748B' }}>Duplicate Detection:</span>
                <span style={{ fontWeight: 600, color: c.duplicate_count > 0 ? '#D97706' : '#16A34A' }}>
                  {c.duplicate_count > 0 ? `${c.duplicate_count} Similar Issues Detected` : 'Unique Complaint'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: '#64748B' }}>Priority Assessment:</span>
                <span style={{ fontWeight: 600, color: '#4F46E5' }}>Automated Multi-factor Scoring</span>
              </div>
            </div>


            {/* Evidence photos with zoom preview */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>
                  Uploaded Evidence Files ({displayPhotos.length})
                </span>
                {displayPhotos.length > 0 && (
                  <span style={{ fontSize: 11, color: '#4F46E5', fontWeight: 600 }}>Click to zoom</span>
                )}
              </div>
              {displayPhotos.length > 0 ? (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {displayPhotos.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setModalImage(img)}
                      style={{
                        position: 'relative', width: 90, height: 70, borderRadius: 8,
                        overflow: 'hidden', cursor: 'pointer', border: '1.5px solid #CBD5E1',
                      }}
                      title="Click to view full media"
                    >
                      <img
                        src={img}
                        alt={`Evidence ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'rgba(15, 23, 42, 0.75)', color: 'white',
                        fontSize: 10, textAlign: 'center', padding: '1px 0', fontWeight: 600,
                      }}>
                        🔍 View
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '12px 14px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 12.5, color: '#94A3B8', fontStyle: 'italic' }}>
                  No photo/video attachments uploaded with this complaint.
                </div>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Action status stepper */}
      <SectionCard title="3. Department Action Stepper">
        <ActionStatusStepper status={c.status} />
      </SectionCard>

      {/* Timeline Remarks */}
      {c.remarks && c.remarks.length > 0 && (
        <SectionCard title="4. Official Remarks & Log">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {c.remarks.map((r, idx) => (
              <div key={idx} style={{ padding: '12px 16px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{r.action || 'Officer Remark'}</span>
                  <span style={{ fontSize: 11.5, color: '#94A3B8' }}>{r.performed_by_name || 'Department Officer'}</span>
                </div>
                <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>{r.remarks || r.comment}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Add Passenger Note */}
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #E8EEFF',
        padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 6px rgba(79,70,229,0.05)',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 10 }}>
          Have an update or response regarding this ticket?
        </h3>
        <form onSubmit={handleAddRemark} style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            placeholder="Type your message or inquiry here..."
            value={newRemark}
            onChange={(e) => setNewRemark(e.target.value)}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 8,
              border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none',
              fontFamily: "'Inter',sans-serif",
            }}
          />
          <button
            type="submit"
            disabled={submittingRemark}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: '#4F46E5', color: 'white', fontWeight: 600, fontSize: 13,
              cursor: submittingRemark ? 'not-allowed' : 'pointer',
            }}
          >
            {submittingRemark ? 'Posting...' : 'Post Remark'}
          </button>
        </form>
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
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1E293B' }}>Photographic Evidence Preview</span>
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

      {/* Edit Complaint Modal */}
      {isEditing && (
        <div
          onClick={() => setIsEditing(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)',
            zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, backdropFilter: 'blur(3px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 16, width: '100%', maxWidth: 560,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
            }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1E293B' }}>
                  ✏️ Edit Complaint Details
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: 12.5, color: '#64748B' }}>
                  Updating will record new information and refresh the submission date & time.
                </p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, color: '#94A3B8', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Complaint Subject / Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Grievance Description (Detailed Statement)
                </label>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Station / Stop
                  </label>
                  <input
                    type="text"
                    value={editStation}
                    onChange={e => setEditStation(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Line / Route
                  </label>
                  <input
                    type="text"
                    value={editLine}
                    onChange={e => setEditLine(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Direction
                </label>
                <input
                  type="text"
                  value={editDirection}
                  onChange={e => setEditDirection(e.target.value)}
                  placeholder="e.g. Versova to Ghatkopar, Down line"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: 'white', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  style={{
                    padding: '9px 18px', borderRadius: 8, border: 'none',
                    background: submittingEdit ? '#94A3B8' : '#4F46E5', color: 'white',
                    fontWeight: 700, fontSize: 13, cursor: submittingEdit ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submittingEdit ? 'Saving & Refreshing...' : 'Save & Refresh Timestamp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

function SectionCard({ title, children }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E8EEFF', padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 6px rgba(79,70,229,0.05)' }}>
      <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 15, color: '#1E293B', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#4F46E5' }} />
        {title}
      </h2>
      {children}
    </div>
  )
}

function Divider({ children }) {
  return (
    <div style={{ borderLeft: '1px solid #F0F4FF', paddingLeft: 24 }}>
      {children}
    </div>
  )
}
