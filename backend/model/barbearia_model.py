from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from model.servico_model import Servico
from model.barbeiro_model import Barbeiro


@dataclass
class HorarioFuncionamento:
    id: int
    barbearia_id: int
    dia_semana: int  # 0=Domingo .. 6=Sábado
    hora_abertura: str  # "HH:MM"
    hora_fechamento: str  # "HH:MM"
    ativo: bool = True


@dataclass
class Barbearia:
    id: int
    dono_id: int
    nome: str
    descricao: str
    telefone: str
    endereco_texto: str
    foto_url: Optional[str] = None
    ativa: bool = True
    criado_em: Optional[datetime] = None
    # Campos de exibição (montados na rota juntando outros repos)
    servicos: list[Servico] = field(default_factory=list)
    barbeiros: list[Barbeiro] = field(default_factory=list)
    horarios: list[HorarioFuncionamento] = field(default_factory=list)
    total_servicos: int = 0
    total_barbeiros: int = 0
    # Campos do JOIN com usuário (listagem admin)
    dono_nome: Optional[str] = None
    dono_email: Optional[str] = None
