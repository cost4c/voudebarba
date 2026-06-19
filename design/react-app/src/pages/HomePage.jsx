import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import ShopCard from '../components/ShopCard.jsx';

export default function HomePage() {
  const { shops } = useApp();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const list = shops.filter(
    (sh) =>
      !q ||
      sh.nome.toLowerCase().includes(q) ||
      sh.endereco.toLowerCase().includes(q) ||
      sh.services.some((x) => x.nome.toLowerCase().includes(q))
  );

  return (
    <section>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 26 }}>
        <div style={{ maxWidth: 560 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent-d)', marginBottom: 10 }}>Agende em segundos</div>
          <h1 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 38, lineHeight: 1.05, letterSpacing: '-.025em', margin: '0 0 10px' }}>Encontre sua barbearia e marque o horário</h1>
          <p style={{ margin: 0, fontSize: 16, color: '#5C6B76', lineHeight: 1.5 }}>Escolha o serviço, o barbeiro e o melhor horário. Sem ligação, sem espera.</p>
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 280, maxWidth: 380 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, bairro ou serviço"
            style={{ width: '100%', background: '#fff', border: '1px solid #DCE3E7', borderRadius: 12, padding: '14px 16px 14px 44px', fontSize: 15, color: '#25343F' }}
          />
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9FB0B8', fontSize: 17 }}>⌕</span>
        </div>
      </div>

      <div className="vdb-shops-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {list.map((sh) => (
          <ShopCard key={sh.id} shop={sh} />
        ))}
      </div>
      {list.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#8A98A0', fontSize: 15 }}>
          Nenhuma barbearia encontrada para “{query}”.
        </div>
      )}
    </section>
  );
}
