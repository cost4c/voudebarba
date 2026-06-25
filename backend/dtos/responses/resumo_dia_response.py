from pydantic import BaseModel, Field


class ResumoDiaResponse(BaseModel):
    """Resumo do dia da barbearia: contagens por status e faturamento."""

    data: str = Field(..., description="Data do resumo (YYYY-MM-DD)")
    total: int = 0
    agendados: int = 0
    realizados: int = 0
    cancelados: int = 0
    faturamento: float = 0.0

    @classmethod
    def de_resumo(cls, data: str, resumo: dict) -> "ResumoDiaResponse":
        return cls(
            data=data,
            total=resumo["total"],
            agendados=resumo["agendados"],
            realizados=resumo["realizados"],
            cancelados=resumo["cancelados"],
            faturamento=resumo["faturamento"],
        )