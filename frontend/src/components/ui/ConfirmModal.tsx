import { useState } from 'react'
import { useUIStore } from '../../store/uiStore'
import { colors, fonts } from '../../lib/theme'

// Modal de confirmação global (sem Bootstrap). Disparado por
// useUIStore().pedirConfirmacao({ mensagem, onConfirmar, ... }).
export default function ConfirmModal() {
  const confirm = useUIStore((s) => s.confirm)
  const fechar = useUIStore((s) => s.fecharConfirmacao)
  const [processando, setProcessando] = useState(false)

  if (!confirm) return null

  const tipo = confirm.tipo ?? 'danger'
  const corAcao = tipo === 'danger' ? '#B33A2B' : '#EF8434'

  async function confirmar() {
    try {
      setProcessando(true)
      await confirm!.onConfirmar()
      fechar()
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !processando) fechar()
      }}
      style={overlay}
    >
      <div role="dialog" aria-modal="true" style={card}>
        <h2 style={titulo}>{confirm.titulo ?? 'Confirmar ação'}</h2>
        <p style={{ margin: '0 0 6px', fontSize: 15, color: colors.ink }}>{confirm.mensagem}</p>
        {confirm.detalhes && <p style={{ margin: 0, fontSize: 13, color: '#7B8990' }}>{confirm.detalhes}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button type="button" onClick={fechar} disabled={processando} style={btnSecundario}>
            {confirm.textoCancelar ?? 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={processando}
            style={{ ...btnAcao, background: corAcao, opacity: processando ? 0.7 : 1 }}
          >
            {processando ? 'Processando…' : confirm.textoConfirmar ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1100,
  background: 'rgba(20, 28, 33, .55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}
const card: React.CSSProperties = {
  background: colors.branco,
  borderRadius: 16,
  width: '100%',
  maxWidth: 440,
  padding: 26,
  boxShadow: '0 24px 60px rgba(0,0,0,.28)',
}
const titulo: React.CSSProperties = {
  fontFamily: fonts.display,
  fontWeight: 800,
  fontSize: 19,
  margin: '0 0 10px',
  letterSpacing: '-.02em',
}
const btnSecundario: React.CSSProperties = {
  background: 'none',
  border: '1px solid #DCE3E7',
  color: '#5C6B76',
  fontWeight: 700,
  fontSize: 14.5,
  padding: '11px 18px',
  borderRadius: 10,
  cursor: 'pointer',
}
const btnAcao: React.CSSProperties = {
  color: '#fff',
  border: 'none',
  fontWeight: 700,
  fontSize: 14.5,
  padding: '11px 20px',
  borderRadius: 10,
  cursor: 'pointer',
}
