"""Schema de resposta do relatório de ocupação de barbeiros."""

from pydantic import BaseModel, Field


class OcupacaoResponse(BaseModel):
    """Ocupação de um barbeiro num dia (espelha repo/relatorio_repo.py)."""

    barbeiro_id: int
    barbeiro_nome: str
    minutos_ocupados: int = Field(..., description="Soma da duração dos agendamentos ativos")
    minutos_disponiveis: int = Field(..., description="Minutos de expediente no dia")
    percentual: int = Field(..., description="Ocupação em % (0..100)")