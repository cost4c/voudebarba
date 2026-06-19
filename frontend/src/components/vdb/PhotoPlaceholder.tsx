// Placeholder listrado para fotos ainda não enviadas.
// Portado de design/react-app/src/components/PhotoPlaceholder.jsx.

interface PhotoPlaceholderProps {
  label: string
  height?: number
  radius?: number
}

export default function PhotoPlaceholder({ label, height = 120, radius = 0 }: PhotoPlaceholderProps) {
  return (
    <div
      style={{
        height,
        background:
          'repeating-linear-gradient(45deg,#E6ECEF,#E6ECEF 11px,#EFF3F4 11px,#EFF3F4 22px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: radius ? 'none' : '1px solid #E3E9EC',
        borderRadius: radius,
      }}
    >
      <span
        style={{
          fontFamily: "'Archivo', monospace",
          fontSize: 11,
          letterSpacing: '.06em',
          color: '#A8B6BC',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  )
}
