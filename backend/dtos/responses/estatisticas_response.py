"""Schema de resposta das estatísticas do painel do administrador."""

from pydantic import BaseModel


class EstatisticasResponse(BaseModel):
    """Contadores agregados da plataforma (espelha repo/estatisticas_repo.py)."""

    total_usuarios: int
    total_clientes: int
    total_donos_barbearia: int
    total_admins: int
    total_barbearias: int
    total_barbearias_ativas: int
    total_barbeiros: int
    total_servicos: int
    total_agendamentos: int
    agendamentos_agendados: int
    agendamentos_realizados: int
    agendamentos_cancelados: int


class AgendamentoPorDiaResponse(BaseModel):
    """Ponto da série temporal de agendamentos por dia."""

    data: str  # "YYYY-MM-DD"
    total: int
