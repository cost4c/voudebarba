import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

// Exige usuário autenticado E perfil Barbearia.
// Anônimo -> /entrar; logado sem perfil Barbearia -> home.
export default function BarbeariaRoute() {
  const usuario = useAuthStore((s) => s.usuario)
  const isBarbearia = useAuthStore((s) => s.isBarbearia())

  if (!usuario) return <Navigate to="/entrar" replace />
  if (!isBarbearia) return <Navigate to="/" replace />
  return <Outlet />
}
