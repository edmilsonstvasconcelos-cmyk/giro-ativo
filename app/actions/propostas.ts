'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TAXA_BASICO    = 0.03  // 3%
const TAXA_PRO       = 0.02  // 2%
const TAXA_ENTERPRISE= 0.02  // 2%

async function getTaxa(companyId: string): Promise<number> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('assinaturas')
    .select('planos(nome)')
    .eq('empresa_id', companyId)
    .eq('status', 'ativa')
    .single()
  const plano = (data?.planos as { nome: string } | null)?.nome ?? 'basico'
  if (plano === 'pro' || plano === 'enterprise') return TAXA_PRO
  return TAXA_BASICO
}

export async function criarProposta(formData: FormData) {
  const supabase = await createClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const produtoId     = formData.get('produto_id') as string
  const vendedorId    = formData.get('vendedor_id') as string
  const preco         = Number(formData.get('preco_proposta'))
  const mensagem      = formData.get('mensagem') as string | null
  const conversaId    = formData.get('conversa_id') as string | null

  if (!produtoId || !vendedorId || !preco || preco <= 0) {
    return { error: 'Dados inválidos.' }
  }

  const { data: myCompany } = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()

  if (!myCompany) return { error: 'Complete seu cadastro de empresa primeiro.' }
  if (myCompany.id === vendedorId) return { error: 'Você não pode fazer proposta para si mesmo.' }

  // Verificar se já existe proposta pendente deste comprador para este produto
  const { data: existing } = await supabase
    .from('propostas')
    .select('id')
    .eq('produto_id', produtoId)
    .eq('comprador_id', myCompany.id)
    .eq('status', 'pendente')
    .is('deleted_at', null)
    .single()

  if (existing) return { error: 'Você já tem uma proposta pendente para este produto.' }

  const { error } = await admin.from('propostas').insert({
    produto_id:     produtoId,
    comprador_id:   myCompany.id,
    vendedor_id:    vendedorId,
    conversa_id:    conversaId || null,
    preco_proposta: preco,
    mensagem:       mensagem || null,
  })

  if (error) return { error: 'Erro ao enviar proposta. Tente novamente.' }

  revalidatePath(`/produtos/${produtoId}`)
  return { success: true }
}

export async function aceitarProposta(propostaId: string) {
  const supabase = await createClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: myCompany } = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()
  if (!myCompany) return { error: 'Empresa não encontrada' }

  const { data: proposta } = await supabase
    .from('propostas').select('*').eq('id', propostaId).single()

  if (!proposta) return { error: 'Proposta não encontrada' }
  if (proposta.vendedor_id !== myCompany.id) return { error: 'Não autorizado' }
  if (proposta.status !== 'pendente') return { error: 'Proposta não está mais pendente' }

  const taxa         = await getTaxa(myCompany.id)
  const valorProduto = proposta.preco_proposta as number
  const valorTaxa    = parseFloat((valorProduto * taxa).toFixed(2))
  const valorTotal   = parseFloat((valorProduto + valorTaxa).toFixed(2))

  // Atualizar proposta
  await admin.from('propostas').update({
    status: 'aceita',
    respondida_at: new Date().toISOString(),
  }).eq('id', propostaId)

  // Criar pedido
  const { error: pedidoError } = await admin.from('pedidos').insert({
    proposta_id:          propostaId,
    produto_id:           proposta.produto_id,
    comprador_id:         proposta.comprador_id,
    vendedor_id:          proposta.vendedor_id,
    valor_produto:        valorProduto,
    valor_taxa_plataforma: valorTaxa,
    valor_frete:          0,
    valor_total:          valorTotal,
    status:               'aguardando_pagamento',
  })

  if (pedidoError) return { error: 'Erro ao criar pedido.' }

  revalidatePath('/vendedor/propostas')
  revalidatePath('/vendedor')
  return { success: true, message: 'Proposta aceita! Pedido criado aguardando pagamento.' }
}

export async function recusarProposta(propostaId: string, motivo?: string) {
  const supabase = await createClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: myCompany } = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()
  if (!myCompany) return { error: 'Empresa não encontrada' }

  const { data: proposta } = await supabase
    .from('propostas').select('vendedor_id, status').eq('id', propostaId).single()

  if (!proposta) return { error: 'Proposta não encontrada' }
  if (proposta.vendedor_id !== myCompany.id) return { error: 'Não autorizado' }
  if (proposta.status !== 'pendente') return { error: 'Proposta não está mais pendente' }

  await admin.from('propostas').update({
    status: 'recusada',
    respondida_at: new Date().toISOString(),
    mensagem: motivo ? `[Motivo da recusa]: ${motivo}` : undefined,
  }).eq('id', propostaId)

  revalidatePath('/vendedor/propostas')
  return { success: true }
}

export async function cancelarProposta(propostaId: string) {
  const supabase = await createClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: myCompany } = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()
  if (!myCompany) return { error: 'Empresa não encontrada' }

  const { data: proposta } = await supabase
    .from('propostas').select('comprador_id, status').eq('id', propostaId).single()

  if (!proposta) return { error: 'Proposta não encontrada' }
  if (proposta.comprador_id !== myCompany.id) return { error: 'Não autorizado' }
  if (!['pendente'].includes(proposta.status)) return { error: 'Proposta não pode ser cancelada' }

  await admin.from('propostas').update({
    status: 'cancelada',
    respondida_at: new Date().toISOString(),
  }).eq('id', propostaId)

  revalidatePath('/vendedor/propostas')
  return { success: true }
}
