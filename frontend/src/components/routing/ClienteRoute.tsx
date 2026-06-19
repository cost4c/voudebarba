import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

// Exige usuário autenticado (qualquer perfil logado). Anônimo -> /entrar.
export default function ClienteRoute() {
  const usuario = useAuthStore((s) => s.usuario)

  if (!usuario) return <Navigate to="/entrar" replace />
  return <Outlet />
}
