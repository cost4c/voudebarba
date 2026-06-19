import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

// Exige usuário autenticado E perfil Administrador.
// Anônimo -> /entrar; logado sem perfil Admin -> home.
export default function AdminRoute() {
  const usuario = useAuthStore((s) => s.usuario)
  const isAdmin = useAuthStore((s) => s.isAdmin())

  if (!usuario) return <Navigate to="/entrar" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
