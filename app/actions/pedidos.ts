'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function confirmarRecebimento(pedidoId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()
  if (!company) return { error: 'Empresa não encontrada' }

  const { data: pedido } = await supabase
    .from('pedidos').select('status, comprador_id').eq('id', pedidoId).single()

  if (!pedido) return { error: 'Pedido não encontrado' }
  if (pedido.comprador_id !== company.id) return { error: 'Não autorizado' }
  if (pedido.status !== 'entregue') return { error: 'Pedido não está no status correto' }

  const { error } = await admin.from('pedidos').update({
    status:       'concluido',
    concluido_at: new Date().toISOString(),
  }).eq('id', pedidoId)

  if (error) return { error: 'Erro ao confirmar recebimento.' }

  revalidatePath(`/comprador/pedidos/${pedidoId}`)
  revalidatePath('/comprador/pedidos')
  revalidatePath('/comprador')
  return { success: true }
}
