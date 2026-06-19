import { useNavigate, useLocation } from 'react-router';
import { useApp } from '../context/AppContext.jsx';
import { initials } from '../utils/format.js';

const navStyle = (active) =>
  active ? { background: 'rgba(255,255,255,.12)', color: '#fff' } : { color: '#9FB0B8' };
const segStyle = (active) =>
  active ? { background: 'var(--accent)', color: '#25343F' } : { background: 'transparent', color: '#9FB0B8' };

export default function Header() {
  const { role, setRole, user, logout } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const go = (to) => navigate(to);
  const switchRole = (r) => {
    setRole(r);
    navigate(r === 'barbearia' ? '/agenda' : '/');
  };

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 50, background: '#25343F', color: '#fff',
        borderBottom: '1px solid rgba(255,255,255,.08)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', gap: 28 }}>
        <div onClick={() => go('/')} style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', flex: 'none' }}>
          <img src="/logo.png" alt="VouDeBarba" style={{ height: 34, width: 'auto', filter: 'brightness(0) invert(1)' }} />
          <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: '-.02em' }}>
            VouDe<span style={{ color: 'var(--accent)' }}>Barba</span>
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          {role === 'cliente' && (
            <>
              <NavBtn onClick={() => go('/')} active={pathname === '/'}>Barbearias</NavBtn>
              <NavBtn onClick={() => go('/meus-agendamentos')} active={pathname === '/meus-agendamentos'}>Meus agendamentos</NavBtn>
            </>
          )}
          {role === 'barbearia' && (
            <>
              <NavBtn onClick={() => go('/agenda')} active={pathname === '/agenda'}>Agenda</NavBtn>
              <NavBtn onClick={() => go('/configuracoes')} active={pathname === '/configuracoes'}>Configurações</NavBtn>
            </>
          )}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,.07)', borderRadius: 9, padding: 3 }}>
            <button onClick={() => switchRole('cliente')} style={{ border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, padding: '6px 13px', borderRadius: 7, ...segStyle(role === 'cliente') }}>Cliente</button>
            <button onClick={() => switchRole('barbearia')} style={{ border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, padding: '6px 13px', borderRadius: 7, ...segStyle(role === 'barbearia') }}>Barbearia</button>
          </div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', color: '#25343F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, fontFamily: "'Archivo', sans-serif" }}>{initials(user.nome)}</div>
              <button onClick={() => { logout(); navigate('/'); }} style={{ background: 'none', border: 'none', color: '#9FB0B8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Sair</button>
            </div>
          ) : (
            <button onClick={() => go('/entrar')} style={{ background: 'var(--accent)', color: '#25343F', border: 'none', fontWeight: 700, fontSize: 14, padding: '9px 18px', borderRadius: 9, cursor: 'pointer' }}>Entrar</button>
          )}
        </div>
      </div>
    </header>
  );
}

function NavBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'none', border: 'none', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', padding: '9px 13px', borderRadius: 9, ...navStyle(active) }}
    >
      {children}
    </button>
  );
}
