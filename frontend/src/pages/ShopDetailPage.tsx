// Detalhe da barbearia + fluxo de agendamento em etapas.
// Portado FIEL de design/react-app/src/pages/ShopDetailPage.jsx; estado mock
// (AppContext) trocado por chamadas reais à API e authStore.
import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/uiStore'
import { money, fmtDate, initials } from '../lib/datas'
import type { BarbeariaDetalhe, Slot, Agendamento } from '../lib/types'
import { Perfil } from '../lib/types'
import { useFetch } from '../hooks/useFetch'
import PhotoPlaceholder from '../components/vdb/PhotoPlaceholder'
import DateChips from '../components/vdb/DateChips'
import StepHeading from '../components/vdb/StepHeading'

// Intenção de agendamento preservada quando o usuário precisa entrar.
export interface PendingBooking {
  shopId: number
  barberId: number
  serviceId: number
  date: string
  time: string
}
const PENDING_KEY = 'vdb:pendingBooking'

export default function ShopDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const usuario = useAuthStore((s) => s.usuario)
  const shopId = Number(id)

  const carregarShop = useCallback(
    (signal: AbortSignal) => api.get<BarbeariaDetalhe>(`/barbearias/${shopId}`, { signal }),
    [shopId],
  )
  const { data: shop, carregando, erro } = useFetch<BarbeariaDetalhe>(carregarShop, [shopId])

  const [dService, setDService] = useState<number | null>(null)
  const [dBarber, setDBarber] = useState<number | null>(null)
  const [dDate, setDDate] = useState<string | null>(null)
  const [dTime, setDTime] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Slots vêm da API (não mais de slotsFor mock).
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsCarregando, setSlotsCarregando] = useState(false)
  const slotsReady = !!(dBarber && dDate)

  useEffect(() => {
    if (!shop || !dBarber || !dDate || !dService) {
      setSlots([])
      return
    }
    const controller = new AbortController()
    setSlotsCarregando(true)
    api
      .get<Slot[]>(`/barbearias/${shop.id}/horarios`, {
        params: { barbeiro_id: dBarber, servico_id: dService, data: dDate },
        signal: controller.signal,
      })
      .then((s) => {
        setSlots(s)
        setSlotsCarregando(false)
      })
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return
        setSlots([])
        setSlotsCarregando(false)
      })
    return () => controller.abort()
  }, [shop, dBarber, dDate, dService])

  if (carregando) {
    return (
      <section>
        <BackBtn onClick={() => navigate('/')} />
        <p style={{ color: '#8A98A0' }}>Carregando...</p>
      </section>
    )
  }

  if (erro || !shop) {
    return (
      <section>
        <BackBtn onClick={() => navigate('/')} />
        <p style={{ color: '#8A98A0' }}>Barbearia não encontrada.</p>
      </section>
    )
  }

  const servicosAtivos = shop.servicos.filter((x) => x.ativo)
  const barbeirosAtivos = shop.barbeiros.filter((x) => x.ativo)
  const selSvc = shop.servicos.find((x) => x.id === dService)
  const selBarber = shop.barbeiros.find((x) => x.id === dBarber)
  const ready = !!(dService && dBarber && dDate && dTime)
  const logadoCliente = usuario?.perfil === Perfil.CLIENTE

  const confirm = async () => {
    if (!ready || !selSvc) return
    const booking: PendingBooking = {
      shopId: shop.id,
      barberId: dBarber!,
      serviceId: dService!,
      date: dDate!,
      time: dTime!,
    }

    // Anônimo: guarda a intenção e manda entrar; ao voltar retomamos.
    if (!usuario) {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(booking))
      navigate('/entrar', { state: { from: `/barbearia/${shop.id}`, booking } })
      return
    }

    if (!logadoCliente) {
      toast.aviso('Apenas clientes podem agendar horários.')
      return
    }

    setEnviando(true)
    try {
      await api.post<Agendamento>('/agendamentos', {
        barbearia_id: shop.id,
        barbeiro_id: dBarber,
        servico_id: dService,
        data: dDate,
        hora: dTime,
      })
      sessionStorage.removeItem(PENDING_KEY)
      toast.sucesso('Agendamento confirmado!')
      navigate('/meus-agendamentos')
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.erro('Este horário acabou de ser ocupado. Escolha outro.')
        setDTime(null)
      } else {
        toast.erro(e instanceof ApiError ? e.message : 'Não foi possível agendar.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section>
      <BackBtn onClick={() => navigate('/')} />

      <div
        style={{
          background: '#fff',
          border: '1px solid #E3E9EC',
          borderRadius: 18,
          overflow: 'hidden',
          marginBottom: 22,
        }}
      >
        {shop.foto_url ? (
          <img
            src={shop.foto_url}
            alt={shop.nome}
            style={{ height: 150, width: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <PhotoPlaceholder label="foto / fachada da barbearia" height={150} radius={0} />
        )}
        <div
          style={{
            padding: '22px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Archivo', sans-serif",
                fontWeight: 800,
                fontSize: 28,
                margin: '0 0 6px',
                letterSpacing: '-.02em',
              }}
            >
              {shop.nome}
            </h1>
            <p style={{ margin: '0 0 8px', color: '#5C6B76', fontSize: 15 }}>{shop.descricao}</p>
            {shop.total_avaliacoes > 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                  fontSize: 14,
                  color: '#25343F',
                  fontWeight: 700,
                }}
              >
                <span style={{ color: '#FF9B51' }}>★</span>
                {shop.media_avaliacoes.toFixed(1).replace('.', ',')}
                <span style={{ color: '#7B8990', fontWeight: 500 }}>
                  ({shop.total_avaliacoes}{' '}
                  {shop.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'})
                </span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 18,
                fontSize: 13.5,
                color: '#6B7A84',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--accent-d)' }}>◉</span>
                {shop.endereco_texto}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--accent-d)' }}>✆</span>
                {shop.telefone}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="vdb-shop-grid"
        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 22, alignItems: 'start' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 1 — serviço */}
          <div>
            <StepHeading n={1}>Escolha o serviço</StepHeading>
            <div
              className="vdb-svc-grid"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
            >
              {servicosAtivos.map((sv) => {
                const sel = dService === sv.id
                return (
                  <button
                    key={sv.id}
                    onClick={() => {
                      setDService(sv.id)
                      setDTime(null)
                    }}
                    style={{
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: 13,
                      padding: '15px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      transition: '.12s',
                      border: sel ? '2px solid var(--accent)' : '1px solid #E3E9EC',
                      background: sel ? 'var(--accent-soft)' : '#fff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 15,
                          fontFamily: "'Archivo', sans-serif",
                        }}
                      >
                        {sv.nome}
                      </span>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 15,
                          color: 'var(--accent-d)',
                          fontFamily: "'Archivo', sans-serif",
                        }}
                      >
                        {money(sv.preco)}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, color: '#6B7A84' }}>{sv.descricao}</span>
                    <span
                      style={{ fontSize: 12, color: '#94A2A9', fontWeight: 600, marginTop: 2 }}
                    >
                      ⏱ {sv.duracao_min} min
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2 — barbeiro */}
          <div>
            <StepHeading n={2}>Escolha o barbeiro</StepHeading>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {barbeirosAtivos.map((b) => {
                const sel = dBarber === b.id
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setDBarber(b.id)
                      setDTime(null)
                    }}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 13,
                      padding: '13px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 11,
                      transition: '.12s',
                      border: sel ? '2px solid var(--accent)' : '1px solid #E3E9EC',
                      background: sel ? 'var(--accent-soft)' : '#fff',
                    }}
                  >
                    {b.foto_url ? (
                      <img
                        src={b.foto_url}
                        alt={b.nome}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: '#25343F',
                          color: '#fff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 13,
                          fontFamily: "'Archivo', sans-serif",
                        }}
                      >
                        {initials(b.nome)}
                      </span>
                    )}
                    <span style={{ textAlign: 'left' }}>
                      <span
                        style={{
                          display: 'block',
                          fontWeight: 700,
                          fontSize: 14.5,
                          fontFamily: "'Archivo', sans-serif",
                        }}
                      >
                        {b.nome}
                      </span>
                      <span style={{ display: 'block', fontSize: 12.5, color: '#7B8990' }}>
                        {b.especialidade}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3 — data */}
          <div>
            <StepHeading n={3}>Escolha a data</StepHeading>
            <DateChips
              count={14}
              selected={dDate ?? ''}
              onSelect={(iso) => {
                setDDate(iso)
                setDTime(null)
              }}
              horarios={shop.horarios}
            />
          </div>

          {/* 4 — horário */}
          <div>
            <StepHeading n={4}>Escolha o horário</StepHeading>
            {slotsReady ? (
              slotsCarregando ? (
                <div
                  style={{
                    padding: 22,
                    background: '#fff',
                    border: '1px dashed #D2DCE0',
                    borderRadius: 12,
                    textAlign: 'center',
                    color: '#8A98A0',
                    fontSize: 14,
                  }}
                >
                  Carregando horários...
                </div>
              ) : slots.length === 0 ? (
                <div
                  style={{
                    padding: 22,
                    background: '#fff',
                    border: '1px dashed #D2DCE0',
                    borderRadius: 12,
                    textAlign: 'center',
                    color: '#8A98A0',
                    fontSize: 14,
                  }}
                >
                  Sem horários disponíveis neste dia. Tente outra data.
                </div>
              ) : (
                <div
                  className="vdb-slot-grid"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 9 }}
                >
                  {slots.map((sl) => {
                    let box: CSSProperties
                    if (sl.ocupado)
                      box = {
                        background: '#F2F5F6',
                        color: '#C2CCD1',
                        border: '1px solid #EBEFF1',
                        cursor: 'not-allowed',
                        textDecoration: 'line-through',
                      }
                    else if (dTime === sl.hora)
                      box = { background: '#25343F', color: '#fff', border: '1px solid #25343F' }
                    else box = { background: '#fff', color: '#25343F', border: '1px solid #E3E9EC' }
                    return (
                      <button
                        key={sl.hora}
                        disabled={sl.ocupado}
                        onClick={() => {
                          if (!sl.ocupado) setDTime(sl.hora)
                        }}
                        style={{
                          cursor: sl.ocupado ? 'not-allowed' : 'pointer',
                          borderRadius: 9,
                          padding: '11px 0',
                          textAlign: 'center',
                          fontWeight: 700,
                          fontSize: 14,
                          fontFamily: "'Archivo', sans-serif",
                          transition: '.12s',
                          ...box,
                        }}
                      >
                        {sl.hora}
                      </button>
                    )
                  })}
                </div>
              )
            ) : (
              <div
                style={{
                  padding: 22,
                  background: '#fff',
                  border: '1px dashed #D2DCE0',
                  borderRadius: 12,
                  textAlign: 'center',
                  color: '#8A98A0',
                  fontSize: 14,
                }}
              >
                Selecione um barbeiro e uma data para ver os horários.
              </div>
            )}
          </div>
        </div>

        {/* resumo */}
        <aside
          style={{
            position: 'sticky',
            top: 88,
            background: '#fff',
            border: '1px solid #E3E9EC',
            borderRadius: 16,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <h3
            style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 17, margin: 0 }}
          >
            Resumo do agendamento
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <SummaryRow label="Serviço" value={selSvc ? selSvc.nome : '—'} />
            <SummaryRow label="Barbeiro" value={selBarber ? selBarber.nome : '—'} />
            <SummaryRow label="Data" value={dDate ? fmtDate(dDate) : '—'} />
            <SummaryRow label="Horário" value={dTime || '—'} />
          </div>
          <div
            style={{
              borderTop: '1px solid #EEF2F3',
              paddingTop: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 14, color: '#7B8990' }}>Total</span>
            <span
              style={{
                fontFamily: "'Archivo', sans-serif",
                fontWeight: 800,
                fontSize: 24,
                color: '#25343F',
              }}
            >
              {selSvc ? money(selSvc.preco) : 'R$ 0,00'}
            </span>
          </div>
          <button
            onClick={confirm}
            disabled={!ready || enviando}
            style={{
              border: 'none',
              fontWeight: 700,
              fontSize: 15.5,
              padding: 15,
              borderRadius: 11,
              cursor: ready && !enviando ? 'pointer' : 'not-allowed',
              transition: '.12s',
              ...(ready && !enviando
                ? { background: 'var(--accent)', color: '#25343F' }
                : { background: '#E3E9EC', color: '#A8B6BC' }),
            }}
          >
            {enviando ? 'Confirmando...' : usuario ? 'Confirmar agendamento' : 'Entrar e confirmar'}
          </button>
          <p style={{ margin: 0, fontSize: 12, color: '#94A2A9', textAlign: 'center' }}>
            Pagamento presencial na barbearia.
          </p>
        </aside>
      </div>
    </section>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
      <span style={{ color: '#7B8990' }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        color: '#5C6B76',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        padding: 0,
        marginBottom: 18,
      }}
    >
      ← Voltar para barbearias
    </button>
  )
}
