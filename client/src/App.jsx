import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Spinner from './components/ui/Spinner'

const AppLayout = lazy(() => import('./components/layout/AppLayout'))
const CommandPalette = lazy(() => import('./components/ui/CommandPalette'))
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage'))
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'))
const Sessions = lazy(() => import('./pages/Sessions/Sessions'))
const Analytics = lazy(() => import('./pages/Analytics/Analytics'))
const Goals = lazy(() => import('./pages/Goals/Goals'))
const Notes = lazy(() => import('./pages/Notes/Notes'))
const Weakness = lazy(() => import('./pages/Weakness/Weakness'))
const Coach = lazy(() => import('./pages/Coach/Coach'))
const Gamification = lazy(() => import('./pages/Gamification/Gamification'))
const Predictions = lazy(() => import('./pages/Predictions/Predictions'))
const FocusFlow = lazy(() => import('./pages/FocusFlow/FocusFlow'))

function RouteFallback({ full = false }) {
  return (
    <div className={full ? 'h-screen flex items-center justify-center' : 'h-64 flex items-center justify-center'}>
      <Spinner size="lg" />
    </div>
  )
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <RouteFallback full />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <RouteFallback full />
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
      <Suspense fallback={null}>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </Suspense>
      <Routes>
        <Route path="/login" element={
          <GuestOnly>
            <Suspense fallback={<RouteFallback full />}>
              <LoginPage />
            </Suspense>
          </GuestOnly>
        } />
        <Route path="/register" element={
          <GuestOnly>
            <Suspense fallback={<RouteFallback full />}>
              <RegisterPage />
            </Suspense>
          </GuestOnly>
        } />
        <Route path="/" element={
          <RequireAuth>
            <Suspense fallback={<RouteFallback full />}>
              <AppLayout onPalette={() => setPaletteOpen(true)} />
            </Suspense>
          </RequireAuth>
        }>
          <Route index element={
            <Suspense fallback={<RouteFallback />}>
              <Dashboard />
            </Suspense>
          } />
          <Route path="focus" element={
            <Suspense fallback={<RouteFallback full />}>
              <FocusFlow />
            </Suspense>
          } />
          <Route path="sessions" element={
            <Suspense fallback={<RouteFallback />}>
              <Sessions />
            </Suspense>
          } />
          <Route path="analytics" element={
            <Suspense fallback={<RouteFallback />}>
              <Analytics />
            </Suspense>
          } />
          <Route path="goals" element={
            <Suspense fallback={<RouteFallback />}>
              <Goals />
            </Suspense>
          } />
          <Route path="notes" element={
            <Suspense fallback={<RouteFallback />}>
              <Notes />
            </Suspense>
          } />
          <Route path="weakness" element={
            <Suspense fallback={<RouteFallback />}>
              <Weakness />
            </Suspense>
          } />
          <Route path="predictions" element={
            <Suspense fallback={<RouteFallback />}>
              <Predictions />
            </Suspense>
          } />
          <Route path="coach" element={
            <Suspense fallback={<RouteFallback />}>
              <Coach />
            </Suspense>
          } />
          <Route path="gamification" element={
            <Suspense fallback={<RouteFallback />}>
              <Gamification />
            </Suspense>
          } />
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
