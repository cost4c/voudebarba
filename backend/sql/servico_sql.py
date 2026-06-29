CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS servico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barbearia_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL,
    preco REAL NOT NULL,
    duracao_min INTEGER NOT NULL,
    ativo INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (barbearia_id) REFERENCES barbearia(id) ON DELETE CASCADE
)
"""

INSERIR = """
INSERT INTO servico (barbearia_id, nome, descricao, preco, duracao_min, ativo)
VALUES (?, ?, ?, ?, ?, ?)
"""

ATUALIZAR = """
UPDATE servico
SET nome = ?, descricao = ?, preco = ?, duracao_min = ?, ativo = ?
WHERE id = ?
"""

OBTER_POR_BARBEARIA = """
SELECT *
FROM servico
WHERE barbearia_id = ?
ORDER BY nome
"""

OBTER_POR_BARBEARIA_ATIVOS = """
SELECT *
FROM servico
WHERE barbearia_id = ? AND ativo = 1
ORDER BY nome
"""

OBTER_POR_ID = """
SELECT *
FROM servico
WHERE id = ?
"""

EXCLUIR = "DELETE FROM servico WHERE id = ?"

OBTER_SERVICOS_DISTINTOS = """
SELECT MIN(id) AS id, 0 AS barbearia_id, nome, '' AS descricao, 0 AS preco, 0 AS duracao_min, 1 AS ativo
FROM servico
WHERE ativo = 1
GROUP BY LOWER(nome)
ORDER BY nome COLLATE NOCASE ASC
"""