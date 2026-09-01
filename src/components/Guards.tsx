import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { Spinner } from './ui'

export function RequireAuth() {
  const { session, profile, loading } = useAuth()
  if (loading) return <div className="min-h-screen"><Spinner label="Validando sessão..." /></div>
  if (!session) return <Navigate to="/login" replace />
  if (!profile?.active) return <Navigate to="/conta-pendente" replace />
  return <Outlet />
}

export function RequireAdmin() {
  const { profile } = useAuth()
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}

export function RequireClient() {
  const { profile } = useAuth()
  if (profile?.role !== 'client') return <Navigate to="/" replace />
  return <Outlet />
}
