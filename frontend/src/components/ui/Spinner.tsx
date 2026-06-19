import { colors } from '../../lib/theme'

// Indicador de carregamento centralizado (sem Bootstrap).
export default function Spinner({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 16px' }}>
      <span
        role="status"
        aria-label={texto}
        style={{
          display: 'inline-block',
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '3px solid #DCE3E7',
          borderTopColor: colors.accent,
          animation: 'vdbSpin .7s linear infinite',
        }}
      />
      {texto && <p style={{ color: '#7B8990', marginTop: 12, marginBottom: 0, fontSize: 14 }}>{texto}</p>}
    </div>
  )
}
