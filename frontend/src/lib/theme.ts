// Tokens de design do VouDeBarba (fonte: design/react-app/src/index.css).
// As telas usam inline styles portados fielmente do protótipo.

export const colors = {
  bg: '#EAEFEF',
  ink: '#25343F',
  accent: '#FF9B51',
  accentD: '#EF8434',
  accentSoft: '#FFEAD6',
  branco: '#FFFFFF',
  borda: '#cdd7dc',
  mut: '#67797f',
} as const

export const fonts = {
  display: "'Archivo', system-ui, sans-serif",
  body: "'Public Sans', system-ui, sans-serif",
} as const

export type ColorToken = keyof typeof colors
