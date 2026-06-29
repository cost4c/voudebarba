"""Repositório de Barbearias e Horários de Funcionamento.

Mantém o CRUD de ``barbearia`` e os helpers de ``horario_funcionamento``.
``criar_tabela()`` cria as duas tabelas na ordem pai -> filho (a tabela de
horários referencia ``barbearia`` por FK), e é registrada UMA única vez em
``main.py`` para o módulo de barbearia.

Os serviços e barbeiros NÃO são carregados aqui em ``obter_por_id`` — essa
junção é feita na camada de rota, combinando ``servico_repo`` e
``barbeiro_repo``. Apenas os horários são carregados junto da barbearia.
"""

import sqlite3
from typing import Optional

from model.barbearia_model import Barbearia, HorarioFuncionamento
from sql.barbearia_sql import (
    CRIAR_TABELA,
    INSERIR,
    ATUALIZAR,
    OBTER_TODOS,
    OBTER_TODOS_POR_SERVICO,
    OBTER_TODOS_ADMIN,
    OBTER_POR_ID,
    OBTER_POR_DONO,
    ATUALIZAR_STATUS,
    EXCLUIR,
)
from sql.horario_funcionamento_sql import (
    CRIAR_TABELA as CRIAR_TABELA_HORARIO,
    CRIAR_INDICE_UNICO as CRIAR_INDICE_UNICO_HORARIO,
    OBTER_POR_BARBEARIA as OBTER_HORARIOS_POR_BARBEARIA,
    UPSERT_DIA as UPSERT_HORARIO_DIA,
)
from util.db_util import obter_conexao
from util.logger_config import logger


def _row_to_horario(row: sqlite3.Row) -> HorarioFuncionamento:
    return HorarioFuncionamento(
        id=row["id"],
        barbearia_id=row["barbearia_id"],
        dia_semana=row["dia_semana"],
        hora_abertura=row["hora_abertura"],
        hora_fechamento=row["hora_fechamento"],
        ativo=bool(row["ativo"]),
    )


def _row_to_barbearia(row: sqlite3.Row) -> Barbearia:
    chaves = row.keys()
    total_servicos = row["total_servicos"] if "total_servicos" in chaves else 0
    total_barbeiros = row["total_barbeiros"] if "total_barbeiros" in chaves else 0
    dono_nome = row["dono_nome"] if "dono_nome" in chaves else None
    dono_email = row["dono_email"] if "dono_email" in chaves else None

    return Barbearia(
        id=row["id"],
        dono_id=row["dono_id"],
        nome=row["nome"],
        descricao=row["descricao"],
        telefone=row["telefone"],
        endereco_texto=row["endereco_texto"],
        foto_url=row["foto_url"],
        ativa=bool(row["ativa"]),
        criado_em=row["criado_em"],
        total_servicos=total_servicos or 0,
        total_barbeiros=total_barbeiros or 0,
        dono_nome=dono_nome,
        dono_email=dono_email,
    )


def criar_tabela() -> bool:
    """Cria a tabela ``barbearia`` e, em seguida, ``horario_funcionamento``.

    A ordem importa: a tabela de horários referencia ``barbearia`` via FK,
    portanto o pai é criado primeiro.
    """
    try:
        with obter_conexao() as conn:
            cursor = conn.cursor()
            cursor.execute(CRIAR_TABELA)
            cursor.execute(CRIAR_TABELA_HORARIO)
            cursor.execute(CRIAR_INDICE_UNICO_HORARIO)
            return True
    except Exception as e:
        logger.error(f"Erro ao criar tabelas de barbearia/horário: {e}")
        return False


def inserir(barbearia: Barbearia) -> Optional[int]:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(
            INSERIR,
            (
                barbearia.dono_id,
                barbearia.nome,
                barbearia.descricao,
                barbearia.telefone,
                barbearia.endereco_texto,
                barbearia.foto_url,
                1 if barbearia.ativa else 0,
            ),
        )
        return cursor.lastrowid


def atualizar(barbearia: Barbearia) -> bool:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(
            ATUALIZAR,
            (
                barbearia.nome,
                barbearia.descricao,
                barbearia.telefone,
                barbearia.endereco_texto,
                barbearia.id,
            ),
        )
        return cursor.rowcount > 0


def obter_todos(q: str = "") -> list[Barbearia]:
    """Lista barbearias ativas, filtrando por nome/endereço quando ``q`` informado."""
    termo = (q or "").strip()
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_TODOS, (termo, termo, termo))
        rows = cursor.fetchall()
        return [_row_to_barbearia(row) for row in rows]

def obter_todos_por_servico(servico_id: int, q: str = "") -> list[Barbearia]:
    """Lista barbearias ativas que oferecem o serviço informado (ativo).

    Mesmo filtro de nome/endereço de ``obter_todos``. O ``servico_id`` é o id
    representativo enviado pelo chip; a query resolve o NOME desse serviço e
    retorna todas as barbearias que oferecem um serviço ativo com aquele nome.
    """
    termo = (q or "").strip()
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_TODOS_POR_SERVICO, (servico_id, termo, termo, termo))
        rows = cursor.fetchall()
        return [_row_to_barbearia(row) for row in rows]

def obter_todos_admin() -> list[Barbearia]:
    """Lista TODAS as barbearias (inclusive inativas), com dados do dono.

    Usada na área administrativa. Não filtra por ``ativa`` e traz dono_nome/email.
    """
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_TODOS_ADMIN)
        rows = cursor.fetchall()
        return [_row_to_barbearia(row) for row in rows]


def atualizar_status(id: int, ativa: bool) -> bool:
    """Ativa/desativa uma barbearia (controle do admin)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(ATUALIZAR_STATUS, (1 if ativa else 0, id))
        return cursor.rowcount > 0


def obter_por_id(id: int) -> Optional[Barbearia]:
    """Obtém a barbearia por id, já carregando seus horários.

    Serviços e barbeiros NÃO são carregados aqui (junção feita na rota).
    """
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_ID, (id,))
        row = cursor.fetchone()
        if not row:
            return None
        barbearia = _row_to_barbearia(row)
        barbearia.horarios = obter_horarios(barbearia.id)
        return barbearia


def obter_por_dono(dono_id: int) -> Optional[Barbearia]:
    """Obtém a barbearia cujo ``dono_id`` é o usuário informado (com horários)."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_DONO, (dono_id,))
        row = cursor.fetchone()
        if not row:
            return None
        barbearia = _row_to_barbearia(row)
        barbearia.horarios = obter_horarios(barbearia.id)
        return barbearia


def excluir(id: int) -> bool:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(EXCLUIR, (id,))
        return cursor.rowcount > 0


# ===== Horários de funcionamento =====


def obter_horarios(barbearia_id: int) -> list[HorarioFuncionamento]:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_HORARIOS_POR_BARBEARIA, (barbearia_id,))
        rows = cursor.fetchall()
        return [_row_to_horario(row) for row in rows]


def upsert_horarios(
    barbearia_id: int, horarios: list[HorarioFuncionamento]
) -> list[HorarioFuncionamento]:
    """Insere ou atualiza os horários (um por dia da semana) da barbearia.

    Usa UPSERT por ``(barbearia_id, dia_semana)`` para que reenvios do mesmo
    dia atualizem em vez de duplicar. Retorna a lista final persistida.
    """
    with obter_conexao() as conn:
        cursor = conn.cursor()
        for h in horarios:
            cursor.execute(
                UPSERT_HORARIO_DIA,
                (
                    barbearia_id,
                    h.dia_semana,
                    h.hora_abertura,
                    h.hora_fechamento,
                    1 if h.ativo else 0,
                ),
            )
    return obter_horarios(barbearia_id)
