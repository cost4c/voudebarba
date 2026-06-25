import sqlite3
from typing import Optional

from model.avaliacao_model import Avaliacao
from sql.avaliacao_sql import (
    CRIAR_TABELA,
    INSERIR,
    MEDIA_POR_BARBEARIA,
    OBTER_POR_AGENDAMENTO,
)
from util.db_util import obter_conexao


def _row_to_avaliacao(row: sqlite3.Row) -> Avaliacao:
    return Avaliacao(
        id=row["id"],
        agendamento_id=row["agendamento_id"],
        barbearia_id=row["barbearia_id"],
        nota=row["nota"],
        comentario=row["comentario"],
        criado_em=row["criado_em"],
    )


def criar_tabela() -> bool:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CRIAR_TABELA)
        return True


def inserir(avaliacao: Avaliacao) -> Optional[int]:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(
            INSERIR,
            (
                avaliacao.agendamento_id,
                avaliacao.barbearia_id,
                avaliacao.nota,
                avaliacao.comentario,
            ),
        )
        return cursor.lastrowid


def obter_por_agendamento(agendamento_id: int) -> Optional[Avaliacao]:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_AGENDAMENTO, (agendamento_id,))
        row = cursor.fetchone()
        if row:
            return _row_to_avaliacao(row)
        return None


def media_por_barbearia(barbearia_id: int) -> tuple[float, int]:
    """Retorna (media, total). Sem avaliações, devolve (0.0, 0)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(MEDIA_POR_BARBEARIA, (barbearia_id,))
        row = cursor.fetchone()
        media = row["media"] if row and row["media"] is not None else 0.0
        total = row["total"] if row and row["total"] is not None else 0
        return (round(float(media), 2), int(total))