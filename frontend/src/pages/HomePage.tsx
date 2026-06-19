// Listagem/busca de barbearias (rota "/"). Portado de design/react-app/src/pages/HomePage.jsx,
// trocando o estado mock (AppContext) por GET /barbearias (?q ao buscar) via api.
import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import type { BarbeariaResumo } from '../lib/types'
import ShopCard from '../components/vdb/ShopCard'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import { toast } from '../store/uiStore'

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [shops, setShops] = useState<BarbeariaResumo[]>([])
  const [carregando, setCarregando] = useState(true)

  // Debounce da busca: refaz GET /barbearias?q= a cada mudança estabilizada.
  useEffect(() => {
    const controller = new AbortController()
    const q = query.trim()
    const timer = setTimeout(() => {
      setCarregando(true)
      api
        .get<BarbeariaResumo[]>('/barbearias', {
          params: q ? { q } : undefined,
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
  }, [query])

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

      {carregando ? (
        <Spinner texto="Carregando barbearias..." />
      ) : shops.length === 0 ? (
        <EmptyState
          icon="shop"
          titulo="Nenhuma barbearia encontrada"
          mensagem={
            query.trim()
              ? `Nenhuma barbearia encontrada para "${query.trim()}".`
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
