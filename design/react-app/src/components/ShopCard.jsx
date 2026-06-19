import { useNavigate } from 'react-router';
import { money } from '../utils/format.js';
import PhotoPlaceholder from './PhotoPlaceholder.jsx';

export default function ShopCard({ shop }) {
  const navigate = useNavigate();
  const priceFrom = money(Math.min(...shop.services.map((x) => x.preco)));

  return (
    <article style={{ background: '#fff', border: '1px solid #E3E9EC', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <PhotoPlaceholder label="foto da barbearia" height={120} />
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div>
          <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 18, margin: '0 0 4px', letterSpacing: '-.01em' }}>{shop.nome}</h3>
          <div style={{ fontSize: 13.5, color: '#5C6B76', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--accent-d)' }}>◉</span>{shop.endereco}
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: '#6B7A84', lineHeight: 1.45, flex: 1 }}>{shop.desc}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 6, borderTop: '1px solid #EEF2F3' }}>
          <div style={{ fontSize: 13, color: '#5C6B76' }}>
            {shop.services.length} serviços · a partir de <strong style={{ color: '#25343F' }}>{priceFrom}</strong>
          </div>
        </div>
        <button
          onClick={() => navigate(`/barbearia/${shop.id}`)}
          style={{ background: '#25343F', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14.5, padding: 12, borderRadius: 10, cursor: 'pointer', width: '100%' }}
        >
          Ver e agendar
        </button>
      </div>
    </article>
  );
}
