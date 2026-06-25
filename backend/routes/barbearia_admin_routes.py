"""
Rotas da área do dono de barbearia (API JSON) — VouDeBarba.

Requer perfil ``Barbearia``. Todas as operações são escopadas à barbearia
cujo ``dono_id`` é o usuário logado (resolvida por
``_obter_barbearia_do_dono``); cada mutação valida posse antes de agir.

Cobre:
- Ver/editar os dados da própria barbearia.
- Consultar a agenda do dia (todos os barbeiros).
- Atualizar o status de um agendamento (Realizado/Cancelado).
- CRUD de serviços e barbeiros.
- Definição dos horários de funcionamento (um por dia da semana).
"""

# =============================================================================
# Imports
# =============================================================================

# Standard library
from typing import Optional

# Third-party
from fastapi import APIRouter, HTTPException, Request, Response, status
from pydantic import BaseModel, Field, field_validator

# DTOs (entrada)
from dtos.barbearia_dto import EditarBarbeariaDTO
from dtos.barbeiro_dto import BarbeiroDTO
from dtos.servico_dto import ServicoDTO

# Schemas (saída)
from dtos.responses.agendamento_response import AgendamentoResponse
from dtos.responses.barbearia_response import (
    BarbeariaDetalheResponse,
    HorarioResponse,
)
from dtos.responses.barbeiro_response import BarbeiroResponse
from dtos.responses.resumo_dia_response import ResumoDiaResponse  # <-- novo
from dtos.responses.servico_response import ServicoResponse

# Models
from model.agendamento_model import StatusAgendamento
from model.barbearia_model import Barbearia, HorarioFuncionamento
from model.barbeiro_model import Barbeiro
from model.servico_model import Servico
from model.usuario_logado_model import UsuarioLogado

# Repositories
from repo import (
    agendamento_repo,
    barbearia_repo,
    barbeiro_repo,
    servico_repo,
)

# Utilities
from util.api_helpers import checar_rate_limit
from util.auth_decorator import requer_autenticacao
from util.datetime_util import hoje
from util.logger_config import logger
from util.perfis import Perfil
from util.rate_limiter import DynamicRateLimiter

# =============================================================================
# Configuração do Router
# =============================================================================

router = APIRouter(prefix="/barbearia")

# =============================================================================
# Rate Limiters
# =============================================================================

barbearia_leitura_limiter = DynamicRateLimiter(
    chave_max="rate_limit_barbearia_leitura_max",
    chave_minutos="rate_limit_barbearia_leitura_minutos",
    padrao_max=180,
    padrao_minutos=1,
    nome="barbearia_leitura",
)
barbearia_mutacao_limiter = DynamicRateLimiter(
    chave_max="rate_limit_barbearia_mutacao_max",
    chave_minutos="rate_limit_barbearia_mutacao_minutos",
    padrao_max=60,
    padrao_minutos=10,
    nome="barbearia_mutacao",
)


# =============================================================================
# DTOs de entrada locais (sem módulo dedicado)
# =============================================================================

class AtualizarStatusAgendamentoDTO(BaseModel):
    """Body para atualização de status de um agendamento pela barbearia."""

    status: str = Field(..., description="Novo status: Realizado ou Cancelado")

    @field_validator("status")
    @classmethod
    def _validar_status(cls, v: str) -> str:
        valor = (v or "").strip()
        permitidos = {
            StatusAgendamento.REALIZADO.value,
            StatusAgendamento.CANCELADO.value,
        }
        if valor not in permitidos:
            raise ValueError(
                "Status inválido. Use 'Realizado' ou 'Cancelado'."
            )
        return valor


class HorarioDiaDTO(BaseModel):
    """Configuração de funcionamento de um dia da semana."""

    dia_semana: int = Field(..., description="0=Domingo .. 6=Sábado")
    ativo: bool = Field(default=True)
    hora_abertura: str = Field(..., description='Hora de abertura "HH:MM"')
    hora_fechamento: str = Field(..., description='Hora de fechamento "HH:MM"')

    @field_validator("dia_semana")
    @classmethod
    def _validar_dia(cls, v: int) -> int:
        if v < 0 or v > 6:
            raise ValueError("Dia da semana deve estar entre 0 (Dom) e 6 (Sáb).")
        return v

    @field_validator("hora_abertura", "hora_fechamento")
    @classmethod
    def _validar_hora(cls, v: str) -> str:
        valor = (v or "").strip()
        erro = ValueError("Hora inválida. Use o formato HH:MM.")
        partes = valor.split(":")
        if len(partes) != 2:
            raise erro
        h, m = partes
        if not (h.isdigit() and m.isdigit()) or len(h) != 2 or len(m) != 2:
            raise erro
        if int(h) > 23 or int(m) > 59:
            raise erro
        return valor


class AtualizarHorariosDTO(BaseModel):
    """Body para definição dos horários de funcionamento da barbearia."""

    dias: list[HorarioDiaDTO] = Field(default_factory=list)


# =============================================================================
# Helpers
# =============================================================================

def _obter_barbearia_do_dono(usuario_logado: UsuarioLogado) -> Barbearia:
    """Resolve a barbearia cujo ``dono_id`` é o usuário logado (404 se não houver)."""
    barbearia = barbearia_repo.obter_por_dono(usuario_logado.id)
    if not barbearia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhuma barbearia vinculada a este usuário.",
        )
    return barbearia


def _montar_detalhe(barbearia: Barbearia) -> BarbeariaDetalheResponse:
    """Monta o detalhe completo (todos os serviços/barbeiros da barbearia)."""
    servicos = servico_repo.obter_por_barbearia(barbearia.id)
    barbeiros = barbeiro_repo.obter_por_barbearia(barbearia.id)
    return BarbeariaDetalheResponse.de_barbearia(
        barbearia,
        [ServicoResponse.de_servico(s) for s in servicos],
        [BarbeiroResponse.de_barbeiro(b) for b in barbeiros],
        barbearia.horarios,
    )


# =============================================================================
# Barbearia (ver / editar)
# =============================================================================

@router.get("/minha", response_model=BarbeariaDetalheResponse)
@requer_autenticacao([Perfil.BARBEARIA.value])
async def minha(
    request: Request,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Detalhe completo da barbearia do dono logado."""
    assert usuario_logado is not None
    checar_rate_limit(barbearia_leitura_limiter, request)

    barbearia = _obter_barbearia_do_dono(usuario_logado)
    return _montar_detalhe(barbearia)


@router.put("/minha", response_model=BarbeariaDetalheResponse)
@requer_autenticacao([Perfil.BARBEARIA.value])
async def editar_minha(
    request: Request,
    dto: EditarBarbeariaDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Edita os dados da barbearia do dono logado."""
    assert usuario_logado is not None
    checar_rate_limit(barbearia_mutacao_limiter, request)

    barbearia = _obter_barbearia_do_dono(usuario_logado)
    barbearia.nome = dto.nome
    barbearia.descricao = dto.descricao
    barbearia.telefone = dto.telefone
    barbearia.endereco_texto = dto.endereco_texto

    if not barbearia_repo.atualizar(barbearia):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar a barbearia. Tente novamente.",
        )

    logger.info(
        f"Barbearia {barbearia.id} editada pelo dono {usuario_logado.id}"
    )

    atualizada = barbearia_repo.obter_por_id(barbearia.id)
    return _montar_detalhe(atualizada)


# =============================================================================
# Agenda
# =============================================================================

@router.get("/agenda", response_model=list[AgendamentoResponse])
@requer_autenticacao([Perfil.BARBEARIA.value])
async def agenda(
    request: Request,
    data: Optional[str] = None,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Lista os agendamentos da barbearia num dia (todos os barbeiros).

    Sem ``data``, usa o dia de hoje (timezone da aplicação).
    """
    assert usuario_logado is not None
    checar_rate_limit(barbearia_leitura_limiter, request)

    barbearia = _obter_barbearia_do_dono(usuario_logado)
    data_iso = data or hoje().strftime("%Y-%m-%d")

    agendamentos = agendamento_repo.obter_por_barbearia_e_dia(
        barbearia.id, data_iso
    )
    return [AgendamentoResponse.de_agendamento(a) for a in agendamentos]

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

@router.patch(
    "/agendamentos/{id}/status",
    response_model=AgendamentoResponse,
)
@requer_autenticacao([Perfil.BARBEARIA.value])
async def atualizar_status_agendamento(
    request: Request,
    id: int,
    dto: AtualizarStatusAgendamentoDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Atualiza o status de um agendamento da barbearia (Realizado/Cancelado)."""
    assert usuario_logado is not None
    checar_rate_limit(barbearia_mutacao_limiter, request)

    barbearia = _obter_barbearia_do_dono(usuario_logado)

    agendamento = agendamento_repo.obter_por_id(id)
    if not agendamento or agendamento.barbearia_id != barbearia.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agendamento não encontrado nesta barbearia.",
        )

    if not agendamento_repo.atualizar_status(id, dto.status):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar o status. Tente novamente.",
        )

    logger.info(
        f"Agendamento {id} marcado como '{dto.status}' pela barbearia "
        f"{barbearia.id} (dono {usuario_logado.id})"
    )

    atualizado = agendamento_repo.obter_por_id(id)
    return AgendamentoResponse.de_agendamento(atualizado)


# =============================================================================
# Serviços
# =============================================================================

@router.post(
    "/servicos",
    response_model=ServicoResponse,
    status_code=status.HTTP_201_CREATED,
)
@requer_autenticacao([Perfil.BARBEARIA.value])
async def criar_servico(
    request: Request,
    dto: ServicoDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Cria um serviço na barbearia do dono logado."""
    assert usuario_logado is not None
    checar_rate_limit(barbearia_mutacao_limiter, request)

    barbearia = _obter_barbearia_do_dono(usuario_logado)

    servico = Servico(
        id=0,
        barbearia_id=barbearia.id,
        nome=dto.nome,
        descricao=dto.descricao,
        preco=dto.preco,
        duracao_min=dto.duracao_min,
        ativo=True,
    )
    servico_id = servico_repo.inserir(servico)
    if not servico_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar o serviço. Tente novamente.",
        )

    logger.info(
        f"Serviço #{servico_id} criado na barbearia {barbearia.id} "
        f"(dono {usuario_logado.id})"
    )

    criado = servico_repo.obter_por_id(servico_id)
    return ServicoResponse.de_servico(criado)


@router.put("/servicos/{id}", response_model=ServicoResponse)
@requer_autenticacao([Perfil.BARBEARIA.value])
async def editar_servico(
    request: Request,
    id: int,
    dto: ServicoDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Edita um serviço da barbearia do dono logado."""
    assert usuario_logado is not None
    checar_rate_limit(barbearia_mutacao_limiter, request)

    barbearia = _obter_barbearia_do_dono(usuario_logado)

    servico = servico_repo.obter_por_id(id)
    if not servico or servico.barbearia_id != barbearia.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Serviço não encontrado nesta barbearia.",
        )

    servico.nome = dto.nome
    servico.descricao = dto.descricao
    servico.preco = dto.preco
    servico.duracao_min = dto.duracao_min

    if not servico_repo.atualizar(servico):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar o serviço. Tente novamente.",
        )

    logger.info(
        f"Serviço {id} editado na barbearia {barbearia.id} "
        f"(dono {usuario_logado.id})"
    )

    atualizado = servico_repo.obter_por_id(id)
    return ServicoResponse.de_servico(atualizado)


@router.delete("/servicos/{id}", status_code=status.HTTP_204_NO_CONTENT)
@requer_autenticacao([Perfil.BARBEARIA.value])
async def excluir_servico(
    request: Request,
    id: int,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Exclui um serviço da barbearia do dono logado."""
    assert usuario_logado is not None
    checar_rate_limit(barbearia_mutacao_limiter, request)

    barbearia = _obter_barbearia_do_dono(usuario_logado)

    servico = servico_repo.obter_por_id(id)
    if not servico or servico.barbearia_id != barbearia.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Serviço não encontrado nesta barbearia.",
        )

    servico_repo.excluir(id)
    logger.info(
        f"Serviço {id} excluído na barbearia {barbearia.id} "
        f"(dono {usuario_logado.id})"
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# =============================================================================
# Barbeiros
# =============================================================================

@router.post(
    "/barbeiros",
    response_model=BarbeiroResponse,
    status_code=status.HTTP_201_CREATED,
)
@requer_autenticacao([Perfil.BARBEARIA.value])
async def criar_barbeiro(
    request: Request,
    dto: BarbeiroDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Cria um barbeiro na barbearia do dono logado."""
    assert usuario_logado is not None
    checar_rate_limit(barbearia_mutacao_limiter, request)

    barbearia = _obter_barbearia_do_dono(usuario_logado)

    barbeiro = Barbeiro(
        id=0,
        barbearia_id=barbearia.id,
        nome=dto.nome,
        especialidade=dto.especialidade,
        foto_url=None,
        ativo=True,
    )
    barbeiro_id = barbeiro_repo.inserir(barbeiro)
    if not barbeiro_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar o barbeiro. Tente novamente.",
        )

    logger.info(
        f"Barbeiro #{barbeiro_id} criado na barbearia {barbearia.id} "
        f"(dono {usuario_logado.id})"
    )

    criado = barbeiro_repo.obter_por_id(barbeiro_id)
    return BarbeiroResponse.de_barbeiro(criado)


@router.delete("/barbeiros/{id}", status_code=status.HTTP_204_NO_CONTENT)
@requer_autenticacao([Perfil.BARBEARIA.value])
async def excluir_barbeiro(
    request: Request,
    id: int,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Exclui um barbeiro da barbearia do dono logado."""
    assert usuario_logado is not None
    checar_rate_limit(barbearia_mutacao_limiter, request)

    barbearia = _obter_barbearia_do_dono(usuario_logado)

    barbeiro = barbeiro_repo.obter_por_id(id)
    if not barbeiro or barbeiro.barbearia_id != barbearia.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barbeiro não encontrado nesta barbearia.",
        )

    barbeiro_repo.excluir(id)
    logger.info(
        f"Barbeiro {id} excluído na barbearia {barbearia.id} "
        f"(dono {usuario_logado.id})"
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# =============================================================================
# Horários de funcionamento
# =============================================================================

@router.put("/horarios", response_model=list[HorarioResponse])
@requer_autenticacao([Perfil.BARBEARIA.value])
async def atualizar_horarios(
    request: Request,
    dto: AtualizarHorariosDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Define os horários de funcionamento (um por dia da semana) da barbearia."""
    assert usuario_logado is not None
    checar_rate_limit(barbearia_mutacao_limiter, request)

    barbearia = _obter_barbearia_do_dono(usuario_logado)

    horarios = [
        HorarioFuncionamento(
            id=0,
            barbearia_id=barbearia.id,
            dia_semana=d.dia_semana,
            hora_abertura=d.hora_abertura,
            hora_fechamento=d.hora_fechamento,
            ativo=d.ativo,
        )
        for d in dto.dias
    ]
    persistidos = barbearia_repo.upsert_horarios(barbearia.id, horarios)

    logger.info(
        f"Horários da barbearia {barbearia.id} atualizados "
        f"(dono {usuario_logado.id}): {len(persistidos)} dias"
    )

    return [HorarioResponse.de_horario(h) for h in persistidos]
