from pydantic import BaseModel, Field, field_validator

from dtos.validators import validar_string_obrigatoria


class BarbeiroDTO(BaseModel):
    """DTO para criação/edição de barbeiro."""

    nome: str = Field(..., description="Nome do barbeiro")
    especialidade: str = Field(..., description="Especialidade do barbeiro")

    _validar_nome = field_validator("nome")(
        validar_string_obrigatoria(
            nome_campo="Nome", tamanho_minimo=2, tamanho_maximo=128
        )
    )

    _validar_especialidade = field_validator("especialidade")(
        validar_string_obrigatoria(
            nome_campo="Especialidade", tamanho_minimo=2, tamanho_maximo=128
        )
    )
