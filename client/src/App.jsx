import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import CommandPalette from './components/ui/CommandPalette'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import Dashboard from './pages/Dashboard/Dashboard'
import Sessions from './pages/Sessions/Sessions'
import Analytics from './pages/Analytics/Analytics'
import Goals from './pages/Goals/Goals'
import Notes from './pages/Notes/Notes'
import Weakness from './pages/Weakness/Weakness'
import Coach from './pages/Coach/Coach'
import Gamification from './pages/Gamification/Gamification'
import Predictions from './pages/Predictions/Predictions'
import FocusFlow from './pages/FocusFlow/FocusFlow'
import Spinner from './components/ui/Spinner'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner size="lg" /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner size="lg" /></div>
  if (user) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  const [paletteOpen, setPaletteOpen] = useState(false)

  const handleKey = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      if (user) setPaletteOpen(p => !p)
    }
  }, [user])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Routes>
        <Route path="/login"    element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
        <Route path="/focus"    element={<RequireAuth><FocusFlow /></RequireAuth>} />
        <Route path="/" element={<RequireAuth><AppLayout onPalette={() => setPaletteOpen(true)} /></RequireAuth>}>
          <Route index              element={<Dashboard />} />
          <Route path="sessions"    element={<Sessions />} />
          <Route path="analytics"   element={<Analytics />} />
          <Route path="goals"       element={<Goals />} />
          <Route path="notes"       element={<Notes />} />
          <Route path="weakness"    element={<Weakness />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="coach"       element={<Coach />} />
          <Route path="gamification" element={<Gamification />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
