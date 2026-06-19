CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS horario_funcionamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barbearia_id INTEGER NOT NULL,
    dia_semana INTEGER NOT NULL,
    hora_abertura TEXT NOT NULL,
    hora_fechamento TEXT NOT NULL,
    ativo INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (barbearia_id) REFERENCES barbearia(id) ON DELETE CASCADE
)
"""

INSERIR = """
INSERT INTO horario_funcionamento (barbearia_id, dia_semana, hora_abertura, hora_fechamento, ativo)
VALUES (?, ?, ?, ?, ?)
"""

OBTER_POR_BARBEARIA = """
SELECT *
FROM horario_funcionamento
WHERE barbearia_id = ?
ORDER BY dia_semana ASC
"""

# UPSERT por (barbearia_id, dia_semana). Requer índice único para o ON CONFLICT.
CRIAR_INDICE_UNICO = """
CREATE UNIQUE INDEX IF NOT EXISTS idx_horario_barbearia_dia
ON horario_funcionamento (barbearia_id, dia_semana)
"""

UPSERT_DIA = """
INSERT INTO horario_funcionamento (barbearia_id, dia_semana, hora_abertura, hora_fechamento, ativo)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT (barbearia_id, dia_semana)
DO UPDATE SET
    hora_abertura = excluded.hora_abertura,
    hora_fechamento = excluded.hora_fechamento,
    ativo = excluded.ativo
"""

EXCLUIR_POR_BARBEARIA = "DELETE FROM horario_funcionamento WHERE barbearia_id = ?"
