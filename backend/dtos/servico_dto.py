from pydantic import BaseModel, Field, field_validator

from dtos.validators import validar_comprimento, validar_string_obrigatoria


class ServicoDTO(BaseModel):
    """DTO para criação/edição de serviço de uma barbearia."""

    nome: str = Field(..., description="Nome do serviço")
    descricao: str = Field(default="", description="Descrição do serviço (opcional)")
    preco: float = Field(..., description="Preço do serviço")
    duracao_min: int = Field(..., description="Duração do serviço em minutos")

    _validar_nome = field_validator("nome")(
        validar_string_obrigatoria(
            nome_campo="Nome", tamanho_minimo=2, tamanho_maximo=100
        )
    )

    # A tela de Configurações não coleta descrição; aceita vazia (máx. 500).
    _validar_descricao = field_validator("descricao")(
        validar_comprimento(tamanho_maximo=500)
    )

    @field_validator("preco")
    @classmethod
    def validar_preco(cls, v: float) -> float:
        if v is None or v <= 0:
            raise ValueError("Preço deve ser maior que zero.")
        return v

    @field_validator("duracao_min")
    @classmethod
    def validar_duracao_min(cls, v: int) -> int:
        if v is None or v <= 0:
            raise ValueError("Duração deve ser maior que zero.")
        return v
