// PerfilPage — edição do próprio perfil (qualquer usuário autenticado).
// Dados (nome/e-mail) via PUT /api/usuario/perfil; senha via PUT /api/usuario/senha.

import { useState, type CSSProperties } from 'react'
import { api, ApiError } from '../lib/api'
import { toast } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { colors, fonts } from '../lib/theme'
import { perfilEditSchema, alterarSenhaSchema } from '../lib/schemas'
import type { Usuario, MensagemResponse } from '../lib/types'
import AvatarUpload from '../components/ui/AvatarUpload'

export default function PerfilPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const setUsuario = useAuthStore((s) => s.setUsuario)

  if (!usuario) return null

  return (
    <section style={{ maxWidth: 920 }}>
      <h1 style={tituloStyle}>Meu perfil</h1>
      <p style={{ margin: '4px 0 24px', color: '#5C6B76', fontSize: 15 }}>
        Atualize seus dados e a sua senha de acesso.
      </p>

      <div
        className="vdb-cfg-grid"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}
      >
        <DadosCard usuario={usuario} setUsuario={setUsuario} />
        <SenhaCard />
      </div>
    </section>
  )
}

function DadosCard({
  usuario,
  setUsuario,
}: {
  usuario: Usuario
  setUsuario: (u: Usuario) => void
}) {
  const [nome, setNome] = useState(usuario.nome)
  const [email, setEmail] = useState(usuario.email)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)

  const trocarFoto = async (b64: string | null) => {
    if (!b64) return
    try {
      const u = await api.put<Usuario>('/usuario/foto', { foto_base64: b64 })
      // Cache-buster: foto_url é determinística por id; força recarregar a imagem.
      setUsuario({ ...u, foto_url: `${u.foto_url ?? ''}?v=${Date.now()}` })
      toast.sucesso('Foto atualizada.')
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Falha ao atualizar a foto.')
    }
  }

  const salvar = async () => {
    if (salvando) return
    setErros({})
    const parsed = perfilEditSchema.safeParse({ nome, email })
    if (!parsed.success) return setErros(zodErros(parsed.error))
    setSalvando(true)
    try {
      const atualizado = await api.put<Usuario>('/usuario/perfil', parsed.data)
      setUsuario(atualizado)
      toast.sucesso('Perfil atualizado.')
    } catch (e) {
      tratarErro(e, setErros)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Card titulo="Dados pessoais">
      <Campo label="Foto de perfil">
        <AvatarUpload value={usuario.foto_url ?? null} onChange={trocarFoto} nome={usuario.nome} permitirRemover={false} />
      </Campo>
      <Campo label="Nome completo" erro={erros.nome}>
        <input value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle(!!erros.nome)} />
      </Campo>
      <Campo label="E-mail" erro={erros.email}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" style={inputStyle(!!erros.email)} />
      </Campo>
      <div style={{ fontSize: 13, color: '#7B8990' }}>
        Perfil: <strong style={{ color: colors.ink }}>{usuario.perfil}</strong>
      </div>
      {erros._geral && <ErroGeral msg={erros._geral} />}
      <button onClick={salvar} disabled={salvando} style={{ ...salvarBtn, opacity: salvando ? 0.7 : 1 }}>
        {salvando ? 'Salvando…' : 'Salvar dados'}
      </button>
    </Card>
  )
}

function SenhaCard() {
  const [f, setF] = useState({ senha_atual: '', senha_nova: '', confirmar_senha: '' })
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setF((p) => ({ ...p, [k]: v }))
    setErros((p) => {
      const { [k]: _o, ...resto } = p
      return resto
    })
  }

  const salvar = async () => {
    if (salvando) return
    setErros({})
    const parsed = alterarSenhaSchema.safeParse(f)
    if (!parsed.success) return setErros(zodErros(parsed.error))
    setSalvando(true)
    try {
      await api.put<MensagemResponse>('/usuario/senha', {
        senha_atual: parsed.data.senha_atual,
        senha_nova: parsed.data.senha_nova,
        confirmar_senha: parsed.data.confirmar_senha,
      })
      toast.sucesso('Senha alterada.')
      setF({ senha_atual: '', senha_nova: '', confirmar_senha: '' })
    } catch (e) {
      tratarErro(e, setErros)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Card titulo="Alterar senha">
      <Campo label="Senha atual" erro={erros.senha_atual}>
        <input value={f.senha_atual} onChange={set('senha_atual')} type="password" placeholder="••••••••" style={inputStyle(!!erros.senha_atual)} />
      </Campo>
      <Campo label="Nova senha" erro={erros.senha_nova}>
        <input value={f.senha_nova} onChange={set('senha_nova')} type="password" placeholder="••••••••" style={inputStyle(!!erros.senha_nova)} />
      </Campo>
      <Campo label="Confirmar nova senha" erro={erros.confirmar_senha}>
        <input value={f.confirmar_senha} onChange={set('confirmar_senha')} type="password" placeholder="••••••••" style={inputStyle(!!erros.confirmar_senha)} />
      </Campo>
      {erros._geral && <ErroGeral msg={erros._geral} />}
      <button onClick={salvar} disabled={salvando} style={{ ...salvarBtn, opacity: salvando ? 0.7 : 1 }}>
        {salvando ? 'Salvando…' : 'Alterar senha'}
      </button>
    </Card>
  )
}

// ===== UI helpers =====

function Card({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E3E9EC', borderRadius: 16, padding: 26 }}>
      <h2 style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 18, margin: '0 0 18px' }}>{titulo}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  )
}

function Campo({ label, erro, children }: { label: string; erro?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5C6B76', marginBottom: 6 }}>{label}</label>
      {children}
      {erro && <p style={{ margin: '6px 0 0', color: '#B33A2B', fontSize: 12.5, fontWeight: 600 }}>{erro}</p>}
    </div>
  )
}

function ErroGeral({ msg }: { msg: string }) {
  return (
    <div style={{ background: '#FBE9E7', color: '#B33A2B', fontSize: 13, fontWeight: 600, padding: '10px 13px', borderRadius: 9 }}>
      {msg}
    </div>
  )
}

function zodErros(error: { issues: { path: (string | number)[]; message: string }[] }): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const chave = String(issue.path[0] ?? '_geral')
    if (!out[chave]) out[chave] = issue.message
  }
  return out
}

function tratarErro(e: unknown, setErros: (v: Record<string, string>) => void) {
  if (e instanceof ApiError) {
    const porCampo: Record<string, string> = {}
    if (e.errors) for (const [campo, msgs] of Object.entries(e.errors)) if (msgs?.[0]) porCampo[campo] = msgs[0]
    setErros(Object.keys(porCampo).length ? porCampo : { _geral: e.message })
    return
  }
  setErros({ _geral: 'Algo deu errado. Tente novamente.' })
}

const tituloStyle: CSSProperties = {
  fontFamily: fonts.display,
  fontWeight: 800,
  fontSize: 30,
  margin: 0,
  letterSpacing: '-.02em',
}
function inputStyle(temErro: boolean): CSSProperties {
  return {
    width: '100%',
    background: '#fff',
    border: temErro ? '1px solid #E5A29A' : '1px solid #DCE3E7',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 15,
    color: colors.ink,
    boxSizing: 'border-box',
  }
}
const salvarBtn: CSSProperties = {
  alignSelf: 'flex-start',
  background: colors.accent,
  color: colors.ink,
  border: 'none',
  fontWeight: 700,
  fontSize: 14.5,
  padding: '12px 22px',
  borderRadius: 10,
  cursor: 'pointer',
  marginTop: 4,
}
