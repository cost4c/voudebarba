// Listagem/busca de barbearias (rota "/").
// Agora com filtro por serviço: chips de serviço chamam GET /barbearias?servico_id=.
import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import type { BarbeariaResumo, Servico } from '../lib/types'
import ShopCard from '../components/vdb/ShopCard'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import { toast } from '../store/uiStore'

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [shops, setShops] = useState<BarbeariaResumo[]>([])
  const [carregando, setCarregando] = useState(true)

  // Lista de serviços para os chips + qual está selecionado (null = todos).
  const [servicos, setServicos] = useState<Servico[]>([])
  const [servicoId, setServicoId] = useState<number | null>(null)

  // Carrega os serviços disponíveis uma única vez (para montar os chips).
  useEffect(() => {
    let vivo = true
    api
      .get<Servico[]>('/barbearias/servicos')
      .then((d) => vivo && setServicos(d))
      .catch(() => {
        /* silencioso: sem chips, a busca por nome continua funcionando */
      })
    return () => {
      vivo = false
    }
  }, [])

  // Debounce da busca: refaz GET /barbearias a cada mudança de texto OU de serviço.
  useEffect(() => {
    const controller = new AbortController()
    const q = query.trim()
    const timer = setTimeout(() => {
      setCarregando(true)
      api
        .get<BarbeariaResumo[]>('/barbearias', {
          params: {
            q: q || undefined,
            servico_id: servicoId ?? undefined,
          },
          signal: controller.signal,
        })
        .then((data) => {
          setShops(data)
          setCarregando(false)
        })
        .catch((e) => {
          if ((e as Error).name === 'AbortError') return
          setCarregando(false)
          toast.erro(e instanceof ApiError ? e.message : 'Não foi possível carregar as barbearias.')
        })
    }, 300)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query, servicoId])

  return (
    <section>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 20,
          marginBottom: 26,
        }}
      >
        <div style={{ maxWidth: 560 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--accent-d)',
              marginBottom: 10,
            }}
          >
            Agende em segundos
          </div>
          <h1
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontWeight: 800,
              fontSize: 38,
              lineHeight: 1.05,
              letterSpacing: '-.025em',
              margin: '0 0 10px',
            }}
          >
            Encontre sua barbearia e marque o horário
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: '#5C6B76', lineHeight: 1.5 }}>
            Escolha o serviço, o barbeiro e o melhor horário. Sem ligação, sem espera.
          </p>
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 280, maxWidth: 380 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, bairro ou serviço"
            style={{
              width: '100%',
              background: '#fff',
              border: '1px solid #DCE3E7',
              borderRadius: 12,
              padding: '14px 16px 14px 44px',
              fontSize: 15,
              color: '#25343F',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9FB0B8',
              fontSize: 17,
            }}
          >
            ⌕
          </span>
        </div>
      </div>

      {/* Chips de serviço — filtram a lista por servico_id. */}
      {servicos.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          <Chip ativo={servicoId === null} onClick={() => setServicoId(null)}>
            Todos
          </Chip>
          {servicos.map((sv) => (
            <Chip
              key={sv.id}
              ativo={servicoId === sv.id}
              onClick={() => setServicoId(sv.id)}
            >
              {sv.nome}
            </Chip>
          ))}
        </div>
      )}

      {carregando ? (
        <Spinner texto="Carregando barbearias..." />
      ) : shops.length === 0 ? (
        <EmptyState
          icon="shop"
          titulo="Nenhuma barbearia encontrada"
          mensagem={
            query.trim() || servicoId !== null
              ? 'Nenhuma barbearia encontrada para este filtro.'
              : 'Ainda não há barbearias disponíveis.'
          }
        />
      ) : (
        <div
          className="vdb-shops-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}
        >
          {shops.map((sh) => (
            <ShopCard key={sh.id} shop={sh} />
          ))}
        </div>
      )}
    </section>
  )
}

// Chip de filtro (pílula clicável). Estilo inline + tokens, sem Bootstrap.
function Chip({
  children,
  ativo,
  onClick,
}: {
  children: React.ReactNode
  ativo: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: '1px solid',
        borderColor: ativo ? '#25343F' : '#DCE3E7',
        background: ativo ? '#25343F' : '#fff',
        color: ativo ? '#fff' : '#5C6B76',
        fontWeight: 600,
        fontSize: 13.5,
        padding: '8px 14px',
        borderRadius: 999,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}