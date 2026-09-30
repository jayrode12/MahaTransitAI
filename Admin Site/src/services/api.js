const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const ADMIN_STORAGE_KEY = 'mahatransit_admin_user'

export const adminStorage = {
  getUser() {
    try {
      const data = localStorage.getItem(ADMIN_STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  },
  setUser(user) {
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(user))
    } catch (e) {
      console.error('Failed to save admin session', e)
    }
  },
  clearUser() {
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY)
    } catch (e) {
      console.error('Failed to clear admin session', e)
    }
  },
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const user = adminStorage.getUser()

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (user?.access_token) {
    headers['Authorization'] = `Bearer ${user.access_token}`
  }
  if (user?.user_id) {
    headers['X-User-Id'] = user.user_id
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorDetail = 'Request failed'
    try {
      const errorJson = await response.json()
      errorDetail = errorJson.detail || errorJson.message || errorDetail
    } catch {
      errorDetail = `${response.status} ${response.statusText}`
    }
    throw new Error(errorDetail)
  }

  return response.json()
}

export function formatTransport(mode) {
  const m = (mode || '').toLowerCase()
  if (m === 'metro') return 'Metro'
  if (m === 'bus') return 'Bus'
  if (m === 'train') return 'Railway'
  return mode || 'Metro'
}

export function formatStatus(status) {
  const s = (status || '').toLowerCase()
  if (s === 'submitted') return 'Under Investigation'
  if (s === 'assigned') return 'Assigned'
  if (s === 'accepted') return 'Assigned'
  if (s === 'in_progress') return 'In Progress'
  if (s === 'resolved') return 'Resolved'
  if (s === 'closed') return 'Closed'
  if (s === 'rejected') return 'Rejected'
  return status || 'Under Investigation'
}

export function formatPriority(priority) {
  const p = (priority || '').toLowerCase()
  if (p === 'low') return 'Low'
  if (p === 'medium') return 'Medium'
  if (p === 'high') return 'High'
  if (p === 'critical') return 'Critical'
  return priority || 'Medium'
}

export function normalizeAdminComplaint(c) {
  if (!c) return null

  const d = c.created_at ? new Date(c.created_at) : new Date()
  const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const formData = c.form_data || {}
  const line = formData.line || formData.line_or_route_number || formData.route || formData.bus_number || formData.local_line || 'Main Line'
  const station = formData.station || formData.station_or_stop_name || formData.boarding_station || formData.boarding_stop || 'Main Station'
  const nextStation = formData.next_station || formData.next_stop || 'Destination'

  const priority = formatPriority(c.priority)
  let pct = 50
  if (c.ai_result?.priority_confidence) {
    pct = Math.round(Number(c.ai_result.priority_confidence) * 100)
  } else if (priority === 'Critical') {
    pct = 95
  } else if (priority === 'High') {
    pct = 75
  } else if (priority === 'Medium') {
    pct = 48
  } else {
    pct = 22
  }

  // Thumbnails index
  const t = Math.abs(c.ticket_number?.charCodeAt(c.ticket_number.length - 1) || 0) % 5

  return {
    id: c.ticket_number || c.id,
    dbId: c.id,
    ticket_number: c.ticket_number,
    title: c.title,
    desc: c.description_original,
    description_english: c.description_english || c.description_original,
    transport: formatTransport(c.transit_mode),
    rawTransitMode: c.transit_mode,
    line,
    station,
    from: station,
    to: nextStation,
    direction: formData.direction || '—',
    train_type: formData.train_type || '—',
    bus_type: formData.bus_type || '—',
    journey_date: formData.journey_date || dateStr,
    journey_time: formData.journey_time || timeStr,
    passenger_name: formData.passenger_name || 'Passenger',
    passenger_email: formData.passenger_email || 'Not provided',
    has_voice_note: !!formData.has_voice_note,
    evidence_images: formData.attachments || [],
    category: c.category?.category_name || formData.category || 'Transit Service Issue',
    priority,
    pct,
    status: formatStatus(c.status),
    rawStatus: c.status,
    date: dateStr,
    time: timeStr,
    created_at: c.created_at,
    t,
    submittedBy: formData.passenger_name || 'Passenger',
    attachments: c.attachments || [],
    remarks: c.remarks || [],
    ai_result: c.ai_result || null,
    duplicate_count: c.duplicate_count || (c.ai_result ? 3 : 0),
  }
}

export const api = {
  auth: {
    async login({ email, password }) {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, user_type: 'admin' }),
      })
      adminStorage.setUser(data)
      return data
    },
    async logout() {
      try {
        await request('/auth/logout', { method: 'POST' })
      } catch (e) {
        console.warn('Logout API warning:', e)
      }
      adminStorage.clearUser()
    },
    getCurrentUser() {
      return adminStorage.getUser()
    },
  },

  complaints: {
    async list(params = {}) {
      const query = new URLSearchParams()
      if (params.page) query.set('page', params.page)
      if (params.limit) query.set('limit', params.limit)
      if (params.status) query.set('status', params.status)
      if (params.priority) query.set('priority', params.priority)
      if (params.transit_mode && params.transit_mode !== 'all') {
        query.set('transit_mode', params.transit_mode)
      }
      if (params.search) query.set('search', params.search)
      if (params.from_date) query.set('from_date', params.from_date)
      if (params.to_date) query.set('to_date', params.to_date)
      if (params.sort_by) query.set('sort_by', params.sort_by)

      const res = await request(`/complaints?${query.toString()}`)
      return {
        ...res,
        items: (res.items || []).map(normalizeAdminComplaint),
      }
    },

    async getById(id) {
      const res = await request(`/complaints/${id}`)
      return normalizeAdminComplaint(res)
    },

    async getStats(transitMode = 'all') {
      const query = transitMode && transitMode !== 'all' ? `?transit_mode=${transitMode}` : ''
      return request(`/complaints/stats${query}`)
    },

    async update(id, updateData) {
      const res = await request(`/complaints/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      })
      return normalizeAdminComplaint(res)
    },

    async addRemark(id, remarkData) {
      return request(`/complaints/${id}/remarks`, {
        method: 'POST',
        body: JSON.stringify(remarkData),
      })
    },
  },
}

export default api
