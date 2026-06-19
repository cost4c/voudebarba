// Badge de status de agendamento. Portado de design/react-app/src/components/StatusBadge.jsx.
// Aceita os valores de domínio (StatusAgendamento: "Agendado"/"Realizado"/"Cancelado").
import { StatusAgendamento } from '../../lib/types'
import type { CSSProperties } from 'react'

const MAP: Record<string, { box: CSSProperties; label: string }> = {
  [StatusAgendamento.AGENDADO]: {
    box: { background: '#FFE7D2', color: '#9A4E16' },
    label: 'Agendado',
  },
  [StatusAgendamento.REALIZADO]: {
    box: { background: '#E2ECE6', color: '#2E6A4C' },
    label: 'Realizado',
  },
  [StatusAgendamento.CANCELADO]: {
    box: { background: '#ECEFF1', color: '#7B8990' },
    label: 'Cancelado',
  },
}

export default function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? MAP[StatusAgendamento.AGENDADO]
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '5px 11px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        ...s.box,
      }}
    >
      {s.label}
    </span>
  )
}
