import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { money, initials, DOWS_FULL } from '../utils/format.js';

const TABS = [
  { id: 'dados', label: 'Dados gerais' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'barbeiros', label: 'Barbeiros' },
  { id: 'horarios', label: 'Horários' },
];
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function ConfigPage() {
  const { findShop, currentShopId, updateCurrentShop, addService, removeService, addBarber, removeBarber, toggleHor, setHor, showToast } = useApp();
  const shop = findShop(currentShopId);

  const [tab, setTab] = useState('dados');
  const [svcForm, setSvcForm] = useState({ nome: '', preco: '', dur: '30' });
  const [barberForm, setBarberForm] = useState('');

  const onAddService = () => {
    if (!svcForm.nome.trim()) return;
    addService(svcForm);
    setSvcForm({ nome: '', preco: '', dur: '30' });
    showToast('Serviço adicionado.');
  };
  const onAddBarber = () => {
    if (!barberForm.trim()) return;
    addBarber(barberForm);
    setBarberForm('');
    showToast('Barbeiro adicionado.');
  };

  return (
    <section>
      <h1 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 30, margin: '0 0 4px', letterSpacing: '-.02em' }}>Configurações da barbearia</h1>
      <p style={{ margin: '0 0 24px', color: '#5C6B76', fontSize: 15 }}>Dados, serviços, barbeiros e horários de funcionamento.</p>

      <div className="vdb-cfg-grid" style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 24, alignItems: 'start' }}>
        <nav style={{ background: '#fff', border: '1px solid #E3E9EC', borderRadius: 14, padding: 8, display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 88 }}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{ textAlign: 'left', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14.5, padding: '11px 14px', borderRadius: 9, ...(active ? { background: '#25343F', color: '#fff' } : { background: 'transparent', color: '#5C6B76' }) }}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        <div style={{ background: '#fff', border: '1px solid #E3E9EC', borderRadius: 16, padding: 26, minHeight: 360 }}>
          {tab === 'dados' && <DadosTab shop={shop} update={updateCurrentShop} onSave={() => showToast('Dados salvos.')} />}
          {tab === 'servicos' && (
            <ServicosTab shop={shop} form={svcForm} setForm={setSvcForm} onAdd={onAddService} onRemove={removeService} />
          )}
          {tab === 'barbeiros' && (
            <BarbeirosTab shop={shop} form={barberForm} setForm={setBarberForm} onAdd={onAddBarber} onRemove={removeBarber} />
          )}
          {tab === 'horarios' && <HorariosTab shop={shop} toggle={toggleHor} setHor={setHor} />}
        </div>
      </div>
    </section>
  );
}

const inputStyle = { width: '100%', background: '#fff', border: '1px solid #DCE3E7', borderRadius: 10, padding: '12px 14px', fontSize: 15, color: '#25343F' };
const smallInput = { width: '100%', background: '#fff', border: '1px solid #DCE3E7', borderRadius: 9, padding: '10px 12px', fontSize: 14 };
const h2Style = { fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 18, margin: '0 0 18px' };

function Label({ children, small }) {
  return <label style={{ display: 'block', fontSize: small ? 12 : 13, fontWeight: 600, color: small ? '#7B8990' : '#5C6B76', marginBottom: small ? 5 : 6 }}>{children}</label>;
}

function DadosTab({ shop, update, onSave }) {
  return (
    <>
      <h2 style={h2Style}>Dados gerais</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520 }}>
        <div><Label>Nome da barbearia</Label><input value={shop.nome} onChange={(e) => update({ nome: e.target.value })} style={inputStyle} /></div>
        <div><Label>Descrição</Label><textarea value={shop.desc} onChange={(e) => update({ desc: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><Label>Telefone</Label><input value={shop.tel} onChange={(e) => update({ tel: e.target.value })} style={inputStyle} /></div>
          <div><Label>Endereço</Label><input value={shop.endereco} onChange={(e) => update({ endereco: e.target.value })} style={inputStyle} /></div>
        </div>
        <button onClick={onSave} style={{ alignSelf: 'flex-start', background: 'var(--accent)', color: '#25343F', border: 'none', fontWeight: 700, fontSize: 14.5, padding: '12px 22px', borderRadius: 10, cursor: 'pointer', marginTop: 4 }}>Salvar alterações</button>
      </div>
    </>
  );
}

function ServicosTab({ shop, form, setForm, onAdd, onRemove }) {
  return (
    <>
      <h2 style={h2Style}>Serviços</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
        {shop.services.map((sv) => (
          <div key={sv.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', border: '1px solid #EEF2F3', borderRadius: 11 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Archivo', sans-serif" }}>{sv.nome}</div>
              <div style={{ fontSize: 13, color: '#7B8990' }}>⏱ {sv.dur} min</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent-d)', fontFamily: "'Archivo', sans-serif" }}>{money(sv.preco)}</div>
            <button onClick={() => onRemove(sv.id)} style={removeBtn}>Remover</button>
          </div>
        ))}
      </div>
      <div style={{ background: '#F7FAFA', border: '1px solid #EEF2F3', borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, fontFamily: "'Archivo', sans-serif" }}>Adicionar serviço</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 160 }}><Label small>Nome</Label><input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Ex.: Corte degradê" style={smallInput} /></div>
          <div style={{ flex: 1, minWidth: 90 }}><Label small>Preço (R$)</Label><input value={form.preco} onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))} placeholder="45" style={smallInput} /></div>
          <div style={{ flex: 1, minWidth: 90 }}><Label small>Duração (min)</Label><input value={form.dur} onChange={(e) => setForm((f) => ({ ...f, dur: e.target.value }))} placeholder="30" style={smallInput} /></div>
          <button onClick={onAdd} style={addBtn}>Adicionar</button>
        </div>
      </div>
    </>
  );
}

function BarbeirosTab({ shop, form, setForm, onAdd, onRemove }) {
  return (
    <>
      <h2 style={h2Style}>Barbeiros</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
        {shop.barbers.map((b) => (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 16px', border: '1px solid #EEF2F3', borderRadius: 11 }}>
            <span style={{ width: 40, height: 40, borderRadius: '50%', background: '#25343F', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, fontFamily: "'Archivo', sans-serif" }}>{initials(b.nome)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Archivo', sans-serif" }}>{b.nome}</div>
              <div style={{ fontSize: 13, color: '#7B8990' }}>{b.espec}</div>
            </div>
            <button onClick={() => onRemove(b.id)} style={removeBtn}>Remover</button>
          </div>
        ))}
      </div>
      <div style={{ background: '#F7FAFA', border: '1px solid #EEF2F3', borderRadius: 12, padding: 16, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}><Label small>Nome do barbeiro</Label><input value={form} onChange={(e) => setForm(e.target.value)} placeholder="Nome completo" style={smallInput} /></div>
        <button onClick={onAdd} style={addBtn}>Adicionar</button>
      </div>
    </>
  );
}

function HorariosTab({ shop, toggle, setHor }) {
  return (
    <>
      <h2 style={{ ...h2Style, marginBottom: 6 }}>Horários de funcionamento</h2>
      <p style={{ margin: '0 0 18px', fontSize: 13.5, color: '#7B8990' }}>Os horários disponíveis para agendamento são gerados a partir destes intervalos.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520 }}>
        {DOW_ORDER.map((dw) => {
          const h = shop.horarios[dw];
          return (
            <div key={dw} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 16px', border: '1px solid #EEF2F3', borderRadius: 11, opacity: h.on ? 1 : 0.65 }}>
              <button
                onClick={() => toggle(dw)}
                style={{ border: 'none', cursor: 'pointer', width: 42, height: 24, borderRadius: 999, flex: 'none', position: 'relative', transition: '.15s', background: h.on ? 'var(--accent)' : '#CDD7DC' }}
              >
                <span style={{ position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: '.15s', left: h.on ? 20 : 2 }} />
              </button>
              <div style={{ width: 90, fontWeight: 700, fontSize: 14.5, fontFamily: "'Archivo', sans-serif" }}>{DOWS_FULL[dw]}</div>
              {h.on ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="time" value={h.a} onChange={(e) => setHor(dw, 'a', e.target.value)} style={timeInput} />
                  <span style={{ color: '#94A2A9' }}>até</span>
                  <input type="time" value={h.f} onChange={(e) => setHor(dw, 'f', e.target.value)} style={timeInput} />
                </div>
              ) : (
                <span style={{ color: '#94A2A9', fontSize: 14, fontWeight: 600 }}>Fechado</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

const removeBtn = { background: 'none', border: 'none', color: '#B33A2B', fontWeight: 700, fontSize: 13, cursor: 'pointer' };
const addBtn = { background: '#25343F', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, padding: '11px 18px', borderRadius: 9, cursor: 'pointer' };
const timeInput = { background: '#fff', border: '1px solid #DCE3E7', borderRadius: 8, padding: '7px 10px', fontSize: 14, color: '#25343F' };
