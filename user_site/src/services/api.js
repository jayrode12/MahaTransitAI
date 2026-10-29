const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const USER_STORAGE_KEY = 'mahatransit_citizen_user'

export const authStorage = {
  getUser() {
    try {
      const data = localStorage.getItem(USER_STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  },
  setUser(user) {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } catch (e) {
      console.error('Failed to save user session', e)
    }
  },
  clearUser() {
    try {
      localStorage.removeItem(USER_STORAGE_KEY)
    } catch (e) {
      console.error('Failed to clear user session', e)
    }
  },
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const user = authStorage.getUser()

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
      if (Array.isArray(errorJson.detail)) {
        errorDetail = errorJson.detail.map(d => `${d.loc ? d.loc.slice(-1)[0] + ': ' : ''}${d.msg}`).join(', ')
      } else if (typeof errorJson.detail === 'object' && errorJson.detail !== null) {
        errorDetail = JSON.stringify(errorJson.detail)
      } else {
        errorDetail = errorJson.detail || errorJson.message || errorDetail
      }
    } catch {
      errorDetail = `${response.status} ${response.statusText}`
    }
    throw new Error(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail))
  }

  return response.json()
}

// Format transit mode for UI
export function formatTransport(mode) {
  const m = (mode || '').toLowerCase()
  if (m === 'metro') return 'Metro'
  if (m === 'bus') return 'Bus'
  if (m === 'train') return 'Railway'
  return mode || 'Metro'
}

// Normalize backend status to display status
export function formatStatus(status) {
  const s = (status || '').toLowerCase()
  if (s === 'submitted') return 'Submitted'
  if (s === 'assigned') return 'Assigned'
  if (s === 'accepted') return 'Accepted'
  if (s === 'in_progress') return 'In Progress'
  if (s === 'resolved') return 'Resolved'
  if (s === 'closed') return 'Closed'
  if (s === 'rejected') return 'Rejected'
  return status || 'Submitted'
}

// Normalize backend priority to display priority
export function formatPriority(priority) {
  const p = (priority || '').toLowerCase()
  if (p === 'low') return 'Low'
  if (p === 'medium') return 'Medium'
  if (p === 'high') return 'High'
  if (p === 'critical') return 'Critical'
  return priority || 'Medium'
}

// Normalizes a complaint object from API to UI friendly shape
export function normalizeComplaint(c) {
  if (!c) return null

  const d = c.created_at ? new Date(c.created_at) : new Date()
  const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const formData = c.form_data || {}
  const station = formData.station || formData.station_or_stop_name || formData.boarding_station || formData.boarding_stop || 'Mumbai Central'
  const line = formData.line || formData.line_or_route_number || formData.route || formData.local_line || 'Main Line'
  const location = formData.location || station

  const imageAttachments = (c.attachments || []).filter(a => a.attachment_type === 'image' || a.mime_type?.startsWith('image') || (a.file_url && (a.file_url.startsWith('data:image') || a.file_url.match(/\.(jpeg|jpg|png|webp|gif)/i))))
  const image = imageAttachments.length > 0 ? imageAttachments[0].file_url : null

  return {
    id: c.ticket_number || c.id,
    dbId: c.id,
    ticket_number: c.ticket_number,
    title: c.title,
    description: c.description_original,
    description_english: c.description_english || c.description_original,
    transport: formatTransport(c.transit_mode),
    rawTransitMode: c.transit_mode,
    status: formatStatus(c.status),
    priority: formatPriority(c.priority),
    date: dateStr,
    time: timeStr,
    created_at: c.created_at,
    station,
    line,
    location,
    direction: formData.direction || '—',
    train_type: formData.train_type || '—',
    bus_type: formData.bus_type || '—',
    journey_date: formData.journey_date || dateStr,
    journey_time: formData.journey_time || timeStr,
    image,
    form_data: formData,
    attachments: c.attachments || [],
    remarks: c.remarks || [],
    ai_result: c.ai_result || null,
    duplicate_count: c.duplicate_count || 0,
    submittedBy: formData.passenger_name || 'Passenger',
    submittedEmail: formData.passenger_email || '',
    category: c.category?.category_name || formData.category || 'General Grievance',
  }
}

export const api = {
  auth: {
    async login({ email, password }) {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, user_type: 'citizen' }),
      })
      authStorage.setUser(data)
      return data
    },
    async register({ full_name, email, phone, password, preferred_language = 'en' }) {
      const data = await request('/citizens/register', {
        method: 'POST',
        body: JSON.stringify({ full_name, email, phone, password, preferred_language }),
      })
      // Auto login session on register
      const sessionUser = {
        user_id: data.id,
        user_type: 'citizen',
        role: 'citizen',
        full_name: data.full_name,
        email: data.email,
        preferred_language: data.preferred_language,
      }
      authStorage.setUser(sessionUser)
      return sessionUser
    },
    async logout() {
      try {
        await request('/auth/logout', { method: 'POST' })
      } catch (e) {
        console.warn('Logout API warning:', e)
      }
      authStorage.clearUser()
    },
    getCurrentUser() {
      return authStorage.getUser()
    },
  },

  complaints: {
    async list(params = {}) {
      const query = new URLSearchParams()
      if (params.page) query.set('page', params.page)
      if (params.limit) query.set('limit', params.limit)
      if (params.status) query.set('status', params.status)
      if (params.priority) query.set('priority', params.priority)
      if (params.transit_mode) query.set('transit_mode', params.transit_mode)
      if (params.citizen_id) query.set('citizen_id', params.citizen_id)
      if (params.search) query.set('search', params.search)
      if (params.from_date) query.set('from_date', params.from_date)
      if (params.to_date) query.set('to_date', params.to_date)
      if (params.sort_by) query.set('sort_by', params.sort_by)

      const res = await request(`/complaints?${query.toString()}`)
      return {
        ...res,
        items: (res.items || []).map(normalizeComplaint),
      }
    },

    async getById(id) {
      const res = await request(`/complaints/${id}`)
      return normalizeComplaint(res)
    },

    async track(ticketNumber) {
      const res = await request(`/complaints/track/${encodeURIComponent(ticketNumber)}`)
      return normalizeComplaint(res)
    },

    async create(complaintData) {
      const res = await request('/complaints', {
        method: 'POST',
        body: JSON.stringify(complaintData),
      })
      return normalizeComplaint(res)
    },

    async update(id, updateData) {
      const res = await request(`/complaints/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      })
      return normalizeComplaint(res)
    },

    async addRemark(id, remarkData) {
      return request(`/complaints/${id}/remarks`, {
        method: 'POST',
        body: JSON.stringify(remarkData),
      })
    },

    async getStats(transitMode = 'all') {
      const query = transitMode && transitMode !== 'all' ? `?transit_mode=${transitMode}` : ''
      return request(`/complaints/stats${query}`)
    },
  },

  citizens: {
    async getById(citizenId) {
      return request(`/citizens/${citizenId}`)
    },
    async getProfile() {
      return request('/citizens/profile')
    },
    async updateProfile(profileData) {
      return request('/citizens/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      })
    },
    async getComplaints(citizenId, params = {}) {
      const query = new URLSearchParams()
      if (params.page) query.set('page', params.page)
      if (params.limit) query.set('limit', params.limit)
      if (params.status) query.set('status', params.status)
      const res = await request(`/citizens/${citizenId}/complaints?${query.toString()}`)
      return {
        ...res,
        items: (res.items || []).map(normalizeComplaint),
      }
    },
  },
}

export default api

