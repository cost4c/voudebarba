"""Repositório de relatórios da barbearia (sem tabela própria).

Calcula a ocupação de cada barbeiro num dia: minutos ocupados (soma da
duração dos agendamentos Agendado/Realizado) sobre os minutos disponíveis
(expediente da barbearia naquele dia da semana). Não é registrado em
TABELAS no main.py, pois não possui tabela.
"""

from datetime import datetime

from model.agendamento_model import StatusAgendamento
from repo import agendamento_repo, barbeiro_repo
from util.db_util import obter_conexao


# Statuses que contam como "ocupado".
_STATUS_OCUPADO = {
    StatusAgendamento.AGENDADO.value,
    StatusAgendamento.REALIZADO.value,
}


def _to_min(hhmm: str) -> int:
    """Converte "HH:MM" em minutos desde meia-noite."""
    partes = hhmm.split(":")
    return int(partes[0]) * 60 + int(partes[1])


def _dia_semana_da_data(data_iso: str) -> int:
    """Dia da semana (0=Domingo .. 6=Sábado) de uma data "YYYY-MM-DD"."""
    d = datetime.strptime(data_iso, "%Y-%m-%d")
    return (d.weekday() + 1) % 7


def _minutos_disponiveis(barbearia, data_iso: str) -> int:
    """Minutos de expediente da barbearia no dia da semana da data."""
    dia = _dia_semana_da_data(data_iso)
    horario = next(
        (h for h in barbearia.horarios if h.dia_semana == dia and h.ativo),
        None,
    )
    if not horario:
        return 0
    minutos = _to_min(horario.hora_fechamento) - _to_min(horario.hora_abertura)
    return max(minutos, 0)


def obter_ocupacao_por_barbeiro(barbearia, data_iso: str) -> list[dict]:
    """Para cada barbeiro da barbearia, calcula a ocupação no dia.

    Retorna uma lista de dicts com: barbeiro_id, barbeiro_nome,
    minutos_ocupados, minutos_disponiveis e percentual (0..100).
    """
    disponiveis = _minutos_disponiveis(barbearia, data_iso)
    barbeiros = barbeiro_repo.obter_por_barbearia(barbearia.id, somente_ativos=True)

    # Duração de cada serviço (para somar minutos por agendamento).
    duracoes = _duracoes_dos_servicos(barbearia.id)

    resultado: list[dict] = []
    for b in barbeiros:
        ativos = agendamento_repo.obter_ativos_do_barbeiro_no_dia(b.id, data_iso)
        ocupados = 0
        for ag in ativos:
            if ag.status.value in _STATUS_OCUPADO:
                ocupados += duracoes.get(ag.servico_id, 0)

        if disponiveis > 0:
            percentual = round(ocupados / disponiveis * 100)
        else:
            percentual = 0

        resultado.append(
            {
                "barbeiro_id": b.id,
                "barbeiro_nome": b.nome,
                "minutos_ocupados": ocupados,
                "minutos_disponiveis": disponiveis,
                "percentual": percentual,
            }
        )
    return resultado


def _duracoes_dos_servicos(barbearia_id: int) -> dict[int, int]:
    """Mapa servico_id -> duracao_min de todos os serviços da barbearia."""
    with obter_conexao() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, duracao_min FROM servico WHERE barbearia_id = ?",
            (barbearia_id,),
        )
        return {row["id"]: row["duracao_min"] for row in cursor.fetchall()}