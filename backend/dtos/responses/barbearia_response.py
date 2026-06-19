"""Schemas de resposta do módulo de barbearia (público e área do dono)."""
from typing import Optional

from pydantic import BaseModel, Field

from model.barbearia_model import Barbearia, HorarioFuncionamento
from dtos.responses.servico_response import ServicoResponse
from dtos.responses.barbeiro_response import BarbeiroResponse


class HorarioResponse(BaseModel):
    """Horário de funcionamento de um dia da semana."""

    dia_semana: int = Field(..., description="0=Domingo .. 6=Sábado")
    ativo: bool
    hora_abertura: str = Field(..., description='Hora de abertura "HH:MM"')
    hora_fechamento: str = Field(..., description='Hora de fechamento "HH:MM"')

    @classmethod
    def de_horario(cls, horario: HorarioFuncionamento) -> "HorarioResponse":
        return cls(
            dia_semana=horario.dia_semana,
            ativo=horario.ativo,
            hora_abertura=horario.hora_abertura,
            hora_fechamento=horario.hora_fechamento,
        )


class BarbeariaResumoResponse(BaseModel):
    """Representação resumida de uma barbearia (listagem pública)."""

    id: int
    nome: str
    descricao: str
    endereco_texto: str
    telefone: str
    foto_url: Optional[str] = None
    total_servicos: int = 0
    total_barbeiros: int = 0

    @classmethod
    def de_barbearia(cls, barbearia: Barbearia) -> "BarbeariaResumoResponse":
        return cls(
            id=barbearia.id,
            nome=barbearia.nome,
            descricao=barbearia.descricao,
            endereco_texto=barbearia.endereco_texto,
            telefone=barbearia.telefone,
            foto_url=barbearia.foto_url,
            total_servicos=barbearia.total_servicos,
            total_barbeiros=barbearia.total_barbeiros,
        )


class BarbeariaAdminResponse(BaseModel):
    """Representação de barbearia para a área administrativa (com dados do dono)."""

    id: int
    nome: str
    descricao: str
    telefone: str
    endereco_texto: str
    ativa: bool
    dono_id: int
    dono_nome: Optional[str] = None
    dono_email: Optional[str] = None
    total_servicos: int = 0
    total_barbeiros: int = 0

    @classmethod
    def de_barbearia(cls, barbearia: Barbearia) -> "BarbeariaAdminResponse":
        return cls(
            id=barbearia.id,
            nome=barbearia.nome,
            descricao=barbearia.descricao,
            telefone=barbearia.telefone,
            endereco_texto=barbearia.endereco_texto,
            ativa=barbearia.ativa,
            dono_id=barbearia.dono_id,
            dono_nome=barbearia.dono_nome,
            dono_email=barbearia.dono_email,
            total_servicos=barbearia.total_servicos,
            total_barbeiros=barbearia.total_barbeiros,
        )


class BarbeariaDetalheResponse(BaseModel):
    """Detalhe completo de uma barbearia (resumo + serviços/barbeiros/horários)."""

    id: int
    nome: str
    descricao: str
    endereco_texto: str
    telefone: str
    foto_url: Optional[str] = None
    total_servicos: int = 0
    total_barbeiros: int = 0
    servicos: list[ServicoResponse] = Field(default_factory=list)
    barbeiros: list[BarbeiroResponse] = Field(default_factory=list)
    horarios: list[HorarioResponse] = Field(default_factory=list)

    @classmethod
    def de_barbearia(
        cls,
        barbearia: Barbearia,
        servicos: list[ServicoResponse],
        barbeiros: list[BarbeiroResponse],
        horarios: list[HorarioFuncionamento],
    ) -> "BarbeariaDetalheResponse":
        """Constrói o detalhe a partir da barbearia e das listas já montadas.

        ``servicos`` e ``barbeiros`` já chegam como Response DTOs (montados na
        rota a partir dos respectivos repos); ``horarios`` chega como entidades
        de domínio e é convertido aqui.
        """
        return cls(
            id=barbearia.id,
            nome=barbearia.nome,
            descricao=barbearia.descricao,
            endereco_texto=barbearia.endereco_texto,
            telefone=barbearia.telefone,
            foto_url=barbearia.foto_url,
            total_servicos=barbearia.total_servicos,
            total_barbeiros=barbearia.total_barbeiros,
            servicos=servicos,
            barbeiros=barbeiros,
            horarios=[HorarioResponse.de_horario(h) for h in horarios],
        )
