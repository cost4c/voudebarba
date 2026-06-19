// Tela de autenticação (rotas "/entrar" e "/login").
// Visual portado fielmente de design/react-app/src/pages/AuthPage.jsx.
// Estado mock do AppContext do protótipo trocado por:
//   - authStore.login (POST /login) e api.post('/cadastrar') reais;
//   - validação Zod (loginSchema / cadastroSchema) com erros por campo;
//   - feedback via toast (uiStore) e redirect por perfil / intenção pendente.
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { api, ApiError } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/uiStore'
import {
  loginSchema,
  cadastroSchema,
  PERFIL_CADASTRO,
  type LoginForm,
  type CadastroForm,
} from '../lib/schemas'
import { Perfil, type Usuario } from '../lib/types'
import { colors, fonts } from '../lib/theme'

type Modo = 'login' | 'cadastro'

// Estado pendente de agendamento, deixado por ShopDetailPage ao mandar um
// anônimo para "/entrar". Convenção desacoplada: location.state.from guarda a
// rota a retomar após o login (padrão react-router).
interface LocationState {
  from?: string
}

export default function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)

  const state = (location.state ?? null) as LocationState | null
  const intencaoPendente = typeof state?.from === 'string' ? state.from : null

  const [modo, setModo] = useState<Modo>('login')
  const [af, setAf] = useState({ nome: '', email: '', senha: '' })
  const [erros, setErros] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  const isCadastro = modo === 'cadastro'

  const set = (k: 'nome' | 'email' | 'senha') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setAf((p) => ({ ...p, [k]: valor }))
    setErros((p) => {
      if (!p[k] && !p._geral) return p
      const { [k]: _omit, _geral: _g, ...resto } = p
      return resto
    })
  }

  const trocarModo = (m: Modo) => {
    setModo(m)
    setErros({})
  }

  // Redireciona após login bem-sucedido conforme perfil/intenção pendente.
  const redirecionarPosLogin = (usuario: Usuario) => {
    if (usuario.perfil === Perfil.ADMIN) {
      navigate('/admin', { replace: true })
      return
    }
    if (usuario.perfil === Perfil.BARBEARIA) {
      navigate('/agenda', { replace: true })
      return
    }
    // Cliente (e demais): retoma intenção pendente ou vai para a home.
    navigate(intencaoPendente ?? '/', { replace: true })
  }

  const submit = async () => {
    if (enviando) return
    setErros({})

    if (isCadastro) {
      const dados: CadastroForm = { nome: af.nome, email: af.email, senha: af.senha }
      const parsed = cadastroSchema.safeParse(dados)
      if (!parsed.success) {
        setErros(zodErros(parsed.error))
        return
      }

      setEnviando(true)
      try {
        await api.post<Usuario>('/cadastrar', {
          nome: parsed.data.nome,
          email: parsed.data.email,
          senha: parsed.data.senha,
          perfil: PERFIL_CADASTRO,
        })
        // Login automático após cadastro.
        const usuario = await login(parsed.data.email, parsed.data.senha)
        toast.sucesso('Conta criada com sucesso!')
        redirecionarPosLogin(usuario)
      } catch (e) {
        tratarErro(e, setErros)
      } finally {
        setEnviando(false)
      }
      return
    }

    // Login
    const dados: LoginForm = { email: af.email, senha: af.senha }
    const parsed = loginSchema.safeParse(dados)
    if (!parsed.success) {
      setErros(zodErros(parsed.error))
      return
    }

    setEnviando(true)
    try {
      const usuario = await login(parsed.data.email, parsed.data.senha)
      toast.sucesso(`Bem-vindo, ${usuario.nome}!`)
      redirecionarPosLogin(usuario)
    } catch (e) {
      tratarErro(e, setErros)
    } finally {
      setEnviando(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void submit()
    }
  }

  const tabStyle = (active: boolean) =>
    active
      ? { background: colors.branco, color: colors.ink, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }
      : { background: 'transparent', color: '#7B8990' }

  return (
    <section style={{ maxWidth: 440, margin: '24px auto 0' }}>
      <div style={{ background: colors.branco, border: '1px solid #E3E9EC', borderRadius: 18, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <img src="/assets/logo.png" alt="VouDeBarba" style={{ height: 48, marginBottom: 10 }} />
          <h1
            style={{
              fontFamily: fonts.display,
              fontWeight: 800,
              fontSize: 24,
              margin: '0 0 4px',
              letterSpacing: '-.02em',
            }}
          >
            {isCadastro ? 'Crie sua conta' : 'Bem-vindo de volta'}
          </h1>
          <p style={{ margin: 0, color: '#7B8990', fontSize: 14 }}>
            {isCadastro ? 'É rápido e gratuito.' : 'Entre para gerenciar seus agendamentos.'}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            background: '#F2F5F6',
            borderRadius: 11,
            padding: 4,
            marginBottom: 22,
          }}
        >
          <button
            type="button"
            onClick={() => trocarModo('login')}
            style={{ flex: 1, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, padding: 10, borderRadius: 8, ...tabStyle(!isCadastro) }}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => trocarModo('cadastro')}
            style={{ flex: 1, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, padding: 10, borderRadius: 8, ...tabStyle(isCadastro) }}
          >
            Criar conta
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onKeyDown={onKeyDown}>
          {isCadastro && (
            <Field label="Nome completo" erro={erros.nome}>
              <input
                value={af.nome}
                onChange={set('nome')}
                placeholder="Seu nome"
                autoComplete="name"
                style={inputStyle(!!erros.nome)}
              />
            </Field>
          )}

          <Field label="E-mail" erro={erros.email}>
            <input
              value={af.email}
              onChange={set('email')}
              placeholder="voce@email.com"
              type="email"
              autoComplete="email"
              style={inputStyle(!!erros.email)}
            />
          </Field>

          <Field label="Senha" erro={erros.senha}>
            <input
              type="password"
              value={af.senha}
              onChange={set('senha')}
              placeholder="••••••••"
              autoComplete={isCadastro ? 'new-password' : 'current-password'}
              style={inputStyle(!!erros.senha)}
            />
          </Field>

          {!isCadastro && (
            <button
              type="button"
              onClick={() => navigate('/recuperar-senha')}
              style={{
                alignSelf: 'flex-end',
                background: 'none',
                border: 'none',
                color: colors.accentD,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                padding: 0,
                marginTop: -6,
              }}
            >
              Esqueci minha senha
            </button>
          )}

          {erros._geral && (
            <div
              style={{
                background: '#FBE9E7',
                color: '#B33A2B',
                fontSize: 13,
                fontWeight: 600,
                padding: '10px 13px',
                borderRadius: 9,
              }}
            >
              {erros._geral}
            </div>
          )}

          <button
            type="button"
            onClick={() => void submit()}
            disabled={enviando}
            style={{
              background: colors.accent,
              color: colors.ink,
              border: 'none',
              fontWeight: 700,
              fontSize: 15.5,
              padding: 14,
              borderRadius: 11,
              cursor: enviando ? 'not-allowed' : 'pointer',
              opacity: enviando ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {enviando
              ? isCadastro
                ? 'Criando...'
                : 'Entrando...'
              : isCadastro
                ? 'Criar conta'
                : 'Entrar'}
          </button>

          {intencaoPendente && (
            <p style={{ margin: 0, textAlign: 'center', fontSize: 13, color: '#7B8990' }}>
              Entre para confirmar seu agendamento.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

// ===== Helpers de erro =====

// Mapeia ZodError -> { campo: mensagem } usando o primeiro erro de cada campo.
function zodErros(error: { issues: { path: (string | number)[]; message: string }[] }): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const chave = String(issue.path[0] ?? '_geral')
    if (!out[chave]) out[chave] = issue.message
  }
  return out
}

// Converte ApiError em erros por campo + mensagem geral (toast como fallback).
function tratarErro(e: unknown, setErros: (v: Record<string, string>) => void) {
  if (e instanceof ApiError) {
    const porCampo: Record<string, string> = {}
    if (e.errors) {
      for (const [campo, msgs] of Object.entries(e.errors)) {
        if (msgs?.[0]) porCampo[campo] = msgs[0]
      }
    }
    if (Object.keys(porCampo).length > 0) {
      setErros(porCampo)
      return
    }
    setErros({ _geral: e.message })
    return
  }
  toast.erro('Algo deu errado. Tente novamente.')
  setErros({ _geral: 'Algo deu errado. Tente novamente.' })
}

// ===== UI =====

const inputStyle = (temErro: boolean): React.CSSProperties => ({
  width: '100%',
  background: colors.branco,
  border: temErro ? '1px solid #E5A29A' : '1px solid #DCE3E7',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 15,
  color: colors.ink,
  boxSizing: 'border-box',
})

function Field({
  label,
  erro,
  children,
}: {
  label: string
  erro?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5C6B76', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {erro && <p style={{ margin: '6px 0 0', color: '#B33A2B', fontSize: 12.5, fontWeight: 600 }}>{erro}</p>}
    </div>
  )
}
