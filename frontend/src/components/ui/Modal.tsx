// Modal genérico do VouDeBarba (inline styles, sem Bootstrap).
// Overlay escuro + card central rolável. Fecha no X, clique fora ou Esc.

import { useEffect, type ReactNode } from 'react'
import { colors, fonts } from '../../lib/theme'

interface Props {
  aberto: boolean
  onClose: () => void
  titulo: string
  children: ReactNode
  maxWidth?: number
}

export default function Modal({ aberto, onClose, titulo, children, maxWidth = 560 }: Props) {
  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflowAnterior
    }
  }, [aberto, onClose])

  if (!aberto) return null

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(20, 28, 33, .55)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '48px 16px',
        overflowY: 'auto',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          background: colors.branco,
          borderRadius: 18,
          width: '100%',
          maxWidth,
          boxShadow: '0 24px 60px rgba(0,0,0,.28)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '20px 24px',
            borderBottom: '1px solid #EEF2F3',
          }}
        >
          <h2 style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 20, margin: 0, letterSpacing: '-.02em' }}>
            {titulo}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 22,
              lineHeight: 1,
              color: '#7B8990',
              padding: 4,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}
