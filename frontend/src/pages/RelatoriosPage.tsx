// RelatoriosPage — Relatório de ocupação dos barbeiros (perfil Barbearia).
// Consome GET /api/barbearia/estatisticas/ocupacao?data= e mostra uma barra
// de progresso por barbeiro (Recharts), igual ao estilo do painel admin.

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'
import { api, ApiError } from '../lib/api'
import { toast } from '../store/uiStore'
import { colors, fonts } from '../lib/theme'
import { isoLocal } from '../lib/datas'
import type { Ocupacao } from '../lib/types'

// Cor da barra conforme o nível de ocupação.
function corPercentual(p: number): string {
  if (p >= 80) return '#B33A2B' // lotado (vermelho)
  if (p >= 50) return colors.accentD // movimentado (laranja escuro)
  return '#1F7A4D' // tranquilo (verde)
}

export default function RelatoriosPage() {
  // Data selecionada (default: hoje, no fuso local).
  const [data, setData] = useState(() => isoLocal(new Date()))
  const [ocupacao, setOcupacao] = useState<Ocupacao[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async (dia: string) => {
    setCarregando(true)
    try {
      const d = await api.get<Ocupacao[]>('/barbearia/estatisticas/ocupacao', {
        params: { data: dia },
      })
      setOcupacao(d)
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Falha ao carregar o relatório.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar(data)
  }, [carregar, data])

  return (
    <section>
      <h1 style={tituloStyle}>Relatório de ocupação</h1>
      <p style={{ margin: '0 0 24px', color: '#5C6B76', fontSize: 15 }}>
        Percentual de minutos ocupados de cada barbeiro no dia selecionado.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#5C6B76' }}>Dia</label>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          style={{
            background: '#fff',
            border: '1px solid #DCE3E7',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 14,
            color: '#25343F',
          }}
        />
      </div>

      {carregando ? (
        <p style={{ color: '#5C6B76', fontSize: 15 }}>Carregando…</p>
      ) : ocupacao.length === 0 ? (
        <p style={{ color: '#5C6B76', fontSize: 15 }}>
          Nenhum barbeiro cadastrado nesta barbearia.
        </p>
      ) : (
        <div style={cardStyle}>
          <div style={{ width: '100%', height: Math.max(ocupacao.length * 56, 120) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={ocupacao}
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 11, fill: '#94A2A9' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E3E9EC' }}
                />
                <YAxis
                  type="category"
                  dataKey="barbeiro_nome"
                  width={120}
                  tick={{ fontSize: 12.5, fill: '#5C6B76' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v)}%`, 'Ocupação'] as [string, string]}
                />
                <Bar dataKey="percentual" radius={[0, 6, 6, 0]} barSize={22}>
                  {ocupacao.map((o) => (
                    <Cell key={o.barbeiro_id} fill={corPercentual(o.percentual)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lista detalhada abaixo do gráfico. */}
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ocupacao.map((o) => (
              <div
                key={o.barbeiro_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 13.5,
                  color: '#5C6B76',
                  borderTop: '1px solid #EEF2F3',
                  paddingTop: 8,
                }}
              >
                <span style={{ fontWeight: 600 }}>{o.barbeiro_nome}</span>
                <span>
                  {o.minutos_ocupados} / {o.minutos_disponiveis} min ·{' '}
                  <strong style={{ color: corPercentual(o.percentual) }}>
                    {o.percentual}%
                  </strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

const tituloStyle: CSSProperties = {
  fontFamily: fonts.display,
  fontWeight: 800,
  fontSize: 30,
  margin: '0 0 4px',
  letterSpacing: '-.02em',
}

const cardStyle: CSSProperties = {
  background: colors.branco,
  border: '1px solid #E3E9EC',
  borderRadius: 16,
  padding: 22,
}