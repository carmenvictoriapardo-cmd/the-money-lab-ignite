import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import PactoPage from './pages/PactoPage'
import DashboardPage from './pages/DashboardPage'
import CREARPage from './pages/CREARPage'
import IdentityPage from './pages/IdentityPage'
import StandupPage from './pages/StandupPage'
import BlockerPage from './pages/BlockerPage'
import ReviewPage from './pages/ReviewPage'
import RevenuePage from './pages/RevenuePage'
import AdminPage from './pages/AdminPage'
import EvidencePage from './pages/EvidencePage'
import DailyActionPage from './pages/DailyActionPage'
import OfferBuilderPage from './pages/OfferBuilderPage'
import SalesRoleplayPage from './pages/SalesRoleplayPage'
import StoryBrandPage from './pages/StoryBrandPage'
import AppLayout from './components/layout/AppLayout'

const GOLD = '#C9A84C'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
      <div className="text-center">
        <div
          className="w-8 h-8 rounded-full animate-spin mx-auto mb-3"
          style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }}
        />
        <p className="text-gray-400 text-sm">Cargando...</p>
      </div>
    </div>
  )
}

function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

function AppRoutes() {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />

  return (
    <Routes>
      {/* Público */}
      <Route
        path="/login"
        element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* Protegido sin sidebar (onboarding) */}
      <Route element={<RequireAuth />}>
        <Route path="/pacto" element={<PactoPage />} />
      </Route>

      {/* Protegido con sidebar (app principal) */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/crear" element={<CREARPage />} />
          <Route path="/identidad" element={<IdentityPage />} />
          <Route path="/standup" element={<StandupPage />} />
          <Route path="/bloqueos" element={<BlockerPage />} />
          <Route path="/reviews" element={<ReviewPage />} />
          <Route path="/revenue" element={<RevenuePage />} />
          <Route path="/accion" element={<DailyActionPage />} />
          <Route path="/oferta" element={<OfferBuilderPage />} />
          <Route path="/roleplay" element={<SalesRoleplayPage />} />
          <Route path="/evidencia" element={<EvidencePage />} />
          <Route path="/storybrand" element={<StoryBrandPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      {/* Redirect raíz */}
      <Route
        path="/"
        element={<Navigate to={session ? '/dashboard' : '/login'} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
