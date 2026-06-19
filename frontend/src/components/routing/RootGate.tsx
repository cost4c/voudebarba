import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Toasts from '../ui/Toasts'
import ConfirmModal from '../ui/ConfirmModal'
import AlertModal from '../ui/AlertModal'
import { colors } from '../../lib/theme'

// Componente raiz: verifica a sessão (GET /api/me) uma vez no boot e
// segura a renderização até saber se há usuário logado. Também monta os
// portais de overlay (toasts/modais) UMA única vez para toda a app.
export default function RootGate() {
  const carregando = useAuthStore((s) => s.carregando)
  const carregarSessao = useAuthStore((s) => s.carregarSessao)

  useEffect(() => {
    carregarSessao()
  }, [carregarSessao])

  if (carregando) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: colors.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: `3px solid ${colors.borda}`,
            borderTopColor: colors.accent,
            borderRadius: '50%',
            animation: 'vdbSpin 0.8s linear infinite',
          }}
          role="status"
          aria-label="Carregando"
        />
      </div>
    )
  }

  return (
    <>
      <Outlet />
      <Toasts />
      <ConfirmModal />
      <AlertModal />
    </>
  )
}
