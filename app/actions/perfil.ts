'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function atualizarPerfil(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const nome     = (formData.get('nome')     as string)?.trim() || null
  const telefone = (formData.get('telefone') as string)?.trim() || null

  const { error } = await admin
    .from('profiles')
    .update({ nome, telefone })
    .eq('user_id', user.id)

  if (error) return { error: 'Erro ao salvar. Tente novamente.' }

  revalidatePath('/comprador/configuracoes')
  revalidatePath('/comprador')
  return { success: true }
}
