// Página "Meus agendamentos" (rota /meus-agendamentos, perfil Cliente).
// Portada fielmente de design/react-app/src/pages/AppointmentsPage.jsx.
// Estado mock (AppContext) substituído por chamadas reais à API:
//   GET   /agendamentos/meus          -> lista do cliente logado
//   PATCH /agendamentos/{id}/cancelar -> cancela um agendamento Agendado
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { api, ApiError } from '../lib/api'
import { StatusAgendamento } from '../lib/types'
import type { Agendamento } from '../lib/types'
import { avaliarSchema } from '../lib/schemas'
import { fmtDate, isoLocal, money, MONS } from '../lib/datas'
import { useUIStore, toast } from '../store/uiStore'
import StatusBadge from '../components/vdb/StatusBadge'

interface AgendamentoView extends Agendamento {
  dateLabel: string
  dayNum: string
  monShort: string
  priceFmt: string
}

function toView(a: Agendamento): AgendamentoView {
  const d = new Date(a.data + 'T12:00:00')
  return {
    ...a,
    dateLabel: fmtDate(a.data),
    dayNum: String(d.getDate()).padStart(2, '0'),
    monShort: MONS[d.getMonth()],
    priceFmt: money(a.preco),
  }
}

const sectionTitle = {
  fontFamily: "'Archivo', sans-serif",
  fontWeight: 700,
  fontSize: 16,
  margin: '0 0 13px',
  color: '#25343F',
} as const

export default function AppointmentsPage() {
  const navigate = useNavigate()
  const pedirConfirmacao = useUIStore((s) => s.pedirConfirmacao)
  const [appts, setAppts] = useState<Agendamento[]>([])
  const [carregando, setCarregando] = useState(true)
    // Qual agendamento está sendo avaliado e a nota escolhida no momento.
  const [avaliandoId, setAvaliandoId] = useState<number | null>(null)
  const [notaSel, setNotaSel] = useState<number>(5)
  const [comentario, setComentario] = useState<string>('')
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false)

  function abrirAvaliacao(id: number) {
    setAvaliandoId(id)
    setNotaSel(5)
    setComentario('')
  }

  async function enviarAvaliacao(a: Agendamento) {
    const parsed = avaliarSchema.safeParse({ nota: notaSel, comentario })
    if (!parsed.success) {
      toast.erro(parsed.error.issues[0]?.message ?? 'Dados inválidos.')
      return
    }
    setEnviandoAvaliacao(true)
    try {
      await api.post(`/agendamentos/${a.id}/avaliar`, parsed.data)
      toast.sucesso('Avaliação enviada. Obrigado!')
      setAvaliandoId(null)
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.aviso(e.message)
      } else {
        toast.erro(e instanceof ApiError ? e.message : 'Erro ao enviar avaliação.')
      }
    } finally {
      setEnviandoAvaliacao(false)
    }
  }

  useEffect(() => {
    let vivo = true
    api
      .get<Agendamento[]>('/agendamentos/meus')
      .then((dados) => {
        if (vivo) setAppts(dados)
      })
      .catch((e) => {
        if (vivo) {
          toast.erro(e instanceof ApiError ? e.message : 'Erro ao carregar agendamentos.')
        }
      })
      .finally(() => {
        if (vivo) setCarregando(false)
      })
    return () => {
      vivo = false
    }
  }, [])

  const { upcoming, past } = useMemo(() => {
    const hoje = isoLocal(new Date())
    const up = appts
      .filter((a) => a.status === StatusAgendamento.AGENDADO && a.data >= hoje)
      .sort((x, y) => (x.data + x.hora).localeCompare(y.data + y.hora))
      .map(toView)
    const pa = appts
      .filter((a) => a.status !== StatusAgendamento.AGENDADO || a.data < hoje)
      .sort((x, y) => (y.data + y.hora).localeCompare(x.data + x.hora))
      .map(toView)
    return { upcoming: up, past: pa }
  }, [appts])

  const cancelar = (a: AgendamentoView) => {
    pedirConfirmacao({
      titulo: 'Cancelar agendamento',
      mensagem: `Deseja cancelar ${a.servico_nome} em ${a.dateLabel} às ${a.hora}?`,
      textoConfirmar: 'Cancelar agendamento',
      textoCancelar: 'Voltar',
      tipo: 'danger',
      onConfirmar: async () => {
        try {
          const atualizado = await api.patch<Agendamento>(`/agendamentos/${a.id}/cancelar`)
          setAppts((lista) => lista.map((x) => (x.id === atualizado.id ? atualizado : x)))
          toast.sucesso('Agendamento cancelado.')
        } catch (e) {
          toast.erro(e instanceof ApiError ? e.message : 'Erro ao cancelar agendamento.')
        }
      },
    })
  }

  return (
    <section>
      <h1
        style={{
          fontFamily: "'Archivo', sans-serif",
          fontWeight: 800,
          fontSize: 30,
          margin: '0 0 4px',
          letterSpacing: '-.02em',
        }}
      >
        Meus agendamentos
      </h1>
      <p style={{ margin: '0 0 26px', color: '#5C6B76', fontSize: 15 }}>
        Acompanhe seus horários e cancele quando precisar.
      </p>

      {carregando ? (
        <div style={{ color: '#8A98A0', fontSize: 14, padding: '8px 2px' }}>Carregando…</div>
      ) : (
        <>
          <h2 style={sectionTitle}>Próximos</h2>
          {upcoming.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {upcoming.map((a) => (
                <article
                  key={a.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #E3E9EC',
                    borderRadius: 14,
                    padding: '18px 20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 12,
                      background: 'var(--accent-soft)',
                      color: 'var(--accent-d)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                      fontFamily: "'Archivo', sans-serif",
                    }}
                  >
                    <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{a.dayNum}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                      {a.monShort}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div
                      style={{
                        fontFamily: "'Archivo', sans-serif",
                        fontWeight: 700,
                        fontSize: 16,
                        marginBottom: 3,
                      }}
                    >
                      {a.servico_nome}
                    </div>
                    <div style={{ fontSize: 13.5, color: '#6B7A84' }}>
                      {a.barbearia_nome} · {a.barbeiro_nome}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Archivo', sans-serif" }}
                    >
                      {a.dateLabel}
                    </div>
                    <div style={{ fontSize: 13.5, color: '#6B7A84' }}>
                      {a.hora} · {a.priceFmt}
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                  <button
                    onClick={() => cancelar(a)}
                    style={{
                      background: '#fff',
                      border: '1px solid #E3D0CB',
                      color: '#B33A2B',
                      fontWeight: 700,
                      fontSize: 13,
                      padding: '9px 15px',
                      borderRadius: 9,
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div
              style={{
                background: '#fff',
                border: '1px dashed #D2DCE0',
                borderRadius: 14,
                padding: 36,
                textAlign: 'center',
                marginBottom: 32,
              }}
            >
              <p style={{ margin: '0 0 14px', color: '#7B8990', fontSize: 15 }}>
                Você ainda não tem horários marcados.
              </p>
              <button
                onClick={() => navigate('/')}
                style={{
                  background: '#25343F',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 14,
                  padding: '11px 20px',
                  borderRadius: 10,
                  cursor: 'pointer',
                }}
              >
                Buscar barbearias
              </button>
            </div>
          )}

          <h2 style={sectionTitle}>Histórico</h2>
          {past.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {past.map((a) => (
                <article
                  key={a.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #EEF2F3',
                    borderRadius: 14,
                    padding: '14px 20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 16,
                    opacity: 0.92,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div
                      style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Archivo', sans-serif" }}
                    >
                      {a.servico_nome}
                    </div>
                    <div style={{ fontSize: 13, color: '#8A98A0' }}>
                      {a.barbearia_nome} · {a.barbeiro_nome}
                    </div>
                  </div>
                  <div style={{ fontSize: 13.5, color: '#6B7A84' }}>
                    {a.dateLabel} · {a.hora}
                  </div>
                  <StatusBadge status={a.status} />
                  {a.status === StatusAgendamento.REALIZADO && avaliandoId !== a.id && (
                    <button
                      onClick={() => abrirAvaliacao(a.id)}
                      style={{
                        background: 'var(--accent)',
                        color: '#25343F',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: 13,
                        padding: '9px 15px',
                        borderRadius: 9,
                        cursor: 'pointer',
                      }}
                    >
                      Avaliar
                    </button>
                  )}
                  {avaliandoId === a.id && (
                    <div
                      style={{
                        flexBasis: '100%',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 10,
                        marginTop: 8,
                        paddingTop: 10,
                        borderTop: '1px solid #EEF2F3',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => setNotaSel(n)}
                            aria-label={`Nota ${n}`}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 22,
                              lineHeight: 1,
                              color: n <= notaSel ? '#FF9B51' : '#D2DCE0',
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <input
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Comentário (opcional)"
                        maxLength={500}
                        style={{
                          flex: 1,
                          minWidth: 160,
                          border: '1px solid #E3E9EC',
                          borderRadius: 9,
                          padding: '9px 12px',
                          fontSize: 14,
                        }}
                      />
                      <button
                        disabled={enviandoAvaliacao}
                        onClick={() => enviarAvaliacao(a)}
                        style={{
                          background: '#25343F',
                          color: '#fff',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: 13,
                          padding: '9px 15px',
                          borderRadius: 9,
                          cursor: enviandoAvaliacao ? 'not-allowed' : 'pointer',
                          opacity: enviandoAvaliacao ? 0.6 : 1,
                        }}
                      >
                        {enviandoAvaliacao ? 'Enviando…' : 'Enviar'}
                      </button>
                      <button
                        onClick={() => setAvaliandoId(null)}
                        style={{
                          background: '#fff',
                          border: '1px solid #E3E9EC',
                          color: '#6B7A84',
                          fontWeight: 700,
                          fontSize: 13,
                          padding: '9px 15px',
                          borderRadius: 9,
                          cursor: 'pointer',
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div style={{ color: '#8A98A0', fontSize: 14, padding: '8px 2px' }}>
              Nenhum atendimento no histórico ainda.
            </div>
          )}
        </>
      )}
    </section>
  )
}
