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