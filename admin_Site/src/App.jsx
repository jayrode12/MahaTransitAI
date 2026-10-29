import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Complaints from './pages/Complaints.jsx'
import ComplaintHistory from './pages/ComplaintHistory.jsx'
import ComplaintDetails from './pages/ComplaintDetails.jsx'
import { adminStorage, api } from './services/api.js'

export default function App() {
  const [page, setPage] = useState('landing')
  const [params, setParams] = useState({})
  const [adminUser, setAdminUser] = useState(() => adminStorage.getUser())
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!adminStorage.getUser())

  useEffect(() => {
    const user = adminStorage.getUser()
    if (user) {
      setAdminUser(user)
      setIsLoggedIn(true)
    }
  }, [])

  const navigate = (target, p = {}) => {
    const adminPages = ['dashboard', 'complaints', 'history', 'details']
    if (adminPages.includes(target) && !isLoggedIn) {
      setPage('login')
      setParams({})
      window.scrollTo(0, 0)
      return
    }
    setPage(target)
    setParams(p)
    window.scrollTo(0, 0)
  }

  const handleLogin = (user) => {
    if (user) {
      setAdminUser(user)
    }
    setIsLoggedIn(true)
    setPage('dashboard')
    window.scrollTo(0, 0)
  }

  const handleLogout = async () => {
    await api.auth.logout()
    setAdminUser(null)
    setIsLoggedIn(false)
    setPage('landing')
    window.scrollTo(0, 0)
  }

  if (page === 'landing') {
    return <LandingPage navigate={navigate} isLoggedIn={isLoggedIn} adminUser={adminUser} />
  }
  if (page === 'login') {
    return <LoginPage navigate={navigate} onLogin={handleLogin} />
  }
  if (page === 'dashboard') {
    return <Dashboard navigate={navigate} onLogout={handleLogout} adminUser={adminUser} />
  }
  if (page === 'complaints') {
    return <Complaints navigate={navigate} onLogout={handleLogout} adminUser={adminUser} />
  }
  if (page === 'history') {
    return <ComplaintHistory navigate={navigate} onLogout={handleLogout} adminUser={adminUser} />
  }
  if (page === 'details') {
    return <ComplaintDetails navigate={navigate} params={params} onLogout={handleLogout} adminUser={adminUser} />
  }

  return <LandingPage navigate={navigate} isLoggedIn={isLoggedIn} adminUser={adminUser} />
}
