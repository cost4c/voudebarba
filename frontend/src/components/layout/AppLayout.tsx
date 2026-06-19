import { useEffect, useRef, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { colors, fonts } from '../../lib/theme'
import { toast } from '../../store/uiStore'
import { initials } from '../../lib/datas'
import type { Usuario } from '../../lib/types'

// Layout base do VouDeBarba. Porta design/react-app/src/App.jsx + components/Header.jsx.
// Header escuro fixo, navegação ciente da sessão e <main> centralizado com <Outlet/>.
// Os portais de overlay (Toasts/modais) são montados UMA vez no RootGate.
export default function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: colors.bg }}>
      <Header />
      <main
        style={{
          flex: '1 0 auto',
          width: '100%',
          maxWidth: 1200,
          margin: '0 auto',
          padding: '36px 24px 48px',
        }}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function Footer() {
  const ano = new Date().getFullYear()
  return (
    <footer
      style={{
        flexShrink: 0,
        background: colors.ink,
        color: '#9FB0B8',
        borderTop: '1px solid rgba(255,255,255,.08)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13 }}>
          © {ano} VouDeBarba — Agende sua barbearia
        </span>
        <span style={{ fontSize: 12.5, color: '#6E8088' }}>
          Feito para barbearias e seus clientes.
        </span>
      </div>
    </footer>
  )
}

function Header() {
  const usuario = useAuthStore((s) => s.usuario)
  const isCliente = useAuthStore((s) => s.isCliente())
  const isBarbearia = useAuthStore((s) => s.isBarbearia())
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  async function sair() {
    try {
      await logout()
      toast.sucesso('Sessão encerrada.')
    } catch {
      toast.erro('Não foi possível sair. Tente novamente.')
    } finally {
      navigate('/')
    }
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: colors.ink,
        color: '#fff',
        borderBottom: '1px solid rgba(255,255,255,.08)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          gap: 28,
        }}
      >
        <NavLink
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none', textDecoration: 'none' }}
          aria-label="VouDeBarba — início"
        >
          <img
            src="/assets/icon-voudebarba-white.svg"
            alt=""
            style={{ height: 30, width: 'auto', filter: 'brightness(0) invert(1)' }}
          />
          <img
            src="/assets/name-voudebarba-black.svg"
            alt="VouDeBarba"
            style={{ height: 26, width: 'auto', filter: 'brightness(0) invert(1)' }}
          />
        </NavLink>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          {isCliente && (
            <>
              <NavItem to="/">Barbearias</NavItem>
              <NavItem to="/meus-agendamentos">Meus agendamentos</NavItem>
            </>
          )}
          {isBarbearia && (
            <>
              <NavItem to="/agenda">Agenda</NavItem>
              <NavItem to="/configuracoes">Configurações</NavItem>
            </>
          )}
          {isAdmin && (
            <>
              <NavItem to="/admin">Painel</NavItem>
              <NavItem to="/admin/barbearias">Barbearias</NavItem>
              <NavItem to="/admin/clientes">Clientes</NavItem>
              <NavItem to="/admin/administradores">Administradores</NavItem>
            </>
          )}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          {usuario ? (
            <UserMenu usuario={usuario} onSair={sair} />
          ) : (
            <NavLink
              to="/entrar"
              style={{
                background: colors.accent,
                color: colors.ink,
                border: 'none',
                fontWeight: 700,
                fontSize: 14,
                padding: '9px 18px',
                borderRadius: 9,
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              Entrar
            </NavLink>
          )}
        </div>
      </div>
    </header>
  )
}

function UserMenu({ usuario, onSair }: { usuario: Usuario; onSair: () => void }) {
  const navigate = useNavigate()
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [aberto])

  // Mostra a foto enviada; se for a padrão (user.jpg), usa as iniciais.
  const temFoto = !!usuario.foto_url && !usuario.foto_url.endsWith('user.jpg')

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setAberto((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        title={usuario.nome}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 3,
          borderRadius: 999,
        }}
      >
        {temFoto ? (
          <img
            src={usuario.foto_url as string}
            alt={usuario.nome}
            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,.22)' }}
          />
        ) : (
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: colors.accent,
              color: colors.ink,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 13,
              fontFamily: fonts.display,
            }}
          >
            {initials(usuario.nome)}
          </span>
        )}
        <span
          style={{
            color: '#9FB0B8',
            fontSize: 33,
            lineHeight: 1,
            transform: aberto ? 'rotate(180deg)' : 'none',
            transition: 'transform .15s',
          }}
        >
          ▾
        </span>
      </button>

      {aberto && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            minWidth: 224,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 16px 40px rgba(0,0,0,.22)',
            overflow: 'hidden',
            zIndex: 60,
          }}
        >
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #EEF2F3' }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: colors.ink,
                fontFamily: fonts.display,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {usuario.nome}
            </div>
            <div style={{ fontSize: 12.5, color: '#7B8990', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {usuario.email}
            </div>
          </div>
          <MenuItem onClick={() => { setAberto(false); navigate('/perfil') }}>Meu perfil</MenuItem>
          <MenuItem onClick={() => { setAberto(false); onSair() }} danger>
            Sair
          </MenuItem>
        </div>
      )}
    </div>
  )
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      role="menuitem"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        background: hover ? '#F2F5F6' : '#fff',
        border: 'none',
        cursor: 'pointer',
        padding: '11px 16px',
        fontSize: 14,
        fontWeight: 600,
        color: danger ? '#B33A2B' : colors.ink,
      }}
    >
      {children}
    </button>
  )
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      style={({ isActive }) => ({
        fontSize: 14.5,
        fontWeight: 600,
        padding: '9px 13px',
        borderRadius: 9,
        textDecoration: 'none',
        background: isActive ? 'rgba(255,255,255,.12)' : 'transparent',
        color: isActive ? '#fff' : '#9FB0B8',
      })}
    >
      {children}
    </NavLink>
  )
}
