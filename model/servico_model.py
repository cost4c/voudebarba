"""Modelo da entidade Serviço."""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Servico:
    """Entidade Serviço."""

    id: int
    nome: str
    data_criacao: Optional[datetime] = None
    data_atualizacao: Optional[datetime] = None
