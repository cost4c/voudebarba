// Tipos TypeScript do domínio VouDeBarba.
// Espelham os Response DTOs do backend (backend/dtos/responses/) e os enums
// de domínio. Enums são strings de VALOR (ex: "Cliente", "Agendado"),
// batendo EXATO com backend/util/perfis.py e os EnumEntidade do backend.

// ===== Enums de domínio =====

// Espelha backend/util/perfis.py (Perfil)
export const Perfil = {
  ADMIN: 'Administrador',
  CLIENTE: 'Cliente',
  BARBEARIA: 'Barbearia',
} as const
export type PerfilValor = (typeof Perfil)[keyof typeof Perfil]

// Espelha StatusAgendamento (EnumEntidade) do backend
export const StatusAgendamento = {
  AGENDADO: 'Agendado',
  REALIZADO: 'Realizado',
  CANCELADO: 'Cancelado',
} as const
export type StatusAgendamentoValor = (typeof StatusAgendamento)[keyof typeof StatusAgendamento]

// ===== Comuns =====
export interface MensagemResponse {
  message: string
}
export interface TokenCsrfResponse {
  token: string
}
// Envelope de paginação — espelha backend/dtos/responses/comum.py (PaginaResponse[T])
export interface PaginaResponse<T> {
  items: T[]
  pagina: number
  por_pagina: number
  total: number
  total_paginas: number
}

// ===== Usuário =====
// Espelha o usuário retornado por GET /api/me (backend auth)
export interface Usuario {
  id: number
  nome: string
  email: string
  perfil: string
  foto_url?: string | null
  data_cadastro?: string | null
}

// Espelha backend/dtos/responses/estatisticas_response.py (EstatisticasResponse)
export interface Estatisticas {
  total_usuarios: number
  total_clientes: number
  total_donos_barbearia: number
  total_admins: number
  total_barbearias: number
  total_barbearias_ativas: number
  total_barbeiros: number
  total_servicos: number
  total_agendamentos: number
  agendamentos_agendados: number
  agendamentos_realizados: number
  agendamentos_cancelados: number
}

// Espelha backend/dtos/responses/barbearia_response.py (BarbeariaAdminResponse)
export interface BarbeariaAdmin {
  id: number
  nome: string
  descricao: string
  telefone: string
  endereco_texto: string
  ativa: boolean
  dono_id: number
  dono_nome: string | null
  dono_email: string | null
  total_servicos: number
  total_barbeiros: number
}

// Espelha backend/dtos/responses/estatisticas_response.py (AgendamentoPorDiaResponse)
export interface AgendamentoPorDia {
  data: string // "YYYY-MM-DD"
  total: number
}

// ===== Domínio VouDeBarba =====

// Espelha backend/dtos/responses/servico_response.py (ServicoResponse)
export interface Servico {
  id: number
  nome: string
  descricao: string
  preco: number
  duracao_min: number
  ativo: boolean
}

// Espelha backend/dtos/responses/barbeiro_response.py (BarbeiroResponse)
export interface Barbeiro {
  id: number
  nome: string
  especialidade: string
  foto_url: string | null
  ativo: boolean
}

// Espelha backend/dtos/responses/horario_response.py (HorarioResponse)
export interface Horario {
  dia_semana: number // 0=Dom .. 6=Sab
  ativo: boolean
  hora_abertura: string // "HH:MM"
  hora_fechamento: string // "HH:MM"
}

// Espelha backend/dtos/responses/slot_response.py (SlotResponse)
export interface Slot {
  hora: string // "HH:MM"
  ocupado: boolean
}

// Espelha backend/dtos/responses/barbearia_response.py (BarbeariaResumoResponse)
export interface BarbeariaResumo {
  id: number
  nome: string
  descricao: string
  endereco_texto: string
  telefone: string
  foto_url: string | null
  total_servicos: number
  total_barbeiros: number
}

// Espelha backend/dtos/responses/barbearia_response.py (BarbeariaDetalheResponse)
export interface BarbeariaDetalhe extends BarbeariaResumo {
  media_avaliacoes: number
  total_avaliacoes: number
  servicos: Servico[]
  barbeiros: Barbeiro[]
  horarios: Horario[]
}

// Espelha backend/dtos/responses/agendamento_response.py (AgendamentoResponse)
export interface Agendamento {
  id: number
  barbearia_id: number
  barbearia_nome: string
  cliente_id: number
  cliente_nome: string
  cliente_foto_url: string | null
  barbeiro_id: number
  barbeiro_nome: string
  servico_id: number
  servico_nome: string
  preco: number
  inicio: string // ISO datetime
  fim: string // ISO datetime
  data: string // "YYYY-MM-DD"
  hora: string // "HH:MM"
  status: string // StatusAgendamentoValor
  observacao: string | null
  agendamento_id: number
  nota: number
  comentario: string | null
}

// Espelha backend/dtos/responses/resumo_dia_response.py (ResumoDiaResponse)
export interface ResumoDia {
  data: string
  total: number
  agendados: number
  realizados: number
  cancelados: number
  faturamento: number
}
