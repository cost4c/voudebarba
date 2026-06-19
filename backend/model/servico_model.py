from dataclasses import dataclass


@dataclass
class Servico:
    id: int
    barbearia_id: int
    nome: str
    descricao: str
    preco: float
    duracao_min: int
    ativo: bool = True
