import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext.jsx';
import { money, fmtDate, slotsFor, initials } from '../utils/format.js';
import PhotoPlaceholder from '../components/PhotoPlaceholder.jsx';
import DateChips from '../components/DateChips.jsx';
import StepHeading from '../components/StepHeading.jsx';

export default function ShopDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { findShop, appts, user, addAppointment, showToast, setPendingBooking } = useApp();
  const shop = findShop(Number(id));

  const [dService, setDService] = useState(null);
  const [dBarber, setDBarber] = useState(null);
  const [dDate, setDDate] = useState(null);
  const [dTime, setDTime] = useState(null);

  if (!shop) {
    return (
      <section>
        <BackBtn onClick={() => navigate('/')} />
        <p style={{ color: '#8A98A0' }}>Barbearia não encontrada.</p>
      </section>
    );
  }

  const selSvc = shop.services.find((x) => x.id === dService);
  const selBarber = shop.barbers.find((x) => x.id === dBarber);
  const slots = slotsFor(shop, dBarber, dDate, appts);
  const slotsReady = !!(dBarber && dDate);
  const ready = !!(dService && dBarber && dDate && dTime);

  const confirm = () => {
    if (!ready) return;
    const booking = { shopId: shop.id, barberId: dBarber, serviceId: dService, date: dDate, time: dTime };
    if (!user) {
      setPendingBooking(booking);
      navigate('/entrar');
      return;
    }
    addAppointment(booking);
    showToast('Agendamento confirmado!');
    navigate('/meus-agendamentos');
  };

  return (
    <section>
      <BackBtn onClick={() => navigate('/')} />

      <div style={{ background: '#fff', border: '1px solid #E3E9EC', borderRadius: 18, overflow: 'hidden', marginBottom: 22 }}>
        <PhotoPlaceholder label="foto / fachada da barbearia" height={150} radius={0} />
        <div style={{ padding: '22px 24px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 28, margin: '0 0 6px', letterSpacing: '-.02em' }}>{shop.nome}</h1>
            <p style={{ margin: '0 0 8px', color: '#5C6B76', fontSize: 15 }}>{shop.desc}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 13.5, color: '#6B7A84' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: 'var(--accent-d)' }}>◉</span>{shop.endereco}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: 'var(--accent-d)' }}>✆</span>{shop.tel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="vdb-shop-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 22, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 1 — serviço */}
          <div>
            <StepHeading n={1}>Escolha o serviço</StepHeading>
            <div className="vdb-svc-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {shop.services.filter((x) => x.ativo).map((sv) => {
                const sel = dService === sv.id;
                return (
                  <button
                    key={sv.id}
                    onClick={() => setDService(sv.id)}
                    style={{ textAlign: 'left', cursor: 'pointer', borderRadius: 13, padding: '15px 16px', display: 'flex', flexDirection: 'column', gap: 3, transition: '.12s', border: sel ? '2px solid var(--accent)' : '1px solid #E3E9EC', background: sel ? 'var(--accent-soft)' : '#fff' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Archivo', sans-serif" }}>{sv.nome}</span>
                      <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent-d)', fontFamily: "'Archivo', sans-serif" }}>{money(sv.preco)}</span>
                    </div>
                    <span style={{ fontSize: 13, color: '#6B7A84' }}>{sv.desc}</span>
                    <span style={{ fontSize: 12, color: '#94A2A9', fontWeight: 600, marginTop: 2 }}>⏱ {sv.dur} min</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2 — barbeiro */}
          <div>
            <StepHeading n={2}>Escolha o barbeiro</StepHeading>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {shop.barbers.map((b) => {
                const sel = dBarber === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => { setDBarber(b.id); setDTime(null); }}
                    style={{ cursor: 'pointer', borderRadius: 13, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 11, transition: '.12s', border: sel ? '2px solid var(--accent)' : '1px solid #E3E9EC', background: sel ? 'var(--accent-soft)' : '#fff' }}
                  >
                    <span style={{ width: 38, height: 38, borderRadius: '50%', background: '#25343F', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, fontFamily: "'Archivo', sans-serif" }}>{initials(b.nome)}</span>
                    <span style={{ textAlign: 'left' }}>
                      <span style={{ display: 'block', fontWeight: 700, fontSize: 14.5, fontFamily: "'Archivo', sans-serif" }}>{b.nome}</span>
                      <span style={{ display: 'block', fontSize: 12.5, color: '#7B8990' }}>{b.espec}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3 — data */}
          <div>
            <StepHeading n={3}>Escolha a data</StepHeading>
            <DateChips count={14} selected={dDate} onSelect={(iso) => { setDDate(iso); setDTime(null); }} shop={shop} />
          </div>

          {/* 4 — horário */}
          <div>
            <StepHeading n={4}>Escolha o horário</StepHeading>
            {slotsReady ? (
              <>
                <div className="vdb-slot-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 9 }}>
                  {slots.map((sl) => {
                    let box;
                    if (sl.taken) box = { background: '#F2F5F6', color: '#C2CCD1', border: '1px solid #EBEFF1', cursor: 'not-allowed', textDecoration: 'line-through' };
                    else if (dTime === sl.t) box = { background: '#25343F', color: '#fff', border: '1px solid #25343F' };
                    else box = { background: '#fff', color: '#25343F', border: '1px solid #E3E9EC' };
                    return (
                      <button
                        key={sl.t}
                        disabled={sl.taken}
                        onClick={() => { if (!sl.taken) setDTime(sl.t); }}
                        style={{ cursor: sl.taken ? 'not-allowed' : 'pointer', borderRadius: 9, padding: '11px 0', textAlign: 'center', fontWeight: 700, fontSize: 14, fontFamily: "'Archivo', sans-serif", transition: '.12s', ...box }}
                      >
                        {sl.t}
                      </button>
                    );
                  })}
                </div>
                {slots.length === 0 && (
                  <div style={{ padding: 22, background: '#fff', border: '1px dashed #D2DCE0', borderRadius: 12, textAlign: 'center', color: '#8A98A0', fontSize: 14 }}>
                    Sem horários disponíveis neste dia. Tente outra data.
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: 22, background: '#fff', border: '1px dashed #D2DCE0', borderRadius: 12, textAlign: 'center', color: '#8A98A0', fontSize: 14 }}>
                Selecione um barbeiro e uma data para ver os horários.
              </div>
            )}
          </div>
        </div>

        {/* resumo */}
        <aside style={{ position: 'sticky', top: 88, background: '#fff', border: '1px solid #E3E9EC', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 17, margin: 0 }}>Resumo do agendamento</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <SummaryRow label="Serviço" value={selSvc ? selSvc.nome : '—'} />
            <SummaryRow label="Barbeiro" value={selBarber ? selBarber.nome : '—'} />
            <SummaryRow label="Data" value={dDate ? fmtDate(dDate) : '—'} />
            <SummaryRow label="Horário" value={dTime || '—'} />
          </div>
          <div style={{ borderTop: '1px solid #EEF2F3', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#7B8990' }}>Total</span>
            <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 24, color: '#25343F' }}>{selSvc ? money(selSvc.preco) : 'R$ 0,00'}</span>
          </div>
          <button
            onClick={confirm}
            disabled={!ready}
            style={{ border: 'none', fontWeight: 700, fontSize: 15.5, padding: 15, borderRadius: 11, cursor: ready ? 'pointer' : 'not-allowed', transition: '.12s', ...(ready ? { background: 'var(--accent)', color: '#25343F' } : { background: '#E3E9EC', color: '#A8B6BC' }) }}
          >
            {user ? 'Confirmar agendamento' : 'Entrar e confirmar'}
          </button>
          <p style={{ margin: 0, fontSize: 12, color: '#94A2A9', textAlign: 'center' }}>Pagamento presencial na barbearia.</p>
        </aside>
      </div>
    </section>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
      <span style={{ color: '#7B8990' }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', color: '#5C6B76', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 18 }}>
      ← Voltar para barbearias
    </button>
  );
}
