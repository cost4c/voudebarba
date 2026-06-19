"""Schema de resposta do módulo de barbeiros."""
from typing import Optional

from pydantic import BaseModel, Field

from model.barbeiro_model import Barbeiro


class BarbeiroResponse(BaseModel):
    """Representação de um barbeiro de uma barbearia."""

    id: int
    nome: str
    especialidade: str
    foto_url: Optional[str] = Field(default=None, description="URL da foto do barbeiro")
    ativo: bool

    @classmethod
    def de_barbeiro(cls, barbeiro: Barbeiro) -> "BarbeiroResponse":
        """Constrói o response a partir da entidade de domínio."""
        return cls(
            id=barbeiro.id,
            nome=barbeiro.nome,
            especialidade=barbeiro.especialidade,
            foto_url=barbeiro.foto_url,
            ativo=barbeiro.ativo,
        )
