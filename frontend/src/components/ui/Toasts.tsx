import { useEffect, type CSSProperties } from 'react'
import { useUIStore, type Toast } from '../../store/uiStore'
import { fonts } from '../../lib/theme'

// Cor de fundo por tipo (sem Bootstrap; inline styles).
const CORES: Record<string, { bg: string; fg: string }> = {
  success: { bg: '#1F7A4D', fg: '#fff' },
  danger: { bg: '#B33A2B', fg: '#fff' },
  warning: { bg: '#EF8434', fg: '#25343F' },
  info: { bg: '#25343F', fg: '#fff' },
}
const ICONES: Record<string, string> = {
  success: '✓',
  danger: '!',
  warning: '!',
  info: 'i',
}

function ToastItem({ toast }: { toast: Toast }) {
  const removerToast = useUIStore((s) => s.removerToast)
  useEffect(() => {
    const t = setTimeout(() => removerToast(toast.id), 5000)
    return () => clearTimeout(t)
  }, [toast.id, removerToast])

  const cor = CORES[toast.tipo] ?? CORES.info

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: cor.bg,
        color: cor.fg,
        borderRadius: 12,
        padding: '12px 14px',
        boxShadow: '0 10px 30px rgba(0,0,0,.25)',
        minWidth: 260,
        maxWidth: 420,
        fontSize: 14.5,
        fontWeight: 600,
        animation: 'vdbToast .2s ease-out',
      }}
    >
      <span
        style={{
          flex: 'none',
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.22)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 13,
          fontFamily: fonts.display,
        }}
      >
        {ICONES[toast.tipo] ?? 'i'}
      </span>
      <span style={{ flex: 1 }}>{toast.mensagem}</span>
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => removerToast(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: cor.fg,
          cursor: 'pointer',
          fontSize: 18,
          lineHeight: 1,
          opacity: 0.85,
          flex: 'none',
        }}
      >
        ×
      </button>
    </div>
  )
}

const container: CSSProperties = {
  position: 'fixed',
  left: '50%',
  bottom: 24,
  transform: 'translateX(-50%)',
  zIndex: 2000,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
  pointerEvents: 'none',
}

// Container de toasts (centralizado na base). Renderizado uma vez no RootGate.
export default function Toasts() {
  const toasts = useUIStore((s) => s.toasts)
  if (toasts.length === 0) return null
  return (
    <div style={container}>
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}
