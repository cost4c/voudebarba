// Tira de datas. Portado de design/react-app/src/components/DateChips.jsx.
// Usado na tela de agendamento (com dias fechados conforme horários da
// barbearia) e no painel de agenda (sem restrição). `horarios` é opcional.
import type { CSSProperties } from 'react'
import { DOWS, MONS, isoLocal, addDays } from '../../lib/datas'
import type { Horario } from '../../lib/types'

interface DateChipsProps {
  count: number
  selected: string
  onSelect: (iso: string) => void
  /** Horários de funcionamento; quando fornecidos, marcam dias fechados. */
  horarios?: Horario[]
  scroll?: boolean
  width?: number
}

export default function DateChips({
  count,
  selected,
  onSelect,
  horarios,
  scroll = false,
  width = 62,
}: DateChipsProps) {
  const chips = []
  for (let i = 0; i < count; i++) {
    const d = addDays(i)
    const iso = isoLocal(d)
    const dw = d.getDay()
    const h = horarios?.find((x) => x.dia_semana === dw)
    const closed = horarios ? !h || !h.ativo : false
    const isSel = selected === iso

    let box: CSSProperties
    if (isSel) box = { background: '#25343F', color: '#fff', border: '1px solid #25343F' }
    else if (closed)
      box = {
        background: '#F2F5F6',
        color: '#B6C2C8',
        border: '1px solid #E8EDEF',
        cursor: 'not-allowed',
      }
    else box = { background: '#fff', color: '#25343F', border: '1px solid #E3E9EC' }

    chips.push(
      <button
        key={iso}
        onClick={() => {
          if (!closed) onSelect(iso)
        }}
        style={{
          flex: 'none',
          width,
          cursor: closed ? 'not-allowed' : 'pointer',
          borderRadius: 12,
          padding: '11px 0',
          textAlign: 'center',
          transition: '.12s',
          ...box,
        }}
      >
        <span
          style={{
            display: 'block',
            fontSize: 11.5,
            fontWeight: 600,
            textTransform: 'uppercase',
            opacity: 0.8,
          }}
        >
          {DOWS[dw]}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 20,
            fontWeight: 800,
            fontFamily: "'Archivo', sans-serif",
            lineHeight: 1.2,
          }}
        >
          {String(d.getDate()).padStart(2, '0')}
        </span>
        <span style={{ display: 'block', fontSize: 11, opacity: 0.7 }}>{MONS[d.getMonth()]}</span>
      </button>,
    )
  }

  return (
    <div
      style={
        scroll
          ? { display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 6 }
          : { display: 'flex', flexWrap: 'wrap', gap: 9 }
      }
    >
      {chips}
    </div>
  )
}
