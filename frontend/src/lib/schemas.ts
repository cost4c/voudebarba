// Schemas Zod do domínio VouDeBarba. Enums importados de types.ts (nunca literais soltos).
import { z } from 'zod'
import { Perfil } from './types'

/** Regras de senha forte (espelham validar_senha_forte do backend). */
export const senhaSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos 1 letra maiúscula')
  .regex(/[a-z]/, 'A senha deve conter pelo menos 1 letra minúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos 1 número')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'A senha deve conter ao menos um caractere especial.')

export const emailSchema = z.string().min(1, 'Informe o e-mail').email('E-mail inválido')

// ===== Auth =====
export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, 'Informe a senha'),
})
export type LoginForm = z.infer<typeof loginSchema>

// Auto-cadastro público: perfil fixo Cliente (aplicado no submit).
export const cadastroSchema = z.object({
  nome: z
    .string()
    .min(4, 'O nome deve ter no mínimo 4 caracteres')
    .max(128, 'O nome deve ter no máximo 128 caracteres')
    .refine((v) => v.trim().split(/\s+/).length >= 2, 'Informe nome e sobrenome.'),
  email: emailSchema,
  senha: senhaSchema,
})
export type CadastroForm = z.infer<typeof cadastroSchema>

/** Perfil enviado no auto-cadastro — sempre Cliente. */
export const PERFIL_CADASTRO = Perfil.CLIENTE

export const esqueciSenhaSchema = z.object({
  email: emailSchema,
})
export type EsqueciSenhaForm = z.infer<typeof esqueciSenhaSchema>

export const redefinirSenhaSchema = z
  .object({
    senha: senhaSchema,
    confirmar_senha: z.string().min(1, 'Confirme a senha'),
  })
  .refine((d) => d.senha === d.confirmar_senha, {
    message: 'As senhas não coincidem',
    path: ['confirmar_senha'],
  })
export type RedefinirSenhaForm = z.infer<typeof redefinirSenhaSchema>

// ===== Admin: usuários =====
const nomeUsuarioSchema = z
  .string()
  .min(4, 'O nome deve ter no mínimo 4 caracteres')
  .max(128, 'O nome deve ter no máximo 128 caracteres')
  .refine((v) => v.trim().split(/\s+/).length >= 2, 'Informe nome e sobrenome.')

const perfilSchema = z.enum([Perfil.ADMIN, Perfil.CLIENTE, Perfil.BARBEARIA], {
  message: 'Escolha um perfil',
})

// Criação (admin): exige senha forte.
export const adminUsuarioCriarSchema = z.object({
  nome: nomeUsuarioSchema,
  email: emailSchema,
  senha: senhaSchema,
  perfil: perfilSchema,
})
export type AdminUsuarioCriarForm = z.infer<typeof adminUsuarioCriarSchema>

// Edição (admin): sem senha (alterada em fluxo próprio).
export const adminUsuarioEditarSchema = z.object({
  nome: nomeUsuarioSchema,
  email: emailSchema,
  perfil: perfilSchema,
})
export type AdminUsuarioEditarForm = z.infer<typeof adminUsuarioEditarSchema>

// ===== Admin: cadastro de barbearia (composto: dono + barbearia) =====
export const criarBarbeariaAdminSchema = z.object({
  dono_nome: nomeUsuarioSchema,
  dono_email: emailSchema,
  dono_senha: senhaSchema,
  nome: z.string().min(2, 'Informe o nome da barbearia').max(120, 'Nome muito longo'),
  descricao: z.string().min(5, 'Descreva a barbearia (mín. 5 caracteres)').max(1000, 'Descrição muito longa'),
  telefone: z.string().min(8, 'Informe o telefone').max(20, 'Telefone muito longo'),
  endereco_texto: z.string().min(5, 'Informe o endereço').max(255, 'Endereço muito longo'),
})
export type CriarBarbeariaAdminForm = z.infer<typeof criarBarbeariaAdminSchema>

// Edição (admin): dados da barbearia + do dono; sem senha (perfil não muda).
export const editarBarbeariaAdminSchema = z.object({
  dono_nome: nomeUsuarioSchema,
  dono_email: emailSchema,
  nome: z.string().min(2, 'Informe o nome da barbearia').max(120, 'Nome muito longo'),
  descricao: z.string().min(5, 'Descreva a barbearia (mín. 5 caracteres)').max(1000, 'Descrição muito longa'),
  telefone: z.string().min(8, 'Informe o telefone').max(20, 'Telefone muito longo'),
  endereco_texto: z.string().min(5, 'Informe o endereço').max(255, 'Endereço muito longo'),
})
export type EditarBarbeariaAdminForm = z.infer<typeof editarBarbeariaAdminSchema>

// ===== Perfil próprio =====
export const perfilEditSchema = z.object({
  nome: nomeUsuarioSchema,
  email: emailSchema,
})
export type PerfilEditForm = z.infer<typeof perfilEditSchema>

export const alterarSenhaSchema = z
  .object({
    senha_atual: z.string().min(1, 'Informe a senha atual'),
    senha_nova: senhaSchema,
    confirmar_senha: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((d) => d.senha_nova === d.confirmar_senha, {
    message: 'As senhas não coincidem',
    path: ['confirmar_senha'],
  })
export type AlterarSenhaForm = z.infer<typeof alterarSenhaSchema>

// ===== Agendamento (cliente) =====
// barbearia_id/barbeiro_id/servico_id resolvidos na página; aqui validam-se
// os campos que o formulário coleta diretamente.
export const agendamentoSchema = z.object({
  barbearia_id: z.number().int().positive(),
  barbeiro_id: z.number({ message: 'Escolha um barbeiro' }).int().positive('Escolha um barbeiro'),
  servico_id: z.number({ message: 'Escolha um serviço' }).int().positive('Escolha um serviço'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Escolha uma data'),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'Escolha um horário'),
  observacao: z.string().max(500, 'Observação muito longa').optional(),
})
export type AgendamentoForm = z.infer<typeof agendamentoSchema>

// ===== Serviço (barbearia) =====
export const servicoSchema = z.object({
  nome: z.string().min(2, 'Informe o nome do serviço').max(80, 'Nome muito longo'),
  descricao: z.string().max(300, 'Descrição muito longa').default(''),
  preco: z.coerce.number({ message: 'Informe o preço' }).positive('O preço deve ser maior que zero'),
  duracao_min: z.coerce
    .number({ message: 'Informe a duração' })
    .int('Duração em minutos inteiros')
    .positive('A duração deve ser maior que zero'),
})
export type ServicoForm = z.infer<typeof servicoSchema>

// ===== Barbeiro (barbearia) =====
export const barbeiroSchema = z.object({
  nome: z
    .string()
    .min(2, 'Informe o nome do barbeiro')
    .max(80, 'Nome muito longo')
    .refine((v) => v.trim().length > 0, 'Informe o nome do barbeiro'),
  especialidade: z.string().max(80, 'Especialidade muito longa').default(''),
})
export type BarbeiroForm = z.infer<typeof barbeiroSchema>

// ===== Edição da barbearia (barbearia) =====
export const barbeariaEditSchema = z.object({
  nome: z.string().min(2, 'Informe o nome da barbearia').max(120, 'Nome muito longo'),
  descricao: z.string().max(500, 'Descrição muito longa').default(''),
  telefone: z.string().max(20, 'Telefone muito longo').default(''),
  endereco_texto: z.string().max(200, 'Endereço muito longo').default(''),
})
export type BarbeariaEditForm = z.infer<typeof barbeariaEditSchema>
