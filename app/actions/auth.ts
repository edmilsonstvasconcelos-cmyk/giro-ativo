'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { senhaSchema, validarCPF, validarCNPJ } from '@/lib/validations/auth'

// =====================
// Helpers internos
// =====================

async function getClientIP(): Promise<string | null> {
  const hdrs = await headers()
  return hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
}

async function registrarConsentimentos(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  aceites: { marketing: boolean; analytics: boolean },
  ip: string | null
) {
  const purposes: { purpose: string; granted: boolean }[] = [
    { purpose: 'marketing', granted: aceites.marketing },
    { purpose: 'analytics', granted: aceites.analytics },
    { purpose: 'ia_training', granted: false },  // opt-in explícito futuro
    { purpose: 'geo',         granted: false },
    { purpose: 'parceiros',   granted: false },
  ]

  await adminClient.from('consent_records').insert(
    purposes.map((p) => ({
      user_id: userId,
      purpose: p.purpose,
      granted: p.granted,
      terms_version: 'v1.0',
      ip,
      channel: 'web' as const,
    }))
  )

  await adminClient.from('tos_acceptances').insert({
    user_id: userId,
    version: 'v1.0',
    ip,
    channel: 'web' as const,
  })
}

// =====================
// Cadastro comprador PF
// =====================

export async function registerCompradorPF(formData: FormData) {
  const email    = formData.get('email') as string
  const senha    = formData.get('senha') as string
  const nome     = formData.get('nome') as string
  const cpf      = formData.get('cpf') as string
  const telefone = formData.get('telefone') as string | null
  const marketing = formData.get('marketing') === 'on'
  const analytics = formData.get('analytics') === 'on'

  // Validações
  if (!nome?.trim()) return { error: 'Nome completo é obrigatório.' }
  if (!validarCPF(cpf)) return { error: 'CPF inválido.' }

  const senhaResult = senhaSchema.safeParse(senha)
  if (!senhaResult.success) return { error: senhaResult.error.issues[0].message }

  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: { name: nome },
    },
  })

  if (authError || !authData.user) {
    if (authError?.message?.includes('already registered')) {
      return { error: 'Este e-mail já está em uso.' }
    }
    return { error: 'Erro ao criar conta. Tente novamente.' }
  }

  const userId = authData.user.id
  const admin  = createAdminClient()
  const ip     = await getClientIP()

  // Atualizar profile (trigger já criou com role padrão 'comprador')
  await admin.from('profiles').update({
    role: 'comprador',
    nome,
    cpf: cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
    telefone: telefone || null,
  }).eq('user_id', userId)

  await registrarConsentimentos(admin, userId, { marketing, analytics }, ip)

  redirect('/login?cadastro=ok&tipo=comprador')
}

// =====================
// Cadastro comprador PJ
// =====================

export async function registerCompradorPJ(formData: FormData) {
  const email           = formData.get('email') as string
  const senha           = formData.get('senha') as string
  const cnpj            = formData.get('cnpj') as string
  const razao_social    = formData.get('razao_social') as string
  const nome_fantasia   = formData.get('nome_fantasia') as string | null
  const nome_responsavel = formData.get('nome_responsavel') as string
  const telefone        = formData.get('telefone') as string | null
  const cidade          = formData.get('cidade') as string | null
  const estado          = formData.get('estado') as string | null
  const marketing       = formData.get('marketing') === 'on'
  const analytics       = formData.get('analytics') === 'on'

  if (!validarCNPJ(cnpj)) return { error: 'CNPJ inválido.' }
  if (!razao_social?.trim()) return { error: 'Razão social é obrigatória.' }

  const senhaResult = senhaSchema.safeParse(senha)
  if (!senhaResult.success) return { error: senhaResult.error.issues[0].message }

  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: { name: nome_responsavel },
    },
  })

  if (authError || !authData.user) {
    if (authError?.message?.includes('already registered')) {
      return { error: 'Este e-mail já está em uso.' }
    }
    return { error: 'Erro ao criar conta. Tente novamente.' }
  }

  const userId = authData.user.id
  const admin  = createAdminClient()
  const ip     = await getClientIP()

  await admin.from('profiles').update({
    role: 'comprador',
    nome: nome_responsavel,
    telefone: telefone || null,
  }).eq('user_id', userId)

  const cnpjFormatado = cnpj.replace(/\D/g, '')
    .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')

  await admin.from('companies').insert({
    user_id: userId,
    cnpj: cnpjFormatado,
    razao_social,
    nome_fantasia: nome_fantasia || null,
    telefone: telefone || null,
    cidade: cidade || null,
    estado: estado || null,
    tipo: 'comprador',
  })

  await registrarConsentimentos(admin, userId, { marketing, analytics }, ip)

  redirect('/login?cadastro=ok&tipo=comprador')
}

// =====================
// Cadastro vendedor
// =====================

export async function registerVendedor(formData: FormData) {
  const email            = formData.get('email') as string
  const senha            = formData.get('senha') as string
  const cnpj             = formData.get('cnpj') as string
  const razao_social     = formData.get('razao_social') as string
  const nome_fantasia    = formData.get('nome_fantasia') as string | null
  const nome_responsavel = formData.get('nome_responsavel') as string
  const telefone         = formData.get('telefone') as string | null
  const cidade           = formData.get('cidade') as string | null
  const estado           = formData.get('estado') as string | null
  const plano            = formData.get('plano') as 'basico' | 'pro' | 'enterprise'
  const marketing        = formData.get('marketing') === 'on'
  const analytics        = formData.get('analytics') === 'on'

  if (!validarCNPJ(cnpj)) return { error: 'CNPJ inválido.' }
  if (!razao_social?.trim()) return { error: 'Razão social é obrigatória.' }
  if (!['basico', 'pro', 'enterprise'].includes(plano)) return { error: 'Selecione um plano.' }

  const senhaResult = senhaSchema.safeParse(senha)
  if (!senhaResult.success) return { error: senhaResult.error.issues[0].message }

  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: { name: nome_responsavel },
    },
  })

  if (authError || !authData.user) {
    if (authError?.message?.includes('already registered')) {
      return { error: 'Este e-mail já está em uso.' }
    }
    return { error: 'Erro ao criar conta. Tente novamente.' }
  }

  const userId = authData.user.id
  const admin  = createAdminClient()
  const ip     = await getClientIP()

  await admin.from('profiles').update({
    role: 'vendedor',
    nome: nome_responsavel,
    telefone: telefone || null,
  }).eq('user_id', userId)

  const cnpjFormatado = cnpj.replace(/\D/g, '')
    .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')

  const { data: company } = await admin.from('companies').insert({
    user_id: userId,
    cnpj: cnpjFormatado,
    razao_social,
    nome_fantasia: nome_fantasia || null,
    telefone: telefone || null,
    cidade: cidade || null,
    estado: estado || null,
    tipo: 'vendedor',
  }).select('id').single()

  // Criar assinatura de trial (30 dias) no plano escolhido
  if (company) {
    const { data: planoData } = await admin
      .from('planos')
      .select('id')
      .eq('nome', plano)
      .single()

    if (planoData) {
      await admin.from('assinaturas').insert({
        empresa_id: company.id,
        plano_id: planoData.id,
        status: 'ativa',
        periodo: 'mensal',
        expira_em: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }
  }

  await registrarConsentimentos(admin, userId, { marketing, analytics }, ip)

  redirect('/login?cadastro=ok&tipo=vendedor')
}
