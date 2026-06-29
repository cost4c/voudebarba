CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS barbearia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dono_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL,
    telefone TEXT NOT NULL,
    endereco_texto TEXT NOT NULL,
    foto_url TEXT,
    ativa INTEGER NOT NULL DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dono_id) REFERENCES usuario(id) ON DELETE CASCADE
)
"""

INSERIR = """
INSERT INTO barbearia (dono_id, nome, descricao, telefone, endereco_texto, foto_url, ativa)
VALUES (?, ?, ?, ?, ?, ?, ?)
"""

ATUALIZAR = """
UPDATE barbearia
SET nome = ?, descricao = ?, telefone = ?, endereco_texto = ?
WHERE id = ?
"""

OBTER_TODOS = """
SELECT b.*,
       (SELECT COUNT(*) FROM servico s WHERE s.barbearia_id = b.id AND s.ativo = 1) AS total_servicos,
       (SELECT COUNT(*) FROM barbeiro br WHERE br.barbearia_id = b.id AND br.ativo = 1) AS total_barbeiros
FROM barbearia b
WHERE b.ativa = 1
  AND (
        ? = ''
        OR LOWER(b.nome) LIKE '%' || LOWER(?) || '%'
        OR LOWER(b.endereco_texto) LIKE '%' || LOWER(?) || '%'
      )
ORDER BY b.nome COLLATE NOCASE ASC
"""

# Filtra por NOME do serviço (o chip envia um id representativo MIN(id) por
# nome via OBTER_SERVICOS_DISTINTOS). Casar por sv.id exato deixaria de fora
# barbearias que oferecem um serviço de MESMO nome porém com outro id. Por isso
# resolvemos o nome do serviço a partir do id recebido e casamos todas as
# barbearias que tenham um serviço ativo com aquele nome (case-insensitive).
OBTER_TODOS_POR_SERVICO = """
SELECT b.*,
       (SELECT COUNT(*) FROM servico s WHERE s.barbearia_id = b.id AND s.ativo = 1) AS total_servicos,
       (SELECT COUNT(*) FROM barbeiro br WHERE br.barbearia_id = b.id AND br.ativo = 1) AS total_barbeiros
FROM barbearia b
WHERE b.ativa = 1
  AND EXISTS (
        SELECT 1
        FROM servico sv
        WHERE sv.barbearia_id = b.id
          AND sv.ativo = 1
          AND LOWER(sv.nome) = (
                SELECT LOWER(nome) FROM servico WHERE id = ?
              )
      )
  AND (
        ? = ''
        OR LOWER(b.nome) LIKE '%' || LOWER(?) || '%'
        OR LOWER(b.endereco_texto) LIKE '%' || LOWER(?) || '%'
      )
ORDER BY b.nome COLLATE NOCASE ASC
"""

OBTER_POR_ID = """
SELECT b.*,
       (SELECT COUNT(*) FROM servico s WHERE s.barbearia_id = b.id AND s.ativo = 1) AS total_servicos,
       (SELECT COUNT(*) FROM barbeiro br WHERE br.barbearia_id = b.id AND br.ativo = 1) AS total_barbeiros
FROM barbearia b
WHERE b.id = ?
"""

OBTER_POR_DONO = """
SELECT b.*,
       (SELECT COUNT(*) FROM servico s WHERE s.barbearia_id = b.id AND s.ativo = 1) AS total_servicos,
       (SELECT COUNT(*) FROM barbeiro br WHERE br.barbearia_id = b.id AND br.ativo = 1) AS total_barbeiros
FROM barbearia b
WHERE b.dono_id = ?
LIMIT 1
"""

EXCLUIR = "DELETE FROM barbearia WHERE id = ?"

# Listagem ADMIN: todas as barbearias (inclusive inativas), com dados do dono.
OBTER_TODOS_ADMIN = """
SELECT b.*,
       u.nome AS dono_nome,
       u.email AS dono_email,
       (SELECT COUNT(*) FROM servico s WHERE s.barbearia_id = b.id AND s.ativo = 1) AS total_servicos,
       (SELECT COUNT(*) FROM barbeiro br WHERE br.barbearia_id = b.id AND br.ativo = 1) AS total_barbeiros
FROM barbearia b
INNER JOIN usuario u ON u.id = b.dono_id
ORDER BY b.ativa DESC, b.nome COLLATE NOCASE ASC
"""

ATUALIZAR_STATUS = "UPDATE barbearia SET ativa = ? WHERE id = ?"
