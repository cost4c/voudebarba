"""Schemas de resposta do módulo de serviços."""
from pydantic import BaseModel, Field

from model.servico_model import Servico


class ServicoResponse(BaseModel):
    """Representação de um serviço de uma barbearia."""

    id: int
    nome: str
    descricao: str
    preco: float = Field(..., description="Preço do serviço")
    duracao_min: int = Field(..., description="Duração do serviço em minutos")
    ativo: bool

    @classmethod
    def de_servico(cls, servico: Servico) -> "ServicoResponse":
        """Constrói o response a partir da entidade de domínio."""
        return cls(
            id=servico.id,
            nome=servico.nome,
            descricao=servico.descricao,
            preco=servico.preco,
            duracao_min=servico.duracao_min,
            ativo=servico.ativo,
        )
