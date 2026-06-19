import { Link } from 'react-router-dom'
import { colors, fonts } from '../lib/theme'

// Página 404 — estilo inline coerente com o design VouDeBarba.
export default function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <div
        style={{
          fontFamily: fonts.display,
          fontWeight: 800,
          fontSize: 72,
          color: colors.accent,
          lineHeight: 1,
        }}
      >
        404
      </div>
      <h2 style={{ fontFamily: fonts.display, fontWeight: 700, margin: '12px 0 8px' }}>
        Página não encontrada
      </h2>
      <p style={{ color: colors.mut, marginBottom: 24 }}>
        A página que você procura não existe ou foi movida.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-block',
          background: colors.ink,
          color: '#fff',
          fontWeight: 700,
          fontSize: 14.5,
          padding: '11px 22px',
          borderRadius: 10,
          textDecoration: 'none',
        }}
      >
        Voltar ao início
      </Link>
    </div>
  )
}
