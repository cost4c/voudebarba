// ConfigPage — Configurações da barbearia (perfil Barbearia).
// Porte fiel de design/react-app/src/pages/ConfigPage.jsx: estado mock (AppContext)
// trocado por chamadas reais à API (GET/PUT /barbearia/minha, serviços, barbeiros,
// horários). Feedback via toast; remoções confirmadas via uiStore.pedirConfirmacao.

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { api, ApiError } from '../lib/api'
import { money, initials, DOWS_FULL } from '../lib/datas'
import { toast, useUIStore } from '../store/uiStore'
import type { BarbeariaDetalhe, Servico, Barbeiro, Horario } from '../lib/types'

const TABS = [
  { id: 'dados', label: 'Dados gerais' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'barbeiros', label: 'Barbeiros' },
  { id: 'horarios', label: 'Horários' },
] as const
type TabId = (typeof TABS)[number]['id']

const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0]

// Extrai a mensagem mais útil de um erro de API: prioriza o primeiro erro
// por campo (ex.: "Telefone deve ter 10 ou 11 dígitos.") em vez do detalhe
// genérico ("Os dados fornecidos são inválidos.").
function msgErro(e: unknown, fallback: string): string {
  if (e instanceof ApiError) {
    if (e.errors) {
      const primeira = Object.values(e.errors).find((m) => m?.[0])?.[0]
      if (primeira) return primeira
    }
    return e.message
  }
  return fallback
}

// Máscara de telefone BR: (XX) XXXX-XXXX (fixo) ou (XX) XXXXX-XXXX (celular).
function maskTelefone(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.replace(/^(\d{0,2})/, '($1')
  const corte = d.length > 10 ? 7 : 6
  const ddd = d.slice(0, 2)
  const meio = d.slice(2, corte)
  const fim = d.slice(corte)
  return fim ? `(${ddd}) ${meio}-${fim}` : `(${ddd}) ${meio}`
}

export default function ConfigPage() {
  const [shop, setShop] = useState<BarbeariaDetalhe | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [tab, setTab] = useState<TabId>('dados')

  const carregar = useCallback(async () => {
    try {
      const data = await api.get<BarbeariaDetalhe>('/barbearia/minha')
      setShop(data)
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Falha ao carregar a barbearia.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  if (carregando) {
    return <p style={{ color: '#5C6B76', fontSize: 15 }}>Carregando…</p>
  }
  if (!shop) {
    return <p style={{ color: '#5C6B76', fontSize: 15 }}>Nenhuma barbearia encontrada.</p>
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
        Configurações da barbearia
      </h1>
      <p style={{ margin: '0 0 24px', color: '#5C6B76', fontSize: 15 }}>
        Dados, serviços, barbeiros e horários de funcionamento.
      </p>

      <div
        className="vdb-cfg-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '210px 1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <nav
          style={{
            background: '#fff',
            border: '1px solid #E3E9EC',
            borderRadius: 14,
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            position: 'sticky',
            top: 88,
          }}
        >
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  textAlign: 'left',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14.5,
                  padding: '11px 14px',
                  borderRadius: 9,
                  ...(active
                    ? { background: '#25343F', color: '#fff' }
                    : { background: 'transparent', color: '#5C6B76' }),
                }}
              >
                {t.label}
              </button>
            )
          })}
        </nav>

        <div
          style={{
            background: '#fff',
            border: '1px solid #E3E9EC',
            borderRadius: 16,
            padding: 26,
            minHeight: 360,
          }}
        >
          {tab === 'dados' && <DadosTab shop={shop} setShop={setShop} />}
          {tab === 'servicos' && <ServicosTab shop={shop} setShop={setShop} />}
          {tab === 'barbeiros' && <BarbeirosTab shop={shop} setShop={setShop} />}
          {tab === 'horarios' && <HorariosTab shop={shop} setShop={setShop} />}
        </div>
      </div>
    </section>
  )
}

const inputStyle: CSSProperties = {
  width: '100%',
  background: '#fff',
  border: '1px solid #DCE3E7',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 15,
  color: '#25343F',
}
const smallInput: CSSProperties = {
  width: '100%',
  background: '#fff',
  border: '1px solid #DCE3E7',
  borderRadius: 9,
  padding: '10px 12px',
  fontSize: 14,
}
const h2Style: CSSProperties = {
  fontFamily: "'Archivo', sans-serif",
  fontWeight: 700,
  fontSize: 18,
  margin: '0 0 18px',
}
const removeBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#B33A2B',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
}
const addBtn: CSSProperties = {
  background: '#25343F',
  color: '#fff',
  border: 'none',
  fontWeight: 700,
  fontSize: 14,
  padding: '11px 18px',
  borderRadius: 9,
  cursor: 'pointer',
}
const timeInput: CSSProperties = {
  background: '#fff',
  border: '1px solid #DCE3E7',
  borderRadius: 8,
  padding: '7px 10px',
  fontSize: 14,
  color: '#25343F',
}

function Label({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: small ? 12 : 13,
        fontWeight: 600,
        color: small ? '#7B8990' : '#5C6B76',
        marginBottom: small ? 5 : 6,
      }}
    >
      {children}
    </label>
  )
}

type TabProps = {
  shop: BarbeariaDetalhe
  setShop: React.Dispatch<React.SetStateAction<BarbeariaDetalhe | null>>
}

function DadosTab({ shop, setShop }: TabProps) {
  const [nome, setNome] = useState(shop.nome)
  const [descricao, setDescricao] = useState(shop.descricao)
  const [telefone, setTelefone] = useState(() => maskTelefone(shop.telefone))
  const [endereco, setEndereco] = useState(shop.endereco_texto)
  const [salvando, setSalvando] = useState(false)

  const onSave = async () => {
    setSalvando(true)
    try {
      const atualizada = await api.put<BarbeariaDetalhe>('/barbearia/minha', {
        nome,
        descricao,
        telefone,
        endereco_texto: endereco,
      })
      setShop(atualizada)
      toast.sucesso('Dados salvos.')
    } catch (e) {
      toast.erro(msgErro(e, 'Falha ao salvar os dados.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <h2 style={h2Style}>Dados gerais</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520 }}>
        <div>
          <Label>Nome da barbearia</Label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <Label>Descrição</Label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <Label>Telefone</Label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(maskTelefone(e.target.value))}
              placeholder="(11) 91234-5678"
              inputMode="tel"
              style={inputStyle}
            />
          </div>
          <div>
            <Label>Endereço</Label>
            <input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
        <button
          onClick={onSave}
          disabled={salvando}
          style={{
            alignSelf: 'flex-start',
            background: 'var(--accent)',
            color: '#25343F',
            border: 'none',
            fontWeight: 700,
            fontSize: 14.5,
            padding: '12px 22px',
            borderRadius: 10,
            cursor: salvando ? 'default' : 'pointer',
            opacity: salvando ? 0.7 : 1,
            marginTop: 4,
          }}
        >
          {salvando ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </>
  )
}

function ServicosTab({ shop, setShop }: TabProps) {
  const pedirConfirmacao = useUIStore((s) => s.pedirConfirmacao)
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [dur, setDur] = useState('30')
  const [salvando, setSalvando] = useState(false)

  const onAdd = async () => {
    if (!nome.trim()) return
    setSalvando(true)
    try {
      const novo = await api.post<Servico>('/barbearia/servicos', {
        nome: nome.trim(),
        descricao: '',
        preco: Number(preco) || 0,
        duracao_min: Number(dur) || 30,
      })
      setShop((s) => (s ? { ...s, servicos: [...s.servicos, novo] } : s))
      setNome('')
      setPreco('')
      setDur('30')
      toast.sucesso('Serviço adicionado.')
    } catch (e) {
      toast.erro(msgErro(e, 'Falha ao adicionar serviço.'))
    } finally {
      setSalvando(false)
    }
  }

  const onRemove = (sv: Servico) => {
    pedirConfirmacao({
      titulo: 'Remover serviço',
      mensagem: `Remover o serviço "${sv.nome}"?`,
      textoConfirmar: 'Remover',
      tipo: 'danger',
      onConfirmar: async () => {
        try {
          await api.delete(`/barbearia/servicos/${sv.id}`)
          setShop((s) =>
            s ? { ...s, servicos: s.servicos.filter((x) => x.id !== sv.id) } : s,
          )
          toast.sucesso('Serviço removido.')
        } catch (e) {
          toast.erro(e instanceof ApiError ? e.message : 'Falha ao remover serviço.')
        }
      },
    })
  }

  return (
    <>
      <h2 style={h2Style}>Serviços</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
        {shop.servicos.map((sv) => (
          <div
            key={sv.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '13px 16px',
              border: '1px solid #EEF2F3',
              borderRadius: 11,
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  fontFamily: "'Archivo', sans-serif",
                }}
              >
                {sv.nome}
              </div>
              <div style={{ fontSize: 13, color: '#7B8990' }}>⏱ {sv.duracao_min} min</div>
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 15,
                color: 'var(--accent-d)',
                fontFamily: "'Archivo', sans-serif",
              }}
            >
              {money(sv.preco)}
            </div>
            <button onClick={() => onRemove(sv)} style={removeBtn}>
              Remover
            </button>
          </div>
        ))}
        {shop.servicos.length === 0 && (
          <p style={{ color: '#94A2A9', fontSize: 14 }}>Nenhum serviço cadastrado.</p>
        )}
      </div>
      <div
        style={{
          background: '#F7FAFA',
          border: '1px solid #EEF2F3',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 12,
            fontFamily: "'Archivo', sans-serif",
          }}
        >
          Adicionar serviço
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <Label small>Nome</Label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Corte degradê"
              style={smallInput}
            />
          </div>
          <div style={{ flex: 1, minWidth: 90 }}>
            <Label small>Preço (R$)</Label>
            <input
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="45"
              style={smallInput}
            />
          </div>
          <div style={{ flex: 1, minWidth: 90 }}>
            <Label small>Duração (min)</Label>
            <input
              value={dur}
              onChange={(e) => setDur(e.target.value)}
              placeholder="30"
              style={smallInput}
            />
          </div>
          <button onClick={onAdd} disabled={salvando} style={addBtn}>
            {salvando ? 'Adicionando…' : 'Adicionar'}
          </button>
        </div>
      </div>
    </>
  )
}

function BarbeirosTab({ shop, setShop }: TabProps) {
  const pedirConfirmacao = useUIStore((s) => s.pedirConfirmacao)
  const [nome, setNome] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [salvando, setSalvando] = useState(false)

  const onAdd = async () => {
    if (!nome.trim()) return
    setSalvando(true)
    try {
      const novo = await api.post<Barbeiro>('/barbearia/barbeiros', {
        nome: nome.trim(),
        especialidade: especialidade.trim(),
      })
      setShop((s) => (s ? { ...s, barbeiros: [...s.barbeiros, novo] } : s))
      setNome('')
      setEspecialidade('')
      toast.sucesso('Barbeiro adicionado.')
    } catch (e) {
      toast.erro(msgErro(e, 'Falha ao adicionar barbeiro.'))
    } finally {
      setSalvando(false)
    }
  }

  const onRemove = (b: Barbeiro) => {
    pedirConfirmacao({
      titulo: 'Remover barbeiro',
      mensagem: `Remover o barbeiro "${b.nome}"?`,
      textoConfirmar: 'Remover',
      tipo: 'danger',
      onConfirmar: async () => {
        try {
          await api.delete(`/barbearia/barbeiros/${b.id}`)
          setShop((s) =>
            s ? { ...s, barbeiros: s.barbeiros.filter((x) => x.id !== b.id) } : s,
          )
          toast.sucesso('Barbeiro removido.')
        } catch (e) {
          toast.erro(e instanceof ApiError ? e.message : 'Falha ao remover barbeiro.')
        }
      },
    })
  }

  return (
    <>
      <h2 style={h2Style}>Barbeiros</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
        {shop.barbeiros.map((b) => (
          <div
            key={b.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              padding: '12px 16px',
              border: '1px solid #EEF2F3',
              borderRadius: 11,
            }}
          >
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#25343F',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 14,
                fontFamily: "'Archivo', sans-serif",
              }}
            >
              {initials(b.nome)}
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  fontFamily: "'Archivo', sans-serif",
                }}
              >
                {b.nome}
              </div>
              <div style={{ fontSize: 13, color: '#7B8990' }}>{b.especialidade}</div>
            </div>
            <button onClick={() => onRemove(b)} style={removeBtn}>
              Remover
            </button>
          </div>
        ))}
        {shop.barbeiros.length === 0 && (
          <p style={{ color: '#94A2A9', fontSize: 14 }}>Nenhum barbeiro cadastrado.</p>
        )}
      </div>
      <div
        style={{
          background: '#F7FAFA',
          border: '1px solid #EEF2F3',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: 1, minWidth: 160 }}>
          <Label small>Nome do barbeiro</Label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome completo"
            style={smallInput}
          />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <Label small>Especialidade</Label>
          <input
            value={especialidade}
            onChange={(e) => setEspecialidade(e.target.value)}
            placeholder="Ex.: Degradê"
            style={smallInput}
          />
        </div>
        <button onClick={onAdd} disabled={salvando} style={addBtn}>
          {salvando ? 'Adicionando…' : 'Adicionar'}
        </button>
      </div>
    </>
  )
}

function HorariosTab({ shop, setShop }: TabProps) {
  // Mapa dia_semana -> Horario para edição local antes de salvar.
  const [dias, setDias] = useState<Record<number, Horario>>(() => {
    const base: Record<number, Horario> = {}
    for (let dw = 0; dw < 7; dw++) {
      const existente = shop.horarios.find((h) => h.dia_semana === dw)
      base[dw] = existente ?? {
        dia_semana: dw,
        ativo: false,
        hora_abertura: '09:00',
        hora_fechamento: '18:00',
      }
    }
    return base
  })
  const [salvando, setSalvando] = useState(false)

  const toggle = (dw: number) =>
    setDias((d) => ({ ...d, [dw]: { ...d[dw], ativo: !d[dw].ativo } }))
  const setHora = (dw: number, campo: 'hora_abertura' | 'hora_fechamento', valor: string) =>
    setDias((d) => ({ ...d, [dw]: { ...d[dw], [campo]: valor } }))

  const onSalvar = async () => {
    setSalvando(true)
    try {
      const atualizados = await api.put<Horario[]>('/barbearia/horarios', {
        dias: DOW_ORDER.map((dw) => ({
          dia_semana: dw,
          ativo: dias[dw].ativo,
          hora_abertura: dias[dw].hora_abertura,
          hora_fechamento: dias[dw].hora_fechamento,
        })),
      })
      setShop((s) => (s ? { ...s, horarios: atualizados } : s))
      toast.sucesso('Horários salvos.')
    } catch (e) {
      toast.erro(msgErro(e, 'Falha ao salvar horários.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <h2 style={{ ...h2Style, marginBottom: 6 }}>Horários de funcionamento</h2>
      <p style={{ margin: '0 0 18px', fontSize: 13.5, color: '#7B8990' }}>
        Os horários disponíveis para agendamento são gerados a partir destes intervalos.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520 }}>
        {DOW_ORDER.map((dw) => {
          const h = dias[dw]
          return (
            <div
              key={dw}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '11px 16px',
                border: '1px solid #EEF2F3',
                borderRadius: 11,
                opacity: h.ativo ? 1 : 0.65,
              }}
            >
              <button
                onClick={() => toggle(dw)}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  width: 42,
                  height: 24,
                  borderRadius: 999,
                  flex: 'none',
                  position: 'relative',
                  transition: '.15s',
                  background: h.ativo ? 'var(--accent)' : '#CDD7DC',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: '.15s',
                    left: h.ativo ? 20 : 2,
                  }}
                />
              </button>
              <div
                style={{
                  width: 90,
                  fontWeight: 700,
                  fontSize: 14.5,
                  fontFamily: "'Archivo', sans-serif",
                }}
              >
                {DOWS_FULL[dw]}
              </div>
              {h.ativo ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="time"
                    value={h.hora_abertura}
                    onChange={(e) => setHora(dw, 'hora_abertura', e.target.value)}
                    style={timeInput}
                  />
                  <span style={{ color: '#94A2A9' }}>até</span>
                  <input
                    type="time"
                    value={h.hora_fechamento}
                    onChange={(e) => setHora(dw, 'hora_fechamento', e.target.value)}
                    style={timeInput}
                  />
                </div>
              ) : (
                <span style={{ color: '#94A2A9', fontSize: 14, fontWeight: 600 }}>Fechado</span>
              )}
            </div>
          )
        })}
      </div>
      <button
        onClick={onSalvar}
        disabled={salvando}
        style={{
          background: 'var(--accent)',
          color: '#25343F',
          border: 'none',
          fontWeight: 700,
          fontSize: 14.5,
          padding: '12px 22px',
          borderRadius: 10,
          cursor: salvando ? 'default' : 'pointer',
          opacity: salvando ? 0.7 : 1,
          marginTop: 18,
        }}
      >
        {salvando ? 'Salvando…' : 'Salvar horários'}
      </button>
    </>
  )
}
