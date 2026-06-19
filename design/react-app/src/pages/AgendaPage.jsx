import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { money, fmtDate, isoLocal, addDays } from '../utils/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import DateChips from '../components/DateChips.jsx';

export default function AgendaPage() {
  const { appts, findShop, currentShopId, setStatus } = useApp();
  const [date, setDate] = useState(() => isoLocal(addDays(0)));

  const shop = findShop(currentShopId) || { nome: '', services: [], barbers: [] };

  const list = appts
    .filter((a) => a.shopId === currentShopId && a.date === date)
    .sort((x, y) => x.time.localeCompare(y.time))
    .map((a) => {
      const sv = shop.services.find((x) => x.id === a.serviceId) || { nome: 'Serviço' };
      const b = shop.barbers.find((x) => x.id === a.barberId) || { nome: 'Barbeiro' };
      return { ...a, serviceNome: sv.nome, barberNome: b.nome };
    });

  const total = list.length;
  const agendados = list.filter((a) => a.status === 'agendado').length;
  const realizados = list.filter((a) => a.status === 'realizado').length;

  return (
    <section>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}>
        <div>
          <h1 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 30, margin: '0 0 4px', letterSpacing: '-.02em' }}>Agenda — {shop.nome}</h1>
          <p style={{ margin: 0, color: '#5C6B76', fontSize: 15 }}>Acompanhe os atendimentos do dia e atualize o status.</p>
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

      {list.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((a) => (
            <article key={a.id} style={{ background: '#fff', border: '1px solid #E3E9EC', borderRadius: 14, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
              <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 20, width: 62, flex: 'none' }}>{a.time}</div>
              <div style={{ width: 1, height: 38, background: '#EEF2F3', flex: 'none' }} />
              <div style={{ flex: 1, minWidth: 170 }}>
                <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{a.client}</div>
                <div style={{ fontSize: 13.5, color: '#6B7A84' }}>{a.serviceNome} · {a.barberNome}</div>
              </div>
              <StatusBadge status={a.status} />
              {a.status === 'agendado' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setStatus(a.id, 'realizado')} style={{ background: '#25343F', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, padding: '9px 14px', borderRadius: 9, cursor: 'pointer' }}>Concluir</button>
                  <button onClick={() => setStatus(a.id, 'cancelado')} style={{ background: '#fff', border: '1px solid #E3D0CB', color: '#B33A2B', fontWeight: 700, fontSize: 13, padding: '9px 14px', borderRadius: 9, cursor: 'pointer' }}>Cancelar</button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px dashed #D2DCE0', borderRadius: 14, padding: 46, textAlign: 'center', color: '#8A98A0', fontSize: 15 }}>
          Nenhum atendimento agendado para este dia.
        </div>
      )}
    </section>
  );
}

function Stat({ value, label, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E3E9EC', borderRadius: 12, padding: '11px 16px', textAlign: 'center', minWidth: 74 }}>
      <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 22, color: color || '#25343F' }}>{value}</div>
      <div style={{ fontSize: 11.5, color: '#7B8990', fontWeight: 600 }}>{label}</div>
    </div>
  );
}
