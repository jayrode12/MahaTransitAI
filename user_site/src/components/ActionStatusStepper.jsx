const steps = [
  { label: 'Complaint\nSubmitted',     desc: 'Your complaint has been submitted successfully.',       color: '#4F46E5', ring: '#C7D2FE', light: '#EEF2FF' },
  { label: 'Complaint\nReceived',      desc: 'We have received your complaint and it is under review.', color: '#7C3AED', ring: '#DDD6FE', light: '#F5F3FF' },
  { label: 'Under\nInvestigation',     desc: 'Our team is investigating the issue.',                  color: '#F59E0B', ring: '#FDE68A', light: '#FFFBEB' },
  { label: 'Action\nPending',          desc: 'Appropriate action will be taken soon.',                color: '#EF4444', ring: '#FECACA', light: '#FEF2F2' },
  { label: 'Resolved',                 desc: 'We will notify you once the issue is resolved.',        color: '#10B981', ring: '#A7F3D0', light: '#ECFDF5' },
]

const stepTimes = [
  '21 May 2024, 08:45 AM',
  '21 May 2024, 09:10 AM',
  '21 May 2024, 10:05 AM',
  null,
  null,
]

export const progressMap = {
  Pending:      2,
  'In Progress': 3,
  Resolved:     5,
  Closed:       5,
}

export default function ActionStatusStepper({ status }) {
  const progress = progressMap[status] ?? 2

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', paddingTop: 10 }}>
      {/* connector lines */}
      {steps.map((s, i) => {
        if (i === steps.length - 1) return null
        const linesDone = i + 1 < progress
        return (
          <div
            key={`line-${i}`}
            style={{
              position: 'absolute',
              top: 37,
              left: `${(i + 0.5) * (100 / steps.length)}%`,
              width: `${100 / steps.length}%`,
              height: 3,
              borderRadius: 2,
              background: linesDone
                ? `linear-gradient(90deg, ${steps[i].color}, ${steps[i + 1].color})`
                : '#E2E8F0',
              zIndex: 0,
            }}
          />
        )
      })}

      {/* steps */}
      {steps.map((s, i) => {
        const done = i < progress
        return (
          <div
            key={s.label}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}
          >
            {/* circle */}
            {done ? (
              /* completed — colored outer ring + filled inner */
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: s.light,
                border: `2.5px solid ${s.ring}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14, flexShrink: 0,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: s.color,
                  boxShadow: `0 4px 14px ${s.color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
            ) : (
              /* incomplete — plain grey outline, no fill, no checkmark */
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'white',
                border: '2.5px solid #D1D5DB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14, flexShrink: 0,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'transparent',
                  border: '2px solid #E5E7EB',
                }} />
              </div>
            )}

            {/* label */}
            <div style={{
              fontSize: 12.5, fontWeight: 700, textAlign: 'center',
              color: done ? '#1E293B' : '#9CA3AF',
              marginBottom: 6, lineHeight: 1.4,
              whiteSpace: 'pre-line',
            }}>
              {s.label}
            </div>

            {/* description */}
            <div style={{
              fontSize: 11, textAlign: 'center', lineHeight: 1.55,
              color: done ? '#64748B' : '#CBD5E1',
              marginBottom: 6, padding: '0 4px', minHeight: 34,
            }}>
              {s.desc}
            </div>

            {/* timestamp */}
            <div style={{
              fontSize: 10.5, fontWeight: done && stepTimes[i] ? 600 : 400,
              color: done && stepTimes[i] ? s.color : '#CBD5E1',
              fontFamily: "'Inter', sans-serif",
              textAlign: 'center',
            }}>
              {done && stepTimes[i] ? stepTimes[i] : '—'}
            </div>
          </div>
        )
      })}
    </div>
  )
}
