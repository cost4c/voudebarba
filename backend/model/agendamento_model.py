from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from util.enum_base import EnumEntidade


class StatusAgendamento(EnumEntidade):
    """
    Enum para status de agendamentos.

    Herda de EnumEntidade que fornece métodos úteis:
        - valores(): Lista todos os valores
        - existe(valor): Verifica se valor existe
        - from_valor(valor): Converte string para enum
        - validar(valor): Valida e retorna ou levanta ValueError
    """

    AGENDADO = "Agendado"
    REALIZADO = "Realizado"
    CANCELADO = "Cancelado"


@dataclass
class Agendamento:
    id: int
    barbearia_id: int
    cliente_id: int
    barbeiro_id: int
    servico_id: int
    inicio: datetime
    fim: datetime
    status: StatusAgendamento
    observacao: Optional[str] = None
    criado_em: Optional[datetime] = None
    # Campos do JOIN (para exibição)
    barbearia_nome: Optional[str] = None
    cliente_nome: Optional[str] = None
    barbeiro_nome: Optional[str] = None
    servico_nome: Optional[str] = None
    preco: Optional[float] = None
