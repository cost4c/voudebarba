from typing import Optional

from pydantic import BaseModel, Field

from model.avaliacao_model import Avaliacao


class AvaliacaoResponse(BaseModel):
    """Avaliação registrada por um cliente."""

    id: int
    agendamento_id: int
    barbearia_id: int
    nota: int
    comentario: Optional[str] = None

    @classmethod
    def de_avaliacao(cls, avaliacao: Avaliacao) -> "AvaliacaoResponse":
        return cls(
            id=avaliacao.id,
            agendamento_id=avaliacao.agendamento_id,
            barbearia_id=avaliacao.barbearia_id,
            nota=avaliacao.nota,
            comentario=avaliacao.comentario,
        )