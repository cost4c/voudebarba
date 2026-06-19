"""Rotas de estatísticas do painel do administrador (API JSON) — admin-only."""

from typing import Optional

from fastapi import APIRouter, Request

from dtos.responses.estatisticas_response import (
    EstatisticasResponse,
    AgendamentoPorDiaResponse,
)
from model.usuario_logado_model import UsuarioLogado
from repo import estatisticas_repo
from util.api_helpers import checar_rate_limit
from util.auth_decorator import requer_autenticacao
from util.perfis import Perfil
from util.rate_limiter import DynamicRateLimiter

router = APIRouter(prefix="/admin/estatisticas")

estatisticas_limiter = DynamicRateLimiter(
    chave_max="rate_limit_admin_estatisticas_max",
    chave_minutos="rate_limit_admin_estatisticas_minutos",
    padrao_max=30,
    padrao_minutos=1,
    nome="admin_estatisticas",
)


@router.get("", response_model=EstatisticasResponse)
@requer_autenticacao([Perfil.ADMIN.value])
async def obter(request: Request, usuario_logado: Optional[UsuarioLogado] = None):
    """Retorna os contadores agregados da plataforma para o dashboard admin."""
    assert usuario_logado is not None
    checar_rate_limit(estatisticas_limiter, request)
    return EstatisticasResponse(**estatisticas_repo.obter_estatisticas())


@router.get("/agendamentos-por-dia", response_model=list[AgendamentoPorDiaResponse])
@requer_autenticacao([Perfil.ADMIN.value])
async def agendamentos_por_dia(request: Request, usuario_logado: Optional[UsuarioLogado] = None):
    """Série temporal de total de agendamentos por dia (−15 a +15 dias)."""
    assert usuario_logado is not None
    checar_rate_limit(estatisticas_limiter, request)
    return [AgendamentoPorDiaResponse(**p) for p in estatisticas_repo.obter_agendamentos_por_dia()]
