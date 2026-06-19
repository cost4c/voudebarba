# Convenções do Frontend (LEIA ANTES DE EDITAR QUALQUER PÁGINA)

Stack: **React 19 + React Router 7 + Zod + Zustand + TypeScript + Vite**. **UI própria,
sem Bootstrap**: estilo via inline styles + tokens de `src/lib/theme.ts` (`colors`/`fonts`).
Visual replica o protótipo em `design/react-app/` (fonte da verdade).

A infraestrutura (api, tipos, stores, componentes, layouts, router) **já existe**.
Você só implementa páginas em `src/pages/**`. **NÃO** edite o router, os layouts nem a
infra, salvo instrução explícita. Use SEMPRE o que já existe — não recrie helpers.

## Cliente HTTP — `src/lib/api.ts`

```ts
import { api, ApiError } from '@/lib/api' // (ou caminho relativo)
const barbearias = await api.get<BarbeariaResumo[]>('/barbearias')
await api.post<Agendamento>('/agendamentos', { barbearia_id, servico_id, barbeiro_id, inicio })
await api.put<Usuario>('/usuario/perfil', { nome, email })
await api.patch(`/agendamentos/${id}/cancelar`)
await api.delete(`/admin/usuarios/${id}`)
```

- Caminhos são **relativos a `/api`** (não inclua o prefixo `/api`).
- `credentials: include` e header **`X-CSRF-Token`** são automáticos. Não se preocupe com CSRF.
- Query string: `api.get('/admin/usuarios', { params: { pagina, perfil, q } })`.
- Erros lançam `ApiError` com `.status`, `.type`, `.message` (detail), `.errors` (por campo),
  `.retryAfter`. Para erro de validação (422): `err.errors?.campo?.[0]` ou `err.campo('campo')`.

## Tipos — `src/lib/types.ts`

Todos os shapes de resposta já estão lá: `Usuario`, `BarbeariaResumo`, `BarbeariaDetalhe`,
`BarbeariaAdmin`, `Servico`, `Barbeiro`, `Horario`, `Slot`, `Agendamento`, `Estatisticas`,
`AgendamentoPorDia`, `PaginaResponse<T>`, `MensagemResponse`, etc. Enums como objetos const:
`Perfil` (Administrador/Cliente/Barbearia), `StatusAgendamento` (Agendado/Realizado/Cancelado).
**Importe daqui**, não redefina.

## Estado global — `src/store/`

```ts
import { useAuthStore } from '@/store/authStore'
const usuario = useAuthStore((s) => s.usuario)        // Usuario | null
const isAdmin = useAuthStore((s) => s.isAdmin())
const setUsuario = useAuthStore((s) => s.setUsuario)  // após editar perfil/foto

import { toast, useUIStore } from '@/store/uiStore'
toast.sucesso('Salvo!'); toast.erro('Falhou'); toast.info('...'); toast.aviso('...')
const pedirConfirmacao = useUIStore((s) => s.pedirConfirmacao)
const mostrarAlerta = useUIStore((s) => s.mostrarAlerta)
```

## Feedback ao usuário (REGRAS)

- **NUNCA** use `alert()`, `confirm()`, `prompt()` nativos.
- Notificações rápidas → `toast.sucesso/erro/aviso/info(msg)`.
- Confirmação de ação destrutiva → `pedirConfirmacao({ mensagem, tipo:'danger', onConfirmar })`.
- Aviso modal → `mostrarAlerta({ mensagem, tipo })`.

## Componentes prontos — `src/components/`

- `ui/Spinner.tsx` (default): `<Spinner texto?/>` para estados de carregamento.
- `ui/EmptyState.tsx` (default): `<EmptyState icon titulo mensagem>{children}</EmptyState>`.
- `ui/Modal.tsx`: modal genérico (inline styles). Base de `admin/UsuarioFormModal` e `admin/BarbeariaFormModal`.
- `ui/AvatarUpload.tsx`: seletor de foto circular com pré-visualização (usado na PerfilPage).
- `vdb/` (componentes do design): `ShopCard`, `PhotoPlaceholder`, `StatusBadge`, `DateChips`, `StepHeading`.
- Toasts/confirmação/alerta NÃO se importam direto — use as funções do `uiStore` (ver abaixo).
- **Não há** lib de UI (Bootstrap/MUI) nem componentes de form genéricos: campos são `<input>`/`<textarea>`
  controlados com inline styles. Replique o padrão das páginas existentes.

## Leitura de dados — `src/hooks/useFetch.ts`

```ts
import { useFetch } from '@/hooks/useFetch'
const { data, carregando, erro, recarregar } = useFetch<BarbeariaDetalhe>(
  (signal) => api.get(`/barbearias/${id}`, { signal }),
  [id],
)
```
Renderize `<Spinner/>` quando `carregando`, trate `erro`, depois use `data`.

## Formatação / datas — `src/lib/datas.ts`

Helpers puros portados do protótipo: `fmtDate(iso)`, `money(n)`, `initials(nome)`,
`isoLocal`, `addDays`, `dow`, `toMin`/`toHHMM`, constantes `DOWS`/`DOWS_FULL`/`MONS`.

## Validação de formulários — Zod

Defina o schema com Zod, valide no submit, mapeie erros para os campos. Padrão:

```ts
import { z } from 'zod'
const schema = z.object({ email: z.string().email('E-mail inválido'), senha: z.string().min(8) })
type Form = z.infer<typeof schema>
// no submit:
const parsed = schema.safeParse(form)
if (!parsed.success) { setErros(parsed.error.flatten().fieldErrors); return }
try { await api.post('/login', parsed.data) }
catch (e) { if (e instanceof ApiError && e.errors) setErros(e.errors); else toast.erro((e as Error).message) }
```
Schemas reutilizáveis já vivem em `src/lib/schemas.ts` (`senhaSchema`, `emailSchema`,
`loginSchema`, `cadastroSchema`, `esqueciSenhaSchema`, `redefinirSenhaSchema`, const
`PERFIL_CADASTRO = Perfil.CLIENTE`). Reaproveite-os antes de criar novos.

## Navegação

`import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'`.
Use `<Link to>` em vez de `<a href>`. Rotas já registradas no router (não altere).

## Visual / paridade com o protótipo

- Estilização por **inline styles** + tokens de `src/lib/theme.ts` (`colors.accent` `#FF9B51`,
  fundo `#EAEFEF`, `fonts` Archivo display + Public Sans body). **Nenhuma classe Bootstrap.**
- Reaproveite os componentes de `src/components/vdb/` (ShopCard, PhotoPlaceholder, StatusBadge,
  DateChips, StepHeading) e `src/components/ui/` (Modal, Spinner, EmptyState, Toasts) — não recrie.
- Replique títulos, textos e estrutura das telas correspondentes em `design/react-app/`
  (protótipo navegável). Leia a tela da sua área antes de implementar.

## Regras de saída

- Cada página é **default export**, nome do componente = nome do arquivo.
- TypeScript **strict** + `noUnusedLocals/Parameters`: não deixe imports/vars sem uso.
- Não use `any` implícito; tipe tudo. O build roda `tsc -b` — precisa passar.
