CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS barbeiro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barbearia_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    especialidade TEXT NOT NULL,
    foto_url TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (barbearia_id) REFERENCES barbearia(id) ON DELETE CASCADE
)
"""

INSERIR = """
INSERT INTO barbeiro (barbearia_id, nome, especialidade, foto_url, ativo)
VALUES (?, ?, ?, ?, ?)
"""

OBTER_POR_BARBEARIA = """
SELECT b.*
FROM barbeiro b
WHERE b.barbearia_id = ?
ORDER BY b.nome
"""

OBTER_POR_BARBEARIA_ATIVOS = """
SELECT b.*
FROM barbeiro b
WHERE b.barbearia_id = ? AND b.ativo = 1
ORDER BY b.nome
"""

OBTER_POR_ID = """
SELECT b.*
FROM barbeiro b
WHERE b.id = ?
"""

EXCLUIR = "DELETE FROM barbeiro WHERE id = ?"

DESATIVAR = "UPDATE barbeiro SET ativo = 0 WHERE id = ?"
