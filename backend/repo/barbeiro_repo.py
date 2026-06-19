"""Repositório de Barbeiros (cadastro pertencente a uma barbearia)."""

import sqlite3
from typing import Optional

from model.barbeiro_model import Barbeiro
from sql.barbeiro_sql import (
    CRIAR_TABELA,
    INSERIR,
    OBTER_POR_BARBEARIA,
    OBTER_POR_BARBEARIA_ATIVOS,
    OBTER_POR_ID,
    EXCLUIR,
    DESATIVAR,
)
from util.db_util import obter_conexao
from util.logger_config import logger


def _row_to_barbeiro(row: sqlite3.Row) -> Barbeiro:
    return Barbeiro(
        id=row["id"],
        barbearia_id=row["barbearia_id"],
        nome=row["nome"],
        especialidade=row["especialidade"],
        foto_url=row["foto_url"] if "foto_url" in row.keys() else None,
        ativo=bool(row["ativo"]),
    )


def criar_tabela() -> bool:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CRIAR_TABELA)
        return True


def inserir(barbeiro: Barbeiro) -> Optional[int]:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(INSERIR, (
            barbeiro.barbearia_id,
            barbeiro.nome,
            barbeiro.especialidade,
            barbeiro.foto_url,
            1 if barbeiro.ativo else 0,
        ))
        return cursor.lastrowid


def obter_por_barbearia(
    barbearia_id: int,
    somente_ativos: bool = False,
) -> list[Barbeiro]:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        if somente_ativos:
            cursor.execute(OBTER_POR_BARBEARIA_ATIVOS, (barbearia_id,))
        else:
            cursor.execute(OBTER_POR_BARBEARIA, (barbearia_id,))
        rows = cursor.fetchall()
        return [_row_to_barbeiro(row) for row in rows]


def obter_por_id(id: int) -> Optional[Barbeiro]:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_ID, (id,))
        row = cursor.fetchone()
        if row:
            return _row_to_barbeiro(row)
        return None


def excluir(id: int) -> bool:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(EXCLUIR, (id,))
        return cursor.rowcount > 0
