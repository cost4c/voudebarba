from typing import Optional

from pydantic import BaseModel, Field, field_validator

from dtos.validators import validar_comprimento


class AvaliarDTO(BaseModel):
    """DTO para o cliente avaliar um atendimento Realizado."""

    nota: int = Field(..., description="Nota de 1 a 5")
    comentario: str = Field(default="", description="Comentário (opcional)")

    @field_validator("nota")
    @classmethod
    def validar_nota(cls, v: int) -> int:
        if v is None or v < 1 or v > 5:
            raise ValueError("A nota deve estar entre 1 e 5.")
        return v

    # Comentário é opcional; só limitamos o tamanho máximo.
    _validar_comentario = field_validator("comentario")(
        validar_comprimento(tamanho_maximo=500)
    )