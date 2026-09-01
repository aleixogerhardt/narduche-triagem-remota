import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { RequireAdmin, RequireAuth, RequireClient } from './components/Guards'
import { AdminCompaniesPage } from './pages/AdminCompaniesPage'
import { AdminPrintersPage } from './pages/AdminPrintersPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { PendingPage } from './pages/PendingPage'
import { ProfilePage } from './pages/ProfilePage'
import { SetupPage } from './pages/SetupPage'
import { TicketDetailPage } from './pages/TicketDetailPage'
import { TicketsPage } from './pages/TicketsPage'
import { TriagePage } from './pages/TriagePage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/configuracao', element: <SetupPage /> },
  { path: '/conta-pendente', element: <PendingPage /> },
  {
    element: <RequireAuth />,
    children: [{
      element: <AppLayout />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: '/chamados', element: <TicketsPage /> },
        { path: '/chamados/:id', element: <TicketDetailPage /> },
        { path: '/perfil', element: <ProfilePage /> },
        { element: <RequireClient />, children: [{ path: '/triagem', element: <TriagePage /> }] },
        { element: <RequireAdmin />, children: [
          { path: '/admin/empresas', element: <AdminCompaniesPage /> },
          { path: '/admin/equipamentos', element: <AdminPrintersPage /> },
        ] },
      ],
    }],
  },
])
