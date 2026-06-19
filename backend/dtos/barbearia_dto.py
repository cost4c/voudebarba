from pydantic import BaseModel, Field, field_validator

from dtos.validators import (
    validar_string_obrigatoria,
    validar_telefone_br,
    validar_email,
    validar_senha_forte,
    validar_nome_pessoa,
)


class EditarBarbeariaDTO(BaseModel):
    """DTO para edição dos dados da barbearia pelo dono (perfil Barbearia)."""

    nome: str = Field(..., description="Nome da barbearia")
    descricao: str = Field(..., description="Descrição da barbearia")
    telefone: str = Field(..., description="Telefone de contato")
    endereco_texto: str = Field(..., description="Endereço em texto livre")

    _validar_nome = field_validator("nome")(
        validar_string_obrigatoria(
            nome_campo="Nome", tamanho_minimo=2, tamanho_maximo=120
        )
    )

    _validar_descricao = field_validator("descricao")(
        validar_string_obrigatoria(
            nome_campo="Descrição", tamanho_minimo=5, tamanho_maximo=1000
        )
    )

    _validar_telefone = field_validator("telefone")(
        validar_telefone_br(formatar=True)
    )

    _validar_endereco = field_validator("endereco_texto")(
        validar_string_obrigatoria(
            nome_campo="Endereço", tamanho_minimo=5, tamanho_maximo=255
        )
    )


class CriarBarbeariaAdminDTO(BaseModel):
    """DTO composto para o admin cadastrar uma barbearia: cria o usuário dono
    (perfil Barbearia) + a barbearia, numa só operação."""

    # Dados do dono (vira Usuario perfil Barbearia)
    dono_nome: str = Field(..., description="Nome do responsável/dono")
    dono_email: str = Field(..., description="E-mail de acesso do dono")
    dono_senha: str = Field(..., description="Senha de acesso do dono")
    # Dados da barbearia
    nome: str = Field(..., description="Nome da barbearia")
    descricao: str = Field(..., description="Descrição da barbearia")
    telefone: str = Field(..., description="Telefone de contato")
    endereco_texto: str = Field(..., description="Endereço em texto livre")

    _validar_dono_nome = field_validator("dono_nome")(validar_nome_pessoa())
    _validar_dono_email = field_validator("dono_email")(validar_email())
    _validar_dono_senha = field_validator("dono_senha")(validar_senha_forte())
    _validar_nome = field_validator("nome")(
        validar_string_obrigatoria(nome_campo="Nome", tamanho_minimo=2, tamanho_maximo=120)
    )
    _validar_descricao = field_validator("descricao")(
        validar_string_obrigatoria(nome_campo="Descrição", tamanho_minimo=5, tamanho_maximo=1000)
    )
    _validar_telefone = field_validator("telefone")(validar_telefone_br(formatar=True))
    _validar_endereco = field_validator("endereco_texto")(
        validar_string_obrigatoria(nome_campo="Endereço", tamanho_minimo=5, tamanho_maximo=255)
    )


class EditarBarbeariaAdminDTO(BaseModel):
    """DTO para o admin editar uma barbearia (dados da barbearia + do dono).

    Não altera perfil nem senha do dono.
    """

    nome: str = Field(..., description="Nome da barbearia")
    descricao: str = Field(..., description="Descrição da barbearia")
    telefone: str = Field(..., description="Telefone de contato")
    endereco_texto: str = Field(..., description="Endereço em texto livre")
    dono_nome: str = Field(..., description="Nome do responsável/dono")
    dono_email: str = Field(..., description="E-mail de acesso do dono")

    _validar_nome = field_validator("nome")(
        validar_string_obrigatoria(nome_campo="Nome", tamanho_minimo=2, tamanho_maximo=120)
    )
    _validar_descricao = field_validator("descricao")(
        validar_string_obrigatoria(nome_campo="Descrição", tamanho_minimo=5, tamanho_maximo=1000)
    )
    _validar_telefone = field_validator("telefone")(validar_telefone_br(formatar=True))
    _validar_endereco = field_validator("endereco_texto")(
        validar_string_obrigatoria(nome_campo="Endereço", tamanho_minimo=5, tamanho_maximo=255)
    )
    _validar_dono_nome = field_validator("dono_nome")(validar_nome_pessoa())
    _validar_dono_email = field_validator("dono_email")(validar_email())


class AtualizarStatusBarbeariaDTO(BaseModel):
    """DTO para ativar/desativar uma barbearia (admin)."""

    ativa: bool = Field(..., description="True para ativar, False para desativar")
