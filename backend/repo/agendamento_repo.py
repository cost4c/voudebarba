"""Repositório de Agendamentos."""

import sqlite3
from datetime import datetime
from enum import Enum
from typing import Optional, Type, TypeVar

from model.agendamento_model import Agendamento, StatusAgendamento
from sql.agendamento_sql import (
    ATUALIZAR_STATUS,
    CRIAR_TABELA,
    INSERIR,
    OBTER_ATIVOS_DO_BARBEIRO_NO_DIA,
    OBTER_POR_BARBEARIA_E_DIA,
    OBTER_POR_CLIENTE,
    OBTER_POR_ID,
)
from util.db_util import obter_conexao
from util.logger_config import logger

T = TypeVar("T", bound=Enum)


def _converter_enum_seguro(valor: str, tipo_enum: Type[T], padrao: T) -> T:
    """
    Converte string para Enum de forma segura.

    Args:
        valor: Valor string do banco de dados
        tipo_enum: Tipo do Enum (ex: StatusAgendamento)
        padrao: Valor padrão caso conversão falhe

    Returns:
        Valor do Enum ou padrão em caso de erro
    """
    try:
        return tipo_enum(valor)
    except ValueError:
        logger.error(
            f"Valor inválido para {tipo_enum.__name__}: '{valor}'. "
            f"Usando padrão: {padrao.value}"
        )
        return padrao


def _row_to_agendamento(row: sqlite3.Row) -> Agendamento:
    chaves = row.keys()
    barbearia_nome = row["barbearia_nome"] if "barbearia_nome" in chaves else None
    cliente_nome = row["cliente_nome"] if "cliente_nome" in chaves else None
    barbeiro_nome = row["barbeiro_nome"] if "barbeiro_nome" in chaves else None
    servico_nome = row["servico_nome"] if "servico_nome" in chaves else None
    preco = row["preco"] if "preco" in chaves else None

    return Agendamento(
        id=row["id"],
        barbearia_id=row["barbearia_id"],
        cliente_id=row["cliente_id"],
        barbeiro_id=row["barbeiro_id"],
        servico_id=row["servico_id"],
        inicio=row["inicio"],
        fim=row["fim"],
        status=_converter_enum_seguro(
            row["status"], StatusAgendamento, StatusAgendamento.AGENDADO
        ),
        observacao=row["observacao"],
        criado_em=row["criado_em"],
        barbearia_nome=barbearia_nome,
        cliente_nome=cliente_nome,
        barbeiro_nome=barbeiro_nome,
        servico_nome=servico_nome,
        preco=preco,
    )


def criar_tabela() -> bool:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(CRIAR_TABELA)
        return True


def inserir(agendamento: Agendamento) -> Optional[int]:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(
            INSERIR,
            (
                agendamento.barbearia_id,
                agendamento.cliente_id,
                agendamento.barbeiro_id,
                agendamento.servico_id,
                agendamento.inicio,
                agendamento.fim,
                agendamento.status.value,
                agendamento.observacao,
            ),
        )
        return cursor.lastrowid


def obter_por_id(id: int) -> Optional[Agendamento]:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_ID, (id,))
        row = cursor.fetchone()
        if row:
            return _row_to_agendamento(row)
        return None


def obter_por_cliente(cliente_id: int) -> list[Agendamento]:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_CLIENTE, (cliente_id,))
        rows = cursor.fetchall()
        return [_row_to_agendamento(row) for row in rows]


def obter_por_barbearia_e_dia(barbearia_id: int, data_iso: str) -> list[Agendamento]:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_POR_BARBEARIA_E_DIA, (barbearia_id, data_iso))
        rows = cursor.fetchall()
        return [_row_to_agendamento(row) for row in rows]


def obter_ativos_do_barbeiro_no_dia(
    barbeiro_id: int, data_iso: str
) -> list[Agendamento]:
    """
    Retorna os agendamentos ativos (status != Cancelado) de um barbeiro num dia.

    Usado para checar conflito de horário e marcar slots ocupados.
    """
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(OBTER_ATIVOS_DO_BARBEIRO_NO_DIA, (barbeiro_id, data_iso))
        rows = cursor.fetchall()
        return [_row_to_agendamento(row) for row in rows]


def atualizar_status(id: int, status: str) -> bool:
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(ATUALIZAR_STATUS, (status, id))
        return cursor.rowcount > 0


def ha_conflito(
    barbeiro_id: int,
    data_iso: str,
    inicio: datetime,
    fim: datetime,
) -> bool:
    """
    Detecta se há sobreposição do intervalo [inicio, fim) com algum agendamento
    ativo do mesmo barbeiro no dia informado.

    Dois intervalos [a_ini, a_fim) e [b_ini, b_fim) se sobrepõem quando
    a_ini < b_fim e b_ini < a_fim.

    Args:
        barbeiro_id: ID do barbeiro
        data_iso: Data no formato "YYYY-MM-DD" (dia do agendamento)
        inicio: Datetime de início do novo agendamento
        fim: Datetime de fim do novo agendamento

    Returns:
        True se houver conflito, False caso contrário
    """
    ativos = obter_ativos_do_barbeiro_no_dia(barbeiro_id, data_iso)
    for ag in ativos:
        if inicio < ag.fim and ag.inicio < fim:
            return True
    return False
