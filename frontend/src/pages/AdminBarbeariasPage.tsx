// AdminBarbeariasPage — listagem e gestão de barbearias (perfil Administrador).
// GET /api/admin/barbearias · PATCH /api/admin/barbearias/{id}/status.
// Cadastro/edição (composto: dono + barbearia) via BarbeariaFormModal.

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { api, ApiError } from '../lib/api'
import { toast, useUIStore } from '../store/uiStore'
import { colors, fonts } from '../lib/theme'
import { initials } from '../lib/datas'
import type { BarbeariaAdmin } from '../lib/types'
import BarbeariaFormModal from '../components/admin/BarbeariaFormModal'

export default function AdminBarbeariasPage() {
  const pedirConfirmacao = useUIStore((s) => s.pedirConfirmacao)
  const [lista, setLista] = useState<BarbeariaAdmin[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null })

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      setLista(await api.get<BarbeariaAdmin[]>('/admin/barbearias'))
    } catch (e) {
      toast.erro(e instanceof ApiError ? e.message : 'Falha ao carregar barbearias.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const alternarStatus = (b: BarbeariaAdmin) => {
    const ativar = !b.ativa
    pedirConfirmacao({
      titulo: ativar ? 'Ativar barbearia' : 'Desativar barbearia',
      mensagem: `${ativar ? 'Ativar' : 'Desativar'} "${b.nome}"?`,
      detalhes: ativar
        ? 'Ela voltará a aparecer na busca pública.'
        : 'Ela deixará de aparecer na busca pública (dados preservados).',
      textoConfirmar: ativar ? 'Ativar' : 'Desativar',
      tipo: ativar ? 'warning' : 'danger',
      onConfirmar: async () => {
        try {
          const atualizada = await api.patch<BarbeariaAdmin>(
            `/admin/barbearias/${b.id}/status`,
            { ativa: ativar },
          )
          setLista((l) => l.map((x) => (x.id === b.id ? atualizada : x)))
          toast.sucesso(ativar ? 'Barbearia ativada.' : 'Barbearia desativada.')
        } catch (e) {
          toast.erro(e instanceof ApiError ? e.message : 'Falha ao alterar o status.')
        }
      },
    })
  }

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
          <h1 style={tituloStyle}>Barbearias</h1>
          <p style={{ margin: '4px 0 0', color: '#5C6B76', fontSize: 15 }}>
            {`${lista.length} barbearia(s) cadastrada(s)`}
          </p>
        </div>
        <button onClick={() => setModal({ open: true, id: null })} style={addBtn}>
          + Nova barbearia
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E3E9EC', borderRadius: 16, overflow: 'hidden' }}>
        {carregando ? (
          <p style={{ padding: 24, color: '#5C6B76', fontSize: 15, margin: 0 }}>Carregando…</p>
        ) : lista.length === 0 ? (
          <p style={{ padding: 24, color: '#94A2A9', fontSize: 15, margin: 0 }}>
            Nenhuma barbearia cadastrada. Use “Nova barbearia”.
          </p>
        ) : (
          lista.map((b, i) => (
            <div
              key={b.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                borderTop: i === 0 ? 'none' : '1px solid #EEF2F3',
                opacity: b.ativa ? 1 : 0.7,
              }}
            >
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
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
                {initials(b.nome)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, fontFamily: fonts.display }}>{b.nome}</div>
                <div style={{ fontSize: 13, color: '#7B8990', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.dono_email} · {b.total_servicos} serviço(s) · {b.total_barbeiros} barbeiro(s)
                </div>
              </div>
              <span
                style={{
                  background: b.ativa ? '#E6F2EA' : '#F1E3E1',
                  color: b.ativa ? '#1F7A4D' : '#B33A2B',
                  fontWeight: 700,
                  fontSize: 12,
                  padding: '5px 10px',
                  borderRadius: 999,
                  flex: 'none',
                }}
              >
                {b.ativa ? 'Ativa' : 'Inativa'}
              </span>
              <button onClick={() => setModal({ open: true, id: b.id })} style={editLink}>
                Editar
              </button>
              <button
                onClick={() => alternarStatus(b)}
                style={{
                  background: 'none',
                  border: '1px solid #DCE3E7',
                  borderRadius: 9,
                  color: b.ativa ? '#B33A2B' : '#1F7A4D',
                  fontWeight: 700,
                  fontSize: 13,
                  padding: '7px 12px',
                  cursor: 'pointer',
                  flex: 'none',
                }}
              >
                {b.ativa ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          ))
        )}
      </div>

      {modal.open && (
        <BarbeariaFormModal
          barbeariaId={modal.id}
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
