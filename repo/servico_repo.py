"""Repositório de Serviço."""

import sqlite3
from typing import Optional

from model.servico_model import Servico
from sql.servico_sql import CRIAR_TABELA, INSERIR, OBTER_TODOS, OBTER_POR_ID, ATUALIZAR, EXCLUIR
from util.db_util import obter_conexao
from util.logger_config import logger


def _row_to_servico(row: sqlite3.Row) -> Servico:
    """Converte sqlite3.Row em dataclass Servico."""
    return Servico(
        id=row["id"],
        nome=row["nome"],
        data_criacao=row["data_criacao"],
        data_atualizacao=row["data_atualizacao"],
    )


def criar_tabela() -> bool:
    """Cria a tabela servico se não existir."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CRIAR_TABELA)
        return True


def inserir(entidade: Servico) -> Optional[int]:
    """Insere um novo serviço e retorna o ID gerado."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(INSERIR, (entidade.nome,))
        return cursor.lastrowid


def obter_todos() -> list[Servico]:
    """Retorna todos os serviços ordenados por data de criação."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_TODOS)
        return [_row_to_servico(row) for row in cursor.fetchall()]


def obter_por_id(id: int) -> Optional[Servico]:
    """Retorna um serviço pelo ID ou None se não encontrado."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_ID, (id,))
        row = cursor.fetchone()
        return _row_to_servico(row) if row else None


def atualizar(entidade: Servico) -> bool:
    """Atualiza um serviço existente. Retorna True se alterou alguma linha."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(ATUALIZAR, (entidade.nome, entidade.id))
        return cursor.rowcount > 0


def excluir(id: int) -> bool:
    """Exclui um serviço pelo ID. Retorna True se alterou alguma linha."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(EXCLUIR, (id,))
        return cursor.rowcount > 0
