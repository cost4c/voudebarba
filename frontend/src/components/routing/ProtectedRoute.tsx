import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

// Exige apenas usuário autenticado (qualquer perfil). Anônimo -> /entrar.
// Usado por rotas comuns a todos os perfis (ex.: edição do próprio perfil).
export default function ProtectedRoute() {
  const usuario = useAuthStore((s) => s.usuario)
  if (!usuario) return <Navigate to="/entrar" replace />
  return <Outlet />
}
