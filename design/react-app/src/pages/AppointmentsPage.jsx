import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext.jsx';
import { money, fmtDate, MONS } from '../utils/format.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const { appts, findShop, setStatus } = useApp();

  const view = (a) => {
    const sh = findShop(a.shopId) || { services: [], barbers: [], nome: '' };
    const sv = sh.services.find((x) => x.id === a.serviceId) || { nome: 'Serviço', preco: 0 };
    const b = sh.barbers.find((x) => x.id === a.barberId) || { nome: 'Barbeiro' };
    const d = new Date(a.date + 'T12:00:00');
    return {
      ...a,
      shopNome: sh.nome, serviceNome: sv.nome, barberNome: b.nome, priceFmt: money(sv.preco),
      dateLabel: fmtDate(a.date), dayNum: String(d.getDate()).padStart(2, '0'), monShort: MONS[d.getMonth()],
    };
  };

  const { upcoming, past } = useMemo(() => {
    const mine = appts.filter((a) => a.client === 'Você');
    const up = mine
      .filter((a) => a.status === 'agendado')
      .sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time))
      .map(view);
    const pa = mine
      .filter((a) => a.status !== 'agendado')
      .sort((x, y) => (y.date + y.time).localeCompare(x.date + x.time))
      .map(view);
    return { upcoming: up, past: pa };
  }, [appts]);

  return (
    <section>
      <h1 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 30, margin: '0 0 4px', letterSpacing: '-.02em' }}>Meus agendamentos</h1>
      <p style={{ margin: '0 0 26px', color: '#5C6B76', fontSize: 15 }}>Acompanhe seus horários e cancele quando precisar.</p>

      <h2 style={sectionTitle}>Próximos</h2>
      {upcoming.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {upcoming.map((a) => (
            <article key={a.id} style={{ background: '#fff', border: '1px solid #E3E9EC', borderRadius: 14, padding: '18px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 54, height: 54, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent-d)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 'none', fontFamily: "'Archivo', sans-serif" }}>
                <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{a.dayNum}</span>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{a.monShort}</span>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 3 }}>{a.serviceNome}</div>
                <div style={{ fontSize: 13.5, color: '#6B7A84' }}>{a.shopNome} · {a.barberNome}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Archivo', sans-serif" }}>{a.dateLabel}</div>
                <div style={{ fontSize: 13.5, color: '#6B7A84' }}>{a.time} · {a.priceFmt}</div>
              </div>
              <StatusBadge status={a.status} />
              <button onClick={() => setStatus(a.id, 'cancelado')} style={{ background: '#fff', border: '1px solid #E3D0CB', color: '#B33A2B', fontWeight: 700, fontSize: 13, padding: '9px 15px', borderRadius: 9, cursor: 'pointer' }}>Cancelar</button>
            </article>
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px dashed #D2DCE0', borderRadius: 14, padding: 36, textAlign: 'center', marginBottom: 32 }}>
          <p style={{ margin: '0 0 14px', color: '#7B8990', fontSize: 15 }}>Você ainda não tem horários marcados.</p>
          <button onClick={() => navigate('/')} style={{ background: '#25343F', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, padding: '11px 20px', borderRadius: 10, cursor: 'pointer' }}>Buscar barbearias</button>
        </div>
      )}

      <h2 style={sectionTitle}>Histórico</h2>
      {past.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {past.map((a) => (
            <article key={a.id} style={{ background: '#fff', border: '1px solid #EEF2F3', borderRadius: 14, padding: '14px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, opacity: 0.92 }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Archivo', sans-serif" }}>{a.serviceNome}</div>
                <div style={{ fontSize: 13, color: '#8A98A0' }}>{a.shopNome} · {a.barberNome}</div>
              </div>
              <div style={{ fontSize: 13.5, color: '#6B7A84' }}>{a.dateLabel} · {a.time}</div>
              <StatusBadge status={a.status} />
            </article>
          ))}
        </div>
      ) : (
        <div style={{ color: '#8A98A0', fontSize: 14, padding: '8px 2px' }}>Nenhum atendimento no histórico ainda.</div>
      )}
    </section>
  );
}

const sectionTitle = { fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 16, margin: '0 0 13px', color: '#25343F' };
