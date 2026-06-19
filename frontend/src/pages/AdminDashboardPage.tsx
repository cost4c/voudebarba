// AdminDashboardPage — visão geral da plataforma (perfil Administrador).
// Consome GET /api/admin/estatisticas e exibe cartões de indicadores.

import { useEffect, useState, type CSSProperties } from 'react'
import { api, ApiError } from '../lib/api'
import { toast } from '../store/uiStore'
import { colors, fonts } from '../lib/theme'
import type { Estatisticas } from '../lib/types'
import GraficosAgendamentos from '../components/admin/GraficosAgendamentos'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Estatisticas | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let vivo = true
    api
      .get<Estatisticas>('/admin/estatisticas')
      .then((d) => vivo && setStats(d))
      .catch((e) =>
        toast.erro(e instanceof ApiError ? e.message : 'Falha ao carregar estatísticas.'),
      )
      .finally(() => vivo && setCarregando(false))
    return () => {
      vivo = false
    }
  }, [])

  return (
    <section>
      <h1 style={tituloStyle}>Painel da plataforma</h1>
      <p style={{ margin: '0 0 24px', color: '#5C6B76', fontSize: 15 }}>
        Visão geral de usuários, barbearias e agendamentos do VouDeBarba.
      </p>

      {carregando ? (
        <p style={{ color: '#5C6B76', fontSize: 15 }}>Carregando…</p>
      ) : !stats ? (
        <p style={{ color: '#5C6B76', fontSize: 15 }}>Não foi possível carregar os dados.</p>
      ) : (
        <>
          <Grupo titulo="Usuários">
            <Card valor={stats.total_usuarios} rotulo="Total de usuários" destaque />
            <Card valor={stats.total_clientes} rotulo="Clientes" />
            <Card valor={stats.total_donos_barbearia} rotulo="Barbearias (donos)" />
            <Card valor={stats.total_admins} rotulo="Administradores" />
          </Grupo>

          <Grupo titulo="Catálogo">
            <Card valor={stats.total_barbearias} rotulo="Barbearias" destaque />
            <Card valor={stats.total_barbearias_ativas} rotulo="Barbearias ativas" />
            <Card valor={stats.total_barbeiros} rotulo="Barbeiros" />
            <Card valor={stats.total_servicos} rotulo="Serviços" />
          </Grupo>

          <GraficosAgendamentos stats={stats} />
        </>
      )}
    </section>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2
        style={{
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize: 16,
          margin: '0 0 12px',
          color: '#5C6B76',
        }}
      >
        {titulo}
      </h2>
      <div
        className="vdb-shops-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}
      >
        {children}
      </div>
    </div>
  )
}

function Card({
  valor,
  rotulo,
  destaque,
  cor,
}: {
  valor: number
  rotulo: string
  destaque?: boolean
  cor?: string
}) {
  return (
    <div
      style={{
        background: colors.branco,
        border: '1px solid #E3E9EC',
        borderRadius: 16,
        padding: '22px 20px',
      }}
    >
      <div
        style={{
          fontFamily: fonts.display,
          fontWeight: 800,
          fontSize: 34,
          lineHeight: 1,
          letterSpacing: '-.02em',
          color: cor ?? (destaque ? colors.accentD : colors.ink),
        }}
      >
        {valor}
      </div>
      <div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600, color: '#7B8990' }}>
        {rotulo}
      </div>
    </div>
  )
}

const tituloStyle: CSSProperties = {
  fontFamily: fonts.display,
  fontWeight: 800,
  fontSize: 30,
  margin: '0 0 4px',
  letterSpacing: '-.02em',
}

