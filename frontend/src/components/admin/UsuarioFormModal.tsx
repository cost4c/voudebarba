// Modal de criação/edição de usuário (admin).
// Criar: sempre Administrador (clientes se auto-cadastram; barbearias têm fluxo próprio).
// Editar: nome/e-mail; perfil NUNCA é alterável (exibido como somente-leitura).

import { useEffect, useState, type CSSProperties } from 'react'
import { api, ApiError } from '../../lib/api'
import { toast } from '../../store/uiStore'
import { colors } from '../../lib/theme'
import { adminUsuarioCriarSchema, adminUsuarioEditarSchema } from '../../lib/schemas'
import { Perfil, type Usuario } from '../../lib/types'
import Modal from '../ui/Modal'
import AvatarUpload from '../ui/AvatarUpload'

interface Props {
  usuarioId: number | null // null = criar (Administrador)
  onClose: () => void
  onSaved: () => void
}

export default function UsuarioFormModal({ usuarioId, onClose, onSaved }: Props) {
  const edicao = usuarioId !== null
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: Perfil.ADMIN as string })
  const [foto, setFoto] = useState<string | null>(null)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [carregando, setCarregando] = useState(edicao)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!edicao) return
    let vivo = true
    api
      .get<Usuario>(`/admin/usuarios/${usuarioId}`)
      .then((u) => {
        if (vivo) setForm({ nome: u.nome, email: u.email, senha: '', perfil: u.perfil })
      })
      .catch((e) => toast.erro(e instanceof ApiError ? e.message : 'Usuário não encontrado.'))
      .finally(() => vivo && setCarregando(false))
    return () => {
      vivo = false
    }
  }, [edicao, usuarioId])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setForm((p) => ({ ...p, [k]: v }))
    setErros((p) => {
      const { [k]: _o, ...resto } = p
      return resto
    })
  }

  const salvar = async () => {
    if (salvando) return
    setErros({})
    if (edicao) {
      const parsed = adminUsuarioEditarSchema.safeParse({ nome: form.nome, email: form.email, perfil: form.perfil })
      if (!parsed.success) return setErros(zodErros(parsed.error))
      setSalvando(true)
      try {
        await api.put<Usuario>(`/admin/usuarios/${usuarioId}`, {
          id: usuarioId,
          nome: parsed.data.nome,
          email: parsed.data.email,
          perfil: parsed.data.perfil, // inalterado
        })
        toast.sucesso('Usuário atualizado.')
        onSaved()
        onClose()
      } catch (e) {
        tratarErro(e, setErros)
      } finally {
        setSalvando(false)
      }
      return
    }
    const parsed = adminUsuarioCriarSchema.safeParse({ ...form, perfil: Perfil.ADMIN })
    if (!parsed.success) return setErros(zodErros(parsed.error))
    setSalvando(true)
    try {
      await api.post<Usuario>('/admin/usuarios', { ...parsed.data, foto_base64: foto ?? undefined })
      toast.sucesso('Administrador criado.')
      onSaved()
      onClose()
    } catch (e) {
      tratarErro(e, setErros)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal aberto onClose={onClose} titulo={edicao ? 'Editar usuário' : 'Novo administrador'}>
      {carregando ? (
        <p style={{ color: '#5C6B76', fontSize: 15, margin: 0 }}>Carregando…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!edicao && (
            <Campo label="Foto (opcional)">
              <AvatarUpload value={foto} onChange={setFoto} nome={form.nome} />
            </Campo>
          )}
          <Campo label="Nome completo" erro={erros.nome}>
            <input value={form.nome} onChange={set('nome')} placeholder="Nome e sobrenome" style={inputStyle(!!erros.nome)} />
          </Campo>
          <Campo label="E-mail" erro={erros.email}>
            <input value={form.email} onChange={set('email')} type="email" placeholder="email@exemplo.com" style={inputStyle(!!erros.email)} />
          </Campo>
          {!edicao && (
            <Campo label="Senha" erro={erros.senha}>
              <input value={form.senha} onChange={set('senha')} type="password" placeholder="••••••••" style={inputStyle(!!erros.senha)} />
            </Campo>
          )}
          <Campo label="Perfil">
            <div style={{ ...inputStyle(false), background: '#F2F5F6', color: '#5C6B76', fontWeight: 600 }}>
              {edicao ? form.perfil : Perfil.ADMIN}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 12.5, color: '#7B8990' }}>
              O perfil não é alterável. Clientes se auto-cadastram; barbearias em Barbearias → Nova barbearia.
            </p>
          </Campo>

          {erros._geral && (
            <div style={{ background: '#FBE9E7', color: '#B33A2B', fontSize: 13, fontWeight: 600, padding: '10px 13px', borderRadius: 9 }}>
              {erros._geral}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button onClick={onClose} disabled={salvando} style={cancelarBtn}>
              Cancelar
            </button>
            <button onClick={salvar} disabled={salvando} style={{ ...salvarBtn, opacity: salvando ? 0.7 : 1 }}>
              {salvando ? 'Salvando…' : edicao ? 'Salvar alterações' : 'Criar administrador'}
            </button>
          </div>
        </div>
      )}
    </Modal>
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
  background: colors.accent,
  color: colors.ink,
  border: 'none',
  fontWeight: 700,
  fontSize: 14.5,
  padding: '12px 22px',
  borderRadius: 10,
  cursor: 'pointer',
}
const cancelarBtn: CSSProperties = {
  background: 'none',
  border: '1px solid #DCE3E7',
  color: '#5C6B76',
  fontWeight: 700,
  fontSize: 14.5,
  padding: '12px 18px',
  borderRadius: 10,
  cursor: 'pointer',
}
