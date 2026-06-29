import sqlite3
from typing import Optional

from model.servico_model import Servico
from sql.servico_sql import (
    CRIAR_TABELA,
    INSERIR,
    ATUALIZAR,
    OBTER_POR_BARBEARIA,
    OBTER_POR_BARBEARIA_ATIVOS,
    OBTER_POR_ID,
    OBTER_SERVICOS_DISTINTOS,
    EXCLUIR,
)
from util.db_util import obter_conexao


def _row_to_servico(row: sqlite3.Row) -> Servico:
    return Servico(
        id=row["id"],
        barbearia_id=row["barbearia_id"],
        nome=row["nome"],
        descricao=row["descricao"],
        preco=row["preco"],
        duracao_min=row["duracao_min"],
        ativo=bool(row["ativo"]),
    )


def criar_tabela() -> bool:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CRIAR_TABELA)
        return True


def inserir(servico: Servico) -> Optional[int]:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(INSERIR, (
            servico.barbearia_id,
            servico.nome,
            servico.descricao,
            servico.preco,
            servico.duracao_min,
            1 if servico.ativo else 0,
        ))
        return cursor.lastrowid


def atualizar(servico: Servico) -> bool:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(ATUALIZAR, (
            servico.nome,
            servico.descricao,
            servico.preco,
            servico.duracao_min,
            1 if servico.ativo else 0,
            servico.id,
        ))
        return cursor.rowcount > 0


def obter_por_barbearia(
    barbearia_id: int, somente_ativos: bool = False
) -> list[Servico]:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        sql = OBTER_POR_BARBEARIA_ATIVOS if somente_ativos else OBTER_POR_BARBEARIA
        cursor.execute(sql, (barbearia_id,))
        rows = cursor.fetchall()
        return [_row_to_servico(row) for row in rows]


def obter_por_id(id: int) -> Optional[Servico]:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_ID, (id,))
        row = cursor.fetchone()
        if row:
            return _row_to_servico(row)
        return None


def excluir(id: int) -> bool:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(EXCLUIR, (id,))
        return cursor.rowcount > 0

def obter_servicos_distintos() -> list[Servico]:
    """Lista serviços ativos distintos por nome (para chips de filtro público)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_SERVICOS_DISTINTOS)
        rows = cursor.fetchall()
        return [_row_to_servico(row) for row in rows]