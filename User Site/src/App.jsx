import { useState, useEffect } from 'react'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NewComplaint from './pages/NewComplaint'
import History from './pages/History'
import ComplaintDetails from './pages/ComplaintDetails'
import { authStorage, api } from './services/api'

const PROTECTED = ['dashboard', 'new-complaint', 'history', 'complaint-details']

export default function App() {
  const [page, setPage] = useState('landing')
  const [currentUser, setCurrentUser] = useState(() => authStorage.getUser())
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!authStorage.getUser())
  const [selectedComplaintId, setSelectedComplaintId] = useState(null)
  const [redirectAfterLogin, setRedirectAfterLogin] = useState('dashboard')
  const [routeParams, setRouteParams] = useState({})

  useEffect(() => {
    const user = authStorage.getUser()
    if (user) {
      setCurrentUser(user)
      setIsLoggedIn(true)
    }
  }, [])

  function navigate(target, params = {}) {
    setRouteParams(params)
    if (params.id) {
      setSelectedComplaintId(params.id)
    }

    if (PROTECTED.includes(target) && !isLoggedIn) {
      setRedirectAfterLogin(target)
      setPage('login')
    } else {
      setPage(target)
    }
    window.scrollTo(0, 0)
  }

  function handleLogin(user) {
    if (user) {
      setCurrentUser(user)
    }
    setIsLoggedIn(true)
    setPage(redirectAfterLogin || 'dashboard')
    window.scrollTo(0, 0)
  }

  async function handleLogout() {
    await api.auth.logout()
    setCurrentUser(null)
    setIsLoggedIn(false)
    setPage('landing')
    window.scrollTo(0, 0)
  }

  function viewComplaint(id) {
    setSelectedComplaintId(id)
    setPage('complaint-details')
    window.scrollTo(0, 0)
  }

  if (page === 'landing') {
    return <Landing onNavigate={navigate} isLoggedIn={isLoggedIn} currentUser={currentUser} />
  }
  if (page === 'login') {
    return <Login onNavigate={navigate} onLogin={handleLogin} />
  }
  if (page === 'register') {
    return <Register onNavigate={navigate} onLogin={handleLogin} />
  }
  if (page === 'dashboard') {
    return (
      <Dashboard
        onNavigate={navigate}
        onViewComplaint={viewComplaint}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
    )
  }
  if (page === 'new-complaint') {
    return (
      <NewComplaint
        onNavigate={navigate}
        onLogout={handleLogout}
        currentUser={currentUser}
        initialTransport={routeParams.transport || 'Metro'}
      />
    )
  }
  if (page === 'history') {
    return (
      <History
        onNavigate={navigate}
        onViewComplaint={viewComplaint}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
    )
  }
  if (page === 'complaint-details') {
    return (
      <ComplaintDetails
        complaintId={selectedComplaintId}
        onNavigate={navigate}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
    )
  }

  return <Landing onNavigate={navigate} isLoggedIn={isLoggedIn} />
}
