from typing import Optional

from pydantic import BaseModel, Field, field_validator

from dtos.validators import (
    validar_comprimento,
    validar_data,
    validar_id_positivo,
)


class CriarAgendamentoDTO(BaseModel):
    """DTO para criação de agendamento por um cliente."""

    barbearia_id: int = Field(..., description="ID da barbearia")
    barbeiro_id: int = Field(..., description="ID do barbeiro")
    servico_id: int = Field(..., description="ID do serviço")
    data: str = Field(..., description="Data do agendamento (YYYY-MM-DD)")
    hora: str = Field(..., description="Hora do agendamento (HH:MM)")
    observacao: Optional[str] = Field(
        default=None, description="Observação opcional do cliente"
    )

    _validar_barbearia_id = field_validator("barbearia_id")(
        validar_id_positivo("Barbearia")
    )

    _validar_barbeiro_id = field_validator("barbeiro_id")(
        validar_id_positivo("Barbeiro")
    )

    _validar_servico_id = field_validator("servico_id")(
        validar_id_positivo("Serviço")
    )

    _validar_data = field_validator("data")(validar_data(formato="%Y-%m-%d"))

    _validar_observacao = field_validator("observacao")(
        validar_comprimento(tamanho_maximo=500)
    )

    @field_validator("hora")
    @classmethod
    def _validar_hora(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Hora é obrigatória.")
        valor = v.strip()
        partes = valor.split(":")
        erro = ValueError("Hora inválida. Use o formato: HH:MM.")
        if len(partes) != 2:
            raise erro
        horas_str, minutos_str = partes
        if not (horas_str.isdigit() and minutos_str.isdigit()):
            raise erro
        if len(horas_str) != 2 or len(minutos_str) != 2:
            raise erro
        horas = int(horas_str)
        minutos = int(minutos_str)
        if horas < 0 or horas > 23 or minutos < 0 or minutos > 59:
            raise erro
        return valor
