# Tutorial passo a passo — Avaliação do atendimento + Faturamento do dia

> Público: aluno de graduação com **muita** dificuldade. Aqui não pulamos nada.
> Se você seguir cada passo **ao pé da letra**, no fim a feature funciona.
> Leia devagar. Não tenha pressa. Copie os trechos exatamente como estão.

---

## 1. O que você vai construir

Você vai implementar **duas features** no app **VouDeBarba**, cada uma indo do banco de dados até a tela (isso se chama "full-stack", ou "ponta a ponta"):

- **(A) Avaliação do atendimento pelo cliente.** Depois que um agendamento vira **Realizado**, o cliente poderá dar uma **nota de 1 a 5** e um **comentário** para aquele atendimento. A barbearia passa a exibir a **média das notas** na sua página de detalhe.
- **(B) Faturamento do dia.** O dono da barbearia verá, no topo da sua agenda, um **resumo do dia**: quantos agendamentos estão Agendados / Realizados / Cancelados e o **total faturado** (soma do preço dos serviços dos agendamentos Realizados naquele dia).

Resultado final, em lista:

- [ ] Uma tabela nova `avaliacao` criada automaticamente quando o backend sobe.
- [ ] Endpoint `POST /api/agendamentos/{id}/avaliar` que registra a nota do cliente.
- [ ] A média de avaliações aparecendo no `GET /api/barbearias/{id}` (detalhe da barbearia).
- [ ] Um botão **Avaliar** nos cartões de atendimentos **Realizados** da tela "Meus agendamentos".
- [ ] A média (ex.: "⭐ 4,7") aparecendo na tela de detalhe da barbearia.
- [ ] Endpoint `GET /api/barbearia/agenda/resumo?data=YYYY-MM-DD` que devolve as contagens por status e o total faturado.
- [ ] Um card de **Resumo do dia** no topo da tela Agenda (perfil Barbearia).

---

## 2. Pré-requisitos: rodar backend e frontend

Você precisa do app rodando para testar. São **dois processos** (dois terminais abertos ao mesmo tempo).

### 2.1. Subir o backend

O `.python-version` aponta para uma versão do Python que pode não estar instalada. **Sempre** use o interpretador que já está no `.venv`. A partir da pasta `backend/`:

```bash
backend/.venv/bin/python main.py
```

Isso sobe a API em `http://localhost:8415`. A documentação interativa (Swagger) fica em `http://localhost:8415/docs` — você vai usar bastante para testar.

> ⚠️ Não rode o container Docker local ao mesmo tempo: ambos disputam a porta 8415.

### 2.2. Subir o frontend

Em **outro terminal**, a partir da pasta `frontend/`:

```bash
npm run dev
```

Isso sobe o Vite em `http://localhost:5185`. O Vite já faz proxy de `/api` para o backend, então não há problema de CORS.

### 2.3. Logins de teste (senha demo `1234aA@#`)

- Cliente: `cliente@voudebarba.com`
- Dono de barbearia: `dom@voudebarba.com` (também `navalha@`, `oldschool@`, `studio@`)

Guarde esses logins: você precisa do **cliente** para testar a avaliação e do **dono** para testar o faturamento.

---

## 3. As camadas e a ordem de implementação

Este projeto tem camadas bem separadas. No **backend**: `Routes → DTOs → Repos → SQL → Banco`. No **frontend**: `api.ts → types.ts/schemas.ts → página → router.tsx`.

A regra de ouro é: **implemente de baixo para cima**. Primeiro o que está mais perto do banco, depois subindo até a tela. Por quê? Porque cada camada **usa** a de baixo. Se você começa pela tela, não tem o que chamar. Se começa pelo banco, quando chegar na tela tudo que ela precisa já existe e já dá para testar pelo `/docs` antes mesmo de mexer no React.

Ordem que vamos seguir:

1. **SQL** (constantes com o texto do `CREATE TABLE`, `INSERT`, `SELECT`…).
2. **Model** (a entidade `Avaliacao` como `@dataclass`).
3. **Repo** (funções que conversam com o banco).
4. **Registrar a tabela no startup** (`main.py` → lista `TABELAS`). ← passo que todo mundo esquece.
5. **DTO de entrada** (valida a nota 1–5 que o cliente envia).
6. **Response** (o formato de saída que o front recebe).
7. **Rota** (o endpoint em si).
8. **Registrar o router no startup** quando for um módulo novo (aqui reaproveitamos routers existentes, então não precisa — explico no passo certo).
9. **Frontend**: `types.ts` → `schemas.ts` → página/UI.

Faremos a **feature (A) Avaliação** inteira primeiro, depois a **(B) Faturamento**. Assim você fecha um ciclo completo antes de começar o outro.

---

# PARTE A — Avaliação do atendimento

## A.1. SQL da avaliação — ARQUIVO NOVO

**Caminho:** `backend/sql/avaliacao_sql.py`

Aqui ficam só **strings de SQL**, uma por operação. Nenhuma lógica. Note os detalhes que copiamos do padrão do projeto (veja `backend/sql/agendamento_sql.py`):

- `id INTEGER PRIMARY KEY AUTOINCREMENT`.
- `agendamento_id` é **UNIQUE**: um agendamento só pode ser avaliado **uma vez**.
- `criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP`.
- Chaves estrangeiras (`FOREIGN KEY`) com `ON DELETE CASCADE`.
- Placeholders `?` (nunca f-string dentro de SQL — isso evita SQL injection).

```python
CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS avaliacao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agendamento_id INTEGER NOT NULL UNIQUE,
    barbearia_id INTEGER NOT NULL,
    nota INTEGER NOT NULL,
    comentario TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agendamento_id) REFERENCES agendamento(id) ON DELETE CASCADE,
    FOREIGN KEY (barbearia_id) REFERENCES barbearia(id) ON DELETE CASCADE
)
"""

INSERIR = """
INSERT INTO avaliacao (agendamento_id, barbearia_id, nota, comentario)
VALUES (?, ?, ?, ?)
"""

OBTER_POR_AGENDAMENTO = "SELECT * FROM avaliacao WHERE agendamento_id = ?"

# Média das notas de uma barbearia + quantas avaliações existem.
# AVG e COUNT vêm NULL/0 quando não há nenhuma avaliação ainda — tratamos isso no repo.
MEDIA_POR_BARBEARIA = """
SELECT AVG(nota) AS media, COUNT(*) AS total
FROM avaliacao
WHERE barbearia_id = ?
"""
```

**Por que `UNIQUE`?** Se o cliente tentar avaliar duas vezes o mesmo atendimento, o banco recusa. Vamos também checar isso na rota, mas a constraint é a rede de segurança final.

---

## A.2. Model da avaliação — ARQUIVO NOVO

**Caminho:** `backend/model/avaliacao_model.py`

O model é a **entidade de domínio**. No VouDeBarba é sempre um `@dataclass` simples (nunca dict). Espelha as colunas da tabela.

```python
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Avaliacao:
    id: int
    agendamento_id: int
    barbearia_id: int
    nota: int
    comentario: Optional[str] = None
    criado_em: Optional[datetime] = None
```

Repare: `id`, `agendamento_id`, `barbearia_id` e `nota` são obrigatórios; `comentario` e `criado_em` têm valor padrão (são opcionais).

---

## A.3. Repo da avaliação — ARQUIVO NOVO

**Caminho:** `backend/repo/avaliacao_repo.py`

O repo são **funções de módulo** (sem classe). Toda conexão usa `with obter_conexao() as conn:` — esse `with` já liga `foreign_keys=ON`, configura `row_factory` e dá **commit automático** ao sair. **Não** chame `commit()` na mão.

Compare com `backend/repo/servico_repo.py` para confirmar o estilo.

```python
import sqlite3
from typing import Optional

from model.avaliacao_model import Avaliacao
from sql.avaliacao_sql import (
    CRIAR_TABELA,
    INSERIR,
    MEDIA_POR_BARBEARIA,
    OBTER_POR_AGENDAMENTO,
)
from util.db_util import obter_conexao


def _row_to_avaliacao(row: sqlite3.Row) -> Avaliacao:
    return Avaliacao(
        id=row["id"],
        agendamento_id=row["agendamento_id"],
        barbearia_id=row["barbearia_id"],
        nota=row["nota"],
        comentario=row["comentario"],
        criado_em=row["criado_em"],
    )


def criar_tabela() -> bool:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CRIAR_TABELA)
        return True


def inserir(avaliacao: Avaliacao) -> Optional[int]:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(
            INSERIR,
            (
                avaliacao.agendamento_id,
                avaliacao.barbearia_id,
                avaliacao.nota,
                avaliacao.comentario,
            ),
        )
        return cursor.lastrowid


def obter_por_agendamento(agendamento_id: int) -> Optional[Avaliacao]:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_AGENDAMENTO, (agendamento_id,))
        row = cursor.fetchone()
        if row:
            return _row_to_avaliacao(row)
        return None


def media_por_barbearia(barbearia_id: int) -> tuple[float, int]:
    """Retorna (media, total). Sem avaliações, devolve (0.0, 0)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(MEDIA_POR_BARBEARIA, (barbearia_id,))
        row = cursor.fetchone()
        media = row["media"] if row and row["media"] is not None else 0.0
        total = row["total"] if row and row["total"] is not None else 0
        return (round(float(media), 2), int(total))
```

Pontos importantes:

- `inserir` retorna `cursor.lastrowid` (o id novo) — padrão do projeto.
- `obter_por_agendamento` serve para checar **se o agendamento já foi avaliado** (não deixar avaliar de novo).
- Em `media_por_barbearia`, quando não há nenhuma avaliação o `AVG` volta `None` e o `COUNT` volta `0`; por isso o tratamento com `if ... is not None`. Arredondamos a média para 2 casas.
- Os parâmetros do `execute` vão **sempre** como tupla. Tupla de um elemento precisa da vírgula: `(agendamento_id,)`.

---

## A.4. Registrar a tabela no startup — EDIÇÃO (passo crítico!)

**Caminho:** `backend/main.py`

🚨 **Este é o passo que os alunos mais erram.** Se você não registrar o repo aqui, a tabela `avaliacao` **nunca é criada** e você vai tomar um erro tipo "no such table: avaliacao".

**Edição 1 — importar o novo repo.** Procure (perto da linha 33) esta linha:

```python
from repo import barbearia_repo, barbeiro_repo, servico_repo, agendamento_repo
```

Adicione o `avaliacao_repo` a ela:

```python
from repo import barbearia_repo, barbeiro_repo, servico_repo, agendamento_repo, avaliacao_repo
```

**Edição 2 — registrar na lista `TABELAS`.** Procure (perto da linha 95) o bloco:

```python
TABELAS = [
    (usuario_repo, "usuario"),
    (configuracao_repo, "configuracao"),
    (auditoria_repo, "auditoria"),
    (barbearia_repo, "barbearia"),
    (barbeiro_repo, "barbeiro"),
    (servico_repo, "servico"),
    (agendamento_repo, "agendamento"),
]
```

Adicione a tupla da avaliação **no final** (a ordem importa por causa das chaves estrangeiras: as tabelas referenciadas — `agendamento` e `barbearia` — precisam vir **antes**):

```python
TABELAS = [
    (usuario_repo, "usuario"),
    (configuracao_repo, "configuracao"),
    (auditoria_repo, "auditoria"),
    (barbearia_repo, "barbearia"),
    (barbeiro_repo, "barbeiro"),
    (servico_repo, "servico"),
    (agendamento_repo, "agendamento"),
    (avaliacao_repo, "avaliacao"),
]
```

O loop logo abaixo (`for repo, nome in TABELAS: repo.criar_tabela()`) cria a tabela ao subir o app. **Salve, derrube o backend (Ctrl+C) e suba de novo** para a tabela ser criada.

---

## A.5. DTO de entrada — ARQUIVO NOVO

**Caminho:** `backend/dtos/avaliacao_dto.py`

O DTO valida o que **chega** do cliente. Usamos `pydantic.BaseModel` + `field_validator`. A nota tem que estar entre 1 e 5. Quando um validador levanta `ValueError`, o handler global transforma em **HTTP 422** automaticamente.

Veja `backend/dtos/servico_dto.py` como referência do estilo.

```python
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from dtos.validators import validar_comprimento


class AvaliarDTO(BaseModel):
    """DTO para o cliente avaliar um atendimento Realizado."""

    nota: int = Field(..., description="Nota de 1 a 5")
    comentario: str = Field(default="", description="Comentário (opcional)")

    @field_validator("nota")
    @classmethod
    def validar_nota(cls, v: int) -> int:
        if v is None or v < 1 or v > 5:
            raise ValueError("A nota deve estar entre 1 e 5.")
        return v

    # Comentário é opcional; só limitamos o tamanho máximo.
    _validar_comentario = field_validator("comentario")(
        validar_comprimento(tamanho_maximo=500)
    )
```

- `nota` é obrigatória (o `...` em `Field(...)` significa "sem valor padrão, obrigatório").
- `comentario` aceita vazio e no máximo 500 caracteres (reaproveitamos o validador pronto `validar_comprimento`).

---

## A.6. Response (DTO de saída) — ARQUIVO NOVO

**Caminho:** `backend/dtos/responses/avaliacao_response.py`

O Response é o formato que o **front recebe**. Tem uma classmethod-fábrica `de_avaliacao(model)` que converte a entidade. Padrão idêntico ao de `servico_response.py`.

```python
from typing import Optional

from pydantic import BaseModel, Field

from model.avaliacao_model import Avaliacao


class AvaliacaoResponse(BaseModel):
    """Avaliação registrada por um cliente."""

    id: int
    agendamento_id: int
    barbearia_id: int
    nota: int
    comentario: Optional[str] = None

    @classmethod
    def de_avaliacao(cls, avaliacao: Avaliacao) -> "AvaliacaoResponse":
        return cls(
            id=avaliacao.id,
            agendamento_id=avaliacao.agendamento_id,
            barbearia_id=avaliacao.barbearia_id,
            nota=avaliacao.nota,
            comentario=avaliacao.comentario,
        )
```

---

## A.7. Rota POST /agendamentos/{id}/avaliar — EDIÇÃO

**Caminho:** `backend/routes/agendamentos_routes.py`

Vamos **adicionar** uma rota no router que **já existe** (`/agendamentos`). Como o módulo já está registrado em `main.py` (lista `ROUTERS`), **não precisamos** registrar router novo aqui — só editar este arquivo.

**Edição 1 — imports.** No topo do arquivo, junto dos imports já existentes, adicione o DTO, o Response, o model e o repo da avaliação.

Procure este bloco de DTOs/responses/models/repos (perto das linhas 26-40):

```python
# DTOs (entrada)
from dtos.agendamento_dto import CriarAgendamentoDTO

# Schemas (saída)
from dtos.responses.agendamento_response import AgendamentoResponse

# Models
from model.agendamento_model import Agendamento, StatusAgendamento
from model.usuario_logado_model import UsuarioLogado

# Repositories
from repo import (
    agendamento_repo,
    barbeiro_repo,
    servico_repo,
)
```

Deixe assim (linhas novas marcadas com comentário):

```python
# DTOs (entrada)
from dtos.agendamento_dto import CriarAgendamentoDTO
from dtos.avaliacao_dto import AvaliarDTO  # <-- novo

# Schemas (saída)
from dtos.responses.agendamento_response import AgendamentoResponse
from dtos.responses.avaliacao_response import AvaliacaoResponse  # <-- novo

# Models
from model.agendamento_model import Agendamento, StatusAgendamento
from model.avaliacao_model import Avaliacao  # <-- novo
from model.usuario_logado_model import UsuarioLogado

# Repositories
from repo import (
    agendamento_repo,
    avaliacao_repo,  # <-- novo
    barbeiro_repo,
    servico_repo,
)
```

**Edição 2 — um rate limiter para a avaliação.** Junto dos limiters já existentes (depois de `agendamento_cancelar_limiter`, perto da linha 73), adicione:

```python
agendamento_avaliar_limiter = DynamicRateLimiter(
    chave_max="rate_limit_agendamento_avaliar_max",
    chave_minutos="rate_limit_agendamento_avaliar_minutos",
    padrao_max=20,
    padrao_minutos=10,
    nome="agendamento_avaliar",
)
```

**Edição 3 — a rota em si.** Adicione esta função **no fim do arquivo** (depois da rota `cancelar`). Repare em tudo que ela valida: posse do cliente (reaproveitando o helper `_obter_agendamento_do_cliente` que já existe), status Realizado, e se já não foi avaliado.

```python
# =============================================================================
# Avaliação
# =============================================================================

@router.post(
    "/{id}/avaliar",
    response_model=AvaliacaoResponse,
    status_code=status.HTTP_201_CREATED,
)
@requer_autenticacao()
async def avaliar(
    request: Request,
    id: int,
    dto: AvaliarDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Registra a avaliação (nota 1-5) de um atendimento Realizado do cliente."""
    assert usuario_logado is not None
    checar_rate_limit(agendamento_avaliar_limiter, request)

    # Carrega o agendamento garantindo que pertence ao cliente logado (404/403).
    agendamento = _obter_agendamento_do_cliente(id, usuario_logado)

    # Só atendimentos já Realizados podem ser avaliados.
    if agendamento.status != StatusAgendamento.REALIZADO:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Só é possível avaliar atendimentos já realizados.",
        )

    # Um agendamento só pode ser avaliado uma vez.
    if avaliacao_repo.obter_por_agendamento(id) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este atendimento já foi avaliado.",
        )

    avaliacao = Avaliacao(
        id=0,
        agendamento_id=id,
        barbearia_id=agendamento.barbearia_id,
        nota=dto.nota,
        comentario=dto.comentario or None,
    )
    avaliacao_id = avaliacao_repo.inserir(avaliacao)
    if not avaliacao_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao registrar a avaliação. Tente novamente.",
        )

    logger.info(
        f"Avaliação #{avaliacao_id} (nota {dto.nota}) registrada por cliente "
        f"{usuario_logado.id} no agendamento {id}"
    )

    criada = avaliacao_repo.obter_por_agendamento(id)
    return AvaliacaoResponse.de_avaliacao(criada)
```

Pontos importantes (são regras do projeto que se repetem em toda rota):

- `@requer_autenticacao()` sem argumentos = **qualquer usuário logado** serve (o cliente). O decorator injeta `usuario_logado` nos kwargs; por isso o parâmetro é `Optional[UsuarioLogado] = None` e o corpo começa com `assert usuario_logado is not None`.
- `checar_rate_limit(...)` é a primeira linha útil.
- `_obter_agendamento_do_cliente(id, usuario_logado)` já existe no arquivo e cuida dos erros 404 (não existe) e 403 (não é do cliente). **Reaproveite, não reescreva.**
- Sempre **re-lemos** (`obter_por_agendamento`) e devolvemos o Response após gravar.
- Nunca montamos JSON de erro à mão — usamos `HTTPException`.

> Observação: o caminho final desta rota é `POST /api/agendamentos/{id}/avaliar`. O `/api` vem do prefixo global; o `/agendamentos` vem do `APIRouter(prefix="/agendamentos")`.

---

## A.8. Incluir a média no detalhe da barbearia — EDIÇÕES

A média de avaliações precisa sair junto no `GET /api/barbearias/{id}`. Mexemos em **dois** lugares: no Response da barbearia (campo novo) e na rota que monta esse Response.

### A.8.1. Adicionar os campos no Response — EDIÇÃO

**Caminho:** `backend/dtos/responses/barbearia_response.py`

Na classe `BarbeariaDetalheResponse`, adicione dois campos novos e passe-os no `de_barbearia`.

Procure os campos da classe `BarbeariaDetalheResponse`:

```python
class BarbeariaDetalheResponse(BaseModel):
    """Detalhe completo de uma barbearia (resumo + serviços/barbeiros/horários)."""

    id: int
    nome: str
    descricao: str
    endereco_texto: str
    telefone: str
    foto_url: Optional[str] = None
    total_servicos: int = 0
    total_barbeiros: int = 0
    servicos: list[ServicoResponse] = Field(default_factory=list)
    barbeiros: list[BarbeiroResponse] = Field(default_factory=list)
    horarios: list[HorarioResponse] = Field(default_factory=list)
```

Adicione `media_avaliacoes` e `total_avaliacoes` (logo após `total_barbeiros`):

```python
    total_barbeiros: int = 0
    media_avaliacoes: float = 0.0       # <-- novo
    total_avaliacoes: int = 0            # <-- novo
    servicos: list[ServicoResponse] = Field(default_factory=list)
```

Agora atualize a fábrica `de_barbearia` para **receber** e **repassar** esses valores. A assinatura atual é:

```python
    @classmethod
    def de_barbearia(
        cls,
        barbearia: Barbearia,
        servicos: list[ServicoResponse],
        barbeiros: list[BarbeiroResponse],
        horarios: list[HorarioFuncionamento],
    ) -> "BarbeariaDetalheResponse":
```

Adicione dois parâmetros **com valor padrão** (assim a outra chamada, a da área do dono, não quebra):

```python
    @classmethod
    def de_barbearia(
        cls,
        barbearia: Barbearia,
        servicos: list[ServicoResponse],
        barbeiros: list[BarbeiroResponse],
        horarios: list[HorarioFuncionamento],
        media_avaliacoes: float = 0.0,   # <-- novo
        total_avaliacoes: int = 0,        # <-- novo
    ) -> "BarbeariaDetalheResponse":
```

E dentro do `return cls(...)`, adicione as duas linhas (logo após `total_barbeiros=...`):

```python
        return cls(
            id=barbearia.id,
            nome=barbearia.nome,
            descricao=barbearia.descricao,
            endereco_texto=barbearia.endereco_texto,
            telefone=barbearia.telefone,
            foto_url=barbearia.foto_url,
            total_servicos=barbearia.total_servicos,
            total_barbeiros=barbearia.total_barbeiros,
            media_avaliacoes=media_avaliacoes,    # <-- novo
            total_avaliacoes=total_avaliacoes,     # <-- novo
            servicos=servicos,
            barbeiros=barbeiros,
            horarios=[HorarioResponse.de_horario(h) for h in horarios],
        )
```

> Como demos **valor padrão** aos novos parâmetros, a outra chamada de `de_barbearia` (no `barbearia_admin_routes.py`, função `_montar_detalhe`) continua funcionando sem alteração. A média lá fica 0; e tudo bem, a tela do dono não usa.

### A.8.2. Calcular e passar a média na rota pública — EDIÇÃO

**Caminho:** `backend/routes/barbearias_routes.py`

**Edição 1 — importar o repo de avaliação.** Procure o bloco de repos (perto da linha 38):

```python
from repo import (
    agendamento_repo,
    barbearia_repo,
    barbeiro_repo,
    servico_repo,
)
```

Adicione `avaliacao_repo`:

```python
from repo import (
    agendamento_repo,
    avaliacao_repo,  # <-- novo
    barbearia_repo,
    barbeiro_repo,
    servico_repo,
)
```

**Edição 2 — na rota `obter` (o `GET /{id}`).** Hoje ela termina assim:

```python
    servicos = servico_repo.obter_por_barbearia(id, somente_ativos=True)
    barbeiros = barbeiro_repo.obter_por_barbearia(id, somente_ativos=True)

    return BarbeariaDetalheResponse.de_barbearia(
        barbearia,
        [ServicoResponse.de_servico(s) for s in servicos],
        [BarbeiroResponse.de_barbeiro(b) for b in barbeiros],
        barbearia.horarios,
    )
```

Calcule a média e passe-a:

```python
    servicos = servico_repo.obter_por_barbearia(id, somente_ativos=True)
    barbeiros = barbeiro_repo.obter_por_barbearia(id, somente_ativos=True)
    media, total_avaliacoes = avaliacao_repo.media_por_barbearia(id)  # <-- novo

    return BarbeariaDetalheResponse.de_barbearia(
        barbearia,
        [ServicoResponse.de_servico(s) for s in servicos],
        [BarbeiroResponse.de_barbeiro(b) for b in barbeiros],
        barbearia.horarios,
        media_avaliacoes=media,            # <-- novo
        total_avaliacoes=total_avaliacoes,  # <-- novo
    )
```

Pronto — o backend da feature (A) está completo. **Reinicie o backend** e já dá para testar no `/docs`.

---

## A.9. Frontend (A): tipos — EDIÇÕES

### A.9.1. Tipos espelhando os Responses — EDIÇÃO

**Caminho:** `frontend/src/lib/types.ts`

Os tipos do front têm que **bater exato** com os Response do backend. Faça duas edições.

**Edição 1 — adicionar os campos de média em `BarbeariaDetalhe`.** Procure:

```typescript
// Espelha backend/dtos/responses/barbearia_response.py (BarbeariaDetalheResponse)
export interface BarbeariaDetalhe extends BarbeariaResumo {
  servicos: Servico[]
  barbeiros: Barbeiro[]
  horarios: Horario[]
}
```

Deixe assim:

```typescript
export interface BarbeariaDetalhe extends BarbeariaResumo {
  media_avaliacoes: number
  total_avaliacoes: number
  servicos: Servico[]
  barbeiros: Barbeiro[]
  horarios: Horario[]
}
```

**Edição 2 — adicionar o tipo da avaliação.** Logo abaixo da interface `Agendamento` (no fim do arquivo), adicione:

```typescript
// Espelha backend/dtos/responses/avaliacao_response.py (AvaliacaoResponse)
export interface Avaliacao {
  id: number
  agendamento_id: number
  barbearia_id: number
  nota: number
  comentario: string | null
}
```

### A.9.2. Schema Zod do formulário de avaliação — EDIÇÃO

**Caminho:** `frontend/src/lib/schemas.ts`

O Zod valida o formulário **no cliente**, espelhando o DTO Pydantic do backend (validação dupla). Adicione no fim do arquivo:

```typescript
// Espelha backend/dtos/avaliacao_dto.py (AvaliarDTO)
export const avaliarSchema = z.object({
  nota: z.coerce
    .number({ message: 'Escolha uma nota' })
    .int()
    .min(1, 'A nota deve estar entre 1 e 5')
    .max(5, 'A nota deve estar entre 1 e 5'),
  comentario: z.string().max(500, 'Comentário muito longo').default(''),
})
export type AvaliarForm = z.infer<typeof avaliarSchema>
```

`z.coerce.number` converte string para número (útil porque inputs vêm como string). `min`/`max` espelham a regra 1–5 do backend.

---

## A.10. Frontend (A): botão Avaliar em "Meus agendamentos" — EDIÇÃO

**Caminho:** `frontend/src/pages/AppointmentsPage.tsx`

Vamos adicionar, nos cartões do **Histórico** (que contém os Realizados), um botão **Avaliar** que abre um modal simples para escolher a nota e enviar.

Para manter simples e seguir o padrão de feedback do projeto (toast, nunca `alert`), faremos um modal pequeno com `pedirConfirmacao` não serve aqui (precisamos de input). Então usaremos um estado local controlando qual agendamento está sendo avaliado, com um pequeno painel inline.

**Edição 1 — imports.** No topo, adicione `useState` já está importado; adicione o import do schema e do tipo Avaliacao:

Procure:

```typescript
import { api, ApiError } from '../lib/api'
import { StatusAgendamento } from '../lib/types'
import type { Agendamento } from '../lib/types'
```

Deixe assim:

```typescript
import { api, ApiError } from '../lib/api'
import { StatusAgendamento } from '../lib/types'
import type { Agendamento } from '../lib/types'
import { avaliarSchema } from '../lib/schemas'
```

**Edição 2 — estado e função de envio.** Dentro do componente `AppointmentsPage`, logo após as declarações de estado existentes (`const [appts, ...]` e `const [carregando, ...]`), adicione:

```typescript
  // Qual agendamento está sendo avaliado e a nota escolhida no momento.
  const [avaliandoId, setAvaliandoId] = useState<number | null>(null)
  const [notaSel, setNotaSel] = useState<number>(5)
  const [comentario, setComentario] = useState<string>('')
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false)

  function abrirAvaliacao(id: number) {
    setAvaliandoId(id)
    setNotaSel(5)
    setComentario('')
  }

  async function enviarAvaliacao(a: Agendamento) {
    const parsed = avaliarSchema.safeParse({ nota: notaSel, comentario })
    if (!parsed.success) {
      toast.erro(parsed.error.issues[0]?.message ?? 'Dados inválidos.')
      return
    }
    setEnviandoAvaliacao(true)
    try {
      await api.post(`/agendamentos/${a.id}/avaliar`, parsed.data)
      toast.sucesso('Avaliação enviada. Obrigado!')
      setAvaliandoId(null)
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.aviso(e.message)
      } else {
        toast.erro(e instanceof ApiError ? e.message : 'Erro ao enviar avaliação.')
      }
    } finally {
      setEnviandoAvaliacao(false)
    }
  }
```

**Edição 3 — botão + painel no cartão do histórico.** Procure, dentro do `past.map((a) => (...))`, o fechamento do cartão. Hoje ele é:

```tsx
                  <div style={{ fontSize: 13.5, color: '#6B7A84' }}>
                    {a.dateLabel} · {a.hora}
                  </div>
                  <StatusBadge status={a.status} />
                </article>
```

Substitua por (adiciona um botão **Avaliar** só nos Realizados, e o painel de avaliação inline):

```tsx
                  <div style={{ fontSize: 13.5, color: '#6B7A84' }}>
                    {a.dateLabel} · {a.hora}
                  </div>
                  <StatusBadge status={a.status} />
                  {a.status === StatusAgendamento.REALIZADO && avaliandoId !== a.id && (
                    <button
                      onClick={() => abrirAvaliacao(a.id)}
                      style={{
                        background: 'var(--accent)',
                        color: '#25343F',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: 13,
                        padding: '9px 15px',
                        borderRadius: 9,
                        cursor: 'pointer',
                      }}
                    >
                      Avaliar
                    </button>
                  )}
                  {avaliandoId === a.id && (
                    <div
                      style={{
                        flexBasis: '100%',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 10,
                        marginTop: 8,
                        paddingTop: 10,
                        borderTop: '1px solid #EEF2F3',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => setNotaSel(n)}
                            aria-label={`Nota ${n}`}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 22,
                              lineHeight: 1,
                              color: n <= notaSel ? '#FF9B51' : '#D2DCE0',
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <input
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Comentário (opcional)"
                        maxLength={500}
                        style={{
                          flex: 1,
                          minWidth: 160,
                          border: '1px solid #E3E9EC',
                          borderRadius: 9,
                          padding: '9px 12px',
                          fontSize: 14,
                        }}
                      />
                      <button
                        disabled={enviandoAvaliacao}
                        onClick={() => enviarAvaliacao(a)}
                        style={{
                          background: '#25343F',
                          color: '#fff',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: 13,
                          padding: '9px 15px',
                          borderRadius: 9,
                          cursor: enviandoAvaliacao ? 'not-allowed' : 'pointer',
                          opacity: enviandoAvaliacao ? 0.6 : 1,
                        }}
                      >
                        {enviandoAvaliacao ? 'Enviando…' : 'Enviar'}
                      </button>
                      <button
                        onClick={() => setAvaliandoId(null)}
                        style={{
                          background: '#fff',
                          border: '1px solid #E3E9EC',
                          color: '#6B7A84',
                          fontWeight: 700,
                          fontSize: 13,
                          padding: '9px 15px',
                          borderRadius: 9,
                          cursor: 'pointer',
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </article>
```

Notas:

- O botão só aparece quando `a.status === StatusAgendamento.REALIZADO`.
- As estrelas são botões; clicar numa muda `notaSel`.
- O envio usa `api.post('/agendamentos/${a.id}/avaliar', ...)` (caminho **relativo a `/api`**, sem repetir o prefixo).
- Feedback sempre via `toast`. Erro 409 (já avaliado / não Realizado) mostra aviso.
- Nada de `alert`/`confirm` nativos.

---

## A.11. Frontend (A): exibir a média no detalhe da barbearia — EDIÇÃO

**Caminho:** `frontend/src/pages/ShopDetailPage.tsx`

Vamos mostrar a média perto do nome da barbearia. Procure, dentro do cabeçalho da barbearia, a linha do nome e a descrição:

```tsx
            <h1
              style={{
                fontFamily: "'Archivo', sans-serif",
                fontWeight: 800,
                fontSize: 28,
                margin: '0 0 6px',
                letterSpacing: '-.02em',
              }}
            >
              {shop.nome}
            </h1>
            <p style={{ margin: '0 0 8px', color: '#5C6B76', fontSize: 15 }}>{shop.descricao}</p>
```

Logo **abaixo** do `<p>` da descrição, adicione o bloco da média (mostra a nota só quando há pelo menos 1 avaliação):

```tsx
            <p style={{ margin: '0 0 8px', color: '#5C6B76', fontSize: 15 }}>{shop.descricao}</p>
            {shop.total_avaliacoes > 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                  fontSize: 14,
                  color: '#25343F',
                  fontWeight: 700,
                }}
              >
                <span style={{ color: '#FF9B51' }}>★</span>
                {shop.media_avaliacoes.toFixed(1).replace('.', ',')}
                <span style={{ color: '#7B8990', fontWeight: 500 }}>
                  ({shop.total_avaliacoes}{' '}
                  {shop.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'})
                </span>
              </div>
            )}
```

- `shop.media_avaliacoes` e `shop.total_avaliacoes` vêm do tipo que ampliamos no `types.ts`.
- `.toFixed(1).replace('.', ',')` mostra "4,7" no padrão brasileiro.

A feature (A) está completa. Agora a (B).

---

# PARTE B — Faturamento do dia

## B.1. SQL do resumo do dia — EDIÇÃO

**Caminho:** `backend/sql/agendamento_sql.py`

Adicione uma constante nova **no fim** do arquivo. Ela conta os agendamentos por status e soma o preço do serviço **só** dos Realizados, num dia. Precisa de `JOIN` com `servico` para pegar o preço.

```python
RESUMO_DO_DIA = """
SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN a.status = 'Agendado'  THEN 1 ELSE 0 END) AS agendados,
    SUM(CASE WHEN a.status = 'Realizado' THEN 1 ELSE 0 END) AS realizados,
    SUM(CASE WHEN a.status = 'Cancelado' THEN 1 ELSE 0 END) AS cancelados,
    SUM(CASE WHEN a.status = 'Realizado' THEN s.preco ELSE 0 END) AS faturamento
FROM agendamento a
INNER JOIN servico s ON a.servico_id = s.id
WHERE a.barbearia_id = ? AND date(a.inicio) = ?
"""
```

Como funciona:

- `COUNT(*)` = total de agendamentos do dia.
- Cada `SUM(CASE WHEN ... THEN 1 ELSE 0 END)` conta quantos têm aquele status.
- `SUM(CASE WHEN status='Realizado' THEN s.preco ELSE 0 END)` soma o preço só dos realizados → o faturamento.
- O `INNER JOIN servico` traz o `preco` de cada agendamento.
- `date(a.inicio) = ?` filtra pelo dia (a coluna `inicio` é um TIMESTAMP; `date(...)` corta só a parte da data).

> Os valores `'Agendado'`, `'Realizado'`, `'Cancelado'` são exatamente os valores do enum `StatusAgendamento` do projeto.

---

## B.2. Função no repo de agendamento — EDIÇÃO

**Caminho:** `backend/repo/agendamento_repo.py`

**Edição 1 — importar a constante nova.** Procure o bloco de import do SQL (perto da linha 9):

```python
from sql.agendamento_sql import (
    ATUALIZAR_STATUS,
    CRIAR_TABELA,
    INSERIR,
    OBTER_ATIVOS_DO_BARBEIRO_NO_DIA,
    OBTER_POR_BARBEARIA_E_DIA,
    OBTER_POR_CLIENTE,
    OBTER_POR_ID,
)
```

Adicione `RESUMO_DO_DIA`:

```python
from sql.agendamento_sql import (
    ATUALIZAR_STATUS,
    CRIAR_TABELA,
    INSERIR,
    OBTER_ATIVOS_DO_BARBEIRO_NO_DIA,
    OBTER_POR_BARBEARIA_E_DIA,
    OBTER_POR_CLIENTE,
    OBTER_POR_ID,
    RESUMO_DO_DIA,  # <-- novo
)
```

**Edição 2 — a função.** Adicione **no fim** do arquivo:

```python
def resumo_do_dia(barbearia_id: int, data_iso: str) -> dict:
    """Resumo do dia de uma barbearia: contagens por status e faturamento.

    Retorna um dict com as chaves: total, agendados, realizados, cancelados,
    faturamento. Quando não há agendamentos, todos vêm zerados.
    """
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(RESUMO_DO_DIA, (barbearia_id, data_iso))
        row = cursor.fetchone()
        if not row:
            return {
                "total": 0,
                "agendados": 0,
                "realizados": 0,
                "cancelados": 0,
                "faturamento": 0.0,
            }
        return {
            "total": row["total"] or 0,
            "agendados": row["agendados"] or 0,
            "realizados": row["realizados"] or 0,
            "cancelados": row["cancelados"] or 0,
            "faturamento": float(row["faturamento"] or 0.0),
        }
```

O `or 0` trata o caso de o `SUM` voltar `None` (quando não há linhas casando).

---

## B.3. Response do resumo — ARQUIVO NOVO

**Caminho:** `backend/dtos/responses/resumo_dia_response.py`

```python
from pydantic import BaseModel, Field


class ResumoDiaResponse(BaseModel):
    """Resumo do dia da barbearia: contagens por status e faturamento."""

    data: str = Field(..., description="Data do resumo (YYYY-MM-DD)")
    total: int = 0
    agendados: int = 0
    realizados: int = 0
    cancelados: int = 0
    faturamento: float = 0.0

    @classmethod
    def de_resumo(cls, data: str, resumo: dict) -> "ResumoDiaResponse":
        return cls(
            data=data,
            total=resumo["total"],
            agendados=resumo["agendados"],
            realizados=resumo["realizados"],
            cancelados=resumo["cancelados"],
            faturamento=resumo["faturamento"],
        )
```

A fábrica `de_resumo` recebe a `data` e o `dict` que o repo devolveu, e monta o Response.

---

## B.4. Rota GET /barbearia/agenda/resumo — EDIÇÃO

**Caminho:** `backend/routes/barbearia_admin_routes.py`

Adicionamos a rota no router que já existe (`/barbearia`), que já está registrado em `main.py`. Não precisa registrar router novo.

**Edição 1 — importar o Response novo.** Procure o bloco de schemas de saída (perto da linha 33):

```python
# Schemas (saída)
from dtos.responses.agendamento_response import AgendamentoResponse
from dtos.responses.barbearia_response import (
    BarbeariaDetalheResponse,
    HorarioResponse,
)
from dtos.responses.barbeiro_response import BarbeiroResponse
from dtos.responses.servico_response import ServicoResponse
```

Adicione o import do `ResumoDiaResponse`:

```python
# Schemas (saída)
from dtos.responses.agendamento_response import AgendamentoResponse
from dtos.responses.barbearia_response import (
    BarbeariaDetalheResponse,
    HorarioResponse,
)
from dtos.responses.barbeiro_response import BarbeiroResponse
from dtos.responses.resumo_dia_response import ResumoDiaResponse  # <-- novo
from dtos.responses.servico_response import ServicoResponse
```

**Edição 2 — a rota.** Adicione esta função **logo após** a rota `agenda` (a `GET /agenda`, que termina perto da linha 252), antes da rota de `atualizar_status_agendamento`. Reaproveitamos o helper `_obter_barbearia_do_dono` (já existe) e o limiter de leitura (já existe).

```python
@router.get("/agenda/resumo", response_model=ResumoDiaResponse)
@requer_autenticacao([Perfil.BARBEARIA.value])
async def resumo_agenda(
    request: Request,
    data: Optional[str] = None,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Resumo do dia da barbearia do dono logado: contagens + faturamento.

    Sem ``data``, usa o dia de hoje (timezone da aplicação).
    """
    assert usuario_logado is not None
    checar_rate_limit(barbearia_leitura_limiter, request)

    barbearia = _obter_barbearia_do_dono(usuario_logado)
    data_iso = data or hoje().strftime("%Y-%m-%d")

    resumo = agendamento_repo.resumo_do_dia(barbearia.id, data_iso)
    return ResumoDiaResponse.de_resumo(data_iso, resumo)
```

Detalhes:

- `@requer_autenticacao([Perfil.BARBEARIA.value])` exige o perfil Barbearia (401 se anônimo, 403 se outro perfil).
- `_obter_barbearia_do_dono(usuario_logado)` resolve a barbearia do dono e já garante a posse (escopo). Assim, o dono só vê o resumo **da própria** barbearia.
- `hoje()` (de `util/datetime_util.py`) dá a data atual tz-aware — nunca use `datetime.now()` direto.
- Caminho final: `GET /api/barbearia/agenda/resumo?data=YYYY-MM-DD`.

> ⚠️ **Ordem de declaração importa.** Declare `/agenda/resumo` **depois** ou **antes** de `/agenda` tanto faz aqui, porque os caminhos são diferentes e o FastAPI casa por correspondência exata. Mas mantenha `/agenda/resumo` no mesmo arquivo, perto da `/agenda`, para ficar organizado.

O backend da feature (B) está pronto. **Reinicie o backend** e teste no `/docs` (lembre de estar logado como dono).

---

## B.5. Frontend (B): tipo do resumo — EDIÇÃO

**Caminho:** `frontend/src/lib/types.ts`

Adicione, junto dos outros tipos de domínio (no fim do arquivo), o tipo que espelha `ResumoDiaResponse`:

```typescript
// Espelha backend/dtos/responses/resumo_dia_response.py (ResumoDiaResponse)
export interface ResumoDia {
  data: string
  total: number
  agendados: number
  realizados: number
  cancelados: number
  faturamento: number
}
```

Não precisa de Zod aqui: este endpoint é só leitura (GET), não tem formulário para validar.

---

## B.6. Frontend (B): card de resumo na Agenda — EDIÇÃO

**Caminho:** `frontend/src/pages/AgendaPage.tsx`

Vamos buscar o resumo sempre que a data mudar e exibir um card no topo, incluindo o faturamento formatado com `money` (helper de `lib/datas.ts` — não reimplemente formatação de moeda).

**Edição 1 — imports.** Procure:

```typescript
import { isoLocal, addDays, initials } from '../lib/datas'
import { colors, fonts } from '../lib/theme'
import { StatusAgendamento } from '../lib/types'
import type { Agendamento, BarbeariaDetalhe } from '../lib/types'
```

Deixe assim (adiciona `money` e o tipo `ResumoDia`):

```typescript
import { isoLocal, addDays, initials, money } from '../lib/datas'
import { colors, fonts } from '../lib/theme'
import { StatusAgendamento } from '../lib/types'
import type { Agendamento, BarbeariaDetalhe, ResumoDia } from '../lib/types'
```

**Edição 2 — estado e busca do resumo.** Dentro do componente, junto dos estados existentes, adicione:

```typescript
  const [resumo, setResumo] = useState<ResumoDia | null>(null)
```

E adicione um `useEffect` novo que recarrega o resumo ao trocar a data (coloque logo após o `useEffect` que carrega a agenda do dia):

```typescript
  // Resumo do dia (contagens + faturamento) — recarrega ao trocar a data.
  useEffect(() => {
    let vivo = true
    api
      .get<ResumoDia>(`/barbearia/agenda/resumo?data=${date}`)
      .then((r) => {
        if (vivo) setResumo(r)
      })
      .catch(() => {
        if (vivo) setResumo(null)
      })
    return () => {
      vivo = false
    }
  }, [date])
```

**Edição 3 — o card.** Procure o `<DateChips ... />` (perto da linha 139):

```tsx
      <div style={{ marginBottom: 22 }}>
        <DateChips count={7} selected={date} onSelect={setDate} scroll width={64} />
      </div>
```

Logo **abaixo** desse `<div>`, adicione o card de resumo:

```tsx
      {resumo && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 22,
            background: '#fff',
            border: '1px solid #E3E9EC',
            borderRadius: 14,
            padding: '16px 20px',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 12, color: '#7B8990', fontWeight: 600 }}>
              Faturamento do dia
            </div>
            <div
              style={{
                fontFamily: "'Archivo', sans-serif",
                fontWeight: 800,
                fontSize: 26,
                color: '#2E6A4C',
              }}
            >
              {money(resumo.faturamento)}
            </div>
          </div>
          <ResumoItem label="Agendados" value={resumo.agendados} />
          <ResumoItem label="Realizados" value={resumo.realizados} />
          <ResumoItem label="Cancelados" value={resumo.cancelados} />
        </div>
      )}
```

**Edição 4 — o componentezinho `ResumoItem`.** Adicione no fim do arquivo, junto dos outros componentes auxiliares (`Stat`, `ClienteAvatar`):

```tsx
function ResumoItem({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 78 }}>
      <div
        style={{
          fontFamily: "'Archivo', sans-serif",
          fontWeight: 800,
          fontSize: 20,
          color: '#25343F',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: '#7B8990', fontWeight: 600 }}>{label}</div>
    </div>
  )
}
```

- `money(resumo.faturamento)` formata em reais (ex.: "R$ 120,00").
- O card só renderiza se `resumo` já carregou (`{resumo && (...)}`).

Pronto! As duas features estão completas, do banco à tela.

---

## 4. Como testar

### 4.1. Reiniciar o backend (obrigatório)

Sempre que mexer no backend, derrube (Ctrl+C) e suba de novo, a partir de `backend/`:

```bash
backend/.venv/bin/python main.py
```

Na primeira vez, confira no log a linha `Tabela 'avaliacao' criada/verificada`. Se ela **não** aparecer, você esqueceu de registrar o repo na lista `TABELAS` (volte ao passo A.4).

### 4.2. Testar pela documentação interativa (`/docs`)

Abra `http://localhost:8415/docs`. Lá dá para testar a API **sem o front**:

1. Faça login (há rota de auth no `/docs`, ou logue pela tela e use o mesmo navegador).
2. **Avaliação:** ache `POST /api/agendamentos/{id}/avaliar`. Use o `id` de um agendamento **Realizado** do cliente logado. Envie `{"nota": 5, "comentario": "Excelente"}`. Deve voltar 201. Tente de novo o mesmo id → deve voltar 409 ("já foi avaliado").
3. **Média:** chame `GET /api/barbearias/{id}` da barbearia desse agendamento. Confira `media_avaliacoes` e `total_avaliacoes` preenchidos.
4. **Resumo:** logado como **dono**, chame `GET /api/barbearia/agenda/resumo?data=YYYY-MM-DD`. Confira `total`, `agendados`, `realizados`, `cancelados`, `faturamento`.

### 4.3. Testar pela tela (front)

Com `npm run dev` rodando, abra `http://localhost:5185`.

**Avaliação (logado como cliente):**

1. Entre como `cliente@voudebarba.com`.
2. Vá em **Meus agendamentos** (`/meus-agendamentos`).
3. Na seção **Histórico**, num atendimento **Realizado**, clique **Avaliar**.
4. Escolha as estrelas, escreva um comentário (opcional) e clique **Enviar**. Deve aparecer o toast "Avaliação enviada".
5. Abra a página da barbearia (`/barbearia/:id`) e confira a média (ex.: "★ 4,7").

**Faturamento (logado como dono):**

1. Entre como `dom@voudebarba.com`.
2. Vá em **Agenda** (`/agenda`).
3. No topo, confira o card **Resumo do dia** com o faturamento e as contagens.
4. Marque um agendamento como **Concluir** (Realizado) e veja o faturamento subir ao recarregar a data (troque de dia e volte, ou recarregue a página).

### 4.4. Typecheck e testes (opcional, mas recomendado)

No frontend (a partir de `frontend/`):

```bash
npx tsc -b --noEmit   # confere se os tipos batem
npm run lint
```

No backend (a partir de `backend/`):

```bash
backend/.venv/bin/python -m pytest -m "not slow"
```

---

## 5. Erros comuns e como resolver

1. **"no such table: avaliacao"** — Você esqueceu de registrar o repo em `main.py` (passo A.4) ou não reiniciou o backend. Adicione `(avaliacao_repo, "avaliacao")` na lista `TABELAS`, importe o `avaliacao_repo` no topo, e reinicie. A tabela só é criada no startup.

2. **404 ou rota não aparece no `/docs`** — Para a feature (A), a rota foi adicionada no router `/agendamentos` que **já está** registrado; idem para (B) no `/barbearia`. Se você criou um arquivo de rotas **novo**, aí sim teria que registrá-lo em `ROUTERS` no `main.py` (não é o caso aqui). Confira também o caminho: o front usa caminho **relativo a `/api`** (ex.: `/agendamentos/1/avaliar`), nunca `/api/agendamentos/...`.

3. **403 ao enviar a avaliação (CSRF)** — Mutações (POST/PUT/PATCH/DELETE) exigem o header `X-CSRF-Token`. O `api.ts` faz isso **sozinho**. Se você chamou `fetch` direto em vez de `api.post`, o token não vai. **Sempre** use `api.*`. Se mesmo assim der 403, faça logout/login para renovar a sessão.

4. **Contrato backend/front não bate** — Se o front mostra `undefined` onde devia ter a média, confira se você adicionou `media_avaliacoes`/`total_avaliacoes` **no Response** (`barbearia_response.py`) **e** na interface `BarbeariaDetalhe` (`types.ts`). Os dois lados têm que ter os mesmos campos, com os mesmos nomes.

5. **422 ao enviar a nota** — O backend recusa nota fora de 1–5. No front, o `avaliarSchema` (Zod) também valida antes de enviar. Se você está mandando a nota como texto, use `z.coerce.number` (já está no schema) e confira que `notaSel` é número.

6. **`tsc` reclama de tipo em `ResumoDia`/`Avaliacao`** — Você usou o tipo antes de declará-lo, ou esqueceu de exportá-lo (`export interface ...`) no `types.ts`. Confira o `export` e o import na página.

7. **Faturamento sempre 0** — Só conta agendamentos **Realizados** do dia escolhido. Marque algum como concluído na própria Agenda e confira a data selecionada nos chips (o resumo é do dia selecionado, não necessariamente "hoje").

---

## 6. Checklist final

Marque cada caixa só depois de testar de verdade.

**Feature A — Avaliação (backend):**

- [ ] `backend/sql/avaliacao_sql.py` criado (CRIAR_TABELA com `agendamento_id UNIQUE`, INSERIR, OBTER_POR_AGENDAMENTO, MEDIA_POR_BARBEARIA).
- [ ] `backend/model/avaliacao_model.py` criado (`@dataclass Avaliacao`).
- [ ] `backend/repo/avaliacao_repo.py` criado (criar_tabela, inserir, obter_por_agendamento, media_por_barbearia).
- [ ] `backend/main.py`: `avaliacao_repo` importado **e** `(avaliacao_repo, "avaliacao")` em `TABELAS`.
- [ ] `backend/dtos/avaliacao_dto.py` criado (`AvaliarDTO`, nota 1–5).
- [ ] `backend/dtos/responses/avaliacao_response.py` criado.
- [ ] `backend/routes/agendamentos_routes.py`: imports + limiter + rota `POST /{id}/avaliar`.
- [ ] `backend/dtos/responses/barbearia_response.py`: campos `media_avaliacoes`/`total_avaliacoes` + parâmetros na fábrica.
- [ ] `backend/routes/barbearias_routes.py`: importa `avaliacao_repo` e passa a média na rota `obter`.

**Feature A — Avaliação (frontend):**

- [ ] `types.ts`: `BarbeariaDetalhe` com média + interface `Avaliacao`.
- [ ] `schemas.ts`: `avaliarSchema`.
- [ ] `AppointmentsPage.tsx`: botão Avaliar + painel + envio via `api.post`.
- [ ] `ShopDetailPage.tsx`: exibe a média no cabeçalho.

**Feature B — Faturamento (backend):**

- [ ] `backend/sql/agendamento_sql.py`: constante `RESUMO_DO_DIA` (COUNT por status + SUM com JOIN em servico).
- [ ] `backend/repo/agendamento_repo.py`: importa `RESUMO_DO_DIA` + função `resumo_do_dia`.
- [ ] `backend/dtos/responses/resumo_dia_response.py` criado (`ResumoDiaResponse`).
- [ ] `backend/routes/barbearia_admin_routes.py`: importa o Response + rota `GET /agenda/resumo`.

**Feature B — Faturamento (frontend):**

- [ ] `types.ts`: interface `ResumoDia`.
- [ ] `AgendaPage.tsx`: importa `money` + tipo, estado + `useEffect` do resumo, card + `ResumoItem`.

**Geral:**

- [ ] Backend reiniciado; log confirma `Tabela 'avaliacao' criada/verificada`.
- [ ] Testado no `/docs` (201 ao avaliar, 409 ao repetir, resumo correto).
- [ ] Testado na tela (avaliar como cliente, ver média, ver resumo como dono).
- [ ] `npx tsc -b --noEmit` sem erros.

Parabéns — se todas as caixas estão marcadas, a feature está funcionando ponta a ponta. 🎉
