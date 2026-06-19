"""Schemas de resposta do módulo de agendamentos."""
from typing import Optional

from pydantic import BaseModel, Field

from model.agendamento_model import Agendamento
from util.foto_util import obter_caminho_foto_usuario


class SlotResponse(BaseModel):
    """Slot de 30 minutos dentro do expediente, com marcação de ocupação."""

    hora: str = Field(..., description='Hora do slot "HH:MM"')
    ocupado: bool = Field(..., description="True se já há agendamento ativo no horário")


class AgendamentoResponse(BaseModel):
    """Representação de um agendamento."""

    id: int
    barbearia_id: int
    barbearia_nome: Optional[str] = None
    cliente_id: int
    cliente_nome: Optional[str] = None
    cliente_foto_url: Optional[str] = None
    barbeiro_id: int
    barbeiro_nome: Optional[str] = None
    servico_id: int
    servico_nome: Optional[str] = None
    preco: float = 0.0
    inicio: str = Field(..., description="Início no formato ISO 8601")
    fim: str = Field(..., description="Fim no formato ISO 8601")
    data: str = Field(..., description="Data do agendamento (YYYY-MM-DD)")
    hora: str = Field(..., description="Hora de início (HH:MM)")
    status: str = Field(..., description="Status atual do agendamento")
    observacao: Optional[str] = None

    @classmethod
    def de_agendamento(cls, agendamento: Agendamento) -> "AgendamentoResponse":
        """Constrói o response a partir da entidade de domínio.

        ``data`` e ``hora`` são derivados de ``inicio`` (já no timezone da
        aplicação, conforme conversor de TIMESTAMP do banco).
        """
        inicio = agendamento.inicio
        fim = agendamento.fim

        return cls(
            id=agendamento.id,
            barbearia_id=agendamento.barbearia_id,
            barbearia_nome=agendamento.barbearia_nome,
            cliente_id=agendamento.cliente_id,
            cliente_nome=agendamento.cliente_nome,
            cliente_foto_url=obter_caminho_foto_usuario(agendamento.cliente_id),
            barbeiro_id=agendamento.barbeiro_id,
            barbeiro_nome=agendamento.barbeiro_nome,
            servico_id=agendamento.servico_id,
            servico_nome=agendamento.servico_nome,
            preco=agendamento.preco if agendamento.preco is not None else 0.0,
            inicio=inicio.isoformat(),
            fim=fim.isoformat(),
            data=inicio.strftime("%Y-%m-%d"),
            hora=inicio.strftime("%H:%M"),
            status=agendamento.status.value,
            observacao=agendamento.observacao,
        )
