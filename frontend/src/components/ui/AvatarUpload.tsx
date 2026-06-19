// Seletor de foto/avatar: pré-visualização circular + escolher/remover.
// Converte o arquivo para data URL (base64) e devolve via onChange. Máx 2MB.

import { useRef } from 'react'
import { colors, fonts } from '../../lib/theme'
import { initials } from '../../lib/datas'
import { toast } from '../../store/uiStore'

interface Props {
  value: string | null // data URL base64, URL de imagem, ou null
  onChange: (v: string | null) => void
  nome?: string
  permitirRemover?: boolean
}

const MAX_BYTES = 2 * 1024 * 1024

export default function AvatarUpload({ value, onChange, nome, permitirRemover = true }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite reescolher o mesmo arquivo
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.erro('Selecione um arquivo de imagem.')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.erro('A imagem deve ter no máximo 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(typeof reader.result === 'string' ? reader.result : null)
    reader.onerror = () => toast.erro('Não foi possível ler a imagem.')
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {value ? (
        <img
          src={value}
          alt="Pré-visualização"
          style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '1px solid #DCE3E7' }}
        />
      ) : (
        <span
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: colors.accentSoft,
            color: colors.accentD,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 18,
            fontFamily: fonts.display,
          }}
        >
          {nome ? initials(nome) : '👤'}
        </span>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" onClick={() => inputRef.current?.click()} style={btn}>
          {value ? 'Trocar foto' : 'Escolher foto'}
        </button>
        {value && permitirRemover && (
          <button type="button" onClick={() => onChange(null)} style={removeBtn}>
            Remover
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
      </div>
    </div>
  )
}

const btn: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #DCE3E7',
  borderRadius: 9,
  fontWeight: 700,
  fontSize: 13.5,
  padding: '9px 14px',
  cursor: 'pointer',
  color: colors.ink,
}
const removeBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#B33A2B',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
}
