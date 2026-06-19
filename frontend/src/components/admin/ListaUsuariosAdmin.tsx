// Lista de usuários de UM perfil (Clientes ou Administradores), sem filtro.
// Edição via /admin/usuarios/:id; exclusão com confirmação (sem auto-exclusão).
// Criação só quando `rotaCriar` é informado (Administradores).

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { api, ApiError } from '../../lib/api'
import { toast, useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { colors, fonts } from '../../lib/theme'
import { initials } from '../../lib/datas'
import type { PaginaResponse, Usuario } from '../../lib/types'
import UsuarioFormModal from './UsuarioFormModal'

const POR_PAGINA = 10

interface Props {
  perfil: string
  titulo: string
  descricao: string
  permitirCriar?: boolean
  textoCriar?: string
}

export default function ListaUsuariosAdmin({ perfil, titulo, descricao, permitirCriar, textoCriar }: Props) {
  const pedirConfirmacao = useUIStore((s) => s.pedirConfirmacao)
  const usuarioLogado = useAuthStore((s) => s.usuario)

  const [pagina, setPagina] = useState(1)
  const [dados, setDados] = useState<PaginaResponse<Usuario> | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null })

  // Volta para a página 1 ao trocar de perfil (reuso do componente em 2 rotas).
  useEffect(() => {
    setPagina(1)
  }, [perfil])

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const resp = await api.get<PaginaResponse<Usuario>>('/admin/usuarios', {
        params: { pagina, por_pagina: POR_PAGINA, perfil },
      })
      setDados(resp)
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Falha ao carregar usuários.')
    } finally {
      setCarregando(false)
    }
  }, [pagina, perfil])

  useEffect(() => {
    carregar()
  }, [carregar])

  const excluir = (u: Usuario) => {
    pedirConfirmacao({
      titulo: 'Excluir usuário',
      mensagem: `Excluir "${u.nome}" (${u.email})?`,
      detalhes: 'Esta ação não pode ser desfeita.',
      textoConfirmar: 'Excluir',
      tipo: 'danger',
      onConfirmar: async () => {
        try {
          await api.delete(`/admin/usuarios/${u.id}`)
          toast.sucesso('Usuário excluído.')
          if (dados && dados.items.length === 1 && pagina > 1) setPagina((p) => p - 1)
          else carregar()
        } catch (e) {
          toast.erro(e instanceof ApiError ? e.message : 'Falha ao excluir usuário.')
        }
      },
    })
  }

  const totalPaginas = dados?.total_paginas ?? 1

  return (
    <section>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={tituloStyle}>{titulo}</h1>
          <p style={{ margin: '4px 0 0', color: '#5C6B76', fontSize: 15 }}>
            {dados ? `${dados.total} ${descricao}` : descricao}
          </p>
        </div>
        {permitirCriar && (
          <button onClick={() => setModal({ open: true, id: null })} style={addBtn}>
            {textoCriar ?? '+ Novo'}
          </button>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E3E9EC', borderRadius: 16, overflow: 'hidden' }}>
        {carregando ? (
          <p style={{ padding: 24, color: '#5C6B76', fontSize: 15, margin: 0 }}>Carregando…</p>
        ) : !dados || dados.items.length === 0 ? (
          <p style={{ padding: 24, color: '#94A2A9', fontSize: 15, margin: 0 }}>Nenhum registro.</p>
        ) : (
          dados.items.map((u, i) => (
            <div
              key={u.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                borderTop: i === 0 ? 'none' : '1px solid #EEF2F3',
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: colors.ink,
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 14,
                  fontFamily: fonts.display,
                  flex: 'none',
                }}
              >
                {initials(u.nome)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, fontFamily: fonts.display }}>{u.nome}</div>
                <div style={{ fontSize: 13, color: '#7B8990', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email}
                </div>
              </div>
              <button onClick={() => setModal({ open: true, id: u.id })} style={editLink}>
                Editar
              </button>
              {u.id !== usuarioLogado?.id && (
                <button onClick={() => excluir(u)} style={removeBtn}>
                  Excluir
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {dados && totalPaginas > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 18 }}>
          <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1} style={pageBtn(pagina <= 1)}>
            ← Anterior
          </button>
          <span style={{ fontSize: 14, color: '#5C6B76', fontWeight: 600 }}>
            Página {pagina} de {totalPaginas}
          </span>
          <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina >= totalPaginas} style={pageBtn(pagina >= totalPaginas)}>
            Próxima →
          </button>
        </div>
      )}

      {modal.open && (
        <UsuarioFormModal
          usuarioId={modal.id}
          onClose={() => setModal({ open: false, id: null })}
          onSaved={carregar}
        />
      )}
    </section>
  )
}

const tituloStyle: CSSProperties = {
  fontFamily: fonts.display,
  fontWeight: 800,
  fontSize: 30,
  margin: 0,
  letterSpacing: '-.02em',
}
const addBtn: CSSProperties = {
  background: colors.accent,
  color: colors.ink,
  border: 'none',
  fontWeight: 700,
  fontSize: 14.5,
  padding: '11px 18px',
  borderRadius: 10,
  cursor: 'pointer',
  textDecoration: 'none',
}
const editLink: CSSProperties = {
  background: 'none',
  border: 'none',
  color: colors.accentD,
  fontWeight: 700,
  fontSize: 13,
  textDecoration: 'none',
  cursor: 'pointer',
  flex: 'none',
}
const removeBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#B33A2B',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  flex: 'none',
}
function pageBtn(disabled: boolean): CSSProperties {
  return {
    background: '#fff',
    border: '1px solid #DCE3E7',
    borderRadius: 9,
    padding: '8px 14px',
    fontSize: 14,
    fontWeight: 600,
    color: disabled ? '#B7C2C8' : colors.ink,
    cursor: disabled ? 'default' : 'pointer',
  }
}
