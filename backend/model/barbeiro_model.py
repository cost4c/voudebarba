from dataclasses import dataclass
from typing import Optional


@dataclass
class Barbeiro:
    id: int
    barbearia_id: int
    nome: str
    especialidade: str
    foto_url: Optional[str] = None
    ativo: bool = True
