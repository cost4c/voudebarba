# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é

**VouDeBarba** — app de agendamento para barbearias (MVP), fork do starter kit educacional (FastAPI + SPA React). **Arquitetura SPLIT**: API REST JSON + SPA, repos separados na mesma raiz.

- `backend/` — FastAPI (Python 3.11+, SQLite **sem ORM**, SQL puro com prepared statements). Serve **apenas JSON** sob `/api` + `static/`. Em produção também serve o `index.html` do SPA buildado.
- `frontend/` — SPA React 19 + React Router 7 + TypeScript + Zod + Zustand + Vite. **UI própria** (Bootstrap REMOVIDO): tokens em `src/lib/theme.ts` (accent `#FF9B51`, fundo `#EAEFEF`), fontes Archivo (display) + Public Sans (body). As telas são portes fiéis do protótipo em `design/react-app/` (fonte da verdade visual).
- Deploy: **voudebarba.ifes.site** (porta de host **8415**). Em dev, Vite faz proxy de `/api`, `/static`, `/health` → backend (same-origin, sem CORS).
- `design/` = bundle de referência (protótipo React navegável em `react-app/` + assets/logo/screenshots). Não é runtime. `docs/` (`VouDeBarba.md` com o DER, `FORKING.md`) é apoio. `.lesson-bridge/` é **workspace externo** — **ignore-o**.

> **Esquema de portas (3 camadas)**: **8000** = porta interna do container (Uvicorn no Docker; imutável). **8415** = dev local (default do backend, alvo do proxy Vite na `:5185`) **e** porta publicada no VPS (`deploy/docker-compose.yml` mapeia `8415:8000`). ⚠️ Por isso, NÃO rode o container localmente junto do uvicorn dev (ambos disputam a 8415).

## Comandos

### Backend (rodar a partir de `backend/`)
O `.python-version` aponta para 3.14 (não instalado) — **sempre** usar o interpretador do venv:

```bash
backend/.venv/bin/python main.py                    # sobe API (porta via .env PORT; default dev 8415)
backend/.venv/bin/python -m pytest                  # todos os testes
backend/.venv/bin/python -m pytest tests/unit       # só unitários
backend/.venv/bin/python -m pytest tests/integration/test_x.py::TestClasse::test_metodo  # um teste
backend/.venv/bin/python -m pytest -m "not slow"    # markers: slow, integration, unit, auth, crud
```
Docs interativas em `/docs`. `pytest.ini` usa `asyncio_mode=auto`.

### Frontend (rodar a partir de `frontend/`)
```bash
npm run dev          # Vite dev server na porta 5185 (proxy /api -> VITE_BACKEND_URL, fallback 8415)
npm run build        # tsc -b && vite build  (saída em dist/, servida pelo backend em prod)
npm run test         # vitest run
npx tsc -b --noEmit  # typecheck isolado
npm run lint         # eslint
```

## Contrato de API — eixo central da conformidade backend↔frontend

Mudou algo de um lado, espelhe no outro. Os dois lados têm que bater **exato**.

- **Prefixo único `/api`**: backend monta todos os routers sob `API_PREFIX="/api"` (`backend/main.py`); frontend `src/lib/api.ts` usa `BASE='/api'`. Caminhos no front são **relativos a `/api`** (não incluir o prefixo).
- **Cliente HTTP central**: `frontend/src/lib/api.ts` — `credentials:'include'`, header `X-CSRF-Token` automático, classe `ApiError` (`.status`, `.type`, `.message`, `.errors`, `.retryAfter`). **Toda** chamada passa por aqui — exceto o chat SSE.
- **Contrato de erro**: `{detail, type, errors}` via handlers globais em `backend/util/exception_handlers.py`. Validação 422 → `util/validation_util.py:processar_erros_validacao_lista` chaveia erros por `loc[-1]` (último segmento; body aninhado vira chave simples). Traceback de dev fica fora do contrato.
- **Paginação**: envelope `PaginaResponse[T]` (`backend/dtos/responses/comum.py`: `items/pagina/por_pagina/total/total_paginas`) ↔ `PaginaResponse<T>` em `frontend/src/lib/types.ts`. Params `pagina`/`por_pagina`.
- **CSRF**: mutações enviam `X-CSRF-Token`; `GET /api/csrf-token` → `{token}`. Lista de paths isentos em `util/csrf_protection.py:CSRF_EXEMPT_PATHS` (resíduo do starter: `/api/pagamentos/webhook`, sem rota que o sirva neste fork).
- **Tipos espelhados**: Response DTOs em `backend/dtos/responses/*.py` ↔ tipos em `frontend/src/lib/types.ts` ↔ validação Zod em `frontend/src/lib/schemas.ts`.
- **Enums batem exato dos dois lados** (`util/perfis.py` + `model/*.py` ↔ `const` em `types.ts`): **Perfil** (Administrador / Cliente / Barbearia) e **StatusAgendamento** (Agendado / Realizado / Cancelado). São os únicos enums de domínio do fork.
- **Foto de perfil = base64** (`AtualizarFotoDTO.foto_base64` em `dtos/perfil_dto.py`; `PUT /api/usuario/foto`), validada por tamanho no cliente e no servidor — não é multipart.

## Arquitetura backend (`backend/`)

Camadas: **Routes → DTOs → Repos → SQL → DB**. `main.py` registra repos (criação de tabelas) e routers.

- **Auth**: decorator `@requer_autenticacao()` (`util/auth_decorator.py`) + dataclass `UsuarioLogado` (NUNCA dict). Sessão por cookie (`SessionMiddleware`, `SameSite=lax`).
- **Ordem dos middlewares importa** (último `add_middleware` é o mais externo): SegurançaHeaders (externo) → Session → CSRF. CSRF precisa de `request.session` já populado.
- **Perfis**: enum `Perfil` de `util/perfis.py` (fonte única; NUNCA strings literais). Enums de domínio herdam de `EnumEntidade` (`util/enum_base.py`).
- **DB datetime**: usar `agora()` de `util/datetime_util.py` ao salvar (NUNCA `.strftime()`).
- **Validação de form**: validators em `dtos/validators.py`; levantam `ValueError` → 422.
- **Rate limit**: `util/api_helpers.py:checar_rate_limit` (já emite header `Retry-After`), usado por todas as rotas, com `DynamicRateLimiter` de `util/rate_limiter.py`. Não há decorator legado `com_rate_limit`.
- **Seed admin**: `backend/data/admin_seed.json` (perfil Administrador) — útil p/ testar páginas protegidas/admin.

## Arquitetura frontend (`frontend/src/`)

UI própria do VouDeBarba (**sem Bootstrap**: inline styles + tokens de `theme.ts`). Infra de contrato (`api.ts`) **congelada** — não reescrever. `frontend/CONVENTIONS.md` documenta os padrões atuais (cliente HTTP, stores, feedback, validação Zod, visual) — leia antes de mexer em páginas.

- `lib/` — `api.ts` (cliente HTTP central, congelado), `schemas.ts` (Zod), `types.ts` (tipos+enums const do domínio), `theme.ts` (`colors`/`fonts`/`ColorToken`), `datas.ts` (helpers puros de data/moeda/iniciais portados do protótipo: `DOWS`, `isoLocal`, `addDays`, `fmtDate`, `money`, `initials`…).
- `store/` — Zustand: `authStore` (sessão/usuário; `isAdmin()`, `isCliente()`, `isBarbearia()`), `uiStore` (toast/confirmação/alerta). Feedback **sempre** via `toast.sucesso/erro/aviso/info` ou `pedirConfirmacao`/`mostrarAlerta` — **NUNCA** `alert()/confirm()/prompt()` nativos.
- `router.tsx` — `createBrowserRouter`: `RootGate` (carrega sessão via `/api/me`; 401 anônimo é esperado) → `AppLayout` (header role-aware) com rotas públicas + guardadas por `ProtectedRoute` (qualquer autenticado) / `ClienteRoute` / `BarbeariaRoute` / `AdminRoute`.
- `components/` — `routing/` (RootGate, RouteError, ProtectedRoute, ClienteRoute, BarbeariaRoute, AdminRoute), `layout/AppLayout` (header role-aware + menu de usuário), `vdb/` (componentes do design: ShopCard, PhotoPlaceholder, StatusBadge, DateChips, StepHeading), `ui/` (Toasts, Modal/ConfirmModal/AlertModal, Spinner, EmptyState, AvatarUpload), `admin/` (ListaUsuariosAdmin, UsuarioFormModal, BarbeariaFormModal, GraficosAgendamentos — usa Recharts).
- Páginas em `src/pages/*.tsx` (13): públicas HomePage, ShopDetailPage, AuthPage (`/entrar`; `/login` redireciona p/ ela), ForgotPasswordPage; PerfilPage (próprio perfil, qualquer autenticado); AppointmentsPage (Cliente, `/meus-agendamentos`); AgendaPage + ConfigPage (Barbearia); AdminDashboardPage + AdminClientesPage + AdminAdministradoresPage + AdminBarbeariasPage (Admin); NotFoundPage (`*`). Login redireciona por perfil: Admin→/admin, Barbearia→/agenda, Cliente→/.
- Alias `@` → `src/`. **Textareas controladas** NÃO populam via MCP `fill`; usar setter nativo + dispatch de `input`.

## Módulos de domínio VouDeBarba (rota backend ↔ página frontend)

Barbeiros são **cadastros da barbearia (sem login)**. Barbearia tem 1 dono (perfil Barbearia). Slots de horário são **computados server-side** (horário de funcionamento − agendamentos ativos do barbeiro). Datetimes de agendamento são gravados **tz-aware** em `APP_TIMEZONE` (naive sofre shift de −3h; ver `util/db_util.py`).

- **barbearias** (público, `/api/barbearias`): `GET ""` (lista, `?q`), `GET /{id}` (detalhe: serviços+barbeiros+horários), `GET /{id}/horarios` (slots `?barbeiro_id&servico_id&data`). Páginas: HomePage, ShopDetailPage.
- **agendamentos** (cliente, `/api/agendamentos`): `POST ""` (valida conflito → 409; `fim = inicio + duração`), `GET /meus`, `PATCH /{id}/cancelar`. Página: AppointmentsPage + fluxo do ShopDetailPage.
- **barbearia** (perfil Barbearia, `/api/barbearia`, escopado ao dono): `GET/PUT /minha`, `GET /agenda?data=`, `PATCH /agendamentos/{id}/status`, CRUD `/servicos` e `/barbeiros`, `PUT /horarios`. Páginas: AgendaPage, ConfigPage.
- **auth**: login/logout/cadastrar (cria sempre Cliente)/esqueci-senha/redefinir-senha/me/csrf-token. Página: AuthPage, ForgotPasswordPage.
- **usuario** (`/api/usuario`): `GET/PUT /perfil`, `PUT /senha`, `PUT /foto` (base64). Página: PerfilPage (dados + senha + troca de foto).
- **admin** (perfil Administrador): `admin/usuarios` (CRUD: `GET ""` paginado `?perfil&q`, `GET/POST/PUT/DELETE /{id}`) → AdminClientesPage e AdminAdministradoresPage (mesma rota filtrada por `?perfil`, via `ListaUsuariosAdmin`); `admin/barbearias` (`GET ""`, `GET/PUT /{id}`, `POST ""`, `PATCH /{id}/status` ativar/desativar) → AdminBarbeariasPage; `admin/estatisticas` (`GET ""` contadores + `GET /agendamentos-por-dia` série do gráfico — `repo/estatisticas_repo.py`) → AdminDashboardPage.
- **admin · configuração/auditoria** (perfil Administrador, `admin_configuracoes_routes.py`): `GET/PUT /admin/configuracoes` (config híbrida `.env`→DB) e `GET /admin/auditoria/logs` + `GET /admin/auditoria/registros`. **Sem página frontend** — só via API/`/docs`.

### Seed demo (dev) — `util/seed_data.py`
`carregar_barbearias_demo()` (idempotente) cria barbearias + barbeiros + serviços + agendamentos. Fonte: `backend/data/barbearias_demo.json` (embarcado na imagem Docker; primeiro candidato) ou, em dev local, `design/react-app/src/data/db.json`. Fotos em `static/uploads/{barbearias,barbeiros}/`. Logins demo (senha `1234aA@#`): `cliente@voudebarba.com` + clientes `nome.sobrenome@voudebarba.com`, e donos `dom@`/`navalha@`/`oldschool@`/`studio@voudebarba.com`. **Admin** vem de `data/admin_seed.json`: `voudebarba@ifes.site` / `Admin!123` (perfil Administrador).

> **Legado do starter kit REMOVIDO**: chamados, chat (`ChatWidget`/SSE `/chat/stream`), pagamentos (Mercado Pago/Stripe/PayPal), notificações e backups foram eliminados deste fork — não há routers, repos, models nem DTOs `.py` para eles (só restam `.pyc` órfãos no `__pycache__` e a entrada `/api/pagamentos/webhook` na lista de isenção CSRF). Não existem enums StatusChamado/PrioridadeChamado/StatusPagamento/TipoInteracao/TipoNotificacao. O que **sobrou** do starter como infra core ainda usada: `repo/configuracao_repo.py` + `util/migrar_config.py` (config híbrida `.env`→DB) com as rotas `admin/configuracoes`; `repo/auditoria_repo.py` + `util/auditoria_decorator.py` com as rotas `admin/auditoria/*` (sem página frontend).

## Convenções de commit (do usuário)

- `git add` **SELETIVO**: só os arquivos que esta sessão alterou. NUNCA `git add -A/./-u`, `git commit -a/-am`. Rodar `git status --short` e cruzar com a lista de arquivos editados antes de commitar (há múltiplos agentes paralelos no mesmo repo).
- Pedir confirmação antes de push. PR só com permissão explícita por PR. Não se identificar como Claude nos commits.
