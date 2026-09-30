import { useState, useRef } from 'react'
import AppLayout from '../components/AppLayout'
import api from '../services/api'

const metroLines = [
  { id: '1', label: 'Line 1 (Versova–Ghatkopar)', stations: ['Versova','D.N. Nagar','Azad Nagar','Andheri','Western Express Hwy','Chakala','Airport Road','Marol Naka','Saki Naka','Asalpha','Jagruti Nagar','Ghatkopar'] },
  { id: '2A', label: 'Line 2A (Dahisar–DN Nagar)', stations: ['Dahisar','Anand Nagar','Kandivali','Poisar','Borivali (East)','Mandapeshwar','Eksar','Goregaon','Malad','Oshiwara','DN Nagar'] },
  { id: '7', label: 'Line 7 (Dahisar–Andheri E)', stations: ['Dahisar (East)','Devipada','Magathane','Rajiv Gandhi Nagar','Akurli','Kurar','Dindoshi','Goregaon (E)','Malad (E)','Andheri (E)'] },
]

const busRoutes = [
  { number: 'BEST 604', route: 'Colaba Depot – Borivali Station', via: 'Via: Dadar, Sion, Kurla, Ghatkopar' },
  { number: 'BEST 221', route: 'Bandra Station – Andheri Station', via: 'Via: Santacruz, Vile Parle' },
  { number: 'BEST 310', route: 'Dadar TT – Borivali West', via: 'Via: Dharavi, Kurla, Ghatkopar, Mulund' },
  { number: 'BEST 125', route: 'CST – Andheri', via: 'Via: Dadar, Mahim, Bandra, Santacruz' },
]

const localLines = [
  { id: 'WR', label: 'Western Line', directions: ['Churchgate → Virar','Virar → Churchgate'], stations: ['Churchgate','Marine Lines','Grant Road','Mumbai Central','Dadar','Bandra','Andheri','Malad','Borivali','Virar'] },
  { id: 'CR', label: 'Central Line', directions: ['CSMT → Kasara','Kasara → CSMT'], stations: ['CSMT','Byculla','Dadar','Sion','Kurla','Ghatkopar','Thane','Dombivli','Kalyan'] },
  { id: 'HR', label: 'Harbour Line', directions: ['CSMT → Panvel','Panvel → CSMT'], stations: ['CSMT','Wadala Road','Kurla','Chembur','Mankhurd','Vashi','Belapur','Panvel'] },
]

export default function NewComplaint({ onNavigate, onLogout, currentUser, initialTransport = 'Metro' }) {
  const [transport, setTransport] = useState(initialTransport)
  const [metroLine, setMetroLine] = useState(metroLines[0].id)
  const [metroStation, setMetroStation] = useState(metroLines[0].stations[0])
  const [busNumber, setBusNumber] = useState(busRoutes[0].number)
  const [busStop, setBusStop] = useState('Dadar TT')
  const [busType, setBusType] = useState('AC')
  const [busDirection, setBusDirection] = useState('Towards Borivali')
  const [localLine, setLocalLine] = useState(localLines[0].id)
  const [localDir, setLocalDir] = useState(localLines[0].directions[0])
  const [localStation, setLocalStation] = useState(localLines[0].stations[0])
  const [trainType, setTrainType] = useState('Slow Local')
  const [journeyDate, setJourneyDate] = useState(() => new Date().toISOString().split('T')[0])
  const [journeyTime, setJourneyTime] = useState('09:15')

  const [description, setDescription] = useState('')
  const [images, setImages] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [hasVoiceNote, setHasVoiceNote] = useState(false)
  const timerRef = useRef(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdComplaint, setCreatedComplaint] = useState(null)

  const selectedMetroLine = metroLines.find((l) => l.id === metroLine) ?? metroLines[0]
  const selectedBusRoute = busRoutes.find((b) => b.number === busNumber) ?? busRoutes[0]
  const selectedLocalLine = localLines.find((l) => l.id === localLine) ?? localLines[0]

  function handleImageUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const newImages = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
    }))
    setImages((prev) => [...prev, ...newImages].slice(0, 4))
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  function toggleRecording() {
    if (isRecording) {
      clearInterval(timerRef.current)
      setIsRecording(false)
      setHasVoiceNote(true)
    } else {
      setIsRecording(true)
      setRecordingSeconds(0)
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            clearInterval(timerRef.current)
            setIsRecording(false)
            setHasVoiceNote(true)
            return 60
          }
          return prev + 1
        })
      }, 1000)
    }
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault()
    if (!description.trim()) {
      setError('Please provide a description of your complaint.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const transitMode = transport === 'Railway' ? 'train' : transport.toLowerCase()
      let stationName = ''
      let lineName = ''

      if (transitMode === 'metro') {
        stationName = metroStation || selectedMetroLine.stations[0]
        lineName = `Metro Line ${metroLine}`
      } else if (transitMode === 'bus') {
        stationName = busStop
        lineName = busNumber
      } else {
        stationName = localStation || selectedLocalLine.stations[0]
        lineName = selectedLocalLine.label
      }

      const generatedTitle = `${transport} Grievance at ${stationName}: ${description.slice(0, 35).trim()}...`

      const payload = {
        title: generatedTitle,
        description_original: description,
        transit_mode: transitMode,
        category: 'Transit Service Issue',
        form_data: {
          transport,
          line: lineName,
          station: stationName,
          direction: transitMode === 'train' ? localDir : transitMode === 'bus' ? busDirection : selectedMetroLine.label,
          train_type: transitMode === 'train' ? trainType : undefined,
          bus_type: transitMode === 'bus' ? busType : undefined,
          journey_date: journeyDate,
          journey_time: journeyTime,
          passenger_name: currentUser?.full_name || 'Passenger',
          passenger_email: currentUser?.email || '',
          has_voice_note: hasVoiceNote,
          attachments: images.map((img) => img.name),
        },
      }

      const res = await api.complaints.create(payload)
      setCreatedComplaint(res)
    } catch (err) {
      console.error('Failed to submit complaint:', err)
      setError(err.message || 'Failed to submit complaint. Please check your backend connection.')
    } finally {
      setSubmitting(false)
    }
  }

  if (createdComplaint) {
    return (
      <AppLayout currentPage="new-complaint" onNavigate={onNavigate} onLogout={onLogout}>
        <div style={{
          background: 'white', borderRadius: 20, border: '1px solid #E2E8F0',
          padding: '40px 32px', maxWidth: 640, margin: '30px auto', textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        }}>
          <div style={{
            width: 76, height: 76, borderRadius: '50%', background: '#ECFDF5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 26, color: '#1E293B', marginBottom: 8 }}>
            Complaint Filed Successfully!
          </h2>
          <p style={{ color: '#64748B', fontSize: 14.5, marginBottom: 20, lineHeight: 1.5 }}>
            Our Automated AI Pipeline has processed, embedded, and assigned your complaint to the relevant transit authority.
          </p>

          <div style={{
            padding: '16px 20px', borderRadius: 14, background: '#F8FAFC',
            border: '1px solid #E2E8F0', marginBottom: 24, textAlign: 'left',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>Ticket Number</span>
              <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', padding: '4px 10px', borderRadius: 6 }}>
                {createdComplaint.ticket_number}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>Assigned Mode</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1E293B' }}>
                {createdComplaint.transport} ({createdComplaint.line})
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>AI Detected Priority</span>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: createdComplaint.priority === 'Critical' ? '#FEF2F2' : createdComplaint.priority === 'High' ? '#FFFBEB' : '#F0FDF4',
                color: createdComplaint.priority === 'Critical' ? '#DC2626' : createdComplaint.priority === 'High' ? '#D97706' : '#16A34A',
                border: `1px solid ${createdComplaint.priority === 'Critical' ? '#FECACA' : '#FDE68A'}`,
              }}>
                {createdComplaint.priority} Priority
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>Status</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0284C7' }}>
                {createdComplaint.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => onNavigate('complaint-details', { id: createdComplaint.ticket_number })}
              style={{
                padding: '11px 22px', borderRadius: 10, background: '#4F46E5', color: 'white',
                fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer',
              }}
            >
              Track Complaint
            </button>
            <button
              onClick={() => onNavigate('history')}
              style={{
                padding: '11px 22px', borderRadius: 10, background: '#F1F5F9', color: '#475569',
                fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer',
              }}
            >
              Go to History
            </button>
            <button
              onClick={() => {
                setCreatedComplaint(null)
                setDescription('')
                setImages([])
                setHasVoiceNote(false)
              }}
              style={{
                padding: '11px 20px', borderRadius: 10, background: 'transparent',
                border: '1.5px solid #CBD5E1', color: '#475569', fontWeight: 600, fontSize: 14,
                cursor: 'pointer',
              }}
            >
              New Complaint
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout currentPage="new-complaint" onNavigate={onNavigate} onLogout={onLogout}>
      <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 24, color: '#1E293B', marginBottom: 4 }}>
        File a New Complaint
      </h1>
      <p style={{ fontSize: 13.5, color: '#64748B', marginBottom: 24 }}>
        Submit passenger grievance. Our automated AI pipeline tags, translates, and assigns it immediately.
      </p>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, background: '#FEF2F2',
          border: '1px solid #FECACA', color: '#DC2626', fontSize: 13.5, marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {/* Step 1 */}
      <Card title="1. Select Transport Type">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[
            { id: 'Metro', label: 'Metro', desc: 'Report issues related to Mumbai Metro services' },
            { id: 'Bus', label: 'Bus (BEST)', desc: 'Report issues related to BEST bus routes' },
            { id: 'Railway', label: 'Railway (Mumbai Local)', desc: 'Report issues related to Western, Central & Harbour trains' },
          ].map((t) => {
            const active = transport === t.id
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => setTransport(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
                  borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  border: active ? '2px solid #4F46E5' : '1.5px solid #E2E8F0',
                  background: active ? '#EEF2FF' : 'white',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 11, background: active ? '#C7D2FE' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TransportIcon type={t.id} active={active} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>{t.label}</div>
                  <div style={{ fontSize: 11.5, color: '#94A3B8', lineHeight: 1.4 }}>{t.desc}</div>
                </div>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${active ? '#4F46E5' : '#CBD5E1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4F46E5' }} />}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Step 2 */}
      <Card title={transport === 'Metro' ? '2. Metro Details' : transport === 'Bus' ? '2. Bus Details' : '2. Mumbai Local Details'}>
        {transport === 'Metro' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 12 }}>
              <Select
                label="Line Number*"
                value={metroLine}
                onChange={(val) => {
                  setMetroLine(val)
                  const lineObj = metroLines.find((l) => l.id === val)
                  if (lineObj?.stations?.length) setMetroStation(lineObj.stations[0])
                }}
                options={metroLines.map((l) => ({ value: l.id, label: `Line ${l.id} (${l.label.split('(')[1]}` }))}
              />
              <div>
                <label style={labelStyle}>Route / Corridor</label>
                <div style={inputDisplayStyle}>{selectedMetroLine.label}</div>
              </div>
              <Select
                label="Boarding / Incident Station*"
                value={metroStation}
                onChange={setMetroStation}
                options={selectedMetroLine.stations.map((s) => ({ value: s, label: s }))}
              />
            </div>
            <InfoBar parts={[`Metro Line ${metroLine}`, `Station: ${metroStation || 'Not selected'}`]} />
          </>
        )}

        {transport === 'Bus' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 10 }}>
              <Select
                label="Bus Number*"
                value={busNumber}
                onChange={setBusNumber}
                options={busRoutes.map((b) => ({ value: b.number, label: b.number }))}
              />
              <div>
                <label style={labelStyle}>Route / Origin–Destination*</label>
                <div style={{ ...inputDisplayStyle }}>{selectedBusRoute.route}</div>
              </div>
              <div>
                <label style={labelStyle}>Via (Route Path)</label>
                <div style={{ ...inputDisplayStyle, color: '#64748B' }}>{selectedBusRoute.via}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 10 }}>
              <Select
                label="Boarding Stop*"
                value={busStop}
                onChange={setBusStop}
                options={['Colaba Depot','Dadar TT','Kurla Station','Bandra Station','Andheri Station','Borivali Station','Ghatkopar'].map((s) => ({ value: s, label: s }))}
              />
              <Select
                label="Bus Type"
                value={busType}
                onChange={setBusType}
                options={[{ value: 'AC', label: 'AC Electric' }, { value: 'Non-AC', label: 'Non-AC' }, { value: 'Mini', label: 'Mini Bus' }]}
              />
              <Select
                label="Direction*"
                value={busDirection}
                onChange={setBusDirection}
                options={[{ value: 'Towards Borivali', label: 'Towards Borivali' }, { value: 'Towards Colaba', label: 'Towards Colaba' }, { value: 'Towards Andheri', label: 'Towards Andheri' }]}
              />
              <Input label="Journey Date" type="date" value={journeyDate} onChange={setJourneyDate} />
            </div>
            <InfoBar parts={[`Bus No. ${busNumber}`, selectedBusRoute.route, `Stop: ${busStop}`]} />
          </>
        )}

        {transport === 'Railway' && (
          <>
            <InfoBar parts={['Select train corridor and station details for Indian Railways']} info />
            <div style={{ height: 12 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 10 }}>
              <Select
                label="Local Line*"
                value={localLine}
                onChange={(val) => {
                  setLocalLine(val)
                  const lineObj = localLines.find((l) => l.id === val)
                  if (lineObj) {
                    setLocalDir(lineObj.directions[0])
                    setLocalStation(lineObj.stations[0])
                  }
                }}
                options={localLines.map((l) => ({ value: l.id, label: l.label }))}
              />
              <Select
                label="Direction*"
                value={localDir}
                onChange={setLocalDir}
                options={selectedLocalLine.directions.map((d) => ({ value: d, label: d }))}
              />
              <Select
                label="Train Type"
                value={trainType}
                onChange={setTrainType}
                options={[{ value: 'Slow Local', label: 'Slow Local' }, { value: 'Fast Local', label: 'Fast Local' }, { value: 'AC Local', label: 'AC Local' }, { value: 'Express', label: 'Express' }]}
              />
              <Select
                label="Boarding Station*"
                value={localStation}
                onChange={setLocalStation}
                options={selectedLocalLine.stations.map((s) => ({ value: s, label: s }))}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 10 }}>
              <Input label="Date of Journey*" type="date" value={journeyDate} onChange={setJourneyDate} />
              <Input label="Time of Journey*" type="time" value={journeyTime} onChange={setJourneyTime} />
            </div>
            <InfoBar parts={[selectedLocalLine.label, localDir, `Station: ${localStation}`, trainType]} />
          </>
        )}
      </Card>

      {/* Step 3 */}
      <Card title="3. Complaint Details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={labelStyle}>Add Images / Evidence (Optional)</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{
                width: 112, height: 88, border: '2px dashed #C7D2FE', borderRadius: 12,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', background: '#F8FAFF', gap: 4,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#4F46E5' }}>Click to upload</span>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>PNG, JPG (Max 5MB)</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>

              {images.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', width: 88, height: 88, borderRadius: 10, overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                  <img src={img.url} alt="upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    style={{
                      position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)',
                      color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Describe your complaint*</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details of the incident, issue with cleanliness, crowd control, ticket counter, delays, or air conditioning..."
              rows={5}
              style={{
                width: '100%', padding: '10px 13px', borderRadius: 10,
                border: '1.5px solid #E2E8F0', background: 'white',
                fontSize: 13.5, color: '#1E293B', outline: 'none', resize: 'none',
                boxSizing: 'border-box', fontFamily: "'Inter',sans-serif",
              }}
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: '#94A3B8', marginTop: 3 }}>
              {description.length}/1000
            </div>
          </div>
        </div>

        {/* Voice recording */}
        <div style={{
          marginTop: 14, padding: '14px 16px', borderRadius: 12,
          border: '1px solid #E2E8F0', background: isRecording ? '#FEF2F2' : '#F8FAFF',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'background 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: isRecording ? '#FEE2E2' : '#EEF2FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isRecording ? '#DC2626' : '#4F46E5'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1E293B' }}>
                Voice Complaint {hasVoiceNote && <span style={{ color: '#059669', fontSize: 12 }}>✓ Recorded</span>}
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>
                {isRecording ? 'Recording voice note...' : hasVoiceNote ? 'Voice note attached to complaint' : 'Tap to record grievance in Hindi, Marathi, or English'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: isRecording ? '#DC2626' : '#94A3B8', fontWeight: isRecording ? 600 : 400 }}>
              {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')} / 01:00
            </span>
            <button
              type="button"
              onClick={toggleRecording}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                border: isRecording ? '1.5px solid #DC2626' : '1.5px solid #4F46E5',
                color: isRecording ? '#DC2626' : '#4F46E5',
                background: 'white', fontWeight: 600, fontSize: 12.5,
                cursor: 'pointer', fontFamily: "'Inter',sans-serif",
              }}
            >
              {isRecording ? 'Stop Recording' : hasVoiceNote ? 'Re-record' : 'Start Recording'}
            </button>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 12, border: 'none',
            background: submitting ? '#94A3B8' : '#4F46E5', color: 'white',
            fontWeight: 700, fontSize: 14.5,
            cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: '0 6px 20px rgba(79,70,229,0.35)',
          }}
        >
          {submitting ? 'Running AI Pipeline...' : 'Submit Complaint'}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </AppLayout>
  )
}

function Card({ title, children }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, border: '1px solid #E8EEFF',
      padding: '20px 24px', marginBottom: 16,
      boxShadow: '0 1px 6px rgba(79,70,229,0.05)',
    }}>
      <h2 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 15, color: '#1E293B', marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5 }

const inputDisplayStyle = {
  padding: '9px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
  background: '#F8FAFF', fontSize: 13, color: '#1E293B',
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 8,
          border: '1px solid #E2E8F0', background: 'white',
          fontSize: 13, color: '#1E293B', outline: 'none',
          fontFamily: "'Inter',sans-serif",
        }}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 8,
          border: '1px solid #E2E8F0', background: 'white',
          fontSize: 13, color: '#1E293B', outline: 'none',
          boxSizing: 'border-box', fontFamily: "'Inter',sans-serif",
        }}
      />
    </div>
  )
}

function InfoBar({ parts, info }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      padding: '9px 14px', borderRadius: 8,
      background: '#EEF2FF', border: '1px solid #C7D2FE',
      color: '#4F46E5', fontSize: 12,
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {info ? (
        <span>{parts[0]}</span>
      ) : (
        parts.map((p, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ color: '#A5B4FC' }}>·</span>}
            {p}
          </span>
        ))
      )}
    </div>
  )
}

function TransportIcon({ type, active }) {
  const c = active ? '#4F46E5' : '#64748B'
  if (type === 'Metro') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      <circle cx="9" cy="16" r="1" fill={c} stroke="none"/><circle cx="15" cy="16" r="1" fill={c} stroke="none"/>
    </svg>
  )
  if (type === 'Bus') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6v6M3 6l9-4 9 4v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>
      <circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/>
    </svg>
  )
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="14" rx="2"/><path d="M4 12h16"/><path d="M12 4v8"/>
      <circle cx="8" cy="15" r="1" fill={c} stroke="none"/><circle cx="16" cy="15" r="1" fill={c} stroke="none"/>
    </svg>
  )
}
