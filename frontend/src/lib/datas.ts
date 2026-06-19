// Helpers puros de data/moeda do VouDeBarba.
// Portados de design/react-app/src/utils/format.js (slotsFor NÃO — vem da API).

export const DOWS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const
export const DOWS_FULL = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const
export const MONS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const

// Data local em ISO (YYYY-MM-DD), sem fuso.
export function isoLocal(d: Date): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  )
}

// Hoje + n dias, fixado ao meio-dia para evitar saltos de fuso.
export function addDays(n: number): Date {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return d
}

// "HH:MM" -> minutos desde meia-noite.
export function toMin(t: string): number {
  const p = t.split(':')
  return +p[0] * 60 + +p[1]
}

// Minutos desde meia-noite -> "HH:MM".
export function toHHMM(m: number): string {
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')
}

// Dia da semana (0=Dom..6=Sab) de um ISO "YYYY-MM-DD".
export function dow(iso: string): number {
  return new Date(iso + 'T12:00:00').getDay()
}

// "YYYY-MM-DD" -> "Seg, 21/06".
export function fmtDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return (
    DOWS[d.getDay()] +
    ', ' +
    String(d.getDate()).padStart(2, '0') +
    '/' +
    String(d.getMonth() + 1).padStart(2, '0')
  )
}

// Número -> "R$ 1.234,56" (vírgula decimal pt-BR).
export function money(n: number): string {
  return 'R$ ' + Number(n).toFixed(2).replace('.', ',')
}

// Iniciais (até 2) de um nome para avatares.
export function initials(n: string): string {
  return n
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}
