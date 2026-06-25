// Painel de agenda do dia da barbearia (perfil Barbearia).
// Portado fielmente de design/react-app/src/pages/AgendaPage.jsx; estado mock
// (AppContext) trocado por chamadas reais via api: GET /barbearia/minha (título),
// GET /barbearia/agenda?data=YYYY-MM-DD (lista) e
// PATCH /barbearia/agendamentos/{id}/status (concluir/cancelar).
import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { isoLocal, addDays, initials, money } from '../lib/datas'
import { colors, fonts } from '../lib/theme'
import { StatusAgendamento } from '../lib/types'
import type { Agendamento, BarbeariaDetalhe, ResumoDia } from '../lib/types'
import { toast, useUIStore } from '../store/uiStore'
import DateChips from '../components/vdb/DateChips'
import StatusBadge from '../components/vdb/StatusBadge'

export default function AgendaPage() {
  const [date, setDate] = useState(() => isoLocal(addDays(0)))
  const [shopNome, setShopNome] = useState('')
  const [list, setList] = useState<Agendamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvandoId, setSalvandoId] = useState<number | null>(null)
  const pedirConfirmacao = useUIStore((s) => s.pedirConfirmacao)
    const [resumo, setResumo] = useState<ResumoDia | null>(null)

  // Nome da barbearia do gestor (para o título) — carrega uma vez.
  useEffect(() => {
    let vivo = true
    api
      .get<BarbeariaDetalhe>('/barbearia/minha')
      .then((b) => {
        if (vivo) setShopNome(b.nome)
      })
      .catch((e) => {
        const msg = e instanceof ApiError ? e.message : 'Não foi possível carregar a barbearia.'
        toast.erro(msg)
      })
    return () => {
      vivo = false
    }
  }, [])

  // Agenda do dia — recarrega ao trocar a data.
  useEffect(() => {
    let vivo = true
    setCarregando(true)
    api
      .get<Agendamento[]>(`/barbearia/agenda?data=${date}`)
      .then((items) => {
        if (!vivo) return
        const ordenado = [...items].sort((x, y) => x.hora.localeCompare(y.hora))
        setList(ordenado)
      })
      .catch((e) => {
        if (!vivo) return
        const msg = e instanceof ApiError ? e.message : 'Não foi possível carregar a agenda.'
        toast.erro(msg)
        setList([])
      })
      .finally(() => {
        if (vivo) setCarregando(false)
      })
    return () => {
      vivo = false
    }
  }, [date])

  function confirmarStatus(a: Agendamento, status: string) {
    const concluir = status === StatusAgendamento.REALIZADO
    pedirConfirmacao({
      titulo: concluir ? 'Concluir atendimento' : 'Cancelar atendimento',
      mensagem: concluir
        ? `Marcar como realizado o atendimento de ${a.cliente_nome} às ${a.hora}?`
        : `Cancelar o atendimento de ${a.cliente_nome} às ${a.hora}?`,
      textoConfirmar: concluir ? 'Concluir' : 'Cancelar atendimento',
      textoCancelar: 'Voltar',
      tipo: concluir ? 'warning' : 'danger',
      onConfirmar: () => mudarStatus(a.id, status),
    })
  }

  async function mudarStatus(id: number, status: string) {
    setSalvandoId(id)
    try {
      const atualizado = await api.patch<Agendamento>(`/barbearia/agendamentos/${id}/status`, {
        status,
      })
      setList((prev) => prev.map((a) => (a.id === id ? atualizado : a)))
      // Atualiza o card de resumo (faturamento e contagens) sem trocar a data.
      void carregarResumo()
      toast.sucesso(
        status === StatusAgendamento.REALIZADO
          ? 'Atendimento concluído.'
          : 'Atendimento cancelado.',
      )
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Não foi possível atualizar o status.'
      toast.erro(msg)
    } finally {
      setSalvandoId(null)
    }

      // Resumo do dia (contagens + faturamento) — recarrega ao trocar a data e
  // também após concluir/cancelar um atendimento (ver mudarStatus).
  function carregarResumo() {
    return api
      .get<ResumoDia>(`/barbearia/agenda/resumo?data=${date}`)
      .then((r) => setResumo(r))
      .catch(() => setResumo(null))
  }

  useEffect(() => {
    let vivo = true
    api
      .get<ResumoDia>(`/barbearia/agenda/resumo?data=${date}`)
      .then((r) => {
        if (vivo) setResumo(r)
      })
      .catch(() => {
        if (vivo) setResumo(null)
      })
    return () => {
      vivo = false
    }
  }, [date])
  }

  const total = list.length
  const agendados = list.filter((a) => a.status === StatusAgendamento.AGENDADO).length
  const realizados = list.filter((a) => a.status === StatusAgendamento.REALIZADO).length

  return (
    <section>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 22,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontWeight: 800,
              fontSize: 30,
              margin: '0 0 4px',
              letterSpacing: '-.02em',
            }}
          >
            Agenda — {shopNome}
          </h1>
          <p style={{ margin: 0, color: '#5C6B76', fontSize: 15 }}>
            Acompanhe os atendimentos do dia e atualize o status.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Stat value={total} label="no dia" />
          <Stat value={agendados} label="a atender" color="var(--accent-d)" />
          <Stat value={realizados} label="feitos" color="#2E6A4C" />
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <DateChips count={7} selected={date} onSelect={setDate} scroll width={64} />
      </div>

            {resumo && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 22,
            background: '#fff',
            border: '1px solid #E3E9EC',
            borderRadius: 14,
            padding: '16px 20px',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 12, color: '#7B8990', fontWeight: 600 }}>
              Faturamento do dia
            </div>
            <div
              style={{
                fontFamily: "'Archivo', sans-serif",
                fontWeight: 800,
                fontSize: 26,
                color: '#2E6A4C',
              }}
            >
              {money(resumo.faturamento)}
            </div>
          </div>
          <ResumoItem label="Agendados" value={resumo.agendados} />
          <ResumoItem label="Realizados" value={resumo.realizados} />
          <ResumoItem label="Cancelados" value={resumo.cancelados} />
        </div>
      )}

      {carregando ? (
        <div
          style={{
            background: '#fff',
            border: '1px dashed #D2DCE0',
            borderRadius: 14,
            padding: 46,
            textAlign: 'center',
            color: '#8A98A0',
            fontSize: 15,
          }}
        >
          Carregando agenda…
        </div>
      ) : list.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((a) => (
            <article
              key={a.id}
              style={{
                background: '#fff',
                border: '1px solid #E3E9EC',
                borderRadius: 14,
                padding: '16px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  fontFamily: "'Archivo', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  width: 62,
                  flex: 'none',
                }}
              >
                {a.hora}
              </div>
              <div style={{ width: 1, height: 38, background: '#EEF2F3', flex: 'none' }} />
              <ClienteAvatar nome={a.cliente_nome} foto={a.cliente_foto_url} />
              <div style={{ flex: 1, minWidth: 170 }}>
                <div
                  style={{
                    fontFamily: "'Archivo', sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    marginBottom: 2,
                  }}
                >
                  {a.cliente_nome}
                </div>
                <div style={{ fontSize: 13.5, color: '#6B7A84' }}>
                  {a.servico_nome} · {a.barbeiro_nome}
                </div>
              </div>
              <StatusBadge status={a.status} />
              {a.status === StatusAgendamento.AGENDADO && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    disabled={salvandoId === a.id}
                    onClick={() => confirmarStatus(a, StatusAgendamento.REALIZADO)}
                    style={{
                      background: '#25343F',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 13,
                      padding: '9px 14px',
                      borderRadius: 9,
                      cursor: salvandoId === a.id ? 'not-allowed' : 'pointer',
                      opacity: salvandoId === a.id ? 0.6 : 1,
                    }}
                  >
                    Concluir
                  </button>
                  <button
                    disabled={salvandoId === a.id}
                    onClick={() => confirmarStatus(a, StatusAgendamento.CANCELADO)}
                    style={{
                      background: '#fff',
                      border: '1px solid #E3D0CB',
                      color: '#B33A2B',
                      fontWeight: 700,
                      fontSize: 13,
                      padding: '9px 14px',
                      borderRadius: 9,
                      cursor: salvandoId === a.id ? 'not-allowed' : 'pointer',
                      opacity: salvandoId === a.id ? 0.6 : 1,
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
        <div
          style={{
            background: '#fff',
            border: '1px dashed #D2DCE0',
            borderRadius: 14,
            padding: 46,
            textAlign: 'center',
            color: '#8A98A0',
            fontSize: 15,
          }}
        >
          Nenhum atendimento agendado para este dia.
        </div>
      )}
    </section>
  )
}

// Avatar do cliente à esquerda do nome. Se a foto for a padrão (user.jpg) ou
// ausente, cai para as iniciais — mesma regra do menu de usuário (AppLayout).
function ClienteAvatar({ nome, foto }: { nome: string; foto: string | null }) {
  const temFoto = !!foto && !foto.endsWith('user.jpg')
  if (temFoto) {
    return (
      <img
        src={foto as string}
        alt={nome}
        style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1px solid #E3E9EC',
          flex: 'none',
        }}
      />
    )
  }
  return (
    <span
      style={{
        width: 42,
        height: 42,
        borderRadius: '50%',
        background: colors.accent,
        color: colors.ink,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: 15,
        fontFamily: fonts.display,
        flex: 'none',
      }}
    >
      {initials(nome)}
    </span>
  )
}

function Stat({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E3E9EC',
        borderRadius: 12,
        padding: '11px 16px',
        textAlign: 'center',
        minWidth: 74,
      }}
    >
      <div
        style={{
          fontFamily: "'Archivo', sans-serif",
          fontWeight: 800,
          fontSize: 22,
          color: color || '#25343F',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: '#7B8990', fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function ResumoItem({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 78 }}>
      <div
        style={{
          fontFamily: "'Archivo', sans-serif",
          fontWeight: 800,
          fontSize: 20,
          color: '#25343F',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: '#7B8990', fontWeight: 600 }}>{label}</div>
    </div>
  )
}