'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleFavorito(produtoId: string): Promise<{ error?: string; isFavorited: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', isFavorited: false }

  const { data: existing } = await supabase
    .from('favoritos')
    .select('id')
    .eq('user_id', user.id)
    .eq('produto_id', produtoId)
    .single()

  if (existing) {
    await supabase.from('favoritos').delete().eq('id', existing.id)
    revalidatePath('/comprador/favoritos')
    return { isFavorited: false }
  } else {
    const { error } = await supabase.from('favoritos').insert({ user_id: user.id, produto_id: produtoId })
    if (error) return { error: 'Erro ao salvar favorito', isFavorited: false }
    revalidatePath('/comprador/favoritos')
    return { isFavorited: true }
  }
}
