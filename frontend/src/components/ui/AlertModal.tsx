import { useUIStore } from '../../store/uiStore'
import { colors, fonts } from '../../lib/theme'

// Modal de alerta global (sem Bootstrap).
export default function AlertModal() {
  const alert = useUIStore((s) => s.alert)
  const fechar = useUIStore((s) => s.fecharAlerta)
  if (!alert) return null

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar()
      }}
      style={overlay}
    >
      <div role="dialog" aria-modal="true" style={card}>
        <h2 style={titulo}>{alert.titulo ?? 'Aviso'}</h2>
        <p style={{ margin: '0 0 6px', fontSize: 15, color: colors.ink }}>{alert.mensagem}</p>
        {alert.detalhes && <p style={{ margin: 0, fontSize: 13, color: '#7B8990' }}>{alert.detalhes}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
          <button type="button" onClick={fechar} style={btn}>
            Fechar
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
const btn: React.CSSProperties = {
  background: colors.accent,
  color: colors.ink,
  border: 'none',
  fontWeight: 700,
  fontSize: 14.5,
  padding: '11px 20px',
  borderRadius: 10,
  cursor: 'pointer',
}
