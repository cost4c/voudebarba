import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext.jsx';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, pendingBooking, setPendingBooking, addAppointment, showToast } = useApp();

  const [mode, setMode] = useState('login');
  const [af, setAf] = useState({ nome: '', email: '', phone: '', pass: '' });
  const [error, setError] = useState('');

  const isCadastro = mode === 'cadastro';
  const set = (k) => (e) => { setAf((p) => ({ ...p, [k]: e.target.value })); setError(''); };

  const submit = () => {
    if (isCadastro) {
      if (!af.nome || !af.email || !af.pass) { setError('Preencha nome, e-mail e senha.'); return; }
    } else if (!af.email || !af.pass) { setError('Informe e-mail e senha.'); return; }

    login({ nome: af.nome || 'Você', email: af.email });

    if (pendingBooking) {
      addAppointment(pendingBooking);
      setPendingBooking(null);
      showToast('Agendamento confirmado!');
    }
    navigate('/meus-agendamentos');
  };

  const tabStyle = (active) =>
    active
      ? { background: '#fff', color: '#25343F', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }
      : { background: 'transparent', color: '#7B8990' };

  return (
    <section style={{ maxWidth: 440, margin: '24px auto 0' }}>
      <div style={{ background: '#fff', border: '1px solid #E3E9EC', borderRadius: 18, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <img src="/logo.png" alt="VouDeBarba" style={{ height: 48, marginBottom: 10 }} />
          <h1 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 24, margin: '0 0 4px', letterSpacing: '-.02em' }}>
            {isCadastro ? 'Crie sua conta' : 'Bem-vindo de volta'}
          </h1>
          <p style={{ margin: 0, color: '#7B8990', fontSize: 14 }}>
            {isCadastro ? 'É rápido e gratuito.' : 'Entre para gerenciar seus agendamentos.'}
          </p>
        </div>

        <div style={{ display: 'flex', background: '#F2F5F6', borderRadius: 11, padding: 4, marginBottom: 22 }}>
          <button onClick={() => { setMode('login'); setError(''); }} style={{ flex: 1, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, padding: 10, borderRadius: 8, ...tabStyle(!isCadastro) }}>Entrar</button>
          <button onClick={() => { setMode('cadastro'); setError(''); }} style={{ flex: 1, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, padding: 10, borderRadius: 8, ...tabStyle(isCadastro) }}>Criar conta</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isCadastro && (
            <>
              <Field label="Nome completo">
                <input value={af.nome} onChange={set('nome')} placeholder="Seu nome" style={inputStyle} />
              </Field>
              <Field label="Telefone">
                <input value={af.phone} onChange={set('phone')} placeholder="(11) 90000-0000" style={inputStyle} />
              </Field>
            </>
          )}
          <Field label="E-mail">
            <input value={af.email} onChange={set('email')} placeholder="voce@email.com" style={inputStyle} />
          </Field>
          <Field label="Senha">
            <input type="password" value={af.pass} onChange={set('pass')} placeholder="••••••••" style={inputStyle} />
          </Field>

          {!isCadastro && (
            <button type="button" onClick={() => navigate('/recuperar-senha')} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: 'var(--accent-d)', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0, marginTop: -6 }}>Esqueci minha senha</button>
          )}

          {error && (
            <div style={{ background: '#FBE9E7', color: '#B33A2B', fontSize: 13, fontWeight: 600, padding: '10px 13px', borderRadius: 9 }}>{error}</div>
          )}

          <button onClick={submit} style={{ background: 'var(--accent)', color: '#25343F', border: 'none', fontWeight: 700, fontSize: 15.5, padding: 14, borderRadius: 11, cursor: 'pointer', marginTop: 4 }}>
            {isCadastro ? 'Criar conta' : 'Entrar'}
          </button>

          {pendingBooking && (
            <p style={{ margin: 0, textAlign: 'center', fontSize: 13, color: '#7B8990' }}>Entre para confirmar seu agendamento.</p>
          )}
        </div>
      </div>
    </section>
  );
}

const inputStyle = { width: '100%', background: '#fff', border: '1px solid #DCE3E7', borderRadius: 10, padding: '12px 14px', fontSize: 15, color: '#25343F' };

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5C6B76', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
