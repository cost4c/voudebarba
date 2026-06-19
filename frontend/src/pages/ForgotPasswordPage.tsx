import { useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { api, ApiError } from '@/lib/api'
import { toast } from '@/store/uiStore'

// Fluxo de recuperação de senha (real, via API):
//   request -> sent -> reset -> done
// O passo `reset` também é o ponto de entrada quando o usuário chega pelo
// link do e-mail (URL com ?token=...). Nesse caso já começamos em `reset`.

type Step = 'request' | 'sent' | 'reset' | 'done'

interface StepCopy {
  title: string
  sub: (email: string) => string
}

const TITLES: Record<Step, StepCopy> = {
  request: { title: 'Recuperar senha', sub: () => 'Enviaremos um link para você criar uma nova senha.' },
  sent: { title: 'Verifique seu e-mail', sub: (email) => `Enviamos as instruções para ${email}.` },
  reset: { title: 'Criar nova senha', sub: () => 'Escolha uma senha com pelo menos 6 caracteres.' },
  done: { title: 'Tudo certo!', sub: () => 'Sua senha foi atualizada.' },
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenUrl = searchParams.get('token') ?? ''

  const [step, setStep] = useState<Step>(tokenUrl ? 'reset' : 'request')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const emailOk = /\S+@\S+\.\S+/.test(email)

  const requestLink = async () => {
    if (!emailOk) {
      setError('Informe um e-mail válido.')
      return
    }
    setError('')
    setEnviando(true)
    try {
      await api.post('/esqueci-senha', { email })
      toast.sucesso('Se o e-mail estiver cadastrado, você receberá instruções.')
      setStep('sent')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Não foi possível enviar o link. Tente novamente.'
      setError(msg)
      toast.erro(msg)
    } finally {
      setEnviando(false)
    }
  }

  const submitReset = async () => {
    if (pass.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (pass !== pass2) {
      setError('As senhas não conferem.')
      return
    }
    if (!tokenUrl) {
      const msg = 'Link de redefinição inválido. Solicite um novo e-mail.'
      setError(msg)
      toast.erro(msg)
      return
    }
    setError('')
    setEnviando(true)
    try {
      await api.post('/redefinir-senha', {
        token: tokenUrl,
        senha: pass,
        confirmar_senha: pass2,
      })
      toast.sucesso('Senha redefinida com sucesso.')
      setStep('done')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Não foi possível redefinir a senha. Tente novamente.'
      setError(msg)
      toast.erro(msg)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section style={{ maxWidth: 440, margin: '24px auto 0' }}>
      <div style={{ background: '#fff', border: '1px solid #E3E9EC', borderRadius: 18, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <img src="/assets/logo.png" alt="VouDeBarba" style={{ height: 48, marginBottom: 10 }} />
          <h1 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 24, margin: '0 0 4px', letterSpacing: '-.02em' }}>
            {TITLES[step].title}
          </h1>
          <p style={{ margin: 0, color: '#7B8990', fontSize: 14, lineHeight: 1.45 }}>{TITLES[step].sub(email)}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {step === 'request' && (
            <>
              <Field label="E-mail da conta">
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder="voce@email.com"
                  style={inputStyle}
                />
              </Field>
              <ErrorMsg error={error} />
              <PrimaryBtn onClick={requestLink} disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar link de recuperação'}
              </PrimaryBtn>
            </>
          )}

          {step === 'sent' && (
            <>
              <div style={{ background: '#E2ECE6', color: '#2E6A4C', fontSize: 13.5, fontWeight: 600, padding: '12px 14px', borderRadius: 10, lineHeight: 1.45 }}>
                Se existir uma conta para este e-mail, o link de redefinição chegará em instantes.
              </div>
              <button type="button" onClick={() => setStep('request')} style={ghostBtn}>
                Usar outro e-mail
              </button>
            </>
          )}

          {step === 'reset' && (
            <>
              <Field label="Nova senha">
                <input
                  type="password"
                  value={pass}
                  onChange={(e) => {
                    setPass(e.target.value)
                    setError('')
                  }}
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </Field>
              <Field label="Confirmar nova senha">
                <input
                  type="password"
                  value={pass2}
                  onChange={(e) => {
                    setPass2(e.target.value)
                    setError('')
                  }}
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </Field>
              <ErrorMsg error={error} />
              <PrimaryBtn onClick={submitReset} disabled={enviando}>
                {enviando ? 'Redefinindo…' : 'Redefinir senha'}
              </PrimaryBtn>
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
            <button type="button" onClick={() => navigate('/entrar')} style={{ ...ghostBtn, color: '#7B8990' }}>
              ← Voltar para o login
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  border: '1px solid #DCE3E7',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 15,
  color: '#25343F',
}
const ghostBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--accent-d)',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  textAlign: 'center',
  padding: 0,
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5C6B76', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

function ErrorMsg({ error }: { error: string }) {
  if (!error) return null
  return (
    <div style={{ background: '#FBE9E7', color: '#B33A2B', fontSize: 13, fontWeight: 600, padding: '10px 13px', borderRadius: 9 }}>
      {error}
    </div>
  )
}

function PrimaryBtn({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'var(--accent)',
        color: '#25343F',
        border: 'none',
        fontWeight: 700,
        fontSize: 15.5,
        padding: 14,
        borderRadius: 11,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        marginTop: 4,
      }}
    >
      {children}
    </button>
  )
}
