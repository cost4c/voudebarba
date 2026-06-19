// Constantes de localização e helpers puros de data/moeda.

export const DOWS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DOWS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const MONS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Data local em ISO (YYYY-MM-DD), sem fuso.
export function isoLocal(d) {
  return (
    d.getFullYear() +
    '-' + String(d.getMonth() + 1).padStart(2, '0') +
    '-' + String(d.getDate()).padStart(2, '0')
  );
}

// Hoje + n dias, fixado ao meio-dia para evitar saltos de fuso.
export function addDays(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

export function toMin(t) {
  const p = t.split(':');
  return (+p[0]) * 60 + (+p[1]);
}

export function toHHMM(m) {
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}

export function dow(iso) {
  return new Date(iso + 'T12:00:00').getDay();
}

export function fmtDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return DOWS[d.getDay()] + ', ' + String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
}

export function money(n) {
  return 'R$ ' + Number(n).toFixed(2).replace('.', ',');
}

export function initials(n) {
  return n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// Gera os horários de 30 em 30 min dentro do expediente do dia,
// marcando como ocupados os que já têm agendamento ativo.
export function slotsFor(shop, barberId, iso, appts) {
  if (!shop || !barberId || !iso) return [];
  const h = shop.horarios[dow(iso)];
  if (!h || !h.on) return [];
  const taken = new Set(
    appts
      .filter((a) => a.shopId === shop.id && a.barberId === barberId && a.date === iso && a.status !== 'cancelado')
      .map((a) => a.time)
  );
  const out = [];
  for (let m = toMin(h.a); m < toMin(h.f); m += 30) {
    const t = toHHMM(m);
    out.push({ t, taken: taken.has(t) });
  }
  return out;
}
