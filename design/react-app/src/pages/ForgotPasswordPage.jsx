import { useState } from 'react';
import { useNavigate } from 'react-router';

// Fluxo de recuperação de senha (mock):
// request -> sent -> reset -> done. Nenhum e-mail é realmente enviado.
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [error, setError] = useState('');

  const emailOk = /\S+@\S+\.\S+/.test(email);

  const requestLink = () => {
    if (!emailOk) { setError('Informe um e-mail válido.'); return; }
    setError('');
    setStep('sent');
  };
  const submitReset = () => {
    if (pass.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (pass !== pass2) { setError('As senhas não conferem.'); return; }
    setError('');
    setStep('done');
  };

  return (
    <section style={{ maxWidth: 440, margin: '24px auto 0' }}>
      <div style={{ background: '#fff', border: '1px solid #E3E9EC', borderRadius: 18, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <img src="/logo.png" alt="VouDeBarba" style={{ height: 48, marginBottom: 10 }} />
          <h1 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 24, margin: '0 0 4px', letterSpacing: '-.02em' }}>{TITLES[step].title}</h1>
          <p style={{ margin: 0, color: '#7B8990', fontSize: 14, lineHeight: 1.45 }}>{TITLES[step].sub(email)}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {step === 'request' && (
            <>
              <Field label="E-mail da conta">
                <input value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="voce@email.com" style={inputStyle} />
              </Field>
              <ErrorMsg error={error} />
              <PrimaryBtn onClick={requestLink}>Enviar link de recuperação</PrimaryBtn>
            </>
          )}

          {step === 'sent' && (
            <>
              <div style={{ background: '#E2ECE6', color: '#2E6A4C', fontSize: 13.5, fontWeight: 600, padding: '12px 14px', borderRadius: 10, lineHeight: 1.45 }}>
                Se existir uma conta para este e-mail, o link de redefinição chegará em instantes.
              </div>
              <PrimaryBtn onClick={() => setStep('reset')}>Abrir link de redefinição</PrimaryBtn>
              <button type="button" onClick={() => setStep('request')} style={ghostBtn}>Usar outro e-mail</button>
            </>
          )}

          {step === 'reset' && (
            <>
              <Field label="Nova senha">
                <input type="password" value={pass} onChange={(e) => { setPass(e.target.value); setError(''); }} placeholder="••••••••" style={inputStyle} />
              </Field>
              <Field label="Confirmar nova senha">
                <input type="password" value={pass2} onChange={(e) => { setPass2(e.target.value); setError(''); }} placeholder="••••••••" style={inputStyle} />
              </Field>
              <ErrorMsg error={error} />
              <PrimaryBtn onClick={submitReset}>Redefinir senha</PrimaryBtn>
            </>
          )}

          {step === 'done' && (
            <>
              <div style={{ background: '#E2ECE6', color: '#2E6A4C', fontSize: 14, fontWeight: 600, padding: '14px', borderRadius: 10, textAlign: 'center', lineHeight: 1.45 }}>
                Senha redefinida com sucesso. Use a nova senha para entrar.
              </div>
              <PrimaryBtn onClick={() => navigate('/entrar')}>Voltar para entrar</PrimaryBtn>
            </>
          )}

          {step !== 'done' && (
            <button type="button" onClick={() => navigate('/entrar')} style={{ ...ghostBtn, color: '#7B8990' }}>← Voltar para o login</button>
          )}
        </div>
      </div>
    </section>
  );
}

const TITLES = {
  request: { title: 'Recuperar senha', sub: () => 'Enviaremos um link para você criar uma nova senha.' },
  sent: { title: 'Verifique seu e-mail', sub: (email) => `Enviamos as instruções para ${email}.` },
  reset: { title: 'Criar nova senha', sub: () => 'Escolha uma senha com pelo menos 6 caracteres.' },
  done: { title: 'Tudo certo!', sub: () => 'Sua senha foi atualizada.' },
};

const inputStyle = { width: '100%', background: '#fff', border: '1px solid #DCE3E7', borderRadius: 10, padding: '12px 14px', fontSize: 15, color: '#25343F' };
const ghostBtn = { background: 'none', border: 'none', color: 'var(--accent-d)', fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'center', padding: 0 };

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5C6B76', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
function ErrorMsg({ error }) {
  if (!error) return null;
  return <div style={{ background: '#FBE9E7', color: '#B33A2B', fontSize: 13, fontWeight: 600, padding: '10px 13px', borderRadius: 9 }}>{error}</div>;
}
function PrimaryBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ background: 'var(--accent)', color: '#25343F', border: 'none', fontWeight: 700, fontSize: 15.5, padding: 14, borderRadius: 11, cursor: 'pointer', marginTop: 4 }}>{children}</button>
  );
}
