import { DOWS, MONS, isoLocal, addDays } from '../utils/format.js';

// Tira de datas reutilizada na tela de agendamento (com dias fechados)
// e no painel de agenda (sem restrição). `shop` é opcional.
export default function DateChips({ count, selected, onSelect, shop, scroll = false, width = 62 }) {
  const chips = [];
  for (let i = 0; i < count; i++) {
    const d = addDays(i);
    const iso = isoLocal(d);
    const dw = d.getDay();
    const closed = shop ? !shop.horarios[dw] || !shop.horarios[dw].on : false;
    const isSel = selected === iso;

    let box;
    if (isSel) box = { background: '#25343F', color: '#fff', border: '1px solid #25343F' };
    else if (closed) box = { background: '#F2F5F6', color: '#B6C2C8', border: '1px solid #E8EDEF', cursor: 'not-allowed' };
    else box = { background: '#fff', color: '#25343F', border: '1px solid #E3E9EC' };

    chips.push(
      <button
        key={iso}
        onClick={() => { if (!closed) onSelect(iso); }}
        style={{ flex: 'none', width, cursor: closed ? 'not-allowed' : 'pointer', borderRadius: 12, padding: '11px 0', textAlign: 'center', transition: '.12s', ...box }}
      >
        <span style={{ display: 'block', fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', opacity: 0.8 }}>{DOWS[dw]}</span>
        <span style={{ display: 'block', fontSize: 20, fontWeight: 800, fontFamily: "'Archivo', sans-serif", lineHeight: 1.2 }}>{String(d.getDate()).padStart(2, '0')}</span>
        <span style={{ display: 'block', fontSize: 11, opacity: 0.7 }}>{MONS[d.getMonth()]}</span>
      </button>
    );
  }

  return (
    <div style={scroll
      ? { display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 6 }
      : { display: 'flex', flexWrap: 'wrap', gap: 9 }}>
      {chips}
    </div>
  );
}
