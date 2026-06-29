"""
Rotas públicas de barbearias (API JSON) — VouDeBarba.

Sem autenticação. Expõe a vitrine pública:
- Listagem de barbearias ativas (com filtro por nome/endereço).
- Detalhe de uma barbearia (serviços ativos, barbeiros ativos, horários).
- Geração de slots de horário disponíveis para um barbeiro/serviço num dia.

A junção das entidades (barbearia + serviços + barbeiros + horários +
agendamentos) é feita aqui, na camada de rota, combinando os repositórios
de cada módulo — os repos não fazem esses JOINs entre si.
"""

# =============================================================================
# Imports
# =============================================================================

# Standard library
from datetime import datetime
from typing import Optional

# Utilities (datetime tz-aware)
from util.datetime_util import agora

# Third-party
from fastapi import APIRouter, HTTPException, Request, status

# Schemas (saída)
from dtos.responses.agendamento_response import SlotResponse
from dtos.responses.barbearia_response import (
    BarbeariaDetalheResponse,
    BarbeariaResumoResponse,
)
from dtos.responses.barbeiro_response import BarbeiroResponse
from dtos.responses.servico_response import ServicoResponse

# Repositories
from repo import (
    agendamento_repo,
    barbearia_repo,
    barbeiro_repo,
    servico_repo,
)

# Utilities
from util.api_helpers import checar_rate_limit
from util.logger_config import logger
from util.rate_limiter import DynamicRateLimiter

# =============================================================================
# Configuração do Router
# =============================================================================

router = APIRouter(prefix="/barbearias")

# =============================================================================
# Rate Limiters
# =============================================================================

barbearias_listar_limiter = DynamicRateLimiter(
    chave_max="rate_limit_barbearias_listar_max",
    chave_minutos="rate_limit_barbearias_listar_minutos",
    padrao_max=120,
    padrao_minutos=1,
    nome="barbearias_listar",
)
barbearias_detalhe_limiter = DynamicRateLimiter(
    chave_max="rate_limit_barbearias_detalhe_max",
    chave_minutos="rate_limit_barbearias_detalhe_minutos",
    padrao_max=120,
    padrao_minutos=1,
    nome="barbearias_detalhe",
)
barbearias_horarios_limiter = DynamicRateLimiter(
    chave_max="rate_limit_barbearias_horarios_max",
    chave_minutos="rate_limit_barbearias_horarios_minutos",
    padrao_max=180,
    padrao_minutos=1,
    nome="barbearias_horarios",
)


# =============================================================================
# Helpers
# =============================================================================

def _to_min(hhmm: str) -> int:
    """Converte "HH:MM" em minutos desde meia-noite."""
    partes = hhmm.split(":")
    return int(partes[0]) * 60 + int(partes[1])


def _to_hhmm(minutos: int) -> str:
    """Converte minutos desde meia-noite em "HH:MM"."""
    return f"{minutos // 60:02d}:{minutos % 60:02d}"


def _dia_semana_da_data(data_iso: str) -> int:
    """Dia da semana (0=Domingo .. 6=Sábado) de uma data "YYYY-MM-DD".

    ``datetime.weekday()`` retorna 0=Segunda .. 6=Domingo; convertemos para o
    padrão usado nas tabelas (0=Domingo) com ``(weekday + 1) % 7``.
    """
    d = datetime.strptime(data_iso, "%Y-%m-%d")
    return (d.weekday() + 1) % 7


# =============================================================================
# Listagem (pública)
# =============================================================================

@router.get("", response_model=list[BarbeariaResumoResponse])
async def listar(
    request: Request,
    q: Optional[str] = None,
    servico_id: Optional[int] = None,
):
    """Lista barbearias ativas.

    Filtra por nome/endereço quando ``q`` é informado e, quando ``servico_id``
    é informado, restringe às barbearias que oferecem aquele serviço (ativo).
    """
    checar_rate_limit(barbearias_listar_limiter, request)

    if servico_id is not None:
        barbearias = barbearia_repo.obter_todos_por_servico(servico_id, q or "")
    else:
        barbearias = barbearia_repo.obter_todos(q or "")

    return [BarbeariaResumoResponse.de_barbearia(b) for b in barbearias]

@router.get("/servicos", response_model=list[ServicoResponse])
async def listar_servicos(request: Request):
    """Lista serviços ativos distintos (para o filtro por serviço na home)."""
    checar_rate_limit(barbearias_listar_limiter, request)

    servicos = servico_repo.obter_servicos_distintos()
    return [ServicoResponse.de_servico(s) for s in servicos]


# =============================================================================
# Detalhe (pública)
# =============================================================================

@router.get("/{id}", response_model=BarbeariaDetalheResponse)
async def obter(
    request: Request,
    id: int,
):
    """Detalhe de uma barbearia com serviços ativos, barbeiros ativos e horários."""
    checar_rate_limit(barbearias_detalhe_limiter, request)

    barbearia = barbearia_repo.obter_por_id(id)
    if not barbearia or not barbearia.ativa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barbearia não encontrada.",
        )

    servicos = servico_repo.obter_por_barbearia(id, somente_ativos=True)
    barbeiros = barbeiro_repo.obter_por_barbearia(id, somente_ativos=True)

    return BarbeariaDetalheResponse.de_barbearia(
        barbearia,
        [ServicoResponse.de_servico(s) for s in servicos],
        [BarbeiroResponse.de_barbeiro(b) for b in barbeiros],
        barbearia.horarios,
    )


# =============================================================================
# Slots de horário (pública)
# =============================================================================

@router.get("/{id}/horarios", response_model=list[SlotResponse])
async def horarios_disponiveis(
    request: Request,
    id: int,
    barbeiro_id: int,
    servico_id: int,
    data: str,
):
    """Gera os slots de 30 min do expediente do dia, marcando os ocupados.

    Replica ``slotsFor`` do protótipo: passos de 30 min de ``hora_abertura`` a
    ``hora_fechamento`` do dia da semana da data informada; um slot fica
    ``ocupado`` quando há agendamento ativo (status != Cancelado) do MESMO
    barbeiro com início naquele horário.
    """
    checar_rate_limit(barbearias_horarios_limiter, request)

    barbearia = barbearia_repo.obter_por_id(id)
    if not barbearia or not barbearia.ativa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barbearia não encontrada.",
        )

    # Validação básica da data
    try:
        _ = datetime.strptime(data, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Data inválida. Use o formato YYYY-MM-DD.",
        )

    # Barbeiro precisa pertencer à barbearia e estar ativo
    barbeiro = barbeiro_repo.obter_por_id(barbeiro_id)
    if not barbeiro or barbeiro.barbearia_id != id or not barbeiro.ativo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barbeiro não encontrado nesta barbearia.",
        )

    # Serviço precisa pertencer à barbearia e estar ativo
    servico = servico_repo.obter_por_id(servico_id)
    if not servico or servico.barbearia_id != id or not servico.ativo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Serviço não encontrado nesta barbearia.",
        )

    # Horário de funcionamento do dia da semana da data
    dia = _dia_semana_da_data(data)
    horario_do_dia = next(
        (h for h in barbearia.horarios if h.dia_semana == dia and h.ativo),
        None,
    )
    if not horario_do_dia:
        return []

    # Horários ocupados pelo barbeiro no dia (início de cada agendamento ativo)
    ativos = agendamento_repo.obter_ativos_do_barbeiro_no_dia(barbeiro_id, data)
    ocupados: set[str] = set()
    for ag in ativos:
        if isinstance(ag.inicio, datetime):
            ocupados.add(ag.inicio.strftime("%H:%M"))

    abertura = _to_min(horario_do_dia.hora_abertura)
    fechamento = _to_min(horario_do_dia.hora_fechamento)

    # Para o dia de hoje, descarta slots cujo início já passou — não se agenda
    # em horário passado. A comparação é feita em minutos desde a meia-noite.
    agora_dt = agora()
    minimo = 0
    if data == agora_dt.strftime("%Y-%m-%d"):
        minimo = agora_dt.hour * 60 + agora_dt.minute

    slots: list[SlotResponse] = []
    m = abertura
    while m < fechamento:
        if m >= minimo:
            hora = _to_hhmm(m)
            slots.append(SlotResponse(hora=hora, ocupado=hora in ocupados))
        m += 30

    logger.debug(
        f"Slots gerados para barbearia {id} / barbeiro {barbeiro_id} em {data}: "
        f"{len(slots)} ({len(ocupados)} ocupados)"
    )
    return slots
