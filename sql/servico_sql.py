"""SQL da entidade Serviço."""

CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS servico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""

INSERIR = """
INSERT INTO servico (nome)
VALUES (?)
"""

OBTER_TODOS = """
SELECT * FROM servico
ORDER BY data_criacao DESC
"""

OBTER_POR_ID = """
SELECT * FROM servico
WHERE id = ?
"""

ATUALIZAR = """
UPDATE servico
SET nome = ?,
    data_atualizacao = CURRENT_TIMESTAMP
WHERE id = ?
"""

EXCLUIR = """
DELETE FROM servico
WHERE id = ?
"""
