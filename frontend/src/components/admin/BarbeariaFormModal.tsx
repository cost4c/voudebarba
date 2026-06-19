// Modal de cadastro/edição de barbearia (admin).
// Criar: POST /admin/barbearias (dono + barbearia + horários padrão).
// Editar: PUT /admin/barbearias/{id} (dados da barbearia + do dono; sem perfil/senha).

import { useEffect, useState, type CSSProperties } from 'react'
import { api, ApiError } from '../../lib/api'
import { toast } from '../../store/uiStore'
import { colors, fonts } from '../../lib/theme'
import { criarBarbeariaAdminSchema, editarBarbeariaAdminSchema } from '../../lib/schemas'
import type { BarbeariaAdmin } from '../../lib/types'
import Modal from '../ui/Modal'

const VAZIO = {
  dono_nome: '',
  dono_email: '',
  dono_senha: '',
  nome: '',
  descricao: '',
  telefone: '',
  endereco_texto: '',
}

interface Props {
  barbeariaId: number | null // null = criar
  onClose: () => void
  onSaved: () => void
}

export default function BarbeariaFormModal({ barbeariaId, onClose, onSaved }: Props) {
  const edicao = barbeariaId !== null
  const [form, setForm] = useState({ ...VAZIO })
  const [erros, setErros] = useState<Record<string, string>>({})
  const [carregando, setCarregando] = useState(edicao)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!edicao) return
    let vivo = true
    api
      .get<BarbeariaAdmin>(`/admin/barbearias/${barbeariaId}`)
      .then((b) => {
        if (vivo)
          setForm({
            dono_nome: b.dono_nome ?? '',
            dono_email: b.dono_email ?? '',
            dono_senha: '',
            nome: b.nome,
            descricao: b.descricao,
            telefone: b.telefone,
            endereco_texto: b.endereco_texto,
          })
      })
      .catch((e) => toast.erro(e instanceof ApiError ? e.message : 'Barbearia não encontrada.'))
      .finally(() => vivo && setCarregando(false))
    return () => {
      vivo = false
    }
  }, [edicao, barbeariaId])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      const parsed = editarBarbeariaAdminSchema.safeParse(form)
      if (!parsed.success) return setErros(zodErros(parsed.error))
      setSalvando(true)
      try {
        await api.put<BarbeariaAdmin>(`/admin/barbearias/${barbeariaId}`, parsed.data)
        toast.sucesso('Barbearia atualizada.')
        onSaved()
        onClose()
      } catch (e) {
        tratarErro(e, setErros)
      } finally {
        setSalvando(false)
      }
      return
    }
    const parsed = criarBarbeariaAdminSchema.safeParse(form)
    if (!parsed.success) return setErros(zodErros(parsed.error))
    setSalvando(true)
    try {
      await api.post<BarbeariaAdmin>('/admin/barbearias', parsed.data)
      toast.sucesso('Barbearia cadastrada. O dono já pode acessar o painel.')
      onSaved()
      onClose()
    } catch (e) {
      tratarErro(e, setErros)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal aberto onClose={onClose} titulo={edicao ? 'Editar barbearia' : 'Nova barbearia'}>
      {carregando ? (
        <p style={{ color: '#5C6B76', fontSize: 15, margin: 0 }}>Carregando…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Secao titulo={edicao ? 'Responsável (dono)' : 'Dados de acesso do dono'}>
            <Campo label="Nome do responsável" erro={erros.dono_nome}>
              <input value={form.dono_nome} onChange={set('dono_nome')} placeholder="Nome e sobrenome" style={inputStyle(!!erros.dono_nome)} />
            </Campo>
            <Campo label="E-mail de acesso" erro={erros.dono_email}>
              <input value={form.dono_email} onChange={set('dono_email')} type="email" placeholder="dono@barbearia.com" style={inputStyle(!!erros.dono_email)} />
            </Campo>
            {!edicao && (
              <Campo label="Senha inicial" erro={erros.dono_senha}>
                <input value={form.dono_senha} onChange={set('dono_senha')} type="password" placeholder="••••••••" style={inputStyle(!!erros.dono_senha)} />
              </Campo>
            )}
          </Secao>

          <Secao titulo="Dados da barbearia">
            <Campo label="Nome da barbearia" erro={erros.nome}>
              <input value={form.nome} onChange={set('nome')} placeholder="Ex.: Barbearia do Zé" style={inputStyle(!!erros.nome)} />
            </Campo>
            <Campo label="Descrição" erro={erros.descricao}>
              <textarea value={form.descricao} onChange={set('descricao')} rows={3} placeholder="Uma breve descrição" style={{ ...inputStyle(!!erros.descricao), resize: 'vertical' }} />
            </Campo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Campo label="Telefone" erro={erros.telefone}>
                <input value={form.telefone} onChange={set('telefone')} placeholder="(11) 90000-0000" style={inputStyle(!!erros.telefone)} />
              </Campo>
              <Campo label="Endereço" erro={erros.endereco_texto}>
                <input value={form.endereco_texto} onChange={set('endereco_texto')} placeholder="Rua, nº — Bairro" style={inputStyle(!!erros.endereco_texto)} />
              </Campo>
            </div>
          </Secao>

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
              {salvando ? 'Salvando…' : edicao ? 'Salvar alterações' : 'Cadastrar barbearia'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 15, margin: '0 0 12px', color: '#5C6B76' }}>{titulo}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
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
