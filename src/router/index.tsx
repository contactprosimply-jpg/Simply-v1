import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuthStore } from '../stores/authStore'
import { useChantierStore } from '../stores/chantierStore'

function AppRoutes() {
  const initialize = useAuthStore((s) => s.initialize)
  const session = useAuthStore((s) => s.session)
  const fetchChantiers = useChantierStore((s) => s.fetchChantiers)

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    if (session) {
      void fetchChantiers()
    }
  }, [session, fetchChantiers])

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
