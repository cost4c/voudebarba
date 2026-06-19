// Cabeçalho numerado de etapa (tela de agendamento).
// Portado de design/react-app/src/components/StepHeading.jsx.
import type { ReactNode } from 'react'

interface StepHeadingProps {
  n: number | string
  children: ReactNode
}

export default function StepHeading({ n, children }: StepHeadingProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          background: 'var(--accent-soft)',
          color: 'var(--accent-d)',
          fontWeight: 800,
          fontSize: 13,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Archivo', sans-serif",
        }}
      >
        {n}
      </span>
      <h2
        style={{
          fontFamily: "'Archivo', sans-serif",
          fontWeight: 700,
          fontSize: 18,
          margin: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </h2>
    </div>
  )
}
