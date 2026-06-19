// Seção de gráficos de agendamentos do painel admin (Recharts).
// Donut de status (total no centro) + AreaChart de total por dia (−15..+15 dias).

import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { api, ApiError } from '../../lib/api'
import { toast } from '../../store/uiStore'
import { colors, fonts } from '../../lib/theme'
import type { Estatisticas, AgendamentoPorDia } from '../../lib/types'

const COR_STATUS = {
  agendado: '#1F7A4D',
  realizado: '#5C6B76',
  cancelado: '#B33A2B',
}

function ddmm(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export default function GraficosAgendamentos({ stats }: { stats: Estatisticas }) {
  const [serie, setSerie] = useState<AgendamentoPorDia[]>([])

  useEffect(() => {
    let vivo = true
    api
      .get<AgendamentoPorDia[]>('/admin/estatisticas/agendamentos-por-dia')
      .then((d) => vivo && setSerie(d))
      .catch((e) => toast.erro(e instanceof ApiError ? e.message : 'Falha ao carregar a série de agendamentos.'))
    return () => {
      vivo = false
    }
  }, [])

  const statusData = [
    { name: 'Agendados', value: stats.agendamentos_agendados, cor: COR_STATUS.agendado },
    { name: 'Realizados', value: stats.agendamentos_realizados, cor: COR_STATUS.realizado },
    { name: 'Cancelados', value: stats.agendamentos_cancelados, cor: COR_STATUS.cancelado },
  ]

  return (
    <div>
      <h2
        style={{
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize: 16,
          margin: '0 0 12px',
          color: '#5C6B76',
        }}
      >
        Agendamentos
      </h2>
      <div
        className="vdb-cfg-grid"
        style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'stretch' }}
      >
        {/* Donut de status */}
        <div style={cardStyle}>
          <div style={{ position: 'relative', width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="none"
                >
                  {statusData.map((s) => (
                    <Cell key={s.name} fill={s.cor} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Total no centro */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <span style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 30, color: colors.ink, lineHeight: 1 }}>
                {stats.total_agendamentos}
              </span>
              <span style={{ fontSize: 12, color: '#7B8990', fontWeight: 600 }}>total</span>
            </div>
          </div>
          {/* Legenda */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
            {statusData.map((s) => (
              <span key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#5C6B76' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: s.cor }} />
                {s.name} ({s.value})
              </span>
            ))}
          </div>
        </div>

        {/* Série temporal */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#7B8990', marginBottom: 16 }}>
            Agendamentos por dia (−15 a +15 dias)
          </div>
          <div style={{ flex: 1, minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="vdbArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.accent} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={colors.accent} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F3" vertical={false} />
              <XAxis
                dataKey="data"
                tickFormatter={ddmm}
                interval="preserveStartEnd"
                minTickGap={28}
                tick={{ fontSize: 11, fill: '#94A2A9' }}
                tickLine={false}
                axisLine={{ stroke: '#E3E9EC' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#94A2A9' }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                labelFormatter={(l) => ddmm(String(l))}
                formatter={(v) => [Number(v), 'Agendamentos'] as [number, string]}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke={colors.accentD}
                strokeWidth={2}
                fill="url(#vdbArea)"
              />
            </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: colors.branco,
  border: '1px solid #E3E9EC',
  borderRadius: 16,
  padding: 18,
}
