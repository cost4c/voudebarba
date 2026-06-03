"""DTOs da entidade Serviço."""

from pydantic import BaseModel, Field, field_validator

from dtos.validators import validar_string_obrigatoria


class CriarServicoDTO(BaseModel):
    """DTO para criação de Serviço."""

    nome: str = Field(..., description="Nome do serviço")

    _validar_nome = field_validator("nome")(
        validar_string_obrigatoria(nome_campo="Nome", tamanho_minimo=3, tamanho_maximo=200)
    )


class AlterarServicoDTO(CriarServicoDTO):
    """DTO para alteração de Serviço — mesmos campos da criação."""
    pass
