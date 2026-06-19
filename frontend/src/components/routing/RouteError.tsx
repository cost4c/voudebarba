import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { colors, fonts } from '../../lib/theme'

// errorElement da rota raiz: isola crashes de render (sem Bootstrap).
export default function RouteError() {
  const error = useRouteError()

  let titulo = 'Algo deu errado'
  let detalhe = 'Ocorreu um erro inesperado ao renderizar esta página.'

  if (isRouteErrorResponse(error)) {
    titulo = `${error.status} ${error.statusText}`
    detalhe = typeof error.data === 'string' ? error.data : detalhe
  } else if (error instanceof Error) {
    detalhe = error.message
  }

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
        background: colors.bg,
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
      <h2 style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 24, margin: '0 0 8px', color: colors.ink }}>
        {titulo}
      </h2>
      <p style={{ color: '#7B8990', margin: '0 0 22px', fontSize: 15, maxWidth: 480 }}>{detalhe}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <Link
          to="/"
          style={{
            background: colors.accent,
            color: colors.ink,
            fontWeight: 700,
            fontSize: 14.5,
            padding: '11px 20px',
            borderRadius: 10,
            textDecoration: 'none',
          }}
        >
          Início
        </Link>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#fff',
            border: '1px solid #DCE3E7',
            color: colors.ink,
            fontWeight: 700,
            fontSize: 14.5,
            padding: '11px 20px',
            borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          Recarregar
        </button>
      </div>
    </div>
  )
}
