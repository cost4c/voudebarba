CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS avaliacao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agendamento_id INTEGER NOT NULL UNIQUE,
    barbearia_id INTEGER NOT NULL,
    nota INTEGER NOT NULL,
    comentario TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agendamento_id) REFERENCES agendamento(id) ON DELETE CASCADE,
    FOREIGN KEY (barbearia_id) REFERENCES barbearia(id) ON DELETE CASCADE
)
"""

INSERIR = """
INSERT INTO avaliacao (agendamento_id, barbearia_id, nota, comentario)
VALUES (?, ?, ?, ?)
"""

OBTER_POR_AGENDAMENTO = "SELECT * FROM avaliacao WHERE agendamento_id = ?"

# Média das notas de uma barbearia + quantas avaliações existem.
# AVG e COUNT vêm NULL/0 quando não há nenhuma avaliação ainda — tratamos isso no repo.
MEDIA_POR_BARBEARIA = """
SELECT AVG(nota) AS media, COUNT(*) AS total
FROM avaliacao
WHERE barbearia_id = ?
"""