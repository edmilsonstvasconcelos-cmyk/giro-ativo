'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function atualizarEmpresa(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()
  if (!company) return { error: 'Empresa não encontrada' }

  const nome_fantasia = (formData.get('nome_fantasia') as string)?.trim() || null
  const telefone      = (formData.get('telefone')      as string)?.trim() || null
  const cidade        = (formData.get('cidade')        as string)?.trim() || null
  const estado        = (formData.get('estado')        as string)?.trim() || null

  const { error } = await admin
    .from('companies')
    .update({ nome_fantasia, telefone, cidade, estado })
    .eq('id', company.id)

  if (error) return { error: 'Erro ao salvar. Tente novamente.' }

  revalidatePath('/vendedor/configuracoes')
  revalidatePath('/vendedor')
  return { success: true }
}
