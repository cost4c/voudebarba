"""
Utilitário de Paginação Genérica.

Fornece a função `paginar` para paginar listas em memória.

Uso básico (lista em memória):
    from util.paginacao_util import paginar

    todos = repo.obter_todos()
    paginacao = paginar(todos, pagina=1, por_pagina=10)

    # No template:
    # {{ paginacao.items }}  -> lista da página atual
    # {{ paginacao.total_paginas }}  -> total de páginas
"""

from dataclasses import dataclass, field
from typing import Optional

# Constante: itens por página padrão
ITENS_POR_PAGINA_PADRAO = 10


@dataclass
class Paginacao:
    """
    Resultado de uma operação de paginação.

    Campos:
        items: Lista dos itens da página atual
        total: Total de itens em todas as páginas
        pagina_atual: Número da página atual (1-based)
        por_pagina: Número de itens por página
        total_paginas: Total de páginas calculado
        tem_anterior: True se existe página anterior
        tem_proxima: True se existe próxima página
        pagina_anterior: Número da página anterior (ou None)
        proxima_pagina: Número da próxima página (ou None)
        inicio: Índice do primeiro item (para exibição "Mostrando X-Y de Z")
        fim: Índice do último item (para exibição "Mostrando X-Y de Z")
        paginas: Lista de números de página para renderizar navegação
    """

    items: list = field(default_factory=list)
    total: int = 0
    pagina_atual: int = 1
    por_pagina: int = ITENS_POR_PAGINA_PADRAO

    # Calculados automaticamente no __post_init__
    total_paginas: int = 0
    tem_anterior: bool = False
    tem_proxima: bool = False
    pagina_anterior: Optional[int] = None
    proxima_pagina: Optional[int] = None
    inicio: int = 0
    fim: int = 0
    paginas: list = field(default_factory=list)

    def __post_init__(self):
        if self.por_pagina <= 0:
            self.por_pagina = ITENS_POR_PAGINA_PADRAO

        self.total_paginas = max(1, (self.total + self.por_pagina - 1) // self.por_pagina)
        self.tem_anterior = self.pagina_atual > 1
        self.tem_proxima = self.pagina_atual < self.total_paginas
        self.pagina_anterior = self.pagina_atual - 1 if self.tem_anterior else None
        self.proxima_pagina = self.pagina_atual + 1 if self.tem_proxima else None

        # Índices para "Mostrando X-Y de Z"
        self.inicio = (self.pagina_atual - 1) * self.por_pagina + 1 if self.total > 0 else 0
        self.fim = min(self.pagina_atual * self.por_pagina, self.total)

        # Gerar lista de páginas visíveis (máx 7 botões)
        self.paginas = _calcular_paginas_visiveis(self.pagina_atual, self.total_paginas)


def _calcular_paginas_visiveis(pagina_atual: int, total_paginas: int, max_botoes: int = 7) -> list:
    """
    Calcula quais números de página exibir na barra de navegação.

    Retorna lista com números de página e None para reticências (...).
    Exemplo: [1, None, 4, 5, 6, None, 10]
    """
    if total_paginas <= max_botoes:
        return list(range(1, total_paginas + 1))

    paginas = []
    metade = max_botoes // 2

    # Sempre mostrar primeira e última página
    inicio = max(2, pagina_atual - metade)
    fim = min(total_paginas - 1, pagina_atual + metade)

    # Ajustar janela se estiver perto das bordas
    if pagina_atual - metade <= 1:
        fim = max_botoes - 2
    if pagina_atual + metade >= total_paginas:
        inicio = total_paginas - max_botoes + 3

    paginas.append(1)
    if inicio > 2:
        paginas.append(None)  # Reticências
    for p in range(inicio, fim + 1):
        paginas.append(p)
    if fim < total_paginas - 1:
        paginas.append(None)  # Reticências
    paginas.append(total_paginas)

    return paginas


def paginar(lista: list, pagina: int = 1, por_pagina: int = ITENS_POR_PAGINA_PADRAO) -> Paginacao:
    """
    Pagina uma lista em memória.

    Args:
        lista: Lista completa de itens
        pagina: Número da página desejada (1-based)
        por_pagina: Quantidade de itens por página

    Returns:
        Objeto Paginacao com items da página e metadados

    Exemplo:
        todos = repo.obter_todos()
        paginacao = paginar(todos, pagina=2, por_pagina=10)
        # paginacao.items -> itens 11-20
        # paginacao.total -> len(todos)
    """
    if por_pagina <= 0:
        por_pagina = ITENS_POR_PAGINA_PADRAO

    total = len(lista)
    total_paginas = max(1, (total + por_pagina - 1) // por_pagina)

    # Garantir página válida
    pagina = max(1, min(pagina, total_paginas))

    inicio = (pagina - 1) * por_pagina
    fim = inicio + por_pagina
    items = lista[inicio:fim]

    return Paginacao(
        items=items,
        total=total,
        pagina_atual=pagina,
        por_pagina=por_pagina,
    )
