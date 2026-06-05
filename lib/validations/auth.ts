import { z } from 'zod'

// =====================
// Senha forte
// =====================

export const senhaSchema = z
  .string()
  .min(8, 'Mínimo de 8 caracteres')
  .regex(/[A-Z]/, 'Pelo menos 1 letra maiúscula')
  .regex(/[0-9]/, 'Pelo menos 1 número')
  .regex(/[^A-Za-z0-9]/, 'Pelo menos 1 caractere especial (!@#$%...)')

export type SenhaRequisito = {
  label: string
  ok: (v: string) => boolean
}

export const senhaRequisitos: SenhaRequisito[] = [
  { label: 'Mínimo 8 caracteres',      ok: (v) => v.length >= 8 },
  { label: '1 letra maiúscula (A-Z)',   ok: (v) => /[A-Z]/.test(v) },
  { label: '1 número (0-9)',            ok: (v) => /[0-9]/.test(v) },
  { label: '1 caractere especial (!@#)', ok: (v) => /[^A-Za-z0-9]/.test(v) },
]

export function calcularForcaSenha(senha: string): 0 | 1 | 2 | 3 | 4 {
  if (!senha) return 0
  const score = senhaRequisitos.filter((r) => r.ok(senha)).length
  return score as 0 | 1 | 2 | 3 | 4
}

// =====================
// CPF
// =====================

function validarDigitoCPF(cpf: string, posicao: number): boolean {
  let soma = 0
  let peso = posicao + 1
  for (let i = 0; i < posicao; i++) {
    soma += parseInt(cpf[i]) * peso--
  }
  const resto = soma % 11
  const digito = resto < 2 ? 0 : 11 - resto
  return digito === parseInt(cpf[posicao])
}

export function validarCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false // todos iguais (ex: 111.111.111-11)
  return validarDigitoCPF(digits, 9) && validarDigitoCPF(digits, 10)
}

export const cpfSchema = z
  .string()
  .min(1, 'CPF obrigatório')
  .refine((v) => validarCPF(v), 'CPF inválido')

// =====================
// CNPJ (validação de dígitos verificadores)
// =====================

export function validarCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return false
  if (/^(\d)\1{13}$/.test(digits)) return false

  const calcDigito = (d: string, pesos: number[]) => {
    const soma = d.split('').reduce((acc, c, i) => acc + parseInt(c) * pesos[i], 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const p2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  return (
    calcDigito(digits.slice(0, 12), p1) === parseInt(digits[12]) &&
    calcDigito(digits.slice(0, 13), p2) === parseInt(digits[13])
  )
}

export const cnpjSchema = z
  .string()
  .min(1, 'CNPJ obrigatório')
  .refine((v) => validarCNPJ(v), 'CNPJ inválido')

// =====================
// Schemas de formulário
// =====================

const baseSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: senhaSchema,
  telefone: z.string().optional(),
})

export const cadastroCompradorPFSchema = baseSchema.extend({
  tipo: z.literal('pf'),
  nome: z.string().min(3, 'Nome completo obrigatório'),
  cpf: cpfSchema,
})

export const cadastroCompradorPJSchema = baseSchema.extend({
  tipo: z.literal('pj'),
  cnpj: cnpjSchema,
  razao_social: z.string().min(3, 'Razão social obrigatória'),
  nome_fantasia: z.string().optional(),
  nome_responsavel: z.string().min(2, 'Nome do responsável obrigatório'),
  cidade: z.string().optional(),
  estado: z.string().optional(),
})

export const cadastroVendedorSchema = baseSchema.extend({
  cnpj: cnpjSchema,
  razao_social: z.string().min(3, 'Razão social obrigatória'),
  nome_fantasia: z.string().optional(),
  nome_responsavel: z.string().min(2, 'Nome do responsável obrigatório'),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  plano: z.enum(['basico', 'pro', 'enterprise']),
  aceite_termos: z.literal(true, { message: 'Aceite os termos para continuar' }),
  consentimento_marketing: z.boolean().default(false),
  consentimento_analytics: z.boolean().default(false),
})

export type CadastroCompradorPF = z.infer<typeof cadastroCompradorPFSchema>
export type CadastroCompradorPJ = z.infer<typeof cadastroCompradorPJSchema>
export type CadastroVendedor    = z.infer<typeof cadastroVendedorSchema>
