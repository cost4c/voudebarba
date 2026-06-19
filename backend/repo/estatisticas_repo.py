"""Repositório de estatísticas agregadas para o painel do administrador.

Não possui tabela própria: apenas executa COUNT/GROUP BY sobre as tabelas
existentes. Não é registrado em TABELAS no main.py.
"""

from datetime import timedelta

from util.db_util import obter_conexao
from util.datetime_util import hoje
from util.perfis import Perfil
from model.agendamento_model import StatusAgendamento


def _contar(cursor, sql: str) -> int:
    cursor.execute(sql)
    row = cursor.fetchone()
    return row[0] if row else 0


def obter_agendamentos_por_dia(dias_antes: int = 15, dias_depois: int = 15) -> list[dict]:
    """Série de total de agendamentos por dia (por data de ``inicio``).

    Janela de ``[hoje - dias_antes, hoje + dias_depois]``. Inclui dias sem
    agendamento com total 0 (série contínua para o gráfico). ``date(inicio)``
    usa a data armazenada (UTC); para horário comercial coincide com a data local.
    """
    inicio = hoje() - timedelta(days=dias_antes)
    fim = hoje() + timedelta(days=dias_depois)

    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT date(inicio) AS d, COUNT(*) AS n
            FROM agendamento
            WHERE date(inicio) BETWEEN ? AND ?
            GROUP BY date(inicio)
            """,
            (inicio.isoformat(), fim.isoformat()),
        )
        por_dia = {row["d"]: row["n"] for row in cursor.fetchall()}

    total_dias = dias_antes + dias_depois + 1
    return [
        {
            "data": (d := (inicio + timedelta(days=i)).isoformat()),
            "total": por_dia.get(d, 0),
        }
        for i in range(total_dias)
    ]


def obter_estatisticas() -> dict:
    """Retorna um dicionário com as contagens usadas no dashboard admin."""
    with obter_conexao() as conn:
        cursor = conn.cursor()

        # Usuários por perfil.
        cursor.execute("SELECT perfil, COUNT(*) FROM usuario GROUP BY perfil")
        por_perfil = {perfil: total for perfil, total in cursor.fetchall()}

        total_usuarios = sum(por_perfil.values())

        # Agendamentos por status.
        cursor.execute("SELECT status, COUNT(*) FROM agendamento GROUP BY status")
        por_status = {status: total for status, total in cursor.fetchall()}

        return {
            "total_usuarios": total_usuarios,
            "total_clientes": por_perfil.get(Perfil.CLIENTE.value, 0),
            "total_donos_barbearia": por_perfil.get(Perfil.BARBEARIA.value, 0),
            "total_admins": por_perfil.get(Perfil.ADMIN.value, 0),
            "total_barbearias": _contar(cursor, "SELECT COUNT(*) FROM barbearia"),
            "total_barbearias_ativas": _contar(
                cursor, "SELECT COUNT(*) FROM barbearia WHERE ativa = 1"
            ),
            "total_barbeiros": _contar(cursor, "SELECT COUNT(*) FROM barbeiro"),
            "total_servicos": _contar(cursor, "SELECT COUNT(*) FROM servico"),
            "total_agendamentos": sum(por_status.values()),
            "agendamentos_agendados": por_status.get(
                StatusAgendamento.AGENDADO.value, 0
            ),
            "agendamentos_realizados": por_status.get(
                StatusAgendamento.REALIZADO.value, 0
            ),
            "agendamentos_cancelados": por_status.get(
                StatusAgendamento.CANCELADO.value, 0
            ),
        }
