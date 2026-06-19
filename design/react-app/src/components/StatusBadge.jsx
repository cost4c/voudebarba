const MAP = {
  agendado: { box: { background: '#FFE7D2', color: '#9A4E16' }, label: 'Agendado' },
  realizado: { box: { background: '#E2ECE6', color: '#2E6A4C' }, label: 'Realizado' },
  cancelado: { box: { background: '#ECEFF1', color: '#7B8990' }, label: 'Cancelado' },
};

export default function StatusBadge({ status }) {
  const s = MAP[status] || MAP.agendado;
  return (
    <span style={{ display: 'inline-block', padding: '5px 11px', borderRadius: 999, fontSize: 12, fontWeight: 700, ...s.box }}>
      {s.label}
    </span>
  );
}
