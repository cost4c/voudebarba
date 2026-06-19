import type { ReactNode } from 'react'
import { fonts } from '../../lib/theme'

// Estado vazio reutilizável (sem Bootstrap; inline styles).
export default function EmptyState({
  icon = '✂️',
  titulo,
  mensagem,
  children,
}: {
  icon?: string
  titulo: string
  mensagem?: string
  children?: ReactNode
}) {
  return (
    <div style={{ textAlign: 'center', color: '#7B8990', padding: '48px 16px' }}>
      <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 18, color: '#25343F', margin: '0 0 6px' }}>
        {titulo}
      </h3>
      {mensagem && <p style={{ margin: '0 0 14px', fontSize: 14.5 }}>{mensagem}</p>}
      {children}
    </div>
  )
}
