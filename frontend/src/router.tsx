import { createBrowserRouter, Navigate } from 'react-router-dom'

import RootGate from './components/routing/RootGate'
import RouteError from './components/routing/RouteError'
import ProtectedRoute from './components/routing/ProtectedRoute'
import ClienteRoute from './components/routing/ClienteRoute'
import BarbeariaRoute from './components/routing/BarbeariaRoute'
import AdminRoute from './components/routing/AdminRoute'
import AppLayout from './components/layout/AppLayout'

import HomePage from './pages/HomePage'
import ShopDetailPage from './pages/ShopDetailPage'
import AuthPage from './pages/AuthPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import AppointmentsPage from './pages/AppointmentsPage'
import AgendaPage from './pages/AgendaPage'
import ConfigPage from './pages/ConfigPage'
import RelatoriosPage from './pages/RelatoriosPage'
import PerfilPage from './pages/PerfilPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminClientesPage from './pages/AdminClientesPage'
import AdminAdministradoresPage from './pages/AdminAdministradoresPage'
import AdminBarbeariasPage from './pages/AdminBarbeariasPage'
import NotFoundPage from './pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <RootGate />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // ===== Público =====
          { path: '/', element: <HomePage /> },
          { path: '/barbearia/:id', element: <ShopDetailPage /> },
          { path: '/entrar', element: <AuthPage /> },
          // Alias legado para a tela de autenticação.
          { path: '/login', element: <Navigate to="/entrar" replace /> },
          { path: '/recuperar-senha', element: <ForgotPasswordPage /> },

          // ===== Autenticado (qualquer perfil) =====
          {
            element: <ProtectedRoute />,
            children: [{ path: '/perfil', element: <PerfilPage /> }],
          },

          // ===== Cliente (autenticado) =====
          {
            element: <ClienteRoute />,
            children: [{ path: '/meus-agendamentos', element: <AppointmentsPage /> }],
          },

          // ===== Barbearia (perfil Barbearia) =====
          {
            element: <BarbeariaRoute />,
            children: [
              { path: '/agenda', element: <AgendaPage /> },
              { path: '/configuracoes', element: <ConfigPage /> },
              { path: '/relatorios', element: <RelatoriosPage /> },
            ],
          },

          // ===== Administrador (perfil Administrador) =====
          {
            element: <AdminRoute />,
            children: [
              { path: '/admin', element: <AdminDashboardPage /> },
              { path: '/admin/clientes', element: <AdminClientesPage /> },
              { path: '/admin/administradores', element: <AdminAdministradoresPage /> },
              { path: '/admin/barbearias', element: <AdminBarbeariasPage /> },
            ],
          },

          // ===== 404 =====
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
