CRIAR_TABELA = """
CREATE TABLE IF NOT EXISTS agendamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barbearia_id INTEGER NOT NULL,
    cliente_id INTEGER NOT NULL,
    barbeiro_id INTEGER NOT NULL,
    servico_id INTEGER NOT NULL,
    inicio TIMESTAMP NOT NULL,
    fim TIMESTAMP NOT NULL,
    status TEXT NOT NULL DEFAULT 'Agendado',
    observacao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (barbearia_id) REFERENCES barbearia(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (barbeiro_id) REFERENCES barbeiro(id) ON DELETE CASCADE,
    FOREIGN KEY (servico_id) REFERENCES servico(id) ON DELETE CASCADE
)
"""

INSERIR = """
INSERT INTO agendamento (
    barbearia_id, cliente_id, barbeiro_id, servico_id,
    inicio, fim, status, observacao
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
"""

# Bloco de seleção reutilizado com JOINs trazendo nomes e preço do serviço.
_SELECT_BASE = """
SELECT a.*,
       b.nome AS barbearia_nome,
       u.nome AS cliente_nome,
       bb.nome AS barbeiro_nome,
       s.nome AS servico_nome,
       s.preco AS preco
FROM agendamento a
INNER JOIN barbearia b ON a.barbearia_id = b.id
INNER JOIN usuario u ON a.cliente_id = u.id
INNER JOIN barbeiro bb ON a.barbeiro_id = bb.id
INNER JOIN servico s ON a.servico_id = s.id
"""

OBTER_POR_ID = _SELECT_BASE + """
WHERE a.id = ?
"""

OBTER_POR_CLIENTE = _SELECT_BASE + """
WHERE a.cliente_id = ?
ORDER BY a.inicio DESC
"""

OBTER_POR_BARBEARIA_E_DIA = _SELECT_BASE + """
WHERE a.barbearia_id = ? AND date(a.inicio) = ?
ORDER BY a.inicio
"""

OBTER_ATIVOS_DO_BARBEIRO_NO_DIA = _SELECT_BASE + """
WHERE a.barbeiro_id = ? AND date(a.inicio) = ? AND a.status != 'Cancelado'
ORDER BY a.inicio
"""

ATUALIZAR_STATUS = """
UPDATE agendamento
SET status = ?
WHERE id = ?
"""
