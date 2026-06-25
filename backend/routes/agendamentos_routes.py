"""
Rotas de agendamentos do cliente (API JSON) — VouDeBarba.

Requer autenticação. O cliente logado:
- Cria um agendamento (com checagem de conflito do barbeiro).
- Lista os próprios agendamentos.
- Cancela um agendamento próprio (apenas se ainda Agendado).

O ``fim`` do agendamento é calculado a partir da duração do serviço. A
detecção de conflito reusa ``agendamento_repo.ha_conflito`` (sobreposição de
intervalos com agendamentos ativos do mesmo barbeiro no dia).
"""

# =============================================================================
# Imports
# =============================================================================

# Standard library
from datetime import datetime, timedelta
from typing import Optional

# Third-party
from fastapi import APIRouter, HTTPException, Request, status

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

# Utilities
from util.api_helpers import checar_rate_limit
from util.config import APP_TIMEZONE
from util.datetime_util import agora
from util.auth_decorator import requer_autenticacao
from util.logger_config import logger
from util.rate_limiter import DynamicRateLimiter

# =============================================================================
# Configuração do Router
# =============================================================================

router = APIRouter(prefix="/agendamentos")

# =============================================================================
# Rate Limiters
# =============================================================================

agendamento_criar_limiter = DynamicRateLimiter(
    chave_max="rate_limit_agendamento_criar_max",
    chave_minutos="rate_limit_agendamento_criar_minutos",
    padrao_max=10,
    padrao_minutos=10,
    nome="agendamento_criar",
)
agendamento_cancelar_limiter = DynamicRateLimiter(
    chave_max="rate_limit_agendamento_cancelar_max",
    chave_minutos="rate_limit_agendamento_cancelar_minutos",
    padrao_max=20,
    padrao_minutos=10,
    nome="agendamento_cancelar",
)
agendamento_avaliar_limiter = DynamicRateLimiter(
    chave_max="rate_limit_agendamento_avaliar_max",
    chave_minutos="rate_limit_agendamento_avaliar_minutos",
    padrao_max=20,
    padrao_minutos=10,
    nome="agendamento_avaliar",
)


# =============================================================================
# Helpers
# =============================================================================

def _obter_agendamento_do_cliente(
    id: int, usuario_logado: UsuarioLogado
) -> Agendamento:
    """Carrega o agendamento garantindo propriedade do cliente (404/403)."""
    agendamento = agendamento_repo.obter_por_id(id)
    if not agendamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agendamento não encontrado.",
        )
    if agendamento.cliente_id != usuario_logado.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este agendamento.",
        )
    return agendamento


# =============================================================================
# Criação
# =============================================================================

@router.post(
    "",
    response_model=AgendamentoResponse,
    status_code=status.HTTP_201_CREATED,
)
@requer_autenticacao()
async def criar(
    request: Request,
    dto: CriarAgendamentoDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Cria um agendamento para o cliente logado.

    ``fim = inicio + servico.duracao_min``. Antes de inserir, valida que o
    barbeiro não tem outro agendamento ativo sobrepondo o intervalo (409).
    """
    assert usuario_logado is not None
    checar_rate_limit(agendamento_criar_limiter, request)

    # Serviço precisa existir, estar ativo e pertencer à barbearia informada
    servico = servico_repo.obter_por_id(dto.servico_id)
    if not servico or not servico.ativo or servico.barbearia_id != dto.barbearia_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Serviço não encontrado nesta barbearia.",
        )

    # Barbeiro precisa existir, estar ativo e pertencer à barbearia informada
    barbeiro = barbeiro_repo.obter_por_id(dto.barbeiro_id)
    if not barbeiro or not barbeiro.ativo or barbeiro.barbearia_id != dto.barbearia_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barbeiro não encontrado nesta barbearia.",
        )

    # Monta o intervalo [inicio, fim)
    try:
        inicio = datetime.strptime(
            f"{dto.data} {dto.hora}", "%Y-%m-%d %H:%M"
        ).replace(tzinfo=APP_TIMEZONE)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Data ou hora inválida.",
        )
    fim = inicio + timedelta(minutes=servico.duracao_min)

    # Não permite agendar em horário já passado
    if inicio < agora():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Não é possível agendar em um horário que já passou.",
        )

    # Checagem de conflito do barbeiro no dia
    if agendamento_repo.ha_conflito(dto.barbeiro_id, dto.data, inicio, fim):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este horário não está mais disponível para o barbeiro.",
        )

    agendamento = Agendamento(
        id=0,
        barbearia_id=dto.barbearia_id,
        cliente_id=usuario_logado.id,
        barbeiro_id=dto.barbeiro_id,
        servico_id=dto.servico_id,
        inicio=inicio,
        fim=fim,
        status=StatusAgendamento.AGENDADO,
        observacao=dto.observacao,
    )
    agendamento_id = agendamento_repo.inserir(agendamento)
    if not agendamento_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar o agendamento. Tente novamente.",
        )

    logger.info(
        f"Agendamento #{agendamento_id} criado por cliente {usuario_logado.id} "
        f"(barbearia {dto.barbearia_id}, barbeiro {dto.barbeiro_id}) em "
        f"{dto.data} {dto.hora}"
    )

    criado = agendamento_repo.obter_por_id(agendamento_id)
    return AgendamentoResponse.de_agendamento(criado)


# =============================================================================
# Listagem (meus)
# =============================================================================

@router.get("/meus", response_model=list[AgendamentoResponse])
@requer_autenticacao()
async def meus(
    request: Request,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Lista os agendamentos do cliente logado (ordenados por início desc)."""
    assert usuario_logado is not None

    agendamentos = agendamento_repo.obter_por_cliente(usuario_logado.id)
    return [AgendamentoResponse.de_agendamento(a) for a in agendamentos]


# =============================================================================
# Cancelamento
# =============================================================================

@router.patch("/{id}/cancelar", response_model=AgendamentoResponse)
@requer_autenticacao()
async def cancelar(
    request: Request,
    id: int,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Cancela um agendamento próprio (apenas se ainda Agendado)."""
    assert usuario_logado is not None
    checar_rate_limit(agendamento_cancelar_limiter, request)

    agendamento = _obter_agendamento_do_cliente(id, usuario_logado)

    if agendamento.status != StatusAgendamento.AGENDADO:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Apenas agendamentos com status Agendado podem ser cancelados.",
        )

    if not agendamento_repo.atualizar_status(id, StatusAgendamento.CANCELADO.value):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao cancelar o agendamento. Tente novamente.",
        )

    logger.info(f"Agendamento {id} cancelado pelo cliente {usuario_logado.id}")

    atualizado = agendamento_repo.obter_por_id(id)
    return AgendamentoResponse.de_agendamento(atualizado)


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