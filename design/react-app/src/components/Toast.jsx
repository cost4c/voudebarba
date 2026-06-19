import { useApp } from '../context/AppContext.jsx';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div
      style={{
        position: 'fixed', left: '50%', bottom: 28, zIndex: 90, background: '#25343F', color: '#fff',
        padding: '13px 22px', borderRadius: 11, fontWeight: 600, fontSize: 14.5,
        boxShadow: '0 12px 32px rgba(37,52,63,.35)', animation: 'vdbToast .3s ease',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: '#25343F', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>✓</span>
      {toast}
    </div>
  );
}
